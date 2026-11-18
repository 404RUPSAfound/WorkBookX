import test from 'node:test';
import assert from 'node:assert/strict';
import { compareWorkbooks } from '../services/workbookComparisonService.js';

test('Workbook Comparison - detects added and removed sheets', () => {
  const oldWb = {
    sheetNames: ['Sales', 'OldTab'],
    sheets: {
      Sales: { cells: {} },
      OldTab: { cells: { A1: { cell: 'A1', value: 'Legacy', formattedText: 'Legacy' } } }
    }
  };

  const newWb = {
    sheetNames: ['Sales', 'NewTab'],
    sheets: {
      Sales: { cells: {} },
      NewTab: { cells: { B2: { cell: 'B2', value: 100, formattedText: '100' } } }
    }
  };

  const { summary, changes } = compareWorkbooks(oldWb, newWb);

  assert.deepEqual(summary.sheetSummary.added, ['NewTab']);
  assert.deepEqual(summary.sheetSummary.removed, ['OldTab']);
  assert.ok(changes.some(c => c.sheet === 'NewTab' && c.changeType === 'ADDED'));
  assert.ok(changes.some(c => c.sheet === 'OldTab' && c.changeType === 'REMOVED'));
});

test('Workbook Comparison - detects modified values and formula alterations', () => {
  const oldWb = {
    sheetNames: ['Sheet1'],
    sheets: {
      Sheet1: {
        cells: {
          A1: { cell: 'A1', value: 50, formattedText: '50', formula: null },
          B1: { cell: 'B1', value: 30, formattedText: '30', formula: '=A1-20' },
          C1: { cell: 'C1', value: 100, formattedText: '100', formula: '=A1*2' }
        }
      }
    }
  };

  const newWb = {
    sheetNames: ['Sheet1'],
    sheets: {
      Sheet1: {
        cells: {
          A1: { cell: 'A1', value: 75, formattedText: '75', formula: null }, // Value modified
          B1: { cell: 'B1', value: 95, formattedText: '95', formula: '=A1+20' }, // Formula changed (- to +)
          C1: { cell: 'C1', value: 100, formattedText: '100', formula: null } // Formula replaced with constant!
        }
      }
    }
  };

  const { summary, changes } = compareWorkbooks(oldWb, newWb);

  assert.equal(summary.modifiedValues, 1); // A1
  assert.equal(summary.formulaChanges, 2); // B1 and C1

  const changeA1 = changes.find(c => c.cell === 'A1');
  assert.equal(changeA1.changeType, 'MODIFIED_VALUE');
  assert.equal(changeA1.valueDiff, 25);

  const changeB1 = changes.find(c => c.cell === 'B1');
  assert.equal(changeB1.changeType, 'FORMULA_CHANGED');
  assert.equal(changeB1.oldFormula, '=A1-20');
  assert.equal(changeB1.newFormula, '=A1+20');

  const changeC1 = changes.find(c => c.cell === 'C1');
  assert.equal(changeC1.changeType, 'FORMULA_REMOVED');
});
