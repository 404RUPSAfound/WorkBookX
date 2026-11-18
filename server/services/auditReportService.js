/**
 * Audit Report Service
 * 
 * Compiles end-to-end spreadsheet comparison intelligence into
 * auditable JSON reports and CSV change logs.
 */

/**
 * Builds the master audit report data object.
 * 
 * @param {object} params
 * @param {string} params.originalFileName
 * @param {string} params.modifiedFileName
 * @param {object} params.summary
 * @param {Array<object>} params.changes
 * @param {Array<object>} params.formulaAnalyses
 * @param {object} params.graphData
 * @param {Array<object>} params.risks
 * @returns {object} structured audit report
 */
export function generateAuditReport({
  originalFileName = 'original.xlsx',
  modifiedFileName = 'modified.xlsx',
  summary = {},
  changes = [],
  formulaAnalyses = [],
  graphData = {},
  risks = [],
  impactAnalysis = {},
  formulaAnomalies = [],
  dataQuality = {},
  riskIndex = {},
  governanceDecisions = {}
}) {
  const generatedAt = new Date().toISOString();

  return {
    meta: {
      platform: 'WorkbookX — Explainable Spreadsheet Change Intelligence',
      version: '2.0.0',
      generatedAt,
      originalFile: originalFileName,
      modifiedFile: modifiedFileName,
      engine: 'Deterministic AST, Graph Topology & Risk Governance'
    },
    compositeRiskScore: riskIndex,
    summary: {
      totalChanges: summary.totalChanges || 0,
      addedCells: summary.addedCells || 0,
      removedCells: summary.removedCells || 0,
      modifiedValues: summary.modifiedValues || 0,
      formulaChanges: summary.formulaChanges || 0,
      sheets: summary.sheetSummary || {},
      criticalRisks: risks.filter(r => r.severity === 'CRITICAL').length,
      highRisks: risks.filter(r => r.severity === 'HIGH').length,
      mediumRisks: risks.filter(r => r.severity === 'MEDIUM').length,
      lowRisks: risks.filter(r => r.severity === 'LOW').length,
      formulaAnomaliesCount: formulaAnomalies.length,
      dataQualityFailuresCount: dataQuality.failedChecksCount || 0
    },
    riskGovernance: {
      totalFindings: risks.length,
      decisionsMap: governanceDecisions,
      findings: risks.map(r => ({
        ...r,
        governanceStatus: governanceDecisions[r.id]?.status || 'OPEN',
        reviewerComment: governanceDecisions[r.id]?.comment || null
      }))
    },
    impactPathAnalysis: {
      globalMaxDepth: impactAnalysis.globalMaxDepth || 0,
      highestImpactCell: impactAnalysis.highestImpactCell || null,
      maxAffectedCount: impactAnalysis.maxAffectedCount || 0,
      cyclicComponents: impactAnalysis.cyclicComponents || []
    },
    formulaAnomalies,
    dataQualityAudit: dataQuality,
    formulaModifications: formulaAnalyses,
    dependencyAnalysis: {
      totalNodes: graphData.totalNodes || 0,
      totalEdges: graphData.totalEdges || 0,
      circularDependencyCount: (graphData.cycles || []).length,
      circularPaths: (graphData.cycles || []).map(c => c.cyclePath),
      explanation: graphData.explanation || ''
    },
    detailedChanges: changes,
    disclaimersAndLimitations: [
      'WorkbookX evaluates deterministic formula syntax and dependency topology for supported Excel formulas.',
      'Potential risk impacts are heuristic warnings to assist human review, not verified financial losses or audit guarantees.',
      'Unsupported complex VBA macros, external database data connections, and dynamic array lambda formulas are not recalculated.'
    ]
  };
}

/**
 * Converts comparison changes and risk findings into CSV format.
 * 
 * @param {Array<object>} changes - cell changes
 * @param {Array<object>} risks - risk findings
 * @returns {string} CSV text
 */
export function generateAuditCSV(changes = [], risks = [], extra = {}) {
  const sanitize = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = [];

  // Section 1: Risk Findings
  lines.push('=== WORKBOOKX RISK FINDINGS ===');
  lines.push(['Risk ID', 'Severity', 'Governance Status', 'Sheet', 'Cell', 'Rule Name', 'Plain Explanation', 'Evidence', 'Potential Impact'].map(sanitize).join(','));
  for (const r of risks) {
    lines.push([
      r.id,
      r.severity,
      extra.governanceDecisions?.[r.id]?.status || 'OPEN',
      r.sheet,
      r.cell,
      r.ruleName,
      r.plainExplanation,
      r.evidence,
      r.potentialImpact
    ].map(sanitize).join(','));
  }

  lines.push(''); // blank row separator

  // Section 2: Formula Anomalies (if present)
  if (extra.formulaAnomalies && extra.formulaAnomalies.length > 0) {
    lines.push('=== FORMULA PATTERN ANOMALIES ===');
    lines.push(['Anomaly ID', 'Sheet', 'Cell', 'Type', 'Confidence', 'Actual Formula', 'Expected Pattern', 'Explanation'].map(sanitize).join(','));
    for (const a of extra.formulaAnomalies) {
      lines.push([
        a.id,
        a.sheet,
        a.cell,
        a.type,
        a.confidence,
        a.actualFormula,
        a.expectedPattern,
        a.explanation
      ].map(sanitize).join(','));
    }
    lines.push('');
  }

  // Section 3: Data Quality Findings (if present)
  if (extra.dataQualityFindings && extra.dataQualityFindings.length > 0) {
    lines.push('=== DATA QUALITY FINDINGS ===');
    lines.push(['ID', 'Sheet', 'Cell', 'Rule', 'Severity', 'Value', 'Message'].map(sanitize).join(','));
    for (const dq of extra.dataQualityFindings) {
      lines.push([
        dq.id,
        dq.sheet,
        dq.cell,
        dq.ruleName,
        dq.severity,
        dq.value,
        dq.message
      ].map(sanitize).join(','));
    }
    lines.push('');
  }

  // Section 4: Detailed Changes
  lines.push('=== DETAILED CELL CHANGES ===');
  lines.push(['Change ID', 'Sheet', 'Cell', 'Change Type', 'Old Value', 'New Value', 'Old Formula', 'New Formula', 'Value Diff'].map(sanitize).join(','));
  for (const c of changes) {
    lines.push([
      c.id,
      c.sheet,
      c.cell,
      c.changeType,
      c.oldValue,
      c.newValue,
      c.oldFormula || '',
      c.newFormula || '',
      c.valueDiff !== null ? c.valueDiff : ''
    ].map(sanitize).join(','));
  }

  return lines.join('\r\n');
}
