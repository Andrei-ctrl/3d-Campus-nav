import * as THREE from 'three';
import { FLOOR_HEIGHT, buildingHeight } from '../data/buildings.js';

let currentIndoorRouteMeshes = [];
let isIndoorRouteVisible = true;
const indoorRouteBuildingVisibility = new Map();
let onIndoorRouteMeshesChanged = null;

const ROUTE_BASE_Y_BY_BUILDING = {
  PER21: buildingHeight(5) + 1,
  PER22: buildingHeight(2) + 1,
  PER17: buildingHeight(2) + 1
};

export function setIndoorRouteCalibrationHook(callback) {
  onIndoorRouteMeshesChanged = callback;
}

function isBuildingRouteVisible(buildingId) {
  return indoorRouteBuildingVisibility.get(buildingId) ?? true;
}

function createIndoorRouteSegment(start, end, options = {}) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;

  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const geometry = new THREE.BoxGeometry(length, 0.22, 2.2);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    depthTest: false
  });

  const mesh = new THREE.Mesh(geometry, material);

  const startFloor = start.floor || 0;
  const endFloor = end.floor || 0;
  const averageFloor = (startFloor + endFloor) / 2;

  const routeBaseY = ROUTE_BASE_Y_BY_BUILDING[options.buildingId] ?? 9;
  const y = routeBaseY + averageFloor * FLOOR_HEIGHT;

  mesh.position.set(
    (start.x + end.x) / 2,
    y,
    (start.z + end.z) / 2
  );

  mesh.rotation.y = -angle;
  mesh.renderOrder = 12;

  mesh.userData = {
    type: 'indoor-route',
    layer: 'routes',
    buildingId: options.buildingId || null,
    id: 'INDOOR_ROUTE_SEGMENT',
    name: 'Indoor route segment'
  };

  mesh.visible = isIndoorRouteVisible && isBuildingRouteVisible(options.buildingId);

  return mesh;
}

export function clearIndoorRoute(scene) {
  currentIndoorRouteMeshes.forEach((mesh) => {
    onIndoorRouteMeshesChanged?.('unregister', mesh);
    scene.remove(mesh);

    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  });

  currentIndoorRouteMeshes = [];
}

export function setIndoorRouteVisible(visible) {
  isIndoorRouteVisible = visible;

  currentIndoorRouteMeshes.forEach((mesh) => {
    mesh.visible = visible && isBuildingRouteVisible(mesh.userData.buildingId);
  });
}

export function setIndoorRouteBuildingVisible(buildingId, visible) {
  indoorRouteBuildingVisibility.set(buildingId, visible);

  currentIndoorRouteMeshes.forEach((mesh) => {
    if (mesh.userData.buildingId !== buildingId) return;

    mesh.visible = isIndoorRouteVisible && visible;
  });
}

function addIndoorRouteSegments(scene, indoorGraph, pathNodeIds, options = {}) {
  if (!pathNodeIds || pathNodeIds.length < 2) {
    return;
  }

  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const startNode = indoorGraph.nodes[pathNodeIds[i]];
    const endNode = indoorGraph.nodes[pathNodeIds[i + 1]];

    if (!startNode || !endNode) continue;

    const segment = createIndoorRouteSegment(startNode, endNode, options);

    scene.add(segment);
    currentIndoorRouteMeshes.push(segment);
    onIndoorRouteMeshesChanged?.('register', segment);
  }
}

export function renderIndoorRoute(scene, indoorGraph, pathNodeIds, options = {}) {
  clearIndoorRoute(scene);
  addIndoorRouteSegments(scene, indoorGraph, pathNodeIds, options);
}

export function renderIndoorRouteSegments(scene, segments = []) {
  clearIndoorRoute(scene);

  segments.forEach(({ graph: indoorGraph, path, buildingId }) => {
    addIndoorRouteSegments(scene, indoorGraph, path, { buildingId });
  });
}
