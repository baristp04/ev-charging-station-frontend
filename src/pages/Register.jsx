// ── Register.jsx ──────────────────────────────────────────────────────────────
// Full-page standalone registration screen.
// Opened in a new tab via window.open('/register', '_blank') from AuthPanel.
// On success, stores session and closes the tab to return to the main app.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000/api/auth'

// ── Validation ────────────────────────────────────────────────────────────────
function validate(form) {
  const errors = {}

  if (!form.name.trim())
    errors.name = 'Full name is required.'

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email))
    errors.email = 'Please enter a valid email address.'

  const phoneDigits = form.phoneNumber.replace(/\s/g, '')
  if (!/^\d{10,15}$/.test(phoneDigits))
    errors.phoneNumber = 'Phone number must contain 10-15 digits only.'

  if (form.password.length < 8)
    errors.password = 'Password must be at least 8 characters.'
  else if (!/[A-Z]/.test(form.password))
    errors.password = 'Password must contain at least one uppercase letter.'
  else if (!/[0-9]/.test(form.password))
    errors.password = 'Password must contain at least one number.'

  if (form.confirmPassword !== form.password)
    errors.confirmPassword = 'Passwords do not match.'

  return errors
}

// ── Password strength score (0-4) ────────────────────────────────────────────
function getStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#00ff9d']

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', phoneNumber: '', password: '', confirmPassword: ''
  })
  const [errors, setErrors]           = useState({})
  const [apiError, setApiError]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState(false)
  const [remember, setRemember]       = useState(false)
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    setApiError('')
  }

  const strength = getStrength(form.password)

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phoneNumber: form.phoneNumber,
          password: form.password,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Registration failed.')

      // remember me off → 10 min expiry, on → 7 days expiry
      const expiry = remember
        ? Date.now() + 7 * 24 * 60 * 60 * 1000
        : Date.now() + 10 * 60 * 1000

      localStorage.setItem('ev_user', JSON.stringify({ ...data, expiry }))

      setSuccess(true)
      setTimeout(() => { window.close(); navigate('/') }, 1500)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <div style={S.title}>Account Created!</div>
            <div style={S.subtitle}>Redirecting you to the app...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Logo */}
        <div style={S.logoRow}>
          <div style={S.logoIcon}>⚡</div>
          <div style={S.logoText}>EV CHARGE</div>
        </div>

        <h1 style={S.title}>Create Account</h1>
        <p style={S.subtitle}>Join the EV Charging Network</p>

        {/* API error banner */}
        {apiError && <div style={S.errorBox}>⚠️ {apiError}</div>}

        {/* Full Name */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Full Name</label>
          <input
            style={{ ...S.input, ...(errors.name ? S.inputError : {}) }}
            type="text" placeholder="John Doe"
            value={form.name} onChange={e => updateField('name', e.target.value)}
          />
          {errors.name && <span style={S.fieldError}>{errors.name}</span>}
        </div>

        {/* Email */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Email Address</label>
          <input
            style={{ ...S.input, ...(errors.email ? S.inputError : {}) }}
            type="email" placeholder="you@example.com"
            value={form.email} onChange={e => updateField('email', e.target.value)}
          />
          {errors.email && <span style={S.fieldError}>{errors.email}</span>}
        </div>

        {/* Phone */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Phone Number</label>
          <input
            style={{ ...S.input, ...(errors.phoneNumber ? S.inputError : {}) }}
            type="tel" placeholder="5xxxxxxxxx"
            value={form.phoneNumber} onChange={e => updateField('phoneNumber', e.target.value)}
          />
          {errors.phoneNumber && <span style={S.fieldError}>{errors.phoneNumber}</span>}
        </div>

        {/* Password */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Password</label>
          <div style={S.inputWrapper}>
            <input
              style={{ ...S.input, ...(errors.password ? S.inputError : {}), paddingRight: '42px' }}
              type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
              value={form.password} onChange={e => updateField('password', e.target.value)}
            />
            <button style={S.eyeBtn} onClick={() => setShowPass(p => !p)}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {/* Strength bar */}
          {form.password.length > 0 && (
            <div style={S.strengthRow}>
              <div style={S.strengthBar}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    ...S.strengthSegment,
                    backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : '#1e2d45'
                  }} />
                ))}
              </div>
              <span style={{ ...S.strengthLabel, color: STRENGTH_COLORS[strength] }}>
                {STRENGTH_LABELS[strength]}
              </span>
            </div>
          )}
          {/* Rules hint */}
          <div style={S.hintBox}>
            <span style={{ color: form.password.length >= 8 ? '#00ff9d' : '#6b7fa3' }}>✓ At least 8 characters</span>
            <span style={{ color: /[A-Z]/.test(form.password) ? '#00ff9d' : '#6b7fa3' }}>✓ One uppercase letter</span>
            <span style={{ color: /[0-9]/.test(form.password) ? '#00ff9d' : '#6b7fa3' }}>✓ One number</span>
          </div>
          {errors.password && <span style={S.fieldError}>{errors.password}</span>}
        </div>

        {/* Confirm Password */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Confirm Password</label>
          <div style={S.inputWrapper}>
            <input
              style={{ ...S.input, ...(errors.confirmPassword ? S.inputError : {}), paddingRight: '42px' }}
              type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password"
              value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button style={S.eyeBtn} onClick={() => setShowConfirm(p => !p)}>
              {showConfirm ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.confirmPassword && <span style={S.fieldError}>{errors.confirmPassword}</span>}
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        {/* Sign in link */}
        <p style={S.switchText}>
          Already have an account?{' '}
          <span style={S.switchLink} onClick={() => navigate('/signin')}>
            Sign In
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
  errorBox: {
    backgroundColor: '#2d1515', border: '1px solid #ef4444',
    color: '#ef4444', padding: '10px 16px', borderRadius: '10px',
    marginBottom: '20px', fontSize: '0.85rem',
  },
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
  fieldError:   { fontSize: '0.78rem', color: '#ef4444' },
  strengthRow:  { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' },
  strengthBar:  { display: 'flex', gap: '4px', flex: 1 },
  strengthSegment: {
    flex: 1, height: '4px', borderRadius: '2px', transition: 'background-color 0.3s',
  },
  strengthLabel: { fontSize: '0.75rem', fontWeight: 600, minWidth: '40px' },
  hintBox: { display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px', fontSize: '0.78rem' },
  rememberLabel: {
    display: 'flex', alignItems: 'center',
    color: '#6b7fa3', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '20px',
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