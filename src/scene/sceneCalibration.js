const STORAGE_KEY = 'sceneCalibration';
const LEGACY_STORAGE_KEY = 'arCalibration';
const STORAGE_VERSION = 4;

// Map coordinates are metres; globalScale shrinks the whole scene for desktop viewing.
// arScale applies in AR only (route line and any AR-placed models), independent of globalScale.

export const defaultSceneCalibration = {
  version: STORAGE_VERSION,
  globalScale: 1,
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  arScale: 1,
  arMirrorX: -1,
  mode: 'anchor-relative',
  livePreview: true
};

const CALIBRATION_LIMITS = {
  globalScale: { min: 0.01, max: 30 },
  offsetX: { min: -500, max: 500 },
  offsetY: { min: -100, max: 100 },
  offsetZ: { min: -500, max: 500 },
  arScale: { min: 0.001, max: 5 }
};

function clampCalibrationValue(key, value, fallback) {
  const limits = CALIBRATION_LIMITS[key];

  if (!limits) {
    return value ?? fallback;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(limits.max, Math.max(limits.min, numeric));
}

export function sanitizeSceneCalibration(raw = {}) {
  const merged = {
    ...defaultSceneCalibration,
    ...raw
  };

  merged.globalScale = clampCalibrationValue(
    'globalScale',
    merged.globalScale,
    defaultSceneCalibration.globalScale
  );
  merged.offsetX = clampCalibrationValue('offsetX', merged.offsetX, 0);
  merged.offsetY = clampCalibrationValue('offsetY', merged.offsetY, 0);
  merged.offsetZ = clampCalibrationValue('offsetZ', merged.offsetZ, 0);
  merged.arScale = clampCalibrationValue(
    'arScale',
    merged.arScale,
    defaultSceneCalibration.arScale
  );
  merged.arMirrorX = merged.arMirrorX === 1 ? 1 : -1;

  if (merged.mode !== 'camera-debug' && merged.mode !== 'anchor-relative') {
    merged.mode = defaultSceneCalibration.mode;
  }

  merged.livePreview = merged.livePreview !== false;

  return merged;
}

export function isCalibrationNonDefault(calibration = sceneCalibration) {
  return Object.entries(defaultSceneCalibration).some(([key, defaultValue]) => {
    if (key === 'mode' || key === 'livePreview' || key === 'arMirrorX') {
      return calibration[key] !== defaultValue;
    }

    return Math.abs(Number(calibration[key]) - Number(defaultValue)) > 0.001;
  });
}

const originalTransforms = new Map();
const objectGroups = new Map();
let sceneCalibration = loadSceneCalibration();
let isARActive = false;
let activeAnchor = null;

function migrateLegacyCalibration(legacy = {}) {
  if (!legacy || typeof legacy !== 'object') {
    return {};
  }

  return {
    globalScale: legacy.globalScale ?? undefined,
    offsetX: legacy.x ?? legacy.offsetX ?? undefined,
    offsetY: legacy.y ?? legacy.offsetY ?? undefined,
    offsetZ: legacy.z ?? legacy.offsetZ ?? undefined,
    mode: legacy.mode ?? undefined
  };
}

export function loadSceneCalibration() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const legacy = migrateLegacyCalibration(
      JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '{}')
    );
    const resetSavedScale = saved.version !== STORAGE_VERSION;

    return sanitizeSceneCalibration({
      ...legacy,
      ...saved,
      globalScale: resetSavedScale ? defaultSceneCalibration.globalScale : saved.globalScale,
      arScale: resetSavedScale ? defaultSceneCalibration.arScale : saved.arScale,
      mode: resetSavedScale ? defaultSceneCalibration.mode : saved.mode
    });
  } catch (error) {
    console.warn('Could not load scene calibration:', error);
    return { ...defaultSceneCalibration };
  }
}

export function getSceneCalibration() {
  return { ...sceneCalibration };
}

export function setSceneCalibration(nextCalibration) {
  sceneCalibration = sanitizeSceneCalibration(nextCalibration);
}

export function saveSceneCalibration() {
  sceneCalibration.version = STORAGE_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sceneCalibration));
}

function rememberOriginalTransform(object) {
  if (!object || originalTransforms.has(object)) {
    return;
  }

  originalTransforms.set(object, {
    position: object.position.clone(),
    scale: object.scale.clone()
  });
}

export function registerCalibratedObjects(groupName, objects = []) {
  const list = objectGroups.get(groupName) || [];

  objects.forEach((object) => {
    if (!object) return;

    rememberOriginalTransform(object);
    object.userData.calibrationGroup = groupName;

    if (!list.includes(object)) {
      list.push(object);
    }
  });

  objectGroups.set(groupName, list);
}

export function registerCalibratedObject(groupName, object) {
  registerCalibratedObjects(groupName, [object]);
}

export function unregisterCalibratedObject(object) {
  if (!object) return;

  const groupName = object.userData.calibrationGroup;

  if (groupName && objectGroups.has(groupName)) {
    objectGroups.set(
      groupName,
      objectGroups.get(groupName).filter((item) => item !== object)
    );
  }

  originalTransforms.delete(object);
}

const AR_BASE_Y_BY_GROUP = {
  buildings: 0,
  per21Indoor: 9,
  per22Indoor: 9,
  per17Indoor: 9,
  markers: 9,
  paths: 0,
  ground: 0,
  routes: 9
};

function getArBaseY(groupName) {
  return AR_BASE_Y_BY_GROUP[groupName] ?? 0;
}

function applyTransformToObject(object, calibration, options = {}) {
  const original = originalTransforms.get(object);

  if (!original) return;

  const groupName = object.userData.calibrationGroup || 'buildings';
  const layoutScale = calibration.globalScale;

  let positionX = calibration.offsetX + original.position.x * layoutScale;
  let positionY = calibration.offsetY + original.position.y * layoutScale;
  let positionZ = calibration.offsetZ + original.position.z * layoutScale;

  let scaleX = original.scale.x * layoutScale;
  let scaleY = original.scale.y * layoutScale;
  let scaleZ = original.scale.z * layoutScale;

  if (options.anchor && isARActive) {
    const anchor = options.anchor.position;
    const arScale = calibration.arScale ?? defaultSceneCalibration.arScale;
    const mirrorX = calibration.arMirrorX ?? -1;
    const dx = original.position.x - anchor.x;
    const dz = original.position.z - anchor.z;

    positionX = mirrorX * dx * arScale;
    positionY = (original.position.y - getArBaseY(groupName)) * arScale;
    positionZ = -dz * arScale;

    scaleX = original.scale.x * arScale;
    scaleY = original.scale.y * arScale;
    scaleZ = original.scale.z * arScale;
  }

  object.position.set(positionX, positionY, positionZ);
  object.scale.set(scaleX, scaleY, scaleZ);
}

export function applySceneCalibration(options = {}) {
  const calibration = options.calibration || getSceneCalibration();
  const anchor = options.anchor || activeAnchor;

  objectGroups.forEach((objects) => {
    objects.forEach((object) => {
      applyTransformToObject(object, calibration, { anchor });
    });
  });
}

export function restoreSceneCalibration() {
  originalTransforms.forEach((original, object) => {
    object.position.copy(original.position);
    object.scale.copy(original.scale);
  });

  isARActive = false;
  activeAnchor = null;
}

export function enterARCalibrationView(anchor, calibration = getSceneCalibration()) {
  isARActive = true;
  activeAnchor = anchor;
  applySceneCalibration({ calibration, anchor });
}

export function exitARCalibrationView() {
  isARActive = false;
  activeAnchor = null;
  applySceneCalibration();
}

export function resetSceneCalibration() {
  sceneCalibration = { ...defaultSceneCalibration };
  saveSceneCalibration();
  applySceneCalibration();
}

export function getSceneMirrorX() {
  return sceneCalibration.arMirrorX ?? -1;
}

export function isSceneMirrored() {
  return getSceneMirrorX() === -1;
}

export function getSceneMirrorLabel() {
  return isSceneMirrored() ? 'Mirrored (AR)' : 'Default (AR)';
}

export function toggleSceneMirrorX(options = {}) {
  const nextMirrorX = getSceneMirrorX() === -1 ? 1 : -1;

  sceneCalibration = {
    ...sceneCalibration,
    arMirrorX: nextMirrorX
  };

  if (options.save !== false) {
    saveSceneCalibration();
  }

  applySceneCalibration();

  return nextMirrorX;
}
