import React, { useEffect, useRef, useState } from 'react';
import { formatKRW, formatPercent } from '../../utils/formatMoney';
import type { MotionPreference } from './marketReplayTypes';

interface AnimatedPortfolioValueProps {
  value: number;
  formatType?: 'KRW' | 'PERCENT' | 'RAW';
  showSign?: boolean;
  durationMs?: number;
  motionPreference?: MotionPreference;
  className?: string;
}

export const AnimatedPortfolioValue: React.FC<AnimatedPortfolioValueProps> = ({
  value,
  formatType = 'KRW',
  showSign = false,
  durationMs = 450,
  motionPreference = 'NORMAL',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const startValRef = useRef<number>(value);
  const targetValRef = useRef<number>(value);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (motionPreference === 'OFF' || durationMs <= 0) {
      setDisplayValue(value);
      targetValRef.current = value;
      startValRef.current = value;
      return;
    }

    startValRef.current = displayValue;
    targetValRef.current = value;
    const startVal = startValRef.current;
    const targetVal = targetValRef.current;
    const startTime = performance.now();

    if (startVal === targetVal) {
      setDisplayValue(targetVal);
      return;
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * easeOut;

      setDisplayValue(current);

      if (progress < 1.0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetVal); // Guarantee exact final calculated value
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, durationMs, motionPreference]);

  const formatted = () => {
    if (formatType === 'KRW') {
      const rounded = Math.round(displayValue);
      const prefix = showSign && rounded > 0 ? '+' : '';
      return `${prefix}${formatKRW(rounded)}`;
    } else if (formatType === 'PERCENT') {
      return formatPercent(displayValue);
    }
    return Math.round(displayValue).toLocaleString();
  };

  return <span className={className}>{formatted()}</span>;
};
