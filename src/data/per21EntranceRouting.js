import { per21IndoorGraph } from './per21IndoorGraph.js';
import { findShortestPath } from '../navigation/dijkstra.js';
import { FLOOR_HEIGHT } from './buildings.js';

export const PER21_INDOOR_ENTRANCE_IDS = [
  'PER21_MAIN_ENTRANCE',
  'PER21_SIDE_ENTRANCE_1',
  'PER21_SIDE_ENTRANCE_2',
  'PER21_SIDE_ENTRANCE_3',
  'PER21_END_SIDE_ENTRANCE',
  'PER21_PER22_CONNECTION_ENTRANCE',
  'PER21_BACK_ENTRANCE',
  'PER21_BACK_ENTRANCE_1',
  'PER21_BACK_ENTRANCE_2'
];

function indoorPathDistance(graph, pathNodeIds) {
  if (!pathNodeIds || pathNodeIds.length < 2) {
    return Infinity;
  }

  let total = 0;

  for (let index = 0; index < pathNodeIds.length - 1; index += 1) {
    const start = graph.nodes[pathNodeIds[index]];
    const end = graph.nodes[pathNodeIds[index + 1]];

    if (!start || !end) {
      return Infinity;
    }

    const floorDelta = ((end.floor || 0) - (start.floor || 0)) * FLOOR_HEIGHT;
    total += Math.hypot(end.x - start.x, end.z - start.z, floorDelta);
  }

  return total;
}

export function getNearestPer21EntranceForNode(indoorNodeId, graph = per21IndoorGraph) {
  let bestEntranceId = 'PER21_MAIN_ENTRANCE';
  let bestDistance = Infinity;

  PER21_INDOOR_ENTRANCE_IDS.forEach((entranceId) => {
    if (!graph.nodes[entranceId] || !graph.nodes[indoorNodeId]) {
      return;
    }

    const path = findShortestPath(graph, entranceId, indoorNodeId);

    if (!path.length) {
      return;
    }

    const distance = indoorPathDistance(graph, path);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestEntranceId = entranceId;
    }
  });

  return bestEntranceId;
}

export function getEntranceBuildingId(entranceId) {
  if (!entranceId) {
    return null;
  }

  if (entranceId.startsWith('PER21')) {
    return 'PER21';
  }

  if (entranceId.startsWith('PER22')) {
    return 'PER22';
  }

  if (entranceId.startsWith('PER17')) {
    return 'PER17';
  }

  if (entranceId.startsWith('MENSA')) {
    return 'MENSA';
  }

  return null;
}
