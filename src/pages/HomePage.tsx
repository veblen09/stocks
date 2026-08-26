import React, { useState } from 'react';
import { Landmark, Compass, HelpCircle, BookOpen, ChevronRight, X, Play, RotateCcw, Sparkles, Database, FolderOpen, Flame } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { HeroBackground } from '../components/HeroBackground';
import { EducationNotice } from '../components/EducationNotice';
import { audioManager } from '../utils/audioManager';
import { GlossaryModal } from '../components/GlossaryModal';
import { useStockGame } from '../store/stockGameStore';
import { HISTORICAL_CAMPAIGNS } from '../features/campaigns/campaignDefinitions';
import { SaveSlotManagerModal } from '../features/saveSlots/SaveSlotManagerModal';
import { ConfirmDialog } from '../features/notifications/ConfirmDialog';
import type { HistoricalCampaignPreset } from '../types/campaign';
import type { GameSettings } from '../types/stockGame';


interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { state, resetGame, startCampaign, loadSavedState } = useStockGame();
  const [showGuide, setShowGuide] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [showSaveSlots, setShowSaveSlots] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<HistoricalCampaignPreset | null>(null);

  const hasActiveGame = state.isGameStarted && !state.isGameOver;

  const handleStartCampaign = (campaign: HistoricalCampaignPreset) => {
    audioManager.playUiSound('confirm');
    const settings: GameSettings = {
      nickname: '역사탐험가',
      startYear: campaign.startYear,
      endYear: campaign.endYear,
      initialCashKRW: campaign.initialCashKRW,
      annualContributionKRW: campaign.annualContributionKRW,
      allowFractionalShares: true,
      feeRate: 0.001,
      fxFeeRate: 0.0,
      includeFxEffect: true,
      primaryBenchmark: 'blend5050',
      startMode: 'MANUAL',
    };
    startCampaign(campaign.id, settings);
    setSelectedCampaign(null);
    onNavigate('game');
  };

  return (
    <HeroBackground
      height="min-h-[85vh] sm:min-h-[90vh]"
      overlay="light"
      className="rounded-3xl shadow-xl overflow-hidden animate-fade-in-up"
    >
      <div className="flex flex-col md:grid md:grid-cols-12 gap-8 items-center h-full w-full my-auto z-10 p-2 sm:p-4">
        {/* Left Side Glass Card */}
        <div className="md:col-span-7 lg:col-span-6 xl:col-span-5 w-full flex flex-col justify-center">
          <GlassCard className="p-6 sm:p-8 flex flex-col gap-4" variant="default">
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
            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-black text-slate-800 leading-snug select-text">
                1980년 말부터 2025년 말까지 실제 시장 데이터로 경험하는 장기 모의주식투자
              </h2>
              <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200/60 text-xs font-bold text-blue-800 leading-relaxed">
                📢 1980년 말 최초 투자 후 1981~2025년, 총 45회의 연간 투자 결과를 체험합니다.
              </div>
            </div>

            {/* Menu Buttons */}
            <div className="space-y-2 pt-1">
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
                    onClick={() => setShowResetConfirm(true)}
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
                    <Compass size={16} /> 45년 대장정 모의투자 시작하기 (1980~2025)
                  </span>
                  <ChevronRight size={16} className="transform group-hover:translate-x-1 transition" />
                </button>
              )}

              {/* Save Slot Manager Button */}
              <button
                onClick={() => { audioManager.playUiSound('tab'); setShowSaveSlots(true); }}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 transition flex items-center justify-between group text-xs sm:text-sm cursor-pointer shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen size={15} className="text-blue-600" />
                  저장 슬롯 관리 (3개 독립 슬롯)
                </span>
                <ChevronRight size={15} className="transform group-hover:translate-x-1 transition text-slate-400" />
              </button>

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
              ※ 실제 기업의 역사적 수정주가·재무·환율 데이터 기반 교육용 시뮬레이션입니다.
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Historical Campaigns Showcase */}
        <div className="md:col-span-5 lg:col-span-6 xl:col-span-7 w-full flex flex-col justify-center space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-amber-500" />
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                역사적 테마 캠페인 모드 (15분 몰입)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              특정 위기 및 패러다임 전환 집중 체험
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HISTORICAL_CAMPAIGNS.map(campaign => (
              <div
                key={campaign.id}
                onClick={() => setSelectedCampaign(campaign)}
                className="p-4 bg-white/90 hover:bg-white rounded-2xl border border-slate-200 hover:border-blue-400 transition-all shadow-xs hover:shadow-md cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                    {campaign.periodKo}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                    {campaign.badgeKo}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                    {campaign.titleKo}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {campaign.subtitleKo}
                  </p>
                </div>

                <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
                  {campaign.historicalDescriptionKo}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-bold">
                  <span>캠페인 도전하기</span>
                  <ChevronRight size={13} className="transform group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>

          {/* Education Notice */}
          <EducationNotice />
        </div>
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <GlassCard className="w-full max-w-lg bg-white border-slate-200 p-6 shadow-2xl flex flex-col space-y-4 text-slate-800">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedCampaign.periodKo} · 약 {selectedCampaign.recommendedPlayMinutes}분 소요
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedCampaign.titleKo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">📖 역사적 배경</span>
                <p className="text-slate-600 font-medium leading-relaxed">
                  {selectedCampaign.historicalDescriptionKo}
                </p>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
                <span className="font-bold text-blue-900 block">🎯 학습 목표</span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {selectedCampaign.learningGoalKo}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">🔍 주요 관찰 경제 변수</span>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-0.5">
                  {selectedCampaign.keyObservationVariablesKo.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleStartCampaign(selectedCampaign)}
                className="py-2 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-1.5"
              >
                <Play size={14} className="fill-white" />
                <span>캠페인 시작하기</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Save Slot Manager Modal */}
      <SaveSlotManagerModal
        isOpen={showSaveSlots}
        currentGameState={state}
        onLoadGame={savedState => {
          loadSavedState(savedState);
          onNavigate('game');
        }}
        onClose={() => setShowSaveSlots(false)}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="새 게임 시작 확인"
        message="현재 진행 중인 게임 상태를 초기화하고 새로운 투자 조건으로 시작하시겠습니까?"
        confirmText="새 게임 시작"
        cancelText="취소"
        isDestructive={true}
        onConfirm={() => {
          audioManager.playSound('click');
          resetGame();
          setShowResetConfirm(false);
          onNavigate('setup');
        }}
        onCancel={() => setShowResetConfirm(false)}
      />


      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg p-6 relative animate-fade-in-up border-white/80" variant="strong">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              🧭 머니트랙 실험실 이용 안내
            </h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[360px] pr-1 font-semibold">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 space-y-1">
                <span className="text-blue-700 font-extrabold block">1. 45년 대장정 시뮬레이션 구조</span>
                <p>1980년 말 초기 자금 1,000만원으로 시작하여 매년 말 자산을 재배분하고 추가 저축을 투입합니다.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-slate-800 font-extrabold block">2. 상장 시점과 뉴스 정보</span>
                <p>상장 전 기업은 종목 목록과 검색 결과에 나타나지 않으며, 실제 상장 연도에 상장 뉴스와 함께 등장합니다. 오직 당시 공개된 뉴스만 확인 가능합니다.</p>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 space-y-1">
                <span className="text-emerald-800 font-extrabold block">3. 과정 중심 평가와 3대 축</span>
                <p>단순한 수익률뿐만 아니라 투자 근거 수립, 원칙 유지, 예측 보정 능력을 3대 축으로 종합 평가합니다.</p>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold text-center border-t border-slate-200/60 pt-2 select-text">
                Copyright 2026. 하나고등학교 일반사회 교사 김윤구 All Right Reserved. (veblen@hana.hs.kr)
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
              <div className="text-[10px] text-slate-400 font-semibold text-center border-t border-slate-200/60 pt-2 select-text">
                Copyright 2026. 하나고등학교 일반사회 교사 김윤구 All Right Reserved. (veblen@hana.hs.kr)
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
