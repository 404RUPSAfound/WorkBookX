import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ComparisonProvider } from './context/ComparisonContext.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Navbar } from './components/Navbar.jsx';

import { OverviewPage } from './pages/OverviewPage.jsx';
import { NewComparisonPage } from './pages/NewComparisonPage.jsx';
import { ComparisonResultsPage } from './pages/ComparisonResultsPage.jsx';
import { FormulaAnalysisPage } from './pages/FormulaAnalysisPage.jsx';
import { DependencyGraphPage } from './pages/DependencyGraphPage.jsx';
import { RiskFindingsPage } from './pages/RiskFindingsPage.jsx';
import { ScenarioSimulatorPage } from './pages/ScenarioSimulatorPage.jsx';
import { FormulaAnomaliesPage } from './pages/FormulaAnomaliesPage.jsx';
import { DataQualityPage } from './pages/DataQualityPage.jsx';
import { VersionHistoryPage } from './pages/VersionHistoryPage.jsx';
import { AuditReportsPage } from './pages/AuditReportsPage.jsx';
import { AboutSettingsPage } from './pages/AboutSettingsPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ComparisonProvider>
        <div className="app-container">
          {/* Main Sidebar */}
          <Sidebar />

          {/* Main View Area */}
          <div className="main-content-wrapper">
            <Navbar />
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/new" element={<NewComparisonPage />} />
              <Route path="/results" element={<ComparisonResultsPage />} />
              <Route path="/formulas" element={<FormulaAnalysisPage />} />
              <Route path="/graph" element={<DependencyGraphPage />} />
              <Route path="/risks" element={<RiskFindingsPage />} />
              <Route path="/scenario" element={<ScenarioSimulatorPage />} />
              <Route path="/anomalies" element={<FormulaAnomaliesPage />} />
              <Route path="/data-quality" element={<DataQualityPage />} />
              <Route path="/history" element={<VersionHistoryPage />} />
              <Route path="/audit" element={<AuditReportsPage />} />
              <Route path="/settings" element={<AboutSettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </ComparisonProvider>
    </BrowserRouter>
  );
}
