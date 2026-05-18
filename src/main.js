import * as THREE from 'three';

import { isARSupported, startARSession } from './ar/arSession.js';
import { renderARRoute, clearARRoute, setARRouteVisible } from './ar/arRouteRenderer.js';
import { convertRouteToAnchorRelative } from './ar/arRouteAdapter.js';
import { anchors } from './data/anchors.js';

import { createRoomMarkers } from './scene/createIndoorMarkers.js';
import { per21IndoorGraph } from './data/per21IndoorGraph.js';
import { per17IndoorGraph } from './data/per17IndoorGraph.js';
import { per22IndoorGraph } from './data/per22IndoorGraph.js';
import { createPer21IndoorStructure } from './scene/createPer21IndoorStructure.js';
import { createPer17IndoorStructure } from './scene/createPer17IndoorStructure.js';
import { createPer22IndoorStructure } from './scene/createPer22IndoorStructure.js';
import {
  renderIndoorRoute,
  clearIndoorRoute,
  setIndoorRouteVisible,
  setIndoorRouteBuildingVisible
} from './navigation/indoorRouteRenderer.js';

import { rooms } from './data/rooms.js';
import { destinations } from './data/destinations.js';
import { pedestrianPaths } from './data/pedestrianPaths.js';
import { createPedestrianPaths } from './scene/createPedestrianPaths.js';
import { graph } from './data/graph.js';
import { findShortestPath } from './navigation/dijkstra.js';

import { resolveNavigationCommand } from './llm/navigationAgent.js';

import {
  renderRoute,
  clearRoute,
  setRouteVisible,
  calculateRouteDistance
} from './navigation/routeRenderer.js';



import { createRouteControls } from './ui/controls.js';
import { makeWidgetDraggable, setupWidget } from './ui/widgets.js';

import {
  createScene,
  createCamera,
  createRenderer,
  createLighting,
  createGround,
  createOrbitControls
} from './scene/createScene.js';

import { createCampusBuildings } from './scene/createBuildings.js';
import {
  createMeasuredRoad,
  createMensaPer17Road
} from './scene/createMeasuredRoad.js';

import { buildings } from './data/buildings.js';
import { entrances } from './data/entrances.js';
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
const indoorMarkerMeshes = createRoomMarkers(scene, rooms, indoorGraphs);

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
let areBuildingsTransparent = false;
let latestOutdoorPath = [];
let latestAnchor = null;
let arDebugCube = null;

const defaultARCalibration = {
  scale: 0.05,
  x: 0,
  y: -0.45,
  z: -1.5,
  mode: 'anchor-relative'
};

let arCalibration = loadARCalibration();

function loadARCalibration() {
  try {
    const saved = JSON.parse(localStorage.getItem('arCalibration') || '{}');

    return {
      ...defaultARCalibration,
      ...saved
    };
  } catch (error) {
    console.warn('Could not load AR calibration:', error);
    return { ...defaultARCalibration };
  }
}

function saveARCalibration() {
  localStorage.setItem('arCalibration', JSON.stringify(arCalibration));
}

function applyAnchorRelativeCampusTransform(anchor, calibration = arCalibration) {
  if (!anchor) return;

  const scale = calibration.scale;

  campusARObjects.forEach((object) => {
    if (!object) return;

    const original = originalCampusTransforms.get(object);

    if (!original) return;

    object.position.set(
      calibration.x + (original.position.x - anchor.position.x) * scale,
      calibration.y + original.position.y * scale,
      calibration.z - (original.position.z - anchor.position.z) * scale
    );

    object.scale.set(
      original.scale.x * scale,
      original.scale.y * scale,
      original.scale.z * scale
    );
  });
}

function restoreCampusTransform() {
  campusARObjects.forEach((object) => {
    if (!object) return;

    const original = originalCampusTransforms.get(object);

    if (!original) return;

    object.position.copy(original.position);
    object.scale.copy(original.scale);
  });
}

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

  setIndoorRouteBuildingVisible('PER21', visible);
}

function setPer17IndoorLayerVisible(visible) {
  isPer17IndoorLayerVisible = visible;

  per17IndoorMeshes.forEach((mesh) => {
    mesh.visible = visible;
  });

  setIndoorRouteBuildingVisible('PER17', visible);
}

function setPer22IndoorLayerVisible(visible) {
  isPer22IndoorLayerVisible = visible;

  per22IndoorMeshes.forEach((mesh) => {
    mesh.visible = visible;
  });

  setIndoorRouteBuildingVisible('PER22', visible);
}

function setBuildingLayerVisible(visible) {
  areBuildingsVisible = visible;

  Object.values(buildingMeshes).forEach((mesh) => {
    mesh.visible = visible;
  });

  Object.values(entranceMeshes).forEach((mesh) => {
    mesh.visible = visible;
  });
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


const campusARObjects = [
  ...Object.values(buildingMeshes),
  ...Object.values(entranceMeshes),
  ...per21IndoorStructureMeshes,
  ...per22IndoorStructureMeshes,
  ...per17IndoorStructureMeshes,
  ...indoorMarkerMeshes,
  mainRoad,
  mensaPer17Road,
  ...pedestrianPathMeshes
];

const originalCampusTransforms = new Map();

campusARObjects.forEach((object) => {
  if (!object) return;

  originalCampusTransforms.set(object, {
    position: object.position.clone(),
    scale: object.scale.clone()
  });
});
// test pathfinding and route rendering
createRouteControls(
  anchors,
  destinations,

  // Show Route button
  (anchorId, toDestinationId) => {
    const fromEntranceId = getAnchorEntranceId(anchorId);

    if (!fromEntranceId) return;

    showRouteFromEntrance(fromEntranceId, toDestinationId);
  },

  // Clear Route button
  () => {
  clearRoute(scene);
  clearIndoorRoute(scene);
  clearARRoute(scene);
  hideRouteInfo();

  latestOutdoorPath = [];
  latestAnchor = null;
  },

  // Run Command button
  (anchorId, commandText) => {
    const fromEntranceId = getAnchorEntranceId(anchorId);

    if (!fromEntranceId) return;

    const result = resolveNavigationCommand(commandText, destinations);

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

function getAnchorEntranceId(anchorId) {
  const anchor = anchors.find((item) => item.id === anchorId);

  if (!anchor) {
    console.error(`Anchor not found: ${anchorId}`);
    return null;
  }

  return anchor.entranceId;
}

function getDefaultEntranceId(destinationId) {
  const destination = destinations.find((item) => item.id === destinationId);

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

function renderDestinationIndoorRoute(destination) {
  if (destination?.type !== 'room') {
    return {
      path: [],
      note: ''
    };
  }

  const indoorGraph = getIndoorGraphForDestination(destination);
  const buildingId = destination.room.buildingId;

  if (!indoorGraph) {
    return {
      path: [],
      note: 'Indoor graph not available.'
    };
  }

  const indoorPath = findShortestPath(
    indoorGraph,
    destination.room.nearestEntranceId,
    destination.room.indoorNodeId
  );

  renderIndoorRoute(scene, indoorGraph, indoorPath, { buildingId });

  return {
    path: indoorPath,
    note: ''
  };
}

function showRoute(fromDestinationId, toDestinationId) {
  const fromDestination = destinations.find((item) => item.id === fromDestinationId);
  const toDestination = destinations.find((item) => item.id === toDestinationId);

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

    console.log("Indoor room-to-room route:", indoorPath);

    renderIndoorRoute(scene, indoorGraph, indoorPath, {
      buildingId: toDestination.room.buildingId
    });

    displayRouteInfo(
      [],
      0,
      fromDestination,
      toDestination,
      indoorPath
    );

    return;
  }

  // TODO: Add full room -> source indoor exit -> outdoor -> destination indoor routing.
  // For now, different-building room routes start outdoors at the source nearest entrance.
  const fromId = getDefaultEntranceId(fromDestinationId);
  const toId = getDefaultEntranceId(toDestinationId);

  if (!fromId || !toId) return;

  const path = findShortestPath(graph, fromId, toId);
  const distance = calculateRouteDistance(graph, path);

  renderRoute(scene, graph, path);

  const indoorRoute = renderDestinationIndoorRoute(toDestination);

  displayRouteInfo(
    path,
    distance,
    fromDestination,
    toDestination,
    indoorRoute.path,
    indoorRoute.note
  );
}

function showRouteFromEntrance(fromEntranceId, toDestinationId) {
  const fromDestination = {
    id: fromEntranceId,
    name: fromEntranceId,
    type: 'anchor',
    defaultEntranceId: fromEntranceId
  };

  const toDestination = destinations.find((item) => item.id === toDestinationId);

  if (!toDestination) {
    console.error(`Destination not found: ${toDestinationId}`);
    return;
  }

  clearRoute(scene);
  clearIndoorRoute(scene);

  const toId = getDefaultEntranceId(toDestinationId);

  if (!toId) return;

  const path = findShortestPath(graph, fromEntranceId, toId);
  const distance = calculateRouteDistance(graph, path);

  latestOutdoorPath = path;
  latestAnchor = anchors.find((anchor) => anchor.entranceId === fromEntranceId) || null;

  console.log('Latest outdoor path:', latestOutdoorPath);
  console.log('Latest anchor:', latestAnchor);

  const selectedAnchor = anchors.find((anchor) => anchor.entranceId === fromEntranceId);

  if (selectedAnchor) {
    const arRelativeRoute = convertRouteToAnchorRelative(
      graph,
      path,
      selectedAnchor.position
    );

    console.log('Selected anchor:', selectedAnchor);
    console.log('Normal map route:', path);
    console.table(arRelativeRoute);
  }

  renderRoute(scene, graph, path);

  const indoorRoute = renderDestinationIndoorRoute(toDestination);

  displayRouteInfo(
    path,
    distance,
    fromDestination,
    toDestination,
    indoorRoute.path,
    indoorRoute.note
  );
}

// Collect all interactive objects for raycasting
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
  panel.style.display = 'block';

  setupWidget(panel, {
    header: panel.querySelector('.selected-info-header'),
    content: panel.querySelector('.selected-info-content')
  });
}

function hideObjectInfo() {
  const panel = document.getElementById('selected-info');

  if (panel) {
    panel.style.display = 'none';
  }
}

function displayRouteInfo(path, distance, fromDestination, toDestination, indoorPath = [], indoorNote = '') {
  let panel = document.getElementById('route-info');

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'route-info';
    panel.className = 'route-info';
    document.getElementById('ui').appendChild(panel);
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

  panel.style.display = 'block';
  const minimizeButton = document.getElementById('route-info-minimize');

  if (minimizeButton) {
    minimizeButton.addEventListener('click', () => {
      panel.classList.toggle('collapsed');

    const isCollapsed = panel.classList.contains('collapsed');
    minimizeButton.textContent = isCollapsed ? '+' : '−';
  });
}
  makeWidgetDraggable(panel, panel.querySelector('.route-info-header'));
}

function hideRouteInfo() {
  const panel = document.getElementById('route-info');

  if (panel) {
    panel.style.display = 'none';
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
    if (!latestAnchor || !Array.isArray(latestOutdoorPath) || latestOutdoorPath.length < 2) {
      alert('Please select a current location and click Show Route before starting AR.');
      button.textContent = 'Start AR';
      return;
    }

    button.textContent = 'Starting AR...';

    const session = await startARSession(renderer);

   // showARWorldDebugCube();

    enterARViewMode();
    applyAnchorRelativeCampusTransform(latestAnchor, arCalibration);

   renderARRoute(
      scene,
      graph,
      latestOutdoorPath,
      latestAnchor.position,
      {
        scale: arCalibration.scale,
        camera,
        cameraRelative: arCalibration.mode === 'camera-debug',
        originOffset: {
          x: arCalibration.x,
          y: arCalibration.y,
          z: arCalibration.z
        }
      }
    );

    session.addEventListener('end', () => {
      restoreCampusTransform();
      exitARViewMode();
      button.textContent = 'Start AR';
    });

    button.textContent = 'AR Running';
  } catch (error) {
    console.error(error);
    alert(error.message);
    button.textContent = 'Start AR';
  }
});
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

  createCheckbox('show-buildings-layer', 'Buildings + labels', areBuildingsVisible, setBuildingLayerVisible);
  createCheckbox('transparent-buildings-layer', 'Transparent buildings', areBuildingsTransparent, setBuildingTransparency);
  createCheckbox('show-routes-layer', 'Green/blue route lines', areRoutesVisible, setRouteLayerVisible);
  createCheckbox('show-indoor-layer', 'PER21 interior objects', isIndoorLayerVisible, setIndoorLayerVisible);
  createCheckbox('show-per22-indoor-layer', 'PER22 interior objects', isPer22IndoorLayerVisible, setPer22IndoorLayerVisible);
  createCheckbox('show-per17-indoor-layer', 'PER17 interior objects', isPer17IndoorLayerVisible, setPer17IndoorLayerVisible);

  container.appendChild(header);
  container.appendChild(content);
  document.getElementById('ui').appendChild(container);
  setupWidget(container, {
    header,
    content
  });
}

function createARCalibrationPanel() {
  const container = document.createElement('div');
  container.id = 'ar-calibration-panel';
  container.className = 'ar-calibration-panel';

  const header = document.createElement('div');
  header.className = 'ar-calibration-header';

  const title = document.createElement('h2');
  title.textContent = 'AR Calibration';
  header.appendChild(title);

  const content = document.createElement('div');
  content.className = 'ar-calibration-content';

  const controls = {};

  const modeLabel = document.createElement('label');
  modeLabel.textContent = 'AR Mode';

  const modeSelect = document.createElement('select');
  modeSelect.id = 'ar-mode';

  [
    { value: 'camera-debug', text: 'Debug route in front of camera' },
    { value: 'anchor-relative', text: 'Anchor-relative route' }
  ].forEach((mode) => {
    const option = document.createElement('option');
    option.value = mode.value;
    option.textContent = mode.text;
    modeSelect.appendChild(option);
  });

  modeSelect.value = arCalibration.mode;
  content.appendChild(modeLabel);
  content.appendChild(modeSelect);

  const addCalibrationControl = (key, label, min, max, step) => {
    const row = document.createElement('div');
    row.className = 'ar-calibration-row';

    const controlLabel = document.createElement('label');
    controlLabel.textContent = label;

    const range = document.createElement('input');
    range.type = 'range';
    range.min = min;
    range.max = max;
    range.step = step;
    range.value = arCalibration[key];

    const number = document.createElement('input');
    number.type = 'number';
    number.min = min;
    number.max = max;
    number.step = step;
    number.value = arCalibration[key];

    range.addEventListener('input', () => {
      number.value = range.value;
    });

    number.addEventListener('input', () => {
      range.value = number.value;
    });

    row.appendChild(controlLabel);
    row.appendChild(range);
    row.appendChild(number);
    content.appendChild(row);

    controls[key] = { range, number };
  };

  addCalibrationControl('scale', 'Scale', 0.005, 0.2, 0.005);
  addCalibrationControl('x', 'X offset', -5, 5, 0.05);
  addCalibrationControl('y', 'Y offset', -3, 3, 0.05);
  addCalibrationControl('z', 'Z offset', -6, 2, 0.05);

  const applyButton = document.createElement('button');
  applyButton.textContent = 'Apply AR Calibration';

  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Calibration';

  const applyValues = () => {
    arCalibration = {
      scale: Number(controls.scale.number.value),
      x: Number(controls.x.number.value),
      y: Number(controls.y.number.value),
      z: Number(controls.z.number.value),
      mode: modeSelect.value
    };

    saveARCalibration();
  };

  applyButton.addEventListener('click', applyValues);

  resetButton.addEventListener('click', () => {
    arCalibration = { ...defaultARCalibration };
    modeSelect.value = arCalibration.mode;

    Object.entries(controls).forEach(([key, control]) => {
      control.range.value = arCalibration[key];
      control.number.value = arCalibration[key];
    });

    saveARCalibration();
  });

  content.appendChild(applyButton);
  content.appendChild(resetButton);

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
  // Hide only the large white ground plane
  if (ground) {
    ground.visible = false;
  }

  // Remove non-transparent desktop background/fog during AR
  scene.background = null;
  scene.fog = null;
}

function exitARViewMode() {
  // Restore normal desktop view
  if (ground) {
    ground.visible = true;
  }

  scene.background = new THREE.Color(0xf7f7f4);
  scene.fog = new THREE.Fog(0xf7f7f4, 360, 620);

  clearARRoute(scene);
}

setupStaticInfoPanel();
createLayerToggles();
createARCalibrationPanel();
createARButton();
// Animation loop
function animate() {
  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

