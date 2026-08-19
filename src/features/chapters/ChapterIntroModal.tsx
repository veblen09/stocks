import React, { useState } from 'react';
import { Compass, BookOpen, Target, ArrowRight, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import type { HistoricalChapter } from '../../types/chapter';
import { audioManager } from '../../utils/audioManager';
import { useStockGame } from '../../store/stockGameStore';

interface ChapterIntroModalProps {
  isOpen: boolean;
  chapter: HistoricalChapter;
  onClose: () => void;
}

export const ChapterIntroModal: React.FC<ChapterIntroModalProps> = ({
  isOpen,
  chapter,
  onClose,
}) => {
  const { state, setChapterGoal, selectRiskMissions } = useStockGame();
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    state.selectedChapterGoals?.[chapter.id] || chapter.suggestedGoals[0]?.id || ''
  );

  const initialSelectedMissions = state.selectedRiskMissions?.[chapter.id] ||
    chapter.suggestedRiskMissions.map(m => m.id).slice(0, 3);
  const [selectedMissionIds, setSelectedMissionIds] = useState<string[]>(initialSelectedMissions);

  if (!isOpen) return null;

  const toggleMission = (mId: string) => {
    audioManager.playUiSound('keyTap');
    if (selectedMissionIds.includes(mId)) {
      if (selectedMissionIds.length > 2) {
        setSelectedMissionIds(selectedMissionIds.filter(id => id !== mId));
      }
    } else {
      setSelectedMissionIds([...selectedMissionIds, mId]);
    }
  };

  const handleStartChapter = () => {
    audioManager.playUiSound('confirm');
    setChapterGoal(chapter.id, selectedGoalId);
    selectRiskMissions(chapter.id, selectedMissionIds);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-intro-title"
    >
      <GlassCard
        className="w-full max-w-2xl max-h-[90vh] bg-white border-slate-200 p-6 sm:p-7 shadow-2xl flex flex-col space-y-4 text-slate-800 overflow-y-auto"
        variant="default"
      >
        {/* Top Era Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
              <Compass size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                  CHAPTER {chapter.chapterNumber} · {chapter.startYear} ~ {chapter.endYear}년
                </span>
              </div>
              <h2 id="chapter-intro-title" className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                {chapter.titleKo}
              </h2>
            </div>
          </div>
        </div>

        {/* Historical Context (Strictly known as of startYear, zero spoilers) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <BookOpen size={14} className="text-blue-600" />
            <span>시대적 진입 배경 ({chapter.eraNameKo})</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {chapter.startContext.descriptionKo}
          </p>
        </div>

        {/* 5-Year Risk & Survival Missions Selection */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-blue-600" />
              <span>이번 시대 생존 & 리스크 관리 미션 (2~4개 선택)</span>
            </span>
            <span className="text-[11px] text-blue-600 font-bold font-mono">
              선택: {selectedMissionIds.length}개
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {chapter.suggestedRiskMissions.map(m => {
              const isChecked = selectedMissionIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMission(m.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition text-xs flex items-start gap-2.5 ${
                    isChecked
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 text-blue-600">
                    {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-400" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{m.titleKo}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                      {m.descriptionKo}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Chapter Goal Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Target size={14} className="text-emerald-600" />
            <span>나만의 5년 챕터 행동 원칙 목표</span>
          </span>
          <div className="space-y-2">
            {chapter.suggestedGoals.map(goal => (
              <label
                key={goal.id}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition text-xs ${
                  selectedGoalId === goal.id
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="chapter_goal"
                  value={goal.id}
                  checked={selectedGoalId === goal.id}
                  onChange={() => {
                    audioManager.playUiSound('keyTap');
                    setSelectedGoalId(goal.id);
                  }}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <span className="font-bold text-slate-900 block">{goal.titleKo}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{goal.descriptionKo}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 flex justify-end border-t border-slate-200">
          <button
            type="button"
            onClick={handleStartChapter}
            className="w-full sm:w-auto py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <span>{chapter.startYear}년 챕터 {chapter.chapterNumber} 시작하기</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
