import * as THREE from 'three';
import { OUTDOOR_GPS_ORIGIN, OUTDOOR_SCALE_OPTIONS } from '../data/outdoorGpsOrigin.js';

// Outdoor progress uses GPS (open spaces). Indoor AR uses WebXR camera tracking
// because GPS is unreliable inside buildings. Outdoor threshold is larger than
// indoor (~1.5 m) because consumer GPS accuracy is typically several metres.

export const DEFAULT_OUTDOOR_REACHED_THRESHOLD = 6;

const BUILDING_ENTRANCE_SUFFIXES = ['ENTRANCE', 'CONNECTION_ENTRANCE'];

let userGpsMarker = null;

export function convertGpsToLocalPosition(
  latitude,
  longitude,
  origin = OUTDOOR_GPS_ORIGIN,
  scaleOptions = OUTDOOR_SCALE_OPTIONS
) {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon =
    111320 * Math.cos(origin.latitude * (Math.PI / 180));

  const scaleX = scaleOptions.scaleX ?? 1;
  const scaleZ = scaleOptions.scaleZ ?? 1;

  const dx = (longitude - origin.longitude) * metersPerDegreeLon * scaleX;
  const dz = -(latitude - origin.latitude) * metersPerDegreeLat * scaleZ;

  return new THREE.Vector3(
    origin.localX + dx,
    0,
    origin.localZ + dz
  );
}

export function routeNodeIdsToLocalPoints(graph, routeNodeIds = []) {
  return routeNodeIds
    .map((nodeId) => {
      const node = graph.nodes[nodeId];

      if (!node) return null;

      return new THREE.Vector3(node.x, 0, node.z);
    })
    .filter(Boolean);
}

export function createOutdoorRouteState(options = {}) {
  return {
    active: false,
    routeNodes: options.routeNodes ?? [],
    routePointsLocal: options.routePointsLocal ?? [],
    currentNodeIndex: options.currentNodeIndex ?? 1,
    reachedThreshold: options.reachedThreshold ?? DEFAULT_OUTDOOR_REACHED_THRESHOLD,
    destinationReached: false,
    destinationName: options.destinationName ?? '',
    hasIndoorLeg: options.hasIndoorLeg ?? false,
    finalEntranceNodeId: options.finalEntranceNodeId ?? null,
    watchId: null,
    userGpsPosition: null,
    userLocalPosition: null,
    gpsAccuracy: null,
    distanceToNextNode: null,
    instructionText: 'Outdoor navigation inactive.',
    origin: options.origin ?? OUTDOOR_GPS_ORIGIN,
    scaleOptions: options.scaleOptions ?? OUTDOOR_SCALE_OPTIONS,
    onUpdate: options.onUpdate ?? null,
    onInstruction: options.onInstruction ?? null,
    onDestinationReached: options.onDestinationReached ?? null
  };
}

export function isBuildingEntranceNodeId(nodeId) {
  if (!nodeId) return false;

  return BUILDING_ENTRANCE_SUFFIXES.some((suffix) => nodeId.endsWith(suffix));
}

export function getOutdoorInstruction(routeState) {
  if (!routeState?.routeNodes?.length) {
    return 'Follow the outdoor route.';
  }

  const nextNodeId = routeState.routeNodes[routeState.currentNodeIndex];
  const graphLabel = routeState.routeLabels?.[routeState.currentNodeIndex];
  const label = graphLabel || nextNodeId || 'your destination';

  return `Head toward ${label}.`;
}

export function getDistanceToNextOutdoorNode(routeState) {
  if (!routeState?.userLocalPosition || !routeState.routePointsLocal?.length) {
    return null;
  }

  const nextPoint = routeState.routePointsLocal[routeState.currentNodeIndex];

  if (!nextPoint) {
    return null;
  }

  return routeState.userLocalPosition.distanceTo(nextPoint);
}

export function getRemainingOutdoorDistance(routeState) {
  if (!routeState?.userLocalPosition || !routeState.routePointsLocal?.length) {
    return null;
  }

  const nextPoint = routeState.routePointsLocal[routeState.currentNodeIndex];

  if (!nextPoint) {
    return 0;
  }

  let distance = routeState.userLocalPosition.distanceTo(nextPoint);

  for (let i = routeState.currentNodeIndex; i < routeState.routePointsLocal.length - 1; i++) {
    distance += routeState.routePointsLocal[i].distanceTo(
      routeState.routePointsLocal[i + 1]
    );
  }

  return distance;
}

function emitInstruction(routeState, text) {
  routeState.instructionText = text;
  routeState.onInstruction?.(text, routeState);
}

function notifyUpdate(routeState) {
  routeState.onUpdate?.(routeState);
}

export function updateOutdoorProgress(userLocalPosition, routeState) {
  if (!routeState || !routeState.active || routeState.destinationReached) {
    return routeState;
  }

  routeState.userLocalPosition = userLocalPosition.clone();

  if (routeState.currentNodeIndex >= routeState.routePointsLocal.length) {
    routeState.destinationReached = true;
    routeState.active = false;
    emitInstruction(routeState, `You have arrived at ${routeState.destinationName}.`);
    routeState.onDestinationReached?.(routeState);
    notifyUpdate(routeState);
    return routeState;
  }

  const nextPoint = routeState.routePointsLocal[routeState.currentNodeIndex];
  const distance = userLocalPosition.distanceTo(nextPoint);

  routeState.distanceToNextNode = distance;

  if (distance < routeState.reachedThreshold) {
    const reachedNodeId = routeState.routeNodes[routeState.currentNodeIndex];
    routeState.currentNodeIndex += 1;

    if (routeState.currentNodeIndex >= routeState.routePointsLocal.length) {
      routeState.destinationReached = true;
      routeState.active = false;

      if (routeState.hasIndoorLeg && isBuildingEntranceNodeId(reachedNodeId)) {
        emitInstruction(
          routeState,
          `You reached ${reachedNodeId.replace(/_/g, ' ')}. Stand at the entrance and tap "Start AR" to align the indoor route.`
        );
      } else {
        emitInstruction(routeState, `You have arrived at ${routeState.destinationName}.`);
      }

      routeState.onDestinationReached?.(routeState);
    } else {
      emitInstruction(routeState, getOutdoorInstruction(routeState));
    }
  }

  notifyUpdate(routeState);
  return routeState;
}

export function ensureUserGpsMarker(scene) {
  if (userGpsMarker) {
    return userGpsMarker;
  }

  const geometry = new THREE.SphereGeometry(2, 20, 20);
  const material = new THREE.MeshBasicMaterial({ color: 0x2196f3 });
  userGpsMarker = new THREE.Mesh(geometry, material);
  userGpsMarker.position.y = 1.5;
  userGpsMarker.visible = false;
  userGpsMarker.userData = {
    type: 'gps-user-marker',
    layer: 'routes',
    name: 'Outdoor GPS position'
  };
  scene.add(userGpsMarker);

  return userGpsMarker;
}

export function updateUserGpsMarker(scene, userLocalPosition) {
  const marker = ensureUserGpsMarker(scene);

  marker.visible = true;
  marker.position.x = userLocalPosition.x;
  marker.position.z = userLocalPosition.z;
}

export function hideUserGpsMarker() {
  if (userGpsMarker) {
    userGpsMarker.visible = false;
  }
}

export function isGeolocationAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.geolocation;
}

export function startOutdoorTracking(routeNodes, graph, options = {}) {
  if (!isGeolocationAvailable()) {
    const message = 'Geolocation is not available in this browser.';
    options.onInstruction?.(message, null);
    return null;
  }

  if (!routeNodes || routeNodes.length < 2) {
    const message = 'No outdoor route is available to track.';
    options.onInstruction?.(message, null);
    return null;
  }

  stopOutdoorTracking(options.existingState);

  const routePointsLocal = routeNodeIdsToLocalPoints(graph, routeNodes);
  const routeState = createOutdoorRouteState({
    ...options,
    routeNodes,
    routePointsLocal,
    active: true,
    currentNodeIndex: Math.min(1, routePointsLocal.length - 1),
    destinationReached: false
  });

  emitInstruction(routeState, getOutdoorInstruction(routeState));

  routeState.watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      routeState.userGpsPosition = { latitude, longitude, accuracy };
      routeState.gpsAccuracy = accuracy;

      const userLocalPosition = convertGpsToLocalPosition(
        latitude,
        longitude,
        routeState.origin,
        routeState.scaleOptions
      );

      if (options.scene) {
        updateUserGpsMarker(options.scene, userLocalPosition);
      }

      updateOutdoorProgress(userLocalPosition, routeState);
    },
    (error) => {
      console.error('Geolocation error:', error);
      emitInstruction(routeState, 'GPS position unavailable. Please enable location access.');
      notifyUpdate(routeState);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000
    }
  );

  notifyUpdate(routeState);
  return routeState;
}

export function stopOutdoorTracking(routeState) {
  if (!routeState) {
    hideUserGpsMarker();
    return null;
  }

  if (routeState.watchId !== null) {
    navigator.geolocation.clearWatch(routeState.watchId);
    routeState.watchId = null;
  }

  routeState.active = false;
  emitInstruction(routeState, 'Outdoor navigation stopped.');
  notifyUpdate(routeState);
  hideUserGpsMarker();

  return routeState;
}
