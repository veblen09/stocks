import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Globe,
  Info,
  AlertTriangle,
  Award,
  Layers,
} from 'lucide-react';
import { CompanyPriceChart } from './CompanyPriceChart';
import { BENCHMARK_CHARTS } from '../engine/companyChartEngine';
import { formatPercent } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';
import rawBenchmarks from '../data/normalized/benchmarks.json';
import type { BenchmarksDataset } from '../types/stockGame';

const BENCHMARKS: BenchmarksDataset = rawBenchmarks as unknown as BenchmarksDataset;

export type BenchmarkKey = 'BENCH_KOSPI' | 'BENCH_SP500';

interface BenchmarkDetailModalProps {
  isOpen: boolean;
  initialBenchmark?: BenchmarkKey;
  currentYear: number;
  onClose: () => void;
}

interface HistoricalCrisisMilestone {
  year: number;
  title: string;
  badge: string;
  impactKospi: string;
  impactSp500: string;
  description: string;
}

const HISTORICAL_CRISIS_MILESTONES: HistoricalCrisisMilestone[] = [
  {
    year: 1987,
    title: '블랙 먼데이 (Black Monday)',
    badge: '🇺🇸 미국 증시 폭락',
    impactKospi: '+72.8% (한국 3저 호황 지속)',
    impactSp500: '-22.6% (10월 하루 사상 최대 폭락)',
    description: '1987년 10월 19일 컴퓨터 자동 매매와 유동성 경색으로 다우 지수가 하루 만에 22.6% 폭락한 사건입니다. 반면 한국은 3저 호황으로 1987~1988년 강력한 대세 상승장을 이어갔습니다.',
  },
  {
    year: 1997,
    title: 'IMF 외환위기 (외환 유동성 위기)',
    badge: '🇰🇷 한국 국가부도 위기',
    impactKospi: '-38.3% (종합주가지수 280선 추락)',
    impactSp500: '+31.0% (미국 IT 닷컴 붐)',
    description: '대기업 연쇄 부도와 외환보유액 고갈로 대한민국이 IMF 구제금융을 신청했습니다. 원/달러 환율이 1,900원대까지 치솟았으며 코스피 200 지수가 반토막 이하로 폭락했습니다.',
  },
  {
    year: 2000,
    title: '닷컴 버블 붕괴 (Dot-com Crash)',
    badge: '🌐 글로벌 IT 버블 붕괴',
    impactKospi: '-51.3% (IT 벤처 거품 붕괴)',
    impactSp500: '-10.1% (나스닥 3년간 -78% 폭락)',
    description: '실적 없는 인터넷 벤처 기업들의 주가 거품이 꺼지며 글로벌 증시가 급락했습니다. 코스피 200 지수는 1년 만에 -51% 이상 폭락하는 가혹한 조정을 겪었습니다.',
  },
  {
    year: 2008,
    title: '글로벌 금융위기 (서브프라임 & 리만 브라더스)',
    badge: '💥 2008 세계 금융위기',
    impactKospi: '-39.3% (장중 892pt 폭락)',
    impactSp500: '-38.5% (대공황 이후 최대 금융위기)',
    description: '미국 서브프라임 모기지 부실과 4대 투자은행 리만 브라더스의 파산으로 전 세계 금융 시스템이 마비되었습니다. 전 세계 주요국 증시가 40~50% 동반 폭락했습니다.',
  },
  {
    year: 2011,
    title: '유럽 재정위기 & 미국 신용등급 강등',
    badge: '🇪🇺 유럽 남유럽 채무 위기',
    impactKospi: '-12.2% (박스피 구간 진입)',
    impactSp500: '-0.0% (미국 국가 신용등급 첫 강등)',
    description: '그리스·스페인 등 남유럽 국가들의 국가채무 위기와 S&P의 미국 국가 신용등급 강등(AAA→AA+)으로 글로벌 안전자산 선호 심리가 급증했습니다.',
  },
  {
    year: 2020,
    title: '코로나19 팬데믹 & 유동성 V자 랠리',
    badge: '🦠 전 세계 전염병 쇼크',
    impactKospi: '+32.5% (동학개미운동 & IT 랠리)',
    impactSp500: '+16.3% (연준 무제한 양적완화)',
    description: '코로나 바이러스 확산으로 3월 코스피가 1,400선까지 급락(서킷브레이커 발동)했으나, 사상 초유의 무제한 유동성 공급과 개인 투자자 유입으로 연말 사상 최고치를 경신했습니다.',
  },
  {
    year: 2022,
    title: '글로벌 인플레이션 & 급격한 금리 인상',
    badge: '📈 긴축 & 자산시장 조정',
    impactKospi: '-26.2% (원자재 급등 & 원화 약세)',
    impactSp500: '-19.4% (연준 4연속 자이언트스텝)',
    description: '우크라이나 전쟁과 공급망 충격으로 40년 만에 최고치 인플레이션이 발생하며, 미국 연준의 급격한 금리 인상(0%→5%대)으로 주식과 채권이 동반 하락했습니다.',
  },
];

export const BenchmarkDetailModal: React.FC<BenchmarkDetailModalProps> = ({
  isOpen,
  initialBenchmark = 'BENCH_KOSPI',
  currentYear,
  onClose,
}) => {
  const [activeBenchmark, setActiveBenchmark] = useState<BenchmarkKey>(initialBenchmark);
  const [activeTab, setActiveTab] = useState<'CHART' | 'MILESTONES' | 'EDUCATION'>('CHART');

  if (!isOpen) return null;

  const currentMeta = BENCHMARK_CHARTS[activeBenchmark];
  const isKospi = activeBenchmark === 'BENCH_KOSPI';

  // Benchmark stats calculation up to currentYear
  const benchDataset = isKospi ? BENCHMARKS.kospi : BENCHMARKS.sp500;
  const currentPrice = benchDataset?.prices?.[String(currentYear)] || benchDataset?.prices?.[String(currentYear - 1)] || 100;
  const priorPrice = benchDataset?.prices?.[String(currentYear - 1)] || currentPrice;
  const yearReturn = priorPrice > 0 ? (currentPrice - priorPrice) / priorPrice : 0;

  // Milestone filtered up to currentYear
  const availableMilestones = HISTORICAL_CRISIS_MILESTONES.filter(m => m.year <= currentYear);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isKospi ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'}`}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  시장 대표 벤치마크 지수
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {currentYear}년 기준 차트
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {currentMeta.nameKo}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Index Switcher Pill Buttons */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  audioManager.playUiSound('tab');
                  setActiveBenchmark('BENCH_KOSPI');
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  isKospi
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🇰🇷 코스피 200</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  audioManager.playUiSound('tab');
                  setActiveBenchmark('BENCH_SP500');
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  !isKospi
                    ? 'bg-purple-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🇺🇸 S&P 500</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                audioManager.playSound('click');
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
              title="창 닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Top Metric Strip */}
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">{currentYear}년 종가 지수</span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {currentPrice.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} pt
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium">연간 변동률</span>
              <div className={`text-base font-extrabold font-mono tabular-nums ${yearReturn >= 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {yearReturn >= 0 ? '+' : ''}{formatPercent(yearReturn)}
              </div>
            </div>

            <div className="hidden sm:block border-l border-slate-200 dark:border-slate-700 pl-4">
              <span className="text-[11px] text-slate-500 font-medium">산출 기준 및 정의</span>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {currentMeta.description}
              </div>
            </div>
          </div>

          {/* Sub-tabs: CHART / MILESTONES / EDUCATION */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('CHART')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                activeTab === 'CHART'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📈 인터랙티브 차트
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('MILESTONES')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'MILESTONES'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle size={12} />
              <span>역사적 위기 타임라인 ({availableMilestones.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('EDUCATION')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                activeTab === 'EDUCATION'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💡 교육용 가이드
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'CHART' && (
            <div className="space-y-3">
              <CompanyPriceChart
                canonicalId={activeBenchmark}
                upToYear={currentYear}
              />
            </div>
          )}

          {activeTab === 'MILESTONES' && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>역사적 시장 위기와 지수 변동:</strong> 현재 시뮬레이션 연도({currentYear}년)까지 발생한 실제 금융위기 및 충격 이벤트가 각 시장 지수에 미친 영향을 확인해보세요.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableMilestones.map(m => (
                  <div
                    key={m.year}
                    className={`p-4 rounded-2xl border transition shadow-xs space-y-2 ${
                      m.year === currentYear
                        ? 'bg-red-50/70 border-red-300 dark:bg-red-950/30 dark:border-red-800'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                          {m.year}년
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {m.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {m.badge}
                      </span>
                    </div>

                    <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {m.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="text-[10px] text-slate-400">🇰🇷 코스피 영향</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{m.impactKospi}</div>
                      </div>
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="text-[10px] text-slate-400">🇺🇸 S&P 500 영향</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{m.impactSp500}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'EDUCATION' && (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-xs leading-relaxed animate-fade-in">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe size={16} className="text-blue-600" />
                <span>하나고등학교 금융교육: 시장 지수(Index) 투자의 의의와 복리 법칙</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1 text-xs">
                    <Layers size={14} className="text-blue-600" /> 개별 기업 위험(비체계적 위험)의 제거
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-[11.5px]">
                    개별 종목은 경영진의 판단 착오나 기술 도태로 인해 상장폐지될 수 있지만, 200~500개 대표 기업으로 구성된 시장 지수는 부실 기업을 자동 퇴출하고 신흥 우량 기업을 편입하여 자본주의의 총체적 성장을 온전히 추종합니다.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1 text-xs">
                    <Award size={14} className="text-purple-600" /> 한·미 통화 및 국가 분산 효과
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-[11.5px]">
                    한국 원화 자산(KOSPI 200)과 미국 달러 자산(S&P 500)을 50:50으로 배분하면, 1997 외환위기나 2008 금융위기처럼 한국 증시가 급락할 때 달러 환율 상승으로 원화 환산 자산 가치를 획기적으로 방어할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            © 1980~2025 역사적 실측 벤치마크 데이터베이스 연계
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
