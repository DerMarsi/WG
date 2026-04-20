"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseReceiptImage } from '@/actions/parseReceipt';
import { saveReceiptToDb } from '@/actions/saveReceipt';
import { useAuth } from '@/lib/AuthContext';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      const base64Data = base64String.split(',')[1];
      
      setLoading(true);
      setError('');
      setResult(null);

      try {
        const response = await parseReceiptImage(base64Data, file.type);
        if (response.success) {
          setResult(response.data);
        } else {
          setError(response.error || "Fiş okunamadı.");
        }
      } catch (err: any) {
        setError(err.message || "Sistemsel bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!result || !user) return;
    
    setSaving(true);
    setError('');

    try {
      const response = await saveReceiptToDb(result, user.id);
      if (response.success) {
        router.push('/');
      } else {
        setError(response.error || "Kaydedilemedi.");
      }
    } catch (err: any) {
      setError(err.message || "Kaydetme sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <header className="flex-center mb-4" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: 0 }}>Fiş Yükle</h1>
          <p className="text-muted">Yapay zeka ile otomatik fiş analizi</p>
        </div>
        <Link href="/" className="btn-secondary">
          Geri Dön
        </Link>
      </header>

      <div className="glass-panel mt-4" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <input 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }} 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        {loading ? (
          <div style={{ padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🧠</div>
            <h2 className="heading-2 text-accent">Yapay Zeka Fişi Okuyor...</h2>
            <p className="text-muted">Lütfen bekleyin, Almanca ürünler kategorize ediliyor...</p>
            <style>{`@keyframes pulse { 0% { opacity: 0.5; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.5; transform: scale(0.95); } }`}</style>
          </div>
        ) : result ? (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="heading-2 text-success">Fiş Başarıyla Okundu! 🎉</h2>
              <button onClick={() => setResult(null)} className="btn-secondary">Yeni Yükle</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div className="text-muted text-sm">Market</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{result.store}</div>
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div className="text-muted text-sm">Tarih</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{result.date}</div>
              </div>
            </div>

            <h3 className="heading-2 mb-4">Ürünler</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.items.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-hover)', borderRadius: '4px' }}>{item.category}</span>
                      {!item.isShared && <span className="text-warning">⚠️ Kişisel olabilir</span>}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {item.price} €
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent)', borderRadius: '12px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Toplam Tutar</span>
              <span className="text-accent" style={{ fontSize: '2rem', fontWeight: 700 }}>{result.totalAmount} €</span>
            </div>

            {error && (
              <div style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={handleSave} 
                className="btn-primary" 
                style={{ flex: 1, padding: '1rem' }}
                disabled={saving}
              >
                {saving ? 'Kaydediliyor...' : 'Tabloya Kaydet (Onayla)'}
              </button>
              <button onClick={() => setResult(null)} className="btn-secondary" disabled={saving}>İptal</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
            <h2 className="heading-2">Fiş Fotoğrafı Çek veya Yükle</h2>
            <p className="text-muted mb-4">
              Market fişinin tamamı net okunacak şekilde bir fotoğrafını çekin.<br/>
              Yapay zeka ürünleri, fiyatları ve kategorileri otomatik olarak ayıracaktır.
            </p>
            
            {error && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px' }}>
                Hata: {error}
              </div>
            )}
            
            <div className="flex-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => fileInputRef.current?.click()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Dosya Seç
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
