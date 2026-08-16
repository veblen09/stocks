import React from 'react';
import { ASSETS } from '../data/assets';
import { formatMoney } from '../utils/formatMoney';
import { RiskBadge } from './RiskBadge';
import { audioManager } from '../utils/audioManager';
import { 
  TrendingUp, 
  Sparkles, 
  X, 
  Info, 
  Zap, 
  Globe, 
  Scale, 
  RotateCcw, 
  CheckCircle2,
  Building2,
  Cpu,
  Flame,
  Car
} from 'lucide-react';

interface StockPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  allocations: { [assetId: string]: number };
  changes: { [assetId: string]: number };
  remainingCash: number;
  totalAvailableCash: number;
  onSliderChange: (assetId: string, value: number) => void;
  onValueChange: (assetId: string, delta: number) => void;
  onOpenEducationTip: (assetId: string) => void;
  lastHistoryReturns?: { [assetId: string]: number };
  setBatchChanges: (newChanges: { [assetId: string]: number }) => void;
}

export const StockPortfolioModal: React.FC<StockPortfolioModalProps> = ({
  isOpen,
  onClose,
  allocations,
  changes,
  remainingCash,
  totalAvailableCash,
  onSliderChange,
  onValueChange,
  onOpenEducationTip,
  lastHistoryReturns,
  setBatchChanges
}) => {
  if (!isOpen) return null;

  // 개별 주식 목록 필터링
  const stockAssets = ASSETS.filter((a) => a.id.startsWith('stock_'));

  // 현재 개별 주식 총액 및 배분액 계산
  const currentTotalStock = stockAssets.reduce((sum, a) => sum + (allocations[a.id] || 0), 0);
  const totalStockChange = stockAssets.reduce((sum, a) => sum + (changes[a.id] || 0), 0);
  const plannedTotalStock = parseFloat((currentTotalStock + totalStockChange).toFixed(2));

  // 종목별 아이콘 및 뱃지 헬퍼
  const getStockVisuals = (id: string) => {
    switch (id) {
      case 'stock_samsung':
        return {
          icon: <Cpu size={16} className="text-blue-600" />,
          tag: '국내 반도체 1위',
          tagColor: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'stock_skhynix':
        return {
          icon: <Cpu size={16} className="text-red-600" />,
          tag: '글로벌 HBM 메모리',
          tagColor: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'stock_nvidia':
        return {
          icon: <Flame size={16} className="text-emerald-600" />,
          tag: 'AI GPU 칩 독점',
          tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'stock_apple':
        return {
          icon: <Globe size={16} className="text-slate-800" />,
          tag: '미국 시총 1위 IT 생태계',
          tagColor: 'bg-slate-100 text-slate-800 border-slate-200'
        };
      case 'stock_tesla':
        return {
          icon: <Car size={16} className="text-rose-600" />,
          tag: '자율주행·전기차 혁신',
          tagColor: 'bg-rose-50 text-rose-700 border-rose-200'
        };
      case 'stock_hyundai':
        return {
          icon: <Building2 size={16} className="text-slate-600" />,
          tag: '글로벌 완성차 밸류업',
          tagColor: 'bg-slate-50 text-slate-700 border-slate-200'
        };
      case 'stock_nokia':
        return {
          icon: <Globe size={16} className="text-purple-600" />,
          tag: '모바일 1위 (과거사례)',
          tagColor: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      case 'stock_blackberry':
        return {
          icon: <TrendingUp size={16} className="text-pink-600" />,
          tag: '비즈니스 폰 (과거사례)',
          tagColor: 'bg-pink-50 text-pink-700 border-pink-200'
        };
      default:
        return {
          icon: <TrendingUp size={16} className="text-slate-600" />,
          tag: '개별 기업',
          tagColor: 'bg-slate-50 text-slate-600 border-slate-200'
        };
    }
  };

  // 스마트 원클릭 프리셋 핸들러
  const handleApplyPreset = (type: 'ai_semiconductor' | 'bigtech' | 'equal' | 'korea' | 'clear') => {
    audioManager.playSound('click');

    const newChanges = { ...changes };
    const stockIds = stockAssets.map((s) => s.id);

    // 개별 주식 이외 다른 자산들의 총 배분액 계산
    const nonStockChangesSum = Object.keys(changes)
      .filter((id) => !stockIds.includes(id))
      .reduce((sum, id) => sum + (changes[id] || 0), 0);

    // 개별 주식군에 투입 가능한 순수 현금 여력
    const availableCashForStocks = Math.max(0, totalAvailableCash - nonStockChangesSum);

    if (type === 'clear') {
      // 전액 매도 (보유한 만큼 전부 -로 설정하여 현금화)
      stockIds.forEach((id) => {
        const curVal = allocations[id] || 0;
        newChanges[id] = -curVal;
      });
    } else if (type === 'equal') {
      // 8종목 전체에 기존 주식 잔액 + 가용 현금을 1/N로 균등 리밸런싱
      const totalPool = currentTotalStock + availableCashForStocks;
      const targetPerStock = Math.floor(totalPool / stockIds.length);
      stockIds.forEach((id) => {
        const curVal = allocations[id] || 0;
        newChanges[id] = targetPerStock - curVal;
      });
    } else if (type === 'ai_semiconductor') {
      // AI 및 반도체 3대장 (삼성전자, SK하이닉스, 엔비디아) 집중
      const targetIds = ['stock_samsung', 'stock_skhynix', 'stock_nvidia'];
      // 타 종목 전액 매도
      stockIds.forEach((id) => {
        if (!targetIds.includes(id)) {
          newChanges[id] = -(allocations[id] || 0);
        }
      });
      // 전체 주식 풀 + 가용 현금을 타겟 3종목에 균등 배분
      const totalPool = currentTotalStock + availableCashForStocks;
      const targetPerStock = Math.floor(totalPool / targetIds.length);
      targetIds.forEach((id) => {
        const curVal = allocations[id] || 0;
        newChanges[id] = targetPerStock - curVal;
      });
    } else if (type === 'bigtech') {
      // 글로벌 빅테크 3대장 (애플, 엔비디아, 테슬라) 집중
      const targetIds = ['stock_apple', 'stock_nvidia', 'stock_tesla'];
      stockIds.forEach((id) => {
        if (!targetIds.includes(id)) {
          newChanges[id] = -(allocations[id] || 0);
        }
      });
      const totalPool = currentTotalStock + availableCashForStocks;
      const targetPerStock = Math.floor(totalPool / targetIds.length);
      targetIds.forEach((id) => {
        const curVal = allocations[id] || 0;
        newChanges[id] = targetPerStock - curVal;
      });
    } else if (type === 'korea') {
      // 국내 대표주 3대장 (삼성전자, SK하이닉스, 현대차) 집중
      const targetIds = ['stock_samsung', 'stock_skhynix', 'stock_hyundai'];
      stockIds.forEach((id) => {
        if (!targetIds.includes(id)) {
          newChanges[id] = -(allocations[id] || 0);
        }
      });
      const totalPool = currentTotalStock + availableCashForStocks;
      const targetPerStock = Math.floor(totalPool / targetIds.length);
      targetIds.forEach((id) => {
        const curVal = allocations[id] || 0;
        newChanges[id] = targetPerStock - curVal;
      });
    }

    setBatchChanges(newChanges);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-purple-100 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col relative overflow-hidden animate-zoom-in text-slate-700">
        
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-150 flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-purple-500/20">
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  🚀 개별 주식 포트폴리오 세부 설정
                </h3>
                <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
                  8개 대표 종목
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                기업별 실적과 성장 테마를 분석하여 원하는 종목의 비중을 직접 정밀하게 조율해 보세요.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { audioManager.playSound('click'); onClose(); }}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="모달 닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Sticky Summary Bar */}
        <div className="bg-slate-50/80 px-5 sm:px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-slate-400">개별 주식 현재 총액:</span>
              <span className="text-slate-800 font-black">{formatMoney(currentTotalStock)}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-slate-400">이번 배분 조정:</span>
              <span className={`font-black ${totalStockChange > 0 ? 'text-emerald-600' : totalStockChange < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {totalStockChange > 0 ? '+' : ''}{formatMoney(totalStockChange)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-slate-400">조정 후 예정 총액:</span>
              <span className="text-purple-700 font-black text-sm">{formatMoney(plannedTotalStock)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 font-semibold">전체 잔여 가용 현금:</span>
            <span className={`font-black ${remainingCash < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
              {formatMoney(remainingCash)}
            </span>
          </div>
        </div>

        {/* Smart Preset Buttons */}
        <div className="px-5 sm:px-6 pt-3.5 pb-2 bg-white flex flex-wrap items-center gap-2 select-none border-b border-slate-50">
          <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1 mr-1">
            <Sparkles size={13} className="text-purple-600" /> 간편 테마 배분:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('ai_semiconductor')}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Zap size={12} /> ⚡ AI·반도체 선도주
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('bigtech')}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Globe size={12} /> 🌐 글로벌 빅테크
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('korea')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Building2 size={12} /> 🇰🇷 한국 대표 우량주
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('equal')}
            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Scale size={12} /> ⚖️ 8종목 균등 배분
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('clear')}
            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ml-auto"
          >
            <RotateCcw size={12} /> 🔄 전액 매도 (현금화)
          </button>
        </div>

        {/* Stock Items Grid / Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 max-h-[52vh]">
          {stockAssets.map((asset) => {
            const currentVal = allocations[asset.id] || 0;
            const change = changes[asset.id] || 0;
            const newVal = parseFloat((currentVal + change).toFixed(2));
            const visuals = getStockVisuals(asset.id);
            const actualReturn = lastHistoryReturns?.[asset.id];

            return (
              <div 
                key={asset.id}
                className="p-4 bg-white rounded-2xl border border-slate-150 hover:border-purple-300 hover:shadow-sm transition-all flex flex-col gap-3.5"
              >
                {/* Stock Title & Badges */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0">
                      {visuals.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                          {asset.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${visuals.tagColor}`}>
                          {visuals.tag}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <RiskBadge score={asset.riskScore} />
                    <button
                      type="button"
                      onClick={() => onOpenEducationTip(asset.id)}
                      className="p-1 text-slate-400 hover:text-purple-600 transition cursor-pointer"
                      title="금융 학습 설명 보기"
                    >
                      <Info size={15} />
                    </button>
                  </div>
                </div>

                {/* Description & Metrics */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10.5px] bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 font-semibold">
                  <span className="text-slate-500 leading-snug">
                    {asset.description}
                  </span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span>
                      기대수익: <strong className="text-rose-500 font-extrabold">연 {asset.expectedReturn}%</strong>
                    </span>
                    {actualReturn !== undefined && (
                      <span>
                        직전 수익: <strong className={`font-extrabold ${actualReturn > 0 ? 'text-rose-500' : actualReturn < 0 ? 'text-blue-500' : 'text-slate-500'}`}>
                          {actualReturn > 0 ? '+' : ''}{actualReturn}%
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Values Strip */}
                <div className="grid grid-cols-3 gap-2 text-xs py-1 text-center font-bold">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">현재 잔액</span>
                    <span className="text-slate-700">{formatMoney(currentVal)}</span>
                  </div>
                  <div className="bg-purple-50/50 p-2 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-purple-600 block font-medium">이번 배분 조정</span>
                    <span className={change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-slate-400'}>
                      {change > 0 ? '+' : ''}{formatMoney(change)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">조정 후 잔액</span>
                    <span className="text-slate-900 font-black">{formatMoney(newVal)}</span>
                  </div>
                </div>

                {/* Controls (Slider + Direct Input + Steppers) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={-currentVal}
                      max={remainingCash + change}
                      step={10}
                      value={change}
                      onChange={(e) => onSliderChange(asset.id, parseFloat(e.target.value) || 0)}
                      className="flex-grow h-2 bg-slate-100 rounded-lg cursor-pointer accent-purple-600"
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
                          전액매도
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Education Insight Banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-purple-50/60 border-t border-purple-100/60 text-[10.5px] text-purple-900 font-semibold flex items-center gap-2 select-none">
          <span className="text-base">💡</span>
          <span>
            <strong>교육 핵심:</strong> 개별 기업 주식은 높은 수익 잠재력이 있지만 특정 기업의 위기(비체계적 위험)에 크게 노출됩니다. 여러 종목이나 지수형 ETF와 적절히 분산하는 것이 현명한 투자법입니다.
          </span>
        </div>

        {/* Modal Bottom Sticky Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-150 flex items-center justify-between gap-4">
          <div className="text-xs font-bold">
            <span className="text-slate-400">개별 주식 총 예정액: </span>
            <span className="text-purple-700 font-black text-sm">{formatMoney(plannedTotalStock)}</span>
          </div>

          <button
            type="button"
            onClick={() => { audioManager.playSound('success'); onClose(); }}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-md transition transform active:scale-95 cursor-pointer text-xs sm:text-sm flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} /> 설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};
