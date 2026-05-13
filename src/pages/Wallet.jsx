
import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const Wallet = ({ user }) => { // User bilgisini prop olarak aldığını varsayıyoruz
  const [balance, setBalance] = useState(0);
  const [cards, setCards] = useState([]);
  const [amount, setAmount] = useState('');
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dinamik Driver ID (User prop'undan veya localStorage'dan alınabilir)
  const driverID = user?.driverID ; 
  const driverName = user?.name ;

  const [cardFormData, setCardFormData] = useState({
    cardName: '',
    cardHolderName: driverName,
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  // 1. Verileri Çekme
  useEffect(() => {
    const fetchData = async () => {
      try {
        const balanceRes = await fetch(`http://localhost:8000/api/wallet/balance/${driverID}`);
        const driverData = await balanceRes.json();
        setBalance(driverData.balance);

        const cardsRes = await fetch(`http://localhost:8000/api/wallet/cards/${driverID}`);
        const cardsData = await cardsRes.json();
        setCards(cardsData);
      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [driverID]);

  // --- MASKING ---
  const handleCardNumberChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 16);
    let parts = v.match(/.{1,4}/g) || [];
    setCardFormData({ ...cardFormData, cardNumber: parts.join('-') });
  };

  const handleExpiryChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
    setCardFormData({ ...cardFormData, expiryDate: v });
  };

  // 2. KART KAYDETME (POST)
  const handleSaveCard = async (e) => {
    e.preventDefault();
    const loadId = toast.loading('Saving card...');
    try {
      const res = await fetch('http://localhost:8000/api/wallet/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cardFormData,
          driver_id: driverID,
          cardNumber: cardFormData.cardNumber.replace(/-/g, '')
        }),
      });
      if (res.ok) {
        toast.success('Card added!', { id: loadId });
        setIsModalOpen(false);
        // Refresh cards
        const cardsRes = await fetch(`http://localhost:8000/api/wallet/cards/${driverID}`);
        setCards(await cardsRes.json());
      } else {
        toast.error('Error saving card', { id: loadId });
      }
    } catch (err) {
      toast.error('Connection failed', { id: loadId });
    }
  };

  // 3. TOP-UP (BAKİYE YÜKLEME)
  const handleConfirmTopUp = async () => {
  if (!amount || parseFloat(amount) <= 0) return toast.error("Please enter a valid amount!");
  if (!selectedCardId) return toast.error("Please select a payment method!");

  const loadId = toast.loading('Processing payment...');

  // Parametreleri URL'ye ekliyoruz (Query Parameters)
  const queryParams = new URLSearchParams({
    driver_id: driverID,
    amount: parseFloat(amount),
    card_id: selectedCardId
  }).toString();

  try {
    const res = await fetch(`http://localhost:8000/api/wallet/top-up?${queryParams}`, {
      method: 'POST',
      headers: { 
        'accept': 'application/json' 
        // Body göndermediğimiz için Content-Type'a gerek kalmayabilir
      }
    });

    if (res.ok) {
      const data = await res.json();
      // Backend bakiye dönüyorsa onu set et, dönmüyorsa eski bakiyeye ekleme yap
      setBalance(prev => prev + parseFloat(amount)); 
      setAmount('');
      setSelectedCardId(null);
      toast.success(`₺${amount} successfully added!`, { id: loadId });
    } else {
      const errorData = await res.json();
      console.error("Backend error:", errorData);
      toast.error('Transaction failed! Please check values.', { id: loadId });
    }
  } catch (err) {
    toast.error('Server error connection failed!', { id: loadId });
  }
};

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', color: 'white', fontFamily: 'sans-serif' }}>
      <Toaster position="top-right" />
      
      {/* BALANCE SECTION */}
      <div style={{ 
        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', 
        padding: '32px', borderRadius: '32px', width: '380px', marginBottom: '40px',
        boxShadow: '0 20px 40px rgba(6, 182, 212, 0.3)'
      }}>
        <p style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase' }}>Total Balance</p>
        <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0 }}>₺{balance.toFixed(2)}</h2>
      </div>

      <div style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '32px', padding: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '40px' }}>
          
          {/* STEP 1 */}
          <div style={{ gridColumn: 'span 4' }}>
            <h4 style={{ color: '#22d3ee', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>STEP 1: Amount</h4>
            <div style={{ position: 'relative', marginTop: '20px' }}>
              <span style={{ position: 'absolute', left: '16px', top: '14px', color: '#64748b' }}>₺</span>
              <input 
                type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', backgroundColor: '#0f172a', border: '2px solid #0891b2', borderRadius: '16px', padding: '14px 32px', color: 'white', outline: 'none' }} 
              />
            </div>
          </div>

          {/* STEP 2 */}
          <div style={{ gridColumn: 'span 4', borderLeft: '1px solid #1e293b', paddingLeft: '40px' }}>
            <h4 style={{ color: '#22d3ee', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>STEP 2: Choose Card</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              {cards.map(card => (
                <div key={card.id} onClick={() => setSelectedCardId(card.id)} style={{
                  display: 'flex', alignItems: 'center', padding: '14px', borderRadius: '16px',
                  border: selectedCardId === card.id ? '2px solid #06b6d4' : '2px solid #1e293b',
                  backgroundColor: selectedCardId === card.id ? '#06b6d41a' : '#0f172a', cursor: 'pointer'
                }}>
                  <div style={{ marginRight: '12px' }}>💳</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{card.cardName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>**** {card.cardNumber.slice(-4)}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => setIsModalOpen(true)} style={{ width: '100%', padding: '14px', border: '2px dashed #0891b2', borderRadius: '16px', backgroundColor: 'transparent', color: '#06b6d4', cursor: 'pointer' }}>+ Add New Card</button>
            </div>
          </div>

          {/* STEP 4 */}
          <div style={{ gridColumn: 'span 4', borderLeft: '1px solid #1e293b', paddingLeft: '40px' }}>
            <h4 style={{ color: '#22d3ee', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>STEP 4: Final Action</h4>
            <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '24px', margin: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Amount:</span><span>₺{amount || '0'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '22px', color: '#22d3ee', marginTop: '10px' }}><span>Total:</span><span>₺{amount || '0'}</span></div>
            </div>
            <button 
                onClick={handleConfirmTopUp}
                style={{ 
                    width: '100%', padding: '18px', 
                    background: 'linear-gradient(to right, #06b6d4, #3b82f6)', 
                    border: 'none', borderRadius: '16px', color: 'white', 
                    fontWeight: 'bold', cursor: 'pointer',
                    transition: '0.3s'
                }}>
                CONFIRM AND ADD FUNDS
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #334155', padding: '40px', borderRadius: '32px', width: '420px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px' }}>Add New Card</h2>
            <form onSubmit={handleSaveCard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input required placeholder="Card Nickname" onChange={(e) => setCardFormData({...cardFormData, cardName: e.target.value})} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '14px', color: 'white' }} />
              <input required placeholder="0000-0000-0000-0000" value={cardFormData.cardNumber} onChange={handleCardNumberChange} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '14px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <input required placeholder="MM/YY" value={cardFormData.expiryDate} onChange={handleExpiryChange} style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '14px', color: 'white' }} />
                <input required placeholder="CVV" maxLength="3" onChange={(e) => setCardFormData({...cardFormData, cvv: e.target.value})} style={{ width: '80px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '14px', color: 'white' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '16px', backgroundColor: '#06b6d4', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>SAVE CARD</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;