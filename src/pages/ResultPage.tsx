import React, { useState } from 'react';
import {
  Download,
  Printer,
  RotateCcw,
  Home,
  BarChart3,
  X,
  FileText,
  Table as TableIcon,
  Clock,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Award,
  FolderOpen,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useStockGame } from '../store/stockGameStore';
import { calculateFinalMetrics, calculateDrawdownPoints } from '../engine/metricsEngine';
import { formatKRW, formatPercent, getReturnColor } from '../utils/formatMoney';
import { exportSimulationToCsv } from '../utils/csvExport';
import { audioManager } from '../utils/audioManager';

// Enhanced Game Features
import { InvestmentYearbookModal } from '../features/yearbook/InvestmentYearbookModal';
import { selectYearbookHighlights } from '../features/yearbook/yearbookEngine';
import { CompanyEncyclopediaModal } from '../features/encyclopedia/CompanyEncyclopediaModal';
import { AchievementGalleryModal } from '../features/achievements/AchievementGalleryModal';
import { SaveSlotManagerModal } from '../features/saveSlots/SaveSlotManagerModal';
import { ConfirmDialog } from '../features/notifications/ConfirmDialog';

interface ResultPageProps {
  onNavigate: (page: string) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({ onNavigate }) => {
  const { state, resetGame, startNewGame, loadSavedState } = useStockGame();
  const metrics = calculateFinalMetrics(state);

  const [activeChartTab, setActiveChartTab] = useState<'wealth' | 'twr' | 'returns' | 'drawdown' | 'allocation'>('wealth');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showTradeLogsModal, setShowTradeLogsModal] = useState<boolean>(false);
  const [showCpiAdjusted, setShowCpiAdjusted] = useState<boolean>(state.showRealPurchasingPower ?? true);

  // Modals
  const [showYearbookModal, setShowYearbookModal] = useState<boolean>(false);
  const [showEncyclopediaModal, setShowEncyclopediaModal] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [showSaveSlotModal, setShowSaveSlotModal] = useState<boolean>(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    audioManager.playSound('click');
    exportSimulationToCsv(state, metrics);
  };

  const handleRestartSameSettings = () => {
    audioManager.playSound('click');
    startNewGame(state.settings);
    setShowRestartConfirm(false);
    onNavigate('game');
  };

  const handleRestartNewGame = () => {
    audioManager.playSound('click');
    resetGame();
    onNavigate('setup');
  };

  // Verified Drawdown Points across all 45 years
  const drawdownPoints = metrics.drawdownPoints && metrics.drawdownPoints.length > 0
    ? metrics.drawdownPoints
    : calculateDrawdownPoints(state.history, state.settings.startYear);

  return (
    <div className="space-y-6 animate-fade-in-up pb-24">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 no-print">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              최종 투자 성과 & 역사적 생존 보고서
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {state.settings.startYear}년 말 ~ {state.settings.endYear}년 말 ({state.history.length}개년 완주)
            </span>
            {state.playMode === 'REAL' ? (
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                🔒 실전 모드 완주
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                🟢 연습 모드 ({state.retryCount || 0}회 재실험)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 font-display">
            {state.settings.nickname} 님의 45년 투자 대장정 결산
          </h1>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* CPI Toggle */}
          <button
            type="button"
            onClick={() => setShowCpiAdjusted(!showCpiAdjusted)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              showCpiAdjusted
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>물가반영(CPI): {showCpiAdjusted ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download size={15} />
            <span>CSV 내보내기</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer size={15} />
            <span>보고서 인쇄</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRestartConfirm(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RotateCcw size={15} />
            <span>동일 조건 재도전</span>
          </button>

          <button
            type="button"
            onClick={handleRestartNewGame}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Home size={15} />
            <span>홈으로</span>
          </button>
        </div>
      </div>

      {/* Feature Navigation Toolbar on Result Page */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold text-slate-600">추가 상세 기록 및 도감 열람:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowEncyclopediaModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <BookOpen size={14} />
            <span>기업 도감 ({Object.keys(state.companyEncyclopedia || {}).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowYearbookModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-600" />
            <span>투자 연감</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAchievementsModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <Award size={14} />
            <span>해금 업적 ({state.unlockedAchievementIds?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSaveSlotModal(true)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            title="저장 슬롯 관리"
          >
            <FolderOpen size={16} />
          </button>
        </div>
      </div>

      {/* 1. Core Summary Cards: Separated Principal & Pure PnL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Final Portfolio Value */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl shadow-lg flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-300">최종 총 평가자산</span>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight block">
              {formatKRW(metrics.finalPortfolioValue)}
            </span>
            {showCpiAdjusted && (
              <span className="text-xs text-indigo-200 font-semibold block mt-0.5">
                2025년 물가기준: {formatKRW(metrics.cpiAdjustedFinalValueKRW || metrics.finalPortfolioValue)}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            초기자금 {formatKRW(state.settings.initialCashKRW)} + 매년 적립
          </span>
        </div>

        {/* Pure Investment PnL */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500">순수 투자손익 (납입원금 제외)</span>
          <div className="my-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight block ${getReturnColor(metrics.simpleProfitRate)}`}>
              {metrics.totalNetProfitKRW >= 0 ? '+' : ''}{formatKRW(metrics.totalNetProfitKRW)}
            </span>
            <span className={`text-xs font-bold block mt-0.5 ${getReturnColor(metrics.simpleProfitRate)}`}>
              원금 대비 {metrics.simpleProfitRate >= 0 ? '+' : ''}{formatPercent(metrics.simpleProfitRate)}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            총 투입원금 {formatKRW(metrics.totalInvestedPrincipal)}
          </span>
        </div>

        {/* TWR CAGR & Volatility */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500">연평균 복리수익률 (TWR CAGR)</span>
          <div className="my-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight block ${getReturnColor(metrics.twrCAGR)}`}>
              {formatPercent(metrics.twrCAGR)}
            </span>
            <span className="text-xs text-slate-500 font-medium block mt-0.5">
              누적 TWR: {formatPercent(metrics.twr)}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            연간 변동성: {formatPercent(metrics.annualVolatility)}
          </span>
        </div>

        {/* Max Drawdown (MDD) & Underwater */}
        <div className="p-5 bg-rose-50/60 rounded-3xl border border-rose-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">역대 최대낙폭 (MDD)</span>
            <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
              순수 TWR 기준
            </span>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-700 font-mono tracking-tight block">
              -{formatPercent(metrics.maxDrawdownMDD)}
            </span>
            <span className="text-xs text-rose-600 font-medium block mt-0.5">
              고점 회복 최장 소요: {metrics.recoveryMetrics?.underwaterDurationYears || 0}년
            </span>
          </div>
          <span className="text-xs text-rose-800 font-medium">
            역대 최고자산: {formatKRW(metrics.allTimePeakPortfolioValueKRW || metrics.finalPortfolioValue)}
          </span>
        </div>
      </div>

      {/* 2. Recovery & Underwater Metrics Section */}
      <GlassCard className="p-5 space-y-4 bg-white border-slate-200" variant="default">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              장기투자 회복력 & 수중 기간(Underwater Duration) 분석
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">위기 극복 소요 시간 정밀 집계</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-slate-500 font-sans block font-semibold text-[11px]">역대 최대낙폭(MDD)</span>
            <span className="text-base font-black text-rose-600 mt-1 block">-{formatPercent(metrics.recoveryMetrics?.maxDrawdown || metrics.maxDrawdownMDD)}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-slate-500 font-sans block font-semibold text-[11px]">직전 최고점 연도</span>
            <span className="text-base font-black text-slate-800 mt-1 block">{metrics.recoveryMetrics?.drawdownStartYear || state.settings.startYear}년</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-slate-500 font-sans block font-semibold text-[11px]">최대 저점 연도</span>
            <span className="text-base font-black text-rose-700 mt-1 block">{metrics.recoveryMetrics?.troughYear || state.settings.startYear}년</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-slate-500 font-sans block font-semibold text-[11px]">원금 회복 연도</span>
            <span className="text-base font-black text-emerald-700 mt-1 block">
              {metrics.recoveryMetrics?.recoveryYear ? `${metrics.recoveryMetrics.recoveryYear}년` : '회복 진행 중'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-slate-500 font-sans block font-semibold text-[11px]">최장 수중 기간</span>
            <span className="text-base font-black text-indigo-700 mt-1 block">{metrics.recoveryMetrics?.underwaterDurationYears || 0}년</span>
          </div>
        </div>
      </GlassCard>

      {/* 3. Benchmark Alpha & Comparison Table */}
      <GlassCard className="p-5 space-y-4" variant="default">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">3대 대표 시장 지수와의 정밀 비교</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-bold">동일 현금흐름 기준</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold">
                <th className="pb-2.5">전략 / 지수</th>
                <th className="pb-2.5 text-right font-mono">최종 자산</th>
                <th className="pb-2.5 text-right font-mono">연평균 복리(CAGR)</th>
                <th className="pb-2.5 text-right font-mono">최대낙폭(MDD)</th>
                <th className="pb-2.5 text-right font-mono">초과 성과(Alpha)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 font-mono">
              <tr className="bg-blue-50/70 font-black text-blue-900">
                <td className="py-3 font-sans">👑 나의 포트폴리오</td>
                <td className="py-3 text-right text-blue-700 font-bold">{formatKRW(metrics.finalPortfolioValue)}</td>
                <td className="py-3 text-right font-bold">{formatPercent(metrics.twrCAGR)}</td>
                <td className="py-3 text-right text-rose-600 font-bold">-{formatPercent(metrics.maxDrawdownMDD)}</td>
                <td className="py-3 text-right text-blue-600 font-bold">-</td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans">🇰🇷 코스피 지수 (KOSPI)</td>
                <td className="py-2.5 text-right">{formatKRW(metrics.benchmarkComparison.kospiFinalValue)}</td>
                <td className="py-2.5 text-right">{formatPercent(metrics.benchmarkComparison.kospiTwrCAGR)}</td>
                <td className="py-2.5 text-right text-rose-600">-{formatPercent(metrics.benchmarkComparison.kospiMDD)}</td>
                <td className={`py-2.5 text-right font-bold ${getReturnColor(metrics.twrCAGR - metrics.benchmarkComparison.kospiTwrCAGR)}`}>
                  {formatPercent(metrics.twrCAGR - metrics.benchmarkComparison.kospiTwrCAGR)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans">🇺🇸 S&P 500 (원화 환산)</td>
                <td className="py-2.5 text-right">{formatKRW(metrics.benchmarkComparison.sp500FinalValue)}</td>
                <td className="py-2.5 text-right">{formatPercent(metrics.benchmarkComparison.sp500TwrCAGR)}</td>
                <td className="py-2.5 text-right text-rose-600">-{formatPercent(metrics.benchmarkComparison.sp500MDD)}</td>
                <td className={`py-2.5 text-right font-bold ${getReturnColor(metrics.twrCAGR - metrics.benchmarkComparison.sp500TwrCAGR)}`}>
                  {formatPercent(metrics.twrCAGR - metrics.benchmarkComparison.sp500TwrCAGR)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans">⚖️ 50:50 한·미 혼합 리밸런싱</td>
                <td className="py-2.5 text-right">{formatKRW(metrics.benchmarkComparison.blendFinalValue)}</td>
                <td className="py-2.5 text-right">{formatPercent(metrics.benchmarkComparison.blendTwrCAGR)}</td>
                <td className="py-2.5 text-right text-rose-600">-{formatPercent(metrics.benchmarkComparison.blendMDD)}</td>
                <td className={`py-2.5 text-right font-bold ${getReturnColor(metrics.twrCAGR - metrics.benchmarkComparison.blendTwrCAGR)}`}>
                  {formatPercent(metrics.twrCAGR - metrics.benchmarkComparison.blendTwrCAGR)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* 4. Interactive Charts Hub */}
      <GlassCard className="p-5 space-y-4" variant="default">
        {/* Chart Nav Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
            {(['wealth', 'twr', 'returns', 'drawdown', 'allocation'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { audioManager.playUiSound('tab'); setActiveChartTab(tab); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  activeChartTab === tab ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'wealth' ? '1. 자산 가치 & 원금' : tab === 'twr' ? '2. TWR 복리 지수' : tab === 'returns' ? '3. 연도별 수익률' : tab === 'drawdown' ? '4. 낙폭 (MDD) 곡선' : '5. 자산 배분'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <TableIcon size={14} /> 연도별 상세 표
            </button>
            <button
              type="button"
              onClick={() => setShowTradeLogsModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <FileText size={14} /> 거래 내역 ({state.tradeLogs.length}건)
            </button>
          </div>
        </div>

        {/* Chart Tab Contents */}
        <div className="pt-2">
          {/* Wealth Growth Chart */}
          {activeChartTab === 'wealth' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 flex-wrap gap-2">
                <span>포트폴리오 평가액 성장 vs 누적 투입원금</span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-blue-700 font-bold">
                    <span className="w-3 h-3 bg-blue-600 rounded-sm"></span> 포트폴리오
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 font-bold">
                    <span className="w-3 h-1 bg-slate-400 rounded-full"></span> 누적 원금
                  </span>
                </div>
              </div>
              <div className="h-64 flex items-end gap-1.5 overflow-x-auto pt-6 pb-2 px-2 border-b border-slate-300">
                {state.history.map(h => {
                  const maxVal = Math.max(...state.history.map(item => item.endTotalAssetsKRW), 1);
                  const heightPercent = Math.min(100, Math.max(8, (h.endTotalAssetsKRW / maxVal) * 100));
                  const isFiveYearTick = h.year % 5 === 0;

                  return (
                    <div key={h.year} className="flex-1 min-w-[22px] flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-20 whitespace-nowrap font-mono pointer-events-none">
                        <span className="font-bold text-blue-300">{h.year}년말</span>
                        <span>자산: {formatKRW(h.endTotalAssetsKRW)}</span>
                        <span>수익률: {formatPercent(h.annualReturn)}</span>
                      </div>
                      <div
                        className="w-full bg-blue-600 rounded-t-sm transition-all duration-300 group-hover:bg-blue-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className={`text-[11px] font-mono mt-1 ${isFiveYearTick ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                        {isFiveYearTick ? `${h.year}` : `'${h.year.toString().slice(2)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TWR Chart */}
          {activeChartTab === 'twr' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>시간가중수익률(TWR) 복리 지수 (기준점 100)</span>
                <span className="text-blue-600 font-mono font-bold">최종 {metrics.twr.toFixed(2)}배</span>
              </div>
              <div className="h-64 flex items-end gap-1.5 overflow-x-auto pt-6 pb-2 px-2 border-b border-slate-300">
                {state.history.map(h => {
                  const maxTwr = Math.max(...state.history.map(item => item.twrIndexLevel), 100);
                  const heightPercent = Math.min(100, Math.max(6, (h.twrIndexLevel / maxTwr) * 100));
                  const isFiveYearTick = h.year % 5 === 0;

                  return (
                    <div key={h.year} className="flex-1 min-w-[22px] flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full bg-indigo-600 rounded-t-sm group-hover:bg-indigo-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className={`text-[11px] font-mono mt-1 ${isFiveYearTick ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                        {isFiveYearTick ? `${h.year}` : `'${h.year.toString().slice(2)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Returns Chart */}
          {activeChartTab === 'returns' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>연도별 순수 포트폴리오 수익률</span>
                <span className="text-slate-500 font-mono">최고 {formatPercent(metrics.bestYear.returnRate)} / 최저 {formatPercent(metrics.worstYear.returnRate)}</span>
              </div>
              <div className="h-64 flex items-center gap-1.5 overflow-x-auto pt-6 pb-2 px-2 border-b border-slate-300">
                {state.history.map(h => {
                  const isPositive = h.annualReturn >= 0;
                  const heightPercent = Math.min(50, Math.max(3, Math.abs(h.annualReturn) * 100));
                  const isFiveYearTick = h.year % 5 === 0;

                  return (
                    <div key={h.year} className="flex-1 min-w-[22px] flex flex-col items-center justify-center gap-1 group relative h-full">
                      <div className="w-full h-1/2 flex items-end justify-center">
                        {isPositive && (
                          <div
                            className="w-full bg-emerald-500 rounded-t-xs"
                            style={{ height: `${heightPercent * 2}%` }}
                          />
                        )}
                      </div>
                      <div className="w-full h-px bg-slate-300"></div>
                      <div className="w-full h-1/2 flex items-start justify-center">
                        {!isPositive && (
                          <div
                            className="w-full bg-rose-500 rounded-b-xs"
                            style={{ height: `${heightPercent * 2}%` }}
                          />
                        )}
                      </div>
                      <span className={`text-[11px] font-mono mt-1 ${isFiveYearTick ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                        {isFiveYearTick ? `${h.year}` : `'${h.year.toString().slice(2)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Drawdown Chart */}
          {activeChartTab === 'drawdown' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>역사적 고점 대비 실제 낙폭(Drawdown) 추이</span>
                <span className="text-rose-600 font-mono font-bold">최대낙폭(MDD): -{formatPercent(metrics.maxDrawdownMDD)}</span>
              </div>
              <div className="h-64 flex items-start gap-1.5 overflow-x-auto pt-6 pb-2 px-2 border-t border-slate-300">
                {drawdownPoints.map(p => {
                  const absDd = Math.abs(p.drawdown);
                  const heightPercent = Math.min(100, Math.max(3, (absDd / 0.6) * 100));
                  const isFiveYearTick = p.year % 5 === 0;

                  return (
                    <div key={p.year} className="flex-1 min-w-[22px] flex flex-col items-center gap-1 group relative">
                      {/* Interactive Tooltip */}
                      <div className="absolute top-full mt-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-20 whitespace-nowrap font-mono pointer-events-none">
                        <span className="font-bold text-rose-300">{p.year}년</span>
                        <span>현재 Drawdown: -{formatPercent(absDd)}</span>
                        <span>직전 최고점: {p.peakYear}년</span>
                        <span>수중 지속기간: {p.underwaterYears}년</span>
                      </div>
                      <div
                        className={`w-full rounded-b-sm transition-all duration-300 ${
                          absDd >= 0.30 ? 'bg-rose-600' : absDd >= 0.15 ? 'bg-rose-400' : 'bg-amber-400'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className={`text-[11px] font-mono mt-1 ${isFiveYearTick ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                        {isFiveYearTick ? `${p.year}` : `'${p.year.toString().slice(2)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Allocation */}
          {activeChartTab === 'allocation' && (
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>최종 시점의 국가 및 자산 배분 비중</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-sans block font-semibold">🇰🇷 한국 주식 비중</span>
                  <span className="text-lg font-bold text-blue-700">{formatPercent(metrics.finalAllocation.krWeight)}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-sans block font-semibold">🇺🇸 미국 주식 비중</span>
                  <span className="text-lg font-bold text-purple-700">{formatPercent(metrics.finalAllocation.usWeight)}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-sans block font-semibold">💵 보유 현금 비중</span>
                  <span className="text-lg font-bold text-emerald-700">{formatPercent(metrics.finalAllocation.cashWeight)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* 5. Crisis Timeline ("나의 위기 연대기") */}
      <GlassCard className="p-5 space-y-4 bg-white border-slate-200" variant="default">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-rose-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              나의 역사적 위기 대응 연대기 (Crisis Timeline)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">위기 상황 의사결정 기록</span>
        </div>

        {metrics.crisisDecisionHistory && metrics.crisisDecisionHistory.length > 0 ? (
          <div className="space-y-3">
            {metrics.crisisDecisionHistory.map((d, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{d.year}년 {d.month}월</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      {d.titleKo}
                    </span>
                  </div>
                  {d.rationale && (
                    <p className="text-[11px] text-slate-600 mt-1 font-medium italic">
                      "{d.rationale}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <div className="text-right">
                    <span className="text-slate-400 font-sans block text-[10px]">당시 대응 선택</span>
                    <span className="font-extrabold text-blue-700">
                      {d.chosenAction === 'HOLD' ? '원칙 유지' : d.chosenAction === 'REBALANCE' ? '목표비중 리밸런싱' : d.chosenAction === 'RAISE_CASH' ? `현금 ${Math.round((d.targetCashWeight || 0.3) * 100)}% 확대` : '직접 배분'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-sans block text-[10px]">거래비용</span>
                    <span className="font-bold text-slate-700">{formatKRW(d.tradingFeePaidKRW)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            운용 기간 동안 발생한 위기 대응 기록이 없습니다.
          </div>
        )}
      </GlassCard>

      {/* 6. Multi-Axis Quantitative Scoring & Persona */}
      <GlassCard className="p-6 space-y-6 bg-white border-slate-200" variant="default">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{metrics.scoreAndPersona.personaBadge}</span>
              <h2 className="text-xl font-black text-slate-900">{metrics.scoreAndPersona.personaType}</h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium leading-relaxed">
              {metrics.scoreAndPersona.personaDescription}
            </p>
          </div>

          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-center font-mono">
            <span className="text-[10px] font-sans font-bold text-blue-700 block">역사 챕터 생존</span>
            <span className="text-xl font-black text-blue-900">
              {metrics.chapterSurvivalCount.survived} / {metrics.chapterSurvivalCount.total}
            </span>
          </div>
        </div>

        {/* 5-Axis Radar Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-slate-500 font-bold block text-[11px]">분산 투자 점수</span>
            <span className="text-xl font-black text-blue-700 mt-1 block font-mono">{metrics.scoreAndPersona.diversificationScore}점</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-slate-500 font-bold block text-[11px]">원칙 준수(규율)</span>
            <span className="text-xl font-black text-indigo-700 mt-1 block font-mono">{metrics.scoreAndPersona.disciplineScore}점</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-slate-500 font-bold block text-[11px]">위기 회복력</span>
            <span className="text-xl font-black text-rose-600 mt-1 block font-mono">{metrics.scoreAndPersona.crisisResilienceScore}점</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-slate-500 font-bold block text-[11px]">비용 효율성</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block font-mono">{metrics.scoreAndPersona.costEfficiencyScore}점</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center col-span-2 sm:col-span-1">
            <span className="text-slate-500 font-bold block text-[11px]">종합 알파 지수</span>
            <span className="text-xl font-black text-purple-700 mt-1 block font-mono">{metrics.scoreAndPersona.overallAlphaScore}점</span>
          </div>
        </div>
      </GlassCard>

      {/* Report Footer & Copyright Notice */}
      <div className="p-4 bg-white/80 rounded-2xl border border-slate-200 text-center space-y-1 select-text shadow-xs backdrop-blur-sm">
        <div className="text-xs font-bold text-slate-700">
          Copyright 2026. 하나고등학교 일반사회 교사 김윤구 All Right Reserved. (veblen@hana.hs.kr)
        </div>
        <div className="text-[10.5px] text-slate-400 font-medium">
          머니트랙: 45년 한·미 주식투자 실험실 (1980~2025) · 고등학교 금융·경제 교육용 모의 시뮬레이션
        </div>
      </div>

      {/* Restart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRestartConfirm}
        title="동일 조건 재도전 확인"
        message="현재와 동일한 투자 조건과 초기 설정으로 처음부터 다시 시작하시겠습니까?"
        confirmText="재도전 시작"
        cancelText="취소"
        onConfirm={handleRestartSameSettings}
        onCancel={() => setShowRestartConfirm(false)}
      />

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <GlassCard className="w-full max-w-4xl max-h-[85vh] bg-white border-slate-200 p-6 flex flex-col space-y-4 text-slate-800 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">45년 연도별 전체 성과 기록표</h3>
              <button type="button" onClick={() => setShowHistoryModal(false)} className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold font-sans">
                    <th className="pb-2">연도</th>
                    <th className="pb-2 text-right">기초자산</th>
                    <th className="pb-2 text-right">연간납입</th>
                    <th className="pb-2 text-right">기말자산</th>
                    <th className="pb-2 text-right">연간수익률</th>
                    <th className="pb-2 text-right">TWR지수</th>
                    <th className="pb-2 text-right">코스피</th>
                    <th className="pb-2 text-right">S&P 500</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {state.history.map(h => (
                    <tr key={h.year} className="hover:bg-slate-50">
                      <td className="py-2 font-bold text-slate-900">{h.year}년</td>
                      <td className="py-2 text-right">{formatKRW(h.startTotalAssetsKRW)}</td>
                      <td className="py-2 text-right text-blue-600">+{formatKRW(h.annualDepositKRW)}</td>
                      <td className="py-2 text-right font-bold text-slate-900">{formatKRW(h.endTotalAssetsKRW)}</td>
                      <td className={`py-2 text-right font-bold ${getReturnColor(h.annualReturn)}`}>
                        {formatPercent(h.annualReturn)}
                      </td>
                      <td className="py-2 text-right">{h.twrIndexLevel.toFixed(1)}pt</td>
                      <td className="py-2 text-right">{formatPercent(h.benchmarkReturns.kospi)}</td>
                      <td className="py-2 text-right">{formatPercent(h.benchmarkReturns.sp500KRW)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="button" onClick={() => setShowHistoryModal(false)} className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
                닫기
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Trade Logs Modal */}
      {showTradeLogsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <GlassCard className="w-full max-w-4xl max-h-[85vh] bg-white border-slate-200 p-6 flex flex-col space-y-4 text-slate-800 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">전체 매매 거래 내역 ({state.tradeLogs.length}건)</h3>
              <button type="button" onClick={() => setShowTradeLogsModal(false)} className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold font-sans">
                    <th className="pb-2">연도</th>
                    <th className="pb-2">종목명</th>
                    <th className="pb-2">구분</th>
                    <th className="pb-2 text-right">수량</th>
                    <th className="pb-2 text-right">체결금액</th>
                    <th className="pb-2 text-right">수수료</th>
                    <th className="pb-2">근거/가설</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {state.tradeLogs.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 text-slate-500">{t.year}년</td>
                      <td className="py-2 font-bold text-slate-900">{t.stockNameKo}</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                          t.action === 'BUY' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {t.action === 'BUY' ? '매수' : '매도'}
                        </span>
                      </td>
                      <td className="py-2 text-right">{t.shares.toFixed(2)}주</td>
                      <td className="py-2 text-right font-bold">{formatKRW(t.totalAmountKRW)}</td>
                      <td className="py-2 text-right text-slate-500">{formatKRW(t.feeKRW)}</td>
                      <td className="py-2 text-slate-500 truncate max-w-[180px]">{t.thesis || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="button" onClick={() => setShowTradeLogsModal(false)} className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
                닫기
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Encyclopedia Modal */}
      <CompanyEncyclopediaModal
        isOpen={showEncyclopediaModal}
        entries={state.companyEncyclopedia || {}}
        currentYear={state.settings.endYear}
        onClose={() => setShowEncyclopediaModal(false)}
      />

      {/* Investment Yearbook Modal */}
      <InvestmentYearbookModal
        isOpen={showYearbookModal}
        entries={state.yearbookEntries || []}
        highlights={selectYearbookHighlights(state.yearbookEntries || [], state)}
        onClose={() => setShowYearbookModal(false)}
      />

      {/* Achievement Gallery Modal */}
      <AchievementGalleryModal
        isOpen={showAchievementsModal}
        unlockedAchievementIds={state.unlockedAchievementIds || []}
        onClose={() => setShowAchievementsModal(false)}
      />

      {/* Save Slot Manager Modal */}
      <SaveSlotManagerModal
        isOpen={showSaveSlotModal}
        currentGameState={state}
        onLoadGame={loadSavedState}
        onClose={() => setShowSaveSlotModal(false)}
      />
    </div>
  );
};
