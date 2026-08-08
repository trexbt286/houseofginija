'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminNewArrivalsPage() {
  const { logout } = useStore();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [newArrivalsEnabled, setNewArrivalsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local editing states per product ID
  const [localEdits, setLocalEdits] = useState({});

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch products & collections
      const prodRes = await fetch('/api/admin/products');
      if (!prodRes.ok) throw new Error('Failed to fetch catalog.');
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);
      setCollections(prodData.collections || []);

      // Initialize local edits
      const edits = {};
      (prodData.products || []).forEach(p => {
        edits[p.id] = {
          new_arrival: !!p.new_arrival,
          saving: false,
          error: '',
          success: ''
        };
      });
      setLocalEdits(edits);

      // 2. Fetch global settings
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setNewArrivalsEnabled(settingsData.settings?.new_arrivals_enabled === 'true');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching new arrivals data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      fetchData();
    };
    init();
  }, []);

  const handleGlobalToggle = async () => {
    setSavingSettings(true);
    setError('');
    setSuccess('');
    const newValue = !newArrivalsEnabled;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            new_arrivals_enabled: newValue ? 'true' : 'false'
          }
        })
      });
      if (res.ok) {
        setNewArrivalsEnabled(newValue);
        setSuccess(`Fresh Collection section globally ${newValue ? 'ENABLED' : 'DISABLED'}.`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save global setting.');
      }
    } catch (err) {
      console.error(err);
      setError('Network request error.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLocalChange = (productId, field, value) => {
    setLocalEdits(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
        error: '', // clear error on edit
        success: ''
      }
    }));
  };

  const handleSaveProduct = async (product) => {
    const edit = localEdits[product.id];
    if (!edit) return;

    const isNewArrival = edit.new_arrival;

    // Set saving state
    setLocalEdits(prev => ({
      ...prev,
      [product.id]: { ...prev[product.id], saving: true, error: '', success: '' }
    }));

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          new_arrival: isNewArrival
        })
      });

      const data = await res.json();
      if (res.ok) {
        setLocalEdits(prev => ({
          ...prev,
          [product.id]: { 
            ...prev[product.id], 
            saving: false, 
            success: 'Saved!' 
          }
        }));
        // Update local products state
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === product.id ? data.product : p)
        );
      } else {
        setLocalEdits(prev => ({
          ...prev,
          [product.id]: { 
            ...prev[product.id], 
            saving: false, 
            error: data.error || 'Failed to save product.' 
          }
        }));
      }
    } catch (err) {
      console.error(err);
      setLocalEdits(prev => ({
        ...prev,
        [product.id]: { ...prev[product.id], saving: false, error: 'Network error.' }
      }));
    }
  };

  return (
    <div style={layoutStyle} className="admin-page-root animate-fade-in">
      <AdminSidebar active="new-arrivals" />

      <main style={mainContentStyle}>
        {/* Header bar */}
        <header style={headerBarStyle}>
          <div>
            <h1 style={pageTitleStyle}>Fresh Collection Manager</h1>
            <p style={pageSubStyle}>Tag and manage fresh collection highlights</p>
          </div>
          <button onClick={logout} style={logoutBtnStyle}>
            Sign Out
          </button>
        </header>

        {/* Alerts */}
        {error && <div style={errorBannerStyle}>{error}</div>}
        {success && <div style={successBannerStyle}>{success}</div>}

        {/* Global settings panel */}
        <section style={sectionCardStyle}>
          <div style={globalRowStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Global Configuration</h2>
              <p style={sectionSubStyle}>Enable or disable the fresh collection section on the homepage.</p>
            </div>
            <div>
              <button 
                onClick={handleGlobalToggle}
                disabled={savingSettings}
                style={{
                  ...actionBtnStyle,
                  backgroundColor: newArrivalsEnabled ? '#B65C73' : '#3C303A',
                  color: '#FFFFFF'
                }}
              >
                {savingSettings ? 'Saving...' : (newArrivalsEnabled ? 'DISABLE FRESH COLLECTION' : 'ENABLE FRESH COLLECTION')}
              </button>
            </div>
          </div>
        </section>

        {/* Products list panel */}
        <section style={sectionCardStyle}>
          <h2 style={sectionTitleStyle}>Manage Fresh Collection</h2>
          <p style={sectionSubStyle}>Select which products are tagged under &quot;Fresh Collection&quot; on the homepage.</p>

          {loading ? (
            <div style={loadingStyle}>Accessing catalog...</div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Product</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Original Price</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>New Arrival Status</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const edit = localEdits[product.id] || {
                      new_arrival: false,
                      saving: false,
                      error: '',
                      success: ''
                    };

                    return (
                      <tr key={product.id} style={trStyle}>
                        <td style={tdStyle}>
                          <div style={productInfoStyle}>
                            <img 
                              src={product.images?.[0] || '/icon.png'} 
                              alt={product.name} 
                              style={productImgStyle} 
                              loading="lazy"
                            />
                            <span style={productNameStyle}>{product.name}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>{product.collection_name || 'Unassigned'}</td>
                        <td style={{ ...tdStyle, fontWeight: '600' }}>₹{parseFloat(product.price).toLocaleString('en-IN')}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <input 
                            type="checkbox"
                            checked={edit.new_arrival}
                            onChange={(e) => handleLocalChange(product.id, 'new_arrival', e.target.checked)}
                            style={checkboxStyle}
                          />
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => handleSaveProduct(product)}
                            disabled={edit.saving}
                            style={saveBtnStyle}
                          >
                            {edit.saving ? 'Saving...' : 'Save'}
                          </button>
                          {edit.error && <div style={rowErrorStyle}>{edit.error}</div>}
                          {edit.success && <div style={rowSuccessStyle}>{edit.success}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Styling consistent with admin dashboard & flash sale page
const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#FBF0EC',
};

const mainContentStyle = {
  flex: 1,
  padding: '2.5rem',
  overflowY: 'auto',
};

const headerBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  borderBottom: '1px solid rgba(139, 119, 137, 0.1)',
  paddingBottom: '1.5rem',
};

const pageTitleStyle = {
  fontSize: '1.75rem',
  fontWeight: '700',
  color: '#3C303A',
  margin: 0,
};

const pageSubStyle = {
  fontSize: '0.875rem',
  color: 'rgba(60, 48, 58, 0.6)',
  margin: '0.25rem 0 0 0',
};

const logoutBtnStyle = {
  backgroundColor: '#FFFFFF',
  color: '#3C303A',
  border: '1px solid rgba(139, 119, 137, 0.2)',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: '600',
};

const errorBannerStyle = {
  backgroundColor: '#FEE2E2',
  color: '#991B1B',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  marginBottom: '1.5rem',
  fontSize: '0.875rem',
  border: '1px solid #FCA5A5',
};

const successBannerStyle = {
  backgroundColor: '#DCFCE7',
  color: '#166534',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  marginBottom: '1.5rem',
  fontSize: '0.875rem',
  border: '1px solid #86EFAC',
};

const sectionCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(60, 48, 58, 0.03)',
  padding: '1.75rem',
  marginBottom: '2rem',
  border: '1px solid rgba(139, 119, 137, 0.08)',
};

const sectionTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: '700',
  color: '#3C303A',
  margin: 0,
};

const sectionSubStyle = {
  fontSize: '0.85rem',
  color: 'rgba(60, 48, 58, 0.5)',
  margin: '0.25rem 0 1.25rem 0',
  lineHeight: 1.4,
};

const globalRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
};

const actionBtnStyle = {
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '4px',
  fontWeight: '700',
  fontSize: '0.8rem',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  transition: 'all 0.2s',
  outline: 'none',
};

const loadingStyle = {
  padding: '3rem',
  textAlign: 'center',
  color: 'rgba(60, 48, 58, 0.6)',
  fontSize: '0.9rem',
};

const tableWrapperStyle = {
  overflowX: 'auto',
  margin: '0 -1.75rem',
  padding: '0 1.75rem',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const thStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.75rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(60, 48, 58, 0.5)',
  borderBottom: '2px solid rgba(139, 119, 137, 0.1)',
};

const trStyle = {
  borderBottom: '1px solid rgba(139, 119, 137, 0.06)',
};

const tdStyle = {
  padding: '1rem',
  fontSize: '0.875rem',
  color: '#3C303A',
};

const productInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const productImgStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '4px',
  objectFit: 'cover',
  backgroundColor: '#F5ECE9',
};

const productNameStyle = {
  fontWeight: '600',
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
  accentColor: '#B65C73',
};

const saveBtnStyle = {
  backgroundColor: '#3C303A',
  color: '#FFFFFF',
  border: 'none',
  padding: '0.4rem 1rem',
  borderRadius: '4px',
  fontWeight: '600',
  fontSize: '0.75rem',
  cursor: 'pointer',
};

const rowErrorStyle = {
  color: '#DC2626',
  fontSize: '0.7rem',
  marginTop: '0.25rem',
};

const rowSuccessStyle = {
  color: '#16A34A',
  fontSize: '0.7rem',
  marginTop: '0.25rem',
  fontWeight: '600',
};
