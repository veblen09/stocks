import React, { useState } from 'react';
import { Landmark, Compass, HelpCircle, BookOpen, ChevronRight, X } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { HeroBackground } from '../components/HeroBackground';
import { EducationNotice } from '../components/EducationNotice';
import { audioManager } from '../utils/audioManager';
import { AnimatedCharacterGuide } from '../components/AnimatedCharacterGuide';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <HeroBackground
      height="min-h-[85vh] sm:min-h-[90vh]"
      overlay="light"
      className="rounded-3xl shadow-xl overflow-hidden animate-fade-in-up"
    >
      <div className="flex flex-col md:grid md:grid-cols-12 gap-8 items-center h-full w-full my-auto z-10">
        {/* Left Side Glass Card */}
        <div className="md:col-span-7 lg:col-span-6 xl:col-span-5 w-full flex flex-col justify-center">
          <GlassCard className="p-6 sm:p-8 flex flex-col gap-6" variant="default">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse-subtle">
                <Landmark size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight font-display select-text">
                  머니트랙
                </h1>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest select-none">
                  20년 자산관리 실험실
                </p>
              </div>
            </div>

            {/* Title / Subtitle */}
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-snug select-text">
                머니트랙: 20년 자산관리 실험실
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold select-text">
                가상의 20년 동안 저축과 투자를 경험하며 자산관리 원리를 배우는 한국형 금융교육 시뮬레이션
              </p>
            </div>

            {/* Menu Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => { audioManager.playSound('click'); onNavigate('setup'); }}
                className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition flex items-center justify-between group transform active:scale-98 text-xs sm:text-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Compass size={16} /> 개인 플레이 시작
                </span>
                <ChevronRight size={16} className="transform group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => { audioManager.playSound('click'); onNavigate('teacher'); }}
                className="w-full py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-lg transition flex items-center justify-between group transform active:scale-98 text-xs sm:text-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={16} /> 수업 모드
                </span>
                <ChevronRight size={16} className="transform group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => { audioManager.playSound('click'); setShowGuide(true); }}
                className="w-full py-2.5 px-5 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-2xl border border-slate-200 transition flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <HelpCircle size={14} /> 사용 방법 보기
              </button>
            </div>

            {/* Short notice inside card */}
            <div className="text-[10px] text-slate-400 text-center font-medium border-t border-slate-100 pt-3 select-text">
              “본 프로그램은 금융교육용 모의 시뮬레이션이며 실제 투자 권유가 아닙니다.”
            </div>
          </GlassCard>
        </div>

        {/* Right Side - Animated Character Guide */}
        <div className="hidden md:flex md:col-span-5 lg:col-span-6 xl:col-span-7 h-full items-center justify-center">
          <AnimatedCharacterGuide
            mood="idle"
            title="나의 금융 길잡이"
            subtitle="20대 사회초년생 페르소나"
            message="20대 사회초년생이 되어 20년 자산관리를 직접 설계하고 포트폴리오의 변화를 경험해 보세요!"
            className="max-w-sm w-full shadow-2xl border-white/60 animate-fade-in-up"
          />
        </div>
      </div>

      {/* Bottom Legal Notice banner */}
      <div className="w-full mt-auto pt-6 z-10">
        <EducationNotice className="bg-white/85" />
      </div>

      {/* Manual Modal Popup */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6 relative animate-fade-in-up border-white/80" variant="strong">
            <button
              onClick={() => { audioManager.playSound('click'); setShowGuide(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              💡 실험실 이용 안내서
            </h3>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[350px] pr-1 font-medium select-text">
              <div className="space-y-1">
                <span className="font-bold text-blue-600">1. 가상의 생애주기 운영</span>
                <p>사회에 첫발을 디딘 25세 청년이 되어, 6개월 단위로 저축과 투자 의사결정을 수행합니다. 기본 시뮬레이션 길이는 20년(40턴)입니다.</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-blue-600">2. 반기별 자금 배분</span>
                <p>매 턴마다 새로 들어오는 저축 가능 자금을 예적금, 글로벌 ETF, 개별 주식, 금 등 10가지 성격이 다른 자산에 분산해 주세요. 필요할 경우 기존 자산을 회수해 리밸런싱을 진행할 수도 있습니다.</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-blue-600">3. 이벤트의 해결</span>
                <p>금리 조정, 증시 변동 등 거시 경제 이벤트와 자동차 구입, 의료비 수술, 전세금 상환 등의 돌발 이벤트를 만납니다. 학생의 대처에 따라 자산 상태와 가치가 달라집니다.</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-blue-600">4. 최종 자산 분석 보고서</span>
                <p>단순히 수익률뿐 아니라 비상금 쿠션, 분산도, 장기 인내 등 4대 자산 역량을 복합 분석하여 본인의 성향 유형 리포트를 발행받게 됩니다.</p>
              </div>
            </div>

            <button
              onClick={() => { audioManager.playSound('click'); setShowGuide(false); }}
              className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              확인했습니다
            </button>
          </GlassCard>
        </div>
      )}
    </HeroBackground>
  );
};
