import React, { useState, useEffect } from 'react';
import {
  History,
  Save,
  Trash2,
  ArrowRight,
  GitCompare,
  CheckCircle2,
  AlertCircle,
  GitCommit,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import {
  listHistorySnapshots,
  createHistorySnapshot,
  deleteHistorySnapshot,
  compareHistorySnapshots
} from '../services/api.js';
import { Badge } from '../components/Badge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { SubNavTabs } from '../components/SubNavTabs.jsx';

export function VersionHistoryPage() {
  const { comparisonData } = useComparison();

  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snapshotName, setSnapshotName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Compare 2 snapshots state
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [compareResult, setCompareResult] = useState(null);

  const fetchSnapshots = async () => {
    try {
      setIsLoading(true);
      const list = await listHistorySnapshots();
      setSnapshots(list);
      if (list.length >= 2) {
        setSelectedA(list[0].id);
        setSelectedB(list[1].id);
      }
    } catch (err) {
      console.error('Failed to list history snapshots:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    if (!comparisonData) {
      alert('Please run a comparison first before creating a snapshot.');
      return;
    }
    setIsSaving(true);
    try {
      await createHistorySnapshot(snapshotName || `Snapshot ${new Date().toLocaleDateString()}`, comparisonData);
      setSnapshotName('');
      await fetchSnapshots();
    } catch (err) {
      alert(`Error creating snapshot: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this snapshot?')) return;
    try {
      await deleteHistorySnapshot(id);
      await fetchSnapshots();
      if (compareResult) setCompareResult(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompareSnapshots = async () => {
    if (!selectedA || !selectedB || selectedA === selectedB) {
      alert('Please select two distinct snapshots to compare.');
      return;
    }
    try {
      const res = await compareHistorySnapshots(selectedA, selectedB);
      setCompareResult(res);
    } catch (err) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading version history repository..." />;
  }

  const reportTabs = [
    { label: 'Audit Reports', path: '/audit' },
    { label: 'Previous Versions', path: '/history' }
  ];

  return (
    <div className="page-container" style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Contextual Sub-Nav Tabs */}
      <SubNavTabs tabs={reportTabs} />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <h1 className="page-title">Previous Versions</h1>
          <p className="page-description">
            Save comparison snapshots, track historical versions, and compare past workbooks.
          </p>
        </div>

        {/* Snapshot Creation Form */}
        <form onSubmit={handleCreateSnapshot} style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Label this snapshot..."
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            className="form-input"
            style={{ width: 200, fontSize: '0.75rem' }}
          />
          <button type="submit" disabled={isSaving || !comparisonData} className="btn btn-primary btn-sm">
            <Save size={12} />
            <span>{isSaving ? 'Recording...' : 'Commit Snapshot'}</span>
          </button>
        </form>
      </div>

      {/* Snapshot Comparator Tool */}
      {snapshots.length >= 2 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-hairline)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
            <GitCompare size={15} color="var(--primary)" />
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.04em' }}>
              Snapshot Variance Comparator
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedA}
              onChange={(e) => setSelectedA(e.target.value)}
              className="form-select"
              style={{ minWidth: 200, fontSize: '0.75rem' }}
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({new Date(s.timestamp).toLocaleDateString()})
                </option>
              ))}
            </select>

            <span style={{ fontWeight: 700, color: 'var(--text-subtle)', fontSize: '0.75rem' }}>➔</span>

            <select
              value={selectedB}
              onChange={(e) => setSelectedB(e.target.value)}
              className="form-select"
              style={{ minWidth: 200, fontSize: '0.75rem' }}
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({new Date(s.timestamp).toLocaleDateString()})
                </option>
              ))}
            </select>

            <button onClick={handleCompareSnapshots} className="btn btn-secondary btn-sm">
              <span>Compute Variance</span>
            </button>
          </div>

          {compareResult && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem'
              }}
            >
              <strong>Delta Summary:</strong>{' '}
              Changes Variance:{' '}
              <strong style={{ color: compareResult.comparisonDelta.changesVariance >= 0 ? '#16a34a' : 'var(--critical)' }}>
                {compareResult.comparisonDelta.changesVariance > 0 ? `+${compareResult.comparisonDelta.changesVariance}` : compareResult.comparisonDelta.changesVariance}
              </strong>{' '}
              • Risks Variance:{' '}
              <strong>{compareResult.comparisonDelta.risksVariance}</strong> • Content Identity:{' '}
              <strong style={{ color: compareResult.comparisonDelta.isIdenticalContent ? '#16a34a' : 'var(--primary)' }}>
                {compareResult.comparisonDelta.isIdenticalContent ? 'Identical SHA-256 Hashes' : 'Distinct Model Content'}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* TIMELINE LEDGER RAIL */}
      {snapshots.length > 0 ? (
        <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
          {/* Timeline Vertical Line */}
          <div
            style={{
              position: 'absolute',
              left: '7px',
              top: '8px',
              bottom: '8px',
              width: '2px',
              backgroundColor: 'var(--border-subtle)'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                style={{
                  position: 'relative',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  boxShadow: 'var(--shadow-hairline)'
                }}
              >
                {/* Timeline Dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-1.75rem',
                    top: '1.25rem',
                    transform: 'translateX(3px)',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    boxShadow: '0 0 0 3px var(--bg-app)'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {snap.name}
                      </h3>
                      <span className="cell-code" style={{ fontSize: '0.625rem' }}>
                        SHA256: {snap.contentHash}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Recorded on {new Date(snap.timestamp).toLocaleString()} • Scope: {snap.meta?.scope || 'Model Snapshot'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                      <div><strong style={{ color: 'var(--text-main)' }}>{snap.totalChangesCount || snap.summary?.totalChanges || 0}</strong> changes</div>
                      <div style={{ color: 'var(--critical)' }}><strong>{snap.risksCount || 0}</strong> risks</div>
                    </div>

                    <button
                      onClick={() => handleDelete(snap.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--critical)' }}
                      title="Delete Snapshot"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="No Version Snapshots Recorded"
          description="Establish an immutable model ledger by recording your first snapshot above."
        />
      )}
    </div>
  );
}
