import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Filter,
  CheckCircle2,
  UserCheck,
  MessageSquare,
  X,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import { updateGovernanceDecision } from '../services/api.js';
import { Badge } from '../components/Badge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { SubNavTabs } from '../components/SubNavTabs.jsx';

export function RiskFindingsPage() {
  const { comparisonData, isLoading } = useComparison();
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Local governance state overrides
  const [governanceMap, setGovernanceMap] = useState({});
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [reviewerName, setReviewerName] = useState('Audit Lead');
  const [reviewerComment, setReviewerComment] = useState('');
  const [reviewerStatus, setReviewerStatus] = useState('UNDER_REVIEW');
  const [isUpdating, setIsUpdating] = useState(false);

  if (isLoading) {
    return <LoadingState message="Running deterministic risk evaluation rules..." />;
  }

  const risks = comparisonData?.risks || [];
  const riskIndex = comparisonData?.riskIndex || { score: 0, rating: 'LOW', breakdown: {} };
  const initialGovernance = comparisonData?.governanceDecisions || {};

  const handleOpenReview = (risk) => {
    setActiveReviewId(risk.id);
    const existing = governanceMap[risk.id] || initialGovernance[risk.id] || {};
    setReviewerStatus(existing.status || 'UNDER_REVIEW');
    setReviewerComment(existing.comment || '');
    setReviewerName(existing.reviewer || 'Auditor');
  };

  const handleSaveDecision = async (e) => {
    e.preventDefault();
    if (!activeReviewId) return;
    setIsUpdating(true);
    try {
      const updated = await updateGovernanceDecision(activeReviewId, {
        status: reviewerStatus,
        reviewer: reviewerName,
        comment: reviewerComment,
        reason: 'Governance action recorded in console'
      });
      setGovernanceMap((prev) => ({ ...prev, [activeReviewId]: updated }));
      setActiveReviewId(null);
    } catch (err) {
      alert(`Failed to save governance decision: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRisks = risks.filter((r) => {
    if (selectedSeverity !== 'ALL' && r.severity !== selectedSeverity) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.plainExplanation.toLowerCase().includes(q) ||
        r.evidence.toLowerCase().includes(q) ||
        r.ruleName.toLowerCase().includes(q) ||
        (r.cell || '').toLowerCase().includes(q) ||
        (r.sheet || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countBySeverity = {
    CRITICAL: risks.filter((r) => r.severity === 'CRITICAL').length,
    HIGH: risks.filter((r) => r.severity === 'HIGH').length,
    MEDIUM: risks.filter((r) => r.severity === 'MEDIUM').length,
    LOW: risks.filter((r) => r.severity === 'LOW').length
  };

  const riskTabs = [
    { label: 'Risk Findings', path: '/risks', count: risks.length, badgeVariant: 'badge-critical' },
    { label: 'Unusual Formulas', path: '/anomalies', count: comparisonData?.formulaAnomalies?.length || 0, badgeVariant: 'badge-warning' },
    { label: 'Data Quality Check', path: '/data-quality', count: comparisonData?.dataQuality?.failedChecksCount || 0, badgeVariant: 'badge-critical' }
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
          <h1 className="page-title">Risk Findings & Review Status</h1>
          <p className="page-description">
            Review identified calculation risks, assign review status, and track approval sign-offs.
          </p>
        </div>

        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search risk rules or cells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ width: '100%', paddingLeft: '2.1rem', fontSize: '0.75rem' }}
          />
        </div>
      </div>

      {/* COMPOSITE RISK SCORE COMMAND STRIP */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-subtle)' }}>
              Model Risk Governance Index
            </span>
            <Badge variant={riskIndex.rating === 'CRITICAL' ? 'critical' : riskIndex.rating === 'HIGH' ? 'high' : 'low'}>
              {riskIndex.rating || riskIndex.category || 'LOW'} RISK
            </Badge>
          </div>

          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, fontFamily: 'var(--font-mono)' }}>
            {riskIndex.score ?? riskIndex.compositeScore ?? 0} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-subtle)' }}>/ 100</span>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', maxWidth: 560 }}>
            {riskIndex.methodology || 'Additive formula: min(100, BaseRisk + BlastRadiusPenalty + CyclePenalty + AnomalyPenalty + DQPenalty)'}
          </p>
        </div>

        {/* Transparent Score Breakdown Ribbons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.45rem 0.65rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '0.6875rem' }}>
            Base Risk: <strong style={{ color: 'var(--text-main)' }}>+{riskIndex.breakdown?.baseRisk || riskIndex.breakdown?.criticalRisksPoints || 0} pts</strong>
          </div>
          <div style={{ padding: '0.45rem 0.65rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '0.6875rem' }}>
            Blast Radius: <strong style={{ color: 'var(--text-main)' }}>+{riskIndex.breakdown?.blastRadiusPenalty || riskIndex.breakdown?.blastRadiusPoints || 0} pts</strong>
          </div>
          <div style={{ padding: '0.45rem 0.65rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '0.6875rem' }}>
            Cycles: <strong style={{ color: 'var(--text-main)' }}>+{riskIndex.breakdown?.cyclePenalty || 0} pts</strong>
          </div>
        </div>
      </div>

      {/* Severity Tabs */}
      <div style={{ marginBottom: '1rem' }}>
        <div className="tab-group" style={{ fontSize: '0.6875rem' }}>
          <button
            onClick={() => setSelectedSeverity('ALL')}
            className={`tab-btn ${selectedSeverity === 'ALL' ? 'active' : ''}`}
          >
            All Findings ({risks.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('CRITICAL')}
            className={`tab-btn ${selectedSeverity === 'CRITICAL' ? 'active' : ''}`}
          >
            Critical ({countBySeverity.CRITICAL})
          </button>
          <button
            onClick={() => setSelectedSeverity('HIGH')}
            className={`tab-btn ${selectedSeverity === 'HIGH' ? 'active' : ''}`}
          >
            High ({countBySeverity.HIGH})
          </button>
          <button
            onClick={() => setSelectedSeverity('MEDIUM')}
            className={`tab-btn ${selectedSeverity === 'MEDIUM' ? 'active' : ''}`}
          >
            Medium ({countBySeverity.MEDIUM})
          </button>
          <button
            onClick={() => setSelectedSeverity('LOW')}
            className={`tab-btn ${selectedSeverity === 'LOW' ? 'active' : ''}`}
          >
            Low ({countBySeverity.LOW})
          </button>
        </div>
      </div>

      {/* STRUCTURED RISK INVESTIGATION DOCKET TABLE */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-hairline)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '10%' }}>Severity</th>
              <th style={{ width: '14%' }}>Target Cell</th>
              <th style={{ width: '22%' }}>Rule & Classification</th>
              <th>Deterministic Evidence & Plain Explanation</th>
              <th style={{ width: '14%' }}>Governance Status</th>
              <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRisks.length > 0 ? (
              filteredRisks.map((finding) => {
                const decision = governanceMap[finding.id] || initialGovernance[finding.id] || {};
                const status = decision.status || 'OPEN';

                return (
                  <tr key={finding.id}>
                    <td>
                      <Badge variant={finding.severity}>
                        {finding.severity}
                      </Badge>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className="cell-code">{finding.sheet}!{finding.cell}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.8125rem' }}>
                        {finding.title}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>
                        {finding.ruleName} ({finding.ruleId})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-main)', backgroundColor: '#f8fafc', padding: '0.2rem 0.4rem', borderRadius: 2, marginBottom: '0.3rem', wordBreak: 'break-all' }}>
                        {finding.evidence}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-body)', lineHeight: 1.4 }}>
                        {finding.plainExplanation}
                      </div>
                      {decision.comment && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.6875rem', color: 'var(--primary)', fontStyle: 'italic' }}>
                          Auditor Note: "{decision.comment}" — {decision.reviewer}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant={status === 'APPROVED' ? 'low' : status === 'REJECTED' ? 'critical' : 'info'}>
                        {status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenReview(finding)}
                        className="btn btn-secondary btn-sm"
                      >
                        <UserCheck size={11} />
                        <span>Sign Off</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
                  No risk findings match your active filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal Dialog */}
      {activeReviewId && (
        <div className="modal-backdrop" onClick={() => setActiveReviewId(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Governance Sign-off</h3>
              <button
                type="button"
                onClick={() => setActiveReviewId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDecision}>
              <div className="modal-body">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
                  Target Finding: <strong style={{ color: 'var(--text-main)' }}>{activeReviewId}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Governance Status</label>
                  <select
                    value={reviewerStatus}
                    onChange={(e) => setReviewerStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="OPEN">Open (Unreviewed)</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved (Accepted Risk)</option>
                    <option value="REJECTED">Rejected (Must Be Fixed)</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Reviewer Name</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Audit Notes / Justification</label>
                  <textarea
                    value={reviewerComment}
                    onChange={(e) => setReviewerComment(e.target.value)}
                    className="form-textarea"
                    rows={3}
                    placeholder="Document the justification for this risk determination..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setActiveReviewId(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn btn-primary btn-sm"
                >
                  {isUpdating ? 'Recording...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
