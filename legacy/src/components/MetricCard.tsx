import React from 'react';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
  tone?: 'blue' | 'green' | 'gold' | 'red' | 'slate';
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  tone = 'blue',
  className = '',
  onClick,
}) => {
  const toneStyles = {
    blue: {
      bg: 'bg-blue-50/40 border-blue-100/50 hover:bg-blue-50/70',
      iconBg: 'bg-blue-500/10 text-blue-600',
    },
    green: {
      bg: 'bg-emerald-50/40 border-emerald-100/50 hover:bg-emerald-50/70',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
    },
    gold: {
      bg: 'bg-amber-50/40 border-amber-100/50 hover:bg-amber-50/70',
      iconBg: 'bg-amber-500/10 text-amber-600',
    },
    red: {
      bg: 'bg-rose-50/40 border-rose-100/50 hover:bg-rose-50/70',
      iconBg: 'bg-rose-500/10 text-rose-600',
    },
    slate: {
      bg: 'bg-slate-50/40 border-slate-200/50 hover:bg-slate-50/70',
      iconBg: 'bg-slate-500/10 text-slate-600',
    },
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white/85 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100/80 p-5 flex items-start justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${toneStyles[tone].bg} ${className} ${onClick ? 'cursor-pointer select-none' : ''}`}
    >
      <div className="flex items-start gap-4 min-w-0 w-full">
        {icon && (
          <div className={`p-3 rounded-xl flex-shrink-0 ${toneStyles[tone].iconBg}`}>
            {icon}
          </div>
        )}
        <div className="min-w-0 w-full">
          <div className="text-xs font-semibold text-slate-400 truncate">{label}</div>
          <div className="text-xl font-bold text-slate-800 mt-1 select-text">{value}</div>
          {subValue && (
            <div className="text-[10px] text-slate-400 mt-1 select-text">
              {subValue}
            </div>
          )}
          {trend && (
            <div className="mt-2 w-full">
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
