import * as THREE from 'three';

function createRoomMarker(room, roomNode) {
  const geometry = new THREE.CylinderGeometry(2.5, 2.5, 0.4, 24);
  const material = new THREE.MeshBasicMaterial({
    color: 0x2196f3
  });

  const marker = new THREE.Mesh(geometry, material);

  const y = 9.5 + (roomNode.floor || 0) * 3;

  marker.position.set(roomNode.x, y, roomNode.z);

  marker.userData = {
    type: 'indoor-room-marker',
    layer: `${room.buildingId.toLowerCase()}-indoor`,
    buildingId: room.buildingId,
    roomId: room.id,
    id: `${room.id}_MARKER`,
    name: roomNode.label || room.name
  };

  return marker;
}

function createRoomLabel(room, roomNode) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 128;

  const context = canvas.getContext('2d');

  context.fillStyle = 'rgba(0, 0, 0, 0.75)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#2196f3';
  context.font = 'bold 38px Arial';
  context.textAlign = 'center';
  context.fillText(roomNode.label || room.name, canvas.width / 2, 78);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });

  const sprite = new THREE.Sprite(material);

  const y = 15 + (roomNode.floor || 0) * 3;

  sprite.position.set(roomNode.x, y, roomNode.z);
  sprite.scale.set(18, 6, 1);

  sprite.userData = {
    type: 'indoor-room-label',
    layer: `${room.buildingId.toLowerCase()}-indoor`,
    buildingId: room.buildingId,
    roomId: room.id,
    id: `${room.id}_LABEL`,
    name: roomNode.label || room.name
  };

  return sprite;
}

export function createRoomMarkers(scene, rooms, indoorGraphs) {
  const markerMeshes = [];

  rooms.forEach((room) => {
    const indoorGraph = indoorGraphs[room.buildingId];
    const node = indoorGraph?.nodes?.[room.indoorNodeId];

    if (!node) return;

    const roomNode = {
      id: room.indoorNodeId,
      ...node
    };

    const marker = createRoomMarker(room, roomNode);
    const label = createRoomLabel(room, roomNode);
    scene.add(marker);
    scene.add(label);

    markerMeshes.push(marker, label);
  });

  return markerMeshes;
}
