import React, { useEffect, useRef } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { audioManager } from '../../utils/audioManager';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      audioManager.playUiSound('modalOpen');
      // For destructive actions, default focus to Cancel button for accessibility safety
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isDestructive]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        audioManager.playUiSound('modalClose');
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    audioManager.playUiSound(isDestructive ? 'confirm' : 'success');
    onConfirm();
  };

  const handleCancel = () => {
    audioManager.playUiSound('modalClose');
    onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <GlassCard
        className="w-full max-w-md bg-white border-slate-200 p-6 shadow-2xl space-y-4 text-slate-800"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isDestructive
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
            >
              {isDestructive ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Message */}
        <div id="confirm-dialog-desc" className="text-xs text-slate-600 leading-relaxed font-medium">
          {message}
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 text-xs">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={handleCancel}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer border border-slate-300 shadow-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`py-2.5 px-5 rounded-xl font-bold transition cursor-pointer shadow-md ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
