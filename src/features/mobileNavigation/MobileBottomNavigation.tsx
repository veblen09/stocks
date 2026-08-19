import React from 'react';
import { LayoutGrid, PieChart, Newspaper, FastForward } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';

export type MobileTab = 'MARKET' | 'PORTFOLIO' | 'NEWS' | 'PROGRESS';

interface MobileBottomNavigationProps {
  activeTab: MobileTab;
  newsCount: number;
  hasChangedTargets: boolean;
  onTabChange: (tab: MobileTab) => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeTab,
  newsCount = 0,
  hasChangedTargets = false,
  onTabChange,
}) => {
  const tabs = [
    { id: 'MARKET' as MobileTab, label: '시장', icon: LayoutGrid },
    { id: 'PORTFOLIO' as MobileTab, label: '포트폴리오', icon: PieChart, badge: hasChangedTargets ? '초안' : undefined },
    { id: 'NEWS' as MobileTab, label: '뉴스', icon: Newspaper, count: newsCount > 0 ? newsCount : undefined },
    { id: 'PROGRESS' as MobileTab, label: '진행', icon: FastForward },
  ];

  const handleSelectTab = (tab: MobileTab) => {
    audioManager.playUiSound('tab');
    onTabChange(tab);
  };

  return (
    <nav
      role="navigation"
      aria-label="모바일 주요 탐색"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 safe-bottom shadow-lg"
    >
      <div className="grid grid-cols-4 gap-1 text-center">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTab(t.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer relative ${
                isActive
                  ? 'text-blue-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                {t.badge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-blue-600 text-white text-[8px] font-bold rounded-full">
                    {t.badge}
                  </span>
                )}
                {t.count && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-amber-500 text-white text-[8px] font-bold rounded-full">
                    {t.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
