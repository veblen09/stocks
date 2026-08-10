import React, { useState } from 'react';
import { useGame } from '../store/gameStore';
import { Compass, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { HeroBackground } from '../components/HeroBackground';
import { audioManager } from '../utils/audioManager';
import { AnimatedCharacterGuide } from '../components/AnimatedCharacterGuide';

interface SetupPageProps {
  onNavigate: (page: string) => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onNavigate }) => {
  const { startGame } = useGame();
  
  // 기본 세팅값 정의
  const [nickname, setNickname] = useState('');
  const [startAge, setStartAge] = useState(25);
  const [initialAsset, setInitialAsset] = useState(1000); // 1,000만 원
  const [halfYearSavings, setHalfYearSavings] = useState(300); // 300만 원
  const [difficulty, setDifficulty] = useState<'stable' | 'normal' | 'volatile'>('normal');
  const [simulationLength, setSimulationLength] = useState<number>(20); // 20년
  const [scenario, setScenario] = useState<'standard' | 'inflation' | 'bubble' | 'turbulent'>('standard');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.playSound('click');
    startGame(
      nickname.trim() || '가상 투자자',
      startAge,
      initialAsset,
      halfYearSavings,
      difficulty,
      simulationLength,
      0, // goalAsset 제거
      scenario
    );
    onNavigate('game');
  };

  return (
    <HeroBackground
      height="min-h-screen"
      overlay="light"
      className="rounded-3xl shadow-xl overflow-hidden animate-fade-in-up"
    >
      <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-md z-0" />
      
      <div className="relative z-10 max-w-xl mx-auto w-full py-4 flex flex-col justify-center h-full">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => { audioManager.playSound('click'); onNavigate('home'); }}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition mb-6 font-bold cursor-pointer self-start"
        >
          <ArrowLeft size={14} /> 처음으로
        </button>

        {/* 설정 폼 카드 */}
        <GlassCard className="p-6 sm:p-8 border-white/80" variant="strong">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 mb-6 select-none">
            ⚙️ 시뮬레이션 환경 설계
          </h2>

          {/* 0. 캐릭터 온보딩 가이드 헤더 추가 */}
          <AnimatedCharacterGuide
            mood="thinking"
            compact={true}
            title="나의 금융 길잡이"
            message="실험실에 오신 것을 환영해요! 자산관리 시뮬레이션 설계를 위해 사용자 이름(닉네임), 시작 나이, 그리고 경제 변동성 난이도를 자유롭게 설정해 보세요."
            className="mb-6 bg-white/60"
          />

          <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-650 font-medium">
            {/* 1. 닉네임 입력 */}
            <div className="space-y-1.5">
              <label htmlFor="nickname" className="font-semibold text-slate-700 select-none">
                닉네임 (실제 개인정보는 입력하지 마세요)
              </label>
              <input
                id="nickname"
                type="text"
                required
                placeholder="예: 자산연구가홍길동"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white/60 text-xs sm:text-sm font-medium"
              />
            </div>

            {/* 2. 가로 병렬 배치: 시작 나이 & 시뮬레이션 기간 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="startAge" className="font-semibold text-slate-700 select-none">
                  시작 나이 (세)
                </label>
                <input
                  id="startAge"
                  type="number"
                  min={15}
                  max={50}
                  required
                  value={startAge}
                  onChange={(e) => setStartAge(parseInt(e.target.value) || 25)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white/60 text-xs sm:text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="simulationLength" className="font-semibold text-slate-700 select-none">
                  실험 기간 (년)
                </label>
                <select
                  id="simulationLength"
                  value={simulationLength}
                  onChange={(e) => setSimulationLength(parseInt(e.target.value) || 20)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white/60 text-xs sm:text-sm font-medium"
                >
                  <option value={10}>10년 (20턴)</option>
                  <option value={20}>20년 (40턴) - 기본</option>
                  <option value={30}>30년 (60턴)</option>
                </select>
              </div>
            </div>

            {/* 3. 가로 병렬 배치: 초기 자산 & 6개월 저축액 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="initialAsset" className="font-semibold text-slate-700 select-none">
                  초기 자산 (만 원)
                </label>
                <input
                  id="initialAsset"
                  type="number"
                  min={100}
                  max={5000}
                  step={50}
                  required
                  value={initialAsset}
                  onChange={(e) => setInitialAsset(parseInt(e.target.value) || 1000)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white/60 text-xs sm:text-sm font-medium"
                />
                <span className="text-[10px] text-slate-400 select-none">{(initialAsset / 100).toFixed(1)}억 원 상당</span>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="halfYearSavings" className="font-semibold text-slate-700 select-none">
                  6개월 저축액 (만 원)
                </label>
                <input
                  id="halfYearSavings"
                  type="number"
                  min={50}
                  max={2000}
                  step={10}
                  required
                  value={halfYearSavings}
                  onChange={(e) => setHalfYearSavings(parseInt(e.target.value) || 300)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white/60 text-xs sm:text-sm font-medium"
                />
                <span className="text-[10px] text-slate-400 select-none">반기마다 추가 충전되는 투자 예산</span>
              </div>
            </div>

            {/* 4. 시장 난이도 설정 */}
            <div className="space-y-2 select-none">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                시장 변동성 난이도 설정
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { audioManager.playSound('click'); setDifficulty('stable'); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all duration-200 cursor-pointer ${
                    difficulty === 'stable'
                      ? 'bg-blue-50/80 border-blue-500 shadow-md shadow-blue-500/5'
                      : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className={`font-bold ${difficulty === 'stable' ? 'text-blue-600' : 'text-slate-700'}`}>안정형</span>
                  <span className="text-[9.5px] text-slate-450 leading-snug">예금과 현금 비중이 높아도 안정적으로 학습할 수 있어요.</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => { audioManager.playSound('click'); setDifficulty('normal'); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all duration-200 cursor-pointer ${
                    difficulty === 'normal'
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-md shadow-emerald-500/5'
                      : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className={`font-bold ${difficulty === 'normal' ? 'text-emerald-600' : 'text-slate-700'}`}>일반형</span>
                  <span className="text-[9.5px] text-slate-450 leading-snug">수익과 위험의 균형을 경험할 수 있어요.</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => { audioManager.playSound('click'); setDifficulty('volatile'); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all duration-200 cursor-pointer ${
                    difficulty === 'volatile'
                      ? 'bg-amber-50/80 border-amber-500 shadow-md shadow-amber-500/5'
                      : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className={`font-bold ${difficulty === 'volatile' ? 'text-amber-600' : 'text-slate-700'}`}>변동성 높음</span>
                  <span className="text-[9.5px] text-slate-450 leading-snug">시장 충격과 투자 심리를 더 강하게 체험해요.</span>
                </button>
              </div>
            </div>



            {/* 6. 이벤트 시나리오 선택 */}
            <div className="space-y-2 select-none">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                🎬 거시경제 및 생애 이벤트 시나리오 선택
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { audioManager.playSound('click'); setScenario('standard'); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all duration-200 cursor-pointer h-full ${
                    scenario === 'standard'
                      ? 'bg-blue-50/80 border-blue-500 shadow-md shadow-blue-500/5'
                      : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className={`font-bold text-[10.5px] ${scenario === 'standard' ? 'text-blue-600' : 'text-slate-700'}`}>일반 랜덤 시나리오</span>
                  <span className="text-[9px] text-slate-450 leading-snug">모든 거시경제 및 돌발 인생 이벤트가 무작위로 복합 등장합니다.</span>
                </button>

                <button
                  type="button"
                  onClick={() => { audioManager.playSound('click'); setScenario('inflation'); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all duration-200 cursor-pointer h-full ${
                    scenario === 'inflation'
                      ? 'bg-amber-50/80 border-amber-500 shadow-md shadow-amber-500/5'
                      : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className={`font-bold text-[10.5px] ${scenario === 'inflation' ? 'text-amber-600' : 'text-slate-700'}`}>🔥 고물가·금리변동 시나리오</span>
                  <span className="text-[9px] text-slate-450 leading-snug">기준금리 인상, 스태그플레이션, 환율 급등 등 실질 구매가치 방어 중심 시나리오입니다.</span>
                </button>

                <button
                  type="button"
                  onClick={() => { audioManager.playSound('click'); setScenario('bubble'); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all duration-200 cursor-pointer h-full ${
                    scenario === 'bubble'
                      ? 'bg-indigo-50/80 border-indigo-500 shadow-md shadow-indigo-500/5'
                      : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className={`font-bold text-[10.5px] ${scenario === 'bubble' ? 'text-indigo-600' : 'text-slate-700'}`}>🚀 증시 버블 및 폭락 시나리오</span>
                  <span className="text-[9px] text-slate-450 leading-snug">코스피 급등, 패닉셀 대폭락, 테마주 열풍 등 금융 자산 위험 위주의 시나리오입니다.</span>
                </button>

                <button
                  type="button"
                  onClick={() => { audioManager.playSound('click'); setScenario('turbulent'); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all duration-200 cursor-pointer h-full ${
                    scenario === 'turbulent'
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-md shadow-emerald-500/5'
                      : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className={`font-bold text-[10.5px] ${scenario === 'turbulent' ? 'text-emerald-600' : 'text-slate-700'}`}>🏃 파란만장 일상 변수 시나리오</span>
                  <span className="text-[9px] text-slate-450 leading-snug">보이스피싱, 병원비, 신차 구매, 원룸 독립, 청약 등 삶의 실전 이벤트 위주의 시나리오입니다.</span>
                </button>
              </div>
            </div>

            {/* 7. 제출 및 다음 버튼 */}
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition transform active:scale-[0.98] mt-4 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm select-none"
            >
              <Compass size={16} /> 실험실에 입장하기
            </button>
          </form>
        </GlassCard>

        {/* 하단 고지 배너 */}
        <p className="text-[10px] text-slate-400 text-center mt-6 leading-relaxed select-text">
          “본 프로그램은 금융교육용 모의 시뮬레이션이며 실제 투자 권유가 아닙니다.”
        </p>
      </div>
    </HeroBackground>
  );
};
