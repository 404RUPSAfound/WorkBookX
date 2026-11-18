import { evaluateFormulaSafely } from '../utils/safeFormulaEvaluator.js';
import { buildAdjacencyMaps } from './impactAnalysisService.js';
import { findDownstreamDependents } from '../utils/graphAlgorithms.js';

/**
 * What-If Scenario Simulation Service
 * 
 * Simulates user-specified cell overrides and recalculates downstream formulas
 * using a safe, zero-eval arithmetic formula evaluator.
 */

/**
 * Runs a What-If scenario simulation against a parsed workbook.
 * 
 * @param {object} parsedWorkbook
 * @param {object} options
 * @param {string} options.scenarioName - e.g. "Q4 Price Spike"
 * @param {Array<{ sheet: string, cell: string, simulatedValue: number }>} options.overrides
 * @returns {object} scenario results including original vs simulated comparison
 */
export function runScenarioSimulation(parsedWorkbook, {
  scenarioName = 'Simulation Scenario',
  overrides = []
} = {}) {
  // 1. Snapshot all cell values from workbook
  const cellValues = {};
  const formulaRegistry = {};

  const sheets = parsedWorkbook.sheets || {};
  for (const [sheetName, sheetData] of Object.entries(sheets)) {
    const cells = sheetData.cells || {};
    for (const [cellCoord, cellData] of Object.entries(cells)) {
      const fullRef = `${sheetName}!${cellCoord}`;
      cellValues[fullRef] = cellData.value !== undefined ? cellData.value : null;
      if (cellData.formula) {
        formulaRegistry[fullRef] = {
          formula: cellData.formula,
          sheet: sheetName,
          cell: cellCoord
        };
      }
    }
  }

  // 2. Build graph adjacency to find downstream order
  const { forwardAdjacency } = buildAdjacencyMaps(parsedWorkbook);

  // 3. Apply user input overrides
  const appliedOverrides = [];
  const affectedDownstreamQueue = [];
  const visitedRecalc = new Set();

  for (const override of overrides) {
    const fullRef = `${override.sheet}!${override.cell}`;
    const origVal = cellValues[fullRef];
    const simVal = Number(override.simulatedValue);

    cellValues[fullRef] = simVal;
    appliedOverrides.push({
      sheet: override.sheet,
      cell: override.cell,
      fullRef,
      originalValue: origVal,
      simulatedValue: simVal,
      difference: origVal !== null && !isNaN(Number(origVal)) ? simVal - Number(origVal) : null
    });

    // Find downstream dependents of this overridden cell
    const impact = findDownstreamDependents(fullRef, forwardAdjacency);
    for (const dep of impact.dependentNodes) {
      if (!visitedRecalc.has(dep)) {
        visitedRecalc.add(dep);
        affectedDownstreamQueue.push(dep);
      }
    }
  }

  // 4. Recalculate downstream cells in forward topological order
  const recalculatedCells = [];
  const unsupportedFormulas = [];
  let successRecalcCount = 0;

  for (const depRef of affectedDownstreamQueue) {
    const formulaInfo = formulaRegistry[depRef];
    if (formulaInfo) {
      const origVal = parsedWorkbook.sheets[formulaInfo.sheet]?.cells[formulaInfo.cell]?.value ?? null;
      const evalResult = evaluateFormulaSafely(formulaInfo.formula, cellValues, formulaInfo.sheet);

      if (evalResult.success) {
        // Update simulated value in lookup map so subsequent formulas consume it!
        cellValues[depRef] = evalResult.value;
        successRecalcCount++;

        recalculatedCells.push({
          fullRef: depRef,
          sheet: formulaInfo.sheet,
          cell: formulaInfo.cell,
          formula: formulaInfo.formula,
          originalValue: origVal,
          simulatedValue: evalResult.value,
          variance: origVal !== null && !isNaN(Number(origVal)) ? Number((evalResult.value - Number(origVal)).toFixed(6)) : null,
          status: 'RECALCULATED'
        });
      } else {
        const failureRecord = {
          fullRef: depRef,
          sheet: formulaInfo.sheet,
          cell: formulaInfo.cell,
          formula: formulaInfo.formula,
          originalValue: origVal,
          simulatedValue: null,
          error: evalResult.error,
          unsupported: !!evalResult.unsupported,
          status: evalResult.unsupported ? 'UNSUPPORTED_SYNTAX' : 'CALCULATION_ERROR'
        };
        recalculatedCells.push(failureRecord);
        unsupportedFormulas.push(failureRecord);
      }
    }
  }

  return {
    scenarioId: `scen-${Date.now()}`,
    scenarioName,
    simulatedAt: new Date().toISOString(),
    overridesCount: appliedOverrides.length,
    overrides: appliedOverrides,
    recalculatedCount: successRecalcCount,
    unsupportedCount: unsupportedFormulas.length,
    recalculatedCells,
    unsupportedFormulas,
    summary: {
      totalImpactedCells: recalculatedCells.length,
      successRatePercent: recalculatedCells.length > 0 ? Math.round((successRecalcCount / recalculatedCells.length) * 100) : 100,
      note: 'Recalculation engine strictly supports arithmetic grammar (+, -, *, /, ^, parens, cell refs, SUM, AVERAGE) with zero eval().'
    }
  };
}
