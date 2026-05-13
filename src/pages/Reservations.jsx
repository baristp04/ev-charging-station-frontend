// ── Reservations.jsx ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'

const API = 'http://localhost:8000'

export default function Reservations({ user }) {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [filter, setFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(4)

  useEffect(() => {
    setVisibleCount(4);
  }, [filter]);

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

  // ── YENİ: Filtreleme ve Sıralama Mantığı ──
  const processedReservations = reservations
    .filter(r => filter === 'all' ? true : r.status === filter)
    .sort((a, b) => {
      // 1. Öncelik sırası: Aktif olanlar her zaman en üstte (1 numara) olsun
      const statusPriority = { active: 1, completed: 2, expired: 3 };
      const priorityA = statusPriority[a.status] || 4;
      const priorityB = statusPriority[b.status] || 4;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 2. Eğer ikisinin statüsü aynıysa (örneğin ikisi de completed), en yeni olan en üstte gözüksün
      return new Date(b.startTime) - new Date(a.startTime);
    });

    const displayedReservations = processedReservations.slice(0, visibleCount);

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

  // Badge config per status
  const badgeStyle = (status) => {
    if (status === 'active')    return { backgroundColor: 'var(--accent-glow)', color: 'var(--accent)' }
    if (status === 'expired')   return { backgroundColor: 'rgba(255,184,0,0.12)', color: '#ffb800' }
    if (status === 'completed') return { backgroundColor: 'rgba(100,100,100,0.15)', color: '#888' }
    return { backgroundColor: '#1e1e1e', color: 'var(--text-secondary)' }
  }

  const badgeLabel = (status) => {
    if (status === 'active')    return '● Active'
    if (status === 'expired')   return '⏱ Expired'
    if (status === 'completed') return '✓ Completed'
    return status
  }

  return (
    // ── EKSİK OLAN KAPSAYICILAR BURAYA EKLENDİ ──
    <div style={S.shell}>
      <div style={S.body}>
        
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>🗓️ My Reservations</span>
            <span style={S.cardCount}>{processedReservations.length} reservations</span>
          </div>

          {/* ── YENİ: Filtreleme Butonları ── */}
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

          {/* ── Yüklenen rezervasyon sayısı kontrolü ── */}
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
                    opacity: r.status === 'expired' ? 0.7 : 1,
                  }}>
                    <div style={S.resLeft}>
                      <div style={S.resTitle}>Reservation #{r.reservationID}</div>
                      <div style={S.resMeta}>
                        🏢 {r.stationName || '—'} &nbsp;·&nbsp; 📍 {r.stationLocation || '—'}
                      </div>
                      <div style={S.resMeta}>
                        📅 {new Date(r.startTime).toLocaleString('tr-TR')} → {new Date(r.endTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={S.resMeta}>
                        🔌 {r.connectorType || `Unit #${r.charger_id}`} &nbsp;·&nbsp; 🚘 {r.vehicleBrand ? `${r.vehicleBrand} (${r.vehiclePlate})` : `Vehicle #${r.vehicle_id}`}
                      </div>
                    </div>
                    <div style={S.resRight}>
                      <div style={{ ...S.resBadge, ...badgeStyle(r.status) }}>
                        {badgeLabel(r.status)}
                      </div>
                      {r.status === 'active' && (
                        <button style={S.cancelBtn} onClick={() => handleCancel(r.reservationID)}>
                          Cancel
                        </button>
                      )}
                      {r.status === 'expired' && (
                        <span style={S.noAction}>No action available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── LOAD MORE BUTONU BURADA ── */}
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
  shell: { display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%', backgroundColor: 'var(--bg-base)' },
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
  cancelBtn:  { padding: '6px 14px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 'var(--radius)', fontSize: '0.8rem', cursor: 'pointer' },
  loadMoreWrapper: { display: 'flex', justifyContent: 'center', marginTop: '24px' },
  loadMoreBtn:     { padding: '10px 24px', backgroundColor: 'transparent', border: '1px solid var(--accent)', borderRadius: '24px', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' },
  noAction:   { fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' },
  loginWall:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', padding: '80px 40px' },
  loginIcon:  { fontSize: '3rem', marginBottom: '8px' },
  loginMsg:   { fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' },
  loginSub:   { color: 'var(--text-secondary)', fontSize: '0.9rem' },
} 