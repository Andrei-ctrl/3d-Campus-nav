export function convertMapPointToAnchorRelative(point, anchorPosition) {
  return {
    x: point.x - anchorPosition.x,
    y: point.y ?? 0,
    z: point.z - anchorPosition.z
  };
}

export function convertRouteToAnchorRelative(graph, pathNodeIds, anchorPosition) {
  return pathNodeIds
    .map((nodeId) => {
      const node = graph.nodes[nodeId];

      if (!node) return null;

      return {
        id: nodeId,
        label: node.label || nodeId,
        ...convertMapPointToAnchorRelative(node, anchorPosition)
      };
    })
    .filter(Boolean);
}