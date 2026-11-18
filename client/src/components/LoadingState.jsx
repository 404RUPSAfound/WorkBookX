import React from 'react';
import { Layers } from 'lucide-react';

/**
 * Modern Linear-style Loading State with Pulsing Brand Glow
 */
export function LoadingState({ message = 'Analyzing spreadsheet data...' }) {
  return (
    <div className="state-box" style={{ borderStyle: 'solid', borderColor: 'var(--border-subtle)' }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--primary-subtle)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          position: 'relative'
        }}
      >
        <Layers size={22} />
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: 'var(--radius-xl)',
            border: '2px solid var(--primary)',
            borderTopColor: 'transparent',
            animation: 'spin 900ms linear infinite'
          }}
        />
      </div>

      <h3 className="state-title" style={{ fontSize: '1rem' }}>
        Processing Model Intelligence
      </h3>
      <p className="state-desc" style={{ fontSize: '0.8125rem' }}>
        {message}
      </p>
    </div>
  );
}
