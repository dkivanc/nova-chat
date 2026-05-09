const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Yetkisiz erişim' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_nova_key_for_dev');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Geçersiz token' });
  }
};

// Belirli bir kanalın mesajlarını getir
router.get('/:channelId', authMiddleware, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { serverId } = req.query; // query'den alalım

    const whereClause = { channelId };
    if (serverId) whereClause.serverId = serverId;

    const messages = await Message.findAll({
      where: whereClause,
      order: [['createdAt', 'ASC']],
      limit: 100 // son 100 mesajı getir
    });
    
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Mesajlar getirilemedi' });
  }
});

module.exports = router;
