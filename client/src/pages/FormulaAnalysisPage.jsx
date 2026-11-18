import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Binary,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Search,
  Info,
  Code2,
  GitCommit,
  Network,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { SubNavTabs } from '../components/SubNavTabs.jsx';

export function FormulaAnalysisPage() {
  const { comparisonData, isLoading } = useComparison();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (isLoading) {
    return <LoadingState message="Extracting formula tokens and inspecting mathematical operators..." />;
  }

  const formulaAnalyses = comparisonData?.formulaAnalyses || [];

  const filteredAnalyses = formulaAnalyses.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item.fullRef || '').toLowerCase().includes(q) ||
      (item.explanation || '').toLowerCase().includes(q) ||
      (item.oldFormula || '').toLowerCase().includes(q) ||
      (item.newFormula || '').toLowerCase().includes(q)
    );
  });

  if (formulaAnalyses.length === 0) {
    return (
      <div className="page-container">
        <EmptyState
          icon={Binary}
          title="No Formula Modifications Found"
          description="None of the changes in this comparison altered dynamic Excel formulas or replaced calculations with constants."
          actionLabel="View All Changes"
          actionTo="/results"
        />
      </div>
    );
  }

  const activeItem = filteredAnalyses[selectedIdx] || filteredAnalyses[0] || null;

  const exploreTabs = [
    { label: 'Cell Changes', path: '/results', count: comparisonData?.summary?.totalChanges || 0 },
    { label: 'Formula Analysis', path: '/formulas', count: formulaAnalyses.length },
    { label: 'Formula Connections', path: '/graph' },
    { label: 'What-If Simulator', path: '/scenario' }
  ];

  return (
    <div className="page-container">
      {/* Contextual Sub-Nav Tabs */}
      <SubNavTabs tabs={exploreTabs} />

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
          <h1 className="page-title">Formula Analysis</h1>
          <p className="page-description">
            Understand formula logic modifications, operator shifts, and hardcoded values.
          </p>
        </div>

        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search formulas or coordinate..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIdx(0);
            }}
            className="form-input"
            style={{ width: '100%', paddingLeft: '2.1rem', fontSize: '0.75rem' }}
          />
        </div>
      </div>

      {/* AST IDE SPLIT WORKSPACE (Formula List on Left + Deep Inspector on Right) */}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
        {/* Left: Formula Manifest (35%) */}
        <div
          style={{
            width: 340,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-hairline)',
            flexShrink: 0
          }}
        >
          <div
            style={{
              padding: '0.65rem 0.85rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Altered Formulas</span>
            <span>{filteredAnalyses.length} Total</span>
          </div>

          <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            {filteredAnalyses.map((item, idx) => {
              const isSelected = activeItem === item;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--primary-subtle)' : undefined,
                    transition: 'background-color var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className="cell-code" style={{ fontSize: '0.75rem' }}>
                      {item.fullRef}
                    </span>
                    {item.isConstantOverride ? (
                      <Badge variant="high">HARDCODED</Badge>
                    ) : item.hasBrokenRef ? (
                      <Badge variant="critical">BROKEN REF</Badge>
                    ) : (
                      <Badge variant="formula">LOGIC DIFF</Badge>
                    )}
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: isSelected ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.newFormula || '(Constant Override)'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Technical AST Inspector (65%) */}
        {activeItem && (
          <div
            style={{
              flex: 1,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-hairline)'
            }}
          >
            {/* Inspector Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '0.875rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.06em' }}>
                  Target Coordinate
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                  <span className="cell-code" style={{ fontSize: '1.125rem' }}>{activeItem.fullRef}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to="/graph" className="btn btn-secondary btn-sm">
                  <Network size={12} color="var(--primary)" />
                  <span>Trace in Graph</span>
                </Link>
              </div>
            </div>

            {/* Syntax Diff Code Blocks (Red vs Green) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                Formula Syntax Comparison
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Baseline Block */}
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-xs)', padding: '0.75rem 1rem' }}>
                  <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    - Baseline Formula
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#991b1b' }}>
                    {activeItem.oldFormula ? (
                      <code>{activeItem.oldFormula}</code>
                    ) : (
                      <span style={{ fontStyle: 'italic', opacity: 0.7 }}>(No formula — was static value)</span>
                    )}
                  </div>
                </div>

                {/* Revision Block */}
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-xs)', padding: '0.75rem 1rem' }}>
                  <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    + Revision Formula
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#166534', fontWeight: 700 }}>
                    {activeItem.newFormula ? (
                      <code>{activeItem.newFormula}</code>
                    ) : (
                      <span style={{ color: 'var(--high-text)', fontWeight: 700 }}>
                        Formula removed! Replaced by static literal constant.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Plain Business Explanation */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '4px solid var(--primary)',
                borderRadius: 'var(--radius-xs)',
                padding: '0.875rem 1rem',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                Business Logic Explanation
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {activeItem.explanation}
              </p>
            </div>

            {/* AST Token Mutation Analysis */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.35rem' }}>
                  Added References
                </span>
                {activeItem.addedReferences && activeItem.addedReferences.length > 0 ? (
                  activeItem.addedReferences.map((r, i) => (
                    <span key={i} className="cell-code" style={{ marginRight: '0.25rem', backgroundColor: '#f0fdf4', color: '#166534' }}>
                      {r}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>None</span>
                )}
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.35rem' }}>
                  Removed References
                </span>
                {activeItem.removedReferences && activeItem.removedReferences.length > 0 ? (
                  activeItem.removedReferences.map((r, i) => (
                    <span key={i} className="cell-code" style={{ marginRight: '0.25rem', backgroundColor: '#fef2f2', color: '#991b1b' }}>
                      {r}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>None</span>
                )}
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.35rem' }}>
                  Operator Transitions
                </span>
                {activeItem.oldOperators && activeItem.newOperators && activeItem.oldOperators.join(' ') !== activeItem.newOperators.join(' ') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="cell-code">{activeItem.oldOperators.join(', ')}</span>
                    <ArrowRight size={11} color="var(--text-subtle)" />
                    <span className="cell-code" style={{ backgroundColor: '#fffbeb', color: '#b45309', fontWeight: 700 }}>
                      {activeItem.newOperators.join(', ')}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>No operator mutations</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
