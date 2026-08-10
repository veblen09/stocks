import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { BookOpen, Scale, ShieldAlert, Award, ChevronRight } from 'lucide-react';

export const LearningPointCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'diversify' | 'emergency' | 'compound' | 'fraud'>('diversify');

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'diversify': return <Scale size={14} />;
      case 'emergency': return <Award size={14} />;
      case 'compound': return <BookOpen size={14} />;
      case 'fraud': return <ShieldAlert size={14} />;
      default: return <BookOpen size={14} />;
    }
  };

  return (
    <GlassCard className="p-5 flex flex-col gap-4 border-slate-100/80 shadow-sm" variant="default">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 select-none">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <BookOpen size={16} className="text-blue-600" /> 💡 이번 턴 핵심 금융 개념 학습
        </h3>
        <span className="text-[10px] text-slate-400 font-bold">배움 자료실</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 select-none scrollbar-none">
        {(['diversify', 'emergency', 'compound', 'fraud'] as const).map((tab) => {
          const labels = {
            diversify: '분산투자',
            emergency: '비상금',
            compound: '복리/인플레',
            fraud: '금융사기 예방'
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold border transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                  : 'bg-white border-slate-200/60 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {getTabIcon(tab)}
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 text-[11px] leading-relaxed text-slate-600 font-semibold space-y-2 flex-grow min-h-[140px] flex flex-col justify-center">
        {activeTab === 'diversify' && (
          <div className="space-y-1.5 animate-fade-in-up">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">⚖️ 왜 자산을 여러 군데 쪼개 담아야 할까요?</h4>
            <p className="select-text">주식이나 코인은 기대수익이 높지만 그만큼 가치가 급락할 위험(변동성)이 커요. 이때 성격이 반대이거나 안전한 채권, 예적금, 실물자산(금)에 나누어 담으면, 특정 자산의 가치가 떨어져도 가계의 전체 충격을 흡수할 수 있습니다.</p>
            <div className="text-[9.5px] text-blue-600 font-extrabold flex items-center gap-1 select-none pt-1">
              핵심 원칙: 비체계적 위험 제거 <ChevronRight size={12} />
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="space-y-1.5 animate-fade-in-up">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">🛡️ 비상금 쿠션(현금)의 위력</h4>
            <p className="select-text">인생 시뮬레이션 중에는 예기치 못한 의료비 지출이나 사기 피해, 전세 보증금 인상 같은 긴급 비용이 발생할 수 있습니다. 비상용 현금이 없다면, 손실이 나 있는 주식이나 해외 ETF 상품을 억지로 처분하여 큰 손해를 입어야만 합니다.</p>
            <div className="text-[9.5px] text-blue-600 font-extrabold flex items-center gap-1 select-none pt-1">
              행동 강령: 2~3개월 가계비 입출금 통장에 유지 <ChevronRight size={12} />
            </div>
          </div>
        )}

        {activeTab === 'compound' && (
          <div className="space-y-1.5 animate-fade-in-up">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">📈 복리의 스노볼 효과 & 인플레이션 방어</h4>
            <p className="select-text">복리는 이자의 이자가 쌓여 자산이 눈덩이처럼 커지는 원리입니다. 다만, 예금에만 모든 돈을 넣어두면 물가가 오르는 속도(인플레이션)보다 자산 증가 속도가 느려서 실질적인 구매력은 감소할 수 있습니다. 장기 성장 자산 배분이 중요해요.</p>
            <div className="text-[9.5px] text-blue-600 font-extrabold flex items-center gap-1 select-none pt-1">
              수업 전략: 장기 주식 ETF와 예적금의 적절한 조화 <ChevronRight size={12} />
            </div>
          </div>
        )}

        {activeTab === 'fraud' && (
          <div className="space-y-1.5 animate-fade-in-up">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">🚫 원금 보장 고수익 사기 경계하기</h4>
            <p className="select-text">&lsquo;원금이 백퍼센트 보장되면서 월 10%의 수익을 준다&rsquo;는 말은 현실에 존재할 수 없는 금융사기(폰지사기/리딩방)입니다. 투자 위험도가 낮아질수록 기대할 수 있는 수익률도 비례하여 낮아진다는 점(High Risk, High Return)을 명심해야 합니다.</p>
            <div className="text-[9.5px] text-blue-600 font-extrabold flex items-center gap-1 select-none pt-1">
              경고 표식: 비정상적 고수익 권유는 100% 사기 <ChevronRight size={12} />
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
