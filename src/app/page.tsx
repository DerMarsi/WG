"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  if (!user) return null; // Wait for redirect to login

  const isAdmin = user.role === 'admin';

  return (
    <div className="container">
      <header className="flex-center mb-4" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: 0 }}>WG Kasa</h1>
          <p className="text-muted">Hoş geldin, {user.name} {isAdmin ? '👑' : '👤'}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/upload" className="btn-primary">
            + Fiş Yükle
          </Link>
          <button onClick={logout} className="btn-secondary">
            Çıkış Yap
          </button>
        </div>
      </header>

      {isAdmin ? (
        // ================= ADMIN DASHBOARD =================
        <div className="grid-cols-2 mt-4">
          {/* Balance Card */}
          <div className="glass-panel">
            <h2 className="heading-2">Evin Durum Özeti (Yönetici Görünümü)</h2>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Toplam Ev Harcaması (Bu Ay)</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>245.50 €</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Kişi Başı Düşen (Ortalama)</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>49.10 €</span>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Kimlerin Borcu Var?</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Adil Abi</span> <span>- 20.00 €</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Emre Abi</span> <span>- 15.00 €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions Card */}
          <div className="glass-panel">
            <h2 className="heading-2">Son Alışverişler</h2>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { store: 'Aldi', date: 'Bugün', amount: '45.20', buyer: 'Sen' },
                { store: 'Lidl', date: 'Dün', amount: '12.50', buyer: 'Yusuf Abi' },
                { store: 'Edeka', date: '3 gün önce', amount: '34.90', buyer: 'Emre Abi' }
              ].map((tx, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: i !== 2 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{tx.store}</div>
                    <div className="text-muted">{tx.date} • {tx.buyer} ödedi</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{tx.amount} €</div>
                </div>
              ))}
            </div>
            <button className="btn-secondary mt-4" style={{ width: '100%' }}>Tüm Fişleri Gör</button>
          </div>
        </div>
      ) : (
        // ================= MEMBER DASHBOARD =================
        <div className="flex-center" style={{ marginTop: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
            <h2 className="heading-2 mb-4">Kişisel Durumun</h2>
            
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="text-muted" style={{ marginBottom: '0.5rem' }}>Güncel Bakiye (Eve Olan Borcun)</div>
              <div className="text-danger" style={{ fontSize: '2.5rem', fontWeight: 700 }}>- 15.00 €</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Ortak harcamalar ve özel ürünlerin hesaplanmıştır.
              </div>
            </div>
            
            <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>
              * Tüm evin detaylı analizini sadece yöneticiler (Ebubekir & Yusuf) görebilir.
            </div>
            
            <Link href="/upload" className="btn-primary" style={{ display: 'inline-block', width: '100%', padding: '1rem' }}>
              + Yeni Market Fişi Yükle
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
