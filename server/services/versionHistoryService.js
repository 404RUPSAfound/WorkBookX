import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const HISTORY_FILE = path.join(DATA_DIR, 'snapshots.json');
const MAX_SNAPSHOTS = 25;

/**
 * Initializes local storage for version history
 */
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([]), 'utf8');
  }
}

/**
 * Reads all stored snapshots from disk
 * @returns {Array<object>}
 */
export function listSnapshots() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('Failed to read snapshots:', err.message);
    return [];
  }
}

/**
 * Saves a new named snapshot of comparison results
 * 
 * @param {object} params
 * @param {string} params.name - user defined snapshot title
 * @param {object} params.analysisData - comparison output
 * @returns {object} created snapshot
 */
export function createSnapshot({ name = 'Unnamed Snapshot', analysisData = {} }) {
  ensureStorage();
  const existing = listSnapshots();

  const id = `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  // Compute deterministic SHA-256 content hash of the comparison changes
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(analysisData.changes || []))
    .digest('hex')
    .substring(0, 16);

  const snapshot = {
    id,
    name: name.trim() || `Snapshot ${timestamp.substring(0, 10)}`,
    timestamp,
    contentHash: hash,
    meta: {
      originalFileName: analysisData.meta?.originalFileName || 'original.xlsx',
      modifiedFileName: analysisData.meta?.modifiedFileName || 'modified.xlsx',
      originalCellCount: analysisData.meta?.originalCellCount || 0,
      modifiedCellCount: analysisData.meta?.modifiedCellCount || 0,
      scope: 'Local Single-User Storage'
    },
    summary: analysisData.summary || {},
    risksCount: (analysisData.risks || []).length,
    risks: (analysisData.risks || []).slice(0, 50),
    // Retain changes up to a safe threshold (capped to avoid runaway disk usage)
    changesSample: (analysisData.changes || []).slice(0, 100),
    totalChangesCount: (analysisData.changes || []).length
  };

  // Prepend new snapshot
  const updated = [snapshot, ...existing];

  // Enforce retention cap (keep newest MAX_SNAPSHOTS)
  if (updated.length > MAX_SNAPSHOTS) {
    updated.splice(MAX_SNAPSHOTS);
  }

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(updated, null, 2), 'utf8');
  return snapshot;
}

/**
 * Retrieves a single snapshot by ID
 */
export function getSnapshot(id) {
  const snapshots = listSnapshots();
  return snapshots.find((s) => s.id === id) || null;
}

/**
 * Deletes a snapshot by ID
 */
export function deleteSnapshot(id) {
  ensureStorage();
  const existing = listSnapshots();
  const filtered = existing.filter((s) => s.id !== id);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(filtered, null, 2), 'utf8');
  return { success: true, remainingCount: filtered.length };
}

/**
 * Compares two existing snapshots and returns their metric deltas
 */
export function compareSnapshots(idA, idB) {
  const snapA = getSnapshot(idA);
  const snapB = getSnapshot(idB);

  if (!snapA || !snapB) {
    throw new Error('One or both snapshots could not be found.');
  }

  const deltaChanges = (snapB.summary.totalChanges || 0) - (snapA.summary.totalChanges || 0);
  const deltaRisks = (snapB.risksCount || 0) - (snapA.risksCount || 0);

  return {
    snapshotA: { id: snapA.id, name: snapA.name, timestamp: snapA.timestamp, changes: snapA.summary.totalChanges || 0 },
    snapshotB: { id: snapB.id, name: snapB.name, timestamp: snapB.timestamp, changes: snapB.summary.totalChanges || 0 },
    comparisonDelta: {
      changesVariance: deltaChanges,
      risksVariance: deltaRisks,
      isIdenticalContent: snapA.contentHash === snapB.contentHash
    }
  };
}
