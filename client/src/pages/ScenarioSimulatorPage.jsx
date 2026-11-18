import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Sliders,
  Zap,
  Layers,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import { simulateScenario } from '../services/api.js';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { Badge } from '../components/Badge.jsx';
import { SubNavTabs } from '../components/SubNavTabs.jsx';

export function ScenarioSimulatorPage() {
  const { comparisonData, isLoading: contextLoading } = useComparison();

  const [scenarioName, setScenarioName] = useState('Price & Volume Adjustment');
  const [targetSheet, setTargetSheet] = useState('Revenue');
  const [targetCell, setTargetCell] = useState('B2');
  const [simulatedValue, setSimulatedValue] = useState(1200);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simError, setSimError] = useState(null);

  if (contextLoading) {
    return <LoadingState message="Loading simulation workspace..." />;
  }

  if (!comparisonData) {
    return (
      <div className="page-container">
        <EmptyState
          icon={Sliders}
          title="No Active Workbook Loaded"
          description="Load a sample model or upload your workbook to test What-If adjustments."
          actionLabel="Load Financial Model"
          actionTo="/new"
        />
      </div>
    );
  }

  const handleRunSimulation = async (e) => {
    e?.preventDefault();
    setIsSimulating(true);
    setSimError(null);

    try {
      const result = await simulateScenario({
        scenarioName,
        overrides: [
          {
            sheet: targetSheet,
            cell: targetCell.toUpperCase().trim(),
            simulatedValue: parseFloat(simulatedValue) || 0
          }
        ]
      });
      setSimulationResult(result);
    } catch (err) {
      setSimError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setSimulationResult(null);
    setSimError(null);
    setSimulatedValue(1000);
  };

  const exploreTabs = [
    { label: 'Cell Changes', path: '/results', count: comparisonData?.summary?.totalChanges || 0 },
    { label: 'Formula Analysis', path: '/formulas', count: comparisonData?.formulaAnalyses?.length || 0 },
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
          <h1 className="page-title">What-If Simulator</h1>
          <p className="page-description">
            Test hypothetical changes to cell values and see how they cascade through your spreadsheet.
          </p>
        </div>

        {simulationResult && (
          <button onClick={handleReset} className="btn btn-secondary btn-sm">
            <RotateCcw size={12} />
            <span>Reset Simulation</span>
          </button>
        )}
      </div>

      {simError && (
        <div
          style={{
            backgroundColor: 'var(--critical-bg)',
            border: '1px solid var(--critical-border)',
            borderRadius: 'var(--radius-xs)',
            padding: '0.75rem 1rem',
            color: 'var(--critical-text)',
            fontSize: '0.8125rem',
            marginBottom: '1rem'
          }}
        >
          {simError}
        </div>
      )}

      {/* SPLIT WORKBENCH: Left Parameter Desk (40%) vs Right Cascade Ledger (60%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.25rem', alignItems: 'flex-start' }}>
        {/* Left: Parameter Desk */}
        <form
          onSubmit={handleRunSimulation}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-hairline)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.04em' }}>
              Override Parameters
            </span>
            <span style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 700, backgroundColor: 'var(--primary-subtle)', padding: '0.1rem 0.4rem', borderRadius: 2 }}>
              Zero-Eval Sandbox
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Scenario Description</label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Target Sheet</label>
              <input
                type="text"
                value={targetSheet}
                onChange={(e) => setTargetSheet(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Cell</label>
              <input
                type="text"
                value={targetCell}
                onChange={(e) => setTargetCell(e.target.value)}
                className="form-input"
                placeholder="e.g. B2"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Simulated Input Value</label>
            <input
              type="number"
              step="any"
              value={simulatedValue}
              onChange={(e) => setSimulatedValue(e.target.value)}
              className="form-input"
              style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {/* Quick Presets */}
          <div style={{ padding: '0.65rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', marginBottom: '1.25rem' }}>
            <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.35rem' }}>
              Quick Presets
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem' }}>
              <button
                type="button"
                onClick={() => { setTargetSheet('Revenue'); setTargetCell('B2'); setSimulatedValue(1500); }}
                style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Revenue!B2 = 1,500 (+50% Price Surge)
              </button>
              <button
                type="button"
                onClick={() => { setTargetSheet('OpEx'); setTargetCell('B3'); setSimulatedValue(20000); }}
                style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                OpEx!B3 = 20,000 (Expense Reduction)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSimulating}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Play size={13} />
            <span>{isSimulating ? 'Recalculating Cascade...' : 'Execute What-If Recalculation'}</span>
          </button>
        </form>

        {/* Right: Cascade Ledger */}
        <div>
          {simulationResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                    Recalculated Nodes
                  </div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    {simulationResult.recalculatedCount}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Topological order</div>
                </div>

                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                    Success Rate
                  </div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
                    {simulationResult.summary.successRatePercent}%
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Safe AST arithmetic</div>
                </div>

                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                    Unsupported Functions
                  </div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: simulationResult.unsupportedCount > 0 ? 'var(--high)' : 'var(--low)', fontFamily: 'var(--font-mono)' }}>
                    {simulationResult.unsupportedCount}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Beyond grammar limits</div>
                </div>
              </div>

              {/* Cascade Ledger Table */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.04em' }}>
                    Recalculated Downstream Cells
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>
                    Topological wave execution
                  </span>
                </div>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '18%' }}>Coordinate</th>
                      <th>Formula Expression</th>
                      <th style={{ width: '16%' }}>Original</th>
                      <th style={{ width: '16%' }}>Simulated</th>
                      <th style={{ width: '16%', textAlign: 'right' }}>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(simulationResult.recalculatedCells || []).map((row, i) => {
                      const isPos = row.variance > 0;
                      return (
                        <tr key={i}>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            <span className="cell-code">{row.fullRef}</span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            <code>{row.formula}</code>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            {row.originalValue !== null ? Number(row.originalValue).toLocaleString() : '—'}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                            {row.simulatedValue !== null ? Number(row.simulatedValue).toLocaleString() : <Badge variant="high">Error</Badge>}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {row.variance !== null && row.variance !== undefined ? (
                              <span style={{ color: isPos ? '#16a34a' : '#dc2626' }}>
                                {isPos ? `+${row.variance.toLocaleString()}` : row.variance.toLocaleString()}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'var(--text-subtle)'
              }}
            >
              <Sliders size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Workbench Ready for Recalculation
              </div>
              <p style={{ fontSize: '0.75rem', maxWidth: 360, margin: '0 auto', lineHeight: 1.45 }}>
                Configure an override parameter on the left and click "Execute What-If Recalculation" to watch formula updates cascade through dependent nodes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
