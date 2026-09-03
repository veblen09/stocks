import React, { useState } from 'react';
import { X, AlertCircle, Layers } from 'lucide-react';
import { MarketReplayChart } from './MarketReplayChart';
import { IndividualStockReplayChart } from './IndividualStockReplayChart';
import { ReplayTimeline } from './ReplayTimeline';
import { ReplayControls } from './ReplayControls';
import { RiskLevelIndicator } from './RiskLevelIndicator';
import { MonthlyNewsNotification } from './MonthlyNewsNotification';
import { ReplayCompletion } from './ReplayCompletion';
import { AnimatedPortfolioValue } from './AnimatedPortfolioValue';
import { useMarketReplayState } from './replayStateMachine';
import { STOCKS_BY_ID } from '../../engine/returnEngine';
import type { YearReplayData } from './marketReplayTypes';
import type { HistoricalNewsItem } from '../../types/stockNews';
import { formatKRW, formatPercent, getReturnColor } from '../../utils/formatMoney';

interface MarketReplayStageProps {
  isOpen: boolean;
  yearData: YearReplayData | null;
  isCrisisActive?: boolean;
  onTriggerCrisis: (crisisId: string) => void;
  onOpenNewsDetail: (news: HistoricalNewsItem) => void;
  onOpenAllNews: () => void;
  onFinishReplay: () => void;
  onClose: () => void;
}

export const MarketReplayStage: React.FC<MarketReplayStageProps> = ({
  isOpen,
  yearData,
  isCrisisActive = false,
  onTriggerCrisis,
  onOpenNewsDetail,
  onOpenAllNews,
  onFinishReplay,
  onClose,
}) => {
  const {
    status,
    currentMonthIndex,
    settings,
    wasTabHidden,
    setWasTabHidden,
    updateSettings,
    togglePlay,
    pauseForNews,
    skipToEnd,
    setCurrentMonthIndex,
  } = useMarketReplayState({
    yearData,
    isCrisisActive,
    onTriggerCrisis,
    onYearComplete: () => {
      // Completed full year replay
    },
  });

  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);

  if (!isOpen || !yearData) return null;

  const visiblePoints = yearData.points.slice(0, currentMonthIndex + 1);
  const currentPoint = visiblePoints[visiblePoints.length - 1];

  if (!currentPoint) return null;

  const isCompleted = status === 'YEAR_COMPLETE';
  const holdingsMap = yearData.holdings || {};
  const heldStockIds = Object.keys(holdingsMap).filter(
    cid => (holdingsMap[cid]?.shares || 0) > 0
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="market-replay-title"
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-7 space-y-5 text-slate-800 my-auto animate-scale-up">
        {/* YEAR INTRO BANNER (Brief 600ms transition) */}
        {status === 'YEAR_INTRO' && (
          <div className="text-center py-12 space-y-3 animate-pulse">
            <span className="text-xs font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              실시간 시장 진행 시작
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
              {yearData.year}
            </h2>
            <p className="text-sm font-bold text-slate-500">1월부터 12월까지 시장이 시작됩니다</p>
          </div>
        )}

        {/* MAIN REPLAY VIEW */}
        {status !== 'YEAR_INTRO' && (
          <>
            {/* Top Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 font-black text-sm">
                  {yearData.year}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 tracking-tight">
                      {yearData.year}년 실시간 시장 재생
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {yearData.quality === 'VERIFIED_MONTHLY' ? '✓ 검증된 월별 데이터' : '연간 기준'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    내 포트폴리오가 실제 역사 속에서 움직이는 과정
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Hidden Auto-Pause Notice */}
            {wasTabHidden && status === 'PAUSED' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 animate-slide-down">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span>브라우저 탭 전환으로 인해 시장 재생이 안전하게 일시정지되었습니다.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWasTabHidden(false);
                    togglePlay();
                  }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer shadow-xs"
                >
                  계속 재생
                </button>
              </div>
            )}

            {/* Contemporary News Notification Toast */}
            {currentPoint.newlyAvailableNews.length > 0 && !isCompleted && (
              <MonthlyNewsNotification
                newsItems={currentPoint.newlyAvailableNews}
                onOpenNews={news => {
                  pauseForNews();
                  onOpenNewsDetail(news);
                }}
                onOpenAllNews={onOpenAllNews}
              />
            )}

            {/* 3 Core KPI Value Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              {/* Current Assets */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-md flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-300 font-sans">
                  현재 총 평가자산 ({currentPoint.month === 0 ? '1/1' : `${currentPoint.month}월`})
                </span>
                <div className="my-1">
                  <AnimatedPortfolioValue
                    value={currentPoint.portfolioValueKRW}
                    formatType="KRW"
                    motionPreference={settings.motionPreference}
                    className="text-lg sm:text-xl font-black tracking-tight text-white block"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-sans">
                  현금 {formatKRW(currentPoint.cashKRW)}
                </span>
              </div>

              {/* Pure Investment PnL */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 font-sans">
                  순수 투자손익 (납입원금 제외)
                </span>
                <div className="my-1">
                  <AnimatedPortfolioValue
                    value={currentPoint.investmentPnLKRW}
                    formatType="KRW"
                    showSign={true}
                    motionPreference={settings.motionPreference}
                    className={`text-lg sm:text-xl font-black block ${getReturnColor(currentPoint.investmentPnLPercent)}`}
                  />
                </div>
                <span className={`text-[10px] font-bold font-sans ${getReturnColor(currentPoint.investmentPnLPercent)}`}>
                  수익률: {formatPercent(currentPoint.investmentPnLPercent)}
                </span>
              </div>

              {/* YTD Return & This Month */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 font-sans">
                  올해 누적 수익률 (YTD)
                </span>
                <div className="my-1">
                  <AnimatedPortfolioValue
                    value={currentPoint.ytdReturn}
                    formatType="PERCENT"
                    showSign={true}
                    motionPreference={settings.motionPreference}
                    className={`text-lg sm:text-xl font-black block ${getReturnColor(currentPoint.ytdReturn)}`}
                  />
                </div>
                <span className={`text-[10px] font-bold font-sans ${getReturnColor(currentPoint.monthlyReturn)}`}>
                  {currentPoint.month === 0 ? '1/1 연초 시작' : `${currentPoint.month}월 당월: ${formatPercent(currentPoint.monthlyReturn)}`}
                </span>
              </div>

              {/* Cumulative Principal */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 font-sans">
                  누적 납입원금
                </span>
                <div className="my-1">
                  <span className="text-lg sm:text-xl font-black text-slate-800 block">
                    {formatKRW(currentPoint.cumulativeContributionsKRW)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans">
                  {yearData.annualContributionKRW > 0 ? `연초 +${formatKRW(yearData.annualContributionKRW)} 반영` : '추가 납입 없음'}
                </span>
              </div>
            </div>

            {/* Chart View Mode Selector (Portfolio vs Individual Stock) */}
            {heldStockIds.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedStockId(null)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    selectedStockId === null
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Layers size={13} />
                  <span>포트폴리오 전체</span>
                </button>

                {heldStockIds.map(cid => {
                  const stockInfo = STOCKS_BY_ID[cid];
                  const isSelected = selectedStockId === cid;
                  return (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => setSelectedStockId(cid)}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{stockInfo?.market === 'US' ? '🇺🇸' : '🇰🇷'}</span>
                      <span>{stockInfo?.nameKo || cid}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* SVG Progressive Chart (Portfolio or Individual Stock) */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 shadow-inner">
              {selectedStockId ? (
                <IndividualStockReplayChart
                  canonicalId={selectedStockId}
                  year={yearData.year}
                  currentMonth={currentPoint.month}
                  motionPreference={settings.motionPreference}
                  holding={holdingsMap[selectedStockId]}
                />
              ) : (
                <MarketReplayChart
                  points={yearData.points}
                  currentMonthIndex={currentMonthIndex}
                  startTotalAssetsKRW={yearData.startTotalAssetsKRW}
                  cumulativePrincipalKRW={currentPoint.cumulativeContributionsKRW}
                  showBenchmark={settings.showBenchmark}
                  motionPreference={settings.motionPreference}
                />
              )}
            </div>

            {/* 12-Month Progress Timeline */}
            <ReplayTimeline
              year={yearData.year}
              currentMonth={currentPoint.month}
              totalMonths={12}
              onSelectMonth={m => setCurrentMonthIndex(m)}
            />

            {/* Risk & Drawdown Gauge */}
            <RiskLevelIndicator
              riskLevel={currentPoint.riskLevel}
              drawdown={currentPoint.drawdown}
              lossFromPeakKRW={currentPoint.lossFromPeakKRW}
              monthsUnderwater={currentPoint.monthsUnderwater}
              runningPeakKRW={currentPoint.runningPeakKRW}
            />

            {/* Year-End Completion Card (Shown when 12 months finished) */}
            {isCompleted ? (
              <ReplayCompletion
                yearData={yearData}
                lastPoint={currentPoint}
                onProceedToYearEnd={onFinishReplay}
                onOpenYearNews={onOpenAllNews}
              />
            ) : (
              /* Playback Controls Bar */
              <ReplayControls
                isPlaying={status === 'PLAYING'}
                speed={settings.speed}
                showBenchmark={settings.showBenchmark}
                motionPreference={settings.motionPreference}
                onTogglePlay={togglePlay}
                onChangeSpeed={spd => updateSettings({ speed: spd })}
                onToggleBenchmark={() => updateSettings({ showBenchmark: !settings.showBenchmark })}
                onSkipToEnd={skipToEnd}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
