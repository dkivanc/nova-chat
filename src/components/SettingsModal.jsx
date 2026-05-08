import React, { useState } from 'react';
import { X, Moon, Sun, User, LogOut } from 'lucide-react';
import './SettingsModal.css';

const SettingsModal = ({ onClose, onLogout, currentUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('nova_theme', newTheme);
  };

  return (
    <div className="settings-overlay glass">
      <div className="settings-modal">
        
        {/* Sidebar */}
        <div className="settings-sidebar">
          <div className="settings-header">
            <h3>Ayarlar</h3>
          </div>
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profil
          </button>
          <button 
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Görünüm
          </button>
          
          <div className="settings-divider"></div>
          
          <button className="settings-tab logout-btn" onClick={onLogout}>
            <LogOut size={18} /> Çıkış Yap
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          <button className="close-btn" onClick={onClose}>
             <X size={24} />
          </button>

          {activeTab === 'profile' && (
            <div className="tab-pane">
              <h2>Profilim</h2>
              <div className="profile-edit-card">
                <div className="profile-avatar-large">
                   {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="profile-details">
                   <p className="profile-label">KULLANICI ADI</p>
                   <p className="profile-value">{currentUser?.username}</p>
                   <button className="edit-btn">Profili Düzenle (Yakında)</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="tab-pane">
              <h2>Görünüm Ayarları</h2>
              <div className="theme-toggle-card">
                <p>Uygulama Teması</p>
                <button className="theme-btn" onClick={handleThemeToggle}>
                   {theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
