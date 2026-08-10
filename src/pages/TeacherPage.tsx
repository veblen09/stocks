import React from 'react';
import { TeacherGuide } from '../components/TeacherGuide';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface TeacherPageProps {
  onNavigate: (page: string) => void;
}

export const TeacherPage: React.FC<TeacherPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* 상단 네비 바 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition"
        >
          <ArrowLeft size={14} /> 메인으로 돌아가기
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
          <BookOpen size={14} className="text-emerald-600" /> 수업용 교사 설명서
        </div>
      </div>

      {/* 교사용 종합 가이드 */}
      <TeacherGuide />
    </div>
  );
};
