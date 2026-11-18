import React, { useState } from 'react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Plus, Filter, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import { validateDataQuality } from '../services/api.js';
import { Badge } from '../components/Badge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { SubNavTabs } from '../components/SubNavTabs.jsx';

export function DataQualityPage() {
  const { comparisonData, isLoading: contextLoading } = useComparison();

  const [activeDQ, setActiveDQ] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // New Rule Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [ruleName, setRuleName] = useState('Non-Negative Cost Check');
  const [ruleType, setRuleType] = useState('NON_NEGATIVE');
  const [targetColumn, setTargetColumn] = useState('Amount');
  const [severity, setSeverity] = useState('HIGH');

  const dqData = activeDQ || comparisonData?.dataQuality || {
    totalChecksPerformed: 0,
    passedChecksCount: 0,
    failedChecksCount: 0,
    passRatePercent: 100,
    findings: [],
    activeRules: []
  };

  const handleAddCustomRule = async (e) => {
    e.preventDefault();
    setIsEvaluating(true);

    const newRule = {
      id: `custom-rule-${Date.now()}`,
      type: ruleType,
      ruleName,
      columns: [targetColumn.trim()],
      severity,
      explanation: `Configured validation check for column ${targetColumn}.`
    };

    const existingRules = dqData.activeRules || [];
    const updatedRules = [...existingRules, newRule];

    try {
      const result = await validateDataQuality(updatedRules);
      setActiveDQ(result);
      setShowAddModal(false);
    } catch (err) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (contextLoading) {
    return <LoadingState message="Checking data quality and constraint compliance..." />;
  }

  const riskTabs = [
    { label: 'Risk Findings', path: '/risks', count: comparisonData?.risks?.length || 0, badgeVariant: 'badge-critical' },
    { label: 'Unusual Formulas', path: '/anomalies', count: comparisonData?.formulaAnomalies?.length || 0, badgeVariant: 'badge-warning' },
    { label: 'Data Quality Check', path: '/data-quality', count: dqData.failedChecksCount, badgeVariant: 'badge-critical' }
  ];

  return (
    <div className="page-container">
      {/* Contextual Sub-Nav Tabs */}
      <SubNavTabs tabs={riskTabs} />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <h1 className="page-title">Data Quality Check</h1>
          <p className="page-description">
            Audit cell value domains, verify required non-blank records, and detect unexpected data formats.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
          <Plus size={13} />
          <span>Add Custom Constraint</span>
        </button>
      </div>

      {/* METRIC RIBBON */}
      <div className="metric-ribbon">
        <div className="metric-ribbon-col">
          <div className="metric-ribbon-label">Checks Evaluated</div>
          <div className="metric-ribbon-val">{dqData.totalChecksPerformed}</div>
          <div className="metric-ribbon-sub">Across all cell rows</div>
        </div>

        <div className="metric-ribbon-col">
          <div className="metric-ribbon-label">Fully Valid Cells</div>
          <div className="metric-ribbon-val" style={{ color: '#16a34a' }}>{dqData.passedChecksCount}</div>
          <div className="metric-ribbon-sub">Conform to constraints</div>
        </div>

        <div className="metric-ribbon-col">
          <div className="metric-ribbon-label">Quality Exceptions</div>
          <div className="metric-ribbon-val" style={{ color: dqData.failedChecksCount > 0 ? 'var(--critical)' : 'var(--low)' }}>
            {dqData.failedChecksCount}
          </div>
          <div className="metric-ribbon-sub">Requiring verification</div>
        </div>

        <div className="metric-ribbon-col">
          <div className="metric-ribbon-label">Compliance Index</div>
          <div className="metric-ribbon-val" style={{ color: 'var(--primary)' }}>{dqData.passRatePercent}%</div>
          <div className="metric-ribbon-sub">Composite pass rate</div>
        </div>
      </div>

      {/* Findings Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-hairline)' }}>
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.04em' }}>
            Data Quality Exceptions ({dqData.findingsCount || dqData.failedChecksCount || 0})
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>
            Deterministic rule validations
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '12%' }}>Severity</th>
              <th style={{ width: '15%' }}>Coordinate</th>
              <th style={{ width: '25%' }}>Rule Triggered</th>
              <th style={{ width: '16%' }}>Offending Value</th>
              <th>Rule Explanation</th>
            </tr>
          </thead>
          <tbody>
            {(dqData.findings || []).length > 0 ? (
              (dqData.findings || []).map((row, i) => (
                <tr key={row.id || i}>
                  <td>
                    <Badge variant={row.severity}>{row.severity}</Badge>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    <span className="cell-code">{row.sheet}!{row.cell}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {row.ruleName}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    <code style={{ color: 'var(--critical)', backgroundColor: 'var(--critical-bg)', padding: '0.15rem 0.35rem', borderRadius: 2 }}>
                      {String(row.value)}
                    </code>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-body)' }}>
                    {row.message}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
                  Zero data quality exceptions found across all evaluated worksheets.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Custom Rule Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Define New Quality Rule</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomRule}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Rule Title</label>
                  <input
                    type="text"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Constraint Type</label>
                  <select
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value)}
                    className="form-select"
                  >
                    <option value="NON_NEGATIVE">Non-Negative Value Check</option>
                    <option value="REQUIRED">Required Field (No Blanks)</option>
                    <option value="DUPLICATE">Unique Values (No Duplicates)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Column Name or Header (e.g. B, Amount, SKU)</label>
                  <input
                    type="text"
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Flag Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="form-select"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="WARNING">Warning</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEvaluating}
                  className="btn btn-primary btn-sm"
                >
                  {isEvaluating ? 'Evaluating...' : 'Apply & Run Check'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
