import React, { useState, useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/formatMoney';
import { GlassCard } from './GlassCard';
import { HeroBackground } from './HeroBackground';
import { MetricCard } from './MetricCard';
import { EducationNotice } from './EducationNotice';
import { Check, RefreshCw, BarChart2, Share2, Clipboard, Wallet, TrendingUp, AlertTriangle, Printer, Users, FileDown } from 'lucide-react';
import { audioManager } from '../utils/audioManager';
import { AnimatedCharacterGuide } from './AnimatedCharacterGuide';
import { exportReportToHtml } from '../utils/exportHtml';
import { calculateTotalInvested, calculatePeerWorth } from '../utils/financeCalculations';

export const ResultSummary: React.FC = () => {
  const { state, resetGame } = useGame();
  const { scores, nickname, simulationLength } = state;
  const [copiedQuestions, setCopiedQuestions] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [downloadedHtml, setDownloadedHtml] = useState(false);

  // 결과 화면 도달 시 성공음 연동
  useEffect(() => {
    audioManager.playSound('success');
  }, []);

  if (!scores) return null;

  const { finalNetWorth, cumulativeReturn, maxDrawdown, emergencyFundScore, diversificationScore, longTermScore, decisionScore, archetype } = scores;

  // 원금 및 또래 평균 연산
  const totalInvested = calculateTotalInvested(state);
  const finalPeerWorth = calculatePeerWorth(state);

  // 특별 엔딩 판정 로직 (또래 평균 자산 및 투자 원금을 기준으로 자동 계산)
  const getEndingDetails = () => {
    const richThreshold = Math.round(finalPeerWorth * 1.25);
    
    // 안전자산 비중 계산
    const cashVal = state.allocations['cash'] || 0;
    const depositVal = state.allocations['deposit'] || 0;
    const savingVal = state.allocations['saving'] || 0;
    const housingVal = state.allocations['housing'] || 0;
    const safeAssetVal = cashVal + depositVal + savingVal + housingVal;
    const safeAssetPercent = finalNetWorth > 0 ? (safeAssetVal / finalNetWorth) * 100 : 0;

    const peerDiffPercent = finalPeerWorth > 0 
      ? Math.round(((finalNetWorth - finalPeerWorth) / finalPeerWorth) * 100)
      : 0;

    if (finalNetWorth >= richThreshold || cumulativeReturn >= 40) {
      const peerPerformanceText = peerDiffPercent > 0
        ? `같은 또래 평균 자산(${formatMoney(finalPeerWorth)}) 대비 +${peerDiffPercent.toLocaleString()}%를 초과 달성하고 누적 +${cumulativeReturn}%의 성과`
        : `누적 +${cumulativeReturn}%의 성과`;

      const hasExtremeRisk = diversificationScore <= 35 || decisionScore <= 35 || emergencyFundScore <= 20;

      if (hasExtremeRisk) {
        return {
          id: 'rich_high_risk',
          title: '👑 고수익 달성! 위험 집중형 부자 엔딩 (주의 요망)',
          description: `축하합니다! ${peerPerformanceText}를 올리며, 최종적으로 ${formatMoney(finalNetWorth)}의 거대한 자산을 형성하는 데 성공했습니다. 다만, 포트폴리오 분산력(${diversificationScore}점)과 금융 의사결정(${decisionScore}점), 비상금 관리(${emergencyFundScore}점) 면에서 극단적인 위험을 감수했습니다. 이번 시뮬레이션에서는 시장 환경과 시세 차익의 행운이 따라주었으나, 현실에서는 하락장이나 금리 급등, 돌발 위기 시 심각한 유동성 경색과 원금 손실을 겪을 수 있습니다. 장기적으로 안전한 부를 지키기 위해선 분산 투자와 비상금 방어벽을 반드시 병행해야 합니다!`,
          bg: 'from-amber-50/95 via-amber-100/30 to-emerald-50/70 border-amber-300 text-amber-950',
          characterMood: 'warning' as const
        };
      }

      return {
        id: 'rich',
        title: '👑 시장 초과 달성! 경제적 자유 부자 엔딩',
        description: `축하합니다! ${peerPerformanceText}를 올리며, 최종적으로 ${formatMoney(finalNetWorth)}의 거대한 자산을 형성하는 데 성공했습니다. 철저한 자산 배분 원칙과 포트폴리오 리밸런싱, 건전한 금융 의사결정을 바탕으로 장기 복리 효과의 과실을 완벽히 수확하셨습니다. 현실에서도 재정적 자유(FIRE)를 이뤄낼 대단한 투자 감각을 지니셨음을 입증했습니다!`,
        bg: 'from-emerald-50/90 via-emerald-100/20 to-teal-50/70 border-emerald-200 text-emerald-950',
        characterMood: 'success' as const
      };
    }

    if (safeAssetPercent >= 75 && cumulativeReturn < 10) {
      return {
        id: 'inflation_loss',
        title: '💸 인플레이션 벼락거지 엔딩 (보이지 않는 세금)',
        description: `최종 순자산은 ${formatMoney(finalNetWorth)}으로 명목 원금은 지켜냈으나, 전체 자산의 ${safeAssetPercent.toFixed(0)}%를 가치가 하락하는 예적금과 현금에만 묶어두었습니다. 그 결과 고물가 상승(인플레이션)으로 인해 화폐의 구매력이 하락하여 실질 자산 가치 면에서 큰 손해를 입었습니다. 변동성을 무작위로 두려워하기보다 현명하게 투자형 자산(주식, 금)에 나누어 담아 자산을 지키는 지혜가 필요합니다.`,
        bg: 'from-amber-50/90 via-amber-100/20 to-orange-50/70 border-amber-200 text-amber-950',
        characterMood: 'warning' as const
      };
    }

    if (finalNetWorth >= totalInvested) {
      return {
        id: 'middle',
        title: '🏡 안정적인 성실형 자산가 엔딩 (중산층)',
        description: `최종 자산 ${formatMoney(finalNetWorth)}을 일구며 또래 평균 자산 흐름에 발맞추어, 본인의 총 납입 원금(${formatMoney(totalInvested)})을 사수하고 안정적 성장을 만드는 데 성공했습니다. 파산을 피하는 신중한 포트폴리오 관리로 건전한 중산층 자금 기반을 다졌습니다. 적극적인 리밸런싱을 섞는다면 다음 여정에서는 초과 성과를 달성할 것입니다.`,
        bg: 'from-blue-50/90 via-blue-100/20 to-indigo-50/70 border-blue-200 text-slate-800',
        characterMood: 'idle' as const
      };
    }

    return {
      id: 'bankrupt',
      title: '⚠️ 자산 원금 손실 및 파산 위기 엔딩',
      description: `안타깝습니다! 최종 순자산이 ${formatMoney(finalNetWorth)}으로 귀하가 성실히 저축하고 부은 납입 원금 총액(${formatMoney(totalInvested)})보다 자산이 깎여나가며 여정을 마쳤습니다. 뇌동 테마주 몰빵 투자, 고수익 사기 피해, 피싱 송금, 비상금 부족으로 인한 하락장 강제 매도 등이 원금 손실을 초래했습니다. 현실에서는 이번 뼈아픈 경험을 교훈 삼아 분산 투자와 비상금 쿠션 확보를 반드시 사수하세요!`,
      bg: 'from-rose-50/90 via-rose-100/20 to-red-50/70 border-rose-200 text-rose-950',
      characterMood: 'warning' as const
    };
  };

  const ending = getEndingDetails();

  const reflectionQuestions = [
    "내가 가장 많이 투자한 자산은 무엇인가?",
    "그 선택을 한 이유는 무엇인가?",
    "가장 불안했던 순간은 언제였는가?",
    "손실이 났을 때 나는 어떻게 행동했는가?",
    "비상금은 왜 필요하다고 느꼈는가?",
    "분산투자는 어떤 장점과 한계가 있었는가?",
    "장기투자와 단기투자의 차이를 게임에서 어떻게 경험했는가?",
    "실제 인생에서 이 게임과 다른 점은 무엇인가?",
    "오늘 배운 내용 중 실제 생활에 적용할 수 있는 것은 무엇인가?",
    "다음에 다시 플레이한다면 전략을 어떻게 바꿀 것인가?"
  ];

  // 점수 Clamping 헬퍼 함수
  const clampScore = (score: number) => Math.max(0, Math.min(100, score));

  // 비동기 클립보드 복사 처리
  const handleCopyQuestions = async () => {
    audioManager.playSound('click');
    const text = reflectionQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedQuestions(true);
      setTimeout(() => setCopiedQuestions(false), 2000);
    } catch (err) {
      console.error('Failed to copy questions:', err);
      alert('클립보드 복사에 실패했습니다. 아래 질문 목록을 직접 드래그하여 복사해 주세요.');
    }
  };

  const handleCopySummary = async () => {
    audioManager.playSound('click');
    const summaryText = `[머니트랙: ${simulationLength}년 자산관리 실험실 결과 보고서]
------------------------------------------------
이름: ${nickname}
난이도: ${state.difficulty === 'stable' ? '안정형' : state.difficulty === 'normal' ? '일반형' : '변동성 높음'}
최종 순자산: ${formatMoney(finalNetWorth)}
또래 평균 자산: ${formatMoney(finalPeerWorth)}
누적 수익률: ${cumulativeReturn > 0 ? '+' : ''}${cumulativeReturn}%
최대 낙폭 (MDD): ${maxDrawdown}%

[시뮬레이션 엔딩 결과]
${ending.title}
- 설명: ${ending.description}

[자산관리 역량 평가]
- 비상금 유지 점수: ${emergencyFundScore}점
- 분산투자 점수: ${diversificationScore}점
- 장기투자 점수: ${longTermScore}점
- 금융 의사결정 점수: ${decisionScore}점

[최종 진단 유형]
${archetype.emoji} ${archetype.name}
- 설명: ${archetype.description}
- 장점: ${archetype.pros}
- 주의점: ${archetype.cons}
------------------------------------------------
* 본 시뮬레이션은 금융교육용 가상 프로그램입니다.`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
      alert('클립보드 복사에 실패했습니다. 본문 텍스트를 마우스로 직접 긁어서 복사해 주세요.');
    }
  };

  const getScoreFeedback = (score: number) => {
    if (score >= 80) return '우수 🌟';
    if (score >= 50) return '양호 👍';
    return '보완 필요 훈련이 필요해요!';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in-up">
      {/* 1. 상단 히어로 배너 (수료 리포트) */}
      <HeroBackground
        height="min-h-[200px]"
        overlay="blue"
        className="rounded-3xl shadow-xl overflow-hidden animate-fade-in-up"
      >
        <div className="flex flex-col justify-between h-full w-full z-10 text-white gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-blue-200 font-extrabold uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full border border-white/10 select-none">
                🎓 시뮬레이션 수료 리포트
              </span>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black mt-2 select-text">
                {nickname}님의 {simulationLength}년 자산관리 실험 결과
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                audioManager.playSound('click');
                exportReportToHtml(state);
                setDownloadedHtml(true);
                setTimeout(() => setDownloadedHtml(false), 2500);
              }}
              className="flex items-center justify-center gap-1.5 text-xs font-extrabold px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer border border-emerald-400 no-print flex-shrink-0"
            >
              {downloadedHtml ? <Check size={14} /> : <FileDown size={14} />}
              {downloadedHtml ? '리포트 저장 완료!' : '결과 리포트 다운로드'}
            </button>
          </div>
          
          {/* 최종 자산관리 유형 카드 */}
          <GlassCard className="p-4 border-white/20 text-slate-800" variant="strong">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl select-none">{archetype.emoji}</span>
              <div>
                <span className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wider select-none">나의 최종 자산관리 유형</span>
                <h3 className="text-xs sm:text-sm md:text-base font-black text-slate-800 leading-snug select-text">
                  당신은 &ldquo;<span className="text-blue-600 font-black">{archetype.name}</span>&rdquo; 입니다.
                </h3>
              </div>
            </div>
          </GlassCard>
        </div>
      </HeroBackground>

      {/* 2. 최종 엔딩 스토리 카드 (목표 달성 및 리스크 요약 분석) */}
      <GlassCard className={`p-5 sm:p-6 border shadow-md bg-gradient-to-br ${ending.bg} animate-fade-in-up`} variant="default">
        <div className="flex flex-col gap-2">
          <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider select-none px-2 py-0.5 rounded bg-white/70 border border-slate-200/50 text-slate-500 self-start shadow-sm">
            시뮬레이션 엔딩 결과
          </span>
          <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800 leading-snug select-text mt-1">
            {ending.title}
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed font-bold text-slate-700 select-text mt-1 whitespace-pre-line">
            {ending.description}
          </p>
          <div className="pt-3.5 mt-2.5 border-t border-slate-200/50 text-[10px] font-bold text-slate-450 select-none flex flex-wrap gap-x-4 gap-y-1">
            <span>💼 총 투입 원금: <strong className="text-slate-650 font-extrabold">{formatMoney(totalInvested)}</strong></span>
            <span>🏦 또래 평균 자산: <strong className="text-slate-650 font-extrabold">{formatMoney(finalPeerWorth)}</strong></span>
            <span>📈 내 최종 순자산: <strong className="text-emerald-600 font-extrabold">{formatMoney(finalNetWorth)}</strong></span>
          </div>
        </div>
      </GlassCard>

      {/* 3. 핵심 지표 카드 (또래 평균 자산 카드 추가하여 2x2 또는 4열 구조 지원) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="최종 순자산"
          value={formatMoney(finalNetWorth)}
          icon={<Wallet size={20} />}
          tone="blue"
        />
        <MetricCard
          label="또래 평균 자산"
          value={formatMoney(finalPeerWorth)}
          subValue={
            finalNetWorth >= finalPeerWorth
              ? `평균 대비 +${((finalNetWorth - finalPeerWorth) / finalPeerWorth * 100).toFixed(0)}% 초과!`
              : `평균 대비 ${((finalNetWorth - finalPeerWorth) / finalPeerWorth * 100).toFixed(0)}% 미달`
          }
          icon={<Users size={20} />}
          tone={finalNetWorth >= finalPeerWorth ? 'green' : 'gold'}
        />
        <MetricCard
          label="누적 수익률"
          value={`${cumulativeReturn > 0 ? '+' : ''}${cumulativeReturn}%`}
          icon={<TrendingUp size={20} />}
          tone={cumulativeReturn >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          label="최대 낙폭 (MDD)"
          value={`${maxDrawdown}%`}
          icon={<AlertTriangle size={20} />}
          tone={maxDrawdown > 20 ? 'red' : 'gold'}
        />
      </div>

      {/* 4. 진단 유형 상세 분석 및 캐릭터 프로필 동행 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <GlassCard className="p-6 h-full flex flex-col justify-between border-slate-100/80" variant="default">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider select-none">유형 분석 및 해설</span>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mt-0.5 select-text">{archetype.emoji} {archetype.name}</h3>
              </div>
              
              <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-bold select-text italic">
                &ldquo;{archetype.description}&rdquo;
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="bg-white/60 p-3 rounded-xl border border-slate-100/60 shadow-sm">
                  <span className="font-bold text-emerald-750">✔️ 장점:</span>
                  <p className="text-slate-600 mt-1 leading-relaxed text-[11px] font-semibold select-text">{archetype.pros}</p>
                </div>
                <div className="bg-white/60 p-3 rounded-xl border border-slate-100/60 shadow-sm">
                  <span className="font-bold text-rose-750">⚠️ 주의점:</span>
                  <p className="text-slate-600 mt-1 leading-relaxed text-[11px] font-semibold select-text">{archetype.cons}</p>
                </div>
              </div>

              {/* 다음 학습 질문 표시 */}
              {archetype.questions && archetype.questions.length > 0 && (
                <div className="bg-blue-50/20 p-3.5 rounded-xl border border-blue-100/30 mt-3 select-text">
                  <span className="font-bold text-blue-700 text-xs">💬 다음 학습을 위한 성찰 질문:</span>
                  <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-600 text-[11px] font-bold">
                    {archetype.questions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
        
        {/* 결과 화면 캐릭터 연출 카드 */}
        <div className="lg:col-span-4 flex flex-col justify-stretch">
          <AnimatedCharacterGuide
            mood={ending.characterMood}
            title="실험 완료 동반자"
            subtitle="나의 자산관리 페르소나"
            message={`지난 ${simulationLength}년 동안 저축과 수많은 시장 변동을 극복하고 성실히 자산을 설계하여 여정을 마쳤습니다. 오늘의 모의 포트폴리오 훈련 경험이 실제 금융 생활의 든든한 밑거름이 될 것입니다. 수고 많으셨습니다!`}
            className="h-full justify-between"
          />
        </div>
      </div>

      {/* 5. 자산관리 역량 성적표 */}
      <GlassCard className="p-6 border-slate-100/85" variant="default">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-5 flex items-center gap-1.5 select-none">
          <BarChart2 size={16} className="text-blue-500" /> 자산관리 역량 점수표
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-medium">
          {/* ... 비상금 유지 점수 ... */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">🛡️ 비상금 유지력</span>
              <span className="text-slate-800">{emergencyFundScore}점 ({getScoreFeedback(emergencyFundScore)})</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden select-none">
              <div className="bg-sky-400 h-full rounded-full" style={{ width: `${clampScore(emergencyFundScore)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">예기치 못한 지출에 깨지지 않는 자금 방패막(입출금 통장)을 일정 규모 이상 안정적으로 유지했는지 평가합니다.</p>
          </div>

          {/* ... 분산투자 점수 ... */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">⚖️ 포트폴리오 분산력</span>
              <span className="text-slate-800">{diversificationScore}점 ({getScoreFeedback(diversificationScore)})</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden select-none">
              <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${clampScore(diversificationScore)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">계란을 한 바구니에 담지 않고, 성격이 다른 카테고리(예적금, 주식 ETF, 채권, 실물 등)에 골고루 분산시켰는지 측정합니다.</p>
          </div>

          {/* ... 장기투자 점수 ... */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">🌳 장기투자 지구력</span>
              <span className="text-slate-800">{longTermScore}점 ({getScoreFeedback(longTermScore)})</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden select-none">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${clampScore(longTermScore)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">연금저축/IRP 세제 혜택 활용 및 청약 유무, 시장 하락 시 장기적 관점을 잃지 않고 인내했는지 판정합니다.</p>
          </div>

          {/* ... 금융 의사결정 점수 ... */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">🧠 현명한 금융 의사결정</span>
              <span className="text-slate-800">{decisionScore}점 ({getScoreFeedback(decisionScore)})</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden select-none">
              <div className="bg-purple-400 h-full rounded-full" style={{ width: `${clampScore(decisionScore)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">보이스피싱, 다단계 폰지 사기, 뇌동 테마주 등 시뮬레이션 중 겪은 다양한 금융 위험과 유혹을 안전하게 회피했는지 평가합니다.</p>
          </div>
        </div>
      </GlassCard>

      {/* 6. 수업용 성찰(회고) 및 조별 토론 질문 */}
      <GlassCard className="p-6 border-slate-100/85" variant="default">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 select-none">📝 수업용 회고(성찰) 질문지</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 select-none">결과 보고서와 회고 질문을 복사해 과제(구글 클래스룸 등)로 제출하거나 모둠 토론에 사용하세요.</p>
          </div>
          <div className="flex items-center gap-2 select-none no-print flex-wrap">
            <button
              type="button"
              onClick={() => {
                audioManager.playSound('click');
                exportReportToHtml(state);
                setDownloadedHtml(true);
                setTimeout(() => setDownloadedHtml(false), 2500);
              }}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-emerald-600 border border-emerald-500 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm cursor-pointer"
            >
              {downloadedHtml ? <Check size={12} /> : <FileDown size={12} />}
              {downloadedHtml ? '리포트 저장 완료!' : '결과 리포트 저장'}
            </button>
            {/* 결과 리포트 인쇄하기 버튼 */}
            <button
              type="button"
              onClick={() => {
                audioManager.playSound('click');
                window.print();
              }}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-blue-600 border border-blue-500 text-white rounded-lg hover:bg-blue-700 transition shadow-sm cursor-pointer"
            >
              <Printer size={12} />
              결과 리포트 인쇄
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition shadow-sm cursor-pointer"
            >
              {copiedSummary ? <Check size={12} className="text-emerald-500" /> : <Share2 size={12} />}
              {copiedSummary ? '보고서 복사됨' : '결과 요약 복사'}
            </button>
            <button
              type="button"
              onClick={handleCopyQuestions}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-blue-50 border border-blue-100/30 text-blue-600 rounded-lg hover:bg-blue-100/40 transition shadow-sm cursor-pointer"
            >
              {copiedQuestions ? <Check size={12} className="text-emerald-500" /> : <Clipboard size={12} />}
              {copiedQuestions ? '질문 복사됨' : '회고 질문 복사'}
            </button>
          </div>
        </div>

        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50 text-xs text-slate-600 space-y-2 select-text font-semibold mt-4">
          {reflectionQuestions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <span className="font-bold text-blue-600">{i + 1}.</span>
              <span>{q}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 7. 하단 고지 및 버튼 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100">
        <EducationNotice className="flex-grow max-w-xl" />
        <button
          type="button"
          onClick={() => {
            audioManager.playSound('click');
            resetGame();
          }}
          className="flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md transition transform active:scale-95 duration-100 cursor-pointer text-xs sm:text-sm select-none flex-shrink-0 no-print"
        >
          <RefreshCw size={14} /> 다시 실험하기 (처음으로)
        </button>
      </div>
    </div>
  );
};
