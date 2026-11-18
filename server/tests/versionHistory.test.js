import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSnapshot,
  listSnapshots,
  getSnapshot,
  deleteSnapshot,
  compareSnapshots
} from '../services/versionHistoryService.js';

test('Version History - creates and retrieves a named snapshot with hash', () => {
  const mockAnalysis = {
    meta: { originalFileName: 'v1.xlsx', modifiedFileName: 'v2.xlsx' },
    summary: { totalChanges: 15 },
    changes: [{ id: 'diff-1', cell: 'B2', changeType: 'MODIFIED_VALUE' }],
    risks: [{ id: 'risk-1', severity: 'HIGH' }]
  };

  const created = createSnapshot({
    name: 'Test Milestone Snapshot',
    analysisData: mockAnalysis
  });

  assert.ok(created.id);
  assert.equal(created.name, 'Test Milestone Snapshot');
  assert.ok(created.contentHash);
  assert.equal(created.summary.totalChanges, 15);

  const found = getSnapshot(created.id);
  assert.ok(found);
  assert.equal(found.id, created.id);

  // Clean up
  deleteSnapshot(created.id);
  assert.equal(getSnapshot(created.id), null);
});

test('Version History - compares two snapshots accurately', () => {
  const snap1 = createSnapshot({
    name: 'Snap 1',
    analysisData: { summary: { totalChanges: 10 }, changes: [], risks: [] }
  });

  const snap2 = createSnapshot({
    name: 'Snap 2',
    analysisData: { summary: { totalChanges: 18 }, changes: [{ id: 'c1' }], risks: [{ id: 'r1' }] }
  });

  const comparison = compareSnapshots(snap1.id, snap2.id);
  assert.equal(comparison.comparisonDelta.changesVariance, 8); // 18 - 10 = 8
  assert.equal(comparison.comparisonDelta.risksVariance, 1);

  // Clean up
  deleteSnapshot(snap1.id);
  deleteSnapshot(snap2.id);
});
