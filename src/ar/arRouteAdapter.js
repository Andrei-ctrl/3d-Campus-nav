export function getDefaultARMirrorX() {
  // WebXR local space is mirrored on X vs the desktop campus map (PER22/Mensa swap without this).
  return -1;
}

export function convertMapPointToAnchorRelative(point, anchorPosition, options = {}) {
  const dx = point.x - anchorPosition.x;
  const dz = point.z - anchorPosition.z;

  if (!options.arSpace) {
    return {
      x: dx,
      y: point.y ?? 0,
      z: dz
    };
  }

  const mirrorX = options.arMirrorX ?? getDefaultARMirrorX();

  return {
    x: mirrorX * dx,
    y: point.y ?? 0,
    z: -dz
  };
}

export function convertRouteToAnchorRelative(graph, pathNodeIds, anchorPosition, options = {}) {
  return pathNodeIds
    .map((nodeId) => {
      const node = graph.nodes[nodeId];

      if (!node) return null;

      return {
        id: nodeId,
        label: node.label || nodeId,
        ...convertMapPointToAnchorRelative(node, anchorPosition, options)
      };
    })
    .filter(Boolean);
}