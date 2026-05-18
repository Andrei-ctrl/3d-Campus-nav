export async function isARSupported() {
  if (!navigator.xr) {
    return false;
  }

  return await navigator.xr.isSessionSupported('immersive-ar');
}

export async function startARSession(renderer) {
  if (!navigator.xr) {
    throw new Error('WebXR is not available in this browser.');
  }

  const supported = await navigator.xr.isSessionSupported('immersive-ar');

  if (!supported) {
    throw new Error('Immersive AR is not supported on this device/browser.');
  }

  renderer.xr.enabled = true;

  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['local-floor'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: {
      root: document.body
    }
  });

  renderer.xr.setSession(session);

  return session;
}