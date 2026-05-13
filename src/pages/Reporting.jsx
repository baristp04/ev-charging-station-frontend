
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Reporting({ user }) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendReport = async () => {
    // 1. Frontend taraflı basit kontrol
    if (!text.trim()) {
      toast.error("Please describe the issue.");
      return;
    }

    // Backend'de EVDriver kontrolü eklediğimiz için driverID kritik
    if (!user?.driverID) {
      toast.error("User identification failed. Please log in again.");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('http://localhost:8000/api/report/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: user.driverID,
          message: text.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Report sent to technicians! 🛠️", {
          style: { background: '#1e293b', color: '#fff', border: '1px solid #10b981' }
        });
        setText('');
      } else {
        // Backend'den gelen spesifik hata mesajını göster (örn: "Driver not found")
        toast.error(data.detail || "Failed to save report.");
      }
    } catch (error) {
      console.error("Report error:", error);
      toast.error("Connection error! Please check if backend is running. 🔌");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#e8f0fe', marginBottom: '10px' }}>Report Station Issue</h2>
      
      <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '14px' }}>
        Found a problem with a charger? Let our technicians know and we'll fix it as soon as possible.
      </p>

      <div style={{ position: 'relative' }}>
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)}
          disabled={isSending}
          placeholder="Describe the problem (e.g. Connector handle is cracked at Station #4)"
          style={{ 
            width: '100%', 
            height: '160px', 
            background: '#0f172a', 
            color: '#f8fafc', 
            padding: '15px', 
            borderRadius: '12px',
            border: '1px solid #334155',
            outline: 'none',
            resize: 'none',
            fontSize: '15px',
            transition: 'border-color 0.2s',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          onFocus={(e) => e.target.style.borderColor = '#00e5ff'}
          onBlur={(e) => e.target.style.borderColor = '#334155'}
        />
        
        {/* Karakter sayacı eklemek sunumda şık durur */}
        <div style={{ 
          textAlign: 'right', 
          color: '#64748b', 
          fontSize: '12px', 
          marginTop: '5px' 
        }}>
          {text.length} characters
        </div>
      </div>
      
      <button 
        onClick={sendReport} 
        disabled={isSending}
        style={{ 
          marginTop: '10px', 
          padding: '14px 30px', 
          background: isSending 
            ? '#334155' 
            : 'linear-gradient(135deg, #00e5ff 0%, #00ff9d 100%)', 
          color: '#020617',
          fontWeight: '700',
          fontSize: '16px',
          border: 'none', 
          borderRadius: '10px', 
          cursor: isSending ? 'not-allowed' : 'pointer',
          transition: 'transform 0.2s, opacity 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
        onMouseEnter={(e) => !isSending && (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => !isSending && (e.currentTarget.style.opacity = '1')}
      >
        {isSending ? (
          <>
            <span className="animate-spin">⏳</span> Sending...
          </>
        ) : 'Submit Report'}
      </button>
    </div>
  );
}