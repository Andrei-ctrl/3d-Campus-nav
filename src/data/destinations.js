import { rooms } from './rooms.js';

const campusBuildings = [
  {
    id: 'PER21',
    name: 'Pérolles 21',
    type: 'building',
    defaultEntranceId: 'PER21_MAIN_ENTRANCE'
  },
  {
    id: 'PER22',
    name: 'Pérolles 22',
    type: 'building',
    defaultEntranceId: 'PER22_ENTRANCE'
  },
  {
    id: 'MENSA',
    name: 'Mensa Pérolles',
    type: 'building',
    defaultEntranceId: 'MENSA_ENTRANCE'
  },
  {
    id: 'PER17',
    name: 'Pérolles 17',
    type: 'building',
    defaultEntranceId: 'PER17_ENTRANCE'
  }
];

function createRoomDestination(room, courseAliasesByRoomId = {}) {
  const timetableAliases = courseAliasesByRoomId[room.id] || [];

  return {
    id: room.id,
    name: `${room.buildingId} ${room.name}`,
    type: 'room',
    defaultEntranceId: room.nearestEntranceId,
    room: {
      ...room,
      aliases: [...(room.aliases || []), ...timetableAliases]
    }
  };
}

export function createDestinations(roomsList = rooms, { courseAliasesByRoomId = {} } = {}) {
  return [
    ...campusBuildings,
    ...roomsList.map((room) => createRoomDestination(room, courseAliasesByRoomId))
  ];
}

export const destinations = createDestinations(rooms);
