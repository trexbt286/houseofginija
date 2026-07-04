'use client';

import { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/context/StoreContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AccountContent() {
  const { user, loading, logout, toggleWishlist } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

  // Data states
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [addresses, setAddresses] = useState([]);

  // Loaders
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);

  // Address form
  const [newAddress, setNewAddress] = useState({
    type: 'shipping',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
  });
  const [addressSuccess, setAddressSuccess] = useState('');
  const [addressError, setAddressError] = useState('');

  // Authentication check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading]);

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Update URL query parameter silently
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    router.replace(`/account?${params.toString()}`, { scroll: false });
  };

  // Fetch orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/account/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch detailed wishlist items
  const fetchWishlist = async () => {
    setWishlistLoading(true);
    try {
      const res = await fetch('/api/account/wishlist?details=true');
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data.wishlist || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Fetch addresses
  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await fetch('/api/account/address');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddressesLoading(false);
    }
  };

  // Fetch appropriate data on tab change
  useEffect(() => {
    if (!user) return;
    
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'wishlist') {
      fetchWishlist();
    } else if (activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [activeTab, user]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressSuccess('');
    setAddressError('');

    try {
      const res = await fetch('/api/account/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });

      if (res.ok) {
        setAddressSuccess('Address successfully registered.');
        setNewAddress({
          type: 'shipping',
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: '',
          phone: '',
        });
        fetchAddresses(); // Refresh list
      } else {
        const data = await res.json();
        setAddressError(data.error || 'Failed to save address.');
      }
    } catch (err) {
      console.error(err);
      setAddressError('Network error. Failed to save address.');
    }
  };

  const handleRemoveWishlistItem = async (id) => {
    await toggleWishlist(id);
    // Optimistic UI update
    setWishlistItems(prev => prev.filter(item => item.id !== id));
  };

  if (loading || !user) {
    return <div style={loadingContainerStyle}>Accessing secured profile...</div>;
  }

  return (
    <div style={pageStyle} className="container animate-fade-in">
      <div style={headerStyle}>
        <span style={subtitleStyle}>Client Portal</span>
        <h1 style={titleStyle}>My Account</h1>
        <p style={welcomeStyle}>Welcome back, {user.name}</p>
        <button onClick={logout} style={logoutBtnStyle}>
          Sign Out of Account
        </button>
      </div>

      <div style={portalLayoutStyle}>
        {/* Navigation Tabs (Sidebar) */}
        <aside style={tabsSidebarStyle}>
          <button
            onClick={() => handleTabChange('profile')}
            style={activeTab === 'profile' ? activeTabBtnStyle : tabBtnStyle}
          >
            Client Profile
          </button>
          <button
            onClick={() => handleTabChange('orders')}
            style={activeTab === 'orders' ? activeTabBtnStyle : tabBtnStyle}
          >
            Order History
          </button>
          <button
            onClick={() => handleTabChange('wishlist')}
            style={activeTab === 'wishlist' ? activeTabBtnStyle : tabBtnStyle}
          >
            My Wishlist
          </button>
          <button
            onClick={() => handleTabChange('addresses')}
            style={activeTab === 'addresses' ? activeTabBtnStyle : tabBtnStyle}
          >
            Saved Addresses
          </button>
        </aside>

        {/* Tab Contents */}
        <main style={contentPanelStyle}>
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div style={tabContentStyle}>
              <h2 style={tabTitleStyle}>Profile Information</h2>
              <div style={dividerLineStyle}></div>
              
              <div style={profileGridStyle}>
                <div style={infoGroupStyle}>
                  <span style={infoLabelStyle}>Client Name</span>
                  <span style={infoValueStyle}>{user.name}</span>
                </div>
                <div style={infoGroupStyle}>
                  <span style={infoLabelStyle}>Email Address</span>
                  <span style={infoValueStyle}>{user.email}</span>
                </div>
                <div style={infoGroupStyle}>
                  <span style={infoLabelStyle}>Client Rank</span>
                  <span style={{ ...infoValueStyle, textTransform: 'uppercase', color: '#000000' }}>
                    {user.role} client
                  </span>
                </div>
                <div style={infoGroupStyle}>
                  <span style={infoLabelStyle}>Registered Since</span>
                  <span style={infoValueStyle}>
                    {new Date(user.created_at || Date.now()).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div style={tabContentStyle}>
              <h2 style={tabTitleStyle}>Past Orders</h2>
              <div style={dividerLineStyle}></div>

              {ordersLoading ? (
                <div>Retrieving order records...</div>
              ) : orders.length === 0 ? (
                <div style={emptyTabStyle}>
                  <p>You have not placed any orders yet.</p>
                  <Link href="/collections" style={shopLinkStyle}>Browse Collections</Link>
                </div>
              ) : (
                <div style={ordersListStyle}>
                  {orders.map((order) => (
                    <div key={order.id} style={orderCardStyle}>
                      <div style={orderHeaderStyle}>
                        <div>
                          <span style={orderIdLabelStyle}>Order ID: #{order.id}</span>
                          <span style={orderDateStyle}>
                            Placd on {new Date(order.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div style={statusBadgeGroupStyle}>
                          <span style={orderStatusBadgeStyle(order.status)}>{order.status}</span>
                          <span style={payStatusBadgeStyle(order.payment_status)}>
                            Payment: {order.payment_status}
                          </span>
                        </div>
                      </div>

                      <div style={orderItemsStyle}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={orderItemRowStyle}>
                            <div style={orderItemMetaStyle}>
                              <strong>{item.name}</strong>
                              <span>Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</span>
                            </div>
                            <span style={orderItemPriceStyle}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>

                      <div style={orderFooterStyle}>
                        <div>
                          {order.razorpay_payment_id && (
                            <span style={txIdStyle}>Processor ID: {order.razorpay_payment_id}</span>
                          )}
                        </div>
                        <span style={orderTotalStyle}>
                          Total: <strong>₹{parseFloat(order.total).toLocaleString('en-IN')}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === 'wishlist' && (
            <div style={tabContentStyle}>
              <h2 style={tabTitleStyle}>Starred Creations</h2>
              <div style={dividerLineStyle}></div>

              {wishlistLoading ? (
                <div>Accessing vault wishlist...</div>
              ) : wishlistItems.length === 0 ? (
                <div style={emptyTabStyle}>
                  <p>Your wishlist is currently empty.</p>
                  <Link href="/collections" style={shopLinkStyle}>Save Creations</Link>
                </div>
              ) : (
                <div style={wishlistGridStyle}>
                  {wishlistItems.map((item) => (
                    <div key={item.id} style={wishlistCardStyle}>
                      <div style={wishlistImgWrapperStyle}>
                        <img src={item.images[0]} alt={item.name} style={wishlistImgStyle} loading="lazy" />
                        <button
                          onClick={() => handleRemoveWishlistItem(item.id)}
                          style={removeWishlistBtnStyle}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                      <div style={wishlistContentStyle}>
                        <span style={wishlistColLabelStyle}>{item.collection_name}</span>
                        <h4 style={wishlistNameStyle}>{item.name}</h4>
                        <span style={wishlistPriceStyle}>₹{parseFloat(item.price).toLocaleString('en-IN')}</span>
                        <Link href={`/products/${item.slug}`} style={viewProductBtnStyle}>
                          View Product
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div style={tabContentStyle}>
              <h2 style={tabTitleStyle}>Saved Addresses</h2>
              <div style={dividerLineStyle}></div>

              {addressesLoading ? (
                <div>Loading client addresses...</div>
              ) : (
                <div style={addressesGridStyle}>
                  {addresses.map((addr) => (
                    <div key={addr.id} style={addressCardStyle}>
                      <span style={addressTypeStyle}>{addr.type}</span>
                      <p style={addressBodyStyle}>
                        {addr.line1}
                        {addr.line2 && `, ${addr.line2}`}
                        <br />
                        {addr.city}, {addr.state} - {addr.postal_code}
                        <br />
                        Phone: {addr.phone}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Address Form */}
              <div style={addressFormContainerStyle}>
                <h3 style={formTitleStyle}>Register New Address</h3>
                <form onSubmit={handleAddressSubmit} style={formStyle}>
                  <div style={formRowStyle}>
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Address label (e.g. Home, Work)</label>
                      <input
                        type="text"
                        placeholder="Home"
                        value={newAddress.type}
                        onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  <div style={formRowStyle}>
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Street Address Line 1</label>
                      <input
                        type="text"
                        placeholder="House/flat number, building name"
                        value={newAddress.line1}
                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  <div style={formRowStyle}>
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        placeholder="Landmark, locality"
                        value={newAddress.line2}
                        onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={formRowStyle}>
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>City</label>
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>State</label>
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  <div style={formRowStyle}>
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Postal Code</label>
                      <input
                        type="text"
                        placeholder="PIN code"
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Contact Phone</label>
                      <input
                        type="tel"
                        placeholder="10-digit phone number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  {addressSuccess && <p style={successStyle}>{addressSuccess}</p>}
                  {addressError && <p style={errorStyle}>{addressError}</p>}

                  <button type="submit" style={addressSubmitBtnStyle}>
                    Save Address
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <AccountContent />
    </Suspense>
  );
}

// Inline styles for Account Page
const pageStyle = {
  paddingTop: '3rem',
  paddingBottom: '6rem',
  backgroundColor: '#FFFFFF',
};

const loadingContainerStyle = {
  textAlign: 'center',
  padding: '10rem 0',
  color: '#000000',
  fontSize: '1.2rem',
  fontFamily: 'var(--font-serif)',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '3rem',
};

const subtitleStyle = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  color: '#D98E9B',
  fontWeight: '600',
  display: 'block',
  marginBottom: '0.4rem',
};

const titleStyle = {
  fontSize: '2.5rem',
  fontFamily: 'var(--font-serif)',
  color: '#D98E9B',
  fontWeight: '400',
  lineHeight: 1.1,
};

const welcomeStyle = {
  fontSize: '0.95rem',
  color: '#000000',
  marginTop: '0.5rem',
};

const logoutBtnStyle = {
  backgroundColor: 'transparent',
  color: '#000000',
  border: '1px solid #000000',
  padding: '0.4rem 1.2rem',
  borderRadius: '4px',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: '600',
  marginTop: '1rem',
};

const portalLayoutStyle = {
  display: 'grid',
  gridTemplateColumns: '260px 1fr',
  gap: '3rem',
  alignItems: 'start',
  '@media (max-width: 991px)': {
    gridTemplateColumns: '1fr',
    gap: '2rem',
  },
};

const tabsSidebarStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  backgroundColor: '#FFFFFF',
  padding: '1.5rem',
  borderRadius: '8px',
  border: '1px solid rgba(139, 119, 137, 0.12)',
};

const tabBtnStyle = {
  width: '100%',
  textAlign: 'left',
  padding: '0.8rem 1rem',
  fontSize: '0.85rem',
  color: '#000000',
  fontWeight: '600',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
};

const activeTabBtnStyle = {
  ...tabBtnStyle,
  backgroundColor: '#D98E9B',
  color: '#000000',
};

const contentPanelStyle = {
  flex: 1,
};

const tabContentStyle = {
  backgroundColor: '#FFFFFF',
  padding: '2.5rem',
  borderRadius: '8px',
  border: '1px solid rgba(139, 119, 137, 0.12)',
  boxShadow: 'var(--shadow-sm)',
};

const tabTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.5rem',
  color: '#D98E9B',
  fontWeight: '500',
};

const dividerLineStyle = {
  height: '1px',
  backgroundColor: 'rgba(139, 119, 137, 0.12)',
  margin: '1.2rem 0 2rem 0',
};

// Profile style
const profileGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '2rem',
};

const infoGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const infoLabelStyle = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#000000',
  fontWeight: '700',
};

const infoValueStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#000000',
};

const emptyTabStyle = {
  textAlign: 'center',
  padding: '4rem 1rem',
  color: '#000000',
};

const shopLinkStyle = {
  color: '#000000',
  fontWeight: '600',
  textDecoration: 'underline',
  marginTop: '0.8rem',
  display: 'inline-block',
};

// Orders style
const ordersListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.8rem',
};

const orderCardStyle = {
  border: '1px solid rgba(139, 119, 137, 0.15)',
  borderRadius: '6px',
  overflow: 'hidden',
  backgroundColor: '#FFFFFF',
};

const orderHeaderStyle = {
  backgroundColor: '#FFFFFF',
  color: '#000000',
  padding: '1rem 1.5rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
};

const orderIdLabelStyle = {
  fontSize: '0.82rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'block',
};

const orderDateStyle = {
  fontSize: '0.72rem',
  color: '#000000',
};

const statusBadgeGroupStyle = {
  display: 'flex',
  gap: '0.6rem',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const orderStatusBadgeStyle = (status) => {
  const isDelivered = status === 'Delivered';
  const isCancelled = status === 'Cancelled';
  return {
    backgroundColor: isDelivered ? '#e8f5e9' : isCancelled ? '#ffebee' : '#fff8e1',
    color: isDelivered ? '#2e7d32' : isCancelled ? '#c62828' : '#f57f17',
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '0.25rem 0.6rem',
    borderRadius: '99px',
    textTransform: 'uppercase',
  };
};

const payStatusBadgeStyle = (status) => {
  const isPaid = status === 'Paid';
  return {
    backgroundColor: isPaid ? '#e8f5e9' : '#ffebee',
    color: isPaid ? '#2e7d32' : '#c62828',
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '0.25rem 0.6rem',
    borderRadius: '99px',
    textTransform: 'uppercase',
  };
};

const orderItemsStyle = {
  padding: '1.2rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const orderItemRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const orderItemMetaStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
};

const orderItemPriceStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#000000',
};

const orderFooterStyle = {
  borderTop: '1px solid rgba(139, 119, 137, 0.1)',
  padding: '1rem 1.5rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.85rem',
  backgroundColor: 'rgba(60, 48, 58, 0.02)',
};

const txIdStyle = {
  fontSize: '0.7rem',
  color: '#000000',
};

const orderTotalStyle = {
  color: '#000000',
};

// Wishlist style
const wishlistGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '1.5rem',
};

const wishlistCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '4px',
  overflow: 'hidden',
  border: '1px solid rgba(139, 119, 137, 0.1)',
  display: 'flex',
  flexDirection: 'column',
};

const wishlistImgWrapperStyle = {
  position: 'relative',
  width: '100%',
  height: '200px',
};

const wishlistImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const removeWishlistBtnStyle = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  color: '#000000',
  border: 'none',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
};

const wishlistContentStyle = {
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  flex: 1,
};

const wishlistColLabelStyle = {
  fontSize: '0.62rem',
  color: '#000000',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const wishlistNameStyle = {
  fontSize: '0.9rem',
  fontFamily: 'var(--font-serif)',
  color: '#000000',
  fontWeight: '500',
  flex: 1,
};

const wishlistPriceStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#000000',
  marginBottom: '0.8rem',
};

const viewProductBtnStyle = {
  display: 'block',
  width: '100%',
  textAlign: 'center',
  backgroundColor: '#D98E9B',
  color: '#000000',
  fontSize: '0.75rem',
  padding: '0.5rem',
  borderRadius: '2px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

// Addresses style
const addressesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '1.5rem',
  marginBottom: '3rem',
};

const addressCardStyle = {
  border: '1px solid rgba(139, 119, 137, 0.15)',
  backgroundColor: '#FFFFFF',
  padding: '1.2rem',
  borderRadius: '6px',
  position: 'relative',
};

const addressTypeStyle = {
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  backgroundColor: '#FFFFFF',
  color: '#000000',
  padding: '0.15rem 0.5rem',
  borderRadius: '2px',
  fontWeight: '700',
  letterSpacing: '0.05em',
  position: 'absolute',
  top: '1.2rem',
  right: '1.2rem',
};

const addressBodyStyle = {
  fontSize: '0.85rem',
  lineHeight: 1.6,
  color: '#000000',
  marginTop: '0.5rem',
};

// Form style
const addressFormContainerStyle = {
  marginTop: '2rem',
  borderTop: '1px solid rgba(139, 119, 137, 0.12)',
  paddingTop: '2.5rem',
};

const formTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.3rem',
  color: '#D98E9B',
  marginBottom: '1.5rem',
  fontWeight: '500',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  maxWidth: '600px',
};

const formRowStyle = {
  display: 'flex',
  gap: '1rem',
  width: '100%',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const labelStyle = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#000000',
  fontWeight: '700',
};

const inputStyle = {
  padding: '0.65rem',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  borderRadius: '4px',
};

const successStyle = {
  color: '#000000',
  fontSize: '0.8rem',
  fontWeight: '600',
};

const errorStyle = {
  color: '#000000',
  fontSize: '0.8rem',
  fontWeight: '600',
};

const addressSubmitBtnStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.75rem 1.5rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  alignSelf: 'flex-start',
  boxShadow: 'var(--shadow-sm)',
};
