import { useState, useEffect } from 'react';

export default function SessionTracking({ user }) {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. ADIM: Merve'nin aktif bir session'ı var mı? (ID: 558'i bulacak)
  useEffect(() => {
    // App.jsx'ten gelen user nesnesini kullanıyoruz
    if (!user) return;

    const findActiveSession = async () => {
      try {
        // user.id Merve'nin ID'si olmalı (Örn: 1)
        const res = await fetch(`http://localhost:8000/api/v1/charging/active-session-for-driver/${user.id || 2}`);
        const result = await res.json();
        
        if (result.sessionID) {
          setActiveSessionId(result.sessionID);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Session arama hatası:", err);
        setLoading(false);
      }
    };

    findActiveSession();
  }, [user]);

  // 2. ADIM: ID bulununca (558), Swagger'daki gibi verileri çekmeye başla
  useEffect(() => {
    if (!activeSessionId) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/charging/${activeSessionId}/status`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        console.error("Canlı veri hatası:", err);
      }
    };

    // 5 saniyede bir güncelle
    const interval = setInterval(fetchStatus, 5000);
    fetchStatus();
    return () => clearInterval(interval);
  }, [activeSessionId]);

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>⚡ Connecting to charger...</div>;

  if (!activeSessionId || !data) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>No active charging session found.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', color: 'white' }}>
      <div style={{ 
        background: 'var(--bg-panel)', 
        padding: '30px', 
        borderRadius: '20px', 
        maxWidth: '450px', 
        margin: 'auto',
        border: '1px solid var(--border)' 
      }}>
        <h2 style={{ textAlign: 'center', color: 'var(--accent)', marginBottom: '20px' }}>⚡ Live Charging</h2>
        
        {/* Swagger'daki 'percentage' verisi */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '64px', fontWeight: 'bold' }}>%{data.percentage}</span>
          <div style={{ width: '100%', height: '10px', background: '#334155', borderRadius: '5px', marginTop: '10px' }}>
            <div style={{ 
              width: `${data.percentage}%`, 
              height: '100%', 
              background: 'var(--accent)', 
              borderRadius: '5px',
              transition: 'width 1s ease-in-out'
            }}></div>
          </div>
        </div>

              {/* Swagger'daki diğer veriler */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <StatCard label="Consumed" value={`${data.energyConsumed} kWh`} />
                  <StatCard label="Current Cost" value={`${data.currentCost} TL`} />
                  <StatCard label="Elapsed" value={`${data.elapsedTime} min`} />
                  <StatCard label="Remaining" value={`${data.remainingTime} min`} />
              </div>

              <button 
  onClick={async () => {
    if (window.confirm("Are you sure you want to stop charging?")) {
      try {
        // Backend'e durdurma isteği gönder
        const res = await fetch(`http://localhost:8000/api/v1/charging/${activeSessionId}/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
          alert("Charging session stopped successfully!");
          
          // KRİTİK DEĞİŞİKLİK BURADA:
          // Sayfayı yenilemiyoruz, sadece state'leri sıfırlıyoruz.
          // Böylece login durumun bozulmaz, direkt "No active session" ekranına düşersin.
          setActiveSessionId(null);
          setData(null);
          setLoading(false); 
        } else {
          const errData = await res.json();
          alert("Error: " + (errData.detail || "Could not stop session."));
        }
      } catch (err) {
        console.error("Stop session error:", err);
        alert("Server connection failed.");
      }
    }
  }}
  style={{ 
    width: '100%', padding: '15px', marginTop: '20px', borderRadius: '10px', 
    border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold',
    cursor: 'pointer' 
  }}>
  Finish Session
</button>
          </div>
      </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: '#0f172a', padding: '15px', borderRadius: '12px', border: '1px solid #1e293b' }}>
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}