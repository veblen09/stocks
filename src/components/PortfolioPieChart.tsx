import React, { useState } from 'react';
import { ASSETS } from '../data/assets';
import { formatMoney } from '../utils/formatMoney';

interface PortfolioPieChartProps {
  allocations: { [assetId: string]: number };
}

// 자산별 색상 팔레트 정의 (안전계열: 청록, 성장계열: 파랑, 개별주식: 다채로운 테마, 부동산: 인디고/보라)
const ASSET_COLORS: { [assetId: string]: string } = {
  cash: '#14b8a6', // 청록 (Teal 500)
  deposit: '#0d9488', // 청록 (Teal 600)
  saving: '#0f766e', // 청록 (Teal 700)
  global_etf: '#2563eb', // 파랑 (Blue 600)
  korea_etf: '#ea580c', // 주황 (Orange 600)
  stock_samsung: '#1d4ed8', // 삼성 (Dark Blue)
  stock_skhynix: '#dc2626', // 하이닉스 (Red)
  stock_hyundai: '#475569', // 현대차 (Slate 600)
  stock_apple: '#334155', // 애플 (Dark Grey)
  stock_nvidia: '#059669', // 엔비디아 (Emerald 600)
  stock_tesla: '#e11d48', // 테슬라 (Rose 600)
  bond: '#64748b', // 채권 (Slate 500)
  gold: '#fbbf24', // 금 (Amber 400)
  pension: '#10b981', // 연금 (Emerald 500)
  housing: '#ec4899', // 청약 (Pink 500)
  rent_deposit: '#4338ca', // 임차보증금 (Indigo 700)
  house: '#6d28d9' // 실물주택 (Purple 700)
};

// 금액을 차트 내부에 간결하게 표기하기 위한 헬퍼 함수
const formatShortMoney = (valueInManWon: number): string => {
  const rounded = Math.round(valueInManWon);
  if (rounded === 0) return '0원';
  if (rounded < 0) return `-${formatShortMoney(Math.abs(rounded))}`;

  const eok = Math.floor(rounded / 10000);
  const man = rounded % 10000;

  let result = '';
  if (eok > 0) {
    result += `${eok.toLocaleString()}억`;
  }
  if (man > 0) {
    result += eok > 0 ? ` ${man.toLocaleString()}만` : `${man.toLocaleString()}만`;
  }
  return result;
};

export const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({ allocations }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 총 자산액 계산
  const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  if (total <= 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center h-full min-h-[220px]">
        <span className="text-3xl mb-2">💸</span>
        <p className="text-slate-400 text-sm">배분된 자산이 없습니다.</p>
      </div>
    );
  }

  // 자산별 비율 및 메타정보 취합
  const items = ASSETS.map((asset) => {
    const value = allocations[asset.id] || 0;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return {
      ...asset,
      value,
      percentage,
      color: ASSET_COLORS[asset.id] || '#cbd5e1'
    };
  })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value); // 큰 비중부터 정렬

  // 도넛 차트 그리기 데이터 연산
  const radius = 50;
  const strokeWidth = 20; // 텍스트 배치를 위해 기존 15에서 20으로 굵기 상향 조정
  const circumference = 2 * Math.PI * radius; // 약 314.16
  
  let accumulatedPercent = 0;

  const chartSlices = items.map((item, index) => {
    // 소수점 오차 누적으로 도넛 차트의 끝부분에 틈이 생기는 것을 완벽히 방지
    const isLast = index === items.length - 1;
    const percentage = isLast ? parseFloat((100 - accumulatedPercent).toFixed(4)) : item.percentage;

    const strokeLength = (percentage / 100) * circumference;
    // 음수 오프셋 방식을 사용하여 시계 방향으로 정확히 이어지도록 렌더링 오류 수정
    const strokeOffset = -((accumulatedPercent / 100) * circumference);
    
    // 라벨 텍스트의 중심점 배치를 위해 해당 세그먼트의 중심 각도(라디안) 계산
    const midPercent = accumulatedPercent + percentage / 2;
    const angle = (midPercent / 100) * 2 * Math.PI - Math.PI / 2;
    
    accumulatedPercent += percentage;

    return {
      id: item.id,
      name: item.name,
      percentage: item.percentage, // 표시용 툴팁 비율은 원본값 사용
      value: item.value,
      strokeLength,
      strokeOffset,
      color: item.color,
      angle
    };
  });

  const hoveredItem = items.find((item) => item.id === hoveredId);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-fade-in-up h-full flex flex-col justify-between">
      <h3 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-1.5">
        📊 현재 포트폴리오 비중
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-grow">
        {/* 도넛 SVG 영역 */}
        <div className="md:col-span-5 flex justify-center relative select-none">
          <svg viewBox="0 0 140 140" className="w-36 h-36">
            {/* 세그먼트 그룹 - 12시 방향부터 그려지도록 -90도 회전 */}
            <g transform="rotate(-90 70 70)">
              {chartSlices.map((slice) => {
                const isHovered = hoveredId === slice.id;
                return (
                  <circle
                    key={slice.id}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={`${slice.strokeLength} ${circumference}`}
                    strokeDashoffset={slice.strokeOffset}
                    strokeLinecap="butt"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredId(slice.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                );
              })}
            </g>

            {/* 차트 세그먼트 위에 퍼센트 + 금액 표기 (비중 8% 이상인 경우에만 오버레이 표시) */}
            {chartSlices.map((slice) => {
              if (slice.percentage < 8) return null;

              // R=50 centerline 상의 (x, y) 좌표 계산
              const labelRadius = 50;
              const x = 70 + labelRadius * Math.cos(slice.angle);
              const y = 70 + labelRadius * Math.sin(slice.angle);

              return (
                <g key={`label-${slice.id}`} className="pointer-events-none select-none">
                  {/* 퍼센트 텍스트 */}
                  <text
                    x={x}
                    y={y - 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    className="text-[7.5px] font-extrabold drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.85)]"
                  >
                    {slice.percentage.toFixed(0)}%
                  </text>
                  {/* 금액 텍스트 */}
                  <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    className="text-[6.2px] font-extrabold opacity-95 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.85)]"
                  >
                    {formatShortMoney(slice.value)}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* 중앙 텍스트 포맷 (마우스 오버시 해당 자산 상세, 기본 총자산 표시) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
            {hoveredItem ? (
              <div className="flex flex-col items-center justify-center leading-none transition-all duration-200">
                <span 
                  className="text-[9px] font-black tracking-wider truncate max-w-[80px] mb-0.5" 
                  style={{ color: hoveredItem.color }}
                >
                  {hoveredItem.name.split(' ')[0]}
                </span>
                <span className="text-xs font-black text-slate-700">
                  {hoveredItem.percentage.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-400 font-bold mt-0.5">
                  {formatShortMoney(hoveredItem.value)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center leading-none">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">총자산</span>
                <span className="text-xs font-black text-slate-700">{formatMoney(total)}</span>
                <span className="text-[8px] text-slate-400 font-semibold mt-0.5">올려두면 상세 표기</span>
              </div>
            )}
          </div>
        </div>

        {/* 범례 리스트 영역 */}
        <div className="md:col-span-7 space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
          {items.map((item) => {
            const isHovered = hoveredId === item.id;
            return (
              <div 
                key={item.id} 
                className={`flex items-center justify-between text-xs p-1 px-1.5 rounded-xl transition-all duration-200 ${
                  isHovered ? 'bg-slate-50 shadow-sm scale-[1.01]' : 'opacity-90 hover:opacity-100'
                }`}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200"
                    style={{ 
                      backgroundColor: item.color,
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)'
                    }}
                  />
                  <span className={`text-slate-600 font-medium truncate ${isHovered ? 'font-bold text-slate-800' : ''}`}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-2 flex-shrink-0">
                  <span className="text-slate-400 font-semibold">{item.percentage.toFixed(1)}%</span>
                  <span className="text-slate-700 font-bold">{formatMoney(item.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
