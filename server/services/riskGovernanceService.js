import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const GOVERNANCE_FILE = path.join(DATA_DIR, 'risk_decisions.json');

/**
 * Initializes governance decisions storage
 */
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(GOVERNANCE_FILE)) {
    fs.writeFileSync(GOVERNANCE_FILE, JSON.stringify({}), 'utf8');
  }
}

/**
 * Reads all stored risk decisions
 * @returns {Record<string, object>}
 */
export function getAllRiskDecisions() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(GOVERNANCE_FILE, 'utf8');
    return JSON.parse(raw) || {};
  } catch (err) {
    console.error('Failed to read risk decisions:', err.message);
    return {};
  }
}

/**
 * Updates governance status for a specific risk finding.
 * 
 * @param {string} riskId - finding ID (e.g. "risk-1")
 * @param {object} decision
 * @param {'OPEN' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESOLVED'} decision.status
 * @param {string} decision.reviewer - e.g. "Lead Financial Auditor"
 * @param {string} decision.comment - reviewer explanation
 * @param {string} decision.reason - justification
 * @returns {object} updated decision record
 */
export function updateRiskDecision(riskId, {
  status = 'UNDER_REVIEW',
  reviewer = 'Auditor',
  comment = '',
  reason = ''
} = {}) {
  ensureStorage();
  const allDecisions = getAllRiskDecisions();
  const timestamp = new Date().toISOString();

  const existing = allDecisions[riskId] || {
    riskId,
    status: 'OPEN',
    history: []
  };

  const historyEntry = {
    timestamp,
    previousStatus: existing.status,
    newStatus: status,
    reviewer,
    comment,
    reason
  };

  const updatedRecord = {
    riskId,
    status,
    reviewer,
    lastUpdated: timestamp,
    comment,
    reason,
    history: [historyEntry, ...(existing.history || [])]
  };

  allDecisions[riskId] = updatedRecord;
  fs.writeFileSync(GOVERNANCE_FILE, JSON.stringify(allDecisions, null, 2), 'utf8');

  return updatedRecord;
}

/**
 * Computes the transparent Composite Model Risk Index (0-100).
 * Documented additive methodology based on deterministic risk factors.
 * 
 * @param {Array<object>} risks - risk findings
 * @param {object} impactAnalysis - impact path intelligence
 * @returns {{
 *   score: number,
 *   rating: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL',
 *   methodology: string,
 *   breakdown: Record<string, number>
 * }}
 */
export function calculateCompositeRiskIndex(risks = [], impactAnalysis = {}) {
  let score = 0;
  const breakdown = {
    criticalRisksPoints: 0,
    highRisksPoints: 0,
    mediumRisksPoints: 0,
    blastRadiusPoints: 0,
    depthPoints: 0
  };

  const criticalCount = risks.filter((r) => r.severity === 'CRITICAL').length;
  const highCount = risks.filter((r) => r.severity === 'HIGH').length;
  const mediumCount = risks.filter((r) => r.severity === 'MEDIUM').length;

  // 1. Critical risks (+25 pts each, max 50)
  breakdown.criticalRisksPoints = Math.min(50, criticalCount * 25);
  score += breakdown.criticalRisksPoints;

  // 2. High risks (+15 pts each, max 30)
  breakdown.highRisksPoints = Math.min(30, highCount * 15);
  score += breakdown.highRisksPoints;

  // 3. Medium risks (+5 pts each, max 15)
  breakdown.mediumRisksPoints = Math.min(15, mediumCount * 5);
  score += breakdown.mediumRisksPoints;

  // 4. Downstream Blast Radius: if any changed cell feeds into >= 10 cells (+15 pts) or >= 5 (+8 pts)
  const maxAffected = impactAnalysis.maxAffectedCount || 0;
  if (maxAffected >= 10) {
    breakdown.blastRadiusPoints = 15;
  } else if (maxAffected >= 5) {
    breakdown.blastRadiusPoints = 8;
  }
  score += breakdown.blastRadiusPoints;

  // 5. Dependency Depth: if deep chain >= 4 tiers (+10 pts)
  const maxDepth = impactAnalysis.globalMaxDepth || 0;
  if (maxDepth >= 4) {
    breakdown.depthPoints = 10;
  } else if (maxDepth >= 2) {
    breakdown.depthPoints = 5;
  }
  score += breakdown.depthPoints;

  // Normalize final score [0, 100]
  const finalScore = Math.min(100, Math.max(0, score));

  let rating = 'LOW';
  if (finalScore >= 70) rating = 'CRITICAL';
  else if (finalScore >= 45) rating = 'HIGH';
  else if (finalScore >= 20) rating = 'MODERATE';

  return {
    score: finalScore,
    rating,
    methodology: 'Transparent Additive Model Risk Scoring: Critical (+25), High (+15), Medium (+5), High Blast Radius (+15), Deep Dependency Cascade (+10). Capped at 100.',
    breakdown
  };
}
