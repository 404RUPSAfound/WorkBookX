/**
 * Graph Algorithms for Dependency Analysis & Cycle Detection
 * 
 * Provides:
 * 1. Cycle Detection (Circular Dependencies) using 3-color DFS
 * 2. Downstream Impact Analysis using Breadth-First Search (BFS)
 * 3. Topological Sort (where DAG is acyclic)
 */

/**
 * Detects circular dependencies in a directed adjacency graph.
 * In our graph:
 *   Adjacency: from cell U to cell V means "cell V directly depends on cell U"
 *   (i.e., if formula in V references U, edge is U -> V, so U is upstream, V is downstream).
 * 
 * @param {Map<string, Set<string>>} adjacencyList - node -> Set of outgoing neighbor nodes
 * @returns {Array<{ cycleNodes: string[], cyclePath: string }>} list of detected cycles
 */
export function detectCycles(adjacencyList) {
  const VISITED_WHITE = 0; // Unvisited
  const VISITING_GRAY = 1; // Currently in DFS stack
  const VISITED_BLACK = 2; // Finished

  const colors = new Map();
  const parentMap = new Map();
  const detectedCycles = [];
  const recordedCycleSignatures = new Set();

  for (const node of adjacencyList.keys()) {
    colors.set(node, VISITED_WHITE);
  }

  function dfs(current, path) {
    colors.set(current, VISITING_GRAY);
    path.push(current);

    const neighbors = adjacencyList.get(current) || new Set();

    for (const neighbor of neighbors) {
      const neighborColor = colors.get(neighbor) ?? VISITED_WHITE;

      if (neighborColor === VISITING_GRAY) {
        // Back edge found! A cycle exists!
        const cycleStartIndex = path.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cycleSlice = path.slice(cycleStartIndex);
          // Normalize cycle to avoid duplicate alerts (e.g., A-B-A vs B-A-B)
          const sortedSignature = [...cycleSlice].sort().join('|');
          if (!recordedCycleSignatures.has(sortedSignature)) {
            recordedCycleSignatures.add(sortedSignature);
            const cycleWithClosing = [...cycleSlice, neighbor];
            detectedCycles.push({
              cycleNodes: cycleSlice,
              cyclePath: cycleWithClosing.join(' -> ')
            });
          }
        }
      } else if (neighborColor === VISITED_WHITE) {
        parentMap.set(neighbor, current);
        dfs(neighbor, path);
      }
    }

    colors.set(current, VISITED_BLACK);
    path.pop();
  }

  for (const node of adjacencyList.keys()) {
    if ((colors.get(node) ?? VISITED_WHITE) === VISITED_WHITE) {
      dfs(node, []);
    }
  }

  return detectedCycles;
}

/**
 * Finds all downstream dependent cells for a given root node using Breadth-First Search (BFS).
 * Downstream cells are all cells whose values change when the root cell changes.
 * 
 * @param {string} rootNode - e.g. "Sheet1!B2"
 * @param {Map<string, Set<string>>} adjacencyList - U -> set of V (V depends on U)
 * @returns {{ dependentCount: number, dependentNodes: string[], levels: Record<number, string[]> }}
 */
export function findDownstreamDependents(rootNode, adjacencyList) {
  const visited = new Set();
  const queue = [{ node: rootNode, depth: 0 }];
  const dependentNodes = [];
  const levels = {};

  visited.add(rootNode);

  while (queue.length > 0) {
    const { node, depth } = queue.shift();

    if (node !== rootNode) {
      dependentNodes.push(node);
      if (!levels[depth]) {
        levels[depth] = [];
      }
      levels[depth].push(node);
    }

    const downstreamNeighbors = adjacencyList.get(node) || new Set();
    for (const downstream of downstreamNeighbors) {
      if (!visited.has(downstream)) {
        visited.add(downstream);
        queue.push({ node: downstream, depth: depth + 1 });
      }
    }
  }

  return {
    dependentCount: dependentNodes.length,
    dependentNodes,
    levels
  };
}

/**
 * Finds all upstream dependency cells that the given formula cell directly or indirectly relies upon.
 * 
 * @param {string} targetNode - e.g. "Summary!B4"
 * @param {Map<string, Set<string>>} reverseAdjacencyList - V -> set of U (V depends on U)
 * @returns {string[]} upstream nodes
 */
export function findUpstreamDependencies(targetNode, reverseAdjacencyList) {
  const visited = new Set();
  const queue = [targetNode];
  const upstreamNodes = [];

  visited.add(targetNode);

  while (queue.length > 0) {
    const current = queue.shift();

    if (current !== targetNode) {
      upstreamNodes.push(current);
    }

    const upstreamNeighbors = reverseAdjacencyList.get(current) || new Set();
    for (const upstream of upstreamNeighbors) {
      if (!visited.has(upstream)) {
        visited.add(upstream);
        queue.push(upstream);
      }
    }
  }

  return upstreamNodes;
}
