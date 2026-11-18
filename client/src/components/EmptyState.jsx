import React from 'react';
import { FolderSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Modern Empty State (Notion / Raycast style)
 */
export function EmptyState({
  icon: Icon = FolderSearch,
  title = 'No Data Found',
  description = 'No records match your current view or filter criteria.',
  actionLabel,
  actionTo,
  onAction
}) {
  return (
    <div className="state-box">
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface-alt)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}
      >
        <Icon size={22} />
      </div>

      <h3 className="state-title">{title}</h3>
      <p className="state-desc">{description}</p>

      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary btn-sm">
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
