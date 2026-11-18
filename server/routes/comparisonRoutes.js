import { Router } from 'express';
import multer from 'multer';
import {
  handleCompareUploads,
  handleCompareSamples,
  handleSimulateScenario,
  handleValidateDataQuality,
  handleListSnapshots,
  handleCreateSnapshot,
  handleDeleteSnapshot,
  handleCompareSnapshots,
  handleUpdateRiskDecision,
  handleExportCSV,
  handleExportJSON
} from '../controllers/comparisonController.js';

const router = Router();

// Configure Multer with memory storage and 15MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB max per file
  }
});

// 1. Upload and compare two spreadsheets
router.post(
  '/compare',
  upload.fields([
    { name: 'original', maxCount: 1 },
    { name: 'modified', maxCount: 1 }
  ]),
  handleCompareUploads
);

// 2. Compare pre-bundled sample workbooks
router.post('/compare-samples', handleCompareSamples);

// 3. What-If Scenario Simulator
router.post('/scenario/simulate', handleSimulateScenario);

// 4. Data Quality Validation
router.post('/data-quality/validate', handleValidateDataQuality);

// 5. Multi-Version Snapshot History
router.get('/history', handleListSnapshots);
router.post('/history/snapshot', handleCreateSnapshot);
router.delete('/history/snapshot/:id', handleDeleteSnapshot);
router.post('/history/compare', handleCompareSnapshots);

// 6. Risk Governance Workflow Decision
router.post('/risk/decision', handleUpdateRiskDecision);

// 7. Audit Exports
router.post('/export/csv', handleExportCSV);
router.post('/export/json', handleExportJSON);

export default router;
