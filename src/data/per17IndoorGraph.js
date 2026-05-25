import { getEntrancePosition } from './entranceUtils.js';

const PER17_ROOM_Z = -19;
const per17Entrance = getEntrancePosition('PER17_ENTRANCE');
const per17BackEntrance = getEntrancePosition('PER17_BACK_ENTRANCE');

export const per17IndoorGraph = {
  nodes: {
    PER17_ENTRANCE: {
      x: per17Entrance.x,
      z: per17Entrance.z,
      floor: 0,
      label: 'PER17 Entrance',
      type: 'entrance'
    },

    PER17_BACK_ENTRANCE: {
      x: per17BackEntrance.x,
      z: per17BackEntrance.z,
      floor: 0,
      label: 'PER17 Back Entrance',
      type: 'entrance'
    },

    PER17_LOBBY: {
      x: per17Entrance.x + 10,
      z: per17Entrance.z,
      floor: 0,
      label: 'PER17 Lobby',
      type: 'corridor'
    },

    PER17_CORRIDOR_A: {
      x: per17Entrance.x + 30,
      z: per17Entrance.z,
      floor: 0,
      label: 'PER17 Corridor',
      type: 'corridor'
    },

    PER17_CORRIDOR_BACK: {
      x: per17BackEntrance.x - 12,
      z: per17BackEntrance.z,
      floor: 0,
      label: 'PER17 Back corridor',
      type: 'corridor'
    },

    PER17_001: {
      x: per17Entrance.x + 20,
      z: PER17_ROOM_Z,
      floor: 0,
      label: 'Salle 001',
      type: 'room'
    },

    PER17_MICROSCOPES_010: {
      x: per17Entrance.x + 40,
      z: PER17_ROOM_Z,
      floor: 0,
      label: 'Salle de microscopes 010',
      type: 'room'
    },

    PER17_REUNION_036: {
      x: per17Entrance.x + 60,
      z: PER17_ROOM_Z,
      floor: 0,
      label: 'Salle de reunion 036',
      type: 'room'
    }
  },

  edges: [
    ['PER17_ENTRANCE', 'PER17_LOBBY'],
    ['PER17_BACK_ENTRANCE', 'PER17_CORRIDOR_BACK'],
    ['PER17_LOBBY', 'PER17_CORRIDOR_A'],
    ['PER17_CORRIDOR_A', 'PER17_CORRIDOR_BACK'],
    ['PER17_CORRIDOR_A', 'PER17_001'],
    ['PER17_CORRIDOR_A', 'PER17_MICROSCOPES_010'],
    ['PER17_CORRIDOR_A', 'PER17_REUNION_036']
  ]
};
