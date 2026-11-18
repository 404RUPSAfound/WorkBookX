import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Reusable contextual sub-navigation tab bar for grouped sections.
 * Inspired by Linear, Stripe, and Vercel sub-view tabs.
 */
export function SubNavTabs({ tabs = [] }) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="subnav-tabs-bar">
      <div className="subnav-tabs-list">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => `subnav-tab-item ${isActive ? 'active' : ''}`}
          >
            {tab.icon && <span className="subnav-tab-icon">{tab.icon}</span>}
            <span className="subnav-tab-label">{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && tab.count > 0 && (
              <span className={`subnav-tab-badge ${tab.badgeVariant || ''}`}>
                {tab.count}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
