import { faceOrder, Face, Axis, parseMove, invertMove } from './moves';

export type Vec3 = [number, number, number];

export type Cubie = {
  id: string;
  position: Vec3;
  faces: Partial<Record<Face, string>>; // color codes like W/Y...
};

const faceNormals: Record<Face, Vec3> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

const normalToFace = (v: Vec3): Face => {
  const key = v.join(',');
  switch (key) {
    case '0,1,0':
      return 'U';
    case '0,-1,0':
      return 'D';
    case '-1,0,0':
      return 'L';
    case '1,0,0':
      return 'R';
    case '0,0,1':
      return 'F';
    case '0,0,-1':
      return 'B';
    default:
      return 'U';
  }
};

const rotateVec = (v: Vec3, axis: Axis, dir: 1 | -1): Vec3 => {
  const [x, y, z] = v;
  if (axis === 'x') {
    return dir === 1 ? [x, -z, y] : [x, z, -y];
  }
  if (axis === 'y') {
    return dir === 1 ? [z, y, -x] : [-z, y, x];
  }
  return dir === 1 ? [-y, x, z] : [y, -x, z];
};

const roundVec = (v: Vec3): Vec3 => [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])];

export class CubeState {
  cubies: Cubie[];
  history: string[] = [];
  redoStack: string[] = [];

  constructor() {
    this.cubies = CubeState.createSolvedCubies();
  }

  static createSolvedCubies(): Cubie[] {
    const cubies: Cubie[] = [];
    let id = 0;
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const faces: Partial<Record<Face, string>> = {};
          if (y === 1) faces.U = 'W';
          if (y === -1) faces.D = 'Y';
          if (x === -1) faces.L = 'O';
          if (x === 1) faces.R = 'R';
          if (z === 1) faces.F = 'G';
          if (z === -1) faces.B = 'B';

          cubies.push({
            id: `cubie-${id++}`,
            position: [x, y, z],
            faces,
          });
        }
      }
    }
    return cubies;
  }

  reset() {
    this.cubies = CubeState.createSolvedCubies();
    this.history = [];
    this.redoStack = [];
  }

  isSolved(): boolean {
    for (const cubie of this.cubies) {
      const [x, y, z] = cubie.position;
      for (const face of Object.keys(cubie.faces) as Face[]) {
        if (face === 'U' && y !== 1) return false;
        if (face === 'D' && y !== -1) return false;
        if (face === 'L' && x !== -1) return false;
        if (face === 'R' && x !== 1) return false;
        if (face === 'F' && z !== 1) return false;
        if (face === 'B' && z !== -1) return false;
      }
    }
    return true;
  }

  getFacelets(): string {
    const facelets: string[] = [];
    const getCubieAt = (pos: Vec3): Cubie | undefined =>
      this.cubies.find((c) => c.position[0] === pos[0] && c.position[1] === pos[1] && c.position[2] === pos[2]);

    const toFaceLetter = (color: string): Face => {
      switch (color) {
        case 'W':
          return 'U';
        case 'Y':
          return 'D';
        case 'G':
          return 'F';
        case 'B':
          return 'B';
        case 'O':
          return 'L';
        case 'R':
          return 'R';
        default:
          return 'U';
      }
    };

    const faceCoords: Record<Face, Vec3[]> = {
      U: [
        [-1, 1, -1], [0, 1, -1], [1, 1, -1],
        [-1, 1, 0], [0, 1, 0], [1, 1, 0],
        [-1, 1, 1], [0, 1, 1], [1, 1, 1],
      ],
      R: [
        [1, 1, -1], [1, 1, 0], [1, 1, 1],
        [1, 0, -1], [1, 0, 0], [1, 0, 1],
        [1, -1, -1], [1, -1, 0], [1, -1, 1],
      ],
      F: [
        [-1, 1, 1], [0, 1, 1], [1, 1, 1],
        [-1, 0, 1], [0, 0, 1], [1, 0, 1],
        [-1, -1, 1], [0, -1, 1], [1, -1, 1],
      ],
      D: [
        [-1, -1, 1], [0, -1, 1], [1, -1, 1],
        [-1, -1, 0], [0, -1, 0], [1, -1, 0],
        [-1, -1, -1], [0, -1, -1], [1, -1, -1],
      ],
      L: [
        [-1, 1, 1], [-1, 1, 0], [-1, 1, -1],
        [-1, 0, 1], [-1, 0, 0], [-1, 0, -1],
        [-1, -1, 1], [-1, -1, 0], [-1, -1, -1],
      ],
      B: [
        [-1, 1, -1], [0, 1, -1], [1, 1, -1],
        [-1, 0, -1], [0, 0, -1], [1, 0, -1],
        [-1, -1, -1], [0, -1, -1], [1, -1, -1],
      ],
    };

    for (const face of faceOrder) {
      for (const pos of faceCoords[face]) {
        const cubie = getCubieAt(pos);
        const color = cubie?.faces[face] ?? 'W';
        facelets.push(toFaceLetter(color));
      }
    }

    return facelets.join('');
  }

  applyMove(notation: string, recordHistory = true, clearRedo = true) {
    const move = parseMove(notation);
    if (!move) return;

    const turns = move.turns;
    for (let i = 0; i < turns; i += 1) {
      this.cubies = this.cubies.map((cubie) => {
        if (cubie.position[move.axis === 'x' ? 0 : move.axis === 'y' ? 1 : 2] !== move.layer) {
          return cubie;
        }

        const newPosition = roundVec(rotateVec(cubie.position, move.axis, move.dir));
        const newFaces: Partial<Record<Face, string>> = {};
        for (const face of Object.keys(cubie.faces) as Face[]) {
          const normal = faceNormals[face];
          const rotated = rotateVec(normal, move.axis, move.dir);
          const newFace = normalToFace(rotated);
          newFaces[newFace] = cubie.faces[face];
        }

        return {
          ...cubie,
          position: newPosition,
          faces: newFaces,
        };
      });
    }

    if (recordHistory) {
      this.history.push(move.notation);
      if (clearRedo) this.redoStack = [];
    }
  }

  peekLastMove(): string | null {
    return this.history.length ? this.history[this.history.length - 1] : null;
  }

  peekRedoMove(): string | null {
    return this.redoStack.length ? this.redoStack[this.redoStack.length - 1] : null;
  }

  commitUndo() {
    const last = this.history.pop();
    if (!last) return;
    const inverse = invertMove(last);
    this.applyMove(inverse, false, false);
    this.redoStack.push(last);
  }

  commitRedo() {
    const move = this.redoStack.pop();
    if (!move) return;
    this.applyMove(move, false, false);
    this.history.push(move);
  }

  scramble(length = 20): string[] {
    const moves = ['R', 'L', 'U', 'D', 'F', 'B'];
    const suffixes = ['', "'", '2'];
    const seq: string[] = [];
    let lastFace = '';
    for (let i = 0; i < length; i += 1) {
      let face = moves[Math.floor(Math.random() * moves.length)];
      while (face === lastFace) {
        face = moves[Math.floor(Math.random() * moves.length)];
      }
      lastFace = face;
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      seq.push(`${face}${suffix}`);
    }
    return seq;
  }

  getHistory() {
    return [...this.history];
  }

  getRedoStack() {
    return [...this.redoStack];
  }
}
