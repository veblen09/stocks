import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Download, Upload, X, Play, Edit3, Copy } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import type { SaveSlot, SaveSlotId } from '../../types/saveSlot';

import type { StockGameState } from '../../types/stockGame';
import {
  loadAllSlots,
  saveGameToSlot,
  deleteSlot,
  cloneSlot,
  exportSlotToJson,
  importSlotFromJson,
} from './saveSlotStorage';
import { formatKRW, formatPercent, getReturnColor } from '../../utils/formatMoney';
import { audioManager } from '../../utils/audioManager';
import { useToast } from '../notifications/ToastProvider';

interface SaveSlotManagerModalProps {
  isOpen: boolean;
  currentGameState?: StockGameState;
  onLoadGame: (state: StockGameState) => void;
  onClose: () => void;
}

export const SaveSlotManagerModal: React.FC<SaveSlotManagerModalProps> = ({
  isOpen,
  currentGameState,
  onLoadGame,
  onClose,
}) => {
  const { showToast } = useToast();
  const [slots, setSlots] = useState<Record<SaveSlotId, SaveSlot>>(loadAllSlots);
  const [editingSlotId, setEditingSlotId] = useState<SaveSlotId | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSlots(loadAllSlots());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrentToSlot = (slotId: SaveSlotId) => {
    if (!currentGameState || !currentGameState.isGameStarted) {
      showToast('현재 진행 중인 게임이 없습니다.', 'warning');
      return;
    }
    const updated = saveGameToSlot(slotId, currentGameState);
    setSlots({ ...updated });
    showToast(`✓ ${slots[slotId].name}에 현재 게임을 저장했습니다.`, 'success');
  };

  const handleLoadSlot = (slotId: SaveSlotId) => {
    const slot = slots[slotId];
    if (slot.isEmpty || !slot.gameState) {
      showToast('빈 저장 슬롯입니다.', 'warning');
      return;
    }
    audioManager.playUiSound('confirm');
    onLoadGame(slot.gameState);
    showToast(`✓ ${slot.name}을 불러왔습니다.`, 'success');
    onClose();
  };

  const handleDeleteSlot = (slotId: SaveSlotId) => {
    const updated = deleteSlot(slotId);
    setSlots({ ...updated });
    showToast('✓ 슬롯이 초기화되었습니다.', 'info');
  };

  const handleCloneSlot = (fromId: SaveSlotId, toId: SaveSlotId) => {
    const updated = cloneSlot(fromId, toId);
    setSlots({ ...updated });
    showToast(`✓ ${slots[toId].name}으로 복제되었습니다.`, 'success');
  };

  const handleStartRename = (slot: SaveSlot) => {
    setEditingSlotId(slot.id);
    setEditingName(slot.name);
  };

  const handleSaveRename = (slotId: SaveSlotId) => {
    if (!editingName.trim()) return;
    const current = { ...slots };
    current[slotId].name = editingName.trim();
    setSlots(current);
    if (current[slotId].gameState) {
      saveGameToSlot(slotId, current[slotId].gameState!, editingName.trim());
    }
    setEditingSlotId(null);
    showToast('✓ 슬롯 이름이 변경되었습니다.', 'success');
  };

  const handleExportJson = (slotId: SaveSlotId) => {
    const jsonStr = exportSlotToJson(slotId);
    if (!jsonStr) {
      showToast('내보낼 게임 데이터가 없습니다.', 'warning');
      return;
    }
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money_track_${slotId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ JSON 저장 파일이 다운로드되었습니다.', 'success');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>, targetSlotId: SaveSlotId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = importSlotFromJson(content, targetSlotId);
      if (res.success) {
        setSlots(loadAllSlots());
        showToast('✓ 게임 데이터를 성공적으로 가져왔습니다.', 'success');
      } else {
        showToast(res.error || '가져오기 실패', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-slots-title"
    >
      <GlassCard
        className="w-full max-w-3xl max-h-[90vh] bg-white border-slate-200 p-6 sm:p-7 shadow-2xl flex flex-col space-y-4 text-slate-800 overflow-y-auto"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
              <FolderOpen size={24} />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                3개 독립 저장 슬롯 (Save Slots)
              </span>
              <h2 id="save-slots-title" className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                게임 저장 및 불러오기 관리자
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

        {/* 3 Slots Cards */}
        <div className="space-y-3">
          {(['slot_1', 'slot_2', 'slot_3'] as SaveSlotId[]).map((slotId, index) => {
            const slot = slots[slotId];
            const isCurrentPlaying = currentGameState?.isGameStarted;

            return (
              <div
                key={slotId}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  !slot.isEmpty
                    ? 'bg-white border-slate-300 shadow-xs ring-1 ring-slate-200'
                    : 'bg-slate-50 border-dashed border-slate-300'
                }`}
              >
                {/* Slot Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                      SLOT {index + 1}
                    </span>

                    {editingSlotId === slotId ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="px-2 py-1 bg-white border border-blue-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(slotId)}
                          className="px-2 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs"
                        >
                          저장
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 text-sm">{slot.name}</h3>
                        <button
                          type="button"
                          onClick={() => handleStartRename(slot)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="이름 변경"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    최종 수정: {new Date(slot.updatedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Slot Summary Content */}
                {!slot.isEmpty && slot.summary ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans font-bold block">진행 연도</span>
                      <span className="font-bold text-slate-800">{slot.summary.currentYear}년</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans font-bold block">포트폴리오 자산</span>
                      <span className="font-bold text-blue-700">{formatKRW(slot.summary.portfolioValueKRW)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans font-bold block">시간가중수익률(TWR)</span>
                      <span className={`font-bold ${getReturnColor(slot.summary.twrReturn)}`}>
                        {formatPercent(slot.summary.twrReturn)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans font-bold block">보유 종목수</span>
                      <span className="font-bold text-slate-700">{slot.summary.holdingsCount}개 종목</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-slate-400 font-medium">
                    저장된 게임 데이터가 없습니다. (빈 슬롯)
                  </div>
                )}

                {/* Slot Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    {isCurrentPlaying && (
                      <button
                        type="button"
                        onClick={() => handleSaveCurrentToSlot(slotId)}
                        className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition flex items-center gap-1 cursor-pointer border border-blue-200"
                      >
                        <Save size={13} />
                        <span>현재 게임 저장</span>
                      </button>
                    )}

                    {!slot.isEmpty && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleLoadSlot(slotId)}
                          className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Play size={13} className="fill-white" />
                          <span>이어하기</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportJson(slotId)}
                          className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                          title="JSON 파일로 백업"
                        >
                          <Download size={13} />
                          <span>내보내기</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const target = slotId === 'slot_1' ? 'slot_2' : slotId === 'slot_2' ? 'slot_3' : 'slot_1';
                            handleCloneSlot(slotId, target);
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                          title="다른 슬롯으로 복제"
                        >
                          <Copy size={13} />
                          <span>복제</span>
                        </button>
                      </>

                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200">
                      <Upload size={13} />
                      <span>불러오기(JSON)</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={e => handleImportJsonFile(e, slotId)}
                        className="hidden"
                      />
                    </label>

                    {!slot.isEmpty && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slotId)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="슬롯 비우기"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs cursor-pointer"
          >
            닫기
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
