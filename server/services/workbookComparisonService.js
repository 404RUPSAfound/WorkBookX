/**
 * Workbook Comparison Service
 * 
 * Compares two parsed workbooks cell-by-cell and sheet-by-sheet.
 * Detects added/removed sheets, added/removed cells, modified values,
 * and formula modifications.
 */

/**
 * Determines whether two values are considered equivalent.
 * Handles numbers with floating-point tolerance, strings, nulls, and booleans.
 */
function areValuesEqual(valA, valB) {
  if (valA === valB) return true;
  if (valA === null || valA === undefined || valA === '') {
    return valB === null || valB === undefined || valB === '';
  }
  if (valB === null || valB === undefined || valB === '') {
    return false;
  }

  // Numerical comparison with small epsilon for float precision
  if (typeof valA === 'number' && typeof valB === 'number') {
    return Math.abs(valA - valB) < 1e-9;
  }

  // String comparison trimmed
  if (typeof valA === 'string' && typeof valB === 'string') {
    return valA.trim() === valB.trim();
  }

  return String(valA) === String(valB);
}

/**
 * Compares two parsed workbooks.
 * 
 * @param {object} oldWb - parsed original workbook
 * @param {object} newWb - parsed modified workbook
 * @returns {object} detailed comparison results and summary counts
 */
export function compareWorkbooks(oldWb, newWb) {
  const oldSheetNames = new Set(oldWb.sheetNames || []);
  const newSheetNames = new Set(newWb.sheetNames || []);

  const addedSheets = [...newSheetNames].filter(s => !oldSheetNames.has(s));
  const removedSheets = [...oldSheetNames].filter(s => !newSheetNames.has(s));
  const commonSheets = [...newSheetNames].filter(s => oldSheetNames.has(s));

  const changes = [];
  let changeIdCounter = 1;

  // 1. Process common sheets
  for (const sheetName of commonSheets) {
    const oldSheet = oldWb.sheets[sheetName];
    const newSheet = newWb.sheets[sheetName];

    const oldCells = oldSheet.cells || {};
    const newCells = newSheet.cells || {};

    const allCellAddresses = new Set([
      ...Object.keys(oldCells),
      ...Object.keys(newCells)
    ]);

    for (const cellAddress of allCellAddresses) {
      const oldCell = oldCells[cellAddress];
      const newCell = newCells[cellAddress];

      // Case A: Cell added in new workbook
      if (!oldCell && newCell) {
        changes.push({
          id: `diff-${changeIdCounter++}`,
          sheet: sheetName,
          cell: cellAddress,
          fullRef: `${sheetName}!${cellAddress}`,
          changeType: newCell.formula ? 'FORMULA_ADDED' : 'ADDED',
          oldValue: null,
          newValue: newCell.value,
          oldFormatted: '',
          newFormatted: newCell.formattedText,
          oldFormula: null,
          newFormula: newCell.formula,
          isFormulaDiff: !!newCell.formula,
          valueDiff: null
        });
        continue;
      }

      // Case B: Cell removed in new workbook
      if (oldCell && !newCell) {
        changes.push({
          id: `diff-${changeIdCounter++}`,
          sheet: sheetName,
          cell: cellAddress,
          fullRef: `${sheetName}!${cellAddress}`,
          changeType: 'REMOVED',
          oldValue: oldCell.value,
          newValue: null,
          oldFormatted: oldCell.formattedText,
          newFormatted: '',
          oldFormula: oldCell.formula,
          newFormula: null,
          isFormulaDiff: !!oldCell.formula,
          valueDiff: null
        });
        continue;
      }

      // Case C: Cell exists in both - check for formula or value changes
      const oldFormula = oldCell.formula;
      const newFormula = newCell.formula;
      const valuesMatch = areValuesEqual(oldCell.value, newCell.value);
      const formulasMatch = (oldFormula || '').trim() === (newFormula || '').trim();

      if (formulasMatch && valuesMatch) {
        // No change
        continue;
      }

      let changeType = 'MODIFIED_VALUE';
      let isFormulaDiff = false;

      if (oldFormula && !newFormula) {
        changeType = 'FORMULA_REMOVED'; // Formula replaced with constant
        isFormulaDiff = true;
      } else if (!oldFormula && newFormula) {
        changeType = 'FORMULA_ADDED';
        isFormulaDiff = true;
      } else if (oldFormula && newFormula && !formulasMatch) {
        changeType = 'FORMULA_CHANGED';
        isFormulaDiff = true;
      }

      let valueDiff = null;
      if (typeof oldCell.value === 'number' && typeof newCell.value === 'number') {
        valueDiff = Number((newCell.value - oldCell.value).toFixed(6));
      }

      changes.push({
        id: `diff-${changeIdCounter++}`,
        sheet: sheetName,
        cell: cellAddress,
        fullRef: `${sheetName}!${cellAddress}`,
        changeType,
        oldValue: oldCell.value,
        newValue: newCell.value,
        oldFormatted: oldCell.formattedText,
        newFormatted: newCell.formattedText,
        oldFormula,
        newFormula,
        isFormulaDiff,
        valueDiff
      });
    }
  }

  // 2. Process added sheets (all cells in added sheet are ADDED)
  for (const sheetName of addedSheets) {
    const newSheet = newWb.sheets[sheetName];
    const newCells = newSheet.cells || {};

    for (const [cellAddress, newCell] of Object.entries(newCells)) {
      changes.push({
        id: `diff-${changeIdCounter++}`,
        sheet: sheetName,
        cell: cellAddress,
        fullRef: `${sheetName}!${cellAddress}`,
        changeType: newCell.formula ? 'FORMULA_ADDED' : 'ADDED',
        oldValue: null,
        newValue: newCell.value,
        oldFormatted: '',
        newFormatted: newCell.formattedText,
        oldFormula: null,
        newFormula: newCell.formula,
        isFormulaDiff: !!newCell.formula,
        valueDiff: null
      });
    }
  }

  // 3. Process removed sheets (all cells in removed sheet are REMOVED)
  for (const sheetName of removedSheets) {
    const oldSheet = oldWb.sheets[sheetName];
    const oldCells = oldSheet.cells || {};

    for (const [cellAddress, oldCell] of Object.entries(oldCells)) {
      changes.push({
        id: `diff-${changeIdCounter++}`,
        sheet: sheetName,
        cell: cellAddress,
        fullRef: `${sheetName}!${cellAddress}`,
        changeType: 'REMOVED',
        oldValue: oldCell.value,
        newValue: null,
        oldFormatted: oldCell.formattedText,
        newFormatted: '',
        oldFormula: oldCell.formula,
        newFormula: null,
        isFormulaDiff: !!oldCell.formula,
        valueDiff: null
      });
    }
  }

  // Calculate precise summary counts
  const summary = {
    totalChanges: changes.length,
    addedCells: changes.filter(c => c.changeType === 'ADDED' || c.changeType === 'FORMULA_ADDED').length,
    removedCells: changes.filter(c => c.changeType === 'REMOVED').length,
    modifiedValues: changes.filter(c => c.changeType === 'MODIFIED_VALUE').length,
    formulaChanges: changes.filter(c => c.changeType === 'FORMULA_CHANGED' || c.changeType === 'FORMULA_REMOVED' || c.changeType === 'FORMULA_ADDED').length,
    sheetSummary: {
      added: addedSheets,
      removed: removedSheets,
      common: commonSheets,
      totalOldSheets: oldSheetNames.size,
      totalNewSheets: newSheetNames.size
    }
  };

  return {
    summary,
    changes
  };
}
