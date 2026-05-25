import * as THREE from 'three';

import { isARSupported, startARSession } from './ar/arSession.js';
import { renderARRoute, clearARRoute, setARRouteVisible } from './ar/arRouteRenderer.js';
import {
  clearIndoorARRoute,
  prepareIndoorARRoute,
  updateRouteProgress,
  anchorRouteToCurrentCamera
} from './ar/indoorRouteProgress.js';
import { convertRouteToAnchorRelative } from './ar/arRouteAdapter.js';
import { anchors, getAnchorById, getAnchorForEntranceId } from './data/anchors.js';

import { createRoomMarkers } from './scene/createIndoorMarkers.js';
import { per21IndoorGraph } from './data/per21IndoorGraph.js';
import { per17IndoorGraph } from './data/per17IndoorGraph.js';
import { per22IndoorGraph } from './data/per22IndoorGraph.js';
import { createPer21IndoorStructure } from './scene/createPer21IndoorStructure.js';
import { createPer17IndoorStructure } from './scene/createPer17IndoorStructure.js';
import { createPer22IndoorStructure } from './scene/createPer22IndoorStructure.js';
import {
  renderIndoorRoute,
  renderIndoorRouteSegments,
  clearIndoorRoute,
  setIndoorRouteVisible,
  setIndoorRouteBuildingVisible,
  setIndoorRouteCalibrationHook
} from './navigation/indoorRouteRenderer.js';
import { planCrossBuildingRoute } from './navigation/campusRoute.js';
import {
  applySceneCalibration,
  getSceneCalibration,
  getSceneMirrorLabel,
  isCalibrationNonDefault,
  registerCalibratedObject,
  registerCalibratedObjects,
  toggleSceneMirrorX,
  unregisterCalibratedObject
} from './scene/sceneCalibration.js';
import { createCalibrationPanel } from './ui/calibrationPanel.js';
import { createOutdoorTrackingPanel } from './ui/outdoorTrackingPanel.js';
import { createARRouteProgressPanel } from './ui/arRouteProgressPanel.js';

import { rooms } from './data/rooms.js';
import { createDestinations } from './data/destinations.js';
import { loadCampusTimetable } from './data/timetableLoader.js';
import { pedestrianPaths } from './data/pedestrianPaths.js';
import { createPedestrianPaths } from './scene/createPedestrianPaths.js';
import { graph } from './data/graph.js';
import { findShortestPath } from './navigation/dijkstra.js';

import { resolveNavigationCommand } from './llm/navigationAgent.js';
import { createRouteControls } from './ui/controls.js';
import { makeWidgetDraggable, setupWidget } from './ui/widgets.js';
import { initAppMenu, registerDynamicDebugWidget, isDebugModeEnabled } from './ui/appMenu.js';
import {
  renderRoute,
  clearRoute,
  setRouteVisible,
  calculateRouteDistance,
  setRouteCalibrationHook
} from './navigation/routeRenderer.js';

const navigationState = {
  destinations: createDestinations(rooms),
  timetableMeta: null
};

function getDestinations() {
  return navigationState.destinations;
}

let routeControls = null;

import {
  createScene,
  createCamera,
  createRenderer,
  createLighting,
  createGround,
  createOrbitControls,
  fitCameraToObjects
} from './scene/createScene.js';

import { createCampusBuildings } from './scene/createBuildings.js';
import {
  createMeasuredRoad,
  createMensaPer17Road
} from './scene/createMeasuredRoad.js';

import { buildings } from './data/buildings.js';
import { entrances } from './data/entrances.js';
import { getEntrancePosition } from './data/entranceUtils.js';
import { createEntrances } from './scene/createEntrances.js';

// Initialize scene
const canvas = document.getElementById('canvas');

if (!canvas) {
  throw new Error('Canvas element with id="canvas" was not found.');
}

const scene = createScene();
const camera = createCamera(window.innerWidth, window.innerHeight);
const renderer = createRenderer(canvas);
const controls = createOrbitControls(camera, renderer);

// Setup lighting and ground
createLighting(scene);
const ground = createGround(scene);

// Create campus objects
const buildingMeshes = createCampusBuildings(scene, buildings);
const entranceMeshes = createEntrances(scene, entrances);

const indoorGraphs = {
  PER21: per21IndoorGraph,
  PER22: per22IndoorGraph,
  PER17: per17IndoorGraph
};

// Create indoor markers and structure layers.
const per21IndoorStructureMeshes = createPer21IndoorStructure(scene);
const per22IndoorStructureMeshes = createPer22IndoorStructure(scene);
const per17IndoorStructureMeshes = createPer17IndoorStructure(scene);
const indoorMarkerMeshes = createRoomMarkers(scene, rooms, indoorGraphs, {
  navigationMarkerBuildings: ['PER21'],
  roomMarkerIdsByBuilding: { PER22: ['PER22_LIBRARY'] }
});

const per21IndoorMeshes = [
  ...per21IndoorStructureMeshes,
  ...indoorMarkerMeshes.filter((mesh) => mesh.userData.buildingId === 'PER21')
];

const per17IndoorMeshes = [
  ...per17IndoorStructureMeshes,
  ...indoorMarkerMeshes.filter((mesh) => mesh.userData.buildingId === 'PER17')
];

const per22IndoorMeshes = [
  ...per22IndoorStructureMeshes,
  ...indoorMarkerMeshes.filter((mesh) => mesh.userData.buildingId === 'PER22')
];

let isIndoorLayerVisible = true;
let isPer22IndoorLayerVisible = true;
let isPer17IndoorLayerVisible = true;
let areBuildingsVisible = true;
let areRoutesVisible = true;
let areLabelsVisible = true;
let areBuildingsTransparent = false;
let latestOutdoorPath = [];
let latestRoutePlan = null;
let latestAnchor = null;
let latestToDestination = null;
let latestHasIndoorLeg = false;
let latestARRoute = null;
let outdoorTrackingPanel = null;
let arRouteProgressPanel = null;
let indoorARRouteState = null;
let isARSessionRunning = false;
let arDebugCube = null;
const arHiddenMeshes = [];
const mirrorButtonUpdaters = new Set();

function updateMirrorButtons() {
  mirrorButtonUpdaters.forEach((updater) => updater());
}

function refreshIndoorARRouteForMirror() {
  if (!latestARRoute) {
    return;
  }

  const wasAligned = indoorARRouteState?.aligned;

  clearIndoorARRouteState();

  const calibration = getSceneCalibration();
  indoorARRouteState = prepareIndoorARRoute(scene, {
    ...latestARRoute,
    arOptions: {
      arMirrorX: calibration.arMirrorX ?? -1,
      arScale: calibration.arScale
    }
  }, {
    camera,
    onUpdate: (state) => arRouteProgressPanel?.refreshUI?.(state),
    onInstruction: () => arRouteProgressPanel?.refreshUI?.(indoorARRouteState)
  });

  if (wasAligned && indoorARRouteState && isARSessionRunning && renderer.xr.isPresenting) {
    anchorRouteToCurrentCamera(
      indoorARRouteState.routeGroup,
      camera,
      indoorARRouteState,
      scene
    );
  }

  arRouteProgressPanel?.setPrepared?.(true);
  arRouteProgressPanel?.refreshUI?.(indoorARRouteState);
}

function handleSceneMirrorToggle() {
  toggleSceneMirrorX();
  refreshIndoorARRouteForMirror();
  updateMirrorButtons();
}

function createSceneMirrorButton(className = 'scene-mirror-button') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = `Flip scene ↔ (${getSceneMirrorLabel()})`;

  const syncLabel = () => {
    button.textContent = `Flip scene ↔ (${getSceneMirrorLabel()})`;
  };

  mirrorButtonUpdaters.add(syncLabel);
  syncLabel();

  button.addEventListener('click', handleSceneMirrorToggle);

  return button;
}

function isDestinationIndoorSegment(segment, toDestination) {
  const destinationNodeId = toDestination?.room?.indoorNodeId;

  if (!destinationNodeId || !segment?.path?.length) {
    return false;
  }

  return segment.path[segment.path.length - 1] === destinationNodeId;
}

function buildRouteSegments(routePlan, toDestination = null) {
  const segments = [];
  const indoorSegs = routePlan.indoorSegments ?? [];
  const outdoor = routePlan.outdoorPath ?? [];
  const hasOutdoor = outdoor.length >= 2;

  if (hasOutdoor) {
    const sourceIndoor = indoorSegs.find(
      (segment) => segment.path?.length >= 2 && !isDestinationIndoorSegment(segment, toDestination)
    ) ?? null;
    const destIndoor = indoorSegs.find(
      (segment) => segment.path?.length >= 2 && isDestinationIndoorSegment(segment, toDestination)
    ) ?? null;

    if (sourceIndoor) {
      segments.push({ graph: sourceIndoor.graph, pathNodeIds: sourceIndoor.path });
    }

    segments.push({ graph, pathNodeIds: outdoor });

    if (destIndoor) {
      segments.push({ graph: destIndoor.graph, pathNodeIds: destIndoor.path });
    }
  } else {
    indoorSegs.forEach((seg) => {
      if (seg.path?.length >= 2) {
        segments.push({ graph: seg.graph, pathNodeIds: seg.path });
      }
    });
  }

  if (!segments.length && routePlan.indoorPath?.length >= 2) {
    const buildingId = routePlan.indoorPathBuildingId ?? toDestination?.room?.buildingId;
    const indoorGraph = buildingId ? indoorGraphs[buildingId] : null;

    if (indoorGraph) {
      segments.push({ graph: indoorGraph, pathNodeIds: routePlan.indoorPath });
    }
  }

  return segments;
}

function buildARRoute(routePlan, toDestination, fromEntranceId = null) {
  if (!routePlan) {
    return null;
  }

  const segments = buildRouteSegments(
    routePlan,
    toDestination?.type === 'room' ? toDestination : null
  );

  if (!segments.length) {
    return null;
  }

  const firstSegment = segments[0];
  const firstNodeId = firstSegment.pathNodeIds[0];
  const firstNode = firstSegment.graph.nodes[firstNodeId];
  const anchorPosition = firstNode
    ? { x: firstNode.x, z: firstNode.z }
    : getEntrancePosition(fromEntranceId ?? latestAnchor?.entranceId ?? firstNodeId);

  if (!anchorPosition) {
    return null;
  }

  const destinationName = toDestination?.room?.name
    ?? toDestination?.name
    ?? 'your destination';

  return {
    segments,
    buildingId: toDestination?.room?.buildingId ?? toDestination?.id ?? null,
    destinationName,
    anchorPosition,
    entranceNodeId: firstNodeId
  };
}

function clearIndoorARRouteState() {
  indoorARRouteState = clearIndoorARRoute(scene, indoorARRouteState);
  arRouteProgressPanel?.reset?.();
}

function storeLatestRoutePlan(routePlan, toDestination, fromEntranceId = null) {
  latestRoutePlan = routePlan;
  latestOutdoorPath = routePlan.outdoorPath ?? [];
  latestToDestination = toDestination ?? null;
  latestHasIndoorLeg = (routePlan.indoorPath?.length ?? 0) > 0
    || (routePlan.indoorSegments?.length ?? 0) > 0;
  latestARRoute = buildARRoute(routePlan, toDestination, fromEntranceId);

  if (latestOutdoorPath.length >= 2) {
    outdoorTrackingPanel?.startTracking?.();
  } else {
    outdoorTrackingPanel?.stopTracking?.();
  }

  outdoorTrackingPanel?.refreshUI?.();
  arRouteProgressPanel?.setPrepared?.(!!latestARRoute);
}

function clearLatestRoutePlan() {
  latestRoutePlan = null;
  latestOutdoorPath = [];
  latestToDestination = null;
  latestHasIndoorLeg = false;
  latestARRoute = null;
  latestAnchor = null;
  outdoorTrackingPanel?.stopTracking?.();
  clearIndoorARRouteState();
}

function refreshActiveRoutesAfterCalibration() {
  if (!latestRoutePlan || !latestToDestination) {
    return;
  }

  clearRoute(scene);
  clearIndoorRoute(scene);

  if (latestRoutePlan.outdoorPath?.length >= 2) {
    renderRoute(scene, graph, latestRoutePlan.outdoorPath);
  }

  if (latestRoutePlan.indoorSegments?.length) {
    renderIndoorRouteSegments(scene, latestRoutePlan.indoorSegments);
  } else if (latestRoutePlan.indoorPath?.length >= 2) {
    const indoorGraph = getIndoorGraphForDestination(latestToDestination);

    if (indoorGraph) {
      renderIndoorRoute(scene, indoorGraph, latestRoutePlan.indoorPath, {
        buildingId: latestToDestination.room?.buildingId
      });
    }
  }
}

function handleRouteCalibrationChange(action, mesh) {
  if (action === 'register') {
    registerCalibratedObject('routes', mesh);
    applySceneCalibration();
    return;
  }

  unregisterCalibratedObject(mesh);
}

setRouteCalibrationHook(handleRouteCalibrationChange);
setIndoorRouteCalibrationHook(handleRouteCalibrationChange);

function showARWorldDebugCube() {
  if (arDebugCube) {
    if (arDebugCube.parent) {
      arDebugCube.parent.remove(arDebugCube);
    }

    arDebugCube.geometry.dispose();
    arDebugCube.material.dispose();
    arDebugCube = null;
  }

  const geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000
  });

  arDebugCube = new THREE.Mesh(geometry, material);

  // World-fixed object:
  // x = center
  // y = around chest / table height depending on local-floor
  // z = 1.5 meters in front of where AR session starts
  arDebugCube.position.set(0, 0.2, -1.5);

  scene.add(arDebugCube);

  console.log('World-fixed AR debug cube added');
}

function setIndoorLayerVisible(visible) {
  isIndoorLayerVisible = visible;

  per21IndoorMeshes.forEach((mesh) => {
    mesh.visible = visible;
  });

  syncLabelLayerVisibility();
  setIndoorRouteBuildingVisible('PER21', visible);
}

function setPer17IndoorLayerVisible(visible) {
  isPer17IndoorLayerVisible = visible;

  per17IndoorMeshes.forEach((mesh) => {
    mesh.visible = visible;
  });

  syncLabelLayerVisibility();
  setIndoorRouteBuildingVisible('PER17', visible);
}

function setPer22IndoorLayerVisible(visible) {
  isPer22IndoorLayerVisible = visible;

  per22IndoorMeshes.forEach((mesh) => {
    mesh.visible = visible;
  });

  syncLabelLayerVisibility();
  setIndoorRouteBuildingVisible('PER22', visible);
}

function setBuildingLayerVisible(visible) {
  areBuildingsVisible = visible;

  Object.values(buildingMeshes).forEach((mesh) => {
    mesh.visible = visible;
  });
}

function isLabelObject(object) {
  return object.userData?.type === 'entrance-label' ||
    object.userData?.type === 'indoor-room-label';
}

function isLabelSourceLayerVisible(object) {
  const layer = object.userData?.layer;
  const buildingId = object.userData?.buildingId;

  if (layer === 'per21-indoor' || buildingId === 'PER21') return isIndoorLayerVisible;
  if (layer === 'per22-indoor' || buildingId === 'PER22') return isPer22IndoorLayerVisible;
  if (layer === 'per17-indoor' || buildingId === 'PER17') return isPer17IndoorLayerVisible;

  return true;
}

function syncLabelLayerVisibility() {
  scene.traverse((object) => {
    if (!isLabelObject(object)) return;

    object.visible = areLabelsVisible && isLabelSourceLayerVisible(object);
  });
}

function setLabelLayerVisible(visible) {
  areLabelsVisible = visible;
  syncLabelLayerVisibility();
}

function setBuildingTransparency(enabled) {
  areBuildingsTransparent = enabled;

  Object.values(buildingMeshes).forEach((mesh) => {
    if (!mesh.material) return;

    mesh.material.transparent = enabled;
    mesh.material.opacity = enabled ? 0.24 : 1;
    mesh.material.depthWrite = !enabled;
    mesh.material.needsUpdate = true;
  });
}

function setRouteLayerVisible(visible) {
  areRoutesVisible = visible;

  setRouteVisible(visible);
  setIndoorRouteVisible(visible);
  setARRouteVisible(visible);
}

// Create roads
const mainRoad = createMeasuredRoad(scene);
const mensaPer17Road = createMensaPer17Road(scene);
const pedestrianPathMeshes = createPedestrianPaths(scene, pedestrianPaths);

registerCalibratedObjects('buildings', [
  ...Object.values(buildingMeshes),
  ...Object.values(entranceMeshes)
]);
registerCalibratedObjects('per21Indoor', per21IndoorStructureMeshes);
registerCalibratedObjects('per22Indoor', per22IndoorStructureMeshes);
registerCalibratedObjects('per17Indoor', per17IndoorStructureMeshes);
registerCalibratedObjects('markers', indoorMarkerMeshes);
registerCalibratedObjects('paths', [mainRoad, mensaPer17Road, ...pedestrianPathMeshes]);

if (ground) {
  registerCalibratedObjects('ground', [ground]);
}

applySceneCalibration();

function fitCampusView() {
  fitCameraToObjects(camera, controls, [
    ...Object.values(buildingMeshes),
    ground
  ]);
}

function fitCampusViewIfNeeded() {
  if (window.matchMedia('(pointer: coarse)').matches || isCalibrationNonDefault()) {
    fitCampusView();
  }
}

if (isCalibrationNonDefault()) {
  fitCampusView();
}

function initializeRouteControls() {
  routeControls = createRouteControls(
    anchors,
    getDestinations,

    // Show Route button
    (anchorId, toDestinationId) => {
      const fromEntranceId = getAnchorEntranceId(anchorId);

      if (!fromEntranceId) {
        console.error(`Anchor not found: ${anchorId}`);
        return;
      }

      showRouteFromEntrance(fromEntranceId, toDestinationId);
    },

    // Clear Route button
    () => {
      clearRoute(scene);
      clearIndoorRoute(scene);
      clearARRoute(scene);
      hideRouteInfo();
      clearLatestRoutePlan();
    },

    // Run Command button
    (anchorId, commandText) => {
      const fromEntranceId = getAnchorEntranceId(anchorId);

      if (!fromEntranceId) return;

      const result = resolveNavigationCommand(commandText, getDestinations());

      if (!result.success) {
        alert(result.error);
        return;
      }

      if (result.fromDestinationId) {
        showRoute(result.fromDestinationId, result.toDestinationId);
      } else {
        showRouteFromEntrance(fromEntranceId, result.toDestinationId);
      }
    }
  );
}

async function bootstrapNavigation() {
  try {
    const timetableData = await loadCampusTimetable(rooms);
    navigationState.destinations = createDestinations(rooms, timetableData);
    navigationState.timetableMeta = {
      courseCount: timetableData.courseCount,
      mappedCourseCount: timetableData.mappedCourseCount,
      unmappedCourseCount: timetableData.unmappedCourses.length
    };

    console.info(
      `Timetable loaded: ${timetableData.mappedCourseCount}/${timetableData.courseCount} courses mapped to campus rooms.`
    );

    if (timetableData.unmappedCourses.length > 0) {
      console.warn('Unmapped timetable courses:', timetableData.unmappedCourses);
    }
  } catch (error) {
    console.warn('Could not load timetable Excel file. Course commands may be limited.', error);
    navigationState.timetableMeta = {
      courseCount: 0,
      mappedCourseCount: 0,
      unmappedCourseCount: 0,
      error: error.message
    };
  }

  initializeRouteControls();
  routeControls?.updateDestinations?.(getDestinations(), navigationState.timetableMeta);

  initAppMenu({
    primary: [
      { id: 'route-controls', label: 'Route Navigation' },
      { id: 'ar-calibration-panel', label: 'Scaling' },
      { id: 'ar-start-widget', label: 'Start AR' }
    ],
    debugIds: [
      'info-panel',
      'layer-controls',
      'outdoor-tracking-panel',
      'ar-route-progress-panel'
    ]
  });
}

bootstrapNavigation();

function getAnchorEntranceId(anchorId) {
  return getAnchorById(anchorId)?.entranceId ?? null;
}

function getDefaultEntranceId(destinationId) {
  const destination = getDestinations().find((item) => item.id === destinationId);

  if (!destination) {
    console.error(`Destination not found: ${destinationId}`);
    return null;
  }

  return destination.defaultEntranceId;
}

function getIndoorGraphForDestination(destination) {
  const buildingId = destination?.room?.buildingId;

  return buildingId ? indoorGraphs[buildingId] : null;
}

function showRoute(fromDestinationId, toDestinationId) {
  const fromDestination = getDestinations().find((item) => item.id === fromDestinationId);
  const toDestination = getDestinations().find((item) => item.id === toDestinationId);

  if (!fromDestination || !toDestination) {
    console.error("Start or destination not found.");
    return;
  }

  clearRoute(scene);
  clearIndoorRoute(scene);

  const fromIsRoom = fromDestination.type === 'room';
  const toIsRoom = toDestination.type === 'room';
  const sameIndoorBuilding =
    fromIsRoom &&
    toIsRoom &&
    fromDestination.room.buildingId === toDestination.room.buildingId;

  // Same-building room routes stay fully indoors.
  if (sameIndoorBuilding) {
    const indoorGraph = getIndoorGraphForDestination(toDestination);

    if (!indoorGraph) {
      displayRouteInfo([], 0, fromDestination, toDestination, [], 'Indoor graph not available.');
      return;
    }

    const indoorPath = findShortestPath(
      indoorGraph,
      fromDestination.room.indoorNodeId,
      toDestination.room.indoorNodeId
    );

    if (!indoorPath.length) {
      displayRouteInfo([], 0, fromDestination, toDestination, [], 'No indoor path found.');
      return;
    }

    console.log("Indoor room-to-room route:", indoorPath);

    renderIndoorRoute(scene, indoorGraph, indoorPath, {
      buildingId: toDestination.room.buildingId
    });

    displayRouteInfo(
      [],
      0,
      fromDestination,
      toDestination,
      indoorPath,
      ''
    );

    storeLatestRoutePlan(
      {
        outdoorPath: [],
        indoorPath,
        indoorSegments: [{
          buildingId: toDestination.room.buildingId,
          graph: indoorGraph,
          path: indoorPath
        }]
      },
      toDestination,
      fromDestination.room?.nearestEntranceId
    );
    return;
  }

  const routePlan = planCrossBuildingRoute(fromDestination, toDestination, indoorGraphs);

  if (!routePlan.ok) {
    displayRouteInfo([], 0, fromDestination, toDestination, [], routePlan.error);
    return;
  }

  if (routePlan.outdoorPath.length > 0) {
    renderRoute(scene, graph, routePlan.outdoorPath);
    fitCampusViewIfNeeded();
  }

  renderIndoorRouteSegments(scene, routePlan.indoorSegments);

  displayRouteInfo(
    routePlan.outdoorPath,
    routePlan.outdoorDistance,
    fromDestination,
    toDestination,
    routePlan.indoorPath,
    routePlan.note
  );

  storeLatestRoutePlan(
    routePlan,
    toDestination,
    fromDestination.defaultEntranceId ?? fromDestination.room?.nearestEntranceId
  );
}

function showRouteFromEntrance(fromEntranceId, toDestinationId) {
  const fromDestination = {
    id: fromEntranceId,
    name: fromEntranceId,
    type: 'anchor',
    defaultEntranceId: fromEntranceId
  };

  const toDestination = getDestinations().find((item) => item.id === toDestinationId);

  if (!toDestination) {
    console.error(`Destination not found: ${toDestinationId}`);
    return;
  }

  clearRoute(scene);
  clearIndoorRoute(scene);

  const routePlan = planCrossBuildingRoute(fromDestination, toDestination, indoorGraphs);

  if (!routePlan.ok) {
    displayRouteInfo([], 0, fromDestination, toDestination, [], routePlan.error);
    return;
  }

  latestOutdoorPath = routePlan.outdoorPath;
  latestAnchor = getAnchorForEntranceId(fromEntranceId);

  console.log('Latest outdoor path:', latestOutdoorPath);
  console.log('Latest anchor:', latestAnchor);

  const selectedAnchor = latestAnchor;

  if (selectedAnchor && routePlan.outdoorPath.length > 0) {
    const arRelativeRoute = convertRouteToAnchorRelative(
      graph,
      routePlan.outdoorPath,
      selectedAnchor.position
    );

    console.log('Selected anchor:', selectedAnchor);
    console.log('Normal map route:', routePlan.outdoorPath);
    console.table(arRelativeRoute);
  }

  if (routePlan.outdoorPath.length > 0) {
    renderRoute(scene, graph, routePlan.outdoorPath);
    fitCampusViewIfNeeded();
  }

  renderIndoorRouteSegments(scene, routePlan.indoorSegments);

  displayRouteInfo(
    routePlan.outdoorPath,
    routePlan.outdoorDistance,
    fromDestination,
    toDestination,
    routePlan.indoorPath,
    routePlan.note
  );

  storeLatestRoutePlan(routePlan, toDestination, fromEntranceId);
}
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

const interactiveObjects = [
  ...Object.values(buildingMeshes),
  ...Object.values(entranceMeshes)
];

console.log('Scene objects:', scene.children.length);
console.log('Renderer size:', renderer.domElement.width, renderer.domElement.height);

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});

// Handle mouse clicks for object selection
window.addEventListener('click', (event) => {
  if (controls.consumeClickSuppression?.()) {
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(interactiveObjects);

  if (intersects.length > 0) {
    selectObject(intersects[0].object);
  } else {
    deselectObject();
  }
});

function selectObject(object) {
  if (selectedObject === object) return;

  if (selectedObject) {
    deselectObject();
  }

  selectedObject = object;

  if (object.material && object.material.emissive) {
    object.material.emissive.setHex(0x666666);
  }

  displayObjectInfo(object);
}

function deselectObject() {
  if (selectedObject) {
    if (selectedObject.material && selectedObject.material.emissive) {
      selectedObject.material.emissive.setHex(0x000000);
    }

    selectedObject = null;
    hideObjectInfo();
  }
}

function displayObjectInfo(object) {
  let panel = document.getElementById('selected-info');

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'selected-info';
    panel.className = 'selected-info';
    document.getElementById('ui').appendChild(panel);
  }

  const data = object.userData;
  let html = `
    <div class="selected-info-header">
      <h2>${data.id}</h2>
    </div>
    <div class="selected-info-content">
  `;

  if (data.type === 'building') {
    html += `<p><strong>Type:</strong> ${data.category || 'Building'}</p>`;
    html += `<p><strong>Name:</strong> ${data.name}</p>`;
    if (data.floors) {
      html += `<p><strong>Floors:</strong> ${data.floors}</p>`;
    }
    html += `<p><strong>Description:</strong> ${data.description}</p>`;
  }

  if (data.type === 'entrance') {
    html += `<p><strong>Type:</strong> Entrance</p>`;
    html += `<p><strong>Name:</strong> ${data.name}</p>`;
    html += `<p><strong>Building:</strong> ${data.buildingId}</p>`;
    html += `<p><strong>Description:</strong> ${data.description}</p>`;
  }

  html += '</div>';
  panel.innerHTML = html;

  setupWidget(panel, {
    header: panel.querySelector('.selected-info-header'),
    content: panel.querySelector('.selected-info-content')
  });

  registerDynamicDebugWidget(panel);

  if (isDebugModeEnabled()) {
    panel.classList.remove('widget-hidden');
  }
}

function hideObjectInfo() {
  const panel = document.getElementById('selected-info');

  if (panel) {
    panel.classList.add('widget-hidden');
  }
}

function displayRouteInfo(path, distance, fromDestination, toDestination, indoorPath = [], indoorNote = '') {
  let panel = document.getElementById('route-info');

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'route-info';
    panel.className = 'route-info';
    document.getElementById('ui').appendChild(panel);
    registerDynamicDebugWidget(panel);
  }

  const outdoorSteps = path.length > 0
    ? path.map((nodeId, index) => `<li>${index + 1}. ${nodeId}</li>`).join('')
    : '<li>No outdoor route needed.</li>';

  const indoorSteps = indoorPath.length > 0
    ? indoorPath.map((nodeId, index) => `<li>${index + 1}. ${nodeId}</li>`).join('')
    : '<li>No indoor route.</li>';

  let destinationDetails = '';

  if (toDestination?.type === 'room') {
    destinationDetails = `
      <p><strong>Destination type:</strong> Room</p>
      <p><strong>Building:</strong> ${toDestination.room.buildingId}</p>
      <p><strong>Room:</strong> ${toDestination.room.name}</p>
      <p><strong>Floor:</strong> ${toDestination.room.floor}</p>
      ${toDestination.room.capacity ? `<p><strong>Capacity:</strong> ${toDestination.room.capacity} places</p>` : ''}
      <p><strong>Description:</strong> ${toDestination.room.description}</p>
    `;
  } else {
    destinationDetails = `
      <p><strong>Destination type:</strong> Building</p>
      <p><strong>Destination:</strong> ${toDestination?.name || 'Unknown'}</p>
    `;
  }

  panel.innerHTML = `
  <div class="route-info-header">
    <h2>Route Information</h2>
    <button id="route-info-minimize" class="panel-minimize-button">−</button>
  </div>

  <div class="route-info-content">
    <p><strong>From:</strong> ${fromDestination?.name || 'Unknown'}</p>
    <p><strong>To:</strong> ${toDestination?.name || 'Unknown'}</p>
    <p><strong>Outdoor distance:</strong> ${distance.toFixed(1)} m</p>

    ${destinationDetails}
    ${indoorNote ? `<p><strong>Note:</strong> ${indoorNote}</p>` : ''}

    <p><strong>Outdoor route steps:</strong></p>
    <ol>${outdoorSteps}</ol>

    <p><strong>Indoor route steps:</strong></p>
    <ol>${indoorSteps}</ol>
  </div>
`;

  const minimizeButton = document.getElementById('route-info-minimize');

  if (minimizeButton) {
    minimizeButton.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
      const isCollapsed = panel.classList.contains('collapsed');
      minimizeButton.textContent = isCollapsed ? '+' : '−';
    });
  }

  makeWidgetDraggable(panel, panel.querySelector('.route-info-header'));

  if (isDebugModeEnabled()) {
    panel.classList.remove('widget-hidden');
  }
}

function hideRouteInfo() {
  const panel = document.getElementById('route-info');

  if (panel) {
    panel.classList.add('widget-hidden');
  }
}

async function createARButton() {
  const container = document.createElement('div');
  container.id = 'ar-start-widget';
  container.className = 'ar-start-widget';

  const header = document.createElement('div');
  header.className = 'ar-start-header';

  const title = document.createElement('h2');
  title.textContent = 'AR';
  header.appendChild(title);

  const content = document.createElement('div');
  content.className = 'ar-start-content';

  const button = document.createElement('button');

  button.id = 'ar-start-button';
  button.className = 'ar-start-button';
  button.textContent = 'Start AR';

  const supported = await isARSupported();

  if (!supported) {
    button.textContent = 'AR not supported';
    button.disabled = true;
    button.classList.add('disabled');
  }

  button.addEventListener('click', async () => {
  try {
    const hasARRoute = !!latestARRoute;

    if (!hasARRoute) {
      alert('Please show a route before starting AR.');
      button.textContent = 'Start AR';
      return;
    }

    button.textContent = 'Starting AR...';

    clearIndoorARRouteState();
    clearARRoute(scene);
    outdoorTrackingPanel?.stopTracking?.();
    applySceneCalibration();

    const session = await startARSession(renderer);

    isARSessionRunning = true;

    enterARViewMode();

    const calibration = getSceneCalibration();

    indoorARRouteState = prepareIndoorARRoute(scene, {
      ...latestARRoute,
      arOptions: {
        arMirrorX: calibration.arMirrorX ?? -1,
        arScale: calibration.arScale
      }
    }, {
      camera,
      onUpdate: (state) => arRouteProgressPanel?.refreshUI?.(state),
      onInstruction: () => arRouteProgressPanel?.refreshUI?.(indoorARRouteState)
    });

    if (!indoorARRouteState) {
      alert('Could not prepare the AR route. Check that a valid route is shown on the map.');
      isARSessionRunning = false;
      await session.end();
      exitARViewMode();
      applySceneCalibration();
      button.textContent = 'Start AR';
      return;
    }

    arRouteProgressPanel?.setPrepared?.(true);
    arRouteProgressPanel?.refreshUI?.(indoorARRouteState);

    session.addEventListener('end', () => {
      isARSessionRunning = false;
      clearIndoorARRouteState();
      exitARViewMode();
      applySceneCalibration();
      refreshActiveRoutesAfterCalibration();

      if (latestOutdoorPath.length >= 2) {
        outdoorTrackingPanel?.startTracking?.();
      }

      button.textContent = 'Start AR';
      arRouteProgressPanel?.reset?.();
    });

    button.textContent = 'AR Running';
  } catch (error) {
    console.error(error);
    isARSessionRunning = false;
    alert(error.message);
    button.textContent = 'Start AR';
  }
});
  content.appendChild(createSceneMirrorButton('scene-mirror-button'));
  content.appendChild(button);
  container.appendChild(header);
  container.appendChild(content);
  document.getElementById('ui').appendChild(container);
  setupWidget(container, {
    header,
    content
  });
}

function createLayerToggles() {
  const container = document.createElement('div');
  container.id = 'layer-controls';
  container.className = 'layer-controls';

  const header = document.createElement('div');
  header.className = 'layer-controls-header';

  const title = document.createElement('h2');
  title.textContent = 'Layers';
  header.appendChild(title);

  const content = document.createElement('div');
  content.className = 'layer-controls-content';

  const createCheckbox = (id, text, checked, onChange) => {
    const row = document.createElement('label');
    row.className = 'layer-toggle';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = checked;

    const labelText = document.createElement('span');
    labelText.textContent = text;

    checkbox.addEventListener('change', () => {
      onChange(checkbox.checked);
    });

    row.appendChild(checkbox);
    row.appendChild(labelText);
    content.appendChild(row);
  };

  createCheckbox('show-buildings-layer', 'Buildings', areBuildingsVisible, setBuildingLayerVisible);
  createCheckbox('show-labels-layer', 'Labels', areLabelsVisible, setLabelLayerVisible);
  createCheckbox('transparent-buildings-layer', 'Transparent buildings', areBuildingsTransparent, setBuildingTransparency);
  createCheckbox('show-routes-layer', 'Green/blue route lines', areRoutesVisible, setRouteLayerVisible);
  createCheckbox('show-indoor-layer', 'PER21 interior objects', isIndoorLayerVisible, setIndoorLayerVisible);
  createCheckbox('show-per22-indoor-layer', 'PER22 interior objects', isPer22IndoorLayerVisible, setPer22IndoorLayerVisible);
  createCheckbox('show-per17-indoor-layer', 'PER17 interior objects', isPer17IndoorLayerVisible, setPer17IndoorLayerVisible);

  content.appendChild(createSceneMirrorButton());

  container.appendChild(header);
  container.appendChild(content);
  document.getElementById('ui').appendChild(container);
  setupWidget(container, {
    header,
    content
  });
}

function setupStaticInfoPanel() {
  const panel = document.getElementById('info-panel');

  if (!panel) return;

  const title = panel.querySelector('h1');
  const paragraphs = Array.from(panel.querySelectorAll('p'));

  if (!title || paragraphs.length === 0) return;

  const header = document.createElement('div');
  header.className = 'info-panel-header';

  const content = document.createElement('div');
  content.className = 'info-panel-content';

  header.appendChild(title);
  paragraphs.forEach((paragraph) => {
    content.appendChild(paragraph);
  });

  panel.appendChild(header);
  panel.appendChild(content);

  setupWidget(panel, {
    header,
    content
  });
}

function enterARViewMode() {
  if (ground) {
    ground.visible = false;
  }

  scene.background = null;

  arHiddenMeshes.length = 0;

  const hideIfVisible = (mesh) => {
    if (mesh?.visible) {
      arHiddenMeshes.push(mesh);
      mesh.visible = false;
    }
  };

  indoorMarkerMeshes.forEach(hideIfVisible);
  Object.values(buildingMeshes).forEach(hideIfVisible);
  Object.values(entranceMeshes).forEach(hideIfVisible);
  per21IndoorStructureMeshes.forEach(hideIfVisible);
  per22IndoorStructureMeshes.forEach(hideIfVisible);
  per17IndoorStructureMeshes.forEach(hideIfVisible);

  [mainRoad, mensaPer17Road, ...pedestrianPathMeshes].forEach(hideIfVisible);

  setIndoorRouteVisible(false);
  setRouteVisible(false);
  clearARRoute(scene);
}

function exitARViewMode() {
  if (ground) {
    ground.visible = true;
  }

  scene.background = new THREE.Color(0xf7f7f4);

  arHiddenMeshes.length = 0;

  setBuildingLayerVisible(areBuildingsVisible);
  Object.values(entranceMeshes).forEach((mesh) => {
    mesh.visible = true;
  });
  [mainRoad, mensaPer17Road, ...pedestrianPathMeshes].forEach((mesh) => {
    if (mesh) {
      mesh.visible = true;
    }
  });
  setIndoorLayerVisible(isIndoorLayerVisible);
  setPer22IndoorLayerVisible(isPer22IndoorLayerVisible);
  setPer17IndoorLayerVisible(isPer17IndoorLayerVisible);
  setRouteLayerVisible(areRoutesVisible);
  syncLabelLayerVisibility();
  clearARRoute(scene);
}

setupStaticInfoPanel();
createLayerToggles();
createCalibrationPanel({
  onApply: () => {
    updateMirrorButtons();
    refreshIndoorARRouteForMirror();
    refreshActiveRoutesAfterCalibration();
    fitCampusView();
  },
  onMirrorToggle: handleSceneMirrorToggle,
  onFitView: fitCampusView
});
outdoorTrackingPanel = createOutdoorTrackingPanel({
  scene,
  graph,
  getOutdoorPath: () => latestOutdoorPath,
  getDestination: () => latestToDestination,
  getHasIndoorLeg: () => latestHasIndoorLeg
});
arRouteProgressPanel = createARRouteProgressPanel({
  scene,
  camera,
  getRouteState: () => indoorARRouteState,
  isARSessionActive: () => isARSessionRunning && renderer.xr.isPresenting
});
createARButton();

// Keyboard zoom controls
window.addEventListener('keydown', (event) => {
  const tag = event.target.tagName.toLowerCase();

  if (tag === 'input' || tag === 'select' || tag === 'textarea') {
    return;
  }

  const zoomStep = 25;

  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    controls._radius -= zoomStep;
  }

  if (event.key === '-' || event.key === '_') {
    event.preventDefault();
    controls._radius += zoomStep;
  }

  controls._radius = Math.max(
    controls.minDistance,
    Math.min(controls.maxDistance, controls._radius)
  );

  controls.update();
});
// Animation loop
function animate() {
  if (!renderer.xr.isPresenting) {
    controls.update();
  }

  if (renderer.xr.isPresenting && indoorARRouteState?.active) {
    updateRouteProgress(camera, indoorARRouteState);
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
