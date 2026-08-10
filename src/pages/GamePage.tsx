import React, { useState, useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { DashboardCards } from '../components/DashboardCards';
import { NetWorthChart } from '../components/NetWorthChart';
import { PortfolioPieChart } from '../components/PortfolioPieChart';
import { AssetAllocationPanel } from '../components/AssetAllocationPanel';
import { EventModal } from '../components/EventModal';
import { Life3DAvatar } from '../components/Life3DAvatar';
import { CharacterGuideCard } from '../components/CharacterGuideCard';
import { LearningPointCard } from '../components/LearningPointCard';
import { HeroBackground } from '../components/HeroBackground';
import { GlassCard } from '../components/GlassCard';
import { formatMoney } from '../utils/formatMoney';
import { Landmark, RotateCcw, User, Eye } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface GamePageProps {
  onNavigate: (page: string) => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onNavigate }) => {
  const { state, resetGame, processMaturity } = useGame();
  const { nickname, currentTurn, currentAge, history, allocations, isGameOver, processedMaturityTurn, loans } = state;
  const [rightPanelTab, setRightPanelTab] = useState<'character' | 'avatar'>('character');
  const [maturityDecisions, setMaturityDecisions] = useState<{ [assetId: string]: 'reinvest' | 'withdraw' }>({});

  const maturedAssets = Object.keys(allocations).filter(
    (id) => (id === 'deposit' || id === 'saving') && allocations[id] > 0
  );

  // 만기 도래 처리 연동
  useEffect(() => {
    if (currentTurn > 0 && currentTurn % 2 === 0 && processedMaturityTurn !== currentTurn) {
      if (maturedAssets.length === 0) {
        processMaturity({});
      } else {
        const initialDecisions: { [id: string]: 'reinvest' | 'withdraw' } = {};
        maturedAssets.forEach((id) => {
          initialDecisions[id] = 'reinvest'; // 기본값 재예치
        });
        setMaturityDecisions(initialDecisions);
      }
    }
  }, [currentTurn, processedMaturityTurn, maturedAssets.length, processMaturity]);

  useEffect(() => {
    if (isGameOver) {
      onNavigate('result');
    }
  }, [isGameOver, onNavigate]);

  const getTurnString = (turn: number) => {
    if (turn === 0) return '시작 준비';
    const year = Math.floor((turn - 1) / 2) + 1;
    const term = (turn - 1) % 2 === 0 ? '상반기 (1~6개월)' : '하반기 (7~12개월)';
    return `${year}년차 ${term}`;
  };

  const eventLogs = [...history]
    .filter((h) => h.event)
    .reverse();

  const handleReset = () => {
    audioManager.playSound('click');
    if (window.confirm('지금까지의 실험 진행 상황이 모두 삭제됩니다. 처음으로 돌아가시겠습니까?')) {
      resetGame();
      onNavigate('home');
    }
  };

  // 실험 일지 선택에 따른 캐릭터 맞춤형 코멘트 헬퍼 함수
  const getCharacterComment = (title: string = '', choice: string = '') => {
    const t = title.toLowerCase();
    const c = choice.toLowerCase();
    
    if (t.includes('테마주') || t.includes('추천') || t.includes('급등')) {
      return c.includes('투자') && !c.includes('안함') && !c.includes('하지')
        ? "🚨 급등 테마주는 거품이 매우 빠르게 꺼져 원금을 잃기 쉬워요. 다음번에는 안전성 자산 비중을 지키기로 약속해요."
        : "✨ 주변 소문이나 리스크 높은 추천에 휩쓸리지 않고 자신의 원칙을 잘 수호하셨습니다. 아주 이성적인 결정입니다!";
    }
    if (t.includes('금리') || t.includes('이자')) {
      return "📈 금리가 오를 때는 안전 자산(예적금, 채권)의 매력도가 대폭 상승합니다. 시장 흐름에 맞춘 유연한 대응이었습니다.";
    }
    if (t.includes('사기') || t.includes('피싱') || t.includes('스미싱')) {
      return c.includes('무시') || c.includes('차단')
        ? "🔒 의심스러운 연락을 단칼에 거부해 소중한 종잣돈을 지키셨네요! 훌륭한 금융 방어 습관입니다."
        : "🥺 안타깝지만 실생활에서도 출처가 미심쩍은 문자는 절대 눌러선 안 됩니다. 든든한 경험치를 쌓았다고 생각합시다.";
    }
    if (t.includes('의료비') || t.includes('사고') || t.includes('병원')) {
      return "🛡️ 갑작스러운 치료비 지출 상황은 언제든 올 수 있어요. 평소 입출금 통장에 비상금을 모아둔 보람을 느끼는 순간입니다.";
    }
    if (t.includes('자동차') || t.includes('구입') || t.includes('소비')) {
      return c.includes('구매') || c.includes('할부')
        ? "🚗 자가용은 유지비와 가치 감가가 심한 자산이에요. 지출 대비 나의 현금흐름이 충분한지 주기적으로 모니터링하세요."
        : "💡 차량 구매 대신 대중교통과 저축을 선택해 미래 투자 시드를 지켰군요. 인내하는 재무 태도가 아주 우수합니다.";
    }
    return "💡 예상치 못한 일상 지출과 거시 경제 변동 상황 속에서 자산배분의 원칙을 다시 한번 상기해 보는 좋은 의사결정이었기를 바랍니다.";
  };

  const totalAssetsVal = Object.values(allocations).reduce((a, b) => a + b, 0);
  const totalLoansVal = (loans?.credit || 0) + (loans?.mortgage || 0);
  const totalNetWorth = parseFloat((totalAssetsVal - totalLoansVal).toFixed(2));
  const yearsPassed = Math.floor(currentAge - state.startAge);
  const heroMessage = currentTurn === 0 
    ? `현재 ${currentAge}세, 자산관리 시뮬레이션 시작 준비 중입니다.`
    : `현재 ${currentAge}세, ${yearsPassed}년째 자산관리를 진행 중입니다.`;

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* 1. 상단 히어로 배너 */}
      <HeroBackground
        height="h-[220px] sm:h-[260px]"
        overlay="blue"
        className="rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="flex flex-col justify-between h-full w-full z-10 text-white select-none">
          {/* 탑 네비게이션 라인 */}
          <div className="flex justify-between items-center w-full no-print">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white">
                <Landmark size={16} />
              </div>
              <span className="text-xs font-black tracking-wider uppercase">머니트랙 시뮬레이션</span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer backdrop-blur-sm border border-white/10"
            >
              <RotateCcw size={12} /> 초기화
            </button>
          </div>

          {/* 히어로 중앙 정보 */}
          <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[10px] text-blue-300 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                실시간 진행 중
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black leading-tight select-text">
                {heroMessage}
              </h2>
              <p className="text-[11px] text-white/70 font-semibold select-text">
                투자자: {nickname} &bull; 현재 상태: {getTurnString(currentTurn)}
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 px-4 flex flex-col items-start md:items-end flex-shrink-0">
              <span className="text-[9px] text-blue-200 font-bold uppercase">현재 순자산 평가액</span>
              <span className="text-lg sm:text-xl font-black text-emerald-300 select-text">{formatMoney(totalNetWorth)}</span>
            </div>
          </div>
        </div>
      </HeroBackground>

      {/* 2. 대시보드 6대 KPI 카드 (1행 배치) */}
      <DashboardCards state={state} />

      {/* 3. 메인 콘텐츠 영역 (2행 ~ 4행 순서 배치) */}
      <div className="space-y-6">
        
        {/* [2행] 좌측: 자산 배분 조작 패널 vs 우측: 캐릭터 가이드 및 생애 변화 통합 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 h-full">
            <AssetAllocationPanel />
          </div>
          
          <div className="lg:col-span-4 flex flex-col h-full space-y-6">
            {/* 캐릭터 가이드 및 가족·목표 변화 탭 전환 패널 */}
            <div className="bg-white/85 backdrop-blur-xl p-4 rounded-3xl border border-slate-100/80 shadow-sm flex-grow flex flex-col min-h-[460px]">
              <div className="flex bg-slate-100/60 p-1 rounded-2xl mb-4 border border-slate-200/30">
                <button
                  type="button"
                  onClick={() => { audioManager.playSound('click'); setRightPanelTab('character'); }}
                  className={`flex-1 py-2 text-center rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    rightPanelTab === 'character'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white/50'
                  }`}
                >
                  <User size={13} /> 캐릭터 가이드
                </button>
                <button
                  type="button"
                  onClick={() => { audioManager.playSound('click'); setRightPanelTab('avatar'); }}
                  className={`flex-1 py-2 text-center rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    rightPanelTab === 'avatar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white/50'
                  }`}
                >
                  <Eye size={13} /> 가족·목표 변화
                </button>
              </div>

              {/* 탭 내용 분기 렌더링 */}
              <div className="flex-grow">
                {rightPanelTab === 'character' ? (
                  <CharacterGuideCard />
                ) : (
                  <Life3DAvatar />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* [3행] 좌측: 포트폴리오 비율 차트 vs 우측: 순자산 누적 라인 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <PortfolioPieChart allocations={allocations} />
          </div>
          <div className="lg:col-span-6">
            <NetWorthChart history={history} />
          </div>
        </div>

        {/* [4행] 좌측: 캐릭터 피드백이 있는 실험실 일지 vs 우측: 금융 교육 개념 학습 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 실험 일지 */}
          <div className="lg:col-span-6 flex flex-col justify-stretch">
            <GlassCard className="p-5 border-slate-100/80 flex flex-col h-full" variant="default">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 mb-4 select-none">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  🗞️ 최근 실험실 일지 (결정 기록)
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">결정 아카이브</span>
              </div>
              
              {eventLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium select-none flex-grow flex items-center justify-center">
                  아직 진행된 이벤트가 없습니다. 다음 턴으로 넘어가면 경제 및 일상 뉴스가 이곳에 캐릭터 멘토링과 함께 기록됩니다.
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 flex-grow">
                  {eventLogs.map((log, i) => (
                    <div key={i} className="p-3.5 bg-white/50 rounded-xl border border-slate-100 space-y-2 text-[11px] leading-relaxed">
                      <div className="flex justify-between text-[10px] font-semibold text-blue-600 select-none">
                        <span>{log.age}세 ({log.turn}턴째 선택)</span>
                        <span className="text-slate-400">의사결정 보관</span>
                      </div>
                      <h4 className="font-bold text-slate-700 select-text">{log.event?.title}</h4>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-150 space-y-1.5">
                        <p className="text-slate-500 font-bold select-text">
                          선택: {log.event?.choiceMade}
                        </p>
                        <p className="text-slate-400 text-[10.5px] select-text">
                          결과: {log.event?.resultDescription}
                        </p>
                      </div>
                      {/* 가이드 캐릭터의 일지 멘토 코멘트 영역 */}
                      <div className="p-2.5 bg-blue-50/20 border border-blue-100/30 rounded-xl text-slate-650 font-bold select-text">
                        <span className="text-[9px] text-blue-600 block mb-0.5 select-none">💡 가이드 코멘트</span>
                        {getCharacterComment(log.event?.title, log.event?.choiceMade)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* 금융 개념 학습 카드 */}
          <div className="lg:col-span-6 flex flex-col justify-stretch">
            <LearningPointCard />
          </div>
        </div>

      </div>

      {/* 이벤트 팝업 모달 */}
      <EventModal />

      {/* 🔔 예적금 만기 도래 알림 및 수령 선택 모달 */}
      {currentTurn > 0 && currentTurn % 2 === 0 && processedMaturityTurn !== currentTurn && maturedAssets.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative overflow-hidden animate-zoom-in text-slate-700 text-left">
            
            <div className="text-center space-y-2 mb-6">
              <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100/50 select-none inline-block">
                🔔 1년 만기 도래 알림
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-800 select-none">
                가입하신 예금·적금의 만기일이 되었습니다!
              </h3>
              <p className="text-xs text-slate-400 select-none font-medium">
                안전하게 불어난 만기 자금의 처분 방식을 결정해 주세요. (1년=2턴 경과)
              </p>
            </div>

            <div className="space-y-4">
              {maturedAssets.map((assetId) => {
                const balance = allocations[assetId] || 0;
                const assetName = assetId === 'deposit' ? '정기예금' : '정기적금';
                const decision = maturityDecisions[assetId] || 'reinvest';

                return (
                  <div key={assetId} className="bg-slate-50/70 border border-slate-150 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center select-none">
                      <span className="font-bold text-xs text-slate-500">💰 만기 상품: {assetName}</span>
                      <span className="text-xs font-black text-slate-800 select-text">수령 총액: {formatMoney(balance)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 select-none">
                      <button
                        type="button"
                        onClick={() => {
                          audioManager.playSound('click');
                          setMaturityDecisions((prev) => ({ ...prev, [assetId]: 'withdraw' }));
                        }}
                        className={`p-3 rounded-xl border text-center transition-all duration-205 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          decision === 'withdraw'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                            : 'bg-white border-slate-200 hover:border-slate-350 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-extrabold text-xs">🏦 비상금 통장 수령</span>
                        <span className={`text-[9px] ${decision === 'withdraw' ? 'text-blue-100' : 'text-slate-400'} font-medium`}>입출금 통장으로 이체</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          audioManager.playSound('click');
                          setMaturityDecisions((prev) => ({ ...prev, [assetId]: 'reinvest' }));
                        }}
                        className={`p-3 rounded-xl border text-center transition-all duration-205 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          decision === 'reinvest'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10'
                            : 'bg-white border-slate-200 hover:border-slate-350 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-extrabold text-xs">🔄 상품 재예치 연장</span>
                        <span className={`text-[9px] ${decision === 'reinvest' ? 'text-indigo-100' : 'text-slate-400'} font-medium`}>1년 자동 만기 재가입</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 안내 팁 배너 */}
            <div className="mt-5 bg-blue-50/20 border border-blue-150/20 rounded-2xl p-3.5 text-[10.5px] leading-relaxed text-slate-500 font-semibold select-none text-left">
              💡 <strong>교육 팁:</strong> 만기된 자금을 입출금 통장(비상금)으로 수령하면 자산 배분 단계에서 **타 주식이나 자산으로 유연하게 재투자**할 수 있습니다. 동일 상품으로 재예치하면 신경 쓰지 않고 안정적인 확정 이자를 계속해서 굴릴 수 있습니다.
            </div>

            <button
              type="button"
              onClick={() => {
                audioManager.playSound('success');
                processMaturity(maturityDecisions);
              }}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition transform active:scale-[0.98] mt-6 flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm select-none"
            >
              만기 선택 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
