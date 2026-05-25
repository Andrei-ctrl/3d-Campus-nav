import {
  createVoiceRecognizer,
  isVoiceRecognitionSupported
} from '../voice/voiceRecognition.js';
import {
  resolveNavigationCommand,
  resolveSpokenNavigationCommand
} from '../llm/navigationAgent.js';
import { setupWidget } from './widgets.js';

import { getAnchorById, getAnchorForEntranceId } from '../data/anchors.js';

function findAnchorForDestination(destinationId, anchors, destinations) {
  const destination = destinations.find((item) => item.id === destinationId);

  if (!destination) return null;

  const entranceId = destination.type === 'room'
    ? destination.room?.nearestEntranceId
    : destination.defaultEntranceId;

  const exactAnchor = getAnchorForEntranceId(entranceId);

  if (exactAnchor) return exactAnchor;

  if (destination.type === 'room') {
    return anchors.find((anchor) => anchor.entranceId.startsWith(destination.room.buildingId)) || null;
  }

  return null;
}

export function createRouteControls(
  anchors,
  getDestinations,
  onShowRoute,
  onClearRoute,
  onRunCommand
) {
  const container = document.createElement('div');
  container.id = 'route-controls';
  container.className = 'route-controls';

  const header = document.createElement('div');
  header.className = 'route-controls-header';

  const title = document.createElement('h2');
  title.textContent = 'Route Navigation';

  const minimizeButton = document.createElement('button');
  minimizeButton.className = 'panel-minimize-button';
  minimizeButton.textContent = '−';
  minimizeButton.title = 'Minimize panel';

  header.appendChild(title);
  header.appendChild(minimizeButton);

  const content = document.createElement('div');
  content.className = 'route-controls-content';

  // Current location / anchor selector
  const currentLocationLabel = document.createElement('label');
  currentLocationLabel.textContent = 'Current location';

  const currentLocationSelect = document.createElement('select');
  currentLocationSelect.id = 'current-location';

  anchors.forEach((anchor) => {
    const option = document.createElement('option');
    option.value = anchor.id;
    option.textContent = anchor.name;
    currentLocationSelect.appendChild(option);
  });

  currentLocationSelect.addEventListener('change', () => {
    voiceFromDestinationId = null;
  });

  // Destination selector
  const toLabel = document.createElement('label');
  toLabel.textContent = 'Destination';

  const toSelect = document.createElement('select');
  toSelect.id = 'route-to';

  const populateDestinationOptions = () => {
    const destinations = getDestinations();
    const previousValue = toSelect.value;

    toSelect.innerHTML = '';

    destinations.forEach((destination) => {
      const toOption = document.createElement('option');
      toOption.value = destination.id;
      toOption.textContent = destination.name;
      toSelect.appendChild(toOption);
    });

    if (previousValue && destinations.some((item) => item.id === previousValue)) {
      toSelect.value = previousValue;
    }
  };

  populateDestinationOptions();

  const commandLabel = document.createElement('label');
  commandLabel.textContent = 'Command';

  const commandInput = document.createElement('input');
  commandInput.id = 'route-command';
  commandInput.type = 'text';
  commandInput.placeholder = 'e.g. Machine Scheduling, Wirtschaftsinformatik II, PER21 G230';

  const timetableStatus = document.createElement('p');
  timetableStatus.className = 'route-timetable-status';
  timetableStatus.textContent = 'Loading course timetable...';

  const commandButton = document.createElement('button');
  commandButton.textContent = 'Run Command';

  const voiceButton = document.createElement('button');
  voiceButton.type = 'button';
  voiceButton.textContent = '🎤 Speak';

  const debugClassroomDisplay = document.createElement('p');
  debugClassroomDisplay.className = 'route-debug-classroom';
  debugClassroomDisplay.textContent = 'Resolved classroom: —';

  let voiceRecognizer = null;
  let pendingVoiceTranscript = '';
  let voiceFromDestinationId = null;

  const updateTimetableStatus = (meta) => {
    if (!meta) {
      timetableStatus.textContent = 'Course timetable: not loaded';
      return;
    }

    if (meta.error) {
      timetableStatus.textContent = `Course timetable unavailable: ${meta.error}`;
      return;
    }

    timetableStatus.textContent =
      `Course timetable: ${meta.mappedCourseCount}/${meta.courseCount} courses mapped` +
      (meta.unmappedCourseCount > 0 ? ` (${meta.unmappedCourseCount} unmapped)` : '');
  };

  const updateDebugClassroomDisplay = () => {
    const destinations = getDestinations();
    const selectedDestination = destinations.find((item) => item.id === toSelect.value);
    const commandText = commandInput.value.trim();

    if (commandText) {
      const result = resolveNavigationCommand(commandText, destinations);

      if (result.success && result.toDestinationId) {
        const destination = destinations.find((item) => item.id === result.toDestinationId);

        if (destination?.type === 'room') {
          debugClassroomDisplay.textContent = `Resolved classroom: ${destination.room.name}`;
          return;
        }
      }
    }

    if (selectedDestination?.type === 'room') {
      debugClassroomDisplay.textContent = `Resolved classroom: ${selectedDestination.room.name}`;
      return;
    }

    debugClassroomDisplay.textContent = 'Resolved classroom: —';
  };

  const applySpokenCommand = (transcript) => {
    const destinations = getDestinations();
    const result = resolveSpokenNavigationCommand(transcript, destinations);

    if (!result.success) {
      alert(result.error);
      return;
    }

    if (result.fromDestinationId) {
      voiceFromDestinationId = result.fromDestinationId;

      const anchor = getAnchorById(result.fromDestinationId)
        || findAnchorForDestination(result.fromDestinationId, anchors, destinations);

      if (anchor) {
        currentLocationSelect.value = anchor.id;
      }
    }

    if (!result.toDestinationId) {
      commandInput.value = transcript;
      updateDebugClassroomDisplay();
      return;
    }

    const toDestination = destinations.find((item) => item.id === result.toDestinationId);

    if (toDestination) {
      toSelect.value = toDestination.id;
    }

    const fromDestinationId = result.fromDestinationId || voiceFromDestinationId;

    commandInput.value = fromDestinationId
      ? `from ${fromDestinationId} to ${result.toDestinationId}`
      : transcript;

    updateDebugClassroomDisplay();
    onRunCommand(currentLocationSelect.value, commandInput.value);
  };

  if (isVoiceRecognitionSupported()) {
    voiceRecognizer = createVoiceRecognizer({
      language: 'en-US',
      onStart: () => {
        voiceButton.textContent = 'Listening...';
        voiceButton.disabled = true;
      },
      onEnd: () => {
        voiceButton.textContent = '🎤 Speak';
        voiceButton.disabled = false;

        if (pendingVoiceTranscript) {
          applySpokenCommand(pendingVoiceTranscript);
          pendingVoiceTranscript = '';
        }
      },
      onError: (event) => {
        console.warn('Voice recognition error:', event.error);
      },
      onResult: (transcript) => {
        pendingVoiceTranscript = transcript;
        commandInput.value = transcript;
      }
    });
  } else {
    voiceButton.disabled = true;
    voiceButton.title = 'Voice not supported in this browser';
  }

  // Buttons
  const showButton = document.createElement('button');
  showButton.textContent = 'Show Route';

  const clearButton = document.createElement('button');
  clearButton.textContent = 'Clear Route';

  showButton.addEventListener('click', () => {
    onShowRoute(currentLocationSelect.value, toSelect.value);
  });

  clearButton.addEventListener('click', () => {
    onClearRoute();
  });

  commandButton.addEventListener('click', () => {
    updateDebugClassroomDisplay();
    onRunCommand(currentLocationSelect.value, commandInput.value);
  });

  voiceButton.addEventListener('click', () => {
    if (!voiceRecognizer) return;
    voiceRecognizer.start();
  });

  commandInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      updateDebugClassroomDisplay();
      onRunCommand(currentLocationSelect.value, commandInput.value);
    }
  });

  commandInput.addEventListener('input', updateDebugClassroomDisplay);
  toSelect.addEventListener('change', updateDebugClassroomDisplay);

  content.appendChild(currentLocationLabel);
  content.appendChild(currentLocationSelect);

  content.appendChild(toLabel);
  content.appendChild(toSelect);

  content.appendChild(showButton);
  content.appendChild(clearButton);

  content.appendChild(commandLabel);
  content.appendChild(commandInput);
  content.appendChild(timetableStatus);
  content.appendChild(commandButton);
  content.appendChild(voiceButton);
  content.appendChild(debugClassroomDisplay);

  container.appendChild(header);
  container.appendChild(content);

  document.getElementById('ui').appendChild(container);
  setupWidget(container, {
    header,
    content,
    minimizeButton
  });

  updateDebugClassroomDisplay();

  return {
    container,
    currentLocationSelect,
    toSelect,
    commandInput,
    updateDestinations: (destinations, timetableMeta) => {
      populateDestinationOptions();
      updateTimetableStatus(timetableMeta);
      updateDebugClassroomDisplay();
    }
  };
}
