'use client';

import { useState, useEffect, useMemo } from 'react';
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

  // Quick Add Widget state
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [selectedQuickProduct, setSelectedQuickProduct] = useState(null);
  const [quickFlashPrice, setQuickFlashPrice] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [quickSuccess, setQuickSuccess] = useState('');

  // Catalog Table Filters & Pagination
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [catalogSaleFilter, setCatalogSaleFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Local editing states per product ID
  const [localEdits, setLocalEdits] = useState({});

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const prodRes = await fetch('/api/admin/products');
      if (!prodRes.ok) throw new Error('Failed to fetch catalog.');
      const prodData = await prodRes.json();
      const loadedProducts = prodData.products || [];
      setProducts(loadedProducts);
      setCollections(prodData.collections || []);

      // Initialize local edits dictionary
      const edits = {};
      loadedProducts.forEach((p) => {
        edits[p.id] = {
          flash_sale: !!p.flash_sale,
          flash_sale_price: p.flash_sale_price !== null && p.flash_sale_price !== undefined ? p.flash_sale_price.toString() : '',
          saving: false,
          error: '',
          success: '',
        };
      });
      setLocalEdits(edits);

      // Fetch global settings
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

  // Global toggle handler
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
            flash_sale_enabled: newValue ? 'true' : 'false',
          },
        }),
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

  // Quick Add preset discount calculator
  const applyPresetDiscount = (pct, targetProduct = selectedQuickProduct) => {
    if (!targetProduct || !targetProduct.price) return;
    const origPrice = parseFloat(targetProduct.price);
    if (isNaN(origPrice) || origPrice <= 0) return;
    const discounted = Math.round(origPrice * (1 - pct / 100));
    setQuickFlashPrice(discounted.toString());
    setQuickError('');
  };

  // Save quick add product
  const handleQuickAdd = async () => {
    if (!selectedQuickProduct) {
      setQuickError('Please select a product first.');
      return;
    }
    const origPrice = parseFloat(selectedQuickProduct.price);
    const flashPriceNum = parseFloat(quickFlashPrice);

    if (!quickFlashPrice || isNaN(flashPriceNum) || flashPriceNum <= 0) {
      setQuickError('Please enter a valid positive flash sale price.');
      return;
    }
    if (flashPriceNum >= origPrice) {
      setQuickError('Flash sale price must be less than original price (₹' + origPrice.toLocaleString('en-IN') + ').');
      return;
    }

    setQuickSaving(true);
    setQuickError('');
    setQuickSuccess('');

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedQuickProduct,
          flash_sale: true,
          flash_sale_price: flashPriceNum,
        }),
      });

      const data = await res.json();
      if (res.ok && data.product) {
        setProducts((prev) => prev.map((p) => (p.id === data.product.id ? data.product : p)));
        setLocalEdits((prev) => ({
          ...prev,
          [data.product.id]: {
            flash_sale: true,
            flash_sale_price: flashPriceNum.toString(),
            saving: false,
            error: '',
            success: 'Added to Flash Sale!',
          },
        }));

        setQuickSuccess(`"${data.product.name}" added to Flash Sale at ₹${flashPriceNum.toLocaleString('en-IN')}!`);
        setSelectedQuickProduct(null);
        setQuickSearchQuery('');
        setQuickFlashPrice('');
      } else {
        setQuickError(data.error || 'Failed to update product.');
      }
    } catch (err) {
      console.error(err);
      setQuickError('Network error while updating product.');
    } finally {
      setQuickSaving(false);
    }
  };

  // Save inline row changes
  const handleLocalChange = (productId, field, value) => {
    setLocalEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
        error: '',
        success: '',
      },
    }));
  };

  const handleSaveProduct = async (product, forceDisable = false) => {
    const edit = localEdits[product.id];
    if (!edit) return;

    const isFlashSale = forceDisable ? false : edit.flash_sale;
    let priceNum = null;

    if (isFlashSale) {
      if (edit.flash_sale_price === '') {
        setLocalEdits((prev) => ({
          ...prev,
          [product.id]: { ...prev[product.id], error: 'Flash sale price is required.' },
        }));
        return;
      }
      priceNum = parseFloat(edit.flash_sale_price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setLocalEdits((prev) => ({
          ...prev,
          [product.id]: { ...prev[product.id], error: 'Flash sale price must be a positive number.' },
        }));
        return;
      }
      if (priceNum >= parseFloat(product.price)) {
        setLocalEdits((prev) => ({
          ...prev,
          [product.id]: { ...prev[product.id], error: 'Price must be lower than original price.' },
        }));
        return;
      }
    }

    setLocalEdits((prev) => ({
      ...prev,
      [product.id]: { ...prev[product.id], saving: true, error: '', success: '' },
    }));

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          flash_sale: isFlashSale,
          flash_sale_price: isFlashSale ? priceNum : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.product) {
        setLocalEdits((prev) => ({
          ...prev,
          [product.id]: {
            flash_sale: isFlashSale,
            flash_sale_price: isFlashSale && priceNum !== null ? priceNum.toString() : '',
            saving: false,
            success: isFlashSale ? 'Saved!' : 'Removed from Flash Sale',
          },
        }));
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.id === product.id ? data.product : p))
        );
      } else {
        setLocalEdits((prev) => ({
          ...prev,
          [product.id]: {
            ...prev[product.id],
            saving: false,
            error: data.error || 'Failed to save product.',
          },
        }));
      }
    } catch (err) {
      console.error(err);
      setLocalEdits((prev) => ({
        ...prev,
        [product.id]: { ...prev[product.id], saving: false, error: 'Network error.' },
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

  // Search filtered products for quick add dropdown
  const quickSearchResults = useMemo(() => {
    if (!quickSearchQuery.trim()) return [];
    const q = quickSearchQuery.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.collection_name && p.collection_name.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [products, quickSearchQuery]);

  // Active Flash Sale products list
  const activeFlashProducts = useMemo(() => {
    return products.filter((p) => {
      const edit = localEdits[p.id];
      return edit ? edit.flash_sale : !!p.flash_sale;
    });
  }, [products, localEdits]);

  // Catalog filtered products list for main table
  const filteredCatalogProducts = useMemo(() => {
    return products.filter((p) => {
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCat = p.collection_name && p.collection_name.toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }
      if (catalogCategory) {
        if (String(p.collection_id) !== String(catalogCategory) && p.collection_slug !== catalogCategory) {
          return false;
        }
      }
      const edit = localEdits[p.id];
      const isFlash = edit ? edit.flash_sale : !!p.flash_sale;
      if (catalogSaleFilter === 'active' && !isFlash) return false;
      if (catalogSaleFilter === 'inactive' && isFlash) return false;

      return true;
    });
  }, [products, catalogSearch, catalogCategory, catalogSaleFilter, localEdits]);

  const totalPages = Math.ceil(filteredCatalogProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedCatalogProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCatalogProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCatalogProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [catalogSearch, catalogCategory, catalogSaleFilter]);

  return (
    <div style={layoutStyle} className="admin-page-root animate-fade-in">
      <AdminSidebar active="flash-sale" />

      <main style={mainContentStyle}>
        <header style={headerBarStyle}>
          <div>
            <h1 style={pageTitleStyle}>Flash Sale Manager</h1>
            <p style={pageSubStyle}>Promotions, discounts, and section management</p>
          </div>
          <button onClick={logout} style={logoutBtnStyle}>
            Sign Out
          </button>
        </header>

        {error && <div style={errorBannerStyle}>{error}</div>}
        {success && <div style={successBannerStyle}>{success}</div>}

        {/* 1. Global Configuration Card */}
        <section style={sectionCardStyle}>
          <div style={globalRowStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Global Configuration</h2>
              <p style={sectionSubStyle}>Enable or disable the flash sale section on the store homepage.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: flashSaleEnabled ? '#15803D' : '#991B1B' }}>
                {flashSaleEnabled ? '● ACTIVE ON HOMEPAGE' : '○ DISABLED ON HOMEPAGE'}
              </span>
              <button
                onClick={handleGlobalToggle}
                disabled={savingSettings}
                style={{
                  ...actionBtnStyle,
                  backgroundColor: flashSaleEnabled ? '#B65C73' : '#3C303A',
                  color: '#FFFFFF',
                }}
              >
                {savingSettings ? 'Saving...' : flashSaleEnabled ? 'DISABLE FLASH SALE' : 'ENABLE FLASH SALE'}
              </button>
            </div>
          </div>
        </section>

        {/* 2. ⚡ Seamless Quick Add Widget */}
        <section style={{ ...sectionCardStyle, border: '2px solid #D98E9B', backgroundColor: '#FFF5F7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ ...sectionTitleStyle, color: '#B65C73', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚡</span> Quick Add Product to Flash Sale
              </h2>
              <p style={sectionSubStyle}>Search any product, pick a discount percentage, and activate instantly.</p>
            </div>
            {selectedQuickProduct && (
              <button
                onClick={() => {
                  setSelectedQuickProduct(null);
                  setQuickSearchQuery('');
                  setQuickFlashPrice('');
                  setQuickError('');
                }}
                style={{ fontSize: '0.75rem', color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear Selection
              </button>
            )}
          </div>

          {quickError && <div style={{ ...errorBannerStyle, marginBottom: '1rem' }}>{quickError}</div>}
          {quickSuccess && <div style={{ ...successBannerStyle, marginBottom: '1rem' }}>{quickSuccess}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }} className="admin-quick-add-grid">
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>1. Select Product</label>
              {!selectedQuickProduct ? (
                <div>
                  <input
                    type="text"
                    placeholder="Type product name (e.g. Rajsi Gulabi, Blush Pink...)"
                    value={quickSearchQuery}
                    onChange={(e) => setQuickSearchQuery(e.target.value)}
                    style={searchInputStyle}
                  />
                  {quickSearchResults.length > 0 && (
                    <div style={dropdownResultsStyle}>
                      {quickSearchResults.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSelectedQuickProduct(prod);
                            setQuickSearchQuery('');
                            applyPresetDiscount(20, prod);
                          }}
                          style={dropdownItemStyle}
                          className="dropdown-item-hover"
                        >
                          <img src={prod.images?.[0] || '/icon.png'} alt={prod.name} style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{prod.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{prod.collection_name || 'Unassigned'} • ₹{parseFloat(prod.price).toLocaleString('en-IN')}</div>
                          </div>
                          {prod.flash_sale && <span style={{ fontSize: '0.7rem', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: 4 }}>Already on Sale</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <img src={selectedQuickProduct.images?.[0] || '/icon.png'} alt={selectedQuickProduct.name} style={{ width: 44, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{selectedQuickProduct.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#555' }}>Original Price: <strong style={{ color: '#000' }}>₹{parseFloat(selectedQuickProduct.price).toLocaleString('en-IN')}</strong></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>2. Set Flash Sale Price</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#666', width: '100%', marginBottom: '2px' }}>Quick Discount Presets:</span>
                {[10, 20, 30, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyPresetDiscount(pct)}
                    disabled={!selectedQuickProduct}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #D98E9B',
                      backgroundColor: '#FFFFFF',
                      color: '#B65C73',
                      fontWeight: '700',
                      fontSize: '0.78rem',
                      cursor: selectedQuickProduct ? 'pointer' : 'not-allowed',
                      opacity: selectedQuickProduct ? 1 : 0.5,
                    }}
                  >
                    {pct}% OFF
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 12, top: 10, color: '#666', fontWeight: '600' }}>₹</span>
                  <input
                    type="number"
                    placeholder="Enter sale price"
                    value={quickFlashPrice}
                    onChange={(e) => setQuickFlashPrice(e.target.value)}
                    disabled={!selectedQuickProduct}
                    style={{ ...searchInputStyle, paddingLeft: '28px', width: '100%' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  disabled={!selectedQuickProduct || quickSaving}
                  style={{
                    ...actionBtnStyle,
                    backgroundColor: selectedQuickProduct ? '#B65C73' : '#A3A3A3',
                    color: '#FFFFFF',
                    padding: '0.7rem 1.4rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {quickSaving ? 'Saving...' : '⚡ ADD TO FLASH SALE'}
                </button>
              </div>

              {selectedQuickProduct && quickFlashPrice && !isNaN(parseFloat(quickFlashPrice)) && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: '#15803D', fontWeight: '600' }}>
                  Preview: ₹{parseFloat(selectedQuickProduct.price).toLocaleString('en-IN')} → ₹{parseFloat(quickFlashPrice).toLocaleString('en-IN')}{' '}
                  <span style={{ backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                    {calculateDiscount(selectedQuickProduct.price, quickFlashPrice)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. 🔥 Currently Active Flash Sale Items */}
        <section style={sectionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={sectionTitleStyle}>Active Flash Sale Products ({activeFlashProducts.length})</h2>
              <p style={sectionSubStyle}>Products currently live in the flash sale section.</p>
            </div>
          </div>

          {activeFlashProducts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FAF5F6', borderRadius: '8px', color: '#666' }}>
              No products are currently in the Flash Sale. Use the Quick Add widget above to add products!
            </div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Product</th>
                    <th style={thStyle} className="hide-on-mobile">Category</th>
                    <th style={thStyle} className="hide-on-mobile">Original Price</th>
                    <th style={thStyle}>Flash Sale Price (₹)</th>
                    <th style={thStyle}>Discount</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeFlashProducts.map((product) => {
                    const edit = localEdits[product.id] || {
                      flash_sale: true,
                      flash_sale_price: product.flash_sale_price ? product.flash_sale_price.toString() : '',
                      saving: false,
                      error: '',
                      success: '',
                    };
                    const discountBadge = edit.flash_sale_price ? calculateDiscount(product.price, edit.flash_sale_price) : null;

                    return (
                      <tr key={'active-' + product.id} style={trStyle}>
                        <td style={tdStyle}>
                          <div style={productInfoStyle}>
                            <img src={product.images?.[0] || '/icon.png'} alt={product.name} style={productImgStyle} loading="lazy" />
                            <span style={productNameStyle}>{product.name}</span>
                          </div>
                        </td>
                        <td style={tdStyle} className="hide-on-mobile">{product.collection_name || 'Unassigned'}</td>
                        <td style={{ ...tdStyle, fontWeight: '600' }} className="hide-on-mobile">₹{parseFloat(product.price).toLocaleString('en-IN')}</td>
                        <td style={tdStyle}>
                          <input
                            type="number"
                            value={edit.flash_sale_price}
                            onChange={(e) => handleLocalChange(product.id, 'flash_sale_price', e.target.value)}
                            style={priceInputStyle}
                          />
                        </td>
                        <td style={tdStyle}>
                          {discountBadge ? <span style={badgeStyle}>{discountBadge}</span> : '—'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleSaveProduct(product, false)}
                              disabled={edit.saving}
                              style={saveBtnStyle}
                            >
                              {edit.saving ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => handleSaveProduct(product, true)}
                              disabled={edit.saving}
                              style={{ ...saveBtnStyle, backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}
                            >
                              Remove
                            </button>
                          </div>
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

        {/* 4. 📦 All Products Catalog (Searchable & Paginated) */}
        <section style={sectionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={sectionTitleStyle}>All Products Catalog</h2>
              <p style={sectionSubStyle}>Search, filter, and manage flash sale status across all catalog items.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search products..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                style={{ ...searchInputStyle, width: '180px' }}
              />
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                style={selectStyle}
              >
                <option value="">All Categories</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={catalogSaleFilter}
                onChange={(e) => setCatalogSaleFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Flash Sale Status</option>
                <option value="active">Active Flash Sale Only</option>
                <option value="inactive">Not On Flash Sale</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={loadingStyle}>Loading catalog products...</div>
          ) : (
            <div>
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Product</th>
                      <th style={thStyle} className="hide-on-mobile">Category</th>
                      <th style={thStyle} className="hide-on-mobile">Original Price</th>
                      <th style={thStyle}>Flash Sale Active</th>
                      <th style={thStyle}>Flash Sale Price (₹)</th>
                      <th style={thStyle} className="hide-on-mobile">Discount</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCatalogProducts.map((product) => {
                      const edit = localEdits[product.id] || {
                        flash_sale: false,
                        flash_sale_price: '',
                        saving: false,
                        error: '',
                        success: '',
                      };
                      const discountBadge = edit.flash_sale && edit.flash_sale_price
                        ? calculateDiscount(product.price, edit.flash_sale_price)
                        : null;

                      return (
                        <tr key={product.id} style={trStyle}>
                          <td style={tdStyle}>
                            <div style={productInfoStyle}>
                              <img src={product.images?.[0] || '/icon.png'} alt={product.name} style={productImgStyle} loading="lazy" />
                              <span style={productNameStyle}>{product.name}</span>
                            </div>
                          </td>
                          <td style={tdStyle} className="hide-on-mobile">{product.collection_name || 'Unassigned'}</td>
                          <td style={{ ...tdStyle, fontWeight: '600' }} className="hide-on-mobile">₹{parseFloat(product.price).toLocaleString('en-IN')}</td>
                          <td style={tdStyle}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={edit.flash_sale}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  handleLocalChange(product.id, 'flash_sale', checked);
                                  if (checked && !edit.flash_sale_price) {
                                    const orig = parseFloat(product.price);
                                    if (!isNaN(orig) && orig > 0) {
                                      handleLocalChange(product.id, 'flash_sale_price', Math.round(orig * 0.8).toString());
                                    }
                                  }
                                }}
                                style={checkboxStyle}
                              />
                              <span style={{ fontSize: '0.8rem', color: edit.flash_sale ? '#B65C73' : '#666', fontWeight: edit.flash_sale ? '700' : '400' }}>
                                {edit.flash_sale ? 'ON SALE' : 'OFF'}
                              </span>
                            </label>
                          </td>
                          <td style={tdStyle}>
                            <input
                              type="number"
                              placeholder="Sale price"
                              value={edit.flash_sale_price}
                              onChange={(e) => handleLocalChange(product.id, 'flash_sale_price', e.target.value)}
                              disabled={!edit.flash_sale}
                              style={{
                                ...priceInputStyle,
                                opacity: edit.flash_sale ? 1 : 0.4,
                                borderColor: edit.error ? '#FF0000' : 'rgba(139, 119, 137, 0.2)',
                              }}
                            />
                          </td>
                          <td style={tdStyle} className="hide-on-mobile">
                            {discountBadge ? <span style={badgeStyle}>{discountBadge}</span> : <span style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '0.8rem' }}>—</span>}
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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  Showing {paginatedCatalogProducts.length} of {filteredCatalogProducts.length} items (Page {currentPage} of {totalPages})
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ ...paginationBtnStyle, opacity: currentPage === 1 ? 0.4 : 1 }}
                  >
                    ‹ Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    style={{ ...paginationBtnStyle, opacity: currentPage >= totalPages ? 0.4 : 1 }}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#FBF0EC',
};

const mainContentStyle = {
  flex: 1,
  padding: '2rem',
  overflowY: 'auto',
};

const headerBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
};

const pageTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.8rem',
  fontWeight: '600',
  color: '#000000',
};

const pageSubStyle = {
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.5)',
  marginTop: '0.2rem',
};

const logoutBtnStyle = {
  backgroundColor: 'transparent',
  border: '1px solid rgba(0, 0, 0, 0.2)',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const errorBannerStyle = {
  backgroundColor: '#FEE2E2',
  color: '#991B1B',
  padding: '0.8rem 1.2rem',
  borderRadius: '6px',
  marginBottom: '1.5rem',
  fontSize: '0.85rem',
  fontWeight: '500',
};

const successBannerStyle = {
  backgroundColor: '#DCFCE7',
  color: '#15803D',
  padding: '0.8rem 1.2rem',
  borderRadius: '6px',
  marginBottom: '1.5rem',
  fontSize: '0.85rem',
  fontWeight: '500',
};

const sectionCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '1.8rem',
  marginBottom: '1.8rem',
  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
};

const globalRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
};

const sectionTitleStyle = {
  fontSize: '1.15rem',
  fontWeight: '700',
  color: '#000000',
  marginBottom: '0.2rem',
};

const sectionSubStyle = {
  fontSize: '0.82rem',
  color: 'rgba(0, 0, 0, 0.5)',
};

const actionBtnStyle = {
  padding: '0.65rem 1.3rem',
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontWeight: '700',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: '700',
  color: '#3C303A',
  marginBottom: '0.4rem',
};

const searchInputStyle = {
  padding: '0.6rem 0.8rem',
  borderRadius: '6px',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle = {
  padding: '0.6rem 0.8rem',
  borderRadius: '6px',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  fontSize: '0.82rem',
  outline: 'none',
  backgroundColor: '#FFFFFF',
};

const dropdownResultsStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  zIndex: 20,
  maxHeight: '260px',
  overflowY: 'auto',
  marginTop: '4px',
};

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  padding: '0.6rem 0.8rem',
  cursor: 'pointer',
  borderBottom: '1px solid #F3F4F6',
};

const tableWrapperStyle = {
  overflowX: 'auto',
  marginTop: '1rem',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const thStyle = {
  padding: '0.8rem 1rem',
  borderBottom: '2px solid #F3F4F6',
  fontSize: '0.78rem',
  fontWeight: '700',
  color: 'rgba(0, 0, 0, 0.6)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const trStyle = {
  borderBottom: '1px solid #F9FAFB',
};

const tdStyle = {
  padding: '0.8rem 1rem',
  fontSize: '0.85rem',
  verticalAlign: 'middle',
};

const productInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
};

const productImgStyle = {
  width: '40px',
  height: '52px',
  objectFit: 'cover',
  borderRadius: '4px',
};

const productNameStyle = {
  fontWeight: '600',
  color: '#000000',
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  accentColor: '#B65C73',
  cursor: 'pointer',
};

const priceInputStyle = {
  width: '110px',
  padding: '0.45rem 0.6rem',
  borderRadius: '4px',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  fontSize: '0.85rem',
  outline: 'none',
};

const badgeStyle = {
  backgroundColor: '#FEE2E2',
  color: '#991B1B',
  padding: '0.25rem 0.6rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: '700',
};

const saveBtnStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  border: 'none',
  padding: '0.45rem 0.9rem',
  borderRadius: '4px',
  fontSize: '0.78rem',
  fontWeight: '700',
  cursor: 'pointer',
};

const paginationBtnStyle = {
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  border: '1px solid rgba(0,0,0,0.15)',
  backgroundColor: '#FFFFFF',
  fontSize: '0.8rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const loadingStyle = {
  padding: '3rem',
  textAlign: 'center',
  color: 'rgba(0, 0, 0, 0.5)',
  fontSize: '0.9rem',
};

const rowErrorStyle = {
  color: '#991B1B',
  fontSize: '0.72rem',
  marginTop: '0.2rem',
};

const rowSuccessStyle = {
  color: '#15803D',
  fontSize: '0.72rem',
  marginTop: '0.2rem',
};
