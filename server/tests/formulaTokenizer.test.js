import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenizeFormula,
  extractCellReferences,
  extractOperators,
  hasBrokenReference,
  expandCellRange
} from '../utils/formulaTokenizer.js';

test('Formula Tokenizer - tokenizes basic arithmetic formula', () => {
  const formula = '=B2-C2';
  const tokens = tokenizeFormula(formula);

  assert.equal(tokens.length, 3);
  assert.equal(tokens[0].type, 'CELL_REF');
  assert.equal(tokens[0].cell, 'B2');
  assert.equal(tokens[1].type, 'OPERATOR');
  assert.equal(tokens[1].value, '-');
  assert.equal(tokens[2].type, 'CELL_REF');
  assert.equal(tokens[2].cell, 'C2');
});

test('Formula Tokenizer - extracts cross-sheet references', () => {
  const formula = "='Revenue'!D4 + OpEx!B5";
  const refs = extractCellReferences(formula, 'Summary');

  assert.equal(refs.length, 2);
  assert.ok(refs.some(r => r.fullRef === 'Revenue!D4'));
  assert.ok(refs.some(r => r.fullRef === 'OpEx!B5'));
});

test('Formula Tokenizer - expands cell range accurately', () => {
  const expanded = expandCellRange('B', 2, 'C', 3);
  assert.deepEqual(expanded, ['B2', 'C2', 'B3', 'C3']);
});

test('Formula Tokenizer - extracts operators accurately', () => {
  const ops = extractOperators('=(A1 + B2) * C3 / D4');
  assert.deepEqual(ops, ['+', '*', '/']);
});

test('Formula Tokenizer - detects broken reference #REF!', () => {
  assert.equal(hasBrokenReference('=Revenue!#REF! + 10'), true);
  assert.equal(hasBrokenReference('=B2*C2'), false);
});
