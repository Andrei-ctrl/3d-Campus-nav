import * as THREE from 'three';

let currentRouteMeshes = [];
let isRouteVisible = true;

function createRouteSegment(start, end) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;

  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const geometry = new THREE.BoxGeometry(length, 0.18, 3);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00
  });

  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(
    (start.x + end.x) / 2,
    0.25,
    (start.z + end.z) / 2
  );

  mesh.rotation.y = -angle;

  mesh.userData = {
    type: 'route',
    layer: 'routes',
    id: 'ROUTE_SEGMENT',
    name: 'Navigation route segment'
  };

  mesh.visible = isRouteVisible;

  return mesh;
}

export function clearRoute(scene) {
  currentRouteMeshes.forEach((mesh) => {
    scene.remove(mesh);

    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  });

  currentRouteMeshes = [];
}

export function setRouteVisible(visible) {
  isRouteVisible = visible;

  currentRouteMeshes.forEach((mesh) => {
    mesh.visible = visible;
  });
}

export function renderRoute(scene, graph, pathNodeIds) {
  clearRoute(scene);

  if (!pathNodeIds || pathNodeIds.length < 2) {
    console.warn('Route path is empty or too short.');
    return;
  }

  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const startNode = graph.nodes[pathNodeIds[i]];
    const endNode = graph.nodes[pathNodeIds[i + 1]];

    const segment = createRouteSegment(startNode, endNode);

    scene.add(segment);
    currentRouteMeshes.push(segment);
  }
  
}

export function calculateRouteDistance(graph, pathNodeIds) {
  let total = 0;

  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const start = graph.nodes[pathNodeIds[i]];
    const end = graph.nodes[pathNodeIds[i + 1]];

    const dx = end.x - start.x;
    const dz = end.z - start.z;

    total += Math.sqrt(dx * dx + dz * dz);
  }

  return total;
}
