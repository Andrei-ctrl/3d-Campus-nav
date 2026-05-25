// Coordinate convention:
// 1 Three.js unit = approximately 1 meter.
// x/z form the horizontal map plane.
// y is height.
// The campus model has been rotated +15° so that PER21 and PER17 align with the x-axis.

export const GROUND_FLOOR_HEIGHT = 4;
export const UPPER_FLOOR_HEIGHT = 3;

export function buildingHeight(floors) {
  if (floors <= 0) {
    return 0;
  }

  return GROUND_FLOOR_HEIGHT + Math.max(0, floors - 1) * UPPER_FLOOR_HEIGHT;
}

export function floorElevation(floor = 0) {
  const normalizedFloor = Math.max(0, Number(floor) || 0);

  if (normalizedFloor === 0) {
    return 0;
  }

  return GROUND_FLOOR_HEIGHT + (normalizedFloor - 1) * UPPER_FLOOR_HEIGHT;
}

export function floorDistance(startFloor = 0, endFloor = 0) {
  return floorElevation(endFloor) - floorElevation(startFloor);
}

export const buildings = [
  {
    id: "PER21",
    name: "Pérolles 21",
    type: "Building",
    description: "Main PER21 building, approx. 132m x 38m based on the measured floor plan sketch",
    position: { x: 10, y: 0, z: 56 },
    size: { length: 132, width: 38, height: buildingHeight(5) },
    floors: 5,
    rotationDeg: 0,
    color: "#0057b8"
  },
  {
    id: "PER22",
    name: "Pérolles 22",
    type: "Building",
    description: "PER22 / BP2 library block, approx. 27m x 27m",
    position: { x: 0, y: 0, z: 0 },
    size: { length: 27, width: 27, height: buildingHeight(2) },
    floors: 2,
    rotationDeg: 180,
    color: "#008f45",
    attachedTo: "PER21",
    attachToEnd: "start",
    attachMode: "sideAtEnd",
    attachSide: "right",
    sideInset: 7.5
  },
  {
    id: "MENSA",
    name: "Mensa Pérolles",
    type: "Building",
    description: "Mensa Pérolles building, located on the opposite side of Bd de Pérolles from PER21",
    position: { x: 160.07, y: 0, z: 17.53 },
    size: { length: 62, width: 20, height: buildingHeight(4) },
    floors: 4,
    rotationDeg: 90,
    color: "#c46a21"
  },
  {
    id: "PER17",
    name: "Pérolles 17",
    type: "Building",
    description: "PER17 building, approx. 69m x 16m, located about 34m from Mensa",
    position: { x: 233.56, y: 0, z: -24.9 },
    size: { length: 69, width: 16, height: buildingHeight(2) },
    floors: 2,
    rotationDeg: 0,
    color: "#b8947a"
  }
];
