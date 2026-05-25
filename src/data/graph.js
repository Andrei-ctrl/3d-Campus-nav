// Outdoor campus navigation graph (orthogonal paths only).
// PER21↔PER22 passage is indoor only — not represented here.

import {
  createGraphEntranceNode,
  createGraphPathAtEntranceX,
  getEntrancePosition
} from './entranceUtils.js';

const FRONT_ROAD_Z = 30;
const PER21_EAST_X = 82;

// Mensa box (~rotation 90°): x ≈ 150–170, z ≈ -4–59 — path stays outside to the east/north.
const MENSA_EAST_PATH_X = 175;
const MENSA_NORTH_PATH_Z = 60;
const MENSA_SOUTH_PATH_Z = -10;

const mensaEntrance = getEntrancePosition('MENSA_ENTRANCE');
const per17Entrance = getEntrancePosition('PER17_ENTRANCE');
const per17BackEntrance = getEntrancePosition('PER17_BACK_ENTRANCE');

export const graph = {
  nodes: {
    PER21_END_SIDE_ENTRANCE: createGraphEntranceNode('PER21_END_SIDE_ENTRANCE'),
    PER21_SIDE_ENTRANCE_3: createGraphEntranceNode('PER21_SIDE_ENTRANCE_3'),
    PER21_SIDE_ENTRANCE_2: createGraphEntranceNode('PER21_SIDE_ENTRANCE_2'),
    PER21_MAIN_ENTRANCE: createGraphEntranceNode('PER21_MAIN_ENTRANCE'),
    PER21_SIDE_ENTRANCE_1: createGraphEntranceNode('PER21_SIDE_ENTRANCE_1'),
    PER21_SIDE_ENTRANCE: createGraphEntranceNode('PER21_SIDE_ENTRANCE_1'),

    PER21_BACK_ENTRANCE: createGraphEntranceNode('PER21_BACK_ENTRANCE'),
    PER21_BACK_ENTRANCE_1: createGraphEntranceNode('PER21_BACK_ENTRANCE_1'),
    PER21_BACK_ENTRANCE_2: createGraphEntranceNode('PER21_BACK_ENTRANCE_2'),

    PER22_ENTRANCE: createGraphEntranceNode('PER22_ENTRANCE'),

    MENSA_ENTRANCE: createGraphEntranceNode('MENSA_ENTRANCE'),
    MENSA_SIDE_ENTRANCE: createGraphEntranceNode('MENSA_SIDE_ENTRANCE'),

    PER17_ENTRANCE: createGraphEntranceNode('PER17_ENTRANCE'),
    PER17_BACK_ENTRANCE: createGraphEntranceNode('PER17_BACK_ENTRANCE'),

    PATH_PER22_FRONT: createGraphPathAtEntranceX(
      'PER22_ENTRANCE',
      FRONT_ROAD_Z,
      'Front road at PER22'
    ),
    PATH_PER21_FRONT_WEST: createGraphPathAtEntranceX(
      'PER21_END_SIDE_ENTRANCE',
      FRONT_ROAD_Z,
      'Front road west of PER21'
    ),
    PATH_PER21_FRONT_S3: createGraphPathAtEntranceX(
      'PER21_SIDE_ENTRANCE_3',
      FRONT_ROAD_Z,
      'Front road at side entrance 3'
    ),
    PATH_PER21_FRONT_S2: createGraphPathAtEntranceX(
      'PER21_SIDE_ENTRANCE_2',
      FRONT_ROAD_Z,
      'Front road at side entrance 2'
    ),
    PATH_PER21_FRONT_MAIN: createGraphPathAtEntranceX(
      'PER21_MAIN_ENTRANCE',
      FRONT_ROAD_Z,
      'Front road at main entrance'
    ),
    PATH_PER21_FRONT_S1: createGraphPathAtEntranceX(
      'PER21_SIDE_ENTRANCE_1',
      FRONT_ROAD_Z,
      'Front road at side entrance 1'
    ),
    PATH_PER21_FRONT_A: { x: 115, z: 25, label: "Walkway toward Bd de Pérolles crossing", type: "path" },

    CROSSING_BD_PEROLLES: { x: 115, z: 25, label: "Crossing over Bd de Pérolles", type: "crossing" },
    PATH_MENSA_FRONT: {
      x: mensaEntrance.x,
      z: mensaEntrance.z,
      label: "Path in front of Mensa",
      type: "path"
    },

    PATH_MENSA_WEST: createGraphPathAtEntranceX(
      'MENSA_ENTRANCE',
      getEntrancePosition('MENSA_SIDE_ENTRANCE').z,
      'Path along west side of Mensa'
    ),
    PATH_MENSA_SOUTH: { x: MENSA_EAST_PATH_X, z: MENSA_SOUTH_PATH_Z, label: "Path south of Mensa", type: "path" },

    PATH_MENSA_NORTH_DROP: createGraphPathAtEntranceX(
      'MENSA_ENTRANCE',
      MENSA_NORTH_PATH_Z,
      'Path north of Mensa entrance'
    ),
    PATH_MENSA_EAST_NORTH: { x: MENSA_EAST_PATH_X, z: MENSA_NORTH_PATH_Z, label: "Path east of Mensa (north edge)", type: "path" },
    PATH_MENSA_EAST_SOUTH: { x: MENSA_EAST_PATH_X, z: MENSA_SOUTH_PATH_Z, label: "Path east of Mensa (south edge)", type: "path" },
    PATH_MENSA_PER17_LINK: {
      x: 185,
      z: MENSA_SOUTH_PATH_Z,
      label: "Path east of Mensa toward PER17 main entrance",
      type: "path"
    },
    PATH_PER17_SOUTH_MID: {
      x: per17Entrance.x,
      z: MENSA_SOUTH_PATH_Z,
      label: "Path south of PER17 at main entrance",
      type: "path"
    },

    PATH_PER17_FRONT: {
      x: per17Entrance.x,
      z: -40,
      label: "Path in front of PER17 main entrance",
      type: "path"
    },
    PATH_PER17_BACK: {
      x: per17BackEntrance.x,
      z: -40,
      label: "Path in front of PER17 back entrance",
      type: "path"
    },

    PATH_PER21_BACK_A: createGraphPathAtEntranceX(
      'PER21_BACK_ENTRANCE',
      85,
      'Back path at back entrance'
    ),
    PATH_PER21_BACK_BE1: createGraphPathAtEntranceX(
      'PER21_BACK_ENTRANCE_1',
      85,
      'Back path at back entrance 1'
    ),
    PATH_PER21_BACK_BE2: createGraphPathAtEntranceX(
      'PER21_BACK_ENTRANCE_2',
      85,
      'Back path at back entrance 2'
    ),

    PATH_PER21_AROUND_EAST_BACK: { x: PER21_EAST_X, z: 85, label: "East side path behind PER21", type: "path" },
    PATH_PER21_AROUND_EAST_MID: { x: PER21_EAST_X, z: 56, label: "East side path mid PER21", type: "path" },
    PATH_PER21_AROUND_EAST_FRONT: { x: PER21_EAST_X, z: FRONT_ROAD_Z, label: "East side path to front road", type: "path" }
  },

  edges: [
    ["PER22_ENTRANCE", "PATH_PER22_FRONT"],
    ["PATH_PER22_FRONT", "PATH_PER21_FRONT_WEST"],

    ["PER21_END_SIDE_ENTRANCE", "PATH_PER21_FRONT_WEST"],
    ["PATH_PER21_FRONT_WEST", "PATH_PER21_FRONT_S3"],
    ["PER21_SIDE_ENTRANCE_3", "PATH_PER21_FRONT_S3"],
    ["PATH_PER21_FRONT_S3", "PATH_PER21_FRONT_S2"],
    ["PER21_SIDE_ENTRANCE_2", "PATH_PER21_FRONT_S2"],
    ["PATH_PER21_FRONT_S2", "PATH_PER21_FRONT_MAIN"],
    ["PER21_MAIN_ENTRANCE", "PATH_PER21_FRONT_MAIN"],
    ["PATH_PER21_FRONT_MAIN", "PATH_PER21_FRONT_S1"],
    ["PER21_SIDE_ENTRANCE_1", "PATH_PER21_FRONT_S1"],
    ["PER21_SIDE_ENTRANCE", "PATH_PER21_FRONT_S1"],
    ["PATH_PER21_FRONT_S1", "PATH_PER21_AROUND_EAST_FRONT"],
    ["PATH_PER21_AROUND_EAST_FRONT", "PATH_PER21_FRONT_A"],
    ["PATH_PER21_FRONT_A", "CROSSING_BD_PEROLLES"],
    ["CROSSING_BD_PEROLLES", "PATH_MENSA_FRONT"],
    ["PATH_MENSA_FRONT", "MENSA_ENTRANCE"],

    ["MENSA_ENTRANCE", "PATH_MENSA_NORTH_DROP"],
    ["PATH_MENSA_NORTH_DROP", "PATH_MENSA_EAST_NORTH"],
    ["PATH_MENSA_EAST_NORTH", "PATH_MENSA_EAST_SOUTH"],
    ["PATH_MENSA_EAST_SOUTH", "PATH_MENSA_PER17_LINK"],
    ["PATH_MENSA_PER17_LINK", "PATH_PER17_SOUTH_MID"],
    ["PATH_PER17_SOUTH_MID", "PATH_PER17_FRONT"],
    ["PATH_PER17_FRONT", "PER17_ENTRANCE"],
    ["PATH_PER17_FRONT", "PATH_PER17_BACK"],
    ["PATH_PER17_BACK", "PER17_BACK_ENTRANCE"],

    ["MENSA_SIDE_ENTRANCE", "PATH_MENSA_WEST"],
    ["PATH_MENSA_WEST", "PATH_MENSA_SOUTH"],
    ["PATH_MENSA_SOUTH", "PATH_MENSA_PER17_LINK"],

    ["PER21_BACK_ENTRANCE", "PATH_PER21_BACK_A"],
    ["PATH_PER21_BACK_A", "PATH_PER21_BACK_BE1"],
    ["PER21_BACK_ENTRANCE_1", "PATH_PER21_BACK_BE1"],
    ["PATH_PER21_BACK_BE1", "PATH_PER21_BACK_BE2"],
    ["PER21_BACK_ENTRANCE_2", "PATH_PER21_BACK_BE2"],

    ["PATH_PER21_BACK_BE1", "PATH_PER21_AROUND_EAST_BACK"],
    ["PATH_PER21_BACK_BE2", "PATH_PER21_AROUND_EAST_BACK"],
    ["PATH_PER21_AROUND_EAST_BACK", "PATH_PER21_AROUND_EAST_MID"],
    ["PATH_PER21_AROUND_EAST_MID", "PATH_PER21_AROUND_EAST_FRONT"],
    ["PATH_PER21_AROUND_EAST_FRONT", "PATH_PER21_FRONT_S1"]
  ]
};
