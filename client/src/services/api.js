/**
 * API Service for WorkbookX Frontend
 * Communicates with Express backend
 */

const API_BASE = '/api';

/**
 * Health check endpoint
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend service is unreachable.');
  return res.json();
}

/**
 * Compares two uploaded spreadsheet files
 */
export async function compareFiles(originalFile, modifiedFile) {
  const formData = new FormData();
  formData.append('original', originalFile);
  formData.append('modified', modifiedFile);

  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to compare spreadsheets.');
  }

  return data.data;
}

/**
 * Loads and compares bundled sample files
 */
export async function compareSamples(sampleKey = 'financial') {
  const res = await fetch(`${API_BASE}/compare-samples`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sampleKey })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to analyze sample spreadsheets.');
  }

  return data.data;
}

/**
 * Simulates a What-If scenario
 */
export async function simulateScenario({ scenarioName, overrides, sampleKey }) {
  const res = await fetch(`${API_BASE}/scenario/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioName, overrides, sampleKey })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to run What-If simulation.');
  }

  return data.data;
}

/**
 * Evaluates custom data quality validation rules
 */
export async function validateDataQuality(rules) {
  const res = await fetch(`${API_BASE}/data-quality/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to evaluate data quality.');
  }

  return data.data;
}

/**
 * Lists all version snapshots
 */
export async function listHistorySnapshots() {
  const res = await fetch(`${API_BASE}/history`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch version history.');
  }
  return data.data;
}

/**
 * Creates a new version snapshot
 */
export async function createHistorySnapshot(name, analysisData) {
  const res = await fetch(`${API_BASE}/history/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, analysisData })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to save snapshot.');
  }
  return data.data;
}

/**
 * Deletes a snapshot by ID
 */
export async function deleteHistorySnapshot(id) {
  const res = await fetch(`${API_BASE}/history/snapshot/${id}`, {
    method: 'DELETE'
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete snapshot.');
  }
  return data.data;
}

/**
 * Compares two snapshots
 */
export async function compareHistorySnapshots(idA, idB) {
  const res = await fetch(`${API_BASE}/history/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idA, idB })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to compare snapshots.');
  }
  return data.data;
}

/**
 * Updates governance status for a risk finding
 */
export async function updateGovernanceDecision(riskId, { status, reviewer, comment, reason }) {
  const res = await fetch(`${API_BASE}/risk/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ riskId, status, reviewer, comment, reason })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update governance decision.');
  }
  return data.data;
}

/**
 * Downloads comparison findings as a CSV file
 */
export async function downloadAuditCSV(changes, risks, extra) {
  const res = await fetch(`${API_BASE}/export/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes, risks, extra })
  });

  if (!res.ok) throw new Error('Failed to download CSV export.');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workbookx-audit-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Downloads full audit report as a JSON file
 */
export async function downloadAuditJSON(report) {
  const res = await fetch(`${API_BASE}/export/json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report })
  });

  if (!res.ok) throw new Error('Failed to download JSON export.');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workbookx-report-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
