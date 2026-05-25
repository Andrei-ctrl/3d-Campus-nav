import { graph } from '../src/data/graph.js';
import { per21IndoorGraph } from '../src/data/per21IndoorGraph.js';
import { per22IndoorGraph } from '../src/data/per22IndoorGraph.js';
import { planCrossBuildingRoute } from '../src/navigation/campusRoute.js';
import { findShortestPath } from '../src/navigation/dijkstra.js';

const indoorGraphs = {
  PER21: per21IndoorGraph,
  PER22: per22IndoorGraph
};

function isDestinationIndoorSegment(segment, toDestination) {
  const destinationNodeId = toDestination?.room?.indoorNodeId;
  if (!destinationNodeId || !segment?.path?.length) return false;
  return segment.path[segment.path.length - 1] === destinationNodeId;
}

function buildRouteSegments(routePlan, toDestination = null) {
  const segments = [];
  const indoorSegs = routePlan.indoorSegments ?? [];
  const outdoor = routePlan.outdoorPath ?? [];
  const hasOutdoor = outdoor.length >= 2;

  if (hasOutdoor) {
    const sourceIndoor = indoorSegs.find(
      (segment) => segment.path?.length >= 2 && !isDestinationIndoorSegment(segment, toDestination)
    ) ?? null;
    const destIndoor = indoorSegs.find(
      (segment) => segment.path?.length >= 2 && isDestinationIndoorSegment(segment, toDestination)
    ) ?? null;

    if (sourceIndoor) {
      segments.push({ graph: sourceIndoor.graph, pathNodeIds: sourceIndoor.path });
    }

    segments.push({ graph, pathNodeIds: outdoor });

    if (destIndoor) {
      segments.push({ graph: destIndoor.graph, pathNodeIds: destIndoor.path });
    }
  } else {
    indoorSegs.forEach((seg) => {
      if (seg.path?.length >= 2) {
        segments.push({ graph: seg.graph, pathNodeIds: seg.path });
      }
    });
  }

  return segments;
}

function verifyRoute(name, fromDestination, toDestination) {
  const routePlan = planCrossBuildingRoute(fromDestination, toDestination, indoorGraphs);

  if (!routePlan.ok) {
    console.error(`FAIL ${name}: ${routePlan.error}`);
    return false;
  }

  const segments = buildRouteSegments(routePlan, toDestination);

  if (segments.length === 0) {
    console.error(`FAIL ${name}: no AR segments`);
    return false;
  }

  const firstNodeId = segments[0].pathNodeIds[0];
  const firstNode = segments[0].graph.nodes[firstNodeId];

  if (!firstNode) {
    console.error(`FAIL ${name}: missing anchor node ${firstNodeId}`);
    return false;
  }

  let prev = null;
  let pointCount = 0;

  segments.forEach(({ graph: segGraph, pathNodeIds }, segmentIndex) => {
    const nodeIds = segmentIndex > 0 && pointCount > 0 ? pathNodeIds.slice(1) : pathNodeIds;

    nodeIds.forEach((nodeId) => {
      const node = segGraph.nodes[nodeId];

      if (!node) {
        console.error(`FAIL ${name}: missing node ${nodeId}`);
        return;
      }

      if (prev) {
        const jump = Math.hypot(node.x - prev.x, node.z - prev.z);

        if (jump > 120) {
          console.warn(`WARN ${name}: large jump ${jump.toFixed(1)}m between ${prev.id} and ${nodeId}`);
        }
      }

      prev = { id: nodeId, x: node.x, z: node.z };
      pointCount += 1;
    });
  });

  console.log(`OK ${name}: ${segments.length} segment(s), ${pointCount} route points, anchor ${firstNodeId} @ (${firstNode.x}, ${firstNode.z})`);
  return true;
}

// PER21 main entrance → PER22 library room
const per22Library = {
  type: 'room',
  defaultEntranceId: 'PER22_ENTRANCE',
  room: {
    buildingId: 'PER22',
    indoorNodeId: 'PER22_LIBRARY',
    name: 'PER22 Library',
    nearestEntranceId: 'PER22_ENTRANCE'
  }
};

const per21Entrance = {
  type: 'anchor',
  defaultEntranceId: 'PER21_MAIN_ENTRANCE'
};

const per21Room = {
  type: 'room',
  defaultEntranceId: 'PER21_MAIN_ENTRANCE',
  room: {
    buildingId: 'PER21',
    indoorNodeId: 'PER21_B130',
    name: 'B130',
    nearestEntranceId: 'PER21_MAIN_ENTRANCE'
  }
};

// Same-building room→room
const indoorPath = findShortestPath(per21IndoorGraph, 'PER21_B130', 'PER21_C130');
const sameBuildingPlan = {
  outdoorPath: [],
  indoorSegments: [{
    buildingId: 'PER21',
    graph: per21IndoorGraph,
    path: indoorPath
  }]
};

let ok = true;
ok &&= verifyRoute('PER21 entrance → PER22 library', per21Entrance, per22Library);
ok &&= verifyRoute('PER21 B130 → PER22 library', per21Room, per22Library);

// Bridge route if chosen by planner
const bridgeFrom = {
  type: 'room',
  defaultEntranceId: 'PER21_MAIN_ENTRANCE',
  room: {
    buildingId: 'PER21',
    indoorNodeId: 'PER21_B130',
    name: 'B130',
    nearestEntranceId: 'PER21_MAIN_ENTRANCE'
  }
};
const bridgePlan = planCrossBuildingRoute(bridgeFrom, per22Library, indoorGraphs);
if (bridgePlan.ok && bridgePlan.mode === 'indoor-bridge') {
  ok &&= verifyRoute('PER21 B130 → PER22 library (bridge)', bridgeFrom, per22Library);
} else {
  console.log(`INFO bridge not selected (mode=${bridgePlan.mode ?? bridgePlan.error})`);
}

const sameSegs = buildRouteSegments(sameBuildingPlan, {
  type: 'room',
  room: { buildingId: 'PER21', indoorNodeId: 'PER21_C130' }
});
console.log(`${sameSegs.length === 1 ? 'OK' : 'FAIL'} same-building room→room: ${sameSegs.length} segment(s)`);

process.exit(ok && sameSegs.length === 1 ? 0 : 1);
