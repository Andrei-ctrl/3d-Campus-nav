function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function makeWidgetDraggable(container, handle) {
  if (!container || !handle || handle.dataset.draggableReady === 'true') return;

  handle.dataset.draggableReady = 'true';
  handle.classList.add('widget-drag-handle');

  let dragState = null;

  handle.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button, input, select, textarea, label')) return;

    const rect = container.getBoundingClientRect();

    dragState = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };

    container.style.left = `${rect.left}px`;
    container.style.top = `${rect.top}px`;
    container.style.right = 'auto';
    container.style.bottom = 'auto';
    container.style.position = 'absolute';
    container.classList.add('dragging');
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener('pointermove', (event) => {
    if (!dragState) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const left = clamp(event.clientX - dragState.offsetX, 0, window.innerWidth - width);
    const top = clamp(event.clientY - dragState.offsetY, 0, window.innerHeight - height);

    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
  });

  const stopDragging = (event) => {
    if (!dragState) return;

    dragState = null;
    container.classList.remove('dragging');

    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
  };

  handle.addEventListener('pointerup', stopDragging);
  handle.addEventListener('pointercancel', stopDragging);
}

export function setupWidget(container, {
  header,
  content = null,
  minimizeButton = null
}) {
  if (!container || !header) return null;

  container.classList.add('widget');
  header.classList.add('widget-header');

  if (content) {
    content.classList.add('widget-content');
  }

  let button = minimizeButton;

  if (!button && content) {
    button = document.createElement('button');
    button.className = 'panel-minimize-button';
    button.textContent = '−';
    button.title = 'Minimize panel';
    header.appendChild(button);
  }

  if (button && content && button.dataset.collapseReady !== 'true') {
    button.dataset.collapseReady = 'true';
    button.addEventListener('click', () => {
      container.classList.toggle('collapsed');
      container.classList.toggle('widget-collapsed');

      const isCollapsed = container.classList.contains('collapsed');
      button.textContent = isCollapsed ? '+' : '−';
      button.title = isCollapsed ? 'Expand panel' : 'Minimize panel';
    });
  }

  makeWidgetDraggable(container, header);

  return button;
}

let uiWidgetsVisible = true;

export function areUIWidgetsVisible() {
  return uiWidgetsVisible;
}

export function setUIWidgetsVisible(visible) {
  uiWidgetsVisible = visible;

  const ui = document.getElementById('ui');

  if (ui) {
    ui.classList.toggle('ui-widgets-hidden', !visible);
  }
}

export function createUIVisibilityToggle() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ui-visibility-toggle';
  button.textContent = 'Show/Hide';
  button.title = 'Show or hide all UI panels';
  button.setAttribute('aria-pressed', 'false');

  button.addEventListener('click', () => {
    setUIWidgetsVisible(!uiWidgetsVisible);
    button.setAttribute('aria-pressed', uiWidgetsVisible ? 'false' : 'true');
    button.title = uiWidgetsVisible ? 'Hide all UI panels' : 'Show all UI panels';
  });

  document.getElementById('ui')?.appendChild(button);

  return button;
}
