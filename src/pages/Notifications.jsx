import React, { useState, useEffect } from 'react';

const Notifications = ({ user }) => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  // App.jsx'den gelen user objesinin içindeki ID'yi kullanmalıyız.
  // Senin sisteminde bu user.id veya user.driverID olabilir. 
  // Garantiye almak için ikisini de kontrol eden bir değişken oluşturalım:
  const currentDriverID = user?.driverID || user?.id;

  useEffect(() => {
    // Eğer kullanıcı giriş yapmamışsa veya ID henüz yüklenmemişse fetch atma
    if (!currentDriverID) {
      setLoading(false);
      return;
    }

    const fetchNotifs = async () => {
      try {
        // HATA BURADAYDI: driverID yerine currentDriverID kullanıyoruz
        const res = await fetch(`http://localhost:8000/api/notifications/${currentDriverID}`);
        if (res.ok) {
          const data = await res.json();
          setNotifs(data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifs();
  }, [currentDriverID]); // ID değişirse bildirimleri tekrar çek

  // Okundu işaretleme fonksiyonu
  const handleMarkRead = async (notificationID) => {
    try {
      const res = await fetch(`http://localhost:8000/api/notifications/read/${notificationID}`, {
        method: 'PUT'
      });
      if (res.ok) {
        setNotifs(prev => prev.map(n => 
          n.notificationID === notificationID ? { ...n, isRead: true } : n
        ));
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  if (!user) {
    return <div style={{ padding: '40px', color: 'white' }}>Please sign in to see your notifications.</div>;
  }

  return (
  <div style={{ 
    padding: '40px 60px', // Yanlardan biraz daha boşluk vererek ortaladık
    maxWidth: '1000px', 
    margin: '0 auto', 
    color: 'white' 
  }}>
    
    {/* ÜST BAŞLIK KISMI */}
    <div style={{ 
      marginBottom: '32px', 
      borderBottom: '1px solid #1e293b', 
      paddingBottom: '16px' 
    }}>
      <h2 style={{ 
        fontSize: '1.8rem', 
        fontWeight: 'bold', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px' 
      }}>
        <span style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }}>🔔</span> 
        Your Notifications
      </h2>
      <p style={{ opacity: 0.5, fontSize: '0.9rem', marginTop: '4px' }}>
        Stay updated with your charging sessions and system alerts.
      </p>
    </div>

    {loading ? (
      <p style={{ opacity: 0.5 }}>Loading alerts...</p>
    ) : notifs.length === 0 ? (
      <p style={{ opacity: 0.5 }}>You have no notifications yet.</p>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {notifs.map((n) => (
          <div 
            key={n.notificationID} 
            style={{
              padding: '24px', // İç boşluğu artırdık
              borderRadius: '16px',
              backgroundColor: n.isRead ? 'rgba(30, 41, 59, 0.4)' : '#1e293b',
              borderLeft: n.isRead ? '4px solid #334155' : `4px solid ${n.type === 'alert' ? '#ef4444' : '#06b6d4'}`,
              opacity: n.isRead ? 0.6 : 1,
              transition: '0.3s all',
              position: 'relative',
              boxShadow: n.isRead ? 'none' : '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '13px', 
              marginBottom: '8px', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              color: n.isRead ? '#94a3b8' : (n.type === 'alert' ? '#ef4444' : '#06b6d4')
            }}>
              {n.type}
            </div>

            <div style={{ 
              fontSize: '16px', 
              lineHeight: '1.5',
              marginBottom: '12px', 
              paddingRight: '140px' // Butonla çakışmaması için sağdan boşluk
            }}>
              {n.message}
            </div>

            <div style={{ fontSize: '12px', opacity: 0.4 }}>
              {new Date(n.sentAt).toLocaleString()}
            </div>

            {/* OKUNDU BUTONU */}
            <button
              onClick={() => handleMarkRead(n.notificationID)}
              disabled={n.isRead}
              style={{
                position: 'absolute',
                top: '50%', // Dikeyde ortala
                transform: 'translateY(-50%)',
                right: '24px',
                padding: '10px 18px',
                backgroundColor: n.isRead ? 'transparent' : '#06b6d4',
                color: n.isRead ? '#64748b' : '#fff',
                border: n.isRead ? '1px solid #334155' : 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: n.isRead ? 'default' : 'pointer',
                transition: '0.2s all'
              }}
            >
              {n.isRead ? '✓ Read' : 'Mark as read'}
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);
};

export default Notifications;