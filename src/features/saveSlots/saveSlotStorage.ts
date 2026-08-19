import type { SaveSlot, SaveSlotId, SaveSlotSummary } from '../../types/saveSlot';
import type { StockGameState } from '../../types/stockGame';
import { getChapterByYear } from '../chapters/chapterDefinitions';

const SLOTS_KEY = 'money_track_save_slots_v3';
const LEGACY_KEY_V2 = 'money_track_stock_game_state_v2';

export function getEmptySlot(id: SaveSlotId, name?: string): SaveSlot {
  return {
    id,
    name: name || `저장 슬롯 ${id.replace('slot_', '')}`,
    updatedAt: new Date().toISOString(),
    isEmpty: true,
  };
}

export function buildSlotSummary(state: StockGameState): SaveSlotSummary {
  const chapter = getChapterByYear(state.currentYear);
  const holdingStockValues = Object.values(state.holdings || {}).reduce(
    (sum, h) => sum + (h.currentValueKRW || 0),
    0
  );
  const totalVal = state.cashKRW + holdingStockValues;

  const twr = state.history.length > 0
    ? (state.history[state.history.length - 1].twrIndexLevel - 100) / 100
    : 0;

  return {
    currentYear: state.currentYear,
    startYear: state.settings.startYear,
    endYear: state.settings.endYear,
    portfolioValueKRW: totalVal,
    chapterTitleKo: chapter?.titleKo,
    holdingsCount: Object.keys(state.holdings || {}).length,
    twrReturn: twr,
  };
}

export function loadAllSlots(): Record<SaveSlotId, SaveSlot> {
  const initialSlots: Record<SaveSlotId, SaveSlot> = {
    slot_1: getEmptySlot('slot_1', '저장 슬롯 1'),
    slot_2: getEmptySlot('slot_2', '저장 슬롯 2'),
    slot_3: getEmptySlot('slot_3', '저장 슬롯 3'),
  };

  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<SaveSlotId, SaveSlot>;
      return {
        slot_1: parsed.slot_1 || initialSlots.slot_1,
        slot_2: parsed.slot_2 || initialSlots.slot_2,
        slot_3: parsed.slot_3 || initialSlots.slot_3,
      };
    }

    // Auto-migrate legacy V2 state to slot_1 if present
    const legacyV2Raw = localStorage.getItem(LEGACY_KEY_V2);
    if (legacyV2Raw) {
      const parsedV2 = JSON.parse(legacyV2Raw) as StockGameState;
      if (parsedV2.isGameStarted) {
        initialSlots.slot_1 = {
          id: 'slot_1',
          name: `${parsedV2.settings.nickname || '나의 투자'} (${parsedV2.currentYear}년)`,
          updatedAt: new Date().toISOString(),
          isEmpty: false,
          gameState: parsedV2,
          summary: buildSlotSummary(parsedV2),
        };
        saveAllSlots(initialSlots);
      }
    }
  } catch (err) {
    console.error('Error loading save slots:', err);
  }

  return initialSlots;
}

export function saveAllSlots(slots: Record<SaveSlotId, SaveSlot>): void {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
  } catch (err) {
    console.error('Error saving slots:', err);
  }
}

export function saveGameToSlot(
  slotId: SaveSlotId,
  state: StockGameState,
  name?: string
): Record<SaveSlotId, SaveSlot> {
  const slots = loadAllSlots();
  const slotName = name || slots[slotId].name || `저장 슬롯 ${slotId.replace('slot_', '')}`;

  slots[slotId] = {
    id: slotId,
    name: slotName,
    updatedAt: new Date().toISOString(),
    isEmpty: false,
    gameState: state,
    summary: buildSlotSummary(state),
  };

  saveAllSlots(slots);
  return slots;
}

export function deleteSlot(slotId: SaveSlotId): Record<SaveSlotId, SaveSlot> {
  const slots = loadAllSlots();
  slots[slotId] = getEmptySlot(slotId);
  saveAllSlots(slots);
  return slots;
}

export function cloneSlot(fromId: SaveSlotId, toId: SaveSlotId): Record<SaveSlotId, SaveSlot> {
  const slots = loadAllSlots();
  const source = slots[fromId];
  if (!source.isEmpty && source.gameState) {
    slots[toId] = {
      ...source,
      id: toId,
      name: `${source.name} (복제본)`,
      updatedAt: new Date().toISOString(),
    };
    saveAllSlots(slots);
  }
  return slots;
}

export function exportSlotToJson(slotId: SaveSlotId): string | null {
  const slots = loadAllSlots();
  const slot = slots[slotId];
  if (slot.isEmpty || !slot.gameState) return null;
  return JSON.stringify(slot, null, 2);
}

export function importSlotFromJson(jsonString: string, targetSlotId: SaveSlotId): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString) as SaveSlot;
    if (!parsed.gameState || !parsed.gameState.settings) {
      return { success: false, error: '올바른 머니트랙 게임 저장 데이터 형식이 아닙니다.' };
    }

    const slots = loadAllSlots();
    slots[targetSlotId] = {
      id: targetSlotId,
      name: parsed.name || `가져온 게임 (${parsed.gameState.currentYear}년)`,
      updatedAt: new Date().toISOString(),
      isEmpty: false,
      gameState: parsed.gameState,
      summary: buildSlotSummary(parsed.gameState),
    };
    saveAllSlots(slots);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'JSON 파싱 오류: 파일이 손상되었습니다.' };
  }
}
