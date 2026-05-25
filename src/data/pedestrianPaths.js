import { getEntrancePosition } from './entranceUtils.js';

const FRONT_ROAD_Z = 30;
const PER21_EAST_X = 82;
const MENSA_EAST_PATH_X = 175;
const MENSA_NORTH_PATH_Z = 50;
const MENSA_SOUTH_PATH_Z = -20;

function entrancePoint(entranceId) {
  const position = getEntrancePosition(entranceId);

  return { x: position.x, z: position.z };
}

function dropEntranceToFrontRoad(entranceId) {
  const entrance = entrancePoint(entranceId);

  return [entrance, { x: entrance.x, z: FRONT_ROAD_Z }];
}

const per22Entrance = entrancePoint('PER22_ENTRANCE');
const per21EndEntrance = entrancePoint('PER21_END_SIDE_ENTRANCE');
const per21Side3Entrance = entrancePoint('PER21_SIDE_ENTRANCE_3');
const per21Side2Entrance = entrancePoint('PER21_SIDE_ENTRANCE_2');
const per21MainEntrance = entrancePoint('PER21_MAIN_ENTRANCE');
const per21Side1Entrance = entrancePoint('PER21_SIDE_ENTRANCE_1');
const mensaEntrance = entrancePoint('MENSA_ENTRANCE');
const mensaSideEntrance = entrancePoint('MENSA_SIDE_ENTRANCE');
const per17Entrance = entrancePoint('PER17_ENTRANCE');
const per17BackEntrance = entrancePoint('PER17_BACK_ENTRANCE');
const per21BackEntrance = entrancePoint('PER21_BACK_ENTRANCE');
const per21BackEntrance1 = entrancePoint('PER21_BACK_ENTRANCE_1');
const per21BackEntrance2 = entrancePoint('PER21_BACK_ENTRANCE_2');

export const pedestrianPaths = [
  {
    id: "PATH_PER21_FRONT_SPINE",
    name: "Main pedestrian road in front of PER21",
    width: 3,
    color: "#b8b8b8",
    points: [
      { x: per22Entrance.x, z: FRONT_ROAD_Z },
      { x: per21EndEntrance.x, z: FRONT_ROAD_Z },
      { x: per21Side3Entrance.x, z: FRONT_ROAD_Z },
      { x: per21Side2Entrance.x, z: FRONT_ROAD_Z },
      { x: per21MainEntrance.x, z: FRONT_ROAD_Z },
      { x: per21Side1Entrance.x, z: FRONT_ROAD_Z },
      { x: 95, z: 28 },
      { x: 115, z: 25 },
      { x: mensaEntrance.x, z: mensaEntrance.z }
    ]
  },
  {
    id: "PATH_PER22_TO_FRONT_ROAD",
    name: "PER22 entrance to main front road",
    width: 3,
    color: "#b8b8b8",
    points: dropEntranceToFrontRoad('PER22_ENTRANCE')
  },
  {
    id: "PATH_PER21_DROP_END",
    name: "End side entrance to front road",
    width: 3,
    color: "#b8b8b8",
    points: dropEntranceToFrontRoad('PER21_END_SIDE_ENTRANCE')
  },
  {
    id: "PATH_PER21_DROP_S3",
    name: "Side entrance 3 to front road",
    width: 3,
    color: "#b8b8b8",
    points: dropEntranceToFrontRoad('PER21_SIDE_ENTRANCE_3')
  },
  {
    id: "PATH_PER21_DROP_S2",
    name: "Side entrance 2 to front road",
    width: 3,
    color: "#b8b8b8",
    points: dropEntranceToFrontRoad('PER21_SIDE_ENTRANCE_2')
  },
  {
    id: "PATH_PER21_DROP_MAIN",
    name: "Main entrance to front road",
    width: 3,
    color: "#b8b8b8",
    points: dropEntranceToFrontRoad('PER21_MAIN_ENTRANCE')
  },
  {
    id: "PATH_PER21_DROP_S1",
    name: "Side entrance 1 to front road",
    width: 3,
    color: "#b8b8b8",
    points: dropEntranceToFrontRoad('PER21_SIDE_ENTRANCE_1')
  },
  {
    id: "PATH_PER21_AROUND_EAST",
    name: "Alternative path around east side of PER21 (back to front road)",
    width: 3,
    color: "#9e9e9e",
    points: [
      per21BackEntrance2,
      { x: per21BackEntrance2.x, z: 85 },
      { x: PER21_EAST_X, z: 85 },
      { x: PER21_EAST_X, z: 56 },
      { x: PER21_EAST_X, z: FRONT_ROAD_Z },
      { x: per21Side1Entrance.x, z: FRONT_ROAD_Z }
    ]
  },
  {
    id: "PATH_AROUND_MENSA",
    name: "Pedestrian path around Mensa (west and south)",
    width: 3,
    color: "#b8b8b8",
    points: [
      mensaEntrance,
      { x: mensaEntrance.x, z: mensaSideEntrance.z },
      mensaSideEntrance,
      { x: MENSA_EAST_PATH_X, z: MENSA_SOUTH_PATH_Z }
    ]
  },
  {
    id: "PATH_MENSA_TO_PER17_MAIN",
    name: "Pedestrian path from Mensa to PER17 main entrance",
    width: 3,
    color: "#b8b8b8",
    points: [
      { x: MENSA_EAST_PATH_X, z: MENSA_SOUTH_PATH_Z },
      { x: per17Entrance.x, z: MENSA_SOUTH_PATH_Z },
      { x: per17Entrance.x, z: -40 },
      per17Entrance
    ]
  },
  {
    id: "PATH_PER17_BACK_DROP",
    name: "Drop from PER17 back lane to back entrance",
    width: 3,
    color: "#b8b8b8",
    points: [
      { x: per17BackEntrance.x, z: -40 },
      per17BackEntrance
    ]
  },
  {
    id: "PATH_PER17_MAIN_DROP",
    name: "Drop from PER17 front lane to main entrance",
    width: 3,
    color: "#b8b8b8",
    points: [
      { x: per17Entrance.x, z: -40 },
      per17Entrance
    ]
  },
  {
    id: "PATH_PER17_BACK_LANE",
    name: "Pedestrian lane in front of PER17 entrances",
    width: 3,
    color: "#b8b8b8",
    points: [
      { x: per17Entrance.x, z: -40 },
      { x: per17BackEntrance.x, z: -40 }
    ]
  },
  {
    id: "PATH_PER21_BACK",
    name: "Pedestrian path behind PER21",
    width: 3,
    color: "#b8b8b8",
    points: [
      per21BackEntrance,
      { x: per21BackEntrance.x, z: 85 },
      { x: per21BackEntrance1.x, z: 85 },
      { x: per21BackEntrance2.x, z: 85 },
      per21BackEntrance2
    ]
  },
  {
    id: "PATH_PER21_BACK_BE1_DROP",
    name: "Straight drop from back entrance 1 to back path",
    width: 3,
    color: "#b8b8b8",
    points: [
      per21BackEntrance1,
      { x: per21BackEntrance1.x, z: 85 }
    ]
  }
];
