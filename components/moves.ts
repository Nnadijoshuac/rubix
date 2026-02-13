export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
export type Axis = 'x' | 'y' | 'z';

export type Move = {
  face: Face;
  axis: Axis;
  layer: number; // -1, 0, 1
  dir: 1 | -1; // right-hand +90 or -90
  turns: 1 | 2; // quarter or half
  notation: string;
};

const baseMoves: Record<Face, { axis: Axis; layer: number; dir: 1 | -1 }> = {
  R: { axis: 'x', layer: 1, dir: -1 },
  L: { axis: 'x', layer: -1, dir: 1 },
  U: { axis: 'y', layer: 1, dir: -1 },
  D: { axis: 'y', layer: -1, dir: 1 },
  F: { axis: 'z', layer: 1, dir: -1 },
  B: { axis: 'z', layer: -1, dir: 1 },
};

export function parseMove(input: string): Move | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const face = trimmed[0] as Face;
  if (!baseMoves[face]) return null;

  const suffix = trimmed.slice(1);
  const isPrime = suffix.includes("'");
  const isDouble = suffix.includes('2');
  const turns: 1 | 2 = isDouble ? 2 : 1;

  const base = baseMoves[face];
  const dir: 1 | -1 = isPrime ? (base.dir === 1 ? -1 : 1) : base.dir;

  return {
    face,
    axis: base.axis,
    layer: base.layer,
    dir,
    turns,
    notation: `${face}${isPrime ? "'" : ''}${isDouble ? '2' : ''}`,
  };
}

export function invertMove(notation: string): string {
  const move = parseMove(notation);
  if (!move) return notation;
  if (move.turns === 2) return move.face + '2';
  return move.notation.includes("'") ? move.face : move.face + "'";
}

export function normalizeMoveNotation(notation: string): string | null {
  const move = parseMove(notation);
  return move ? move.notation : null;
}

export const faceOrder: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

export const faceColorMap: Record<Face, string> = {
  U: '#f8f9fa',
  D: '#ffd500',
  F: '#00c853',
  B: '#2962ff',
  L: '#ff6d00',
  R: '#d50000',
};

export const faceLetterMap: Record<string, Face> = {
  W: 'U',
  Y: 'D',
  G: 'F',
  B: 'B',
  O: 'L',
  R: 'R',
};
