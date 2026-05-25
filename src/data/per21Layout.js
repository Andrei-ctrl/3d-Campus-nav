// PER21 classroom row + side-entrance vertical cores (local x, metres).
// Uniform cube / classroom / corridor sizes packed A-side (x=132) → G-side (left).

const BUILDING_A_EDGE = 132;
const H_SIDE_OVERFLOW = 10;
const BUILDING_H_EDGE = -H_SIDE_OVERFLOW;
const TOTAL_ROW_SPAN = BUILDING_A_EDGE - BUILDING_H_EDGE;

const ORIGINAL_CUBE_LENGTH = 15;
const ORIGINAL_CLASS_LENGTH = 10;
const CUBE_CLASS_RATIO = ORIGINAL_CUBE_LENGTH / ORIGINAL_CLASS_LENGTH;

const WING_LETTERS = ['B', 'C', 'D', 'E', 'F'];

export const PER21_BACK_CLASSROOM_Z = 71;
export const PER21_FRONT_UPPER_Z = 41;

/** Main hall routing from PER21 main entrance (local metres). */
export const PER21_MAIN_HALL_X = 110;
export const PER21_MAIN_HALL_SPINE_LENGTH = 20;
export const PER21_MAIN_HALL_TURN_OFFSET = 12;

function round1(value) {
  return Math.round(value * 10) / 10;
}

function solveUniformSizes() {
  const cubeCount = 8;
  const classCount = 5;
  const corridorCount = 2;
  const classLength = TOTAL_ROW_SPAN / (
    cubeCount * CUBE_CLASS_RATIO + classCount + corridorCount
  );
  const cubeLength = classLength * CUBE_CLASS_RATIO;

  return {
    cubeLength: round1(cubeLength),
    classLength: round1(classLength),
    corridorLength: round1(classLength),
    cubeWidth: round1(cubeLength),
    classWidth: round1(classLength)
  };
}

function placeRowSegments(sizes) {
  const { cubeLength, classLength, corridorLength } = sizes;
  const lengthByKey = {
    cube: cubeLength,
    class: classLength,
    corridor: corridorLength
  };

  // A-side → G-side (right to left on map). Ground = floor 0, this row = floor 1.
  const segments = [
    {
      roomId: 'A120',
      letter: 'A',
      kind: 'cube',
      lengthKey: 'cube',
      notes: 'Stairs leading to 2nd floor'
    },
    {
      roomId: 'A_ENTRANCE_CORRIDOR',
      kind: 'corridor-gap',
      lengthKey: 'corridor',
      notes: 'Square space — stairs leading to ground floor'
    },
    {
      roomId: 'A140',
      letter: 'A',
      kind: 'cube',
      lengthKey: 'cube'
    },
    { roomId: 'B130', letter: 'B', kind: 'classroom', lengthKey: 'class' },
    {
      roomId: 'C120',
      letter: 'C',
      kind: 'cube',
      lengthKey: 'cube'
    },
    { roomId: 'C130', letter: 'C', kind: 'classroom', lengthKey: 'class' },
    {
      roomId: 'C140',
      letter: 'C',
      kind: 'cube',
      lengthKey: 'cube',
      notes: 'Statue — stairs leading to ground floor (right from ground entrance)'
    },
    { roomId: 'D130', letter: 'D', kind: 'classroom', lengthKey: 'class' },
    {
      roomId: 'E120',
      letter: 'E',
      kind: 'cube',
      lengthKey: 'cube',
      notes: 'Stairs leading to 2nd floor'
    },
    { roomId: 'E130', letter: 'E', kind: 'classroom', lengthKey: 'class' },
    {
      roomId: 'E140',
      letter: 'E',
      kind: 'cube',
      lengthKey: 'cube',
      notes: 'Stairs leading to ground floor'
    },
    { roomId: 'F130', letter: 'F', kind: 'classroom', lengthKey: 'class' },
    {
      roomId: 'G120',
      letter: 'G',
      kind: 'cube',
      lengthKey: 'cube',
      notes: 'Stairs leading to ground floor'
    },
    {
      roomId: 'G_END_CORRIDOR',
      kind: 'corridor-gap',
      lengthKey: 'corridor',
      notes: 'Square space'
    },
    {
      roomId: 'G140',
      letter: 'G',
      kind: 'cube',
      lengthKey: 'cube',
      notes: 'Stairs leading to 2nd floor'
    }
  ];

  let edge = BUILDING_A_EDGE;
  const placed = segments.map((segment) => {
    const length = lengthByKey[segment.lengthKey];
    const x = round1(edge - length / 2);

    edge = round1(edge - length);

    return {
      ...segment,
      x,
      floor: 1,
      z: PER21_BACK_CLASSROOM_Z,
      size: {
        length,
        width: segment.lengthKey === 'cube' ? sizes.cubeWidth : sizes.classWidth,
        height: segment.lengthKey === 'cube' ? 6 : 2.4
      }
    };
  });

  return { placed, leftEdge: edge };
}

function roomSizeForKind(kind, sizes, overrides = {}) {
  if (overrides.length != null) {
    return {
      length: overrides.length,
      width: overrides.width ?? sizes.classWidth,
      height: overrides.height ?? 2.4
    };
  }

  if (kind === 'cube') {
    return { length: sizes.cubeLength, width: sizes.cubeWidth, height: 6 };
  }

  return { length: sizes.classLength, width: sizes.classWidth, height: 2.4 };
}

function wingCorridorX(letter, firstFloor) {
  const rooms = firstFloor.filter((room) => room.letter === letter);

  if (!rooms.length) {
    return null;
  }

  const average = rooms.reduce((sum, room) => sum + room.x, 0) / rooms.length;
  return round1(average);
}

function buildLayout() {
  const sizes = solveUniformSizes();
  const { placed: firstFloor, leftEdge } = placeRowSegments(sizes);

  const byId = Object.fromEntries(firstFloor.map((room) => [room.roomId, room]));

  const classroom130X = Object.fromEntries(
    firstFloor
      .filter((room) => room.kind === 'classroom')
      .map((room) => [room.letter, room.x])
  );

  const corridorGaps = firstFloor.filter((room) => room.kind === 'corridor-gap');

  const upper230 = [
    {
      roomId: 'A230',
      letter: 'A',
      x: byId.A_ENTRANCE_CORRIDOR.x,
      floor: 2,
      kind: 'normal',
      z: PER21_BACK_CLASSROOM_Z,
      size: roomSizeForKind('corridor-gap', sizes, {
        length: sizes.corridorLength,
        width: sizes.classWidth
      })
    },
    ...WING_LETTERS.map((letter) => ({
      roomId: `${letter}230`,
      letter,
      x: classroom130X[letter],
      floor: 2,
      kind: 'normal',
      z: PER21_BACK_CLASSROOM_Z,
      size: roomSizeForKind('classroom', sizes)
    })),
    {
      roomId: 'G230',
      letter: 'G',
      x: byId.G_END_CORRIDOR.x,
      floor: 2,
      kind: 'normal',
      z: PER21_BACK_CLASSROOM_Z,
      size: roomSizeForKind('corridor-gap', sizes, {
        length: sizes.corridorLength,
        width: sizes.classWidth
      })
    }
  ];

  const frontUpperHalf = round1(sizes.cubeLength / 2);
  const frontUpperQuarter = round1(sizes.cubeLength / 4);
  const frontUpper = ['B', 'F'].flatMap((letter) => {
    const bayX = classroom130X[letter];

    return [
      {
        roomId: `${letter}205`,
        letter,
        x: round1(bayX + frontUpperQuarter),
        floor: 2,
        kind: 'front-upper',
        z: PER21_FRONT_UPPER_Z,
        size: {
          length: frontUpperHalf,
          width: sizes.classWidth,
          height: 2.4
        }
      },
      {
        roomId: `${letter}207`,
        letter,
        x: round1(bayX - frontUpperQuarter),
        floor: 2,
        kind: 'front-upper',
        z: PER21_FRONT_UPPER_Z,
        size: {
          length: frontUpperHalf,
          width: sizes.classWidth,
          height: 2.4
        }
      }
    ];
  });

  const corridorStopLetters = ['G', 'F', 'E', 'D', 'C', 'B', 'A'];
  const corridorStops = [
    { key: 'H_END', x: round1(leftEdge + sizes.cubeLength / 2) },
    ...corridorStopLetters.map((letter) => ({
      key: `${letter}_ROOMS`,
      x: wingCorridorX(letter, firstFloor)
    }))
  ];

  return {
    sizes,
    firstFloor,
    upper230,
    frontUpper,
    classroom130X,
    corridorGaps,
    corridorStops,
    leftEdge: round1(leftEdge)
  };
}

const layout = buildLayout();

/** Stairs from floor-1 cubes / gaps to ground (0) or 2nd classroom floor (2). */
export const PER21_STAIR_CUBE_LINKS = [
  { roomId: 'A120', targetFloor: 2 },
  { roomId: 'A_ENTRANCE_CORRIDOR', targetFloor: 0 },
  { roomId: 'C140', targetFloor: 0 },
  { roomId: 'E120', targetFloor: 2 },
  { roomId: 'E140', targetFloor: 0 },
  { roomId: 'G120', targetFloor: 0 },
  { roomId: 'G140', targetFloor: 2 }
];

export const per21RoomNotes = Object.fromEntries(
  layout.firstFloor
    .filter((room) => room.notes)
    .map((room) => [room.roomId, room.notes])
);

/** Front entrances with lift + stairs; includes main entrance. */
export const PER21_SIDE_ENTRANCE_CORES = [
  { entranceId: 'PER21_PER22_CONNECTION_ENTRANCE', localX: 3, label: 'PER22 connection' },
  { entranceId: 'PER21_END_SIDE_ENTRANCE', localX: 21, label: 'End side' },
  { entranceId: 'PER21_SIDE_ENTRANCE_3', localX: 61, label: 'Side entrance 3' },
  { entranceId: 'PER21_SIDE_ENTRANCE_2', localX: 97, label: 'Side entrance 2' },
  { entranceId: 'PER21_MAIN_ENTRANCE', localX: 110, label: 'Main entrance' },
  { entranceId: 'PER21_SIDE_ENTRANCE_1', localX: 123, label: 'Side entrance 1' }
];

export const PER21_LAYOUT_SIZES = layout.sizes;
export const per21CorridorStops = layout.corridorStops;

export const per21ClassroomNodes = [
  ...layout.firstFloor,
  ...layout.upper230,
  ...layout.frontUpper
];

export const per21CubicFirstFloorRooms = per21ClassroomNodes.filter((r) => r.floor === 1 && r.kind === 'cube');
export const per21ClassroomFirstFloorRooms = per21ClassroomNodes.filter((r) => r.floor === 1 && r.kind === 'classroom');
export const per21FirstFloorCorridorGaps = per21ClassroomNodes.filter((r) => r.floor === 1 && r.kind === 'corridor-gap');
export const per21UpperFloorRooms = per21ClassroomNodes.filter((r) => r.floor === 2);

export const per21CorridorGapX = {
  A_ENTRANCE: layout.corridorGaps.find((gap) => gap.roomId === 'A_ENTRANCE_CORRIDOR').x,
  G_END: layout.corridorGaps.find((gap) => gap.roomId === 'G_END_CORRIDOR').x
};
