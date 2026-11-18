import fs from 'fs';
import * as XLSX from 'xlsx';

/**
 * Excel & CSV Parser Service using SheetJS
 * 
 * Safely parses spreadsheet files into normalized JSON structures.
 * Explicitly disables macro execution and extracts values, formatted text, and formulas.
 */

/**
 * Parses a workbook buffer or file path into a clean, normalized structure.
 * 
 * @param {Buffer|string} input - buffer or path to file
 * @param {string} originalName - original filename
 * @returns {{
 *   fileName: string,
 *   sheetNames: string[],
 *   sheets: Record<string, {
 *     name: string,
 *     range: string,
 *     rowCount: number,
 *     colCount: number,
 *     cells: Record<string, {
 *       cell: string,
 *       row: number,
 *       col: string,
 *       value: any,
 *       formattedText: string,
 *       type: string,
 *       formula: string | null
 *     }>
 *   }>,
 *   totalCells: number
 * }}
 */
export function parseWorkbook(input, originalName = 'workbook.xlsx') {
  try {
    const buffer = Buffer.isBuffer(input) ? input : fs.readFileSync(input);

    // Validate binary magic headers separately for modern .xlsx (ZIP) and legacy .xls (OLE2)
    const lowerName = originalName.toLowerCase();
    if (lowerName.endsWith('.xlsx') && buffer.length >= 4) {
      // Modern OpenXML (.xlsx): ZIP container magic header (0x50 0x4B)
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        throw new Error(`File ${originalName} is not a valid Excel (.xlsx) document.`);
      }
    } else if (lowerName.endsWith('.xls') && buffer.length >= 4) {
      // Legacy Excel (.xls): OLE2 Compound Document header (0xD0 0xCF 0x11 0xE0)
      if (buffer[0] !== 0xD0 || buffer[1] !== 0xCF) {
        throw new Error(`File ${originalName} is not a valid legacy Excel (.xls) binary document.`);
      }
    }

    const readOptions = {
      type: 'buffer',
      cellFormula: true,    // extract formulas (cell.f)
      cellHTML: false,       // disable HTML for security
      cellText: true,       // generate formatted text (cell.w)
      cellDates: true,      // parse dates into JS Date objects
      sheetStubs: false     // do not create stubs for empty cells
    };

    const workbook = XLSX.read(buffer, readOptions);

    const sheetNames = workbook.SheetNames || [];
    const sheets = {};
    let totalCells = 0;

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const range = worksheet['!ref'] || 'A1:A1';
      const parsedRange = XLSX.utils.decode_range(range);

      const rowCount = parsedRange.e.r - parsedRange.s.r + 1;
      const colCount = parsedRange.e.c - parsedRange.s.c + 1;

      const cells = {};

      // Iterate through all cell keys in worksheet (excluding meta keys starting with '!')
      for (const cellAddress of Object.keys(worksheet)) {
        if (cellAddress.startsWith('!')) continue;

        const cell = worksheet[cellAddress];
        if (!cell) continue;

        const decoded = XLSX.utils.decode_cell(cellAddress);
        const colLetter = XLSX.utils.encode_col(decoded.c);
        const rowNumber = decoded.r + 1;

        // Clean formula: SheetJS stores formulas without the leading '='
        let formula = null;
        if (cell.f) {
          formula = cell.f.startsWith('=') ? cell.f : `=${cell.f}`;
        }

        // Standardize value
        let val = cell.v;
        if (cell.t === 'd' && val instanceof Date) {
          val = val.toISOString();
        }

        cells[cellAddress] = {
          cell: cellAddress,
          row: rowNumber,
          col: colLetter,
          value: val !== undefined ? val : null,
          formattedText: cell.w !== undefined ? String(cell.w) : (val !== null ? String(val) : ''),
          type: cell.t || 'z', // 'n', 's', 'b', 'd', 'e' (error), 'z' (blank)
          formula: formula
        };

        totalCells++;
      }

      sheets[sheetName] = {
        name: sheetName,
        range,
        rowCount,
        colCount,
        cells
      };
    }

    return {
      fileName: originalName,
      sheetNames,
      sheets,
      totalCells
    };
  } catch (err) {
    throw new Error(`Failed to parse spreadsheet (${originalName}): ${err.message}`);
  }
}
