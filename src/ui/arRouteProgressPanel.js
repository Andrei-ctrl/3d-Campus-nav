import { setupWidget } from './widgets.js';
import {
  alignARRouteForSession,
  anchorRouteToCurrentCamera,
  getDistanceToNextNode,
  getRemainingIndoorDistance
} from '../ar/indoorRouteProgress.js';
import { getSceneCalibration } from '../scene/sceneCalibration.js';

function formatDistance(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  return `${value.toFixed(1)} m`;
}

function formatVector(vector) {
  if (!vector) return '—';
  return `${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)}`;
}

export function createARRouteProgressPanel({
  scene,
  camera,
  getRouteState,
  isARSessionActive
}) {
  const container = document.createElement('div');
  container.id = 'ar-route-progress-panel';
  container.className = 'ar-route-progress-panel';

  const header = document.createElement('div');
  header.className = 'ar-route-progress-header';

  const title = document.createElement('h2');
  title.textContent = 'Indoor AR Route';
  header.appendChild(title);

  const minimizeButton = document.createElement('button');
  minimizeButton.className = 'panel-minimize-button';
  minimizeButton.textContent = '−';
  minimizeButton.title = 'Minimize panel';
  header.appendChild(minimizeButton);

  const content = document.createElement('div');
  content.className = 'ar-route-progress-content';

  const instructionLine = document.createElement('p');
  instructionLine.className = 'ar-route-instruction';
  instructionLine.textContent = 'Start AR, then align the route at the entrance.';

  const nextDistanceLine = document.createElement('p');
  nextDistanceLine.textContent = 'Distance to next point: —';

  const remainingDistanceLine = document.createElement('p');
  remainingDistanceLine.textContent = 'Remaining distance: —';

  const nodeLine = document.createElement('p');
  nodeLine.textContent = 'Current route node index: —';

  const arrivedLine = document.createElement('p');
  arrivedLine.textContent = 'Destination reached: false';

  const cameraLine = document.createElement('p');
  cameraLine.className = 'ar-route-debug-camera';
  cameraLine.textContent = 'Camera position: —';

  const alignButton = document.createElement('button');
  alignButton.className = 'ar-align-route-button';
  alignButton.textContent = 'Align AR Route';
  alignButton.disabled = true;
  let routeMode = 'indoor';

  const refreshUI = (routeState = getRouteState()) => {
    if (routeMode === 'outdoor' && !routeState) {
      title.textContent = 'Outdoor AR Route';
      alignButton.disabled = true;
      alignButton.textContent = 'Outdoor route';
      instructionLine.textContent = 'Follow the blue outdoor AR route.';
      nextDistanceLine.textContent = 'Distance to next point: —';
      remainingDistanceLine.textContent = 'Remaining distance: —';
      nodeLine.textContent = 'Current route node index: —';
      arrivedLine.textContent = 'Destination reached: false';
      cameraLine.textContent = 'Camera position: —';
      return;
    }

    title.textContent = 'Indoor AR Route';
    const activeSession = isARSessionActive?.() ?? false;
    const canAlign = activeSession && routeState;

    alignButton.disabled = !canAlign;
    alignButton.textContent = routeState?.aligned ? 'Re-align AR Route' : 'Align AR Route';

    instructionLine.textContent =
      routeState?.instructionText || 'Start AR, then align the route at the entrance.';
    nextDistanceLine.textContent =
      `Distance to next point: ${formatDistance(getDistanceToNextNode(camera, routeState))}`;
    remainingDistanceLine.textContent =
      `Remaining distance: ${formatDistance(getRemainingIndoorDistance(camera, routeState))}`;
    nodeLine.textContent = `Current route node index: ${routeState?.currentNodeIndex ?? '—'}`;
    arrivedLine.textContent = `Destination reached: ${routeState?.destinationReached ? 'true' : 'false'}`;
    cameraLine.textContent =
      `Camera position: ${formatVector(routeState?.lastCameraPosition)}`;
  };

  alignButton.addEventListener('click', () => {
    const routeState = getRouteState();

    if (!routeState || !isARSessionActive?.()) {
      return;
    }

    const calibration = getSceneCalibration();

    alignARRouteForSession(routeState, camera, scene, {
      arMode: calibration.mode
    });

    refreshUI(routeState);
  });

  content.appendChild(instructionLine);
  content.appendChild(nextDistanceLine);
  content.appendChild(remainingDistanceLine);
  content.appendChild(nodeLine);
  content.appendChild(arrivedLine);
  content.appendChild(cameraLine);
  content.appendChild(alignButton);

  container.appendChild(header);
  container.appendChild(content);
  document.getElementById('ui').appendChild(container);

  setupWidget(container, { header, content, minimizeButton });
  refreshUI();

  return {
    container,
    refreshUI,
    setPrepared: (routeStatus) => {
      routeMode = routeStatus === 'outdoor' ? 'outdoor' : 'indoor';
      const hasRoute = !!routeStatus;

      if (!hasRoute) {
        instructionLine.textContent = 'Show a route before starting AR.';
        alignButton.disabled = true;
        alignButton.textContent = 'Align AR Route';
        title.textContent = 'Indoor AR Route';
        return;
      }

      refreshUI();
    },
    reset: () => {
      routeMode = 'indoor';
      refreshUI(null);
    }
  };
}
