const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_nova_key_for_dev';
const FRONTEND_URL = (process.env.VITE_BACKEND_URL || 'http://localhost:5173').replace(/\/+$/, ''); // Just for fallback URL

// Configure Nodemailer
const createTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};
const transporter = createTransporter();

// Register
router.post('/register', async (req, res) => {
  try {
    const username = req.body.username.toLowerCase();
    const email = req.body.email.toLowerCase();
    const { password, fullName } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış.' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const verificationToken = uuidv4();

    // Create user
    const newUser = await User.create({
      username,
      email,
      fullName,
      password: hashedPassword,
      verificationToken
    });
    
    // Verification URL
    // Point this to backend directly for simple GET request verification
    const verificationUrl = `${(process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/auth/verify/${verificationToken}`;

    // Send Email (Asynchronously to prevent blocking)
    if (transporter) {
      transporter.sendMail({
        from: `"Nova Chat" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Nova Chat - Hesabınızı Doğrulayın",
        html: `
          <h2>Nova Chat'e Hoş Geldin, ${fullName}!</h2>
          <p>Hesabını doğrulamak için aşağıdaki bağlantıya tıkla:</p>
          <a href="${verificationUrl}" style="background-color: #5865F2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Hesabımı Doğrula</a>
          <p>Eğer bu hesabı sen oluşturmadıysan bu mesajı dikkate alma.</p>
        `
      }).catch(mailErr => {
        console.error("Mail gönderme hatası:", mailErr);
      });
    } else {
      console.log(`[E-Posta Servisi Kapalı] Doğrulama Linki: ${verificationUrl}`);
    }
    
    res.status(201).json({
      message: 'Kayıt başarılı! Lütfen e-posta adresinize gönderilen linke tıklayarak hesabınızı doğrulayın.',
      requiresVerification: true
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

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Lütfen hesabınıza giriş yapmadan önce e-posta adresinizi doğrulayın.' });
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

// Verify Email Endpoint
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({ where: { verificationToken: token } });
    
    if (!user) {
      return res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h2>Doğrulama Başarısız ❌</h2>
          <p>Geçersiz veya süresi dolmuş doğrulama bağlantısı.</p>
        </div>
      `);
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 50px; background-color: #1e1e2e; color: white; padding: 40px; border-radius: 10px; max-width: 500px; margin-left: auto; margin-right: auto;">
        <h2 style="color: #4ade80;">Hesap Doğrulandı! ✅</h2>
        <p>E-posta adresiniz başarıyla onaylandı.</p>
        <p>Artık Nova Chat uygulamasına geri dönüp giriş yapabilirsiniz.</p>
      </div>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
