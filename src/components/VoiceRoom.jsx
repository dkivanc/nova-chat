import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, PhoneOff, User, Video, VideoOff, MonitorUp, MonitorX } from 'lucide-react';
import './VoiceRoom.css';

const VoiceRoom = ({ socket, roomId, currentUser, globalMicMuted, globalDeafened }) => {
  const [peers, setPeers] = useState({}); // { socketId: MediaStream }
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  
  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef({}); 
  const mediaElementsRef = useRef({}); 

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    let currentStream = null;

    const initVoice = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: false 
        });
        currentStream = stream;
        setLocalStream(stream);

        socket.emit('join_voice', roomId);

        socket.on('user_joined_voice', async (newUserId) => {
          const pc = createPeerConnection(newUserId);
          stream.getTracks().forEach(track => pc.addTrack(track, stream));

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('voice_offer', {
            target: newUserId,
            caller: socket.id,
            sdp: pc.localDescription
          });
        });

        socket.on('voice_offer', async (data) => {
          const { caller, sdp } = data;
          const pc = createPeerConnection(caller);
          stream.getTracks().forEach(track => pc.addTrack(track, stream));

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('voice_answer', {
            target: caller,
            caller: socket.id,
            sdp: pc.localDescription
          });
        });

        socket.on('voice_answer', async (data) => {
          const { caller, sdp } = data;
          const pc = peerConnectionsRef.current[caller];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          }
        });

        socket.on('ice_candidate', async (data) => {
          const { caller, candidate } = data;
          const pc = peerConnectionsRef.current[caller];
          if (pc && candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
          }
        });

        socket.on('user_left_voice', (userId) => {
          if (peerConnectionsRef.current[userId]) {
            peerConnectionsRef.current[userId].close();
            delete peerConnectionsRef.current[userId];
          }
          setPeers(prev => {
            const newPeers = { ...prev };
            delete newPeers[userId];
            return newPeers;
          });
        });

      } catch (err) {
        console.error('Erişim reddedildi:', err);
        alert('Mikrofon/Kamera erişimi reddedildi.');
      }
    };

    initVoice();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      socket.emit('leave_voice', roomId);
      socket.off('user_joined_voice');
      socket.off('voice_offer');
      socket.off('voice_answer');
      socket.off('ice_candidate');
      socket.off('user_left_voice');
    };
  }, [roomId, socket]); 

  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection(configuration);
    peerConnectionsRef.current[targetUserId] = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          target: targetUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      // Force re-render to update video elements
      setPeers(prev => ({
        ...prev,
        [targetUserId]: event.streams[0]
      }));
    };

    // If renegotiation is needed because of track replacements
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice_offer', {
          target: targetUserId,
          caller: socket.id,
          sdp: pc.localDescription
        });
      } catch (err) {
        console.error(err);
      }
    };

    return pc;
  };

  useEffect(() => {
    if (localVideoRef.current && localStream && (isVideoEnabled || isScreenSharing)) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [isVideoEnabled, isScreenSharing, localStream]);

  const updateVideoTrack = async (newVideoTrack) => {
    if (!localStream) return;
    
    try {
      const existingVideoTracks = localStream.getVideoTracks();
      existingVideoTracks.forEach(track => {
        localStream.removeTrack(track);
        track.stop();
      });

      if (newVideoTrack) {
        localStream.addTrack(newVideoTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      }

      Object.values(peerConnectionsRef.current).forEach(pc => {
        try {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender && newVideoTrack) {
            sender.replaceTrack(newVideoTrack);
          } else if (sender && !newVideoTrack) {
            pc.removeTrack(sender);
          } else if (!sender && newVideoTrack) {
            pc.addTrack(newVideoTrack, localStream);
          }
        } catch(err) {
          console.error("Track update error:", err);
        }
      });
    } catch (err) {
      console.error("updateVideoTrack error:", err);
    }
  };

  const toggleVideo = async () => {
    if (isScreenSharing) {
      alert("Lütfen önce ekran paylaşımını durdurun.");
      return;
    }

    try {
      if (!isVideoEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        setIsVideoEnabled(true);
        await updateVideoTrack(videoTrack);
      } else {
        setIsVideoEnabled(false);
        await updateVideoTrack(null);
      }
    } catch (err) {
      console.error(err);
      alert("Kamera açılamadı.");
      setIsVideoEnabled(false);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          updateVideoTrack(null);
          if (isVideoEnabled) toggleVideo(); 
        };

        await updateVideoTrack(videoTrack);
        setIsScreenSharing(true);
      } else {
        await updateVideoTrack(null);
        setIsScreenSharing(false);
        setIsVideoEnabled(false); 
      }
    } catch (err) {
      console.error(err);
      alert("Ekran paylaşılamadı.");
    }
  };

  useEffect(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !globalMicMuted && !globalDeafened;
      }
    }
  }, [globalMicMuted, globalDeafened, localStream]);

  useEffect(() => {
    Object.values(mediaElementsRef.current).forEach(el => {
      if (el) el.muted = globalDeafened;
    });
  }, [globalDeafened, peers]);

  useEffect(() => {
    Object.keys(peers).forEach(userId => {
      if (mediaElementsRef.current[userId]) {
        mediaElementsRef.current[userId].srcObject = peers[userId];
      }
    });
  }, [peers]);

  return (
    <div className="voice-room-container">
      <div className="voice-room-header">
        <h2>🔊 Ses Kanalı: {roomId}</h2>
        <div className="voice-status">
           {localStream ? <span className="status-dot green"></span> : <span className="status-dot red"></span>}
           {localStream ? 'Bağlanıldı' : 'Bağlanıyor...'}
        </div>
      </div>

      <div className="voice-participants grid-layout">
        {/* Local User */}
        <div className="participant-card local">
          {(isVideoEnabled || isScreenSharing) ? (
            <video ref={localVideoRef} autoPlay muted className="participant-video" />
          ) : (
            <div className="participant-avatar">
              {currentUser?.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="participant-name">{currentUser?.username} (Sen)</span>
          <div className="participant-status">
            {globalMicMuted && <MicOff size={16} color="var(--danger)" />}
            {globalDeafened && <PhoneOff size={16} color="var(--danger)" style={{marginLeft: '4px'}} />}
          </div>
        </div>

        {/* Remote Users */}
        {Object.keys(peers).map(userId => {
          const stream = peers[userId];
          const hasVideo = stream && stream.getVideoTracks().length > 0;
          return (
            <div className="participant-card" key={userId}>
               {hasVideo ? (
                 <video 
                   ref={el => mediaElementsRef.current[userId] = el} 
                   autoPlay 
                   className="participant-video"
                 />
               ) : (
                 <>
                   <div className="participant-avatar remote">
                     <User size={24} />
                   </div>
                   <audio 
                     ref={el => mediaElementsRef.current[userId] = el} 
                     autoPlay 
                     style={{display: 'none'}} 
                   />
                 </>
               )}
               <span className="participant-name">Kullanıcı {userId.substring(0,4)}</span>
            </div>
          )
        })}
      </div>

      <div className="voice-controls">
        <button 
          className={`voice-btn ${isVideoEnabled ? 'active' : ''}`} 
          onClick={toggleVideo} 
          title="Kamerayı Aç/Kapat"
        >
          {isVideoEnabled ? <Video size={24} color="white" /> : <VideoOff size={24} />}
        </button>
        <button 
          className={`voice-btn ${isScreenSharing ? 'active' : ''}`} 
          onClick={toggleScreenShare} 
          title="Ekran Paylaş"
        >
          {isScreenSharing ? <MonitorX size={24} color="white" /> : <MonitorUp size={24} />}
        </button>
        <button 
          className="voice-btn disconnect" 
          onClick={() => window.location.reload()} 
          title="Bağlantıyı Kes"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default VoiceRoom;
