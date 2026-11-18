import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleCompareSamples,
  handleExportCSV,
  handleExportJSON,
  handleCompareUploads
} from '../controllers/comparisonController.js';

function createMockReqRes({ body = {}, files = {} } = {}) {
  const req = { body, files };
  const res = {
    statusCode: 200,
    headers: {},
    sentData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.sentData = data;
      return this;
    },
    send(data) {
      this.sentData = data;
      return this;
    },
    setHeader(key, val) {
      this.headers[key.toLowerCase()] = val;
    }
  };
  return { req, res };
}

test('Controller - compare-samples runs full comparison on Q3 financial models', async () => {
  const { req, res } = createMockReqRes({ body: { sampleKey: 'financial' } });
  await handleCompareSamples(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.sentData.success, true);

  const data = res.sentData.data;
  assert.ok(data.summary.totalChanges > 0);
  assert.ok(data.risks.length > 0);

  // Check that critical risk was detected
  const hasCritical = data.risks.some(r => r.severity === 'CRITICAL');
  assert.equal(hasCritical, true);

  // Check formula changes detected
  assert.ok(data.formulaAnalyses.length > 0);

  // Check that audit report was compiled
  assert.ok(data.auditReport.meta.platform.includes('WorkbookX'));
});

test('Controller - export/csv exports CSV table with risk and change headers', async () => {
  const { req, res } = createMockReqRes({
    body: {
      changes: [{ id: 'diff-1', sheet: 'Revenue', cell: 'B2', changeType: 'MODIFIED_VALUE', oldValue: 10, newValue: 20 }],
      risks: [{ id: 'risk-1', severity: 'HIGH', sheet: 'Revenue', cell: 'B2', ruleName: 'Test', plainExplanation: 'Test' }]
    }
  });

  await handleExportCSV(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'text/csv');
  assert.ok(res.sentData.includes('WORKBOOKX RISK FINDINGS'));
  assert.ok(res.sentData.includes('DETAILED CELL CHANGES'));
});

test('Controller - export/json exports JSON report', async () => {
  const report = { meta: { title: 'Test' }, summary: { total: 1 } };
  const { req, res } = createMockReqRes({ body: { report } });

  await handleExportJSON(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'application/json');
  assert.ok(res.sentData.includes('"title": "Test"'));
});

test('Controller - compare rejects missing files with 400', async () => {
  const { req, res } = createMockReqRes({ files: {} });
  await handleCompareUploads(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.sentData.success, false);
  assert.ok(res.sentData.error.includes('Original Workbook was not provided'));
});
