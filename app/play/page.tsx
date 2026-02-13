'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import RubiksCube, { RubiksCubeHandle } from '../../components/RubiksCube';
import CyberBackground from '../../components/CyberBackground';
import UIControls from '../../components/UIControls';
import GuidePanel from '../../components/GuidePanel';
import { useCubeControls } from '../../components/useCubeControls';

export default function PlayPage() {
  const cubeRef = useRef<RubiksCubeHandle>(null);
  const [highlightMove, setHighlightMove] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const params = useSearchParams();
  const learnMode = params.get('mode') === 'learn';

  const onStateUpdate = useCallback((meta: { history: string[]; redo: string[]; isSolved: boolean }) => {
    setIsSolved(meta.isSolved);
  }, []);

  const handleMove = useCallback((notation: string) => {
    cubeRef.current?.queueMove(notation);
    setHighlightMove(null);
  }, []);

  const handleUndo = useCallback(() => {
    cubeRef.current?.undo();
    setHighlightMove(null);
  }, []);

  const handleRedo = useCallback(() => {
    cubeRef.current?.redo();
    setHighlightMove(null);
  }, []);

  const handleScramble = useCallback(() => {
    cubeRef.current?.scramble();
    setHighlightMove(null);
  }, []);

  const handleReset = useCallback(() => {
    cubeRef.current?.reset();
    setHighlightMove(null);
  }, []);

  useCubeControls({ onMove: handleMove, onUndo: handleUndo, onRedo: handleRedo });

  const hintApi = useMemo(
    () => ({
      getFacelets: () => cubeRef.current?.getFacelets() ?? '',
      applyMove: (m: string) => handleMove(m),
      highlight: (m: string | null) => setHighlightMove(m),
    }),
    [handleMove]
  );

  return (
    <main className="relative min-h-screen bg-black text-cyan-50">
      <CyberBackground />
      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-3xl">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-cyber-cyan">
              <span>CYBERCUBE X1</span>
              <button type="button" className="button-cyber text-[10px]" onClick={() => cubeRef.current?.resetView()}>
                Reset view
              </button>
            </div>
            <div className="mt-4 h-[70vh] lg:h-[80vh] w-full border border-cyber-cyan/20 neon-outline">
              <RubiksCube ref={cubeRef} mode="game" highlightMove={highlightMove} onStateUpdate={onStateUpdate} />
            </div>
            <div className="mt-6">
              <UIControls
                onMove={handleMove}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onScramble={handleScramble}
                onReset={handleReset}
              />
            </div>
          </div>
        </section>

        <aside className="p-6 flex flex-col gap-6">
          <div className="panel-cyber p-4 text-xs text-white/70 space-y-2">
            <div className="text-cyber-cyan uppercase tracking-[0.3em]">Guide</div>
            <div>{learnMode ? 'Learn mode active. Use hints to solve the cube.' : 'Practice mode. Use controls or keyboard hotkeys.'}</div>
            <div>Hotkeys: R/L/U/D/F/B. Hold Shift for prime moves.</div>
            <div>Status: {isSolved ? 'Solved' : 'Active'}</div>
          </div>

          <GuidePanel
            getFacelets={hintApi.getFacelets}
            onApplyMove={hintApi.applyMove}
            onHighlight={hintApi.highlight}
            isSolved={isSolved}
          />
        </aside>
      </div>
    </main>
  );
}
