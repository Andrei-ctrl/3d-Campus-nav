export const per22IndoorGraph = {
  nodes: {
    PER22_ENTRANCE: {
      x: -48,
      z: 28,
      floor: 0,
      label: "PER22 Entrance"
    },

    PER22_LOBBY: {
      x: -58,
      z: 28,
      floor: 0,
      label: "PER22 Lobby"
    },

    PER22_STAIRS: {
      x: -70,
      z: 28,
      floor: 0,
      label: "PER22 Stairs"
    },

    PER22_AUDITORIUM_JOSEPH_DEISS: {
      x: -65.5,
      z: 25,
      floor: 0,
      label: "Auditorium Joseph Deiss"
    },

    PER22_LIBRARY: {
      x: -65.5,
      z: 25,
      floor: 2,
      label: "PER22 Library"
    }
  },

  edges: [
    ["PER22_ENTRANCE", "PER22_LOBBY"],
    ["PER22_LOBBY", "PER22_AUDITORIUM_JOSEPH_DEISS"],
    ["PER22_LOBBY", "PER22_STAIRS"],
    ["PER22_STAIRS", "PER22_LIBRARY"]
  ]
};
