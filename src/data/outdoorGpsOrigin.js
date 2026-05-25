import { getEntrancePosition } from './entranceUtils.js';

// Reference GPS for PER21 main entrance on the HEIA-FR Pérolles campus (Fribourg).
// Calibrate latitude/longitude on site if the blue GPS marker is offset on the map.
const per21Main = getEntrancePosition('PER21_MAIN_ENTRANCE');

export const OUTDOOR_GPS_ORIGIN = {
  latitude: 46.79307,
  longitude: 7.15258,
  localX: per21Main.x,
  localZ: per21Main.z
};

export const OUTDOOR_SCALE_OPTIONS = {
  scaleX: 1,
  scaleZ: 1
};
