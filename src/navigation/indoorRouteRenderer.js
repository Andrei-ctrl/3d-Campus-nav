import * as THREE from 'three';

let currentIndoorRouteMeshes = [];

function createIndoorRouteSegment(start, end) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;

  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const geometry = new THREE.BoxGeometry(length, 0.22, 2.2);
  const material = new THREE.MeshBasicMaterial({
    color: 0x2196f3
  });

  const mesh = new THREE.Mesh(geometry, material);

  const startFloor = start.floor || 0;
  const endFloor = end.floor || 0;
  const averageFloor = (startFloor + endFloor) / 2;

  // PER21 height is about 8m. We draw indoor route above the building surface for visibility.
  const y = 9 + averageFloor * 3;

  mesh.position.set(
    (start.x + end.x) / 2,
    y,
    (start.z + end.z) / 2
  );

  mesh.rotation.y = -angle;

  mesh.userData = {
    type: 'indoor-route',
    id: 'INDOOR_ROUTE_SEGMENT',
    name: 'Indoor route segment'
  };

  return mesh;
}

export function clearIndoorRoute(scene) {
  currentIndoorRouteMeshes.forEach((mesh) => {
    scene.remove(mesh);

    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  });

  currentIndoorRouteMeshes = [];
}

export function renderIndoorRoute(scene, indoorGraph, pathNodeIds) {
  clearIndoorRoute(scene);

  if (!pathNodeIds || pathNodeIds.length < 2) {
    return;
  }

  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const startNode = indoorGraph.nodes[pathNodeIds[i]];
    const endNode = indoorGraph.nodes[pathNodeIds[i + 1]];

    if (!startNode || !endNode) continue;

    const segment = createIndoorRouteSegment(startNode, endNode);

    scene.add(segment);
    currentIndoorRouteMeshes.push(segment);
  }
}