import { entrances } from './entrances.js';

export function getEntranceById(entranceId) {
  return entrances.find((entrance) => entrance.id === entranceId) || null;
}

function getOutwardOffset(entrance) {
  return entrance?.outwardOffset || { x: 0, z: 0 };
}

export function getEntrancePosition(entranceId) {
  const entrance = getEntranceById(entranceId);

  if (!entrance) {
    return null;
  }

  const offset = getOutwardOffset(entrance);

  return {
    x: entrance.position.x + offset.x,
    y: entrance.position.y ?? 0,
    z: entrance.position.z + offset.z
  };
}

export function getEntranceFacadePosition(entranceId) {
  const entrance = getEntranceById(entranceId);

  if (!entrance) {
    return null;
  }

  return {
    x: entrance.position.x,
    y: entrance.position.y ?? 0,
    z: entrance.position.z
  };
}

export function createGraphEntranceNode(entranceId, overrides = {}) {
  const entrance = getEntranceById(entranceId);

  if (!entrance) {
    throw new Error(`Unknown entrance id for graph node: ${entranceId}`);
  }

  const position = getEntrancePosition(entranceId);

  return {
    x: position.x,
    z: position.z,
    label: entrance.name,
    type: 'entrance',
    ...overrides
  };
}

export function createGraphPathAtEntranceX(entranceId, z, label, type = 'path') {
  const position = getEntrancePosition(entranceId);

  if (!position) {
    throw new Error(`Unknown entrance id for path node: ${entranceId}`);
  }

  return {
    x: position.x,
    z,
    label,
    type
  };
}
