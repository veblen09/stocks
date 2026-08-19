import React, { useState } from 'react';
import { BookOpen, X, CheckCircle2, Calendar } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import type { CompanyEncyclopediaEntry } from '../../types/encyclopedia';
import { audioManager } from '../../utils/audioManager';

interface CompanyEncyclopediaModalProps {
  isOpen: boolean;
  entries: Record<string, CompanyEncyclopediaEntry>;
  currentYear: number;
  onOpenCompanyDetail?: (canonicalId: string) => void;
  onClose: () => void;
}

export const CompanyEncyclopediaModal: React.FC<CompanyEncyclopediaModalProps> = ({
  isOpen,
  entries,
  currentYear,
  onOpenCompanyDetail,
  onClose,
}) => {
  const [filterMarket, setFilterMarket] = useState<'ALL' | 'KR' | 'US'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const entryList = Object.values(entries).filter(
    e => e.unlockedYear <= currentYear
  );

  const filteredEntries = entryList.filter(e => {
    if (filterMarket === 'KR' && e.market !== 'KR') return false;
    if (filterMarket === 'US' && e.market !== 'US') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.companyNameAtListing.toLowerCase().includes(q) ||
        (e.currentName && e.currentName.toLowerCase().includes(q)) ||
        e.tickerAtListing.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="encyclopedia-title"
    >
      <GlassCard
        className="w-full max-w-3xl max-h-[90vh] bg-white border-slate-200 p-6 sm:p-7 shadow-2xl flex flex-col space-y-4 text-slate-800 overflow-y-auto"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <BookOpen size={24} />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                상장 기업 도감 ({entryList.length}개사 해금)
              </span>
              <h2 id="encyclopedia-title" className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                신규 상장 역사 아카이브 도감
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

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['ALL', 'KR', 'US'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  audioManager.playUiSound('tab');
                  setFilterMarket(m);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  filterMarket === m
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'ALL' ? '전체' : m === 'KR' ? '🇰🇷 한국 기업' : '🇺🇸 미국 기업'}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="상장 당시 사명 또는 티커 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-full sm:w-60"
          />
        </div>

        {/* Entries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {filteredEntries.map(entry => {
            const isKR = entry.market === 'KR';
            return (
              <div
                key={entry.canonicalCompanyId}
                onClick={() => {
                  if (onOpenCompanyDetail) {
                    audioManager.playUiSound('tileOpen');
                    onOpenCompanyDetail(entry.canonicalCompanyId);
                  }
                }}
                className="p-4 bg-white hover:bg-indigo-50/40 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all space-y-2 cursor-pointer shadow-xs group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          isKR ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {isKR ? '🇰🇷 한국' : '🇺🇸 미국'}
                      </span>
                      <span className="font-mono font-semibold text-slate-500 text-[11px]">
                        {entry.tickerAtListing}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 group-hover:text-indigo-600 transition">
                      {entry.companyNameAtListing}
                      {entry.currentName && entry.currentName !== entry.companyNameAtListing && (
                        <span className="text-slate-400 font-normal text-xs ml-1">
                          (현 {entry.currentName})
                        </span>
                      )}
                    </h3>
                  </div>

                  {entry.isInvested && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 size={10} /> 투자 이력
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-relaxed line-clamp-2">
                  {entry.businessAtListing}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    상장연도: <strong className="text-slate-700 font-mono">{entry.unlockedYear}년</strong>
                  </span>
                  {entry.firstInvestmentYear ? (
                    <span className="text-indigo-600 font-bold">
                      첫 매수: {entry.firstInvestmentYear}년
                    </span>
                  ) : (
                    <span className="text-slate-400">미투자 종목</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredEntries.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            현재 조건에 해당하는 상장 기업 도감이 없습니다.
          </div>
        )}

        {/* Action Button */}
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
