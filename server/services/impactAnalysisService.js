import { extractCellReferences } from '../utils/formulaTokenizer.js';
import {
  findStronglyConnectedComponents,
  findShortestPath,
  analyzeImpactPaths
} from '../utils/impactPathAlgorithms.js';

/**
 * Impact Analysis Service
 * 
 * Deep graph intelligence computing direct/indirect dependencies,
 * shortest impact paths, dependency depth, bottleneck cells, and Tarjan's SCC cycles.
 */

/**
 * Builds the forward and reverse adjacency maps from parsed workbook sheets.
 * 
 * @param {object} parsedWorkbook
 * @returns {{
 *   forwardAdjacency: Map<string, Set<string>>,
 *   reverseAdjacency: Map<string, Set<string>>,
 *   allNodes: Set<string>
 * }}
 */
export function buildAdjacencyMaps(parsedWorkbook) {
  const forwardAdjacency = new Map();
  const reverseAdjacency = new Map();
  const allNodes = new Set();

  function ensureNode(id) {
    allNodes.add(id);
    if (!forwardAdjacency.has(id)) forwardAdjacency.set(id, new Set());
    if (!reverseAdjacency.has(id)) reverseAdjacency.set(id, new Set());
  }

  const sheets = parsedWorkbook.sheets || {};
  for (const [sheetName, sheetData] of Object.entries(sheets)) {
    const cells = sheetData.cells || {};
    for (const [cellCoord, cellData] of Object.entries(cells)) {
      const targetRef = `${sheetName}!${cellCoord}`;
      ensureNode(targetRef);

      if (cellData.formula) {
        const sourceRefs = extractCellReferences(cellData.formula, sheetName);
        for (const src of sourceRefs) {
          const sourceRef = `${src.sheet}!${src.cell}`;
          ensureNode(sourceRef);
          forwardAdjacency.get(sourceRef).add(targetRef);
          reverseAdjacency.get(targetRef).add(sourceRef);
        }
      }
    }
  }

  return { forwardAdjacency, reverseAdjacency, allNodes };
}

/**
 * Performs deep impact path and topological analysis for a parsed workbook and its changes.
 * 
 * @param {object} parsedWorkbook - new parsed workbook
 * @param {Array<object>} changes - cell changes from comparison
 * @returns {object} structured impact path analysis
 */
export function computeImpactAnalysis(parsedWorkbook, changes = []) {
  const { forwardAdjacency, allNodes } = buildAdjacencyMaps(parsedWorkbook);

  // 1. Tarjan's Strongly Connected Components (SCC)
  const allSCCs = findStronglyConnectedComponents(forwardAdjacency);
  const cyclicComponents = allSCCs.filter((c) => c.isCycle).map((c) => ({
    size: c.componentNodes.length,
    nodes: c.componentNodes,
    pathSummary: c.componentNodes.join(' ⇄ ')
  }));

  // 2. Identify all changed cells
  const changedRefs = changes.map((c) => c.fullRef || `${c.sheet}!${c.cell}`);
  const perCellImpact = {};

  let globalMaxDepth = 0;
  let highestImpactCell = null;
  let maxAffectedCount = -1;

  for (const rootRef of changedRefs) {
    if (allNodes.has(rootRef)) {
      const impact = analyzeImpactPaths(rootRef, forwardAdjacency);
      perCellImpact[rootRef] = impact;

      if (impact.maxDepth > globalMaxDepth) {
        globalMaxDepth = impact.maxDepth;
      }
      if (impact.totalAffected > maxAffectedCount) {
        maxAffectedCount = impact.totalAffected;
        highestImpactCell = rootRef;
      }
    }
  }

  return {
    totalGraphNodes: allNodes.size,
    cyclicComponentsCount: cyclicComponents.length,
    cyclicComponents,
    globalMaxDepth,
    highestImpactCell,
    maxAffectedCount: Math.max(0, maxAffectedCount),
    perCellImpact,
    /**
     * Helper to find shortest path between any source and target cell
     */
    getPath: (source, target) => findShortestPath(source, target, forwardAdjacency)
  };
}
