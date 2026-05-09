import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Hash, Volume2, Settings, Mic, Headphones, Plus, Compass, Send, MicOff, Users, MessageCircle, Radio } from 'lucide-react';
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
  if (!username) return '#00d4ff';
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
  const [selectedMember, setSelectedMember] = useState(null);
  const [myAvatarColor, setMyAvatarColor] = useState(localStorage.getItem('nova_avatar_color') || '#00d4ff');
  const [myAboutMe, setMyAboutMe] = useState(localStorage.getItem('nova_about_me') || '');
  const messagesEndRef = useRef(null);

  // Get color for any user - use saved color for self, hash for others
  const getColorForUser = (username) => {
    if (user && username === user.username) return myAvatarColor;
    return getUserColor(username);
  };

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
    <div className="nova-app">
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
            const updatedServer = {
              ...activeServer,
              channels: [...(activeServer.channels || []), newChannel]
            };
            setActiveServer(updatedServer);
            setServers(prev => prev.map(s => s.id === updatedServer.id ? updatedServer : s));
          }}
        />
      )}

      {/* ========== TOP NAVIGATION BAR ========== */}
      <header className="top-bar">
        <div className="nova-brand" onClick={() => handleServerSwitch(null)}>
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Nova Chat</span>
        </div>

        <div className="tab-separator"></div>

        <div className="community-tabs">
          {servers.map(server => (
            <button 
              key={server.id}
              className={`community-tab ${activeServer?.id === server.id ? 'active' : ''}`}
              onClick={() => handleServerSwitch(server)}
              title={server.name}
            >
              <span className="tab-initial">{server.name.charAt(0).toUpperCase()}</span>
              <span className="tab-name">{server.name}</span>
            </button>
          ))}
          <button className="community-tab add-tab" onClick={() => setServerModalView('menu')} title="Topluluk Ekle">
            <Plus size={16} />
          </button>
        </div>
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <div className="main-content">

        {/* ===== LEFT SIDEBAR ===== */}
        <aside className="sidebar">
          {/* User Card (top) */}
          {user && (
            <div className="user-card" onClick={() => setShowProfilePopup(!showProfilePopup)}>
              <div className="user-card-avatar" style={{backgroundColor: myAvatarColor}}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-card-info">
                <span className="user-card-name">{user.username}</span>
                <span className="user-card-status">Çevrimiçi</span>
              </div>

              {/* Profile Popup */}
              {showProfilePopup && (
                <div className="profile-popup" onClick={e => e.stopPropagation()}>
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
            </div>
          )}

          {!activeServer ? (
            <div className="sidebar-home">
              <div className="channel-card active">
                <Compass size={18} className="channel-icon" />
                <span>Ana Sayfa</span>
              </div>
            </div>
          ) : (
            <>
              {/* Server Info */}
              <div className="server-info-card">
                <h2>{activeServer.name}</h2>
                <div className="invite-code">
                  Davet: <b>{activeServer.inviteCode}</b>
                </div>
              </div>

              {/* Text Channels */}
              <div className="channel-group">
                <div className="group-header">
                  <span className="group-title">💬 Sohbetler</span>
                  {activeServer.ownerId === user?.id && (
                    <button className="group-add-btn" onClick={() => setIsChannelModalOpen(true)}>
                      <Plus size={14} />
                    </button>
                  )}
                </div>
                {(activeServer.channels || []).filter(c => c.type === 'text').map((channel) => (
                  <div 
                    key={channel.id}
                    className={`channel-card ${activeChannel === channel.name ? 'active' : ''}`}
                    onClick={() => {
                      setMessages([]);
                      setActiveChannel(channel.name);
                    }}
                  >
                    <Hash size={16} className="channel-icon" />
                    <span>{channel.name}</span>
                  </div>
                ))}
              </div>

              {/* Voice Channels */}
              <div className="channel-group">
                <div className="group-header">
                  <span className="group-title">🎙️ Sesli Odalar</span>
                  {activeServer.ownerId === user?.id && (
                    <button className="group-add-btn" onClick={() => setIsChannelModalOpen(true)}>
                      <Plus size={14} />
                    </button>
                  )}
                </div>
                {(activeServer.channels || []).filter(c => c.type === 'voice').map((channel) => (
                  <div 
                    key={channel.id}
                    className={`channel-card ${activeChannel === channel.name ? 'active' : ''}`}
                    onClick={() => setActiveChannel(channel.name)}
                  >
                    <Radio size={16} className="channel-icon" />
                    <span>{channel.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <button 
              className="footer-btn" 
              onClick={() => setGlobalMicMuted(!globalMicMuted)} 
              title="Mikrofon"
            >
              {globalMicMuted ? <MicOff size={18} color="var(--danger)" /> : <Mic size={18} />}
            </button>
            <button 
              className={`footer-btn ${globalDeafened ? 'deafened' : ''}`}
              onClick={() => setGlobalDeafened(!globalDeafened)} 
              title="Sağırlaştır"
            >
              <Headphones size={18} />
            </button>
            <button 
              className="footer-btn" 
              onClick={() => setIsSettingsOpen(true)} 
              title="Ayarlar"
            >
              <Settings size={18} />
            </button>
          </div>
        </aside>

        {/* ===== MAIN CHAT / VOICE / WELCOME ===== */}
        {!activeServer ? (
          <main className="chat-main">
            <WelcomeHome 
              onCreateServer={() => setServerModalView('create')} 
              onJoinServer={() => setServerModalView('join')} 
            />
          </main>
        ) : !activeChannel ? (
          <main className="chat-main no-selection">
            <h2>Sohbet etmek için bir kanal seçin</h2>
          </main>
        ) : activeServer?.channels?.find(c => c.name === activeChannel)?.type === 'voice' ? (
          <main className="chat-main">
             <VoiceRoom 
               socket={socket} 
               roomId={`${activeServer.id}-${activeChannel}`} 
               currentUser={user} 
               globalMicMuted={globalMicMuted}
               globalDeafened={globalDeafened}
             />
          </main>
        ) : (
          <main className="chat-main">
            <header className="chat-header">
              <div className="chat-title">
                <Hash size={20} className="chat-title-icon" />
                <h2>{activeChannel}</h2>
              </div>
              <div className="chat-actions">
                 <button className={`action-btn ${showMembersSidebar ? 'active' : ''}`} onClick={() => setShowMembersSidebar(!showMembersSidebar)} title="Üyeleri Göster">
                   <Users size={18} />
                 </button>
              </div>
            </header>

            <div className="message-list">
              <div className="welcome-banner">
                <h1>#{activeChannel} kanalına hoş geldin!</h1>
                <p>Burası {activeServer?.name} topluluğunun başlangıç noktasıdır.</p>
              </div>

              {messages.map((msg) => (
                <div className="message-wrapper" key={msg.id}>
                  <div className="message-avatar" style={{backgroundColor: getColorForUser(msg.author)}}>
                    {msg.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-author" style={{color: getColorForUser(msg.author)}}>{msg.author}</span>
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

            <div className="chat-input-floating">
              <form className="chat-input-wrapper" onSubmit={handleSendMessage}>
                <Plus size={18} className="input-attach" />
                <input 
                  type="text" 
                  placeholder={`#${activeChannel} kanalına mesaj gönder`} 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={!user}
                />
                <button type="submit" className="send-btn" title="Gönder">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </main>
        )}

        {/* ===== MEMBERS PANEL (Right) ===== */}
        {showMembersSidebar && activeServer && activeChannel && (
          <aside className="members-panel">
            <h3>Çevrimiçi — {onlineUsers.length}</h3>
            {onlineUsers.map(u => (
              <div className="member-item" key={u} onClick={() => setSelectedMember(selectedMember === u ? null : u)}>
                <div className="member-avatar" style={{backgroundColor: getColorForUser(u)}}>
                  {u.charAt(0).toUpperCase()}
                </div>
                <span style={{color: getColorForUser(u)}}>{u}</span>

                {selectedMember === u && (
                  <div className="member-profile-popup" onClick={e => e.stopPropagation()}>
                    <div className="profile-popup-banner" style={{backgroundColor: getColorForUser(u)}}></div>
                    <div className="profile-popup-avatar" style={{backgroundColor: getColorForUser(u)}}>
                      {u.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-popup-body">
                      <h3>{u}</h3>
                      <span className="profile-popup-status">Çevrimiçi</span>
                      {u === user?.username && myAboutMe && (
                        <div className="profile-popup-about">
                          <h4>Hakkımda</h4>
                          <p>{myAboutMe}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {onlineUsers.length === 0 && (
              <p style={{color: 'var(--text-muted)', fontSize: '12px', padding: '8px'}}>Henüz kimse çevrimiçi değil</p>
            )}
          </aside>
        )}

      </div>
    </div>
  );
}

export default App;
