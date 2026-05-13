import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000'

export default function Maintenance({ user }) {
  const [stations, setStations] = useState([])
  const [selectedStation, setSelectedStation] = useState(null)
  const [chargers, setChargers] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modal State for Scheduling
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [targetCharger, setTargetCharger] = useState(null)
  const [startTime, setStartTime] = useState('')

  // ── 1. Fetch Stations ────────────────────────────────────────────────────────
  const fetchStations = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/navigation/stations`)
      if (!res.ok) throw new Error('Failed to load stations')
      const data = await res.json()
      setStations(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStations() }, [])

  // ── 2. Fetch Chargers for Selected Station ──────────────────────────────────
  const fetchChargers = async (stationId) => {
    try {
      const res = await fetch(`${API_BASE}/api/stations/${stationId}/chargers`)
      if (!res.ok) throw new Error('Failed to load chargers')
      const data = await res.json()
      setChargers(data)
    } catch (err) {
      setError('Could not load chargers for this station.')
    }
  }

  const handleSelectStation = (station) => {
    setSelectedStation(station)
    fetchChargers(station.id || station.stationID)
    setError('')
    setSuccessMsg('')
  }

  // ── 3. Schedule Maintenance (UC-03) ──────────────────────────────────────────
  const handleSchedule = async (e) => {
    e.preventDefault()
    if (!startTime) return
    
    setActionLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      // Convert local datetime-local value to ISO string for FastAPI
      const isoTime = new Date(startTime).toISOString()
      
      const res = await fetch(`${API_BASE}/api/maintenance/schedule/${targetCharger.chargerID}?start_time=${encodeURIComponent(isoTime)}`, {
        method: 'POST'
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to schedule maintenance')
      
      setSuccessMsg(`✅ ${data.message} Status: ${data.charger_status}`)
      setIsModalOpen(false)
      fetchChargers(selectedStation.id || selectedStation.stationID) // Refresh list
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
      setTargetCharger(null)
      setStartTime('')
    }
  }

  // ── 4. Cancel/Override Maintenance ──────────────────────────────────────────
  const handleCancel = async (chargerId) => {
    if (!window.confirm("Are you sure you want to cancel maintenance and bring this unit back online?")) return

    setActionLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch(`${API_BASE}/api/maintenance/cancel/${chargerId}`, {
        method: 'POST'
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to cancel maintenance')
      
      setSuccessMsg(`✅ ${data.message}`)
      fetchChargers(selectedStation.id || selectedStation.stationID) // Refresh list
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const openScheduleModal = (charger) => {
    setTargetCharger(charger)
    setIsModalOpen(true)
  }

  // Security Check
  if (!user || !['specialist', 'technician', 'analyst'].includes(user.role)) {
    return (
      <div style={S.shell}>
        <div style={S.centerWall}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ color: 'var(--red)' }}>ACCESS DENIED</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You must be authorized staff to view station maintenance.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={S.shell} className="fade-up">
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>🔧 Station Maintenance</h1>
          <p style={S.pageSub}>Schedule downtime or mark chargers as operational.</p>
        </div>
      </div>

      {error && <div style={S.errorBanner}>⚠️ {error}</div>}
      {successMsg && <div style={S.successBanner}>{successMsg}</div>}

      <div style={S.layout}>
        {/* Left Pane: Station List */}
        <div style={S.stationList}>
          <h3 style={S.paneTitle}>Select Station</h3>
          {loading ? <div style={S.loading}>Loading stations...</div> : (
            stations.map(st => (
              <div 
                key={st.id} 
                style={{
                  ...S.stationCard, 
                  borderColor: selectedStation?.id === st.id ? 'var(--accent)' : 'var(--border)'
                }}
                onClick={() => handleSelectStation(st)}
              >
                <div style={S.stName}>{st.name}</div>
                <div style={S.stMeta}>📍 {st.location}</div>
                <div style={S.stMeta}>🔌 {st.available_chargers} / {st.total_chargers} Available</div>
              </div>
            ))
          )}
        </div>

        {/* Right Pane: Charger Details */}
        <div style={S.chargerList}>
          {!selectedStation ? (
            <div style={S.centerWall}>
              <div style={{ fontSize: '2rem', opacity: 0.5, marginBottom: '10px' }}>🏢</div>
              <div style={{ color: 'var(--text-secondary)' }}>Select a station from the list to view its chargers.</div>
            </div>
          ) : (
            <>
              <h3 style={S.paneTitle}>Units at {selectedStation.name}</h3>
              <div style={S.grid}>
                {chargers.map(c => (
                  <div key={c.chargerID} style={S.chargerCard}>
                    <div style={S.cTop}>
                      <span style={S.cUnit}>Unit #{c.chargerID}</span>
                      <span style={{
                        ...S.badge,
                        backgroundColor: c.status === 'available' ? 'rgba(0,255,157,0.1)' : c.status === 'occupied' ? 'rgba(255,184,0,0.1)' : 'rgba(255,59,92,0.1)',
                        color: c.status === 'available' ? 'var(--green)' : c.status === 'occupied' ? 'var(--yellow)' : 'var(--red)'
                      }}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div style={S.cSpecs}>
                      {c.type} · {c.powerOutput}kW · {c.connectorType}
                    </div>

                    {/* Maintenance Notes if offline or delayed */}
                    {c.maintenanceNotes && (
                      <div style={S.cNotes}>
                        <strong>LOG:</strong> {c.maintenanceNotes}
                      </div>
                    )}

                    <div style={S.cActions}>
                      {['available', 'occupied'].includes(c.status) ? (
                        <button 
                          style={S.btnSchedule} 
                          onClick={() => openScheduleModal(c)}
                          disabled={actionLoading}
                        >
                          ⚙️ Schedule Maint.
                        </button>
                      ) : (
                        <button 
                          style={S.btnCancel} 
                          onClick={() => handleCancel(c.chargerID)}
                          disabled={actionLoading}
                        >
                          🔄 Bring Online
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div style={S.modalOverlay}>
          <div style={S.modalContent} className="fade-up">
            <h3 style={{ marginBottom: '15px', color: 'var(--accent)' }}>
              Schedule Maintenance
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              If a session is currently active on Unit #{targetCharger?.chargerID}, the system will automatically delay the shutdown until the driver is finished.
            </p>
            
            <form onSubmit={handleSchedule} style={S.form}>
              <div style={S.inputGroup}>
                <label style={S.label}>Start Time</label>
                <input 
                  required 
                  type="datetime-local" 
                  style={S.input} 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                />
              </div>

              <div style={S.modalActions}>
                <button type="button" style={S.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" style={S.saveBtn} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  shell: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: 'var(--bg-base)' },
  header: { padding: '32px 40px 24px', borderBottom: '1px solid var(--border)' },
  pageTitle: { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' },
  pageSub: { margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' },
  errorBanner: { margin: '20px 40px 0', padding: '12px 16px', background: 'rgba(255,59,92,0.1)', border: '1px solid var(--red)', borderRadius: 'var(--radius)', color: 'var(--red)', fontSize: '0.9rem' },
  successBanner: { margin: '20px 40px 0', padding: '12px 16px', background: 'rgba(0,255,157,0.1)', border: '1px solid var(--green)', borderRadius: 'var(--radius)', color: 'var(--green)', fontSize: '0.9rem' },
  layout: { display: 'flex', flex: 1, overflow: 'hidden' },
  stationList: { width: '320px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', overflowY: 'auto' },
  chargerList: { flex: 1, padding: '20px 40px', overflowY: 'auto' },
  paneTitle: { fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' },
  stationCard: { padding: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'border 0.2s' },
  stName: { fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px' },
  stMeta: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  chargerCard: { background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column' },
  cTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cUnit: { fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' },
  badge: { padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' },
  cSpecs: { fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '16px' },
  cNotes: { fontSize: '0.8rem', color: 'var(--yellow)', background: 'rgba(255,184,0,0.05)', padding: '10px', borderRadius: '4px', borderLeft: '2px solid var(--yellow)', marginBottom: '16px', fontStyle: 'italic' },
  cActions: { marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' },
  btnSchedule: { width: '100%', padding: '10px', background: 'rgba(0,229,255,0.1)', color: 'var(--accent)', border: '1px solid var(--accent-dim)', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' },
  btnCancel: { width: '100%', padding: '10px', background: 'rgba(0,255,157,0.1)', color: 'var(--green)', border: '1px solid rgba(0,255,157,0.3)', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 'bold' },
  centerWall: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' },
  loading: { textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' },
  
  // Modal Styles
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, left: '260px' },
  modalContent: { background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: '400px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.75rem', color: 'var(--text-secondary)' },
  input: { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '10px', borderRadius: 'var(--radius)', outline: 'none' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' },
  cancelBtn: { background: 'transparent', border: '1px solid var(--border)', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius)', cursor: 'pointer' },
  saveBtn: { background: 'var(--accent)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer' }
}