import * as THREE from 'three';
import { getEntrancePosition } from '../data/entranceUtils.js';

const PER17_ROOM_Z = -19;
const per17Entrance = getEntrancePosition('PER17_ENTRANCE');
const per17BackEntrance = getEntrancePosition('PER17_BACK_ENTRANCE');

function createIndoorBox(center, size, color, id, name, y = 9.2) {
  const geometry = new THREE.BoxGeometry(size.length, size.height, size.width);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0,
    transparent: true,
    opacity: 0.52
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(center.x, y, center.z);

  mesh.userData = {
    type: 'indoor-structure',
    layer: 'per17-indoor',
    buildingId: 'PER17',
    id,
    name
  };

  return mesh;
}

export function createPer17IndoorStructure(scene) {
  const indoorMeshes = [
    createIndoorBox(
      { x: per17Entrance.x + 10, z: per17Entrance.z },
      { length: 10, width: 8, height: 0.4 },
      0xbbdefb,
      'PER17_LOBBY_AREA',
      'PER17 Lobby'
    ),
    createIndoorBox(
      { x: per17Entrance.x + 30, z: per17Entrance.z },
      { length: 50, width: 4, height: 0.4 },
      0x90caf9,
      'PER17_CORRIDOR_AREA',
      'PER17 Corridor'
    ),
    createIndoorBox(
      { x: per17BackEntrance.x - 12, z: per17BackEntrance.z },
      { length: 8, width: 4, height: 0.4 },
      0x81d4fa,
      'PER17_BACK_CORRIDOR_AREA',
      'PER17 Back corridor'
    ),
    createIndoorBox(
      { x: per17Entrance.x + 20, z: PER17_ROOM_Z },
      { length: 9, width: 6, height: 0.35 },
      0x64b5f6,
      'PER17_ROOM_001_AREA',
      'Salle 001 area'
    ),
    createIndoorBox(
      { x: per17Entrance.x + 40, z: PER17_ROOM_Z },
      { length: 11, width: 6, height: 0.35 },
      0x42a5f5,
      'PER17_MICROSCOPES_010_AREA',
      'Microscopes 010 area'
    ),
    createIndoorBox(
      { x: per17Entrance.x + 60, z: PER17_ROOM_Z },
      { length: 11, width: 6, height: 0.35 },
      0xffcc80,
      'PER17_REUNION_036_AREA',
      'Réunion 036 area'
    )
  ];

  indoorMeshes.forEach((mesh) => {
    scene.add(mesh);
  });

  return indoorMeshes;
}
