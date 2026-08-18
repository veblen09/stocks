import React, { useState } from 'react';
import {
  Download,
  Printer,
  RotateCcw,
  Home,
  PieChart as PieChartIcon,
  BarChart3,
  Award,
  X,
  FileText,
  Table as TableIcon,
  Layers,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useStockGame } from '../store/stockGameStore';
import { calculateFinalMetrics } from '../engine/metricsEngine';
import { formatKRW, formatPercent, getReturnColor, formatWonNumber } from '../utils/formatMoney';
import { exportSimulationToCsv } from '../utils/csvExport';
import { audioManager } from '../utils/audioManager';

interface ResultPageProps {
  onNavigate: (page: string) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({ onNavigate }) => {
  const { state, resetGame, startNewGame } = useStockGame();
  const metrics = calculateFinalMetrics(state);

  const [activeChartTab, setActiveChartTab] = useState<'wealth' | 'twr' | 'returns' | 'drawdown' | 'allocation'>('wealth');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showTradeLogsModal, setShowTradeLogsModal] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    audioManager.playSound('click');
    exportSimulationToCsv(state, metrics);
  };

  const handleRestartSameSettings = () => {
    if (confirm('동일한 투자 조건으로 처음부터 다시 시작하시겠습니까?')) {
      audioManager.playSound('click');
      startNewGame(state.settings);
      onNavigate('game');
    }
  };

  const handleRestartNewGame = () => {
    audioManager.playSound('click');
    resetGame();
    onNavigate('setup');
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-16">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              최종 투자 성과 분석 보고서
            </span>
            <span className="text-xs text-slate-400 font-bold">
              {state.settings.startYear}년 말 ~ {state.settings.endYear}년 말 ({state.history.length}개년 운용)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 font-display">
            {state.settings.nickname} 님의 45년 주식투자 결과 보고서
          </h1>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-extrabold border border-slate-200 shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Download size={15} /> CSV 내보내기
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-extrabold border border-slate-200 shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Printer size={15} /> 보고서 인쇄
          </button>
          <button
            onClick={handleRestartSameSettings}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <RotateCcw size={15} /> 동일 조건 재도전
          </button>
          <button
            onClick={handleRestartNewGame}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-md transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Home size={15} /> 새로운 게임
          </button>
        </div>
      </div>

      {/* Persona Hero Card */}
      <GlassCard className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-2xl relative overflow-hidden" variant="strong">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold backdrop-blur-sm border border-white/10">
              <span>{metrics.scoreAndPersona.personaBadge}</span>
              <span>최종 투자자 성향 유형</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
              {metrics.scoreAndPersona.personaType}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              {metrics.scoreAndPersona.personaDescription}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-[200px] shadow-lg">
            <span className="text-[11px] text-blue-200 font-bold block">최종 평가 자산</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight block">
              {formatKRW(metrics.finalPortfolioValue)}
            </span>
            <span className="text-[11px] text-slate-300 font-semibold block mt-0.5">
              원금 대비 {metrics.totalInvestedPrincipal > 0 ? (metrics.finalPortfolioValue / metrics.totalInvestedPrincipal).toFixed(1) : 0}배 성장
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Core Quantitative KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm space-y-1">
          <span className="text-[11px] font-extrabold text-slate-500 block">총 납입 원금</span>
          <span className="text-lg font-black text-slate-900 block">{formatKRW(metrics.totalInvestedPrincipal)}</span>
          <span className="text-[10px] text-slate-400 font-semibold">초기금+매년적립</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm space-y-1">
          <span className="text-[11px] font-extrabold text-slate-500 block">누적 순손익</span>
          <span className={`text-lg font-black block ${getReturnColor(metrics.totalNetProfitKRW)}`}>
            {metrics.totalNetProfitKRW > 0 ? '+' : ''}{formatKRW(metrics.totalNetProfitKRW)}
          </span>
          <span className={`text-[10px] font-bold ${getReturnColor(metrics.simpleProfitRate)}`}>
            수익률 {formatPercent(metrics.simpleProfitRate)}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm space-y-1">
          <span className="text-[11px] font-extrabold text-slate-500 block">시간가중수익률 (TWR)</span>
          <span className={`text-lg font-black block ${getReturnColor(metrics.twr)}`}>
            {formatPercent(metrics.twr)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">순수 전략 누적</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm space-y-1">
          <span className="text-[11px] font-extrabold text-slate-500 block">연평균 복리 (CAGR)</span>
          <span className={`text-lg font-black block ${getReturnColor(metrics.twrCAGR)}`}>
            {formatPercent(metrics.twrCAGR)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">연간 환산 복리</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm space-y-1">
          <span className="text-[11px] font-extrabold text-slate-500 block">금액가중수익률 (IRR)</span>
          <span className={`text-lg font-black block ${getReturnColor(metrics.mwrIRR)}`}>
            {formatPercent(metrics.mwrIRR)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">적립식 체감 수익률</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm space-y-1">
          <span className="text-[11px] font-extrabold text-slate-500 block">최대낙폭 (MDD)</span>
          <span className="text-lg font-black text-rose-600 block">
            -{formatPercent(metrics.maxDrawdownMDD)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">고점 대비 최대하락</span>
        </div>
      </div>

      {/* Benchmark Alpha & Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 3 Benchmarks Comparison Table (7 Cols) */}
        <div className="lg:col-span-7">
          <GlassCard className="p-5 space-y-4" variant="default">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">3대 대표 시장 지수와의 정밀 비교</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">동일 현금흐름 기준</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/60 text-slate-400 font-bold">
                    <th className="pb-2">전략 / 지수</th>
                    <th className="pb-2 text-right">최종 자산</th>
                    <th className="pb-2 text-right">연평균 복리(CAGR)</th>
                    <th className="pb-2 text-right">최대낙폭(MDD)</th>
                    <th className="pb-2 text-right">초과 성과(Alpha)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  <tr className="bg-blue-50/50 font-black text-blue-900">
                    <td className="py-2.5">👑 나의 포트폴리오</td>
                    <td className="py-2.5 text-right text-blue-700">{formatKRW(metrics.finalPortfolioValue)}</td>
                    <td className="py-2.5 text-right">{formatPercent(metrics.twrCAGR)}</td>
                    <td className="py-2.5 text-right text-rose-600">-{formatPercent(metrics.maxDrawdownMDD)}</td>
                    <td className="py-2.5 text-right text-blue-600">-</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">🇰🇷 코스피 지수 (KOSPI)</td>
                    <td className="py-2.5 text-right">{formatKRW(metrics.benchmarkComparison.kospiFinalValue)}</td>
                    <td className="py-2.5 text-right">{formatPercent(metrics.benchmarkComparison.kospiTwrCAGR)}</td>
                    <td className="py-2.5 text-right text-rose-600">-{formatPercent(metrics.benchmarkComparison.kospiMDD)}</td>
                    <td className={`py-2.5 text-right font-bold ${getReturnColor(metrics.twrCAGR - metrics.benchmarkComparison.kospiTwrCAGR)}`}>
                      {formatPercent(metrics.twrCAGR - metrics.benchmarkComparison.kospiTwrCAGR)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5">🇺🇸 S&P 500 (원화 환산)</td>
                    <td className="py-2.5 text-right">{formatKRW(metrics.benchmarkComparison.sp500FinalValue)}</td>
                    <td className="py-2.5 text-right">{formatPercent(metrics.benchmarkComparison.sp500TwrCAGR)}</td>
                    <td className="py-2.5 text-right text-rose-600">-{formatPercent(metrics.benchmarkComparison.sp500MDD)}</td>
                    <td className={`py-2.5 text-right font-bold ${getReturnColor(metrics.twrCAGR - metrics.benchmarkComparison.sp500TwrCAGR)}`}>
                      {formatPercent(metrics.twrCAGR - metrics.benchmarkComparison.sp500TwrCAGR)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5">⚖️ 50:50 한·미 혼합 리밸런싱</td>
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

            <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
              💡 모든 벤치마크는 사용자 포트폴리오와 100% 동일한 초기 투자금({formatKRW(state.settings.initialCashKRW)})과 매년 연초 추가 납입금({formatKRW(state.settings.annualContributionKRW)}), 동일 거래비용({state.settings.feeRate * 100}%) 및 환율을 적용하여 산출된 가상 패시브 포트폴리오입니다.
            </div>
          </GlassCard>
        </div>

        {/* 5-Dimensional Quant Score Card (5 Cols) */}
        <div className="lg:col-span-5">
          <GlassCard className="p-5 space-y-4" variant="default">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                <h3 className="font-extrabold text-slate-800 text-sm">5대 장기투자 역량 점수</h3>
              </div>
              <span className="text-xs font-black text-amber-600">
                종합 {metrics.scoreAndPersona.overallAlphaScore}점
              </span>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span>분산투자 점수</span>
                  <span className="text-blue-600">{metrics.scoreAndPersona.diversificationScore}점</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${metrics.scoreAndPersona.diversificationScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span>장기 규칙 준수 점수</span>
                  <span className="text-indigo-600">{metrics.scoreAndPersona.disciplineScore}점</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${metrics.scoreAndPersona.disciplineScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span>하락장 방어력 점수</span>
                  <span className="text-emerald-600">{metrics.scoreAndPersona.crisisResilienceScore}점</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${metrics.scoreAndPersona.crisisResilienceScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span>거래비용 효율 점수</span>
                  <span className="text-amber-600">{metrics.scoreAndPersona.costEfficiencyScore}점</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full transition-all" style={{ width: `${metrics.scoreAndPersona.costEfficiencyScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span>시장 대비 초과수익(Alpha) 점수</span>
                  <span className="text-rose-600">{metrics.scoreAndPersona.overallAlphaScore}점</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-600 rounded-full transition-all" style={{ width: `${metrics.scoreAndPersona.overallAlphaScore}%` }} />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Interactive Charts Hub (8 Visuals) */}
      <GlassCard className="p-5 space-y-4" variant="default">
        {/* Chart Nav Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveChartTab('wealth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                activeChartTab === 'wealth' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. 총 자산 가치 비교
            </button>
            <button
              onClick={() => setActiveChartTab('twr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                activeChartTab === 'twr' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. 100 기준 TWR 복리 성장
            </button>
            <button
              onClick={() => setActiveChartTab('returns')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                activeChartTab === 'returns' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. 연도별 수익률 추이
            </button>
            <button
              onClick={() => setActiveChartTab('drawdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                activeChartTab === 'drawdown' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. 낙폭 (MDD) 곡선
            </button>
            <button
              onClick={() => setActiveChartTab('allocation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                activeChartTab === 'allocation' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5. 한·미 자산 배분 & 업종
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <TableIcon size={14} /> 연도별 상세 표
            </button>
            <button
              onClick={() => setShowTradeLogsModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <FileText size={14} /> 거래내역 로그 ({state.tradeLogs.length})
            </button>
          </div>
        </div>

        {/* Visual Content Display */}
        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60 min-h-[320px] flex flex-col justify-center">
          {activeChartTab === 'wealth' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>실제 입금 현금흐름을 반영한 최종 자산가치 성장 비교</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1 text-blue-600">● 내 포트폴리오</span>
                  <span className="flex items-center gap-1 text-indigo-600">● 코스피</span>
                  <span className="flex items-center gap-1 text-emerald-600">● S&P 500(원화)</span>
                </div>
              </div>

              {/* Bar Chart Representation of History */}
              <div className="h-64 flex items-end gap-1.5 overflow-x-auto pt-6 pb-2 px-2">
                {state.history.map(h => {
                  const maxVal = Math.max(...state.history.map(item => item.endTotalAssetsKRW), 1);
                  const heightPct = Math.max(5, (h.endTotalAssetsKRW / maxVal) * 100);

                  return (
                    <div key={h.year} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative">
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-lg z-20 whitespace-nowrap pointer-events-none shadow-lg">
                        <span className="font-bold">{h.year}년말: {formatKRW(h.endTotalAssetsKRW)}</span>
                        <span>수익률: {formatPercent(h.annualReturn)}</span>
                        <span>코스피: {formatPercent(h.benchmarkReturns.kospi)}</span>
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-md transition-all group-hover:from-blue-600 group-hover:to-blue-400 shadow-sm"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[9px] text-slate-400 font-mono -rotate-45 sm:rotate-0 mt-1">
                        {h.year.toString().slice(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeChartTab === 'twr' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>100으로 시작한 시간가중 순수 전략 복리 성장 지수</span>
                <span className="text-blue-600 font-black">최종 TWR: {formatPercent(metrics.twr)}</span>
              </div>
              <div className="h-64 flex items-end gap-1.5 overflow-x-auto pt-6 pb-2 px-2">
                {state.history.map(h => {
                  const maxTwr = Math.max(...state.history.map(item => item.twrIndexLevel), 100);
                  const heightPct = Math.max(5, (h.twrIndexLevel / maxTwr) * 100);

                  return (
                    <div key={h.year} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative">
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-lg z-20 whitespace-nowrap pointer-events-none shadow-lg">
                        <span className="font-bold">{h.year}년 TWR 지수: {h.twrIndexLevel.toFixed(1)}</span>
                        <span>당해 수익률: {formatPercent(h.annualReturn)}</span>
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-md transition-all group-hover:from-indigo-600 group-hover:to-indigo-400 shadow-sm"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[9px] text-slate-400 font-mono mt-1">{h.year.toString().slice(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeChartTab === 'returns' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>연도별 포트폴리오 수익률 막대 그래프</span>
                <span className="text-slate-500 font-semibold">최고: {metrics.bestYear.year}년 ({formatPercent(metrics.bestYear.returnRate)}) / 최저: {metrics.worstYear.year}년 ({formatPercent(metrics.worstYear.returnRate)})</span>
              </div>
              <div className="h-64 flex items-center gap-1.5 overflow-x-auto py-2 px-2 border-b border-t border-slate-200 relative">
                {state.history.map(h => {
                  const ret = h.annualReturn;
                  const absRet = Math.min(1.0, Math.abs(ret));
                  const heightPct = Math.max(4, absRet * 100);

                  return (
                    <div key={h.year} className="flex-1 min-w-[20px] h-full flex flex-col items-center justify-center group relative">
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-lg z-20 whitespace-nowrap pointer-events-none shadow-lg">
                        <span className="font-bold">{h.year}년: {formatPercent(ret)}</span>
                        <span>코스피: {formatPercent(h.benchmarkReturns.kospi)}</span>
                        <span>S&P 500: {formatPercent(h.benchmarkReturns.sp500KRW)}</span>
                      </div>
                      <div
                        className={`w-full rounded-md shadow-sm transition-all ${
                          ret >= 0 ? 'bg-rose-500 hover:bg-rose-400 self-end mb-auto' : 'bg-blue-500 hover:bg-blue-400 self-start mt-auto'
                        }`}
                        style={{ height: `${heightPct / 2}%` }}
                      />
                      <span className="text-[8px] text-slate-400 font-mono absolute bottom-0">{h.year.toString().slice(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeChartTab === 'drawdown' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>역사적 Drawdown (MDD) 하락폭 곡선</span>
                <span className="text-rose-600 font-black">최대 낙폭: -{formatPercent(metrics.maxDrawdownMDD)}</span>
              </div>
              <div className="h-64 flex items-start gap-1.5 overflow-x-auto pt-2 pb-6 px-2">
                {state.history.map(h => {
                  const pastTwr = state.history.filter(item => item.year <= h.year).map(item => item.twrIndexLevel);
                  const peak = Math.max(100, ...pastTwr);
                  const dd = (peak - h.twrIndexLevel) / peak;
                  const heightPct = Math.max(2, dd * 100);

                  return (
                    <div key={h.year} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative">
                      <div className="absolute top-full mt-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-lg z-20 whitespace-nowrap pointer-events-none shadow-lg">
                        <span className="font-bold">{h.year}년 낙폭: -{(dd * 100).toFixed(1)}%</span>
                      </div>
                      <div
                        className="w-full bg-gradient-to-b from-rose-500 to-rose-700 rounded-b-md transition-all shadow-sm"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[9px] text-slate-400 font-mono">{h.year.toString().slice(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeChartTab === 'allocation' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-2">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <PieChartIcon size={16} className="text-blue-600" />
                  최종 국가별 자산 배분 비중
                </h4>
                <div className="space-y-2 text-xs font-bold">
                  <div className="flex justify-between">
                    <span>🇰🇷 한국 주식 비중</span>
                    <span className="text-blue-600">{formatPercent(metrics.finalAllocation.krWeight)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${metrics.finalAllocation.krWeight * 100}%` }} />
                  </div>

                  <div className="flex justify-between pt-1">
                    <span>🇺🇸 미국 주식 비중</span>
                    <span className="text-indigo-600">{formatPercent(metrics.finalAllocation.usWeight)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${metrics.finalAllocation.usWeight * 100}%` }} />
                  </div>

                  <div className="flex justify-between pt-1">
                    <span>💵 매매 대기 현금 비중</span>
                    <span className="text-emerald-600">{formatPercent(metrics.finalAllocation.cashWeight)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.finalAllocation.cashWeight * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Layers size={16} className="text-indigo-600" />
                  거래비용 및 환율 효과 결산
                </h4>
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">총 매매 거래 횟수</span>
                    <span className="font-extrabold text-slate-800">{metrics.totalTradesCount}회</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">누적 지급 거래비용</span>
                    <span className="font-extrabold text-rose-600">-{formatWonNumber(metrics.totalTradingFeesKRW)}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">환율 변동 누적 기여손익</span>
                    <span className={`font-extrabold ${metrics.totalFxGainLossKRW >= 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                      {metrics.totalFxGainLossKRW >= 0 ? '+' : ''}{formatWonNumber(metrics.totalFxGainLossKRW)}원
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">최대 비중 단일 종목</span>
                    <span className="font-black text-slate-800">
                      {metrics.finalAllocation.maxStockWeight.nameKo} ({formatPercent(metrics.finalAllocation.maxStockWeight.weight)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Historical Annual Table Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-4xl p-6 relative animate-fade-in-up border-white/80 max-h-[90vh] flex flex-col" variant="strong">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
              <TableIcon size={20} className="text-blue-600" />
              45년 연도별 전체 운용 상세 표
            </h3>

            <div className="overflow-auto flex-grow text-xs pr-1">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white border-b border-slate-200 shadow-sm font-black text-slate-500">
                  <tr>
                    <th className="py-2.5 px-2">연도</th>
                    <th className="py-2.5 px-2 text-right">기초자산</th>
                    <th className="py-2.5 px-2 text-right">추가납입</th>
                    <th className="py-2.5 px-2 text-right">기말자산</th>
                    <th className="py-2.5 px-2 text-right">수익률</th>
                    <th className="py-2.5 px-2 text-right">TWR지수</th>
                    <th className="py-2.5 px-2 text-right">코스피</th>
                    <th className="py-2.5 px-2 text-right">S&P500(원화)</th>
                    <th className="py-2.5 px-2 text-right">USD/KRW</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {state.history.map(h => (
                    <tr key={h.year} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-bold">{h.year}년</td>
                      <td className="py-2 px-2 text-right">{formatWonNumber(h.startTotalAssetsKRW)}원</td>
                      <td className="py-2 px-2 text-right text-indigo-600">{formatWonNumber(h.annualDepositKRW)}원</td>
                      <td className="py-2 px-2 text-right font-black text-slate-900">{formatWonNumber(h.endTotalAssetsKRW)}원</td>
                      <td className={`py-2 px-2 text-right font-black ${getReturnColor(h.annualReturn)}`}>
                        {formatPercent(h.annualReturn)}
                      </td>
                      <td className="py-2 px-2 text-right">{h.twrIndexLevel.toFixed(1)}</td>
                      <td className={`py-2 px-2 text-right ${getReturnColor(h.benchmarkReturns.kospi)}`}>
                        {formatPercent(h.benchmarkReturns.kospi)}
                      </td>
                      <td className={`py-2 px-2 text-right ${getReturnColor(h.benchmarkReturns.sp500KRW)}`}>
                        {formatPercent(h.benchmarkReturns.sp500KRW)}
                      </td>
                      <td className="py-2 px-2 text-right">{h.fxRate.toFixed(1)}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full mt-4 py-3 bg-blue-600 text-white font-black rounded-xl text-xs"
            >
              닫기
            </button>
          </GlassCard>
        </div>
      )}

      {/* Trade Logs Modal */}
      {showTradeLogsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-3xl p-6 relative animate-fade-in-up border-white/80 max-h-[85vh] flex flex-col" variant="strong">
            <button
              onClick={() => setShowTradeLogsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              전체 거래 내역 로그 (총 {state.tradeLogs.length}건)
            </h3>

            <div className="overflow-auto flex-grow text-xs pr-1">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white border-b border-slate-200 shadow-sm font-black text-slate-500">
                  <tr>
                    <th className="py-2 px-2">연도</th>
                    <th className="py-2 px-2">종목명</th>
                    <th className="py-2 px-2">구분</th>
                    <th className="py-2 px-2 text-right">수량</th>
                    <th className="py-2 px-2 text-right">거래총액</th>
                    <th className="py-2 px-2 text-right">수수료</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {state.tradeLogs.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-bold">{l.year}년</td>
                      <td className="py-2 px-2 font-black text-slate-800">{l.stockNameKo}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          l.action === 'BUY' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {l.action === 'BUY' ? '매수' : '매도'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">{l.shares.toFixed(4)}주</td>
                      <td className="py-2 px-2 text-right font-bold">{formatWonNumber(l.totalAmountKRW)}원</td>
                      <td className="py-2 px-2 text-right text-rose-600">{formatWonNumber(l.feeKRW)}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowTradeLogsModal(false)}
              className="w-full mt-4 py-3 bg-blue-600 text-white font-black rounded-xl text-xs"
            >
              닫기
            </button>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
