/**
 * Explainable Risk Engine Service
 * 
 * Deterministic, transparent rules-based risk assessment.
 * Evaluates workbook changes, formula alterations, and graph topology.
 * Produces structured findings with concrete evidence and realistic impact statements.
 */

/**
 * Assesses risks across workbook comparison changes, formula analyses, and graph structure.
 * 
 * @param {object} params
 * @param {Array<object>} params.changes - comparison changes
 * @param {Array<object>} params.formulaAnalyses - formula intelligence records
 * @param {object} params.graphData - dependency graph, cycles, downstream impacts
 * @param {object} params.sheetSummary - added/removed sheets
 * @returns {Array<object>} risk findings ordered by severity
 */
export function evaluateRisks({
  changes = [],
  formulaAnalyses = [],
  graphData = { cycles: [], downstreamImpacts: {} },
  sheetSummary = { removed: [], added: [] }
}) {
  const findings = [];
  let riskCounter = 1;

  // 1. RULE: Circular Dependency Detected (CRITICAL)
  if (graphData.cycles && graphData.cycles.length > 0) {
    for (const cycle of graphData.cycles) {
      findings.push({
        id: `risk-${riskCounter++}`,
        title: 'Circular Dependency Detected in Formula Chain',
        cell: cycle.cycleNodes[0] || 'Unknown',
        sheet: cycle.cycleNodes[0]?.split('!')[0] || 'Unknown',
        severity: 'CRITICAL',
        ruleId: 'RULE_CIRCULAR_REF',
        ruleName: 'Circular Reference Detection',
        evidence: `Circular loop identified along path: ${cycle.cyclePath}`,
        plainExplanation: 'Excel formulas cannot resolve calculations that reference themselves directly or indirectly in a closed loop.',
        potentialImpact: 'May trigger Excel circular calculation warnings, return #VALUE!/0 errors, or enter infinite recalculation loops that distort sheet results.'
      });
    }
  }

  // 2. Process Formula Analyses for Hardcoding, Broken Refs, and Operator Flips
  for (const analysis of formulaAnalyses) {
    const fullRef = analysis.fullRef || `${analysis.sheet}!${analysis.cell}`;

    // RULE: Broken Reference #REF! (CRITICAL)
    if (analysis.hasBrokenRef) {
      findings.push({
        id: `risk-${riskCounter++}`,
        title: 'Broken Cell Reference (#REF!) Introduced',
        cell: analysis.cell,
        sheet: analysis.sheet,
        severity: 'CRITICAL',
        ruleId: 'RULE_BROKEN_REF',
        ruleName: 'Broken Reference Detection',
        evidence: `New formula expression contains invalid reference: "${analysis.newFormula}"`,
        plainExplanation: 'A formula refers to a cell that was deleted, cut, or shifted out of bounds.',
        potentialImpact: 'The cell evaluates to a hard #REF! error, which cascades into every downstream formula that references this cell.'
      });
    }

    // RULE: Dynamic Formula Replaced with Hardcoded Constant (HIGH)
    if (analysis.isConstantOverride) {
      findings.push({
        id: `risk-${riskCounter++}`,
        title: 'Dynamic Calculation Replaced with Static Hardcoded Value',
        cell: analysis.cell,
        sheet: analysis.sheet,
        severity: 'HIGH',
        ruleId: 'RULE_HARDCODED_CONSTANT',
        ruleName: 'Formula Hardcoding Guard',
        evidence: `Previous formula "${analysis.oldFormula}" was eliminated; cell now holds static literal.`,
        plainExplanation: 'An automated calculation logic was manually overridden with a fixed constant value.',
        potentialImpact: 'Subsequent updates to source inputs will not refresh this value, creating silent model staleness and potential reporting discrepancies.'
      });
    }

    // RULE: Mathematical Operator Alteration / Inversion (HIGH)
    if (analysis.oldOperators && analysis.newOperators) {
      const oldOps = analysis.oldOperators.join(' ');
      const newOps = analysis.newOperators.join(' ');
      if (oldOps !== newOps && analysis.oldFormula && analysis.newFormula) {
        let opDescription = `Operators modified from [${oldOps}] to [${newOps}]`;
        let severity = 'HIGH';

        if (analysis.oldOperators.includes('-') && analysis.newOperators.includes('+')) {
          opDescription = 'Subtraction (-) operator replaced with addition (+)';
        } else if (analysis.oldOperators.includes('+') && analysis.newOperators.includes('-')) {
          opDescription = 'Addition (+) operator replaced with subtraction (-)';
        } else if (analysis.oldOperators.includes('*') && analysis.newOperators.includes('/')) {
          opDescription = 'Multiplication (*) operator replaced with division (/)';
        }

        findings.push({
          id: `risk-${riskCounter++}`,
          title: 'Core Arithmetic Operator Inverted',
          cell: analysis.cell,
          sheet: analysis.sheet,
          severity,
          ruleId: 'RULE_OPERATOR_INVERTED',
          ruleName: 'Arithmetic Logic Alteration',
          evidence: `${opDescription}. Old: "${analysis.oldFormula}", New: "${analysis.newFormula}"`,
          plainExplanation: 'The underlying mathematical operation was fundamentally changed, altering how variables combine.',
          potentialImpact: 'May drastically swing calculated totals, margins, taxes, or inventory projections in an unintended direction.'
        });
      }
    }

    // RULE: Dependency Reference Removed from Formula (MEDIUM)
    if (analysis.removedReferences && analysis.removedReferences.length > 0 && !analysis.isConstantOverride) {
      findings.push({
        id: `risk-${riskCounter++}`,
        title: 'Formula Input Reference Removed',
        cell: analysis.cell,
        sheet: analysis.sheet,
        severity: 'MEDIUM',
        ruleId: 'RULE_REFERENCE_REMOVED',
        ruleName: 'Input Dependency Removal',
        evidence: `Removed dependencies on: ${analysis.removedReferences.join(', ')}`,
        plainExplanation: 'The formula was modified to no longer include one or more input cells that previously influenced its result.',
        potentialImpact: 'The formula may now ignore critical cost, volume, or adjustment factors previously accounted for.'
      });
    }
  }

  // 3. RULE: High Downstream Blast Radius (HIGH / MEDIUM)
  const downstreamImpacts = graphData.downstreamImpacts || {};
  for (const [nodeId, impact] of Object.entries(downstreamImpacts)) {
    if (impact.dependentCount >= 5) {
      const [sheet, cell] = nodeId.split('!');
      const isHigh = impact.dependentCount >= 10;

      findings.push({
        id: `risk-${riskCounter++}`,
        title: `High Downstream Calculation Blast Radius (${impact.dependentCount} cells affected)`,
        cell: cell || nodeId,
        sheet: sheet || 'Sheet',
        severity: isHigh ? 'HIGH' : 'MEDIUM',
        ruleId: 'RULE_HIGH_DOWNSTREAM_IMPACT',
        ruleName: 'Downstream Ripple Impact',
        evidence: `Cell modification propagates into ${impact.dependentCount} downstream dependent cells across ${Object.keys(impact.levels || {}).length} dependency tiers.`,
        plainExplanation: 'Changes to this single cell trigger widespread recalculations throughout connected worksheets.',
        potentialImpact: 'Any subtle inaccuracy or rounding divergence here will amplify across numerous reports, dashboards, and rollup totals.'
      });
    }
  }

  // 4. RULE: Entire Sheet Removed (HIGH)
  if (sheetSummary.removed && sheetSummary.removed.length > 0) {
    for (const removedSheet of sheetSummary.removed) {
      findings.push({
        id: `risk-${riskCounter++}`,
        title: `Worksheet "${removedSheet}" Was Completely Removed`,
        cell: 'Entire Sheet',
        sheet: removedSheet,
        severity: 'HIGH',
        ruleId: 'RULE_REMOVED_SHEET',
        ruleName: 'Worksheet Deletion Detection',
        evidence: `Sheet "${removedSheet}" existed in the original workbook but is absent in the updated workbook.`,
        plainExplanation: 'An entire tab containing tables or calculations was deleted.',
        potentialImpact: 'All historical data on this worksheet is lost, and external workbooks or dependent formulas linking to this sheet may break.'
      });
    }
  }

  // Sort findings by severity: CRITICAL > HIGH > MEDIUM > LOW
  const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  findings.sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0));

  return findings;
}
