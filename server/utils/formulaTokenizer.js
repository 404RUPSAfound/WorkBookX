/**
 * Formula Tokenizer and Reference Extractor
 * 
 * Provides transparent, deterministic tokenization for supported Excel formulas.
 * Supports:
 * - Single cell references (e.g., A1, $B$2, Sheet1!A1, 'Sales Data'!C4)
 * - Range references (e.g., A1:A5, Sheet1!B2:C4)
 * - Arithmetic and comparison operators (+, -, *, /, ^, &, =, <>, <, >, <=, >=)
 * - Common Excel functions (SUM, AVERAGE, IF, VLOOKUP, etc.)
 * - Numbers, strings, parentheses, and error tokens (#REF!, #VALUE!, etc.)
 */

// Regex patterns
const SHEET_PREFIX_REGEX = /^(?:'([^']+)'|([a-zA-Z0-9_\u00A0-\uFFFF]+))!/;
const CELL_COORD_REGEX = /^\$?([A-Z]{1,3})\$?([1-9][0-9]{0,6})$/i;
const RANGE_REGEX = /^(?:(?:'([^']+)'|([a-zA-Z0-9_\u00A0-\uFFFF]+))!)?\$?([A-Z]{1,3})\$?([1-9][0-9]{0,6}):\$?([A-Z]{1,3})\$?([1-9][0-9]{0,6})/i;
const SINGLE_REF_REGEX = /^(?:(?:'([^']+)'|([a-zA-Z0-9_\u00A0-\uFFFF]+))!)?\$?([A-Z]{1,3})\$?([1-9][0-9]{0,6})/i;

/**
 * Converts column letters (e.g., 'A', 'Z', 'AA') to 0-based column index
 */
export function colNameToIndex(col) {
  let index = 0;
  const upper = col.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Converts 0-based column index back to column letters (e.g., 0 -> 'A', 25 -> 'Z', 26 -> 'AA')
 */
export function indexToColName(index) {
  let col = '';
  let temp = index + 1;
  while (temp > 0) {
    const rem = (temp - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    temp = Math.floor((temp - 1) / 26);
  }
  return col;
}

/**
 * Expands a 2D range like "A1:B3" into individual cell references ["A1", "B1", "A2", "B2", "A3", "B3"]
 * Capped at maxCells to prevent memory exhaustion on giant ranges like A:A.
 */
export function expandCellRange(startCol, startRow, endCol, endRow, maxCells = 200) {
  const colStartIdx = colNameToIndex(startCol);
  const colEndIdx = colNameToIndex(endCol);
  const rowStart = parseInt(startRow, 10);
  const rowEnd = parseInt(endRow, 10);

  const minCol = Math.min(colStartIdx, colEndIdx);
  const maxCol = Math.max(colStartIdx, colEndIdx);
  const minRow = Math.min(rowStart, rowEnd);
  const maxRow = Math.max(rowStart, rowEnd);

  const cells = [];
  let count = 0;

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (count >= maxCells) {
        return cells; // safely stop expanding if exceeded cap
      }
      cells.push(`${indexToColName(c)}${r}`);
      count++;
    }
  }

  return cells;
}

/**
 * Tokenizes a formula string into a list of structured tokens.
 * @param {string} formula - formula string (e.g. "=B2+C2" or "B2+C2")
 * @returns {Array<{type: string, value: string, [key: string]: any}>}
 */
export function tokenizeFormula(formula) {
  if (!formula || typeof formula !== 'string') {
    return [];
  }

  // Strip leading '=' if present
  let clean = formula.trim();
  if (clean.startsWith('=')) {
    clean = clean.substring(1).trim();
  }

  const tokens = [];
  let cursor = 0;
  const len = clean.length;

  while (cursor < len) {
    const char = clean[cursor];

    // 1. Skip whitespace
    if (/\s/.test(char)) {
      cursor++;
      continue;
    }

    // 2. String literal (e.g., "Hello")
    if (char === '"') {
      let strVal = '"';
      cursor++;
      while (cursor < len) {
        if (clean[cursor] === '"') {
          strVal += '"';
          cursor++;
          if (cursor < len && clean[cursor] === '"') {
            // Escaped quote in Excel ("")
            strVal += '"';
            cursor++;
          } else {
            break;
          }
        } else {
          strVal += clean[cursor];
          cursor++;
        }
      }
      tokens.push({ type: 'STRING', value: strVal });
      continue;
    }

    // 3. Error token (e.g., #REF!, #VALUE!, #DIV/0!, #N/A, #NAME?)
    if (char === '#') {
      const remaining = clean.substring(cursor);
      const errMatch = remaining.match(/^#(?:REF!|VALUE!|DIV\/0!|N\/A|NAME\?|NUM!|NULL!)/i);
      if (errMatch) {
        const val = errMatch[0];
        tokens.push({
          type: val.toUpperCase() === '#REF!' ? 'BROKEN_REF' : 'ERROR',
          value: val.toUpperCase()
        });
        cursor += val.length;
        continue;
      }
    }

    // 4. Multi-character comparison operators: <=, >=, <>
    const twoChars = clean.substring(cursor, cursor + 2);
    if (['<=', '>=', '<>'].includes(twoChars)) {
      tokens.push({ type: 'OPERATOR', value: twoChars });
      cursor += 2;
      continue;
    }

    // 5. Single-character operators: +, -, *, /, ^, %, &, =, <, >
    if (['+', '-', '*', '/', '^', '%', '&', '=', '<', '>'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      cursor++;
      continue;
    }

    // 6. Parentheses and separators
    if (['(', ')', ',', ';'].includes(char)) {
      tokens.push({ type: char === '(' ? 'LPAREN' : char === ')' ? 'RPAREN' : 'SEPARATOR', value: char });
      cursor++;
      continue;
    }

    // 7. Numeric literals: e.g. 100, 1.25, 0.5
    if (/[0-9]/.test(char) || (char === '.' && cursor + 1 < len && /[0-9]/.test(clean[cursor + 1]))) {
      const remaining = clean.substring(cursor);
      const numMatch = remaining.match(/^[0-9]+(?:\.[0-9]+)?/);
      if (numMatch) {
        tokens.push({ type: 'NUMBER', value: numMatch[0] });
        cursor += numMatch[0].length;
        continue;
      }
    }

    // 8. Range Reference check (e.g., 'Sheet1'!A1:B5 or A1:B5)
    const remaining = clean.substring(cursor);
    const rangeMatch = remaining.match(RANGE_REGEX);
    if (rangeMatch) {
      const matchedText = rangeMatch[0];
      const sheet = rangeMatch[1] || rangeMatch[2] || null;
      const startCol = rangeMatch[3].toUpperCase();
      const startRow = rangeMatch[4];
      const endCol = rangeMatch[5].toUpperCase();
      const endRow = rangeMatch[6];
      const expanded = expandCellRange(startCol, startRow, endCol, endRow);

      tokens.push({
        type: 'RANGE_REF',
        value: matchedText,
        sheet: sheet,
        startCell: `${startCol}${startRow}`,
        endCell: `${endCol}${endRow}`,
        expandedCells: expanded
      });
      cursor += matchedText.length;
      continue;
    }

    // 9. Single Cell Reference check (e.g. 'Sheet1'!A1 or $B$2)
    const singleMatch = remaining.match(SINGLE_REF_REGEX);
    if (singleMatch) {
      // Must verify it is not immediately followed by '(' which would make it a function name
      const matchedText = singleMatch[0];
      const nextChar = clean[cursor + matchedText.length];
      if (nextChar !== '(' && nextChar !== ':') {
        const sheet = singleMatch[1] || singleMatch[2] || null;
        const col = singleMatch[3].toUpperCase();
        const row = singleMatch[4];
        tokens.push({
          type: 'CELL_REF',
          value: matchedText,
          sheet: sheet,
          cell: `${col}${row}`
        });
        cursor += matchedText.length;
        continue;
      }
    }

    // 10. Function name or Identifier (e.g., SUM, AVERAGE, IF)
    const identMatch = remaining.match(/^[A-Za-z_][A-Za-z0-9_.]*/);
    if (identMatch) {
      const ident = identMatch[0];
      const nextChar = clean[cursor + ident.length];
      if (nextChar === '(') {
        tokens.push({ type: 'FUNCTION', value: ident.toUpperCase() });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: ident });
      }
      cursor += ident.length;
      continue;
    }

    // Fallback: single unclassified character
    tokens.push({ type: 'UNKNOWN', value: char });
    cursor++;
  }

  return tokens;
}

/**
 * Extracts all unique cell references referenced by a formula.
 * Expands small ranges into discrete cell references so dependency graph can track them.
 * 
 * @param {string} formula
 * @param {string} currentSheetName - context sheet where formula resides
 * @returns {Array<{ sheet: string, cell: string, fullRef: string }>}
 */
export function extractCellReferences(formula, currentSheetName = 'Sheet1') {
  const tokens = tokenizeFormula(formula);
  const refMap = new Map();

  for (const token of tokens) {
    if (token.type === 'CELL_REF') {
      const sheet = token.sheet || currentSheetName;
      const cell = token.cell;
      const fullRef = `${sheet}!${cell}`;
      if (!refMap.has(fullRef)) {
        refMap.set(fullRef, { sheet, cell, fullRef });
      }
    } else if (token.type === 'RANGE_REF') {
      const sheet = token.sheet || currentSheetName;
      if (Array.isArray(token.expandedCells)) {
        for (const c of token.expandedCells) {
          const fullRef = `${sheet}!${c}`;
          if (!refMap.has(fullRef)) {
            refMap.set(fullRef, { sheet, cell: c, fullRef });
          }
        }
      }
    }
  }

  return Array.from(refMap.values());
}

/**
 * Extracts operators used in formula in order
 */
export function extractOperators(formula) {
  const tokens = tokenizeFormula(formula);
  return tokens.filter(t => t.type === 'OPERATOR').map(t => t.value);
}

/**
 * Detects if a formula contains broken references (#REF!)
 */
export function hasBrokenReference(formula) {
  if (!formula || typeof formula !== 'string') return false;
  return /#REF!/i.test(formula);
}
