"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, USERS } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { deleteReceiptFromDb } from '@/actions/deleteReceipt';

export default function HistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase.from('receipts').select('*, receipt_items(*)').order('created_at', { ascending: false });
      
      // Members only see their own receipts
      if (user.role !== 'admin') {
        query = query.eq('uploaded_by', user.id);
      }

      const { data, error: rError } = await query;
      if (rError) throw rError;
      setReceipts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu fişi silmek istediğine emin misin?')) return;
    
    const res = await deleteReceiptFromDb(id);
    if (res.success) {
      setReceipts(receipts.filter(r => r.id !== id));
    } else {
      alert('Hata: ' + res.error);
    }
  };

  if (!user) return null;

  return (
    <div className="container">
      <header className="flex-center mb-4" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 className="heading-1">İşlem Geçmişi</h1>
          <p className="text-muted">
            {user.role === 'admin' ? 'Tüm evin harcama dökümü' : 'Kendi harcama dökümün'}
          </p>
        </div>
        <Link href="/" className="btn-secondary">Geri Dön</Link>
      </header>

      {error && <div className="glass-panel text-danger mb-4">{error}</div>}

      {loading ? (
        <div className="flex-center" style={{ height: '50vh' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {receipts.length === 0 ? (
            <div className="glass-panel text-center text-muted">Henüz kayıt bulunamadı.</div>
          ) : (
            receipts.map(receipt => (
              <div key={receipt.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{receipt.store}</span>
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>• {receipt.date}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>
                      {USERS.find(u => u.id === receipt.uploaded_by)?.name} tarafından yüklendi
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {Number(receipt.total_amount).toFixed(2)} €
                    </div>
                    {user.role === 'admin' && (
                      <button 
                        onClick={() => handleDelete(receipt.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem', padding: 0 }}
                      >
                        🗑️ Fişi Sil
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {receipt.receipt_items?.map((item: any) => (
                      <div key={item.id} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-base)', borderRadius: '6px' }}>
                        <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                        <span style={{ fontWeight: 600 }}>{Number(item.price).toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
