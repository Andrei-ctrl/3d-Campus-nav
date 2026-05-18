import * as THREE from 'three';
import { convertRouteToAnchorRelative } from './arRouteAdapter.js';

let currentARRouteGroup = null;
let isARRouteVisible = true;


function createCylinderBetweenPoints(start, end, radius, color) {
  const startVector = new THREE.Vector3(start.x, start.y, start.z);
  const endVector = new THREE.Vector3(end.x, end.y, end.z);

  const direction = new THREE.Vector3().subVectors(endVector, startVector);
  const length = direction.length();

  if (length < 0.001) {
    return null;
  }

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
  const geometry = new THREE.SphereGeometry(0.15, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(point.x, point.y, point.z);

  return sphere;
}

export function clearARRoute(scene) {
  if (!currentARRouteGroup) return;

  if (currentARRouteGroup.parent) {
    currentARRouteGroup.parent.remove(currentARRouteGroup);
  } else {
    scene.remove(currentARRouteGroup);
  }

  currentARRouteGroup.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  });

  currentARRouteGroup = null;
}

export function setARRouteVisible(visible) {
  isARRouteVisible = visible;

  if (currentARRouteGroup) {
    currentARRouteGroup.visible = visible;
  }
}

export function renderARRoute(scene, graph, pathNodeIds, anchorPosition, options = {}) {
  clearARRoute(scene);

  if (!pathNodeIds || pathNodeIds.length < 2) {
    console.warn('No AR route to render.');
    return null;
  }

  const scale = options.scale ?? 0.05;
  const camera = options.camera ?? null;
  const cameraRelative = options.cameraRelative ?? false;
  const originOffset = options.originOffset ?? { x: 0, y: -0.45, z: -1.5 };

  const relativeRoute = convertRouteToAnchorRelative(
    graph,
    pathNodeIds,
    anchorPosition
  );

  const group = new THREE.Group();
  group.name = 'AR_ROUTE_GROUP';
  group.userData = {
    type: 'ar-route',
    layer: 'routes'
  };
  group.visible = isARRouteVisible;

  let arPoints;

  if (cameraRelative) {
    // Prototype AR mode:
    // Draw a compressed route directly in front of the phone camera.
    arPoints = relativeRoute.map((point, index) => ({
      id: point.id,
      x: index * 0.35 - 0.4,
      y: -0.45,
      z: -1.3 - index * 0.25
    }));
  } else {
    // Anchor-relative mode:
    // Draw route according to campus coordinates.
    arPoints = relativeRoute.map((point) => ({
      id: point.id,
      x: originOffset.x + point.x * scale,
      y: originOffset.y,
      z: originOffset.z - point.z * scale
    }));
  }

  for (let i = 0; i < arPoints.length - 1; i++) {
    const segment = createCylinderBetweenPoints(
      arPoints[i],
      arPoints[i + 1],
      0.07,
      0x00ff00
    );

    if (segment) {
      group.add(segment);
    }
  }

  arPoints.forEach((point, index) => {
    const marker = createPointMarker(
      point,
      index === 0 ? 0xffff00 : 0x00ff00
    );

    group.add(marker);
  });

  if (cameraRelative && camera) {
    camera.add(group);

    if (!scene.children.includes(camera)) {
      scene.add(camera);
    }
  } else {
    scene.add(group);
  }

  currentARRouteGroup = group;

  console.log('Rendered AR route points:', arPoints);

  return group;
}
