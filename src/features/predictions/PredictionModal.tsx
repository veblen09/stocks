import React, { useState } from 'react';
import { Eye, Lock, X, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';

import type { AnnualPrediction, DirectionGuess } from '../../types/prediction';
import { audioManager } from '../../utils/audioManager';

interface PredictionModalProps {
  isOpen: boolean;
  year: number;
  existingPrediction?: AnnualPrediction;
  onSavePrediction: (prediction: AnnualPrediction) => void;
  onClose: () => void;
}

export const PredictionModal: React.FC<PredictionModalProps> = ({
  isOpen,
  year,
  existingPrediction,
  onSavePrediction,
  onClose,
}) => {
  const isLocked = existingPrediction?.locked || false;

  const [kospiDirection, setKospiDirection] = useState<DirectionGuess>(
    existingPrediction?.kospiDirection || 'UNKNOWN'
  );
  const [sp500Direction, setSp500Direction] = useState<DirectionGuess>(
    existingPrediction?.sp500Direction || 'UNKNOWN'
  );
  const [usdKrwDirection, setUsdKrwDirection] = useState<DirectionGuess>(
    existingPrediction?.usdKrwDirection || 'UNKNOWN'
  );
  const [selectedSector, setSelectedSector] = useState<string>(
    existingPrediction?.selectedSector || '반도체'
  );
  const [confidence, setConfidence] = useState<number>(
    existingPrediction?.confidence || 60
  );
  const [rationale, setRationale] = useState<string>(
    existingPrediction?.rationale || ''
  );

  if (!isOpen) return null;

  const handleSave = () => {
    if (isLocked) return;
    audioManager.playUiSound('success');
    const newPrediction: AnnualPrediction = {
      year,
      kospiDirection,
      sp500Direction,
      usdKrwDirection,
      selectedSector,
      confidence,
      rationale,
      createdAtDecisionDate: `${year - 1}-12-31`,
      locked: true,
    };
    onSavePrediction(newPrediction);
    onClose();
  };

  const SECTORS = ['반도체', '자동차', '금융', '소비재', '에너지/소재', '헬스케어/바이오', '인터넷/플랫폼', '기타/판단유보'];

  const renderDirectionButtons = (
    label: string,
    val: DirectionGuess,
    setter: (g: DirectionGuess) => void
  ) => (
    <div className="space-y-1.5">
      <span className="text-xs font-bold text-slate-700 block">{label}</span>
      <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
        {[
          { key: 'UP', text: '▲ 상승 (+2% 이상)' },
          { key: 'FLAT', text: '〓 횡보 (±2% 내외)' },
          { key: 'DOWN', text: '▼ 하락 (-2% 이상)' },
          { key: 'UNKNOWN', text: '❓ 판단 어려움' },
        ].map(opt => (
          <button
            key={opt.key}
            type="button"
            disabled={isLocked}
            onClick={() => {
              audioManager.playUiSound('keyTap');
              setter(opt.key as DirectionGuess);
            }}
            className={`py-2 px-1 rounded-xl border text-center transition cursor-pointer text-[11px] sm:text-xs ${
              val === opt.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prediction-title"
    >
      <GlassCard
        className="w-full max-w-xl max-h-[90vh] bg-white border-slate-200 p-6 sm:p-7 shadow-2xl flex flex-col space-y-4 text-slate-800 overflow-y-auto"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200">
              <Eye size={22} />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md">
                {year}년 연초 예측 및 확신도 기록
              </span>
              <h2 id="prediction-title" className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                올해의 시장 전망 및 가설 수립
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {isLocked && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-900">
            <Lock size={15} className="text-amber-600" />
            <span>이 예측은 {year}년 투자 결정 시점에 기록되어 잠금 상태입니다. 연말에 실제 결과와 비교됩니다.</span>
          </div>
        )}

        {/* Prediction Questions */}
        <div className="space-y-4 text-xs">
          {renderDirectionButtons('1. 올해 한국 코스피(KOSPI) 증시 방향', kospiDirection, setKospiDirection)}
          {renderDirectionButtons('2. 올해 미국 S&P 500 증시 방향', sp500Direction, setSp500Direction)}
          {renderDirectionButtons('3. 올해 원/달러 환율 방향', usdKrwDirection, setUsdKrwDirection)}

          {/* Sector Selection */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 block">4. 가장 주목하는 유망/핵심 업종</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {SECTORS.map(sec => (
                <button
                  key={sec}
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    audioManager.playUiSound('keyTap');
                    setSelectedSector(sec);
                  }}
                  className={`py-2 px-2 rounded-xl border text-center font-bold transition text-[11px] cursor-pointer ${
                    selectedSector === sec
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Confidence Slider */}
          <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">5. 나의 예측 확신 정도 (Confidence)</span>
              <span className="font-mono text-base font-bold text-purple-700">{confidence}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              disabled={isLocked}
              value={confidence}
              onChange={e => setConfidence(parseInt(e.target.value, 10))}
              className="w-full cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>20% (매우 불확실)</span>
              <span>60% (보통의 확신)</span>
              <span>100% (완벽히 확실)</span>
            </div>
          </div>

          {/* Rationale / Thesis Note */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 block">6. 예측 근거 및 투자 가설 (선택 사항)</span>
            <textarea
              rows={2}
              disabled={isLocked}
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              placeholder="예: 당시 유가 안정 및 연준 금리 인하 기대감으로 미국 기술주 반등을 예상함..."
              className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs cursor-pointer"
          >
            닫기
          </button>
          {!isLocked && (
            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-md shadow-purple-600/20 flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <CheckCircle2 size={15} />
              <span>{year}년 연초 예측 저장 및 잠금</span>
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
