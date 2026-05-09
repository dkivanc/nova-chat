import React, { useState, useEffect, useRef } from 'react';
import { X, Moon, Sun, User, LogOut, Volume2, Bell, Shield, Camera } from 'lucide-react';
import './SettingsModal.css';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

const avatarColors = [
  '#5865F2', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#00bcd4', '#009688', '#4caf50', '#ff9800',
  '#ff5722', '#f44336', '#7c4dff', '#00e5ff'
];

const SettingsModal = ({ onClose, onLogout, currentUser, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const fileInputRef = useRef(null);
  
  // Profile state
  const [aboutMe, setAboutMe] = useState('');
  const [avatarColor, setAvatarColor] = useState('#5865F2');
  const [avatarImage, setAvatarImage] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);

  // Audio state
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedInput, setSelectedInput] = useState('default');
  const [selectedOutput, setSelectedOutput] = useState('default');
  const [inputVolume, setInputVolume] = useState(100);
  const [outputVolume, setOutputVolume] = useState(100);

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load saved profile data
  useEffect(() => {
    const savedAbout = localStorage.getItem('nova_about_me');
    const savedColor = localStorage.getItem('nova_avatar_color');
    const savedAvatar = localStorage.getItem('nova_avatar_image');
    const savedNotif = localStorage.getItem('nova_notifications');
    const savedSound = localStorage.getItem('nova_sound');
    if (savedAbout) setAboutMe(savedAbout);
    if (savedColor) setAvatarColor(savedColor);
    if (savedAvatar) setAvatarImage(savedAvatar);
    if (savedNotif !== null) setNotificationsEnabled(savedNotif === 'true');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
  }, []);

  // Load audio devices - request permission first
  useEffect(() => {
    if (activeTab === 'audio') {
      const loadDevices = async () => {
        try {
          // Request mic permission to get device labels
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop the stream immediately
          stream.getTracks().forEach(track => track.stop());
          // Now enumerate devices (labels will be available)
          const devices = await navigator.mediaDevices.enumerateDevices();
          setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));
          setAudioOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
        } catch (err) {
          console.log('Mikrofon izni reddedildi');
          // Try without permission
          const devices = await navigator.mediaDevices.enumerateDevices();
          setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));
          setAudioOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
        }
      };
      loadDevices();
    }
  }, [activeTab]);

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('nova_theme', newTheme);
  };

  const handleSaveProfile = () => {
    localStorage.setItem('nova_about_me', aboutMe);
    localStorage.setItem('nova_avatar_color', avatarColor);
    if (avatarImage) localStorage.setItem('nova_avatar_image', avatarImage);
    setProfileSaved(true);
    // Sync to parent
    if (onProfileUpdate) {
      onProfileUpdate({ avatarColor, aboutMe, avatarImage });
    }
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSaveNotifications = () => {
    localStorage.setItem('nova_notifications', notificationsEnabled.toString());
    localStorage.setItem('nova_sound', soundEnabled.toString());
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Dosya boyutu 2MB\'dan küçük olmalıdır.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="settings-overlay glass">
      <div className="settings-modal">
        
        {/* Sidebar */}
        <div className="settings-sidebar">
          <div className="settings-header">
            <h3>Ayarlar</h3>
          </div>
          
          <div className="settings-category">KULLANICI AYARLARI</div>
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profilim
          </button>
          <button 
            className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <Shield size={18} /> Hesap
          </button>
          
          <div className="settings-category">UYGULAMA AYARLARI</div>
          <button 
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Görünüm
          </button>
          <button 
            className={`settings-tab ${activeTab === 'audio' ? 'active' : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            <Volume2 size={18} /> Ses & Video
          </button>
          <button 
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} /> Bildirimler
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

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="tab-pane">
              <h2>Profilim</h2>
              <div className="profile-edit-card">
                <div className="profile-avatar-section">
                  {avatarImage ? (
                    <img src={avatarImage} alt="Avatar" className="profile-avatar-large profile-avatar-img" />
                  ) : (
                    <div className="profile-avatar-large" style={{backgroundColor: avatarColor}}>
                       {currentUser?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="avatar-upload-btn" onClick={() => fileInputRef.current?.click()}>
                    <Camera size={14} />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{display: 'none'}} 
                    accept="image/*" 
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div className="profile-details">
                   <p className="profile-label">KULLANICI ADI</p>
                   <p className="profile-value">{currentUser?.username}</p>
                </div>
              </div>

              {/* Profile Preview Card */}
              <div className="settings-card profile-preview-card">
                <h3>Profil Önizleme</h3>
                <div className="profile-preview">
                  <div className="preview-banner" style={{backgroundColor: avatarColor}}></div>
                  <div className="preview-avatar-wrapper">
                    {avatarImage ? (
                      <img src={avatarImage} alt="Avatar" className="preview-avatar preview-avatar-img" />
                    ) : (
                      <div className="preview-avatar" style={{backgroundColor: avatarColor}}>
                        {currentUser?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="preview-body">
                    <h4>{currentUser?.username}</h4>
                    <span className="preview-status">🟢 Çevrimiçi</span>
                    {aboutMe && (
                      <div className="preview-about">
                        <p className="preview-about-label">HAKKIMDA</p>
                        <p>{aboutMe}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <h3>Avatar Rengi</h3>
                <div className="color-picker-grid">
                  {avatarColors.map(color => (
                    <div 
                      key={color}
                      className={`color-swatch ${avatarColor === color ? 'active' : ''}`}
                      style={{backgroundColor: color}}
                      onClick={() => setAvatarColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="settings-card">
                <h3>Hakkımda</h3>
                <textarea
                  className="about-me-input"
                  placeholder="Kendiniz hakkında bir şeyler yazın..."
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  maxLength={190}
                />
                <span className="char-count">{aboutMe.length}/190</span>
              </div>

              <button className="save-btn" onClick={handleSaveProfile}>
                {profileSaved ? '✅ Kaydedildi!' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="tab-pane">
              <h2>Hesap Bilgileri</h2>
              <div className="settings-card">
                <div className="account-field">
                  <p className="profile-label">KULLANICI ADI</p>
                  <p className="profile-value">{currentUser?.username}</p>
                </div>
                <div className="account-field">
                  <p className="profile-label">E-POSTA</p>
                  <p className="profile-value muted">Doğrulanmış ✅</p>
                </div>
              </div>
              <div className="settings-card danger-zone">
                <h3>Tehlike Bölgesi</h3>
                <p className="danger-text">Hesabınızı silerseniz geri dönüş yoktur. Tüm verileriniz kalıcı olarak silinir.</p>
                <button className="danger-btn">Hesabımı Sil</button>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="tab-pane">
              <h2>Görünüm Ayarları</h2>
              <div className="settings-card">
                <div className="setting-row">
                  <div>
                    <h3>Uygulama Teması</h3>
                    <p className="setting-desc">Koyu ve açık tema arasında geçiş yapın</p>
                  </div>
                  <button className="theme-btn" onClick={handleThemeToggle}>
                     {theme === 'dark' ? '☀️ Açık Tema' : '🌙 Koyu Tema'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AUDIO TAB */}
          {activeTab === 'audio' && (
            <div className="tab-pane">
              <h2>Ses & Video</h2>
              <div className="settings-card">
                <h3>Ses Giriş Cihazı</h3>
                <select className="device-select" value={selectedInput} onChange={e => setSelectedInput(e.target.value)}>
                  {audioInputDevices.length > 0 ? audioInputDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Mikrofon ${d.deviceId.slice(0,4)}`}</option>
                  )) : <option value="default">Varsayılan Mikrofon</option>}
                </select>
                <div className="volume-control">
                  <span>Giriş Seviyesi</span>
                  <input 
                    type="range" min="0" max="100" 
                    value={inputVolume} 
                    onChange={e => setInputVolume(e.target.value)}
                    className="volume-slider"
                  />
                  <span className="volume-value">{inputVolume}%</span>
                </div>
              </div>
              <div className="settings-card">
                <h3>Ses Çıkış Cihazı</h3>
                <select className="device-select" value={selectedOutput} onChange={e => setSelectedOutput(e.target.value)}>
                  {audioOutputDevices.length > 0 ? audioOutputDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Hoparlör ${d.deviceId.slice(0,4)}`}</option>
                  )) : <option value="default">Varsayılan Hoparlör</option>}
                </select>
                <div className="volume-control">
                  <span>Çıkış Seviyesi</span>
                  <input 
                    type="range" min="0" max="100" 
                    value={outputVolume} 
                    onChange={e => setOutputVolume(e.target.value)}
                    className="volume-slider"
                  />
                  <span className="volume-value">{outputVolume}%</span>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="tab-pane">
              <h2>Bildirim Ayarları</h2>
              <div className="settings-card">
                <div className="setting-row">
                  <div>
                    <h3>Masaüstü Bildirimleri</h3>
                    <p className="setting-desc">Yeni mesaj geldiğinde bildirim alın</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={notificationsEnabled} onChange={e => { setNotificationsEnabled(e.target.checked); handleSaveNotifications(); }} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div className="settings-card">
                <div className="setting-row">
                  <div>
                    <h3>Bildirim Sesleri</h3>
                    <p className="setting-desc">Mesaj geldiğinde ses çalsın</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={soundEnabled} onChange={e => { setSoundEnabled(e.target.checked); handleSaveNotifications(); }} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
