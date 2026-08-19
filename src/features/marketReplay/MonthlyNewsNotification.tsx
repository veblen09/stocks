import React from 'react';
import { Newspaper, ChevronRight } from 'lucide-react';
import type { HistoricalNewsItem } from '../../types/stockNews';

interface MonthlyNewsNotificationProps {
  newsItems: HistoricalNewsItem[];
  onOpenNews: (news: HistoricalNewsItem) => void;
  onOpenAllNews: () => void;
  className?: string;
}

export const MonthlyNewsNotification: React.FC<MonthlyNewsNotificationProps> = ({
  newsItems,
  onOpenNews,
  onOpenAllNews,
  className = '',
}) => {
  if (!newsItems || newsItems.length === 0) return null;

  const topNews = newsItems[0];

  return (
    <div className={`p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-slide-down ${className}`}>
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
          <Newspaper size={16} />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
            <span>당시 역사 뉴스 공개 ({newsItems.length}건)</span>
            <span className="font-mono text-blue-600">[{topNews.sourceName || '공식 보도'}]</span>
          </div>
          <p className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1">
            {topNews.titleKo}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={onOpenAllNews}
          className="px-2.5 py-1.5 bg-white hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs border border-blue-200 transition cursor-pointer"
        >
          전체보기
        </button>
        <button
          type="button"
          onClick={() => onOpenNews(topNews)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
        >
          <span>뉴스 확인</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
