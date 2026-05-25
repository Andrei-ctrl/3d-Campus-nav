// PER21 classroom row + side-entrance vertical cores (local x, metres).

const CUBIC_140_EXCEPTION_X = { A: 124.5, B: 103.5, F: 43.5, H: 7.5 };

const CLASSROOM_130_SEED_X = { B: 90, C: 69, D: 54, E: 45, F: 37.5 };

const CLASSROOM_130_LETTERS = ['B', 'C', 'D', 'E', 'F'];
const CUBIC_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function midpoint(a, b) {
  return (a + b) / 2;
}

function buildLayout() {
  const cubicXSeed = {
    A: CUBIC_140_EXCEPTION_X.A,
    B: CUBIC_140_EXCEPTION_X.B,
    C: midpoint(CLASSROOM_130_SEED_X.C, CLASSROOM_130_SEED_X.D),
    D: midpoint(CLASSROOM_130_SEED_X.D, CLASSROOM_130_SEED_X.E),
    E: midpoint(CLASSROOM_130_SEED_X.E, CLASSROOM_130_SEED_X.F),
    F: CUBIC_140_EXCEPTION_X.F,
    G: midpoint(CLASSROOM_130_SEED_X.F, CUBIC_140_EXCEPTION_X.H),
    H: CUBIC_140_EXCEPTION_X.H
  };

  const upper230 = buildUpper230(cubicXSeed);
  const classroom130X = Object.fromEntries(
    CLASSROOM_130_LETTERS.map((letter) => [
      letter,
      upper230.find((room) => room.letter === letter).x
    ])
  );
  const g230CorridorX = upper230.find((room) => room.roomId === 'G230').x;

  const cubicX = {
    ...CUBIC_140_EXCEPTION_X,
    C: midpoint(classroom130X.C, classroom130X.D),
    D: midpoint(classroom130X.D, classroom130X.E),
    E: midpoint(classroom130X.E, classroom130X.F),
    G: midpoint(classroom130X.F, g230CorridorX)
  };

  return {
    cubicX,
    upper230: buildUpper230(cubicX),
    classroom130X,
    g230CorridorX
  };
}

function cubicLettersByX(cubicX) {
  return [...CUBIC_LETTERS].sort((a, b) => cubicX[a] - cubicX[b]);
}

function buildUpper230(cubicX) {
  const lettersByX = cubicLettersByX(cubicX);

  return lettersByX.slice(0, -1).map((hSideLetter, index) => {
    const aSideLetter = lettersByX[index + 1];

    return {
      roomId: `${aSideLetter}230`,
      letter: aSideLetter,
      x: midpoint(cubicX[hSideLetter], cubicX[aSideLetter])
    };
  });
}

const layout = buildLayout();

/** Front side entrances only (no main / back) — each gets lift + stairs inside the building. */
export const PER21_SIDE_ENTRANCE_CORES = [
  { entranceId: 'PER21_PER22_CONNECTION_ENTRANCE', localX: 3, label: 'PER22 connection' },
  { entranceId: 'PER21_END_SIDE_ENTRANCE', localX: 21, label: 'End side' },
  { entranceId: 'PER21_SIDE_ENTRANCE_3', localX: 61, label: 'Side entrance 3' },
  { entranceId: 'PER21_SIDE_ENTRANCE_2', localX: 97, label: 'Side entrance 2' },
  { entranceId: 'PER21_SIDE_ENTRANCE_1', localX: 123, label: 'Side entrance 1' }
];

export const per21ClassroomNodes = [
  ...CUBIC_LETTERS.map((letter) => ({
    roomId: letter === 'H' ? 'H130' : `${letter}140`,
    x: layout.cubicX[letter],
    floor: 1,
    kind: 'cube'
  })),
  ...CLASSROOM_130_LETTERS.map((letter) => ({
    roomId: `${letter}130`,
    x: layout.classroom130X[letter],
    floor: 1,
    kind: 'classroom'
  })),
  {
    roomId: 'G230_CORRIDOR',
    x: layout.g230CorridorX,
    floor: 1,
    kind: 'corridor-gap'
  },
  ...layout.upper230.map(({ roomId, x }) => ({
    roomId,
    x,
    floor: 2,
    kind: 'normal'
  })),
  { roomId: 'F205', x: layout.cubicX.F, floor: 2, kind: 'normal' }
];

export const per21CubicFirstFloorRooms = per21ClassroomNodes.filter((r) => r.floor === 1 && r.kind === 'cube');
export const per21ClassroomFirstFloorRooms = per21ClassroomNodes.filter((r) => r.floor === 1 && r.kind === 'classroom');
export const per21FirstFloorCorridorGaps = per21ClassroomNodes.filter((r) => r.floor === 1 && r.kind === 'corridor-gap');
export const per21UpperFloorRooms = per21ClassroomNodes.filter((r) => r.floor === 2);

export const per21CorridorGapX = {
  A_B: midpoint(layout.cubicX.A, layout.cubicX.B),
  G_H: layout.g230CorridorX
};
