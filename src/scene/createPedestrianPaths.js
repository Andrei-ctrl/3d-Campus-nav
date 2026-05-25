import * as THREE from 'three';

function createPathSegment(start, end, width, color) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;

  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const geometry = new THREE.BoxGeometry(length, 0.06, width);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0
  });

  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(
    (start.x + end.x) / 2,
    0.04,
    (start.z + end.z) / 2
  );

  mesh.rotation.y = -angle;

  mesh.userData = {
    type: 'pedestrian-path',
    name: 'Pedestrian path'
  };

  return mesh;
}

export function createPedestrianPaths(scene, pedestrianPaths) {
  const pathMeshes = [];

  pedestrianPaths.forEach((path) => {
    for (let i = 0; i < path.points.length - 1; i++) {
      const segment = createPathSegment(
        path.points[i],
        path.points[i + 1],
        path.width,
        path.color
      );

      segment.userData.id = `${path.id}_${i}`;
      segment.userData.name = path.name;

      scene.add(segment);
      pathMeshes.push(segment);
    }
  });

  return pathMeshes;
}