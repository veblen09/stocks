import React from 'react';
import { ASSETS } from '../data/assets';
import { formatMoney } from '../utils/formatMoney';
import { RiskBadge } from './RiskBadge';
import { audioManager } from '../utils/audioManager';
import { useGame } from '../store/gameStore';
import { 
  Shield, 
  Landmark, 
  Building2, 
  FileText, 
  Coins, 
  Sprout, 
  Home, 
  X, 
  Info, 
  CheckCircle2, 
  Lock
} from 'lucide-react';

interface AssetCategoryDetailModalProps {
  categoryId: string | null;
  onClose: () => void;
  allocations: { [assetId: string]: number };
  changes: { [assetId: string]: number };
  remainingCash: number;
  totalAvailableCash: number;
  onSliderChange: (assetId: string, value: number) => void;
  onValueChange: (assetId: string, delta: number) => void;
  onOpenEducationTip: (assetId: string) => void;
  lastHistoryReturns?: { [assetId: string]: number };
}

export const AssetCategoryDetailModal: React.FC<AssetCategoryDetailModalProps> = ({
  categoryId,
  onClose,
  allocations,
  changes,
  remainingCash,
  onSliderChange,
  onValueChange,
  onOpenEducationTip,
  lastHistoryReturns
}) => {
  const { state, liquidateHousing, toggleHousingActive, sellHouse, buyHouse } = useGame();
  const { isHousingActive, loans } = state;

  if (!categoryId || categoryId === 'stocks') return null;

  // 카테고리에 속한 자산 목록 결정
  const getCategoryAssetIds = (id: string): string[] => {
    switch (id) {
      case 'cash': return ['cash'];
      case 'savings': return ['deposit', 'saving'];
      case 'etf': return ['korea_etf', 'global_etf'];
      case 'debt': return ['bond'];
      case 'gold': return ['gold'];
      case 'pension': return ['pension'];
      case 'housing': return ['housing'];
      case 'real_estate': return ['rent_deposit', 'house'];
      default: return [];
    }
  };

  const assetIds = getCategoryAssetIds(categoryId);
  const categoryAssets = ASSETS.filter((a) => assetIds.includes(a.id));

  const getCategoryMeta = (id: string) => {
    switch (id) {
      case 'cash':
        return {
          title: '비상금 및 입출금 통장',
          desc: '언제든 인출 가능한 안전 방패 자산으로, 긴급 상황 시 다른 투자 자산 매각을 방어합니다.',
          icon: <Shield size={22} className="text-teal-600" />,
          themeBg: 'from-teal-50/80 via-emerald-50/40 to-white',
          themeBorder: 'border-teal-100',
          accentBtn: 'from-teal-600 to-emerald-600'
        };
      case 'savings':
        return {
          title: '안전 저축 (정기예금 & 적금)',
          desc: '원금보장형 확정금리 저축 상품으로, 종잣돈(시드머니)을 안정적으로 모으기에 최적입니다.',
          icon: <Landmark size={22} className="text-cyan-600" />,
          themeBg: 'from-cyan-50/80 via-sky-50/40 to-white',
          themeBorder: 'border-cyan-100',
          accentBtn: 'from-cyan-600 to-sky-600'
        };
      case 'etf':
        return {
          title: '시장 지수형 ETF (국내 & 글로벌)',
          desc: '수백 개 대표 우량 기업에 분산 투자하여 개별 기업 파산 위험을 획기적으로 낮춘 상장지수펀드입니다.',
          icon: <Building2 size={22} className="text-blue-600" />,
          themeBg: 'from-blue-50/80 via-indigo-50/40 to-white',
          themeBorder: 'border-blue-100',
          accentBtn: 'from-blue-600 to-indigo-600'
        };
      case 'debt':
        return {
          title: '국채·채권형 펀드 (확정 이자 수익)',
          desc: '국가나 우량 기업에 돈을 빌려주고 정기 이자를 받는 안정성 자산입니다. (시장 금리와 역의 관계)',
          icon: <FileText size={22} className="text-slate-600" />,
          themeBg: 'from-slate-100/80 via-zinc-50/50 to-white',
          themeBorder: 'border-slate-200',
          accentBtn: 'from-slate-700 to-slate-900'
        };
      case 'gold':
        return {
          title: '실물 금 (골드뱅킹·안전자산)',
          desc: '고물가(인플레이션)나 글로벌 금융위기 시 종이 화폐 가치 하락을 방어해 주는 대표 실물 자산입니다.',
          icon: <Coins size={22} className="text-amber-600" />,
          themeBg: 'from-amber-50/80 via-yellow-50/40 to-white',
          themeBorder: 'border-amber-100',
          accentBtn: 'from-amber-500 to-amber-600'
        };
      case 'pension':
        return {
          title: '연금저축·IRP (절세 및 노후 자산)',
          desc: '매년 강력한 세액공제 혜택과 비과세 복리 효과로 든든한 은퇴 생활을 준비하는 장기 저축입니다.',
          icon: <Sprout size={22} className="text-emerald-600" />,
          themeBg: 'from-emerald-50/80 via-teal-50/40 to-white',
          themeBorder: 'border-emerald-100',
          accentBtn: 'from-emerald-600 to-teal-600'
        };
      case 'housing':
        return {
          title: '주택청약 종합저축 (내 집 마련)',
          desc: '새 아파트 분양권을 얻기 위한 필수 저축으로, 가입 기간과 납입 횟수에 따라 청약 가점이 부여됩니다.',
          icon: <Home size={22} className="text-pink-600" />,
          themeBg: 'from-pink-50/80 via-rose-50/40 to-white',
          themeBorder: 'border-pink-100',
          accentBtn: 'from-pink-600 to-rose-600'
        };
      case 'real_estate':
        return {
          title: '부동산 자산 (임차보증금 & 실물주택)',
          desc: '거주 안정성과 인플레이션 헷지 기능을 제공하는 실물 주거 자산 관리 패널입니다.',
          icon: <Home size={22} className="text-indigo-600" />,
          themeBg: 'from-indigo-50/80 via-purple-50/40 to-white',
          themeBorder: 'border-indigo-100',
          accentBtn: 'from-indigo-600 to-purple-600'
        };
      default:
        return {
          title: '자산 세부 설정',
          desc: '자산의 기대수익률과 위험도를 분석하고 원하는 비중을 배분하세요.',
          icon: <Shield size={22} className="text-blue-600" />,
          themeBg: 'from-slate-50 to-white',
          themeBorder: 'border-slate-100',
          accentBtn: 'from-blue-600 to-blue-700'
        };
    }
  };

  const meta = getCategoryMeta(categoryId);

  // 카테고리 합계 계산
  const totalCatVal = categoryAssets.reduce((sum, a) => sum + (allocations[a.id] || 0), 0);
  const totalCatChange = categoryAssets.reduce((sum, a) => sum + (changes[a.id] || 0), 0);
  const plannedCatVal = parseFloat((totalCatVal + totalCatChange).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className={`bg-white/95 backdrop-blur-xl rounded-3xl border ${meta.themeBorder} shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col relative overflow-hidden animate-zoom-in text-slate-700`}>
        
        {/* Modal Header */}
        <div className={`p-5 sm:p-6 pb-4 border-b border-slate-150 flex items-center justify-between bg-gradient-to-r ${meta.themeBg}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white shadow-sm border border-slate-200/60 rounded-2xl flex-shrink-0">
              {meta.icon}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                {meta.title}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5 max-w-xl">
                {meta.desc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { audioManager.playSound('click'); onClose(); }}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer flex-shrink-0"
            aria-label="모달 닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Summary Bar */}
        <div className="bg-slate-50/80 px-5 sm:px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-slate-400">현재 총액:</span>
              <span className="text-slate-800 font-black">{formatMoney(totalCatVal)}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-slate-400">이번 배분 조정:</span>
              <span className={`font-black ${totalCatChange > 0 ? 'text-emerald-600' : totalCatChange < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {totalCatChange > 0 ? '+' : ''}{formatMoney(totalCatChange)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-slate-400">조정 후 예정:</span>
              <span className="text-slate-900 font-black text-sm">{formatMoney(plannedCatVal)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 font-semibold">전체 잔여 가용 현금:</span>
            <span className={`font-black ${remainingCash < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
              {formatMoney(remainingCash)}
            </span>
          </div>
        </div>

        {/* Asset Items List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 max-h-[55vh]">
          {categoryAssets.map((asset) => {
            const currentVal = allocations[asset.id] || 0;
            const change = changes[asset.id] || 0;
            const newVal = parseFloat((currentVal + change).toFixed(2));
            const actualReturn = lastHistoryReturns?.[asset.id];

            return (
              <div
                key={asset.id}
                className="p-4.5 bg-white rounded-2xl border border-slate-150 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col gap-3.5"
              >
                {/* Title & Info */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                      {asset.name}
                    </h4>
                    <RiskBadge score={asset.riskScore} />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-650 border border-slate-200">
                      💧 유동성 {asset.liquidityScore}/10
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenEducationTip(asset.id)}
                      className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                      title="금융 학습 설명 상세 보기"
                    >
                      <Info size={15} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 text-[11px] font-bold flex-wrap">
                    <span>
                      기대수익률: <strong className="text-rose-500 font-extrabold">연 {asset.expectedReturn}%</strong>
                    </span>
                    {asset.dividendYield !== undefined && asset.dividendYield > 0 && (
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                        배당: <strong className="font-extrabold">연 {asset.dividendYield}%</strong>
                      </span>
                    )}
                    {asset.id === 'rent_deposit' ? (
                      <span className="text-slate-400">수익률: 0% 고정</span>
                    ) : actualReturn !== undefined ? (
                      <span>
                        직전 수익: <strong className={`font-extrabold ${actualReturn > 0 ? 'text-rose-500' : actualReturn < 0 ? 'text-blue-500' : 'text-slate-500'}`}>
                          {actualReturn > 0 ? '+' : ''}{actualReturn}%
                        </strong>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Description & Education Tip */}
                <div className="space-y-1.5 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {asset.description}
                  </p>
                  <p className="text-[10.5px] text-blue-600/90 font-medium leading-normal bg-blue-50/50 p-2 rounded-lg border border-blue-100/40">
                    💡 <strong>교육 팁:</strong> {asset.educationTip}
                  </p>
                </div>

                {/* Values Strip */}
                <div className="grid grid-cols-3 gap-2 text-xs py-1 text-center font-bold">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">현재 잔액</span>
                    <span className="text-slate-700">{formatMoney(currentVal)}</span>
                  </div>
                  <div className="bg-blue-50/30 p-2 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-600 block font-medium">이번 배분 조정</span>
                    <span className={change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-slate-400'}>
                      {change > 0 ? '+' : ''}{formatMoney(change)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">조정 후 잔액</span>
                    <span className="text-slate-900 font-black">{formatMoney(newVal)}</span>
                  </div>
                </div>

                {/* Special Case Controls */}
                {asset.id === 'rent_deposit' ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold flex items-center gap-2">
                    <Lock size={15} className="text-slate-400" />
                    <span>임차보증금은 주거 독립/이사 등 이벤트로만 변동되는 고정 부동산 자산입니다.</span>
                  </div>
                ) : asset.id === 'house' ? (
                  currentVal > 0 ? (
                    /* 소유 중: 매도 패널 */
                    <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2 text-left">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                        <span>🏠 소유 주택 관리 (현재 시세: {formatMoney(currentVal)})</span>
                        {loans.mortgage > 0 && (
                          <span className="text-rose-600">담보대출: {formatMoney(loans.mortgage)}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const net = Math.max(0, currentVal - loans.mortgage);
                          const msg = `소유 주택(시세 ${formatMoney(currentVal)})을 매도하시겠습니까?\n\n` +
                            (loans.mortgage > 0 ? `• 주택담보대출 ${formatMoney(loans.mortgage)}이 자동 전액 상환됩니다.\n` : '') +
                            `• 순 매도금 ${formatMoney(net)}이 비상금 통장으로 전액 입금됩니다.`;
                          if (window.confirm(msg)) {
                            sellHouse();
                            onClose();
                          }
                        }}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl transition shadow-sm cursor-pointer"
                      >
                        🏠 주택 시세 매도 및 담보대출 상환
                      </button>
                    </div>
                  ) : (
                    /* 무주택: 매입 패널 */
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-left">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>🏠 내 집 마련 (실물 주택 매입)</span>
                        <span className="text-[10px] text-slate-400">LTV 60% 담보대출 (자기자본 40%)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                        {[
                          { key: 'gyeonggi_outer', name: '경기 외곽 아파트', price: 18000 },
                          { key: 'bundang', name: '분당·판교 신도시', price: 32000 },
                          { key: 'mapo', name: '마포·용산 역세권', price: 45000 },
                          { key: 'gangnam', name: '강남 대형 아파트', price: 75000 },
                        ].map((item) => {
                          const downPayment = item.price * 0.4;
                          const canAfford = (allocations['cash'] || 0) >= downPayment;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              disabled={!canAfford}
                              onClick={() => {
                                if (window.confirm(`🏠 ${item.name} (${formatMoney(item.price)})을 매입하시겠습니까?\n\n• 필요 자기자본: ${formatMoney(downPayment)}\n• 담보대출: ${formatMoney(item.price * 0.6)}`)) {
                                  buyHouse(item.key as any, item.price);
                                  onClose();
                                }
                              }}
                              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition shadow-sm ${
                                canAfford 
                                  ? 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50 cursor-pointer font-bold'
                                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <div className="text-[11px] font-black flex justify-between">
                                <span>{item.name}</span>
                                <span className="text-purple-600 font-extrabold">{formatMoney(item.price)}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">필요 현금: {formatMoney(downPayment)} {canAfford ? '✅' : '❌'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : asset.id === 'housing' ? (
                  (state.allocations['house'] || 0) > 0 ? (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-left">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-emerald-800">🏠 청약 당첨 완료 (통장 해지)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">내 집 마련 성공</span>
                      </div>
                      <p className="text-xs text-slate-650 font-medium leading-relaxed">
                        이미 아파트 청약에 당첨되어 내 집을 마련하셨습니다. 청약 통장 원금은 분양 계약금으로 전액 충당 및 효력이 종료되어 자동 납입이 완료(해지)되었습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-left">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">🎯 청약 자동 납입 관리</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isHousingActive ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                          {isHousingActive ? '매월 10만 원 자동 납입 중' : '자동 납입 일시 정지됨'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={toggleHousingActive}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition shadow-sm cursor-pointer ${
                            isHousingActive 
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {isHousingActive ? '납입 일시 정지' : currentVal === 0 ? '청약 가입하기' : '자동 납입 재개'}
                        </button>

                        {currentVal > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('🚨 청약 통장을 중도 해지하시겠습니까? 누적 금액은 환원되지만 청약 가점 점수는 완전히 소멸합니다.')) {
                                liquidateHousing();
                                onClose();
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            청약 전액 해지
                          </button>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  /* Normal Sliders & Controls */
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={-currentVal}
                        max={remainingCash + change}
                        step={10}
                        value={change}
                        onChange={(e) => onSliderChange(asset.id, parseFloat(e.target.value) || 0)}
                        className="flex-grow h-2 bg-slate-100 rounded-lg cursor-pointer accent-blue-600"
                        aria-label={`${asset.name} 배분 슬라이더`}
                      />
                      {/* 직접 입력 인풋 */}
                      <div className="flex items-center gap-1 flex-shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                        <span className="text-[10px] text-slate-400 font-bold">조정:</span>
                        <input
                          type="number"
                          min={-currentVal}
                          max={remainingCash + change}
                          step={10}
                          value={change === 0 ? '' : change}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              onSliderChange(asset.id, val);
                            }
                          }}
                          className="w-16 text-xs text-right font-extrabold text-slate-800 bg-transparent focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 font-bold">만</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1 flex-wrap gap-1">
                      <span>최대 회수: -{currentVal > 0 ? formatMoney(currentVal) : '0원'}</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => { audioManager.playSound('click'); onValueChange(asset.id, -100); }}
                          disabled={currentVal + change <= 0}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition font-bold cursor-pointer"
                        >
                          -100만
                        </button>
                        <button
                          type="button"
                          onClick={() => { audioManager.playSound('click'); onValueChange(asset.id, -10); }}
                          disabled={currentVal + change <= 0}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition font-bold cursor-pointer"
                        >
                          -10만
                        </button>
                        <button
                          type="button"
                          onClick={() => { audioManager.playSound('click'); onValueChange(asset.id, 10); }}
                          disabled={remainingCash < 10}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition font-bold cursor-pointer"
                        >
                          +10만
                        </button>
                        <button
                          type="button"
                          onClick={() => { audioManager.playSound('click'); onValueChange(asset.id, 100); }}
                          disabled={remainingCash < 100}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition font-bold cursor-pointer"
                        >
                          +100만
                        </button>
                        {currentVal > 0 && (
                          <button
                            type="button"
                            onClick={() => { audioManager.playSound('click'); onSliderChange(asset.id, -currentVal); }}
                            className="px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 hover:bg-rose-100 transition font-bold cursor-pointer"
                          >
                            전액회수
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-150 flex items-center justify-between gap-4">
          <div className="text-xs font-bold">
            <span className="text-slate-400">{meta.title} 예정 총액: </span>
            <span className="text-slate-900 font-black text-sm">{formatMoney(plannedCatVal)}</span>
          </div>

          <button
            type="button"
            onClick={() => { audioManager.playSound('success'); onClose(); }}
            className={`px-8 py-3 bg-gradient-to-r ${meta.accentBtn} hover:opacity-95 text-white font-extrabold rounded-2xl shadow-md transition transform active:scale-95 cursor-pointer text-xs sm:text-sm flex items-center gap-1.5`}
          >
            <CheckCircle2 size={16} /> 설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};
