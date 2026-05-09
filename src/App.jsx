import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Hash, Volume2, Settings, Mic, Headphones, Plus, Compass, Send, MicOff, Users } from 'lucide-react';
import AuthModal from './components/AuthModal';
import VoiceRoom from './components/VoiceRoom';
import SettingsModal from './components/SettingsModal';
import ServerModal from './components/ServerModal';
import CreateChannelModal from './components/CreateChannelModal';
import WelcomeHome from './components/WelcomeHome';
import { io } from 'socket.io-client';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
const socket = io(BACKEND_URL, { autoConnect: false });

// Utility: Generate consistent color for a username
const getUserColor = (username) => {
  if (!username) return '#5865F2';
  const colors = [
    '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
    '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722',
    '#f44336', '#7c4dff', '#00e5ff', '#76ff03', '#ffc107'
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [activeChannel, setActiveChannel] = useState(null);
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [serverModalView, setServerModalView] = useState(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [globalMicMuted, setGlobalMicMuted] = useState(false);
  const [globalDeafened, setGlobalDeafened] = useState(false);
  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [myAvatarColor, setMyAvatarColor] = useState(localStorage.getItem('nova_avatar_color') || '#5865F2');
  const [myAboutMe, setMyAboutMe] = useState(localStorage.getItem('nova_about_me') || '');
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

      const handleConnect = () => {
        if (activeServer && activeChannel) {
          socket.emit('join_channel', { serverId: activeServer.id, channelId: activeChannel });
        }
        if (activeServer) {
          socket.emit('user_online', { serverId: activeServer.id, username: user.username });
        }
      };

      // If already connected, emit immediately
      if (socket.connected) {
        handleConnect();
      }
      socket.on('connect', handleConnect);

      const handleReceiveMsg = (messageData) => {
        if (activeServer && messageData.channelId === activeChannel && messageData.serverId === activeServer.id) {
          setMessages((prev) => [...prev, messageData]);
        }
      };

      const handleOnlineUsers = (data) => {
        if (activeServer && data.serverId === activeServer.id) {
          setOnlineUsers(data.users);
        }
      };

      socket.on('receive_message', handleReceiveMsg);
      socket.on('online_users_update', handleOnlineUsers);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('receive_message', handleReceiveMsg);
        socket.off('online_users_update', handleOnlineUsers);
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
          onProfileUpdate={({ avatarColor, aboutMe }) => {
            if (avatarColor) setMyAvatarColor(avatarColor);
            if (aboutMe !== undefined) setMyAboutMe(aboutMe);
          }}
        />
      )}
      {serverModalView && (
        <ServerModal 
          initialMode={serverModalView}
          onClose={() => setServerModalView(null)} 
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
        <div className="server-icon create-server" onClick={() => setServerModalView('menu')} title="Sunucu Ekle">
          <Plus size={24} />
        </div>
      </nav>

      {/* Middle Sidebar */}
      <aside className="channel-sidebar">
        {!activeServer ? (
          <>
            <div className="channel-header">
              <h2>Keşfet</h2>
            </div>
            <div className="channel-section">
              <div className="channel-item active">
                <Compass size={18} />
                <span>Ana Sayfa</span>
              </div>
            </div>
            <div style={{flex: 1}}></div>
          </>
        ) : (
          <>
            <div className="channel-header">
              <h2>{activeServer.name}</h2>
              <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>
                Davet Kodu: <b>{activeServer.inviteCode}</b>
              </div>
            </div>
        
            <div className="channel-section">
              <div className="section-title">
                Metin Kanalları
                {activeServer.ownerId === user?.id && (
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
                {activeServer.ownerId === user?.id && (
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
          </>
        )}

        {/* User Profile Mini Bar */}
        <div className="user-profile-bar">
          <div className="user-info" onClick={() => setShowProfilePopup(!showProfilePopup)}>
            <div className="user-avatar" style={{backgroundColor: myAvatarColor}}>{user ? user.username.charAt(0).toUpperCase() : '?'}</div>
            <div className="user-status-text">
              <span className="username">{user ? user.username : 'Misafir'}</span>
              <span className="status">Çevrimiçi</span>
            </div>
          </div>

          {/* Profile Popup */}
          {showProfilePopup && user && (
            <div className="profile-popup">
              <div className="profile-popup-banner" style={{backgroundColor: myAvatarColor}}></div>
              <div className="profile-popup-avatar" style={{backgroundColor: myAvatarColor}}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="profile-popup-body">
                <h3>{user.username}</h3>
                <span className="profile-popup-status">Çevrimiçi</span>
                {myAboutMe && (
                  <div className="profile-popup-about">
                    <h4>Hakkımda</h4>
                    <p>{myAboutMe}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="user-controls">
            <button 
              className="control-btn" 
              onClick={() => setGlobalMicMuted(!globalMicMuted)} 
              title="Mikrofon"
            >
              {globalMicMuted ? <MicOff size={18} color="var(--danger)" /> : <Mic size={18} />}
            </button>
            <button 
              className={`control-btn ${globalDeafened ? 'deafened' : ''}`}
              onClick={() => setGlobalDeafened(!globalDeafened)} 
              title="Sağırlaştır"
            >
              <Headphones size={18} />
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

      {/* Main Chat Area or Voice Room or Welcome Home */}
      {!activeServer ? (
        <main className="chat-area">
          <WelcomeHome 
            onCreateServer={() => setServerModalView('create')} 
            onJoinServer={() => setServerModalView('join')} 
          />
        </main>
      ) : !activeChannel ? (
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
               <button className={`action-btn ${showMembersSidebar ? 'active' : ''}`} onClick={() => setShowMembersSidebar(!showMembersSidebar)} title="Üyeleri Göster">
                 <Users size={20} />
               </button>
            </div>
          </header>

        <div className="message-list">
          {/* Welcome Message */}
          <div className="welcome-banner glass">
            <h1>#{activeChannel} kanalına hoş geldin!</h1>
            <p>Burası {activeServer?.name} sunucusunun başlangıç noktasıdır.</p>
          </div>

          {/* Real Messages */}
          {messages.map((msg) => (
            <div className="message-wrapper" key={msg.id}>
              <div className="message-avatar" style={{backgroundColor: getUserColor(msg.author)}}>
                {msg.author.charAt(0).toUpperCase()}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-author" style={{color: getUserColor(msg.author)}}>{msg.author}</span>
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

      {/* Members Sidebar */}
      {showMembersSidebar && activeServer && activeChannel && (
        <aside className="members-sidebar">
          <h3>Çevrimiçi — {onlineUsers.length}</h3>
          {onlineUsers.map(u => (
            <div className="member-item" key={u}>
              <div className="member-avatar" style={{backgroundColor: getUserColor(u)}}>
                {u.charAt(0).toUpperCase()}
              </div>
              <span style={{color: getUserColor(u)}}>{u}</span>
            </div>
          ))}
          {onlineUsers.length === 0 && (
            <p style={{color: 'var(--text-muted)', fontSize: '13px', padding: '8px'}}>Henüz kimse çevrimiçi değil</p>
          )}
        </aside>
      )}
    </div>
  );
}

export default App;
