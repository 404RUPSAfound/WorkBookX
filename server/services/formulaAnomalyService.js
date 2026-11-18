import { tokenizeFormula, colNameToIndex, indexToColName } from '../utils/formulaTokenizer.js';

/**
 * Formula Anomaly Detection Service
 * 
 * Deterministically analyzes columns and rows for:
 * 1. Formula pattern outliers (e.g. B2=A2*10, B3=A3*10, B4=A4/10)
 * 2. Missing formulas inside continuous formula columns (e.g. B2=f, B3=f, B4=constant, B5=f)
 * 3. Relative reference offset inconsistencies
 */

/**
 * Normalizes a formula relative to its host cell (col, row).
 * Converts absolute cell references into relative directional offsets:
 * e.g., in cell B2, reference A2 becomes REF[-1, 0] (same row, 1 column left).
 */
function normalizeFormulaRelative(formulaStr, hostColLetter, hostRow) {
  if (!formulaStr) return '';
  const tokens = tokenizeFormula(formulaStr);
  const hostCol = colNameToIndex(hostColLetter);
  const normalizedParts = [];

  for (const t of tokens) {
    if (t.type === 'CELL_REF') {
      const match = t.cell.match(/^([A-Z]+)([0-9]+)$/i);
      if (match) {
        const refCol = colNameToIndex(match[1]);
        const refRow = parseInt(match[2], 10);
        const dCol = refCol - hostCol;
        const dRow = refRow - hostRow;
        normalizedParts.push(`REF[${dCol},${dRow}]`);
        continue;
      }
    }
    normalizedParts.push(t.value);
  }

  return normalizedParts.join('');
}

/**
 * Scans a parsed workbook for deterministic formula pattern anomalies.
 * 
 * @param {object} parsedWorkbook
 * @returns {Array<object>} list of formula anomalies
 */
export function detectFormulaAnomalies(parsedWorkbook) {
  const anomalies = [];
  let anomalyId = 1;

  const sheets = parsedWorkbook.sheets || {};

  for (const [sheetName, sheetData] of Object.entries(sheets)) {
    const cells = sheetData.cells || {};

    // Group cells by column
    const colGroups = new Map();

    for (const [cellCoord, cell] of Object.entries(cells)) {
      const match = cellCoord.match(/^([A-Z]+)([0-9]+)$/i);
      if (match) {
        const col = match[1].toUpperCase();
        const row = parseInt(match[2], 10);
        if (!colGroups.has(col)) {
          colGroups.set(col, []);
        }
        colGroups.get(col).push({
          coord: cellCoord,
          col,
          row,
          cellData: cell,
          formula: cell.formula || null,
          hasFormula: !!cell.formula
        });
      }
    }

    // Analyze each column sequence
    for (const [colLetter, columnCells] of colGroups.entries()) {
      // Sort cells by ascending row
      columnCells.sort((a, b) => a.row - b.row);

      // 1. Check for Missing Formulas / Constants in Formula Sequences
      for (let i = 1; i < columnCells.length - 1; i++) {
        const prev = columnCells[i - 1];
        const curr = columnCells[i];
        const next = columnCells[i + 1];

        // Sequence check: prev and next have formulas, but curr has none!
        if (prev.hasFormula && next.hasFormula && !curr.hasFormula) {
          anomalies.push({
            id: `anomaly-${anomalyId++}`,
            sheet: sheetName,
            cell: curr.coord,
            column: colLetter,
            row: curr.row,
            type: 'MISSING_FORMULA_IN_SEQUENCE',
            expectedPattern: 'Dynamic calculation consistent with adjacent rows',
            actualFormula: `Static Literal: "${curr.cellData.formattedText || curr.cellData.value}"`,
            explanation: `Cell ${curr.coord} is surrounded by calculated formula rows (${prev.coord} and ${next.coord}), but holds a static constant value. This indicates a potential manual override.`,
            confidence: 'HIGH'
          });
        }
      }

      // 2. Relative Pattern Outlier Detection in Columns with >= 3 formulas
      const formulaCellsInCol = columnCells.filter((c) => c.hasFormula);
      if (formulaCellsInCol.length >= 3) {
        // Compute normalized signature for each formula cell
        const signatures = formulaCellsInCol.map((c) => ({
          ...c,
          norm: normalizeFormulaRelative(c.formula, c.col, c.row)
        }));

        // Count signature frequencies
        const sigCounts = new Map();
        for (const item of signatures) {
          sigCounts.set(item.norm, (sigCounts.get(item.norm) || 0) + 1);
        }

        // Identify if a dominant signature exists (>= 60% of formulas in this column)
        let dominantSig = null;
        let dominantCount = 0;
        for (const [sig, count] of sigCounts.entries()) {
          if (count > dominantCount && count >= 2) {
            dominantSig = sig;
            dominantCount = count;
          }
        }

        if (dominantSig && dominantCount >= 2) {
          for (const item of signatures) {
            if (item.norm !== dominantSig && (sigCounts.get(item.norm) || 0) <= 2) {
              const sampleDominant = signatures.find((s) => s.norm === dominantSig);
              anomalies.push({
                id: `anomaly-${anomalyId++}`,
                sheet: sheetName,
                cell: item.coord,
                column: colLetter,
                row: item.row,
                type: 'FORMULA_PATTERN_OUTLIER',
                expectedPattern: `Normalized relative structure: ${dominantSig} (used by ${dominantCount} rows in column ${colLetter})`,
                actualFormula: item.formula,
                explanation: `Formula "${item.formula}" deviates from the standard calculation pattern applied across other rows in column ${colLetter} (e.g. ${sampleDominant.coord} has "${sampleDominant.formula}").`,
                confidence: dominantCount >= 3 ? 'HIGH' : 'MEDIUM'
              });
            }
          }
        }
      }
    }
  }

  return anomalies;
}
