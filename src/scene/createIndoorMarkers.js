import * as THREE from 'three';

function createRoomMarker(roomNode) {
  const geometry = new THREE.CylinderGeometry(2.5, 2.5, 0.4, 24);
  const material = new THREE.MeshBasicMaterial({
    color: 0x2196f3
  });

  const marker = new THREE.Mesh(geometry, material);

  const y = 9.5 + (roomNode.floor || 0) * 3;

  marker.position.set(roomNode.x, y, roomNode.z);

  marker.userData = {
    type: 'indoor-room-marker',
    id: roomNode.id,
    name: roomNode.label
  };

  return marker;
}

function createRoomLabel(roomNode) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 128;

  const context = canvas.getContext('2d');

  context.fillStyle = 'rgba(0, 0, 0, 0.75)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#2196f3';
  context.font = 'bold 38px Arial';
  context.textAlign = 'center';
  context.fillText(roomNode.label, canvas.width / 2, 78);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });

  const sprite = new THREE.Sprite(material);

  const y = 15 + (roomNode.floor || 0) * 3;

  sprite.position.set(roomNode.x, y, roomNode.z);
  sprite.scale.set(18, 6, 1);

  return sprite;
}

export function createIndoorMarkers(scene, indoorGraph) {
  const markerMeshes = [];

  Object.entries(indoorGraph.nodes).forEach(([nodeId, node]) => {
    if (!nodeId.startsWith('PER21_C')) return;

    const roomNode = {
      id: nodeId,
      ...node
    };

    const marker = createRoomMarker(roomNode);
    const label = createRoomLabel(roomNode);

    marker.userData.layer = 'per21-indoor';
    label.userData.layer = 'per21-indoor';

    scene.add(marker);
    scene.add(label);

    markerMeshes.push(marker, label);
  });

  return markerMeshes;
}