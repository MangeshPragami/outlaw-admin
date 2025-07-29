// src/pages/AnalyticsDashboard.js
import React, { useContext, useState } from 'react';
import '../App.css';
import OverviewDashboard from '../components/features/analytics/OverviewDashboard';
import CreatorMetrics from '../components/features/analytics/CreatorMetrics';
import SMEMetrics from '../components/features/analytics/SMEMetrics';
import IdeaMetrics from '../components/features/analytics/IdeaMetrics';
import { FormMetrics, BookingMetrics } from '../components/features/analytics/FormMetrics';
import AnalyticsDebugger from '../components/features/analytics/AnalyticsDebugger';
import { AuthContext } from '../contexts/AuthContext';

const AnalyticsDashboard = () => {
  const [currentPage, setCurrentPage] = useState('overview');
  const { token } = useContext(AuthContext);

  const navigationItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'creators', label: 'Creators' },
    { key: 'sme', label: 'SMEs' },
    { key: 'ideas', label: 'Ideas' },
    { key: 'forms', label: 'Forms' },
    { key: 'bookings', label: 'Sessions' },
    { key: 'debug', label: 'Debug' }
  ];

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewDashboard token={token} />;
      case 'creators':
        return <CreatorMetrics token={token} />;
      case 'sme':
        return <SMEMetrics token={token} />;
      case 'ideas':
        return <IdeaMetrics token={token} />;
      case 'forms':
        return <FormMetrics token={token} />;
      case 'bookings':
        return <BookingMetrics token={token} />;
      case 'debug':
        return <AnalyticsDebugger token={token} />;
      default:
        return <OverviewDashboard token={token} />;
    }
  };

  return (
    <div className="App">
      <header className="analytics-header-professional">
        <div className="header-content-professional">
          <div className="header-title-professional">
            <h1>Outlaw Analytics</h1>
            <p>Real-time platform performance insights</p>
          </div>
          <nav className="analytics-nav-professional">
            {navigationItems.map((item) => (
              <button
                key={item.key}
                className={`nav-button-professional ${currentPage === item.key ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="analytics-main-professional">
        {renderCurrentPage()}
      </main>

      <footer className="analytics-footer-professional">
        <div className="footer-content-professional">
          <span>Outlaw Analytics Dashboard</span>
          <span>Auto-refresh: Every 30 seconds</span>
          <span>Real-time data from PostgreSQL</span>
          <span>Last data sync: {new Date().toLocaleString()}</span>
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsDashboard;