import { entrances } from './entrances.js';
import { getEntrancePosition } from './entranceUtils.js';

const PRIMARY_ANCHOR_ENTRANCE_IDS = [
  'PER21_MAIN_ENTRANCE',
  'PER22_ENTRANCE',
  'MENSA_ENTRANCE',
  'PER17_ENTRANCE'
];

function createAnchorFromEntrance(entrance) {
  return {
    id: `ANCHOR_${entrance.id}`,
    name: `I am at ${entrance.name}`,
    entranceId: entrance.id,
    position: getEntrancePosition(entrance.id)
  };
}

const primaryAnchors = PRIMARY_ANCHOR_ENTRANCE_IDS
  .map((entranceId) => entrances.find((entrance) => entrance.id === entranceId))
  .filter(Boolean)
  .map(createAnchorFromEntrance);

const secondaryAnchors = entrances
  .filter((entrance) => !PRIMARY_ANCHOR_ENTRANCE_IDS.includes(entrance.id))
  .map(createAnchorFromEntrance);

export const anchors = [...primaryAnchors, ...secondaryAnchors];

export function getAnchorById(anchorId) {
  const anchor = anchors.find((item) => item.id === anchorId);

  if (!anchor) {
    return null;
  }

  const position = getEntrancePosition(anchor.entranceId);

  return position ? { ...anchor, position } : anchor;
}

export function getAnchorForEntranceId(entranceId) {
  const anchor = anchors.find((item) => item.entranceId === entranceId);

  if (!anchor) {
    return null;
  }

  return getAnchorById(anchor.id);
}

export function getAnchorEntrancePosition(anchorId) {
  return getAnchorById(anchorId)?.position ?? null;
}
