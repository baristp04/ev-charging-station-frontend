import React, { useState, useEffect } from 'react';
import { formatLocalTime } from '../utils/dateUtils';

const Notifications = ({ user }) => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Maximum number of notifications visible before "Load More"
  const [visibleCount, setVisibleCount] = useState(4);

  // Use driverID from the user object passed down from App.jsx
  const currentDriverID = user?.driverID || user?.id;

  useEffect(() => {
    // Do not fetch if the user is not logged in or ID is not yet available
    if (!currentDriverID) {
      setLoading(false);
      return;
    }

    const fetchNotifs = async () => {
      try {
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
  }, [currentDriverID]);

  // Optimistic UI update — mark as read instantly, then sync with server
  const handleMarkRead = async (notificationID) => {
    // 1. Update UI immediately without waiting for the API response
    setNotifs(prev => prev.map(n => 
      n.notificationID === notificationID ? { ...n, isRead: true } : n
    ));

    try {
      // 2. Notify the server in the background
      const res = await fetch(`http://localhost:8000/api/notifications/read/${notificationID}`, {
        method: 'PUT'
      });
      
      // 3. Roll back the optimistic update if the server responds with an error
      if (!res.ok) {
        setNotifs(prev => prev.map(n => 
          n.notificationID === notificationID ? { ...n, isRead: false } : n
        ));
        console.error("Failed to update notification on the server.");
      }
    } catch (err) {
      // Roll back if the network request fails
      setNotifs(prev => prev.map(n => 
        n.notificationID === notificationID ? { ...n, isRead: false } : n
      ));
      console.error("Update error:", err);
    }
  };

  // Slice the list to only show visibleCount items
  const displayedNotifs = notifs.slice(0, visibleCount);

  if (!user) {
    return <div style={{ padding: '40px', color: 'white' }}>Please sign in to see your notifications.</div>;
  }

  return (
    <div style={{ 
      padding: '40px 60px', 
      maxWidth: '1000px', 
      margin: '0 auto', 
      color: 'white',
      overflowY: 'auto',
      height: '100%'
    }}>
      
      {/* Page header */}
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
      ) : displayedNotifs.length === 0 ? (
        <p style={{ opacity: 0.5 }}>You have no notifications yet.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {displayedNotifs.map((n) => (
              <div 
                key={n.notificationID} 
                style={{
                  padding: '24px', 
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
                  paddingRight: '140px' 
                }}>
                  {n.message}
                </div>

                {/* formatLocalTime converts UTC timestamp to Istanbul local time */}
                <div style={{ fontSize: '12px', opacity: 0.4 }}>
                  {formatLocalTime(n.sentAt)}
                </div>

                {/* Mark as read button */}
                <button
                  onClick={() => handleMarkRead(n.notificationID)}
                  disabled={n.isRead}
                  style={{
                    position: 'absolute',
                    top: '50%', 
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

          {/* Load more — reveals 10 additional notifications per click */}
          {visibleCount < notifs.length && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', paddingBottom: '20px' }}>
              <button 
                onClick={() => setVisibleCount(prev => prev + 10)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'transparent',
                  border: '1px solid #06b6d4',
                  borderRadius: '24px',
                  color: '#06b6d4',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                Load More...
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;