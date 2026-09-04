import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Star,
  PlusCircle,
  TrendingUp,
  Calendar,
  X,
  Flame,
} from 'lucide-react';
import type { HistoricalStockDefinition, ListingEvent } from '../types/stockUniverse';
import { getListingEventByCompanyId } from '../engine/universeEngine';
import { audioManager } from '../utils/audioManager';
import { formatKRW } from '../utils/formatMoney';

interface NewListingModalProps {
  listedStocks: HistoricalStockDefinition[];
  targetYear: number;
  isOpen: boolean;
  watchlist?: string[];
  onClose: () => void;
  onSelectStock?: (canonicalId: string) => void;
  onAddToPortfolio?: (canonicalId: string) => void;
  onToggleWatchlist?: (canonicalId: string) => void;
}

export const NewListingModal: React.FC<NewListingModalProps> = ({
  listedStocks,
  targetYear,
  isOpen,
  watchlist = [],
  onClose,
  onSelectStock,
  onAddToPortfolio,
  onToggleWatchlist,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen && listedStocks.length > 0) {
      setCurrentIndex(0);
      audioManager.playUiSound('success');
    }
  }, [isOpen, listedStocks.length]);

  if (!isOpen || listedStocks.length === 0) return null;

  const currentStock = listedStocks[currentIndex] || listedStocks[0];
  const listingEvent: ListingEvent | undefined = getListingEventByCompanyId(currentStock.canonicalCompanyId);
  const totalCount = listedStocks.length;
  const isWatchlisted = watchlist.includes(currentStock.canonicalCompanyId);

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      audioManager.playUiSound('tab');
      setCurrentIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      audioManager.playUiSound('tab');
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSelectIndex = (idx: number) => {
    audioManager.playUiSound('tab');
    setCurrentIndex(idx);
  };

  const handleComplete = () => {
    audioManager.playUiSound('modalClose');
    onClose();
  };

  // Historical context hint by stock
  const getHistoricalSignificance = (cid: string) => {
    switch (cid) {
      case 'US_AAPL':
        return '1980년 12월 12일 애플의 IPO는 1956년 포드자동차 이후 최대 규모의 공모 자금을 조달하며 개인용 PC 혁명의 서막을 열었습니다.';
      case 'US_NKE':
        return '1980년 12월 나이키는 혁신적인 에어 쿠셔닝 기술과 스포츠 마케팅을 앞세워 글로벌 스포츠웨어 제국으로 도약하기 위해 나스닥에 상장했습니다.';
      case 'US_HD':
        return '1981년 홈디포의 상장은 미국의 주택 DIY(Do-It-Yourself) 열풍과 거대 창고형 건축자재 유통 신화를 여는 전환점이 되었습니다.';
      case 'US_UNH':
        return '1984년 유나이티드헬스케어 상장은 미국 민간 건강관리(HMO) 및 헬스케어 플랫폼 산업의 비약적인 성장을 이끌었습니다.';
      case 'US_ENE':
        return '1985년 엔론은 천연가스 파이프라인 합병으로 출범하여 이후 에너지 파생상품 혁신의 기수이자 훗날 역사상 최대 분식회계 사건의 주인공이 됩니다.';
      case 'US_MSFT':
        return '1986년 3월 13일 마이크로소프트의 나스닥 상장은 주당 21달러에 이루어졌으며, PC 운영체제 DOS/Windows로 글로벌 IT 황금기를 열었습니다.';
      case 'KR_010950':
        return '1987년 쌍용정유(현 S-Oil)의 유가증권시장 상장으로 중동 원유 정제 및 고도화 석유화학 시설 투자가 가속화되었습니다.';
      case 'KR_005490':
        return '1988년 포항제철(현 POSCO홀딩스) 국민주 1호 상장은 대한민국 국민 300만 명이 공모에 참여한 역사상 최대 규모의 국민주 상장이었습니다.';
      case 'KR_017670':
        return '1989년 한국이동통신(현 SK텔레콤)의 상장은 대한민국 무선 이동통신 및 CDMA 모바일 혁명의 기틀을 마련했습니다.';
      case 'KR_015760':
        return '1989년 한국전력공사의 상장은 기간 전력 인프라의 대규모 민영화 및 코스피 시장의 시가총액 대장주 역할을 담당했습니다.';
      case 'KR_012330':
        return '1989년 현대정공(현 현대모비스)의 상장은 컨테이너 및 특장차 제조에서 글로벌 핵심 자동차 모듈 부품사로의 대전환을 시작했습니다.';
      case 'KR_001600':
        return '1989년 한보철강공업의 상장은 당진 코렉스(COREX) 제철소 건설을 위한 대규모 자금 조달로 이어졌으나 1997년 외환위기의 뇌관이 되었습니다.';
      case 'US_LEH':
        return '1994년 144년 전통의 글로벌 투자은행 리만브라더스가 아메리칸 익스프레스에서 분사하여 NYSE에 단독 상장했습니다.';
      case 'US_NOK':
        return '1994년 핀란드 노키아는 NYSE에 상장하며 글로벌 2G 이동통신 휴대폰 시장 점유율 1위를 향한 전성기를 열었습니다.';
      case 'KR_000660':
        return '1996년 12월 현대전자산업(현 SK하이닉스)은 DRAM 반도체 사업의 글로벌 확장을 위해 유가증권시장에 전격 상장했습니다.';
      case 'US_BRK_B':
        return '1996년 5월 워런 버핏은 소액 투자자들도 버크셔 해서웨이에 참여할 수 있도록 30분의 1 가격의 Class B 주식을 발행하여 상장했습니다.';
      case 'US_AMZN':
        return '1997년 5월 제프 베조스의 아마존은 주당 18달러에 나스닥에 상장되어 온라인 서점에서 시작해 세계 최대 전자상거래 및 클라우드 제국으로 진화했습니다.';
      case 'KR_030200':
        return '1998년 한국통신(현 KT)의 상장은 대한민국 초고속 인터넷 ADSL 메가패스 보급과 IT 벤처 열풍의 핵심 인프라가 되었습니다.';
      case 'US_NVDA':
        return '1999년 1월 22일 엔비디아의 나스닥 상장은 세계 최초의 GPU GeForce 256 발표와 함께 게이밍 3D 그래픽 및 미래 AI 컴퓨팅 혁명을 알렸습니다.';
      case 'KR_035720':
        return '1999년 다음커뮤니케이션(현 카카오)은 한메일넷 무료 이메일 서비스와 카페 커뮤니티로 코스닥 시장 닷컴 버블의 대표 주자로 상장했습니다.';
      case 'KR_025930':
        return '1999년 벤처 신화의 상징 팬택이 코스닥에 상장하여 삐삐 및 흑백/컬러 휴대폰 제조사로 급성장했습니다.';
      case 'US_BB':
        return '1999년 블랙베리(RIM)는 쿼티 자판 스마트폰과 엔터프라이즈 모바일 이메일 혁신으로 나스닥에 상장했습니다.';
      case 'US_BBI':
        return '1999년 비디오/DVD 대여 체인 블록버스터가 나스닥에 상장되었으나 이후 넷플릭스 등 디지털 스트리밍 전환에 직면하게 됩니다.';
      case 'KR_051910':
        return '2001년 LG화학의 유가증권시장 분할 상장은 석유화학을 넘어 차세대 2차전지 배터리 글로벌 1위 기업으로 성장하는 발판이 되었습니다.';
      case 'KR_055550':
        return '2001년 신한금융지주는 국내 최초 민간 주도 종합금융지주회사로 출범하며 유가증권시장에 상장했습니다.';
      case 'KR_066570':
        return '2002년 LG전자는 디스플레이, 가전, 이동통신 단말기 사업의 글로벌 경쟁력 강화를 위해 분할 재상장했습니다.';
      case 'KR_035420':
        return '2002년 10월 네이버(당시 NHN)는 \'지식iN\' 서비스 런칭과 함께 코스닥에 상장하여 대한민국 1위 검색 포털로 자리매김했습니다.';
      case 'US_GOOGL':
        return '2004년 8월 19일 구글(Google)은 더치 경매(Dutch Auction) 방식으로 주당 85달러에 나스닥에 상장하며 웹 2.0 및 글로벌 빅테크 시대를 개막했습니다.';
      case 'KR_068270':
        return '2005년 셀트리온의 등장은 대한민국에 바이오시밀러(바이오의약품 복제약)라는 새로운 바이오 헬스케어 미래 먹거리를 개척했습니다.';
      case 'KR_086790':
        return '2005년 하나금융지주 상장은 서울은행 및 외환은행 통합을 앞두고 초대형 메가뱅크로 성장하는 기틀이 되었습니다.';
      case 'KR_105560':
        return '2008년 글로벌 금융위기 국면에서 KB금융지주가 출범 상장하여 대한민국 최대 리테일 소매금융 지주사로 발돋움했습니다.';
      case 'KR_032830':
        return '2010년 5월 삼성생명의 상장은 국내 금융사 사상 최대 규모의 IPO로 유가증권시장에 입성했습니다.';
      case 'US_TSLA':
        return '2010년 6월 29일 일론 머스크의 테슬라는 1956년 포드 이후 미국 자동차 제조사로는 반세기 만에 나스닥에 상장하며 전기차 혁명을 시작했습니다.';
      case 'US_META':
        return '2012년 5월 18일 마크 저커버그의 페이스북(현 메타)은 1,000억 달러 가치로 나스닥에 상장하며 전 세계 소셜 네트워크 시대를 주도했습니다.';
      case 'KR_028260':
        return '2014년 제일모직과 삼성물산의 합병 및 상장은 삼성그룹 지배구조 개편과 글로벌 건설·상사·패션의 핵심 지주사 역할을 공고히 했습니다.';
      case 'KR_207940':
        return '2016년 11월 삼성바이오로직스는 세계 최대 규모의 바이오의약품 위탁생산(CDMO) 기지를 바탕으로 코스피 시장에 화려하게 데뷔했습니다.';
      default:
        return listingEvent?.businessSummaryAsOfDate || currentStock.description || '혁신적인 기술력과 비즈니스 모델로 시장의 주목을 받으며 공식 상장되었습니다.';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-modal-title"
    >
      <div className="bg-white border-2 border-amber-400/80 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.3)] space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden my-auto">
        {/* Top Gold Shimmer Bar */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-400 via-rose-500 via-indigo-500 to-amber-400 animate-pulse" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleComplete}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer z-10"
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div className="flex items-start gap-3 border-b border-slate-100 pb-3 pr-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30 shrink-0">
            <Sparkles size={26} className="animate-bounce" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-2xs">
                <Flame size={12} className="text-amber-600 fill-amber-500" />
                {targetYear}년 거래소 신규 상장(IPO) 안내
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                (신규 편입 가능: {totalCount}개사)
              </span>
            </div>
            <h2 id="listing-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
              역사적 신규 기업 상장 공시
            </h2>
          </div>
        </div>

        {/* Multi-Stock Tabs if multiple listings */}
        {totalCount > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
            {listedStocks.map((stk, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={stk.canonicalCompanyId}
                  type="button"
                  onClick={() => handleSelectIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{stk.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
                  <span>{stk.currentName}</span>
                  <span className="text-[10px] opacity-75 font-mono">({idx + 1}/{totalCount})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-amber-50/40 rounded-2xl p-4 sm:p-5 border border-indigo-100/80 space-y-4 shadow-sm">
          {/* Company Title & Market Badges */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg border ${
                    currentStock.market === 'KR'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {currentStock.market === 'KR' ? '🇰🇷 한국거래소 (KRX)' : '🇺🇸 미국 나스닥 / NYSE'}
                </span>
                <span className="text-xs font-mono font-extrabold text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                  {currentStock.currentTicker}
                </span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                  {currentStock.sectorHistory?.[0]?.sector || '성장 유망 산업'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                {currentStock.currentName}
              </h3>
            </div>

            <div className="text-right shrink-0 bg-white/90 p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1 justify-end">
                <Calendar size={12} className="text-slate-400" /> 공식 상장일
              </span>
              <span className="text-sm font-mono font-black text-slate-900 block mt-0.5">
                {currentStock.firstTradingDate || currentStock.listingDate}
              </span>
            </div>
          </div>

          {/* Business Summary */}
          <div className="bg-white/95 p-3.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Building2 size={14} className="text-indigo-600" /> 기업 개요 및 주요 비즈니스
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {listingEvent?.businessSummaryAsOfDate || currentStock.description || '혁신적인 기술력과 지속 가능한 비즈니스 모델로 시장의 주목을 받으며 공식 상장되었습니다.'}
            </p>
          </div>

          {/* Historical Significance Callout */}
          <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/90 space-y-1 shadow-2xs text-amber-950">
            <span className="text-xs font-extrabold flex items-center gap-1.5 text-amber-900">
              <TrendingUp size={14} className="text-amber-600" /> 💡 당시 역사적 상장 배경 및 투자 관전 포인트
            </span>
            <p className="text-xs leading-relaxed font-medium text-amber-900/90">
              {getHistoricalSignificance(currentStock.canonicalCompanyId)}
            </p>
          </div>

          {/* Key IPO Pricing Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-white/95 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans font-bold block">공모가 (IPO Price)</span>
              <span className="text-sm font-black text-indigo-700">
                {listingEvent?.ipoOfferingPrice
                  ? (currentStock.market === 'US' ? `$${listingEvent.ipoOfferingPrice}` : formatKRW(listingEvent.ipoOfferingPrice))
                  : '정규시장 기준가'}
              </span>
            </div>
            <div className="p-2.5 bg-white/95 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans font-bold block">상장 시점 시초가/종가</span>
              <span className="text-sm font-black text-slate-800">
                {listingEvent?.firstValidPrice
                  ? (currentStock.market === 'US' ? `$${listingEvent.firstValidPrice}` : formatKRW(listingEvent.firstValidPrice))
                  : '시장 거래 개시'}
              </span>
            </div>
            <div className="p-2.5 bg-white/95 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 font-sans font-bold block">기업도감 & 거래소</span>
              <span className="text-xs font-black text-emerald-700 flex items-center gap-1 font-sans mt-0.5">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> 매수 잠금 해제
              </span>
            </div>
          </div>
        </div>

        {/* Informational Guidance Banner */}
        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900 font-medium">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-blue-600 shrink-0" />
            <span>
              <strong>{targetYear}년 포트폴리오 의사결정</strong> 시 마켓 종목 탐색에서 해당 기업을 자유롭게 매수/비중 조정할 수 있습니다.
            </span>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Watchlist & Detail Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {onToggleWatchlist && (
              <button
                type="button"
                onClick={() => onToggleWatchlist(currentStock.canonicalCompanyId)}
                className={`px-3.5 py-2 rounded-xl border font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                  isWatchlisted
                    ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star size={14} className={isWatchlisted ? 'fill-amber-400 text-amber-500' : ''} />
                <span>{isWatchlisted ? '관심종목 해제' : '관심종목 추가'}</span>
              </button>
            )}

            {onSelectStock && (
              <button
                type="button"
                onClick={() => {
                  onSelectStock(currentStock.canonicalCompanyId);
                  handleComplete();
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer"
              >
                종목 분석 보기
              </button>
            )}

            {onAddToPortfolio && (
              <button
                type="button"
                onClick={() => {
                  onAddToPortfolio(currentStock.canonicalCompanyId);
                  audioManager.playUiSound('success');
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle size={14} className="text-emerald-600" />
                <span>+ 즉시 10% 담기</span>
              </button>
            )}
          </div>

          {/* Next / Complete Flow Actions */}
          <div className="flex items-center gap-2">
            {totalCount > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={15} /> 이전
                </button>
                {currentIndex < totalCount - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                  >
                    다음 ({currentIndex + 2}/{totalCount}) <ChevronRight size={15} />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleComplete}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>{currentIndex === totalCount - 1 || totalCount === 1 ? `${targetYear}년 포트폴리오 구성하기` : '확인 완료'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
