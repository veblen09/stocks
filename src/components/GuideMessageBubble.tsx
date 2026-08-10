import React from 'react';

interface GuideMessageBubbleProps {
  message: string;
}

export const GuideMessageBubble: React.FC<GuideMessageBubbleProps> = ({ message }) => {
  return (
    <div className="relative p-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl shadow-sm text-xs font-semibold text-slate-600 leading-relaxed select-text animate-fade-in-up">
      {/* Speech Bubble Arrow pointing left/up (standard tooltip arrow) */}
      <div className="absolute -left-1.5 top-5 w-3 h-3 bg-slate-50 border-l border-b border-slate-200/50 transform rotate-45 select-none" />
      <div className="relative z-10">
        {message}
      </div>
    </div>
  );
};
