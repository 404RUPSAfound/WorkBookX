import React, { useState, useEffect } from 'react';

/**
 * Premium StatCard Component (Fondo / Relink / Stripe Style)
 * Supports animated numeric count-up, squircle icon, and trend indicators
 */
export function StatCard({ label, value, icon: Icon, footer, color, trend }) {
  // If value is numeric, run a subtle smooth count-up
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10);
  const isPureNumber = !isNaN(numericValue) && String(value).trim() === String(numericValue);

  const [displayValue, setDisplayValue] = useState(isPureNumber ? 0 : value);

  useEffect(() => {
    if (!isPureNumber) {
      setDisplayValue(value);
      return;
    }

    // Smooth count-up animation over 350ms
    const start = 0;
    const end = numericValue;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 350;
    const frameRate = 16;
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out cubic
      const current = Math.round(end * (1 - Math.pow(1 - progress, 3)));
      setDisplayValue(current);

      if (frame >= totalFrames) {
        clearInterval(counter);
        setDisplayValue(end);
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [value, isPureNumber, numericValue]);

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div
            className="stat-icon-wrapper"
            style={color ? { backgroundColor: `${color}15`, color } : { backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)' }}
          >
            <Icon size={15} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <div className="stat-value" style={color ? { color } : undefined}>
          {displayValue}
        </div>
        {trend && (
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '0.1rem 0.4rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)'
            }}
          >
            {trend}
          </span>
        )}
      </div>

      {footer && (
        <div className="stat-footer">
          <span>{footer}</span>
        </div>
      )}
    </div>
  );
}
