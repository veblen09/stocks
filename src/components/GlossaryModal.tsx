import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GLOSSARY_ITEMS = [
  {
    term: 'TWR (시간가중수익률, Time-Weighted Return)',
    meaning:
      '중간에 돈을 추가로 넣거나 빼는 외부 현금흐름의 영향을 완전히 제거하여, 순수하게 포트폴리오의 투자 전략 자체의 복리 운용 실력을 측정하는 글로벌 표준 지표입니다.',
  },
  {
    term: 'MWR / IRR (금액가중수익률, Money-Weighted Return)',
    meaning:
      '투자자가 실제로 돈을 언제, 얼마나 넣었는지의 자금 납입 타이밍을 모두 반영한 개인별 내부수익률(IRR)입니다. 적립식 투자의 실제 체감 수익률을 나타냅니다.',
  },
  {
    term: 'CAGR (연평균 복리수익률, Compound Annual Growth Rate)',
    meaning:
      '여러 해 동안의 전체 누적 수익률을 매년 일정한 비율로 복리 성장했을 때의 연간 수익률로 환산한 값입니다.',
  },
  {
    term: 'MDD (최대낙폭, Maximum Drawdown)',
    meaning:
      '투자 기간 중 과거 고점(Peak) 대비 자산이 가장 크게 폭락했을 때의 하락률(Trough)입니다. 투자자가 견뎌내야 했던 최악의 손실 스트레스 크기를 의미합니다.',
  },
  {
    term: '환율 효과 (FX Conversion & Impact)',
    meaning:
      '미국 주식은 달러(USD)로 평가되므로 원화(KRW) 기준 수익률은 [주가 변동]과 [원/달러 환율 변동]의 곱으로 결정됩니다. 위기 시 달러 강세는 원화 평가액을 방어해 주는 쿠션 역할을 합니다.',
  },
  {
    term: '리밸런싱 (Rebalancing)',
    meaning:
      '주가 변동으로 인해 당초 설정한 자산별 목표 비중이 틀어졌을 때, 많이 오른 자산을 일부 매도하고 덜 오른 자산을 매수하여 원래의 위험 배분 비율로 되돌리는 원칙적인 자산관리 행위입니다.',
  },
  {
    term: '생존자 편향 (Survivorship Bias)',
    meaning:
      '장기 우량 생존 기업과 함께 한보철강, 제일은행, 대우, 팬택, 리만브라더스, 엔론, 블록버스터 등 역사적 상장폐지/몰락 기업 60개사를 탑재하여 생존자 편향을 방지하고 현실적인 위험 관리의 중요성을 체험하도록 설계되었습니다.',
  },
  {
    term: '코스피 (KOSPI) & S&P 500',
    meaning:
      '코스피는 1980년 1월 4일(100.00)을 기준으로 산출된 한국 유가증권시장 대표 지수이며, S&P 500은 미국 증시를 대표하는 500개 대형 우량주의 시가총액 가중 지수입니다.',
  },
];

export const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-2xl p-6 relative animate-fade-in-up border-white/80 max-h-[85vh] flex flex-col" variant="strong">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <BookOpen size={18} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight font-display">
              📖 금융 & 퀀트 투자 용어 사전
            </h3>
            <p className="text-xs text-slate-500 font-semibold">장기 주식투자와 리스크 관리를 위한 핵심 용어 해설</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto pr-2 font-medium">
          {GLOSSARY_ITEMS.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-1 hover:border-blue-300 transition">
              <h4 className="font-extrabold text-blue-700 text-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                {item.term}
              </h4>
              <p className="text-slate-600 leading-relaxed pl-3 font-semibold">{item.meaning}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer text-xs"
        >
          이해했습니다
        </button>
      </GlassCard>
    </div>
  );
};
