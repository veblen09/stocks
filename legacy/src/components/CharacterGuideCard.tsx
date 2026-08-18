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

  // 대출 이자 계산
  const totalLoanCredit = loans?.credit || 0;
  const totalLoanMortgage = loans?.mortgage || 0;
  const interestCost = parseFloat(((totalLoanCredit * 0.030) + (totalLoanMortgage * 0.0175)).toFixed(2));

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
  let adviceMessage = '이번 턴에는 가용 자금을 어디에 배분할지 신중하게 결정해 볼까요? 오늘의 선택이 장기 복리의 기초가 됩니다.';
  let currentMood: CharacterMood = 'idle';

  const lastResult = state.lastEventResult;

  if (state.currentTurn > 0) {
    // 1순위: 직전 이벤트 의사결정에 대한 입체적 맞춤 실시간 피드백
    if (lastResult) {
      const title = (lastResult.title || '').toLowerCase();
      const choice = (lastResult.choiceText || '').toLowerCase();
      const result = (lastResult.resultText || '').toLowerCase();

      if (title.includes('차') || choice.includes('차') || choice.includes('suv') || choice.includes('계약')) {
        currentMood = 'warning';
        adviceMessage = '🚗 자동차 할부 구입으로 목돈(600만 원)과 매달 고정 지출이 늘어났네요! 자산 형성 초기에는 소비 지출을 방어하고 저축 여력을 지키는 것이 가장 중요해요.';
      } else if (title.includes('사기') || title.includes('피싱') || title.includes('다단계') || choice.includes('사기') || choice.includes('혹하여')) {
        if (result.includes('손실') || result.includes('날렸') || result.includes('지출')) {
          currentMood = 'warning';
          adviceMessage = '🥺 뼈아픈 손실이 발생했네요! "세상에 공짜 점심이나 원금보장 고수익은 없다"는 원칙을 교훈 삼아, 남은 종잣돈을 안전하게 재정비해 봐요.';
        } else {
          currentMood = 'success';
          adviceMessage = '🛡️ 유사수신 사기 유혹을 훌륭하게 거절하셨어요! 원금을 지키는 것이 투자의 제1원칙입니다.';
        }
      } else if (title.includes('테마주') || choice.includes('테마주') || choice.includes('쏟아붓') || choice.includes('몰빵')) {
        currentMood = 'warning';
        adviceMessage = '⚡ 검증되지 않은 급등 테마주나 몰빵 투자는 치명적인 원금 손실을 부릅니다. 시장의 소음에 흔들리지 않는 원칙 투자가 필요해요.';
      } else if (choice.includes('손절') || choice.includes('패닉') || choice.includes('헐값') || choice.includes('매도')) {
        currentMood = 'warning';
        adviceMessage = '📉 공포에 질려 최저점에서 손실을 확정 짓는 투매를 하셨군요. 우량 지수 자산이라면 하락장에서도 인내하며 장기적인 관점을 지켜야 해요.';
      } else if (choice.includes('명품') || choice.includes('허세') || choice.includes('외식') || choice.includes('소비')) {
        currentMood = 'thinking';
        adviceMessage = '🛍️ 소비의 순간적 달콤함 뒤에는 시드머니 축적의 기회비용이 줄어들게 됩니다. 이번 턴에는 저축과 투자 자산에 먼저 배분해 볼까요?';
      } else if (title.includes('청약') || title.includes('분양') || title.includes('내 집')) {
        if (choice.includes('포기')) {
          currentMood = 'thinking';
          adviceMessage = '💡 대출 부담을 고려해 신중하게 청약을 보류하셨군요. 무리한 영끌을 피하고 시드머니를 더 모으는 것도 훌륭한 전략입니다.';
        } else {
          currentMood = 'event';
          adviceMessage = '🏠 내 집 마련에 성공하셨네요! 축하드려요. 이제 매 턴 나가는 대출 이자 지출과 비상금 유동성 관리에 각별히 신경 써야 해요.';
        }
      } else if (choice.includes('물타기') || choice.includes('영끌')) {
        currentMood = 'warning';
        adviceMessage = '⚠️ 악재가 발생한 개별 종목에 비상금을 털어 물타기를 감행하는 것은 위험해요. 비체계적 위험을 피하려면 분산 투자가 필수입니다.';
      } else if (result.includes('사수') || result.includes('방어') || result.includes('복리') || result.includes('인내') || result.includes('절세') || result.includes('지켰')) {
        currentMood = 'success';
        adviceMessage = '👏 탁월한 금융 의사결정이었습니다! 위기 앞에서도 원칙을 지키는 습관이 쌓여 장기 복리의 놀라운 열매를 만듭니다.';
      }
    }

    // 2순위: 직전 이벤트 피드백이 기본값인 경우, 현재 포트폴리오 위험 상태 점검
    if (adviceMessage.startsWith('이번 턴에는 가용 자금')) {
      if (interestCost > 0 && cashVal < interestCost) {
        currentMood = 'warning';
        adviceMessage = `🚨 비상금 통장 잔액이 이번 턴 대출 이자(${formatMoney(interestCost)})보다 부족합니다! 이자가 연체되면 원금에 복리로 불어나 파산할 수 있으니 자산 매각이나 비상금 확충이 시급해요.`;
      } else if (emergencyMonths < 2) {
        currentMood = 'warning';
        adviceMessage = `🛡️ 비상금이 부족합니다(현재 ${emergencyMonths}개월분). 돌발 의료비나 사고 발생 시 투자 자산을 헐값에 깨야 하니 비상금 통장부터 채워주세요.`;
      } else if (riskScore > 75) {
        currentMood = 'warning';
        adviceMessage = '⚡ 포트폴리오의 고위험 개별주 비중이 너무 높습니다. 하락장이 오면 큰 타격을 입을 수 있으니 지수 ETF나 안전자산으로 나누어 담으세요.';
      } else if (safeAssetPercent > 85) {
        currentMood = 'thinking';
        adviceMessage = '💰 자산의 대부분이 예적금과 현금에 묶여 있어요. 원금은 안전하지만 물가 상승(인플레이션)으로 실질 구매력이 줄어드니 우량 ETF 투자도 고려해 보세요.';
      } else if (activeAssetsCount <= 1 && totalNetWorth > 0) {
        currentMood = 'thinking';
        adviceMessage = '💡 한두 가지 자산에만 집중되어 있어요. "계란을 한 바구니에 담지 말라"는 격언처럼 자산을 골고루 분산해 보세요.';
      } else {
        currentMood = 'success';
        adviceMessage = '✨ 균형 잡힌 자산 포트폴리오를 잘 유지하고 계십니다! 시장 변동에 일희일비하지 않고 장기적인 목표를 향해 나아가 봅시다.';
      }
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
