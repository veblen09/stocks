import React, { useState } from 'react';
import { ArrowLeft, Play, Calendar, Sliders, Shield, Zap } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { HeroBackground } from '../components/HeroBackground';
import type { GameSettings, BenchmarkId, PlayMode, MonthlyReplaySpeed } from '../types/stockGame';
import { useStockGame } from '../store/stockGameStore';
import { audioManager } from '../utils/audioManager';
import { formatKRW } from '../utils/formatMoney';
import { useToast } from '../features/notifications/ToastProvider';

interface SetupPageProps {
  onNavigate: (page: string) => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onNavigate }) => {
  const { startNewGame } = useStockGame();
  const { showToast } = useToast();

  const [nickname, setNickname] = useState<string>('투자탐험가');
  const [startYear, setStartYear] = useState<number>(1980);
  const [endYear, setEndYear] = useState<number>(2025);
  const [initialCash, setInitialCash] = useState<number>(10000000);
  const [annualContribution, setAnnualContribution] = useState<number>(3000000);
  const allowFractional = true;
  const includeFx = true;
  const [primaryBenchmark, setPrimaryBenchmark] = useState<BenchmarkId>('kospi');
  const startMode = 'MANUAL';

  // Enhanced Risk Settings
  const [playMode, setPlayModeState] = useState<PlayMode>('REAL');
  const [universeMode, setUniverseModeState] = useState<'CLASSIC_50' | 'HISTORICAL_SURVIVOR'>('CLASSIC_50');
  const [showRealPurchasingPower, setShowRealPurchasingPowerState] = useState<boolean>(true);
  const [monthlyReplaySpeed, setMonthlyReplaySpeedState] = useState<MonthlyReplaySpeed>('NORMAL');

  const totalYears = endYear - startYear;
  const isPeriodValid = totalYears >= 5;

  const handleStartGame = () => {
    if (!isPeriodValid) {
      showToast('투자 기간은 최소 5년 이상이어야 합니다.', 'warning');
      return;
    }

    const settings: GameSettings = {
      nickname: nickname.trim() || '투자탐험가',
      startYear,
      endYear,
      initialCashKRW: initialCash,
      annualContributionKRW: annualContribution,
      allowFractionalShares: allowFractional,
      feeRate: 0.001,
      fxFeeRate: 0.0,
      includeFxEffect: includeFx,
      primaryBenchmark,
      startMode,
      playMode,
      monthlyReplaySpeed,
      showRealPurchasingPower,
      universeMode,
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
              투자 환경 & 규칙 설정
            </h1>
            <p className="text-xs text-blue-600 font-bold">1980~2025 실제 시장 데이터 기반 맞춤 설계</p>
          </div>
        </div>

        {/* Play Mode & Rules Card (NEW P1 Feature) */}
        <GlassCard className="p-5 sm:p-6 space-y-4" variant="default">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield size={18} className="text-indigo-600" />
            <h2 className="font-extrabold text-slate-800 text-sm">플레이 방식 및 규칙 모드</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Real Mode */}
            <button
              type="button"
              onClick={() => { audioManager.playUiSound('keyTap'); setPlayModeState('REAL'); }}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                playMode === 'REAL'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl mt-0.5 ${playMode === 'REAL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Shield size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-900">실전 모드 (권장)</span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">진짜 긴장감</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                  결과가 공개된 이후 이전 연도 결정을 되돌릴 수 없습니다. 실제 역사 속 위기에서 원칙을 지키는 훈련을 수행합니다.
                </p>
              </div>
            </button>

            {/* Practice Mode */}
            <button
              type="button"
              onClick={() => { audioManager.playUiSound('keyTap'); setPlayModeState('PRACTICE'); }}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                playMode === 'PRACTICE'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl mt-0.5 ${playMode === 'PRACTICE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Zap size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-900">연습 모드</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">자유 실험</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                  연도 결과를 되돌리고 다른 투자 전략을 자유롭게 실험할 수 있습니다. 되돌린 재실험 횟수는 별도 기록됩니다.
                </p>
              </div>
            </button>
          </div>
        </GlassCard>

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
                    if (endYear - sy < 5) {
                      setEndYear(Math.min(2025, sy + 5));
                    }
                  }}
                  className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  {Array.from({ length: 41 }, (_, i) => 1980 + i).map(y => (
                    <option key={y} value={y}>{y}년 말</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">종료 기준 연도</label>
                <select
                  value={endYear}
                  onChange={e => setEndYear(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  {Array.from({ length: 41 }, (_, i) => 1985 + i).map(y => (
                    <option key={y} value={y} disabled={y <= startYear}>
                      {y}년 말 {y - startYear >= 5 ? `(${y - startYear}년)` : '(최소 5년 이상)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Initial Cash */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-slate-700">초기 투자 원금</label>
                <span className="text-xs font-mono font-extrabold text-blue-700">{formatKRW(initialCash)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[10000000, 30000000, 50000000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { audioManager.playUiSound('keyTap'); setInitialCash(amt); }}
                    className={`py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer border ${
                      initialCash === amt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {formatKRW(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Annual Contribution */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-slate-700">매년 연초 추가 납입금 (적립식 투자)</label>
                <span className="text-xs font-mono font-extrabold text-blue-700">+{formatKRW(annualContribution)}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1000000, 3000000, 6000000, 10000000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { audioManager.playUiSound('keyTap'); setAnnualContribution(amt); }}
                    className={`py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer border ${
                      annualContribution === amt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {amt === 0 ? '없음' : formatKRW(amt)}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Card 2: 벤치마크 및 시뮬레이션 설정 */}
          <GlassCard className="p-5 sm:p-6 space-y-4" variant="default">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders size={18} className="text-purple-600" />
              <h2 className="font-extrabold text-slate-800 text-sm">비교 벤치마크 & 속도 설정</h2>
            </div>

            {/* Primary Benchmark */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">주요 성과 비교 벤치마크</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'kospi' as const, label: '🇰🇷 코스피' },
                  { id: 'sp500' as const, label: '🇺🇸 S&P 500' },
                  { id: 'blend5050' as const, label: '⚖️ 50:50 혼합' },
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => { audioManager.playUiSound('keyTap'); setPrimaryBenchmark(b.id); }}
                    className={`py-2 px-2 rounded-xl font-extrabold text-xs transition cursor-pointer border text-center ${
                      primaryBenchmark === b.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Replay Speed */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">월별 시장 재생 속도</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'NORMAL' as const, label: '보통 (약 8초)' },
                  { id: 'FAST' as const, label: '빠르게 (약 3초)' },
                  { id: 'INSTANT' as const, label: '즉시 진행' },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { audioManager.playUiSound('keyTap'); setMonthlyReplaySpeedState(s.id); }}
                    className={`py-1.5 px-2 rounded-xl font-extrabold text-xs transition cursor-pointer border text-center ${
                      monthlyReplaySpeed === s.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CPI Real Purchasing Power Toggle */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-xs text-slate-800 block">실질 구매력(CPI 물가반영) 표시</span>
                <span className="text-[11px] text-slate-500">한국은행/통계청 역사적 CPI 기준 물가 가치 계산</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  audioManager.playUiSound('keyTap');
                  setShowRealPurchasingPowerState(!showRealPurchasingPower);
                }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer transition ${
                  showRealPurchasingPower
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {showRealPurchasingPower ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Universe Mode */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">종목 유니버스 모드</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { audioManager.playUiSound('keyTap'); setUniverseModeState('CLASSIC_50'); }}
                  className={`py-2 px-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer border text-center ${
                    universeMode === 'CLASSIC_50'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🏛️ 클래식 50종목 (기본)
                </button>
                <button
                  type="button"
                  onClick={() => { audioManager.playUiSound('keyTap'); setUniverseModeState('HISTORICAL_SURVIVOR'); }}
                  className={`py-2 px-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer border text-center ${
                    universeMode === 'HISTORICAL_SURVIVOR'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  📜 역사적 생존 (실험적)
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Start Game Action Button */}
        <div className="flex items-center justify-center pt-2">
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:translate-y-0.5 text-white font-black text-base rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={20} />
            <span>{nickname} 님의 45년 투자 생존 시뮬레이션 시작</span>
          </button>
        </div>
      </div>
    </HeroBackground>
  );
};
