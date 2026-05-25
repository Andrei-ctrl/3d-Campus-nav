const STORAGE_KEY = 'sceneCalibration';
const LEGACY_STORAGE_KEY = 'arCalibration';

export const defaultSceneCalibration = {
  globalScale: 1,
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  pivotX: 0,
  pivotY: 0,
  pivotZ: 0,
  buildingsScale: 1,
  per21IndoorScale: 1,
  per22IndoorScale: 1,
  per17IndoorScale: 1,
  pathsScale: 1,
  markersScale: 1,
  groundScale: 1,
  routesScale: 1,
  arScale: 0.05,
  arOffsetX: 0,
  arOffsetY: 0,
  arOffsetZ: -1.5,
  arMirrorX: -1,
  mode: 'anchor-relative',
  livePreview: true
};

const CALIBRATION_LIMITS = {
  globalScale: { min: 0.05, max: 15 },
  offsetX: { min: -500, max: 500 },
  offsetY: { min: -100, max: 100 },
  offsetZ: { min: -500, max: 500 },
  pivotX: { min: -500, max: 500 },
  pivotY: { min: -100, max: 100 },
  pivotZ: { min: -500, max: 500 },
  buildingsScale: { min: 0.1, max: 5 },
  per21IndoorScale: { min: 0.1, max: 5 },
  per22IndoorScale: { min: 0.1, max: 5 },
  per17IndoorScale: { min: 0.1, max: 5 },
  pathsScale: { min: 0.1, max: 5 },
  markersScale: { min: 0.1, max: 5 },
  groundScale: { min: 0.1, max: 5 },
  routesScale: { min: 0.1, max: 5 },
  arScale: { min: 0.001, max: 2 },
  arOffsetX: { min: -50, max: 50 },
  arOffsetY: { min: -50, max: 50 },
  arOffsetZ: { min: -50, max: 50 }
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

  Object.keys(defaultSceneCalibration).forEach((key) => {
    if (key === 'mode' || key === 'livePreview') {
      return;
    }

    if (key === 'arMirrorX') {
      merged.arMirrorX = merged.arMirrorX === 1 ? 1 : -1;
      return;
    }

    merged[key] = clampCalibrationValue(
      key,
      merged[key],
      defaultSceneCalibration[key]
    );
  });

  if (merged.mode !== 'camera-debug' && merged.mode !== 'anchor-relative') {
    merged.mode = defaultSceneCalibration.mode;
  }

  merged.livePreview = merged.livePreview !== false;

  // Older builds used arOffsetY=-0.45 to compensate for indoor overlay height; base-Y handles that now.
  if (Math.abs(Number(merged.arOffsetY) - (-0.45)) < 0.01) {
    merged.arOffsetY = defaultSceneCalibration.arOffsetY;
  }

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
    arScale: legacy.scale ?? defaultSceneCalibration.arScale,
    arOffsetX: legacy.x ?? defaultSceneCalibration.arOffsetX,
    arOffsetY: legacy.y ?? defaultSceneCalibration.arOffsetY,
    arOffsetZ: legacy.z ?? defaultSceneCalibration.arOffsetZ,
    mode: legacy.mode ?? defaultSceneCalibration.mode
  };
}

export function loadSceneCalibration() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const legacy = migrateLegacyCalibration(
      JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '{}')
    );

    return sanitizeSceneCalibration({
      ...legacy,
      ...saved
    });
  } catch (error) {
    console.warn('Could not load scene calibration:', error);
    return { ...defaultSceneCalibration };
  }
}

export function getSceneCalibration() {
  return sceneCalibration;
}

export function setSceneCalibration(nextCalibration) {
  sceneCalibration = sanitizeSceneCalibration(nextCalibration);
}

export function saveSceneCalibration() {
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

function getGroupScale(groupName, calibration) {
  switch (groupName) {
    case 'buildings':
      return calibration.buildingsScale;
    case 'per21Indoor':
      return calibration.buildingsScale * calibration.per21IndoorScale;
    case 'per22Indoor':
      return calibration.buildingsScale * calibration.per22IndoorScale;
    case 'per17Indoor':
      return calibration.buildingsScale * calibration.per17IndoorScale;
    case 'paths':
      return calibration.pathsScale;
    case 'markers':
      return calibration.markersScale;
    case 'ground':
      return calibration.groundScale;
    case 'routes':
      // Keep route lines aligned with roads/paths; routesScale is a multiplier only.
      return calibration.pathsScale * calibration.routesScale;
    default:
      return 1;
  }
}

function applyTransformToObject(object, calibration, options = {}) {
  const original = originalTransforms.get(object);

  if (!original) return;

  const groupName = object.userData.calibrationGroup || 'buildings';
  const groupScale = getGroupScale(groupName, calibration);
  const globalScale = calibration.globalScale;
  const layoutScale = globalScale * groupScale;
  const pivot = options.pivot || {
    x: calibration.pivotX,
    y: calibration.pivotY,
    z: calibration.pivotZ
  };

  let positionX =
    calibration.offsetX +
    pivot.x +
    (original.position.x - pivot.x) * layoutScale;
  let positionY =
    calibration.offsetY +
    pivot.y +
    (original.position.y - pivot.y) * layoutScale;
  let positionZ =
    calibration.offsetZ +
    pivot.z +
    (original.position.z - pivot.z) * layoutScale;

  let scaleX = original.scale.x * layoutScale;
  let scaleY = original.scale.y * layoutScale;
  let scaleZ = original.scale.z * layoutScale;

  if (options.anchor && isARActive) {
    const anchor = options.anchor.position;
    const arScale = calibration.arScale;
    const mirrorX = calibration.arMirrorX ?? -1;
    const dx = original.position.x - anchor.x;
    const dz = original.position.z - anchor.z;

    positionX =
      calibration.arOffsetX +
      mirrorX * dx * arScale * layoutScale;
    positionY =
      calibration.arOffsetY +
      (original.position.y - getArBaseY(groupName)) * arScale * layoutScale;
    positionZ =
      calibration.arOffsetZ -
      dz * arScale * layoutScale;

    scaleX = original.scale.x * arScale * layoutScale;
    scaleY = original.scale.y * arScale * layoutScale;
    scaleZ = original.scale.z * arScale * layoutScale;
  }

  object.position.set(positionX, positionY, positionZ);
  object.scale.set(scaleX, scaleY, scaleZ);
}

export function applySceneCalibration(options = {}) {
  const calibration = options.calibration || sceneCalibration;
  const anchor = options.anchor || activeAnchor;

  objectGroups.forEach((objects) => {
    objects.forEach((object) => {
      applyTransformToObject(object, calibration, { anchor, pivot: options.pivot });
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

export function enterARCalibrationView(anchor, calibration = sceneCalibration) {
  isARActive = true;
  activeAnchor = anchor;
  applySceneCalibration({ calibration, anchor });
}

export function exitARCalibrationView() {
  isARActive = false;
  activeAnchor = null;
  applySceneCalibration();
}

export function setCalibrationPivot(pivot) {
  sceneCalibration = {
    ...sceneCalibration,
    pivotX: pivot.x,
    pivotY: pivot.y,
    pivotZ: pivot.z
  };
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
