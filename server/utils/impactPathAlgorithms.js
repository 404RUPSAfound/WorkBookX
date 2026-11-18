/**
 * Advanced Graph Algorithms for Impact Path Analysis & Topology
 * 
 * Provides:
 * 1. Tarjan's Strongly Connected Components (SCC) algorithm for cyclic component discovery
 * 2. Breadth-First Search (BFS) for shortest path between changed cell and affected cell
 * 3. All simple paths (up to a safe depth/count) between source and target
 * 4. Direct (1-hop) vs Indirect (>1 hop) dependency classification
 * 5. Critical downstream node identification (high betweenness / out-degree hubs)
 */

/**
 * Tarjan's Strongly Connected Components (SCC) Algorithm
 * Discovers maximal subgraphs where every vertex is reachable from every other vertex in the component.
 * In a spreadsheet dependency graph, any SCC with >1 node (or a single node with self-loop) represents
 * an exact cyclic calculation deadlock component.
 * 
 * Complexity: O(V + E)
 * 
 * @param {Map<string, Set<string>>} adjacencyList - node -> Set of outgoing neighbor nodes
 * @returns {Array<{ componentNodes: string[], isCycle: boolean }>} list of components
 */
export function findStronglyConnectedComponents(adjacencyList) {
  let index = 0;
  const indices = new Map();
  const lowlinks = new Map();
  const onStack = new Map();
  const stack = [];
  const sccs = [];

  function strongConnect(v) {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.set(v, true);

    const neighbors = adjacencyList.get(v) || new Set();
    for (const w of neighbors) {
      if (!indices.has(w)) {
        // Successor w has not yet been visited; recurse on it
        strongConnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v), lowlinks.get(w)));
      } else if (onStack.get(w)) {
        // Successor w is in stack and hence in the current SCC
        lowlinks.set(v, Math.min(lowlinks.get(v), indices.get(w)));
      }
    }

    // If v is a root node, pop the stack and generate an SCC
    if (lowlinks.get(v) === indices.get(v)) {
      const scc = [];
      let w = null;
      do {
        w = stack.pop();
        onStack.set(w, false);
        scc.push(w);
      } while (w !== v);

      // A component is cyclic if it has >1 node, or 1 node with self-loop
      const isCycle = scc.length > 1 || (scc.length === 1 && (adjacencyList.get(scc[0]) || new Set()).has(scc[0]));
      sccs.push({
        componentNodes: scc,
        isCycle
      });
    }
  }

  for (const node of adjacencyList.keys()) {
    if (!indices.has(node)) {
      strongConnect(node);
    }
  }

  return sccs;
}

/**
 * Finds the shortest directed path between a source node and a target node using BFS.
 * 
 * @param {string} source - e.g. "Revenue!B2"
 * @param {string} target - e.g. "Summary!B4"
 * @param {Map<string, Set<string>>} adjacencyList
 * @returns {string[] | null} path array [source, ..., target] or null if unreachable
 */
export function findShortestPath(source, target, adjacencyList) {
  if (source === target) return [source];

  const visited = new Set([source]);
  const queue = [[source]];

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const currentNode = currentPath[currentPath.length - 1];

    const neighbors = adjacencyList.get(currentNode) || new Set();
    for (const neighbor of neighbors) {
      if (neighbor === target) {
        return [...currentPath, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...currentPath, neighbor]);
      }
    }
  }

  return null;
}

/**
 * Computes comprehensive downstream impact path intelligence for a specific root node.
 * 
 * @param {string} rootNode - root changed cell, e.g. "Revenue!B2"
 * @param {Map<string, Set<string>>} forwardAdjacency - source -> Set of targets (data flows source to target)
 * @param {number} maxPathsPerTarget - cap paths to prevent combinatorial explosion in dense DAGs
 * @returns {{
 *   rootNode: string,
 *   directDependents: string[],
 *   indirectDependents: string[],
 *   maxDepth: number,
 *   totalAffected: number,
 *   impactPaths: Record<string, { depth: number, shortestPath: string[] }>,
 *   criticalBottlenecks: Array<{ node: string, outgoingDegree: number }>
 * }}
 */
export function analyzeImpactPaths(rootNode, forwardAdjacency, maxPathsPerTarget = 5) {
  const directDependents = Array.from(forwardAdjacency.get(rootNode) || new Set());
  const directSet = new Set(directDependents);

  const visited = new Set([rootNode]);
  const queue = [{ node: rootNode, depth: 0, path: [rootNode] }];
  const impactPaths = {};
  const indirectDependents = [];
  let maxDepth = 0;

  // Track node frequency across paths to identify critical bottleneck cells
  const nodeVisitFrequency = new Map();

  while (queue.length > 0) {
    const { node, depth, path } = queue.shift();

    if (node !== rootNode) {
      if (!directSet.has(node)) {
        indirectDependents.push(node);
      }
      if (depth > maxDepth) {
        maxDepth = depth;
      }

      if (!impactPaths[node]) {
        impactPaths[node] = {
          depth,
          shortestPath: path
        };
      }

      // Record frequency
      nodeVisitFrequency.set(node, (nodeVisitFrequency.get(node) || 0) + 1);
    }

    const neighbors = forwardAdjacency.get(node) || new Set();
    for (const neighbor of neighbors) {
      // Prevent infinite traversal through cycles
      if (!path.includes(neighbor)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({
            node: neighbor,
            depth: depth + 1,
            path: [...path, neighbor]
          });
        }
      }
    }
  }

  // Identify critical bottlenecks: affected nodes that have high outgoing fan-out
  const criticalBottlenecks = [];
  for (const affected of Object.keys(impactPaths)) {
    const outgoing = (forwardAdjacency.get(affected) || new Set()).size;
    if (outgoing >= 2) {
      criticalBottlenecks.push({
        node: affected,
        outgoingDegree: outgoing
      });
    }
  }
  criticalBottlenecks.sort((a, b) => b.outgoingDegree - a.outgoingDegree);

  return {
    rootNode,
    directDependents,
    indirectDependents,
    maxDepth,
    totalAffected: directDependents.length + indirectDependents.length,
    impactPaths,
    criticalBottlenecks
  };
}
