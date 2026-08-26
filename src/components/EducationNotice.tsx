import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EducationNoticeProps {
  className?: string;
}

export const EducationNotice: React.FC<EducationNoticeProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl flex items-start gap-3 text-left shadow-sm backdrop-blur-sm ${className}`}>
      <div className="p-1 bg-slate-200/50 text-slate-500 rounded-lg flex-shrink-0 mt-0.5">
        <AlertCircle size={14} />
      </div>
      <div className="space-y-1">
        <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium select-text">
          본 프로그램은 금융교육을 위한 모의 시뮬레이션입니다. 실제 투자 결과를 보장하지 않으며 특정 금융상품 가입이나 투자를 권유하지 않습니다. 수익률, 세금, 수수료, 제도는 교육 목적으로 단순화되어 있습니다.
        </p>
        <p className="text-[10px] text-slate-400 font-semibold select-text">
          Copyright 2026. 하나고등학교 일반사회 교사 김윤구 All Right Reserved. (veblen@hana.hs.kr)
        </p>
        <p className="text-[9.5px] text-slate-400 select-text">
          © 2026 머니트랙: 45년 한·미 주식투자 실험실 (1980~2025). 본 프로그램은 금융교육을 위한 실제 역사 데이터 기반 모의 시뮬레이션입니다.
        </p>
      </div>
    </div>
  );
};
