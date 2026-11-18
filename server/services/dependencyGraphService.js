import { extractCellReferences } from '../utils/formulaTokenizer.js';
import { detectCycles, findDownstreamDependents } from '../utils/graphAlgorithms.js';

/**
 * Dependency Graph Service
 * 
 * Constructs a directed dependency graph of workbook formulas:
 * - Nodes: Spreadsheet cells (formula cells and their referenced source cells).
 * - Directed Edges: If cell V has a formula referencing cell U, edge is U -> V.
 *   (Meaning: data flows from U into V, so changing U affects V).
 * - Detects circular dependency cycles.
 * - Calculates downstream blast radius / affected chains for changed cells.
 * - Formats data cleanly for Cytoscape.js visualization.
 */

/**
 * Builds the complete dependency graph from a parsed workbook.
 * 
 * @param {object} parsedWorkbook - parsed new workbook
 * @param {Array<object>} changes - cell changes from comparison (optional)
 * @returns {object} Cytoscape-compatible graph, cycle list, and impact metrics
 */
export function buildDependencyGraph(parsedWorkbook, changes = []) {
  // Map of changed cell references for rapid lookup
  const changedCellMap = new Map();
  for (const ch of changes) {
    changedCellMap.set(ch.fullRef, ch);
  }

  // forwardAdjacency: U -> Set of V (data flows from U to V)
  const forwardAdjacency = new Map();
  // reverseAdjacency: V -> Set of U (V depends on U)
  const reverseAdjacency = new Map();

  // Track all unique cell nodes: fullRef -> metadata
  const nodeRegistry = new Map();

  function ensureNode(sheet, cell, extra = {}) {
    const fullRef = `${sheet}!${cell}`;
    if (!nodeRegistry.has(fullRef)) {
      nodeRegistry.set(fullRef, {
        id: fullRef,
        sheet,
        cell,
        fullRef,
        value: extra.value ?? null,
        formattedText: extra.formattedText ?? '',
        formula: extra.formula ?? null,
        isFormula: !!extra.formula,
        isChanged: changedCellMap.has(fullRef),
        changeType: changedCellMap.get(fullRef)?.changeType || null,
        downstreamCount: 0,
        inCycle: false
      });
    } else {
      const existing = nodeRegistry.get(fullRef);
      if (extra.formula && !existing.formula) {
        existing.formula = extra.formula;
        existing.isFormula = true;
      }
      if (extra.value !== undefined && existing.value === null) {
        existing.value = extra.value;
        existing.formattedText = extra.formattedText || '';
      }
    }

    if (!forwardAdjacency.has(fullRef)) {
      forwardAdjacency.set(fullRef, new Set());
    }
    if (!reverseAdjacency.has(fullRef)) {
      reverseAdjacency.set(fullRef, new Set());
    }

    return fullRef;
  }

  // 1. Scan all sheets and cells in parsedWorkbook
  const sheets = parsedWorkbook.sheets || {};
  for (const [sheetName, sheetData] of Object.entries(sheets)) {
    const cells = sheetData.cells || {};

    for (const [cellCoord, cellData] of Object.entries(cells)) {
      // If cell has a formula or has changed, register it
      const hasFormula = !!cellData.formula;
      const isChanged = changedCellMap.has(`${sheetName}!${cellCoord}`);

      if (hasFormula || isChanged) {
        ensureNode(sheetName, cellCoord, {
          value: cellData.value,
          formattedText: cellData.formattedText,
          formula: cellData.formula
        });
      }

      // If formula exists, extract references and build edges
      if (hasFormula) {
        const targetRef = `${sheetName}!${cellCoord}`;
        const sourceRefs = extractCellReferences(cellData.formula, sheetName);

        for (const src of sourceRefs) {
          const sourceRef = ensureNode(src.sheet, src.cell);

          // Edge: sourceRef -> targetRef (source feeds into target)
          forwardAdjacency.get(sourceRef).add(targetRef);
          reverseAdjacency.get(targetRef).add(sourceRef);
        }
      }
    }
  }

  // 2. Detect circular dependencies
  const detectedCycles = detectCycles(forwardAdjacency);
  const cycleNodesSet = new Set();
  for (const cycle of detectedCycles) {
    for (const n of cycle.cycleNodes) {
      cycleNodesSet.add(n);
    }
  }

  // 3. Calculate downstream impact for each node
  const downstreamImpacts = {};
  for (const [nodeId, nodeData] of nodeRegistry.entries()) {
    const impact = findDownstreamDependents(nodeId, forwardAdjacency);
    nodeData.downstreamCount = impact.dependentCount;
    nodeData.inCycle = cycleNodesSet.has(nodeId);

    if (nodeData.isChanged || impact.dependentCount > 0) {
      downstreamImpacts[nodeId] = {
        dependentCount: impact.dependentCount,
        dependentNodes: impact.dependentNodes,
        levels: impact.levels
      };
    }
  }

  // 4. Construct Cytoscape elements
  const cytoscapeNodes = [];
  for (const nodeData of nodeRegistry.values()) {
    cytoscapeNodes.push({
      data: {
        id: nodeData.id,
        label: `${nodeData.sheet}!\n${nodeData.cell}`,
        sheet: nodeData.sheet,
        cell: nodeData.cell,
        value: nodeData.value,
        formattedText: nodeData.formattedText,
        formula: nodeData.formula,
        isFormula: nodeData.isFormula,
        isChanged: nodeData.isChanged,
        changeType: nodeData.changeType,
        inCycle: nodeData.inCycle,
        downstreamCount: nodeData.downstreamCount
      }
    });
  }

  const cytoscapeEdges = [];
  const edgeSet = new Set();

  for (const [source, targets] of forwardAdjacency.entries()) {
    for (const target of targets) {
      const edgeId = `e_${source.replace(/[^a-zA-Z0-9]/g, '_')}_to_${target.replace(/[^a-zA-Z0-9]/g, '_')}`;
      if (!edgeSet.has(edgeId)) {
        edgeSet.add(edgeId);
        const isInCycle = cycleNodesSet.has(source) && cycleNodesSet.has(target);
        cytoscapeEdges.push({
          data: {
            id: edgeId,
            source,
            target,
            inCycle: isInCycle
          }
        });
      }
    }
  }

  // Generate plain-language graph summary
  let explanation = '';
  if (detectedCycles.length > 0) {
    explanation += `Warning: Detected ${detectedCycles.length} circular dependency cycle(s). Circular references cause recalculation deadlocks in Excel. `;
  }
  if (cytoscapeNodes.length === 0) {
    explanation += 'No formula calculations or dependencies were detected in this workbook.';
  } else {
    explanation += `Mapped ${cytoscapeNodes.length} cell nodes across ${cytoscapeEdges.length} calculation dependencies.`;
  }

  return {
    nodes: cytoscapeNodes,
    edges: cytoscapeEdges,
    totalNodes: cytoscapeNodes.length,
    totalEdges: cytoscapeEdges.length,
    cycles: detectedCycles,
    downstreamImpacts,
    explanation
  };
}
