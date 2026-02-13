'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Group } from 'three';
import { CubeState, Cubie } from './CubeState';
import { parseMove, Move, Axis } from './moves';
import CubieMesh from './Cubie';

export type RubiksCubeHandle = {
  queueMove: (notation: string) => void;
  undo: () => void;
  redo: () => void;
  scramble: () => void;
  reset: () => void;
  resetView: () => void;
  getFacelets: () => string;
  isSolved: () => boolean;
  getHistory: () => string[];
  getRedo: () => string[];
  getIsAnimating: () => boolean;
};

type RubiksCubeProps = {
  mode?: 'landing' | 'game';
  highlightMove?: string | null;
  onStateUpdate?: (meta: {
    history: string[];
    redo: string[];
    isSolved: boolean;
  }) => void;
};

type MoveRequest = {
  notation: string;
  commit: 'apply' | 'undo' | 'redo';
};

type ActiveMove = {
  move: Move;
  progress: number;
  duration: number;
  commit: 'apply' | 'undo' | 'redo';
};

const rotateVecContinuous = (pos: [number, number, number], axis: Axis, angle: number): [number, number, number] => {
  const [x, y, z] = pos;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  if (axis === 'x') {
    return [x, y * cos - z * sin, y * sin + z * cos];
  }
  if (axis === 'y') {
    return [x * cos + z * sin, y, -x * sin + z * cos];
  }
  return [x * cos - y * sin, x * sin + y * cos, z];
};

type SceneProps = {
  mode: 'landing' | 'game';
  highlightMove?: string | null;
  onStateUpdate?: RubiksCubeProps['onStateUpdate'];
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  cubeState: React.MutableRefObject<CubeState>;
};

const Scene = forwardRef<RubiksCubeHandle, SceneProps>(function Scene(
  { mode, highlightMove, onStateUpdate, controlsRef, cubeState },
  ref
) {
  const [cubies, setCubies] = useState<Cubie[]>(() => cubeState.current.cubies);
  const queueRef = useRef<MoveRequest[]>([]);
  const [activeMove, setActiveMove] = useState<ActiveMove | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const highlight = useMemo(() => {
    if (!highlightMove) return null;
    const parsed = parseMove(highlightMove);
    return parsed ? parsed : null;
  }, [highlightMove]);

  const commitStateUpdate = useCallback(() => {
    onStateUpdate?.({
      history: cubeState.current.getHistory(),
      redo: cubeState.current.getRedoStack(),
      isSolved: cubeState.current.isSolved(),
    });
  }, [onStateUpdate, cubeState]);

  const enqueueMove = useCallback((notation: string, commit: MoveRequest['commit'] = 'apply') => {
    const normalized = parseMove(notation)?.notation;
    if (!normalized) return;
    queueRef.current.push({ notation: normalized, commit });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      queueMove: (notation: string) => {
        if (mode === 'landing') return;
        enqueueMove(notation, 'apply');
      },
      undo: () => {
        if (mode === 'landing') return;
        const last = cubeState.current.peekLastMove();
        if (!last || isAnimating) return;
        enqueueMove(last, 'undo');
      },
      redo: () => {
        if (mode === 'landing') return;
        const next = cubeState.current.peekRedoMove();
        if (!next || isAnimating) return;
        enqueueMove(next, 'redo');
      },
      scramble: () => {
        if (mode === 'landing') return;
        if (isAnimating) return;
        const seq = cubeState.current.scramble(20);
        seq.forEach((m) => enqueueMove(m, 'apply'));
      },
      reset: () => {
        if (mode === 'landing') return;
        if (isAnimating) return;
        queueRef.current = [];
        setActiveMove(null);
        setIsAnimating(false);
        cubeState.current.reset();
        setCubies([...cubeState.current.cubies]);
        commitStateUpdate();
      },
      resetView: () => {
        controlsRef.current?.reset();
      },
      getFacelets: () => cubeState.current.getFacelets(),
      isSolved: () => cubeState.current.isSolved(),
      getHistory: () => cubeState.current.getHistory(),
      getRedo: () => cubeState.current.getRedoStack(),
      getIsAnimating: () => isAnimating,
    }),
    [commitStateUpdate, controlsRef, enqueueMove, isAnimating, mode, cubeState]
  );

  useFrame((_, delta) => {
    if (mode === 'landing') return;
    if (!activeMove && queueRef.current.length) {
      const next = queueRef.current.shift();
      if (!next) return;
      const parsed = parseMove(next.notation);
      if (!parsed) return;
      setActiveMove({
        move: parsed,
        progress: 0,
        duration: parsed.turns === 2 ? 0.45 : 0.35,
        commit: next.commit,
      });
      setIsAnimating(true);
      return;
    }

    if (!activeMove) return;

    const nextProgress = activeMove.progress + delta / activeMove.duration;
    if (nextProgress >= 1) {
      const completedMove = activeMove.move;
      const commitType = activeMove.commit;
      setActiveMove(null);
      setIsAnimating(false);

      if (commitType === 'undo') {
        cubeState.current.commitUndo();
      } else if (commitType === 'redo') {
        cubeState.current.commitRedo();
      } else {
        cubeState.current.applyMove(completedMove.notation, true, true);
      }

      setCubies([...cubeState.current.cubies]);
      commitStateUpdate();
      return;
    }

    setActiveMove({
      ...activeMove,
      progress: nextProgress,
    });
  });

  const activeMoveRotation = activeMove
    ? ((Math.PI / 2) * activeMove.move.turns * activeMove.move.dir) * (activeMove.commit === 'undo' ? -1 : 1) * activeMove.progress
    : 0;

  const highlightMoveData = highlight ?? null;

  return (
    <group>
      {cubies.map((cubie) => {
        const isActive = activeMove && cubie.position[activeMove.move.axis === 'x' ? 0 : activeMove.move.axis === 'y' ? 1 : 2] === activeMove.move.layer;
        const isHighlighted = highlightMoveData && cubie.position[highlightMoveData.axis === 'x' ? 0 : highlightMoveData.axis === 'y' ? 1 : 2] === highlightMoveData.layer;
        const position = isActive
          ? rotateVecContinuous(cubie.position, activeMove!.move.axis, activeMoveRotation)
          : cubie.position;
        const rotation: [number, number, number] = isActive
          ? activeMove!.move.axis === 'x'
            ? [activeMoveRotation, 0, 0]
            : activeMove!.move.axis === 'y'
            ? [0, activeMoveRotation, 0]
            : [0, 0, activeMoveRotation]
          : [0, 0, 0];

        return (
          <CubieMesh
            key={cubie.id}
            position={position}
            faces={cubie.faces}
            rotation={rotation}
            highlight={Boolean(isHighlighted)}
          />
        );
      })}
    </group>
  );
});

const LandingFloat = ({ children }: { children: React.ReactNode }) => {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.2;
    groupRef.current.rotation.x = -0.35;
    groupRef.current.rotation.z = 0.2;
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.15;
  });

  return <group ref={groupRef}>{children}</group>;
};

const RubiksCube = forwardRef<RubiksCubeHandle, RubiksCubeProps>(function RubiksCube(
  { mode = 'game', highlightMove, onStateUpdate }: RubiksCubeProps,
  ref
) {
  const cubeStateRef = useRef(new CubeState());
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const sceneRef = useRef<RubiksCubeHandle>(null);

  useEffect(() => {
    onStateUpdate?.({
      history: cubeStateRef.current.getHistory(),
      redo: cubeStateRef.current.getRedoStack(),
      isSolved: cubeStateRef.current.isSolved(),
    });
  }, [onStateUpdate]);

  useImperativeHandle(ref, () => ({
    queueMove: (notation: string) => sceneRef.current?.queueMove(notation),
    undo: () => sceneRef.current?.undo(),
    redo: () => sceneRef.current?.redo(),
    scramble: () => sceneRef.current?.scramble(),
    reset: () => sceneRef.current?.reset(),
    resetView: () => sceneRef.current?.resetView(),
    getFacelets: () => sceneRef.current?.getFacelets() ?? cubeStateRef.current.getFacelets(),
    isSolved: () => sceneRef.current?.isSolved() ?? cubeStateRef.current.isSolved(),
    getHistory: () => sceneRef.current?.getHistory() ?? cubeStateRef.current.getHistory(),
    getRedo: () => sceneRef.current?.getRedo() ?? cubeStateRef.current.getRedoStack(),
    getIsAnimating: () => sceneRef.current?.getIsAnimating() ?? false,
  }));

  return (
    <Canvas camera={{ position: [4.2, 3.4, 4.8], fov: 45 }}>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 4]} intensity={1.1} />
      <Environment preset="city" />

      {mode === 'game' ? (
        <Scene
          ref={sceneRef}
          mode={mode}
          highlightMove={highlightMove}
          onStateUpdate={onStateUpdate}
          controlsRef={controlsRef}
          cubeState={cubeStateRef}
        />
      ) : (
        <LandingFloat>
          <Scene
            ref={sceneRef}
            mode={mode}
            highlightMove={null}
            onStateUpdate={undefined}
            controlsRef={controlsRef}
            cubeState={cubeStateRef}
          />
        </LandingFloat>
      )}

      {mode === 'game' && (
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
        />
      )}
      {mode === 'landing' && (
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
        />
      )}
    </Canvas>
  );
});

export default RubiksCube;
