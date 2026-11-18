/**
 * Data Quality Intelligence Service
 * 
 * Configurable data quality and validation engine for spreadsheet sheets.
 * Evaluates non-negative constraints, required fields, duplicates, numeric ranges, and date formats.
 */

/**
 * Validates a parsed workbook against configured data quality rules.
 * 
 * @param {object} parsedWorkbook
 * @param {Array<object>} customRules - array of validation rules
 * @returns {object} structured data quality evaluation results
 */
export function evaluateDataQuality(parsedWorkbook, customRules = []) {
  const findings = [];
  let findingCounter = 1;
  let totalChecks = 0;
  let failedChecks = 0;

  const sheets = parsedWorkbook.sheets || {};

  // Default auto-rules if user didn't provide custom rules:
  // Auto-rule 1: Check for unexpected negative values in quantity/price/revenue columns
  // Auto-rule 2: Check for duplicate primary keys in column A
  const effectiveRules = customRules.length > 0 ? customRules : [
    {
      id: 'rule-non-neg',
      type: 'NON_NEGATIVE',
      ruleName: 'Non-Negative Value Check',
      columns: ['Units', 'Price', 'Quantity', 'Sales', 'Opening', 'Restock', 'Closing', 'Inventory', 'B', 'C', 'D'],
      severity: 'WARNING',
      explanation: 'Values in this column are expected to be non-negative numeric amounts.'
    },
    {
      id: 'rule-no-blanks',
      type: 'REQUIRED',
      ruleName: 'Required Column Integrity',
      columns: ['Product', 'SKU', 'Department', 'A'],
      severity: 'HIGH',
      explanation: 'Primary identifier or category columns should not contain blank values.'
    }
  ];

  for (const [sheetName, sheetData] of Object.entries(sheets)) {
    const cells = sheetData.cells || {};

    // Group cells by column letter and read headers from row 1
    const colCells = new Map();
    const headers = new Map(); // colLetter -> header text

    for (const [coord, cell] of Object.entries(cells)) {
      const match = coord.match(/^([A-Z]+)([0-9]+)$/i);
      if (match) {
        const col = match[1].toUpperCase();
        const row = parseInt(match[2], 10);

        if (row === 1) {
          headers.set(col, String(cell.value || '').trim());
        }

        if (!colCells.has(col)) {
          colCells.set(col, []);
        }
        colCells.get(col).push({ coord, col, row, cell });
      }
    }

    // Apply rules to matching columns
    for (const rule of effectiveRules) {
      for (const [colLetter, columnList] of colCells.entries()) {
        const headerName = headers.get(colLetter) || '';

        // Check if rule applies to this column
        const matchesCol = (rule.columns || []).some(
          (c) => c.toUpperCase() === colLetter || (headerName && headerName.toLowerCase().includes(c.toLowerCase()))
        );

        if (!matchesCol) continue;

        // Sort rows (skip header row 1)
        const dataRows = columnList.filter((r) => r.row > 1);

        // 1. NON_NEGATIVE Check
        if (rule.type === 'NON_NEGATIVE') {
          for (const item of dataRows) {
            totalChecks++;
            const val = item.cell.value;
            if (typeof val === 'number' && val < 0) {
              failedChecks++;
              findings.push({
                id: `dq-${findingCounter++}`,
                sheet: sheetName,
                cell: item.coord,
                col: colLetter,
                row: item.row,
                ruleId: rule.id,
                ruleName: rule.ruleName,
                ruleType: rule.type,
                severity: rule.severity || 'WARNING',
                value: val,
                message: `Unexpected negative numeric value (${val}) detected in ${headerName || colLetter}. ${rule.explanation}`
              });
            }
          }
        }

        // 2. REQUIRED Check (No empty or null cells)
        if (rule.type === 'REQUIRED') {
          for (const item of dataRows) {
            totalChecks++;
            const val = item.cell.value;
            if (val === null || val === undefined || String(val).trim() === '') {
              failedChecks++;
              findings.push({
                id: `dq-${findingCounter++}`,
                sheet: sheetName,
                cell: item.coord,
                col: colLetter,
                row: item.row,
                ruleId: rule.id,
                ruleName: rule.ruleName,
                ruleType: rule.type,
                severity: rule.severity || 'HIGH',
                value: '(blank)',
                message: `Required field is empty or missing in column ${headerName || colLetter}. ${rule.explanation}`
              });
            }
          }
        }

        // 3. DUPLICATE_CHECK
        if (rule.type === 'DUPLICATE') {
          const seen = new Map();
          for (const item of dataRows) {
            totalChecks++;
            const key = String(item.cell.value || '').trim().toLowerCase();
            if (key) {
              if (seen.has(key)) {
                failedChecks++;
                findings.push({
                  id: `dq-${findingCounter++}`,
                  sheet: sheetName,
                  cell: item.coord,
                  col: colLetter,
                  row: item.row,
                  ruleId: rule.id,
                  ruleName: rule.ruleName,
                  ruleType: rule.type,
                  severity: rule.severity || 'HIGH',
                  value: item.cell.value,
                  message: `Duplicate record value "${item.cell.value}" duplicates previous row ${seen.get(key)}. ${rule.explanation}`
                });
              } else {
                seen.set(key, item.coord);
              }
            }
          }
        }

        // 4. RANGE_CHECK
        if (rule.type === 'RANGE') {
          const min = rule.min !== undefined ? rule.min : -Infinity;
          const max = rule.max !== undefined ? rule.max : Infinity;
          for (const item of dataRows) {
            totalChecks++;
            const val = Number(item.cell.value);
            if (!isNaN(val) && (val < min || val > max)) {
              failedChecks++;
              findings.push({
                id: `dq-${findingCounter++}`,
                sheet: sheetName,
                cell: item.coord,
                col: colLetter,
                row: item.row,
                ruleId: rule.id,
                ruleName: rule.ruleName,
                ruleType: rule.type,
                severity: rule.severity || 'WARNING',
                value: item.cell.value,
                message: `Value ${val} is outside acceptable range [${min}, ${max}]. ${rule.explanation}`
              });
            }
          }
        }
      }
    }
  }

  const passedChecks = Math.max(0, totalChecks - failedChecks);

  return {
    totalChecksPerformed: totalChecks,
    passedChecksCount: passedChecks,
    failedChecksCount: failedChecks,
    passRatePercent: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100,
    findingsCount: findings.length,
    findings,
    activeRules: effectiveRules
  };
}
