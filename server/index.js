const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const sequelize = require('./database');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Sync Database
sequelize.sync()
  .then(() => console.log('SQLite veritabanı başarıyla bağlandı ve senkronize edildi.'))
  .catch(err => console.error('Veritabanı senkronizasyon hatası:', err));

app.use('/api/auth', authRoutes);

// Socket.io
io.on('connection', (socket) => {
  console.log('Yeni bir kullanıcı bağlandı:', socket.id);

  socket.on('join_channel', (channelId) => {
    socket.join(channelId);
    console.log(`Kullanıcı ${socket.id}, ${channelId} kanalına katıldı.`);
  });

  socket.on('send_message', (data) => {
    // Mesajı aynı kanaldaki herkese (gönderen dahil) ilet
    io.to(data.channelId).emit('receive_message', data);
  });

  // --- WEBRTC SIGNALING ---

  socket.on('join_voice', (roomId) => {
    socket.join(roomId);
    console.log(`Kullanıcı ${socket.id}, ${roomId} sesli kanalına katıldı.`);
    // O odadaki diğer kullanıcılara yeni birinin geldiğini bildir
    socket.to(roomId).emit('user_joined_voice', socket.id);
  });

  socket.on('voice_offer', (data) => {
    // data: { target: string, caller: string, sdp: object }
    io.to(data.target).emit('voice_offer', data);
  });

  socket.on('voice_answer', (data) => {
    // data: { target: string, caller: string, sdp: object }
    io.to(data.target).emit('voice_answer', data);
  });

  socket.on('ice_candidate', (data) => {
    // data: { target: string, candidate: object }
    io.to(data.target).emit('ice_candidate', { caller: socket.id, candidate: data.candidate });
  });

  socket.on('leave_voice', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user_left_voice', socket.id);
  });

  // ------------------------

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('Nova Chat API is running with SQLite & Socket.io (WebRTC)');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
