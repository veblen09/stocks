import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Scale,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useStockGame } from '../store/stockGameStore';
import { STOCKS_BY_ID, getHistoricalStockStats, getStockPriceKRW, isStockListed } from '../engine/returnEngine';
import { getCompanyOverviewAtYear, getAvailableNewsForYear } from '../engine/newsEngine';
import { getTradableStocks } from '../engine/universeEngine';
import { formatKRW, formatPercent, getReturnColor } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';

interface CompanyCompareModalProps {
  isOpen: boolean;
  initialCompanyIds?: string[];
  onClose: () => void;
  onSelectForDetail?: (canonicalId: string) => void;
}

export const CompanyCompareModal: React.FC<CompanyCompareModalProps> = ({
  isOpen,
  initialCompanyIds = [],
  onClose,
  onSelectForDetail,
}) => {
  const { state } = useStockGame();
  const { currentYear, settings } = state;
  const priorYear = currentYear - 1;

  // Selected companies for comparison (max 4)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');

  useEffect(() => {
    if (initialCompanyIds && initialCompanyIds.length > 0) {
      setSelectedIds(Array.from(new Set(initialCompanyIds)).slice(0, 4));
    } else if (selectedIds.length === 0) {
      setSelectedIds(['KR_005930', 'US_AAPL']);
    }
  }, [initialCompanyIds]);

  // Keyboard shortcut (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        audioManager.playUiSound('modalClose');
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const tradableList = getTradableStocks({ currentYear });

  const availableStocksToAdd = tradableList.filter(
    s => !selectedIds.includes(s.canonicalId) &&
      (s.nameKo.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
       s.ticker.toLowerCase().includes(dropdownSearch.toLowerCase()))
  );

  const handleAddCompany = (canonicalId: string) => {
    if (selectedIds.length < 4) {
      audioManager.playUiSound('keyTap');
      setSelectedIds([...selectedIds, canonicalId]);
      setShowAddDropdown(false);
      setDropdownSearch('');
    }
  };

  const handleRemoveCompany = (canonicalId: string) => {
    audioManager.playUiSound('allocationDown');
    setSelectedIds(selectedIds.filter(id => id !== canonicalId));
  };

  const handleClose = () => {
    audioManager.playUiSound('modalClose');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <GlassCard
        className="w-full max-w-5xl h-[90vh] max-h-[850px] bg-white border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-800 p-0"
        variant="default"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 id="compare-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {currentYear}년 당시 기준 다자 기업 비교 분석기
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                당시 실제 공개된 사업 내용, 직전 실적 및 주가 지표를 나란히 비교합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length < 4 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    audioManager.playUiSound('keyTap');
                    setShowAddDropdown(!showAddDropdown);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>비교 기업 추가 ({selectedIds.length}/4)</span>
                </button>

                {showAddDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 z-50 text-xs space-y-2">
                    <input
                      type="text"
                      value={dropdownSearch}
                      onChange={e => setDropdownSearch(e.target.value)}
                      placeholder="종목명/티커 검색..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {availableStocksToAdd.map(stock => (
                        <button
                          key={stock.canonicalId}
                          type="button"
                          onClick={() => handleAddCompany(stock.canonicalId)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 flex items-center justify-between text-slate-800 transition cursor-pointer"
                        >
                          <span className="font-bold">{stock.nameKo}</span>
                          <span className="text-xs text-slate-400 font-mono">{stock.ticker}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Comparison Grid */}
        <div className="flex-1 overflow-auto p-4 sm:p-5">
          {selectedIds.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              비교할 기업을 선택해 주세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[700px]">
              {selectedIds.map(cid => {
                const stock = STOCKS_BY_ID[cid];
                const overview = getCompanyOverviewAtYear(cid, currentYear);
                const stats = getHistoricalStockStats(cid, priorYear, settings.includeFxEffect);
                const priceKRW = getStockPriceKRW(cid, priorYear);
                const isListed = isStockListed(cid, currentYear);
                const availableNews = getAvailableNewsForYear(currentYear, { canonicalCompanyId: cid });

                return (
                  <div
                    key={cid}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4 relative shadow-xs"
                  >
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveCompany(cid)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
                      title="비교 목록에서 제거"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-3.5">
                      {/* Company Header */}
                      <div className="pr-6">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                          <span>{stock?.market === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}</span>
                          <span>•</span>
                          <span>{overview.sector}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{overview.nameKo}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono text-slate-600 font-bold">{overview.ticker}</span>
                          {isListed && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              투자 가능
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contemporary Business */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                        <span className="text-[11px] text-slate-500 font-bold block">{currentYear}년 당시 주요 사업</span>
                        <p className="line-clamp-3 leading-relaxed">{overview.contemporaryBusiness}</p>
                      </div>

                      {/* Historical Returns */}
                      <div className="space-y-1.5 text-xs">
                        <span className="font-bold text-slate-600 block">과거 실적 ({priorYear}년말 기준)</span>
                        <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                          <div className="flex justify-between py-0.5 border-b border-slate-100">
                            <span className="text-slate-500">당시 주가(원화)</span>
                            <span className="font-mono font-bold text-slate-900">
                              {priceKRW ? formatKRW(priceKRW) : '시세 없음'}
                            </span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-slate-100">
                            <span className="text-slate-500">직전 1년 수익률</span>
                            <span className={`font-mono font-bold ${getReturnColor(stats.last1YrReturn || 0)}`}>
                              {stats.last1YrReturn !== null ? formatPercent(stats.last1YrReturn) : '자료부족'}
                            </span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-slate-100">
                            <span className="text-slate-500">과거 3년 CAGR</span>
                            <span className={`font-mono font-bold ${getReturnColor(stats.past3YrCAGR || 0)}`}>
                              {stats.past3YrCAGR !== null ? formatPercent(stats.past3YrCAGR) : '자료부족'}
                            </span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-slate-500">과거 MDD</span>
                            <span className="font-mono font-bold text-rose-600">
                              {stats.historicalMDD !== null ? formatPercent(stats.historicalMDD) : '자료부족'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* News Highlights */}
                      <div className="space-y-1.5 text-xs">
                        <span className="font-bold text-slate-600 block">당시 공개 뉴스 ({availableNews.length}건)</span>
                        <div className="space-y-1">
                          {availableNews.slice(0, 2).map(n => (
                            <div key={n.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                              <span className="text-[10px] text-blue-700 font-mono block">{n.publishedAt}</span>
                              <p className="line-clamp-1 font-semibold text-slate-900">{n.titleKo}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          audioManager.playUiSound('tileOpen');
                          if (onSelectForDetail) {
                            onSelectForDetail(cid);
                            onClose();
                          }
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
                      >
                        상세 정보 및 배분 열기
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
