import * as THREE from 'three';
import { FLOOR_HEIGHT, buildingHeight } from '../data/buildings.js';

const PER22_SHELL_HEIGHT = buildingHeight(2);
const AUDITORIUM_HEIGHT = FLOOR_HEIGHT;
const LIBRARY_HEIGHT = PER22_SHELL_HEIGHT - AUDITORIUM_HEIGHT;

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
      { length: 24, width: 24, height: AUDITORIUM_HEIGHT },
      0x7e57c2,
      'PER22_AUDITORIUM_JOSEPH_DEISS_VOLUME',
      'Auditorium Joseph Deiss',
      AUDITORIUM_HEIGHT / 2
    ),
    createIndoorBox(
      { x: -48.5, z: 23.5 },
      { length: 24, width: 24, height: LIBRARY_HEIGHT },
      0x26a69a,
      'PER22_LIBRARY_VOLUME',
      'PER22 Library',
      AUDITORIUM_HEIGHT + LIBRARY_HEIGHT / 2
    ),
    createIndoorBox(
      { x: -49, z: 28 },
      { length: 5, width: 5, height: PER22_SHELL_HEIGHT },
      0xffb74d,
      'PER22_STAIRS_VOLUME',
      'PER22 Stairs — vertical circulation',
      PER22_SHELL_HEIGHT / 2
    ),
    createIndoorBox(
      { x: -40, z: 28 },
      { length: 3, width: 2, height: 0.4 },
      0x90caf9,
      'PER22_PER21_CONNECTION_AREA',
      'Indoor passage to PER21',
      0.2
    )
  ];

  indoorMeshes.forEach((mesh) => {
    scene.add(mesh);
  });

  return indoorMeshes;
}
