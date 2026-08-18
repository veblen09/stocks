import React from 'react';
import { ResultSummary } from '../components/ResultSummary';
import { ArrowLeft, Landmark } from 'lucide-react';

interface ResultPageProps {
  onNavigate: (page: string) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* 상단 네비 바 */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition"
        >
          <ArrowLeft size={14} /> 메인으로 이동
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
          <Landmark size={14} className="text-emerald-500" /> 머니트랙 실험보고서
        </div>
      </div>

      {/* 결과 분석 컴포넌트 */}
      <ResultSummary />
    </div>
  );
};
