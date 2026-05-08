import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Hash, Volume2, Settings, Mic, Headphones, MonitorUp, Plus, Compass, Send, MicOff, PhoneOff } from 'lucide-react';
import AuthModal from './components/AuthModal';
import VoiceRoom from './components/VoiceRoom';
import SettingsModal from './components/SettingsModal';
import ServerModal from './components/ServerModal';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', { autoConnect: false });

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [activeChannel, setActiveChannel] = useState('genel-sohbet');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [globalMicMuted, setGlobalMicMuted] = useState(false);
  const [globalDeafened, setGlobalDeafened] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('nova_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const savedTheme = localStorage.getItem('nova_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Socket Connection Effect
  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('join_channel', activeChannel);

      const handleReceiveMsg = (messageData) => {
        if (messageData.channelId === activeChannel) {
          setMessages((prev) => [...prev, messageData]);
        }
      };

      socket.on('receive_message', handleReceiveMsg);

      return () => {
        socket.off('receive_message', handleReceiveMsg);
        socket.disconnect();
      };
    }
  }, [user, activeChannel]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem('nova_token');
    localStorage.removeItem('nova_user');
    setUser(null);
    setMessages([]);
    setIsSettingsOpen(false);
    socket.disconnect();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim() && user) {
      const msgData = {
        id: Date.now() + Math.random(),
        channelId: activeChannel,
        text: messageText,
        author: user.username,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      socket.emit('send_message', msgData);
      setMessageText('');
    }
  };

  return (
    <div className="app-container">
      {!user && <AuthModal onLoginSuccess={(userData) => setUser(userData)} />}
      {isSettingsOpen && (
        <SettingsModal 
          currentUser={user} 
          onClose={() => setIsSettingsOpen(false)} 
          onLogout={handleLogout} 
        />
      )}
      {isServerModalOpen && (
        <ServerModal onClose={() => setIsServerModalOpen(false)} />
      )}
      
      {/* Left Sidebar - Servers */}
      <nav className="server-sidebar">
        <div className="server-icon active">
          <Compass size={24} />
        </div>
        <div className="server-separator"></div>
        <div className="server-icon glass">
          <span>N</span>
        </div>
        <div className="server-icon create-server" onClick={() => setIsServerModalOpen(true)}>
          <Plus size={24} />
        </div>
      </nav>

      {/* Middle Sidebar - Channels */}
      <aside className="channel-sidebar">
        <div className="channel-header">
          <h2>Nova Server</h2>
        </div>
        
        <div className="channel-section">
          <div className="section-title">Metin Kanalları</div>
          <div 
            className={`channel-item ${activeChannel === 'genel-sohbet' ? 'active' : ''}`}
            onClick={() => { setActiveChannel('genel-sohbet'); setMessages([]); }}
          >
            <Hash size={18} />
            <span>genel-sohbet</span>
          </div>
          <div 
            className={`channel-item ${activeChannel === 'duyurular' ? 'active' : ''}`}
            onClick={() => { setActiveChannel('duyurular'); setMessages([]); }}
          >
            <Hash size={18} />
            <span>duyurular</span>
          </div>
        </div>

        <div className="channel-section">
          <div className="section-title">Ses Kanalları</div>
          <div 
            className={`channel-item voice ${activeChannel === 'lobi' ? 'active' : ''}`}
            onClick={() => setActiveChannel('lobi')}
          >
            <Volume2 size={18} />
            <span>Lobi</span>
          </div>
        </div>

        {/* User Profile Mini Bar */}
        <div className="user-profile-bar">
          <div className="user-info">
            <div className="user-avatar">{user ? user.username.charAt(0).toUpperCase() : '?'}</div>
            <div className="user-status-text">
              <span className="username">{user ? user.username : 'Misafir'}</span>
              <span className="status">Çevrimiçi</span>
            </div>
          </div>
          <div className="user-controls">
            <button 
              className="control-btn" 
              onClick={() => setGlobalMicMuted(!globalMicMuted)} 
              title="Mikrofon"
            >
              {globalMicMuted ? <MicOff size={18} color="var(--danger)" /> : <Mic size={18} />}
            </button>
            <button 
              className="control-btn" 
              onClick={() => setGlobalDeafened(!globalDeafened)} 
              title="Sağırlaştır"
            >
              {globalDeafened ? <PhoneOff size={18} color="var(--danger)" /> : <Headphones size={18} />}
            </button>
            <button 
              className="control-btn" 
              onClick={() => setIsSettingsOpen(true)} 
              title="Ayarlar"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area or Voice Room */}
      {activeChannel === 'lobi' ? (
        <main className="chat-area">
           <VoiceRoom 
             socket={socket} 
             roomId={activeChannel} 
             currentUser={user} 
             globalMicMuted={globalMicMuted}
             globalDeafened={globalDeafened}
           />
        </main>
      ) : (
        <main className="chat-area">
          <header className="chat-header">
            <div className="chat-title">
              <Hash size={24} />
              <h2>{activeChannel}</h2>
            </div>
            <div className="chat-actions">
               <button className="action-btn"><MonitorUp size={20} /></button>
            </div>
          </header>

        <div className="message-list">
          {/* Welcome Message */}
          <div className="welcome-banner glass">
            <h1>#{activeChannel} kanalına hoş geldin!</h1>
            <p>Burası Nova Server sunucusunun başlangıç noktasıdır.</p>
          </div>

          {/* Real Messages */}
          {messages.map((msg) => (
            <div className="message-wrapper" key={msg.id}>
              <div className="message-avatar">
                {msg.author.charAt(0).toUpperCase()}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-author">{msg.author}</span>
                  <span className="message-timestamp">{msg.timestamp}</span>
                </div>
                <div className="message-text">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <form className="chat-input-wrapper" onSubmit={handleSendMessage}>
            <Plus size={20} className="input-attach" />
            <input 
              type="text" 
              placeholder={`#${activeChannel} kanalına mesaj gönder`} 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={!user}
            />
            <button type="submit" style={{display: 'none'}}>Gönder</button>
          </form>
        </div>
      </main>
      )}
    </div>
  );
}

export default App;
