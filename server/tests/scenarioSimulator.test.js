import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFormulaSafely } from '../utils/safeFormulaEvaluator.js';
import { runScenarioSimulation } from '../services/scenarioSimulationService.js';

test('Safe Formula Evaluator - evaluates arithmetic expressions with cell lookups', () => {
  const cellValues = {
    'Sheet1!A1': 100,
    'Sheet1!B1': 25,
    'Sheet1!C1': 2
  };

  const res = evaluateFormulaSafely('=(A1 - B1) * C1 + 5', cellValues, 'Sheet1');
  assert.equal(res.success, true);
  // (100 - 25) * 2 + 5 = 75 * 2 + 5 = 155
  assert.equal(res.value, 155);
});

test('Safe Formula Evaluator - handles division by zero safely without crashing', () => {
  const cellValues = { 'Sheet1!A1': 100, 'Sheet1!B1': 0 };
  const res = evaluateFormulaSafely('=A1 / B1', cellValues, 'Sheet1');
  assert.equal(res.success, false);
  assert.ok(res.error.includes('#DIV/0!'));
});

test('Safe Formula Evaluator - flags unsupported complex functions cleanly', () => {
  const res = evaluateFormulaSafely('=INDIRECT("A1")', {}, 'Sheet1');
  assert.equal(res.success, false);
  assert.equal(res.unsupported, true);
  assert.ok(res.error.includes('not supported'));
});

test('Scenario Simulator - recalculates downstream cascade when input changes', () => {
  const parsedWb = {
    sheetNames: ['Sales'],
    sheets: {
      Sales: {
        cells: {
          A1: { cell: 'A1', value: 10, formula: null },        // Units
          B1: { cell: 'B1', value: 5, formula: null },         // Price
          C1: { cell: 'C1', value: 50, formula: '=A1*B1' },    // Revenue = 10 * 5 = 50
          D1: { cell: 'D1', value: 55, formula: '=C1+5' }      // Total with fee = 50 + 5 = 55
        }
      }
    }
  };

  // Simulate changing Units (A1) from 10 to 20
  const sim = runScenarioSimulation(parsedWb, {
    scenarioName: 'Units Doubled',
    overrides: [{ sheet: 'Sales', cell: 'A1', simulatedValue: 20 }]
  });

  assert.equal(sim.overridesCount, 1);
  assert.equal(sim.recalculatedCount, 2); // C1 and D1 recalculated

  const recalcC1 = sim.recalculatedCells.find(c => c.cell === 'C1');
  assert.equal(recalcC1.simulatedValue, 100); // 20 * 5 = 100
  assert.equal(recalcC1.variance, 50);

  const recalcD1 = sim.recalculatedCells.find(c => c.cell === 'D1');
  assert.equal(recalcD1.simulatedValue, 105); // 100 + 5 = 105
  assert.equal(recalcD1.variance, 50);
});
