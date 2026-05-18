import * as THREE from 'three';

function createIndoorBox(center, size, color, id, name, y = 9.2) {
  const geometry = new THREE.BoxGeometry(size.length, size.height, size.width);

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0,
    transparent: true,
    opacity: 0.55
  });

  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(center.x, y, center.z);

  mesh.userData = {
    type: 'indoor-structure',
    layer: 'per21-indoor',
    id,
    name
  };

  return mesh;
}

export function createPer21IndoorStructure(scene) {
  const indoorMeshes = [];

  const lobby = createIndoorBox(
    { x: 73, z: 50 },
    { length: 14, width: 10, height: 0.4 },
    0x90caf9,
    'PER21_LOBBY_AREA',
    'PER21 Lobby'
  );

  const groundCorridor = createIndoorBox(
    { x: 47, z: 56 },
    { length: 52, width: 5, height: 0.4 },
    0xbbdefb,
    'PER21_GROUND_CORRIDOR',
    'PER21 Ground Floor Corridor'
  );

  const stairs = createIndoorBox(
    { x: 25, z: 56 },
    { length: 8, width: 8, height: 2.5 },
    0xffcc80,
    'PER21_STAIRS_A',
    'PER21 Stairs A',
    10.5
  );

  const firstFloorCorridor = createIndoorBox(
    { x: 47, z: 56 },
    { length: 52, width: 5, height: 0.4 },
    0x64b5f6,
    'PER21_FIRST_FLOOR_CORRIDOR',
    'PER21 First Floor Corridor',
    12.2
  );

  const secondFloorCorridor = createIndoorBox(
    { x: 47, z: 62 },
    { length: 52, width: 5, height: 0.4 },
    0x42a5f5,
    'PER21_SECOND_FLOOR_CORRIDOR',
    'PER21 Second Floor Corridor',
    15.2
  );

  indoorMeshes.push(
    lobby,
    groundCorridor,
    stairs,
    firstFloorCorridor,
    secondFloorCorridor
  );

  indoorMeshes.forEach((mesh) => {
    scene.add(mesh);
  });

  return indoorMeshes;
}