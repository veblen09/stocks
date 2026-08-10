import React, { useState } from 'react';
import type { TurnHistory } from '../types/finance';
import { formatMoney } from '../utils/formatMoney';
import { useGame } from '../store/gameStore';

interface NetWorthChartProps {
  history: TurnHistory[];
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ history }) => {
  const { state } = useGame();
  const { initialAsset, halfYearSavings } = state;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (history.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">데이터가 없습니다.</div>;
  }

  // 차트 사이즈 정의
  const width = 600;
  const height = 300;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // 또래 평균 자산 복리 성장 곡선 연산 (연 3.5%, 즉 반기 1.75% 복리 성장 모델)
  const peerWorths: number[] = [];
  let currentPeerVal = initialAsset;
  peerWorths.push(currentPeerVal);
  for (let i = 1; i < history.length; i++) {
    currentPeerVal = parseFloat(((currentPeerVal + halfYearSavings) * 1.0175).toFixed(2));
    peerWorths.push(currentPeerVal);
  }

  // 값의 범위 계산
  const netWorths = history.map((h) => h.netWorth);
  const minVal = 0; // 바닥은 0원으로 고정하여 성장 체감을 극대화
  const maxVal = Math.max(...netWorths, ...peerWorths, 2000) * 1.1; // 최소 2,000만원 기준선 마련 및 10% 여유

  // 각 좌표 맵핑 함수
  const getCoordinates = (index: number, val: number) => {
    const denominator = history.length > 1 ? history.length - 1 : 1;
    const x = paddingLeft + (index / denominator) * chartWidth;
    const y = height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y };
  };

  // 경로 데이터 생성
  let pathD = '';
  let areaD = '';

  const points = history.map((h, i) => getCoordinates(i, h.netWorth));
  const peerPoints = peerWorths.map((val, i) => getCoordinates(i, val));

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    points.forEach((p, i) => {
      if (i > 0) {
        pathD += ` L ${p.x} ${p.y}`;
      }
    });

    // 그라데이션 채우기를 위한 경로 생성
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  let peerPathD = '';
  if (peerPoints.length > 0) {
    peerPathD = `M ${peerPoints[0].x} ${peerPoints[0].y}`;
    peerPoints.forEach((p, i) => {
      if (i > 0) {
        peerPathD += ` L ${p.x} ${p.y}`;
      }
    });
  }

  // 격자선 및 Y축 가이드 눈금
  const yTicks = 4;
  const yGridLines = Array.from({ length: yTicks + 1 }).map((_, i) => {
    const val = minVal + (i / yTicks) * (maxVal - minVal);
    const y = height - paddingBottom - (i / yTicks) * chartHeight;
    return { val, y };
  });

  // X축 가이드 눈금 (나이 표시, 약 5년 주기로 표시)
  const xTicksInterval = Math.max(1, Math.floor(history.length / 5));
  const xTicks = history
    .map((h, i) => ({ h, i }))
    .filter(({ i }) => i % xTicksInterval === 0 || i === history.length - 1);

  return (
    <div className="w-full relative bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-fade-in-up">
      <h3 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-1.5 select-none">
        📈 순자산 변화 추이 <span className="text-xs text-slate-400 font-normal">(같은 또래 평균 자산 대비 성과 비교)</span>
      </h3>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[500px] h-auto overflow-visible select-none"
        >
          <defs>
            {/* 그라데이션 채우기 */}
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y축 격자선 및 라벨 */}
          {yGridLines.map((tick, i) => (
            <g key={i} className="opacity-70">
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="#f1f5f9"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                className="text-[10px] font-medium fill-slate-400 text-right"
                textAnchor="end"
              >
                {formatMoney(tick.val)}
              </text>
            </g>
          ))}

          {/* X축 눈금 및 나이 라벨 */}
          {xTicks.map(({ h, i }) => {
            const { x } = getCoordinates(i, h.netWorth);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={height - paddingBottom}
                  x2={x}
                  y2={height - paddingBottom + 5}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={height - paddingBottom + 18}
                  className="text-[10px] font-medium fill-slate-500"
                  textAnchor="middle"
                >
                  {h.age}세
                </text>
              </g>
            );
          })}

          {/* 메인 데이터 영역 채우기 */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* 또래 평균 점선 그래프 */}
          {peerPathD && (
            <path
              d={peerPathD}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={1.8}
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          )}

          {/* 메인 선 그래프 */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 마우스 호버 감지 구역 */}
          {points.map((p, i) => (
            <rect
              key={i}
              x={p.x - chartWidth / (history.length * 2)}
              y={paddingTop}
              width={chartWidth / history.length}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}

          {/* 호버 시 세로 유도선 및 툴팁 가이드 */}
          {hoverIndex !== null && points[hoverIndex] && (
            <g>
              <line
                x1={points[hoverIndex].x}
                y1={paddingTop}
                x2={points[hoverIndex].x}
                y2={height - paddingBottom}
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
              <circle
                cx={points[hoverIndex].x}
                cy={points[hoverIndex].y}
                r={6}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth={2}
                className="shadow-sm"
              />
              {/* 또래 평균 지표 동그라미 추가 */}
              {peerPoints[hoverIndex] && (
                <circle
                  cx={peerPoints[hoverIndex].x}
                  cy={peerPoints[hoverIndex].y}
                  r={5}
                  fill="#94a3b8"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  className="shadow-sm"
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* 범례 표시 추가 */}
      <div className="flex justify-center items-center gap-4 mt-2.5 text-[10px] font-bold text-slate-500 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-0.75 bg-emerald-500 inline-block rounded-full" />
          <span>나의 순자산</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
          <span>같은 또래 평균 자산 (연 3.5% 균형성장)</span>
        </div>
      </div>

      {/* 실시간 커스텀 툴팁 */}
      {hoverIndex !== null && history[hoverIndex] && (
        <div
          className="absolute z-10 bg-slate-900/95 text-white text-xs rounded-xl p-2.5 shadow-xl border border-slate-800 glass-panel-dark pointer-events-none transition-all duration-75"
          style={{
            left: `${Math.min(
              getCoordinates(hoverIndex, history[hoverIndex].netWorth).x * (100 / 600) + 2,
              80
            )}%`,
            top: '25%',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-semibold text-[10px] text-emerald-400 mb-0.5">
            {history[hoverIndex].turn}턴 ({history[hoverIndex].age}세)
          </div>
          <div className="font-bold">나: {formatMoney(history[hoverIndex].netWorth)}</div>
          <div className="text-[10px] text-slate-300 mt-0.5">또래 평균: {formatMoney(peerWorths[hoverIndex])}</div>
          <div className="text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-700/50 space-y-0.5">
            <div>수익률: {history[hoverIndex].returnRate > 0 ? '+' : ''}{history[hoverIndex].returnRate}%</div>
            <div>비상금: {formatMoney(history[hoverIndex].allocation['cash'] || 0)}</div>
          </div>
        </div>
      )}
    </div>
  );
};
