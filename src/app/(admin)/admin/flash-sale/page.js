'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import AdminSidebar from '@/components/AdminSidebar';
import productsFallback from '@/data/local-products-fallback.json';
import homepageFallback from '@/data/local-homepage-fallback.json';

export default function AdminFlashSalePage() {
  const { logout } = useStore();
  const [products, setProducts] = useState(productsFallback.products || []);
  const [collections, setCollections] = useState(homepageFallback.collections || []);
  const [flashSaleEnabled, setFlashSaleEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Product Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE'); // 'PERCENTAGE' | 'PRICE'
  const [discountValue, setDiscountValue] = useState('20');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit / Save row state
  const [savingId, setSavingId] = useState(null);

  const fetchData = async () => {
    setError('');
    try {
      const prodRes = await fetch('/api/admin/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
        setCollections(prodData.collections || []);
      }

      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setFlashSaleEnabled(settingsData.settings?.flash_sale_enabled === 'true');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading catalog data.');
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
        setSuccess(`Flash Sale section is now ${newValue ? 'ENABLED' : 'DISABLED'} on the store.`);
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

  // Add Product to Flash Sale
  const handleAddProductToFlashSale = async (e) => {
    e.preventDefault();
    setAddError('');

    if (!selectedProductId) {
      setAddError('Please select a product.');
      return;
    }

    const product = products.find(p => p.id.toString() === selectedProductId.toString());
    if (!product) {
      setAddError('Selected product not found.');
      return;
    }

    const origPrice = parseFloat(product.price) || 0;
    let computedPrice = 0;

    if (discountType === 'PERCENTAGE') {
      const pct = parseFloat(discountValue);
      if (isNaN(pct) || pct <= 0 || pct >= 100) {
        setAddError('Discount percentage must be between 1% and 99%.');
        return;
      }
      computedPrice = Math.round(origPrice * (1 - pct / 100));
    } else {
      computedPrice = parseFloat(discountValue);
      if (isNaN(computedPrice) || computedPrice <= 0 || computedPrice >= origPrice) {
        setAddError(`Flash sale price must be greater than ₹0 and less than ₹${origPrice}.`);
        return;
      }
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          flash_sale: true,
          flash_sale_price: computedPrice
        })
      });

      const data = await res.json();
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? data.product : p));
        setSuccess(`"${product.name}" added to Flash Sale at ₹${computedPrice.toLocaleString('en-IN')}!`);
        setIsAddModalOpen(false);
        setSelectedProductId('');
        setDiscountValue('20');
      } else {
        setAddError(data.error || 'Failed to update product.');
      }
    } catch (err) {
      console.error(err);
      setAddError('Network request failed.');
    } finally {
      setIsAdding(false);
    }
  };

  // Remove Product from Flash Sale
  const handleRemoveFromFlashSale = async (product) => {
    setSavingId(product.id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          flash_sale: false,
          flash_sale_price: null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? data.product : p));
        setSuccess(`"${product.name}" removed from Flash Sale.`);
      } else {
        setError(data.error || 'Failed to update product.');
      }
    } catch (err) {
      console.error(err);
      setError('Network request error.');
    } finally {
      setSavingId(null);
    }
  };

  // Quick Update Sale Price for active item
  const handleUpdatePrice = async (product, newPriceStr) => {
    const newPrice = parseFloat(newPriceStr);
    const origPrice = parseFloat(product.price) || 0;
    if (isNaN(newPrice) || newPrice <= 0 || newPrice >= origPrice) {
      setError(`Flash sale price must be greater than ₹0 and less than ₹${origPrice}.`);
      return;
    }

    setSavingId(product.id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          flash_sale: true,
          flash_sale_price: newPrice
        })
      });

      const data = await res.json();
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? data.product : p));
        setSuccess(`Updated Flash Sale price for "${product.name}" to ₹${newPrice.toLocaleString('en-IN')}.`);
      } else {
        setError(data.error || 'Failed to update price.');
      }
    } catch (err) {
      console.error(err);
      setError('Network request error.');
    } finally {
      setSavingId(null);
    }
  };

  const activeFlashProducts = products.filter(p => !!p.flash_sale);
  const eligibleProducts = products.filter(p => !p.flash_sale);

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
              <p style={sectionSubStyle}>Enable or disable the Flash Sale section on the storefront.</p>
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

        {/* ACTIVE FLASH SALE PRODUCTS SECTION */}
        <section style={sectionCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={sectionTitleStyle}>Active Flash Sale Items ({activeFlashProducts.length})</h2>
              <p style={{ ...sectionSubStyle, marginBottom: 0 }}>Products currently featured in the flash sale section.</p>
            </div>
            
            <button
              onClick={() => {
                setIsAddModalOpen(true);
                setAddError('');
                if (eligibleProducts.length > 0) {
                  setSelectedProductId(eligibleProducts[0].id);
                }
              }}
              style={{
                ...actionBtnStyle,
                backgroundColor: '#D98E9B',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(217, 142, 155, 0.3)'
              }}
            >
              + ADD PRODUCT TO FLASH SALE
            </button>
          </div>

          {activeFlashProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(0, 0, 0, 0.45)', backgroundColor: '#FAF5F6', borderRadius: '12px', border: '1px dashed rgba(139, 119, 137, 0.2)' }}>
              <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000' }}>No active flash sale products.</p>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.2rem' }}>Click "+ ADD PRODUCT TO FLASH SALE" to select and discount products.</p>
              <button
                onClick={() => {
                  setIsAddModalOpen(true);
                  if (eligibleProducts.length > 0) setSelectedProductId(eligibleProducts[0].id);
                }}
                style={{ ...actionBtnStyle, backgroundColor: '#D98E9B', color: '#FFF' }}
              >
                + Add First Product
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
              {activeFlashProducts.map(product => {
                const origPrice = parseFloat(product.price) || 0;
                const flashPrice = parseFloat(product.flash_sale_price) || Math.round(origPrice * 0.8);
                const discountText = calculateDiscount(origPrice, flashPrice);

                return (
                  <div key={product.id} style={productCardStyle}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img 
                        src={product.images?.[0] || '/icon.png'} 
                        alt={product.name} 
                        style={{ width: '64px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }} 
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#000', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product.name}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', marginBottom: '0.4rem' }}>
                          {product.collection_name || 'Collection Item'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.4)', textDecoration: 'line-through' }}>
                            ₹{origPrice.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#B65C73' }}>
                            ₹{flashPrice.toLocaleString('en-IN')}
                          </span>
                          {discountText && (
                            <span style={badgeStyle}>{discountText}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(139, 119, 137, 0.1)' }}>
                      <button
                        onClick={() => {
                          const newPrice = prompt(`Enter new Flash Sale Price (₹) for "${product.name}" (Original: ₹${origPrice}):`, flashPrice);
                          if (newPrice !== null && newPrice !== '') {
                            handleUpdatePrice(product, newPrice);
                          }
                        }}
                        disabled={savingId === product.id}
                        style={smallBtnOutlineStyle}
                      >
                        {savingId === product.id ? 'Saving...' : 'Edit Price'}
                      </button>
                      <button
                        onClick={() => handleRemoveFromFlashSale(product)}
                        disabled={savingId === product.id}
                        style={smallBtnDangerStyle}
                      >
                        {savingId === product.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* MODAL: ADD PRODUCT TO FLASH SALE */}
        {isAddModalOpen && (
          <div style={modalOverlayStyle} onClick={() => setIsAddModalOpen(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: '600', color: '#000' }}>
                  Add Product to Flash Sale
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'rgba(0,0,0,0.5)' }}
                >
                  ✕
                </button>
              </div>

              {addError && <div style={{ ...errorBannerStyle, marginBottom: '1rem' }}>{addError}</div>}

              <form onSubmit={handleAddProductToFlashSale}>
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={labelStyle}>Select Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    style={inputSelectStyle}
                    required
                  >
                    {eligibleProducts.length === 0 ? (
                      <option value="">All catalog products are already on flash sale!</option>
                    ) : (
                      eligibleProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₹{parseFloat(p.price).toLocaleString('en-IN')}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={labelStyle}>Set Discount Method</label>
                  <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.8rem' }}>
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENTAGE')}
                      style={{
                        ...toggleBtnStyle,
                        backgroundColor: discountType === 'PERCENTAGE' ? '#D98E9B' : '#F5E6E9',
                        color: discountType === 'PERCENTAGE' ? '#FFFFFF' : '#000000'
                      }}
                    >
                      Discount % Off
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('PRICE')}
                      style={{
                        ...toggleBtnStyle,
                        backgroundColor: discountType === 'PRICE' ? '#D98E9B' : '#F5E6E9',
                        color: discountType === 'PRICE' ? '#FFFFFF' : '#000000'
                      }}
                    >
                      Exact Sale Price (₹)
                    </button>
                  </div>

                  {discountType === 'PERCENTAGE' ? (
                    <div>
                      <input
                        type="number"
                        placeholder="e.g. 20"
                        min="1"
                        max="99"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        style={inputSelectStyle}
                        required
                      />
                      {selectedProductId && (
                        <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', marginTop: '0.4rem' }}>
                          Calculated Sale Price: <strong style={{ color: '#B65C73' }}>₹{
                            Math.round((parseFloat(products.find(p => p.id.toString() === selectedProductId.toString())?.price || 0)) * (1 - (parseFloat(discountValue) || 0) / 100)).toLocaleString('en-IN')
                          }</strong>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="number"
                        placeholder="e.g. 25000"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        style={inputSelectStyle}
                        required
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={smallBtnOutlineStyle}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding || eligibleProducts.length === 0}
                    style={{ ...actionBtnStyle, backgroundColor: '#D98E9B', color: '#FFF' }}
                  >
                    {isAdding ? 'Adding...' : 'Add to Flash Sale'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Styling Constants
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

const productCardStyle = {
  backgroundColor: '#FFF7F8',
  borderRadius: '12px',
  padding: '1rem',
  border: '1px solid #F4E1E5',
  display: 'flex',
  flexDirection: 'column',
  justify: 'space-between',
};

const badgeStyle = {
  backgroundColor: '#FDF2F4',
  color: '#B65C73',
  padding: '0.2rem 0.5rem',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: '700',
  border: '1px solid rgba(182, 92, 115, 0.2)',
};

const smallBtnOutlineStyle = {
  flex: 1,
  padding: '0.45rem 0.8rem',
  borderRadius: '20px',
  border: '1px solid rgba(139, 119, 137, 0.3)',
  backgroundColor: '#FFFFFF',
  color: '#000000',
  fontSize: '0.75rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const smallBtnDangerStyle = {
  flex: 1,
  padding: '0.45rem 0.8rem',
  borderRadius: '20px',
  border: '1px solid #F8B4B4',
  backgroundColor: '#FDF2F2',
  color: '#C81E1E',
  fontSize: '0.75rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 999,
  padding: '1rem',
};

const modalContentStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '2rem',
  width: '100%',
  maxWidth: '480px',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#000000',
  marginBottom: '0.5rem',
};

const inputSelectStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  fontSize: '0.85rem',
  outline: 'none',
  backgroundColor: '#FFFFFF',
};

const toggleBtnStyle = {
  flex: 1,
  padding: '0.5rem 0.8rem',
  borderRadius: '20px',
  border: 'none',
  fontSize: '0.8rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};
