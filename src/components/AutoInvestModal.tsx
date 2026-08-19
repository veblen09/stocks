import React, { useState } from 'react';
import { X, Play, Save, Trash2, Zap, Shield } from 'lucide-react';
import { GlassCard } from './GlassCard';
import type { AutoInvestRule, StockGameState } from '../types/stockGame';
import { useToast } from '../features/notifications/ToastProvider';
import { audioManager } from '../utils/audioManager';

interface AutoInvestModalProps {
  isOpen: boolean;
  state?: StockGameState;
  currentYear?: number;
  endYear?: number;
  savedRules?: AutoInvestRule[];
  onClose: () => void;
  onRunAutoInvest?: (rule: AutoInvestRule, years: 5 | 10 | 'ALL') => void;
  onExecuteAutoInvest?: (rule: AutoInvestRule, years: 5 | 10 | 'ALL') => void;
  onSaveRule: (rule: AutoInvestRule) => void;
  onDeleteRule: (id: string) => void;
}

export const AutoInvestModal: React.FC<AutoInvestModalProps> = ({
  isOpen,
  state,
  currentYear: propCurrentYear,
  endYear: propEndYear,
  savedRules: propSavedRules,
  onClose,
  onRunAutoInvest,
  onExecuteAutoInvest,
  onSaveRule,
  onDeleteRule,
}) => {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const currentYear = state ? state.currentYear : (propCurrentYear || 1981);
  const endYear = state ? state.settings.endYear : (propEndYear || 2025);
  const savedRules = state ? (state.savedAutoInvestRules || []) : (propSavedRules || []);
  const executeFn = onRunAutoInvest || onExecuteAutoInvest || (() => {});

  const remainingYears = endYear - currentYear + 1;

  const [selectedRuleId, setSelectedRuleId] = useState<string>(savedRules[0]?.id || 'custom');
  const [ruleName, setRuleName] = useState<string>('나만의 자동투자 전략');
  const [durationYears, setDurationYears] = useState<5 | 10 | 'ALL'>(
    remainingYears >= 10 ? 10 : remainingYears >= 5 ? 5 : 'ALL'
  );
  const [rebalanceMode, setRebalanceMode] = useState<AutoInvestRule['rebalanceMode']>('ANNUAL');
  const [preIpoMode, setPreIpoMode] = useState<AutoInvestRule['preIpoMode']>('PRO_RATA_ACTIVE');
  const [advancedFilter, setAdvancedFilter] = useState<AutoInvestRule['advancedFilter']>('NONE');
  const [crisisAction, setCrisisAction] = useState<'HOLD' | 'REBALANCE' | 'RAISE_CASH'>('HOLD');
  const [allocations, setAllocations] = useState<{ canonicalId: string; weight: number }[]>([
    { canonicalId: 'KR_005930', weight: 0.25 },
    { canonicalId: 'KR_005380', weight: 0.25 },
    { canonicalId: 'US_AAPL', weight: 0.25 },
    { canonicalId: 'US_XOM', weight: 0.25 },
  ]);

  const handleSelectPreset = (rule: AutoInvestRule) => {
    audioManager.playUiSound('keyTap');
    setSelectedRuleId(rule.id);
    setRuleName(rule.name);
    setDurationYears(rule.durationYears);
    setRebalanceMode(rule.rebalanceMode);
    setPreIpoMode(rule.preIpoMode);
    setAdvancedFilter(rule.advancedFilter || 'NONE');
    if (rule.crisisRule) {
      const act = rule.crisisRule.action === 'REBALANCE_TO_TARGET' ? 'REBALANCE' : rule.crisisRule.action;
      setCrisisAction(act);
    }
    setAllocations([...rule.targetAllocations]);
  };

  const getCurrentRule = (): AutoInvestRule => ({
    id: selectedRuleId === 'custom' ? `custom_${Date.now()}` : selectedRuleId,
    name: ruleName,
    durationYears,
    targetAllocations: allocations,
    annualContributionKRW: 3000000,
    rebalanceMode,
    preIpoMode,
    advancedFilter,
    crisisRule: {
      action: crisisAction,
      targetCashWeight: crisisAction === 'RAISE_CASH' ? 0.3 : undefined,
    },
  });

  const handleExecute = (years: 5 | 10 | 'ALL') => {
    const rule = getCurrentRule();
    if (advancedFilter === 'NONE' && allocations.length === 0) {
      showToast('최소 1개 이상의 종목을 배분하거나 고급 필터를 선택하세요.', 'warning');
      return;
    }
    executeFn(rule, years);
    showToast(`${years === 'ALL' ? '전체' : `${years}년`} 자동투자가 완료되었습니다.`, 'success');
    onClose();
  };

  const handleSave = () => {
    const rule = getCurrentRule();
    onSaveRule(rule);
    showToast('자동투자 전략이 저장되었습니다.', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <GlassCard
        className="w-full max-w-2xl max-h-[90vh] bg-white border-slate-200 p-6 sm:p-7 shadow-2xl flex flex-col space-y-4 text-slate-800 overflow-y-auto"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Zap size={20} />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">규칙 기반 자동투자 (Auto-Invest)</h3>
              <p className="text-xs text-slate-500 font-medium">사전 설정한 비중과 규칙대로 시장을 자동 시뮬레이션합니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Saved Rules Presets */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700">저장된 자동투자 프리셋</span>
          <div className="flex flex-wrap gap-2">
            {savedRules.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectPreset(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                  selectedRuleId === r.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{r.name}</span>
                {r.id.startsWith('custom_') && (
                  <Trash2
                    size={12}
                    className="hover:text-red-300 ml-1"
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteRule(r.id);
                    }}
                  />
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSelectedRuleId('custom');
                setRuleName('새로운 맞춤 전략');
                setAdvancedFilter('NONE');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                selectedRuleId === 'custom'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-dashed border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              + 직접 만들기
            </button>
          </div>
        </div>

        {/* Crisis Rule Setting */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-rose-600" />
            <span className="text-xs font-bold text-slate-800">역사적 위기 발생 시 자동 대응 규칙</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { id: 'HOLD' as const, label: '원칙 유지 (Hold)' },
              { id: 'REBALANCE' as const, label: '목표비중 리밸런싱' },
              { id: 'RAISE_CASH' as const, label: '현금 30% 확대' },
            ].map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { audioManager.playUiSound('keyTap'); setCrisisAction(c.id); }}
                className={`py-2 px-2 rounded-xl font-bold cursor-pointer transition border text-center ${
                  crisisAction === c.id
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Execution Buttons */}
        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={14} /> 현재 규칙 저장
          </button>

          <div className="flex items-center gap-2">
            {remainingYears >= 5 && (
              <button
                type="button"
                onClick={() => handleExecute(5)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Play size={13} /> 5년 진행
              </button>
            )}
            {remainingYears >= 10 && (
              <button
                type="button"
                onClick={() => handleExecute(10)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Play size={13} /> 10년 진행
              </button>
            )}
            <button
              type="button"
              onClick={() => handleExecute('ALL')}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Play size={13} /> 잔여 전체 진행 ({remainingYears}년)
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
