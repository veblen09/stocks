/**
 * 3 Independent Save Slots Types
 */
import type { StockGameState } from './stockGame';

export type SaveSlotId = 'slot_1' | 'slot_2' | 'slot_3';

export interface SaveSlotSummary {
  currentYear: number;
  startYear: number;
  endYear: number;
  portfolioValueKRW: number;
  chapterTitleKo?: string;
  holdingsCount: number;
  twrReturn: number;
}

export interface SaveSlot {
  id: SaveSlotId;
  name: string;
  updatedAt: string; // ISO string
  isEmpty: boolean;
  gameState?: StockGameState;
  summary?: SaveSlotSummary;
}

export interface SoundCategorySettings {
  interfaceClicks: boolean;
  listingNotifications: boolean;
  chapterCompletion: boolean;
  warnings: boolean;
  achievements: boolean;
  bgm: boolean;
  haptics: boolean;
}
