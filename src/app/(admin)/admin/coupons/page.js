'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminCouponsPage() {
  const { logout } = useStore();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formFields, setFormFields] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    expiry_date: '',
    usage_limit: '500',
    active: true,
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (!res.ok) {
        throw new Error('Failed to fetch coupons dataset.');
      }
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormFields((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const openCreateForm = () => {
    setIsEditing(false);
    setFormFields({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Default 30 days out
      usage_limit: '500',
      active: true,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (coupon) => {
    setIsEditing(true);
    // Format date for datetime-local input
    const formattedExpiry = new Date(coupon.expiry_date).toISOString().slice(0, 16);
    
    setFormFields({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      expiry_date: formattedExpiry,
      usage_limit: coupon.usage_limit.toString(),
      active: !!coupon.active,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/coupons', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formFields),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Promo code "${formFields.code}" successfully saved.`);
        setIsFormOpen(false);
        fetchCoupons();
      } else {
        setError(data.error || 'Failed to save coupon.');
      }
    } catch (err) {
      console.error(err);
      setError('Network request error.');
    }
  };

  const handleDelete = async (code) => {
    if (!confirm(`Delete promo code "${code}"? This will terminate any active discounts for this code.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/coupons?code=${code}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess(`Promo code "${code}" deleted from database.`);
        fetchCoupons();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete coupon.');
      }
    } catch (err) {
      console.error(err);
      setError('Network request error.');
    }
  };

  return (
    <div style={dashboardLayoutStyle} className="admin-page-root animate-fade-in">
      {/* Sidebar */}
      <AdminSidebar active="coupons" />

      {/* Main Panel */}
      <main style={mainPanelStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Coupons Manager</h1>
            <p style={subtitleStyle}>Configure active promotional campaigns, flat discounts, and limits.</p>
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
                + Create Coupon
              </button>
            )}
          </div>
        </header>

        {success && <div style={successBannerStyle}>{success}</div>}
        {error && <div style={errorBannerStyle}>{error}</div>}

        {/* Form Container */}
        {isFormOpen && (
          <section style={formContainerStyle} className="animate-fade-in">
            <div style={formHeaderRowStyle}>
              <h2 style={formTitleStyle}>
                {isEditing ? `Edit Coupon: ${formFields.code}` : 'Create Discount Campaign'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} style={closeFormBtnStyle}>
                ✕ Close Form
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={formStyle}>
              {/* Row 1: Code & Type */}
              <div style={formRowStyle}>
                <div style={{ ...formGroupStyle, flex: 1.2 }}>
                  <label style={labelStyle}>Promo Code (Uppercase)</label>
                  <input
                    type="text"
                    name="code"
                    value={formFields.code}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                    placeholder="WELCOME10"
                    disabled={isEditing} // Prevent changing primary key code during edit
                  />
                </div>
                <div style={{ ...formGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Discount Structure</label>
                  <select
                    name="discount_type"
                    value={formFields.discount_type}
                    onChange={handleInputChange}
                    style={selectStyle}
                    required
                  >
                    <option value="percentage">Percentage (e.g. 20%)</option>
                    <option value="flat">Flat Amount (e.g. ₹1000)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Value & Limit */}
              <div style={formRowStyle}>
                <div style={{ ...formGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Discount Value</label>
                  <input
                    type="number"
                    name="discount_value"
                    value={formFields.discount_value}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                    placeholder={formFields.discount_type === 'percentage' ? '20' : '1000'}
                  />
                </div>
                <div style={{ ...formGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Total Usage Limit</label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={formFields.usage_limit}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                    placeholder="500"
                  />
                </div>
              </div>

              {/* Row 3: Expiry & Active */}
              <div style={formRowStyle}>
                <div style={{ ...formGroupStyle, flex: 1.2 }}>
                  <label style={labelStyle}>Campaign Expiry Date</label>
                  <input
                    type="datetime-local"
                    name="expiry_date"
                    value={formFields.expiry_date}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                  />
                </div>
                
                <div style={{ ...checkboxGroupStyle, flex: 1, alignSelf: 'flex-end', paddingBottom: '0.8rem' }}>
                  <input
                    type="checkbox"
                    name="active"
                    id="active"
                    checked={formFields.active}
                    onChange={handleInputChange}
                    style={checkboxStyle}
                  />
                  <label htmlFor="active" style={checkboxLabelStyle}>
                    Campaign Active and Redeemable
                  </label>
                </div>
              </div>

              <div style={formDividerLineStyle}></div>

              <button type="submit" style={saveFormBtnStyle}>
                {isEditing ? 'Save Coupon Rules' : 'Publish Discount Coupon'}
              </button>
            </form>
          </section>
        )}

        {/* Coupons List Table */}
        {loading ? (
          <div>Loading coupons dataset...</div>
        ) : (
          <div style={tableCardStyle}>
            <table style={catalogTableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Promo Code</th>
                  <th style={thStyle}>Discount</th>
                  <th style={thStyle} className="hide-on-mobile">Expiry Date</th>
                  <th style={thStyle} className="hide-on-mobile">Usages (Times used / Limit)</th>
                  <th style={thStyle} className="hide-on-mobile">Campaign Status</th>
                  <th style={{ ...thStyle, width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const hasExpired = new Date(c.expiry_date) < new Date();
                  const limitReached = c.times_used >= c.usage_limit;
                  const isActive = c.active && !hasExpired && !limitReached;

                  return (
                    <tr key={c.code} style={trStyle}>
                      <td style={{ ...tdStyle, fontWeight: '700', letterSpacing: '0.05em' }}>
                        {c.code}
                      </td>
                      <td style={tdStyle}>
                        {c.discount_type === 'percentage'
                          ? `${parseFloat(c.discount_value)}% Off`
                          : `₹${parseFloat(c.discount_value).toLocaleString('en-IN')} Off`}
                      </td>
                      <td style={tdStyle} className="hide-on-mobile">
                        {new Date(c.expiry_date).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {hasExpired && <span style={expiredLabelStyle}> (Expired)</span>}
                      </td>
                      <td style={tdStyle} className="hide-on-mobile">
                        {c.times_used} / {c.usage_limit}
                        {limitReached && <span style={expiredLabelStyle}> (Maxed)</span>}
                      </td>
                      <td style={tdStyle} className="hide-on-mobile">
                        {isActive ? (
                          <span style={statusBadgeActiveStyle}>Redeemable</span>
                        ) : (
                          <span style={statusBadgeSoldOutStyle}>Inactive</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={actionsGroupStyle}>
                          <button onClick={() => openEditForm(c)} style={editActionBtnStyle}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(c.code)} style={deleteActionBtnStyle}>
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

// Sidebar layout styles (shared across admin files)
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

// Table Styles
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

const expiredLabelStyle = {
  color: '#000000',
  fontWeight: '700',
  fontSize: '0.75rem',
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
