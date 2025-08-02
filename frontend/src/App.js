// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import IdeasStudies from './pages/IdeasStudies';
import Analytics from './pages/Analytics';
import Surveys from './pages/Surveys';
import Bookings from './pages/Bookings'; // NEW
import SMEInformation from './pages/SMEInformation';
import Settings from './pages/Settings';

import { AuthProvider, AuthContext } from './contexts/AuthContext';


function AppContent() {
  const { user, logout } = useContext(AuthContext);
  if (!user) {
    return <Login />;
  }
  return (
    <Router>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Navigate to="/user-management" />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/ideas-studies" element={<IdeasStudies />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/bookings" element={<Bookings />} /> {/* NEW */}
          <Route path="/sme-matching" element={<SMEInformation />} />
          <Route path="/settings" element={<Settings />} />
      
          <Route path="*" element={<Navigate to="/user-management" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;