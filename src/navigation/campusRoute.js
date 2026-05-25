import { graph } from '../data/graph.js';
import { findShortestPath } from './dijkstra.js';
import { calculateRouteDistance } from './routeRenderer.js';
import { getEntranceBuildingId } from '../data/per21EntranceRouting.js';
import { floorDistance } from '../data/buildings.js';

const INDOOR_BUILDING_BRIDGES = [
  {
    id: 'PER22_PER21',
    buildings: ['PER22', 'PER21'],
    nodes: {
      PER22: 'PER22_PER21_CONNECTION',
      PER21: 'PER21_PER22_CONNECTION_ENTRANCE'
    },
    cost: 15
  }
];

function calculateIndoorRouteDistance(indoorGraph, pathNodeIds) {
  if (!pathNodeIds || pathNodeIds.length < 2) {
    return 0;
  }

  let total = 0;

  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const startNode = indoorGraph.nodes[pathNodeIds[i]];
    const endNode = indoorGraph.nodes[pathNodeIds[i + 1]];

    if (!startNode || !endNode) continue;

    const dx = endNode.x - startNode.x;
    const dz = endNode.z - startNode.z;
    const floorDelta = floorDistance(startNode.floor || 0, endNode.floor || 0);

    total += Math.sqrt(dx * dx + dz * dz + floorDelta * floorDelta);
  }

  return total;
}

function getEntranceIdForDestination(destination) {
  return destination?.defaultEntranceId || null;
}

function findIndoorBridge(fromBuildingId, toBuildingId) {
  return INDOOR_BUILDING_BRIDGES.find(
    (bridge) =>
      bridge.buildings.includes(fromBuildingId) &&
      bridge.buildings.includes(toBuildingId) &&
      fromBuildingId !== toBuildingId
  );
}

function planBridgeRouteBetweenBuildings({
  fromEntranceId,
  toEntranceId,
  fromDestination,
  toDestination,
  indoorGraphs
}) {
  const fromBuildingId = fromDestination?.room?.buildingId
    ?? getEntranceBuildingId(fromEntranceId);
  const toBuildingId = toDestination?.room?.buildingId
    ?? (toDestination?.type === 'building' ? toDestination.id : getEntranceBuildingId(toEntranceId));

  if (!fromBuildingId || !toBuildingId || fromBuildingId === toBuildingId) {
    return null;
  }

  const bridge = findIndoorBridge(fromBuildingId, toBuildingId);

  if (!bridge) {
    return null;
  }

  const fromGraph = indoorGraphs[fromBuildingId];
  const toGraph = indoorGraphs[toBuildingId];

  if (!fromGraph || !toGraph) {
    return null;
  }

  const fromBridgeNodeId = bridge.nodes[fromBuildingId];
  const toBridgeNodeId = bridge.nodes[toBuildingId];

  const sourceStartId = fromDestination?.type === 'room'
    ? fromDestination.room.indoorNodeId
    : fromEntranceId;
  const destEndId = toDestination?.type === 'room'
    ? toDestination.room.indoorNodeId
    : toEntranceId;

  const sourcePath = findShortestPath(fromGraph, sourceStartId, fromBridgeNodeId);
  const destPath = findShortestPath(toGraph, toBridgeNodeId, destEndId);

  if (!sourcePath.length || !destPath.length) {
    return null;
  }

  const distance =
    calculateIndoorRouteDistance(fromGraph, sourcePath) +
    bridge.cost +
    calculateIndoorRouteDistance(toGraph, destPath);

  return {
    mode: 'indoor-bridge',
    outdoorPath: [],
    outdoorDistance: 0,
    indoorSegments: [
      { buildingId: fromBuildingId, graph: fromGraph, path: sourcePath },
      { buildingId: toBuildingId, graph: toGraph, path: destPath }
    ],
    indoorPath: [...sourcePath, ...destPath.slice(1)],
    distance,
    note: 'Route via indoor passage between buildings.'
  };
}

function planIndoorBridgeRoute(fromDestination, toDestination, indoorGraphs) {
  return planBridgeRouteBetweenBuildings({
    fromEntranceId: getEntranceIdForDestination(fromDestination),
    toEntranceId: getEntranceIdForDestination(toDestination),
    fromDestination,
    toDestination,
    indoorGraphs
  });
}

function planIndoorFromEntranceToRoom(fromEntranceId, toDestination, indoorGraphs) {
  const buildingId = toDestination.room?.buildingId;

  if (!buildingId) {
    return {
      ok: false,
      error: 'Destination room is missing building information.'
    };
  }

  const indoorGraph = indoorGraphs[buildingId];

  if (!indoorGraph) {
    return {
      ok: false,
      error: `Indoor graph not available for ${buildingId}.`
    };
  }

  const indoorPath = findShortestPath(
    indoorGraph,
    fromEntranceId,
    toDestination.room.indoorNodeId
  );

  if (!indoorPath.length) {
    return {
      ok: false,
      error: `No indoor path from ${fromEntranceId} to ${toDestination.room.name}.`
    };
  }

  const distance = calculateIndoorRouteDistance(indoorGraph, indoorPath);

  return {
    ok: true,
    mode: 'indoor',
    outdoorPath: [],
    outdoorDistance: 0,
    indoorSegments: [{
      buildingId,
      graph: indoorGraph,
      path: indoorPath
    }],
    indoorPath,
    distance,
    note: ''
  };
}

export function planCrossBuildingRoute(fromDestination, toDestination, indoorGraphs) {
  if (!fromDestination || !toDestination) {
    return {
      ok: false,
      error: 'Start or destination not found.'
    };
  }

  const fromIsRoom = fromDestination.type === 'room';
  const toIsRoom = toDestination.type === 'room';

  const fromEntranceId = getEntranceIdForDestination(fromDestination);
  const toEntranceId = getEntranceIdForDestination(toDestination);

  if (!fromEntranceId || !toEntranceId) {
    return {
      ok: false,
      error: 'Missing entrance for route planning.'
    };
  }

  const fromBuildingId = fromIsRoom
    ? fromDestination.room?.buildingId
    : getEntranceBuildingId(fromEntranceId);
  const toBuildingId = toIsRoom
    ? toDestination.room?.buildingId
    : getEntranceBuildingId(toEntranceId);

  if (!fromIsRoom && toIsRoom && fromBuildingId && fromBuildingId === toBuildingId) {
    return planIndoorFromEntranceToRoom(fromEntranceId, toDestination, indoorGraphs);
  }

  if (fromBuildingId && toBuildingId && fromBuildingId !== toBuildingId) {
    const bridgeRoute = planBridgeRouteBetweenBuildings({
      fromEntranceId,
      toEntranceId,
      fromDestination: fromIsRoom ? fromDestination : null,
      toDestination: toIsRoom || toDestination.type === 'building' ? toDestination : null,
      indoorGraphs
    });

    if (bridgeRoute) {
      return { ok: true, ...bridgeRoute };
    }
  }

  if (fromIsRoom && toIsRoom) {
    const bridgeRoute = planIndoorBridgeRoute(fromDestination, toDestination, indoorGraphs);

    if (bridgeRoute) {
      const fromGraph = indoorGraphs[fromDestination.room.buildingId];
      const toGraph = indoorGraphs[toDestination.room.buildingId];

      const sourceExitPath = findShortestPath(
        fromGraph,
        fromDestination.room.indoorNodeId,
        fromEntranceId
      );
      const outdoorPath = findShortestPath(graph, fromEntranceId, toEntranceId);
      const destEntryPath = findShortestPath(
        toGraph,
        toEntranceId,
        toDestination.room.indoorNodeId
      );

      const outdoorPlanDistance =
        calculateIndoorRouteDistance(fromGraph, sourceExitPath) +
        calculateRouteDistance(graph, outdoorPath) +
        calculateIndoorRouteDistance(toGraph, destEntryPath);

      const outdoorPlanOk =
        sourceExitPath.length > 0 &&
        outdoorPath.length > 0 &&
        destEntryPath.length > 0;

      if (!outdoorPlanOk || bridgeRoute.distance <= outdoorPlanDistance) {
        return { ok: true, ...bridgeRoute };
      }
    }
  }

  const indoorSegments = [];
  let sourceIndoorPath = [];

  if (fromIsRoom) {
    const fromGraph = indoorGraphs[fromDestination.room.buildingId];

    if (!fromGraph) {
      return { ok: false, error: 'Indoor graph not available for start room.' };
    }

    sourceIndoorPath = findShortestPath(
      fromGraph,
      fromDestination.room.indoorNodeId,
      fromEntranceId
    );

    if (!sourceIndoorPath.length) {
      return {
        ok: false,
        error: `No indoor path from ${fromDestination.room.name} to exit.`
      };
    }

    indoorSegments.push({
      buildingId: fromDestination.room.buildingId,
      graph: fromGraph,
      path: sourceIndoorPath
    });
  }

  const outdoorPath = findShortestPath(graph, fromEntranceId, toEntranceId);

  if (!outdoorPath.length) {
    return {
      ok: false,
      error: `No outdoor path from ${fromEntranceId} to ${toEntranceId}.`
    };
  }

  let destIndoorPath = [];

  if (toIsRoom) {
    const toGraph = indoorGraphs[toDestination.room.buildingId];

    if (!toGraph) {
      return { ok: false, error: 'Indoor graph not available for destination room.' };
    }

    destIndoorPath = findShortestPath(
      toGraph,
      toEntranceId,
      toDestination.room.indoorNodeId
    );

    if (!destIndoorPath.length) {
      return {
        ok: false,
        error: `No indoor path from entrance to ${toDestination.room.name}.`
      };
    }

    indoorSegments.push({
      buildingId: toDestination.room.buildingId,
      graph: toGraph,
      path: destIndoorPath
    });
  }

  const outdoorDistance = calculateRouteDistance(graph, outdoorPath);
  let indoorDistance = 0;

  indoorSegments.forEach(({ graph: indoorGraph, path }) => {
    indoorDistance += calculateIndoorRouteDistance(indoorGraph, path);
  });

  const indoorPath = [...sourceIndoorPath, ...destIndoorPath];

  return {
    ok: true,
    mode: 'outdoor',
    outdoorPath,
    outdoorDistance,
    indoorSegments,
    indoorPath,
    distance: outdoorDistance + indoorDistance,
    note: ''
  };
}
