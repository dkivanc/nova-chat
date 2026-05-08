import React from 'react';
import { X, Compass, PlusCircle } from 'lucide-react';
import './ServerModal.css';

const ServerModal = ({ onClose }) => {
  return (
    <div className="server-modal-overlay glass">
      <div className="server-modal">
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2>Bir Sunucu Oluştur</h2>
        <p className="subtitle">Sunucun, senin ve arkadaşlarının takıldığı yerdir. Kendi sunucunu oluştur ve hemen sohbete başla.</p>
        
        <div className="server-options">
          <button className="server-option-btn" onClick={() => alert("Çok Yakında! (Şu anki Beta sürümünde sadece Nova Server aktiftir)")}>
            <div className="option-icon create"><PlusCircle size={32} /></div>
            <div className="option-text">
              <h3>Kendime Ait Oluştur</h3>
              <p>Sen ve arkadaşların için özel bir alan</p>
            </div>
          </button>
          
          <button className="server-option-btn" onClick={() => alert("Çok Yakında! (Şimdilik Nova Server üzerinden mesajlaşabilirsiniz)")}>
            <div className="option-icon join"><Compass size={32} /></div>
            <div className="option-text">
              <h3>Bir Sunucuya Katıl</h3>
              <p>Davet bağlantın var mı?</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerModal;
