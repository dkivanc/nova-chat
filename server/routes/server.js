const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Server = require('../models/Server');
const ServerMember = require('../models/ServerMember');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Yetkisiz erişim' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Geçersiz token' });
  }
};

// Kullanıcının sunucularını getir
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Server, through: { attributes: [] } }]
    });
    res.json(user.Servers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucular getirilemedi' });
  }
});

// Yeni sunucu oluştur
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const inviteCode = uuidv4().substring(0, 8); // 8 karakterlik invite code
    const newServer = await Server.create({
      name,
      inviteCode,
      ownerId: req.user.id
    });
    
    // Kuran kişiyi admin olarak ekle
    await ServerMember.create({
      userId: req.user.id,
      serverId: newServer.id,
      role: 'owner'
    });

    res.json(newServer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu oluşturulamadı' });
  }
});

// Davet linki ile katıl
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const targetServer = await Server.findOne({ where: { inviteCode } });
    
    if (!targetServer) return res.status(404).json({ message: 'Geçersiz davet kodu' });

    const existingMember = await ServerMember.findOne({
      where: { userId: req.user.id, serverId: targetServer.id }
    });

    if (existingMember) return res.status(400).json({ message: 'Zaten bu sunucudasınız' });

    await ServerMember.create({
      userId: req.user.id,
      serverId: targetServer.id,
      role: 'member'
    });

    res.json(targetServer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucuya katılınamadı' });
  }
});

module.exports = router;
