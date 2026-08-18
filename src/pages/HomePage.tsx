import React, { useState } from 'react';
import { Landmark, Compass, HelpCircle, BookOpen, ChevronRight, X, Play, RotateCcw, ShieldAlert, Sparkles, Database } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { HeroBackground } from '../components/HeroBackground';
import { EducationNotice } from '../components/EducationNotice';
import { audioManager } from '../utils/audioManager';
import { AnimatedCharacterGuide } from '../components/AnimatedCharacterGuide';
import { GlossaryModal } from '../components/GlossaryModal';
import { useStockGame } from '../store/stockGameStore';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { state, resetGame } = useStockGame();
  const [showGuide, setShowGuide] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);

  const hasActiveGame = state.isGameStarted && !state.isGameOver;

  return (
    <HeroBackground
      height="min-h-[85vh] sm:min-h-[90vh]"
      overlay="light"
      className="rounded-3xl shadow-xl overflow-hidden animate-fade-in-up"
    >
      <div className="flex flex-col md:grid md:grid-cols-12 gap-8 items-center h-full w-full my-auto z-10">
        {/* Left Side Glass Card */}
        <div className="md:col-span-7 lg:col-span-6 xl:col-span-5 w-full flex flex-col justify-center">
          <GlassCard className="p-6 sm:p-8 flex flex-col gap-5" variant="default">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Landmark size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight font-display select-text">
                  머니트랙
                </h1>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest select-none">
                  45년 한·미 주식투자 실험실
                </p>
              </div>
            </div>

            {/* Title / Subtitle */}
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-slate-800 leading-snug select-text">
                1980년 말부터 2025년 말까지 실제 시장 데이터로 경험하는 장기 모의주식투자
              </h2>
              <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200/60 text-xs font-bold text-blue-800 leading-relaxed">
                📢 1980년 말 최초 투자 후 1981~2025년, 총 45회의 연간 투자 결과를 체험합니다.
              </div>
            </div>

            {/* Legacy State Warning Banner */}
            {state.hasLegacyState && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-semibold flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-600 flex-shrink-0" />
                <span>이전에 저장된 자산관리 게임 데이터가 있습니다. 새 주식투자 게임과는 별도로 안전하게 보존됩니다.</span>
              </div>
            )}

            {/* Menu Buttons */}
            <div className="space-y-2">
              {hasActiveGame ? (
                <>
                  <button
                    onClick={() => { audioManager.playSound('click'); onNavigate('game'); }}
                    className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-between group transform active:scale-98 text-xs sm:text-sm cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Play size={16} /> 진행 중인 게임 이어하기 ({state.currentYear}년)
                    </span>
                    <ChevronRight size={16} className="transform group-hover:translate-x-1 transition" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('현재 진행 중인 게임을 초기화하고 새 게임을 시작하시겠습니까?')) {
                        audioManager.playSound('click');
                        resetGame();
                        onNavigate('setup');
                      }
                    }}
                    className="w-full py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <RotateCcw size={14} /> 새 투자 조건으로 다시 시작
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { audioManager.playSound('click'); onNavigate('setup'); }}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 transition flex items-center justify-between group transform active:scale-98 text-xs sm:text-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Compass size={16} /> 개인 모의투자 시작하기
                  </span>
                  <ChevronRight size={16} className="transform group-hover:translate-x-1 transition" />
                </button>
              )}

              <button
                onClick={() => { audioManager.playSound('click'); onNavigate('teacher'); }}
                className="w-full py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md transition flex items-center justify-between group transform active:scale-98 text-xs sm:text-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={15} /> 수업 모드 (교사용 프리셋)
                </span>
                <ChevronRight size={15} className="transform group-hover:translate-x-1 transition" />
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { audioManager.playSound('click'); setShowGuide(true); }}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-sm"
                >
                  <HelpCircle size={14} className="text-blue-600" /> 실험실 이용 안내
                </button>

                <button
                  onClick={() => { audioManager.playSound('click'); setShowGlossary(true); }}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-sm"
                >
                  <Sparkles size={14} className="text-amber-500" /> 투자 용어 사전
                </button>
              </div>

              <button
                onClick={() => { audioManager.playSound('click'); setShowProvenance(true); }}
                className="w-full py-2 text-[11px] text-slate-400 hover:text-slate-600 font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Database size={12} /> 실제 데이터 출처 및 한계 고지 보기
              </button>
            </div>

            {/* Short notice inside card */}
            <div className="text-[10px] text-slate-400 text-center font-medium border-t border-slate-100 pt-2.5 select-text">
              “본 프로그램은 금융교육용 모의 시뮬레이션이며 실제 투자 권유가 아닙니다.”
            </div>
          </GlassCard>
        </div>

        {/* Right Side - Animated Character Guide */}
        <div className="hidden md:flex md:col-span-5 lg:col-span-6 xl:col-span-7 h-full items-center justify-center">
          <AnimatedCharacterGuide
            mood="idle"
            title="나의 투자 길잡이"
            subtitle="45년 시장 해설가"
            message="1980년 말부터 2025년 말까지, 한국과 미국 50대 우량주의 45년 실제 역사를 바탕으로 장기 분산투자의 놀라운 복리 효과를 직접 체험해 보세요!"
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
          <GlassCard className="w-full max-w-lg p-6 relative animate-fade-in-up border-white/80" variant="strong">
            <button
              onClick={() => { audioManager.playSound('click'); setShowGuide(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              💡 45년 주식투자 실험실 4단계 이용안내
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[380px] pr-1 font-medium select-text">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="font-extrabold text-blue-600 text-xs">1단계: 투자 환경 설정</span>
                <p>시작 연도(1980~2024년)와 종료 연도(최대 2025년, 최소 5년), 초기 투자금(기본 1,000만원), 매년 추가 납입금(기본 300만원), 거래비용(0.1%), 기본 비교 벤치마크를 설정합니다.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="font-extrabold text-blue-600 text-xs">2단계: 매년 종목 선택과 매매</span>
                <p>한국 25개, 미국 25개 대표 종목 카탈로그에서 과거 지표(직전 1년, 3년 CAGR, 변동성, MDD)를 분석하여 매수·매도 또는 목표 비중을 결정하고 1년을 진행합니다. 상장 전 종목은 매수가 비활성화됩니다.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="font-extrabold text-blue-600 text-xs">3단계: 5년·10년 자동투자</span>
                <p>장기투자의 지루함을 덜 수 있도록 정해진 리밸런싱 규칙(연 1회 리밸런싱, 5% 이탈 시 리밸런싱, 퀀트 모멘텀 규칙 등)으로 5년 또는 10년, 남은 전체 기간을 한 번에 실행할 수 있습니다.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="font-extrabold text-blue-600 text-xs">4단계: 지수와 최종 성과 비교</span>
                <p>운용 종료 후 동일한 현금흐름을 투입한 한국 코스피, 미국 S&P 500, 50:50 혼합 지수와 TWR, IRR, MDD, 환율 기여도를 비교 분석하고 8대 차트와 성향 분석 보고서를 발행받습니다.</p>
              </div>
            </div>

            <button
              onClick={() => { audioManager.playSound('click'); setShowGuide(false); }}
              className="w-full mt-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer text-xs"
            >
              확인했습니다
            </button>
          </GlassCard>
        </div>
      )}

      {/* Glossary Modal */}
      <GlossaryModal isOpen={showGlossary} onClose={() => setShowGlossary(false)} />

      {/* Provenance & Limitations Modal */}
      {showProvenance && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg p-6 relative animate-fade-in-up border-white/80" variant="strong">
            <button
              onClick={() => setShowProvenance(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              📊 실제 시장 데이터 출처 및 한계 고지
            </h3>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[360px] pr-1 font-semibold">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-blue-700 font-extrabold block">데이터 출처</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600 font-medium">
                  <li>한국 주식: 한국거래소(KRX) 공식 시세 DB / Yahoo Finance 수정주가</li>
                  <li>미국 주식: Yahoo Finance Adjusted Prices / SEC 10-K Historical / CRSP</li>
                  <li>USD/KRW 환율: 한국은행 경제통계시스템(ECOS) 및 미 연준 FRED</li>
                  <li>벤치마크 지수: 한국거래소 코스피 지수 / S&P Dow Jones Indices S&P 500</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1 text-amber-900">
                <span className="font-extrabold block">⚠️ 생존자 편향 및 미래지식 편향 경고</span>
                <p className="font-medium text-amber-800">
                  이 시뮬레이션의 50개 종목은 현재 2025년에 알려진 대표 기업을 중심으로 선정되어 생존자 편향이 존재할 수 있습니다. 따라서 결과를 실제 투자전략의 객관적 백테스트로 해석해서는 안 됩니다.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1 text-slate-600">
                <span className="text-blue-700 font-extrabold block">단순화 및 가정 사항</span>
                <p className="font-medium">
                  기본 거래비용 0.1%는 실제 역사적 증권거래세와 매매수수료율 변천의 복잡성을 단순화한 교육용 모델입니다. 세금 및 ETF 상장 이전의 지수 추종은 가상 패시브 포트폴리오를 가정합니다.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowProvenance(false)}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer text-xs"
            >
              닫기
            </button>
          </GlassCard>
        </div>
      )}
    </HeroBackground>
  );
};
