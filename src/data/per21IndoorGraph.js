// Simplified indoor navigation graph for PER21.
// Coordinates use the same x/z campus coordinate system.
// floor is used to show the indoor route at different heights.

export const per21IndoorGraph = {
  nodes: {
    PER21_MAIN_ENTRANCE: {
      x: 73,
      z: 35,
      floor: 0,
      label: "PER21 Main Entrance"
    },

    PER21_LOBBY: {
      x: 73,
      z: 50,
      floor: 0,
      label: "PER21 Lobby"
    },

    PER21_GROUND_CORRIDOR_A: {
      x: 50,
      z: 56,
      floor: 0,
      label: "Ground floor corridor"
    },

    PER21_STAIRS_A_F0: {
      x: 25,
      z: 56,
      floor: 0,
      label: "Stairs A ground floor"
    },

    PER21_STAIRS_A_F1: {
      x: 25,
      z: 56,
      floor: 1,
      label: "Stairs A first floor"
    },

    PER21_FIRST_CORRIDOR_A: {
      x: 50,
      z: 56,
      floor: 1,
      label: "First floor corridor"
    },

    PER21_C130: {
      x: 63,
      z: 56,
      floor: 1,
      label: "Room C130"
    },

    PER21_STAIRS_A_F2: {
      x: 25,
      z: 56,
      floor: 2,
      label: "Stairs A second floor"
    },

    PER21_SECOND_CORRIDOR_A: {
      x: 50,
      z: 62,
      floor: 2,
      label: "Second floor corridor"
    },

    PER21_C230: {
      x: 63,
      z: 62,
      floor: 2,
      label: "Room C230"
    }
  },

  edges: [
    ["PER21_MAIN_ENTRANCE", "PER21_LOBBY"],
    ["PER21_LOBBY", "PER21_GROUND_CORRIDOR_A"],
    ["PER21_GROUND_CORRIDOR_A", "PER21_STAIRS_A_F0"],

    ["PER21_STAIRS_A_F0", "PER21_STAIRS_A_F1"],
    ["PER21_STAIRS_A_F1", "PER21_FIRST_CORRIDOR_A"],
    ["PER21_FIRST_CORRIDOR_A", "PER21_C130"],

    ["PER21_STAIRS_A_F1", "PER21_STAIRS_A_F2"],
    ["PER21_STAIRS_A_F2", "PER21_SECOND_CORRIDOR_A"],
    ["PER21_SECOND_CORRIDOR_A", "PER21_C230"]
  ]
};