import React, { useState } from 'react';
import { X, Play, Save, Trash2, Zap, Sparkles } from 'lucide-react';
import { GlassCard } from './GlassCard';
import type { AutoInvestRule } from '../types/stockGame';
import { STOCKS } from '../engine/returnEngine';

interface AutoInvestModalProps {
  isOpen: boolean;
  currentYear: number;
  endYear: number;
  savedRules: AutoInvestRule[];
  onClose: () => void;
  onExecuteAutoInvest: (rule: AutoInvestRule, years: 5 | 10 | 'ALL') => void;
  onSaveRule: (rule: AutoInvestRule) => void;
  onDeleteRule: (id: string) => void;
}

export const AutoInvestModal: React.FC<AutoInvestModalProps> = ({
  isOpen,
  currentYear,
  endYear,
  savedRules,
  onClose,
  onExecuteAutoInvest,
  onSaveRule,
  onDeleteRule,
}) => {
  if (!isOpen) return null;

  const remainingYears = endYear - currentYear + 1;

  const [selectedRuleId, setSelectedRuleId] = useState<string>(savedRules[0]?.id || 'custom');
  const [ruleName, setRuleName] = useState<string>('나만의 자동투자 전략');
  const [durationYears, setDurationYears] = useState<5 | 10 | 'ALL'>(
    remainingYears >= 10 ? 10 : remainingYears >= 5 ? 5 : 'ALL'
  );
  const [rebalanceMode, setRebalanceMode] = useState<AutoInvestRule['rebalanceMode']>('ANNUAL');
  const [preIpoMode, setPreIpoMode] = useState<AutoInvestRule['preIpoMode']>('PRO_RATA_ACTIVE');
  const [advancedFilter, setAdvancedFilter] = useState<AutoInvestRule['advancedFilter']>('NONE');
  const [allocations, setAllocations] = useState<{ canonicalId: string; weight: number }[]>([
    { canonicalId: 'KR_005930', weight: 0.25 },
    { canonicalId: 'KR_000660', weight: 0.25 },
    { canonicalId: 'US_AAPL', weight: 0.25 },
    { canonicalId: 'US_MSFT', weight: 0.25 },
  ]);

  const handleSelectPreset = (rule: AutoInvestRule) => {
    setSelectedRuleId(rule.id);
    setRuleName(rule.name);
    setDurationYears(rule.durationYears);
    setRebalanceMode(rule.rebalanceMode);
    setPreIpoMode(rule.preIpoMode);
    setAdvancedFilter(rule.advancedFilter || 'NONE');
    setAllocations([...rule.targetAllocations]);
  };

  const handleAddStock = (canonicalId: string) => {
    if (allocations.find(a => a.canonicalId === canonicalId)) return;
    const newAlloc = [...allocations, { canonicalId, weight: 0.1 }];
    setAllocations(newAlloc);
  };

  const handleRemoveStock = (canonicalId: string) => {
    setAllocations(allocations.filter(a => a.canonicalId !== canonicalId));
  };

  const handleWeightChange = (canonicalId: string, valStr: string) => {
    const num = parseFloat(valStr) || 0;
    const weight = Math.max(0, Math.min(100, num)) / 100;
    setAllocations(
      allocations.map(a => (a.canonicalId === canonicalId ? { ...a, weight } : a))
    );
  };

  const handleEqualWeight = () => {
    if (allocations.length === 0) return;
    const eq = Math.floor((100 / allocations.length) * 10) / 1000;
    setAllocations(allocations.map(a => ({ ...a, weight: eq })));
  };

  const totalWeight = allocations.reduce((sum, a) => sum + a.weight, 0);

  const getCurrentRule = (): AutoInvestRule => ({
    id: selectedRuleId === 'custom' ? `custom_${Date.now()}` : selectedRuleId,
    name: ruleName,
    durationYears,
    targetAllocations: allocations,
    annualContributionKRW: 3000000,
    rebalanceMode,
    preIpoMode,
    advancedFilter,
  });

  const handleExecute = (years: 5 | 10 | 'ALL') => {
    const rule = getCurrentRule();
    onExecuteAutoInvest(rule, years);
    onClose();
  };

  const handleSave = () => {
    const rule = getCurrentRule();
    onSaveRule(rule);
    alert('규칙이 성공적으로 저장되었습니다!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-2xl p-6 relative animate-fade-in-up border-white/90 shadow-2xl flex flex-col max-h-[90vh]" variant="strong">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/20">
            <Zap size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight font-display">
              5년·10년 자동투자(Auto-Invest) 엔진
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              장기 복리 투자 규칙을 정의하고 자동으로 고속 시뮬레이션을 실행합니다.
            </p>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1 text-xs text-slate-600 font-medium">
          {/* Preset Rules */}
          <div className="space-y-1.5">
            <span className="font-extrabold text-slate-800 text-xs block">저장된 자동투자 프리셋 규칙</span>
            <div className="flex flex-wrap gap-2">
              {savedRules.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSelectPreset(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1.5 ${
                    selectedRuleId === r.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles size={13} />
                  {r.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setSelectedRuleId('custom');
                  setRuleName('사용자 정의 규칙');
                  setAdvancedFilter('NONE');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                  selectedRuleId === 'custom'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                + 새 규칙 생성
              </button>
            </div>
          </div>

          {/* Rule Name & Advanced Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 block">규칙 이름</label>
              <input
                type="text"
                value={ruleName}
                onChange={e => setRuleName(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 block">퀀트 고급 전략 필터</label>
              <select
                value={advancedFilter}
                onChange={e => setAdvancedFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="NONE">지정 종목 고정 배분 (기본)</option>
                <option value="TOP_1YR_MOMENTUM">직전 1년 수익률 상위 5개 동적 선정</option>
                <option value="TOP_3YR_CAGR">과거 3년 CAGR 상위 5개 동적 선정</option>
                <option value="LOW_VOLATILITY">과거 변동성 최저 5개 동적 선정</option>
                <option value="KR_ONLY">한국 주식만 배분</option>
                <option value="US_ONLY">미국 주식만 배분</option>
              </select>
            </div>
          </div>

          {/* Rebalancing & Pre-IPO Modes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 block">리밸런싱 모드</label>
              <select
                value={rebalanceMode}
                onChange={e => setRebalanceMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="ANNUAL">매년 목표 비중으로 자동 리밸런싱 (추천)</option>
                <option value="BUY_ONLY">매도 없이 신규 적립금만 목표비중에 맞춰 매수</option>
                <option value="THRESHOLD_5PCT">비중이 5%p 이상 벗어날 때만 리밸런싱</option>
                <option value="NONE">리밸런싱 안 함 (최초 매수 후 유지)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 block">상장 전(Pre-IPO) 종목 처리</label>
              <select
                value={preIpoMode}
                onChange={e => setPreIpoMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="PRO_RATA_ACTIVE">투자 가능한 나머지 종목에 비례 재배분 (추천)</option>
                <option value="HOLD_CASH">해당 비중을 현금으로 대기</option>
              </select>
            </div>
          </div>

          {/* Target Allocations List if manual */}
          {advancedFilter === 'NONE' && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 text-xs">
                  목표 종목 및 비중 설정 (합계: {(totalWeight * 100).toFixed(1)}%)
                </span>
                <button
                  onClick={handleEqualWeight}
                  className="text-[11px] font-black text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  균등 비중 자동 분배
                </button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {allocations.map(a => {
                  const s = STOCKS.find(item => item.canonicalId === a.canonicalId);
                  if (!s) return null;
                  return (
                    <div key={a.canonicalId} className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span>{s.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
                        <span className="font-bold text-slate-800">{s.nameKo}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({s.ticker})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={Math.round(a.weight * 100)}
                          onChange={e => handleWeightChange(a.canonicalId, e.target.value)}
                          className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-black text-xs text-blue-600 focus:outline-none"
                        />
                        <span className="font-bold text-slate-500">%</span>
                        <button
                          onClick={() => handleRemoveStock(a.canonicalId)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Stock Selector */}
              <div className="pt-2 border-t border-slate-200/50 flex gap-2">
                <select
                  onChange={e => {
                    if (e.target.value) {
                      handleAddStock(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="flex-grow px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>+ 종목 추가하기 (50개 카탈로그)</option>
                  {STOCKS.map(s => (
                    <option key={s.canonicalId} value={s.canonicalId}>
                      {s.market === 'KR' ? '🇰🇷' : '🇺🇸'} {s.nameKo} ({s.ticker}) · {s.sector}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Save size={15} /> 규칙 저장
            </button>

            {selectedRuleId !== 'custom' && selectedRuleId !== 'default_sp500_kospi' && (
              <button
                onClick={() => {
                  onDeleteRule(selectedRuleId);
                  setSelectedRuleId('custom');
                }}
                className="py-3 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition flex items-center justify-center text-xs cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              onClick={() => handleExecute(5)}
              disabled={remainingYears < 5}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Play size={14} /> 5년 즉시 자동투자
            </button>

            <button
              onClick={() => handleExecute(10)}
              disabled={remainingYears < 10}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Play size={14} /> 10년 즉시 자동투자
            </button>

            <button
              onClick={() => handleExecute('ALL')}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Zap size={14} /> 잔여 전체({remainingYears}년) 완료
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
