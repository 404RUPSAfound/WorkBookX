import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, AlertCircle, Search, HelpCircle, CheckCircle, Network, ArrowRight } from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { SubNavTabs } from '../components/SubNavTabs.jsx';

export function FormulaAnomaliesPage() {
  const { comparisonData, isLoading } = useComparison();
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');

  if (isLoading) {
    return <LoadingState message="Scanning workbook columns for formula pattern anomalies..." />;
  }

  const anomalies = comparisonData?.formulaAnomalies || [];

  const filtered = anomalies.filter((a) => {
    if (confidenceFilter !== 'ALL' && a.confidence !== confidenceFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        a.cell.toLowerCase().includes(q) ||
        a.sheet.toLowerCase().includes(q) ||
        a.explanation.toLowerCase().includes(q) ||
        a.actualFormula.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (anomalies.length === 0) {
    return (
      <div className="page-container">
        <EmptyState
          icon={CheckCircle}
          title="No Formula Pattern Anomalies"
          description="All column and row calculation patterns appear consistent without unexpected operator shifts or missing formulas."
          actionLabel="View All Formulas"
          actionTo="/formulas"
        />
      </div>
    );
  }

  const riskTabs = [
    { label: 'Risk Findings', path: '/risks', count: comparisonData?.risks?.length || 0, badgeVariant: 'badge-critical' },
    { label: 'Unusual Formulas', path: '/anomalies', count: anomalies.length, badgeVariant: 'badge-warning' },
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
          <h1 className="page-title">Unusual Formulas</h1>
          <p className="page-description">
            Detect formulas that deviate from neighboring rows or columns, or where constants replaced formulas.
          </p>
        </div>

        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search anomalies by cell or sheet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ width: '100%', paddingLeft: '2.1rem', fontSize: '0.75rem' }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="tab-group" style={{ fontSize: '0.6875rem' }}>
          <button
            onClick={() => setConfidenceFilter('ALL')}
            className={`tab-btn ${confidenceFilter === 'ALL' ? 'active' : ''}`}
          >
            All Anomalies ({anomalies.length})
          </button>
          <button
            onClick={() => setConfidenceFilter('HIGH')}
            className={`tab-btn ${confidenceFilter === 'HIGH' ? 'active' : ''}`}
          >
            High Confidence ({anomalies.filter((a) => a.confidence === 'HIGH').length})
          </button>
          <button
            onClick={() => setConfidenceFilter('MEDIUM')}
            className={`tab-btn ${confidenceFilter === 'MEDIUM' ? 'active' : ''}`}
          >
            Medium Confidence ({anomalies.filter((a) => a.confidence === 'MEDIUM').length})
          </button>
        </div>
      </div>

      {/* Anomalies Outlier Ledger Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-hairline)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '12%' }}>Coordinate</th>
              <th style={{ width: '18%' }}>Anomaly Classification</th>
              <th style={{ width: '25%' }}>Expected Column Pattern</th>
              <th style={{ width: '25%' }}>Rogue Value / Formula</th>
              <th style={{ width: '10%' }}>Confidence</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((anomaly) => (
              <tr key={anomaly.id}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  <span className="cell-code">{anomaly.sheet}!{anomaly.cell}</span>
                </td>
                <td>
                  <Badge variant={anomaly.type === 'MISSING_FORMULA_IN_SEQUENCE' ? 'high' : 'medium'}>
                    {anomaly.type.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#1e56f0' }}>
                  <code>{anomaly.expectedPattern}</code>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  <code style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.15rem 0.35rem', borderRadius: 2 }}>
                    {anomaly.actualFormula}
                  </code>
                </td>
                <td>
                  <span style={{ fontWeight: 700, fontSize: '0.75rem', color: anomaly.confidence === 'HIGH' ? 'var(--critical)' : 'var(--high)' }}>
                    {anomaly.confidence}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link to="/graph" className="btn btn-secondary btn-sm">
                    <Network size={11} color="var(--primary)" />
                    <span>Trace</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
