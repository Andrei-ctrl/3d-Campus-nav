export function createRouteControls(
  anchors,
  destinations,
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

  // Destination selector
  const toLabel = document.createElement('label');
  toLabel.textContent = 'Destination';

  const toSelect = document.createElement('select');
  toSelect.id = 'route-to';

  destinations.forEach((destination) => {
    const toOption = document.createElement('option');
    toOption.value = destination.id;
    toOption.textContent = destination.name;
    toSelect.appendChild(toOption);
  });

  // Command input
  const commandLabel = document.createElement('label');
  commandLabel.textContent = 'Command';

  const commandInput = document.createElement('input');
  commandInput.id = 'route-command';
  commandInput.type = 'text';
  commandInput.placeholder = 'e.g. go to PER21 C130';

  const commandButton = document.createElement('button');
  commandButton.textContent = 'Run Command';

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
    onRunCommand(currentLocationSelect.value, commandInput.value);
  });

  commandInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      onRunCommand(currentLocationSelect.value, commandInput.value);
    }
  });

  minimizeButton.addEventListener('click', () => {
    container.classList.toggle('collapsed');

    const isCollapsed = container.classList.contains('collapsed');
    minimizeButton.textContent = isCollapsed ? '+' : '−';
    minimizeButton.title = isCollapsed ? 'Expand panel' : 'Minimize panel';
  });

  content.appendChild(currentLocationLabel);
  content.appendChild(currentLocationSelect);

  content.appendChild(toLabel);
  content.appendChild(toSelect);

  content.appendChild(showButton);
  content.appendChild(clearButton);

  content.appendChild(commandLabel);
  content.appendChild(commandInput);
  content.appendChild(commandButton);

  container.appendChild(header);
  container.appendChild(content);

  document.getElementById('ui').appendChild(container);

  return {
    container,
    currentLocationSelect,
    toSelect,
    commandInput
  };
}