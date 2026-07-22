'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import AdminSidebar from '@/components/AdminSidebar';

function AdminProductsContent() {
  const { logout } = useStore();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null means creating
  const [formFields, setFormFields] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    collection_id: '',
    is_out_of_stock: false,
  });

  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);

  // Temp states for adding single variant
  const [tempVariant, setTempVariant] = useState({
    size: 'S',
    color: 'Default',
    stock: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const sizesOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
  const colorsOptions = [
    'Champagne Pink',
    'Deep Plum',
    'Blush Cream',
    'Midnight Plum',
    '#000000 #000000',
    'Warm Ivory',
    'Rose Mauve',
    'Rose Pink',
    'Mulberry',
    'Rose Pink Foil',
    'Dusty Mauve',
  ];

  const fetchProductsAndCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      if (!res.ok) {
        throw new Error('Failed to fetch catalog.');
      }
      const data = await res.json();
      setProducts(data.products || []);
      setCollections(data.collections || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching catalog details.');
    } finally {
      setLoading(false);
    }
  };

  const searchParams = useSearchParams();
  const editIdParam = searchParams.get('edit');

  useEffect(() => {
    fetchProductsAndCollections();
  }, []);

  useEffect(() => {
    if (editIdParam && products.length > 0) {
      const prodToEdit = products.find(p => p.id.toString() === editIdParam || p.slug === editIdParam);
      if (prodToEdit) {
        openEditForm(prodToEdit);
      }
    }
  }, [editIdParam, products]);

  const handleTextChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Auto-generate slug from name if creating
    if (name === 'name' && !editingId) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormFields((prev) => ({
        ...prev,
        name: value,
        slug: generatedSlug,
      }));
    } else {
      setFormFields((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  // Client-side image compression
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name || 'image.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Cloudinary image upload handler
  const handleImageUpload = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setImageError('');

    try {
      file = await compressImage(file);
    } catch (err) {
      console.error('Compression error:', err);
      // Fallback to original file if compression fails
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setImages((prev) => [...prev, data.url]);
      } else {
        setImageError(data.error || 'Failed to upload image.');
      }
    } catch (err) {
      console.error(err);
      setImageError('Network upload failure.');
    } finally {
      setUploadingImage(false);
      // Clear file input
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Variant management
  const addVariant = () => {
    const stockNum = parseInt(tempVariant.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      alert('Stock count must be a non-negative number.');
      return;
    }

    // Check if variant combination already exists
    const duplicate = variants.find(
      (v) => v.size === tempVariant.size
    );

    if (duplicate) {
      alert('This variant size already exists in the list.');
      return;
    }

    setVariants((prev) => [
      ...prev,
      {
        size: tempVariant.size,
        color: 'Default',
        stock: stockNum,
      },
    ]);
  };

  const removeVariant = (idxToRemove) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const syncStandardSizes = () => {
    const standardSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const defaultColor = 'Default';
    const defaultStock = 0;

    const existingSizes = new Set(variants.map(v => v.size));
    const newVariants = [...variants];

    standardSizes.forEach(size => {
      if (!existingSizes.has(size)) {
        newVariants.push({
          size: size,
          color: defaultColor,
          stock: defaultStock
        });
      }
    });

    setVariants(newVariants);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormFields({
      name: '',
      slug: '',
      description: '',
      price: '',
      collection_id: '',
      is_out_of_stock: false,
    });
    setImages([]);
    setVariants([]);
    setIsFormOpen(true);
  };

  const openEditForm = (product) => {
    setEditingId(product.id);
    setFormFields({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price.toString(),
      collection_id: product.collection_id ? product.collection_id.toString() : '',
      is_out_of_stock: !!product.is_out_of_stock,
    });
    setImages(product.images || []);
    setVariants(product.variants || []);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (images.length === 0) {
      setError('Please upload at least one image.');
      return;
    }

    if (variants.length === 0) {
      setError('Please define at least one sizing variant with stock.');
      return;
    }

    const payload = {
      ...formFields,
      images,
      variants,
    };

    if (editingId) {
      payload.id = editingId;
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Product "${formFields.name}" successfully saved.`);
        setIsFormOpen(false);
        fetchProductsAndCollections();
      } else {
        setError(data.error || 'Failed to save product.');
      }
    } catch (err) {
      console.error(err);
      setError('Network request error.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete creation "${name}"? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess(`Product "${name}" deleted from catalog.`);
        fetchProductsAndCollections();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
      setError('Network request error.');
    }
  };

  return (
    <div style={dashboardLayoutStyle} className="admin-page-root animate-fade-in">
      {/* Sidebar */}
      <AdminSidebar active="products" />

      {/* Main Panel */}
      <main style={mainPanelStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Products Manager</h1>
            <p style={subtitleStyle}>Create, edit, upload, and configure products catalog.</p>
          </div>
          <div style={headerRightActionsStyle}>
            <Link href="/" style={headerVisitStoreBtnStyle}>
              Visit Storefront
            </Link>
            <button onClick={logout} style={headerLogoutBtnStyle}>
              Sign Out
            </button>
            {!isFormOpen && (
              <button onClick={openCreateForm} style={createBtnStyle}>
                + Add Creation
              </button>
            )}
          </div>
        </header>

        {success && <div style={successBannerStyle}>{success}</div>}
        {error && <div style={errorBannerStyle}>{error}</div>}

        {/* CRUD FORM PANEL */}
        {isFormOpen && (
          <section style={formContainerStyle} className="animate-fade-in">
            <div style={formHeaderRowStyle}>
              <h2 style={formTitleStyle}>
                {editingId ? `Edit: ${formFields.name}` : 'Create New Creation'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} style={closeFormBtnStyle}>
                ✕ Close Form
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} style={formStyle}>
              {/* Row 1: Name & Slug */}
              <div style={formRowStyle}>
                <div style={{ ...formGroupStyle, flex: 1.2 }}>
                  <label style={labelStyle}>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formFields.name}
                    onChange={handleTextChange}
                    style={inputStyle}
                    required
                    placeholder="Mulberry Archival Gown"
                  />
                </div>
                <div style={{ ...formGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>URL Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={formFields.slug}
                    onChange={handleTextChange}
                    style={inputStyle}
                    required
                    placeholder="mulberry-archival-gown"
                  />
                </div>
              </div>

              {/* Row 2: Price & Collection */}
              <div style={formRowStyle}>
                <div style={{ ...formGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Retail Price (₹ INR)</label>
                  <input
                    type="number"
                    name="price"
                    value={formFields.price}
                    onChange={handleTextChange}
                    style={inputStyle}
                    required
                    placeholder="35000"
                  />
                </div>
                <div style={{ ...formGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Collection Folder</label>
                  <select
                    name="collection_id"
                    value={formFields.collection_id}
                    onChange={handleTextChange}
                    style={selectStyle}
                    required
                  >
                    <option value="">-- Select Collection --</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Description */}
              <div style={formGroupStyle}>
                <label style={labelStyle}>Couture Story (Description)</label>
                <textarea
                  name="description"
                  value={formFields.description}
                  onChange={handleTextChange}
                  style={textareaStyle}
                  rows="4"
                  placeholder="Detailed description, textile origin, fit, tailoring instructions..."
                ></textarea>
              </div>

              {/* Row 4: Toggles */}
              <div style={formRowStyle}>

                <div style={checkboxGroupStyle}>
                  <input
                    type="checkbox"
                    name="is_out_of_stock"
                    id="is_out_of_stock"
                    checked={formFields.is_out_of_stock}
                    onChange={handleTextChange}
                    style={checkboxStyle}
                  />
                  <label htmlFor="is_out_of_stock" style={checkboxLabelStyle}>
                    Manual Out of Stock Override (Force pull item temporarily)
                  </label>
                </div>
              </div>

              <div style={formDividerLineStyle}></div>

              {/* Cloudinary Image Gallery Manager */}
              <div style={formGroupStyle}>
                <h3 style={subFormTitleStyle}>Cloudinary Media Gallery ({images.length})</h3>
                <div style={imageUploadRowStyle}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={fileInputStyle}
                    id="img-upload-input"
                  />
                  <label htmlFor="img-upload-input" style={uploadBtnLabelStyle}>
                    {uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Image File'}
                  </label>
                  {imageError && <span style={imageErrorStyle}>{imageError}</span>}
                </div>

                {images.length > 0 && (
                  <div style={imageThumbGridStyle}>
                    {images.map((img, idx) => (
                      <div key={idx} style={formThumbContainerStyle}>
                        <img src={img} alt="Uploaded thumbnail" style={formThumbStyle} loading="lazy" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          style={removeThumbBtnStyle}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={formDividerLineStyle}></div>

              {/* Variants Stock Manager */}
              <div style={formGroupStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <h3 style={{ ...subFormTitleStyle, margin: 0 }}>Sizing & Color Variants Stock List ({variants.length})</h3>
                  <button 
                    type="button" 
                    onClick={syncStandardSizes} 
                    style={syncSizesBtnStyle}
                  >
                    ⚡ Sync Standard Sizes (S-XXL, 10 Stock)
                  </button>
                </div>
                
                {/* Add Variant Form */}
                <div style={addVariantRowStyle}>
                  <div style={miniFormGroupStyle}>
                    <label style={miniLabelStyle}>Size</label>
                    <select
                      value={tempVariant.size}
                      onChange={(e) => setTempVariant({ ...tempVariant, size: e.target.value })}
                      style={miniSelectStyle}
                    >
                      {sizesOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>



                  <div style={miniFormGroupStyle}>
                    <label style={miniLabelStyle}>Stock Count</label>
                    <input
                      type="number"
                      value={tempVariant.stock}
                      onChange={(e) => setTempVariant({ ...tempVariant, stock: e.target.value })}
                      style={miniInputStyle}
                    />
                  </div>

                  <button type="button" onClick={addVariant} style={addVariantBtnStyle}>
                    Add Variant
                  </button>
                </div>

                {/* Variants List Table */}
                {variants.length > 0 ? (
                  <div style={variantsTableContainerStyle}>
                    <table style={variantsTableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Size</th>
                          <th style={thStyle}>Stock</th>
                          <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, idx) => (
                          <tr key={idx} style={trStyle}>
                            <td style={tdStyle}>{v.size}</td>
                            <td style={tdStyle}>{v.stock}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => removeVariant(idx)}
                                style={removeVarBtnStyle}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={noVariantsTextStyle}>No sizing variants defined yet. Items must possess at least one size variant.</p>
                )}
              </div>

              <div style={formDividerLineStyle}></div>

              <button type="submit" style={saveFormBtnStyle}>
                {editingId ? 'Save Configuration Changes' : 'Create Product Catalog Item'}
              </button>
            </form>
          </section>
        )}

        {/* PRODUCTS LIST TABLE */}
        {loading ? (
          <div>Catalog retrieving...</div>
        ) : (
          <div style={tableCardStyle}>
            <table style={catalogTableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Creation Details</th>
                  <th style={thStyle} className="hide-on-mobile">Slug</th>
                  <th style={thStyle} className="hide-on-mobile">Collection</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle} className="hide-on-mobile">Stock (Sum)</th>
                  <th style={thStyle} className="hide-on-mobile">Status</th>
                  <th style={{ ...thStyle, width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const totalStock = (p.variants || []).reduce((sum, v) => sum + v.stock, 0);
                  const isForcedOut = p.is_out_of_stock;
                  return (
                    <tr key={p.id} style={trStyle}>
                      <td style={tdStyle}>
                        <div style={productInfoCellStyle}>
                          <img src={p.images[0]} alt={p.name} style={tableProdImgStyle} loading="lazy" />
                          <div>
                            <strong style={tableProdNameStyle}>
                              {p.name}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#000000' }} className="hide-on-mobile">
                        {p.slug}
                      </td>
                      <td style={tdStyle} className="hide-on-mobile">{p.collection_name}</td>
                      <td style={tdStyle}>₹{parseFloat(p.price).toLocaleString('en-IN')}</td>
                      <td style={tdStyle} className="hide-on-mobile">
                        <span style={totalStock <= 5 ? lowStockHighlightStyle : null}>
                          {totalStock} units
                        </span>
                      </td>
                      <td style={tdStyle} className="hide-on-mobile">
                        {isForcedOut ? (
                          <span style={statusBadgeForcedStyle}>Forced Out</span>
                        ) : totalStock === 0 ? (
                          <span style={statusBadgeSoldOutStyle}>Sold Out</span>
                        ) : (
                          <span style={statusBadgeActiveStyle}>Active</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={actionsGroupStyle}>
                          <button onClick={() => openEditForm(p)} style={editActionBtnStyle}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(p.id, p.name)} style={deleteActionBtnStyle}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

// Reuse styles from dashboard OVERVIEW
const dashboardLayoutStyle = {
  display: 'grid',
  gridTemplateColumns: '260px 1fr',
  minHeight: '100vh',
  backgroundColor: '#FFFFFF',
};

// Sidebar styles removed - managed by AdminSidebar component

const mainPanelStyle = {
  padding: '3rem',
  overflowY: 'auto',
};

const headerRightActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const headerVisitStoreBtnStyle = {
  backgroundColor: 'transparent',
  border: '1px solid #000000',
  color: '#000000',
  padding: '0.5rem 1rem',
  fontSize: '0.8rem',
  fontWeight: '600',
  borderRadius: '4px',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const headerLogoutBtnStyle = {
  backgroundColor: '#000000',
  border: '1px solid #000000',
  color: '#FFFFFF',
  padding: '0.5rem 1rem',
  fontSize: '0.8rem',
  fontWeight: '600',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2.5rem',
  borderBottom: '1px solid rgba(60, 48, 58, 0.08)',
  paddingBottom: '1.5rem',
};

const titleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '2.2rem',
  color: '#D98E9B',
  fontWeight: '500',
};

const subtitleStyle = {
  fontSize: '0.85rem',
  color: '#D98E9B',
};

const createBtnStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.6rem 1.5rem',
  fontSize: '0.8rem',
  fontWeight: '600',
  borderRadius: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const successBannerStyle = {
  backgroundColor: '#FFFFFF',
  color: '#000000',
  padding: '0.8rem 1.2rem',
  borderRadius: '4px',
  fontSize: '0.85rem',
  marginBottom: '1.5rem',
  border: '1px solid #c8e6c9',
};

const errorBannerStyle = {
  backgroundColor: '#FFFFFF',
  color: '#000000',
  padding: '0.8rem 1.2rem',
  borderRadius: '4px',
  fontSize: '0.85rem',
  marginBottom: '1.5rem',
  border: '1px solid #ffcdd2',
};

// Form Container Styles
const formContainerStyle = {
  backgroundColor: '#FFFFFF',
  padding: '2.5rem',
  borderRadius: '8px',
  border: '1px solid rgba(139, 119, 137, 0.15)',
  boxShadow: 'var(--shadow-md)',
  marginBottom: '3rem',
};

const formHeaderRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
};

const formTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.6rem',
  color: '#D98E9B',
  fontWeight: '500',
};

const closeFormBtnStyle = {
  color: '#000000',
  fontSize: '0.85rem',
  fontWeight: '600',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const formRowStyle = {
  display: 'flex',
  gap: '1.5rem',
  width: '100%',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const labelStyle = {
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#000000',
  fontWeight: '700',
};

const inputStyle = {
  padding: '0.75rem',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  borderRadius: '4px',
};

const selectStyle = {
  padding: '0.75rem',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  borderRadius: '4px',
  backgroundColor: '#FFFFFF',
};

const textareaStyle = {
  padding: '0.75rem',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  borderRadius: '4px',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.95rem',
  outline: 'none',
};

const checkboxGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  flex: 1,
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  accentcolor: '#000000',
};

const checkboxLabelStyle = {
  fontSize: '0.82rem',
  color: '#000000',
  fontWeight: '600',
};

const formDividerLineStyle = {
  height: '1px',
  backgroundColor: 'rgba(139, 119, 137, 0.12)',
  margin: '0.5rem 0',
};

// Sub forms
const subFormTitleStyle = {
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#D98E9B',
  fontWeight: '700',
  marginBottom: '0.5rem',
};

const imageUploadRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const fileInputStyle = {
  display: 'none',
};

const uploadBtnLabelStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.6rem 1.2rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const imageErrorStyle = {
  color: '#000000',
  fontSize: '0.8rem',
};

const imageThumbGridStyle = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
  marginTop: '1rem',
};

const formThumbContainerStyle = {
  position: 'relative',
  width: '80px',
  height: '100px',
  borderRadius: '4px',
  overflow: 'hidden',
  border: '1px solid rgba(139, 119, 137, 0.2)',
};

const formThumbStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const removeThumbBtnStyle = {
  position: 'absolute',
  top: '2px',
  right: '2px',
  backgroundColor: 'rgba(60, 48, 58, 0.8)',
  color: '#000000',
  border: 'none',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.65rem',
  fontWeight: 'bold',
  cursor: 'pointer',
};

// Variant styles
const addVariantRowStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-end',
  backgroundColor: '#FFFFFF',
  padding: '1.2rem',
  borderRadius: '6px',
  marginBottom: '1rem',
};

const miniFormGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const miniLabelStyle = {
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  color: '#000000',
  fontWeight: '700',
};

const miniSelectStyle = {
  padding: '0.5rem',
  border: '1px solid rgba(139, 119, 137, 0.2)',
  fontSize: '0.8rem',
  backgroundColor: '#FFFFFF',
  borderRadius: '4px',
};

const miniInputStyle = {
  padding: '0.5rem',
  border: '1px solid rgba(139, 119, 137, 0.2)',
  fontSize: '0.8rem',
  borderRadius: '4px',
  width: '90px',
};

const addVariantBtnStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.58rem 1.2rem',
  fontSize: '0.8rem',
  fontWeight: '600',
  borderRadius: '4px',
};

const variantsTableContainerStyle = {
  border: '1px solid rgba(139, 119, 137, 0.15)',
  borderRadius: '4px',
  overflow: 'hidden',
};

const variantsTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#FFFFFF',
};

const noVariantsTextStyle = {
  fontSize: '0.82rem',
  color: '#000000',
  fontStyle: 'italic',
};

const removeVarBtnStyle = {
  color: '#000000',
  fontSize: '0.75rem',
  textDecoration: 'underline',
};

const saveFormBtnStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '1rem 2rem',
  fontSize: '0.85rem',
  fontWeight: '600',
  borderRadius: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginTop: '1rem',
  boxShadow: 'var(--shadow-sm)',
};

// Catalog Table Styles
const tableCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid rgba(139, 119, 137, 0.12)',
  overflowX: 'auto',
};

const catalogTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const thStyle = {
  backgroundColor: '#FFFFFF',
  color: '#000000',
  padding: '1rem 1.5rem',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: '700',
};

const trStyle = {
  borderBottom: '1px solid rgba(60, 48, 58, 0.08)',
};

const tdStyle = {
  padding: '1.2rem 1.5rem',
  fontSize: '0.88rem',
  color: '#000000',
};

const productInfoCellStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const tableProdImgStyle = {
  width: '45px',
  height: '55px',
  objectFit: 'cover',
  borderRadius: '4px',
  backgroundColor: '#FFFFFF',
};

const tableProdNameStyle = {
  fontSize: '0.92rem',
  fontWeight: '600',
  color: '#000000',
};

const lowStockHighlightStyle = {
  color: '#000000',
  fontWeight: '700',
};

const statusBadgeActiveStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  fontSize: '0.65rem',
  fontWeight: '700',
  padding: '0.2rem 0.5rem',
  borderRadius: '99px',
  textTransform: 'uppercase',
};

const statusBadgeSoldOutStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  fontSize: '0.65rem',
  fontWeight: '700',
  padding: '0.2rem 0.5rem',
  borderRadius: '99px',
  textTransform: 'uppercase',
};

const statusBadgeForcedStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  fontSize: '0.65rem',
  fontWeight: '700',
  padding: '0.2rem 0.5rem',
  borderRadius: '99px',
  textTransform: 'uppercase',
};

const actionsGroupStyle = {
  display: 'flex',
  gap: '0.8rem',
  justifyContent: 'center',
};

const editActionBtnStyle = {
  color: '#000000',
  fontSize: '0.8rem',
  fontWeight: '600',
};

const deleteActionBtnStyle = {
  color: '#000000',
  fontSize: '0.8rem',
  fontWeight: '600',
};

const syncSizesBtnStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D98E9B',
  color: '#D98E9B',
  fontSize: '0.78rem',
  fontWeight: '700',
  padding: '0.35rem 0.75rem',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading catalog manager...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
