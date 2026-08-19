import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, PlusCircle, XCircle } from 'lucide-react';

interface AllocationDeltaProps {
  currentWeight: number; // 0 to 1
  targetWeight: number; // 0 to 1
}

export const AllocationDelta: React.FC<AllocationDeltaProps> = ({
  currentWeight = 0,
  targetWeight = 0,
}) => {
  const currPct = Math.round(currentWeight * 100);
  const tgtPct = Math.round(targetWeight * 100);
  const deltaPct = tgtPct - currPct;

  if (currPct === 0 && tgtPct === 0) {
    return (
      <span className="text-[11px] text-slate-400 font-medium">
        현재 0%
      </span>
    );
  }

  if (currPct === 0 && tgtPct > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
        <PlusCircle size={10} />
        <span>신규 {tgtPct}%</span>
      </span>
    );
  }

  if (currPct > 0 && tgtPct === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
        <XCircle size={10} />
        <span>{currPct}% → 0% (전량 매도)</span>
      </span>
    );
  }

  if (deltaPct === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500">
        <Minus size={10} />
        <span>변경 없음 ({currPct}%)</span>
      </span>
    );
  }

  if (deltaPct > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-mono">
        <ArrowUpRight size={11} className="text-blue-600" />
        <span>현재 {currPct}% → 목표 {tgtPct}% (↑ {deltaPct}%p)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-mono">
      <ArrowDownRight size={11} className="text-rose-600" />
      <span>현재 {currPct}% → 목표 {tgtPct}% (↓ {Math.abs(deltaPct)}%p)</span>
    </span>
  );
};
