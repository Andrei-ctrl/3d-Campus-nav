export function createCalibrationState() {
  return {
    selectedAnchorId: null,
    selectedAnchor: null,
    isCalibrated: false
  };
}

export function calibrateToAnchor(anchorId, anchors) {
  const anchor = anchors.find((item) => item.id === anchorId);

  if (!anchor) {
    console.error(`Anchor not found: ${anchorId}`);

    return {
      selectedAnchorId: null,
      selectedAnchor: null,
      isCalibrated: false
    };
  }

  return {
    selectedAnchorId: anchor.id,
    selectedAnchor: anchor,
    isCalibrated: true
  };
}