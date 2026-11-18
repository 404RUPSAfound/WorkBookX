import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  ArrowRight,
  UploadCloud,
  Play,
  AlertTriangle,
  CheckCircle2,
  FileDiff,
  ShieldAlert,
  Binary,
  FileCheck2,
  Sliders,
  Layers,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import { FileDropzone } from '../components/FileDropzone.jsx';
import { Badge } from '../components/Badge.jsx';
import { LoadingState } from '../components/LoadingState.jsx';

export function OverviewPage() {
  const { comparisonData, isLoading, loadSample, uploadAndCompare, error: contextError } = useComparison();
  const navigate = useNavigate();

  // Local state for on-page quick comparison
  const [originalFile, setOriginalFile] = useState(null);
  const [modifiedFile, setModifiedFile] = useState(null);
  const [localError, setLocalError] = useState(null);

  const handleCompareSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!originalFile) {
      setLocalError('Please upload the original (baseline) workbook.');
      return;
    }
    if (!modifiedFile) {
      setLocalError('Please upload the modified (updated) workbook.');
      return;
    }

    try {
      await uploadAndCompare(originalFile, modifiedFile);
      navigate('/results');
    } catch (err) {
      setLocalError(err.message || 'Comparison failed. Please verify the files.');
    }
  };

  const handleSampleClick = async (sampleKey) => {
    setLocalError(null);
    try {
      await loadSample(sampleKey);
    } catch (err) {
      setLocalError(err.message || 'Failed to load sample dataset.');
    }
  };

  if (isLoading) {
    return <LoadingState message="Analyzing spreadsheet differential topology and formula syntax..." />;
  }

  const hasData = Boolean(comparisonData?.meta?.originalFileName);
  const summary = comparisonData?.summary || {};
  const risks = comparisonData?.risks || [];
  const meta = comparisonData?.meta || {};
  const changes = comparisonData?.changes || [];

  const criticalRisks = risks.filter((r) => r.severity === 'CRITICAL');
  const highRisks = risks.filter((r) => r.severity === 'HIGH');
  const urgentRisks = [...criticalRisks, ...highRisks];

  const glassCardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    borderRadius: 'var(--radius-lg)'
  };

  return (
    <div className="page-container" style={{ maxWidth: 1120, margin: '0 auto' }}>
      {/* Editorial Header */}
      <div
        style={{
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          paddingBottom: '1.75rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--primary)',
              marginBottom: '0.4rem'
            }}
          >
            <Layers size={14} />
            <span>Spreadsheet Intelligence</span>
          </div>
          <h1 className="page-title" style={{ fontSize: '2.1rem', fontWeight: 800 }}>
            Workbook Change Analysis & Risk Review
          </h1>
          <p className="page-description" style={{ maxWidth: 680, fontSize: '0.95rem' }}>
            Compare Excel and CSV workbooks with precision. Understand cell-level differences,
            trace formula modifications, and uncover calculation risks before they impact decisions.
          </p>
        </div>

        {/* Quick Demo Switchers */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleSampleClick('financial')}
            className="btn btn-secondary"
            title="Load demo financial model with formula changes & circular loop"
          >
            <Play size={14} color="var(--primary)" />
            <span>Try Financial Demo</span>
          </button>
          <button
            onClick={() => handleSampleClick('inventory')}
            className="btn btn-secondary"
            title="Load demo inventory forecast model"
          >
            <Play size={14} color="var(--primary)" />
            <span>Try Inventory Demo</span>
          </button>
          <Link to="/new" className="btn btn-primary">
            <UploadCloud size={15} />
            <span>Compare Workbooks</span>
          </Link>
        </div>
      </div>

      {(localError || contextError) && (
        <div
          style={{
            backgroundColor: 'var(--critical-bg)',
            border: '1px solid var(--critical-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--critical-text)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(10px)'
          }}
        >
          <AlertTriangle size={18} />
          <span>{localError || contextError}</span>
        </div>
      )}

      {/* CASE 1: No comparison loaded yet — Clean, effortless 10-second workflow */}
      {!hasData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Main Upload Box */}
          <div
            style={{
              ...glassCardStyle,
              padding: '2.5rem'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Upload Two Workbooks to Begin
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
                Select your baseline workbook and the revised version to instantly see what changed.
              </p>
            </div>

            <form onSubmit={handleCompareSubmit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                  gap: '1.75rem',
                  marginBottom: '2rem'
                }}
              >
                <FileDropzone
                  label="1. Original Workbook (Baseline)"
                  file={originalFile}
                  onFileSelect={setOriginalFile}
                  onFileRemove={() => setOriginalFile(null)}
                />
                <FileDropzone
                  label="2. Modified Workbook (Updated Revision)"
                  file={modifiedFile}
                  onFileSelect={setModifiedFile}
                  onFileRemove={() => setModifiedFile(null)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={!originalFile || !modifiedFile}
                  className="btn btn-primary btn-lg"
                  style={{
                    padding: '0.85rem 2.25rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    boxShadow: '0 6px 20px rgba(30, 86, 240, 0.4)'
                  }}
                >
                  <UploadCloud size={18} />
                  <span>Compare Workbooks</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          </div>

          {/* 3-Step Process Explanation */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              gap: '1.5rem'
            }}
          >
            <div
              style={{
                ...glassCardStyle,
                padding: '1.5rem'
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 6px rgba(30, 86, 240, 0.15)'
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Upload Two Workbooks
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Drop in Excel (.xlsx, .xls) or CSV files. No installation, macros, or complex setup required.
              </p>
            </div>

            <div
              style={{
                ...glassCardStyle,
                padding: '1.5rem'
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 6px rgba(30, 86, 240, 0.15)'
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Automated Intelligence
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                WorkbookX analyzes every cell, formula syntax tree, and dependency link to detect modifications.
              </p>
            </div>

            <div
              style={{
                ...glassCardStyle,
                padding: '1.5rem'
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 6px rgba(30, 86, 240, 0.15)'
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Review Risks & Audit
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Review circular references, formula errors, and generate signed audit reports for your team.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: Comparison is active — Clear, structured answers to the 4 key questions */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Question 1: Which workbook am I analyzing? */}
          <div
            style={{
              ...glassCardStyle,
              padding: '1.15rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(30, 86, 240, 0.15)'
                }}
              >
                <FileSpreadsheet size={21} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                  Active Comparison
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.05rem' }}>
                    {meta.originalFileName || 'Original Workbook'}
                  </span>
                  <ArrowRight size={14} color="var(--text-subtle)" />
                  <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.05rem' }}>
                    {meta.modifiedFileName || 'Modified Workbook'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  backgroundColor: 'rgba(241, 245, 249, 0.85)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(203, 213, 225, 0.7)'
                }}
              >
                {(meta.modifiedSheets || []).length} Sheet(s) Analyzed
              </span>
              <Link to="/new" className="btn btn-secondary btn-sm">
                <span>Compare Another Pair</span>
              </Link>
            </div>
          </div>

          {/* Question 2: What changed? — 4 Essential Metrics Only */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Key Change Metrics
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem'
              }}
            >
              <div
                style={{
                  ...glassCardStyle,
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total Cell Changes</span>
                  <FileDiff size={18} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                  {summary.totalChanges || 0}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  {summary.modifiedValues || 0} value updates, {summary.addedCells || 0} additions
                </div>
              </div>

              <div
                style={{
                  ...glassCardStyle,
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Formula Alterations</span>
                  <Binary size={18} color="#7c3aed" />
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#7c3aed', lineHeight: 1.1 }}>
                  {summary.formulaChanges || 0}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Logic formulas modified or hardcoded
                </div>
              </div>

              <div
                style={{
                  ...glassCardStyle,
                  padding: '1.5rem',
                  backgroundColor: urgentRisks.length > 0 ? 'rgba(254, 242, 242, 0.88)' : 'rgba(255, 255, 255, 0.78)',
                  borderColor: urgentRisks.length > 0 ? 'rgba(254, 202, 202, 0.9)' : 'rgba(255, 255, 255, 0.95)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: urgentRisks.length > 0 ? 'var(--critical-text)' : 'var(--text-muted)' }}>
                    Urgent Risks
                  </span>
                  <ShieldAlert size={18} color={urgentRisks.length > 0 ? 'var(--critical)' : 'var(--low)'} />
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: urgentRisks.length > 0 ? 'var(--critical-text)' : 'var(--low-text)', lineHeight: 1.1 }}>
                  {urgentRisks.length}
                </div>
                <div style={{ fontSize: '0.8125rem', color: urgentRisks.length > 0 ? 'var(--critical-text)' : 'var(--text-muted)', marginTop: '0.4rem' }}>
                  {urgentRisks.length > 0 ? 'Critical / High issues require review' : 'No urgent calculation risks'}
                </div>
              </div>

              <div
                style={{
                  ...glassCardStyle,
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Sheets Evaluated</span>
                  <Layers size={18} color="#059669" />
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                  {(meta.modifiedSheets || []).length || 1}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Worksheets verified deterministically
                </div>
              </div>
            </div>
          </div>

          {/* Question 3: Is anything important wrong? — Important Findings Requiring Attention */}
          <div
            style={{
              ...glassCardStyle,
              padding: '1.5rem 1.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.65rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Important Findings Requiring Attention
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Issues that could introduce calculation discrepancies or financial inaccuracies.
                </p>
              </div>
              <Link to="/risks" className="btn btn-secondary btn-sm">
                <span>Review All Risks ({risks.length})</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {urgentRisks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {urgentRisks.slice(0, 3).map((risk, index) => (
                  <div
                    key={risk.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: risk.severity === 'CRITICAL' ? 'rgba(254, 242, 242, 0.85)' : 'rgba(255, 247, 237, 0.85)',
                      border: `1px solid ${risk.severity === 'CRITICAL' ? 'rgba(254, 202, 202, 0.9)' : 'rgba(254, 215, 170, 0.9)'}`,
                      gap: '0.85rem',
                      flexWrap: 'wrap',
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 260 }}>
                      <AlertTriangle
                        size={18}
                        color={risk.severity === 'CRITICAL' ? 'var(--critical)' : 'var(--high)'}
                        style={{ flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            {risk.cell ? `${risk.cell}: ` : ''}{risk.title || risk.type}
                          </span>
                          <Badge severity={risk.severity} />
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-body)', marginTop: '0.2rem' }}>
                          {risk.description || 'Calculation anomaly requiring manual review.'}
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/risks"
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <span>Investigate</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '1.15rem',
                  backgroundColor: 'rgba(240, 253, 244, 0.85)',
                  border: '1px solid rgba(187, 247, 208, 0.9)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--low-text)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <CheckCircle2 size={20} color="var(--low)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  No critical formula errors or circular loops detected in this comparison.
                </span>
              </div>
            )}
          </div>

          {/* Question 4: What should the user investigate next? — Clear Next Steps */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Recommended Next Steps
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {/* Action 1: Explore Changes */}
              <div
                style={{
                  ...glassCardStyle,
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(30, 86, 240, 0.15)'
                      }}
                    >
                      <FileDiff size={17} />
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Explore Cell & Formula Changes
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                    Inspect cell-by-cell diffs side-by-side, view operator modifications, and trace formula dependency chains.
                  </p>
                </div>
                <Link to="/results" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>
                  <span>Explore Changes ({summary.totalChanges || 0})</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Action 2: Review Risks */}
              <div
                style={{
                  ...glassCardStyle,
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--critical-bg)',
                        color: 'var(--critical)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.15)'
                      }}
                    >
                      <ShieldAlert size={17} />
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Review Risks & Governance
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                    Sign off on reviewed formula changes, assign review status, and verify data quality rules across worksheets.
                  </p>
                </div>
                <Link to="/risks" className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
                  <span>Review Risks ({risks.length})</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Action 3: Download Audit Report */}
              <div
                style={{
                  ...glassCardStyle,
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(241, 245, 249, 0.85)',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <FileCheck2 size={17} />
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Download Audit Report
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                    Generate an executive summary, complete XLSX change log, or JSON audit export for compliance records.
                  </p>
                </div>
                <Link to="/audit" className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
                  <span>Generate Reports</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
