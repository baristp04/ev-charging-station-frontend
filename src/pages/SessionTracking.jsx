// ── SessionTracking.jsx ───────────────────────────────────────────────────────
// Live charging session dashboard. Polls the backend every 5 seconds to show
// real-time progress (kWh consumed, cost so far, time remaining).
// Accessible via sidebar "⚡ Active Session" or redirect from Reservations page.

import { useState, useEffect, useRef, useCallback } from 'react'
import ConfirmModal from '../components/ConfirmModal'

const API = 'http://localhost:8000'
const POLL_INTERVAL = 5000 // poll every 5 seconds

export default function SessionTracking({ user }) {
  const [session, setSession]     = useState(null)   // live session data from /status
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)  // session just completed
  const [modalOpen, setModalOpen] = useState(false)  // stop confirm modal
  const intervalRef = useRef(null)

  const driverID = user?.driverID

  // ── Stop session (useCallback so it's stable across renders) ─────────────
  const stopSession = useCallback((id) => {
    clearInterval(intervalRef.current)
    fetch(`${API}/api/v1/charging/${id}/stop`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        setDone(true)
        setSession(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          totalCost: data.summary?.totalCost ?? prev?.currentCost,
          energyConsumed: data.summary?.totalKwh ?? prev?.energyConsumed,
          elapsedMinutes: data.summary?.durationMinutes ?? prev?.elapsedMinutes,
        }))
      })
      .catch(() => setError('Failed to finalize session.'))
  }, [])

  // ── Step 1: Find active session for this driver ───────────────────────────
  useEffect(() => {
    if (!driverID) { setLoading(false); return }

    fetch(`${API}/api/v1/charging/active-session-for-driver/${driverID}`)
      .then(r => r.json())
      .then(data => {
        if (data.sessionID) {
          setSessionId(data.sessionID)
        } else {
          setLoading(false)
        }
      })
      .catch(() => { setError('Could not reach server.'); setLoading(false) })
  }, [driverID])

  // ── Step 2: Poll session status once we have a sessionId ─────────────────
  useEffect(() => {
    if (!sessionId) return

    const poll = () => {
      fetch(`${API}/api/v1/charging/${sessionId}/status`)
        .then(r => r.json())
        .then(data => {
          setSession(data)
          setLoading(false)

          // Auto-stop when progress reaches 100%
          if (data.progress >= 100 && data.status === 'active') {
            stopSession(sessionId)
          }
        })
        .catch(() => setError('Lost connection to session.'))
    }

    poll() // immediate first call
    intervalRef.current = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [sessionId, stopSession])

  // ── No user ───────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={S.shell}>
        <div style={S.center}>
          <div style={S.bigIcon}>🔒</div>
          <div style={S.bigMsg}>Please log in to view your session.</div>
        </div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={S.shell}>
        <div style={S.center}>
          <div style={S.spinner} />
          <div style={S.bigMsg}>Checking for active session...</div>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={S.shell}>
        <div style={S.center}>
          <div style={S.bigIcon}>⚠️</div>
          <div style={S.bigMsg}>{error}</div>
        </div>
      </div>
    )
  }

  // ── No active session ─────────────────────────────────────────────────────
  if (!sessionId || !session) {
    return (
      <div style={S.shell}>
        <div style={S.center}>
          <div style={S.bigIcon}>🔌</div>
          <div style={S.bigMsg}>No active charging session.</div>
          <div style={S.bigSub}>Start a session from your Reservations page.</div>
        </div>
      </div>
    )
  }

  const progress = Math.min(100, session.progress ?? 0)
  const isCompleted = done || session.status === 'completed'

  // ── Ana render ────────────────────────────────────────────────────────────
  return (
    <div style={S.shell}>
      <div style={S.body}>

        {/* ── Header ── */}
        <div style={S.headerRow}>
          <div>
            <h1 style={S.title}>
              {isCompleted ? '✅ Charging Complete' : '⚡ Charging in Progress'}
            </h1>
            <div style={S.subtitle}>Session #{sessionId}</div>
          </div>
          <div style={S.headerRight}>
            <div style={{
              ...S.statusBadge,
              backgroundColor: isCompleted ? 'rgba(34,197,94,0.12)' : 'var(--accent-glow)',
              color: isCompleted ? '#22c55e' : 'var(--accent)',
            }}>
              {isCompleted ? '✓ Completed' : '● Live'}
            </div>
            {!isCompleted && (
              <button
                style={S.stopBtn}
                onClick={() => setModalOpen(true)}
              >
                ⏹ Stop Charging
              </button>
            )}
          </div>
        </div>

        {/* ── Progress ring + main stat ── */}
        <div style={S.progressCard}>
          <div style={S.ringWrapper}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              {/* Background track */}
              <circle
                cx="90" cy="90" r="76"
                fill="none"
                stroke="var(--border)"
                strokeWidth="12"
              />
              {/* Progress arc */}
              <circle
                cx="90" cy="90" r="76"
                fill="none"
                stroke={isCompleted ? '#22c55e' : 'var(--accent)'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 76}`}
                strokeDashoffset={`${2 * Math.PI * 76 * (1 - progress / 100)}`}
                transform="rotate(-90 90 90)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              {/* Center text */}
              <text x="90" y="85" textAnchor="middle" fill="var(--text-primary)" fontSize="28" fontWeight="700">
                {progress}%
              </text>
              <text x="90" y="108" textAnchor="middle" fill="var(--text-secondary)" fontSize="12">
                {isCompleted ? 'Done' : 'Charged'}
              </text>
            </svg>
          </div>

          {/* Stats grid */}
          <div style={S.statsGrid}>
            <StatBox
              icon="⚡"
              label="Energy Consumed"
              value={`${session.energyConsumed ?? 0} kWh`}
            />
            <StatBox
              icon="💰"
              label={isCompleted ? 'Total Cost' : 'Cost So Far'}
              value={`${isCompleted ? (session.totalCost ?? session.currentCost ?? 0) : (session.currentCost ?? 0)} ₺`}
              highlight
            />
            <StatBox
              icon="⏱️"
              label="Elapsed"
              value={`${session.elapsedMinutes ?? 0} min`}
            />
            <StatBox
              icon="🕐"
              label={isCompleted ? 'Completed' : 'Remaining'}
              value={isCompleted ? '—' : `${session.remainingMinutes ?? 0} min`}
            />
            <StatBox
              icon="🔋"
              label="Charger Power"
              value={`${session.chargerPower ?? 0} kW`}
            />
            <StatBox
              icon="📊"
              label="Status"
              value={isCompleted ? 'Completed' : 'Active'}
            />
          </div>
        </div>

        {/* ── Completion receipt ── */}
        {isCompleted && (
          <div style={S.receiptCard}>
            <div style={S.receiptTitle}>🧾 Session Receipt</div>
            <div style={S.receiptRow}>
              <span>Energy consumed</span>
              <span>{session.energyConsumed ?? 0} kWh</span>
            </div>
            <div style={S.receiptRow}>
              <span>Duration</span>
              <span>{session.elapsedMinutes ?? 0} minutes</span>
            </div>
            <div style={{ ...S.receiptRow, ...S.receiptTotal }}>
              <span>Total charged</span>
              <span>{session.totalCost ?? session.currentCost ?? 0} ₺</span>
            </div>
            <div style={S.receiptNote}>
              Payment was deducted from your wallet at reservation time.
            </div>
          </div>
        )}

        {/* ── Live pulse indicator ── */}
        {!isCompleted && (
          <div style={S.liveRow}>
            <span style={S.pulseDot} />
            <span style={S.liveText}>Live · Updates every 5 seconds</span>
          </div>
        )}

      </div>

      {/* ── Stop session confirm modal ── */}
      <ConfirmModal
        isOpen={modalOpen}
        icon="⏹"
        iconColor="#ef4444"
        title="Stop Charging?"
        message="The session will end immediately. No refund will be issued for the remaining time."
        confirmLabel="Yes, Stop"
        confirmColor="#ef4444"
        cancelLabel="Keep Charging"
        onConfirm={() => { setModalOpen(false); stopSession(sessionId) }}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  )
}

// ── StatBox sub-component ─────────────────────────────────────────────────────
function StatBox({ icon, label, value, highlight }) {
  return (
    <div style={{
      ...S.statBox,
      border: highlight ? '1px solid var(--accent)' : '1px solid var(--border)',
      backgroundColor: highlight ? 'var(--accent-glow)' : 'var(--bg-base)',
    }}>
      <div style={S.statIcon}>{icon}</div>
      <div style={S.statLabel}>{label}</div>
      <div style={{
        ...S.statValue,
        color: highlight ? 'var(--accent)' : 'var(--text-primary)',
      }}>{value}</div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  shell: {
    display: 'flex', flexDirection: 'column',
    height: '100%', overflowY: 'auto',
    backgroundColor: 'var(--bg-base)',
  },
  body: {
    padding: '32px 40px',
    display: 'flex', flexDirection: 'column', gap: '24px',
    maxWidth: '860px',
  },
  center: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    flex: 1, gap: '14px', padding: '80px 40px',
  },
  bigIcon:  { fontSize: '3rem' },
  bigMsg:   { fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' },
  bigSub:   { fontSize: '0.88rem', color: 'var(--text-secondary)' },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid var(--border)',
    borderTop: '3px solid var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  // Header
  headerRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  headerRight: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px',
  },
  stopBtn: {
    padding: '8px 16px',
    backgroundColor: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    border: '1px solid #ef4444',
    borderRadius: 'var(--radius)',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { marginTop: '4px', fontSize: '0.88rem', color: 'var(--text-secondary)' },
  statusBadge: {
    padding: '6px 16px', borderRadius: '20px',
    fontSize: '0.82rem', fontWeight: 700,
    flexShrink: 0,
  },

  // Progress card
  progressCard: {
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '32px',
    display: 'flex', gap: '40px', alignItems: 'center',
    flexWrap: 'wrap',
  },
  ringWrapper: { flexShrink: 0 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    flex: 1, minWidth: '240px',
  },
  statBox: {
    borderRadius: 'var(--radius)',
    padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  statIcon:  { fontSize: '1rem' },
  statLabel: { fontSize: '0.75rem', color: 'var(--text-secondary)' },
  statValue: { fontSize: '1rem', fontWeight: 700 },

  // Receipt
  receiptCard: {
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid #22c55e44',
    borderRadius: 'var(--radius)',
    padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  receiptTitle: { fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' },
  receiptRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.88rem', color: 'var(--text-secondary)',
  },
  receiptTotal: {
    fontWeight: 700, fontSize: '1rem',
    color: 'var(--text-primary)',
    paddingTop: '12px',
    borderTop: '1px solid var(--border)',
  },
  receiptNote: {
    fontSize: '0.78rem', color: 'var(--text-secondary)',
    fontStyle: 'italic', marginTop: '4px',
  },

  // Live indicator
  liveRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  pulseDot: {
    display: 'inline-block',
    width: '8px', height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  liveText: { fontSize: '0.82rem', color: 'var(--text-secondary)' },
}