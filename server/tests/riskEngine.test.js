import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRisks } from '../services/riskEngineService.js';

test('Risk Engine - triggers CRITICAL for circular dependency', () => {
  const risks = evaluateRisks({
    changes: [],
    formulaAnalyses: [],
    graphData: {
      cycles: [{
        cycleNodes: ['Summary!B6'],
        cyclePath: 'Summary!B6 -> Summary!B6'
      }],
      downstreamImpacts: {}
    },
    sheetSummary: { removed: [], added: [] }
  });

  const circularRisk = risks.find(r => r.ruleId === 'RULE_CIRCULAR_REF');
  assert.ok(circularRisk);
  assert.equal(circularRisk.severity, 'CRITICAL');
  assert.ok(circularRisk.evidence.includes('Summary!B6'));
});

test('Risk Engine - triggers CRITICAL for broken reference #REF!', () => {
  const risks = evaluateRisks({
    changes: [],
    formulaAnalyses: [{
      cell: 'B7',
      sheet: 'Summary',
      fullRef: 'Summary!B7',
      hasBrokenRef: true,
      newFormula: '=Revenue!#REF!'
    }],
    graphData: { cycles: [], downstreamImpacts: {} },
    sheetSummary: { removed: [], added: [] }
  });

  const brokenRefRisk = risks.find(r => r.ruleId === 'RULE_BROKEN_REF');
  assert.ok(brokenRefRisk);
  assert.equal(brokenRefRisk.severity, 'CRITICAL');
});

test('Risk Engine - triggers HIGH for formula replaced with constant (hardcoding)', () => {
  const risks = evaluateRisks({
    changes: [],
    formulaAnalyses: [{
      cell: 'F2',
      sheet: 'Revenue',
      fullRef: 'Revenue!F2',
      isConstantOverride: true,
      oldFormula: '=D2*(1-E2)',
      newFormula: null
    }],
    graphData: { cycles: [], downstreamImpacts: {} },
    sheetSummary: { removed: [], added: [] }
  });

  const hardcodeRisk = risks.find(r => r.ruleId === 'RULE_HARDCODED_CONSTANT');
  assert.ok(hardcodeRisk);
  assert.equal(hardcodeRisk.severity, 'HIGH');
});

test('Risk Engine - triggers HIGH for inverted arithmetic operator (- to +)', () => {
  const risks = evaluateRisks({
    changes: [],
    formulaAnalyses: [{
      cell: 'B4',
      sheet: 'Summary',
      fullRef: 'Summary!B4',
      oldFormula: '=B2-B3',
      newFormula: '=B2+B3',
      oldOperators: ['-'],
      newOperators: ['+']
    }],
    graphData: { cycles: [], downstreamImpacts: {} },
    sheetSummary: { removed: [], added: [] }
  });

  const opRisk = risks.find(r => r.ruleId === 'RULE_OPERATOR_INVERTED');
  assert.ok(opRisk);
  assert.equal(opRisk.severity, 'HIGH');
  assert.ok(opRisk.evidence.includes('Subtraction (-) operator replaced with addition (+)'));
});
