import { setupWidget } from './widgets.js';
import {
  getDistanceToNextOutdoorNode,
  getRemainingOutdoorDistance,
  isGeolocationAvailable,
  startOutdoorTracking,
  stopOutdoorTracking
} from '../navigation/outdoorRouteProgress.js';

function formatDistance(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  return `${value.toFixed(1)} m`;
}

export function createOutdoorTrackingPanel({
  scene,
  graph,
  getOutdoorPath,
  getDestination,
  getHasIndoorLeg
}) {
  const container = document.createElement('div');
  container.id = 'outdoor-tracking-panel';
  container.className = 'outdoor-tracking-panel ui-panel widget';

  const header = document.createElement('div');
  header.className = 'outdoor-tracking-header';

  const title = document.createElement('h2');
  title.textContent = 'Outdoor GPS Tracking';
  header.appendChild(title);

  const minimizeButton = document.createElement('button');
  minimizeButton.className = 'panel-minimize-button';
  minimizeButton.textContent = '−';
  minimizeButton.title = 'Minimize panel';
  header.appendChild(minimizeButton);

  const content = document.createElement('div');
  content.className = 'outdoor-tracking-content';

  const help = document.createElement('p');
  help.className = 'outdoor-tracking-help';
  help.textContent =
    'Uses GPS outdoors (5–8 m threshold). Indoor AR continues with WebXR camera tracking at building entrances.';
  content.appendChild(help);

  const statusLine = document.createElement('p');
  statusLine.id = 'outdoor-tracking-status';
  statusLine.textContent = 'Outdoor navigation inactive';

  const instructionLine = document.createElement('p');
  instructionLine.id = 'outdoor-tracking-instruction';
  instructionLine.textContent = 'Show a route, then start outdoor tracking.';

  const nextDistanceLine = document.createElement('p');
  nextDistanceLine.id = 'outdoor-tracking-next-distance';
  nextDistanceLine.textContent = 'Distance to next point: —';

  const remainingDistanceLine = document.createElement('p');
  remainingDistanceLine.id = 'outdoor-tracking-remaining-distance';
  remainingDistanceLine.textContent = 'Remaining distance: —';

  const accuracyLine = document.createElement('p');
  accuracyLine.id = 'outdoor-tracking-accuracy';
  accuracyLine.textContent = 'GPS accuracy: —';

  const nodeLine = document.createElement('p');
  nodeLine.id = 'outdoor-tracking-node';
  nodeLine.textContent = 'Current route node index: —';

  const destinationLine = document.createElement('p');
  destinationLine.id = 'outdoor-tracking-destination';
  destinationLine.textContent = 'Destination: —';

  const startButton = document.createElement('button');
  startButton.textContent = 'Start Outdoor Tracking';
  startButton.disabled = !isGeolocationAvailable();

  const stopButton = document.createElement('button');
  stopButton.textContent = 'Stop Outdoor Tracking';
  stopButton.disabled = true;

  let routeState = null;

  const refreshDebugUI = (state = routeState) => {
    statusLine.textContent = state?.active
      ? 'Outdoor navigation active'
      : state?.destinationReached
        ? 'Outdoor destination reached'
        : 'Outdoor navigation inactive';

    instructionLine.textContent = state?.instructionText || 'Show a route to begin outdoor GPS tracking.';
    nextDistanceLine.textContent = `Distance to next point: ${formatDistance(getDistanceToNextOutdoorNode(state))}`;
    remainingDistanceLine.textContent = `Remaining distance: ${formatDistance(getRemainingOutdoorDistance(state))}`;
    accuracyLine.textContent = `GPS accuracy: ${formatDistance(state?.gpsAccuracy ?? null)}`;
    nodeLine.textContent = `Current route node index: ${state?.currentNodeIndex ?? '—'}`;
    destinationLine.textContent = `Destination: ${state?.destinationName || getDestination()?.name || '—'}`;
  };

  const startTracking = () => {
    const outdoorPath = getOutdoorPath();
    const destination = getDestination();

    if (!outdoorPath || outdoorPath.length < 2) {
      return false;
    }

    routeState = startOutdoorTracking(outdoorPath, graph, {
      scene,
      existingState: routeState,
      destinationName: destination?.name || 'destination',
      hasIndoorLeg: getHasIndoorLeg?.() ?? false,
      finalEntranceNodeId: outdoorPath[outdoorPath.length - 1] ?? null,
      onUpdate: refreshDebugUI,
      onInstruction: (text) => {
        instructionLine.textContent = text;
        refreshDebugUI(routeState);
      },
      onDestinationReached: () => {
        stopButton.disabled = true;
        startButton.disabled = !isGeolocationAvailable();
        refreshDebugUI(routeState);
      }
    });

    if (routeState) {
      startButton.disabled = true;
      stopButton.disabled = false;
      refreshDebugUI(routeState);
      return true;
    }

    return false;
  };

  startButton.addEventListener('click', () => {
    if (!getOutdoorPath()?.length) {
      instructionLine.textContent = 'Calculate an outdoor route first (Show Route).';
      return;
    }

    startTracking();
  });

  stopButton.addEventListener('click', () => {
    routeState = stopOutdoorTracking(routeState);
    startButton.disabled = !isGeolocationAvailable();
    stopButton.disabled = true;
    refreshDebugUI(routeState);
  });

  content.appendChild(statusLine);
  content.appendChild(instructionLine);
  content.appendChild(nextDistanceLine);
  content.appendChild(remainingDistanceLine);
  content.appendChild(accuracyLine);
  content.appendChild(nodeLine);
  content.appendChild(destinationLine);
  content.appendChild(startButton);
  content.appendChild(stopButton);

  container.appendChild(header);
  container.appendChild(content);
  document.getElementById('ui').appendChild(container);

  setupWidget(container, { header, content, minimizeButton });
  refreshDebugUI();

  return {
    container,
    startTracking,
    stopTracking: () => {
      routeState = stopOutdoorTracking(routeState);
      startButton.disabled = !isGeolocationAvailable();
      stopButton.disabled = true;
      refreshDebugUI(routeState);
    },
    refreshUI: refreshDebugUI
  };
}
