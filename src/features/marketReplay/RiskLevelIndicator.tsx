import React from 'react';
import { ShieldAlert, Clock } from 'lucide-react';
import type { RiskLevel } from '../../types/stockGame';
import { formatKRW, formatPercent } from '../../utils/formatMoney';

interface RiskLevelIndicatorProps {
  riskLevel: RiskLevel;
  drawdown: number;
  lossFromPeakKRW: number;
  monthsUnderwater: number;
  runningPeakKRW?: number;
  className?: string;
}

export const RiskLevelIndicator: React.FC<RiskLevelIndicatorProps> = ({
  riskLevel,
  drawdown,
  lossFromPeakKRW,
  monthsUnderwater,
  className = '',
}) => {
  const getBadgeStyle = () => {
    switch (riskLevel) {
      case 'EXTREME':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          label: '🔥 극단위험 (MDD 40%+)',
        };
      case 'CRISIS':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
          label: '🚨 위기경보 (MDD 30%+)',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          label: '⚠️ 경계 (MDD 20%+)',
        };
      case 'CAUTION':
        return {
          bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          label: '👀 주의 (MDD 10%+)',
        };
      case 'NORMAL':
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: '🟢 정상 (고점 부근)',
        };
    }
  };

  const badge = getBadgeStyle();
  const absDrawdown = Math.abs(drawdown);

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
      riskLevel === 'CRISIS' || riskLevel === 'EXTREME'
        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
        : riskLevel === 'WARNING'
        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
        : 'bg-white border-slate-200 text-slate-800'
    } ${className}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100/80">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <ShieldAlert size={16} className={absDrawdown >= 0.2 ? 'text-rose-600' : 'text-slate-500'} />
          <span>시장 리스크 & 낙폭 상태</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shadow-xs ${badge.bg}`}>
          {badge.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs font-mono">
        <div>
          <span className="text-slate-500 font-sans block text-[10px] font-semibold">고점 대비 낙폭</span>
          <span className={`text-base font-black tracking-tight ${absDrawdown >= 0.2 ? 'text-rose-600' : 'text-slate-800'}`}>
            {absDrawdown > 0.001 ? `-${formatPercent(absDrawdown)}` : '0.0%'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 font-sans block text-[10px] font-semibold">고점 대비 감소액</span>
          <span className="text-sm font-bold text-slate-700 block truncate">
            {lossFromPeakKRW > 0 ? `-${formatKRW(lossFromPeakKRW)}` : '최고점 유지'}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <span className="text-slate-500 font-sans block text-[10px] font-semibold flex items-center gap-1">
            <Clock size={11} /> 고점 미회복 기간
          </span>
          <span className={`text-sm font-bold block ${monthsUnderwater >= 6 ? 'text-rose-600 font-black' : 'text-slate-700'}`}>
            {monthsUnderwater > 0 ? `${monthsUnderwater}개월째 지속` : '신고가 달성'}
          </span>
        </div>
      </div>
    </div>
  );
};
