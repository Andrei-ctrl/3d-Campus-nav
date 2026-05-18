// Simplified indoor navigation graph for PER21.
// Coordinates use the same x/z campus coordinate system.
// floor is used to show indoor routes at different heights.

function createRoomIds(suffixes) {
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G'].flatMap((letter) => (
    suffixes.map((suffix) => `${letter}${suffix}`)
  ));
}

function createRoomNodes(floor, suffixes) {
  const roomIds = createRoomIds(suffixes);

  return Object.fromEntries(
    roomIds.map((roomId, index) => [
      `PER21_${roomId}`,
      {
        x: 96 - index * (172 / (roomIds.length - 1)),
        z: 70,
        floor,
        label: `Room ${roomId}`
      }
    ])
  );
}

function createRoomEdges(corridorId, suffixes) {
  return createRoomIds(suffixes).map((roomId) => [corridorId, `PER21_${roomId}`]);
}

export const per21IndoorGraph = {
  nodes: {
    PER21_MAIN_ENTRANCE: {
      x: 73,
      z: 35,
      floor: 0,
      label: "PER21 Main Entrance"
    },

    PER21_BACK_ENTRANCE: {
      x: 73,
      z: 77,
      floor: 0,
      label: "PER21 Back Entrance"
    },

    PER21_LOBBY: {
      x: 73,
      z: 50,
      floor: 0,
      label: "PER21 Lobby"
    },

    PER21_GROUND_HALL: {
      x: 45,
      z: 58,
      floor: 0,
      label: "PER21 Ground Floor Hall"
    },

    PER21_GROUND_ROOM_WEST: {
      x: -55,
      z: 50,
      floor: 0,
      label: "PER21 Ground Floor West Room"
    },

    PER21_DECANAT: {
      x: 10,
      z: 50,
      floor: 0,
      label: "PER21 Decanat"
    },

    PER21_GROUND_ROOM_EAST: {
      x: 75,
      z: 50,
      floor: 0,
      label: "PER21 Ground Floor East Room"
    },

    PER21_GROUND_CORRIDOR_A: {
      x: 35,
      z: 66,
      floor: 0,
      label: "Ground floor corridor"
    },

    PER21_STAIRS_A_F0: {
      x: 96,
      z: 66,
      floor: 0,
      label: "Stairs A ground floor"
    },

    PER21_STAIRS_A_F1: {
      x: 96,
      z: 66,
      floor: 1,
      label: "Stairs A first floor"
    },

    PER21_STAIRS_A_F2: {
      x: 96,
      z: 66,
      floor: 2,
      label: "Stairs A second floor"
    },

    PER21_STAIRS_D_F0: {
      x: 10,
      z: 66,
      floor: 0,
      label: "Stairs D ground floor"
    },

    PER21_STAIRS_D_F1: {
      x: 10,
      z: 66,
      floor: 1,
      label: "Stairs D first floor"
    },

    PER21_STAIRS_D_F2: {
      x: 10,
      z: 66,
      floor: 2,
      label: "Stairs D second floor"
    },

    PER21_STAIRS_G_F0: {
      x: -76,
      z: 66,
      floor: 0,
      label: "Stairs G ground floor"
    },

    PER21_STAIRS_G_F1: {
      x: -76,
      z: 66,
      floor: 1,
      label: "Stairs G first floor"
    },

    PER21_STAIRS_G_F2: {
      x: -76,
      z: 66,
      floor: 2,
      label: "Stairs G second floor"
    },

    PER21_FIRST_CORRIDOR_A: {
      x: 15,
      z: 64,
      floor: 1,
      label: "First floor classroom corridor"
    },

    PER21_SECOND_CORRIDOR_A: {
      x: 15,
      z: 64,
      floor: 2,
      label: "Second floor classroom corridor"
    },

    ...createRoomNodes(1, ['130', '140']),

    ...createRoomNodes(2, ['230', '240'])
  },

  edges: [
    ["PER21_MAIN_ENTRANCE", "PER21_LOBBY"],
    ["PER21_LOBBY", "PER21_GROUND_HALL"],
    ["PER21_GROUND_HALL", "PER21_GROUND_ROOM_WEST"],
    ["PER21_GROUND_HALL", "PER21_DECANAT"],
    ["PER21_GROUND_HALL", "PER21_GROUND_ROOM_EAST"],
    ["PER21_GROUND_HALL", "PER21_GROUND_CORRIDOR_A"],
    ["PER21_BACK_ENTRANCE", "PER21_GROUND_CORRIDOR_A"],

    ["PER21_GROUND_CORRIDOR_A", "PER21_STAIRS_A_F0"],
    ["PER21_GROUND_CORRIDOR_A", "PER21_STAIRS_D_F0"],
    ["PER21_GROUND_CORRIDOR_A", "PER21_STAIRS_G_F0"],

    ["PER21_STAIRS_A_F0", "PER21_STAIRS_A_F1"],
    ["PER21_STAIRS_A_F1", "PER21_STAIRS_A_F2"],
    ["PER21_STAIRS_D_F0", "PER21_STAIRS_D_F1"],
    ["PER21_STAIRS_D_F1", "PER21_STAIRS_D_F2"],
    ["PER21_STAIRS_G_F0", "PER21_STAIRS_G_F1"],
    ["PER21_STAIRS_G_F1", "PER21_STAIRS_G_F2"],

    ["PER21_STAIRS_A_F1", "PER21_FIRST_CORRIDOR_A"],
    ["PER21_STAIRS_D_F1", "PER21_FIRST_CORRIDOR_A"],
    ["PER21_STAIRS_G_F1", "PER21_FIRST_CORRIDOR_A"],
    ["PER21_STAIRS_A_F2", "PER21_SECOND_CORRIDOR_A"],
    ["PER21_STAIRS_D_F2", "PER21_SECOND_CORRIDOR_A"],
    ["PER21_STAIRS_G_F2", "PER21_SECOND_CORRIDOR_A"],

    ...createRoomEdges("PER21_FIRST_CORRIDOR_A", ['130', '140']),
    ...createRoomEdges("PER21_SECOND_CORRIDOR_A", ['230', '240'])
  ]
};
