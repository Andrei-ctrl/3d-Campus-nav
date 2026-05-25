import * as THREE from 'three';

function createRoomMarker(room, roomNode, color = 0x2196f3) {
  const geometry = new THREE.CylinderGeometry(1.8, 1.8, 0.35, 20);
  const material = new THREE.MeshBasicMaterial({ color });

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

function createNavigationMarker(nodeId, node, buildingId) {
  const isVertical = node.type === 'stairs' || node.type === 'elevator';
  const geometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
  const material = new THREE.MeshBasicMaterial({
    color: isVertical ? 0xff9800 : 0x00bcd4
  });

  const marker = new THREE.Mesh(geometry, material);
  const y = 9.8 + (node.floor || 0) * 3;

  marker.position.set(node.x, y, node.z);

  marker.userData = {
    type: 'indoor-nav-marker',
    layer: `${buildingId.toLowerCase()}-indoor`,
    buildingId,
    id: `${nodeId}_NAV_MARKER`,
    name: node.label || nodeId
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
  context.fillText(room.name || roomNode.label, canvas.width / 2, 78);

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

const NAV_MARKER_TYPES = new Set(['entrance']);

export function createRoomMarkers(scene, rooms, indoorGraphs, options = {}) {
  const navigationMarkerBuildings = new Set(options.navigationMarkerBuildings ?? ['PER21']);
  const markerMeshes = [];

  rooms.forEach((room) => {
    const allowedIds = options.roomMarkerIdsByBuilding?.[room.buildingId];

    if (allowedIds && !allowedIds.includes(room.id)) return;

    const indoorGraph = indoorGraphs[room.buildingId];
    const node = indoorGraph?.nodes?.[room.indoorNodeId];

    if (!node) return;

    const roomNode = { id: room.indoorNodeId, ...node };
    const marker = createRoomMarker(room, roomNode);

    scene.add(marker);
    markerMeshes.push(marker);

    const showLabels = options.showRoomLabelsByBuilding?.[room.buildingId] ?? true;

    if (showLabels) {
      const label = createRoomLabel(room, roomNode);
      scene.add(label);
      markerMeshes.push(label);
    }
  });

  navigationMarkerBuildings.forEach((buildingId) => {
    const graph = indoorGraphs[buildingId];

    if (!graph?.nodes) return;

    const seen = new Set();

    Object.entries(graph.nodes).forEach(([nodeId, node]) => {
      if (!NAV_MARKER_TYPES.has(node.type)) return;
      if ((node.floor || 0) !== 0) return;
      if (seen.has(nodeId)) return;

      seen.add(nodeId);

      const marker = createNavigationMarker(nodeId, node, buildingId);
      scene.add(marker);
      markerMeshes.push(marker);
    });
  });

  return markerMeshes;
}
