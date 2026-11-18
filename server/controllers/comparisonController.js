import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateUploadedFile } from '../utils/fileValidation.js';
import { parseWorkbook } from '../services/excelParserService.js';
import { compareWorkbooks } from '../services/workbookComparisonService.js';
import { analyzeAllFormulaChanges } from '../services/formulaIntelligenceService.js';
import { buildDependencyGraph } from '../services/dependencyGraphService.js';
import { evaluateRisks } from '../services/riskEngineService.js';
import { generateAuditReport, generateAuditCSV } from '../services/auditReportService.js';

// Newly added modular services
import { computeImpactAnalysis } from '../services/impactAnalysisService.js';
import { runScenarioSimulation } from '../services/scenarioSimulationService.js';
import { detectFormulaAnomalies } from '../services/formulaAnomalyService.js';
import { evaluateDataQuality } from '../services/dataQualityService.js';
import {
  listSnapshots,
  createSnapshot,
  getSnapshot,
  deleteSnapshot,
  compareSnapshots
} from '../services/versionHistoryService.js';
import {
  getAllRiskDecisions,
  updateRiskDecision,
  calculateCompositeRiskIndex
} from '../services/riskGovernanceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLES_DIR = path.resolve(__dirname, '../../sample-data');

// Cache last parsed modified workbook in-memory for What-If scenario simulations
let lastParsedActiveWorkbook = null;

/**
 * Executes the full end-to-end comparison & advanced intelligence workflow
 */
function runFullAnalysis(oldParsed, newParsed, customDQRules = []) {
  lastParsedActiveWorkbook = newParsed;

  // 1. Compare cell by cell and sheet by sheet
  const comparison = compareWorkbooks(oldParsed, newParsed);

  // 2. Perform formula intelligence on all formula modifications
  const formulaAnalyses = analyzeAllFormulaChanges(comparison.changes);

  // 3. Build directed dependency graph
  const graphData = buildDependencyGraph(newParsed, comparison.changes);

  // 4. Advanced Impact Path Analysis (Direct vs Indirect, BFS shortest paths, Tarjan SCC)
  const impactAnalysis = computeImpactAnalysis(newParsed, comparison.changes);

  // 5. Formula Anomaly Detection (Column-wise pattern outliers, missing formulas in sequence)
  const formulaAnomalies = detectFormulaAnomalies(newParsed);

  // 6. Data Quality Intelligence (Non-negative, required, duplicates, ranges)
  const dataQuality = evaluateDataQuality(newParsed, customDQRules);

  // 7. Deterministic Risk Engine
  const risks = evaluateRisks({
    changes: comparison.changes,
    formulaAnalyses,
    graphData,
    sheetSummary: comparison.summary.sheetSummary
  });

  // 8. Governance decisions map
  const governanceDecisions = getAllRiskDecisions();

  // 9. Composite Risk Score (0 - 100)
  const riskIndex = calculateCompositeRiskIndex(risks, impactAnalysis);

  // 10. Generate comprehensive audit report structure
  const auditReport = generateAuditReport({
    originalFileName: oldParsed.fileName,
    modifiedFileName: newParsed.fileName,
    summary: comparison.summary,
    changes: comparison.changes,
    formulaAnalyses,
    graphData,
    risks,
    impactAnalysis,
    formulaAnomalies,
    dataQuality,
    riskIndex,
    governanceDecisions
  });

  return {
    meta: {
      originalFileName: oldParsed.fileName,
      modifiedFileName: newParsed.fileName,
      analyzedAt: auditReport.meta.generatedAt,
      originalSheets: oldParsed.sheetNames,
      modifiedSheets: newParsed.sheetNames,
      originalCellCount: oldParsed.totalCells,
      modifiedCellCount: newParsed.totalCells
    },
    summary: comparison.summary,
    changes: comparison.changes,
    formulaAnalyses,
    graphData,
    impactAnalysis,
    formulaAnomalies,
    dataQuality,
    risks,
    riskIndex,
    governanceDecisions,
    auditReport
  };
}

/**
 * POST /api/compare
 * Receives two uploaded workbooks (original and modified)
 */
export async function handleCompareUploads(req, res) {
  try {
    const files = req.files || {};
    const originalFile = files.original?.[0];
    const modifiedFile = files.modified?.[0];

    // 1. Validate files
    const valOrig = validateUploadedFile(originalFile, 'Original Workbook');
    if (!valOrig.valid) {
      return res.status(400).json({ success: false, error: valOrig.error });
    }

    const valMod = validateUploadedFile(modifiedFile, 'Modified Workbook');
    if (!valMod.valid) {
      return res.status(400).json({ success: false, error: valMod.error });
    }

    // 2. Parse both spreadsheets safely using SheetJS
    const oldParsed = parseWorkbook(originalFile.buffer, originalFile.originalname);
    const newParsed = parseWorkbook(modifiedFile.buffer, modifiedFile.originalname);

    // 3. Run analysis
    const result = runFullAnalysis(oldParsed, newParsed);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error during workbook comparison:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while analyzing the spreadsheets. Please verify that the files are valid Excel or CSV files.'
    });
  }
}

/**
 * POST /api/compare-samples
 * Runs comparison on bundled sample workbooks
 */
export async function handleCompareSamples(req, res) {
  try {
    const { sampleKey } = req.body || {};
    let oldFile = 'Q3_Financial_Model_v1.xlsx';
    let newFile = 'Q3_Financial_Model_v2.xlsx';

    if (sampleKey === 'inventory') {
      oldFile = 'Inventory_Forecast_Old.xlsx';
      newFile = 'Inventory_Forecast_New.xlsx';
    } else if (sampleKey === 'csv') {
      oldFile = 'Simple_Budget_A.csv';
      newFile = 'Simple_Budget_B.csv';
    }

    const oldPath = path.join(SAMPLES_DIR, oldFile);
    const newPath = path.join(SAMPLES_DIR, newFile);

    if (!fs.existsSync(oldPath) || !fs.existsSync(newPath)) {
      return res.status(404).json({
        success: false,
        error: `Sample files not found on server (${oldFile}, ${newFile}).`
      });
    }

    const oldBuffer = fs.readFileSync(oldPath);
    const newBuffer = fs.readFileSync(newPath);

    const oldParsed = parseWorkbook(oldBuffer, oldFile);
    const newParsed = parseWorkbook(newBuffer, newFile);

    const result = runFullAnalysis(oldParsed, newParsed);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error comparing sample files:', err.message);
    return res.status(500).json({
      success: false,
      error: `Failed to load and compare sample files: ${err.message}`
    });
  }
}

/**
 * POST /api/scenario/simulate
 * Simulates What-If input adjustments on the active workbook
 */
export async function handleSimulateScenario(req, res) {
  try {
    const { scenarioName, overrides = [], sampleKey } = req.body || {};

    let targetWb = lastParsedActiveWorkbook;

    // If no active workbook in memory, load default sample
    if (!targetWb) {
      let sampleFile = 'Q3_Financial_Model_v2.xlsx';
      if (sampleKey === 'inventory') sampleFile = 'Inventory_Forecast_New.xlsx';
      const samplePath = path.join(SAMPLES_DIR, sampleFile);
      if (fs.existsSync(samplePath)) {
        targetWb = parseWorkbook(fs.readFileSync(samplePath), sampleFile);
        lastParsedActiveWorkbook = targetWb;
      }
    }

    if (!targetWb) {
      return res.status(400).json({
        success: false,
        error: 'No active workbook available for What-If simulation. Please run a comparison first.'
      });
    }

    const simulationResult = runScenarioSimulation(targetWb, {
      scenarioName: scenarioName || 'What-If Simulation',
      overrides
    });

    return res.status(200).json({
      success: true,
      data: simulationResult
    });
  } catch (err) {
    console.error('Scenario Simulation Error:', err.message);
    return res.status(500).json({ success: false, error: `Simulation failed: ${err.message}` });
  }
}

/**
 * POST /api/data-quality/validate
 * Evaluates custom data quality validation rules
 */
export async function handleValidateDataQuality(req, res) {
  try {
    const { rules = [] } = req.body || {};
    let targetWb = lastParsedActiveWorkbook;

    if (!targetWb) {
      const samplePath = path.join(SAMPLES_DIR, 'Q3_Financial_Model_v2.xlsx');
      if (fs.existsSync(samplePath)) {
        targetWb = parseWorkbook(fs.readFileSync(samplePath), 'Q3_Financial_Model_v2.xlsx');
        lastParsedActiveWorkbook = targetWb;
      }
    }

    if (!targetWb) {
      return res.status(400).json({ success: false, error: 'No active workbook available for data quality audit.' });
    }

    const result = evaluateDataQuality(targetWb, rules);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Data Quality Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/history
 * Lists all saved version snapshots
 */
export async function handleListSnapshots(req, res) {
  try {
    const snapshots = listSnapshots();
    return res.status(200).json({ success: true, data: snapshots });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/history/snapshot
 * Creates a new named snapshot of the current comparison
 */
export async function handleCreateSnapshot(req, res) {
  try {
    const { name, analysisData } = req.body || {};
    if (!analysisData) {
      return res.status(400).json({ success: false, error: 'Analysis data is required to create a snapshot.' });
    }

    const snapshot = createSnapshot({ name, analysisData });
    return res.status(201).json({ success: true, data: snapshot });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * DELETE /api/history/snapshot/:id
 * Deletes a snapshot
 */
export async function handleDeleteSnapshot(req, res) {
  try {
    const { id } = req.params;
    const result = deleteSnapshot(id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/history/compare
 * Compares two snapshots
 */
export async function handleCompareSnapshots(req, res) {
  try {
    const { idA, idB } = req.body || {};
    if (!idA || !idB) {
      return res.status(400).json({ success: false, error: 'Both idA and idB are required to compare snapshots.' });
    }
    const comparison = compareSnapshots(idA, idB);
    return res.status(200).json({ success: true, data: comparison });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/risk/decision
 * Updates governance status for a specific risk finding
 */
export async function handleUpdateRiskDecision(req, res) {
  try {
    const { riskId, status, reviewer, comment, reason } = req.body || {};
    if (!riskId) {
      return res.status(400).json({ success: false, error: 'riskId is required.' });
    }
    const updated = updateRiskDecision(riskId, { status, reviewer, comment, reason });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/export/csv
 * Exports comparison findings as a downloadable CSV
 */
export async function handleExportCSV(req, res) {
  try {
    const { changes = [], risks = [], extra = {} } = req.body || {};
    const csvContent = generateAuditCSV(changes, risks, extra);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="workbookx-audit-report.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('CSV Export Error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to generate CSV export.' });
  }
}

/**
 * POST /api/export/json
 * Returns audit report formatted for download
 */
export async function handleExportJSON(req, res) {
  try {
    const { report } = req.body || {};
    if (!report) {
      return res.status(400).json({ success: false, error: 'Report data is required.' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="workbookx-audit-report.json"');
    return res.status(200).send(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error('JSON Export Error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to generate JSON export.' });
  }
}
