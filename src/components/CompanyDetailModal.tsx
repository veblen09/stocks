import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Star,
  Building2,
  Newspaper,
  FileText,
  LineChart,
  Edit3,
  ExternalLink,
  Sparkles,
  PieChart,
  CheckCircle2,
  ShoppingCart,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useStockGame } from '../store/stockGameStore';
import {
  getCompanyOverviewAtYear,
  getAvailableNewsForYear,
} from '../engine/newsEngine';
import { STOCKS_BY_ID } from '../engine/returnEngine';
import { getListingEventByCompanyId, isNewlyListedInYear } from '../engine/universeEngine';
import { formatKRW } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';
import { NeutralNewsAnalysisModal } from './NeutralNewsAnalysisModal';
import { CompanyPriceChart } from './CompanyPriceChart';
import type { HistoricalNewsItem } from '../types/stockNews';

interface CompanyDetailModalProps {
  canonicalId: string | null;
  initialTab?: 'OVERVIEW' | 'NEWS' | 'LISTING' | 'FILINGS' | 'PRICES' | 'ALLOCATION' | 'NOTES';
  draftTargetWeight?: number;
  onUpdateDraftTargetWeight?: (canonicalId: string, weight: number) => void;
  onClose: () => void;
  onSelectForTrade?: (canonicalId: string) => void;
  onAddToCompare?: (canonicalId: string) => void;
}

export type TabType = 'OVERVIEW' | 'NEWS' | 'LISTING' | 'FILINGS' | 'PRICES' | 'ALLOCATION' | 'NOTES';

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  canonicalId,
  initialTab = 'OVERVIEW',
  draftTargetWeight = 0,
  onUpdateDraftTargetWeight,
  onClose,
}) => {
  const { state, dispatch } = useStockGame();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newsFilter, setNewsFilter] = useState<'ALL' | '1Y' | 'FILING' | 'PRODUCT'>('ALL');
  const [selectedNewsForAnalysis, setSelectedNewsForAnalysis] = useState<HistoricalNewsItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isNoteSaved, setIsNoteSaved] = useState(false);
  const currentDraftWeight = canonicalId ? (state.draftTargetWeights[canonicalId] ?? draftTargetWeight) : 0;
  const [targetSliderVal, setTargetSliderVal] = useState<number>(currentDraftWeight);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, canonicalId]);

  useEffect(() => {
    const w = canonicalId ? (state.draftTargetWeights[canonicalId] ?? draftTargetWeight) : 0;
    setTargetSliderVal(w);
  }, [canonicalId, state.draftTargetWeights, draftTargetWeight]);

  useEffect(() => {
    if (canonicalId && state.investmentNotes && state.investmentNotes[canonicalId]) {
      setNoteText(state.investmentNotes[canonicalId]);
    } else {
      setNoteText('');
    }
    setIsNoteSaved(false);
  }, [canonicalId, state.investmentNotes]);

  // Keyboard accessibility: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        audioManager.playUiSound('modalClose');
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!canonicalId) return null;

  const currentYear = state.currentYear;
  const overview = getCompanyOverviewAtYear(canonicalId, currentYear);
  const baseStock = STOCKS_BY_ID[canonicalId];
  const isWatchlisted = (state.watchlist || []).includes(canonicalId);
  const userHolding = state.holdings[canonicalId];
  const listingEvent = getListingEventByCompanyId(canonicalId);
  const isNew = isNewlyListedInYear(canonicalId, currentYear);

  // Portfolio value calculations
  const holdingStockValues = Object.values(state.holdings).reduce((sum, h) => sum + (h.currentValueKRW || 0), 0);
  const totalPortfolioValue = state.cashKRW + holdingStockValues;

  // Headroom calculation: ensure sum of all stock targets never exceeds 100%
  const otherStocksSum = Object.entries(state.draftTargetWeights || {})
    .filter(([cid]) => cid !== canonicalId)
    .reduce((sum, [_, w]) => sum + w, 0);
  const maxAllowedWeight = Math.max(0, Math.round((1.0 - otherStocksSum) * 100) / 100);

  // News available strictly up to cutoffDate
  const allAvailableNews = getAvailableNewsForYear(currentYear, { canonicalCompanyId: canonicalId });
  const filingsNews = allAvailableNews.filter(n => n.sourceType === 'FILING');

  const filteredNews = allAvailableNews.filter(n => {
    if (newsFilter === '1Y') {
      const priorYearStr = (currentYear - 1).toString();
      return n.publishedAt.startsWith(priorYearStr);
    }
    if (newsFilter === 'FILING') return n.sourceType === 'FILING';
    if (newsFilter === 'PRODUCT') return n.categories.includes('신제품') || n.categories.includes('기술혁신');
    return true;
  });

  const handleTabChange = (tab: TabType) => {
    audioManager.playUiSound('tab');
    setActiveTab(tab);
  };

  const handleSaveNote = () => {
    audioManager.playUiSound('success');
    dispatch({ type: 'SAVE_NOTE', payload: { canonicalId, note: noteText } });
    setIsNoteSaved(true);
    setTimeout(() => setIsNoteSaved(false), 2000);
  };

  const handleToggleWatchlist = () => {
    audioManager.playUiSound('keyTap');
    dispatch({ type: 'TOGGLE_WATCHLIST', payload: canonicalId });
  };

  const handleApplyWeight = (val: number, isIncrease?: boolean) => {
    const clamped = Math.max(0, Math.min(maxAllowedWeight, Math.round(val * 100) / 100));
    if (isIncrease !== undefined) {
      if (isIncrease) {
        audioManager.playUiSound('allocationUp');
      } else {
        audioManager.playUiSound('allocationDown');
      }
    }
    setTargetSliderVal(clamped);
    if (onUpdateDraftTargetWeight) {
      onUpdateDraftTargetWeight(canonicalId, clamped);
    } else {
      dispatch({ type: 'SET_DRAFT_TARGET_WEIGHT', payload: { canonicalId, weight: clamped } });
    }
  };

  const handleNormalizeAll = () => {
    audioManager.playUiSound('success');
    dispatch({ type: 'NORMALIZE_DRAFT_TARGET_WEIGHTS' });
  };

  const handleClose = () => {
    audioManager.playUiSound('modalClose');
    onClose();
  };

  const officialName = baseStock ? baseStock.nameKo : overview.nameKo;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-detail-title"
    >
      <div
        ref={modalRef}
        className={`w-full ${isExpanded ? 'max-w-4xl' : 'max-w-2xl'} bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full text-slate-800 overflow-hidden transition-all duration-200`}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 shrink-0 space-y-3.5 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">{overview.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 id="company-detail-title" className="text-xl font-bold text-slate-900 tracking-tight">
                    {overview.nameKo}
                  </h2>
                  {isNew && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-600" />
                      {currentYear}년 신규 상장
                    </span>
                  )}
                  {overview.nameKo !== officialName && (
                    <span className="text-xs font-semibold text-slate-500">
                      (현 {officialName})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mt-0.5">
                  <span className="text-blue-700 font-mono font-bold">{overview.ticker}</span>
                  <span>·</span>
                  <span>{overview.sector}</span>
                  <span>·</span>
                  <span>{overview.market === 'KR' ? '원화(KRW)' : '달러(USD)'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title={isExpanded ? '창 축소' : '창 넓게 보기'}
                aria-label={isExpanded ? '창 축소' : '창 넓게 보기'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleToggleWatchlist}
                className={`p-2 rounded-xl transition cursor-pointer border ${
                  isWatchlisted
                    ? 'bg-amber-50 border-amber-300 text-amber-600'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
                title={isWatchlisted ? '관심종목 해제' : '관심종목 등록'}
                aria-label={isWatchlisted ? '관심종목 해제' : '관심종목 등록'}
              >
                <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Holding / Target Status Pill */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">현재 보유:</span>
              {userHolding && userHolding.shares > 0 ? (
                <span className="font-mono font-bold text-slate-900">
                  {formatKRW(userHolding.currentValueKRW)} ({userHolding.shares.toFixed(2)}주)
                </span>
              ) : (
                <span className="text-slate-400 font-medium">미보유</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">설정 목표비중:</span>
              <span className="font-mono font-bold text-blue-600 text-sm">
                {Math.round(targetSliderVal * 100)}%
              </span>
            </div>
          </div>

          {/* 7 Navigation Tabs (Keyboard-style .filter-key) */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 overflow-x-auto text-xs font-bold no-scrollbar">
            <button
              type="button"
              onClick={() => handleTabChange('OVERVIEW')}
              aria-pressed={activeTab === 'OVERVIEW'}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'OVERVIEW' ? 'bg-white text-blue-600 shadow-sm border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 size={13} />
              <span>기업 개요</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('NEWS')}
              aria-pressed={activeTab === 'NEWS'}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'NEWS' ? 'bg-white text-blue-600 shadow-sm border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Newspaper size={13} />
              <span>당시 뉴스 ({allAvailableNews.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('LISTING')}
              aria-pressed={activeTab === 'LISTING'}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'LISTING' ? 'bg-white text-blue-600 shadow-sm border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles size={13} />
              <span>상장 정보</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('FILINGS')}
              aria-pressed={activeTab === 'FILINGS'}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'FILINGS' ? 'bg-white text-blue-600 shadow-sm border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={13} />
              <span>공시·실적 ({filingsNews.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('PRICES')}
              aria-pressed={activeTab === 'PRICES'}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'PRICES' ? 'bg-white text-blue-600 shadow-sm border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChart size={13} />
              <span>과거 주가</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('ALLOCATION')}
              aria-pressed={activeTab === 'ALLOCATION'}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ALLOCATION' ? 'bg-white text-blue-600 shadow-sm border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChart size={13} />
              <span>자산배분</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('NOTES')}
              aria-pressed={activeTab === 'NOTES'}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'NOTES' ? 'bg-white text-blue-600 shadow-sm border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 size={13} />
              <span>투자 메모</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm text-slate-700">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-xs text-slate-500 font-bold uppercase block">
                  {currentYear}년 당시 주요 사업 및 사업 구조
                </span>
                <p className="text-sm text-slate-900 leading-relaxed font-semibold">
                  {overview.contemporaryBusiness}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 block font-semibold">당시 사명</span>
                  <span className="font-bold text-slate-900 text-sm block">{overview.nameKo}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    최초 상장명: {listingEvent?.companyNameAsOfDate || overview.nameKo}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 block font-semibold">상장 거래소 / 일자</span>
                  <span className="font-bold text-slate-900 text-sm block">
                    {listingEvent?.exchangeAsOfDate || (overview.market === 'KR' ? '한국거래소' : 'NASDAQ/NYSE')}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {listingEvent?.firstTradingDate || overview.listingDate || '상장 완료'}
                  </span>
                </div>
              </div>

              {overview.historicalAliases && overview.historicalAliases.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">당시까지 확인된 사명 변천사</span>
                  <div className="space-y-2">
                    {overview.historicalAliases.map((al, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                        <span className="text-blue-700 font-bold font-mono text-xs shrink-0">{al.validFrom}</span>
                        <span className="text-slate-800 text-xs leading-relaxed">{al.historicalName} · {al.contemporaryBusinessKo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NEWS */}
          {activeTab === 'NEWS' && (
            <div className="space-y-3.5">
              <div className="flex gap-1.5 overflow-x-auto text-xs font-bold">
                {[
                  { key: 'ALL', label: '전체 뉴스' },
                  { key: '1Y', label: '최근 1년' },
                  { key: 'FILING', label: '공시만' },
                  { key: 'PRODUCT', label: '신제품/기술' },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      audioManager.playUiSound('filter');
                      setNewsFilter(f.key as any);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      newsFilter === f.key
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredNews.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  해당 조건의 공개 뉴스가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNews.map(news => (
                    <div
                      key={news.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span className="text-blue-700 font-bold">{news.publishedAt}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">{news.sourceName}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{news.titleKo}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">{news.summaryKo}</p>
                      <button
                        type="button"
                        onClick={() => {
                          audioManager.playUiSound('keyTap');
                          setSelectedNewsForAnalysis(news);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <span>중립 해설 및 영향 분석 열기</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LISTING INFO */}
          {activeTab === 'LISTING' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <span className="text-xs text-amber-800 font-bold uppercase block">공식 상장 개요</span>
                <p className="text-sm text-slate-900 leading-relaxed font-semibold">
                  {listingEvent?.businessSummaryAsOfDate || overview.contemporaryBusiness}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block font-semibold">첫 거래일</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                    {listingEvent?.firstTradingDate || '기록 확인'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block font-semibold">첫 정규장 종가</span>
                  <span className="font-mono font-bold text-blue-700 text-sm mt-0.5 block">
                    {listingEvent?.firstValidPrice ? formatKRW(listingEvent.firstValidPrice) : '시세 데이터 확인'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block font-semibold">상장 형태</span>
                  <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                    {listingEvent?.eventType || 'IPO'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                <strong>📌 매매 기준가격 고지</strong>: 본 시뮬레이션은 공모주 청약이 아니며, 거래소의 첫 번째 정규시장 거래가격을 기준으로 매수 체결됩니다.
              </div>

              {listingEvent?.officialAnnouncementTitle && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-xs text-slate-500 block font-semibold">공식 상장 자료</span>
                    <span className="font-bold text-slate-900 text-sm">{listingEvent.officialAnnouncementTitle}</span>
                  </div>
                  {listingEvent.officialAnnouncementUrl && (
                    <a
                      href={listingEvent.officialAnnouncementUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white hover:bg-slate-100 text-blue-600 rounded-lg border border-slate-200 transition"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FILINGS */}
          {activeTab === 'FILINGS' && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-900 block">법정 공시 및 보고서 원자료</span>
                <p className="text-xs text-slate-600">
                  {currentYear - 1}년 12월 31일 기준으로 공시된 DART / SEC EDGAR 공시 자료입니다.
                </p>
              </div>

              {filingsNews.length > 0 ? (
                <div className="space-y-2.5">
                  {filingsNews.map(f => (
                    <div key={f.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500 font-mono">
                        <span className="text-blue-700 font-bold">{f.publishedAt}</span>
                        <span>{f.sourceName}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{f.titleKo}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{f.summaryKo}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  당시 기준 공개된 세부 법정 공시가 없습니다.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PRICES */}
          {activeTab === 'PRICES' && (
            <div className="space-y-3.5">
              <CompanyPriceChart
                canonicalId={canonicalId}
                upToYear={currentYear - 1}
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
              />
            </div>
          )}

          {/* TAB 6: ASSET ALLOCATION (Numeric Keypad Style) */}
          {activeTab === 'ALLOCATION' && (
            <div className="space-y-4">
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShoppingCart size={14} className="text-blue-600" />
                      <span>주식 매수 및 목표 비중 설정</span>
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      설정 가능 최대: <strong className="text-blue-700 font-bold">{Math.round(maxAllowedWeight * 100)}%</strong> (다른 종목 합계: {Math.round(otherStocksSum * 100)}%)
                    </span>
                  </div>
                  <span className="font-mono text-xl font-bold text-blue-700">
                    {Math.round(targetSliderVal * 100)}% ({formatKRW(totalPortfolioValue * targetSliderVal)})
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-100 text-xs text-slate-600 leading-relaxed">
                  💡 <strong>매수 안내</strong>: 목표 비중을 설정한 후 하단 액션바의 <strong>[투자 실행 & 1년 진행]</strong>을 누르면, 설정된 비중만큼 주식이 자동 일괄 매수 체결됩니다.
                </div>

                {/* Range Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>0% (미보유)</span>
                    <span className="font-bold text-blue-700">설정치: {Math.round(targetSliderVal * 100)}%</span>
                    <span>최대 {Math.round(maxAllowedWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0.01, maxAllowedWeight)}
                    step={0.01}
                    value={targetSliderVal}
                    onChange={e => handleApplyWeight(parseFloat(e.target.value))}
                    onMouseUp={() => audioManager.playUiSound('keyTap')}
                    onTouchEnd={() => audioManager.playUiSound('keyTap')}
                    className="w-full cursor-pointer h-2 bg-slate-200 rounded-lg accent-blue-600"
                  />
                </div>

                {/* Keypad-Style Step Buttons (.allocation-key) */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 block">비중 정밀 조절 키패드</span>
                  <div className="grid grid-cols-6 gap-2">
                    {[-0.10, -0.05, -0.01, +0.01, +0.05, +0.10].map(delta => {
                      const isPlus = delta > 0;
                      const isDisabled = isPlus ? targetSliderVal >= maxAllowedWeight - 0.0001 : targetSliderVal <= 0;
                      return (
                        <button
                          key={delta}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleApplyWeight(targetSliderVal + delta, isPlus)}
                          className={`allocation-key ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          {delta > 0 ? `+${delta * 100}%` : `${delta * 100}%`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preset Quick Actions */}
                <div className="space-y-2 pt-2 border-t border-blue-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      disabled={targetSliderVal <= 0}
                      onClick={() => handleApplyWeight(0, false)}
                      className="py-2.5 bg-white hover:bg-rose-50 text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-xs transition cursor-pointer border border-rose-200 shadow-sm"
                    >
                      매수 취소 (0%)
                    </button>
                    <button
                      type="button"
                      disabled={maxAllowedWeight < 0.01}
                      onClick={() => handleApplyWeight(Math.min(0.05, maxAllowedWeight), true)}
                      className="py-2.5 bg-white hover:bg-blue-50 text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-xs transition cursor-pointer border border-blue-200 shadow-sm"
                    >
                      +5% 매수
                    </button>
                    <button
                      type="button"
                      disabled={maxAllowedWeight < 0.01}
                      onClick={() => handleApplyWeight(Math.min(0.10, maxAllowedWeight), true)}
                      className="py-2.5 bg-white hover:bg-blue-50 text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-xs transition cursor-pointer border border-blue-200 shadow-sm"
                    >
                      +10% 매수
                    </button>
                    <button
                      type="button"
                      disabled={maxAllowedWeight < 0.01}
                      onClick={() => handleApplyWeight(Math.min(0.20, maxAllowedWeight), true)}
                      className="py-2.5 bg-white hover:bg-blue-50 text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-xs transition cursor-pointer border border-blue-200 shadow-sm"
                    >
                      +20% 매수
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={maxAllowedWeight <= targetSliderVal + 0.0001}
                      onClick={() => handleApplyWeight(maxAllowedWeight, true)}
                      className="py-2 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1"
                    >
                      <span>최대 매수 ({Math.round(maxAllowedWeight * 100)}%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNormalizeAll}
                      className="py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl font-bold text-xs transition cursor-pointer border border-blue-300 shadow-xs flex items-center justify-center gap-1"
                    >
                      <span>⚡ 전체 담은 종목 100% 비율 맞춤</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* TAB 7: INVESTMENT NOTES */}
          {activeTab === 'NOTES' && (
            <div className="space-y-3.5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>투자 판단 메모 및 가설 (Thesis)</span>
                  {isNoteSaved && (
                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      저장되었습니다!
                    </span>
                  )}
                </label>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="당시 뉴스와 기업 정보를 바탕으로 어떤 기회와 위험을 보고 매수/매도를 결정했는지 기록해 보세요."
                  className="w-full h-44 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 leading-relaxed font-sans resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveNote}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition cursor-pointer shadow-md shadow-blue-600/20"
              >
                메모 저장하기
              </button>
            </div>
          )}
        </div>

        {/* Persistent Bottom Sticky Buy Action Bar (Always Visible Across All Tabs) */}
        <div className="modal-sticky-buybar p-4 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <ShoppingCart size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {targetSliderVal > 0.0001 ? (
                    <span className="text-blue-700 font-mono">
                      매수 목표 {Math.round(targetSliderVal * 100)}%
                    </span>
                  ) : (
                    <span className="text-slate-600">매수 미설정 (0%)</span>
                  )}
                </span>
                {targetSliderVal > 0.0001 && (
                  <span className="text-xs text-slate-500 font-mono font-semibold">
                    (약 {formatKRW(totalPortfolioValue * targetSliderVal)})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {targetSliderVal > 0.0001
                  ? '하단 바의 [투자 실행] 시 일괄 매수됩니다'
                  : `최대 ${Math.round(maxAllowedWeight * 100)}%까지 매수 가능`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {targetSliderVal <= 0.0001 ? (
              <>
                <button
                  type="button"
                  onClick={() => handleApplyWeight(Math.min(0.05, maxAllowedWeight), true)}
                  disabled={maxAllowedWeight < 0.01}
                  className="buy-btn-chip"
                >
                  +5%
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeight(Math.min(0.10, maxAllowedWeight), true)}
                  disabled={maxAllowedWeight < 0.01}
                  className="buy-btn-chip"
                >
                  +10%
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeight(Math.min(0.20, maxAllowedWeight), true)}
                  disabled={maxAllowedWeight < 0.01}
                  className="buy-btn-chip"
                >
                  +20%
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeight(Math.min(0.10, maxAllowedWeight), true)}
                  disabled={maxAllowedWeight < 0.01}
                  className="buy-btn-primary py-2 px-3.5 text-xs font-bold"
                >
                  <ShoppingCart size={13} />
                  <span>+ 10% 매수 담기</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleApplyWeight(0, false)}
                  className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-xs transition cursor-pointer"
                >
                  매수 취소 (0%)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeight(targetSliderVal - 0.05, false)}
                  disabled={targetSliderVal <= 0}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 text-xs transition cursor-pointer"
                >
                  -5%
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeight(targetSliderVal + 0.05, true)}
                  disabled={targetSliderVal >= maxAllowedWeight - 0.0001}
                  className="py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 text-xs transition cursor-pointer"
                >
                  +5%
                </button>
                {activeTab !== 'ALLOCATION' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('ALLOCATION')}
                    className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <PieChart size={13} />
                    <span>비중 정밀 조절</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Neutral News Analysis Modal Integration */}
      {selectedNewsForAnalysis && (
        <NeutralNewsAnalysisModal
          newsItem={selectedNewsForAnalysis}
          onClose={() => {
            audioManager.playUiSound('modalClose');
            setSelectedNewsForAnalysis(null);
          }}
        />
      )}
    </div>
  );
};
