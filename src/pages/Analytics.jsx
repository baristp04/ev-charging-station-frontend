import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts'

const API_BASE = ''

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt_tl  = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' ₺'
const fmt_kwh = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n) + ' kWh'
const fmt_num = (n) => new Intl.NumberFormat('tr-TR').format(n)
const fmt_date = (iso) => new Date(iso).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
const method_label = { credit_card: 'Kredi Kartı', debit_card: 'Banka Kartı', wallet: 'Cüzdan' }

// ── Sub-components ────────────────────────────────────────────────────────────

function Header() {
  return (
    <header style={S.header}>
      <div style={S.headerLeft}>
        <div style={S.logo}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L4 8v12l10 6 10-6V8L14 2z" stroke="var(--accent)" strokeWidth="1.5" fill="none"/>
            <path d="M14 8v6M11 11h6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="17" r="1.5" fill="var(--accent)"/>
          </svg>
        </div>
        <div>
          <div style={S.headerTitle}>EV NETWORK CONTROL</div>
          <div style={S.headerSub}>Administrative Revenue Dashboard</div>
        </div>
      </div>
      <div style={S.statusPill}>
        <span style={S.statusDot} />
        SYSTEM ONLINE
      </div>
    </header>
  )
}

function DateRangeBar({ startDate, endDate, onStart, onEnd, onFetch, loading }) {
  return (
    <div style={S.dateBar} className="fade-up fade-up-1">
      <div style={S.dateBarLabel}>RAPOR DÖNEMİ</div>
      <div style={S.dateBarControls}>
        <div style={S.dateField}>
          <label style={S.dateLabel}>BAŞLANGIÇ</label>
          <input
            type="date"
            value={startDate}
            onChange={e => onStart(e.target.value)}
            style={S.dateInput}
          />
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '1.2rem', alignSelf: 'flex-end', paddingBottom: '6px' }}>→</div>
        <div style={S.dateField}>
          <label style={S.dateLabel}>BİTİŞ</label>
          <input
            type="date"
            value={endDate}
            onChange={e => onEnd(e.target.value)}
            style={S.dateInput}
          />
        </div>
        <button onClick={onFetch} disabled={loading} style={S.fetchBtn}>
          {loading ? <span style={S.spinner} /> : null}
          {loading ? 'YÜKLENİYOR...' : 'RAPORU GETIR'}
        </button>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color, delay }) {
  return (
    <div style={{ ...S.card, borderTop: `2px solid ${color}` }} className={`fade-up fade-up-${delay}`}>
      <div style={{ ...S.cardAccentBar, background: color }} />
      <div style={S.cardLabel}>{label}</div>
      <div style={{ ...S.cardValue, color }}>{value}</div>
      {sub && <div style={S.cardSub}>{sub}</div>}
    </div>
  )
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={S.tooltip}>
      <div style={S.tooltipLabel}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          {p.name}: {p.name === 'Gelir (₺)' ? fmt_tl(p.value) : fmt_num(p.value)}
        </div>
      ))}
    </div>
  )
}

function StationChart({ data }) {
  if (!data?.length) return <EmptyState />
  return (
    <div style={S.chartCard} className="fade-up fade-up-4">
      <div style={S.chartTitle}>
        <span style={S.chartTitleDot} />
        İSTASYON BAZLI GELİR
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="station_name"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-display)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => (v / 1000).toFixed(0) + 'K'}
          />
          <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,229,255,0.05)' }} />
          <Bar dataKey="total_revenue_tl" name="Gelir (₺)" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? 'var(--accent)' : `rgba(0,229,255,${0.65 - i * 0.1})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={S.stationTable}>
        {data.map((s, i) => (
          <div key={s.station_id} style={S.stationRow}>
            <div style={S.stationRank}>{String(i + 1).padStart(2, '0')}</div>
            <div style={S.stationName}>{s.station_name}</div>
            <div style={S.stationSessions}>{fmt_num(s.session_count)} seans</div>
            <div style={{ ...S.stationRevenue, color: i === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
              {fmt_tl(s.total_revenue_tl)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PeakHourChart({ data }) {
  if (!data?.length) return <EmptyState />
  const active = data.filter(d => d.session_count > 0)
  const maxSessions = Math.max(...data.map(d => d.session_count))
  return (
    <div style={S.chartCard} className="fade-up fade-up-5">
      <div style={S.chartTitle}>
        <span style={{ ...S.chartTitleDot, background: 'var(--green)' }} />
        SAATLIK YOĞUNLUK ANALİZİ
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00ff94" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00ff94" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div style={S.tooltip}>
                  <div style={{ ...S.tooltipLabel, color: 'var(--green)' }}>{label}</div>
                  <div style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    {payload[0].value} seans
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {fmt_tl(payload[0]?.payload?.total_revenue_tl ?? 0)}
                  </div>
                </div>
              )
            }}
            cursor={{ stroke: 'var(--green)', strokeWidth: 1, strokeDasharray: '4 2' }}
          />
          <Area
            type="monotone"
            dataKey="session_count"
            stroke="#00ff94"
            strokeWidth={2}
            fill="url(#peakGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div style={S.peakSummary}>
        {active.length > 0 && (() => {
          const peak = data.reduce((a, b) => b.session_count > a.session_count ? b : a)
          return (
            <>
              <div style={S.peakItem}>
                <span style={S.peakItemLabel}>En Yoğun Saat</span>
                <span style={{ ...S.peakItemValue, color: 'var(--green)' }}>{peak.hour}</span>
              </div>
              <div style={S.peakItem}>
                <span style={S.peakItemLabel}>Pik Seans Sayısı</span>
                <span style={{ ...S.peakItemValue, color: 'var(--green)' }}>{peak.session_count}</span>
              </div>
              <div style={S.peakItem}>
                <span style={S.peakItemLabel}>Pik Saati Geliri</span>
                <span style={{ ...S.peakItemValue, color: 'var(--green)' }}>{fmt_tl(peak.total_revenue_tl)}</span>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}

function TransactionsTable({ data }) {
  if (!data?.length) return <EmptyState />
  return (
    <div style={S.tableCard} className="fade-up fade-up-6">
      <div style={S.chartTitle}>
        <span style={{ ...S.chartTitleDot, background: 'var(--yellow)' }} />
        SON İŞLEMLER
        <span style={S.tableCount}>{data.length} kayıt</span>
      </div>
      <div style={S.tableWrapper}>
        <table style={S.table}>
          <thead>
            <tr>
              {['ID', 'TARİH', 'İSTASYON', 'YÖNTEMİ', 'ENERJİ', 'TUTAR'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((tx, i) => (
              <tr key={tx.payment_id} style={S.tr(i)}>
                <td style={{ ...S.td, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>#{tx.payment_id}</td>
                <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{fmt_date(tx.transaction_date)}</td>
                <td style={{ ...S.td, color: 'var(--text-primary)' }}>{tx.station_name}</td>
                <td style={S.td}>
                  <span style={S.methodBadge(tx.method)}>
                    {method_label[tx.method] ?? tx.method}
                  </span>
                </td>
                <td style={{ ...S.td, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {fmt_kwh(tx.energy_kwh)}
                </td>
                <td style={{ ...S.td, fontFamily: 'var(--font-mono)', color: 'var(--yellow)', textAlign: 'right' }}>
                  {fmt_tl(tx.amount_tl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={S.empty}>
      <div style={S.emptyIcon}>◎</div>
      <div>Seçili dönem için veri bulunamadı</div>
    </div>
  )
}

function ErrorBanner({ msg }) {
  return <div style={S.error}>⚠ {msg}</div>
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Analytics() {
  const today = new Date().toISOString().slice(0, 10)
  const threeMonthsAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(threeMonthsAgo)
  const [endDate,   setEndDate]   = useState(today)
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `${API_BASE}/api/analytics/revenue?start_date=${startDate}&end_date=${endDate}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Sunucu hatası: ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { fetchReport() }, [])

  const s = data?.summary

  return (
    <div style={S.shell}>
      <Header />
      <main style={S.main}>
        <DateRangeBar
          startDate={startDate} endDate={endDate}
          onStart={setStartDate} onEnd={setEndDate}
          onFetch={fetchReport} loading={loading}
        />

        {error && <ErrorBanner msg={error} />}

        {data?.message && !error && (
          <div style={S.infoMsg}>{data.message}</div>
        )}

        {s && (
          <div style={S.cards}>
            <SummaryCard label="TOPLAM GELİR"  value={fmt_tl(s.total_revenue_tl)}          color="var(--accent)"  delay={2} />
            <SummaryCard label="TOPLAM SEANS"   value={fmt_num(s.total_sessions)}           sub="tamamlanan seans" color="var(--green)"  delay={3} />
            <SummaryCard label="ENERJİ TÜKETİMİ" value={fmt_kwh(s.total_energy_kwh)}       color="var(--yellow)" delay={4} />
            <SummaryCard label="ORT. SEANS GELİRİ" value={fmt_tl(s.average_session_cost_tl)} color="#c084fc"      delay={5} />
          </div>
        )}

        {data && (
          <div style={S.chartsRow}>
            <StationChart  data={data.revenue_by_station} />
            <PeakHourChart data={data.peak_hour_analysis} />
          </div>
        )}

        {data && <TransactionsTable data={data.recent_transactions} />}

        {!data && !loading && !error && (
          <div style={S.empty}>
            <div style={S.emptyIcon}>⚡</div>
            <div>Raporu görüntülemek için tarih seçin ve getir butonuna basın.</div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  shell: {display: 'flex', flexDirection: 'column' },

  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 32px', borderBottom: '1px solid var(--border)',
    background: 'rgba(13,20,36,0.9)', backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: 16 },
  logo:        { width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                 background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)', borderRadius: 8 },
  headerTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
                 letterSpacing: '0.15em', color: 'var(--accent)' },
  headerSub:   { fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginTop: 2 },
  statusPill:  { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', letterSpacing: '0.12em',
                 color: 'var(--green)', border: '1px solid rgba(0,255,148,0.25)', borderRadius: 20,
                 padding: '5px 14px', background: 'rgba(0,255,148,0.06)' },
  statusDot:   { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
                 animation: 'pulse-dot 2s ease-in-out infinite' },

  main: { flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, width: '100%', margin: '0 auto' },

  dateBar: {
    background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
  },
  dateBarLabel:    { fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-dim)', minWidth: 80 },
  dateBarControls: { display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' },
  dateField:       { display: 'flex', flexDirection: 'column', gap: 4 },
  dateLabel:       { fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--text-secondary)' },
  dateInput: {
    background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)',
    color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
    padding: '8px 12px', outline: 'none', cursor: 'pointer',
    colorScheme: 'dark',
  },
  fetchBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius)',
    padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: '0.8rem', letterSpacing: '0.1em', cursor: 'pointer',
    transition: 'opacity 0.2s', opacity: 1,
  },
  spinner: {
    width: 12, height: 12, border: '2px solid rgba(0,0,0,0.3)',
    borderTopColor: '#000', borderRadius: '50%',
    display: 'inline-block', animation: 'spin 0.7s linear infinite',
  },

  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px 22px', position: 'relative', overflow: 'hidden',
  },
  cardAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, opacity: 0.6 },
  cardLabel:  { fontSize: '0.62rem', letterSpacing: '0.15em', color: 'var(--text-secondary)', marginBottom: 10 },
  cardValue:  { fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 500, lineHeight: 1 },
  cardSub:    { fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 6 },

  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },

  chartCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px 22px',
  },
  chartTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-secondary)',
    marginBottom: 20, fontWeight: 600,
  },
  chartTitleDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 },

  stationTable:   { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 },
  stationRow:     { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                    borderBottom: '1px solid var(--border)' },
  stationRank:    { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', minWidth: 22 },
  stationName:    { flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)' },
  stationSessions:{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', minWidth: 70 },
  stationRevenue: { fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 500, minWidth: 90, textAlign: 'right' },

  peakSummary: { display: 'flex', gap: 24, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' },
  peakItem:    { display: 'flex', flexDirection: 'column', gap: 3 },
  peakItemLabel:{ fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--text-secondary)' },
  peakItemValue:{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 500 },

  tableCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px 22px',
  },
  tableCount:  { marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' },
  tableWrapper:{ overflowX: 'auto', marginTop: 4 },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '8px 12px', textAlign: 'left', fontSize: '0.6rem',
    letterSpacing: '0.12em', color: 'var(--text-dim)',
    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  },
  tr: (i) => ({
    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
    transition: 'background 0.15s',
  }),
  td: { padding: '9px 12px', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' },
  methodBadge: (method) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem',
    fontFamily: 'var(--font-mono)',
    background: method === 'credit_card' ? 'rgba(0,229,255,0.1)' : method === 'wallet' ? 'rgba(192,132,252,0.12)' : 'rgba(255,209,102,0.1)',
    color:      method === 'credit_card' ? 'var(--accent)'        : method === 'wallet' ? '#c084fc'                 : 'var(--yellow)',
    border: `1px solid ${method === 'credit_card' ? 'var(--accent-dim)' : method === 'wallet' ? 'rgba(192,132,252,0.3)' : 'rgba(255,209,102,0.25)'}`,
  }),

  tooltip: {
    background: 'var(--bg-panel)', border: '1px solid var(--border-bright)',
    borderRadius: 6, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 3,
  },
  tooltipLabel: { fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 2 },

  error:   { background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)',
             borderRadius: 'var(--radius)', padding: '12px 18px', color: 'var(--red)', fontSize: '0.85rem' },
  infoMsg: { background: 'rgba(0,229,255,0.06)', border: '1px solid var(--accent-dim)',
             borderRadius: 'var(--radius)', padding: '12px 18px', color: 'var(--accent)', fontSize: '0.85rem' },
  empty:   { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
             gap: 12, padding: '60px 20px', color: 'var(--text-dim)', fontSize: '0.85rem' },
  emptyIcon:{ fontSize: '2rem', opacity: 0.4 },
}
