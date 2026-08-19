import React, { useState } from 'react';
import { AlertTriangle, Shield, RefreshCw, DollarSign, Edit3, Newspaper, CheckCircle } from 'lucide-react';
import type { HistoricalCrisisEvent, CrisisDecisionAction, StockGameState } from '../types/stockGame';
import { formatKRW, formatPercent } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';
import { calculateRiskLevel } from '../engine/metricsEngine';
import { getMonthlyStockPriceKRW } from '../features/marketReplay/monthlyPortfolioEngine';

interface CrisisDecisionModalProps {
  isOpen: boolean;
  crisisEvent: HistoricalCrisisEvent | null;
  state: StockGameState;
  onExecute: (action: CrisisDecisionAction, options?: { targetCashWeight?: number; customTargetWeights?: { canonicalId: string; weight: number }[]; rationale?: string }) => void;
  onViewNews: (newsIds: string[]) => void;
}

export const CrisisDecisionModal: React.FC<CrisisDecisionModalProps> = ({
  isOpen,
  crisisEvent,
  state,
  onExecute,
  onViewNews,
}) => {
  if (!isOpen || !crisisEvent) return null;

  const { cashKRW, holdings, history } = state;

  // Calculate current portfolio value and allocation at the specific crisis month
  let holdingsValue = 0;
  let krHoldingVal = 0;
  let usHoldingVal = 0;

  for (const cid in holdings) {
    const h = holdings[cid];
    if (h.shares <= 0) continue;
    const pKRW = getMonthlyStockPriceKRW(cid, crisisEvent.year, crisisEvent.month);
    const stockVal = h.shares * pKRW;
    holdingsValue += stockVal;
    if (cid.startsWith('KR_')) krHoldingVal += stockVal;
    else usHoldingVal += stockVal;
  }

  const totalPortfolioValue = cashKRW + holdingsValue;
  const krWeight = totalPortfolioValue > 0 ? krHoldingVal / totalPortfolioValue : 0;
  const usWeight = totalPortfolioValue > 0 ? usHoldingVal / totalPortfolioValue : 0;
  const cashWeight = totalPortfolioValue > 0 ? cashKRW / totalPortfolioValue : 1;

  // Peak and Drawdown
  let peakValue = totalPortfolioValue;
  history.forEach(h => {
    if (h.endTotalAssetsKRW > peakValue) peakValue = h.endTotalAssetsKRW;
  });
  const currentDrawdown = peakValue > 0 ? (totalPortfolioValue - peakValue) / peakValue : 0;
  const riskLevel = calculateRiskLevel(currentDrawdown);
  const lossFromPeak = Math.max(0, peakValue - totalPortfolioValue);
  const absDrawdown = Math.abs(currentDrawdown);

  const [selectedAction, setSelectedAction] = useState<CrisisDecisionAction>('HOLD');
  const [targetCashPercent, setTargetCashPercent] = useState<number>(30);
  const [rationale, setRationale] = useState<string>('');

  const handleConfirmAction = () => {
    audioManager.playUiSound('confirm');
    onExecute(selectedAction, {
      targetCashWeight: selectedAction === 'RAISE_CASH' ? targetCashPercent / 100 : undefined,
      rationale: rationale.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="max-w-2xl w-full my-6 bg-white rounded-3xl shadow-2xl border-2 border-rose-400 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 text-white flex items-start justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl animate-pulse">
              <AlertTriangle size={24} className="text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  🚨 역사적 시장 위기 발생
                </span>
                <span className="text-xs font-mono font-bold text-amber-200">
                  {crisisEvent.year}년 {crisisEvent.month}월
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                {crisisEvent.titleKo}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Situation & Drawdown Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block">현재 평가자산</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {formatKRW(totalPortfolioValue)}
              </span>
              <span className="text-xs text-slate-500 block font-medium mt-0.5">
                직전 고점: {formatKRW(peakValue)}
              </span>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
              <span className="text-xs font-bold text-rose-800 block">고점 대비 낙폭</span>
              <span className="text-lg font-black text-rose-700 font-mono">
                {absDrawdown > 0.0001 ? `-${(absDrawdown * 100).toFixed(2)}%` : '0.00%'}
              </span>
              <span className="text-xs text-rose-600 font-semibold block mt-0.5">
                감소액: {lossFromPeak > 0 ? `-${formatKRW(lossFromPeak)}` : '0원'}
              </span>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-xs font-bold text-amber-800 block">시장 위험 단계</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-black text-amber-900">
                  {riskLevel === 'EXTREME' ? '🔴 극심한 위기' : riskLevel === 'CRISIS' ? '🔴 위기' : riskLevel === 'WARNING' ? '🟠 경계' : '🟡 주의'}
                </span>
              </div>
              <span className="text-xs text-amber-700 font-medium block mt-0.5">
                미래 정보 차단 적용 중
              </span>
            </div>
          </div>

          {/* Known Historical Situation (Strictly Verified, No Spoilers) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800">
                📌 {crisisEvent.year}년 {crisisEvent.month}월 당시 공개된 시장 상황
              </span>
              <button
                type="button"
                onClick={() => onViewNews(crisisEvent.knownInformationNewsIds)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 rounded-xl border border-blue-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Newspaper size={13} />
                <span>당시 보도 뉴스 보기</span>
              </button>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed font-medium">
              {crisisEvent.situationSummaryKo.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Current Asset Allocation */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
              <span>현재 나의 자산 배분 비중</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-blue-700 font-sans block text-[11px]">🇰🇷 한국 주식</span>
                <span className="font-bold text-blue-900">{formatPercent(krWeight)}</span>
              </div>
              <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
                <span className="text-purple-700 font-sans block text-[11px]">🇺🇸 미국 주식</span>
                <span className="font-bold text-purple-900">{formatPercent(usWeight)}</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-emerald-700 font-sans block text-[11px]">💵 보유 현금</span>
                <span className="font-bold text-emerald-900">{formatPercent(cashWeight)}</span>
              </div>
            </div>
          </div>

          {/* Action Choice Selection */}
          <div className="space-y-2.5">
            <span className="text-xs font-extrabold text-slate-800 block">
              지금 어떻게 대응하시겠습니까? (선택한 원칙대로 즉시 집행됩니다)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: HOLD */}
              <button
                type="button"
                onClick={() => { audioManager.playUiSound('keyTap'); setSelectedAction('HOLD'); }}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  selectedAction === 'HOLD'
                    ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${selectedAction === 'HOLD' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Shield size={18} />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">기존 투자 원칙 유지</span>
                  <span className="text-[11px] text-slate-500 font-medium">추가 매매 없이 사전 설정한 포트폴리오를 그대로 보유합니다 (거래비용 0원).</span>
                </div>
              </button>

              {/* Option 2: REBALANCE */}
              <button
                type="button"
                onClick={() => { audioManager.playUiSound('keyTap'); setSelectedAction('REBALANCE'); }}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  selectedAction === 'REBALANCE'
                    ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${selectedAction === 'REBALANCE' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <RefreshCw size={18} />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">목표 비중으로 리밸런싱</span>
                  <span className="text-[11px] text-slate-500 font-medium">하락으로 변동된 자산 비중을 원래 목표비율로 재조정합니다 (정규 수수료 적용).</span>
                </div>
              </button>

              {/* Option 3: RAISE_CASH */}
              <button
                type="button"
                onClick={() => { audioManager.playUiSound('keyTap'); setSelectedAction('RAISE_CASH'); }}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  selectedAction === 'RAISE_CASH'
                    ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${selectedAction === 'RAISE_CASH' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <DollarSign size={18} />
                </div>
                <div className="flex-1">
                  <span className="font-extrabold text-xs text-slate-900 block">현금 비중 확대</span>
                  <span className="text-[11px] text-slate-500 font-medium">주식을 일부 매도하여 안전마진 현금 비중을 늘립니다.</span>
                </div>
              </button>

              {/* Option 4: CUSTOM */}
              <button
                type="button"
                onClick={() => { audioManager.playUiSound('keyTap'); setSelectedAction('CUSTOM'); }}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  selectedAction === 'CUSTOM'
                    ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${selectedAction === 'CUSTOM' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">직접 자산 배분 수정</span>
                  <span className="text-[11px] text-slate-500 font-medium">현재 보유 종목의 비중을 직접 조정합니다.</span>
                </div>
              </button>
            </div>

            {/* Cash Weight Target Selector if RAISE_CASH */}
            {selectedAction === 'RAISE_CASH' && (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 animate-fade-in flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-900">목표 현금 비중 선택:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[20, 30, 40, 50].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => { audioManager.playUiSound('keyTap'); setTargetCashPercent(pct); }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                        targetCashPercent === pct
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Rationale input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">위기 대응 논리 및 메모 (선택사항, 연말 회고에 기록)</label>
              <input
                type="text"
                value={rationale}
                onChange={e => setRationale(e.target.value)}
                placeholder="예: 변동성은 크지만 사전 설정한 비중을 유지하며 원칙을 지킨다."
                className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            {state.playMode === 'REAL' ? '🔒 실전 모드: 결정 확정 후 번복할 수 없습니다.' : '🟢 연습 모드: 이후 재실험 가능'}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleConfirmAction}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:translate-y-0.5 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle size={16} />
              <span>결정 확정 및 위기 진행</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
