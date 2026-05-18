import * as THREE from 'three';

function createIndoorBox(center, size, color, id, name, y) {
  const geometry = new THREE.BoxGeometry(size.length, size.height, size.width);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0,
    transparent: true,
    opacity: 0.56
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(center.x, y, center.z);

  mesh.userData = {
    type: 'indoor-structure',
    layer: 'per22-indoor',
    buildingId: 'PER22',
    id,
    name
  };

  return mesh;
}

export function createPer22IndoorStructure(scene) {
  const indoorMeshes = [
    createIndoorBox(
      { x: -65.5, z: 25 },
      { length: 24, width: 24, height: 6 },
      0x7e57c2,
      'PER22_AUDITORIUM_JOSEPH_DEISS_VOLUME',
      'Auditorium Joseph Deiss',
      3
    ),
    createIndoorBox(
      { x: -65.5, z: 25 },
      { length: 24, width: 24, height: 9 },
      0x26a69a,
      'PER22_LIBRARY_VOLUME',
      'PER22 Library',
      10.5
    ),
    createIndoorBox(
      { x: -70, z: 28 },
      { length: 5, width: 5, height: 12 },
      0xffb74d,
      'PER22_STAIRS_VOLUME',
      'PER22 Stairs',
      6
    )
  ];

  indoorMeshes.forEach((mesh) => {
    scene.add(mesh);
  });

  return indoorMeshes;
}
