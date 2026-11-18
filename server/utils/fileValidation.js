import path from 'path';

// Maximum allowed upload size in megabytes
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '15', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Permitted spreadsheet extensions
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv']);

// Permitted spreadsheet MIME types
const ALLOWED_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'text/plain',
  'application/octet-stream' // sometimes sent by browsers for csv/xlsx
]);

/**
 * Validates an uploaded file object from multer
 * @param {Express.Multer.File} file
 * @param {string} label - human readable label (e.g. "Original Workbook")
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUploadedFile(file, label = 'File') {
  if (!file) {
    return { valid: false, error: `${label} was not provided.` };
  }

  // 1. Check file size
  if (file.size === 0) {
    return { valid: false, error: `${label} is empty (0 bytes). Please upload a valid workbook.` };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `${label} exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB.`
    };
  }

  // 2. Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `${label} has an unsupported file extension (${ext || 'none'}). Supported formats: .xlsx, .xls, .csv.`
    };
  }

  // 3. Check MIME type (soft check, since some OS report generic octet-stream)
  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    // If extension is valid .xlsx or .csv we permit it, else fail
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return {
        valid: false,
        error: `${label} has an invalid MIME type (${file.mimetype}).`
      };
    }
  }

  // 4. Sanitize original filename against path traversal
  const safeBaseName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safeBaseName || safeBaseName.length === 0) {
    return { valid: false, error: `${label} has an invalid filename.` };
  }

  return { valid: true };
}
