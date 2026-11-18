import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDataQuality } from '../services/dataQualityService.js';

test('Data Quality - detects unexpected negative value', () => {
  const parsedWb = {
    sheetNames: ['Inventory'],
    sheets: {
      Inventory: {
        cells: {
          A1: { cell: 'A1', value: 'SKU' },
          B1: { cell: 'B1', value: 'Quantity' },

          A2: { cell: 'A2', value: 'SKU-1' },
          B2: { cell: 'B2', value: 50 },

          A3: { cell: 'A3', value: 'SKU-2' },
          B3: { cell: 'B3', value: -12 } // Negative quantity!
        }
      }
    }
  };

  const dq = evaluateDataQuality(parsedWb);
  const negFinding = dq.findings.find(f => f.ruleType === 'NON_NEGATIVE');
  assert.ok(negFinding);
  assert.equal(negFinding.cell, 'B3');
  assert.equal(negFinding.value, -12);
});

test('Data Quality - detects missing required field and duplicate keys', () => {
  const parsedWb = {
    sheetNames: ['Products'],
    sheets: {
      Products: {
        cells: {
          A1: { cell: 'A1', value: 'Product' },
          A2: { cell: 'A2', value: 'Laptop' },
          A3: { cell: 'A3', value: '' }, // Blank required value!
          A4: { cell: 'A4', value: 'Laptop' } // Duplicate!
        }
      }
    }
  };

  const customRules = [
    {
      id: 'req-prod',
      type: 'REQUIRED',
      ruleName: 'Product Required',
      columns: ['Product'],
      severity: 'HIGH',
      explanation: 'Product name cannot be empty.'
    },
    {
      id: 'dup-prod',
      type: 'DUPLICATE',
      ruleName: 'Product Unique',
      columns: ['Product'],
      severity: 'HIGH',
      explanation: 'Products must be unique.'
    }
  ];

  const dq = evaluateDataQuality(parsedWb, customRules);

  const blankFinding = dq.findings.find(f => f.ruleType === 'REQUIRED');
  assert.ok(blankFinding);
  assert.equal(blankFinding.cell, 'A3');

  const dupFinding = dq.findings.find(f => f.ruleType === 'DUPLICATE');
  assert.ok(dupFinding);
  assert.equal(dupFinding.cell, 'A4');
});
