// Navigation graph for the campus prototype.
// Nodes use the same x/z coordinate system as buildings and entrances.
// Edges define walkable pedestrian connections.
// Important rule: no edge should pass through a building footprint.

export const graph = {
  nodes: {
    // PER21 entrances
    PER21_MAIN_ENTRANCE: { x: 73, z: 35, label: "PER21 Main Entrance", type: "entrance" },
    PER21_SIDE_ENTRANCE: { x: -43, z: 35, label: "PER21 Side Entrance", type: "entrance" },
    PER21_BACK_ENTRANCE: { x: 73, z: 77, label: "PER21 Back Entrance", type: "entrance" },
    PER21_BACK_ENTRANCE_2: { x: -43, z: 77, label: "PER21 Back Entrance 2", type: "entrance" },

    // PER22
    PER22_ENTRANCE: { x: -48, z: 28, label: "PER22 Entrance", type: "entrance" },

    // Mensa
    MENSA_ENTRANCE: { x: 145, z: 30, label: "Mensa Entrance", type: "entrance" },
    MENSA_SIDE_ENTRANCE: { x: 160, z: -18, label: "Mensa Side Entrance", type: "entrance" },

    // PER17
    PER17_ENTRANCE: { x: 195, z: -25, label: "PER17 Entrance", type: "entrance" },
    PER17_BACK_ENTRANCE: { x: 272, z: -25, label: "PER17 Back Entrance", type: "entrance" },

    // PER21 front pedestrian path and crossing
    PATH_PER21_FRONT_MAIN: {
      x: 73,
      z: 25,
      label: "Path in front of PER21 main entrance",
      type: "path"
    },

    PATH_PER21_FRONT_A: {
      x: 95,
      z: 25,
      label: "Path in front of PER21 toward crossing",
      type: "path"
    },

    CROSSING_BD_PEROLLES: {
      x: 115,
      z: 25,
      label: "Crossing over Bd de Pérolles",
      type: "crossing"
    },

    PATH_MENSA_FRONT: {
      x: 145,
      z: 30,
      label: "Path in front of Mensa",
      type: "path"
    },

    // Pedestrian path around Mensa
    PATH_MENSA_WEST: { x: 145, z: -18, label: "Path along west side of Mensa", type: "path" },
    PATH_MENSA_SOUTH: { x: 175, z: -18, label: "Path south of Mensa", type: "path" },

    // Pedestrian path toward PER17
    PATH_TO_PER17_A: { x: 185, z: -35, label: "Path toward PER17", type: "path" },
    PATH_PER17_FRONT: { x: 195, z: -40, label: "Path in front of PER17 entrance", type: "path" },
    PATH_PER17_BACK: { x: 272, z: -40, label: "Path in front of PER17 back entrance", type: "path" },

    // PER21 / PER22 outside path
    PATH_PER21_BACK_A: { x: 73, z: 85, label: "Back path near PER21", type: "path" },
    PATH_PER21_BACK_B: { x: -43, z: 85, label: "Back path near PER21 side", type: "path" },
    PATH_PER22_ACCESS: { x: -48, z: 38, label: "Path to PER22", type: "path" }
  },

  edges: [
    // PER21 front side to Mensa via pedestrian path and crossing
    ["PER21_MAIN_ENTRANCE", "PATH_PER21_FRONT_MAIN"],
    ["PATH_PER21_FRONT_MAIN", "PATH_PER21_FRONT_A"],
    ["PATH_PER21_FRONT_A", "CROSSING_BD_PEROLLES"],
    ["CROSSING_BD_PEROLLES", "PATH_MENSA_FRONT"],
    ["PATH_MENSA_FRONT", "MENSA_ENTRANCE"],

    // PER21 main entrance to PER22 via same front path
    ["PATH_PER21_FRONT_MAIN", "PER22_ENTRANCE"],

    // Mensa route around the building, not through it
    ["MENSA_ENTRANCE", "PATH_MENSA_WEST"],
    ["PATH_MENSA_WEST", "MENSA_SIDE_ENTRANCE"],
    ["MENSA_SIDE_ENTRANCE", "PATH_MENSA_SOUTH"],

    // Route from Mensa side toward PER17
    ["PATH_MENSA_SOUTH", "PATH_TO_PER17_A"],
    ["PATH_TO_PER17_A", "PATH_PER17_FRONT"],

    // PER17 entrance access
    ["PATH_PER17_FRONT", "PER17_ENTRANCE"],

    // PER17 back entrance access around the outside
    ["PATH_PER17_FRONT", "PATH_PER17_BACK"],
    ["PATH_PER17_BACK", "PER17_BACK_ENTRANCE"],

    // PER21 outside/back paths
    ["PER21_MAIN_ENTRANCE", "PER21_SIDE_ENTRANCE"],
    ["PER21_MAIN_ENTRANCE", "PER21_BACK_ENTRANCE"],
    ["PER21_SIDE_ENTRANCE", "PER21_BACK_ENTRANCE_2"],

    ["PER21_BACK_ENTRANCE", "PATH_PER21_BACK_A"],
    ["PER21_BACK_ENTRANCE_2", "PATH_PER21_BACK_B"],
    ["PATH_PER21_BACK_A", "PATH_PER21_BACK_B"],

    // Existing PER22 side access
    ["PER21_SIDE_ENTRANCE", "PATH_PER22_ACCESS"],
    ["PATH_PER22_ACCESS", "PER22_ENTRANCE"]
  ]
};