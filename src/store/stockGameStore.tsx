import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  StockGameState,
  GameSettings,
  StockHolding,
  AutoInvestRule,
  PlayMode,
  MonthlyReplaySpeed,
  PerceivedRisk,
  CrisisDecisionAction,
} from '../types/stockGame';
import type { TradeRationale } from '../types/stockNews';
import { executeBuy, executeSell, executeRebalanceToTargetWeights } from '../engine/tradeEngine';
import { advanceSimulationOneYear, calculatePortfolioValue } from '../engine/portfolioEngine';
import { runAutoInvestSimulation, type AutoInvestStepState } from '../engine/autoInvestEngine';
import { evaluateAchievements } from '../features/achievements/achievementEngine';
import { createEncyclopediaEntryForListing, syncEncyclopediaWithState } from '../features/encyclopedia/encyclopediaEngine';
import { buildYearbookEntries } from '../features/yearbook/yearbookEngine';
import { getTradableStocks } from '../engine/universeEngine';
import { executeCrisisDecision, getCrisisEventById } from '../engine/crisisEngine';
import { getMonthlyReplayQuality } from '../engine/monthlyReplayEngine';
import { calculateChapterSummary, isChapterEndYear } from '../features/chapters/chapterEngine';
import { getChapterByYear } from '../features/chapters/chapterDefinitions';

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
  playMode: 'REAL',
  monthlyReplaySpeed: 'NORMAL',
  showRealPurchasingPower: true,
  universeMode: 'CLASSIC_50',
};

const INITIAL_STATE: StockGameState = {
  version: '2.1.0',
  schemaVersion: 4,
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
        { canonicalId: 'KR_005930', weight: 0.25 },
        { canonicalId: 'KR_005380', weight: 0.25 },
        { canonicalId: 'US_AAPL', weight: 0.25 },
        { canonicalId: 'US_XOM', weight: 0.25 },
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
  draftTargetWeights: {},
  processedListingEventIds: [],
  pendingListingEventId: null,
  autoInvestPauseOnListing: true,

  // Risk & Survival System
  playMode: 'REAL',
  monthlyReplaySpeed: 'NORMAL',
  showRealPurchasingPower: true,
  universeMode: 'CLASSIC_50',
  perceivedRiskByYear: {},
  activeCrisisEvent: null,
  crisisDecisionHistory: [],
  selectedRiskMissions: {},
  chapterRiskMissionResults: {},
  retryCount: 0,

  completedChapterIds: [],
  selectedChapterGoals: {},
  annualPredictions: {},
  unlockedAchievementIds: [],
  companyEncyclopedia: {},
  yearbookEntries: [],
  selectedMosaicMode: 'ALL',
  mobileActiveTab: 'MARKET',
  soundCategorySettings: {
    interfaceClicks: true,
    listingNotifications: true,
    chapterCompletion: true,
    warnings: true,
    achievements: true,
    bgm: false,
    haptics: false,
  },
};

export function normalizeDraftTargetWeights(
  weights: Record<string, number>,
  targetSum = 1.0
): Record<string, number> {
  const entries = Object.entries(weights).filter(([_, w]) => w > 0.000001);
  if (entries.length === 0) return {};
  const currentTotal = entries.reduce((sum, [_, w]) => sum + w, 0);
  if (currentTotal <= 0) return {};

  const normalized: Record<string, number> = {};
  let allocatedSum = 0;

  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  sorted.forEach(([cid, w], idx) => {
    if (idx === sorted.length - 1) {
      const remainder = Math.max(0, Math.round((targetSum - allocatedSum) * 1000000) / 1000000);
      if (remainder > 0.000001) {
        normalized[cid] = remainder;
      }
    } else {
      const scaled = Math.round(((w / currentTotal) * targetSum) * 1000000) / 1000000;
      if (scaled > 0.000001) {
        normalized[cid] = scaled;
        allocatedSum += scaled;
      }
    }
  });

  return normalized;
}

type Action =
  | { type: 'START_GAME'; payload: GameSettings }
  | { type: 'START_CAMPAIGN'; payload: { campaignId: string; settings: GameSettings } }
  | { type: 'BUY_STOCK'; payload: { canonicalId: string; amountKRW: number; rationale?: Partial<TradeRationale> } }
  | { type: 'SELL_STOCK'; payload: { canonicalId: string; shares: number; rationale?: Partial<TradeRationale> } }
  | { type: 'REBALANCE'; payload: { targets: { canonicalId: string; weight: number }[] } }
  | { type: 'SET_DRAFT_TARGET_WEIGHT'; payload: { canonicalId: string; weight: number } }
  | { type: 'RESET_DRAFT_TARGET_WEIGHTS' }
  | { type: 'NORMALIZE_DRAFT_TARGET_WEIGHTS' }
  | { type: 'SET_ALL_DRAFT_TARGET_WEIGHTS'; payload: { weights: Record<string, number> } }
  | { type: 'EXECUTE_DRAFT_ALLOCATION' }
  | { type: 'TRIGGER_LISTING_EVENT'; payload: { listingEventId: string } }
  | { type: 'ACKNOWLEDGE_LISTING_EVENT'; payload: { listingEventId: string } }
  | { type: 'SET_AUTO_INVEST_PAUSE_ON_LISTING'; payload: boolean }
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
  | { type: 'RECORD_TRADE_RATIONALE'; payload: TradeRationale }
  | { type: 'SET_CHAPTER_GOAL'; payload: { chapterId: string; goalId: string } }
  | { type: 'COMPLETE_CHAPTER'; payload: { chapterId: string } }
  | { type: 'RECORD_PREDICTION'; payload: import('../types/prediction').AnnualPrediction }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'SET_MOSAIC_FOCUS_MODE'; payload: 'ALL' | 'MY_DESK' | 'ALLOCATION_FOCUS' }
  | { type: 'SET_MOBILE_TAB'; payload: 'MARKET' | 'PORTFOLIO' | 'NEWS' | 'RISK' | 'PROGRESS' }
  | { type: 'UPDATE_SOUND_SETTINGS'; payload: Partial<import('../types/saveSlot').SoundCategorySettings> }
  | { type: 'SET_PLAY_MODE'; payload: PlayMode }
  | { type: 'SET_REPLAY_SPEED'; payload: MonthlyReplaySpeed }
  | { type: 'TOGGLE_REAL_PURCHASING_POWER'; payload?: boolean }
  | { type: 'SET_PERCEIVED_RISK'; payload: { year: number; risk: PerceivedRisk } }
  | { type: 'TRIGGER_CRISIS_EVENT'; payload: { crisisEventId: string } }
  | { type: 'DISMISS_CRISIS_EVENT' }
  | { type: 'EXECUTE_CRISIS_DECISION'; payload: { action: CrisisDecisionAction; options?: { targetCashWeight?: number; customTargetWeights?: { canonicalId: string; weight: number }[]; rationale?: string } } }
  | { type: 'SELECT_RISK_MISSIONS'; payload: { chapterId: string; missionIds: string[] } };

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
        playMode: settings.playMode || 'REAL',
        monthlyReplaySpeed: settings.monthlyReplaySpeed || 'NORMAL',
        showRealPurchasingPower: settings.showRealPurchasingPower ?? true,
        universeMode: settings.universeMode || 'CLASSIC_50',
        currentYear: startYear + 1,
        cashKRW: initialCash,
        holdings: {},
        history: [],
        tradeLogs: [],
        activeAutoInvestRule: null,
        investmentNotes: {},
        tradeRationales: {},
        draftTargetWeights: {},
        processedListingEventIds: [],
        pendingListingEventId: null,
        activeCrisisEvent: null,
        crisisDecisionHistory: [],
        perceivedRiskByYear: {},
        selectedRiskMissions: {},
        chapterRiskMissionResults: {},
        retryCount: 0,
        completedChapterIds: [],
        unlockedAchievementIds: [],
      };
    }

    case 'SET_PLAY_MODE': {
      return {
        ...state,
        playMode: action.payload,
        settings: { ...state.settings, playMode: action.payload },
      };
    }

    case 'SET_REPLAY_SPEED': {
      return {
        ...state,
        monthlyReplaySpeed: action.payload,
        settings: { ...state.settings, monthlyReplaySpeed: action.payload },
      };
    }

    case 'TOGGLE_REAL_PURCHASING_POWER': {
      const nextVal = action.payload !== undefined ? action.payload : !state.showRealPurchasingPower;
      return {
        ...state,
        showRealPurchasingPower: nextVal,
        settings: { ...state.settings, showRealPurchasingPower: nextVal },
      };
    }

    case 'SET_PERCEIVED_RISK': {
      const { year, risk } = action.payload;
      return {
        ...state,
        perceivedRiskByYear: {
          ...(state.perceivedRiskByYear || {}),
          [year]: risk,
        },
      };
    }

    case 'SELECT_RISK_MISSIONS': {
      const { chapterId, missionIds } = action.payload;
      return {
        ...state,
        selectedRiskMissions: {
          ...(state.selectedRiskMissions || {}),
          [chapterId]: missionIds,
        },
      };
    }

    case 'TRIGGER_CRISIS_EVENT': {
      const ev = getCrisisEventById(action.payload.crisisEventId);
      return {
        ...state,
        activeCrisisEvent: ev || null,
      };
    }

    case 'DISMISS_CRISIS_EVENT': {
      return {
        ...state,
        activeCrisisEvent: null,
      };
    }

    case 'EXECUTE_CRISIS_DECISION': {
      if (!state.activeCrisisEvent) return state;
      try {
        const res = executeCrisisDecision(
          state.activeCrisisEvent,
          action.payload.action,
          state,
          action.payload.options
        );

        return {
          ...state,
          cashKRW: res.updatedCash,
          holdings: res.updatedHoldings,
          tradeLogs: [...state.tradeLogs, ...res.tradeLogs],
          crisisDecisionHistory: [...(state.crisisDecisionHistory || []), res.decisionRecord],
          activeCrisisEvent: null,
        };
      } catch (err) {
        console.error('EXECUTE_CRISIS_DECISION failed safely:', err);
        return {
          ...state,
          activeCrisisEvent: null,
        };
      }
    }

    case 'SET_DRAFT_TARGET_WEIGHT': {
      const { canonicalId, weight } = action.payload;
      const currentWeights = { ...(state.draftTargetWeights || {}) };
      if (weight <= 0.000001) {
        delete currentWeights[canonicalId];
        return {
          ...state,
          draftTargetWeights: currentWeights,
        };
      }

      let otherSum = 0;
      for (const [cid, w] of Object.entries(currentWeights)) {
        if (cid !== canonicalId) {
          otherSum += w;
        }
      }

      const maxAllowed = Math.max(0, Math.round((1.0 - otherSum) * 1000000) / 1000000);
      const clampedWeight = Math.min(Math.round(weight * 1000000) / 1000000, maxAllowed);

      if (clampedWeight <= 0.000001) {
        delete currentWeights[canonicalId];
      } else {
        currentWeights[canonicalId] = clampedWeight;
      }

      return {
        ...state,
        draftTargetWeights: currentWeights,
      };
    }

    case 'NORMALIZE_DRAFT_TARGET_WEIGHTS': {
      return {
        ...state,
        draftTargetWeights: normalizeDraftTargetWeights(state.draftTargetWeights || {}, 1.0),
      };
    }

    case 'RESET_DRAFT_TARGET_WEIGHTS': {
      return {
        ...state,
        draftTargetWeights: {},
      };
    }

    case 'SET_ALL_DRAFT_TARGET_WEIGHTS': {
      return {
        ...state,
        draftTargetWeights: action.payload.weights,
      };
    }

    case 'EXECUTE_DRAFT_ALLOCATION': {
      if (state.isGameOver) return state;
      try {
        const targets = Object.entries(state.draftTargetWeights || {}).map(([canonicalId, weight]) => ({
          canonicalId,
          weight,
        }));
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
      } catch (err) {
        console.error('EXECUTE_DRAFT_ALLOCATION failed safely:', err);
        return state;
      }
    }

    case 'TRIGGER_LISTING_EVENT': {
      return {
        ...state,
        pendingListingEventId: action.payload.listingEventId,
      };
    }

    case 'ACKNOWLEDGE_LISTING_EVENT': {
      const id = action.payload.listingEventId;
      return {
        ...state,
        pendingListingEventId: null,
        processedListingEventIds: [...(state.processedListingEventIds || []), id],
      };
    }

    case 'SET_AUTO_INVEST_PAUSE_ON_LISTING': {
      return {
        ...state,
        autoInvestPauseOnListing: action.payload,
      };
    }

    case 'BUY_STOCK': {
      if (state.isGameOver) return state;
      try {
        const { canonicalId, amountKRW, rationale } = action.payload;
        const res = executeBuy(
          canonicalId,
          amountKRW,
          state.cashKRW,
          state.holdings,
          state.currentYear,
          state.settings
        );

        const newRationales = { ...(state.tradeRationales || {}) };
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
      } catch (err) {
        console.error('BUY_STOCK failed safely:', err);
        return state;
      }
    }

    case 'SELL_STOCK': {
      if (state.isGameOver) return state;
      try {
        const { canonicalId, shares, rationale } = action.payload;
        const res = executeSell(
          canonicalId,
          shares,
          state.cashKRW,
          state.holdings,
          state.currentYear,
          state.settings
        );

        const newRationales = { ...(state.tradeRationales || {}) };
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
      } catch (err) {
        console.error('SELL_STOCK failed safely:', err);
        return state;
      }
    }

    case 'REBALANCE': {
      if (state.isGameOver) return state;
      try {
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
      } catch (err) {
        console.error('REBALANCE failed safely:', err);
        return state;
      }
    }

    case 'STEP_ONE_YEAR': {
      if (state.isGameOver) return state;
      try {
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

        // Attach perceived risk, crisis record, and monthly data quality to the performance record
        const record = stepRes.performanceRecord;
        record.perceivedRisk = state.perceivedRiskByYear?.[year];
        record.monthlyReplayQuality = getMonthlyReplayQuality(year, state.holdings);

        const lastCrisis = (state.crisisDecisionHistory || []).find(d => d.year === year);
        if (lastCrisis) {
          record.crisisDecision = lastCrisis;
        }

        // 1. Sync & unlock encyclopedia entries for companies listed up to nextYear
        const tradableUpToNextYear = getTradableStocks({ currentYear: stepRes.nextYear });
        const updatedEncyclopedia = { ...(state.companyEncyclopedia || {}) };
        tradableUpToNextYear.forEach(stk => {
          if (!updatedEncyclopedia[stk.canonicalId]) {
            const listYear = parseInt(stk.firstTradingDate.slice(0, 4), 10) || stepRes.nextYear;
            const entry = createEncyclopediaEntryForListing(stk.canonicalId, listYear);
            if (entry) {
              updatedEncyclopedia[stk.canonicalId] = entry;
            }
          }
        });

        const intermediateState: StockGameState = {
          ...state,
          currentYear: stepRes.nextYear,
          cashKRW: stepRes.updatedCash,
          holdings: stepRes.updatedHoldings,
          history: [...state.history, record],
          isGameOver: stepRes.isGameOver,
          companyEncyclopedia: updatedEncyclopedia,
          investmentNotes: state.investmentNotes || {},
          tradeRationales: state.tradeRationales || {},
          watchlist: state.watchlist || [],
        };

        // 2. Evaluate chapter risk missions if chapter completes this year
        const currentChapter = getChapterByYear(year);
        const updatedMissionResults = { ...(state.chapterRiskMissionResults || {}) };

        if (currentChapter && isChapterEndYear(year, state.settings.endYear)) {
          const chapterSummary = calculateChapterSummary(currentChapter, intermediateState);
          updatedMissionResults[currentChapter.id] = chapterSummary.riskMissionResults;
        }

        // 3. Sync holding states with encyclopedia
        const syncedEncyclopedia = syncEncyclopediaWithState(intermediateState);

        // 4. Evaluate process-oriented achievements
        const newlyUnlockedAchIds = evaluateAchievements(intermediateState);
        const allUnlockedAchIds = Array.from(new Set([...(state.unlockedAchievementIds || []), ...newlyUnlockedAchIds]));

        // 5. Build yearbook entries
        const updatedYearbook = buildYearbookEntries(intermediateState);

        return {
          ...intermediateState,
          companyEncyclopedia: syncedEncyclopedia,
          unlockedAchievementIds: allUnlockedAchIds,
          yearbookEntries: updatedYearbook,
          chapterRiskMissionResults: updatedMissionResults,
        };
      } catch (err) {
        console.error('STEP_ONE_YEAR failed safely:', err);
        return state;
      }
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
        crisisDecisionHistory: state.crisisDecisionHistory,
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
        crisisDecisionHistory: finalAutoState.crisisDecisionHistory || state.crisisDecisionHistory,
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
      // In REAL mode, undo is strictly prohibited
      if (state.playMode === 'REAL') {
        return state;
      }

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
        retryCount: (state.retryCount || 0) + 1,
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

    case 'START_CAMPAIGN': {
      const { campaignId, settings } = action.payload;
      const startYear = settings.startYear;
      const initialCash = settings.initialCashKRW;

      return {
        ...state,
        isGameStarted: true,
        isGameOver: false,
        settings,
        activeCampaignId: campaignId,
        playMode: settings.playMode || 'REAL',
        monthlyReplaySpeed: settings.monthlyReplaySpeed || 'NORMAL',
        showRealPurchasingPower: settings.showRealPurchasingPower ?? true,
        currentYear: startYear + 1,
        cashKRW: initialCash,
        holdings: {},
        history: [],
        tradeLogs: [],
        activeAutoInvestRule: null,
        investmentNotes: {},
        tradeRationales: {},
        draftTargetWeights: {},
        processedListingEventIds: [],
        pendingListingEventId: null,
        activeCrisisEvent: null,
        crisisDecisionHistory: [],
        currentChapterId: undefined,
        completedChapterIds: [],
        selectedChapterGoals: {},
        selectedRiskMissions: {},
        chapterRiskMissionResults: {},
        annualPredictions: {},
        unlockedAchievementIds: [],
        companyEncyclopedia: {},
        yearbookEntries: [],
        retryCount: 0,
      };
    }

    case 'SET_CHAPTER_GOAL': {
      const { chapterId, goalId } = action.payload;
      return {
        ...state,
        selectedChapterGoals: {
          ...(state.selectedChapterGoals || {}),
          [chapterId]: goalId,
        },
      };
    }

    case 'COMPLETE_CHAPTER': {
      const { chapterId } = action.payload;
      const completed = new Set(state.completedChapterIds || []);
      completed.add(chapterId);
      return {
        ...state,
        completedChapterIds: Array.from(completed),
      };
    }

    case 'RECORD_PREDICTION': {
      const pred = action.payload;
      return {
        ...state,
        annualPredictions: {
          ...(state.annualPredictions || {}),
          [pred.year]: pred,
        },
      };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const achId = action.payload;
      const unlocked = new Set(state.unlockedAchievementIds || []);
      unlocked.add(achId);
      return {
        ...state,
        unlockedAchievementIds: Array.from(unlocked),
      };
    }

    case 'SET_MOSAIC_FOCUS_MODE': {
      return {
        ...state,
        selectedMosaicMode: action.payload,
      };
    }

    case 'SET_MOBILE_TAB': {
      return {
        ...state,
        mobileActiveTab: action.payload,
      };
    }

    case 'UPDATE_SOUND_SETTINGS': {
      return {
        ...state,
        soundCategorySettings: {
          ...state.soundCategorySettings,
          ...action.payload,
        },
      };
    }

    case 'SAVE_NOTE': {
      const { canonicalId, note } = action.payload;
      return {
        ...state,
        investmentNotes: {
          ...(state.investmentNotes || {}),
          [canonicalId]: note,
        },
      };
    }

    case 'RECORD_TRADE_RATIONALE': {
      const rationale = action.payload;
      return {
        ...state,
        tradeRationales: {
          ...(state.tradeRationales || {}),
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
  startCampaignGame: (campaignId: string, settings: GameSettings) => void;
  startCampaign: (campaignId: string, settings: GameSettings) => void;
  stepOneYear: () => void;
  undoLastYear: () => void;
  runAutoInvest: (rule: AutoInvestRule, years: 5 | 10 | 'ALL') => void;
  saveAutoInvestRule: (rule: AutoInvestRule) => void;
  deleteAutoInvestRule: (id: string) => void;
  toggleWatchlist: (canonicalId: string) => void;
  saveUserNote: (canonicalId: string, note: string) => void;
  setChapterGoal: (chapterId: string, goalId: string) => void;
  recordPrediction: (pred: import('../types/prediction').AnnualPrediction) => void;
  loadSavedState: (state: StockGameState) => void;
  resetToInitial: () => void;
  resetGame: () => void;
  setPlayMode: (mode: PlayMode) => void;
  setReplaySpeed: (speed: MonthlyReplaySpeed) => void;
  toggleRealPurchasingPower: (val?: boolean) => void;
  setPerceivedRisk: (year: number, risk: PerceivedRisk) => void;
  triggerCrisisEvent: (crisisEventId: string) => void;
  dismissCrisisEvent: () => void;
  executeCrisisDecisionAction: (action: CrisisDecisionAction, options?: { targetCashWeight?: number; customTargetWeights?: { canonicalId: string; weight: number }[]; rationale?: string }) => void;
  selectRiskMissions: (chapterId: string, missionIds: string[]) => void;
}

const StockGameContext = createContext<StockGameContextType | undefined>(undefined);

export const StockGameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_V2);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schemaVersion === 4) {
          return parsed;
        }
      }
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        return {
          ...INITIAL_STATE,
          hasLegacyState: true,
        };
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    try {
      if (state.isGameStarted) {
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
      }
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [state]);

  const startNewGame = (settings: GameSettings) => {
    dispatch({ type: 'START_GAME', payload: settings });
  };

  const startCampaignGame = (campaignId: string, settings: GameSettings) => {
    dispatch({ type: 'START_CAMPAIGN', payload: { campaignId, settings } });
  };

  const stepOneYear = () => {
    dispatch({ type: 'STEP_ONE_YEAR' });
  };

  const undoLastYear = () => {
    dispatch({ type: 'UNDO_YEAR' });
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

  const toggleWatchlist = (canonicalId: string) => {
    dispatch({ type: 'TOGGLE_WATCHLIST', payload: canonicalId });
  };

  const saveUserNote = (canonicalId: string, note: string) => {
    dispatch({ type: 'SAVE_NOTE', payload: { canonicalId, note } });
  };

  const setChapterGoal = (chapterId: string, goalId: string) => {
    dispatch({ type: 'SET_CHAPTER_GOAL', payload: { chapterId, goalId } });
  };

  const recordPrediction = (pred: import('../types/prediction').AnnualPrediction) => {
    dispatch({ type: 'RECORD_PREDICTION', payload: pred });
  };

  const loadSavedState = (savedState: StockGameState) => {
    dispatch({ type: 'LOAD_SAVED_STATE', payload: savedState });
  };

  const resetToInitial = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const setPlayMode = (mode: PlayMode) => {
    dispatch({ type: 'SET_PLAY_MODE', payload: mode });
  };

  const setReplaySpeed = (speed: MonthlyReplaySpeed) => {
    dispatch({ type: 'SET_REPLAY_SPEED', payload: speed });
  };

  const toggleRealPurchasingPower = (val?: boolean) => {
    dispatch({ type: 'TOGGLE_REAL_PURCHASING_POWER', payload: val });
  };

  const setPerceivedRisk = (year: number, risk: PerceivedRisk) => {
    dispatch({ type: 'SET_PERCEIVED_RISK', payload: { year, risk } });
  };

  const triggerCrisisEvent = (crisisEventId: string) => {
    dispatch({ type: 'TRIGGER_CRISIS_EVENT', payload: { crisisEventId } });
  };

  const dismissCrisisEvent = () => {
    dispatch({ type: 'DISMISS_CRISIS_EVENT' });
  };

  const executeCrisisDecisionAction = (
    action: CrisisDecisionAction,
    options?: { targetCashWeight?: number; customTargetWeights?: { canonicalId: string; weight: number }[]; rationale?: string }
  ) => {
    dispatch({ type: 'EXECUTE_CRISIS_DECISION', payload: { action, options } });
  };

  const selectRiskMissions = (chapterId: string, missionIds: string[]) => {
    dispatch({ type: 'SELECT_RISK_MISSIONS', payload: { chapterId, missionIds } });
  };

  return (
    <StockGameContext.Provider
      value={{
        state,
        dispatch,
        startNewGame,
        startCampaignGame,
        startCampaign: startCampaignGame,
        stepOneYear,
        undoLastYear,
        runAutoInvest,
        saveAutoInvestRule,
        deleteAutoInvestRule,
        toggleWatchlist,
        saveUserNote,
        setChapterGoal,
        recordPrediction,
        loadSavedState,
        resetToInitial,
        resetGame: resetToInitial,
        setPlayMode,
        setReplaySpeed,
        toggleRealPurchasingPower,
        setPerceivedRisk,
        triggerCrisisEvent,
        dismissCrisisEvent,
        executeCrisisDecisionAction,
        selectRiskMissions,
      }}
    >
      {children}
    </StockGameContext.Provider>
  );
};

export const useStockGame = () => {
  const context = useContext(StockGameContext);
  if (!context) {
    throw new Error('useStockGame must be used within a StockGameProvider');
  }
  return context;
};
