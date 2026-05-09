import React from 'react';
import { PlusCircle, Compass } from 'lucide-react';

const WelcomeHome = ({ onCreateServer, onJoinServer }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-dark)'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--text-primary)' }}>Nova Chat'e Hoş Geldin!</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>
        Nova Chat'te iletişim sunucular üzerinden ilerler. Arkadaşlarınla konuşmak için yeni bir sunucu oluşturabilir veya mevcut bir sunucuya katılabilirsin.
      </p>
      
      <div style={{ display: 'flex', gap: '24px' }}>
        <button 
          onClick={onCreateServer}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            backgroundColor: 'var(--bg-light)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            width: '240px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <PlusCircle size={32} />
          </div>
          <h3 style={{ fontSize: '18px' }}>Sunucu Oluştur</h3>
        </button>

        <button 
          onClick={onJoinServer}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            backgroundColor: 'var(--bg-light)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            width: '240px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--success)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Compass size={32} />
          </div>
          <h3 style={{ fontSize: '18px' }}>Sunucuya Katıl</h3>
        </button>
      </div>
    </div>
  );
};

export default WelcomeHome;
