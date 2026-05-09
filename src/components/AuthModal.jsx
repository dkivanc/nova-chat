import React, { useState } from 'react';
import './AuthModal.css';

const AuthModal = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? 'login' : 'register';
    
    try {
      const bodyData = isLogin 
        ? { username, password } 
        : { username, email, fullName, password };

      const response = await fetch(`${BACKEND_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Bir hata oluştu');
      }

      if (data.requiresVerification) {
        setSuccessMsg(data.message);
        // Clear form
        setUsername('');
        setEmail('');
        setFullName('');
        setPassword('');
      } else {
        // Save token (Login success)
        localStorage.setItem('nova_token', data.token);
        localStorage.setItem('nova_user', JSON.stringify(data.user));
        
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay glass">
      <div className="auth-modal">
        <h2>{isLogin ? 'Tekrar Hoş Geldin!' : 'Hesap Oluştur'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Sohbete devam etmek için giriş yap' : 'Nova Chat dünyasına katıl'}
        </p>
        
        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success" style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label>İsim Soyisim</label>
                <input 
                  type="text" 
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                />
              </div>
              <div className="form-group">
                <label>E-Posta Adresi</label>
                <input 
                  type="email" 
                  required={!isLogin}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label>Kullanıcı Adı</label>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
            />
          </div>
          <div className="form-group">
            <label>Şifre</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
            />
          </div>
          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? 'Bekleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}>
            {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
