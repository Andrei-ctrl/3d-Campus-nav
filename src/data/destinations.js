import { rooms } from "./rooms.js";

export const destinations = [
  {
    id: "PER21",
    name: "Pérolles 21",
    type: "building",
    defaultEntranceId: "PER21_MAIN_ENTRANCE"
  },
  {
    id: "PER22",
    name: "Pérolles 22",
    type: "building",
    defaultEntranceId: "PER22_ENTRANCE"
  },
  {
    id: "MENSA",
    name: "Mensa Pérolles",
    type: "building",
    defaultEntranceId: "MENSA_ENTRANCE"
  },
  {
    id: "PER17",
    name: "Pérolles 17",
    type: "building",
    defaultEntranceId: "PER17_ENTRANCE"
  },

  ...rooms.map((room) => ({
    id: room.id,
    name: `${room.buildingId} ${room.name}`,
    type: "room",
    defaultEntranceId: room.nearestEntranceId,
    room
  }))
];