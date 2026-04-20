"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, USERS } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [data, setData] = useState<any>({
    totalHouseExpense: 0,
    perPersonShare: 0,
    userBalance: 0,
    debts: [],
    recentTransactions: []
  });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);
    try {
      const { data: receipts, error: rError } = await supabase
        .from('receipts')
        .select('*, receipt_items(*)');

      if (rError) {
        setFetchError(rError.message);
        throw rError;
      }

      setDebugInfo(`Bulunan Fiş Sayısı: ${receipts?.length || 0}`);

      let totalShared = 0;
      const userPaidMap: Record<string, number> = {};
      USERS.forEach(u => userPaidMap[u.id] = 0);

      if (receipts && receipts.length > 0) {
        receipts.forEach(receipt => {
          const buyerId = receipt.uploaded_by;
          if (receipt.receipt_items) {
            receipt.receipt_items.forEach((item: any) => {
              if (item.is_shared) {
                totalShared += Number(item.price);
                if (userPaidMap[buyerId] !== undefined) {
                  userPaidMap[buyerId] += Number(item.price);
                }
              }
            });
          }
        });
      }

      const perPersonShare = totalShared / USERS.length;
      const userBalance = userPaidMap[user.id] - perPersonShare;

      const debts = USERS.map(u => ({
        name: u.name,
        balance: userPaidMap[u.id] - perPersonShare,
        emoji: u.emoji
      })).sort((a, b) => a.balance - b.balance);

      const recent = (receipts || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(r => ({
          store: r.store,
          date: r.date,
          amount: r.total_amount,
          buyer: USERS.find(u => u.id === r.uploaded_by)?.name || 'Bilinmeyen'
        }));

      setData({
        totalHouseExpense: totalShared,
        perPersonShare,
        userBalance,
        debts,
        recentTransactions: recent
      });
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      setFetchError(err.message || "Veriler çekilemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleClearAll = async () => {
    if (!confirm('TÜM VERİLERİ SIFIRLAMAK istediğine emin misin? Bu işlem geri alınamaz.')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.from('receipts').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Sıfırlama sırasında hata: ' + err.message);
      setLoading(false);
    }
  };

  if (!user) return null;
  const isAdmin = user.role === 'admin';

  return (
    <div className="container">
      <header className="flex-center mb-4" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: 0 }}>WG Kasa</h1>
          <p className="text-muted">Hoş geldin, {user.emoji} {user.name}</p>
          {debugInfo && <p style={{ fontSize: '0.7rem', color: 'gray' }}>{debugInfo}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/upload" className="btn-primary">
            + Fiş Yükle
          </Link>
          <Link href="/history" className="btn-secondary">
            📖 Geçmiş
          </Link>
          <button onClick={logout} className="btn-secondary">
            🚪 Çıkış
          </button>
        </div>
      </header>

      {fetchError && (
        <div className="glass-panel" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', marginBottom: '1rem' }}>
          Hata: {fetchError} <br/>
          <small>İpucu: Supabase'de RLS'yi kapattığınızdan emin olun.</small>
        </div>
      )}

      {loading ? (
        <div className="flex-center" style={{ height: '50vh' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {isAdmin ? (
            <div className="grid-cols-2 mt-4">
              <div className="glass-panel">
                <h2 className="heading-2">Evin Durum Özeti (Yönetici)</h2>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>Toplam Ortak Harcama</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.totalHouseExpense.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>Kişi Başı Düşen Pay</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{data.perPersonShare.toFixed(2)} €</span>
                  </div>
                  
                  <div style={{ marginTop: '1rem', background: 'var(--bg-base)', padding: '1rem', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Güncel Bakiyeler</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {data.debts.map((debt: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{debt.emoji} {debt.name}</span>
                          <span style={{ fontWeight: 600, color: debt.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {debt.balance >= 0 ? '+' : ''} {debt.balance.toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleClearAll} className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', opacity: 0.7, fontSize: '0.8rem', marginTop: '1rem' }}>
                    ⚠️ Tüm Verileri Sıfırla (Yeni Ay)
                  </button>
                </div>
              </div>

              <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 className="heading-2" style={{ margin: 0 }}>Son Alışverişler</h2>
                  <Link href="/history" className="text-accent" style={{ fontSize: '0.9rem' }}>Tümü</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.recentTransactions.length > 0 ? (
                    data.recentTransactions.map((tx: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: i !== data.recentTransactions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{tx.store}</div>
                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>{tx.date} • {tx.buyer}</div>
                        </div>
                        <div style={{ fontWeight: 700 }}>{Number(tx.amount).toFixed(2)} €</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">Henüz fiş yüklenmemiş.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-center" style={{ marginTop: '2rem' }}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                <h2 className="heading-2 mb-4">Kişisel Durumun</h2>
                
                <div style={{ 
                  background: data.userBalance >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                  border: `1px solid ${data.userBalance >= 0 ? 'var(--success)' : 'var(--danger)'}`, 
                  borderRadius: '12px', 
                  padding: '1.5rem', 
                  marginBottom: '1.5rem' 
                }}>
                  <div className="text-muted" style={{ marginBottom: '0.5rem' }}>
                    {data.userBalance >= 0 ? 'Eve Göre Alacaklısın' : 'Eve Olan Borcun'}
                  </div>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 700,
                    color: data.userBalance >= 0 ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {data.userBalance >= 0 ? '+' : ''} {data.userBalance.toFixed(2)} €
                  </div>
                </div>
                
                <Link href="/upload" className="btn-primary" style={{ display: 'inline-block', width: '100%', padding: '1rem', marginBottom: '1rem' }}>
                  + Yeni Market Fişi Yükle
                </Link>
                <Link href="/history" className="btn-secondary" style={{ display: 'inline-block', width: '100%', padding: '1rem' }}>
                  📖 Harcama Geçmişim
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
