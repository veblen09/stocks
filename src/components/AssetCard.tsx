import React from 'react';
import type { Asset } from '../types/finance';
import { formatMoney } from '../utils/formatMoney';
import { RiskBadge } from './RiskBadge';
import { Shield, Landmark, Calendar, Building2, Globe, TrendingUp, FileText, Coins, Sprout, Home, Info } from 'lucide-react';
import { audioManager } from '../utils/audioManager';
import { useGame } from '../store/gameStore';

interface AssetCardProps {
  asset: Asset;
  currentVal: number;
  change: number;
  remainingCash: number;
  onSliderChange: (value: number) => void;
  onValueChange: (delta: number) => void;
  onInfoClick: () => void;
  actualReturn?: number;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  currentVal,
  change,
  remainingCash,
  onSliderChange,
  onValueChange,
  onInfoClick,
  actualReturn,
}) => {
  const { state, liquidateHousing, toggleHousingActive } = useGame();
  const { isHousingActive } = state;
  const newVal = parseFloat((currentVal + change).toFixed(2));

  const getAssetIcon = (id: string) => {
    switch (id) {
      case 'cash': return <Shield size={18} className="text-teal-500" />;
      case 'deposit': return <Landmark size={18} className="text-teal-600" />;
      case 'saving': return <Calendar size={18} className="text-teal-700" />;
      case 'korea_etf': return <Building2 size={18} className="text-orange-600" />;
      case 'global_etf': return <Globe size={18} className="text-blue-600" />;
      case 'stock_samsung': return <TrendingUp size={18} className="text-blue-600" />;
      case 'skhynix':
      case 'stock_skhynix': return <TrendingUp size={18} className="text-red-500" />;
      case 'stock_hyundai': return <Building2 size={18} className="text-slate-600" />;
      case 'stock_apple': return <Globe size={18} className="text-slate-800" />;
      case 'stock_nvidia': return <TrendingUp size={18} className="text-emerald-500" />;
      case 'stock_tesla': return <TrendingUp size={18} className="text-rose-500" />;
      case 'bond': return <FileText size={18} className="text-slate-500" />;
      case 'gold': return <Coins size={18} className="text-amber-500" />;
      case 'pension': return <Sprout size={18} className="text-emerald-500" />;
      case 'housing': return <Home size={18} className="text-pink-500" />;
      case 'rent_deposit': return <Home size={18} className="text-indigo-600" />;
      case 'house': return <Home size={18} className="text-purple-600" />;
      default: return <Shield size={18} />;
    }
  };

  return (
    <div className="p-5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4">
      {/* Top Asset Title & info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0">
            {getAssetIcon(asset.id)}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{asset.name}</h4>
            <div className="text-[10px] text-slate-400 mt-0.5 sm:hidden">{asset.description}</div>
          </div>
          <RiskBadge score={asset.riskScore} />
          <button 
            type="button"
            onClick={onInfoClick}
            className="text-slate-400 hover:text-emerald-500 transition-colors p-1 cursor-pointer"
            aria-label={`${asset.name} 금융 학습 설명 모달 팝업 열기`}
            title={`${asset.name} 상세 설명 보기`}
          >
            <Info size={14} />
          </button>
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          기대수익률: <span className="font-semibold text-rose-500">연 {asset.expectedReturn}%</span>
        </div>
      </div>

      {/* Description for larger screens */}
      <p className="hidden sm:block text-[10.5px] text-slate-500 leading-relaxed font-semibold -mt-1 select-text">
        {asset.description}
      </p>

      {/* Asset values grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs py-2.5 border-y border-dashed border-slate-100">
        <div>
          <span className="text-slate-400">현재 잔액:</span>{' '}
          <span className="font-semibold text-slate-600 select-text">{formatMoney(currentVal)}</span>
        </div>
        <div>
          <span className="text-slate-400">직전 수익률:</span>{' '}
          {actualReturn !== undefined ? (
            <span className={`font-bold select-text ${actualReturn > 0 ? 'text-rose-500' : actualReturn < 0 ? 'text-blue-500' : 'text-slate-500'}`}>
              {actualReturn > 0 ? '+' : ''}{actualReturn}%
            </span>
          ) : (
            <span className="text-slate-400 font-semibold">-</span>
          )}
        </div>
        <div>
          <span className="text-slate-400">이번 배분:</span>{' '}
          <span className={`font-bold select-text ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {change > 0 ? '+' : ''}{formatMoney(change)}
          </span>
        </div>
        <div>
          <span className="text-slate-400">예정 잔액:</span>{' '}
          <span className="font-bold text-slate-800 text-sm select-text">{formatMoney(newVal)}</span>
        </div>
      </div>

      {/* Sliders, labels, and adjustment buttons */}
      <div className="flex flex-col gap-2">
        {asset.id === 'rent_deposit' || asset.id === 'house' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-150 p-3 rounded-xl select-none text-left">
            <span className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 flex-shrink-0">
              🔒 계약 고정 자산
            </span>
            <span className="text-[10px] text-slate-400 font-semibold leading-normal">
              {asset.id === 'rent_deposit' 
                ? '임대차 계약으로 유동성이 잠긴 임차보증금입니다. (독립/이사 등 주거 이벤트로만 증감)'
                : '소유하신 실물 부동산 주택 자산입니다. (청약 당첨 또는 부동산 매입 이벤트로만 취득/처분)'}
            </span>
          </div>
        ) : asset.id === 'housing' ? (
          <div className="flex flex-col gap-3 bg-slate-50 border border-slate-150 p-3.5 rounded-xl select-none text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500 flex items-center gap-1.5">
                🎯 청약 관리 패널
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isHousingActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                {isHousingActive ? '매월 10만 원 자동 납입 중' : '자동 납입 일시 정지됨'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 select-none">
              <button
                type="button"
                onClick={toggleHousingActive}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition shadow-sm cursor-pointer ${
                  isHousingActive 
                    ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                }`}
              >
                {isHousingActive ? '납입 일시 정지' : currentVal === 0 ? '청약 가입하기' : '자동 납입 재개'}
              </button>

              {currentVal > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('🚨 청약 통장을 중도 해지하시겠습니까? 그동안 적립한 청약 금액은 전액 환원되지만 무주택 청약 가점 점수는 완전히 소멸하여 복구가 불가능합니다.')) {
                      liquidateHousing();
                    }
                  }}
                  className="flex-1 py-2 px-3 bg-rose-50 border border-rose-150 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  청약 전액 해지
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* 슬라이더 제어 */}
            <input
              type="range"
              min={-currentVal}
              max={remainingCash + change}
              step={50}
              value={change}
              onChange={(e) => onSliderChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg cursor-pointer accent-emerald-500"
              aria-label={`${asset.name} 배분 슬라이더`}
            />
            
            {/* 슬라이더 정보 라벨 (최대 회수, 조정액, 최대 추가 정보 추가) */}
            <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 select-none">
              <span>최대 회수: -{currentVal > 0 ? formatMoney(currentVal) : '0원'}</span>
              <span className="text-blue-600 font-extrabold">이번 조정: {change > 0 ? '+' : ''}{formatMoney(change)}</span>
              <span>최대 추가: +{remainingCash > 0 ? formatMoney(remainingCash) : '0원'}</span>
            </div>
            
            {/* 금액 조절 버튼 */}
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => { audioManager.playSound('click'); onValueChange(-100); }}
                disabled={currentVal + change <= 0}
                className="min-h-10 min-w-12 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-650 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition shadow-sm font-bold cursor-pointer"
              >
                -100만
              </button>
              <button
                type="button"
                onClick={() => { audioManager.playSound('click'); onValueChange(-10); }}
                disabled={currentVal + change <= 0}
                className="min-h-10 min-w-12 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-650 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition shadow-sm font-bold cursor-pointer"
              >
                -10만
              </button>
              <button
                type="button"
                onClick={() => { audioManager.playSound('click'); onValueChange(10); }}
                disabled={remainingCash < 10}
                className="min-h-10 min-w-12 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-650 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition shadow-sm font-bold cursor-pointer"
              >
                +10만
              </button>
              <button
                type="button"
                onClick={() => { audioManager.playSound('click'); onValueChange(100); }}
                disabled={remainingCash < 100}
                className="min-h-10 min-w-12 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-650 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition shadow-sm font-bold cursor-pointer"
              >
                +100만
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
