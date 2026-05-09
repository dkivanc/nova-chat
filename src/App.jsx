import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Hash, Volume2, Settings, Mic, Headphones, MonitorUp, Plus, Compass, Send, MicOff, PhoneOff } from 'lucide-react';
import AuthModal from './components/AuthModal';
import VoiceRoom from './components/VoiceRoom';
import SettingsModal from './components/SettingsModal';
import ServerModal from './components/ServerModal';
import CreateChannelModal from './components/CreateChannelModal';
import WelcomeHome from './components/WelcomeHome';
import { io } from 'socket.io-client';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
const socket = io(BACKEND_URL, { autoConnect: false });

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [activeChannel, setActiveChannel] = useState(null);
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
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

  const fetchServers = async () => {
    const token = localStorage.getItem('nova_token');
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/server/mine`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setServers(data);
        if (data.length > 0 && !activeServer) {
          setActiveServer(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchServers();
    }
  }, [user]);

  // Socket Connection Effect
  useEffect(() => {
    if (user) {
      socket.connect();
      if (activeServer && activeChannel) {
        socket.emit('join_channel', { serverId: activeServer.id, channelId: activeChannel });
      }

      const handleReceiveMsg = (messageData) => {
        if (activeServer && messageData.channelId === activeChannel && messageData.serverId === activeServer.id) {
          setMessages((prev) => [...prev, messageData]);
        }
      };

      socket.on('receive_message', handleReceiveMsg);

      return () => {
        socket.off('receive_message', handleReceiveMsg);
        socket.disconnect();
      };
    }
  }, [user, activeChannel, activeServer]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async (channelId) => {
    const token = localStorage.getItem('nova_token');
    if (!token) return;
    try {
      const serverParam = activeServer ? `?serverId=${activeServer.id}` : '';
      const res = await fetch(`${BACKEND_URL}/api/messages/${channelId}${serverParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && activeChannel && activeServer) {
      fetchMessages(activeChannel);
    }
  }, [user, activeChannel, activeServer]);

  const handleServerSwitch = (server) => {
    if (!server) {
      setActiveServer(null);
      setActiveChannel(null);
      return;
    }
    setActiveServer(server);
    const textChannels = (server.channels || []).filter(c => c.type === 'text');
    if (textChannels.length > 0) {
      setActiveChannel(textChannels[0].name);
    } else {
      setActiveChannel(null);
    }
    setMessages([]);
  };

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
        serverId: activeServer ? activeServer.id : null,
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
        <ServerModal 
          onClose={() => setIsServerModalOpen(false)} 
          onServerAdded={(newServer) => {
            setServers(prev => [...prev, newServer]);
            handleServerSwitch(newServer);
          }}
        />
      )}
      {isChannelModalOpen && activeServer && (
        <CreateChannelModal 
          serverId={activeServer.id}
          onClose={() => setIsChannelModalOpen(false)}
          onChannelCreated={(newChannel) => {
            // Update activeServer channels
            const updatedServer = {
              ...activeServer,
              channels: [...(activeServer.channels || []), newChannel]
            };
            setActiveServer(updatedServer);
            // Update servers list
            setServers(prev => prev.map(s => s.id === updatedServer.id ? updatedServer : s));
          }}
        />
      )}
      
      {/* Left Sidebar - Servers */}
      <nav className="server-sidebar">
        <div className={`server-icon ${!activeServer ? 'active' : ''}`} onClick={() => handleServerSwitch(null)} title="Ana Sayfa (Home)">
          <Compass size={24} />
        </div>
        <div className="server-separator"></div>
        {servers.map(server => (
          <div 
            key={server.id} 
            className={`server-icon glass ${activeServer?.id === server.id ? 'active' : ''}`}
            onClick={() => handleServerSwitch(server)}
            title={server.name}
          >
            <span>{server.name.charAt(0).toUpperCase()}</span>
          </div>
        ))}
        <div className="server-icon create-server" onClick={() => setIsServerModalOpen(true)} title="Sunucu Ekle">
          <Plus size={24} />
        </div>
      </nav>

      {/* Middle Sidebar & Main Content */}
      {!activeServer ? (
        <WelcomeHome onOpenServerModal={() => setIsServerModalOpen(true)} />
      ) : (
        <>
          <aside className="channel-sidebar">
            <div className="channel-header">
              <h2>{activeServer.name}</h2>
              <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>
                Davet Kodu: <b>{activeServer.inviteCode}</b>
              </div>
            </div>
        
        <div className="channel-section">
          <div className="section-title">
            Metin Kanalları
            {activeServer && activeServer.ownerId === user?.id && (
              <Plus size={16} style={{cursor: 'pointer', float: 'right'}} onClick={() => setIsChannelModalOpen(true)} />
            )}
          </div>
          {(activeServer.channels || []).filter(c => c.type === 'text').map((channel) => (
            <div 
              key={channel.id}
              className={`channel-item ${activeChannel === channel.name ? 'active' : ''}`}
              onClick={() => {
                setMessages([]);
                setActiveChannel(channel.name);
              }}
            >
              <Hash size={18} />
              <span>{channel.name}</span>
            </div>
          ))}
        </div>

        <div className="channel-section">
          <div className="section-title">
            Ses Kanalları
            {activeServer && activeServer.ownerId === user?.id && (
              <Plus size={16} style={{cursor: 'pointer', float: 'right'}} onClick={() => setIsChannelModalOpen(true)} />
            )}
          </div>
          {(activeServer.channels || []).filter(c => c.type === 'voice').map((channel) => (
            <div 
              key={channel.id}
              className={`channel-item voice ${activeChannel === channel.name ? 'active' : ''}`}
              onClick={() => setActiveChannel(channel.name)}
            >
              <Volume2 size={18} />
              <span>{channel.name}</span>
            </div>
          ))}
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
      {!activeChannel ? (
        <main className="chat-area" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <h2 style={{color: 'var(--text-muted)'}}>Sohbet etmek için bir kanal seçin</h2>
        </main>
      ) : activeServer?.channels?.find(c => c.name === activeChannel)?.type === 'voice' ? (
        <main className="chat-area">
           <VoiceRoom 
             socket={socket} 
             roomId={`${activeServer.id}-${activeChannel}`} 
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
      </>
      )}
    </div>
  );
}

export default App;
