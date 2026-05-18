const per21RoomIds = [
  'A130',
  'A140',
  'B130',
  'B140',
  'C130',
  'C140',
  'D130',
  'D140',
  'E130',
  'E140',
  'F130',
  'F140',
  'G130',
  'G140',
  'A230',
  'A240',
  'B230',
  'B240',
  'C230',
  'C240',
  'D230',
  'D240',
  'E230',
  'E240',
  'F230',
  'F240',
  'G230',
  'G240'
];

function createPer21Room(roomNumber) {
  const floor = roomNumber.includes('2') ? 2 : 1;
  const spokenRoomNumber = roomNumber.replace(/^([A-G])/, '$1 ');

  return {
    id: `PER21_${roomNumber}`,
    name: roomNumber,
    buildingId: 'PER21',
    floor,
    capacity: null,
    nearestEntranceId: 'PER21_BACK_ENTRANCE',
    indoorNodeId: `PER21_${roomNumber}`,
    aliases: [
      roomNumber.toLowerCase(),
      spokenRoomNumber.toLowerCase(),
      `room ${roomNumber}`.toLowerCase(),
      `room ${spokenRoomNumber}`.toLowerCase(),
      `classroom ${roomNumber}`.toLowerCase(),
      `classroom ${spokenRoomNumber}`.toLowerCase(),
      `per21 ${roomNumber}`.toLowerCase(),
      `per21 ${spokenRoomNumber}`.toLowerCase()
    ],
    description: `Classroom ${roomNumber} in PER21, floor ${floor}`
  };
}

export const rooms = [
  ...per21RoomIds.map(createPer21Room),
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
      "per22 joseph deiss"
    ],
    description: "Auditorium Joseph Deiss in PER22, two floors high"
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
    aliases: ["salle 001", "room 001", "001", "per17 001"],
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
