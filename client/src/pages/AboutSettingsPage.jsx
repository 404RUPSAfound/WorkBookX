import React, { useState, useEffect } from 'react';
import { Settings, Info, Server, Shield, CheckCircle2, AlertCircle, HelpCircle, Cpu, Network, Layers } from 'lucide-react';
import { checkHealth } from '../services/api.js';

export function AboutSettingsPage() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    async function ping() {
      try {
        setHealthLoading(true);
        const data = await checkHealth();
        setHealthStatus(data);
      } catch (err) {
        setHealthStatus({ status: 'offline', error: err.message });
      } finally {
        setHealthLoading(false);
      }
    }
    ping();
  }, []);

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Settings & System Information</h1>
        <p className="page-description">
          System health status, calculation engine details, and platform preferences.
        </p>
      </div>

      {/* Backend Health Diagnostics Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-hairline)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Server size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.04em' }}>
              Calculation Engine Status
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>Live Telemetry</span>
        </div>

        {healthLoading ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Pinging calculation service...</div>
        ) : healthStatus?.status === 'healthy' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--low-bg)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--low-border)',
              color: 'var(--low-text)',
              fontSize: '0.75rem'
            }}
          >
            <CheckCircle2 size={16} color="var(--low)" />
            <div>
              <strong>Service Online:</strong> Engine "{healthStatus.service}" v{healthStatus.version} is active on port 5000 and processing spreadsheet differential topology.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--critical-bg)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--critical-border)',
              color: 'var(--critical-text)',
              fontSize: '0.75rem'
            }}
          >
            <AlertCircle size={16} />
            <div>
              <strong>Service Offline:</strong> Calculation backend is unreachable. Verify Node service is active on port 5000.
            </div>
          </div>
        )}
      </div>

      {/* Algorithmic Foundation & Engineering Blueprint */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-hairline)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1.25rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <Cpu size={16} color="var(--primary)" />
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.04em' }}>
            Algorithmic Engineering Specifications
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
          <div>
            <h4 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              1. Cell-by-Cell Differential Calculus
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              WorkbookX executes symmetric set-difference logic across all worksheets. It tracks four fundamental state changes: <code>MODIFIED_VALUE</code>, <code>FORMULA_ALTERED</code>, <code>ADDED</code>, and <code>REMOVED</code>, parsing raw primitives, formatted strings, and underlying formula definitions without lossy conversions.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              2. Formula Tokenizer & AST Extraction
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              Every formula is processed by a custom lexical scanner that strips string literals and tokenizes operators (<code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>), single cell coordinates (including absolute flags like <code>$A$1</code>), rectangular ranges (<code>B2:B10</code>), cross-sheet pointers (<code>Revenue!C4</code>), and broken <code>#REF!</code> errors into structured Abstract Syntax Trees.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              3. Tarjan's SCC & BFS Shortest Path Traversal
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              Circular references are isolated using Tarjan's Strongly Connected Components (SCC) linear-time algorithm in \(O(V+E)\). Downstream formula cascades are explored via Breadth-First Search (BFS) to determine exact topological depths, total affected node counts, and the precise shortest dependency path from any modified input cell to its impacted reporting targets.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              4. Zero-Eval Recursive-Descent What-If Simulator
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              To ensure airtight security, WorkbookX strictly prohibits <code>eval()</code>, <code>Function()</code>, or shell execution. Sensitivity recalculations run through an in-memory recursive-descent arithmetic evaluator supporting standard arithmetic hierarchies and fundamental functions.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            <strong>Security Scope:</strong> WorkbookX parses spreadsheet XML/CSV content safely in an ephemeral memory sandbox. It does not execute VBA macro scripts or connect to external SQL databases.
          </div>
        </div>
      </div>
    </div>
  );
}
