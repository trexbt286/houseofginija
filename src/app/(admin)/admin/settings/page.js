'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useStore } from '@/context/StoreContext';

export default function AdminSettingsPage() {
  const { setJewelleryEnabled } = useStore();
  const [jewelleryActive, setJewelleryActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings?t=' + Date.now(), { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) {
          const isEnabled = data.settings.jewellery_enabled !== 'false';
          setJewelleryActive(isEnabled);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch settings error:', err);
        setLoading(false);
      });
  }, []);

  const handleToggleJewellery = async () => {
    const newValue = !jewelleryActive;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            jewellery_enabled: newValue ? 'true' : 'false',
          },
        }),
      });

      if (res.ok) {
        setJewelleryActive(newValue);
        setJewelleryEnabled(newValue);
        if (typeof window !== 'undefined') {
          localStorage.setItem('houseofginija_jewellery_enabled', newValue ? 'true' : 'false');
          window.dispatchEvent(new Event('storage'));
        }
        setMessage(`Jewellery Section successfully ${newValue ? 'ENABLED' : 'DISABLED'}`);
      } else {
        setMessage('Failed to update setting. Please try again.');
      }
    } catch (err) {
      console.error('Save setting error:', err);
      setMessage('Network error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8F6F7' }}>
      <AdminSidebar active="settings" />

      <main style={{ flex: 1, padding: '2.5rem 3rem', maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#2D2429', fontWeight: '500', marginBottom: '0.4rem' }}>
            Store Settings
          </h1>
          <p style={{ color: 'rgba(0, 0, 0, 0.55)', fontSize: '0.9rem' }}>
            Manage site-wide feature toggles, collection visibility, and storefront sections.
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div style={{
            padding: '0.9rem 1.2rem',
            borderRadius: '6px',
            backgroundColor: message.includes('successfully') ? '#E8F5E9' : '#FFEBEE',
            color: message.includes('successfully') ? '#2E7D32' : '#C62828',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
          }}>
            {message}
          </div>
        )}

        {/* Settings Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(139, 119, 137, 0.12)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#2D2429', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Collection Visibility Controls
          </h2>

          {loading ? (
            <p style={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.9rem' }}>Loading settings...</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 0', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#2D2429', margin: '0 0 0.3rem 0' }}>
                  Jewellery Section
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.5)', margin: 0, maxWidth: '480px' }}>
                  When turned OFF, hides Jewellery across the navigation menu, category circles, sticky nav, collection grids, and redirects the `/jewellery` page.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleJewellery}
                disabled={saving}
                style={{
                  width: '56px',
                  height: '30px',
                  borderRadius: '15px',
                  backgroundColor: jewelleryActive ? '#B97285' : '#D1C4C7',
                  border: 'none',
                  position: 'relative',
                  cursor: saving ? 'wait' : 'pointer',
                  transition: 'background-color 0.3s ease',
                  padding: '3px',
                  outline: 'none',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                    top: '3px',
                    left: jewelleryActive ? '29px' : '3px',
                    transition: 'left 0.3s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
