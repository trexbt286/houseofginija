'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { cart, cartCount, updateCartQuantity, removeFromCart, wishlist, user, logout, setIsLoginOpen } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();

  // Manage scroll-lock on document.body when cart drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.classList.add('scroll-locked');
      document.body.classList.add('cart-drawer-open');
    } else {
      document.body.classList.remove('scroll-locked');
      document.body.classList.remove('cart-drawer-open');
    }
    return () => {
      document.body.classList.remove('scroll-locked');
      document.body.classList.remove('cart-drawer-open');
    };
  }, [isCartOpen]);

  // Trap Escape key to close cart drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [isBumping, setIsBumping] = useState(false);
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 800);
      return () => clearTimeout(timer);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  const isCurrent = (path) => pathname === path;

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar-wrapper">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.7rem', color: '#FFFFFF', fontWeight: '700', fontSize: '0.68rem', letterSpacing: '0.06em' }}>
          FREE EXPRESS SHIPPING
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
          <span style={{ color: '#D98E9B', fontWeight: '700' }}>SHOP NOW</span>
        </div>
      </div>

      <header style={headerContainerStyle}>
      {/* Brand Header */}
      <div style={brandHeaderStyle}>
        
        {/* 1. Left: Logo */}
        <div style={brandLogoWrapperStyle}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', cursor: 'pointer' }}>
            <img 
              src="/brand_symbol_logo.png" 
              alt="House of Ginija Symbol" 
              style={{ height: '34px', width: 'auto', objectFit: 'contain', display: 'block' }} 
              loading="lazy"
            />
            <div style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'rgba(139, 119, 137, 0.25)',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '0.95rem',
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: '1.1',
                fontWeight: '700'
              }}>
                House of Ginija
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.52rem',
                color: '#D98E9B',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                lineHeight: '1.2',
                fontWeight: '700',
                marginTop: '0.1rem'
              }}>
                The Designer Label
              </span>
            </div>
          </a>
        </div>

        {/* 2. Center: Desktop Navigation Links (hidden on mobile via className) */}
        <nav className="desktop-nav-only">
          <ul style={navLinksStyle}>
            <li>
              <Link href="/" style={isCurrent('/') ? activeLinkStyle : navLinkStyle} onClick={() => setMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li 
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
              style={dropdownLiStyle}
            >
              <Link 
                href="/collections" 
                style={dropdownTriggerStyle} 
                onClick={() => {
                  setMenuOpen(false);
                  if (typeof window !== 'undefined' && window.location.pathname === '/collections') {
                    window.dispatchEvent(new CustomEvent('reset-collections'));
                  }
                }}
              >
                Collections
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={dropdownIconStyle}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Link>
              {dropdownOpen && (
                <ul style={{...dropdownMenuStyle, gap: 0}}>
                  <li style={{ position: 'relative' }}>
                    {/* Vertical Trunk Line (from top of dropdown to Suits) */}
                    <div style={{
                      position: 'absolute',
                      left: '16px',
                      top: '-0.8rem',
                      bottom: 0,
                      width: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    {/* Horizontal Branch to Suits */}
                    <div style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      width: '8px',
                      height: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    <Link href="/collections?collection=suits" style={{...dropdownLinkItemStyle, paddingLeft: '2.0rem', fontWeight: '700'}} onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                      Suits
                    </Link>
                  </li>
                  <li style={{ position: 'relative' }}>
                    {/* Main Trunk ends at middle of Jewellery */}
                    <div style={{
                      position: 'absolute',
                      left: '16px',
                      top: 0,
                      bottom: '50%',
                      width: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    {/* Horizontal Branch to Jewellery */}
                    <div style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      width: '8px',
                      height: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    {/* Sub-Trunk starts at Jewellery branch and goes down */}
                    <div style={{
                      position: 'absolute',
                      left: '24px',
                      top: '50%',
                      bottom: 0,
                      width: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    <Link href="/collections?collection=jewellery" style={{...dropdownLinkItemStyle, paddingLeft: '2.0rem', fontWeight: '700'}} onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                      Jewellery
                    </Link>
                  </li>
                  <li style={{ position: 'relative' }}>
                    {/* Vertical Sub-Trunk */}
                    <div style={{
                      position: 'absolute',
                      left: '24px',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    {/* Horizontal Branch */}
                    <div style={{
                      position: 'absolute',
                      left: '24px',
                      top: '50%',
                      width: '10px',
                      height: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    <Link href="/collections?collection=jewellery&category=rings" style={{...dropdownLinkItemStyle, paddingLeft: '2.8rem', fontSize: '0.8rem', fontWeight: '500', color: '#565959'}} onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                      Rings
                    </Link>
                  </li>
                  <li style={{ position: 'relative' }}>
                    {/* Vertical Sub-Trunk */}
                    <div style={{
                      position: 'absolute',
                      left: '24px',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    {/* Horizontal Branch */}
                    <div style={{
                      position: 'absolute',
                      left: '24px',
                      top: '50%',
                      width: '10px',
                      height: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    <Link href="/collections?collection=jewellery&category=necklace" style={{...dropdownLinkItemStyle, paddingLeft: '2.8rem', fontSize: '0.8rem', fontWeight: '500', color: '#565959'}} onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                      Necklace
                    </Link>
                  </li>
                  <li style={{ position: 'relative' }}>
                    {/* Vertical Sub-Trunk terminates at middle */}
                    <div style={{
                      position: 'absolute',
                      left: '24px',
                      top: 0,
                      bottom: '50%',
                      width: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    {/* Horizontal Branch */}
                    <div style={{
                      position: 'absolute',
                      left: '24px',
                      top: '50%',
                      width: '10px',
                      height: '1px',
                      backgroundColor: 'rgba(139, 119, 137, 0.25)'
                    }} />
                    <Link href="/collections?collection=jewellery&category=bracelets" style={{...dropdownLinkItemStyle, paddingLeft: '2.8rem', fontSize: '0.8rem', fontWeight: '500', color: '#565959'}} onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                      Bracelets
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link href="/about" style={isCurrent('/about') ? activeLinkStyle : navLinkStyle} onClick={() => setMenuOpen(false)}>
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/contact" style={isCurrent('/contact') ? activeLinkStyle : navLinkStyle} onClick={() => setMenuOpen(false)}>
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        
        <div style={headerActionsStyle} className="header-actions-row">
          {user ? (
            <Link href="/account" style={actionLinkStyle} title="My Account" className="header-action-btn">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="hide-mobile-label">Hello, {user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <button 
              onClick={() => setIsLoginOpen(true)} 
              style={{ ...actionLinkStyle, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} 
              title="Sign In" 
              className="header-action-btn"
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="hide-mobile-label">Sign In</span>
            </button>
          )}

          {!(user && user.role === 'admin') && (
            <>
              <Link href="/account?tab=wishlist" style={actionLinkStyle} title="Wishlist" className="header-action-btn">
                <div style={badgeWrapperStyle}>
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {wishlist.length > 0 && <span style={badgeStyle}>{wishlist.length}</span>}
                </div>
              </Link>

              <Link 
                href="/cart" 
                style={actionLinkStyle} 
                title="Shopping Bag"
                className="header-action-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setIsCartOpen(true);
                }}
              >
                <div style={badgeWrapperStyle} className={isBumping ? 'animate-cart-bump' : ''}>
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  {cartCount > 0 && <span style={badgeStyle}>{cartCount}</span>}
                </div>
              </Link>
            </>
          )}

          {user && user.role === 'admin' && (
            <Link href="/admin/dashboard" style={adminLinkStyle}>
              Admin Portal
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" style={mobileMenuButtonStyle} onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 4. Mobile Navigation Drawer (Absolute positioned) */}
      {menuOpen && (
        <nav style={mobileNavStyle}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <li>
              <Link href="/" style={isCurrent('/') ? activeLinkStyle : navLinkStyle} onClick={() => setMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <span style={{ ...navLinkStyle, fontWeight: '700' }}>Collections</span>
              <ul style={{ listStyle: 'none', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li>
                  <Link href="/collections?collection=suits" style={{ ...navLinkStyle, fontSize: '0.8rem' }} onClick={() => setMenuOpen(false)}>
                    — Suits
                  </Link>
                </li>
                <li>
                  <Link href="/collections?collection=jewellery" style={{ ...navLinkStyle, fontSize: '0.8rem' }} onClick={() => setMenuOpen(false)}>
                    — Jewellery
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link href="/about" style={isCurrent('/about') ? activeLinkStyle : navLinkStyle} onClick={() => setMenuOpen(false)}>
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/contact" style={isCurrent('/contact') ? activeLinkStyle : navLinkStyle} onClick={() => setMenuOpen(false)}>
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {/* Slide-Out Cart Drawer */}
      <div className={`cart-drawer-backdrop ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="cart-drawer-header">
            {/* Mobile Back Button (on the left) */}
            <button className="cart-drawer-back-btn" onClick={() => setIsCartOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <h3 className="cart-drawer-title">Shopping Bag ({cartCount})</h3>

            <button className="cart-drawer-close" onClick={() => setIsCartOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="cart-drawer-feed hide-scrollbar">
            {cart && cart.length > 0 ? (
              cart.map((item, idx) => {
                const itemSubtotal = item.price * item.quantity;
                return (
                  <div key={`${item.id}-${item.size}-${item.color}-${idx}`} className="cart-drawer-item">
                    <img 
                      src={item.images && item.images[0] ? item.images[0] : (item.image ? item.image : '/placeholder.jpg')} 
                      alt={item.name} 
                      className="cart-drawer-thumb" 
                      loading="lazy"
                    />
                    <div className="cart-drawer-item-details">
                      <h4 className="cart-drawer-item-title">{item.name}</h4>
                      <span className="cart-drawer-item-variant">
                        {item.size || 'One Size'} {item.color ? `• ${item.color}` : ''}
                      </span>
                      <span className="cart-drawer-item-price">
                        ₹{parseFloat(item.price).toLocaleString('en-IN')} x {item.quantity}
                      </span>
                      
                      <div className="cart-drawer-item-actions">
                        <div className="cart-drawer-qty-controller">
                          <button 
                            className="cart-drawer-qty-btn"
                            onClick={() => updateCartQuantity(item.id, item.size || 'One Size', item.color || 'Default', item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="cart-drawer-qty-val">{item.quantity}</span>
                          <button 
                            className="cart-drawer-qty-btn"
                            onClick={() => {
                              const vars = item.variants || [];
                              const matchingVar = vars.find(v => (v.size || '') === (item.size || '') && (v.color || '') === (item.color || ''));
                              const maxStock = matchingVar ? matchingVar.stock : 10;
                              if (item.quantity >= maxStock) return;
                              updateCartQuantity(item.id, item.size || 'One Size', item.color || 'Default', item.quantity + 1);
                            }}
                          >
                            +
                          </button>
                        </div>
                        <button 
                          className="cart-drawer-item-remove"
                          onClick={() => removeFromCart(item.id, item.size || 'One Size', item.color || 'Default')}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="cart-drawer-empty-state">
                <div className="cart-drawer-empty-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <span className="cart-drawer-empty-text">No products in the cart.</span>
              </div>
            )}
          </div>

          {cart && cart.length > 0 && (
            <div className="cart-drawer-footer">
              <div className="cart-drawer-total-row">
                <span className="cart-drawer-total-label">Subtotal</span>
                <span className="cart-drawer-total-val">
                  ₹{parseFloat(cart.reduce((sum, item) => sum + item.price * item.quantity, 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <span className="cart-drawer-subtext">
                Taxes and shipping calculated at checkout
              </span>
              <Link 
                href="/checkout" 
                className="cart-drawer-checkout-btn"
                onClick={() => setIsCartOpen(false)}
              >
                Check Out
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
}

// Vanilla styles for Header
const headerContainerStyle = {
  backgroundColor: '#F6DDE2', // Matched to Footer Pink
  borderBottom: '1px solid rgba(139, 119, 137, 0.1)',
  position: 'sticky',
  top: 0,
  zIndex: 90,
  height: '75px',
  boxSizing: 'border-box',
};

const brandHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 2rem',
  maxWidth: '1280px',
  margin: '0 auto',
  height: '100%',
};

const brandLogoWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const logoLinkStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
};

const headerActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
};

const userActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
};

const actionLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  color: '#000000',
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const logoutButtonStyle = {
  color: '#000000',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const badgeWrapperStyle = {
  position: 'relative',
  display: 'flex',
};

const badgeStyle = {
  position: 'absolute',
  top: '-6px',
  right: '-6px',
  backgroundColor: '#D98E9B',
  color: '#000000',
  fontSize: '0.7rem',
  fontWeight: '700',
  borderRadius: '50%',
  width: '18px',
  height: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const adminLinkStyle = {
  fontSize: '0.75rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#000000',
  border: '1px solid #D98E9B',
  padding: '0.3rem 0.6rem',
  borderRadius: '4px',
};

const mobileMenuButtonStyle = {
  color: '#000000',
  cursor: 'pointer',
};

const mobileNavStyle = {
  display: 'block',
  position: 'absolute',
  top: '100%',
  left: 0,
  width: '100%',
  backgroundColor: '#FFFFFF',
  borderBottom: '1px solid rgba(139, 119, 137, 0.1)',
  padding: '1.5rem',
  boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
  zIndex: 99,
};

const navLinksStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '2.5rem',
  listStyle: 'none',
  flexWrap: 'wrap',
};

const navLinkStyle = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontWeight: '500',
  color: '#000000',
};

const activeLinkStyle = {
  ...navLinkStyle,
  color: '#000000',
  borderBottom: '1px solid #000000',
  paddingBottom: '2px',
};

const dropdownLiStyle = {
  position: 'relative',
  cursor: 'pointer',
};

const dropdownTriggerStyle = {
  ...navLinkStyle,
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};

const dropdownIconStyle = {
  transition: 'transform 0.2s ease',
};

const dropdownMenuStyle = {
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 10px 30px rgba(60, 48, 58, 0.1)',
  borderRadius: '8px',
  listStyle: 'none',
  padding: '0.8rem 0',
  minWidth: '200px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  border: '1px solid rgba(139, 119, 137, 0.1)',
  animation: 'fadeIn 0.2s ease forwards',
};

const dropdownLinkItemStyle = {
  display: 'block',
  padding: '0.5rem 1.5rem',
  fontSize: '0.85rem',
  color: '#000000',
  textAlign: 'left',
};

const dropdownLinkAccentStyle = {
  ...dropdownLinkItemStyle,
  color: '#000000',
  fontWeight: '600',
  borderBottom: '1px dashed rgba(74, 52, 57, 0.08)',
  backgroundColor: '#FFFFFF',
};
