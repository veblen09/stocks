import React, { useState } from 'react';
import { ArrowLeft, Play, AlertCircle, Calendar, Sliders } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { HeroBackground } from '../components/HeroBackground';
import type { GameSettings, BenchmarkId } from '../types/stockGame';
import { useStockGame } from '../store/stockGameStore';
import { audioManager } from '../utils/audioManager';
import { formatKRW } from '../utils/formatMoney';

interface SetupPageProps {
  onNavigate: (page: string) => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onNavigate }) => {
  const { startNewGame } = useStockGame();

  const [nickname, setNickname] = useState<string>('투자탐험가');
  const [startYear, setStartYear] = useState<number>(1980);
  const [endYear, setEndYear] = useState<number>(2025);
  const [initialCash, setInitialCash] = useState<number>(10000000);
  const [annualContribution, setAnnualContribution] = useState<number>(3000000);
  const [allowFractional, setAllowFractional] = useState<boolean>(true);
  const [feeMode, setFeeMode] = useState<'STANDARD' | 'LOW' | 'ZERO'>('STANDARD');
  const [includeFx, setIncludeFx] = useState<boolean>(true);
  const [primaryBenchmark, setPrimaryBenchmark] = useState<BenchmarkId>('kospi');
  const [startMode, setStartMode] = useState<'MANUAL' | 'AUTO_RULE'>('MANUAL');

  const totalYears = endYear - startYear;
  const isPeriodValid = totalYears >= 5;

  const handleStartGame = () => {
    if (!isPeriodValid) {
      alert('투자 기간은 최소 5년 이상이어야 합니다.');
      return;
    }

    const settings: GameSettings = {
      nickname: nickname.trim() || '투자탐험가',
      startYear,
      endYear,
      initialCashKRW: initialCash,
      annualContributionKRW: annualContribution,
      allowFractionalShares: allowFractional,
      feeRate: feeMode === 'ZERO' ? 0 : feeMode === 'LOW' ? 0.0005 : 0.001,
      fxFeeRate: 0.0,
      includeFxEffect: includeFx,
      primaryBenchmark,
      startMode,
    };

    audioManager.playSound('success');
    startNewGame(settings);
    onNavigate('game');
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
            <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight font-display">
              투자 환경 설정
            </h1>
            <p className="text-xs text-blue-600 font-bold">1980~2025 실제 시장 데이터 기반 맞춤 설계</p>
          </div>
        </div>

        {/* Survivorship Bias Disclaimer Banner */}
        <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 shadow-sm font-semibold">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-extrabold block">생존자 편향(Survivorship Bias) 고지</span>
            <p className="text-[11px] font-medium text-amber-800">
              이 시뮬레이션의 50개 종목은 현재 알려진 대표 기업을 중심으로 선정되어 생존자 편향이 존재할 수 있습니다. 따라서 결과를 실제 투자전략의 객관적 백테스트로 해석해서는 안 됩니다.
            </p>
          </div>
        </div>

        {/* Main Settings Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: 기간 및 자금 설정 */}
          <GlassCard className="p-5 sm:p-6 space-y-4" variant="default">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Calendar size={18} className="text-blue-600" />
              <h2 className="font-extrabold text-slate-800 text-sm">운용 기간 및 자금 규모</h2>
            </div>

            {/* Nickname */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">투자자 닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            {/* Period Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">시작 기준 연도</label>
                <select
                  value={startYear}
                  onChange={e => {
                    const sy = parseInt(e.target.value);
                    setStartYear(sy);
                    if (endYear <= sy + 4) {
                      setEndYear(Math.min(2025, sy + 5));
                    }
                  }}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  {Array.from({ length: 45 }, (_, i) => 1980 + i).map(y => (
                    <option key={y} value={y}>{y}년 말</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">종료 연도</label>
                <select
                  value={endYear}
                  onChange={e => setEndYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  {Array.from({ length: 2025 - startYear }, (_, i) => startYear + 1 + i).map(y => (
                    <option key={y} value={y}>{y}년 말</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
              isPeriodValid ? 'bg-blue-50/80 border-blue-200 text-blue-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <span>총 운용 기간</span>
              <span>{startYear}년 말 ~ {endYear}년 말 ({totalYears}개 연간 구간)</span>
            </div>
            {!isPeriodValid && (
              <span className="text-[11px] font-bold text-rose-600 block">
                ⚠️ 선택 기간이 5년 미만이면 실행할 수 없습니다.
              </span>
            )}

            {/* Initial Cash */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-700">초기 투자금 ({startYear}년 말)</span>
                <span className="font-black text-blue-600">{formatKRW(initialCash)}</span>
              </div>
              <div className="flex gap-1.5">
                {[5000000, 10000000, 50000000, 100000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setInitialCash(val)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-black border transition cursor-pointer ${
                      initialCash === val
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {val / 10000}만
                  </button>
                ))}
              </div>
            </div>

            {/* Annual Deposit */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-700">연간 추가 투자금 (매년 초 입금)</span>
                <span className="font-black text-indigo-600">{formatKRW(annualContribution)}</span>
              </div>
              <div className="flex gap-1.5">
                {[0, 1000000, 3000000, 5000000, 10000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAnnualContribution(val)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-black border transition cursor-pointer ${
                      annualContribution === val
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {val === 0 ? '0원' : `${val / 10000}만`}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Card 2: 거래비용, 환율, 벤치마크 및 시작 모드 */}
          <GlassCard className="p-5 sm:p-6 space-y-4" variant="default">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders size={18} className="text-blue-600" />
              <h2 className="font-extrabold text-slate-800 text-sm">거래 규칙 & 비교 지수</h2>
            </div>

            {/* Primary Benchmark */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">기본 비교 벤치마크</label>
              <select
                value={primaryBenchmark}
                onChange={e => setPrimaryBenchmark(e.target.value as any)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="kospi">한국 대표지수 (코스피 KOSPI)</option>
                <option value="sp500">미국 대표지수 (S&P 500 원화환산)</option>
                <option value="blend5050">50:50 한국/미국 혼합 리밸런싱 지수</option>
              </select>
              <p className="text-[10px] text-slate-400 font-semibold">
                * 최종 보고서에서는 3대 벤치마크 모두와 정밀 비교 분석이 제공됩니다.
              </p>
            </div>

            {/* Trading Fee Mode */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">거래비용 모드</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFeeMode('STANDARD')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-black border transition cursor-pointer ${
                    feeMode === 'STANDARD'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  기본 0.1% (교육용)
                </button>
                <button
                  type="button"
                  onClick={() => setFeeMode('LOW')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-black border transition cursor-pointer ${
                    feeMode === 'LOW'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  우대 0.05%
                </button>
                <button
                  type="button"
                  onClick={() => setFeeMode('ZERO')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-black border transition cursor-pointer ${
                    feeMode === 'ZERO'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  비용 없음
                </button>
              </div>
            </div>

            {/* FX Effect and Fractional Shares */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block">미국주식 환율 효과 반영</span>
                  <span className="text-[10px] text-slate-400 font-semibold">USD/KRW 환율 변동을 원화 수익률에 결합</span>
                </div>
                <input
                  type="checkbox"
                  checked={includeFx}
                  onChange={e => setIncludeFx(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block">소수점 주식 투자 허용</span>
                  <span className="text-[10px] text-slate-400 font-semibold">정밀한 비중 분산 투자를 위해 소수점 허용</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowFractional}
                  onChange={e => setAllowFractional(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>

            {/* Start Mode Choice */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-extrabold text-slate-700">시작 방식</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStartMode('MANUAL')}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition cursor-pointer ${
                    startMode === 'MANUAL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  직접 수동 투자 시작
                </button>
                <button
                  type="button"
                  onClick={() => setStartMode('AUTO_RULE')}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition cursor-pointer flex items-center justify-center gap-1 ${
                    startMode === 'AUTO_RULE'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>⚡ 자동투자 규칙부터 설정</span>
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Start Game Action Button */}
        <button
          onClick={handleStartGame}
          disabled={!isPeriodValid}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-black rounded-2xl shadow-xl shadow-blue-600/25 transition transform active:scale-98 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
        >
          <Play size={20} />
          <span>{startYear}년 말 {nickname}의 45년 주식투자 시뮬레이션 시작하기</span>
        </button>
      </div>
    </HeroBackground>
  );
};
