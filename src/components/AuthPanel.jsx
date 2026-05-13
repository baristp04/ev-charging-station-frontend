// ── AuthPanel.jsx ─────────────────────────────────────────────────────────────
// Handles the auth section at the bottom of the sidebar.
// Sign In and Register both open as full-page standalone tabs.
// Logged-in view shows user info and a sign out button.

import { useNavigate } from 'react-router-dom';

export default function AuthPanel({ user, onLogin, onLogout }) {

  const navigate = useNavigate();

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('ev_user')
    sessionStorage.removeItem('ev_user')
    onLogout()
  }

  // ── Logged in view ──────────────────────────────────────────────────────────
  if (user) {
    return (
      <div style={S.userSection}>
        <div style={S.userInfo}>
          <div style={S.userAvatar}>👤</div>
          <div>
            <div style={S.userName}>{user.name}</div>
            <div style={S.userEmail}>{user.email}</div>
          </div>
        </div>
        <button style={S.logoutBtn} onClick={handleLogout}>Sign Out</button>
      </div>
    )
  }

  // ── Default: open full-page tabs ────────────────────────────────────────────
  return (
    <div style={S.panel}>
      <button style={S.primaryBtn} onClick={() => navigate('/signin')}>
        Sign In
      </button>
      <button style={S.secondaryBtn} onClick={() => navigate('/register')}>
        Create Account
      </button>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  panel:        { display: 'flex', flexDirection: 'column', gap: '10px' },
  primaryBtn: {
    padding: '9px', borderRadius: '8px', border: 'none',
    backgroundColor: 'var(--accent)', color: '#000',
    fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', width: '100%'
  },
  secondaryBtn: {
    padding: '9px', borderRadius: '8px', border: '1px solid var(--border)',
    backgroundColor: 'transparent', color: 'var(--text-secondary)',
    fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', width: '100%'
  },
  userSection: { display: 'flex', flexDirection: 'column', gap: '10px' },
  userInfo:    { display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar: {
    width: '36px', height: '36px', backgroundColor: 'var(--accent-glow)',
    borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '18px', flexShrink: 0
  },
  userName:  { color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' },
  userEmail: { color: 'var(--text-secondary)', fontSize: '0.75rem' },
  logoutBtn: {
    padding: '8px', borderRadius: '8px', border: '1px solid var(--border)',
    backgroundColor: 'transparent', color: 'var(--text-secondary)',
    cursor: 'pointer', fontSize: '0.85rem', width: '100%'
  }
}