import { useCallback } from 'react';
import { audioManager, type UiSoundType } from '../utils/audioManager';

/**
 * Custom React Hook for UI Sound integration with event propagation control
 */
export function useUiSound() {
  const playSound = useCallback((type: UiSoundType, options?: { pitchVariation?: number; intensity?: number }) => {
    audioManager.playUiSound(type, options);
  }, []);

  const wrapHandler = useCallback(
    <E extends React.SyntheticEvent>(
      type: UiSoundType,
      handler?: (e: E) => void,
      stopPropagation = false
    ) => {
      return (e: E) => {
        if (stopPropagation) {
          e.stopPropagation();
        }
        audioManager.playUiSound(type);
        if (handler) {
          handler(e);
        }
      };
    },
    []
  );

  return {
    playSound,
    wrapHandler,
    audioManager,
  };
}
