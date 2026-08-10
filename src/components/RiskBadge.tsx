import React from 'react';

interface RiskBadgeProps {
  score: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score }) => {
  if (score <= 2) {
    return (
      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100/50 select-none">
        낮음
      </span>
    );
  }
  if (score <= 5) {
    return (
      <span className="bg-sky-50 text-sky-600 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-100/50 select-none">
        중간
      </span>
    );
  }
  if (score <= 8) {
    return (
      <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-100/50 select-none">
        높음
      </span>
    );
  }
  return (
    <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-100/50 select-none">
      매우 높음
    </span>
  );
};
