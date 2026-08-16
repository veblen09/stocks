import React from 'react';
import { formatMoney } from '../utils/formatMoney';
import { RiskBadge } from './RiskBadge';
import { 
  Shield, 
  Landmark, 
  Building2, 
  TrendingUp, 
  FileText, 
  Coins, 
  Sprout, 
  Home, 
  ChevronRight, 
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

export interface MosaicCategoryData {
  id: string; // 'cash' | 'savings' | 'etf' | 'stocks' | 'debt' | 'gold' | 'pension' | 'housing' | 'real_estate'
  title: string;
  subtitle: string;
  assetIds: string[];
  totalValue: number;
  totalChange: number;
  percentage: number;
  expectedReturnText: string;
  riskScore: number;
  colorTheme: 'teal' | 'cyan' | 'blue' | 'purple' | 'slate' | 'amber' | 'emerald' | 'pink' | 'indigo';
  badgeText?: string;
  itemCount?: number;
  isSpecialAction?: boolean; // 청약이나 부동산처럼 특별 액션이 있는 경우
}

interface AssetMosaicTileProps {
  category: MosaicCategoryData;
  onClick: () => void;
}

export const AssetMosaicTile: React.FC<AssetMosaicTileProps> = ({ category, onClick }) => {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'cash': return <Shield size={20} className="text-teal-600" />;
      case 'savings': return <Landmark size={20} className="text-cyan-600" />;
      case 'etf': return <Building2 size={20} className="text-blue-600" />;
      case 'stocks': return <TrendingUp size={20} className="text-purple-600" />;
      case 'debt': return <FileText size={20} className="text-slate-600" />;
      case 'gold': return <Coins size={20} className="text-amber-600" />;
      case 'pension': return <Sprout size={20} className="text-emerald-600" />;
      case 'housing': return <Home size={20} className="text-pink-600" />;
      case 'real_estate': return <Home size={20} className="text-indigo-600" />;
      default: return <Shield size={20} className="text-slate-600" />;
    }
  };

  const getThemeStyles = (theme: string) => {
    switch (theme) {
      case 'teal':
        return {
          bg: 'bg-teal-50/40 hover:bg-teal-50/80 border-teal-100 hover:border-teal-300',
          iconBg: 'bg-teal-100/80 text-teal-700',
          barColor: 'bg-teal-500',
          badgeBg: 'bg-teal-100 text-teal-800',
          accentText: 'text-teal-700'
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-50/40 hover:bg-cyan-50/80 border-cyan-100 hover:border-cyan-300',
          iconBg: 'bg-cyan-100/80 text-cyan-700',
          barColor: 'bg-cyan-500',
          badgeBg: 'bg-cyan-100 text-cyan-800',
          accentText: 'text-cyan-700'
        };
      case 'blue':
        return {
          bg: 'bg-blue-50/40 hover:bg-blue-50/80 border-blue-100 hover:border-blue-300',
          iconBg: 'bg-blue-100/80 text-blue-700',
          barColor: 'bg-blue-500',
          badgeBg: 'bg-blue-100 text-blue-800',
          accentText: 'text-blue-700'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50/50 hover:bg-purple-50/90 border-purple-200/80 hover:border-purple-400 shadow-sm shadow-purple-500/5',
          iconBg: 'bg-purple-100 text-purple-700',
          barColor: 'bg-gradient-to-r from-purple-500 to-indigo-600',
          badgeBg: 'bg-purple-100 text-purple-800 font-extrabold',
          accentText: 'text-purple-700'
        };
      case 'slate':
        return {
          bg: 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200 hover:border-slate-350',
          iconBg: 'bg-slate-200 text-slate-700',
          barColor: 'bg-slate-500',
          badgeBg: 'bg-slate-200 text-slate-800',
          accentText: 'text-slate-700'
        };
      case 'amber':
        return {
          bg: 'bg-amber-50/40 hover:bg-amber-50/80 border-amber-100 hover:border-amber-300',
          iconBg: 'bg-amber-100/80 text-amber-700',
          barColor: 'bg-amber-500',
          badgeBg: 'bg-amber-100 text-amber-800',
          accentText: 'text-amber-700'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-50/40 hover:bg-emerald-50/80 border-emerald-100 hover:border-emerald-300',
          iconBg: 'bg-emerald-100/80 text-emerald-700',
          barColor: 'bg-emerald-500',
          badgeBg: 'bg-emerald-100 text-emerald-800',
          accentText: 'text-emerald-700'
        };
      case 'pink':
        return {
          bg: 'bg-pink-50/40 hover:bg-pink-50/80 border-pink-100 hover:border-pink-300',
          iconBg: 'bg-pink-100/80 text-pink-700',
          barColor: 'bg-pink-500',
          badgeBg: 'bg-pink-100 text-pink-800',
          accentText: 'text-pink-700'
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-50/40 hover:bg-indigo-50/80 border-indigo-100 hover:border-indigo-300',
          iconBg: 'bg-indigo-100/80 text-indigo-700',
          barColor: 'bg-indigo-500',
          badgeBg: 'bg-indigo-100 text-indigo-800',
          accentText: 'text-indigo-700'
        };
      default:
        return {
          bg: 'bg-white hover:bg-slate-50 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-700',
          barColor: 'bg-blue-500',
          badgeBg: 'bg-slate-100 text-slate-700',
          accentText: 'text-slate-700'
        };
    }
  };

  const styles = getThemeStyles(category.colorTheme);
  const plannedTotal = parseFloat((category.totalValue + category.totalChange).toFixed(2));
  const isStocks = category.id === 'stocks';

  return (
    <div
      onClick={onClick}
      className={`group relative p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between select-none ${styles.bg} ${
        isStocks ? 'ring-1 ring-purple-300/60 shadow-md shadow-purple-500/10' : 'hover:shadow-md'
      } hover:-translate-y-0.5`}
    >
      {/* Top Line: Icon, Title, Badges */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105 ${styles.iconBg}`}>
              {getCategoryIcon(category.id)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black text-slate-800 truncate">
                  {category.title}
                </h4>
                {category.badgeText && (
                  <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold leading-none ${styles.badgeBg}`}>
                    {category.badgeText}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {category.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <RiskBadge score={category.riskScore} />
          </div>
        </div>

        {/* Expected return info */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-3">
          <span>기대 수익률: <strong className="text-rose-500 font-extrabold">{category.expectedReturnText}</strong></span>
          {category.itemCount !== undefined && category.itemCount > 0 && (
            <span className="text-slate-500 bg-white/70 px-2 py-0.5 rounded-md border border-slate-100 font-bold">
              {category.itemCount}개 자산 구성
            </span>
          )}
        </div>
      </div>

      {/* Middle: Asset Value Display */}
      <div className="py-2.5 px-3 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-100/90 mb-3 space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] text-slate-400 font-medium">현재 잔액:</span>
          <span className="text-xs sm:text-sm font-black text-slate-800">
            {formatMoney(category.totalValue)}
            <span className="text-[10px] text-slate-400 font-normal ml-1">({category.percentage.toFixed(1)}%)</span>
          </span>
        </div>

        {category.totalChange !== 0 ? (
          <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-slate-150">
            <span className="text-[10px] text-slate-500 font-bold">조정 후 예정:</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${category.totalChange > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                {category.totalChange > 0 ? '+' : ''}{formatMoney(category.totalChange)}
              </span>
              <span className="text-xs font-black text-slate-900">
                &rarr; {formatMoney(plannedTotal)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[10px] text-slate-400">
            <span>이번 배분 변동:</span>
            <span className="font-semibold text-slate-400">0원 (유지)</span>
          </div>
        )}

        {/* Visual Percentage Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${styles.barColor}`} 
            style={{ width: `${Math.min(100, Math.max(category.percentage > 0 ? 3 : 0, category.percentage))}%` }}
          />
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
          {isStocks ? (
            <span className="flex items-center gap-1 text-purple-700 font-black">
              <Sparkles size={12} className="animate-pulse" /> 종목별 세부 비중 설정하기
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <SlidersHorizontal size={12} /> 세부 비중 및 설명 보기
            </span>
          )}
        </span>
        <div className="p-1 rounded-lg bg-white/60 group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400">
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
};
