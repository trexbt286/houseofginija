'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import AdminSidebar from '@/components/AdminSidebar';

const ALL_CATEGORIES = [
  { name: 'New Collection',  slug: 'new-collection'  },
  { name: 'Flash Sale',      slug: 'flash-sale'      },
  { name: 'Unstitched Suits',slug: 'suits'           },
  { name: 'Indo-Western',    slug: 'indo-western'    },
  { name: 'Shararas',        slug: 'shararas'        },
  { name: 'Gowns',           slug: 'gowns'           },
  { name: 'Co-ords',         slug: 'co-ords'         },
  { name: 'Earrings',        slug: 'earrings'        },
  { name: 'Rings',           slug: 'rings'           },
  { name: 'Necklace',        slug: 'necklace'        },
  { name: 'Bracelet',        slug: 'bracelet'        },
];

export default function AdminCategoriesPage() {
  const { logout } = useStore();
  const [categoryImages, setCategoryImages] = useState({});
  const [uploading, setUploading] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load current category images from settings
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.settings) {
          const imgs = {};
          Object.entries(data.settings).forEach(([key, value]) => {
            if (key.startsWith('category_img_') && value) {
              const slug = key.replace('category_img_', '');
              imgs[slug] = value;
            }
          });
          setCategoryImages(imgs);
        }
      })
      .catch(() => {});
  }, []);

  /**
   * Resize and compress an image File to a small base64 JPEG using canvas.
   * Output is always ≤ ~80 KB, well within Next.js JSON body limits.
   */
  const compressImage = (file, maxDim = 400, quality = 0.75) =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
      img.src = objectUrl;
    });

  const handleImageUpload = async (slug, file) => {
    if (!file) return;

    setUploading((prev) => ({ ...prev, [slug]: true }));
    setError('');
    setSuccess('');

    try {
      let imageUrl = '';

      // 1. Upload to backend upload API endpoint
      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json().catch(() => ({}));
        if (uploadRes.ok && uploadData.url) {
          imageUrl = uploadData.url;
        }
      } catch (err) {
        console.warn('Backend upload endpoint error, using compressed image fallback:', err);
      }

      // Fallback to client-side compressed JPEG if backend upload URL not generated
      if (!imageUrl) {
        imageUrl = await compressImage(file);
      }

      // 2. Save image URL centrally to server settings & database
      const settingsRes = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { [`category_img_${slug}`]: imageUrl } }),
      });

      const settingsData = await settingsRes.json().catch(() => ({}));
      if (!settingsRes.ok || !settingsData.success) {
        throw new Error(settingsData.error || 'Failed to save setting on server');
      }

      setCategoryImages((prev) => ({ ...prev, [slug]: imageUrl }));
      setSuccess(`Thumbnail updated for "${ALL_CATEGORIES.find(c => c.slug === slug)?.name}". It will appear for all users across all devices immediately.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update category image.');
    } finally {
      setUploading((prev) => ({ ...prev, [slug]: false }));
    }
  };


  return (
    <div style={pageWrapStyle}>
      <AdminSidebar onLogout={logout} />

      <main style={mainStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Category Thumbnails</h1>
          <p style={subtitleStyle}>Upload or replace the circular thumbnail image for each category. Changes appear on the homepage immediately.</p>
        </div>

        {error && <div style={errorBannerStyle}>{error}</div>}
        {success && <div style={successBannerStyle}>{success}</div>}

        <div style={gridStyle}>
          {ALL_CATEGORIES.map((cat) => {
            const currentImage = categoryImages[cat.slug];
            const isUploading = uploading[cat.slug];

            return (
              <div key={cat.slug} style={cardStyle}>
                {/* Circular preview */}
                <div style={circlePreviewStyle}>
                  {currentImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentImage}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    <div style={placeholderStyle}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D98E9B" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span style={{ fontSize: '0.62rem', color: '#B97285', marginTop: '0.3rem', fontWeight: '600' }}>No image</span>
                    </div>
                  )}
                </div>

                {/* Category name */}
                <p style={catNameStyle}>{cat.name}</p>

                {/* Upload button */}
                <label style={{ cursor: 'pointer', display: 'block', width: '100%' }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(cat.slug, file);
                      e.target.value = '';
                    }}
                  />
                  <span style={{
                    ...uploadBtnStyle,
                    opacity: isUploading ? 0.6 : 1,
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                  }}>
                    {isUploading ? 'Uploading…' : currentImage ? '↑ Replace Image' : '↑ Upload Image'}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageWrapStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#FDF6F7',
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
};

const mainStyle = {
  flex: 1,
  padding: '2rem 1.5rem',
  maxWidth: '1100px',
};

const headerStyle = {
  marginBottom: '1.5rem',
};

const titleStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#3D2B35',
  margin: '0 0 0.4rem',
};

const subtitleStyle = {
  fontSize: '0.82rem',
  color: '#8B7789',
  margin: 0,
};

const errorBannerStyle = {
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  backgroundColor: '#FDECEA',
  color: '#C0392B',
  fontSize: '0.82rem',
  marginBottom: '1rem',
  border: '1px solid #F5C6CB',
};

const successBannerStyle = {
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  backgroundColor: '#EAF7F0',
  color: '#1D7044',
  fontSize: '0.82rem',
  marginBottom: '1rem',
  border: '1px solid #B2DFDB',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: '1.25rem',
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '1.2rem 0.9rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.6rem',
  boxShadow: '0 2px 10px rgba(118, 65, 79, 0.08)',
  border: '1px solid #F4E1E5',
};

const circlePreviewStyle = {
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  overflow: 'hidden',
  border: '2px solid #F4E1E5',
  backgroundColor: '#FDF6F7',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const placeholderStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const catNameStyle = {
  fontSize: '0.82rem',
  fontWeight: '700',
  color: '#3D2B35',
  margin: 0,
  textAlign: 'center',
  lineHeight: 1.3,
};

const uploadBtnStyle = {
  display: 'block',
  textAlign: 'center',
  backgroundColor: '#D98E9B',
  color: '#FFFFFF',
  fontSize: '0.72rem',
  fontWeight: '700',
  letterSpacing: '0.04em',
  padding: '0.45rem 0.6rem',
  borderRadius: '6px',
  border: 'none',
  width: '100%',
  transition: 'background 0.2s',
};
