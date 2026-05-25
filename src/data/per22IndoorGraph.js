import { getEntrancePosition } from './entranceUtils.js';

const per22Entrance = getEntrancePosition('PER22_ENTRANCE');

export const per22IndoorGraph = {
  nodes: {
    PER22_ENTRANCE: {
      x: per22Entrance.x,
      z: per22Entrance.z,
      floor: 0,
      label: "PER22 Entrance",
      type: "entrance"
    },

    PER22_PER21_CONNECTION: {
      x: per22Entrance.x - 3,
      z: per22Entrance.z,
      floor: 0,
      label: "Indoor passage to PER21",
      type: "corridor"
    },

    PER22_LOBBY: {
      x: per22Entrance.x - 5,
      z: per22Entrance.z,
      floor: 0,
      label: "PER22 Lobby",
      type: "corridor"
    },

    PER22_STAIRS: {
      x: -49,
      z: 28,
      floor: 0,
      label: "PER22 Stairs — vertical circulation",
      type: "stairs"
    },

    PER22_AUDITORIUM_JOSEPH_DEISS: {
      x: -48.5,
      z: 23.5,
      floor: 0,
      label: "Auditorium Joseph Deiss (002)",
      type: "room"
    },

    PER22_LIBRARY: {
      x: -48.5,
      z: 23.5,
      floor: 2,
      label: "PER22 Library",
      type: "room"
    }
  },

  edges: [
    ["PER22_ENTRANCE", "PER22_LOBBY"],
    ["PER22_LOBBY", "PER22_PER21_CONNECTION"],
    ["PER22_LOBBY", "PER22_AUDITORIUM_JOSEPH_DEISS"],
    ["PER22_LOBBY", "PER22_STAIRS"],
    ["PER22_STAIRS", "PER22_LIBRARY"]
  ]
};
