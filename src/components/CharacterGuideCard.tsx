import React from 'react';
import { useGame } from '../store/gameStore';
import { ASSETS } from '../data/assets';
import { formatMoney } from '../utils/formatMoney';
import { GlassCard } from './GlassCard';
import { AnimatedCharacterGuide, type CharacterMood } from './AnimatedCharacterGuide';
import { ShieldAlert, CheckCircle, TrendingUp } from 'lucide-react';

export const CharacterGuideCard: React.FC = () => {
  const { state } = useGame();
  const { currentAge, allocations, loans } = state;

  const totalAssetsVal = Object.values(allocations).reduce((a, b) => a + b, 0);
  const totalLoansVal = (loans?.credit || 0) + (loans?.mortgage || 0);
  const totalNetWorth = parseFloat((totalAssetsVal - totalLoansVal).toFixed(2));
  const cashVal = allocations['cash'] || 0;
  
  // 1. 생애 단계 정보
  let stageTag = '20대 싱글 청년';
  let stageRole = '사회초년생';
  if (currentAge >= 55) {
    stageTag = '50대 이상 부부';
    stageRole = '은퇴/노후 준비기';
  } else if (currentAge >= 45) {
    stageTag = '45~54세 4인 가족';
    stageRole = '학령기 자녀/자산 성숙기';
  } else if (currentAge >= 35) {
    stageTag = '35~44세 3인 가족';
    stageRole = '영유아 자녀/자산 형성기';
  } else if (currentAge >= 30) {
    stageTag = '30대 신혼부부';
    stageRole = '결혼/주택 마련기';
  }

  // 2. 가이드 피드백 논리 설계
  const monthlyExpense = 100;
  const emergencyMonths = parseFloat((cashVal / monthlyExpense).toFixed(1));

  // 안전자산 비중 계산
  const depositVal = allocations['deposit'] || 0;
  const savingVal = allocations['saving'] || 0;
  const housingVal = allocations['housing'] || 0;
  const safeAssetVal = cashVal + depositVal + savingVal + housingVal;
  const safeAssetPercent = totalNetWorth > 0 ? (safeAssetVal / totalNetWorth) * 100 : 100;

  // 포트폴리오 위험 가중치
  let weightedRisk = 0;
  if (totalNetWorth > 0) {
    ASSETS.forEach((asset) => {
      const val = allocations[asset.id] || 0;
      weightedRisk += (val / totalNetWorth) * asset.riskScore;
    });
  }
  const riskScore = parseFloat((weightedRisk * 10).toFixed(0));

  // 분산도 측정
  const activeAssetsCount = Object.keys(allocations).filter(id => allocations[id] > 0 && id !== 'cash').length;

  // 피드백 메시지 생성
  let adviceMessage = '이번 턴에는 남은 현금을 어디에 배분할지 생각해 볼까요? 오늘의 선택이 장기적으로 어떤 결과를 만들지 살펴봅시다.';
  let currentMood: CharacterMood = 'idle';

  if (state.currentTurn > 0) {
    if (emergencyMonths < 2) {
      adviceMessage = '잠깐, 이 선택의 위험도 함께 생각해 볼까요? 비상금은 예상치 못한 지출에 대비하는 안전판이에요.';
      currentMood = 'warning';
    } else if (riskScore > 75) {
      adviceMessage = '포트폴리오의 투자 위험도가 상당히 높습니다. 한 자산에만 몰리면 위험이 커질 수 있어요. 손실 가능성도 함께 생각해 보는 것이 중요해요.';
      currentMood = 'warning';
    } else if (safeAssetPercent > 90) {
      adviceMessage = '이번 선택은 안정성을 높이는 데 도움이 될 수 있어요. 하지만 오늘의 선택이 장기적으로 어떤 결과를 만들지 살펴봅시다.';
      currentMood = 'thinking';
    } else if (activeAssetsCount <= 1 && totalNetWorth > 0) {
      adviceMessage = '한 자산에만 몰리면 위험이 커질 수 있어요. 조금 더 분산하면 위험을 나누는 데 도움이 될 수 있어요.';
      currentMood = 'thinking';
    } else {
      adviceMessage = '훌륭한 자산 포트폴리오를 구성하고 계십니다! 조금 더 분산하면 위험을 나누는 데 도움이 될 수 있어요. 장기적으로 살펴봅시다.';
      currentMood = 'success';
    }
  }

  // 3. 자산 태도 지표 계산
  const stabilityPercent = Math.min(100, Math.round(safeAssetPercent));
  const diversificationPercent = Math.min(100, Math.round((activeAssetsCount / 7) * 100)); // 7개 이상 분산 시 100%
  const pensionVal = allocations['pension'] || 0;
  const bondVal = allocations['bond'] || 0;
  const longTermVal = pensionVal + housingVal + bondVal;
  const longTermPercent = totalNetWorth > 0 ? Math.min(100, Math.round((longTermVal / totalNetWorth) * 100 * 2)) : 0;

  return (
    <div className="space-y-4">
      {/* 고품질 움직이는 캐릭터 가이드 */}
      <AnimatedCharacterGuide
        mood={currentMood}
        title="나의 금융 길잡이"
        subtitle={`${stageTag} (${stageRole})`}
        message={adviceMessage}
        age={currentAge}
      />

      {/* 상태 정보 및 세부 태도 지표 게이지 바 */}
      <GlassCard className="p-4 flex flex-col gap-3.5 border-slate-100/80 shadow-sm text-xs font-semibold text-slate-600" variant="default">
        {/* 요약 자산 스탯 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 select-none">
          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-400">현재 나이 및 자산 평가액</div>
            <div className="text-slate-800 text-[11px]">
              <span className="font-extrabold text-blue-600">{currentAge}세</span> &bull;{' '}
              <span className="font-bold text-slate-700">{formatMoney(totalNetWorth)}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            {riskScore > 60 ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 border border-rose-100 text-rose-600">
                <ShieldAlert size={9} /> 공격형
              </span>
            ) : safeAssetPercent > 70 ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600">
                <CheckCircle size={9} /> 안정형
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 border border-blue-100 text-blue-600">
                <TrendingUp size={9} /> 균형형
              </span>
            )}
          </div>
        </div>

        {/* 게이지 바 */}
        <div className="space-y-2 select-none text-[10px] font-bold">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>🛡️ 안정성 게이지 (예금/현금 등)</span>
              <span className="text-slate-700">{stabilityPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full rounded-full transition-all duration-300" style={{ width: `${stabilityPercent}%` }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>⚖️ 분산 투자율 (종목 분포)</span>
              <span className="text-slate-700">{diversificationPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full transition-all duration-300" style={{ width: `${diversificationPercent}%` }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>🌳 장기 자산 지향도 (연금/채권 등)</span>
              <span className="text-slate-700">{longTermPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${longTermPercent}%` }} />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
