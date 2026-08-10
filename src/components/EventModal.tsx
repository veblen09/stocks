import React, { useState, useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { ASSETS } from '../data/assets';
import type { Choice } from '../types/finance';
import { GlassCard } from './GlassCard';
import { audioManager } from '../utils/audioManager';
import { AnimatedCharacterGuide, type CharacterMood } from './AnimatedCharacterGuide';
import { 
  AlertCircle, 
  BookOpen, 
  Check, 
  TrendingDown, 
  DollarSign, 
  ShieldAlert, 
  Activity, 
  Landmark, 
  HelpCircle 
} from 'lucide-react';

export const EventModal: React.FC = () => {
  const { state, selectChoice } = useGame();
  const { currentEvent } = state;

  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);

  // 이벤트 등장 시 알림 효과음 실행
  useEffect(() => {
    if (currentEvent) {
      audioManager.playSound('notification');
    }
  }, [currentEvent]);

  // 선택 결과에 따라 성취/경고 효과음 분기 실행
  useEffect(() => {
    if (!selectedChoice) return;
    
    // 현금 차감 발생 여부 또는 자산 하락 변동 여부 체크
    const hasCashLoss = selectedChoice.cashChange !== undefined && selectedChoice.cashChange < 0;
    const hasAssetLoss = selectedChoice.impact !== undefined && Object.values(selectedChoice.impact).some(v => v < 0);
    
    if (hasCashLoss || hasAssetLoss) {
      audioManager.playSound('error'); // 돈이 깎일 때 경고 부저음 실행
    } else {
      audioManager.playSound('success'); // 성공적 방어/이득 시 차임벨 실행
    }
  }, [selectedChoice]);

  const handleChoiceClick = (choice: Choice) => {
    audioManager.playSound('click');
    setSelectedChoice(choice);
  };

  const handleConfirm = () => {
    if (selectedChoice) {
      audioManager.playSound('click');
      selectChoice(selectedChoice);
      setSelectedChoice(null);
    }
  };

  if (!currentEvent) return null;

  // 타이틀 분석하여 이벤트에 최적화된 아이콘 및 색상 매칭
  const getEventIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('금리') || t.includes('인상') || t.includes('인하')) {
      return (
        <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
          <Landmark size={20} className="animate-pulse" />
        </div>
      );
    }
    if (t.includes('하락') || t.includes('폭락') || t.includes('붕괴') || t.includes('위기')) {
      return (
        <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl">
          <TrendingDown size={20} className="animate-pulse" />
        </div>
      );
    }
    if (t.includes('환율') || t.includes('외환') || t.includes('달러') || t.includes('급등')) {
      return (
        <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
          <DollarSign size={20} className="animate-pulse" />
        </div>
      );
    }
    if (t.includes('피싱') || t.includes('사기') || t.includes('다단계') || t.includes('경계')) {
      return (
        <div className="p-2.5 bg-red-500/10 text-red-600 rounded-xl">
          <ShieldAlert size={20} className="animate-bounce" />
        </div>
      );
    }
    if (t.includes('의료') || t.includes('지출') || t.includes('사고') || t.includes('병원')) {
      return (
        <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
          <Activity size={20} className="animate-pulse" />
        </div>
      );
    }
    return (
      <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
        <AlertCircle size={20} className="animate-pulse" />
      </div>
    );
  };

  // 위기(Crisis) 이벤트 상황 판별
  const titleText = currentEvent.title.toLowerCase();
  const isCrisis = titleText.includes('하락') || titleText.includes('폭락') || titleText.includes('붕괴') || 
                    titleText.includes('위기') || titleText.includes('피싱') || titleText.includes('사기') || 
                    titleText.includes('다단계') || titleText.includes('지출') || titleText.includes('사고') || 
                    titleText.includes('병원') || titleText.includes('치료');

  // 실시간 가이드 캐릭터의 동적 말풍선 문구 및 감정(Mood) 판별 논리
  const getModalCharacterConfig = (): { mood: CharacterMood; message: string } => {
    if (!selectedChoice) {
      // 1단계: 상황 설명 중
      if (isCrisis) {
        return {
          mood: 'warning',
          message: '🚨 잠깐, 이 선택의 위험도 함께 생각해 볼까요? 돌발적인 지출이나 원금 손실 리스크가 있으니 신중해야 해요.'
        };
      }
      return {
        mood: 'event',
        message: '📢 새로운 시장 뉴스에 귀를 기울여 봅시다. 나의 장기 투자 목표와 자산 배분 비중을 점검하는 기회로 삼아보아요.'
      };
    } else {
      // 2단계: 의사결정 결과 피드백 중
      const resText = selectedChoice.resultDescription.toLowerCase();
      const isLoss = resText.includes('감소') || resText.includes('손실') || resText.includes('차감') || resText.includes('마이너스') || resText.includes('잃');
      const isGain = resText.includes('증가') || resText.includes('수익') || resText.includes('이익') || resText.includes('지켰') || resText.includes('방어');

      // 사용자가 보유하지 않은 자산에 대해 호재(수익)가 발생한 경우 체크
      const missedAssets: string[] = [];
      if (selectedChoice.impact) {
        Object.keys(selectedChoice.impact).forEach((assetId) => {
          const val = state.allocations[assetId] || 0;
          const multiplier = selectedChoice.impact![assetId];
          if (multiplier > 0 && val <= 0 && assetId !== 'cash') {
            missedAssets.push(assetId);
          }
        });
      }

      if (missedAssets.length > 0) {
        const assetNames = missedAssets.map(id => {
          const found = ASSETS.find(a => a.id === id);
          return found ? found.name.split(' ')[0] : id;
        }).join(', ');
        
        return {
          mood: 'thinking',
          message: `💡 이번 선택으로 인해 ${assetNames} 자산의 가치가 상승하는 호재가 발생했으나, 아쉽게도 현재 포트폴리오에 해당 자산을 보유하고 있지 않아 실제 수익을 얻지 못했습니다. 다음 자산 배분 턴에 분산 투자를 고려해 보세요!`
        };
      }

      if (isLoss) {
        return {
          mood: 'warning',
          message: '🥺 에고, 예상치 못한 자산 감소나 피해가 일어났네요. 실망하지 않고 이번 결과를 학습의 밑거름으로 삼아봐요!'
        };
      }
      if (isGain) {
        return {
          mood: 'success',
          message: '🎉 탁월합니다! 올바른 대처 방식이나 탄탄한 자산 분산 덕분에 소중한 투자 원금을 지키거나 불릴 수 있었습니다!'
        };
      }
      return {
        mood: 'thinking',
        message: '💡 이번 선택이 장기적으로 포트폴리오 안정성에 기여하기를 바라며, 다음 턴의 시장 변화도 계속 눈여겨봅시다.'
      };
    }
  };

  const charConf = getModalCharacterConfig();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
      <GlassCard className="w-full max-w-4xl border-white/80 overflow-hidden shadow-2xl animate-fade-in-up max-h-[92vh] flex flex-col" variant="strong">
        
        {/* 모달 헤더 */}
        <div className="bg-slate-950 text-white p-5 flex items-center gap-4 border-b border-white/10 flex-shrink-0 select-none">
          {getEventIcon(currentEvent.title)}
          <div>
            <div className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest">돌발 경제·일상 이벤트</div>
            <h3 className="text-sm sm:text-base md:text-lg font-black tracking-tight">{currentEvent.title}</h3>
          </div>
        </div>

        {/* 모달 본문 - 2열 구조 (데스크톱) */}
        <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto flex-grow items-stretch">
          
          {/* 좌측 열: 뉴스 내용 및 선택 버튼 */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            {!selectedChoice ? (
              /* 1단계: 상황 설명 및 선택지 카드 선택 */
              <div className="space-y-5">
                <div className="text-xs sm:text-sm text-slate-655 leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-150 font-medium select-text">
                  {currentEvent.description}
                </div>

                {/* 영향받는 자산군 목록 */}
                {currentEvent.affectedAssets.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 select-none">
                    <span className="text-[10px] text-slate-400 font-extrabold">영향받는 주요 자산군:</span>
                    {currentEvent.affectedAssets.map((assetId) => (
                      <span
                        key={assetId}
                        className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-100/30"
                      >
                        {assetId === 'cash' ? '입출금/비상금' : 
                         assetId === 'deposit' ? '정기예금' :
                         assetId === 'saving' ? '적금' :
                         assetId === 'korea_etf' ? '국내 ETF' :
                         assetId === 'global_etf' ? '글로벌 ETF' :
                         assetId === 'stock' ? '개별 주식' :
                         assetId === 'bond' ? '채권형' :
                         assetId === 'gold' ? '금' :
                         assetId === 'pension' ? '연금저축/IRP' : '주택청약'}
                      </span>
                    ))}
                  </div>
                )}

                {/* 선택 카드 목록 */}
                <div className="space-y-3.5">
                  <div className="text-[10px] font-bold text-slate-400 select-none">의사결정 리스트 (카드를 눌러 선택)</div>
                  {currentEvent.choices.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => handleChoiceClick(choice)}
                      className="w-full text-left p-4 bg-white/70 hover:bg-blue-50/30 border border-slate-200/60 hover:border-blue-300 hover:shadow-md rounded-2xl transition duration-150 flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-full bg-white border border-slate-350 group-hover:border-blue-500 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-50 transition flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span className="text-xs font-bold text-slate-705 group-hover:text-blue-900 leading-snug select-text">
                        {choice.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* 2단계: 선택에 따른 의사결정의 입체적 피드백 */
              <div className="space-y-4 animate-fade-in-up">
                {/* 선택 요약 */}
                <div className="p-4 bg-blue-50/30 border border-blue-100/50 rounded-2xl">
                  <div className="text-[10px] font-bold text-blue-700 mb-1 flex items-center gap-1.5 select-none">
                    <Check size={12} /> 나의 의사결정
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 leading-relaxed select-text">{selectedChoice.text}</p>
                </div>

                {/* 이 사건이 내 자산에 미치는 영향 */}
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-500 mb-1 select-none">📉 이 사건이 내 자산에 미치는 영향</div>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold select-text">{selectedChoice.resultDescription}</p>
                </div>

                {/* 실질 지출/손실 혹은 이득에 대한 강렬한 시각적 알림 카드 */}
                {selectedChoice.cashChange !== undefined && selectedChoice.cashChange !== 0 && (
                  <div className={`p-5 rounded-2xl border-2 flex items-center gap-4 select-none ${
                    selectedChoice.cashChange < 0 
                      ? 'bg-rose-50 border-rose-300 text-rose-900 animate-pulse' 
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}>
                    <div className={`w-10 h-10 rounded-2xl text-white ${selectedChoice.cashChange < 0 ? 'bg-rose-600 shadow-rose-300' : 'bg-emerald-600 shadow-emerald-300'} shadow-lg flex items-center justify-center text-lg font-black select-none`}>
                      ₩
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-black block tracking-widest text-slate-500">
                        {selectedChoice.cashChange < 0 ? '🚨 실질 지출/손실 발생' : '💰 투자 지원금/현금 유입'}
                      </span>
                      <span className="text-sm sm:text-base font-black">
                        {selectedChoice.cashChange < 0 ? '내 자산에서 ' : '내 자산에 '}
                        <span className={`text-base sm:text-lg font-black px-1.5 py-0.5 rounded-lg text-white ${selectedChoice.cashChange < 0 ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                          {selectedChoice.cashChange < 0 ? '-' : '+'}{Math.abs(selectedChoice.cashChange)}만 원
                        </span>
                        {selectedChoice.cashChange < 0 ? '이 강제 지출(차감)되었습니다!' : '이 추가 지급되었습니다!'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 개별 투자 자산 가치 변동 비율 피드백 */}
                {selectedChoice.impact && Object.keys(selectedChoice.impact).length > 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none block">📈 이번 선택으로 변동된 내 자산 상세</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {Object.keys(selectedChoice.impact).map((assetId) => {
                        const pct = selectedChoice.impact![assetId] * 100;
                        const isNegative = pct < 0;
                        if (pct === 0) return null;

                        // 사용자가 이 자산을 실제로 보유하고 있는 경우(또는 현금)만 변동 결과에 표시
                        const assetValue = state.allocations[assetId] || 0;
                        if (assetId !== 'cash' && assetValue <= 0) return null;

                        return (
                          <div key={assetId} className={`p-2.5 rounded-xl border flex justify-between items-center ${
                            isNegative ? 'bg-rose-50/50 border-rose-200 text-rose-700' : 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
                          }`}>
                            <span className="text-xs font-bold">
                              {assetId === 'cash' ? '입출금/비상금' : 
                               assetId === 'deposit' ? '정기예금' :
                               assetId === 'saving' ? '적금' :
                               assetId === 'korea_etf' ? '국내 ETF' :
                               assetId === 'global_etf' ? '글로벌 ETF' :
                               assetId === 'stock' ? '개별 주식' :
                               assetId === 'bond' ? '채권형' :
                               assetId === 'gold' ? '금' :
                               assetId === 'pension' ? '연금저축/IRP' : '주택청약'}
                            </span>
                            <span className="text-xs font-black">
                              {pct >= 0 ? '+' : ''}{pct.toFixed(0)}% {isNegative ? '📉' : '📈'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 교육적 의의 레슨 */}
                <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl flex gap-3">
                  <div className="text-emerald-500 flex-shrink-0 mt-0.5">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-700 mb-1 select-none">학습 개념 (금융 레슨)</div>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold select-text">{currentEvent.lesson}</p>
                  </div>
                </div>

                {/* 생각해 볼 질문 (수업 토론용) */}
                <div className="p-4 bg-purple-50/30 border border-purple-100/50 rounded-2xl flex gap-3">
                  <div className="text-purple-500 flex-shrink-0 mt-0.5">
                    <HelpCircle size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-purple-700 mb-1 select-none">생각해 볼 질문: 친구들과 나눠보세요</div>
                    <p className="text-xs text-slate-650 leading-relaxed font-bold italic select-text">
                      &ldquo;{currentEvent.discussionQuestion}&rdquo;
                    </p>
                  </div>
                </div>

                {/* 닫기 버튼 */}
                <button
                  onClick={handleConfirm}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md transition transform active:scale-[0.98] cursor-pointer text-xs sm:text-sm select-none"
                >
                  결과 반영하고 돌아가기
                </button>
              </div>
            )}
          </div>

          {/* 우측 열: 실시간 감정 반응 가이드 캐릭터 */}
          <div className="md:col-span-5 flex flex-col justify-center">
            <AnimatedCharacterGuide
              mood={charConf.mood}
              title="이벤트 가이드"
              subtitle={currentEvent.title}
              message={charConf.message}
              className="h-full justify-between border-slate-100"
            />
          </div>

        </div>
      </GlassCard>
    </div>
  );
};
