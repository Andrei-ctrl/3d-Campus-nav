import {
  per21ClassroomNodes,
  PER21_STAIR_CUBE_LINKS,
  PER21_SIDE_ENTRANCE_CORES,
  PER21_BACK_CLASSROOM_Z,
  per21CorridorStops
} from './per21Layout.js';

const PER21_CENTER_X = 10;
const PER21_MEASURED_LENGTH = 132;
const PER21_CENTER_Z = 56;
const PER21_HALF_WIDTH = 19;

const FRONT_Z = PER21_CENTER_Z - PER21_HALF_WIDTH;
const BACK_Z = PER21_CENTER_Z + PER21_HALF_WIDTH;
const CORE_Z = FRONT_Z + 10;
const CLASSROOM_Z = PER21_BACK_CLASSROOM_Z;
const INSIDE_Z = CORE_Z - 2;
const MAX_FLOOR = 4;

const corridorStops = per21CorridorStops;

const publicNodes = [
  { id: 'PER21_CAFETERIA', x: 87, z: CORE_Z, floor: 0 },
  { id: 'PER21_RESTAURANT', x: 80, z: BACK_Z - 5, floor: 0 },
  { id: 'PER21_DECANAT', x: 72, z: BACK_Z - 5, floor: 0 },
  { id: 'PER21_COMMUNICATIONS', x: 50, z: CORE_Z, floor: 0 },
  { id: 'PER21_RECEPTION', x: 94, z: CORE_Z, floor: 0 },
  { id: 'PER21_ASEA', x: 12, z: CORE_Z, floor: 0 }
];

function toWorldX(localX) {
  return PER21_CENTER_X - PER21_MEASURED_LENGTH / 2 + localX;
}

function node(id, x, z, floor, label, type = 'indoor') {
  return {
    id,
    value: {
      x: toWorldX(x),
      z,
      floor,
      label,
      type
    }
  };
}

function corridorNodeId(floor, key) {
  return `PER21_CORRIDOR_F${floor}_${key}`;
}

function nearestCorridorKey(x) {
  return corridorStops.reduce((nearest, stop) => (
    Math.abs(x - stop.x) < Math.abs(x - nearest.x) ? stop : nearest
  )).key;
}

function createCorridorNodes(floor) {
  return corridorStops.map((stop) => (
    node(
      corridorNodeId(floor, stop.key),
      stop.x,
      PER21_CENTER_Z,
      floor,
      `PER21 corridor floor ${floor + 1}`,
      'corridor'
    )
  ));
}

function createCorridorEdges(floor) {
  return corridorStops.slice(0, -1).map((stop, index) => [
    corridorNodeId(floor, stop.key),
    corridorNodeId(floor, corridorStops[index + 1].key)
  ]);
}

function createRoomNodes() {
  return per21ClassroomNodes.map((room) => {
    const isCorridorGap = room.kind === 'corridor-gap';
    const isStairCube = PER21_STAIR_CUBE_LINKS.some((link) => link.roomId === room.roomId);
    const label = isCorridorGap
      ? (room.notes || 'Corridor space')
      : room.notes
        ? `Room ${room.roomId} — ${room.notes}`
        : `Room ${room.roomId}`;
    const type = isStairCube || (isCorridorGap && room.notes?.toLowerCase().includes('stairs'))
      ? 'stairs'
      : isCorridorGap
        ? 'corridor'
        : 'room';

    return node(
      `PER21_${room.roomId}`,
      room.x,
      room.z ?? CLASSROOM_Z,
      room.floor,
      label,
      type
    );
  });
}

function createRoomEdges() {
  return per21ClassroomNodes
    .filter((room) => room.kind !== 'corridor-gap')
    .map((room) => [
      corridorNodeId(room.floor, nearestCorridorKey(room.x)),
      `PER21_${room.roomId}`
    ]);
}

function createCorridorGapEdges() {
  return per21ClassroomNodes
    .filter((room) => room.kind === 'corridor-gap')
    .map((room) => [
      corridorNodeId(room.floor, nearestCorridorKey(room.x)),
      `PER21_${room.roomId}`
    ]);
}

function createStairCubeEdges() {
  return PER21_STAIR_CUBE_LINKS.flatMap(({ roomId, targetFloor }) => {
    const room = per21ClassroomNodes.find((entry) => entry.roomId === roomId);

    if (!room) {
      return [];
    }

    const nodeId = `PER21_${roomId}`;

    if (targetFloor === 0) {
      return [[nodeId, 'PER21_MAIN_CORRIDOR_F0']];
    }

    return [[nodeId, corridorNodeId(targetFloor, nearestCorridorKey(room.x))]];
  });
}

function createVerticalNodes() {
  const floors = Array.from({ length: MAX_FLOOR + 1 }, (_, floor) => floor);

  return PER21_SIDE_ENTRANCE_CORES.flatMap((core) => (
    floors.flatMap((floor) => [
      node(
        `PER21_ELEVATOR_${core.entranceId}_F${floor}`,
        core.localX,
        INSIDE_Z,
        floor,
        `Elevator (${core.label}) floor ${floor + 1} — vertical circulation`,
        'elevator'
      ),
      node(
        `PER21_STAIRS_${core.entranceId}_F${floor}`,
        core.localX + 2.5,
        INSIDE_Z,
        floor,
        `Stairs (${core.label}) floor ${floor + 1} — vertical circulation`,
        'stairs'
      )
    ])
  ));
}

function createVerticalEdges() {
  const floors = Array.from({ length: MAX_FLOOR + 1 }, (_, floor) => floor);

  return PER21_SIDE_ENTRANCE_CORES.flatMap((core) => {
    const elevator = `PER21_ELEVATOR_${core.entranceId}`;
    const stairs = `PER21_STAIRS_${core.entranceId}`;
    const corridorKey = nearestCorridorKey(core.localX);

    const floorLinks = floors.flatMap((floor) => ([
      [corridorNodeId(floor, corridorKey), `${elevator}_F${floor}`],
      [corridorNodeId(floor, corridorKey), `${stairs}_F${floor}`],
      [`${elevator}_F${floor}`, `${stairs}_F${floor}`]
    ]));

    const verticalLinks = floors.slice(0, -1).flatMap((floor) => ([
      [`${elevator}_F${floor}`, `${elevator}_F${floor + 1}`],
      [`${stairs}_F${floor}`, `${stairs}_F${floor + 1}`]
    ]));

    const entranceLink = [
      [core.entranceId, `${stairs}_F0`],
      [core.entranceId, `${elevator}_F0`]
    ];

    return [...floorLinks, ...verticalLinks, ...entranceLink];
  });
}

const corridorFloors = [0, 1, 2, 3, 4];

const entranceNodes = PER21_SIDE_ENTRANCE_CORES.map((core) => (
  node(core.entranceId, core.localX, FRONT_Z, 0, `PER21 ${core.label}`, 'entrance')
));

const nodes = [
  ...entranceNodes,
  node('PER21_PER22_CONNECTION_ENTRANCE', 3, FRONT_Z, 0, 'PER21 PER22 connection (indoor)', 'entrance'),
  node('PER21_MAIN_ENTRANCE', 110, FRONT_Z, 0, 'PER21 Main Entrance', 'entrance'),
  node('PER21_BACK_ENTRANCE', 61, BACK_Z, 0, 'PER21 Back Entrance', 'entrance'),
  node('PER21_BACK_ENTRANCE_1', 97, BACK_Z, 0, 'PER21 Back Entrance 1', 'entrance'),
  node('PER21_BACK_ENTRANCE_2', 123, BACK_Z, 0, 'PER21 Back Entrance 2', 'entrance'),
  ...publicNodes.map((place) => node(
    place.id,
    place.x,
    place.z,
    place.floor,
    place.id.replace('PER21_', '').replaceAll('_', ' '),
    'corridor'
  )),
  node('PER21_MAIN_CORRIDOR_F0', 66, PER21_CENTER_Z, 0, 'PER21 ground corridor', 'corridor'),
  ...corridorFloors.flatMap(createCorridorNodes),
  ...createVerticalNodes(),
  ...createRoomNodes()
];

export const per21IndoorGraph = {
  nodes: Object.fromEntries(nodes.map((entry) => [entry.id, entry.value])),

  edges: [
    ...corridorFloors.flatMap(createCorridorEdges),
    ['PER21_MAIN_CORRIDOR_F0', corridorNodeId(0, 'H_END')],
    ...publicNodes.map((place) => [
      corridorNodeId(0, nearestCorridorKey(place.x)),
      place.id
    ]),
    ['PER21_PER22_CONNECTION_ENTRANCE', corridorNodeId(0, 'H_END')],
    ['PER21_MAIN_ENTRANCE', corridorNodeId(0, 'F_ROOMS')],
    ['PER21_BACK_ENTRANCE', corridorNodeId(0, 'C_ROOMS')],
    ['PER21_BACK_ENTRANCE_1', corridorNodeId(0, 'B_ROOMS')],
    ['PER21_BACK_ENTRANCE_2', corridorNodeId(0, 'A_ROOMS')],
    ...createVerticalEdges(),
    ...createRoomEdges(),
    ...createCorridorGapEdges(),
    ...createStairCubeEdges()
  ]
};
