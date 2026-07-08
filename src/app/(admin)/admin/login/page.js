'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const { login, user, loading } = useStore();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        setFormError('Access Denied: Admin credentials required.');
      }
    }
  }, [user, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        if (data.user.role === 'admin') {
          login(data.user);
          router.push('/admin/dashboard');
        } else {
          setFormError('Access Denied: This account is not registered as an administrator.');
        }
      } else {
        setFormError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      console.error(err);
      setFormError('An error occurred. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div style={loadingContainerStyle}>Accessing secured portal...</div>;
  }

  return (
    <div style={pageStyle} className="animate-fade-in">
      <div style={cardStyle}>
        <span style={subtitleStyle}>Admin Portal</span>
        <h1 style={titleStyle}>Admin Sign In</h1>
        <div style={dividerStyle}></div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Administrator Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
              placeholder="admin@houseofginija.com"
              disabled={formLoading}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Security Password</label>
             <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
               <input
                 type={showPassword ? 'text' : 'password'}
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 style={{ ...inputStyle, width: '100%', paddingRight: '2.5rem', boxSizing: 'border-box' }}
                 required
                 placeholder="••••••••"
                 disabled={formLoading}
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 style={{
                   position: 'absolute',
                   right: '0.75rem',
                   background: 'none',
                   border: 'none',
                   cursor: 'pointer',
                   color: 'rgba(0, 0, 0, 0.4)',
                   padding: 0,
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                 }}
               >
                 {showPassword ? (
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                     <line x1="1" y1="1" x2="23" y2="23"></line>
                   </svg>
                 ) : (
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                     <circle cx="12" cy="12" r="3"></circle>
                   </svg>
                 )}
               </button>
             </div>
          </div>

          {formError && <p style={errorStyle}>{formError}</p>}

          <button
            type="submit"
            style={formLoading ? disabledBtnStyle : btnStyle}
            disabled={formLoading}
          >
            {formLoading ? 'Verifying Admin...' : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Inline styles for Admin Login Page
const pageStyle = {
  minHeight: '80vh',
  backgroundColor: '#FFFFFF', // Dark background for admin login
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
};

const loadingContainerStyle = {
  textAlign: 'center',
  padding: '10rem 0',
  color: '#000000',
  fontSize: '1.2rem',
  fontFamily: 'var(--font-serif)',
};

const cardStyle = {
  maxWidth: '420px',
  width: '100%',
  backgroundColor: '#FFFFFF', // Light card
  padding: '3rem 2.5rem',
  borderRadius: '8px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
  textAlign: 'center',
};

const subtitleStyle = {
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: '#D98E9B',
  fontWeight: '600',
  display: 'block',
  marginBottom: '0.5rem',
};

const titleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '2rem',
  color: '#D98E9B',
  fontWeight: '400',
};

const dividerStyle = {
  width: '50px',
  height: '1px',
  backgroundColor: '#D98E9B',
  margin: '1.2rem auto 2.2rem auto',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
  textAlign: 'left',
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

const errorStyle = {
  color: '#000000',
  fontSize: '0.8rem',
  textAlign: 'center',
  marginTop: '0.4rem',
  fontWeight: '600',
};

const btnStyle = {
  width: '100%',
  backgroundColor: '#D98E9B',
  color: '#000000',
  padding: '0.9rem',
  fontSize: '0.85rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  borderRadius: '4px',
  marginTop: '0.5rem',
  boxShadow: 'var(--shadow-sm)',
};

const disabledBtnStyle = {
  ...btnStyle,
  backgroundColor: 'rgba(60, 48, 58, 0.15)',
  color: '#000000',
  cursor: 'not-allowed',
  boxShadow: 'none',
};
