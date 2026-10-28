import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import RiskAnalysis from './pages/RiskAnalysis';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import { useEffect, useState } from 'react';
import { getSession } from './services/session';
import api from './services/api';

// ProtectedRoute checks active session in localStorage
const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState(getSession() ? 'checking' : 'signed-out');
  useEffect(() => {
    if (!getSession()) return;
    let active = true;
    api.getProfile().then(() => { if (active) setStatus('ready'); }).catch(() => { if (active) setStatus('unavailable'); });
    return () => { active = false; };
  }, []);
  if (status === 'signed-out') {
    return <Navigate to="/login" replace />;
  }
  if (status === 'checking') return <p className="p-6" role="status">Checking your session…</p>;
  if (status === 'unavailable') return <div className="p-6"><p role="alert">Unable to verify your session. The service may be waking up.</p><button className="underline mt-3" onClick={() => window.location.reload()}>Try again</button></div>;
  return children;
};


function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="risk-analysis" element={<RiskAnalysis />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
