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
  const indoorMeshes = [
    createIndoorBox(
      { x: 73, z: 50 },
      { length: 14, width: 10, height: 0.4 },
      0x90caf9,
      'PER21_LOBBY_AREA',
      'PER21 Lobby'
    ),
    createIndoorBox(
      { x: 10, z: 56 },
      { length: 150, width: 25, height: 0.4 },
      0xbbdefb,
      'PER21_GROUND_HALL_AREA',
      'PER21 Ground Floor Hall'
    ),
    createIndoorBox(
      { x: -55, z: 50 },
      { length: 22, width: 10, height: 0.45 },
      0x81c784,
      'PER21_GROUND_ROOM_WEST',
      'PER21 Ground Floor West Room'
    ),
    createIndoorBox(
      { x: 10, z: 50 },
      { length: 24, width: 10, height: 0.45 },
      0xfff59d,
      'PER21_DECANAT_AREA',
      'PER21 Decanat'
    ),
    createIndoorBox(
      { x: 75, z: 50 },
      { length: 22, width: 10, height: 0.45 },
      0x80cbc4,
      'PER21_GROUND_ROOM_EAST',
      'PER21 Ground Floor East Room'
    ),
    createIndoorBox(
      { x: 10, z: 66 },
      { length: 172, width: 5, height: 0.4 },
      0xb3e5fc,
      'PER21_GROUND_CORRIDOR',
      'PER21 Ground Floor Corridor'
    ),
    createIndoorBox(
      { x: 96, z: 66 },
      { length: 8, width: 8, height: 2.5 },
      0xffcc80,
      'PER21_STAIRS_A',
      'PER21 Stairs A',
      10.5
    ),
    createIndoorBox(
      { x: 10, z: 66 },
      { length: 8, width: 8, height: 2.5 },
      0xffb74d,
      'PER21_STAIRS_D',
      'PER21 Stairs D',
      10.5
    ),
    createIndoorBox(
      { x: -76, z: 66 },
      { length: 8, width: 8, height: 2.5 },
      0xffa726,
      'PER21_STAIRS_G',
      'PER21 Stairs G',
      10.5
    ),
    createIndoorBox(
      { x: 10, z: 64 },
      { length: 178, width: 5, height: 0.4 },
      0x64b5f6,
      'PER21_FIRST_FLOOR_CORRIDOR',
      'PER21 First Floor Classroom Corridor',
      12.2
    ),
    createIndoorBox(
      { x: 10, z: 70 },
      { length: 178, width: 4, height: 0.35 },
      0x42a5f5,
      'PER21_FIRST_FLOOR_CLASSROOM_ROW',
      'PER21 First Floor Classroom Row',
      12.45
    ),
    createIndoorBox(
      { x: 10, z: 64 },
      { length: 178, width: 5, height: 0.4 },
      0x1976d2,
      'PER21_SECOND_FLOOR_CORRIDOR',
      'PER21 Second Floor Classroom Corridor',
      15.2
    ),
    createIndoorBox(
      { x: 10, z: 70 },
      { length: 178, width: 4, height: 0.35 },
      0x1565c0,
      'PER21_SECOND_FLOOR_CLASSROOM_ROW',
      'PER21 Second Floor Classroom Row',
      15.45
    ),
    createIndoorBox(
      { x: 10, z: 47.25 },
      { length: 178, width: 17.5, height: 9 },
      0x0d47a1,
      'PER21_UPPER_MAIN_ENTRANCE_WING',
      'PER21 Upper Main Entrance Wing',
      12.5
    ),
    createIndoorBox(
      { x: 96, z: 47.25 },
      { length: 7, width: 7, height: 9 },
      0x64b5f6,
      'PER21_UPPER_STAIRS_A',
      'PER21 Upper Stairs A',
      12.5
    ),
    createIndoorBox(
      { x: 42, z: 47.25 },
      { length: 7, width: 7, height: 9 },
      0x64b5f6,
      'PER21_UPPER_STAIRS_C',
      'PER21 Upper Stairs C',
      12.5
    ),
    createIndoorBox(
      { x: -76, z: 47.25 },
      { length: 7, width: 7, height: 9 },
      0x64b5f6,
      'PER21_UPPER_STAIRS_G',
      'PER21 Upper Stairs G',
      12.5
    )
  ];

  indoorMeshes.forEach((mesh) => {
    scene.add(mesh);
  });

  return indoorMeshes;
}
