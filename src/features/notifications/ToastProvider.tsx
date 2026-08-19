import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';

export type ToastType = 'success' | 'warning' | 'info' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastMessageRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const now = Date.now();
    // Debounce duplicate messages within 1.5 seconds
    if (lastMessageRef.current.text === message && now - lastMessageRef.current.time < 1500) {
      return;
    }
    lastMessageRef.current = { text: message, time: now };

    if (type === 'success') audioManager.playUiSound('success');
    else if (type === 'error' || type === 'warning') audioManager.playUiSound('error');
    else audioManager.playUiSound('notification');

    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastItem = { id, message, type, duration };

    setToasts(prev => [...prev.slice(-3), newToast]); // keep at most 4 active toasts

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />;
      default:
        return <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />;
    }
  };

  const getBgStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-emerald-600/10';
      case 'warning':
        return 'bg-amber-50 border-amber-300 text-amber-950 shadow-amber-600/10';
      case 'error':
        return 'bg-rose-50 border-rose-300 text-rose-950 shadow-rose-600/10';
      default:
        return 'bg-blue-50 border-blue-300 text-blue-950 shadow-blue-600/10';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Fixed Toast Container */}
      <div
        role="region"
        aria-label="알림 메시지"
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl flex items-start justify-between gap-3 text-xs font-bold leading-snug transition-all transform translate-y-0 animate-in fade-in slide-in-from-top-3 duration-200 ${getBgStyle(
              toast.type
            )}`}
          >
            <div className="flex items-start gap-2">
              {getIcon(toast.type)}
              <span className="break-keep">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 transition cursor-pointer"
              aria-label="알림 닫기"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
