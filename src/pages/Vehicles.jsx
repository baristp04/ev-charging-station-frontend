import { useState, useEffect } from 'react';

// Backend API URL'si (Backend'in 8000 portunda çalıştığını varsayıyoruz)
const API_BASE = 'http://localhost:8000/api/v1/vehicles';
const TEST_DRIVER_ID = 1; // Şimdilik test için sabit bir sürücü ID'si kullanıyoruz

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    plateNumber: '',
    batteryCapacity: '',
    connectorType: 'CCS'
  });

  // 1. READ: Araçları Getir
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/driver/${TEST_DRIVER_ID}`);
      if (!res.ok) throw new Error('Araçlar getirilirken bir hata oluştu');
      const data = await res.json();
      setVehicles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Form Değişikliklerini Yakala
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Yeni Ekle veya Güncelle Modalını Aç
  const openModal = (vehicle = null) => {
    setError(null);
    if (vehicle) {
      setEditingId(vehicle.vehicleID);
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        plateNumber: vehicle.plateNumber,
        batteryCapacity: vehicle.batteryCapacity,
        connectorType: vehicle.connectorType
      });
    } else {
      setEditingId(null);
      setFormData({ brand: '', model: '', plateNumber: '', batteryCapacity: '', connectorType: 'CCS' });
    }
    setIsModalOpen(true);
  };

  // 2 & 3. CREATE / UPDATE: Formu Gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Gönderilecek veriyi hazırla (Sayısal değerleri dönüştür)
    const payload = {
      ...formData,
      batteryCapacity: parseFloat(formData.batteryCapacity),
      driver_id: TEST_DRIVER_ID
    };

    try {
      const url = editingId ? `${API_BASE}/${editingId}` : `${API_BASE}/`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Kayıt başarısız oldu.');
      }

      setIsModalOpen(false);
      fetchVehicles(); // Listeyi yenile
    } catch (err) {
      setError(err.message);
    }
  };

  // 4. DELETE: Aracı Sil
  const handleDelete = async (vehicleId) => {
    if (!window.confirm("Bu aracı silmek istediğinize emin misiniz?")) return;
    
    try {
      const res = await fetch(`${API_BASE}/${vehicleId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silme işlemi başarısız oldu.');
      fetchVehicles(); // Listeyi yenile
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={S.container} className="fade-up">
      <div style={S.header}>
        <div>
          <h2 style={S.title}>🚘 Araç Yönetimi</h2>
          <p style={S.subtitle}>Sisteme kayıtlı elektrikli araçlarınızı buradan yönetebilirsiniz.</p>
        </div>
        <button style={S.addBtn} onClick={() => openModal()}>+ Yeni Araç Ekle</button>
      </div>

      {error && !isModalOpen && <div style={S.errorBanner}>⚠ {error}</div>}

      {loading ? (
        <div style={S.loading}>Araçlar yükleniyor...</div>
      ) : vehicles.length === 0 ? (
        <div style={S.empty}>Henüz kayıtlı bir aracınız bulunmuyor.</div>
      ) : (
        <div style={S.grid}>
          {vehicles.map((v) => (
            <div key={v.vehicleID} style={S.card}>
              <div style={S.cardTop}>
                <span style={S.plateBadge}>{v.plateNumber}</span>
                <div style={S.actions}>
                  <button style={S.iconBtn} onClick={() => openModal(v)}>✏️</button>
                  <button style={S.iconBtnDelete} onClick={() => handleDelete(v.vehicleID)}>🗑️</button>
                </div>
              </div>
              
              <div style={S.brandModel}>{v.brand} {v.model}</div>
              
              <div style={S.specs}>
                <div style={S.specItem}>
                  <span style={S.specLabel}>BATARYA</span>
                  <span style={S.specValue}>{v.batteryCapacity} kWh</span>
                </div>
                <div style={S.specItem}>
                  <span style={S.specLabel}>SOKET</span>
                  <span style={S.specValue}>{v.connectorType}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL (Ekleme / Güncelleme Formu) */}
      {isModalOpen && (
        <div style={S.modalOverlay}>
          <div style={S.modalContent} className="fade-up">
            <h3 style={{ marginBottom: '20px', color: 'var(--accent)' }}>
              {editingId ? 'Aracı Güncelle' : 'Yeni Araç Ekle'}
            </h3>
            
            {error && <div style={{...S.errorBanner, marginBottom: '15px'}}>{error}</div>}

            <form onSubmit={handleSubmit} style={S.form}>
              <div style={S.inputGroup}>
                <label style={S.label}>Marka</label>
                <input required style={S.input} name="brand" value={formData.brand} onChange={handleChange} placeholder="Örn: Tesla" />
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>Model</label>
                <input required style={S.input} name="model" value={formData.model} onChange={handleChange} placeholder="Örn: Model 3" />
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>Plaka Numarası</label>
                <input required style={S.input} name="plateNumber" value={formData.plateNumber} onChange={handleChange} placeholder="Örn: 35 EV 1001" />
              </div>
              <div style={S.row}>
                <div style={S.inputGroup}>
                  <label style={S.label}>Batarya (kWh)</label>
                  <input required type="number" step="0.1" style={S.input} name="batteryCapacity" value={formData.batteryCapacity} onChange={handleChange} placeholder="Örn: 75.0" />
                </div>
                <div style={S.inputGroup}>
                  <label style={S.label}>Soket Tipi</label>
                  <select style={S.input} name="connectorType" value={formData.connectorType} onChange={handleChange}>
                    <option value="CCS">CCS</option>
                    <option value="Type 2">Type 2</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                  </select>
                </div>
              </div>

              <div style={S.modalActions}>
                <button type="button" style={S.cancelBtn} onClick={() => setIsModalOpen(false)}>İptal</button>
                <button type="submit" style={S.saveBtn}>{editingId ? 'Güncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stiller (Senin cyberpunk/dark temana uyumlu) ──
const S = {
  container: { padding: '32px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' },
  subtitle: { fontSize: '0.85rem', color: 'var(--text-secondary)' },
  addBtn: { background: 'var(--accent)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'var(--font-display)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', transition: 'transform 0.2s' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  plateBadge: { background: 'rgba(0, 229, 255, 0.1)', border: '1px solid var(--accent-dim)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', letterSpacing: '1px' },
  actions: { display: 'flex', gap: '8px' },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.7 },
  iconBtnDelete: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.7, color: 'var(--red)' },
  brandModel: { fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' },
  specs: { display: 'flex', gap: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' },
  specItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  specLabel: { fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '1px' },
  specValue: { fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--yellow)' },
  loading: { textAlign: 'center', padding: '40px', color: 'var(--accent)' },
  empty: { textAlign: 'center', padding: '60px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', color: 'var(--text-dim)' },
  errorBanner: { background: 'rgba(255,77,109,0.1)', border: '1px solid var(--red)', padding: '12px', borderRadius: 'var(--radius)', color: 'var(--red)', marginBottom: '20px' },
  
  // Modal Stilleri
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'var(--bg-panel)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: '500px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  row: { display: 'flex', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  label: { fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.5px' },
  input: { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', padding: '10px 12px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', outline: 'none' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  cancelBtn: { background: 'transparent', border: '1px solid var(--border)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius)', cursor: 'pointer' },
  saveBtn: { background: 'var(--accent)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer' }
};