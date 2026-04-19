import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/globals.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './components/ProtectedRoute';
import Navbar  from './components/Navbar';
import Footer  from './components/Footer';

import Home        from './pages/Home';
import Dashboard   from './pages/Dashboard';
import AddWebsite  from './pages/AddWebsite';
import Exchange    from './pages/Exchange';
import Leaderboard from './pages/Leaderboard';
import Auth        from './pages/Auth';
import Pricing     from './pages/Pricing';
import Admin       from './pages/Admin';

// Handles the token in the URL after email confirmation
function AuthRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard', { replace: true });
      }
    });
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
          <Routes>
            {/* Admin only */}
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

            {/* Public routes */}
            <Route path="/"           element={<Home />} />
            <Route path="/auth"       element={<Auth />} />
            <Route path="/pricing"    element={<Pricing />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* Protected routes — require login */}
            <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/add-website" element={<ProtectedRoute><AddWebsite /></ProtectedRoute>} />
            <Route path="/exchange"   element={<ProtectedRoute><Exchange /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}
