/**
 * Process-Oriented Achievement Types
 */

export interface AchievementDefinition {
  id: string;
  nameKo: string;
  category: 'EVIDENCE' | 'DISCIPLINE' | 'DIVERSIFICATION' | 'RISK_MGMT' | 'COST_SAVING' | 'RESEARCH';
  descriptionKo: string;
  requirementKo: string;
  iconName: string;
  maxProgress?: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAtYear: number;
  unlockedAtTimestamp: string;
}

export interface AchievementProgress {
  id: string;
  currentValue: number;
  targetValue: number;
  isUnlocked: boolean;
}
