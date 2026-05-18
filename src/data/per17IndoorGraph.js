export const per17IndoorGraph = {
  nodes: {
    PER17_ENTRANCE: {
      x: 195,
      z: -25,
      floor: 0,
      label: "PER17 Entrance"
    },

    PER17_LOBBY: {
      x: 205,
      z: -25,
      floor: 0,
      label: "PER17 Lobby"
    },

    PER17_CORRIDOR_A: {
      x: 225,
      z: -25,
      floor: 0,
      label: "PER17 Corridor"
    },

    PER17_001: {
      x: 215,
      z: -30,
      floor: 0,
      label: "Salle 001"
    },

    PER17_MICROSCOPES_010: {
      x: 235,
      z: -30,
      floor: 0,
      label: "Salle de microscopes 010"
    },

    PER17_REUNION_036: {
      x: 255,
      z: -30,
      floor: 0,
      label: "Salle de réunion 036"
    }
  },

  edges: [
    ["PER17_ENTRANCE", "PER17_LOBBY"],
    ["PER17_LOBBY", "PER17_CORRIDOR_A"],
    ["PER17_CORRIDOR_A", "PER17_001"],
    ["PER17_CORRIDOR_A", "PER17_MICROSCOPES_010"],
    ["PER17_CORRIDOR_A", "PER17_REUNION_036"]
  ]
};
