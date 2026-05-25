import * as THREE from 'three';
import { buildingHeight, floorElevation } from '../data/buildings.js';
import {
  PER21_SIDE_ENTRANCE_CORES,
  PER21_BACK_CLASSROOM_Z,
  PER21_LAYOUT_SIZES,
  PER21_MAIN_HALL_X,
  PER21_MAIN_HALL_STAIRS_OFFSET,
  PER21_MAIN_STAIRS_Z,
  per21CubicFirstFloorRooms,
  per21ClassroomFirstFloorRooms,
  per21FirstFloorCorridorGaps,
  per21UpperFloorRooms
} from '../data/per21Layout.js';

const PER21_CENTER_X = 10;
const PER21_MEASURED_LENGTH = 132;

const FRONT_Z = 37;
const CENTER_Z = 56;
const BACK_Z = 75;
const CORE_Z = 47;
const INSIDE_Z = 45;
const PUBLIC_Z = 70;
const CLASSROOM_Z = PER21_BACK_CLASSROOM_Z;
const PER21_FLOOR_COUNT = 5;
const INDOOR_BASE_Y = buildingHeight(PER21_FLOOR_COUNT) + 1;
const VERTICAL_SHAFT_HEIGHT = buildingHeight(PER21_FLOOR_COUNT);

function toWorldX(localX) {
  return PER21_CENTER_X - PER21_MEASURED_LENGTH / 2 + localX;
}

function floorY(floor = 0, offset = 0.2) {
  return INDOOR_BASE_Y + floorElevation(floor) + offset;
}

function applyIndoorUserData(mesh, id, name) {
  mesh.userData = {
    type: 'indoor-structure',
    layer: 'per21-indoor',
    id,
    name
  };

  return mesh;
}

function createIndoorBox(center, size, color, id, name, y = floorY(0), opacity = 0.55) {
  const geometry = new THREE.BoxGeometry(size.length, size.height, size.width);

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0,
    transparent: true,
    opacity
  });

  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(toWorldX(center.x), y, center.z);

  return applyIndoorUserData(mesh, id, name);
}

function createIndoorDisc(x, z, radius, color, id, name, y = floorY(0, 0.45), opacity = 0.72) {
  const geometry = new THREE.CylinderGeometry(radius, radius, 0.5, 32);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0,
    transparent: true,
    opacity
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(toWorldX(x), y, z);

  return applyIndoorUserData(mesh, id, name);
}

function createEntranceTriangle(x, id, name, z = FRONT_Z) {
  const geometry = new THREE.ConeGeometry(1.8, 0.55, 3);
  const material = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7,
    roughness: 0.7,
    metalness: 0,
    transparent: true,
    opacity: 0.78
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(toWorldX(x), floorY(0, 0.5), z);
  mesh.rotation.y = Math.PI / 2;

  return applyIndoorUserData(mesh, id, name);
}

function createBackEntranceSquare(x, id, name) {
  return createIndoorBox(
    { x, z: BACK_Z - 0.6 },
    { length: 3, width: 1.2, height: 0.5 },
    0x80deea,
    id,
    name,
    floorY(0, 0.45),
    0.76
  );
}

function createVerticalShaft(x, z, id, name, color, width = 2.2) {
  const groundY = floorY(0, 0);

  return createIndoorBox(
    { x, z },
    { length: width, width: 2.2, height: VERTICAL_SHAFT_HEIGHT },
    color,
    id,
    name,
    groundY + VERTICAL_SHAFT_HEIGHT / 2,
    0.68
  );
}

function createSideVerticalCores() {
  return PER21_SIDE_ENTRANCE_CORES
    .filter((core) => core.entranceId !== 'PER21_MAIN_ENTRANCE')
    .flatMap((core) => ([
      createVerticalShaft(
        core.localX,
        FRONT_Z + 1,
        `PER21_ELEVATOR_${core.entranceId}_SHAFT`,
        `PER21 elevator (${core.label}) — ground level at side entrance`,
        0xffb74d,
        2.3
      ),
      createVerticalShaft(
        core.localX + 2.5,
        FRONT_Z + 1,
        `PER21_STAIRS_${core.entranceId}_SHAFT`,
        `PER21 stairs (${core.label}) — ground level at side entrance`,
        0xff9800,
        2.3
      )
    ]));
}

function createMainEntranceStairShaft() {
  return createVerticalShaft(
    PER21_MAIN_HALL_X + PER21_MAIN_HALL_STAIRS_OFFSET,
    PER21_MAIN_STAIRS_Z,
    'PER21_STAIRS_PER21_MAIN_ENTRANCE_SHAFT',
    'PER21 main entrance stairs — 15 m inside from facade',
    0xff9800,
    2.3
  );
}

function defaultRoomSize(kind) {
  if (kind === 'cube') {
    return {
      length: PER21_LAYOUT_SIZES.cubeLength,
      width: PER21_LAYOUT_SIZES.cubeWidth,
      height: 6
    };
  }

  return {
    length: PER21_LAYOUT_SIZES.classLength,
    width: PER21_LAYOUT_SIZES.classWidth,
    height: 2.4
  };
}

function createClassroomVolumes() {
  return [
    ...per21FirstFloorCorridorGaps.map((gap) => createIndoorBox(
      { x: gap.x, z: gap.z ?? CLASSROOM_Z },
      {
        length: gap.size?.length ?? PER21_LAYOUT_SIZES.corridorLength,
        width: gap.size?.width ?? PER21_LAYOUT_SIZES.classWidth,
        height: 0.35
      },
      0x90caf9,
      `PER21_${gap.roomId}_VOLUME`,
      gap.notes || 'PER21 corridor space',
      floorY(1, 0.55),
      0.48
    )),
    ...per21CubicFirstFloorRooms.map((room) => createIndoorBox(
      { x: room.x, z: room.z ?? CLASSROOM_Z },
      room.size ?? defaultRoomSize('cube'),
      0x0288d1,
      `PER21_${room.roomId}_CUBE_VOLUME`,
      room.notes
        ? `PER21 ${room.roomId} cubic room — ${room.notes}`
        : `PER21 ${room.roomId} cubic room`,
      floorY(1, 3.2),
      0.44
    )),
    ...per21ClassroomFirstFloorRooms.map((room) => createIndoorBox(
      { x: room.x, z: room.z ?? CLASSROOM_Z },
      room.size ?? defaultRoomSize('classroom'),
      0x4fc3f7,
      `PER21_${room.roomId}_CLASSROOM_VOLUME`,
      `PER21 ${room.roomId} classroom`,
      floorY(1, 1.4),
      0.58
    )),
    ...per21UpperFloorRooms.map((room) => createIndoorBox(
      { x: room.x, z: room.z ?? CLASSROOM_Z },
      room.size ?? defaultRoomSize('classroom'),
      0x81d4fa,
      `PER21_${room.roomId}_ROOM_VOLUME`,
      `PER21 ${room.roomId} upper classroom`,
      floorY(3, 0.9),
      0.54
    ))
  ];
}

export function createPer21IndoorStructure(scene) {
  const indoorMeshes = [
    createIndoorBox(
      { x: 66, z: CENTER_Z },
      { length: 132, width: 38, height: 0.25 },
      0x0d47a1,
      'PER21_FLOOR_1_FOOTPRINT',
      'PER21 floor 1 measured footprint',
      floorY(0, 0.05),
      0.18
    ),
    createIndoorBox(
      { x: 66, z: CLASSROOM_Z },
      { length: 132, width: 3, height: 0.4 },
      0xb3e5fc,
      'PER21_MAIN_CORRIDOR_F1',
      'PER21 main corridor floor 1',
      floorY(0, 0.25),
      0.55
    ),

    createIndoorBox(
      { x: 3, z: FRONT_Z + 1 },
      { length: 3, width: 1.2, height: 0.5 },
      0x80deea,
      'PER21_PER22_CONNECTION_ENTRANCE_AREA',
      'PER21 PER22 connection (indoor only)',
      floorY(0, 0.45),
      0.76
    ),
    createEntranceTriangle(21, 'PER21_END_SIDE_ENTRANCE_AREA', 'PER21 end side entrance'),
    createEntranceTriangle(61, 'PER21_SIDE_ENTRANCE_3_AREA', 'PER21 side entrance 3'),
    createEntranceTriangle(97, 'PER21_SIDE_ENTRANCE_2_AREA', 'PER21 side entrance 2'),
    createEntranceTriangle(110, 'PER21_MAIN_ENTRANCE_AREA', 'PER21 main entrance'),
    createEntranceTriangle(123, 'PER21_SIDE_ENTRANCE_1_AREA', 'PER21 side entrance 1'),

    createBackEntranceSquare(61, 'PER21_BACK_ENTRANCE_AREA', 'PER21 back entrance'),
    createBackEntranceSquare(97, 'PER21_BACK_ENTRANCE_1_AREA', 'PER21 back entrance 1'),
    createBackEntranceSquare(123, 'PER21_BACK_ENTRANCE_2_AREA', 'PER21 back entrance 2'),

    createIndoorBox(
      { x: 87, z: CORE_Z },
      { length: 10, width: 3, height: 0.55 },
      0xfff59d,
      'PER21_CAFETERIA_AREA',
      'PER21 cafeteria',
      floorY(0, 0.45),
      0.72
    ),
    createIndoorBox(
      { x: 80, z: PUBLIC_Z },
      { length: 13, width: 4, height: 0.55 },
      0xffcc80,
      'PER21_RESTAURANT_AREA',
      'PER21 restaurant',
      floorY(0, 0.45),
      0.65
    ),
    createIndoorBox(
      { x: 72, z: PUBLIC_Z },
      { length: 9, width: 4, height: 0.55 },
      0xffe082,
      'PER21_DECANAT_AREA',
      'PER21 decanat',
      floorY(0, 0.5),
      0.68
    ),
    createIndoorBox(
      { x: 50, z: CORE_Z },
      { length: 9, width: 3, height: 0.5 },
      0xa5d6a7,
      'PER21_COMMUNICATIONS_AREA',
      'PER21 communications',
      floorY(0, 0.45),
      0.65
    ),
    createIndoorBox(
      { x: 94, z: CORE_Z },
      { length: 9, width: 3, height: 0.5 },
      0x81c784,
      'PER21_RECEPTION_AREA',
      'PER21 reception',
      floorY(0, 0.45),
      0.65
    ),
    createIndoorBox(
      { x: 12, z: CORE_Z },
      { length: 9, width: 3, height: 0.5 },
      0x90caf9,
      'PER21_ASEA_AREA',
      'PER21 ASEA',
      floorY(0, 0.45),
      0.66
    ),

    createIndoorBox(
      { x: 123, z: PUBLIC_Z },
      { length: 4, width: 3, height: 0.45 },
      0xce93d8,
      'PER21_TOILETS_WEST_AREA',
      'PER21 toilets near side entrance 1',
      floorY(0, 0.45)
    ),
    createIndoorBox(
      { x: 97, z: PUBLIC_Z },
      { length: 4, width: 3, height: 0.45 },
      0xce93d8,
      'PER21_TOILETS_CENTER_AREA',
      'PER21 toilets near side entrance 2',
      floorY(0, 0.45)
    ),
    createIndoorBox(
      { x: 61, z: PUBLIC_Z },
      { length: 4, width: 3, height: 0.45 },
      0xce93d8,
      'PER21_TOILETS_EAST_AREA',
      'PER21 toilets near side entrance 3',
      floorY(0, 0.45)
    ),
    createIndoorBox(
      { x: 51, z: PUBLIC_Z },
      { length: 10, width: 3, height: 0.45 },
      0x80cbc4,
      'PER21_SERVICE_BACK_SPACE_AREA',
      'PER21 service/back space',
      floorY(0, 0.45)
    ),
    createIndoorBox(
      { x: 45, z: PUBLIC_Z },
      { length: 3, width: 3, height: 0.5 },
      0x4db6ac,
      'PER21_SMALL_BACK_SPACE_AREA',
      'PER21 small back space',
      floorY(0, 0.55)
    ),

    ...createSideVerticalCores(),
    createMainEntranceStairShaft(),

    createIndoorBox(
      { x: 66, z: CLASSROOM_Z },
      { length: 132, width: 3, height: 0.4 },
      0x64b5f6,
      'PER21_FIRST_FLOOR_CORRIDOR',
      'PER21 first classroom floor corridor',
      floorY(1, 0.2)
    ),
    createIndoorBox(
      { x: 74.5, z: CLASSROOM_Z },
      { length: 109, width: 3, height: 0.35 },
      0x42a5f5,
      'PER21_FIRST_FLOOR_CLASSROOM_ROW',
      'PER21 first classroom floor row',
      floorY(1, 0.45)
    ),
    ...createClassroomVolumes(),
    createIndoorBox(
      { x: 66, z: CLASSROOM_Z },
      { length: 132, width: 3, height: 0.4 },
      0x1976d2,
      'PER21_SECOND_FLOOR_CORRIDOR',
      'PER21 second classroom floor corridor',
      floorY(2, 0.2)
    ),
    createIndoorBox(
      { x: 74.5, z: CLASSROOM_Z },
      { length: 109, width: 3, height: 0.35 },
      0x1565c0,
      'PER21_SECOND_FLOOR_CLASSROOM_ROW',
      'PER21 second classroom floor row',
      floorY(2, 0.45)
    ),
    createIndoorBox(
      { x: 66, z: CLASSROOM_Z },
      { length: 132, width: 3, height: 0.4 },
      0x0d47a1,
      'PER21_THIRD_FLOOR_CORRIDOR',
      'PER21 third floor corridor',
      floorY(3, 0.2)
    ),
    createIndoorBox(
      { x: 74.5, z: CLASSROOM_Z },
      { length: 109, width: 3, height: 0.35 },
      0x2196f3,
      'PER21_THIRD_FLOOR_ROOM_ROW',
      'PER21 third floor room row',
      floorY(3, 0.45)
    ),
    createIndoorBox(
      { x: 66, z: CLASSROOM_Z },
      { length: 132, width: 3, height: 0.4 },
      0x283593,
      'PER21_FOURTH_FLOOR_CORRIDOR',
      'PER21 fourth floor office corridor',
      floorY(4, 0.2)
    ),
    createIndoorBox(
      { x: 74.5, z: CLASSROOM_Z },
      { length: 109, width: 3, height: 0.35 },
      0x5c6bc0,
      'PER21_FOURTH_FLOOR_OFFICE_ROW',
      'PER21 fourth floor office row',
      floorY(4, 0.45)
    ),
    createIndoorBox(
      { x: 66, z: CLASSROOM_Z },
      { length: 132, width: 3, height: 0.4 },
      0x1a237e,
      'PER21_FIFTH_FLOOR_CORRIDOR',
      'PER21 fifth floor office corridor',
      floorY(5, 0.2)
    ),
    createIndoorBox(
      { x: 74.5, z: CLASSROOM_Z },
      { length: 109, width: 3, height: 0.35 },
      0x3949ab,
      'PER21_FIFTH_FLOOR_OFFICE_ROW',
      'PER21 fifth floor office row',
      floorY(5, 0.45)
    ),
    createIndoorBox(
      { x: 66, z: 46.5 },
      { length: 132, width: 19, height: 9 },
      0x0d47a1,
      'PER21_UPPER_MAIN_ENTRANCE_WING',
      'PER21 upper main entrance wing',
      floorY(1, 1.5),
      0.32
    ),
    createVerticalShaft(20, FRONT_Z + 1, 'PER21_UPPER_STAIRS_A', 'PER21 upper stairs A', 0x64b5f6, 2.2),
    createVerticalShaft(58, FRONT_Z + 1, 'PER21_UPPER_STAIRS_C', 'PER21 upper stairs C', 0x64b5f6, 2.2),
    createVerticalShaft(129, FRONT_Z + 1, 'PER21_UPPER_STAIRS_G', 'PER21 upper stairs G', 0x64b5f6, 2.2)
  ];

  indoorMeshes.forEach((mesh) => {
    scene.add(mesh);
  });

  return indoorMeshes;
}
