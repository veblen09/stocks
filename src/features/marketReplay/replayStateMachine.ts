import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  ReplayStatus,
  ReplaySettings,
  YearReplayData,
} from './marketReplayTypes';
import type { RiskLevel } from '../../types/stockGame';
import { audioManager } from '../../utils/audioManager';

const DEFAULT_SETTINGS: ReplaySettings = {
  speed: 'NORMAL',
  showBenchmark: true,
  autoPauseOnCrisis: true,
  autoPauseOnMajorNews: false,
  motionPreference: 'NORMAL',
  autoInvestMode: 'CRISIS_ONLY',
};

const STORAGE_KEY = 'money_track_replay_settings_v1';

export function loadSavedReplaySettings(): ReplaySettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveReplaySettings(settings: ReplaySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export interface UseMarketReplayOptions {
  yearData: YearReplayData | null;
  isCrisisActive?: boolean;
  onTriggerCrisis: (crisisId: string) => void;
  onYearComplete: () => void;
}

export function useMarketReplayState({
  yearData,
  isCrisisActive = false,
  onTriggerCrisis,
  onYearComplete,
}: UseMarketReplayOptions) {
  const [settings, setSettingsState] = useState<ReplaySettings>(() => loadSavedReplaySettings());
  const [status, setStatus] = useState<ReplayStatus>('IDLE');
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0);
  const [wasTabHidden, setWasTabHidden] = useState<boolean>(false);

  const prevRiskLevelRef = useRef<RiskLevel>('NORMAL');
  const handledCrisisEventIdsRef = useRef<Set<string>>(new Set());
  const prevCrisisActiveRef = useRef<boolean>(isCrisisActive);
  const timerRef = useRef<any>(null);

  const updateSettings = useCallback((newPartial: Partial<ReplaySettings>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...newPartial };
      saveReplaySettings(updated);
      return updated;
    });
  }, []);

  // Initialize playback when yearData is provided
  useEffect(() => {
    if (!yearData || yearData.points.length === 0) {
      setStatus('IDLE');
      setCurrentMonthIndex(0);
      handledCrisisEventIdsRef.current.clear();
      return;
    }

    handledCrisisEventIdsRef.current.clear();

    if (yearData.quality === 'ANNUAL_ONLY' || settings.speed === 'INSTANT') {
      setCurrentMonthIndex(yearData.points.length - 1);
      setStatus('YEAR_COMPLETE');
      onYearComplete();
      return;
    }

    // Start with short YEAR_INTRO
    setStatus('YEAR_INTRO');
    setCurrentMonthIndex(0);
    prevRiskLevelRef.current = yearData.points[0]?.riskLevel || 'NORMAL';
    audioManager.playUiSound('replayYearStart');

    const introTimer = setTimeout(() => {
      setStatus('PLAYING');
    }, 650);

    return () => clearTimeout(introTimer);
  }, [yearData?.year]);

  // Tab Visibility Auto-Pause
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (status === 'PLAYING') {
          setStatus('PAUSED');
          setWasTabHidden(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status]);

  // Auto-resume playback when Crisis Modal completes and closes (isCrisisActive transitions from true to false)
  useEffect(() => {
    if (prevCrisisActiveRef.current && !isCrisisActive) {
      if (status === 'CRISIS_PAUSED') {
        setStatus('PLAYING');
      }
    }
    prevCrisisActiveRef.current = isCrisisActive;
  }, [isCrisisActive, status]);

  // Main Replay Loop
  useEffect(() => {
    if (status !== 'PLAYING' || !yearData) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs =
      settings.speed === 'CINEMATIC'
        ? 1150
        : settings.speed === 'FAST'
        ? 300
        : 700;

    timerRef.current = setInterval(() => {
      setCurrentMonthIndex(prev => {
        const next = prev + 1;

        if (next >= yearData.points.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStatus('YEAR_COMPLETE');
          audioManager.playUiSound('replayYearComplete');
          onYearComplete();
          return prev;
        }

        const point = yearData.points[next];
        if (!point) return prev;

        // 1. Check for New High
        if (point.isNewHigh) {
          audioManager.playUiSound('replayNewHigh');
        }

        // 2. Check for Risk Level Change
        if (point.riskLevel !== prevRiskLevelRef.current) {
          if (point.riskLevel === 'CRISIS' || point.riskLevel === 'EXTREME' || point.riskLevel === 'WARNING') {
            audioManager.playUiSound('warningLevel');
          }
          prevRiskLevelRef.current = point.riskLevel;
        }

        // 3. Check for Crisis Event Month
        if (point.isCrisisMonth && point.crisisEventId && settings.autoPauseOnCrisis) {
          if (!handledCrisisEventIdsRef.current.has(point.crisisEventId)) {
            handledCrisisEventIdsRef.current.add(point.crisisEventId);
            if (timerRef.current) clearInterval(timerRef.current);
            setStatus('CRISIS_PAUSED');
            audioManager.playUiSound('crisisAlert');
            onTriggerCrisis(point.crisisEventId);
            return next;
          }
        }

        return next;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, yearData, settings.speed, settings.autoPauseOnCrisis, onTriggerCrisis, onYearComplete]);

  // Controls
  const togglePlay = useCallback(() => {
    if (status === 'PLAYING') {
      setStatus('PAUSED');
    } else if (status === 'PAUSED' || status === 'NEWS_PAUSED') {
      setStatus('PLAYING');
    }
  }, [status]);

  const pauseForNews = useCallback(() => {
    if (status === 'PLAYING') {
      setStatus('NEWS_PAUSED');
    }
  }, [status]);

  const resumeAfterCrisis = useCallback(() => {
    setStatus('PLAYING');
  }, []);

  const skipToEnd = useCallback(() => {
    if (!yearData) return;

    // Check if there is an unhandled crisis event in remaining months
    for (let i = currentMonthIndex + 1; i < yearData.points.length; i++) {
      const p = yearData.points[i];
      if (p.isCrisisMonth && p.crisisEventId && !handledCrisisEventIdsRef.current.has(p.crisisEventId)) {
        handledCrisisEventIdsRef.current.add(p.crisisEventId);
        setCurrentMonthIndex(i);
        setStatus('CRISIS_PAUSED');
        audioManager.playUiSound('crisisAlert');
        onTriggerCrisis(p.crisisEventId);
        return;
      }
    }

    // No crisis ahead: jump straight to month 12
    setCurrentMonthIndex(yearData.points.length - 1);
    setStatus('YEAR_COMPLETE');
    audioManager.playUiSound('replayYearComplete');
    onYearComplete();
  }, [yearData, currentMonthIndex, onTriggerCrisis, onYearComplete]);

  return {
    status,
    currentMonthIndex,
    settings,
    wasTabHidden,
    setWasTabHidden,
    updateSettings,
    togglePlay,
    pauseForNews,
    resumeAfterCrisis,
    skipToEnd,
    setCurrentMonthIndex,
  };
}
