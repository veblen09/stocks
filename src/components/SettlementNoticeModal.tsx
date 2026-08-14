import React, { useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { GlassCard } from './GlassCard';
import { Receipt, CheckCircle, AlertTriangle } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

export const SettlementNoticeModal: React.FC = () => {
  const { state, clearLastEventResult } = useGame();
  const { lastEventResult, currentEvent } = state;

  // 정산 알림 등장 시 효과음 재생
  useEffect(() => {
    if (lastEventResult && !currentEvent) {
      const isAlert = lastEventResult.resultText.includes('🚨') || lastEventResult.resultText.includes('부족분');
      if (isAlert) {
        audioManager.playSound('error');
      } else {
        audioManager.playSound('notification');
      }
    }
  }, [lastEventResult, currentEvent]);

  if (!lastEventResult || currentEvent) return null;

  const handleClose = () => {
    audioManager.playSound('click');
    clearLastEventResult();
  };

  const isAlert = lastEventResult.resultText.includes('🚨') || lastEventResult.resultText.includes('부족분');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-print select-none">
      <GlassCard className="p-6 max-w-lg w-full border-white/80 animate-zoom-in" variant="strong">
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-2xl ${isAlert ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'}`}>
                {isAlert ? <AlertTriangle size={22} className="animate-pulse" /> : <Receipt size={22} />}
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
                  {lastEventResult.choiceText || '반기 정산 통지서'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-800">{lastEventResult.title}</h3>
              </div>
            </div>
          </div>

          <div className={`${isAlert ? 'bg-rose-50/80 border-rose-200/80' : 'bg-slate-50/80 border-slate-200/60'} p-4.5 rounded-2xl border space-y-2`}>
            <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <span>📋 턴 진행 및 정산 상세 내역</span>
            </div>
            <div className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed space-y-2 whitespace-pre-line select-text">
              {lastEventResult.resultText}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`w-full py-3.5 ${isAlert ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-extrabold rounded-2xl shadow-md transition cursor-pointer text-xs sm:text-sm select-none flex items-center justify-center gap-1.5`}
          >
            <CheckCircle size={16} /> 내용을 확인했습니다
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
