'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminFlashSalePage() {
  const { logout } = useStore();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [flashSaleEnabled, setFlashSaleEnabled] = useState(false);
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
          flash_sale: !!p.flash_sale,
          flash_sale_price: p.flash_sale_price !== null ? p.flash_sale_price.toString() : '',
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
        setFlashSaleEnabled(settingsData.settings?.flash_sale_enabled === 'true');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching flash sale data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGlobalToggle = async () => {
    setSavingSettings(true);
    setError('');
    setSuccess('');
    const newValue = !flashSaleEnabled;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            flash_sale_enabled: newValue ? 'true' : 'false'
          }
        })
      });
      if (res.ok) {
        setFlashSaleEnabled(newValue);
        setSuccess(`Flash sale section globally ${newValue ? 'ENABLED' : 'DISABLED'}.`);
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

    // Local validation before sending API call
    const isFlashSale = edit.flash_sale;
    let priceNum = null;

    if (isFlashSale) {
      if (edit.flash_sale_price === '') {
        setLocalEdits(prev => ({
          ...prev,
          [product.id]: { ...prev[product.id], error: 'Flash sale price is required.' }
        }));
        return;
      }
      priceNum = parseFloat(edit.flash_sale_price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setLocalEdits(prev => ({
          ...prev,
          [product.id]: { ...prev[product.id], error: 'Flash sale price must be a valid positive number.' }
        }));
        return;
      }
      if (priceNum >= parseFloat(product.price)) {
        setLocalEdits(prev => ({
          ...prev,
          [product.id]: { ...prev[product.id], error: 'Flash sale price must be less than original price.' }
        }));
        return;
      }
    }

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
          flash_sale: isFlashSale,
          flash_sale_price: isFlashSale ? priceNum : null
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

  const calculateDiscount = (original, discountVal) => {
    const orig = parseFloat(original);
    const disc = parseFloat(discountVal);
    if (isNaN(orig) || isNaN(disc) || orig <= 0 || disc <= 0 || disc >= orig) return null;
    const pct = Math.round(((orig - disc) / orig) * 100);
    return `-${pct}%`;
  };

  return (
    <div style={layoutStyle} className="admin-page-root animate-fade-in">
      <AdminSidebar active="flash-sale" />

      <main style={mainContentStyle}>
        {/* Header bar */}
        <header style={headerBarStyle}>
          <div>
            <h1 style={pageTitleStyle}>Flash Sale Manager</h1>
            <p style={pageSubStyle}>Promotions, discounts, and section management</p>
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
              <p style={sectionSubStyle}>Enable or disable the flash sale section on the homepage.</p>
            </div>
            <div>
              <button 
                onClick={handleGlobalToggle}
                disabled={savingSettings}
                style={{
                  ...actionBtnStyle,
                  backgroundColor: flashSaleEnabled ? '#B65C73' : '#3C303A',
                  color: '#FFFFFF'
                }}
              >
                {savingSettings ? 'Saving...' : (flashSaleEnabled ? 'DISABLE FLASH SALE' : 'ENABLE FLASH SALE')}
              </button>
            </div>
          </div>
        </section>

        {/* Products list panel */}
        <section style={sectionCardStyle}>
          <h2 style={sectionTitleStyle}>Manage Flash Sale Products</h2>
          <p style={sectionSubStyle}>Assign products to the flash sale and set their discounted prices.</p>

          {loading ? (
            <div style={loadingStyle}>Accessing catalog...</div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Product</th>
                    <th style={thStyle} className="hide-on-mobile">Category</th>
                    <th style={thStyle} className="hide-on-mobile">Original Price</th>
                    <th style={thStyle} className="hide-on-mobile">Flash Sale Active</th>
                    <th style={thStyle}>Flash Sale Price (₹)</th>
                    <th style={thStyle} className="hide-on-mobile">Calculated Discount</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const edit = localEdits[product.id] || {
                      flash_sale: false,
                      flash_sale_price: '',
                      saving: false,
                      error: '',
                      success: ''
                    };
                    const discountBadge = edit.flash_sale && edit.flash_sale_price
                      ? calculateDiscount(product.price, edit.flash_sale_price)
                      : null;

                    return (
                      <tr key={product.id} style={trStyle}>
                        <td style={tdStyle}>
                          <div style={productInfoStyle}>
                            <img 
                              src={product.images?.[0] || '/icon.png'} 
                              alt={product.name} 
                              style={productImgStyle} 
                            />
                            <span style={productNameStyle}>{product.name}</span>
                          </div>
                        </td>
                        <td style={tdStyle} className="hide-on-mobile">{product.collection_name || 'Unassigned'}</td>
                        <td style={{ ...tdStyle, fontWeight: '600' }} className="hide-on-mobile">₹{parseFloat(product.price).toLocaleString('en-IN')}</td>
                        <td style={tdStyle} className="hide-on-mobile">
                          <input 
                            type="checkbox"
                            checked={edit.flash_sale}
                            onChange={(e) => handleLocalChange(product.id, 'flash_sale', e.target.checked)}
                            style={checkboxStyle}
                          />
                        </td>
                        <td style={tdStyle}>
                          <input 
                            type="number"
                            placeholder="Discount price"
                            value={edit.flash_sale_price}
                            onChange={(e) => handleLocalChange(product.id, 'flash_sale_price', e.target.value)}
                            disabled={!edit.flash_sale}
                            style={{
                              ...priceInputStyle,
                              borderColor: edit.error ? '#FF0000' : 'rgba(139, 119, 137, 0.2)'
                            }}
                          />
                        </td>
                        <td style={tdStyle} className="hide-on-mobile">
                          {discountBadge ? (
                            <span style={badgeStyle}>{discountBadge}</span>
                          ) : (
                            <span style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '0.8rem' }}>—</span>
                          )}
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

// Styles consistent with coupons page theme
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
  borderBottom: '1px solid rgba(139, 119, 137, 0.12)',
  paddingBottom: '1rem',
};

const pageTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '2rem',
  color: '#000000',
  fontWeight: '400',
};

const pageSubStyle = {
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.5)',
  marginTop: '0.2rem',
};

const logoutBtnStyle = {
  backgroundColor: 'transparent',
  border: '1px solid rgba(74, 52, 57, 0.2)',
  padding: '0.5rem 1.2rem',
  borderRadius: '30px',
  fontSize: '0.8rem',
  fontWeight: '600',
  color: '#000000',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const sectionCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '2rem',
  boxShadow: '0 4px 20px rgba(74, 52, 57, 0.03)',
  border: '1px solid rgba(139, 119, 137, 0.08)',
  marginBottom: '2rem',
};

const globalRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const sectionTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '600',
  color: '#000000',
  marginBottom: '0.4rem',
  fontFamily: 'var(--font-serif)',
};

const sectionSubStyle = {
  fontSize: '0.8rem',
  color: 'rgba(0, 0, 0, 0.45)',
  marginBottom: '1.5rem',
};

const actionBtnStyle = {
  padding: '0.75rem 1.5rem',
  borderRadius: '30px',
  fontSize: '0.8rem',
  fontWeight: '700',
  letterSpacing: '0.08em',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const errorBannerStyle = {
  backgroundColor: '#FDF2F2',
  color: '#000000',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  border: '1px solid #F8B4B4',
  fontSize: '0.85rem',
  fontWeight: '600',
};

const successBannerStyle = {
  backgroundColor: '#F3FAF7',
  color: '#000000',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  border: '1px solid #DEF7EC',
  fontSize: '0.85rem',
  fontWeight: '600',
};

const loadingStyle = {
  textAlign: 'center',
  padding: '3rem',
  color: 'rgba(0, 0, 0, 0.5)',
  fontSize: '0.9rem',
};

const tableWrapperStyle = {
  overflowX: 'auto',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle = {
  textAlign: 'left',
  padding: '1rem 0.75rem',
  borderBottom: '2px solid rgba(139, 119, 137, 0.1)',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'rgba(0, 0, 0, 0.5)',
  fontWeight: '700',
};

const trStyle = {
  borderBottom: '1px solid rgba(139, 119, 137, 0.05)',
  transition: 'background-color 0.2s ease',
};

const tdStyle = {
  padding: '1rem 0.75rem',
  fontSize: '0.85rem',
  color: '#000000',
  verticalAlign: 'middle',
};

const productInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const productImgStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '6px',
  objectFit: 'cover',
  backgroundColor: '#F6DDE2',
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

const priceInputStyle = {
  width: '120px',
  padding: '0.4rem 0.6rem',
  borderRadius: '6px',
  border: '1px solid',
  outline: 'none',
  fontSize: '0.85rem',
};

const badgeStyle = {
  backgroundColor: '#F6DDE2',
  color: '#B65C73',
  padding: '0.2rem 0.5rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: '700',
};

const saveBtnStyle = {
  backgroundColor: '#C16C7D',
  color: '#FFFFFF',
  border: 'none',
  padding: '0.4rem 1rem',
  borderRadius: '20px',
  fontSize: '0.78rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const rowErrorStyle = {
  color: '#FF0000',
  fontSize: '0.7rem',
  marginTop: '0.3rem',
  fontWeight: '600',
};

const rowSuccessStyle = {
  color: '#22C55E',
  fontSize: '0.7rem',
  marginTop: '0.3rem',
  fontWeight: '600',
};
