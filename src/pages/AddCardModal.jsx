import React, { useState } from 'react';
import toast from 'react-hot-toast';

const AddCardModal = ({ isOpen, onClose, onSave, driverId }) => {
  const [formData, setFormData] = useState({
    cardName: '',
    cardHolderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Basit bir doğrulama
    if (!formData.cardName || !formData.cardNumber || !formData.cvv) {
      toast.error("Please fill all fields!");
      return;
    }

    // Backend'e gönderilecek veri yapısı
    const newCard = {
      ...formData,
      driver_id: driverId
    };

    onSave(newCard); // Wallet.jsx'teki kaydetme fonksiyonunu çağırır
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">New Card</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] text-cyan-500 font-black uppercase tracking-widest ml-2">Card Nickname</label>
            <input placeholder="e.g. Personal Visa" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-cyan-500 transition-all" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-cyan-500 font-black uppercase tracking-widest ml-2">Card Number</label>
            <input placeholder="0000 0000 0000 0000" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-cyan-500 transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-cyan-500 font-black uppercase tracking-widest ml-2">Expiry</label>
              <input placeholder="MM/YY" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-cyan-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-cyan-500 font-black uppercase tracking-widest ml-2">CVV</label>
              <input type="password" placeholder="***" maxLength="3" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-cyan-500" />
            </div>
          </div>
        </div>

        <button className="w-full mt-10 py-5 bg-cyan-500 rounded-2xl font-black text-slate-950 hover:bg-cyan-400 transition-all active:scale-95 shadow-lg shadow-cyan-500/20">
          SAVE CARD
        </button>
      </div>
    </div>
  );
};

export default AddCardModal;