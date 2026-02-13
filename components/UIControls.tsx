'use client';

import { useState } from 'react';

type UIControlsProps = {
  onMove: (notation: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onScramble: () => void;
  onReset: () => void;
  disabled?: boolean;
};

const moves = ['R', 'L', 'U', 'D', 'F', 'B'] as const;

export default function UIControls({ onMove, onUndo, onRedo, onScramble, onReset, disabled }: UIControlsProps) {
  const [prime, setPrime] = useState(false);

  const handleMove = (move: string) => {
    const notation = prime ? `${move}'` : move;
    onMove(notation);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {moves.map((m) => (
          <button
            key={m}
            type="button"
            className="button-cyber text-xs text-cyber-cyan hover:text-white"
            onClick={() => handleMove(m)}
            disabled={disabled}
          >
            {m}
          </button>
        ))}
        <button
          type="button"
          className={`button-cyber text-xs ${prime ? 'text-white bg-cyber-cyan/20' : 'text-cyber-cyan'}`}
          onClick={() => setPrime((p) => !p)}
          disabled={disabled}
        >
          Prime
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="button-cyber text-xs" onClick={onUndo} disabled={disabled}>Undo</button>
        <button type="button" className="button-cyber text-xs" onClick={onRedo} disabled={disabled}>Redo</button>
        <button type="button" className="button-cyber text-xs" onClick={onScramble} disabled={disabled}>Scramble</button>
        <button type="button" className="button-cyber text-xs" onClick={onReset} disabled={disabled}>Reset</button>
      </div>
    </div>
  );
}
