let currentARRouteGroup = null;
export function clearARRoute(scene) {
  if (!currentARRouteGroup) return;

  if (currentARRouteGroup.parent) {
    currentARRouteGroup.parent.remove(currentARRouteGroup);
  } else {
    scene.remove(currentARRouteGroup);
  }

  currentARRouteGroup.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  });

  currentARRouteGroup = null;
}

export function renderARRoute(scene, graph, pathNodeIds, anchorPosition, options = {}) {
  clearARRoute(scene);

  if (!pathNodeIds || pathNodeIds.length < 2) {
    console.warn('No AR route to render.');
    return null;
  }

  const scale = options.scale ?? 0.1;
  const camera = options.camera ?? null;
  const cameraRelative = options.cameraRelative ?? false;

  const relativeRoute = convertRouteToAnchorRelative(
    graph,
    pathNodeIds,
    anchorPosition
  );

  const group = new THREE.Group();
  group.name = 'AR_ROUTE_GROUP';

  let arPoints;

  if (cameraRelative) {
    // DEBUG / prototype AR mode:
    // Draw a compressed route directly in front of the phone camera.
    // This makes the full route visible even indoors.
    arPoints = relativeRoute.map((point, index) => ({
      id: point.id,
      x: index * 0.35 - 0.4,
      y: -0.45,
      z: -1.3 - index * 0.25
    }));
  } else {
    // Real anchor-relative mode:
    // Draw route according to campus coordinates.
    arPoints = relativeRoute.map((point) => ({
      id: point.id,
      x: point.x * scale,
      y: -0.45,
      z: -point.z * scale
    }));
  }

  for (let i = 0; i < arPoints.length - 1; i++) {
    const segment = createCylinderBetweenPoints(
      arPoints[i],
      arPoints[i + 1],
      0.07,
      0x00ff00
    );

    group.add(segment);
  }

  arPoints.forEach((point, index) => {
    const marker = createPointMarker(
      point,
      index === 0 ? 0xffff00 : 0x00ff00
    );

    group.add(marker);
  });

  if (cameraRelative && camera) {
    camera.add(group);

    if (!scene.children.includes(camera)) {
      scene.add(camera);
    }
  } else {
    scene.add(group);
  }

  currentARRouteGroup = group;

  console.log('Rendered AR route points:', arPoints);

  return group;
}