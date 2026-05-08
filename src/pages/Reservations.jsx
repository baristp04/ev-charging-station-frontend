// ── Reservations.jsx ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'

const API = 'http://localhost:8000'

export default function Reservations({ user }) {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const driverID = user?.driverID

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

  if (!user) {
    return (
      <div style={S.shell}>
        <div style={S.header}><h1 style={S.pageTitle}>📅 My Reservations</h1></div>
        <div style={S.loginWall}>
          <div style={S.loginIcon}>🔒</div>
          <div style={S.loginMsg}>You need to log in to view your reservations.</div>
          <div style={S.loginSub}>You can log in from the left panel.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={S.shell}>
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>📅 My Reservations</h1>
          <p style={S.pageSub}>Select a station from the map to make a reservation.</p>
        </div>
        <button style={S.refreshBtn} onClick={fetchReservations}>🔄 Refresh</button>
      </div>

      <div style={S.body}>

        <div style={S.infoCard}>
          <span style={S.infoIcon}>💡</span>
          <span style={S.infoText}>
            To make a new reservation, go to the <strong style={{ color: 'var(--accent)' }}>Map & Stations</strong> page,
            select a station, and click on an available charger.
          </span>
        </div>

        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>🗓️ My Reservations</span>
            <span style={S.cardCount}>{reservations.length} reservations</span>
          </div>

          {error   && <div style={S.errorBox}>⚠️ {error}</div>}
          {loading && <div style={S.empty}>Loading...</div>}

          {!loading && reservations.length === 0 && (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>📭</div>
              <div style={S.emptyMsg}>You don't have any reservations yet.</div>
              <div style={S.emptySub}>You can start by selecting a station from the map.</div>
            </div>
          )}

          {!loading && reservations.length > 0 && (
            <div style={S.resList}>
              {reservations.map(r => (
                <div key={r.reservationID} style={S.resItem}>
                  <div style={S.resLeft}>
                    <div style={S.resTitle}>Reservation #{r.reservationID}</div>
                    <div style={S.resMeta}>
                      📅 {new Date(r.startTime).toLocaleString('tr-TR')} → {new Date(r.endTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={S.resMeta}>🔌 Unit #{r.charger_id} &nbsp;·&nbsp; 🚘 Vehicle #{r.vehicle_id}</div>
                  </div>
                  <div style={S.resRight}>
                    <div style={{ ...S.resBadge, backgroundColor: r.status === 'active' ? 'var(--accent-glow)' : '#1e1e1e', color: r.status === 'active' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {r.status === 'active' ? '● Active' : r.status}
                    </div>
                    {r.status === 'active' && (
                      <button style={S.cancelBtn} onClick={() => handleCancel(r.reservationID)}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const S = {
  shell:      { display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-base)' },
  header:     { padding: '32px 40px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  pageTitle:  { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' },
  pageSub:    { margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' },
  body:       { padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '20px' },
  refreshBtn: { padding: '8px 18px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' },
  infoCard:   { display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '14px 18px' },
  infoIcon:   { fontSize: '1.1rem', flexShrink: 0 },
  infoText:   { fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 },
  card:       { backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  cardTitle:  { fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' },
  cardCount:  { fontSize: '0.8rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border)' },
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
  cancelBtn:  { padding: '6px 14px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 'var(--radius)', fontSize: '0.8rem', cursor: 'pointer' },
  loginWall:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', padding: '80px 40px' },
  loginIcon:  { fontSize: '3rem', marginBottom: '8px' },
  loginMsg:   { fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' },
  loginSub:   { color: 'var(--text-secondary)', fontSize: '0.9rem' },
}