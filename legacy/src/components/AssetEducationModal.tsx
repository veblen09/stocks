import React from 'react';
import { ASSETS } from '../data/assets';
import { GlassCard } from './GlassCard';
import { RiskBadge } from './RiskBadge';

interface AssetEducationModalProps {
  assetId: string | null;
  onClose: () => void;
}

export const AssetEducationModal: React.FC<AssetEducationModalProps> = ({ assetId, onClose }) => {
  if (!assetId) return null;
  
  const asset = ASSETS.find((a) => a.id === assetId);
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <GlassCard className="p-6 max-w-md w-full border-white/80 animate-fade-in-up" variant="strong">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">{asset.name}</h3>
            <RiskBadge score={asset.riskScore} />
          </div>
          
          <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/50">
            <div className="text-[10px] font-bold text-blue-700 mb-1 select-none">📘 금융상품 설명</div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium select-text">{asset.description}</p>
          </div>

          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/50">
            <div className="text-[10px] font-bold text-emerald-700 mb-1 select-none">💡 청소년 금융 배움 교실</div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium select-text">{asset.educationTip}</p>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold select-none pt-2">
            <div>원금 손실위험: {asset.riskScore}/10</div>
            <div>환금 유동성: {asset.liquidityScore}/10</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs select-none"
          >
            내용을 이해했습니다
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
