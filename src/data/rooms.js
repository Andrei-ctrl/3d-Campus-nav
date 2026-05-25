import {
  per21ClassroomNodes,
  per21CubicFirstFloorRooms,
  per21ClassroomFirstFloorRooms,
  per21UpperFloorRooms,
  PER21_LAYOUT_SIZES
} from './per21Layout.js';

function formatDimensions(size) {
  return `${size.length} x ${size.width} m`;
}

const per21Classrooms = [
  ...per21CubicFirstFloorRooms.map((room) => ({
    roomNumber: room.roomId,
    floor: 1,
    roomType: 'cube',
    notes: room.notes,
    dimensions: `${formatDimensions(room.size ?? {
      length: PER21_LAYOUT_SIZES.cubeLength,
      width: PER21_LAYOUT_SIZES.cubeWidth
    })}, two-floor height`
  })),
  ...per21ClassroomFirstFloorRooms.map((room) => ({
    roomNumber: room.roomId,
    floor: 1,
    roomType: 'classroom',
    notes: room.notes,
    dimensions: formatDimensions(room.size ?? {
      length: PER21_LAYOUT_SIZES.classLength,
      width: PER21_LAYOUT_SIZES.classWidth
    })
  })),
  ...per21UpperFloorRooms.map((room) => ({
    roomNumber: room.roomId,
    floor: 2,
    roomType: room.kind === 'front-upper' ? 'front-upper' : 'normal',
    dimensions: formatDimensions(room.size ?? {
      length: PER21_LAYOUT_SIZES.classLength,
      width: PER21_LAYOUT_SIZES.classWidth
    })
  }))
];

function createPer21Room(roomConfig) {
  const { roomNumber, floor, roomType, dimensions, notes } = roomConfig;
  const spokenRoomNumber = roomNumber.replace(/^([A-H])/, '$1 ');
  const typeLabel = roomType === 'cube' ? 'Cubic room' : roomType === 'classroom' ? 'Classroom' : 'Room';
  const noteText = notes ? `. ${notes}` : '';

  return {
    id: `PER21_${roomNumber}`,
    name: roomNumber,
    buildingId: 'PER21',
    floor,
    capacity: null,
    nearestEntranceId: 'PER21_SIDE_ENTRANCE_2',
    indoorNodeId: `PER21_${roomNumber}`,
    roomType,
    dimensions,
    aliases: [
      roomNumber.toLowerCase(),
      spokenRoomNumber.toLowerCase(),
      `room ${roomNumber}`.toLowerCase(),
      `classroom ${roomNumber}`.toLowerCase(),
      `per21 ${roomNumber}`.toLowerCase()
    ],
    description: `${typeLabel} ${roomNumber} in PER21, floor ${floor}, ${dimensions}${noteText}`
  };
}

const per21PublicPlaces = [
  {
    id: 'PER21_CAFETERIA',
    name: 'Cafeteria',
    buildingId: 'PER21',
    floor: 0,
    capacity: null,
    nearestEntranceId: 'PER21_MAIN_ENTRANCE',
    indoorNodeId: 'PER21_CAFETERIA',
    aliases: ['cafeteria', 'per21 cafeteria', 'cafe', 'per21 cafe'],
    description: 'Cafeteria area on the PER21 ground floor'
  },
  {
    id: 'PER21_RESTAURANT',
    name: 'Restaurant',
    buildingId: 'PER21',
    floor: 0,
    capacity: null,
    nearestEntranceId: 'PER21_MAIN_ENTRANCE',
    indoorNodeId: 'PER21_RESTAURANT',
    aliases: ['restaurant', 'per21 restaurant', 'cantine', 'canteen'],
    description: 'Restaurant area on the PER21 ground floor'
  },
  {
    id: 'PER21_DECANAT',
    name: 'Decanat',
    buildingId: 'PER21',
    floor: 0,
    capacity: null,
    nearestEntranceId: 'PER21_MAIN_ENTRANCE',
    indoorNodeId: 'PER21_DECANAT',
    aliases: ['decanat', 'dean office', 'per21 decanat'],
    description: 'Decanat office area on the PER21 ground floor'
  },
  {
    id: 'PER21_COMMUNICATIONS',
    name: 'Communications',
    buildingId: 'PER21',
    floor: 0,
    capacity: null,
    nearestEntranceId: 'PER21_SIDE_ENTRANCE_3',
    indoorNodeId: 'PER21_COMMUNICATIONS',
    aliases: ['communications', 'communication', 'per21 communications'],
    description: 'Communications office area on the PER21 ground floor'
  },
  {
    id: 'PER21_RECEPTION',
    name: 'Reception',
    buildingId: 'PER21',
    floor: 0,
    capacity: null,
    nearestEntranceId: 'PER21_MAIN_ENTRANCE',
    indoorNodeId: 'PER21_RECEPTION',
    aliases: ['reception', 'front desk', 'per21 reception'],
    description: 'Reception area on the PER21 ground floor'
  },
  {
    id: 'PER21_ASEA',
    name: 'ASEA',
    buildingId: 'PER21',
    floor: 0,
    capacity: null,
    nearestEntranceId: 'PER21_END_SIDE_ENTRANCE',
    indoorNodeId: 'PER21_ASEA',
    aliases: ['asea', 'per21 asea'],
    description: 'ASEA office area near the PER22 side of PER21'
  }
];

export const rooms = [
  ...per21PublicPlaces,
  ...per21Classrooms.map(createPer21Room),
  {
    id: "PER22_AUDITORIUM_JOSEPH_DEISS",
    name: "Auditorium Joseph Deiss",
    buildingId: "PER22",
    floor: 0,
    capacity: null,
    nearestEntranceId: "PER22_ENTRANCE",
    indoorNodeId: "PER22_AUDITORIUM_JOSEPH_DEISS",
    aliases: [
      "auditorium joseph deiss",
      "joseph deiss",
      "auditorium",
      "per22 auditorium",
      "per22 joseph deiss",
      "002",
      "room 002",
      "per22 002",
      "per22 room 002",
      "salle 002",
      "joseph deiss 002"
    ],
    description: "Auditorium Joseph Deiss (room 002) in PER22, two floors high"
  },
  {
    id: "PER22_LIBRARY",
    name: "PER22 Library",
    buildingId: "PER22",
    floor: 2,
    capacity: null,
    nearestEntranceId: "PER22_ENTRANCE",
    indoorNodeId: "PER22_LIBRARY",
    aliases: [
      "library",
      "per22 library",
      "library per22",
      "bibliotheque",
      "bibliothèque"
    ],
    description: "Library above Auditorium Joseph Deiss in PER22, about three floors high"
  },
  {
    id: "PER17_001",
    name: "Salle 001",
    buildingId: "PER17",
    floor: 0,
    capacity: 48,
    nearestEntranceId: "PER17_ENTRANCE",
    indoorNodeId: "PER17_001",
    aliases: [
      "salle 001",
      "room 001",
      "001",
      "per17 001"
    ],
    description: "Salle 001, 48 places"
  },
  {
    id: "PER17_MICROSCOPES_010",
    name: "Salle de microscopes 010",
    buildingId: "PER17",
    floor: 0,
    capacity: 24,
    nearestEntranceId: "PER17_ENTRANCE",
    indoorNodeId: "PER17_MICROSCOPES_010",
    aliases: [
      "salle de microscopes 010",
      "salle de microscopes",
      "microscopes",
      "microscopes 010",
      "microscope room",
      "room 010",
      "salle 010",
      "010",
      "per17 010"
    ],
    description: "Salle de microscopes 010, 24 places"
  },
  {
    id: "PER17_REUNION_036",
    name: "Salle de reunion 036",
    buildingId: "PER17",
    floor: 0,
    capacity: 28,
    nearestEntranceId: "PER17_ENTRANCE",
    indoorNodeId: "PER17_REUNION_036",
    aliases: [
      "salle de reunion 036",
      "salle de réunion 036",
      "reunion 036",
      "meeting room 036",
      "room 036",
      "salle 036",
      "036",
      "per17 036"
    ],
    description: "Salle de reunion 036, 28 places"
  }
];
