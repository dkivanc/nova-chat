import React, { useState } from 'react';
import { X } from 'lucide-react';
import './ServerModal.css'; // We can reuse the CSS for the modal

const CreateChannelModal = ({ onClose, onChannelCreated, serverId }) => {
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
  const token = localStorage.getItem('nova_token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/server/${serverId}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: channelName.toLowerCase().replace(/\s+/g, '-'), type: channelType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kanal oluşturulamadı');
      
      onChannelCreated(data);
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

        <form onSubmit={handleSubmit} className="server-form">
          <h2>Kanal Oluştur</h2>
          <p className="subtitle">Sunucun için yeni bir metin veya ses kanalı aç.</p>
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <label>KANAL TİPİ</label>
            <select 
              value={channelType} 
              onChange={(e) => setChannelType(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                fontSize: '16px'
              }}
            >
              <option value="text">Metin Kanalı</option>
              <option value="voice">Ses Kanalı</option>
            </select>
          </div>

          <div className="input-group">
            <label>KANAL ADI</label>
            <input 
              type="text" 
              value={channelName} 
              onChange={(e) => setChannelName(e.target.value)} 
              placeholder="Örn: oyun-odasi" 
              required
            />
          </div>
          
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
