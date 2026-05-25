const PRIMARY_MENU_TOP = 46;

let menuOpen = false;
let debugMode = false;
let menuShell = null;
let menuDropdown = null;
const primaryItems = new Map();
const debugElements = new Set();
const menuActions = new Map();

function getElement(idOrElement) {
  if (typeof idOrElement === 'string') {
    return document.getElementById(idOrElement);
  }

  return idOrElement ?? null;
}

function hideWidget(element) {
  if (!element) return;

  element.classList.add('widget-hidden');
}

function showWidget(element) {
  if (!element) return;

  element.classList.remove('widget-hidden');
}

function isWidgetVisible(element) {
  return element && !element.classList.contains('widget-hidden');
}

function updatePrimaryPanelLayout() {
  let top = PRIMARY_MENU_TOP;

  primaryItems.forEach(({ element }) => {
    if (!element || !isWidgetVisible(element)) return;

    element.style.top = `${top}px`;
    top += element.offsetHeight + 6;
  });
}

function syncMenuItemStates() {
  primaryItems.forEach(({ button, element }) => {
    button.classList.toggle('active', isWidgetVisible(element));
  });

  menuDropdown?.querySelector('[data-action="debug"]')?.classList.toggle('active', debugMode);
}

function togglePrimaryWidget(id) {
  const item = primaryItems.get(id);
  const element = item?.element;

  if (!element) return;

  if (isWidgetVisible(element)) {
    hideWidget(element);
  } else {
    showWidget(element);
  }

  syncMenuItemStates();
  updatePrimaryPanelLayout();
}

function setDebugMode(enabled) {
  debugMode = enabled;

  debugElements.forEach((element) => {
    if (!element) return;

    if (debugMode) {
      showWidget(element);
    } else {
      hideWidget(element);
    }
  });

  syncMenuItemStates();
}

function toggleDebugMode() {
  setDebugMode(!debugMode);
}

function closeMenu() {
  menuOpen = false;
  menuDropdown?.classList.add('widget-hidden');
  menuShell?.classList.remove('open');
}

function openMenu() {
  menuOpen = true;
  menuDropdown?.classList.remove('widget-hidden');
  menuShell?.classList.add('open');
}

function toggleMenu() {
  if (menuOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

export function registerPrimaryWidget(id, label) {
  const element = document.getElementById(id);

  if (!element) return;

  element.classList.add('menu-primary-widget', 'widget-hidden');
  primaryItems.set(id, { element, label, button: null });
  hideWidget(element);
}

export function registerDebugWidget(idOrElement) {
  const element = getElement(idOrElement);

  if (!element || debugElements.has(element)) return;

  element.classList.add('debug-widget', 'widget-hidden');
  debugElements.add(element);
  hideWidget(element);
}

export function registerDynamicDebugWidget(element) {
  registerDebugWidget(element);

  if (debugMode) {
    showWidget(element);
  }
}

export function registerMenuAction(id, { label, getLabel, onClick } = {}) {
  if (!id || menuActions.has(id)) {
    return;
  }

  menuActions.set(id, { label, getLabel, onClick, button: null });
}

function syncMenuActionLabels() {
  menuActions.forEach((action) => {
    if (!action.button) return;

    action.button.textContent = action.getLabel?.() ?? action.label;
  });
}

export function updateMenuAction(id) {
  const action = menuActions.get(id);

  if (action?.button) {
    action.button.textContent = action.getLabel?.() ?? action.label;
  }
}

export function isDebugModeEnabled() {
  return debugMode;
}

export function initAppMenu({ primary = [], debugIds = [] } = {}) {
  if (menuShell) {
    return null;
  }
  primary.forEach(({ id, label }) => registerPrimaryWidget(id, label));
  debugIds.forEach((id) => registerDebugWidget(id));

  menuShell = document.createElement('div');
  menuShell.className = 'app-menu-shell';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'app-menu-toggle';
  toggle.setAttribute('aria-label', 'Open campus menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M4 7h16v1.8H4V7zm0 5.1h16v1.8H4v-1.8zm0 5.1h16V19H4v-1.8z"/>
    </svg>
  `;

  menuDropdown = document.createElement('div');
  menuDropdown.className = 'app-menu-dropdown widget-hidden';

  primary.forEach(({ id, label }) => {
    const item = primaryItems.get(id);

    if (!item) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'app-menu-item';
    button.textContent = label;
    button.addEventListener('click', () => {
      togglePrimaryWidget(id);
      updatePrimaryPanelLayout();
    });

    item.button = button;
    menuDropdown.appendChild(button);
  });

  const debugButton = document.createElement('button');
  debugButton.type = 'button';
  debugButton.className = 'app-menu-item app-menu-item-debug';
  debugButton.dataset.action = 'debug';
  debugButton.textContent = 'Debug panels';
  debugButton.addEventListener('click', () => {
    toggleDebugMode();
  });

  menuDropdown.appendChild(debugButton);

  menuActions.forEach((action, id) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'app-menu-item';
    button.textContent = action.getLabel?.() ?? action.label;
    button.addEventListener('click', () => {
      action.onClick?.();
      syncMenuActionLabels();
      closeMenu();
    });

    action.button = button;
    menuDropdown.appendChild(button);
  });

  syncMenuActionLabels();

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMenu();
    toggle.setAttribute('aria-expanded', menuOpen ? 'true' : 'false');
  });

  document.addEventListener('click', (event) => {
    if (!menuShell?.contains(event.target)) {
      closeMenu();
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  window.addEventListener('resize', updatePrimaryPanelLayout);

  menuShell.appendChild(toggle);
  menuShell.appendChild(menuDropdown);
  document.getElementById('ui')?.appendChild(menuShell);

  syncMenuItemStates();

  return {
    togglePrimaryWidget,
    setDebugMode,
    updatePrimaryPanelLayout
  };
}
