import { Routes, Route, NavLink } from 'react-router-dom'
import Analytics from './pages/Analytics'
import MapStations from './pages/MapStations';

function VehiclesPlaceholder() {
  return (
    <div style={{ padding: '40px', color: 'var(--text-primary)' }}>
      <h2>🚘 Araç Kayıt ve Yönetim Modülü</h2>
      <p style={{ color: 'var(--text-secondary)' }}>CRUD işlemleri buraya gelecek...</p>
    </div>
  )
}

// ── Layout (Sol Menü ve Sağ İçerik) ──
export default function App() {
  return (
    <div style={S.layout}>
      
      {/* SOL MENÜ (Sidebar) */}
      <nav style={S.sidebar}>
        <div style={S.logoContainer}>
          <div style={S.logoIcon}>⚡</div>
          <div style={S.logoText}>EV CHARGE</div>
        </div>

        <div style={S.navMenu}>
          {/* NavLink, eğer o sayfadaysak otomatik olarak "active" class'ı alır */}
          <NavLink to="/" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
            📍 Harita ve İstasyonlar
          </NavLink>
          
          <NavLink to="/vehicles" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
            🚘 Araçlarım
          </NavLink>
          
          <NavLink to="/analytics" style={({ isActive }) => isActive ? { ...S.navItem, ...S.navItemActive } : S.navItem}>
            📊 Yönetim Raporları
          </NavLink>
        </div>
      </nav>

      {/* SAĞ İÇERİK (Değişen Sayfalar) */}
      <main style={S.content}>
        <Routes>
          <Route path="/" element={<MapStations />} />
          <Route path="/vehicles" element={<VehiclesPlaceholder />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>

    </div>
  )
}

// ── Layout Stilleri ──
const S = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-base)'
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-panel)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 24px 30px 24px',
    borderBottom: '1px solid var(--border)'
  },
  logoIcon: {
    width: '32px', height: '32px',
    backgroundColor: 'var(--accent-glow)',
    color: 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '8px', fontWeight: 'bold'
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    letterSpacing: '2px',
    color: 'var(--text-primary)'
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '24px 16px'
  },
  navItem: {
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.2s'
  },
  navItemActive: {
    backgroundColor: 'var(--accent-glow)',
    color: 'var(--accent)',
    borderLeft: '4px solid var(--accent)'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    position: 'relative'
  }
}