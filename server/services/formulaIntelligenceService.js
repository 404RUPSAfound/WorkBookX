import {
  tokenizeFormula,
  extractCellReferences,
  extractOperators,
  hasBrokenReference
} from '../utils/formulaTokenizer.js';

/**
 * Formula Intelligence Service
 * 
 * Provides explainable analysis of formula changes:
 * - Detects formula vs constant replacements
 * - Compares operators (e.g., - replaced with +)
 * - Identifies added and removed cell references
 * - Detects broken references (#REF!)
 * - Generates clear, human-readable explanations
 */

/**
 * Generates a plain-language explanation of how the formula changed.
 * 
 * @param {object} params
 * @param {string|null} params.oldFormula
 * @param {string|null} params.newFormula
 * @param {any} params.oldValue
 * @param {any} params.newValue
 * @param {string[]} params.addedRefs
 * @param {string[]} params.removedRefs
 * @param {string[]} params.oldOperators
 * @param {string[]} params.newOperators
 * @param {boolean} params.hasBrokenRef
 * @returns {string} human-readable explanation
 */
function generateExplanation({
  oldFormula,
  newFormula,
  oldValue,
  newValue,
  addedRefs,
  removedRefs,
  oldOperators,
  newOperators,
  hasBrokenRef
}) {
  const parts = [];

  // 1. Broken reference alert
  if (hasBrokenRef) {
    parts.push('Formula introduced a broken cell reference (#REF!), likely caused by a deleted or moved source cell.');
  }

  // 2. Formula replaced with constant
  if (oldFormula && !newFormula) {
    return `Dynamic formula "${oldFormula}" was deleted and replaced with a static constant value "${newValue ?? ''}". This prevents automatic recalculation.`;
  }

  // 3. Constant replaced with formula
  if (!oldFormula && newFormula) {
    return `Static constant value "${oldValue ?? ''}" was replaced with a dynamic calculation formula "${newFormula}".`;
  }

  // 4. Operator changes
  if (oldOperators.length > 0 && newOperators.length > 0) {
    const oldOpStr = oldOperators.join(' ');
    const newOpStr = newOperators.join(' ');
    if (oldOpStr !== newOpStr) {
      // Common critical operator flips
      if (oldOperators.includes('-') && newOperators.includes('+')) {
        parts.push('Arithmetic operator changed from subtraction (-) to addition (+).');
      } else if (oldOperators.includes('+') && newOperators.includes('-')) {
        parts.push('Arithmetic operator changed from addition (+) to subtraction (-).');
      } else if (oldOperators.includes('*') && newOperators.includes('/')) {
        parts.push('Arithmetic operator changed from multiplication (*) to division (/).');
      } else if (oldOperators.includes('/') && newOperators.includes('*')) {
        parts.push('Arithmetic operator changed from division (/) to multiplication (*).');
      } else {
        parts.push(`Mathematical operators were modified from [${oldOpStr}] to [${newOpStr}].`);
      }
    }
  }

  // 5. Reference changes
  if (removedRefs.length > 0) {
    parts.push(`Removed dependency on ${removedRefs.join(', ')}.`);
  }
  if (addedRefs.length > 0) {
    parts.push(`Added new dependency on ${addedRefs.join(', ')}.`);
  }

  // Fallback if no specific operator or ref changed
  if (parts.length === 0) {
    if (oldFormula !== newFormula) {
      parts.push(`Formula expression updated from "${oldFormula}" to "${newFormula}".`);
    } else {
      parts.push('Formula structure remains identical.');
    }
  }

  return parts.join(' ');
}

/**
 * Analyzes a single formula change.
 * 
 * @param {object} changeRecord - a cell change record with oldFormula and newFormula
 * @param {string} sheetName - sheet name context
 * @returns {object} structured formula analysis
 */
export function analyzeFormulaChange(changeRecord, sheetName) {
  const oldFormula = changeRecord.oldFormula || null;
  const newFormula = changeRecord.newFormula || null;

  const oldTokens = oldFormula ? tokenizeFormula(oldFormula) : [];
  const newTokens = newFormula ? tokenizeFormula(newFormula) : [];

  const oldRefs = oldFormula ? extractCellReferences(oldFormula, sheetName).map(r => r.fullRef) : [];
  const newRefs = newFormula ? extractCellReferences(newFormula, sheetName).map(r => r.fullRef) : [];

  const oldRefMap = new Set(oldRefs);
  const newRefMap = new Set(newRefs);

  const addedRefs = newRefs.filter(r => !oldRefMap.has(r));
  const removedRefs = oldRefs.filter(r => !newRefMap.has(r));

  const oldOperators = oldFormula ? extractOperators(oldFormula) : [];
  const newOperators = newFormula ? extractOperators(newFormula) : [];

  const hasBrokenRef = hasBrokenReference(newFormula);
  const isConstantOverride = !!(oldFormula && !newFormula);
  const isFormulaIntroduction = !!(!oldFormula && newFormula);

  const hasUnsupportedSyntax = newTokens.some(t => t.type === 'UNKNOWN') || oldTokens.some(t => t.type === 'UNKNOWN');

  const explanation = generateExplanation({
    oldFormula,
    newFormula,
    oldValue: changeRecord.oldValue,
    newValue: changeRecord.newValue,
    addedRefs,
    removedRefs,
    oldOperators,
    newOperators,
    hasBrokenRef
  });

  return {
    cell: changeRecord.cell,
    sheet: sheetName,
    fullRef: changeRecord.fullRef,
    oldFormula,
    newFormula,
    isConstantOverride,
    isFormulaIntroduction,
    hasBrokenRef,
    hasUnsupportedSyntax,
    oldOperators,
    newOperators,
    oldReferences: oldRefs,
    newReferences: newRefs,
    addedReferences: addedRefs,
    removedReferences: removedRefs,
    explanation
  };
}

/**
 * Analyzes all formula modifications across a set of comparison changes.
 * 
 * @param {Array<object>} changes - comparison changes
 * @returns {Array<object>} formula intelligence records
 */
export function analyzeAllFormulaChanges(changes) {
  const formulaAnalyses = [];

  for (const change of changes) {
    if (change.isFormulaDiff) {
      const analysis = analyzeFormulaChange(change, change.sheet);
      formulaAnalyses.push(analysis);
    }
  }

  return formulaAnalyses;
}
