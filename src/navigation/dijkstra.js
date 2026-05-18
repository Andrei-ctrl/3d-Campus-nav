function distance(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;

  return Math.sqrt(dx * dx + dz * dz);
}

function getNeighbors(graph, nodeId) {
  return graph.edges
    .filter(([a, b]) => a === nodeId || b === nodeId)
    .map(([a, b]) => (a === nodeId ? b : a));
}

export function findShortestPath(graph, startId, endId) {
  if (!graph.nodes[startId]) {
    console.error(`Start node not found: ${startId}`);
    return [];
  }

  if (!graph.nodes[endId]) {
    console.error(`End node not found: ${endId}`);
    return [];
  }

  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(graph.nodes));

  Object.keys(graph.nodes).forEach((nodeId) => {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
  });

  distances[startId] = 0;

  while (unvisited.size > 0) {
    let current = null;

    unvisited.forEach((nodeId) => {
      if (current === null || distances[nodeId] < distances[current]) {
        current = nodeId;
      }
    });

    if (current === null || distances[current] === Infinity) {
      break;
    }

    if (current === endId) {
      break;
    }

    unvisited.delete(current);

    const neighbors = getNeighbors(graph, current);

    neighbors.forEach((neighborId) => {
      if (!unvisited.has(neighborId)) return;

      const currentNode = graph.nodes[current];
      const neighborNode = graph.nodes[neighborId];

      const alternativeDistance =
        distances[current] + distance(currentNode, neighborNode);

      if (alternativeDistance < distances[neighborId]) {
        distances[neighborId] = alternativeDistance;
        previous[neighborId] = current;
      }
    });
  }

  const path = [];
  let current = endId;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  if (path[0] !== startId) {
    console.warn(`No path found from ${startId} to ${endId}`);
    return [];
  }

  return path;
}