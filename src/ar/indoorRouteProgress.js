import * as THREE from 'three';
import { convertMapPointToAnchorRelative } from './arRouteAdapter.js';
import { FLOOR_HEIGHT } from '../data/buildings.js';

// In WebXR AR the camera pose comes from real phone movement (ARCore/WebXR).
// The route group is anchored once at a known entrance and stays fixed in world space.
// Progress is measured by distance from the live AR camera to each route node.

export const DEFAULT_INDOOR_REACHED_THRESHOLD = 1.5;
const ROUTE_Y_OFFSET = 0.02;
const FLOOR_STEP = FLOOR_HEIGHT;

const VERTICAL_NODE_PATTERN = /(STAIRS|ELEVATOR|LIFT)/i;

let nextNodeMarker = null;

function createCylinderBetweenPoints(start, end, radius, color) {
  const startVector = new THREE.Vector3(start.x, start.y, start.z);
  const endVector = new THREE.Vector3(end.x, end.y, end.z);
  const direction = new THREE.Vector3().subVectors(endVector, startVector);
  const length = direction.length();

  if (length < 0.001) {
    return null;
  }

  const geometry = new THREE.CylinderGeometry(radius, radius, length, 10);
  const material = new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.95
  });
  const cylinder = new THREE.Mesh(geometry, material);

  cylinder.position.copy(startVector).add(endVector).multiplyScalar(0.5);
  cylinder.renderOrder = 999;

  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  cylinder.quaternion.copy(quaternion);

  return cylinder;
}

function createPointMarker(point, radius, color) {
  const geometry = new THREE.SphereGeometry(radius, 12, 12);
  const material = new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.95
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.copy(point);
  sphere.renderOrder = 1000;
  return sphere;
}

function isVerticalNode(nodeId = '') {
  return VERTICAL_NODE_PATTERN.test(nodeId);
}

function getCameraHeading(camera) {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;

  if (direction.lengthSq() < 0.0001) {
    return 0;
  }

  direction.normalize();
  return Math.atan2(direction.x, direction.z);
}

function getRouteHeading(routePointEntries) {
  if (routePointEntries.length < 2) {
    return 0;
  }

  const start = routePointEntries[0].localPoint;
  const next = routePointEntries[1].localPoint;
  const dx = next.x - start.x;
  const dz = next.z - start.z;

  if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) {
    return 0;
  }

  return Math.atan2(dx, dz);
}

export function routeSegmentsToPointEntries(segments = [], anchorPosition, arOptions = null) {
  const arScale = arOptions?.arScale ?? 1;
  const entries = [];

  segments.forEach(({ graph, pathNodeIds }, segmentIndex) => {
    if (!graph || !pathNodeIds?.length) {
      return;
    }

    const nodeIds = segmentIndex > 0 && entries.length > 0
      ? pathNodeIds.slice(1)
      : pathNodeIds;

    nodeIds.forEach((nodeId) => {
      const node = graph.nodes[nodeId];

      if (!node || !anchorPosition) {
        return;
      }

      const relative = convertMapPointToAnchorRelative(
        node,
        anchorPosition,
        arOptions ? { arSpace: true, ...arOptions } : undefined
      );
      const floor = node.floor || 0;

      entries.push({
        nodeId,
        label: node.label || nodeId,
        type: node.type || 'indoor',
        localPoint: new THREE.Vector3(
          relative.x * arScale,
          floor * FLOOR_STEP * arScale + ROUTE_Y_OFFSET,
          relative.z * arScale
        )
      });
    });
  });

  return entries;
}

export function indoorPathToRoutePoints(indoorGraph, pathNodeIds = [], anchorPosition, arOptions = null) {
  return routeSegmentsToPointEntries(
    [{ graph: indoorGraph, pathNodeIds }],
    anchorPosition,
    arOptions
  );
}

function compressRoutePointsForCameraDebug(routePointEntries = [], arScale = 1) {
  const stepForward = 0.35;

  return routePointEntries.map((entry, index) => ({
    ...entry,
    localPoint: new THREE.Vector3(
      0,
      -0.45,
      (-1.3 - index * stepForward) * arScale
    )
  }));
}

export function createARRouteGroup(routePointEntries = [], options = {}) {
  const group = new THREE.Group();
  group.name = 'INDOOR_AR_ROUTE_GROUP';
  group.userData = {
    type: 'indoor-ar-route',
    layer: 'routes'
  };

  const radius = options.radius ?? 0.12;
  const segmentMeshes = [];

  for (let i = 0; i < routePointEntries.length - 1; i += 1) {
    const segment = createCylinderBetweenPoints(
      routePointEntries[i].localPoint,
      routePointEntries[i + 1].localPoint,
      radius,
      0x00ff00
    );

    if (!segment) continue;

    segment.userData.segmentIndex = i;
    group.add(segment);
    segmentMeshes.push(segment);
  }

  if (routePointEntries.length > 0) {
    const startMarker = createPointMarker(routePointEntries[0].localPoint, 0.18, 0xffff00);
    startMarker.name = 'INDOOR_AR_START_NODE';
    group.add(startMarker);
  }

  if (!nextNodeMarker) {
    nextNodeMarker = createPointMarker(new THREE.Vector3(), 0.16, 0x00ff00);
    nextNodeMarker.name = 'INDOOR_AR_NEXT_NODE';
  } else if (nextNodeMarker.parent) {
    nextNodeMarker.parent.remove(nextNodeMarker);
  }

  group.add(nextNodeMarker);

  return {
    group,
    segmentMeshes,
    nextMarker: nextNodeMarker
  };
}

export function createRouteState({
  routeGroup,
  routePointEntries,
  segmentMeshes,
  nextMarker,
  destinationName,
  pathNodeIds,
  reachedThreshold = DEFAULT_INDOOR_REACHED_THRESHOLD
}) {
  return {
    routeGroup,
    routePointEntries,
    segmentMeshes,
    nextMarker,
    pathNodeIds,
    routePointsWorld: [],
    currentNodeIndex: 1,
    reachedThreshold,
    destinationReached: false,
    destinationName: destinationName || 'your destination',
    active: false,
    aligned: false,
    instructionText: 'Stand at the entrance and tap "Align AR Route".',
    distanceToNextNode: null,
    remainingDistance: null,
    lastCameraPosition: null,
    onUpdate: null,
    onInstruction: null
  };
}

function computeWorldRoutePoints(routeState) {
  routeState.routeGroup.updateMatrixWorld(true);

  routeState.routePointsWorld = routeState.routePointEntries.map((entry) =>
    entry.localPoint.clone().applyMatrix4(routeState.routeGroup.matrixWorld)
  );
}

function updateSegmentStyles(routeState) {
  routeState.segmentMeshes.forEach((segment, index) => {
    const passed = index < routeState.currentNodeIndex - 1;
    segment.material.color.setHex(passed ? 0x006600 : 0x00ff00);
    segment.material.opacity = passed ? 0.35 : 1;
    segment.material.transparent = passed;
  });

  if (routeState.nextMarker && routeState.routePointsWorld.length > 0) {
    const nextIndex = Math.min(
      routeState.currentNodeIndex,
      routeState.routePointsWorld.length - 1
    );
    routeState.nextMarker.position.copy(routeState.routePointEntries[nextIndex].localPoint);
    routeState.nextMarker.visible = !routeState.destinationReached;
  }
}

function notifyRouteState(routeState) {
  routeState.onUpdate?.(routeState);
}

function emitInstruction(routeState, text) {
  routeState.instructionText = text;
  routeState.onInstruction?.(text, routeState);
}

export function anchorRouteCameraDebug(routeGroup, camera, routeState, scene) {
  if (!routeGroup || !camera || !routeState) {
    return routeState;
  }

  if (routeGroup.parent) {
    routeGroup.parent.remove(routeGroup);
  }

  camera.add(routeGroup);
  routeGroup.position.set(0, 0, 0);
  routeGroup.rotation.set(0, 0, 0);

  if (scene && !scene.children.includes(camera)) {
    scene.add(camera);
  }

  routeGroup.visible = true;
  routeGroup.updateMatrixWorld(true);

  computeWorldRoutePoints(routeState);
  routeState.currentNodeIndex = Math.min(1, routeState.routePointsWorld.length - 1);
  routeState.destinationReached = false;
  routeState.active = true;
  routeState.aligned = true;

  updateSegmentStyles(routeState);
  emitInstruction(routeState, 'Debug route in front of camera — follow the green line');

  notifyRouteState(routeState);
  return routeState;
}

let pendingRouteAlign = null;
const MIN_ALIGN_WAIT_FRAMES = 8;

export function scheduleARRouteAlign(routeState, camera, scene, options = {}) {
  if (!routeState || !camera) {
    return;
  }

  pendingRouteAlign = {
    routeState,
    camera,
    scene,
    options,
    frames: 0
  };
}

export function tickARRouteAlign() {
  if (!pendingRouteAlign) {
    return;
  }

  pendingRouteAlign.frames += 1;

  if (pendingRouteAlign.frames < MIN_ALIGN_WAIT_FRAMES) {
    return;
  }

  const { routeState, camera, scene, options } = pendingRouteAlign;
  pendingRouteAlign = null;

  const arMode = options.arMode ?? 'anchor-relative';

  if (arMode === 'camera-debug') {
    anchorRouteCameraDebug(routeState.routeGroup, camera, routeState, scene);
  } else {
    anchorRouteToCurrentCamera(
      routeState.routeGroup,
      camera,
      routeState,
      scene,
      { instruction: 'Follow the green route on the ground' }
    );
  }

  routeState.onUpdate?.(routeState);
}

export function alignARRouteForSession(routeState, camera, scene, options = {}) {
  if (!routeState || !camera) {
    return routeState;
  }

  if ((options.arMode ?? 'anchor-relative') === 'camera-debug') {
    return anchorRouteCameraDebug(routeState.routeGroup, camera, routeState, scene);
  }

  scheduleARRouteAlign(routeState, camera, scene, options);
  return routeState;
}

export function anchorRouteToCurrentCamera(routeGroup, camera, routeState, scene, options = {}) {
  if (!routeGroup || !camera || !routeState) {
    return routeState;
  }

  if (routeGroup.parent === camera) {
    routeGroup.parent.remove(routeGroup);
  }

  const cameraWorldPosition = new THREE.Vector3();
  camera.getWorldPosition(cameraWorldPosition);

  const heading = getCameraHeading(camera);
  const routeHeading = getRouteHeading(routeState.routePointEntries);
  const floorY = routeState.routePointEntries[0]?.localPoint.y ?? ROUTE_Y_OFFSET;

  routeGroup.position.set(cameraWorldPosition.x, floorY, cameraWorldPosition.z);
  routeGroup.rotation.set(0, heading - routeHeading, 0);

  if (scene && !routeGroup.parent) {
    scene.add(routeGroup);
  }

  routeGroup.visible = true;
  routeGroup.updateMatrixWorld(true);

  computeWorldRoutePoints(routeState);
  routeState.currentNodeIndex = Math.min(1, routeState.routePointsWorld.length - 1);
  routeState.destinationReached = false;
  routeState.active = true;
  routeState.aligned = true;

  updateSegmentStyles(routeState);
  emitInstruction(routeState, options.instruction || 'Follow the green route');

  notifyRouteState(routeState);
  return routeState;
}

export function getCurrentInstruction(routeState, camera) {
  if (!routeState) {
    return 'No indoor AR route active.';
  }

  if (routeState.destinationReached) {
    return `You have arrived at ${routeState.destinationName}.`;
  }

  if (!routeState.aligned) {
    return routeState.instructionText;
  }

  const nextIndex = routeState.currentNodeIndex;

  if (nextIndex >= routeState.routePointEntries.length) {
    return `You have arrived at ${routeState.destinationName}.`;
  }

  const nextEntry = routeState.routePointEntries[nextIndex];

  if (isVerticalNode(nextEntry.nodeId)) {
    return 'Take stairs or elevator';
  }

  if (nextIndex >= routeState.routePointEntries.length - 1) {
    return `Go to room ${routeState.destinationName}`;
  }

  if (!camera || routeState.routePointsWorld.length < 2) {
    return 'Continue along the green route';
  }

  const cameraPos = new THREE.Vector3();
  camera.getWorldPosition(cameraPos);

  const nextPoint = routeState.routePointsWorld[nextIndex];
  const prevPoint = routeState.routePointsWorld[Math.max(0, nextIndex - 1)];
  const routeDir = new THREE.Vector3().subVectors(nextPoint, prevPoint);
  routeDir.y = 0;

  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  camDir.y = 0;

  if (routeDir.lengthSq() < 0.0001 || camDir.lengthSq() < 0.0001) {
    return 'Continue along the green route';
  }

  routeDir.normalize();
  camDir.normalize();

  const cross = camDir.x * routeDir.z - camDir.z * routeDir.x;
  const dot = camDir.dot(routeDir);

  if (dot > 0.85) return 'Go straight';
  if (cross > 0.3) return 'Turn right';
  if (cross < -0.3) return 'Turn left';
  return 'Continue along the green route';
}

export function getDistanceToNextNode(camera, routeState) {
  if (!routeState?.active || !camera || !routeState.routePointsWorld.length) {
    return null;
  }

  const nextPoint = routeState.routePointsWorld[routeState.currentNodeIndex];

  if (!nextPoint) {
    return null;
  }

  const cameraPos = new THREE.Vector3();
  camera.getWorldPosition(cameraPos);

  return cameraPos.distanceTo(nextPoint);
}

export function getRemainingIndoorDistance(camera, routeState) {
  const distanceToNext = getDistanceToNextNode(camera, routeState);

  if (distanceToNext === null) {
    return null;
  }

  let distance = distanceToNext;

  for (
    let i = routeState.currentNodeIndex;
    i < routeState.routePointsWorld.length - 1;
    i += 1
  ) {
    distance += routeState.routePointsWorld[i].distanceTo(
      routeState.routePointsWorld[i + 1]
    );
  }

  return distance;
}

export function updateRouteProgress(camera, routeState) {
  if (!routeState || !routeState.active || routeState.destinationReached || !camera) {
    return routeState;
  }

  const cameraPos = new THREE.Vector3();
  camera.getWorldPosition(cameraPos);
  routeState.lastCameraPosition = cameraPos.clone();

  const nextPoint = routeState.routePointsWorld[routeState.currentNodeIndex];

  if (!nextPoint) {
    routeState.destinationReached = true;
    routeState.active = false;
    emitInstruction(routeState, `You have arrived at ${routeState.destinationName}.`);
    notifyRouteState(routeState);
    return routeState;
  }

  const distance = cameraPos.distanceTo(nextPoint);
  routeState.distanceToNextNode = distance;
  routeState.remainingDistance = getRemainingIndoorDistance(camera, routeState);
  routeState.instructionText = getCurrentInstruction(routeState, camera);

  if (distance < routeState.reachedThreshold) {
    routeState.currentNodeIndex += 1;

    if (routeState.currentNodeIndex >= routeState.routePointsWorld.length) {
      routeState.destinationReached = true;
      routeState.active = false;
      emitInstruction(routeState, `You have arrived at ${routeState.destinationName}.`);
    } else {
      emitInstruction(routeState, getCurrentInstruction(routeState, camera));
    }

    updateSegmentStyles(routeState);
  }

  notifyRouteState(routeState);
  return routeState;
}

export function prepareIndoorARRoute(scene, routeConfig, callbacks = {}) {
  const segments = routeConfig.segments ?? (
    routeConfig.graph && routeConfig.pathNodeIds
      ? [{ graph: routeConfig.graph, pathNodeIds: routeConfig.pathNodeIds }]
      : []
  );

  if (!routeConfig?.anchorPosition || segments.length === 0) {
    return null;
  }

  let routePointEntries = routeSegmentsToPointEntries(
    segments,
    routeConfig.anchorPosition,
    routeConfig.arOptions ?? null
  );

  const arScale = routeConfig.arOptions?.arScale ?? 1;

  if (routeConfig.arMode === 'camera-debug') {
    routePointEntries = compressRoutePointsForCameraDebug(routePointEntries, arScale);
  }

  if (routePointEntries.length < 2) {
    return null;
  }

  const pathNodeIds = segments.flatMap((segment) => segment.pathNodeIds ?? []);

  const { group, segmentMeshes, nextMarker } = createARRouteGroup(routePointEntries, {
    radius: Math.max(0.04, 0.12 * Math.sqrt(arScale))
  });
  group.visible = false;
  scene.add(group);

  const routeState = createRouteState({
    routeGroup: group,
    routePointEntries,
    segmentMeshes,
    nextMarker,
    destinationName: routeConfig.destinationName,
    pathNodeIds,
    reachedThreshold: DEFAULT_INDOOR_REACHED_THRESHOLD * arScale
  });

  routeState.onUpdate = callbacks.onUpdate ?? null;
  routeState.onInstruction = callbacks.onInstruction ?? null;

  return routeState;
}

export function clearIndoorARRoute(scene, routeState) {
  if (routeState?.nextMarker) {
    routeState.nextMarker.visible = false;
  }

  if (routeState?.routeGroup) {
    if (routeState.routeGroup.parent) {
      routeState.routeGroup.parent.remove(routeState.routeGroup);
    } else if (scene) {
      scene.remove(routeState.routeGroup);
    }

    routeState.routeGroup.traverse((object) => {
      if (object === routeState.nextMarker) return;
      if (object.geometry) object.geometry.dispose();
      if (object.material) object.material.dispose();
    });
  }

  return null;
}
