import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileSpreadsheet, ArrowRight, Play, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';

// Breadcrumb lookup mapping
const ROUTE_BREADCRUMBS = {
  '/': { section: 'Home', title: 'Overview' },
  '/new': { section: 'Compare Workbooks', title: 'Upload & Compare' },
  '/results': { section: 'Explore Changes', title: 'Cell Changes' },
  '/formulas': { section: 'Explore Changes', title: 'Formula Analysis' },
  '/graph': { section: 'Explore Changes', title: 'Formula Connections' },
  '/scenario': { section: 'Explore Changes', title: 'What-If Simulator' },
  '/risks': { section: 'Review Risks', title: 'Risk Findings' },
  '/anomalies': { section: 'Review Risks', title: 'Unusual Formulas' },
  '/data-quality': { section: 'Review Risks', title: 'Data Quality Check' },
  '/audit': { section: 'Reports', title: 'Audit Reports' },
  '/history': { section: 'Reports', title: 'Previous Versions' },
  '/settings': { section: 'Settings', title: 'Preferences & System' }
};

export function Navbar() {
  const { comparisonData, loadSample, isLoading } = useComparison();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSample = async (sampleKey) => {
    setDropdownOpen(false);
    try {
      await loadSample(sampleKey);
      navigate('/results');
    } catch (err) {
      console.error('Failed to load demo sample:', err);
    }
  };

  const meta = comparisonData?.meta;
  const currentBreadcrumb = ROUTE_BREADCRUMBS[location.pathname] || {
    section: 'WorkbookX',
    title: 'Workspace'
  };

  return (
    <header className="top-navbar">
      {/* Left: Dynamic Breadcrumb & Active Comparison Context */}
      <div className="navbar-left">
        {/* Dynamic Breadcrumb */}
        <div className="breadcrumb-nav">
          <span className="breadcrumb-item">{currentBreadcrumb.section}</span>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-item active">{currentBreadcrumb.title}</span>
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, height: 18, backgroundColor: 'rgba(203, 213, 225, 0.7)', margin: '0 0.5rem' }} />

        {/* Active Comparison Indicator */}
        {meta ? (
          <div className="active-file-indicator">
            <FileSpreadsheet size={16} color="var(--primary)" />
            <span className="active-file-name" title={meta.originalFileName}>
              {meta.originalFileName}
            </span>
            <ArrowRight size={13} color="var(--text-subtle)" />
            <span className="active-file-name" title={meta.modifiedFileName}>
              {meta.modifiedFileName}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary)',
                backgroundColor: 'rgba(239, 246, 255, 0.9)',
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                border: '1px solid var(--primary-border)',
                marginLeft: '0.35rem'
              }}
            >
              {(meta.modifiedSheets || []).length} sheets
            </span>
          </div>
        ) : (
          <div className="active-file-indicator">
            <FileSpreadsheet size={16} color="var(--text-subtle)" />
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>No Workbooks Loaded</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="navbar-right">
        {/* Sample Switcher Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
            title="Load ready-to-test sample workbooks"
          >
            <Play size={14} color="var(--primary)" />
            <span>Load Demo</span>
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.45rem',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 16px 40px rgba(31, 38, 135, 0.12)',
                width: 280,
                zIndex: 60,
                overflow: 'hidden',
                animation: 'modalFadeIn 120ms ease-out'
              }}
            >
              <div
                style={{
                  padding: '0.6rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-subtle)',
                  backgroundColor: 'rgba(248, 250, 252, 0.8)',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                  letterSpacing: '0.06em'
                }}
              >
                Sample Spreadsheet Models
              </div>

              <button
                onClick={() => handleSelectSample('financial')}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'block'
                }}
                className="dropdown-item"
              >
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                  Q3 Financial Model
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Multi-sheet, inverted operator, circular loop
                </div>
              </button>

              <button
                onClick={() => handleSelectSample('inventory')}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'block'
                }}
                className="dropdown-item"
              >
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                  Inventory Forecast
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Stock formulas, addition vs subtraction diffs
                </div>
              </button>

              <button
                onClick={() => handleSelectSample('csv')}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'block'
                }}
                className="dropdown-item"
              >
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                  Department Budget (CSV)
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Tabular row, cell & value diffs
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Upload Action */}
        <Link to="/new" className="btn btn-primary btn-sm">
          <Upload size={13} />
          <span>Compare Files</span>
        </Link>
      </div>
    </header>
  );
}
