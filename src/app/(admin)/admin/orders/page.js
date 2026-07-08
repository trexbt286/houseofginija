'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminOrdersPage() {
  const { logout } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtering & search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (!res.ok) {
        throw new Error('Failed to retrieve orders pipeline.');
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Order #${id} status updated to "${newStatus}".`);
        fetchOrders(); // Refresh table
      } else {
        setError(data.error || 'Failed to update order status.');
      }
    } catch (err) {
      console.error(err);
      setError('Network request error.');
    }
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    
    const clientName = order.user_name || '';
    const clientEmail = order.user_email || '';
    const orderIdStr = order.id.toString();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = searchTerm
      ? clientName.toLowerCase().includes(searchLower) ||
        clientEmail.toLowerCase().includes(searchLower) ||
        orderIdStr.includes(searchLower)
      : true;

    return matchesStatus && matchesSearch;
  });

  return (
    <div style={dashboardLayoutStyle} className="admin-page-root animate-fade-in">
      {/* Sidebar */}
      <AdminSidebar active="orders" />

      {/* Main Panel */}
      <main style={mainPanelStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Orders Pipeline</h1>
            <p style={subtitleStyle}>Manage customer invoices, delivery states, and payment details.</p>
          </div>
          <div style={headerRightActionsStyle}>
            <Link href="/" style={headerVisitStoreBtnStyle}>
              Visit Storefront
            </Link>
            <button onClick={logout} style={headerLogoutBtnStyle}>
              Sign Out
            </button>
          </div>
        </header>

        {success && <div style={successBannerStyle}>{success}</div>}
        {error && <div style={errorBannerStyle}>{error}</div>}

        {/* Filters Controls Row */}
        <div style={controlsRowStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Search orders</label>
            <input
              type="text"
              placeholder="Search by ID, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchFieldStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectFieldStyle}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending Payment</option>
              <option value="Placed">Placed (Paid)</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div>Retrieving orders database...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={emptyStateStyle}>No orders found matching criteria.</div>
        ) : (
          <div style={tableCardStyle}>
            <table style={catalogTableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Order ID</th>
                  <th style={thStyle}>Customer Details</th>
                  <th style={thStyle}>Line Items</th>
                  <th style={thStyle}>Delivery Address</th>
                  <th style={thStyle}>Total Charge</th>
                  <th style={thStyle}>Payment Status</th>
                  <th style={{ ...thStyle, width: '160px', textAlign: 'center' }}>Delivery State</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const addr = order.shipping_address || {};
                  return (
                    <tr key={order.id} style={trStyle}>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>#{order.id}</td>
                      <td style={tdStyle}>
                        <div>
                          <strong>{order.user_name || 'Anonymous Customer'}</strong>
                          <span style={emailLabelStyle}>{order.user_email || 'no-email'}</span>
                          <span style={dateLabelStyle}>
                            {new Date(order.created_at).toLocaleString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '280px' }}>
                        <div style={itemsListCellStyle}>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={itemBadgeStyle}>
                              <strong>{item.name}</strong>
                              <span>({item.size} / {item.color}) × {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '0.8rem', lineHeight: 1.4, maxWidth: '220px' }}>
                        {addr.line1}
                        {addr.line2 && `, ${addr.line2}`}
                        <br />
                        {addr.city}, {addr.state} - {addr.postal_code}
                        <br />
                        Phone: {addr.phone}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>
                        ₹{parseFloat(order.total).toLocaleString('en-IN')}
                      </td>
                      <td style={tdStyle}>
                        <span style={payStatusBadgeStyle(order.payment_status)}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          style={statusSelectStyle(order.status)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Placed">Placed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
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

// Reuse sidebar layout styles
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

// Filter Row
const controlsRowStyle = {
  display: 'flex',
  gap: '1.5rem',
  marginBottom: '2rem',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const labelStyle = {
  fontSize: '0.68rem',
  textTransform: 'uppercase',
  color: '#000000',
  fontWeight: '700',
  letterSpacing: '0.05em',
};

const searchFieldStyle = {
  padding: '0.55rem 0.8rem',
  border: '1px solid rgba(139, 119, 137, 0.2)',
  fontSize: '0.82rem',
  width: '260px',
  borderRadius: '4px',
  backgroundColor: '#FFFFFF',
};

const selectFieldStyle = {
  padding: '0.55rem 0.8rem',
  border: '1px solid rgba(139, 119, 137, 0.2)',
  fontSize: '0.82rem',
  width: '180px',
  borderRadius: '4px',
  backgroundColor: '#FFFFFF',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '4rem',
  color: '#000000',
  fontStyle: 'italic',
};

// Table style
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
  padding: '1rem 1.2rem',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: '700',
};

const trStyle = {
  borderBottom: '1px solid rgba(60, 48, 58, 0.08)',
};

const tdStyle = {
  padding: '1.2rem 1.2rem',
  fontSize: '0.85rem',
  color: '#000000',
};

const emailLabelStyle = {
  fontSize: '0.72rem',
  color: '#000000',
  display: 'block',
};

const dateLabelStyle = {
  fontSize: '0.72rem',
  color: '#000000',
  display: 'block',
  marginTop: '0.2rem',
};

const itemsListCellStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const itemBadgeStyle = {
  backgroundColor: '#D98E9B',
  border: '1px solid rgba(139,119,137,0.15)',
  padding: '0.3rem 0.5rem',
  borderRadius: '4px',
  fontSize: '0.78rem',
  display: 'flex',
  flexDirection: 'column',
};

const payStatusBadgeStyle = (status) => {
  const isPaid = status === 'Paid';
  return {
    backgroundColor: isPaid ? '#e8f5e9' : '#ffebee',
    color: isPaid ? '#2e7d32' : '#c62828',
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
  };
};

const statusSelectStyle = (status) => {
  const isDelivered = status === 'Delivered';
  const isCancelled = status === 'Cancelled';
  let border = '1px solid rgba(139,119,137,0.25)';
  let color = '#000000';
  let bg = '#fff';

  if (isDelivered) {
    color = '#2e7d32';
    bg = '#e8f5e9';
    border = '1px solid #c8e6c9';
  } else if (isCancelled) {
    color = '#c62828';
    bg = '#ffebee';
    border = '1px solid #ffcdd2';
  }

  return {
    padding: '0.4rem 0.6rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color,
    backgroundColor: bg,
    border,
    cursor: 'pointer',
    outline: 'none',
  };
};
