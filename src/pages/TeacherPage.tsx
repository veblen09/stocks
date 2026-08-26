import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Play, GraduationCap, Users } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { HeroBackground } from '../components/HeroBackground';
import { useStockGame } from '../store/stockGameStore';
import type { GameSettings, BenchmarkId } from '../types/stockGame';
import { audioManager } from '../utils/audioManager';
import { formatKRW } from '../utils/formatMoney';

interface TeacherPageProps {
  onNavigate: (page: string) => void;
}

interface ClassroomActivityPreset {
  id: string;
  title: string;
  subtitle: string;
  era: string;
  startYear: number;
  endYear: number;
  initialCash: number;
  annualContribution: number;
  primaryBenchmark: BenchmarkId;
  learningGoals: string[];
}

const PRESET_ACTIVITIES: ClassroomActivityPreset[] = [
  {
    id: 'activity_1',
    title: '활동 1: 45년 장기 복리와 지수 패시브 vs 액티브 비교',
    subtitle: '1980~2025년 45년간의 대장정을 통한 장기투자의 위력 체감',
    era: '1980년 말 ~ 2025년 말 (45년)',
    startYear: 1980,
    endYear: 2025,
    initialCash: 10000000,
    annualContribution: 3000000,
    primaryBenchmark: 'blend5050',
    learningGoals: [
      '시간가중수익률(TWR)과 금액가중수익률(IRR)의 차이 이해',
      '장기 적립식 투자가 만드는 스노우볼 복리 효과 확인',
      '대표 지수(코스피, S&P 500) 대비 개별 종목 분산의 필요성 학습',
    ],
  },
  {
    id: 'activity_2',
    title: '활동 2: 외환위기(IMF)와 미국주식 환율 헤지 효과 분석',
    subtitle: '1995~2005년 IMF 외환위기 및 닷컴 버블 붕괴기 극복',
    era: '1995년 말 ~ 2005년 말 (10년)',
    startYear: 1995,
    endYear: 2005,
    initialCash: 10000000,
    annualContribution: 2000000,
    primaryBenchmark: 'sp500',
    learningGoals: [
      '1997년 환율 급등 시 미국 달러 자산이 제공하는 방어 효과 분석',
      '2000년 닷컴 버블 붕괴 시 성장주와 가치주의 차이 관찰',
      '환율 효과(Price vs FX Contribution) 분해 이해',
    ],
  },
  {
    id: 'activity_3',
    title: '활동 3: 글로벌 금융위기와 연 1회 리밸런싱 효과 비교',
    subtitle: '2005~2015년 서브프라임 모기지 사태와 차·화·정 랠리',
    era: '2005년 말 ~ 2015년 말 (10년)',
    startYear: 2005,
    endYear: 2015,
    initialCash: 20000000,
    annualContribution: 5000000,
    primaryBenchmark: 'kospi',
    learningGoals: [
      '2008년 글로벌 금융위기 시 최대낙폭(MDD) 극복 과정 체험',
      '주가 폭락 시 저가 분할 매수와 연 1회 리밸런싱의 복원력 학습',
      '집중투자와 분산투자의 리스크 대비 수익 비교',
    ],
  },
  {
    id: 'activity_4',
    title: '활동 4: 코로나19 유동성 랠리와 생성형 AI 혁명기',
    subtitle: '2015~2025년 반도체 슈퍼사이클 및 빅테크 M7 시대',
    era: '2015년 말 ~ 2025년 말 (10년)',
    startYear: 2015,
    endYear: 2025,
    initialCash: 10000000,
    annualContribution: 3000000,
    primaryBenchmark: 'sp500',
    learningGoals: [
      '2020년 팬데믹 충격과 동학개미운동 등 개인투자자 환경 변화 분석',
      '2023년 ChatGPT 및 생성형 AI 혁명 속 혁신 기업의 급성장 체감',
      '잦은 매매가 발생시키는 거래비용의 누적 손실 확인',
    ],
  },
];

export const TeacherPage: React.FC<TeacherPageProps> = ({ onNavigate }) => {
  const { startNewGame } = useStockGame();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleLaunchActivity = (act: ClassroomActivityPreset) => {
    const settings: GameSettings = {
      nickname: '수업용학생계정',
      startYear: act.startYear,
      endYear: act.endYear,
      initialCashKRW: act.initialCash,
      annualContributionKRW: act.annualContribution,
      allowFractionalShares: true,
      feeRate: 0.001,
      fxFeeRate: 0.0,
      includeFxEffect: true,
      primaryBenchmark: act.primaryBenchmark,
      startMode: 'MANUAL',
    };

    audioManager.playSound('success');
    startNewGame(settings);
    onNavigate('game');
  };

  const handleCopyLink = (act: ClassroomActivityPreset) => {
    const url = `${window.location.origin}${window.location.pathname}?preset=${act.id}&start=${act.startYear}&end=${act.endYear}`;
    navigator.clipboard.writeText(url);
    setCopiedId(act.id);
    audioManager.playSound('click');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <HeroBackground
      height="min-h-[85vh] sm:min-h-[90vh]"
      overlay="light"
      className="rounded-3xl shadow-xl overflow-hidden animate-fade-in-up py-6"
    >
      <div className="max-w-4xl mx-auto w-full px-4 z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { audioManager.playSound('click'); onNavigate('home'); }}
            className="px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-extrabold border border-slate-200 transition flex items-center gap-1.5 text-xs shadow-sm cursor-pointer"
          >
            <ArrowLeft size={16} /> 홈으로 이동
          </button>
          <div className="text-right">
            <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight font-display flex items-center gap-2 justify-end">
              <GraduationCap size={22} className="text-blue-600" />
              수업 모드 (교사용 프리셋 허브)
            </h1>
            <p className="text-xs text-blue-600 font-bold">주제별 맞춤 활동 프리셋 및 학생 링크 배포</p>
          </div>
        </div>

        {/* Introduction Card */}
        <GlassCard className="p-5 space-y-2" variant="default">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
            <Users size={16} className="text-blue-600" />
            금융경제 수업 활용 가이드
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            교사는 아래의 4가지 검증된 역사적 테마 활동 프리셋을 선택하여 학급 학생들에게 동일한 조건의 모의투자 실습을 진행할 수 있습니다. 각 활동은 한국과 미국의 실제 역사적 시장 변동(외환위기, 금융위기, AI 혁명 등)을 직접 체험하도록 설계되었습니다.
          </p>
        </GlassCard>

        {/* 4 Classroom Activity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_ACTIVITIES.map(act => (
            <GlassCard key={act.id} className="p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 transition" variant="default">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {act.era}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    초기 {formatKRW(act.initialCash)} / 매년 {formatKRW(act.annualContribution)}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">{act.title}</h3>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{act.subtitle}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600 font-medium">
                  <span className="font-extrabold text-slate-800 block text-[10px]">🎯 핵심 학습 목표</span>
                  <ul className="list-disc pl-3.5 space-y-0.5">
                    {act.learningGoals.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleCopyLink(act)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedId === act.id ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-emerald-700">링크 복사 완료</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>학생용 링크 복사</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleLaunchActivity(act)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play size={14} />
                  <span>실습 바로 시작</span>
                </button>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Author / Teacher Credit & Copyright Card */}
        <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600 text-xs border-slate-200/70" variant="default">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800">기획 및 개발:</span>
            <span className="font-medium text-slate-700">하나고등학교 일반사회 교사 김윤구</span>
            <a href="mailto:veblen@hana.hs.kr" className="text-blue-600 hover:underline font-mono text-[11px]">(veblen@hana.hs.kr)</a>
          </div>
          <div className="text-right space-y-0.5 select-text">
            <div className="text-[11px] text-slate-500 font-semibold">
              Copyright 2026. 하나고등학교 일반사회 교사 김윤구 All Right Reserved.
            </div>
            <div className="text-[10px] text-slate-400">
              © 2026 머니트랙: 45년 한·미 주식투자 실험실 (1980~2025). 본 프로그램은 금융교육을 위한 실제 역사 데이터 기반 모의 시뮬레이션입니다.
            </div>
          </div>
        </GlassCard>
      </div>
    </HeroBackground>
  );
};
