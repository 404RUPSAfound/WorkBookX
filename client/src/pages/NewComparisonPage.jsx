import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  Play,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileDiff,
  Layers
} from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import { FileDropzone } from '../components/FileDropzone.jsx';

export function NewComparisonPage() {
  const { uploadAndCompare, loadSample, isLoading, error: contextError } = useComparison();
  const [originalFile, setOriginalFile] = useState(null);
  const [modifiedFile, setModifiedFile] = useState(null);
  const [localError, setLocalError] = useState(null);
  const navigate = useNavigate();

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
      setLocalError(err.message);
    }
  };

  const handleSampleClick = async (sampleKey) => {
    setLocalError(null);
    try {
      await loadSample(sampleKey);
      navigate('/results');
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 1040, margin: '0 auto' }}>
      {/* Editorial Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '1rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-subtle)',
            color: 'var(--primary)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem'
          }}
        >
          <Layers size={12} />
          <span>Compare Workbooks</span>
        </div>
        <h1 className="page-title" style={{ fontSize: '1.875rem' }}>
          Compare Two Workbooks
        </h1>
        <p className="page-description" style={{ margin: '0.35rem auto 0', maxWidth: 540 }}>
          Upload your original baseline workbook and the updated version to see every change, formula modification, and calculation risk.
        </p>
      </div>

      {(localError || contextError) && (
        <div
          style={{
            backgroundColor: 'var(--critical-bg)',
            border: '1px solid var(--critical-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            color: 'var(--critical-text)',
            fontSize: '0.8125rem',
            marginBottom: '1.5rem'
          }}
        >
          <AlertCircle size={16} />
          <span>{localError || contextError}</span>
        </div>
      )}

      {/* DUAL DROPZONE COMPARATOR STAGE */}
      <form
        onSubmit={handleCompareSubmit}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem 2rem',
          boxShadow: 'var(--shadow-hairline)',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Slot 1: Baseline */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.05em' }}>
                1. Baseline (Original)
              </span>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-subtle)' }}>Standard Benchmark</span>
            </div>
            <FileDropzone
              label="Original Workbook"
              file={originalFile}
              onFileSelect={(f) => {
                setOriginalFile(f);
                setLocalError(null);
              }}
              onFileRemove={() => setOriginalFile(null)}
            />
          </div>

          {/* Slot 2: Revision */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.05em' }}>
                2. Revision (Updated)
              </span>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-subtle)' }}>Proposed Update</span>
            </div>
            <FileDropzone
              label="Updated Workbook"
              file={modifiedFile}
              onFileSelect={(f) => {
                setModifiedFile(f);
                setLocalError(null);
              }}
              onFileRemove={() => setModifiedFile(null)}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Accepts <strong style={{ color: 'var(--text-main)' }}>.xlsx, .xls, .csv</strong> (up to 15MB). Processed strictly in-memory.
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading || !originalFile || !modifiedFile}
            style={{ minWidth: 220 }}
          >
            {isLoading ? (
              <span>Analyzing Topological Diffs...</span>
            ) : (
              <>
                <span>Execute Change Intelligence</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* BENCHMARK SCENARIO CARDS */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Zap size={15} color="var(--primary)" />
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)' }}>
            Or Load Pre-Configured Benchmark Scenarios
          </h3>
        </div>

        <div className="grid-cols-3">
          {/* Financial Scenario */}
          <div
            style={{
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-hairline)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Q3 Financial Model
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Multi-sheet P&L with inverted operating margin formula (<code>-</code> turned to <code>+</code>), hardcoded literal overrides, and circular loops.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSampleClick('financial')}
              disabled={isLoading}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Load Financial Benchmark</span>
            </button>
          </div>

          {/* Inventory Scenario */}
          <div
            style={{
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-hairline)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Inventory Forecast
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Stock projection model where outbound sales were mistakenly added instead of subtracted, resulting in inflated inventory estimates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSampleClick('inventory')}
              disabled={isLoading}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Load Inventory Benchmark</span>
            </button>
          </div>

          {/* CSV Scenario */}
          <div
            style={{
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-hairline)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Department Budget (CSV)
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Tabular departmental budget diff evaluating row additions, deletions, and cell value modifications across flat comma-separated files.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSampleClick('csv')}
              disabled={isLoading}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Load Budget CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
