import { setupWidget } from './widgets.js';
import {
  applySceneCalibration,
  getSceneCalibration,
  getSceneMirrorLabel,
  resetSceneCalibration,
  saveSceneCalibration,
  setSceneCalibration
} from '../scene/sceneCalibration.js';

const CONTROL_GROUPS = [
  {
    title: 'Whole scene',
    controls: [
      { key: 'globalScale', label: 'Global scale', min: 0.01, sliderMax: 30, step: 0.01, wide: true },
      { key: 'offsetX', label: 'Offset X (m)', min: -500, sliderMax: 500, step: 0.5 },
      { key: 'offsetY', label: 'Offset Y (m)', min: -100, sliderMax: 100, step: 0.1 },
      { key: 'offsetZ', label: 'Offset Z (m)', min: -500, sliderMax: 500, step: 0.5 },
      { key: 'pivotX', label: 'Pivot X (m)', min: -500, sliderMax: 500, step: 0.5 },
      { key: 'pivotY', label: 'Pivot Y (m)', min: -100, sliderMax: 100, step: 0.1 },
      { key: 'pivotZ', label: 'Pivot Z (m)', min: -500, sliderMax: 500, step: 0.5 }
    ]
  },
  {
    title: 'Building groups',
    controls: [
      { key: 'buildingsScale', label: 'Building shells', min: 0.01, sliderMax: 5, step: 0.01, wide: true },
      { key: 'per21IndoorScale', label: 'PER21 interior × shells', min: 0.01, sliderMax: 5, step: 0.01, wide: true },
      { key: 'per22IndoorScale', label: 'PER22 interior × shells', min: 0.01, sliderMax: 5, step: 0.01, wide: true },
      { key: 'per17IndoorScale', label: 'PER17 interior × shells', min: 0.01, sliderMax: 5, step: 0.01, wide: true },
      { key: 'markersScale', label: 'Markers & labels', min: 0.01, sliderMax: 5, step: 0.01, wide: true },
      { key: 'pathsScale', label: 'Roads & paths', min: 0.01, sliderMax: 5, step: 0.01, wide: true },
      { key: 'groundScale', label: 'Ground plane', min: 0.01, sliderMax: 5, step: 0.01, wide: true },
      { key: 'routesScale', label: 'Route lines × paths', min: 0.1, sliderMax: 5, step: 0.01, wide: true }
    ]
  },
  {
    title: 'AR overlay',
    controls: [
      { key: 'arScale', label: 'AR scale', min: 0.001, sliderMax: 2, step: 0.001, wide: true },
      { key: 'arOffsetX', label: 'AR offset X', min: -50, sliderMax: 50, step: 0.05 },
      { key: 'arOffsetY', label: 'AR offset Y', min: -50, sliderMax: 50, step: 0.05 },
      { key: 'arOffsetZ', label: 'AR offset Z', min: -50, sliderMax: 50, step: 0.05 }
    ]
  }
];

function createSectionTitle(text) {
  const title = document.createElement('div');
  title.className = 'calibration-section-title';
  title.textContent = text;
  return title;
}

function syncControlValues(controls, calibration) {
  Object.entries(controls).forEach(([key, control]) => {
    const value = calibration[key];

    control.range.value = value;
    control.number.value = value;
  });
}

function readCalibrationFromControls(controls, modeSelect, livePreviewCheckbox, pivotSelect) {
  const next = {
    ...getSceneCalibration(),
    mode: modeSelect.value,
    livePreview: livePreviewCheckbox.checked
  };

  Object.keys(controls).forEach((key) => {
    next[key] = Number(controls[key].number.value);
  });

  const selectedPivotOption = pivotSelect?.selectedOptions?.[0];
  const pivot = selectedPivotOption?.dataset.pivot
    ? JSON.parse(selectedPivotOption.dataset.pivot)
    : { x: next.pivotX, y: next.pivotY, z: next.pivotZ };

  next.pivotX = pivot.x;
  next.pivotY = pivot.y;
  next.pivotZ = pivot.z;

  return next;
}

export function createCalibrationPanel({ anchors = [], onApply, onMirrorToggle, onFitView } = {}) {
  const container = document.createElement('div');
  container.id = 'ar-calibration-panel';
  container.className = 'ar-calibration-panel calibration-panel';

  const header = document.createElement('div');
  header.className = 'ar-calibration-header';

  const title = document.createElement('h2');
  title.textContent = 'Scene Calibration';
  header.appendChild(title);

  const content = document.createElement('div');
  content.className = 'ar-calibration-content';

  const help = document.createElement('p');
  help.className = 'calibration-help';
  help.textContent =
    'Align the 3D prototype with the real campus. Global scale affects everything; building shells and interiors scale together by default (interior sliders are multipliers on top of shells).';
  content.appendChild(help);

  const modeLabel = document.createElement('label');
  modeLabel.textContent = 'AR mode';

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

  content.appendChild(modeLabel);
  content.appendChild(modeSelect);

  const pivotLabel = document.createElement('label');
  pivotLabel.textContent = 'Scale pivot';

  const pivotSelect = document.createElement('select');
  pivotSelect.id = 'calibration-pivot';

  [
    { value: 'origin', text: 'Map origin (0, 0, 0)', pivot: { x: 0, y: 0, z: 0 } },
    ...anchors.map((anchor) => ({
      value: anchor.id,
      text: anchor.name,
      pivot: anchor.position
    }))
  ].forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.text;
    option.dataset.pivot = JSON.stringify(item.pivot);
    pivotSelect.appendChild(option);
  });

  content.appendChild(pivotLabel);
  content.appendChild(pivotSelect);

  const livePreviewCheckbox = document.createElement('input');
  livePreviewCheckbox.type = 'checkbox';
  livePreviewCheckbox.id = 'calibration-live-preview';
  livePreviewCheckbox.checked = getSceneCalibration().livePreview;

  const livePreviewLabel = document.createElement('label');
  livePreviewLabel.className = 'calibration-live-preview';
  livePreviewLabel.htmlFor = 'calibration-live-preview';
  livePreviewLabel.appendChild(livePreviewCheckbox);
  livePreviewLabel.append(' Live preview on map');
  content.appendChild(livePreviewLabel);

  const controls = {};
  let previewTimer = null;

  const schedulePreview = () => {
    if (!livePreviewCheckbox.checked) return;

    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      const nextCalibration = readCalibrationFromControls(
        controls,
        modeSelect,
        livePreviewCheckbox,
        pivotSelect
      );
      setSceneCalibration(nextCalibration);
      applySceneCalibration();
      onApply?.(nextCalibration);
    }, 120);
  };

  const addCalibrationControl = (key, label, config) => {
    const row = document.createElement('div');
    row.className = 'ar-calibration-row';

    const controlLabel = document.createElement('label');
    controlLabel.textContent = label;
    controlLabel.htmlFor = `calibration-${key}`;

    const range = document.createElement('input');
    range.type = 'range';
    range.id = `calibration-${key}-range`;
    range.min = config.min;
    range.max = config.sliderMax;
    range.step = config.step;
    range.value = getSceneCalibration()[key];

    const number = document.createElement('input');
    number.type = 'number';
    number.id = `calibration-${key}`;
    number.step = config.step;
    number.value = getSceneCalibration()[key];

    if (config.wide) {
      row.classList.add('calibration-row-wide');
    }

    const syncFromRange = () => {
      number.value = range.value;
      schedulePreview();
    };

    const syncFromNumber = () => {
      const parsed = Number(number.value);

      if (!Number.isFinite(parsed)) return;

      if (parsed >= Number(range.min) && parsed <= Number(range.max)) {
        range.value = parsed;
      }

      schedulePreview();
    };

    range.addEventListener('input', syncFromRange);
    number.addEventListener('input', syncFromNumber);

    row.appendChild(controlLabel);
    row.appendChild(range);
    row.appendChild(number);
    content.appendChild(row);

    controls[key] = { range, number };
  };

  CONTROL_GROUPS.forEach((group) => {
    content.appendChild(createSectionTitle(group.title));
    group.controls.forEach((control) => {
      addCalibrationControl(control.key, control.label, control);
    });
  });

  const flipButton = document.createElement('button');
  flipButton.type = 'button';
  flipButton.className = 'scene-mirror-button calibration-flip-button';
  flipButton.textContent = `Flip scene ↔ (${getSceneMirrorLabel()})`;
  flipButton.addEventListener('click', () => {
    onMirrorToggle?.();
    flipButton.textContent = `Flip scene ↔ (${getSceneMirrorLabel()})`;
  });
  content.appendChild(flipButton);

  const fitViewButton = document.createElement('button');
  fitViewButton.type = 'button';
  fitViewButton.className = 'calibration-fit-view-button';
  fitViewButton.textContent = 'Fit view to campus';
  fitViewButton.addEventListener('click', () => {
    onFitView?.();
  });
  content.appendChild(fitViewButton);

  const applyButton = document.createElement('button');
  applyButton.textContent = 'Apply calibration';

  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset all';

  const applyValues = () => {
    const nextCalibration = readCalibrationFromControls(
      controls,
      modeSelect,
      livePreviewCheckbox,
      pivotSelect
    );
    setSceneCalibration(nextCalibration);
    saveSceneCalibration();
    applySceneCalibration();
    onApply?.(getSceneCalibration());
  };

  applyButton.addEventListener('click', applyValues);

  resetButton.addEventListener('click', () => {
    resetSceneCalibration();
    modeSelect.value = getSceneCalibration().mode;
    livePreviewCheckbox.checked = getSceneCalibration().livePreview;
    pivotSelect.value = 'origin';
    syncControlValues(controls, getSceneCalibration());
    flipButton.textContent = `Flip scene ↔ (${getSceneMirrorLabel()})`;
    onApply?.(getSceneCalibration());
    onFitView?.();
  });

  livePreviewCheckbox.addEventListener('change', schedulePreview);
  pivotSelect.addEventListener('change', schedulePreview);

  content.appendChild(applyButton);
  content.appendChild(resetButton);

  container.appendChild(header);
  container.appendChild(content);
  document.getElementById('ui').appendChild(container);

  setupWidget(container, {
    header,
    content
  });

  modeSelect.value = getSceneCalibration().mode;
  syncControlValues(controls, getSceneCalibration());
  applySceneCalibration();

  return {
    container,
    applyValues
  };
}
