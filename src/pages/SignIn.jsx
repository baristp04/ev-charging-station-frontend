// ── SignIn.jsx ────────────────────────────────────────────────────────────────
// Full-page standalone sign-in screen.
// Opened in a new tab via window.open('/signin', '_blank') from AuthPanel.
// On success, saves to localStorage (triggers storage event in main tab)
// then closes this tab.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000/api/auth'

export default function SignIn() {
  const navigate = useNavigate()

  const [form, setForm]         = useState({ email: '', password: '' })
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Invalid email or password.')

      // remember me off → 1 sec expiry, on → 7 days expiry
      const expiry = remember
        ? Date.now() + 7 * 24 * 60 * 60 * 1000
        : Date.now() + 1 * 1 * 1000

      localStorage.setItem('ev_user', JSON.stringify({ ...data, expiry }))

      // Close this tab; main tab picks up the change via storage event
      window.close()
      // Fallback if window.close() is blocked by the browser
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Logo */}
        <div style={S.logoRow}>
          <div style={S.logoIcon}>⚡</div>
          <div style={S.logoText}>EV CHARGE</div>
        </div>

        <h1 style={S.title}>Sign In</h1>
        <p style={S.subtitle}>Welcome back</p>

        {/* Email */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Email Address</label>
          <input
            style={{ ...S.input, ...(error ? S.inputError : {}) }}
            type="email" placeholder="you@example.com"
            value={form.email} onChange={e => updateField('email', e.target.value)}
          />
        </div>

        {/* Password */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Password</label>
          <div style={S.inputWrapper}>
            <input
              style={{ ...S.input, ...(error ? S.inputError : {}), paddingRight: '42px' }}
              type={showPass ? 'text' : 'password'} placeholder="Your password"
              value={form.password} onChange={e => updateField('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button style={S.eyeBtn} onClick={() => setShowPass(p => !p)}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {error && <span style={S.fieldError}>{error}</span>}
        </div>

        {/* Remember me */}
        <label style={S.rememberLabel}>
          <input
            type="checkbox" checked={remember}
            onChange={e => setRemember(e.target.checked)}
            style={{ marginRight: '8px', accentColor: '#00e5ff', cursor: 'pointer' }}
          />
          Remember me on this device
        </label>

        {/* Submit */}
        <button style={S.submitBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Register link */}
        <p style={S.switchText}>
          No account?{' '}
          <span style={S.switchLink} onClick={() => navigate('/register')}>
            Create Account
          </span>
        </p>

      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh', backgroundColor: '#0a0f1e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 16px', fontFamily: 'DM Sans, sans-serif',
  },
  card: {
    width: '100%', maxWidth: '460px', backgroundColor: '#111827',
    border: '1px solid #1e2d45', borderRadius: '16px', padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  logoRow:  { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' },
  logoIcon: {
    width: '32px', height: '32px', backgroundColor: 'rgba(0,229,255,0.1)',
    color: '#00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '8px', fontWeight: 'bold', fontSize: '16px',
  },
  logoText:    { fontWeight: 700, letterSpacing: '2px', color: '#e8f0fe', fontSize: '0.9rem' },
  title:       { margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 700, color: '#e8f0fe' },
  subtitle:    { margin: '0 0 28px', fontSize: '0.9rem', color: '#6b7fa3' },
  fieldGroup:  { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' },
  label: {
    fontSize: '0.78rem', fontFamily: 'Space Mono, monospace',
    color: '#6b7fa3', textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  input: {
    padding: '11px 14px', borderRadius: '8px', border: '1px solid #1e2d45',
    backgroundColor: '#1a2235', color: '#e8f0fe', fontSize: '0.9rem',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  inputError:   { borderColor: '#ef4444' },
  inputWrapper: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px',
  },
  fieldError:   { fontSize: '0.78rem', color: '#ef4444', marginTop: '4px' },
  rememberLabel: {
    display: 'flex', alignItems: 'center', color: '#6b7fa3',
    fontSize: '0.85rem', cursor: 'pointer', marginBottom: '20px',
  },
  submitBtn: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(135deg, #00e5ff, #00ff9d)',
    color: '#0a0f1e', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
    marginBottom: '18px',
  },
  switchText: { textAlign: 'center', fontSize: '0.85rem', color: '#6b7fa3', margin: 0 },
  switchLink: { color: '#00e5ff', cursor: 'pointer', fontWeight: 600 },
}