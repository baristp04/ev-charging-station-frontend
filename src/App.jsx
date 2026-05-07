// ── App.jsx ───────────────────────────────────────────────────────────────────
// Root layout component. Manages user session state and renders the sidebar
// with navigation links and the AuthPanel at the bottom.

import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Analytics from './pages/Analytics'
import MapStations from './pages/MapStations'
import Vehicles from './pages/Vehicles'
import Reservations from './pages/Reservations'
import AuthPanel from './components/AuthPanel'

export default function App() {
  const [user, setUser] = useState(null)

  // Restore user session from localStorage on initial load
  useEffect(() => {
    const saved = localStorage.getItem('ev_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  return (
    <div style={S.layout}>

      {/* ── Sidebar ── */}
      <nav style={S.sidebar}>
        <div style={S.logoContainer}>
          <div style={S.logoIcon}>⚡</div>
          <div style={S.logoText}>EV CHARGE</div>
        </div>

        {/* Navigation links — always visible regardless of auth state */}
        <div style={S.navMenu}>
          <NavLink to="/" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
            📍 Map & Stations
          </NavLink>
          <NavLink to="/vehicles" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
            🚘 My Vehicles
          </NavLink>
          <NavLink to="/reservations" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
            📅 My Reservations
          </NavLink>
          <NavLink to="/analytics" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
            📊 Management Reports
          </NavLink>
        </div>

        {/* Auth section — shows login/register or user info based on session */}
        <div style={S.sidebarBottom}>
          <AuthPanel
            user={user}
            onLogin={userData => setUser(userData)}
            onLogout={() => setUser(null)}
          />
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main style={S.content}>
        <Routes>
          <Route path="/"            element={<MapStations user={user} />} />
          <Route path="/vehicles"    element={<Vehicles />} />
          <Route path="/reservations" element={<Reservations user={user} />} />
          <Route path="/analytics"   element={<Analytics />} />
        </Routes>
      </main>

    </div>
  )
}

// ── Layout Stilleri ──
const S = {
  layout: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-base)',
  },

  sidebar: {
    width: '260px',
    height: '100vh',
    position: 'sticky',
    top: 0,
    backgroundColor: 'var(--bg-panel)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    overflowY: 'auto',
    flexShrink: 0,
  },

  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 24px 30px 24px',
    borderBottom: '1px solid var(--border)',
  },

  logoIcon: {
    width: '32px',
    height: '32px',
    backgroundColor: 'var(--accent-glow)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontWeight: 'bold',
  },

  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    letterSpacing: '2px',
    color: 'var(--text-primary)',
  },

  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '24px 16px',
    flex: 1,
  },

  navItem: {
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.2s',
  },

  navItemActive: {
    backgroundColor: 'var(--accent-glow)',
    color: 'var(--accent)',
    borderLeft: '4px solid var(--accent)',
  },

  sidebarBottom: {
    borderTop: '1px solid var(--border)',
    padding: '16px',
  },

  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
  },
}