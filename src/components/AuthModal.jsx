import React, { useState } from 'react';
import './AuthModal.css';

const AuthModal = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Bir hata oluştu');
      }

      // Save token
      localStorage.setItem('nova_token', data.token);
      localStorage.setItem('nova_user', JSON.stringify(data.user));
      
      onLoginSuccess(data.user);
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

        <form onSubmit={handleSubmit} className="auth-form">
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
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
