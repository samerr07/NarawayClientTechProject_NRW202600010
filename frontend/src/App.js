import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';

import Landing from './components/Landing';
import Auth from './components/Auth';
import ClientDashboard from './components/client/ClientDashboard';
import CreateRFQ from './components/client/CreateRFQ';
import RFQDetail from './components/client/RFQDetail';
import VendorDashboard from './components/vendor/VendorDashboard';
import VendorProfile from './components/vendor/VendorProfile';
import Marketplace from './components/vendor/Marketplace';
import VendorRFQView from './components/vendor/VendorRFQView';
import AdminDashboard from './components/admin/AdminDashboard';
import ContractsPage from './components/shared/ContractsPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (role && user.role !== role && user.role !== 'admin') {
    const dest = user.role === 'admin' ? '/admin' : `/${user.role}/dashboard`;
    return <Navigate to={dest} replace />;
  }
  return children;
}

function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionId = hash.match(/session_id=([^&]+)/)?.[1];
    if (!sessionId) { navigate('/auth'); return; }

    const role = localStorage.getItem('google_auth_role') || 'client';
    axios.post(`${API}/auth/google/session`, { session_id: sessionId, role }, { withCredentials: true })
      .then(res => {
        setUser(res.data.user);
        localStorage.removeItem('google_auth_role');
        const userRole = res.data.user.role;
        navigate(userRole === 'admin' ? '/admin' : `/${userRole}/dashboard`, { replace: true });
      })
      .catch(() => navigate('/auth'));
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-['Inter']">Completing authentication...</p>
      </div>
    </div>
  );
}

function AppRouter() {
  const location = useLocation();
  // CRITICAL: Check URL fragment synchronously before useEffect runs
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/client/dashboard" element={<ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>} />
      <Route path="/client/rfqs/new" element={<ProtectedRoute role="client"><CreateRFQ /></ProtectedRoute>} />
      <Route path="/client/rfqs/:rfq_id" element={<ProtectedRoute role="client"><RFQDetail /></ProtectedRoute>} />
      <Route path="/vendor/dashboard" element={<ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>} />
      <Route path="/vendor/profile" element={<ProtectedRoute role="vendor"><VendorProfile /></ProtectedRoute>} />
      <Route path="/vendor/marketplace" element={<ProtectedRoute role="vendor"><Marketplace /></ProtectedRoute>} />
      <Route path="/vendor/rfqs/:rfq_id" element={<ProtectedRoute role="vendor"><VendorRFQView /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
