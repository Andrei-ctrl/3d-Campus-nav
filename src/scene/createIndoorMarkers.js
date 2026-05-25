import * as THREE from 'three';
import { buildingHeight, floorElevation } from '../data/buildings.js';

const MARKER_BASE_Y_BY_BUILDING = {
  PER21: buildingHeight(5) + 0.5,
  PER22: buildingHeight(2) + 0.5,
  PER17: buildingHeight(2) + 0.5
};

function markerBaseY(buildingId) {
  return MARKER_BASE_Y_BY_BUILDING[buildingId] ?? 9.5;
}

function createRoomMarker(room, roomNode, color = 0x2196f3) {
  const geometry = new THREE.CylinderGeometry(1.8, 1.8, 0.35, 20);
  const material = new THREE.MeshBasicMaterial({ color });

  const marker = new THREE.Mesh(geometry, material);
  const y = markerBaseY(room.buildingId) + floorElevation(roomNode.floor || 0);

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
  const y = markerBaseY(buildingId) + 0.3 + floorElevation(node.floor || 0);

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

const LABEL_SCALE = { x: 7, y: 2.2 };
const LABEL_CANVAS = { width: 256, height: 96 };
const LABEL_FONT = 'bold 26px Arial';

function labelHeightForFloor(buildingId, floor = 0) {
  return markerBaseY(buildingId) + 7.5 + floorElevation(floor);
}

function createRoomLabel(room, roomNode) {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_CANVAS.width;
  canvas.height = LABEL_CANVAS.height;

  const context = canvas.getContext('2d');

  context.fillStyle = 'rgba(0, 0, 0, 0.75)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#2196f3';
  context.font = LABEL_FONT;
  context.textAlign = 'center';
  context.fillText(room.name || roomNode.label, canvas.width / 2, 58);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  const y = labelHeightForFloor(room.buildingId, roomNode.floor || 0);

  sprite.position.set(roomNode.x, y, roomNode.z);
  sprite.scale.set(LABEL_SCALE.x, LABEL_SCALE.y, 1);
  sprite.renderOrder = 10;

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
