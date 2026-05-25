import * as THREE from 'three';

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function createRoadMeshFromPoints(start, end, width, color, id, name) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;

  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const geometry = new THREE.BoxGeometry(length, 0.08, width);
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
  mesh.receiveShadow = true;

  mesh.userData = {
    type: 'road',
    id,
    name
  };

  return mesh;
}

function createRoadMeshFromCenter(center, length, width, rotationDeg, color, id, name) {
  const geometry = new THREE.BoxGeometry(length, 0.08, width);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0
  });

  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(center.x, 0.04, center.z);
  mesh.rotation.y = -degToRad(rotationDeg);
  mesh.receiveShadow = true;

  mesh.userData = {
    type: 'road',
    id,
    name
  };

  return mesh;
}

export function createMeasuredRoad(scene) {
  const bdPerolles = createRoadMeshFromPoints(
    { x: -10.066, z: -100.723 },
    { x: 151.851, z: 74.098 },
    7.5,
    '#4a5660',
    'BD_PEROLLES',
    'Boulevard de Pérolles'
  );

  scene.add(bdPerolles);

  return bdPerolles;
}

export function createMensaPer17Road(scene) {
  /*
    Secondary road near Mensa and PER17.
    It is parallel to Mensa and perpendicular to PER17.
    It is intentionally placed closer to Mensa than PER17.
  */
  const mensaPer17Road = createRoadMeshFromCenter(
    { x: 178.441, z: 16.924 },
    125,
    6,
    90,
    '#5f6a70',
    'MENSA_PER17_ROAD',
    'Road near Mensa and PER17'
  );

  scene.add(mensaPer17Road);

  return mensaPer17Road;
}