import * as THREE from 'three';
import { convertRouteToAnchorRelative } from './arRouteAdapter.js';

let currentARRouteGroup = null;

function createCylinderBetweenPoints(start, end, radius, color) {
  const startVector = new THREE.Vector3(start.x, start.y, start.z);
  const endVector = new THREE.Vector3(end.x, end.y, end.z);

  const direction = new THREE.Vector3().subVectors(endVector, startVector);
  const length = direction.length();

  const geometry = new THREE.CylinderGeometry(radius, radius, length, 16);
  const material = new THREE.MeshBasicMaterial({ color });

  const cylinder = new THREE.Mesh(geometry, material);

  const midpoint = new THREE.Vector3()
    .addVectors(startVector, endVector)
    .multiplyScalar(0.5);

  cylinder.position.copy(midpoint);

  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );

  cylinder.quaternion.copy(quaternion);

  return cylinder;
}

function createPointMarker(point, color) {
  const geometry = new THREE.SphereGeometry(0.08, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });
  const sphere = new THREE.Mesh(geometry, material);

  sphere.position.set(point.x, point.y, point.z);

  return sphere;
}

export function clearARRoute(scene) {
  if (!currentARRouteGroup) return;

  scene.remove(currentARRouteGroup);

  currentARRouteGroup.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  });

  currentARRouteGroup = null;
}

export function renderARRoute(scene, graph, pathNodeIds, anchorPosition, options = {}) {
  clearARRoute(scene);

  if (!pathNodeIds || pathNodeIds.length < 2) {
    console.warn('No AR route to render.');
    return null;
  }

  const scale = options.scale ?? 0.05;

  const relativeRoute = convertRouteToAnchorRelative(
    graph,
    pathNodeIds,
    anchorPosition
  );

  const group = new THREE.Group();
  group.name = 'AR_ROUTE_GROUP';

  const arPoints = relativeRoute.map((point) => {
    return {
      id: point.id,

      // Map campus x to AR x.
      x: point.x * scale,

      // Route is placed near the floor.
      y: 0.03,

      // Map campus z to AR z.
      // Negative sign makes positive campus-z appear forward/back consistently.
      z: -point.z * scale
    };
  });

  for (let i = 0; i < arPoints.length - 1; i++) {
    const segment = createCylinderBetweenPoints(
      arPoints[i],
      arPoints[i + 1],
      0.04,
      0x00ff00
    );

    group.add(segment);
  }

  arPoints.forEach((point, index) => {
    const marker = createPointMarker(
      point,
      index === 0 ? 0xffff00 : 0x00ff00
    );

    group.add(marker);
  });

  scene.add(group);
  currentARRouteGroup = group;

  console.log('Rendered AR route points:', arPoints);

  return group;
}