import test from 'node:test';
import assert from 'node:assert/strict';
import { detectFormulaAnomalies } from '../services/formulaAnomalyService.js';

test('Formula Anomaly - detects mathematical operator outlier in column sequence', () => {
  const parsedWb = {
    sheetNames: ['Model'],
    sheets: {
      Model: {
        cells: {
          A2: { cell: 'A2', value: 10, formula: null },
          B2: { cell: 'B2', value: 100, formula: '=A2*10' },

          A3: { cell: 'A3', value: 20, formula: null },
          B3: { cell: 'B3', value: 200, formula: '=A3*10' },

          A4: { cell: 'A4', value: 30, formula: null },
          B4: { cell: 'B4', value: 3, formula: '=A4/10' }, // Outlier: division instead of multiplication!

          A5: { cell: 'A5', value: 40, formula: null },
          B5: { cell: 'B5', value: 400, formula: '=A5*10' }
        }
      }
    }
  };

  const anomalies = detectFormulaAnomalies(parsedWb);
  assert.equal(anomalies.length, 1);

  const outlier = anomalies[0];
  assert.equal(outlier.cell, 'B4');
  assert.equal(outlier.type, 'FORMULA_PATTERN_OUTLIER');
  assert.equal(outlier.actualFormula, '=A4/10');
  assert.ok(outlier.explanation.includes('deviates from the standard calculation pattern'));
});

test('Formula Anomaly - detects missing formula / constant in formula column sequence', () => {
  const parsedWb = {
    sheetNames: ['Model'],
    sheets: {
      Model: {
        cells: {
          B2: { cell: 'B2', value: 100, formula: '=A2*10' },
          B3: { cell: 'B3', value: 500, formula: null, formattedText: '500' }, // Hardcoded constant surrounded by formulas!
          B4: { cell: 'B4', value: 300, formula: '=A4*10' }
        }
      }
    }
  };

  const anomalies = detectFormulaAnomalies(parsedWb);
  const missing = anomalies.find(a => a.type === 'MISSING_FORMULA_IN_SEQUENCE');
  assert.ok(missing);
  assert.equal(missing.cell, 'B3');
  assert.equal(missing.confidence, 'HIGH');
});
