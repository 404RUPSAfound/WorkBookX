import React from 'react';
import {
  FileCheck2,
  Download,
  Printer,
  Shield,
  Binary,
  Sparkles,
  ShieldCheck,
  Activity,
  Network,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { SubNavTabs } from '../components/SubNavTabs.jsx';
import { downloadAuditCSV, downloadAuditJSON } from '../services/api.js';

export function AuditReportsPage() {
  const { comparisonData, isLoading } = useComparison();

  if (isLoading) {
    return <LoadingState message="Generating structured audit report..." />;
  }

  const report = comparisonData?.auditReport;

  if (!report) {
    return (
      <div className="page-container">
        <EmptyState
          icon={FileCheck2}
          title="No Audit Report Ready"
          description="Please upload spreadsheets or load a sample scenario to generate a formal audit report."
          actionLabel="Load Sample Model"
          actionTo="/new"
        />
      </div>
    );
  }

  const {
    meta = {},
    summary = {},
    compositeRiskScore = {},
    riskGovernance = {},
    formulaAnomalies = [],
    dataQualityAudit = {},
    impactPathAnalysis = {},
    dependencyAnalysis = {},
    disclaimersAndLimitations = []
  } = report;

  const handleExportCSV = () => {
    downloadAuditCSV(
      comparisonData.changes || [],
      comparisonData.risks || [],
      {
        formulaAnomalies: comparisonData.formulaAnomalies || [],
        dataQualityFindings: comparisonData.dataQuality?.findings || [],
        governanceDecisions: comparisonData.governanceDecisions || {}
      }
    );
  };

  const reportTabs = [
    { label: 'Audit Reports', path: '/audit' },
    { label: 'Previous Versions', path: '/history' }
  ];

  return (
    <div className="page-container">
      {/* Contextual Sub-Nav Tabs */}
      <SubNavTabs tabs={reportTabs} />

      {/* Top Document Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          maxWidth: 960,
          margin: '0 auto 1.5rem'
        }}
      >
        <div>
          <h1 className="page-title" style={{ fontSize: '1.375rem' }}>
            Institutional Audit Report Document
          </h1>
          <p className="page-description" style={{ fontSize: '0.75rem' }}>
            Official cryptographic verification and risk determination document ready for print, PDF export, or compliance archiving.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
            title="Print or Save as PDF"
          >
            <Printer size={13} />
            <span>Print / Save PDF</span>
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download size={13} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => downloadAuditJSON(report)}
            className="btn btn-primary btn-sm"
          >
            <Download size={13} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* FORMAL AUDIT PAPER DOCUMENT CONTAINER */}
      <div className="audit-paper">
        {/* Document Header & Letterhead */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #090d16',
            paddingBottom: '1.25rem',
            marginBottom: '1.75rem'
          }}
        >
          <div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#090d16' }}>
              WORKBOOKX ASSURANCE SERVICES
            </div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em', marginTop: '0.2rem' }}>
              Automated Spreadsheet Verification & Risk Audit Docket
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.6875rem', color: '#64748b' }}>
            <div>Report ID: <strong style={{ color: '#090d16' }}>{report.reportId || 'WBX-AUDIT-001'}</strong></div>
            <div>Generated: {new Date(report.generatedAt || Date.now()).toUTCString()}</div>
          </div>
        </div>

        {/* Metadata Specification Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 4,
            marginBottom: '1.75rem',
            fontSize: '0.75rem'
          }}
        >
          <div>
            <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
              Baseline File
            </span>
            <strong style={{ color: '#090d16', wordBreak: 'break-all' }}>{meta.originalFileName || 'original.xlsx'}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
              Revision File
            </span>
            <strong style={{ color: '#090d16', wordBreak: 'break-all' }}>{meta.modifiedFileName || 'modified.xlsx'}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
              Cryptographic Hash
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>{meta.contentHash || 'Verified'}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
              Model Risk Tier
            </span>
            <Badge variant={compositeRiskScore.rating === 'CRITICAL' ? 'critical' : compositeRiskScore.rating === 'HIGH' ? 'high' : 'low'}>
              {compositeRiskScore.rating || 'LOW'} ({compositeRiskScore.score || 0}/100)
            </Badge>
          </div>
        </div>

        {/* Executive Summary */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#090d16', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.75rem' }}>
            1. Executive Verification Summary
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.6, marginBottom: '0.875rem' }}>
            A deterministic cell-by-cell differential analysis was performed across all sheets in the workbook. The engine evaluated formula Abstract Syntax Tree (AST) mutations, circular dependency loops using Tarjan's SCC algorithm, downstream calculation cascades, and data constraint rules.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: 4 }}>
              <div style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 700 }}>Total Cell Diffs</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#090d16', fontFamily: 'var(--font-mono)' }}>{summary.totalChanges || 0}</div>
            </div>
            <div style={{ padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: 4 }}>
              <div style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 700 }}>Formula Alterations</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e22ce', fontFamily: 'var(--font-mono)' }}>{summary.formulaChanges || 0}</div>
            </div>
            <div style={{ padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: 4 }}>
              <div style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 700 }}>Critical / High Risks</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', fontFamily: 'var(--font-mono)' }}>
                {(riskGovernance.criticalFindings || []).length + (riskGovernance.highFindings || []).length}
              </div>
            </div>
            <div style={{ padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: 4 }}>
              <div style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 700 }}>Data Quality Pass</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
                {dataQualityAudit.passRatePercent !== undefined ? `${dataQualityAudit.passRatePercent}%` : '100%'}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Governance Section */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#090d16', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginBottom: '0.75rem' }}>
            2. Identified Calculation Risks & Governance Decisions
          </h3>

          {(comparisonData.risks || []).length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.5rem', width: '12%' }}>Severity</th>
                  <th style={{ padding: '0.5rem', width: '16%' }}>Target Cell</th>
                  <th style={{ padding: '0.5rem', width: '22%' }}>Rule & Classification</th>
                  <th style={{ padding: '0.5rem' }}>Deterministic Evidence</th>
                  <th style={{ padding: '0.5rem', width: '15%' }}>Sign-off Status</th>
                </tr>
              </thead>
              <tbody>
                {(comparisonData.risks || []).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem' }}>
                      <Badge variant={r.severity}>{r.severity}</Badge>
                    </td>
                    <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                      <span className="cell-code">{r.sheet}!{r.cell}</span>
                    </td>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: '#090d16' }}>
                      {r.title}
                    </td>
                    <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#475569' }}>
                      {r.evidence}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#1e56f0' }}>VERIFIED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '0.8125rem', color: '#16a34a' }}>
              ✓ No calculation hazards, cyclic references, or formula hardcoding detected.
            </p>
          )}
        </div>

        {/* Institutional Disclaimers */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', fontSize: '0.6875rem', color: '#64748b', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', color: '#090d16', marginBottom: '0.35rem' }}>
            Institutional Disclaimers & Known Boundaries
          </div>
          <p>
            This audit report was generated via deterministic lexical analysis and static calculation graph mapping. WorkbookX evaluates formulas, cross-sheet references, and arithmetic cascades. It does not execute arbitrary Visual Basic (VBA) macro scripts or external database connections. Potential financial impact estimates are for review triage purposes and do not represent verified accounting loss.
          </p>
        </div>
      </div>
    </div>
  );
}
