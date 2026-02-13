'use client';

import { useCallback, useEffect, useState } from 'react';
import Cube from 'cubejs';

Cube.initSolver();

type GuidePanelProps = {
  getFacelets: () => string;
  onApplyMove: (notation: string) => void;
  onHighlight: (notation: string | null) => void;
  isSolved: boolean;
  disabled?: boolean;
};

export default function GuidePanel({ getFacelets, onApplyMove, onHighlight, isSolved, disabled }: GuidePanelProps) {
  const [hint, setHint] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const computeHint = useCallback(() => {
    if (disabled) return;
    if (isSolved) {
      setHint(null);
      setStatus('Already solved.');
      onHighlight(null);
      return;
    }

    try {
      const facelets = getFacelets();
      const cube = Cube.fromString(facelets);
      const solution = cube.solve();
      const next = solution.split(' ').filter(Boolean)[0] ?? null;
      setHint(next);
      setStatus(next ? 'Next recommended move:' : 'No hint available');
      onHighlight(next);
    } catch (error) {
      setHint(null);
      setStatus('Solver error');
      onHighlight(null);
    }
  }, [disabled, getFacelets, isSolved, onHighlight]);

  useEffect(() => {
    if (isSolved) {
      setHint(null);
      setStatus('Solved');
      onHighlight(null);
    }
  }, [isSolved, onHighlight]);

  return (
    <div className="panel-cyber p-4 space-y-4">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-cyber-cyan">Guide</div>
        <div className="text-[11px] text-white/70">{status || 'Tap hint for guidance'}</div>
      </div>
      <div className="space-y-2">
        <button
          type="button"
          className="button-cyber w-full text-xs"
          onClick={computeHint}
          disabled={disabled}
        >
          Hint
        </button>
        <div className="text-sm text-cyber-cyan min-h-[20px]">
          {hint ? hint : '--'}
        </div>
        <button
          type="button"
          className="button-cyber w-full text-xs"
          onClick={() => hint && onApplyMove(hint)}
          disabled={!hint || disabled}
        >
          Apply move
        </button>
      </div>
      <div className="text-[11px] text-white/50">
        Hint shows the next recommended move, not a full solution.
      </div>
    </div>
  );
}
