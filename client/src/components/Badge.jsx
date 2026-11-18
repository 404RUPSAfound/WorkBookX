import React from 'react';

/**
 * Modern Linear-style Badge Component
 * Supports severity tiers and diff change types
 */
export function Badge({ variant = 'info', children, className = '', dot = true }) {
  const normalized = String(variant).toLowerCase();

  let badgeClass = 'badge badge-info';
  let dotColor = '#0284c7';

  if (normalized.includes('critical')) {
    badgeClass = 'badge badge-critical';
    dotColor = 'var(--critical)';
  } else if (normalized.includes('high')) {
    badgeClass = 'badge badge-high';
    dotColor = 'var(--high)';
  } else if (normalized.includes('medium')) {
    badgeClass = 'badge badge-medium';
    dotColor = 'var(--medium)';
  } else if (normalized.includes('low')) {
    badgeClass = 'badge badge-low';
    dotColor = 'var(--low)';
  } else if (normalized.includes('added')) {
    badgeClass = 'badge badge-added';
    dotColor = '#16a34a';
  } else if (normalized.includes('removed')) {
    badgeClass = 'badge badge-removed';
    dotColor = '#dc2626';
  } else if (normalized.includes('modified')) {
    badgeClass = 'badge badge-modified';
    dotColor = '#2563eb';
  } else if (normalized.includes('formula')) {
    badgeClass = 'badge badge-formula';
    dotColor = '#9333ea';
  }

  return (
    <span className={`${badgeClass} ${className}`}>
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: dotColor,
            display: 'inline-block',
            flexShrink: 0
          }}
        />
      )}
      {children}
    </span>
  );
}
