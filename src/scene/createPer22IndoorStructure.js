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
      { x: -48.5, z: 23.5 },
      { length: 24, width: 24, height: 6 },
      0x7e57c2,
      'PER22_AUDITORIUM_JOSEPH_DEISS_VOLUME',
      'Auditorium Joseph Deiss',
      3
    ),
    createIndoorBox(
      { x: -48.5, z: 23.5 },
      { length: 24, width: 24, height: 9 },
      0x26a69a,
      'PER22_LIBRARY_VOLUME',
      'PER22 Library',
      10.5
    ),
    createIndoorBox(
      { x: -49, z: 28 },
      { length: 5, width: 5, height: 12 },
      0xffb74d,
      'PER22_STAIRS_VOLUME',
      'PER22 Stairs — vertical circulation',
      6
    ),
    createIndoorBox(
      { x: -40, z: 28 },
      { length: 3, width: 2, height: 0.4 },
      0x90caf9,
      'PER22_PER21_CONNECTION_AREA',
      'Indoor passage to PER21'
    )
  ];

  indoorMeshes.forEach((mesh) => {
    scene.add(mesh);
  });

  return indoorMeshes;
}
