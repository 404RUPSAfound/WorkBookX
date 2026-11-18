/**
 * Frontend formatting helpers
 */

export function formatChangeType(type) {
  if (!type) return 'Unknown';
  switch (type) {
    case 'MODIFIED_VALUE':
      return 'Modified Value';
    case 'FORMULA_CHANGED':
      return 'Formula Modified';
    case 'FORMULA_REMOVED':
      return 'Constant Override';
    case 'FORMULA_ADDED':
      return 'Formula Introduced';
    case 'ADDED':
      return 'Added Cell';
    case 'REMOVED':
      return 'Removed Cell';
    default:
      return type.replace(/_/g, ' ');
  }
}

export function formatNumber(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

export function truncateFormula(formula, maxLength = 40) {
  if (!formula || typeof formula !== 'string') return '';
  if (formula.length <= maxLength) return formula;
  return `${formula.substring(0, maxLength)}...`;
}
