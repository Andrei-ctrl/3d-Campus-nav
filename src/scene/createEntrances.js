import * as THREE from 'three';

function createEntranceMarker(entrance) {
  const geometry = new THREE.ConeGeometry(3, 7, 24);
  const material = new THREE.MeshStandardMaterial({
    color: '#ffd400',
    roughness: 0.5,
    metalness: 0
  });

  const marker = new THREE.Mesh(geometry, material);

  marker.position.set(
    entrance.position.x,
    3.5,
    entrance.position.z
  );

  marker.userData = {
    type: 'entrance',
    layer: 'buildings',
    id: entrance.id,
    buildingId: entrance.buildingId,
    name: entrance.name,
    description: entrance.description,
    category: 'Entrance'
  };

  marker.castShadow = true;
  marker.receiveShadow = true;

  return marker;
}

function createEntranceLabel(entrance) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;

  const context = canvas.getContext('2d');

  context.fillStyle = 'rgba(0, 0, 0, 0.75)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#ffd400';
  context.font = 'bold 34px Arial';
  context.textAlign = 'center';
  context.fillText(entrance.name, canvas.width / 2, 65);

  context.fillStyle = 'white';
  context.font = '24px Arial';
  context.fillText(entrance.buildingId, canvas.width / 2, 110);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });

  const sprite = new THREE.Sprite(material);

  sprite.position.set(
    0,
    9.5,
    0
  );

  sprite.scale.set(24, 8, 1);

  sprite.userData = {
    type: 'entrance-label',
    layer: 'buildings',
    id: `${entrance.id}_LABEL`,
    name: entrance.name
  };

  return sprite;
}

export function createEntrances(scene, entrances) {
  const entranceMeshes = {};

  entrances.forEach((entrance) => {
    const marker = createEntranceMarker(entrance);
    const label = createEntranceLabel(entrance);

    marker.add(label);
    scene.add(marker);

    entranceMeshes[entrance.id] = marker;
  });

  return entranceMeshes;
}
