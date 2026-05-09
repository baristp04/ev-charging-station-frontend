// ── App.jsx ───────────────────────────────────────────────────────────────────
// Root layout. Manages user session state and renders sidebar + main content.
// /signin and /register render as standalone full-page routes (no sidebar).

import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Analytics from './pages/Analytics'
import MapStations from './pages/MapStations'
import Vehicles from './pages/Vehicles'
import Reservations from './pages/Reservations'
import Register from './pages/Register'
import SignIn from './pages/SignIn'
import AuthPanel from './components/AuthPanel'

export default function App() {
  const [user, setUser] = useState(null)
  const location = useLocation()

  // Restore session on mount — clear if expiry has passed
  useEffect(() => {
    const saved = localStorage.getItem('ev_user')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.expiry && Date.now() > parsed.expiry) {
        // Session expired — clear and force logout
        localStorage.removeItem('ev_user')
      } else {
        setUser(parsed)
      }
    }
  }, [])

  // Listen for localStorage changes from other tabs (sign-in/register tab → main tab)
  // Note: storage event only fires for localStorage, not sessionStorage
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('ev_user')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.expiry && Date.now() > parsed.expiry) {
          localStorage.removeItem('ev_user')
          setUser(null)
        } else {
          setUser(parsed)
        }
      } else {
        setUser(null)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Standalone pages — render without sidebar layout
  if (location.pathname === '/signin')   return <SignIn />
  if (location.pathname === '/register') return <Register />

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

          {/* SADECE SÜRÜCÜLER: Kendi araçları ve rezervasyonları */}
          {user?.role === 'driver' && (
            <>
              <NavLink to="/vehicles" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
                🚘 My Vehicles
              </NavLink>
              <NavLink to="/reservations" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
                📅 My Reservations
              </NavLink>
            </>
          )}

          {/* SADECE TEKNİSYEN VE UZMANLAR: Bakım ekranı */}
          {['technician', 'specialist'].includes(user?.role) && (
            <NavLink to="/maintenance" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
              🔧 Station Maintenance
            </NavLink>
          )} 

          {/* SADECE ANALİST VE UZMANLAR: Yönetim raporları */}
          {['analyst', 'specialist'].includes(user?.role) && (
            <NavLink to="/analytics" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
              📊 Management Reports
            </NavLink>
          )}
        </div>

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
          <Route path="/"             element={<MapStations user={user} />} />
          <Route path="/vehicles"     element={<Vehicles />} />
          <Route path="/reservations" element={<Reservations user={user} />} />
          <Route path="/analytics"    element={<Analytics user={user} />} />
          <Route path="/signin"       element={<SignIn />} />
          <Route path="/register"     element={<Register />} />
        </Routes>
      </main>

    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
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
    width: '32px', height: '32px',
    backgroundColor: 'var(--accent-glow)', color: 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '8px', fontWeight: 'bold',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700, letterSpacing: '2px', color: 'var(--text-primary)',
  },
  navMenu: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    padding: '24px 16px', flex: 1,
  },
  navItem: {
    padding: '12px 16px', borderRadius: 'var(--radius)',
    color: 'var(--text-secondary)', textDecoration: 'none',
    fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s',
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
    flex: 1, display: 'flex', flexDirection: 'column',
    minHeight: 0, overflow: 'hidden', position: 'relative',
  },
}