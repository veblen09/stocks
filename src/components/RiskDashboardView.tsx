import React, { useState } from 'react';
import {
  ShieldAlert,
  TrendingDown,
  Clock,
  PieChart,
  Target,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import type { StockGameState } from '../types/stockGame';
import { formatKRW, formatPercent } from '../utils/formatMoney';
import { calculateRiskLevel, calculateDrawdownPoints, calculateRecoveryMetrics } from '../engine/metricsEngine';
import { STOCKS_BY_ID } from '../engine/returnEngine';
import { getChapterByYear } from '../features/chapters/chapterDefinitions';
import { audioManager } from '../utils/audioManager';

interface RiskDashboardViewProps {
  state: StockGameState;
  onOpenGlossary?: () => void;
}

export const RiskDashboardView: React.FC<RiskDashboardViewProps> = ({
  state,
}) => {
  const { currentYear, cashKRW, holdings, history, settings } = state;

  // Calculate live portfolio values
  let currentHoldingsValue = 0;
  let krHoldingVal = 0;
  let usHoldingVal = 0;
  let maxStockHolding = { canonicalId: '', nameKo: '없음', weight: 0, valueKRW: 0 };

  for (const cid in holdings) {
    const h = holdings[cid];
    if (h.shares > 0 && h.currentValueKRW > 0) {
      currentHoldingsValue += h.currentValueKRW;
      if (cid.startsWith('KR_')) krHoldingVal += h.currentValueKRW;
      else usHoldingVal += h.currentValueKRW;

      const stock = STOCKS_BY_ID[cid];
      if (h.currentValueKRW > maxStockHolding.valueKRW) {
        maxStockHolding = {
          canonicalId: cid,
          nameKo: stock ? stock.nameKo : cid,
          weight: 0,
          valueKRW: h.currentValueKRW,
        };
      }
    }
  }

  const currentTotalValue = cashKRW + currentHoldingsValue;
  if (currentTotalValue > 0) {
    maxStockHolding.weight = maxStockHolding.valueKRW / currentTotalValue;
  }

  const krWeight = currentTotalValue > 0 ? krHoldingVal / currentTotalValue : 0;
  const usWeight = currentTotalValue > 0 ? usHoldingVal / currentTotalValue : 0;
  const cashWeight = currentTotalValue > 0 ? cashKRW / currentTotalValue : 1;

  // Peak Portfolio Value & Drawdown
  let allTimePeakValue = settings.initialCashKRW;
  history.forEach(h => {
    if (h.endTotalAssetsKRW > allTimePeakValue) {
      allTimePeakValue = h.endTotalAssetsKRW;
    }
  });
  if (currentTotalValue > allTimePeakValue) {
    allTimePeakValue = currentTotalValue;
  }

  const lossFromPeak = Math.max(0, allTimePeakValue - currentTotalValue);
  const currentDrawdown = allTimePeakValue > 0 ? (currentTotalValue - allTimePeakValue) / allTimePeakValue : 0;
  const riskLevel = calculateRiskLevel(currentDrawdown);

  // Recovery and Drawdown Metrics
  const drawdownPoints = calculateDrawdownPoints(history, settings.startYear);
  const recoveryMetrics = calculateRecoveryMetrics(history, settings.startYear);

  // Current Chapter Risk Missions
  const currentChapter = getChapterByYear(currentYear);
  const selectedMissions = currentChapter?.suggestedRiskMissions || [];

  // Concentration Scenario Simulator
  const [testDropScenario, setTestDropScenario] = useState<number>(0.20); // 20% drop
  const simulatedPortfolioImpact = maxStockHolding.weight * testDropScenario;

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* 1. Core Risk Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Current Drawdown Card */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          riskLevel === 'EXTREME'
            ? 'bg-rose-100 border-rose-400 text-rose-950'
            : riskLevel === 'CRISIS'
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : riskLevel === 'WARNING'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1">
              <TrendingDown size={14} className="text-rose-600" />
              현재 고점 대비 낙폭
            </span>
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              riskLevel === 'EXTREME'
                ? 'bg-rose-600 text-white animate-pulse'
                : riskLevel === 'CRISIS'
                ? 'bg-rose-600 text-white'
                : riskLevel === 'WARNING'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {riskLevel === 'EXTREME' ? '🔴 극심한 위기' : riskLevel === 'CRISIS' ? '🔴 위기' : riskLevel === 'WARNING' ? '🟠 경계' : '🟢 정상'}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600 block">
              -{formatPercent(Math.abs(currentDrawdown))}
            </span>
            <span className="text-xs font-semibold text-slate-500 block mt-0.5">
              고점 대비 감소액: -{formatKRW(lossFromPeak)}
            </span>
          </div>
        </div>

        {/* All-Time MDD Card */}
        <GlassCard className="p-4 flex flex-col justify-between bg-white border-slate-200" variant="default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">역대 최대낙폭 (MDD)</span>
            <span className="text-[11px] text-slate-400 font-medium">순수 TWR 기준</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-rose-700 block">
              -{formatPercent(recoveryMetrics.maxDrawdown)}
            </span>
            <span className="text-xs text-slate-500 font-medium block mt-0.5">
              역대 최고 자산: {formatKRW(allTimePeakValue)}
            </span>
          </div>
        </GlassCard>

        {/* Underwater Duration */}
        <GlassCard className="p-4 flex flex-col justify-between bg-white border-slate-200" variant="default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Clock size={14} className="text-blue-600" />
              현재 하락 지속기간 (수중)
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 block">
              {drawdownPoints.length > 0 ? drawdownPoints[drawdownPoints.length - 1].underwaterYears : 0}년
            </span>
            <span className="text-xs text-slate-500 font-medium block mt-0.5">
              최장 원금 회복 소요: {recoveryMetrics.underwaterDurationYears || 0}년
            </span>
          </div>
        </GlassCard>

        {/* Asset Concentration Status */}
        <GlassCard className="p-4 flex flex-col justify-between bg-white border-slate-200" variant="default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <PieChart size={14} className="text-purple-600" />
              최대 단일종목 비중
            </span>
            {maxStockHolding.weight > 0.35 && (
              <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                집중 위험
              </span>
            )}
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 block">
              {formatPercent(maxStockHolding.weight)}
            </span>
            <span className="text-xs text-purple-700 font-bold block mt-0.5 truncate">
              {maxStockHolding.nameKo} ({formatKRW(maxStockHolding.valueKRW)})
            </span>
          </div>
        </GlassCard>
      </div>

      {/* 2. Concentration Stress Test Simulator */}
      <GlassCard className="p-5 space-y-4 bg-white border-slate-200" variant="default">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              포트폴리오 집중위험 민감도 시뮬레이션
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">가상 시나리오 분석 (미래 예측 아님)</span>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-700 block">
                최대 보유 종목: <strong className="text-blue-700">{maxStockHolding.nameKo}</strong> (비중 {formatPercent(maxStockHolding.weight)})
              </span>
              <span className="text-[11px] text-slate-500">
                특정 단일 종목이 급락할 경우 전체 자산에 미치는 영향을 미리 점검합니다.
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 mr-1">가상 하락률:</span>
              {[0.10, 0.20, 0.30].map(sc => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => { audioManager.playUiSound('keyTap'); setTestDropScenario(sc); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                    testDropScenario === sc
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  -{Math.round(sc * 100)}%
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-rose-200 text-xs flex items-center justify-between font-mono">
            <span className="text-slate-700 font-sans">
              ⚠️ <strong className="text-slate-900">{maxStockHolding.nameKo}</strong> 종목이 <strong>-{Math.round(testDropScenario * 100)}%</strong> 하락할 경우:
            </span>
            <span className="font-extrabold text-rose-600 text-sm">
              전체 포트폴리오 약 -{formatPercent(simulatedPortfolioImpact)} 충격
            </span>
          </div>
        </div>
      </GlassCard>

      {/* 3. Current Chapter Survival Missions Status */}
      {currentChapter && (
        <GlassCard className="p-5 space-y-4 bg-white border-slate-200" variant="default">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Chapter {currentChapter.chapterNumber}: {currentChapter.titleKo} 생존 미션
              </h3>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              5개년 리스크 통제 목표
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedMissions.map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl mt-0.5">
                  <Target size={16} />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">{m.titleKo}</span>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                    {m.descriptionKo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 4. Asset & Currency Allocation Breakdown */}
      <GlassCard className="p-5 space-y-4 bg-white border-slate-200" variant="default">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900">
            국가 및 통화 분산 현황
          </h3>
          <span className="text-xs text-slate-500 font-mono">총 {formatKRW(currentTotalValue)}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200">
            <span className="text-blue-700 font-sans block font-semibold">🇰🇷 한국 주식 비중</span>
            <span className="text-lg font-black text-blue-950 mt-1 block">{formatPercent(krWeight)}</span>
            <span className="text-[11px] text-blue-600 block">{formatKRW(krHoldingVal)}</span>
          </div>

          <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200">
            <span className="text-purple-700 font-sans block font-semibold">🇺🇸 미국 주식 (달러) 비중</span>
            <span className="text-lg font-black text-purple-950 mt-1 block">{formatPercent(usWeight)}</span>
            <span className="text-[11px] text-purple-600 block">{formatKRW(usHoldingVal)}</span>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
            <span className="text-emerald-700 font-sans block font-semibold">💵 안전마진 현금 비중</span>
            <span className="text-lg font-black text-emerald-950 mt-1 block">{formatPercent(cashWeight)}</span>
            <span className="text-[11px] text-emerald-600 block">{formatKRW(cashKRW)}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
