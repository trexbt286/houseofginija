'use client';

import { useStore } from '@/context/StoreContext';
import AdminSidebar from '@/components/AdminSidebar';
import Link from 'next/link';

export default function AdminCategoriesPage() {
  const { logout } = useStore();

  return (
    <div style={pageWrapStyle}>
      <AdminSidebar />

      <main style={mainStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Category Management</h1>
          <p style={subtitleStyle}>Category thumbnails are automatically generated from product catalog images.</p>
        </div>

        <div style={cardStyle}>
          <div style={iconWrapStyle}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D98E9B" strokeWidth="1.8">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#3D2B35', fontSize: '1.1rem' }}>Automatic Category Thumbnails</h3>
          <p style={{ margin: '0 0 1.2rem', color: '#666', fontSize: '0.88rem', lineHeight: 1.5, textAlign: 'center', maxWidth: '480px' }}>
            Category thumbnail images on the storefront update dynamically by pulling primary images directly from your active products in each category. Manual uploads are no longer needed.
          </p>
          <Link href="/admin/products" style={btnStyle}>
            Manage Catalog Products →
          </Link>
        </div>
      </main>
    </div>
  );
}

const pageWrapStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#FDF6F7',
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
};

const mainStyle = {
  flex: 1,
  padding: '2.5rem 2rem',
  maxWidth: '900px',
};

const headerStyle = {
  marginBottom: '2rem',
};

const titleStyle = {
  fontSize: '1.6rem',
  fontWeight: '700',
  color: '#3D2B35',
  margin: '0 0 0.4rem',
};

const subtitleStyle = {
  fontSize: '0.85rem',
  color: '#8B7789',
  margin: 0,
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '3rem 2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0 4px 20px rgba(118, 65, 79, 0.06)',
  border: '1px solid #F4E1E5',
};

const iconWrapStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#FDF6F7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1rem',
};

const btnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.4rem',
  borderRadius: '50px',
  backgroundColor: '#D98E9B',
  color: '#FFFFFF',
  fontWeight: '600',
  fontSize: '0.88rem',
  textDecoration: 'none',
  boxShadow: '0 4px 12px rgba(217, 142, 155, 0.3)',
};
