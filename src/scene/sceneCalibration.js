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
  arOffsetY: -0.45,
  arOffsetZ: -1.5,
  arMirrorX: -1,
  mode: 'anchor-relative',
  livePreview: true
};

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

    return {
      ...defaultSceneCalibration,
      ...legacy,
      ...saved
    };
  } catch (error) {
    console.warn('Could not load scene calibration:', error);
    return { ...defaultSceneCalibration };
  }
}

export function getSceneCalibration() {
  return sceneCalibration;
}

export function setSceneCalibration(nextCalibration) {
  sceneCalibration = {
    ...defaultSceneCalibration,
    ...nextCalibration
  };
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

function getGroupScale(groupName, calibration) {
  switch (groupName) {
    case 'buildings':
      return calibration.buildingsScale;
    case 'per21Indoor':
      return calibration.per21IndoorScale;
    case 'per22Indoor':
      return calibration.per22IndoorScale;
    case 'per17Indoor':
      return calibration.per17IndoorScale;
    case 'paths':
      return calibration.pathsScale;
    case 'markers':
      return calibration.markersScale;
    case 'ground':
      return calibration.groundScale;
    case 'routes':
      return calibration.routesScale;
    default:
      return 1;
  }
}

function applyTransformToObject(object, calibration, options = {}) {
  const original = originalTransforms.get(object);

  if (!original) return;

  const groupName = object.userData.calibrationGroup || 'buildings';
  const groupScale = getGroupScale(groupName, calibration);
  const sceneScale = calibration.globalScale * groupScale;
  const pivot = options.pivot || {
    x: calibration.pivotX,
    y: calibration.pivotY,
    z: calibration.pivotZ
  };

  let positionX =
    calibration.offsetX +
    pivot.x +
    (original.position.x - pivot.x) * sceneScale;
  let positionY =
    calibration.offsetY +
    pivot.y +
    (original.position.y - pivot.y) * sceneScale;
  let positionZ =
    calibration.offsetZ +
    pivot.z +
    (original.position.z - pivot.z) * sceneScale;

  let scaleX = original.scale.x * sceneScale;
  let scaleY = original.scale.y * sceneScale;
  let scaleZ = original.scale.z * sceneScale;

  if (options.anchor && isARActive) {
    const anchor = options.anchor.position;
    const arScale = calibration.arScale;
    const arMirrorX = calibration.arMirrorX ?? -1;
    const dx = original.position.x - anchor.x;
    const dz = original.position.z - anchor.z;

    positionX =
      calibration.arOffsetX +
      arMirrorX * dx * arScale * groupScale;
    positionY = calibration.arOffsetY + original.position.y * arScale * groupScale;
    positionZ =
      calibration.arOffsetZ -
      dz * arScale * groupScale;

    scaleX = original.scale.x * arScale * groupScale;
    scaleY = original.scale.y * arScale * groupScale;
    scaleZ = original.scale.z * arScale * groupScale;
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
