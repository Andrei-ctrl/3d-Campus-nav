import {
  PER21_MAIN_HALL_X,
  PER21_MAIN_HALL_TURN_OFFSET,
  PER21_BACK_CLASSROOM_Z,
  PER21_FRONT_UPPER_Z,
  PER21_LAYOUT_SIZES,
  PER21_SIDE_ENTRANCE_CORES,
  per21ClassroomNodes,
  per21CorridorStops
} from './per21Layout.js';

const BUILDING_A_EDGE = 132;
const BUILDING_H_EDGE = -10;

/** Back-entrance local x positions (metres). */
const BACK_ENTRANCE_X = [61, 97, 123];

/** Ground-floor public-area x positions (metres). */
const PUBLIC_AREA_X = [12, 50, 72, 80, 87, 94];

const CENTER_Z = 56;
const CLASSROOM_ROW_Z = PER21_BACK_CLASSROOM_Z - PER21_LAYOUT_SIZES.cubeWidth / 2;

function round1(value) {
  return Math.round(value * 10) / 10;
}

function dedupeSortedXs(values, minGap = 0.5) {
  const sorted = [...new Set(values.map(round1))].sort((left, right) => left - right);

  if (!sorted.length) {
    return sorted;
  }

  const merged = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const value = sorted[index];
    const last = merged[merged.length - 1];

    if (value - last >= minGap) {
      merged.push(value);
    }
  }

  return merged;
}

/** Short corridor spine along the full PER21 length (centre line). */
export function buildCenterSpineAnchors() {
  return dedupeSortedXs([
    BUILDING_H_EDGE,
    ...per21CorridorStops.map((stop) => stop.x),
    BUILDING_A_EDGE,
    ...PER21_SIDE_ENTRANCE_CORES.map((core) => core.localX),
    ...BACK_ENTRANCE_X,
    ...PUBLIC_AREA_X,
    PER21_MAIN_HALL_X - PER21_MAIN_HALL_TURN_OFFSET,
    PER21_MAIN_HALL_X,
    PER21_MAIN_HALL_X + PER21_MAIN_HALL_TURN_OFFSET
  ]);
}

/** Centre spine split at the C/B wing boundary (A/B reached via main-hall right turn). */
export function buildCenterSpineSegments() {
  const anchors = buildCenterSpineAnchors();
  const cX = per21CorridorStops.find((stop) => stop.key === 'C_ROOMS')?.x ?? 79.7;
  const bX = per21CorridorStops.find((stop) => stop.key === 'B_ROOMS')?.x ?? 98.4;

  return {
    cWing: anchors.filter((x) => x <= cX + 0.1),
    abWing: anchors.filter((x) => x >= bX - 0.1)
  };
}

/** Classroom-row spine anchors for a given floor (one node beside each bay). */
export function buildClassroomRowAnchors(floor) {
  return dedupeSortedXs(
    per21ClassroomNodes
      .filter((room) => room.floor === floor)
      .map((room) => room.x),
    0.1
  );
}

/** Classroom row split at the C/B boundary (matches centre-spine split). */
export function buildClassroomRowSegments(floor) {
  const anchors = buildClassroomRowAnchors(floor);
  const bX = per21CorridorStops.find((stop) => stop.key === 'B_ROOMS')?.x ?? 98.4;

  return {
    cWing: anchors.filter((x) => x < bX - 1),
    abWing: anchors.filter((x) => x >= bX - 1)
  };
}

export function spineNodeId(kind, floor, x) {
  const xTag = String(Math.round(x * 10)).padStart(4, '0');
  return `PER21_SPINE_${kind}_F${floor}_X${xTag}`;
}

export function roomApproachId(roomId) {
  return `PER21_${roomId}_APPROACH`;
}

export function nearestAnchor(anchors, x) {
  return anchors.reduce((nearest, anchor) => (
    Math.abs(anchor - x) < Math.abs(nearest - x) ? anchor : nearest
  ));
}

export function chainEdges(nodeIds) {
  const edges = [];

  for (let index = 0; index < nodeIds.length - 1; index += 1) {
    edges.push([nodeIds[index], nodeIds[index + 1]]);
  }

  return edges;
}

export const PER21_SPINE_Z = {
  center: CENTER_Z,
  classroomRow: CLASSROOM_ROW_Z,
  frontUpper: PER21_FRONT_UPPER_Z
};

export const PER21_SPINE_FLOORS = [0, 1, 2, 3, 4];

export const PER21_CLASSROOM_ROW_FLOORS = [1, 2];
