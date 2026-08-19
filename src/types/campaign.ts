/**
 * Historical Campaigns Types (Section 11)
 */

export type CampaignMode = 'FULL_45' | 'HISTORICAL_CAMPAIGN' | 'FREE_PLAY';

export interface HistoricalCampaignPreset {
  id: string;
  titleKo: string;
  subtitleKo: string;
  periodKo: string;
  startYear: number;
  endYear: number;
  initialCashKRW: number;
  annualContributionKRW: number;
  learningGoalKo: string;
  recommendedPlayMinutes: number;
  keyObservationVariablesKo: string[];
  historicalDescriptionKo: string;
  badgeKo: string;
}
