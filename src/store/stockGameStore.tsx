import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  StockGameState,
  GameSettings,
  StockHolding,
  AutoInvestRule,
} from '../types/stockGame';
import type { TradeRationale } from '../types/stockNews';
import { executeBuy, executeSell, executeRebalanceToTargetWeights } from '../engine/tradeEngine';
import { advanceSimulationOneYear, calculatePortfolioValue } from '../engine/portfolioEngine';
import { runAutoInvestSimulation, type AutoInvestStepState } from '../engine/autoInvestEngine';

const STORAGE_KEY_V2 = 'money_track_stock_game_state_v2';
const LEGACY_STORAGE_KEY = 'money_track_game_state';

const DEFAULT_SETTINGS: GameSettings = {
  nickname: '투자탐험가',
  startYear: 1980,
  endYear: 2025,
  initialCashKRW: 10000000,
  annualContributionKRW: 3000000,
  allowFractionalShares: true,
  feeRate: 0.001,
  fxFeeRate: 0.0,
  includeFxEffect: true,
  primaryBenchmark: 'kospi',
  startMode: 'MANUAL',
};

const INITIAL_STATE: StockGameState = {
  version: '2.0.0',
  isGameStarted: false,
  isGameOver: false,
  settings: DEFAULT_SETTINGS,
  currentYear: 1981,
  cashKRW: 10000000,
  holdings: {},
  history: [],
  tradeLogs: [],
  activeAutoInvestRule: null,
  savedAutoInvestRules: [
    {
      id: 'default_sp500_kospi',
      name: '한·미 대표 우량주 50:50 배분',
      durationYears: 5,
      targetAllocations: [
        { canonicalId: 'KR_005930', weight: 0.25 }, // 삼성전자
        { canonicalId: 'KR_000660', weight: 0.25 }, // SK하이닉스
        { canonicalId: 'US_AAPL', weight: 0.25 },   // 애플
        { canonicalId: 'US_MSFT', weight: 0.25 },   // 마이크로소프트
      ],
      annualContributionKRW: 3000000,
      rebalanceMode: 'ANNUAL',
      preIpoMode: 'PRO_RATA_ACTIVE',
    },
    {
      id: 'tech_momentum',
      name: '글로벌 AI/빅테크 모멘텀 룰',
      durationYears: 10,
      targetAllocations: [],
      annualContributionKRW: 3000000,
      rebalanceMode: 'ANNUAL',
      preIpoMode: 'PRO_RATA_ACTIVE',
      advancedFilter: 'TOP_1YR_MOMENTUM',
    },
  ],
  hasLegacyState: false,
  watchlist: ['KR_005930', 'US_AAPL'],
  investmentNotes: {},
  tradeRationales: {},
};

type Action =
  | { type: 'START_GAME'; payload: GameSettings }
  | { type: 'BUY_STOCK'; payload: { canonicalId: string; amountKRW: number; rationale?: Partial<TradeRationale> } }
  | { type: 'SELL_STOCK'; payload: { canonicalId: string; shares: number; rationale?: Partial<TradeRationale> } }
  | { type: 'REBALANCE'; payload: { targets: { canonicalId: string; weight: number }[] } }
  | { type: 'STEP_ONE_YEAR' }
  | { type: 'RUN_AUTO_INVEST'; payload: { rule: AutoInvestRule; years: 5 | 10 | 'ALL' } }
  | { type: 'SET_ACTIVE_AUTO_INVEST_RULE'; payload: AutoInvestRule | null }
  | { type: 'SAVE_AUTO_INVEST_RULE'; payload: AutoInvestRule }
  | { type: 'DELETE_AUTO_INVEST_RULE'; payload: string }
  | { type: 'UNDO_YEAR' }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_SAVED_STATE'; payload: StockGameState }
  | { type: 'TOGGLE_WATCHLIST'; payload: string }
  | { type: 'SAVE_NOTE'; payload: { canonicalId: string; note: string } }
  | { type: 'RECORD_TRADE_RATIONALE'; payload: TradeRationale };

function gameReducer(state: StockGameState, action: Action): StockGameState {
  switch (action.type) {
    case 'START_GAME': {
      const settings = action.payload;
      const startYear = settings.startYear;
      const initialCash = settings.initialCashKRW;

      return {
        ...state,
        isGameStarted: true,
        isGameOver: false,
        settings,
        currentYear: startYear + 1,
        cashKRW: initialCash,
        holdings: {},
        history: [],
        tradeLogs: [],
        activeAutoInvestRule: null,
        investmentNotes: {},
        tradeRationales: {},
      };
    }

    case 'BUY_STOCK': {
      if (state.isGameOver) return state;
      const { canonicalId, amountKRW, rationale } = action.payload;
      const res = executeBuy(
        canonicalId,
        amountKRW,
        state.cashKRW,
        state.holdings,
        state.currentYear,
        state.settings
      );

      const newRationales = { ...state.tradeRationales };
      if (rationale && res.tradeLogs.length > 0) {
        const lastLog = res.tradeLogs[res.tradeLogs.length - 1];
        const tradeId = `TRADE_${lastLog.timestamp}_${canonicalId}`;
        const fullRationale: TradeRationale = {
          tradeId,
          canonicalCompanyId: canonicalId,
          decisionYear: state.currentYear,
          decisionDate: `${state.currentYear - 1}-12-31`,
          linkedNewsIds: rationale.linkedNewsIds || [],
          thesis: rationale.thesis || '직접 투자 판단',
          expectedOpportunity: rationale.expectedOpportunity,
          expectedRisk: rationale.expectedRisk,
          targetHoldingPeriod: rationale.targetHoldingPeriod,
          exitCondition: rationale.exitCondition,
          timestamp: lastLog.timestamp,
        };
        newRationales[tradeId] = fullRationale;
        lastLog.rationaleId = tradeId;
        lastLog.linkedNewsIds = fullRationale.linkedNewsIds;
        lastLog.thesis = fullRationale.thesis;
      }

      return {
        ...state,
        cashKRW: res.updatedCash,
        holdings: res.updatedHoldings,
        tradeLogs: [...state.tradeLogs, ...res.tradeLogs],
        tradeRationales: newRationales,
      };
    }

    case 'SELL_STOCK': {
      if (state.isGameOver) return state;
      const { canonicalId, shares, rationale } = action.payload;
      const res = executeSell(
        canonicalId,
        shares,
        state.cashKRW,
        state.holdings,
        state.currentYear,
        state.settings
      );

      const newRationales = { ...state.tradeRationales };
      if (rationale && res.tradeLogs.length > 0) {
        const lastLog = res.tradeLogs[res.tradeLogs.length - 1];
        const tradeId = `TRADE_${lastLog.timestamp}_${canonicalId}`;
        const fullRationale: TradeRationale = {
          tradeId,
          canonicalCompanyId: canonicalId,
          decisionYear: state.currentYear,
          decisionDate: `${state.currentYear - 1}-12-31`,
          linkedNewsIds: rationale.linkedNewsIds || [],
          thesis: rationale.thesis || '매도 결정',
          expectedOpportunity: rationale.expectedOpportunity,
          expectedRisk: rationale.expectedRisk,
          targetHoldingPeriod: rationale.targetHoldingPeriod,
          exitCondition: rationale.exitCondition,
          timestamp: lastLog.timestamp,
        };
        newRationales[tradeId] = fullRationale;
        lastLog.rationaleId = tradeId;
        lastLog.linkedNewsIds = fullRationale.linkedNewsIds;
        lastLog.thesis = fullRationale.thesis;
      }

      return {
        ...state,
        cashKRW: res.updatedCash,
        holdings: res.updatedHoldings,
        tradeLogs: [...state.tradeLogs, ...res.tradeLogs],
        tradeRationales: newRationales,
      };
    }

    case 'REBALANCE': {
      if (state.isGameOver) return state;
      const { targets } = action.payload;
      const res = executeRebalanceToTargetWeights(
        targets,
        state.cashKRW,
        state.holdings,
        state.currentYear,
        state.settings
      );

      return {
        ...state,
        cashKRW: res.updatedCash,
        holdings: res.updatedHoldings,
        tradeLogs: [...state.tradeLogs, ...res.tradeLogs],
      };
    }

    case 'STEP_ONE_YEAR': {
      if (state.isGameOver) return state;
      const year = state.currentYear;
      const isFirstSimYear = year === state.settings.startYear + 1;
      const deposit = isFirstSimYear ? 0 : state.settings.annualContributionKRW;
      const updatedCashBeforeTrade = state.cashKRW + deposit;

      const priorYear = year - 1;
      const startAssets = calculatePortfolioValue(state.cashKRW, state.holdings, priorYear);

      const stepRes = advanceSimulationOneYear(
        year,
        updatedCashBeforeTrade,
        state.holdings,
        startAssets,
        deposit,
        0,
        state.history,
        state.settings
      );

      return {
        ...state,
        currentYear: stepRes.nextYear,
        cashKRW: stepRes.updatedCash,
        holdings: stepRes.updatedHoldings,
        history: [...state.history, stepRes.performanceRecord],
        isGameOver: stepRes.isGameOver,
      };
    }

    case 'RUN_AUTO_INVEST': {
      if (state.isGameOver) return state;
      const { rule, years } = action.payload;
      let yearsToRun = 0;
      if (years === 'ALL') {
        yearsToRun = state.settings.endYear - state.currentYear + 1;
      } else {
        yearsToRun = Math.min(years, state.settings.endYear - state.currentYear + 1);
      }

      if (yearsToRun <= 0) return state;

      const autoInvestInitialState: AutoInvestStepState = {
        currentYear: state.currentYear,
        cashKRW: state.cashKRW,
        holdings: state.holdings,
        history: state.history,
        tradeLogs: state.tradeLogs,
        isGameOver: state.isGameOver,
      };

      const finalAutoState = runAutoInvestSimulation(
        autoInvestInitialState,
        rule,
        state.settings,
        yearsToRun
      );

      return {
        ...state,
        currentYear: finalAutoState.currentYear,
        cashKRW: finalAutoState.cashKRW,
        holdings: finalAutoState.holdings,
        history: finalAutoState.history,
        tradeLogs: finalAutoState.tradeLogs,
        isGameOver: finalAutoState.isGameOver,
        activeAutoInvestRule: rule,
      };
    }

    case 'SET_ACTIVE_AUTO_INVEST_RULE': {
      return {
        ...state,
        activeAutoInvestRule: action.payload,
      };
    }

    case 'SAVE_AUTO_INVEST_RULE': {
      const existing = state.savedAutoInvestRules.filter(r => r.id !== action.payload.id);
      return {
        ...state,
        savedAutoInvestRules: [...existing, action.payload],
      };
    }

    case 'DELETE_AUTO_INVEST_RULE': {
      return {
        ...state,
        savedAutoInvestRules: state.savedAutoInvestRules.filter(r => r.id !== action.payload),
      };
    }

    case 'UNDO_YEAR': {
      if (state.history.length === 0) return state;
      const newHistory = [...state.history];
      const popped = newHistory.pop();
      if (!popped) return state;

      const prevYear = popped.year;
      const logsToKeep = state.tradeLogs.filter(l => l.year < prevYear);

      const prevHoldings: Record<string, StockHolding> = {};
      popped.holdingsSnapshot.forEach(item => {
        prevHoldings[item.canonicalId] = {
          canonicalId: item.canonicalId,
          shares: item.shares,
          currentValueKRW: item.valueKRW,
          currentWeight: item.weight,
          totalInvestedKRW: item.valueKRW,
          averageCostKRW: item.shares > 0 ? item.valueKRW / item.shares : 0,
          unrealizedPnlKRW: 0,
          unrealizedPnlPercent: 0,
        };
      });

      return {
        ...state,
        currentYear: prevYear,
        history: newHistory,
        cashKRW: popped.cashKRW,
        holdings: prevHoldings,
        tradeLogs: logsToKeep,
        isGameOver: false,
      };
    }

    case 'RESET_GAME': {
      return {
        ...INITIAL_STATE,
        savedAutoInvestRules: state.savedAutoInvestRules,
        watchlist: state.watchlist,
        hasLegacyState: false,
      };
    }

    case 'LOAD_SAVED_STATE': {
      return {
        ...action.payload,
        watchlist: action.payload.watchlist || ['KR_005930', 'US_AAPL'],
        investmentNotes: action.payload.investmentNotes || {},
        tradeRationales: action.payload.tradeRationales || {},
      };
    }

    case 'TOGGLE_WATCHLIST': {
      const cid = action.payload;
      const exists = state.watchlist.includes(cid);
      const newWatchlist = exists
        ? state.watchlist.filter(id => id !== cid)
        : [...state.watchlist, cid];
      return {
        ...state,
        watchlist: newWatchlist,
      };
    }

    case 'SAVE_NOTE': {
      const { canonicalId, note } = action.payload;
      return {
        ...state,
        investmentNotes: {
          ...state.investmentNotes,
          [canonicalId]: note,
        },
      };
    }

    case 'RECORD_TRADE_RATIONALE': {
      const rationale = action.payload;
      return {
        ...state,
        tradeRationales: {
          ...state.tradeRationales,
          [rationale.tradeId]: rationale,
        },
      };
    }

    default:
      return state;
  }
}

interface StockGameContextType {
  state: StockGameState;
  dispatch: React.Dispatch<Action>;
  startNewGame: (settings: GameSettings) => void;
  buyStock: (canonicalId: string, amountKRW: number, rationale?: Partial<TradeRationale>) => void;
  sellStock: (canonicalId: string, shares: number, rationale?: Partial<TradeRationale>) => void;
  stepOneYear: () => void;
  runAutoInvest: (rule: AutoInvestRule, years: 5 | 10 | 'ALL') => void;
  saveAutoInvestRule: (rule: AutoInvestRule) => void;
  deleteAutoInvestRule: (id: string) => void;
  undoYear: () => void;
  resetGame: () => void;
}

const StockGameContext = createContext<StockGameContextType | undefined>(undefined);

export function StockGameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, initial => {
    try {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      const hasLegacy = !!legacyRaw;

      const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
      if (savedV2) {
        const parsed = JSON.parse(savedV2) as StockGameState;
        if (parsed.version === '2.0.0') {
          return {
            ...parsed,
            watchlist: parsed.watchlist || ['KR_005930', 'US_AAPL'],
            investmentNotes: parsed.investmentNotes || {},
            tradeRationales: parsed.tradeRationales || {},
            hasLegacyState: hasLegacy,
          };
        }
      }

      return {
        ...initial,
        hasLegacyState: hasLegacy,
      };
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save stock game state to localStorage:', e);
    }
  }, [state]);

  const startNewGame = (settings: GameSettings) => {
    dispatch({ type: 'START_GAME', payload: settings });
  };

  const buyStock = (
    canonicalId: string,
    amountKRW: number,
    rationale?: Partial<TradeRationale>
  ) => {
    dispatch({ type: 'BUY_STOCK', payload: { canonicalId, amountKRW, rationale } });
  };

  const sellStock = (
    canonicalId: string,
    shares: number,
    rationale?: Partial<TradeRationale>
  ) => {
    dispatch({ type: 'SELL_STOCK', payload: { canonicalId, shares, rationale } });
  };

  const stepOneYear = () => {
    dispatch({ type: 'STEP_ONE_YEAR' });
  };

  const runAutoInvest = (rule: AutoInvestRule, years: 5 | 10 | 'ALL') => {
    dispatch({ type: 'RUN_AUTO_INVEST', payload: { rule, years } });
  };

  const saveAutoInvestRule = (rule: AutoInvestRule) => {
    dispatch({ type: 'SAVE_AUTO_INVEST_RULE', payload: rule });
  };

  const deleteAutoInvestRule = (id: string) => {
    dispatch({ type: 'DELETE_AUTO_INVEST_RULE', payload: id });
  };

  const undoYear = () => {
    dispatch({ type: 'UNDO_YEAR' });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <StockGameContext.Provider
      value={{
        state,
        dispatch,
        startNewGame,
        buyStock,
        sellStock,
        stepOneYear,
        runAutoInvest,
        saveAutoInvestRule,
        deleteAutoInvestRule,
        undoYear,
        resetGame,
      }}
    >
      {children}
    </StockGameContext.Provider>
  );
}

export function useStockGame() {
  const context = useContext(StockGameContext);
  if (!context) {
    throw new Error('useStockGame must be used within a StockGameProvider');
  }
  return context;
}
