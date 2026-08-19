import React from 'react';
import { Award, CheckCircle2, Lock, X, Shield, Search, FileText, Layers, PieChart, DollarSign, Anchor, Globe, Scale, BarChart2 } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { PROCESS_ACHIEVEMENTS } from './achievementDefinitions';


interface AchievementGalleryModalProps {
  isOpen: boolean;
  unlockedAchievementIds: string[];
  onClose: () => void;
}

export const AchievementGalleryModal: React.FC<AchievementGalleryModalProps> = ({
  isOpen,
  unlockedAchievementIds = [],
  onClose,
}) => {
  if (!isOpen) return null;

  const unlockedSet = new Set(unlockedAchievementIds);
  const unlockedCount = unlockedAchievementIds.length;
  const totalCount = PROCESS_ACHIEVEMENTS.length;

  const renderIcon = (iconName: string, isUnlocked: boolean) => {
    const props = { size: 18, className: isUnlocked ? 'text-amber-500' : 'text-slate-400' };
    switch (iconName) {
      case 'FileText': return <FileText {...props} />;
      case 'Search': return <Search {...props} />;
      case 'Shield': return <Shield {...props} />;
      case 'Layers': return <Layers {...props} />;
      case 'PieChart': return <PieChart {...props} />;
      case 'DollarSign': return <DollarSign {...props} />;
      case 'Anchor': return <Anchor {...props} />;
      case 'Globe': return <Globe {...props} />;
      case 'Scale': return <Scale {...props} />;
      case 'BarChart2': return <BarChart2 {...props} />;
      default: return <Award {...props} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-gallery-title"
    >
      <GlassCard
        className="w-full max-w-2xl max-h-[90vh] bg-white border-slate-200 p-6 sm:p-7 shadow-2xl flex flex-col space-y-4 text-slate-800 overflow-y-auto"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
              <Award size={24} />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                과정 중심 투자 업적 ({unlockedCount}/{totalCount})
              </span>
              <h2 id="achievement-gallery-title" className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                합리적 투자 과정 보상 업적
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">업적 달성률</span>
            <span className="text-blue-700 font-mono">{Math.round((unlockedCount / totalCount) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {PROCESS_ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlockedSet.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                  isUnlocked
                    ? 'bg-amber-50/50 border-amber-300 shadow-xs ring-1 ring-amber-400/20'
                    : 'bg-slate-50/60 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl border ${isUnlocked ? 'bg-white border-amber-200' : 'bg-slate-100 border-slate-200'}`}>
                      {renderIcon(ach.iconName, isUnlocked)}
                    </div>
                    <span className="font-bold text-slate-900">{ach.nameKo}</span>
                  </div>
                  {isUnlocked ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-0.5">
                      <CheckCircle2 size={10} /> 획득
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-0.5">
                      <Lock size={10} /> 미달성
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-tight">
                  {ach.descriptionKo}
                </p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <strong>조건</strong>: {ach.requirementKo}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs cursor-pointer"
          >
            닫기
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
