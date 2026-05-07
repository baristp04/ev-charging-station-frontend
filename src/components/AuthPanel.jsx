// ── AuthPanel.jsx ─────────────────────────────────────────────────────────────
// Handles all authentication UI and logic: login, register, and user session.
// Rendered at the bottom of the sidebar in App.jsx.

import { useState } from 'react'

const API = 'http://localhost:8000/api/auth'

function hashNotNeeded() {} // Hashing is handled server-side

// ── Helper: POST request to auth endpoints ────────────────────────────────────
async function authRequest(endpoint, body) {
  const res = await fetch(`${API}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export default function AuthPanel({ user, onLogin, onLogout }) {
  const [view, setView] = useState('none') // 'none' | 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const reset = () => {
    setForm({ name: '', email: '', phoneNumber: '', password: '' })
    setError('')
    setView('none')
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoading(true)
    try {
      const data = await authRequest('login', { email: form.email, password: form.password })
      localStorage.setItem('ev_user', JSON.stringify(data))
      onLogin(data)
      reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Register ────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setLoading(true)
    try {
      const data = await authRequest('register', form)
      localStorage.setItem('ev_user', JSON.stringify(data))
      onLogin(data)
      reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('ev_user')
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

  // ── Login form ──────────────────────────────────────────────────────────────
  if (view === 'login') {
    return (
      <div style={S.panel}>
        <div style={S.panelHeader}>
          <span style={S.panelTitle}>Sign In</span>
          <button style={S.closeBtn} onClick={reset}>✕</button>
        </div>
        <input style={S.input} type="email" placeholder="Email"
          value={form.email} onChange={e => updateField('email', e.target.value)} />
        <input style={S.input} type="password" placeholder="Password"
          value={form.password} onChange={e => updateField('password', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        {error && <p style={S.error}>{error}</p>}
        <button style={S.primaryBtn} onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p style={S.switchText}>
          No account?{' '}
          <span style={S.switchLink} onClick={() => { setView('register'); setError('') }}>
            Register
          </span>
        </p>
      </div>
    )
  }

  // ── Register form ───────────────────────────────────────────────────────────
  if (view === 'register') {
    return (
      <div style={S.panel}>
        <div style={S.panelHeader}>
          <span style={S.panelTitle}>Create Account</span>
          <button style={S.closeBtn} onClick={reset}>✕</button>
        </div>
        <input style={S.input} type="text" placeholder="Full Name"
          value={form.name} onChange={e => updateField('name', e.target.value)} />
        <input style={S.input} type="email" placeholder="Email"
          value={form.email} onChange={e => updateField('email', e.target.value)} />
        <input style={S.input} type="tel" placeholder="Phone Number"
          value={form.phoneNumber} onChange={e => updateField('phoneNumber', e.target.value)} />
        <input style={S.input} type="password" placeholder="Password"
          value={form.password} onChange={e => updateField('password', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRegister()} />
        {error && <p style={S.error}>{error}</p>}
        <button style={S.primaryBtn} onClick={handleRegister} disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
        <p style={S.switchText}>
          Already have an account?{' '}
          <span style={S.switchLink} onClick={() => { setView('login'); setError('') }}>
            Sign In
          </span>
        </p>
      </div>
    )
  }

  // ── Default: show sign in / register buttons ────────────────────────────────
  return (
    <div style={S.panel}>
      <button style={S.primaryBtn} onClick={() => setView('login')}>Sign In</button>
      <button style={S.secondaryBtn} onClick={() => setView('register')}>Create Account</button>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  panel: { display: 'flex', flexDirection: 'column', gap: '10px' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  panelTitle: { color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '2px 6px' },
  input: {
    padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)',
    fontSize: '0.85rem', outline: 'none', width: '100%', boxSizing: 'border-box'
  },
  error: { color: '#ff4d4d', fontSize: '0.8rem', margin: 0 },
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
  switchText: { color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, textAlign: 'center' },
  switchLink: { color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 },
  userSection: { display: 'flex', flexDirection: 'column', gap: '10px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar: {
    width: '36px', height: '36px', backgroundColor: 'var(--accent-glow)',
    borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '18px', flexShrink: 0
  },
  userName: { color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' },
  userEmail: { color: 'var(--text-secondary)', fontSize: '0.75rem' },
  logoutBtn: {
    padding: '8px', borderRadius: '8px', border: '1px solid var(--border)',
    backgroundColor: 'transparent', color: 'var(--text-secondary)',
    cursor: 'pointer', fontSize: '0.85rem', width: '100%'
  }
}