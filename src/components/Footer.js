'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  
  // Accordion open/close state
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage('Thank you for subscribing to House Of Ginija.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  const accordionItems = [
    {
      id: 'get-in-touch',
      title: 'GET IN TOUCH',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#2D2429' }}>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            <strong>Store Address:</strong><br />
            M J Jewels, Kapoorthala Crossing, Sector F, Chandralok, Lucknow, India
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/contact" style={{ color: '#D98E9B', fontWeight: '600', textDecoration: 'underline' }}>
              Contact Us & Visit Store →
            </Link>
          </p>
        </div>
      )
    },
    {
      id: 'quick-links',
      title: 'QUICK LINKS',
      content: (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
          <li><Link href="/collections" style={{ color: '#000000', textDecoration: 'none' }}>All Collections</Link></li>
          <li><Link href="/about" style={{ color: '#000000', textDecoration: 'none' }}>Our Story</Link></li>
          <li><Link href="/wishlist" style={{ color: '#000000', textDecoration: 'none' }}>Wishlist</Link></li>
          <li><Link href="/cart" style={{ color: '#000000', textDecoration: 'none' }}>Shopping Bag</Link></li>
        </ul>
      )
    },
    {
      id: 'collections',
      title: 'COLLECTIONS',
      content: (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
          <li><Link href="/suits" style={{ color: '#000000', textDecoration: 'none' }}>Suits Collection</Link></li>
          <li><Link href="/jewellery" style={{ color: '#000000', textDecoration: 'none' }}>Jewellery Collection</Link></li>
          <li><Link href="/collections" style={{ color: '#000000', textDecoration: 'none' }}>All Creations</Link></li>
        </ul>
      )
    },
    {
      id: 'client-services',
      title: 'CLIENT SERVICES',
      content: (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
          <li><Link href="/contact" style={{ color: '#000000', textDecoration: 'none' }}>Contact Us</Link></li>
          <li><Link href="/shipping-returns" style={{ color: '#000000', textDecoration: 'none' }}>Shipping & Returns</Link></li>
          <li><Link href="/privacy-policy" style={{ color: '#000000', textDecoration: 'none' }}>Privacy & Cookies</Link></li>
          <li><Link href="/terms" style={{ color: '#000000', textDecoration: 'none' }}>Terms & Conditions</Link></li>
        </ul>
      )
    },
    {
      id: 'follow-us',
      title: 'FOLLOW US',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
          <a 
            href="https://www.instagram.com/houseof_ginija" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: '#000000', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D98E9B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <span>Instagram</span>
          </a>
        </div>
      )
    },
    {
      id: 'our-story',
      title: 'OUR STORY',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#2D2429' }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Made to last. Crafting high-end archival couture, focusing on slow fashion, premium tailoring, and dedicated master craftsmanship.
          </p>
          <Link href="/about" style={{ color: '#D98E9B', fontWeight: '600', textDecoration: 'underline' }}>
            Read Our Full Story →
          </Link>
        </div>
      )
    }
  ];

  return (
    <>
      {/* ── Location / Visit Us Banner ── */}
      <div style={visitUsSectionStyle}>
        <a
          href="https://maps.google.com/?q=House+Of+Ginija,+Kapoorthala+Crossing,+Lucknow"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div style={visitUsCardStyle}>
            {/* Dark overlay */}
            <div style={visitUsOverlayStyle} />

            {/* Content */}
            <div style={visitUsContentStyle}>
              <h3 style={visitUsTitleStyle}>House of Ginija | Lucknow</h3>

              {/* Decorative divider */}
              <div style={visitUsDividerStyle}>
                <div style={visitUsDividerLineStyle} />
                <span style={visitUsDividerIconStyle}>✦</span>
                <div style={visitUsDividerLineStyle} />
              </div>

              <p style={visitUsAddressStyle}>Kapoorthala chauraha near mj jewels</p>

              <button style={visitUsButtonStyle} onClick={(e) => e.preventDefault()}>
                Visit Us
              </button>
            </div>
          </div>
        </a>
      </div>

      {/* Newsletter Container - matching continuous pink background */}
      <div style={newsletterContainerStyle} className="footer-newsletter">
        <div style={containerStyle}>
          <div style={newsletterSectionStyle}>
            <h4 style={newsletterTitleStyle} className="footer-newsletter-title">Newsletter Dispatch</h4>
            <div style={{
              width: '50px',
              height: '1px',
              backgroundColor: '#D98E9B',
              margin: '0.8rem auto 1.5rem auto'
            }} className="footer-newsletter-divider"></div>
            <p style={newsletterSubStyle} className="footer-newsletter-sub">
              Subscribe to receive behind-the-scenes insights, private collection previews, and invitations to our virtual trunk shows.
            </p>
            <form onSubmit={handleSubscribe} style={formStyle} className="footer-newsletter-form">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                className="footer-newsletter-input"
                required
                disabled={status === 'loading'}
              />
              <button type="submit" style={buttonStyle} className="footer-newsletter-btn" disabled={status === 'loading'}>
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {message && (
              <p style={status === 'success' ? successMsgStyle : errorMsgStyle}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Container with matching pink background */}
      <footer style={footerStyle}>
        <div style={containerStyle}>
          
          {/* Centered Gold HG Monogram + Tagline */}
          <div style={monogramContainerStyle} className="footer-monogram-section">
            <img 
              src="/brand_symbol_logo.png" 
              alt="House of Ginija Logo" 
              style={{ height: '65px', width: 'auto', objectFit: 'contain', margin: '0 auto 0.8rem auto', display: 'block' }} 
              className="footer-brand-logo"
              loading="lazy"
            />
            <p style={taglineTextStyle} className="footer-tagline-text">
              Made to last. Crafting high-end archival couture, focusing on slow fashion, premium tailoring, and dedicated master craftsmanship.
            </p>
          </div>

          {/* Collapsible Accordion Footer Rows */}
          <div style={accordionWrapperStyle} className="footer-accordion-wrapper">
            {accordionItems.map((item) => {
              const isOpen = !!openSections[item.id];
              return (
                <div key={item.id} style={accordionRowStyle} className="footer-accordion-row">
                  <button
                    type="button"
                    onClick={() => toggleSection(item.id)}
                    style={accordionHeaderBtnStyle}
                    className="footer-accordion-header"
                    aria-expanded={isOpen}
                  >
                    <span style={accordionTitleStyle}>{item.title}</span>
                    <span style={accordionIconStyle}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div style={accordionContentStyle} className="footer-accordion-content animate-fade-in">
                      {item.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Location Map Section */}
          <div style={mapSectionStyle} className="footer-map-section">
            <a 
              href="https://maps.google.com/?q=House+Of+Ginija,+Kapoorthala+Crossing,+Lucknow" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div 
                className="footer-map-container"
                style={{ 
                  width: '100%', 
                  height: '110px', 
                  borderRadius: '6px', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(217, 142, 155, 0.4)', 
                  boxShadow: '0 4px 15px rgba(217, 142, 155, 0.12)',
                  backgroundColor: '#FFFFFF',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 2,
                  backgroundColor: 'transparent'
                }} />
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3558.016335198083!2d80.94572517616113!3d26.882640576665796!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399bfd1ffd757c3d%3A0xe660482a34a6765e!2sHouse%20Of%20Ginija!5e0!3m2!1sen!2sin!4v1718000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </a>
          </div>

          {/* Copyright & Made with Heart */}
          <div style={copyrightSectionStyle}>
            <p style={{ margin: 0 }}>© 2026 House Of Ginija. All Rights Reserved.</p>
            <p style={{ margin: '0.4rem 0 0 0', color: '#D98E9B', fontWeight: '500' }}>
              Made with <span style={{ color: '#D98E9B' }}>♥</span> in India
            </p>
          </div>

        </div>
      </footer>
    </>
  );
}

// Inline styles for Accordion Footer & Continuous Pink Background
const newsletterContainerStyle = {
  backgroundColor: '#F6DDE2', // Continuous pink background matching footer
  padding: '2.5rem 1.5rem 1.5rem 1.5rem',
  borderTop: '1px solid rgba(139, 119, 137, 0.15)',
};

const newsletterSectionStyle = {
  textAlign: 'center',
  maxWidth: '520px',
  margin: '0 auto',
};

const newsletterTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '2.2rem',
  color: '#D98E9B',
  fontWeight: '400',
  marginBottom: '0.5rem',
};

const newsletterSubStyle = {
  fontSize: '0.85rem',
  color: '#000000',
  lineHeight: 1.5,
  marginBottom: '1.5rem',
  fontWeight: '400',
};

const formStyle = {
  display: 'flex',
  gap: '0.5rem',
};

const inputStyle = {
  flex: 1,
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(45, 36, 41, 0.2)',
  color: '#000000',
  borderRadius: '4px',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  outline: 'none',
};

const buttonStyle = {
  backgroundColor: '#D98E9B',
  color: '#FFFFFF',
  padding: '0.75rem 1.75rem',
  borderRadius: '4px',
  fontWeight: '600',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  border: 'none',
};

const successMsgStyle = {
  color: '#000000',
  fontSize: '0.85rem',
  marginTop: '0.8rem',
};

const errorMsgStyle = {
  color: '#000000',
  fontSize: '0.85rem',
  marginTop: '0.8rem',
};

const footerStyle = {
  backgroundColor: '#F6DDE2', // Continuous pink background matching newsletter
  color: '#000000',
  padding: '0.5rem 1.5rem 2rem 1.5rem',
  marginTop: '0',
};

const containerStyle = {
  maxWidth: '650px', // Centered accordion width matching design screenshot
  margin: '0 auto',
};

const monogramContainerStyle = {
  textAlign: 'center',
  padding: '1rem 0.5rem 1rem 0.5rem',
};

const taglineTextStyle = {
  fontSize: '0.82rem',
  lineHeight: '1.55',
  color: '#4A3B43',
  maxWidth: '460px',
  margin: '0 auto',
  textAlign: 'center',
};

const accordionWrapperStyle = {
  margin: '1.5rem 0',
  borderTop: '1px solid rgba(139, 119, 137, 0.18)',
};

const accordionRowStyle = {
  borderBottom: '1px solid rgba(139, 119, 137, 0.18)',
};

const accordionHeaderBtnStyle = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.9rem 0.25rem',
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  textAlign: 'left',
};

const accordionTitleStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.82rem',
  fontWeight: '700',
  letterSpacing: '0.08em',
  color: '#2D2429',
  textTransform: 'uppercase',
};

const accordionIconStyle = {
  fontSize: '1.2rem',
  fontWeight: '400',
  color: '#2D2429',
  lineHeight: '1',
};

const accordionContentStyle = {
  padding: '0.2rem 0.25rem 1rem 0.25rem',
};

const mapSectionStyle = {
  marginTop: '1.5rem',
  marginBottom: '1.5rem',
};

const copyrightSectionStyle = {
  borderTop: '1px solid rgba(139, 119, 137, 0.15)',
  paddingTop: '1.2rem',
  textAlign: 'center',
  fontSize: '0.75rem',
  color: 'rgba(0, 0, 0, 0.6)',
  letterSpacing: '0.04em',
};

// ── Visit Us / Location Banner ──
const visitUsSectionStyle = {
  padding: '2rem 1rem 2rem 1rem',
  backgroundColor: '#FFFFFF',
};

const visitUsCardStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: '650px',
  margin: '0 auto',
  borderRadius: '20px',
  overflow: 'hidden',
  backgroundImage: 'url(/images/store_photo.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  minHeight: '220px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const visitUsOverlayStyle = {
  position: 'absolute',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.42)',
  borderRadius: '20px',
};

const visitUsContentStyle = {
  position: 'relative',
  zIndex: 1,
  textAlign: 'center',
  padding: '2rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.6rem',
};

const visitUsTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.75rem',
  fontWeight: '400',
  color: '#FFFFFF',
  margin: 0,
  letterSpacing: '0.01em',
  lineHeight: 1.2,
};

const visitUsDividerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  width: '100%',
  maxWidth: '220px',
};

const visitUsDividerLineStyle = {
  flex: 1,
  height: '1px',
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
};

const visitUsDividerIconStyle = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '0.6rem',
};

const visitUsAddressStyle = {
  color: 'rgba(255, 255, 255, 0.92)',
  fontSize: '0.9rem',
  margin: 0,
  fontWeight: '400',
  letterSpacing: '0.01em',
};

const visitUsButtonStyle = {
  marginTop: '0.5rem',
  backgroundColor: '#FFFFFF',
  color: '#1a1a1a',
  border: 'none',
  borderRadius: '50px',
  padding: '0.75rem 2.5rem',
  fontSize: '0.95rem',
  fontWeight: '500',
  cursor: 'pointer',
  letterSpacing: '0.02em',
};
