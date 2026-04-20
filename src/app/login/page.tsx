"use client";

import { useState } from "react";
import { USERS, useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError("Lütfen isminizi seçin.");
      return;
    }
    
    // Attempt login
    const success = login(selectedUser, pin);
    if (!success) {
      setError("Hatalı PIN kodu! (İpucu: Şimdilik test için herkesin PIN kodu: 1234)");
    }
  };

  return (
    <div className="container flex-center" style={{ minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 className="heading-1" style={{ fontSize: '2rem' }}>WG Kasa</h1>
        <p className="text-muted mb-4">Lütfen giriş yapın</p>
        
        {error && (
          <div className="mb-4" style={{ color: 'var(--danger)', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>İsminizi Seçin</label>
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem'
              }}
            >
              <option value="" disabled>-- Seçiniz --</option>
              {USERS.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.role === 'admin' ? '👑' : '👤'}
                </option>
              ))}
            </select>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>PIN Kodu</label>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="****"
              maxLength={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem',
                letterSpacing: '0.5rem',
                textAlign: 'center'
              }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            Giriş Yap
          </button>
        </form>
        
        <p className="text-muted mt-4" style={{ fontSize: '0.8rem' }}>
          * Sistemin güvenliği için lütfen kendi hesabınızla giriş yapınız.
        </p>
      </div>
    </div>
  );
}
