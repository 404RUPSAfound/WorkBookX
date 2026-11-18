import { describe, it, expect } from 'vitest';
import { formatChangeType, formatNumber, truncateFormula } from '../utils/formatters.js';

describe('Frontend Formatters', () => {
  it('formats change types into clean human readable titles', () => {
    expect(formatChangeType('MODIFIED_VALUE')).toBe('Modified Value');
    expect(formatChangeType('FORMULA_CHANGED')).toBe('Formula Modified');
    expect(formatChangeType('FORMULA_REMOVED')).toBe('Constant Override');
    expect(formatChangeType('FORMULA_ADDED')).toBe('Formula Introduced');
    expect(formatChangeType('ADDED')).toBe('Added Cell');
    expect(formatChangeType('REMOVED')).toBe('Removed Cell');
  });

  it('formats numbers with comma separation', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
    expect(formatNumber(12.3456, 2)).toBe('12.35');
    expect(formatNumber(null)).toBe('—');
  });

  it('truncates long formulas cleanly with ellipsis', () => {
    const long = '=SUM(A1:A50) + VLOOKUP(B2, Table1, 3, FALSE) * IF(C2>10, 1, 0)';
    const truncated = truncateFormula(long, 20);
    expect(truncated.length).toBe(23); // 20 + '...'
    expect(truncated.endsWith('...')).toBe(true);
  });
});
