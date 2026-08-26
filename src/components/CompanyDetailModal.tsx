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
  CheckCircle2,
  ShoppingCart,
  Coins,
} from 'lucide-react';
import { useStockGame } from '../store/stockGameStore';
import {
  getCompanyOverviewAtYear,
  getAvailableNewsForYear,
} from '../engine/newsEngine';
import { STOCKS_BY_ID, getStockPriceKRW } from '../engine/returnEngine';
import { getListingEventByCompanyId, isNewlyListedInYear } from '../engine/universeEngine';
import { formatKRW, formatCompactKRW } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';
import { NeutralNewsAnalysisModal } from './NeutralNewsAnalysisModal';
import { CompanyPriceChart } from './CompanyPriceChart';
import type { HistoricalNewsItem } from '../types/stockNews';

interface CompanyDetailModalProps {
  canonicalId: string | null;
  initialTab?: TabType;
  draftTargetWeight?: number;
  onUpdateDraftTargetWeight?: (canonicalId: string, weight: number) => void;
  onClose: () => void;
}

export type TabType = 'OVERVIEW' | 'NEWS' | 'LISTING' | 'FILINGS' | 'NOTES' | 'PRICES' | 'ALLOCATION';

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  canonicalId,
  initialTab = 'OVERVIEW',
  draftTargetWeight = 0,
  onUpdateDraftTargetWeight,
  onClose,
}) => {
  const { state, dispatch } = useStockGame();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (initialTab === 'PRICES' || initialTab === 'ALLOCATION') return 'OVERVIEW';
    return initialTab;
  });
  const [newsFilter, setNewsFilter] = useState<'ALL' | '1Y' | 'FILING' | 'PRODUCT'>('ALL');
  const [selectedNewsForAnalysis, setSelectedNewsForAnalysis] = useState<HistoricalNewsItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isNoteSaved, setIsNoteSaved] = useState(false);
  const currentDraftWeight = canonicalId ? (state.draftTargetWeights[canonicalId] ?? draftTargetWeight) : 0;
  const [targetSliderVal, setTargetSliderVal] = useState<number>(currentDraftWeight);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTab === 'PRICES' || initialTab === 'ALLOCATION') {
      setActiveTab('OVERVIEW');
    } else {
      setActiveTab(initialTab);
    }
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
  const maxAllowedWeight = Math.max(0, Math.round((1.0 - otherStocksSum) * 1000000) / 1000000);

  // Amounts in KRW
  const maxAllowedAmountKRW = Math.round(maxAllowedWeight * totalPortfolioValue);
  const targetAmountKRW = Math.min(
    maxAllowedAmountKRW,
    Math.round(targetSliderVal * totalPortfolioValue)
  );
  const priceKRW = getStockPriceKRW(canonicalId, currentYear - 1) || 1;
  const estimatedShares = priceKRW > 0 ? (targetAmountKRW / priceKRW) : 0;

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
    const clamped = Math.max(0, Math.min(maxAllowedWeight, Math.round(val * 1000000) / 1000000));
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

  const handleApplyAmount = (amount: number, isIncrease?: boolean) => {
    if (totalPortfolioValue <= 0) return;
    const clampedAmount = Math.max(0, Math.min(maxAllowedAmountKRW, amount));
    const nextWeight = Math.round((clampedAmount / totalPortfolioValue) * 1000000) / 1000000;
    handleApplyWeight(nextWeight, isIncrease);
  };

  const handleAmountStep = (delta: number) => {
    const isPlus = delta > 0;
    handleApplyAmount(targetAmountKRW + delta, isPlus);
  };

  const handleClose = () => {
    audioManager.playUiSound('modalClose');
    onClose();
  };

  const officialName = baseStock ? baseStock.nameKo : overview.nameKo;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-detail-title"
    >
      <div
        ref={modalRef}
        className="w-full h-full max-w-[1560px] max-h-[96vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden text-slate-800 transition-all duration-150"
      >
        {/* 1. Global Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 shrink-0 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl shrink-0">{overview.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="company-detail-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {overview.nameKo}
                </h2>
                {isNew && (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-600" />
                    {currentYear}년 신규 상장
                  </span>
                )}
                {overview.nameKo !== officialName && (
                  <span className="text-xs font-semibold text-slate-500">
                    (현 {officialName})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mt-0.5 flex-wrap">
                <span className="text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {overview.ticker}
                </span>
                <span>·</span>
                <span className="font-semibold text-slate-800">{overview.sector}</span>
                <span>·</span>
                <span>{overview.market === 'KR' ? '원화(KRW)' : '달러(USD)'}</span>
                <span>·</span>
                <span className="text-slate-500">{currentYear}년 투자 결정 기준</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Quick Status Badges */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-1.5">
                <span className="text-slate-500 font-sans font-medium">현재 보유:</span>
                {userHolding && userHolding.shares > 0 ? (
                  <span className="font-bold text-emerald-700">
                    {formatKRW(userHolding.currentValueKRW)} ({userHolding.shares.toFixed(2)}주)
                  </span>
                ) : (
                  <span className="text-slate-400 font-sans">미보유</span>
                )}
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 shadow-xs flex items-center gap-1.5">
                <span className="text-slate-500 font-sans font-medium">설정 매수:</span>
                <span className="font-bold text-blue-700 text-sm">
                  {targetAmountKRW > 0 ? (
                    `${formatCompactKRW(targetAmountKRW)} (${formatKRW(targetAmountKRW)})`
                  ) : (
                    <span className="text-slate-400 font-sans font-normal">0원 (미설정)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleWatchlist}
                className={`p-2.5 rounded-xl transition cursor-pointer border ${
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
                className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer shadow-xs"
                aria-label="닫기"
                title="닫기 (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Split 2-Column Body (Left: Stock Price Chart & Market Overview / Right: Details Tabs & Eye-Catching Buy Studio) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* LEFT COLUMN: Dedicated Stock Chart Studio (Always Visible) */}
          <div className="w-full lg:w-[50%] xl:w-[52%] flex flex-col bg-slate-50/60 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold">
                  <LineChart size={16} />
                </span>
                <h3 className="font-black text-slate-900 text-base tracking-tight">
                  {overview.nameKo} 주가 차트 & 시세 분석
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {currentYear - 1}년 12월 31일 종가 기준
              </span>
            </div>

            {/* Always Rendered Interactive Naver-Style Price Chart */}
            <CompanyPriceChart
              canonicalId={canonicalId}
              upToYear={currentYear - 1}
              isExpanded={false}
            />

            {/* Quick Context Card below Chart */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-600" />
                  <span>당시 사업 모델 요약</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {listingEvent?.exchangeAsOfDate || '거래소 상장'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {overview.contemporaryBusiness}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Details Tabs & Eye-Catching Buy Studio */}
          <div className="w-full lg:w-[50%] xl:w-[48%] flex flex-col bg-white overflow-hidden">
            {/* Tabs Header */}
            <div className="p-3 border-b border-slate-200 shrink-0 bg-slate-50/60">
              <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1 overflow-x-auto text-xs font-bold no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleTabChange('OVERVIEW')}
                  aria-pressed={activeTab === 'OVERVIEW'}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'OVERVIEW' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
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
                    activeTab === 'NEWS' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
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
                    activeTab === 'LISTING' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
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
                    activeTab === 'FILINGS' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText size={13} />
                  <span>공시·실적 ({filingsNews.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('NOTES')}
                  aria-pressed={activeTab === 'NOTES'}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'NOTES' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 size={13} />
                  <span>투자 메모</span>
                </button>
              </div>
            </div>

            {/* Scrollable Tab Content Area */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-sm text-slate-700 min-h-[160px]">
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

              {/* TAB 5: NOTES */}
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
                      className="w-full h-40 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 leading-relaxed font-sans resize-none"
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

            {/* VIBRANT EYE-CATCHING BUY STUDIO PANEL (Pinned at Bottom of Right Column) */}
            <div className="border-t-2 border-blue-500/30 bg-gradient-to-b from-blue-50/50 via-white to-slate-50/90 p-4 sm:p-5 shrink-0 shadow-lg space-y-3.5">
              {/* 1. Hero Amount Display Card */}
              <div className="p-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl shadow-md flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1">
                    <Coins size={13} />
                    <span>선택한 매수 금액</span>
                  </span>
                  <div className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                    {targetAmountKRW > 0 ? formatKRW(targetAmountKRW) : '0원 (미설정)'}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-blue-100 font-mono font-medium block">
                    {targetAmountKRW > 0
                      ? `약 ${estimatedShares.toFixed(2)}주 매수 예정 · ${Math.round(targetSliderVal * 100)}%`
                      : `최대 ${formatCompactKRW(maxAllowedAmountKRW)} 가능`}
                  </span>
                  <span className="text-[11px] text-blue-200 block mt-0.5">
                    1주 기준가 {formatKRW(priceKRW)}
                  </span>
                </div>
              </div>

              {/* 2. 1만원 Unit Fine-Tuning Slider Bar */}
              <div className="p-3 bg-white rounded-xl border border-blue-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1">
                    <span>📏</span>
                    <span>1만원 단위 미세 조절 슬라이더</span>
                  </span>
                  <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {formatCompactKRW(targetAmountKRW)} ({formatKRW(targetAmountKRW)})
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={Math.max(10000, maxAllowedAmountKRW)}
                  step={10000}
                  value={targetAmountKRW}
                  onChange={e => handleApplyAmount(parseInt(e.target.value, 10))}
                  onMouseUp={() => audioManager.playUiSound('keyTap')}
                  onTouchEnd={() => audioManager.playUiSound('keyTap')}
                  className="w-full cursor-pointer h-2.5 bg-slate-200 rounded-lg accent-blue-600"
                  aria-label="1만원 단위 매수 금액 슬라이더"
                />

                {/* Quick-snap Chips Below Slider */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleApplyAmount(0, false)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold transition cursor-pointer border border-slate-200"
                  >
                    0원 (취소)
                  </button>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {[1000000, 2000000, 3000000, 5000000, 10000000].map(amt => {
                      if (amt > maxAllowedAmountKRW) return null;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleApplyAmount(amt, amt > targetAmountKRW)}
                          className={`px-2 py-0.5 rounded font-bold transition cursor-pointer border ${
                            Math.abs(targetAmountKRW - amt) < 5000
                              ? 'bg-blue-600 text-white border-blue-700'
                              : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200'
                          }`}
                        >
                          {formatCompactKRW(amt)}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => handleApplyAmount(maxAllowedAmountKRW, true)}
                      disabled={maxAllowedAmountKRW <= 0}
                      className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition cursor-pointer border border-blue-200"
                    >
                      전액 ({formatCompactKRW(maxAllowedAmountKRW)})
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. 100만원 단위 & 1만원 단위 퀵 키패드 */}
              <div className="space-y-1.5">
                {/* 100만원 Keypad */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { label: '+100만', delta: 1000000 },
                    { label: '+200만', delta: 2000000 },
                    { label: '+300만', delta: 3000000 },
                    { label: '+500만', delta: 5000000 },
                    { label: '+1,000만', delta: 10000000 },
                  ].map(item => {
                    const isDisabled = targetAmountKRW + item.delta > maxAllowedAmountKRW + 10;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleAmountStep(item.delta)}
                        className={`allocation-key font-mono text-xs py-2 font-bold ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleApplyAmount(maxAllowedAmountKRW, true)}
                    disabled={maxAllowedAmountKRW <= targetAmountKRW + 100}
                    className="allocation-key font-mono text-xs py-2 font-bold bg-blue-50 text-blue-800 border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    전액 매수
                  </button>
                </div>

                {/* 1만원 Fine-Tuning & Decrements */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleAmountStep(-1000000)}
                    disabled={targetAmountKRW <= 0}
                    className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs border border-slate-200 transition cursor-pointer font-mono"
                    title="100만원 감소"
                  >
                    -100만
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountStep(-10000)}
                    disabled={targetAmountKRW <= 0}
                    className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs border border-slate-200 transition cursor-pointer font-mono"
                    title="1만원 미세 감소"
                  >
                    -1만
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountStep(+10000)}
                    disabled={targetAmountKRW + 10000 > maxAllowedAmountKRW + 10}
                    className="py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition cursor-pointer font-mono"
                    title="1만원 미세 증가"
                  >
                    +1만
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountStep(+50000)}
                    disabled={targetAmountKRW + 50000 > maxAllowedAmountKRW + 10}
                    className="py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition cursor-pointer font-mono"
                    title="5만원 증가"
                  >
                    +5만
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountStep(+100000)}
                    disabled={targetAmountKRW + 100000 > maxAllowedAmountKRW + 10}
                    className="py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition cursor-pointer font-mono"
                    title="10만원 증가"
                  >
                    +10만
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyAmount(0, false)}
                    disabled={targetAmountKRW <= 0}
                    className="py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs border border-rose-200 transition cursor-pointer"
                  >
                    초기화
                  </button>
                </div>
              </div>

              {/* 4. Giant High-Impact Primary Buy Button */}
              {targetAmountKRW <= 0 ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAmountStep(10000)}
                    disabled={maxAllowedAmountKRW < 10000}
                    className="buy-btn-chip py-3 px-3 text-xs"
                    title="1만원 매수 담기"
                  >
                    +1만
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountStep(500000)}
                    disabled={maxAllowedAmountKRW < 500000}
                    className="buy-btn-chip py-3 px-3 text-xs"
                    title="50만원 매수 담기"
                  >
                    +50만
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountStep(1000000)}
                    disabled={maxAllowedAmountKRW < 10000}
                    className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
                  >
                    <ShoppingCart size={18} className="text-white" />
                    <span>+100만원 매수 담기</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 p-2.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                    <span className="font-bold text-blue-900">
                      매수 <strong className="font-mono text-blue-700 text-sm">{formatCompactKRW(targetAmountKRW)}</strong> 담김
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      (약 {estimatedShares.toFixed(2)}주 · {formatKRW(targetAmountKRW)})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-mono">
                    <button
                      type="button"
                      onClick={() => handleAmountStep(-1000000)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 transition cursor-pointer"
                      title="100만원 감소"
                    >
                      -100만
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAmountStep(-10000)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 transition cursor-pointer"
                      title="1만원 감소"
                    >
                      -1만
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAmountStep(+10000)}
                      disabled={targetAmountKRW + 10000 > maxAllowedAmountKRW + 10}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer shadow-xs"
                      title="1만원 증가"
                    >
                      +1만
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAmountStep(+1000000)}
                      disabled={targetAmountKRW + 1000000 > maxAllowedAmountKRW + 10}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer shadow-xs"
                      title="100만원 증가"
                    >
                      +100만
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyAmount(0, false)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition cursor-pointer ml-1"
                      title="매수 취소"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
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
