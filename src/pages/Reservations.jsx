// ── Reservations.jsx ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatLocalTime, formatLocalTimeOnly } from '../utils/dateUtils'

const API = 'http://localhost:8000'

export default function Reservations({ user }) {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [filter, setFilter]             = useState('all')
  const [visibleCount, setVisibleCount] = useState(4)
  const [startingId, setStartingId]     = useState(null) // tracks which reservation is being started

  const navigate   = useNavigate()
  const driverID   = user?.driverID

  // Reset visible count whenever the filter changes
  useEffect(() => { setVisibleCount(4) }, [filter])

  const fetchReservations = () => {
    if (!driverID) return
    setLoading(true)
    fetch(`${API}/api/stations/my-reservations/${driverID}`)
      .then(r => r.json())
      .then(data => { setReservations(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setError('Could not load reservations.'); setLoading(false) })
  }

  useEffect(() => { fetchReservations() }, [driverID])

  const handleCancel = async (reservationID) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return
    try {
      const res = await fetch(`${API}/api/stations/reservations/${reservationID}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setReservations(prev => prev.filter(r => r.reservationID !== reservationID))
    } catch {
      alert('Cancellation failed.')
    }
  }

  // ── Start charging session for a reservation ───────────────────────────────
  const handleStartCharging = async (reservationID) => {
    setStartingId(reservationID)
    try {
      const res = await fetch(
        `${API}/api/v1/charging/start?reservation_id=${reservationID}`,
        { method: 'POST' }
      )
      if (!res.ok) {
        const err = await res.json()
        alert(err.detail || 'Could not start session.')
        setStartingId(null)
        return
      }
      // Navigate to the live session page
      navigate('/session-tracking')
    } catch {
      alert('Could not connect to server.')
      setStartingId(null)
    }
  }

  // ── Returns true if the reservation's startTime has been reached ───────────
  const canStartCharging = (reservation) => {
    if (reservation.status !== 'active') return false
    const startTime = new Date(reservation.startTime)
    // Add Z if no timezone info (FastAPI returns naive UTC datetimes)
    const normalized = reservation.startTime.endsWith('Z')
      ? startTime
      : new Date(reservation.startTime + 'Z')
    return new Date() >= normalized
  }

  // Filter and sort: active first, then by most recent startTime
  const processedReservations = reservations
    .filter(r => filter === 'all' ? true : r.status === filter)
    .sort((a, b) => {
      const statusPriority = { active: 1, completed: 2, expired: 3, failed: 4 }
      const priorityA = statusPriority[a.status] || 5
      const priorityB = statusPriority[b.status] || 5
      if (priorityA !== priorityB) return priorityA - priorityB
      return new Date(b.startTime) - new Date(a.startTime)
    })

  const displayedReservations = processedReservations.slice(0, visibleCount)

  if (!user) {
    return (
      <div style={S.shell}>
        <div style={S.loginWall}>
          <div style={S.loginIcon}>🔒</div>
          <div style={S.loginMsg}>You need to log in to view your reservations.</div>
          <div style={S.loginSub}>You can log in from the left panel.</div>
        </div>
      </div>
    )
  }

  // Badge style config per reservation status
  const badgeStyle = (status) => {
    if (status === 'active')    return { backgroundColor: 'var(--accent-glow)', color: 'var(--accent)' }
    if (status === 'expired')   return { backgroundColor: 'rgba(255,184,0,0.12)', color: '#ffb800' }
    if (status === 'completed') return { backgroundColor: 'rgba(100,100,100,0.15)', color: '#888' }
    if (status === 'failed')    return { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }
    return { backgroundColor: '#1e1e1e', color: 'var(--text-secondary)' }
  }

  const badgeLabel = (status) => {
    if (status === 'active')    return '● Active'
    if (status === 'expired')   return '⏱ Expired'
    if (status === 'completed') return '✓ Completed'
    if (status === 'failed')    return '✕ Failed'
    return status
  }

  return (
    <div style={S.shell}>
      <div style={S.body}>

        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>🗓️ My Reservations</span>
            <span style={S.cardCount}>{processedReservations.length} reservations</span>
          </div>

          {/* Filter buttons */}
          <div style={S.filterRow}>
            {['all', 'active', 'completed', 'expired'].map(f => (
              <button
                key={f}
                style={filter === f ? S.filterBtnActive : S.filterBtn}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {error   && <div style={S.errorBox}>⚠️ {error}</div>}
          {loading && <div style={S.empty}>Loading...</div>}

          {/* Empty state */}
          {!loading && displayedReservations.length === 0 && (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>📭</div>
              <div style={S.emptyMsg}>No reservations found.</div>
              <div style={S.emptySub}>Try changing the filter or make a new reservation.</div>
            </div>
          )}

          {!loading && displayedReservations.length > 0 && (
            <>
              <div style={S.resList}>
                {displayedReservations.map(r => (
                  <div key={r.reservationID} style={{
                    ...S.resItem,
                    opacity: (r.status === 'expired' || r.status === 'failed') ? 0.7 : 1,
                  }}>
                    <div style={S.resLeft}>
                      <div style={S.resTitle}>Reservation #{r.reservationID}</div>
                      <div style={S.resMeta}>
                        🏢 {r.stationName || '—'} &nbsp;·&nbsp; 📍 {r.stationLocation || '—'}
                      </div>
                      <div style={S.resMeta}>
                        {/* formatLocalTime converts UTC from DB to Istanbul local time */}
                        📅 {formatLocalTime(r.startTime)} → {formatLocalTimeOnly(r.endTime)}
                      </div>
                      <div style={S.resMeta}>
                        🔌 {r.connectorType || `Unit #${r.charger_id}`} &nbsp;·&nbsp; 🚘 {r.vehicleBrand ? `${r.vehicleBrand} (${r.vehiclePlate})` : `Vehicle #${r.vehicle_id}`}
                      </div>
                    </div>

                    <div style={S.resRight}>
                      <div style={{ ...S.resBadge, ...badgeStyle(r.status) }}>
                        {badgeLabel(r.status)}
                      </div>

                      {/* Start Charging — only shown when startTime has passed */}
                      {canStartCharging(r) && (
                        <button
                          style={startingId === r.reservationID ? S.startBtnLoading : S.startBtn}
                          onClick={() => handleStartCharging(r.reservationID)}
                          disabled={startingId === r.reservationID}
                        >
                          {startingId === r.reservationID ? 'Starting...' : '⚡ Start Charging'}
                        </button>
                      )}

                      {/* Cancel — only when active AND startTime not yet reached */}
                      {r.status === 'active' && !canStartCharging(r) && (
                        <button style={S.cancelBtn} onClick={() => handleCancel(r.reservationID)}>
                          Cancel
                        </button>
                      )}

                      {r.status === 'expired' && (
                        <span style={S.noAction}>No action available</span>
                      )}

                      {r.status === 'failed' && (
                        <span style={{ ...S.noAction, color: '#ef4444' }}>Refunded to wallet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more button */}
              {visibleCount < processedReservations.length && (
                <div style={S.loadMoreWrapper}>
                  <button
                    style={S.loadMoreBtn}
                    onClick={() => setVisibleCount(prev => prev + 10)}
                  >
                    Load More...
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}

const S = {
  shell:      { display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%', backgroundColor: 'var(--bg-base)' },
  body:       { padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' },
  card:       { backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  cardTitle:  { fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' },
  cardCount:  { fontSize: '0.8rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border)' },
  filterRow:       { display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' },
  filterBtn:       { padding: '6px 16px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' },
  filterBtnActive: { padding: '6px 16px', backgroundColor: 'var(--accent)', border: 'none', borderRadius: '20px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' },
  errorBox:   { backgroundColor: '#2d1515', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 16px', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '0.88rem' },
  empty:      { color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '16px 0', textAlign: 'center' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '48px 0' },
  emptyIcon:  { fontSize: '2.5rem' },
  emptyMsg:   { fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' },
  emptySub:   { fontSize: '0.85rem', color: 'var(--text-secondary)' },
  resList:    { display: 'flex', flexDirection: 'column', gap: '12px' },
  resItem:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' },
  resLeft:    { display: 'flex', flexDirection: 'column', gap: '5px' },
  resRight:   { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0, marginLeft: '16px' },
  resTitle:   { fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' },
  resMeta:    { fontSize: '0.82rem', color: 'var(--text-secondary)' },
  resBadge:   { padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 },
  startBtn: {
    padding: '7px 14px',
    backgroundColor: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  startBtnLoading: {
    padding: '7px 14px',
    backgroundColor: 'var(--accent-glow)',
    color: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: 'var(--radius)',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'not-allowed',
  },
  cancelBtn:       { padding: '6px 14px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 'var(--radius)', fontSize: '0.8rem', cursor: 'pointer' },
  loadMoreWrapper: { display: 'flex', justifyContent: 'center', marginTop: '24px' },
  loadMoreBtn:     { padding: '10px 24px', backgroundColor: 'transparent', border: '1px solid var(--accent)', borderRadius: '24px', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' },
  noAction:        { fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' },
  loginWall:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', padding: '80px 40px' },
  loginIcon:       { fontSize: '3rem', marginBottom: '8px' },
  loginMsg:        { fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' },
  loginSub:        { color: 'var(--text-secondary)', fontSize: '0.9rem' },
}