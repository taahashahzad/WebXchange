import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from './UI';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/authService';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { to: '/',            label: 'Home' },
  { to: '/dashboard',   label: 'Dashboard' },
  { to: '/add-website', label: 'Add Website' },
  { to: '/exchange',    label: 'Surf / Exchange' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/pricing',     label: 'Pricing' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { isLoggedIn, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    try { await signOut(); navigate('/'); }
    catch (err) { alert(err.message); }
  }

  return (
    <header className={styles.nav}>
      <div className={styles.brand} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className={styles.logo}>WX</div>
        <span>WebXchange</span>
      </div>

      <nav className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </NavLink>
        ))}

        {/* Only visible to admin users */}
        {profile?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `${styles.link} ${styles.adminLink} ${isActive ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Admin
          </NavLink>
        )}
      </nav>

      <div className={styles.rightbar}>
        {isLoggedIn && profile && (
          <div className={styles.creditsBadge}>
            💳 {profile.credits.toLocaleString()}
          </div>
        )}

        {isLoggedIn ? (
          <>
            <div
              className={styles.avatar}
              onClick={() => navigate('/dashboard')}
              title="Dashboard"
            >
              {profile?.full_name?.[0]?.toUpperCase() || '👤'}
            </div>
            <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
          </>
        ) : (
          <Button variant="primary" onClick={() => navigate('/auth')}>Sign In</Button>
        )}

        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
}