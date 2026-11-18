import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  FileDiff,
  Download,
  ArrowRight,
  Layers,
  FileSpreadsheet,
  Network,
  Info,
  ChevronRight,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { SubNavTabs } from '../components/SubNavTabs.jsx';
import { downloadAuditCSV } from '../services/api.js';

export function ComparisonResultsPage() {
  const { comparisonData, isLoading } = useComparison();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [activeCell, setActiveCell] = useState(null);

  if (isLoading) {
    return <LoadingState message="Filtering spreadsheet changes..." />;
  }

  if (!comparisonData || !comparisonData.changes) {
    return (
      <div className="page-container">
        <EmptyState
          title="No Comparison Active"
          description="Upload two workbooks or load a pre-built demo model to inspect cell-by-cell changes."
          actionLabel="Go to Upload"
          actionTo="/new"
        />
      </div>
    );
  }

  const changes = comparisonData.changes || [];
  const summary = comparisonData.summary || {};
  const meta = comparisonData.meta || {};

  // Extract unique sheet names
  const sheetOptions = useMemo(() => {
    const set = new Set();
    changes.forEach((c) => set.add(c.sheet));
    return Array.from(set);
  }, [changes]);

  // Filtered change records
  const filteredChanges = useMemo(() => {
    return changes.filter((item) => {
      // 1. Sheet filter
      if (selectedSheet !== 'ALL' && item.sheet !== selectedSheet) {
        return false;
      }

      // 2. Change Type filter
      if (selectedType !== 'ALL') {
        if (selectedType === 'FORMULA' && !item.isFormulaDiff) return false;
        if (selectedType === 'MODIFIED' && item.changeType !== 'MODIFIED_VALUE') return false;
        if (selectedType === 'ADDED' && item.changeType !== 'ADDED' && item.changeType !== 'FORMULA_ADDED') return false;
        if (selectedType === 'REMOVED' && item.changeType !== 'REMOVED') return false;
      }

      // 3. Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const cellMatch = (item.cell || '').toLowerCase().includes(query);
        const sheetMatch = (item.sheet || '').toLowerCase().includes(query);
        const oldValMatch = String(item.oldValue ?? '').toLowerCase().includes(query);
        const newValMatch = String(item.newValue ?? '').toLowerCase().includes(query);
        const oldFormMatch = (item.oldFormula || '').toLowerCase().includes(query);
        const newFormMatch = (item.newFormula || '').toLowerCase().includes(query);

        return cellMatch || sheetMatch || oldValMatch || newValMatch || oldFormMatch || newFormMatch;
      }

      return true;
    });
  }, [changes, selectedSheet, selectedType, searchTerm]);

  // Default active cell is first row if not set
  const currentInspectCell = activeCell || filteredChanges[0] || null;

  const exploreTabs = [
    { label: 'Cell Changes', path: '/results', count: summary.totalChanges || changes.length },
    { label: 'Formula Analysis', path: '/formulas', count: comparisonData?.formulaAnalyses?.length || 0 },
    { label: 'Formula Connections', path: '/graph' },
    { label: 'What-If Simulator', path: '/scenario' }
  ];

  return (
    <div className="page-container">
      {/* Contextual Sub-Nav Tabs */}
      <SubNavTabs tabs={exploreTabs} />

      {/* Editorial Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div>
          <h1 className="page-title">Cell Changes</h1>
          <p className="page-description">
            Inspect cell-by-cell diffs, formula changes, and numerical variances between both workbooks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => downloadAuditCSV(comparisonData.changes, comparisonData.risks)}
            className="btn btn-secondary btn-sm"
          >
            <Download size={13} />
            <span>Export Diffs (CSV)</span>
          </button>
        </div>
      </div>

      {/* SPREADSHEET FORMULA BAR PRIMITIVE (Like Excel's fx Bar) */}
      <div className="formula-bar-container">
        <div className="formula-bar-namebox">
          {currentInspectCell ? `${currentInspectCell.sheet}!${currentInspectCell.cell}` : '—'}
        </div>
        <div className="formula-bar-fx">
          fx
        </div>
        <div className="formula-bar-expression">
          {currentInspectCell ? (
            currentInspectCell.newFormula ? (
              <span>
                <strong style={{ color: 'var(--text-muted)' }}>Formula: </strong>
                <code style={{ color: '#15803d', fontWeight: 700 }}>{currentInspectCell.newFormula}</code>
                {currentInspectCell.oldFormula && (
                  <span style={{ color: 'var(--text-subtle)', marginLeft: '0.75rem' }}>
                    (Baseline was: <code style={{ color: '#b91c1c' }}>{currentInspectCell.oldFormula}</code>)
                  </span>
                )}
              </span>
            ) : (
              <span>
                <strong style={{ color: 'var(--text-muted)' }}>Value: </strong>
                <strong>{String(currentInspectCell.newFormatted || (currentInspectCell.newValue !== null && currentInspectCell.newValue !== undefined ? currentInspectCell.newValue : '—'))}</strong>
                {currentInspectCell.oldValue !== undefined && currentInspectCell.oldValue !== null && (
                  <span style={{ color: 'var(--text-subtle)', marginLeft: '0.75rem' }}>
                    (Baseline was: {String(currentInspectCell.oldFormatted || currentInspectCell.oldValue)})
                  </span>
                )}
              </span>
            )
          ) : (
            <span style={{ color: 'var(--text-subtle)' }}>Select any row below to inspect formula expression</span>
          )}
        </div>
      </div>

      {/* EXCEL SHEET TABS (REAL SHEET SELECTOR TABS) */}
      <div className="sheet-tabs-container">
        <button
          onClick={() => setSelectedSheet('ALL')}
          className={`sheet-tab ${selectedSheet === 'ALL' ? 'active' : ''}`}
        >
          All Sheets ({changes.length})
        </button>
        {sheetOptions.map((s) => {
          const count = changes.filter((c) => c.sheet === s).length;
          return (
            <button
              key={s}
              onClick={() => setSelectedSheet(s)}
              className={`sheet-tab ${selectedSheet === s ? 'active' : ''}`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* FILTER & SEARCH DOCK */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderTop: 'none',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search by cell (e.g. C12), value, or formula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ width: '100%', paddingLeft: '2.1rem', fontSize: '0.75rem' }}
          />
        </div>

        {/* Change Type Filter Pills */}
        <div className="tab-group" style={{ fontSize: '0.6875rem' }}>
          <button
            onClick={() => setSelectedType('ALL')}
            className={`tab-btn ${selectedType === 'ALL' ? 'active' : ''}`}
          >
            All Types ({changes.length})
          </button>
          <button
            onClick={() => setSelectedType('FORMULA')}
            className={`tab-btn ${selectedType === 'FORMULA' ? 'active' : ''}`}
          >
            Formula Changes ({summary.formulaChanges || 0})
          </button>
          <button
            onClick={() => setSelectedType('MODIFIED')}
            className={`tab-btn ${selectedType === 'MODIFIED' ? 'active' : ''}`}
          >
            Value Diffs ({summary.modifiedValues || 0})
          </button>
          <button
            onClick={() => setSelectedType('ADDED')}
            className={`tab-btn ${selectedType === 'ADDED' ? 'active' : ''}`}
          >
            Added ({summary.addedCells || 0})
          </button>
          <button
            onClick={() => setSelectedType('REMOVED')}
            className={`tab-btn ${selectedType === 'REMOVED' ? 'active' : ''}`}
          >
            Removed ({summary.removedCells || 0})
          </button>
        </div>
      </div>

      {/* SPREADSHEET DIFF WORKSPACE (High Density Grid + Inspection Drawer) */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-start' }}>
        {/* Table Area (70%) */}
        <div style={{ flex: 1, overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                <th style={{ width: '14%' }}>Coordinate</th>
                <th style={{ width: '16%' }}>Classification</th>
                <th>Baseline (Original)</th>
                <th>Revision (Updated)</th>
                <th style={{ width: '14%', textAlign: 'right' }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {filteredChanges.length > 0 ? (
                filteredChanges.map((row, idx) => {
                  const isSelected = currentInspectCell?.id === row.id;
                  const isPositive = row.valueDiff > 0;

                  return (
                    <tr
                      key={row.id || idx}
                      onClick={() => setActiveCell(row)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--primary-subtle)' : undefined
                      }}
                    >
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        <span className="cell-code" style={{ backgroundColor: isSelected ? '#ffffff' : undefined }}>
                          {row.sheet}!{row.cell}
                        </span>
                      </td>
                      <td>
                        <Badge variant={row.changeType}>
                          {row.changeType.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td>
                        {row.oldFormula ? (
                          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '0.15rem 0.35rem', borderRadius: 'var(--radius-xs)' }}>
                            {row.oldFormula}
                          </code>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            {row.oldFormatted || (row.oldValue !== null && row.oldValue !== undefined ? String(row.oldValue) : <span style={{ color: 'var(--text-subtle)' }}>—</span>)}
                          </span>
                        )}
                      </td>
                      <td>
                        {row.newFormula ? (
                          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#15803d', backgroundColor: '#f0fdf4', padding: '0.15rem 0.35rem', borderRadius: 'var(--radius-xs)', fontWeight: 700 }}>
                            {row.newFormula}
                          </code>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>
                            {row.newFormatted || (row.newValue !== null && row.newValue !== undefined ? String(row.newValue) : <span style={{ color: 'var(--text-subtle)' }}>—</span>)}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem' }}>
                        {row.valueDiff !== null && row.valueDiff !== undefined ? (
                          <span style={{ color: isPositive ? '#16a34a' : '#dc2626' }}>
                            {isPositive ? `+${row.valueDiff}` : row.valueDiff}
                          </span>
                        ) : row.changeType === 'FORMULA_REMOVED' ? (
                          <span style={{ fontSize: '0.625rem', color: 'var(--high)', fontWeight: 700, backgroundColor: 'var(--high-bg)', padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-xs)' }}>
                            HARDCODED
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
                    No spreadsheet changes match your active search or sheet filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dedicated Difference-Inspection Dock (30%) */}
        {currentInspectCell && (
          <div
            style={{
              width: 330,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-hairline)',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.06em' }}>
                Cell Difference Inspector
              </span>
              <Badge variant={currentInspectCell.changeType}>
                {currentInspectCell.changeType.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              <span className="cell-code" style={{ fontSize: '1.125rem' }}>
                {currentInspectCell.sheet}!{currentInspectCell.cell}
              </span>
            </div>

            {/* Split Diff Comparison Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                  Baseline (Original)
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#991b1b', wordBreak: 'break-all' }}>
                  {currentInspectCell.oldFormula || String(currentInspectCell.oldFormatted || (currentInspectCell.oldValue !== null && currentInspectCell.oldValue !== undefined ? currentInspectCell.oldValue : 'None'))}
                </div>
              </div>

              <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                  Revision (Updated)
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#166534', fontWeight: 700, wordBreak: 'break-all' }}>
                  {currentInspectCell.newFormula || String(currentInspectCell.newFormatted || (currentInspectCell.newValue !== null && currentInspectCell.newValue !== undefined ? currentInspectCell.newValue : 'None'))}
                </div>
              </div>
            </div>

            {/* Variance & Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Numeric Variance:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>
                  {currentInspectCell.valueDiff !== null && currentInspectCell.valueDiff !== undefined
                    ? `${currentInspectCell.valueDiff > 0 ? '+' : ''}${currentInspectCell.valueDiff}`
                    : 'N/A'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Formula Alteration:</span>
                <strong>{currentInspectCell.isFormulaDiff ? 'Yes (Logic Changed)' : 'No (Value Diff Only)'}</strong>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <Link to="/graph" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                <Network size={12} color="var(--primary)" />
                <span>Trace in Dependency Graph</span>
              </Link>
              <Link to="/formulas" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Inspect AST Tokens</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
