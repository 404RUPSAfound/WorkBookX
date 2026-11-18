import * as XLSX from '../server/node_modules/xlsx/xlsx.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to create workbook
function createWorkbook() {
  return XLSX.utils.book_new();
}

console.log('Generating realistic sample Excel workbooks...');

function saveWorkbook(wb, filePath) {
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(filePath, buf);
}

// -------------------------------------------------------------
// 1. Q3 Financial Model - Version 1 (Original)
// -------------------------------------------------------------
const wbFinancialV1 = createWorkbook();

// Sheet: Revenue
const wsRevV1 = {
  '!ref': 'A1:F4',
  A1: { t: 's', v: 'Product' },
  B1: { t: 's', v: 'Units Sold' },
  C1: { t: 's', v: 'Unit Price' },
  D1: { t: 's', v: 'Gross Revenue' },
  E1: { t: 's', v: 'Discount Rate' },
  F1: { t: 's', v: 'Net Revenue' },

  A2: { t: 's', v: 'Enterprise Cloud' },
  B2: { t: 'n', v: 1000 },
  C2: { t: 'n', v: 50 },
  D2: { t: 'n', v: 50000, f: 'B2*C2' },
  E2: { t: 'n', v: 0.10 },
  F2: { t: 'n', v: 45000, f: 'D2*(1-E2)' },

  A3: { t: 's', v: 'Dev Suite' },
  B3: { t: 'n', v: 500 },
  C3: { t: 'n', v: 120 },
  D3: { t: 'n', v: 60000, f: 'B3*C3' },
  E3: { t: 'n', v: 0.05 },
  F3: { t: 'n', v: 57000, f: 'D3*(1-E3)' },

  A4: { t: 's', v: 'Total' },
  B4: { t: 'n', v: 1500, f: 'SUM(B2:B3)' },
  C4: { t: 's', v: '-' },
  D4: { t: 'n', v: 110000, f: 'SUM(D2:D3)' },
  E4: { t: 's', v: '-' },
  F4: { t: 'n', v: 102000, f: 'SUM(F2:F3)' }
};
XLSX.utils.book_append_sheet(wbFinancialV1, wsRevV1, 'Revenue');

// Sheet: OpEx
const wsOpExV1 = {
  '!ref': 'A1:B5',
  A1: { t: 's', v: 'Category' },
  B1: { t: 's', v: 'Amount' },

  A2: { t: 's', v: 'Salaries' },
  B2: { t: 'n', v: 45000 },

  A3: { t: 's', v: 'Marketing' },
  B3: { t: 'n', v: 12000 },

  A4: { t: 's', v: 'R&D Infrastructure' },
  B4: { t: 'n', v: 18000 },

  A5: { t: 's', v: 'Total OpEx' },
  B5: { t: 'n', v: 75000, f: 'SUM(B2:B4)' }
};
XLSX.utils.book_append_sheet(wbFinancialV1, wsOpExV1, 'OpEx');

// Sheet: Summary
const wsSummaryV1 = {
  '!ref': 'A1:B6',
  A1: { t: 's', v: 'Executive Metric' },
  B1: { t: 's', v: 'USD' },

  A2: { t: 's', v: 'Net Revenue' },
  B2: { t: 'n', v: 102000, f: 'Revenue!F4' },

  A3: { t: 's', v: 'Total Expenses' },
  B3: { t: 'n', v: 75000, f: 'OpEx!B5' },

  A4: { t: 's', v: 'Operating Income' },
  B4: { t: 'n', v: 27000, f: 'B2-B3' },

  A5: { t: 's', v: 'Operating Margin' },
  B5: { t: 'n', v: 0.2647, f: 'B4/B2' },

  A6: { t: 's', v: 'Audit Status' },
  B6: { t: 's', v: 'VERIFIED' }
};
XLSX.utils.book_append_sheet(wbFinancialV1, wsSummaryV1, 'Summary');

// Sheet: Deprecated_Notes (Will be removed in v2)
const wsOldNotes = {
  '!ref': 'A1:B2',
  A1: { t: 's', v: 'Note' },
  B1: { t: 's', v: 'Details' },
  A2: { t: 's', v: 'Preliminary' },
  B2: { t: 's', v: 'Draft numbers subject to CFO review.' }
};
XLSX.utils.book_append_sheet(wbFinancialV1, wsOldNotes, 'Internal_Notes');

saveWorkbook(wbFinancialV1, path.join(__dirname, 'Q3_Financial_Model_v1.xlsx'));

// -------------------------------------------------------------
// 2. Q3 Financial Model - Version 2 (Modified with intentional risks)
// -------------------------------------------------------------
const wbFinancialV2 = createWorkbook();

// Sheet: Revenue (F2 replaced with constant 45000, new row added)
const wsRevV2 = {
  '!ref': 'A1:F5',
  A1: { t: 's', v: 'Product' },
  B1: { t: 's', v: 'Units Sold' },
  C1: { t: 's', v: 'Unit Price' },
  D1: { t: 's', v: 'Gross Revenue' },
  E1: { t: 's', v: 'Discount Rate' },
  F1: { t: 's', v: 'Net Revenue' },

  A2: { t: 's', v: 'Enterprise Cloud' },
  B2: { t: 'n', v: 1000 },
  C2: { t: 'n', v: 50 },
  D2: { t: 'n', v: 50000, f: 'B2*C2' },
  E2: { t: 'n', v: 0.10 },
  // RISK: Formula replaced with hardcoded constant!
  F2: { t: 'n', v: 45000 },

  A3: { t: 's', v: 'Dev Suite' },
  B3: { t: 'n', v: 550 }, // modified units sold from 500 to 550
  C3: { t: 'n', v: 120 },
  D3: { t: 'n', v: 66000, f: 'B3*C3' },
  E3: { t: 'n', v: 0.05 },
  F3: { t: 'n', v: 62700, f: 'D3*(1-E3)' },

  // Added new product row
  A4: { t: 's', v: 'Support Add-on' },
  B4: { t: 'n', v: 200 },
  C4: { t: 'n', v: 25 },
  D4: { t: 'n', v: 5000, f: 'B4*C4' },
  E4: { t: 'n', v: 0.0 },
  F4: { t: 'n', v: 5000, f: 'D4*(1-E4)' },

  A5: { t: 's', v: 'Total' },
  B5: { t: 'n', v: 1750, f: 'SUM(B2:B4)' },
  C5: { t: 's', v: '-' },
  D5: { t: 'n', v: 121000, f: 'SUM(D2:D4)' },
  E5: { t: 's', v: '-' },
  F5: { t: 'n', v: 112700, f: 'SUM(F2:F4)' }
};
XLSX.utils.book_append_sheet(wbFinancialV2, wsRevV2, 'Revenue');

// Sheet: OpEx (Marketing amount increased)
const wsOpExV2 = {
  '!ref': 'A1:B5',
  A1: { t: 's', v: 'Category' },
  B1: { t: 's', v: 'Amount' },

  A2: { t: 's', v: 'Salaries' },
  B2: { t: 'n', v: 45000 },

  A3: { t: 's', v: 'Marketing' },
  B3: { t: 'n', v: 16500 }, // modified from 12000 to 16500

  A4: { t: 's', v: 'R&D Infrastructure' },
  B4: { t: 'n', v: 18000 },

  A5: { t: 's', v: 'Total OpEx' },
  B5: { t: 'n', v: 79500, f: 'SUM(B2:B4)' }
};
XLSX.utils.book_append_sheet(wbFinancialV2, wsOpExV2, 'OpEx');

// Sheet: Summary
// CRITICAL RISKS:
// - B4: Operating Income changed from =B2-B3 to =B2+B3 (operator inverted to addition!)
// - B6: Circular reference introduced: =B6*1.05
const wsSummaryV2 = {
  '!ref': 'A1:B7',
  A1: { t: 's', v: 'Executive Metric' },
  B1: { t: 's', v: 'USD' },

  A2: { t: 's', v: 'Net Revenue' },
  B2: { t: 'n', v: 112700, f: 'Revenue!F5' },

  A3: { t: 's', v: 'Total Expenses' },
  B3: { t: 'n', v: 79500, f: 'OpEx!B5' },

  // CRITICAL RISK: Subtraction changed to addition!
  A4: { t: 's', v: 'Operating Income' },
  B4: { t: 'n', v: 192200, f: 'B2+B3' },

  A5: { t: 's', v: 'Operating Margin' },
  B5: { t: 'n', v: 1.705, f: 'B4/B2' },

  // CRITICAL RISK: Circular dependency! Cell references itself
  A6: { t: 's', v: 'Loop Calculation' },
  B6: { t: 'n', v: 0, f: 'B6*1.05' },

  A7: { t: 's', v: 'Broken Metric' },
  B7: { t: 'n', v: 0, f: 'Revenue!#REF!' }
};
XLSX.utils.book_append_sheet(wbFinancialV2, wsSummaryV2, 'Summary');

// Sheet: Tax_Compliance (Added Sheet)
const wsTax = {
  '!ref': 'A1:B3',
  A1: { t: 's', v: 'Jurisdiction' },
  B1: { t: 's', v: 'Rate' },
  A2: { t: 's', v: 'Federal' },
  B2: { t: 'n', v: 0.21 },
  A3: { t: 's', v: 'State' },
  B3: { t: 'n', v: 0.08 }
};
XLSX.utils.book_append_sheet(wbFinancialV2, wsTax, 'Tax_Compliance');

saveWorkbook(wbFinancialV2, path.join(__dirname, 'Q3_Financial_Model_v2.xlsx'));

// -------------------------------------------------------------
// 3. Inventory Forecast (Old vs New)
// -------------------------------------------------------------
const wbInvOld = createWorkbook();
const wsInvOld = {
  '!ref': 'A1:E4',
  A1: { t: 's', v: 'SKU' },
  B1: { t: 's', v: 'Opening' },
  C1: { t: 's', v: 'Restock' },
  D1: { t: 's', v: 'Sales' },
  E1: { t: 's', v: 'Closing' },

  A2: { t: 's', v: 'SKU-101' },
  B2: { t: 'n', v: 500 },
  C2: { t: 'n', v: 200 },
  D2: { t: 'n', v: 150 },
  E2: { t: 'n', v: 550, f: 'B2+C2-D2' },

  A3: { t: 's', v: 'SKU-102' },
  B3: { t: 'n', v: 800 },
  C3: { t: 'n', v: 300 },
  D3: { t: 'n', v: 400 },
  E3: { t: 'n', v: 700, f: 'B3+C3-D3' },

  A4: { t: 's', v: 'Total Stock' },
  B4: { t: 'n', v: 1300, f: 'SUM(B2:B3)' },
  C4: { t: 'n', v: 500, f: 'SUM(C2:C3)' },
  D4: { t: 'n', v: 550, f: 'SUM(D2:D3)' },
  E4: { t: 'n', v: 1250, f: 'SUM(E2:E3)' }
};
XLSX.utils.book_append_sheet(wbInvOld, wsInvOld, 'Inventory');
saveWorkbook(wbInvOld, path.join(__dirname, 'Inventory_Forecast_Old.xlsx'));

const wbInvNew = createWorkbook();
const wsInvNew = {
  '!ref': 'A1:E4',
  A1: { t: 's', v: 'SKU' },
  B1: { t: 's', v: 'Opening' },
  C1: { t: 's', v: 'Restock' },
  D1: { t: 's', v: 'Sales' },
  E1: { t: 's', v: 'Closing' },

  A2: { t: 's', v: 'SKU-101' },
  B2: { t: 'n', v: 500 },
  C2: { t: 'n', v: 200 },
  D2: { t: 'n', v: 150 },
  // Operator changed from - to + (Sales added to inventory!)
  E2: { t: 'n', v: 850, f: 'B2+C2+D2' },

  A3: { t: 's', v: 'SKU-102' },
  B3: { t: 'n', v: 800 },
  C3: { t: 'n', v: 300 },
  D3: { t: 'n', v: 400 },
  E3: { t: 'n', v: 700, f: 'B3+C3-D3' },

  A4: { t: 's', v: 'Total Stock' },
  B4: { t: 'n', v: 1300, f: 'SUM(B2:B3)' },
  C4: { t: 'n', v: 500, f: 'SUM(C2:C3)' },
  D4: { t: 'n', v: 550, f: 'SUM(D2:D3)' },
  E4: { t: 'n', v: 1550, f: 'SUM(E2:E3)' }
};
XLSX.utils.book_append_sheet(wbInvNew, wsInvNew, 'Inventory');
saveWorkbook(wbInvNew, path.join(__dirname, 'Inventory_Forecast_New.xlsx'));

// -------------------------------------------------------------
// 4. Simple CSV Budget A & B
// -------------------------------------------------------------
const csvA = `Department,Q1_Budget,Q2_Budget,Status
Engineering,150000,160000,Approved
Marketing,80000,85000,Approved
Operations,45000,45000,Approved
Support,30000,32000,Pending`;

const csvB = `Department,Q1_Budget,Q2_Budget,Status
Engineering,150000,175000,Approved
Marketing,80000,85000,Approved
Operations,45000,50000,Approved
Security,60000,65000,New`;

fs.writeFileSync(path.join(__dirname, 'Simple_Budget_A.csv'), csvA, 'utf8');
fs.writeFileSync(path.join(__dirname, 'Simple_Budget_B.csv'), csvB, 'utf8');

console.log('Sample workbooks successfully created!');
