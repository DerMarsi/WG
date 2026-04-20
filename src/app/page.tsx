"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, USERS } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    totalHouseExpense: 0,
    perPersonShare: 0,
    userBalance: 0,
    debts: [],
    recentTransactions: []
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all receipts and items
        const { data: receipts, error: rError } = await supabase
          .from('receipts')
          .select('*, receipt_items(*)');

        if (rError) throw rError;

        // 2. Calculate Shared Expenses
        let totalShared = 0;
        const userPaidMap: Record<string, number> = {};
        
        // Initialize user paid map
        USERS.forEach(u => userPaidMap[u.id] = 0);

        receipts.forEach(receipt => {
          const buyerId = receipt.uploaded_by;
          receipt.receipt_items.forEach((item: any) => {
            if (item.is_shared) {
              totalShared += Number(item.price);
              userPaidMap[buyerId] += Number(item.price);
            }
          });
        });

        const perPersonShare = totalShared / USERS.length;
        const userBalance = userPaidMap[user.id] - perPersonShare;

        // 3. Calculate all user balances (debts)
        const debts = USERS.map(u => ({
          name: u.name,
          balance: userPaidMap[u.id] - perPersonShare,
          emoji: u.emoji
        })).sort((a, b) => a.balance - b.balance);

        // 4. Format recent transactions
        const recent = receipts
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
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="container flex-center" style={{ height: '80vh' }}><div className="loading-spinner"></div></div>;

  const isAdmin = user.role === 'admin';

  return (
    <div className="container">
      <header className="flex-center mb-4" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: 0 }}>WG Kasa</h1>
          <p className="text-muted">Hoş geldin, {user.emoji} {user.name}</p>
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
        <div className="grid-cols-2 mt-4">
          <div className="glass-panel">
            <h2 className="heading-2">Evin Durum Özeti (Yönetici)</h2>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Toplam Ortak Harcama</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.totalHouseExpense.toFixed(2)} €</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Kişi Başı Düşen Pay</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{data.perPersonShare.toFixed(2)} €</span>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Güncel Bakiyeler</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.debts.map((debt: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                      <span>{debt.emoji} {debt.name}</span>
                      <span style={{ fontWeight: 600, color: debt.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {debt.balance >= 0 ? '+' : ''} {debt.balance.toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <h2 className="heading-2">Son Alışverişler</h2>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: i !== data.recentTransactions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{tx.store}</div>
                      <div className="text-muted">{tx.date} • {tx.buyer} ödedi</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{tx.amount.toFixed(2)} €</div>
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
              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Tüm ortak harcamalar üzerinden hesaplanmıştır.
              </div>
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
