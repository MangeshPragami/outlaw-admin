// src/components/Layout/Layout.js
import React from 'react';

import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/user-management', label: 'User Management' },
  { path: '/ideas-studies', label: 'Ideas & Studies' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/surveys', label: 'Surveys' },
  { path: '/sme-matching', label: 'SME Matching' },
  { path: '/settings', label: 'Settings' }
];

const Layout = ({ user, onLogout, children }) => {
  const location = useLocation();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={{ width: '220px', background: '#222', color: '#fff', padding: '30px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '20px', textAlign: 'center', marginBottom: '30px' }}>OUTLAW Admin</div>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              color: location.pathname === item.path ? '#e74c3c' : '#fff',
              background: location.pathname === item.path ? '#fff2' : 'none',
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: location.pathname === item.path ? 'bold' : 'normal',
              margin: '0 10px'
            }}
          >
            {item.label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', textAlign: 'center', padding: '20px 0' }}>
          <span>Welcome, {user?.email}</span>
          <br />
          <button onClick={onLogout} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Logout</button>
        </div>
      </nav>
      {/* Main Content */}
      <div style={{ flex: 1, background: '#f8f9fa', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
