import {
  per21ClassroomNodes,
  PER21_STAIR_CUBE_LINKS,
  PER21_SIDE_ENTRANCE_CORES,
  PER21_BACK_CLASSROOM_Z,
  PER21_MAIN_HALL_X,
  PER21_MAIN_HALL_SPINE_LENGTH,
  PER21_MAIN_HALL_TURN_OFFSET,
  PER21_MAIN_STAIRS_Z,
  per21CorridorStops
} from './per21Layout.js';
import {
  PER21_CLASSROOM_ROW_FLOORS,
  PER21_SPINE_FLOORS,
  PER21_SPINE_Z,
  buildCenterSpineAnchors,
  buildCenterSpineSegments,
  buildClassroomRowAnchors,
  buildClassroomRowSegments,
  chainEdges,
  nearestAnchor,
  roomApproachId,
  spineNodeId
} from './per21SpineLayout.js';

const PER21_CENTER_X = 10;
const PER21_MEASURED_LENGTH = 132;
const PER21_CENTER_Z = PER21_SPINE_Z.center;
const PER21_HALF_WIDTH = 19;

const FRONT_Z = PER21_CENTER_Z - PER21_HALF_WIDTH;
const BACK_Z = PER21_CENTER_Z + PER21_HALF_WIDTH;
const CORE_Z = FRONT_Z + 10;
const CLASSROOM_Z = PER21_BACK_CLASSROOM_Z;
const INSIDE_Z = CORE_Z - 2;
const MAX_FLOOR = 4;

const MAIN_HALL_CENTER_Z = FRONT_Z + PER21_MAIN_HALL_SPINE_LENGTH;
const MAIN_HALL_APPROACH_Z = FRONT_Z + PER21_MAIN_HALL_SPINE_LENGTH / 2;
const MAIN_HALL_LEFT_X = PER21_MAIN_HALL_X - PER21_MAIN_HALL_TURN_OFFSET;
const MAIN_HALL_RIGHT_X = PER21_MAIN_HALL_X + PER21_MAIN_HALL_TURN_OFFSET;

const centerSpineAnchors = buildCenterSpineAnchors();
const centerSpineSegments = buildCenterSpineSegments();

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

function mainHallCenterId(floor) {
  return `PER21_MAIN_HALL_CENTER_F${floor}`;
}

function mainHallLeftTurnId(floor) {
  return `PER21_MAIN_HALL_LEFT_F${floor}`;
}

function mainHallRightTurnId(floor) {
  return `PER21_MAIN_HALL_RIGHT_F${floor}`;
}

function mainHallStairsLandId(floor) {
  return `PER21_MAIN_HALL_STAIRS_LAND_F${floor}`;
}

function centerSpineId(floor, x) {
  return spineNodeId('C', floor, x);
}

function rowSpineId(floor, x) {
  return spineNodeId('R', floor, x);
}

function corridorStopX(key) {
  return per21CorridorStops.find((stop) => stop.key === key)?.x ?? PER21_MAIN_HALL_X;
}

function getRoomWingLetter(roomId) {
  return roomId?.match(/^([A-G])/)?.[1] ?? null;
}

function approachZForRoom(room) {
  if (room.z === PER21_SPINE_Z.frontUpper) {
    return PER21_SPINE_Z.frontUpper;
  }

  return PER21_SPINE_Z.classroomRow;
}

function createCenterSpineNodes(floor) {
  return centerSpineAnchors.map((x) => node(
    centerSpineId(floor, x),
    x,
    PER21_CENTER_Z,
    floor,
    `Corridor spine floor ${floor + 1}`,
    'corridor'
  ));
}

function createClassroomRowSpineNodes(floor) {
  return buildClassroomRowAnchors(floor).map((x) => node(
    rowSpineId(floor, x),
    x,
    PER21_SPINE_Z.classroomRow,
    floor,
    `Classroom row spine floor ${floor + 1}`,
    'corridor'
  ));
}

function createCenterSpineEdges(floor) {
  return [
    ...chainEdges(centerSpineSegments.cWing.map((x) => centerSpineId(floor, x))),
    ...chainEdges(centerSpineSegments.abWing.map((x) => centerSpineId(floor, x)))
  ];
}

function createClassroomRowSpineEdges(floor) {
  const segments = buildClassroomRowSegments(floor);

  return [
    ...chainEdges(segments.cWing.map((x) => rowSpineId(floor, x))),
    ...chainEdges(segments.abWing.map((x) => rowSpineId(floor, x)))
  ];
}

function createWingVerticalSpineEdges() {
  const wingLinks = [
    { key: 'C_ROOMS', anchors: centerSpineSegments.cWing },
    { key: 'B_ROOMS', anchors: centerSpineSegments.abWing }
  ];
  const edges = [];

  for (let floor = 0; floor < MAX_FLOOR; floor += 1) {
    wingLinks.forEach(({ key, anchors }) => {
      const x = corridorStopX(key);
      const anchor = nearestAnchor(anchors, x);

      edges.push([
        centerSpineId(floor, anchor),
        centerSpineId(floor + 1, anchor)
      ]);
    });
  }

  return edges;
}

function createCenterToRowLinks(floor) {
  const rowAnchors = buildClassroomRowAnchors(floor);

  return rowAnchors.map((x) => [
    centerSpineId(floor, nearestAnchor(centerSpineAnchors, x)),
    rowSpineId(floor, x)
  ]);
}

function createMainHallNodes() {
  const floors = Array.from({ length: MAX_FLOOR + 1 }, (_, floor) => floor);

  return [
    node(
      'PER21_MAIN_HALL_APPROACH',
      PER21_MAIN_HALL_X,
      MAIN_HALL_APPROACH_Z,
      0,
      'Main hall — walk straight from entrance',
      'corridor'
    ),
    ...floors.flatMap((floor) => ([
      node(
        mainHallCenterId(floor),
        PER21_MAIN_HALL_X,
        MAIN_HALL_CENTER_Z,
        floor,
        `Main hall center floor ${floor + 1}`,
        'corridor'
      ),
      node(
        mainHallStairsLandId(floor),
        PER21_MAIN_HALL_X,
        PER21_MAIN_STAIRS_Z,
        floor,
        `Main hall stairs landing floor ${floor + 1}`,
        'corridor'
      ),
      node(
        mainHallLeftTurnId(floor),
        MAIN_HALL_LEFT_X,
        MAIN_HALL_CENTER_Z,
        floor,
        `Main hall left turn floor ${floor + 1} (C wing)`,
        'corridor'
      ),
      node(
        mainHallRightTurnId(floor),
        MAIN_HALL_RIGHT_X,
        MAIN_HALL_CENTER_Z,
        floor,
        `Main hall right turn floor ${floor + 1} (A/B wing)`,
        'corridor'
      )
    ]))
  ];
}

function createMainHallEdges() {
  const floors = Array.from({ length: MAX_FLOOR + 1 }, (_, floor) => floor);
  const mainStairs = 'PER21_STAIRS_PER21_MAIN_ENTRANCE';
  const cSpineX = corridorStopX('C_ROOMS');
  const bSpineX = corridorStopX('B_ROOMS');
  const edges = [
    ['PER21_MAIN_ENTRANCE', 'PER21_MAIN_HALL_APPROACH'],
    ['PER21_MAIN_HALL_APPROACH', mainHallCenterId(0)],
    ['PER21_MAIN_HALL_APPROACH', mainHallStairsLandId(0)]
  ];

  floors.forEach((floor) => {
    const centerId = mainHallCenterId(floor);
    const leftId = mainHallLeftTurnId(floor);
    const rightId = mainHallRightTurnId(floor);
    const stairsLandId = mainHallStairsLandId(floor);

    edges.push(
      [centerId, leftId],
      [leftId, centerSpineId(floor, nearestAnchor(centerSpineAnchors, cSpineX))],
      [stairsLandId, `${mainStairs}_F${floor}`],
      [`${mainStairs}_F${floor}`, stairsLandId]
    );

    if (floor > 0) {
      edges.push(
        [stairsLandId, rightId],
        [rightId, centerSpineId(floor, nearestAnchor(centerSpineSegments.abWing, bSpineX))]
      );
    }

    if (PER21_CLASSROOM_ROW_FLOORS.includes(floor)) {
      const rowSegments = buildClassroomRowSegments(floor);

      edges.push(
        [centerSpineId(floor, nearestAnchor(centerSpineSegments.cWing, cSpineX)),
          rowSpineId(floor, nearestAnchor(rowSegments.cWing, cSpineX))],
        [centerSpineId(floor, nearestAnchor(centerSpineSegments.abWing, bSpineX)),
          rowSpineId(floor, nearestAnchor(rowSegments.abWing, bSpineX))]
      );

      if (floor > 0) {
        edges.push([
          rightId,
          rowSpineId(floor, nearestAnchor(rowSegments.abWing, bSpineX))
        ]);
      }
    }
  });

  for (let floor = 0; floor < MAX_FLOOR; floor += 1) {
    edges.push(
      [`${mainStairs}_F${floor}`, `${mainStairs}_F${floor + 1}`],
      [`${mainStairs}_F${floor + 1}`, mainHallStairsLandId(floor + 1)]
    );
  }

  return edges;
}

function createRoomApproachNodes() {
  return per21ClassroomNodes.map((room) => node(
    roomApproachId(room.roomId),
    room.x,
    approachZForRoom(room),
    room.floor,
    room.kind === 'corridor-gap'
      ? `Corridor turn at ${room.roomId}`
      : `Corridor turn outside ${room.roomId}`,
    'corridor'
  ));
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

function createRoomLocalEdges() {
  return per21ClassroomNodes.flatMap((room) => {
    const roomNodeId = `PER21_${room.roomId}`;
    const approachId = roomApproachId(room.roomId);
    const edges = [[approachId, roomNodeId]];

    if (PER21_CLASSROOM_ROW_FLOORS.includes(room.floor)) {
      edges.unshift([
        rowSpineId(room.floor, room.x),
        approachId
      ]);
    } else if (room.floor === 0) {
      edges.unshift([
        centerSpineId(0, nearestAnchor(centerSpineAnchors, room.x)),
        approachId
      ]);
    }

    return edges;
  });
}

function createStairCubeEdges() {
  return PER21_STAIR_CUBE_LINKS.flatMap(({ roomId, targetFloor }) => {
    const room = per21ClassroomNodes.find((entry) => entry.roomId === roomId);

    if (!room) {
      return [];
    }

    const nodeId = `PER21_${roomId}`;

    if (targetFloor === 0) {
      return [[nodeId, centerSpineId(0, nearestAnchor(centerSpineAnchors, room.x))]];
    }

    return [[nodeId, roomApproachId(roomId)]];
  });
}

function createVerticalNodes() {
  const floors = Array.from({ length: MAX_FLOOR + 1 }, (_, floor) => floor);
  const sideCores = PER21_SIDE_ENTRANCE_CORES.filter(
    (core) => core.entranceId !== 'PER21_MAIN_ENTRANCE'
  );

  const sideNodes = sideCores.flatMap((core) => (
    floors.flatMap((floor) => [
      node(
        `PER21_ELEVATOR_${core.entranceId}_F${floor}`,
        core.localX,
        INSIDE_Z,
        floor,
        `Elevator (${core.label}) floor ${floor + 1}`,
        'elevator'
      ),
      node(
        `PER21_STAIRS_${core.entranceId}_F${floor}`,
        core.localX + 2.5,
        INSIDE_Z,
        floor,
        `Stairs (${core.label}) floor ${floor + 1}`,
        'stairs'
      )
    ])
  ));

  const mainStairNodes = floors.flatMap((floor) => [
    node(
      `PER21_STAIRS_PER21_MAIN_ENTRANCE_F${floor}`,
      PER21_MAIN_HALL_X + 2.5,
      PER21_MAIN_STAIRS_Z,
      floor,
      `Main entrance stairs floor ${floor + 1}`,
      'stairs'
    )
  ]);

  return [...sideNodes, ...mainStairNodes];
}

function createVerticalEdges() {
  const floors = Array.from({ length: MAX_FLOOR + 1 }, (_, floor) => floor);
  const sideCores = PER21_SIDE_ENTRANCE_CORES.filter(
    (core) => core.entranceId !== 'PER21_MAIN_ENTRANCE'
  );

  const sideEdges = sideCores.flatMap((core) => {
    const elevator = `PER21_ELEVATOR_${core.entranceId}`;
    const stairs = `PER21_STAIRS_${core.entranceId}`;
    const spineAnchor = nearestAnchor(centerSpineAnchors, core.localX);

    const floorLinks = floors.flatMap((floor) => {
      const spineNode = centerSpineId(floor, spineAnchor);
      const rowLinks = PER21_CLASSROOM_ROW_FLOORS.includes(floor)
        ? [[spineNode, rowSpineId(floor, nearestAnchor(buildClassroomRowAnchors(floor), core.localX))]]
        : [];

      return [
        [spineNode, `${elevator}_F${floor}`],
        [spineNode, `${stairs}_F${floor}`],
        [`${elevator}_F${floor}`, `${stairs}_F${floor}`],
        ...rowLinks
      ];
    });

    const verticalLinks = floors.slice(0, -1).flatMap((floor) => ([
      [`${elevator}_F${floor}`, `${elevator}_F${floor + 1}`],
      [`${stairs}_F${floor}`, `${stairs}_F${floor + 1}`],
      [centerSpineId(floor, spineAnchor), centerSpineId(floor + 1, spineAnchor)]
    ]));

    const entranceLink = [
      [core.entranceId, `${stairs}_F0`],
      [core.entranceId, `${elevator}_F0`]
    ];

    return [...floorLinks, ...verticalLinks, ...entranceLink];
  });

  const mainEntranceLink = [['PER21_MAIN_ENTRANCE', 'PER21_MAIN_HALL_APPROACH']];

  return [...sideEdges, ...mainEntranceLink];
}

function createEntranceToSpineEdges() {
  const edges = [
    ['PER21_BACK_ENTRANCE', centerSpineId(0, nearestAnchor(centerSpineAnchors, 61))],
    ['PER21_BACK_ENTRANCE_1', centerSpineId(0, nearestAnchor(centerSpineAnchors, 97))],
    ['PER21_BACK_ENTRANCE_2', centerSpineId(0, nearestAnchor(centerSpineAnchors, 123))]
  ];

  PER21_SIDE_ENTRANCE_CORES.forEach((core) => {
    if (core.entranceId === 'PER21_MAIN_ENTRANCE') {
      return;
    }

    edges.push([
      core.entranceId,
      centerSpineId(0, nearestAnchor(centerSpineAnchors, core.localX))
    ]);
  });

  return edges;
}

function createPublicPlaceEdges() {
  return publicNodes.map((place) => [
    centerSpineId(0, nearestAnchor(centerSpineAnchors, place.x)),
    place.id
  ]);
}

const entranceNodes = PER21_SIDE_ENTRANCE_CORES.map((core) => (
  node(core.entranceId, core.localX, FRONT_Z, 0, `PER21 ${core.label}`, 'entrance')
));

const nodes = [
  ...entranceNodes,
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
  ...createMainHallNodes(),
  ...PER21_SPINE_FLOORS.flatMap(createCenterSpineNodes),
  ...PER21_CLASSROOM_ROW_FLOORS.flatMap(createClassroomRowSpineNodes),
  ...createVerticalNodes(),
  ...createRoomApproachNodes(),
  ...createRoomNodes()
];

export const per21IndoorGraph = {
  nodes: Object.fromEntries(nodes.map((entry) => [entry.id, entry.value])),

  edges: [
    ...PER21_SPINE_FLOORS.flatMap(createCenterSpineEdges),
    ...createWingVerticalSpineEdges(),
    ...PER21_CLASSROOM_ROW_FLOORS.flatMap(createClassroomRowSpineEdges),
    ...PER21_CLASSROOM_ROW_FLOORS.flatMap(createCenterToRowLinks),
    ...createMainHallEdges(),
    ...createEntranceToSpineEdges(),
    ...createPublicPlaceEdges(),
    ...createVerticalEdges(),
    ...createRoomLocalEdges(),
    ...createStairCubeEdges()
  ]
};

export { centerSpineAnchors, buildClassroomRowAnchors };
