'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

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

  return (
    <>
      {/* Top: Newsletter Sign up with white background */}
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

      {/* Main Footer with pink background */}
      <footer style={footerStyle} className="storefront-footer">
        <div style={containerStyle}>
          {/* Bottom: Footer Columns */}
          <div style={footerGridStyle} className="footer-grid">
            {/* Col 1: Brand Story */}
            <div style={colStyle} className="footer-brand-col">
              <img 
                src="/brand_symbol_logo.png" 
                alt="House of Ginija Logo" 
                style={{ height: '65px', width: 'auto', objectFit: 'contain', alignSelf: 'flex-start', marginBottom: '0.4rem' }} 
                className="footer-brand-logo"
                loading="lazy"
              />
              <p style={aboutTextStyle} className="footer-brand-text">
                Made to last. Crafting high-end archival couture, focusing on slow fashion, premium tailoring, and dedicated master craftsmanship.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div style={colStyle} className="footer-exploration-col">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h5 style={colTitleStyle}>Exploration</h5>
                <ul style={listStyle}>
                  <li><Link href="/collections" style={linkStyle}>All Collections</Link></li>
                  <li><Link href="/about" style={linkStyle}>Our Story</Link></li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h5 style={colTitleStyle}>Follow Us</h5>
                <ul style={listStyle}>
                  <li>
                    <a 
                      href="https://www.instagram.com/houseof_ginija" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D98E9B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', color: '#D98E9B' }}>
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                      <span>Instagram</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Col 3: Customer Care & Policies */}
            <div style={colStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h5 style={colTitleStyle}>Client Services</h5>
                <ul style={listStyle}>
                  <li><Link href="/contact" style={linkStyle}>Contact Us</Link></li>
                  <li><Link href="/shipping-returns" style={linkStyle}>Shipping & Returns</Link></li>
                  <li><Link href="/privacy-policy" style={linkStyle}>Privacy & Cookies</Link></li>
                  <li><Link href="/terms" style={linkStyle}>Terms & Conditions</Link></li>
                </ul>
              </div>
            </div>

            {/* Col 4: Location Map */}
            <div style={colStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h5 style={colTitleStyle}>location</h5>
                <p style={{ ...aboutTextStyle, marginBottom: '0.2rem', fontSize: '0.8rem', lineHeight: '1.4', color: '#000000' }}>
                  M J Jewels, Kapoorthala Crossing, Sector F, Chandralok, Lucknow, India
                </p>
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
                      height: '120px', 
                      borderRadius: '4px', 
                      overflow: 'hidden', 
                      border: '1px solid rgba(217, 142, 155, 0.5)', 
                      boxShadow: '0 4px 15px rgba(217, 142, 155, 0.15)',
                      backgroundColor: '#FFFFFF',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Invisible overlay to capture click events and bubble up redirects cleanly */}
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
            </div>
          </div>

          {/* Copyright */}
          <div style={copyrightSectionStyle}>
            <p>© 2026 House Of Ginija. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

// Inline styles for Footer
const footerStyle = {
  backgroundColor: '#F6DDE2', // Light Blush
  color: '#000000', // Deep Plum-Brown
  padding: '1.5rem 2rem 1rem 2rem',
  marginTop: 'auto',
  borderTop: '1px solid #D98E9B', // Pink border
};

const containerStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
};

const newsletterContainerStyle = {
  backgroundColor: '#FFFFFF',
  padding: '3rem 2rem 3rem 2rem',
  borderTop: '1px solid rgba(139, 119, 137, 0.15)',
};

const newsletterSectionStyle = {
  textAlign: 'center',
  maxWidth: '520px',
  margin: '0 auto',
};

const newsletterTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '2.5rem',
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
  backgroundColor: '#FFFFFF', // Gold Accent
  color: '#000000',
  padding: '0.75rem 1.75rem',
  borderRadius: '4px',
  fontWeight: '600',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
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

const footerGridStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
  gap: '2.5rem',
  paddingBottom: '1rem',
  '@media (maxWidth: 768px)': {
    gridTemplateColumns: '1fr',
    gap: '2.5rem',
  },
};

const colStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
};

const logoStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.4rem',
  fontWeight: '600',
  letterSpacing: '0.15em',
  color: '#000000',
};

const aboutTextStyle = {
  fontSize: '0.85rem',
  lineHeight: 1.6,
  color: '#000000',
};

const socialsStyle = {
  display: 'flex',
  gap: '1rem',
};

const socialLinkStyle = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#000000',
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
};

const colTitleStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#000000',
  fontWeight: '700',
  borderBottom: '1px solid rgba(45, 36, 41, 0.1)',
  paddingBottom: '0.5rem',
};

const listStyle = {
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const linkStyle = {
  fontSize: '0.85rem',
  color: '#000000',
};

const footerAccentLinkStyle = {
  ...linkStyle,
  color: '#000000',
};

const copyrightSectionStyle = {
  borderTop: '1px solid rgba(45, 36, 41, 0.1)',
  paddingTop: '0.8rem',
  textAlign: 'center',
  fontSize: '0.72rem',
  color: 'rgba(0, 0, 0, 0.5)',
  letterSpacing: '0.06em',
};
