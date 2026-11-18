import test from 'node:test';
import assert from 'node:assert/strict';
import {
  updateRiskDecision,
  getAllRiskDecisions,
  calculateCompositeRiskIndex
} from '../services/riskGovernanceService.js';

test('Risk Governance - updates finding status with reviewer history', () => {
  const riskId = `risk-test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const updated1 = updateRiskDecision(riskId, {
    status: 'UNDER_REVIEW',
    reviewer: 'Chief Auditor',
    comment: 'Investigating potential impact on EBITDA',
    reason: 'Initial review initiation'
  });

  assert.equal(updated1.status, 'UNDER_REVIEW');
  assert.equal(updated1.reviewer, 'Chief Auditor');
  assert.equal(updated1.history.length, 1);

  // Transition to APPROVED
  const updated2 = updateRiskDecision(riskId, {
    status: 'APPROVED',
    reviewer: 'Audit Partner',
    comment: 'Sign-off after verifying source contracts',
    reason: 'Verified and accepted'
  });

  assert.equal(updated2.status, 'APPROVED');
  assert.equal(updated2.history.length, 2);
  assert.equal(updated2.history[0].previousStatus, 'UNDER_REVIEW');
});

test('Risk Governance - calculates transparent composite model risk score', () => {
  const risks = [
    { severity: 'CRITICAL' }, // +25
    { severity: 'HIGH' }      // +15
  ];
  const impactAnalysis = {
    maxAffectedCount: 12,    // +15
    globalMaxDepth: 3        // +5
  };

  const index = calculateCompositeRiskIndex(risks, impactAnalysis);
  // Total: 25 + 15 + 15 + 5 = 60 (HIGH rating)
  assert.equal(index.score, 60);
  assert.equal(index.rating, 'HIGH');
  assert.ok(index.breakdown.criticalRisksPoints === 25);
  assert.ok(index.breakdown.blastRadiusPoints === 15);
});
