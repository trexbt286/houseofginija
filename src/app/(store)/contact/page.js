'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState(''); // 'loading', 'success', 'error'
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus('loading');

    // Simulate sending contact message
    setTimeout(() => {
      setStatus('success');
      setSuccessMsg('Your message has been received. Our concierge will contact you within 24 hours.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    }, 1500);
  };

  return (
    <div style={pageStyle} className="container animate-fade-in">
      {/* Header */}
      <section style={headerSectionStyle}>
        <span style={subHeaderStyle}>Client Services</span>
        <h1 style={titleStyle}>Contact Us</h1>
        <div style={dividerStyle}></div>
      </section>

      <div style={layoutGridStyle}>
        {/* Info Column */}
        <div style={infoColStyle}>
          <h3 style={sectionTitleStyle}>Client Inquiries</h3>
          <p style={descStyle}>
            For bespoke fitting adjustments, order tracking, private boutique viewing reservations, or sizing guidance, our concierge is at your disposal.
          </p>

          <div style={contactListStyle}>
            <div style={contactItemStyle}>
              <strong style={contactLabelStyle}>Flagship Studio</strong>
              <span style={contactValueStyle}>M J Jewels, Kapoorthala Crossing, Sector F, Chandralok, Lucknow, India</span>
            </div>
            <div style={contactItemStyle}>
              <strong style={contactLabelStyle}>Concierge Hours</strong>
              <span style={contactValueStyle}>Monday — Saturday: 11:00 AM — 8:00 PM IST</span>
            </div>
            <div style={contactItemStyle}>
              <strong style={contactLabelStyle}>Electronic Mail</strong>
              <span style={contactValueStyle}>concierge@houseofginija.com</span>
            </div>
            <div style={contactItemStyle}>
              <strong style={contactLabelStyle}>Telecommunication</strong>
              <span style={contactValueStyle}>+91 7080806053</span>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div style={formColStyle}>
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={formRowStyle}>
              <div style={{ ...formGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                  disabled={status === 'loading'}
                />
              </div>
            </div>

            <div style={formRowStyle}>
              <div style={{ ...formGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                  disabled={status === 'loading'}
                />
              </div>
            </div>

            <div style={formRowStyle}>
              <div style={{ ...formGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={status === 'loading'}
                />
              </div>
            </div>

            <div style={formRowStyle}>
              <div style={{ ...formGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  style={textareaStyle}
                  required
                  rows="5"
                  disabled={status === 'loading'}
                ></textarea>
              </div>
            </div>

            {status === 'success' && <p style={successStyle}>{successMsg}</p>}

            <button
              type="submit"
              style={status === 'loading' ? disabledBtnStyle : btnStyle}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Sending Message...' : 'Submit Inquiry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Inline styles for Contact Page
const pageStyle = {
  paddingTop: '3rem',
  paddingBottom: '6rem',
  backgroundColor: '#FFFFFF',
};

const headerSectionStyle = {
  textAlign: 'center',
  padding: '2rem 1rem 3rem 1rem',
};

const subHeaderStyle = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  color: '#000000',
  fontWeight: '600',
  display: 'block',
  marginBottom: '0.5rem',
};

const titleStyle = {
  fontSize: '2.8rem',
  fontFamily: 'var(--font-serif)',
  color: '#D98E9B',
  fontWeight: '400',
};

const dividerStyle = {
  width: '60px',
  height: '1px',
  backgroundColor: '#D98E9B',
  margin: '1.2rem auto 0 auto',
};

const layoutGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1.2fr',
  gap: '4rem',
  marginTop: '2rem',
  alignItems: 'start',
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
    gap: '2.5rem',
  },
};

const infoColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const sectionTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.8rem',
  color: '#D98E9B',
  fontWeight: '400',
};

const descStyle = {
  fontSize: '0.92rem',
  lineHeight: 1.6,
  color: '#000000',
};

const contactListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
  marginTop: '1rem',
};

const contactItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
};

const contactLabelStyle = {
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#000000',
};

const contactValueStyle = {
  fontSize: '0.92rem',
  fontWeight: '600',
  color: '#000000',
};

const formColStyle = {
  backgroundColor: '#FFFFFF',
  padding: '2.5rem',
  borderRadius: '8px',
  border: '1px solid rgba(139, 119, 137, 0.12)',
  boxShadow: 'var(--shadow-sm)',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
};

const formRowStyle = {
  display: 'flex',
  gap: '1rem',
  width: '100%',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const labelStyle = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#000000',
  fontWeight: '700',
};

const inputStyle = {
  padding: '0.75rem',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  borderRadius: '4px',
};

const textareaStyle = {
  padding: '0.75rem',
  border: '1px solid rgba(139, 119, 137, 0.25)',
  borderRadius: '4px',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.95rem',
  width: '100%',
  outline: 'none',
};

const successStyle = {
  color: '#000000',
  fontSize: '0.85rem',
  fontWeight: '600',
};

const btnStyle = {
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.9rem',
  fontSize: '0.85rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  borderRadius: '4px',
  boxShadow: 'var(--shadow-sm)',
  marginTop: '0.5rem',
};

const disabledBtnStyle = {
  ...btnStyle,
  backgroundColor: 'rgba(60, 48, 58, 0.15)',
  color: '#000000',
  cursor: 'not-allowed',
};
