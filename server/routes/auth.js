const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_nova_key_for_dev';

// Register
router.post('/register', async (req, res) => {
  try {
    const username = req.body.username.toLowerCase();
    const { password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      username,
      password: hashedPassword
    });
    
    // Create token
    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: { id: newUser.id, username: newUser.username }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası. Veritabanı problemi olabilir.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const username = req.body.username.toLowerCase();
    const { password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Geçersiz şifre.' });
    }

    // Create token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası. Veritabanı problemi olabilir.' });
  }
});

module.exports = router;
