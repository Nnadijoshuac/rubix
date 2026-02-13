'use client';

import { useMemo } from 'react';
import { MeshStandardMaterial, FrontSide } from 'three';
import { RoundedBox } from '@react-three/drei';
import { Face } from './moves';

export type CubieProps = {
  position: [number, number, number];
  faces: Partial<Record<Face, string>>;
  rotation?: [number, number, number];
  highlight?: boolean;
};

const colorByCode: Record<string, string> = {
  W: '#f7f7f7',
  Y: '#f2d648',
  G: '#2ecc71',
  B: '#2e7bff',
  O: '#ff8a2a',
  R: '#e74c3c',
};

const faceColor = (faces: Partial<Record<Face, string>>, face: Face, fallback: string) => {
  const code = faces[face];
  if (!code) return fallback;
  return colorByCode[code] ?? fallback;
};

export default function Cubie({ position, faces, rotation = [0, 0, 0], highlight = false }: CubieProps) {
  const dark = '#101010';

  const bodyMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: dark,
        roughness: 0.7,
        metalness: 0.05,
      }),
    []
  );

  const stickers = [
    { face: 'R' as Face, pos: [0.515, 0, 0] as const, rot: [0, Math.PI / 2, 0] as const },
    { face: 'L' as Face, pos: [-0.515, 0, 0] as const, rot: [0, -Math.PI / 2, 0] as const },
    { face: 'U' as Face, pos: [0, 0.515, 0] as const, rot: [-Math.PI / 2, 0, 0] as const },
    { face: 'D' as Face, pos: [0, -0.515, 0] as const, rot: [Math.PI / 2, 0, 0] as const },
    { face: 'F' as Face, pos: [0, 0, 0.515] as const, rot: [0, 0, 0] as const },
    { face: 'B' as Face, pos: [0, 0, -0.515] as const, rot: [0, Math.PI, 0] as const },
  ];

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.98, 0.98, 0.98]} radius={0.12} smoothness={8} material={bodyMat} />
      {stickers.map(({ face, pos, rot }) => {
        const color = faceColor(faces, face, dark);
        if (color === dark) return null;
        return (
          <mesh key={face} position={pos} rotation={rot}>
            <RoundedBox args={[0.78, 0.78, 0.06]} radius={0.18} smoothness={6}>
              <meshStandardMaterial
                attach="material"
                color={color}
                roughness={0.35}
                metalness={0.05}
                side={FrontSide}
              />
            </RoundedBox>
          </mesh>
        );
      })}
      {highlight && (
        <mesh>
          <boxGeometry args={[1.04, 1.04, 1.04]} />
          <meshBasicMaterial color="#42f5ff" wireframe transparent opacity={0.45} />
        </mesh>
      )}
    </group>
  );
}
