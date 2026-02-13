'use client';

import { useEffect } from 'react';

const moveKeys = ['R', 'L', 'U', 'D', 'F', 'B'] as const;

export type CubeControlHandlers = {
  onMove: (notation: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  disabled?: boolean;
};

export const useCubeControls = ({ onMove, onUndo, onRedo, disabled }: CubeControlHandlers) => {
  useEffect(() => {
    if (disabled) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = event.key.toUpperCase();
      if (moveKeys.includes(key as typeof moveKeys[number])) {
        event.preventDefault();
        const move = event.shiftKey ? `${key}'` : key;
        onMove(move);
      }
      if (key === 'Z' && event.ctrlKey) {
        event.preventDefault();
        onUndo();
      }
      if (key === 'Y' && event.ctrlKey) {
        event.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onMove, onRedo, onUndo, disabled]);
};
