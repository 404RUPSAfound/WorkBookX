import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseWorkbook } from '../services/excelParserService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLES_DIR = path.resolve(__dirname, '../../sample-data');

test('Excel Parser - successfully parses multi-sheet financial workbook', () => {
  const filePath = path.join(SAMPLES_DIR, 'Q3_Financial_Model_v1.xlsx');
  const parsed = parseWorkbook(filePath, 'Q3_Financial_Model_v1.xlsx');

  assert.equal(parsed.fileName, 'Q3_Financial_Model_v1.xlsx');
  assert.ok(parsed.sheetNames.includes('Revenue'));
  assert.ok(parsed.sheetNames.includes('OpEx'));
  assert.ok(parsed.sheetNames.includes('Summary'));
  assert.ok(parsed.sheetNames.includes('Internal_Notes'));

  const revSheet = parsed.sheets['Revenue'];
  assert.ok(revSheet);
  // Verify cell value and formula
  assert.equal(revSheet.cells['B2'].value, 1000);
  assert.equal(revSheet.cells['D2'].formula, '=B2*C2');
});

test('Excel Parser - successfully parses CSV budget file', () => {
  const filePath = path.join(SAMPLES_DIR, 'Simple_Budget_A.csv');
  const parsed = parseWorkbook(filePath, 'Simple_Budget_A.csv');

  assert.ok(parsed.sheetNames.length >= 1);
  assert.ok(parsed.totalCells > 0);
});

test('Excel Parser - safely throws descriptive error on invalid corrupted file', () => {
  const invalidBuffer = Buffer.from('This is completely invalid non-excel content');
  assert.throws(() => {
    parseWorkbook(invalidBuffer, 'corrupted.xlsx');
  }, /Failed to parse spreadsheet/);
});
