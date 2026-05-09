import React, { useState } from 'react';
import { X, Compass, PlusCircle, ArrowLeft } from 'lucide-react';
import './ServerModal.css';

const ServerModal = ({ onClose, onServerAdded }) => {
  const [mode, setMode] = useState('menu'); // 'menu', 'create', 'join'
  const [serverName, setServerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
  const token = localStorage.getItem('token');

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/server/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: serverName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sunucu oluşturulamadı');
      onServerAdded(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/server/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sunucuya katılınamadı');
      onServerAdded(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="server-modal-overlay glass">
      <div className="server-modal">
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {mode !== 'menu' && (
          <button className="back-btn" onClick={() => { setMode('menu'); setError(''); }}>
            <ArrowLeft size={24} />
          </button>
        )}
        
        {mode === 'menu' && (
          <>
            <h2>Bir Sunucu Oluştur</h2>
            <p className="subtitle">Sunucun, senin ve arkadaşlarının takıldığı yerdir. Kendi sunucunu oluştur ve hemen sohbete başla.</p>
            
            <div className="server-options">
              <button className="server-option-btn" onClick={() => setMode('create')}>
                <div className="option-icon create"><PlusCircle size={32} /></div>
                <div className="option-text">
                  <h3>Kendime Ait Oluştur</h3>
                  <p>Sen ve arkadaşların için özel bir alan</p>
                </div>
              </button>
              
              <button className="server-option-btn" onClick={() => setMode('join')}>
                <div className="option-icon join"><Compass size={32} /></div>
                <div className="option-text">
                  <h3>Bir Sunucuya Katıl</h3>
                  <p>Davet bağlantın var mı?</p>
                </div>
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="server-form">
            <h2>Sunucunu Özelleştir</h2>
            <p className="subtitle">Sunucuna bir isim ver. Bunu daha sonra her zaman değiştirebilirsin.</p>
            {error && <div className="error-message">{error}</div>}
            <div className="input-group">
              <label>SUNUCU ADI</label>
              <input 
                type="text" 
                value={serverName} 
                onChange={(e) => setServerName(e.target.value)} 
                placeholder="Benim Harika Sunucum" 
                required
              />
            </div>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="server-form">
            <h2>Bir Sunucuya Katıl</h2>
            <p className="subtitle">Aşağıya davet kodunu girerek mevcut bir sunucuya katıl.</p>
            {error && <div className="error-message">{error}</div>}
            <div className="input-group">
              <label>DAVET KODU</label>
              <input 
                type="text" 
                value={inviteCode} 
                onChange={(e) => setInviteCode(e.target.value)} 
                placeholder="Örn: a1b2c3d4" 
                required
              />
            </div>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Katılınıyor...' : 'Sunucuya Katıl'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ServerModal;
