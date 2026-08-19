import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Newspaper,
  CheckCircle2,
  Star,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import type { ListingEvent } from '../types/stockUniverse';
import { formatKRW } from '../utils/formatMoney';
import { getAvailableNewsForYear } from '../engine/newsEngine';
import { audioManager } from '../utils/audioManager';

interface NewListingAlertModalProps {
  listingEvent: ListingEvent;
  currentYear: number;
  isWatchlisted: boolean;
  onOpenCompanyDetail: (canonicalId: string, initialTab?: string) => void;
  onAddToPortfolio: (canonicalId: string) => void;
  onToggleWatchlist: (canonicalId: string) => void;
  onDismiss: () => void;
}

export const NewListingAlertModal: React.FC<NewListingAlertModalProps> = ({
  listingEvent,
  currentYear,
  isWatchlisted,
  onOpenCompanyDetail,
  onAddToPortfolio,
  onToggleWatchlist,
  onDismiss,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'NEWS'>('OVERVIEW');

  // Related listing news
  const availableNews = getAvailableNewsForYear(currentYear, {
    canonicalCompanyId: listingEvent.canonicalCompanyId,
  });

  const getEventTypeName = (type: string) => {
    switch (type) {
      case 'IPO': return '기업공개 (신규 상장)';
      case 'SPINOFF_LISTING': return '기업 분할 재상장';
      case 'MERGER_LISTING': return '합병 후 신규 상장';
      case 'DIRECT_LISTING': return '직접 상장';
      case 'EXCHANGE_TRANSFER': return '시장 이전 상장';
      default: return '신규 상장';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-modal-title"
    >
      <GlassCard
        className="w-full max-w-2xl bg-white border-amber-300 shadow-2xl flex flex-col max-h-[92vh] text-slate-800 p-5 sm:p-6"
        variant="default"
      >
        {/* Top Header Badge & Title */}
        <div className="pb-4 border-b border-slate-200 shrink-0 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-xs font-bold border border-amber-300 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-600" />
                신규 상장 기업 등장 ({listingEvent.firstTradingDate})
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {getEventTypeName(listingEvent.eventType)}
              </span>
            </div>
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 size={13} className="text-emerald-600" />
              첫 거래 개시
            </span>
          </div>

          <h3 id="listing-modal-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {listingEvent.companyNameAsOfDate} ({listingEvent.tickerAsOfDate})
          </h3>
          <p className="text-xs text-slate-500">
            {listingEvent.exchangeAsOfDate} · {listingEvent.sectorAsOfDate}
          </p>
        </div>

        {/* Mandatory Educational Disclaimer */}
        <div className="my-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start gap-2.5 shrink-0">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>💡 거래 기준가격 안내</strong>: 본 시뮬레이션은 공모주 청약이 아니며, 첫 번째 검증 가능한 정규시장 거래가격(
            {listingEvent.firstValidPrice ? `${formatKRW(listingEvent.firstValidPrice)}` : '시장 종가'}
            )을 기준으로 매수 체결됩니다.
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              audioManager.playUiSound('tab');
              setActiveTab('OVERVIEW');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'OVERVIEW' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={13} />
            <span>기업 정보</span>
          </button>
          <button
            type="button"
            onClick={() => {
              audioManager.playUiSound('tab');
              setActiveTab('NEWS');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'NEWS' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Newspaper size={13} />
            <span>상장 뉴스 ({availableNews.length})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto my-3 space-y-3.5 pr-1 text-xs">
          {activeTab === 'OVERVIEW' ? (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-xs text-slate-500 font-bold block">사업 내용 요약</span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {listingEvent.businessSummaryAsOfDate}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">첫 정규장 종가</span>
                  <span className="text-base font-mono font-bold text-blue-700 mt-0.5 block">
                    {listingEvent.firstValidPrice ? formatKRW(listingEvent.firstValidPrice) : '시세 데이터 확인'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">공식 상장 자료</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block line-clamp-1">
                    {listingEvent.officialAnnouncementTitle}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {availableNews.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
                  당시 기준 공개된 상장 관련 뉴스가 없습니다.
                </div>
              ) : (
                availableNews.map(news => (
                  <div
                    key={news.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span className="text-blue-700 font-bold">{news.publishedAt}</span>
                      <span>{news.sourceName}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs leading-snug">{news.titleKo}</h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">{news.summaryKo}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-3.5 border-t border-slate-200 shrink-0 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleWatchlist(listingEvent.canonicalCompanyId)}
              className={`py-2 px-3 rounded-xl border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isWatchlisted
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Star size={14} className={isWatchlisted ? 'fill-amber-400 text-amber-500' : ''} />
              <span>{isWatchlisted ? '관심종목 해제' : '관심종목 추가'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCompanyDetail(listingEvent.canonicalCompanyId, 'OVERVIEW')}
              className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 transition cursor-pointer"
            >
              기업 정보 보기
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
            >
              지금은 투자하지 않기
            </button>

            <button
              type="button"
              onClick={() => onAddToPortfolio(listingEvent.canonicalCompanyId)}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <Plus size={14} />
              <span>포트폴리오에 추가</span>
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
