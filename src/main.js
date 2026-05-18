import * as THREE from 'three';

import { isARSupported, startARSession } from './ar/arSession.js';
import { renderARRoute, clearARRoute } from './ar/arRouteRenderer.js';
import { convertRouteToAnchorRelative } from './ar/arRouteAdapter.js';
import { anchors } from './data/anchors.js';

import { createIndoorMarkers } from './scene/createIndoorMarkers.js';
import { per21IndoorGraph } from './data/per21IndoorGraph.js';
import { createPer21IndoorStructure } from './scene/createPer21IndoorStructure.js';
import {
  renderIndoorRoute,
  clearIndoorRoute
} from './navigation/indoorRouteRenderer.js';

import { destinations } from './data/destinations.js';
import { pedestrianPaths } from './data/pedestrianPaths.js';
import { createPedestrianPaths } from './scene/createPedestrianPaths.js';
import { graph } from './data/graph.js';
import { findShortestPath } from './navigation/dijkstra.js';

import { parseNavigationCommand } from './llm/commandParser.js';

import {
  renderRoute,
  clearRoute,
  calculateRouteDistance
} from './navigation/routeRenderer.js';



import { createRouteControls } from './ui/controls.js';

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

//create indoor markers for PER21
const indoorStructureMeshes = createPer21IndoorStructure(scene);
const indoorMarkerMeshes = createIndoorMarkers(scene, per21IndoorGraph);

const per21IndoorMeshes = [
  ...indoorStructureMeshes,
  ...indoorMarkerMeshes
];

let isIndoorLayerVisible = true;
let latestOutdoorPath = [];
let latestAnchor = null;
let arDebugCube = null;

function showARDebugCube() {
  if (arDebugCube) {
    camera.remove(arDebugCube);
    arDebugCube.geometry.dispose();
    arDebugCube.material.dispose();
    arDebugCube = null;
  }

  const geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000
  });

  arDebugCube = new THREE.Mesh(geometry, material);

  // Attached to the camera:
  // x = center
  // y = slightly below center
  // z = 1 meter in front of camera
  arDebugCube.position.set(0, -0.25, -1);

  camera.add(arDebugCube);

  if (!scene.children.includes(camera)) {
    scene.add(camera);
  }

  console.log('AR debug cube added in front of camera');
}

function setIndoorLayerVisible(visible) {
  isIndoorLayerVisible = visible;

  per21IndoorMeshes.forEach((mesh) => {
    mesh.visible = visible;
  });
}

// Create roads
createMeasuredRoad(scene);
createMensaPer17Road(scene);
createPedestrianPaths(scene, pedestrianPaths);


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

    const result = parseNavigationCommand(commandText, destinations, null);

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

function showRoute(fromDestinationId, toDestinationId) {
  const fromDestination = destinations.find((item) => item.id === fromDestinationId);
  const toDestination = destinations.find((item) => item.id === toDestinationId);

  if (!fromDestination || !toDestination) {
    console.error("Start or destination not found.");
    return;
  }

  clearRoute(scene);
  clearIndoorRoute(scene);

  const fromIsPer21Room =
    fromDestination.type === "room" &&
    fromDestination.room?.buildingId === "PER21";

  const toIsPer21Room =
    toDestination.type === "room" &&
    toDestination.room?.buildingId === "PER21";

  // CASE 1: PER21 room → PER21 room
  // No outdoor route needed. Use indoor graph only.
  if (fromIsPer21Room && toIsPer21Room) {
    const indoorStartId = fromDestination.room.indoorNodeId;
    const indoorEndId = toDestination.room.indoorNodeId;

    const indoorPath = findShortestPath(
      per21IndoorGraph,
      indoorStartId,
      indoorEndId
    );

    console.log("Indoor room-to-room route:", indoorPath);

    renderIndoorRoute(scene, per21IndoorGraph, indoorPath);

    displayRouteInfo(
      [],
      0,
      fromDestination,
      toDestination,
      indoorPath
    );

    return;
  }

  // CASE 2: outdoor route to a building or room entrance
  const fromId = getDefaultEntranceId(fromDestinationId);
  const toId = getDefaultEntranceId(toDestinationId);

  if (!fromId || !toId) return;

  const path = findShortestPath(graph, fromId, toId);
  const distance = calculateRouteDistance(graph, path);

  renderRoute(scene, graph, path);

  // CASE 3: destination is a PER21 room
  // Outdoor route goes to PER21 entrance, then indoor route goes to room.
  let indoorPath = [];

  if (toIsPer21Room) {
    const indoorStartId = toDestination.room.nearestEntranceId;
    const indoorEndId = toDestination.room.indoorNodeId;

    indoorPath = findShortestPath(
      per21IndoorGraph,
      indoorStartId,
      indoorEndId
    );

    console.log("Indoor route:", indoorPath);

    renderIndoorRoute(scene, per21IndoorGraph, indoorPath);
  }

  displayRouteInfo(
    path,
    distance,
    fromDestination,
    toDestination,
    indoorPath
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

  const toIsPer21Room =
    toDestination.type === 'room' &&
    toDestination.room?.buildingId === 'PER21';

  const toId = getDefaultEntranceId(toDestinationId);

  if (!toId) return;

  const path = findShortestPath(graph, fromEntranceId, toId);
  const distance = calculateRouteDistance(graph, path);

  latestOutdoorPath = path;
  latestAnchor = anchors.find((anchor) => anchor.entranceId === fromEntranceId) || null;

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

  let indoorPath = [];

  if (toIsPer21Room) {
    const indoorStartId = toDestination.room.nearestEntranceId;
    const indoorEndId = toDestination.room.indoorNodeId;

    indoorPath = findShortestPath(
      per21IndoorGraph,
      indoorStartId,
      indoorEndId
    );

    renderIndoorRoute(scene, per21IndoorGraph, indoorPath);
  }

  displayRouteInfo(
    path,
    distance,
    fromDestination,
    toDestination,
    indoorPath
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
  let html = `<h2>${data.id}</h2>`;

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

  panel.innerHTML = html;
  panel.style.display = 'block';
}

function hideObjectInfo() {
  const panel = document.getElementById('selected-info');

  if (panel) {
    panel.style.display = 'none';
  }
}

function displayRouteInfo(path, distance, fromDestination, toDestination, indoorPath = []) {
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
}

function hideRouteInfo() {
  const panel = document.getElementById('route-info');

  if (panel) {
    panel.style.display = 'none';
  }
}

async function createARButton() {
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
    button.textContent = 'Starting AR...';

    await startARSession(renderer);

    showARDebugCube();
    
    if (!latestAnchor || latestOutdoorPath.length < 2) {
      alert('Please select a current location and show a route before starting AR.');
      button.textContent = 'Start AR';
      return;
    }

    enterARViewMode();

    renderARRoute(
      scene,
      graph,
      latestOutdoorPath,
      latestAnchor.position,
      {
        scale: 0.1
      }
    );

    button.textContent = 'AR Running';
  } catch (error) {
    console.error(error);
    alert(error.message);
    button.textContent = 'Start AR';
  }
});

  document.getElementById('ui').appendChild(button);
}

function createIndoorLayerCheckbox() {
  const container = document.createElement('div');
  container.id = 'indoor-layer-control';
  container.className = 'layer-checkbox-control';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'show-indoor-layer';
  checkbox.checked = true;

  const label = document.createElement('label');
  label.htmlFor = 'show-indoor-layer';
  label.textContent = 'Show PER21 indoor layer';

  checkbox.addEventListener('change', () => {
    setIndoorLayerVisible(checkbox.checked);
  });

  container.appendChild(checkbox);
  container.appendChild(label);

  document.getElementById('ui').appendChild(container);
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

createIndoorLayerCheckbox();
createARButton();
// Animation loop
function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}

animate();