import React, { useState, useMemo, useEffect } from 'react';
import {
  Newspaper,
  Globe,
  Scale,
  Sparkles,
  Award,
  BookOpen,
  Eye,
  FolderOpen,
  ShieldAlert,
  TrendingDown,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { useStockGame } from '../store/stockGameStore';
import { formatKRW, formatPercent, getReturnColor } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';
import { YearEndBriefingModal } from '../components/YearEndBriefingModal';
import { AutoInvestModal } from '../components/AutoInvestModal';
import { CompanyDetailModal } from '../components/CompanyDetailModal';
import { HistoricalNewsCenterModal } from '../components/HistoricalNewsCenterModal';
import { NeutralNewsAnalysisModal } from '../components/NeutralNewsAnalysisModal';
import { GlossaryModal } from '../components/GlossaryModal';
import { StockMosaicView } from '../components/StockMosaicView';
import { OrderReviewModal } from '../components/OrderReviewModal';
import { CrisisDecisionModal } from '../components/CrisisDecisionModal';
import { RiskDashboardView } from '../components/RiskDashboardView';

// Live Market Replay System
import { MarketReplayStage } from '../features/marketReplay/MarketReplayStage';
import { generateYearReplayData, recalculateRemainingMonths } from '../features/marketReplay/monthlyPortfolioEngine';
import type { YearReplayData } from '../features/marketReplay/marketReplayTypes';

// Enhanced Game Features
import { ChapterIntroModal } from '../features/chapters/ChapterIntroModal';
import { ChapterSummaryModal } from '../features/chapters/ChapterSummaryModal';
import { getChapterByYear } from '../features/chapters/chapterDefinitions';
import { isChapterStartYear, isChapterEndYear, calculateChapterSummary } from '../features/chapters/chapterEngine';
import { PredictionModal } from '../features/predictions/PredictionModal';
import { CompanyEncyclopediaModal } from '../features/encyclopedia/CompanyEncyclopediaModal';
import { InvestmentYearbookModal } from '../features/yearbook/InvestmentYearbookModal';
import { selectYearbookHighlights } from '../features/yearbook/yearbookEngine';
import { AchievementGalleryModal } from '../features/achievements/AchievementGalleryModal';
import { SaveSlotManagerModal } from '../features/saveSlots/SaveSlotManagerModal';
import { FixedActionBar } from '../features/gameplay/FixedActionBar';

import { calculatePortfolioValue } from '../engine/portfolioEngine';
import { calculatePureInvestmentPnL, calculateRiskLevel } from '../engine/metricsEngine';
import { getMacroNewsForYear, getDecisionCutoffDisplayInfo } from '../engine/newsEngine';
import { getTradableStocks } from '../engine/universeEngine';
import { executeCrisisDecision } from '../engine/crisisEngine';
import { STOCKS_BY_ID } from '../engine/returnEngine';
import type { HistoricalNewsItem } from '../types/stockNews';
import type { ChapterSummaryData } from '../types/chapter';
import type { CrisisDecisionAction } from '../types/stockGame';

interface GamePageProps {
  onNavigate: (page: string) => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onNavigate }) => {
  const {
    state,
    dispatch,
    stepOneYear,
    runAutoInvest,
    saveAutoInvestRule,
    deleteAutoInvestRule,
    recordPrediction,
    loadSavedState,
    setPerceivedRisk,
    executeCrisisDecisionAction,
  } = useStockGame();

  const {
    settings,
    currentYear,
    cashKRW,
    holdings,
    history,
    isGameOver,
    watchlist = [],
    draftTargetWeights = {},
    unlockedAchievementIds = [],
    companyEncyclopedia = {},
    yearbookEntries = [],
    annualPredictions = {},
    playMode = 'REAL',
    monthlyReplaySpeed = 'NORMAL',
    perceivedRiskByYear = {},
    activeCrisisEvent,
  } = state;

  const priorYear = currentYear - 1;
  const cutoffInfo = getDecisionCutoffDisplayInfo(currentYear);

  // Modals & Active Selections
  const [selectedCanonicalIdForDetail, setSelectedCanonicalIdForDetail] = useState<string | null>(null);
  const [initialDetailTab, setInitialDetailTab] = useState<'OVERVIEW' | 'NEWS' | 'LISTING' | 'FILINGS' | 'PRICES' | 'ALLOCATION' | 'NOTES'>('OVERVIEW');
  const [showNewsCenterModal, setShowNewsCenterModal] = useState<boolean>(false);
  const [selectedNewsForAnalysis, setSelectedNewsForAnalysis] = useState<HistoricalNewsItem | null>(null);
  const [showAutoInvestModal, setShowAutoInvestModal] = useState<boolean>(
    settings.startMode === 'AUTO_RULE' && history.length === 0
  );
  const [showGlossaryModal, setShowGlossaryModal] = useState<boolean>(false);
  const [showYearEndModal, setShowYearEndModal] = useState<boolean>(false);
  const [showOrderReviewModal, setShowOrderReviewModal] = useState<boolean>(false);
  const [showRealLockConfirmModal, setShowRealLockConfirmModal] = useState<boolean>(false);

  // Live Market Replay Stage State
  const [showReplayStage, setShowReplayStage] = useState<boolean>(false);
  const [activeYearReplayData, setActiveYearReplayData] = useState<YearReplayData | null>(null);

  // Phase 2 & 3 Modals
  const [showChapterIntroModal, setShowChapterIntroModal] = useState<boolean>(false);
  const [chapterSummaryData, setChapterSummaryData] = useState<ChapterSummaryData | null>(null);
  const [showPredictionModal, setShowPredictionModal] = useState<boolean>(false);
  const [showEncyclopediaModal, setShowEncyclopediaModal] = useState<boolean>(false);
  const [showYearbookModal, setShowYearbookModal] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [showSaveSlotModal, setShowSaveSlotModal] = useState<boolean>(false);

  // Main Tab: 'MARKET' | 'PORTFOLIO' | 'NEWS' | 'RISK' | 'PROGRESS'
  const [activeTab, setActiveTab] = useState<'MARKET' | 'PORTFOLIO' | 'NEWS' | 'RISK' | 'PROGRESS'>('MARKET');

  // Check for chapter start
  const currentChapter = getChapterByYear(currentYear);
  useEffect(() => {
    if (
      currentChapter &&
      isChapterStartYear(currentYear, settings.startYear) &&
      !state.completedChapterIds?.includes(currentChapter.id) &&
      history.length === (currentChapter.startYear - settings.startYear)
    ) {
      setShowChapterIntroModal(true);
    }
  }, [currentYear, currentChapter, state.completedChapterIds, history.length, settings.startYear]);

  // Navigate to results if game over
  useEffect(() => {
    if (isGameOver) {
      onNavigate('result');
    }
  }, [isGameOver, onNavigate]);

  // Calculate current portfolio values
  const currentAssets = calculatePortfolioValue(cashKRW, holdings, priorYear);
  const initialCashKRW = settings.initialCashKRW || 10000000;
  const isFirstSimulationYear = currentYear === settings.startYear + 1;
  const totalInvestedPrincipal = initialCashKRW + (isFirstSimulationYear ? 0 : history.length * (settings.annualContributionKRW || 0));

  const purePnL = calculatePureInvestmentPnL(
    currentAssets,
    initialCashKRW,
    isFirstSimulationYear ? 0 : history.length * (settings.annualContributionKRW || 0)
  );

  // Peak and Drawdown
  let runningPeak = currentAssets;
  history.forEach(h => {
    if (h.endTotalAssetsKRW > runningPeak) runningPeak = h.endTotalAssetsKRW;
  });
  const liveDrawdown = runningPeak > 0 ? (currentAssets - runningPeak) / runningPeak : 0;
  const liveRiskLevel = calculateRiskLevel(liveDrawdown);

  // Tradable Stocks
  const tradableStocks = useMemo(() => {
    return getTradableStocks({
      currentYear,
      watchlist,
      holdings,
    });
  }, [currentYear, watchlist, holdings]);

  // Macro news for currentYear
  const macroNewsList = useMemo(() => {
    return getMacroNewsForYear(currentYear).slice(0, 6);
  }, [currentYear]);

  // Draft Target Weights Calculation
  const totalStockTarget = Object.values(draftTargetWeights).reduce((sum, w) => sum + w, 0);
  const draftCashTargetWeight = Math.max(0, 1.0 - totalStockTarget);
  const changedStocksCount = Object.values(draftTargetWeights).filter(w => w > 0.0001).length;

  // Single stock concentration check
  const maxDraftStock = useMemo(() => {
    let maxCid = '';
    let maxW = 0;
    for (const [cid, w] of Object.entries(draftTargetWeights)) {
      if (w > maxW) {
        maxW = w;
        maxCid = cid;
      }
    }
    const s = STOCKS_BY_ID[maxCid];
    return { cid: maxCid, nameKo: s ? s.nameKo : maxCid, weight: maxW };
  }, [draftTargetWeights]);

  // Handle Advance Simulation (with Live Market Replay)
  const handleInitiateAdvance = () => {
    if (totalStockTarget > 1.0001) {
      dispatch({ type: 'NORMALIZE_DRAFT_TARGET_WEIGHTS' });
    }

    if (playMode === 'REAL') {
      setShowRealLockConfirmModal(true);
    } else {
      executeAdvanceWorkflow();
    }
  };

  const executeAdvanceWorkflow = () => {
    setShowRealLockConfirmModal(false);
    audioManager.playSound('click');

    // First commit draft allocation
    if (changedStocksCount > 0) {
      dispatch({ type: 'EXECUTE_DRAFT_ALLOCATION' });
    }

    const deposit = currentYear === settings.startYear + 1 ? 0 : settings.annualContributionKRW;
    const cashBefore = cashKRW + deposit;

    // Generate 12-Month Live Market Replay Data
    const replayData = generateYearReplayData(
      currentYear,
      cashBefore,
      holdings,
      currentAssets,
      totalInvestedPrincipal,
      runningPeak,
      settings,
      history.length
    );

    setActiveYearReplayData(replayData);

    if (monthlyReplaySpeed === 'INSTANT' || replayData.quality === 'ANNUAL_ONLY') {
      // Step immediately
      stepOneYear();
      setShowYearEndModal(true);

      if (currentChapter && isChapterEndYear(currentYear, settings.endYear)) {
        const summary = calculateChapterSummary(currentChapter, state);
        setChapterSummaryData(summary);
      }
    } else {
      // Open Live Market Replay Stage
      setShowReplayStage(true);
    }
  };

  // Handle Crisis Decision Modal Execution
  const handleExecuteCrisisDecision = (
    action: CrisisDecisionAction,
    options?: { targetCashWeight?: number; customTargetWeights?: { canonicalId: string; weight: number }[]; rationale?: string }
  ) => {
    if (activeCrisisEvent) {
      const res = executeCrisisDecision(
        activeCrisisEvent,
        action,
        state,
        options
      );

      // If Replay Stage is active, recalculate remaining months M+1 to 12
      if (showReplayStage && activeYearReplayData) {
        const updatedData = recalculateRemainingMonths(
          activeYearReplayData,
          activeCrisisEvent.month,
          res.updatedCash,
          res.updatedHoldings,
          settings
        );
        setActiveYearReplayData(updatedData);
      }
    }

    executeCrisisDecisionAction(action, options);
  };

  return (
    <div className="space-y-4 pb-28 animate-fade-in">
      {/* Top Header & Year Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              45년 역사적 시뮬레이션
            </span>
            <span className="text-xs font-bold text-slate-600">
              {currentYear}년 투자 결정기 ({cutoffInfo.searchPeriod})
            </span>
            {playMode === 'REAL' ? (
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                <Lock size={12} /> 실전 모드 (되돌리기 불가)
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                🟢 연습 모드 (자유 실험)
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 font-display flex items-center gap-2">
            <span>{currentYear}년 포트폴리오 의사결정</span>
            {currentChapter && (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                시대: {currentChapter.titleKo}
              </span>
            )}
          </h1>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <button
            type="button"
            onClick={() => setShowAutoInvestModal(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition flex items-center gap-1 cursor-pointer"
          >
            <Sparkles size={14} /> 자동투자 전략
          </button>

          <button
            type="button"
            onClick={() => setShowPredictionModal(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center gap-1 cursor-pointer"
          >
            <Eye size={14} /> {currentYear}년 시장 전망
          </button>

          <button
            type="button"
            onClick={() => setShowEncyclopediaModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
          >
            <BookOpen size={14} /> 기업도감 ({Object.keys(companyEncyclopedia).length})
          </button>

          <button
            type="button"
            onClick={() => setShowAchievementsModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
          >
            <Award size={14} /> 업적 ({unlockedAchievementIds.length})
          </button>

          <button
            type="button"
            onClick={() => setShowSaveSlotModal(true)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="저장 슬롯 관리"
          >
            <FolderOpen size={16} />
          </button>
        </div>
      </div>

      {/* TOP KPI BAR: Separating Total Assets from Pure PnL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Assets */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500">총 평가 자산</span>
          <div className="my-1">
            <span className="text-lg sm:text-xl font-black font-mono text-slate-900 block">
              {formatKRW(currentAssets)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            보유 현금 {formatKRW(cashKRW)}
          </span>
        </div>

        {/* Pure Investment PnL */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500">순수 투자손익 (납입원금 제외)</span>
          <div className="my-1">
            <span className={`text-lg sm:text-xl font-black font-mono block ${getReturnColor(purePnL.investmentPnLPercent)}`}>
              {purePnL.investmentPnLKRW >= 0 ? '+' : ''}{formatKRW(purePnL.investmentPnLKRW)}
            </span>
          </div>
          <span className={`text-[10px] font-bold font-mono ${getReturnColor(purePnL.investmentPnLPercent)}`}>
            원금대비 {purePnL.investmentPnLPercent >= 0 ? '+' : ''}{formatPercent(purePnL.investmentPnLPercent)}
          </span>
        </div>

        {/* Total Invested Principal */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500">총 투입 원금 (누적)</span>
          <div className="my-1">
            <span className="text-lg sm:text-xl font-black font-mono text-slate-800 block">
              {formatKRW(totalInvestedPrincipal)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            초기 {formatKRW(initialCashKRW)} + 매년 적립
          </span>
        </div>

        {/* Real-Time Drawdown & Risk Gauge */}
        <div className={`p-3.5 rounded-2xl border shadow-xs flex flex-col justify-between ${
          liveRiskLevel === 'CRISIS' || liveRiskLevel === 'EXTREME'
            ? 'bg-rose-50/80 border-rose-200 text-rose-900'
            : liveRiskLevel === 'WARNING'
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">고점 대비 낙폭 (Drawdown)</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/80 border border-slate-200">
              {liveRiskLevel === 'EXTREME' ? '🔥 극단위험' : liveRiskLevel === 'CRISIS' ? '🚨 위기경보' : liveRiskLevel === 'WARNING' ? '⚠️ 경계' : liveRiskLevel === 'CAUTION' ? '👀 주의' : '🟢 정상'}
            </span>
          </div>
          <div className="my-1">
            <span className="text-lg sm:text-xl font-black font-mono block text-rose-600">
              {liveDrawdown < -0.0001 ? `-${formatPercent(Math.abs(liveDrawdown))}` : '0.0% (고점)'}
            </span>
          </div>
          <span className="text-[10px] font-medium opacity-80">
            역대 최고자산: {formatKRW(runningPeak)}
          </span>
        </div>
      </div>

      {/* Single Stock Concentration Warning (if >= 40%) */}
      {maxDraftStock.weight >= 0.40 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 animate-scale-up">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <span>
              <strong>단일 종목 집중 경고:</strong> [{maxDraftStock.nameKo}] 목표 비중이 <strong>{formatPercent(maxDraftStock.weight)}</strong>에 달합니다. 개별 기업 위기 발생 시 최대낙폭이 급격히 확대될 수 있습니다.
            </span>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'NORMALIZE_DRAFT_TARGET_WEIGHTS' })}
            className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl font-bold shrink-0 cursor-pointer text-[11px]"
          >
            비중 균등 조정
          </button>
        </div>
      )}

      {/* Main 5-Tab Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl flex-wrap">
          <button
            type="button"
            onClick={() => { audioManager.playUiSound('tab'); setActiveTab('MARKET'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MARKET' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe size={15} /> 1. 시장 모자이크 & 탐색
          </button>

          <button
            type="button"
            onClick={() => { audioManager.playUiSound('tab'); setActiveTab('PORTFOLIO'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PORTFOLIO' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale size={15} /> 2. 자산배분 & 주문검토 ({changedStocksCount})
          </button>

          <button
            type="button"
            onClick={() => { audioManager.playUiSound('tab'); setActiveTab('NEWS'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'NEWS' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Newspaper size={15} /> 3. 역사적 뉴스 & 공시
          </button>

          <button
            type="button"
            onClick={() => { audioManager.playUiSound('tab'); setActiveTab('RISK'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'RISK' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert size={15} /> 4. 리스크 진단 & 민감도
          </button>

          <button
            type="button"
            onClick={() => { audioManager.playUiSound('tab'); setActiveTab('PROGRESS'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PROGRESS' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown size={15} /> 5. 챕터 여정
          </button>
        </div>

        {/* Perceived Risk Selector */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-bold">
          <span className="text-slate-500">체감 위험도 기록:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5">
            {(['LOW', 'NORMAL', 'HIGH', 'VERY_HIGH'] as const).map(rk => (
              <button
                key={rk}
                type="button"
                onClick={() => {
                  audioManager.playSound('click');
                  setPerceivedRisk(currentYear, rk);
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  perceivedRiskByYear[currentYear] === rk
                    ? rk === 'VERY_HIGH'
                      ? 'bg-rose-600 text-white'
                      : rk === 'HIGH'
                      ? 'bg-amber-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {rk === 'LOW' ? '안정' : rk === 'NORMAL' ? '보통' : rk === 'HIGH' ? '경계' : '공포'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'MARKET' && (
        <StockMosaicView
          tradableStocks={tradableStocks}
          allTradableCount={tradableStocks.length}
          krTradableCount={tradableStocks.filter(s => s.market === 'KR').length}
          usTradableCount={tradableStocks.filter(s => s.market === 'US').length}
          currentYear={currentYear}
          cashKRW={cashKRW}
          holdings={holdings}
          watchlist={watchlist}
          draftTargetWeights={draftTargetWeights}
          selectedCanonicalId={selectedCanonicalIdForDetail}
          onSelectStock={cid => {
            setSelectedCanonicalIdForDetail(cid);
            setInitialDetailTab('OVERVIEW');
          }}
          onUpdateDraftTargetWeight={(cid, w) => {
            dispatch({ type: 'SET_DRAFT_TARGET_WEIGHT', payload: { canonicalId: cid, weight: w } });
          }}
          onToggleWatchlist={cid => {
            dispatch({ type: 'TOGGLE_WATCHLIST', payload: cid });
          }}
        />
      )}

      {activeTab === 'PORTFOLIO' && (
        <div className="space-y-4">
          <OrderReviewModal
            currentYear={currentYear}
            cashKRW={cashKRW}
            holdings={holdings}
            draftTargetWeights={draftTargetWeights}
            tradableStocks={tradableStocks}
            settings={settings}
            onExecuteBatchOrder={() => {
              dispatch({ type: 'EXECUTE_DRAFT_ALLOCATION' });
              audioManager.playUiSound('success');
            }}
            onResetDraft={() => dispatch({ type: 'RESET_DRAFT_TARGET_WEIGHTS' })}
            onNormalize={() => dispatch({ type: 'NORMALIZE_DRAFT_TARGET_WEIGHTS' })}
            onClose={() => setActiveTab('MARKET')}
          />
        </div>
      )}

      {activeTab === 'NEWS' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">{currentYear}년 공개된 역사적 뉴스 & 공시</h2>
              <p className="text-xs text-slate-500 font-medium">{cutoffInfo.cutoffDate} 기준 확인 가능한 뉴스</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewsCenterModal(true)}
              className="px-3.5 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
            >
              전체 뉴스 아카이브 열기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {macroNewsList.map(news => (
              <div
                key={news.id}
                onClick={() => setSelectedNewsForAnalysis(news)}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 transition cursor-pointer space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-700">{news.sourceName || '역사적 기록'}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{news.publishedAt}</span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">{news.titleKo}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">{news.summaryKo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'RISK' && (
        <RiskDashboardView
          state={state}
          onOpenGlossary={() => setShowGlossaryModal(true)}
        />
      )}

      {activeTab === 'PROGRESS' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">45년 역사적 시대(Chapter) 여정</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">5년 단위 9개 시대의 역사적 배경과 리스크 통제 목표</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
              현재: {currentChapter?.titleKo || '1980~2025'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getChapterByYear(currentYear) && (
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 md:col-span-3 space-y-3">
                <span className="text-xs font-extrabold text-blue-900 block">
                  현재 진행 중인 시대: {currentChapter?.titleKo} ({currentChapter?.startYear}~{currentChapter?.endYear}년)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {currentChapter?.startContext.descriptionKo}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed Bottom Action Bar */}
      <FixedActionBar
        currentYear={currentYear}
        totalStockTarget={totalStockTarget}
        draftCashTargetWeight={draftCashTargetWeight}
        changedStocksCount={changedStocksCount}
        estimatedFeesKRW={0}
        isOverAllocated={totalStockTarget > 1.0001}
        onStepOneYear={handleInitiateAdvance}
        onOpenOrderReview={() => setShowOrderReviewModal(true)}
        onResetDraft={() => dispatch({ type: 'RESET_DRAFT_TARGET_WEIGHTS' })}
        onNormalize={() => dispatch({ type: 'NORMALIZE_DRAFT_TARGET_WEIGHTS' })}
      />

      {/* Real Mode Lock Confirmation Modal */}
      {showRealLockConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base">결정 잠금 및 {currentYear}년 시장 진행</h3>
                <span className="text-xs text-slate-500 font-medium">실전 모드 의사결정 확정</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              실전 모드에서는 시장 결과가 공개된 이후 이번 연도의 투자 결정을 되돌릴 수 없습니다. 원칙에 맞게 배분되었는지 확인 후 진행하세요.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRealLockConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                다시 검토
              </button>
              <button
                type="button"
                onClick={executeAdvanceWorkflow}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:translate-y-0.5 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
              >
                결정 잠금 및 시장 진행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE MARKET REPLAY STAGE OVERLAY */}
      {showReplayStage && activeYearReplayData && (
        <MarketReplayStage
          isOpen={showReplayStage}
          yearData={activeYearReplayData}
          isCrisisActive={Boolean(activeCrisisEvent)}
          onTriggerCrisis={crisisId => {
            dispatch({ type: 'TRIGGER_CRISIS_EVENT', payload: { crisisEventId: crisisId } });
          }}
          onOpenNewsDetail={news => {
            setSelectedNewsForAnalysis(news);
          }}
          onOpenAllNews={() => {
            setShowNewsCenterModal(true);
          }}
          onFinishReplay={() => {
            setShowReplayStage(false);
            stepOneYear();
            setShowYearEndModal(true);

            if (currentChapter && isChapterEndYear(currentYear, settings.endYear)) {
              const summary = calculateChapterSummary(currentChapter, state);
              setChapterSummaryData(summary);
            }
          }}
          onClose={() => {
            setShowReplayStage(false);
          }}
        />
      )}

      {/* Historical Crisis Decision Modal */}
      <CrisisDecisionModal
        isOpen={Boolean(activeCrisisEvent)}
        crisisEvent={activeCrisisEvent}
        state={state}
        onExecute={handleExecuteCrisisDecision}
        onViewNews={_newsIds => {
          setShowNewsCenterModal(true);
        }}
      />

      {/* Year-End Briefing Modal */}
      {showYearEndModal && (
        <YearEndBriefingModal
          record={state.history[state.history.length - 1] || null}
          isGameOver={state.isGameOver}
          onProceed={() => setShowYearEndModal(false)}
        />
      )}

      {/* Chapter Summary Modal */}
      {chapterSummaryData && (
        <ChapterSummaryModal
          isOpen={Boolean(chapterSummaryData)}
          summaryData={chapterSummaryData}
          onClose={() => setChapterSummaryData(null)}
        />
      )}

      {/* Chapter Intro Modal */}
      {currentChapter && (
        <ChapterIntroModal
          isOpen={showChapterIntroModal}
          chapter={currentChapter}
          onClose={() => setShowChapterIntroModal(false)}
        />
      )}

      {/* Auto Invest Modal */}
      <AutoInvestModal
        isOpen={showAutoInvestModal}
        state={state}
        onClose={() => setShowAutoInvestModal(false)}
        onRunAutoInvest={(rule, yrs) => runAutoInvest(rule, yrs)}
        onSaveRule={rule => saveAutoInvestRule(rule)}
        onDeleteRule={id => deleteAutoInvestRule(id)}
      />

      {/* Order Review Modal */}
      {showOrderReviewModal && (
        <OrderReviewModal
          currentYear={currentYear}
          cashKRW={cashKRW}
          holdings={holdings}
          draftTargetWeights={draftTargetWeights}
          tradableStocks={tradableStocks}
          settings={settings}
          onExecuteBatchOrder={() => {
            dispatch({ type: 'EXECUTE_DRAFT_ALLOCATION' });
            setShowOrderReviewModal(false);
            audioManager.playUiSound('success');
          }}
          onResetDraft={() => dispatch({ type: 'RESET_DRAFT_TARGET_WEIGHTS' })}
          onNormalize={() => dispatch({ type: 'NORMALIZE_DRAFT_TARGET_WEIGHTS' })}
          onClose={() => setShowOrderReviewModal(false)}
        />
      )}

      {/* Company Detail Modal */}
      {selectedCanonicalIdForDetail && (
        <CompanyDetailModal
          canonicalId={selectedCanonicalIdForDetail}
          initialTab={initialDetailTab}
          draftTargetWeight={draftTargetWeights[selectedCanonicalIdForDetail] || 0}
          onUpdateDraftTargetWeight={(cid, w) => {
            dispatch({ type: 'SET_DRAFT_TARGET_WEIGHT', payload: { canonicalId: cid, weight: w } });
          }}
          onClose={() => setSelectedCanonicalIdForDetail(null)}
        />
      )}

      {/* Historical News Center Modal */}
      <HistoricalNewsCenterModal
        isOpen={showNewsCenterModal}
        onSelectCompanyForDetail={cid => {
          setSelectedCanonicalIdForDetail(cid);
          setShowNewsCenterModal(false);
        }}
        onClose={() => setShowNewsCenterModal(false)}
      />

      {/* Prediction Modal */}
      <PredictionModal
        isOpen={showPredictionModal}
        year={currentYear}
        existingPrediction={annualPredictions[currentYear]}
        onSavePrediction={recordPrediction}
        onClose={() => setShowPredictionModal(false)}
      />

      {/* Company Encyclopedia Modal */}
      <CompanyEncyclopediaModal
        isOpen={showEncyclopediaModal}
        entries={companyEncyclopedia}
        currentYear={currentYear}
        onClose={() => setShowEncyclopediaModal(false)}
      />

      {/* Investment Yearbook Modal */}
      <InvestmentYearbookModal
        isOpen={showYearbookModal}
        entries={yearbookEntries}
        highlights={selectYearbookHighlights(yearbookEntries, state)}
        onClose={() => setShowYearbookModal(false)}
      />

      {/* Achievement Gallery Modal */}
      <AchievementGalleryModal
        isOpen={showAchievementsModal}
        unlockedAchievementIds={unlockedAchievementIds}
        onClose={() => setShowAchievementsModal(false)}
      />

      {/* Save Slot Manager Modal */}
      <SaveSlotManagerModal
        isOpen={showSaveSlotModal}
        currentGameState={state}
        onLoadGame={loadSavedState}
        onClose={() => setShowSaveSlotModal(false)}
      />

      {/* Neutral News Analysis Modal */}
      {selectedNewsForAnalysis && (
        <NeutralNewsAnalysisModal
          newsItem={selectedNewsForAnalysis}
          onClose={() => setSelectedNewsForAnalysis(null)}
        />
      )}

      {/* Glossary Modal */}
      <GlossaryModal
        isOpen={showGlossaryModal}
        onClose={() => setShowGlossaryModal(false)}
      />
    </div>
  );
};
