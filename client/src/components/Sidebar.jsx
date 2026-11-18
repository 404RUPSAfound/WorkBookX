import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  UploadCloud,
  FileDiff,
  ShieldAlert,
  FileCheck2,
  Settings,
  Layers,
  Binary,
  Network,
  Sliders,
  Sparkles,
  ShieldCheck,
  History
} from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';

/**
 * WORKBOOKX LUMINOUS WHITE FROSTED GLASS SIDEBAR
 * 
 * Strictly 6 Primary Sections with Scaled-Up Typography:
 * 1. Home (/)
 * 2. Compare Workbooks (/new) — Primary Glowing Action Button
 * 3. Explore Changes (/results)
 * 4. Review Risks (/risks)
 * 5. Reports (/audit)
 * 6. Settings (/settings)
 */
export function Sidebar() {
  const { comparisonData } = useComparison();
  const location = useLocation();

  const changeCount = comparisonData?.summary?.totalChanges || 0;
  const formulaCount = comparisonData?.formulaAnalyses?.length || 0;
  const riskCount = comparisonData?.risks?.length || 0;
  const anomalyCount = comparisonData?.formulaAnomalies?.length || 0;
  const dqFailures = comparisonData?.dataQuality?.failedChecksCount || 0;

  // Active section detectors
  const isExploreActive = ['/results', '/formulas', '/graph', '/scenario'].includes(location.pathname);
  const isRisksActive = ['/risks', '/anomalies', '/data-quality'].includes(location.pathname);
  const isReportsActive = ['/audit', '/history'].includes(location.pathname);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="logo-badge">
          <Layers size={19} />
        </div>
        <div>
          <div className="brand-title">WorkbookX</div>
          <div className="brand-subtitle">Spreadsheet Intelligence</div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="sidebar-nav">
        {/* 1. Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Home size={18} />
          <span>Home</span>
        </NavLink>

        {/* 2. Primary Action: Compare Workbooks */}
        <NavLink
          to="/new"
          className={({ isActive }) => `nav-cta-btn ${isActive ? 'active' : ''}`}
          title="Upload baseline and updated workbooks to compare"
        >
          <UploadCloud size={18} />
          <span>Compare Workbooks</span>
        </NavLink>

        <div className="sidebar-section-title">Analysis & Review</div>

        {/* 3. Explore Changes */}
        <NavLink
          to="/results"
          className={`nav-link ${isExploreActive ? 'active' : ''}`}
        >
          <FileDiff size={18} />
          <span>Explore Changes</span>
          {changeCount > 0 && <span className="nav-counter">{changeCount}</span>}
        </NavLink>

        {/* Contextual Sub-Items: Explore Changes */}
        {isExploreActive && (
          <div className="sidebar-subnav">
            <NavLink
              to="/results"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <FileDiff size={15} />
              <span>Cell Changes</span>
            </NavLink>
            <NavLink
              to="/formulas"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Binary size={15} />
              <span>Formula Analysis</span>
              {formulaCount > 0 && (
                <span className="nav-counter" style={{ fontSize: '0.7rem' }}>
                  {formulaCount}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/graph"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Network size={15} />
              <span>Formula Connections</span>
            </NavLink>
            <NavLink
              to="/scenario"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Sliders size={15} />
              <span>What-If Simulator</span>
            </NavLink>
          </div>
        )}

        {/* 4. Review Risks */}
        <NavLink
          to="/risks"
          className={`nav-link ${isRisksActive ? 'active' : ''}`}
        >
          <ShieldAlert size={18} />
          <span>Review Risks</span>
          {riskCount > 0 && (
            <span
              className="nav-counter"
              style={{
                backgroundColor: 'var(--critical-bg)',
                color: 'var(--critical-text)',
                borderColor: 'var(--critical-border)',
                fontWeight: 700
              }}
            >
              {riskCount}
            </span>
          )}
        </NavLink>

        {/* Contextual Sub-Items: Review Risks */}
        {isRisksActive && (
          <div className="sidebar-subnav">
            <NavLink
              to="/risks"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <ShieldAlert size={15} />
              <span>Risk Findings</span>
            </NavLink>
            <NavLink
              to="/anomalies"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Sparkles size={15} />
              <span>Unusual Formulas</span>
              {anomalyCount > 0 && (
                <span
                  className="nav-counter"
                  style={{
                    fontSize: '0.7rem',
                    backgroundColor: 'rgba(217, 119, 6, 0.12)',
                    color: '#b45309',
                    borderColor: 'rgba(217, 119, 6, 0.25)'
                  }}
                >
                  {anomalyCount}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/data-quality"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <ShieldCheck size={15} />
              <span>Data Quality Check</span>
              {dqFailures > 0 && (
                <span
                  className="nav-counter"
                  style={{
                    fontSize: '0.7rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: 'var(--critical)',
                    borderColor: 'rgba(239, 68, 68, 0.25)'
                  }}
                >
                  {dqFailures}
                </span>
              )}
            </NavLink>
          </div>
        )}

        {/* 5. Reports */}
        <NavLink
          to="/audit"
          className={`nav-link ${isReportsActive ? 'active' : ''}`}
        >
          <FileCheck2 size={18} />
          <span>Reports</span>
        </NavLink>

        {/* Contextual Sub-Items: Reports */}
        {isReportsActive && (
          <div className="sidebar-subnav">
            <NavLink
              to="/audit"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <FileCheck2 size={15} />
              <span>Audit Reports</span>
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <History size={15} />
              <span>Previous Versions</span>
            </NavLink>
          </div>
        )}

        {/* 6. Settings */}
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* Footer Status */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block',
              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)'
            }}
          />
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>
            Analysis Engine Active
          </span>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>WorkbookX Enterprise v2.0</div>
      </div>
    </aside>
  );
}
