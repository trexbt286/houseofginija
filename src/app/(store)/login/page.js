'use client';

import { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/context/StoreContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
  const { login, user, loading, setIsLoginOpen } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoginOpen(true);
    router.replace('/');
  }, [setIsLoginOpen, router]);

  const [loginType, setLoginType] = useState('customer'); // 'customer' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/account';

  // Clear fields and errors when switching tabs
  useEffect(() => {
    setEmail('');
    setPassword('');
    setFormError('');
  }, [loginType]);

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push(redirectUrl);
      }
    }
  }, [user, loading, redirectUrl, router]);

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
        if (loginType === 'admin') {
          if (data.user.role === 'admin') {
            login(data.user);
            router.push('/admin/dashboard');
          } else {
            setFormError('Access Denied: Admin credentials required.');
          }
        } else {
          login(data.user);
          router.push(redirectUrl);
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
    return <div style={loadingContainerStyle}>Authenticating secure portal...</div>;
  }

  return (
    <div style={pageStyle} className="container animate-fade-in">
      <div style={cardStyle}>
        {/* Back Button (styled like filter and cart drawer dismiss button) */}
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '1.25rem',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(139, 119, 137, 0.15)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            padding: 0,
            color: '#000000',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <h1 style={titleStyle}>Sign In</h1>
        <div style={dividerStyle}></div>
 
        {/* Tab Selector */}
        <div style={tabsContainerStyle}>
          <button
            type="button"
            onClick={() => setLoginType('customer')}
            style={loginType === 'customer' ? activeTabStyle : tabStyle}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Customer
          </button>
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            style={loginType === 'admin' ? activeTabStyle : tabStyle}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Admin
          </button>
        </div>
 
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              {loginType === 'admin' ? 'Administrator Email' : 'Email Address'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1rem' }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, width: '100%', paddingLeft: '2.8rem', boxSizing: 'border-box' }}
                required
                placeholder="Enter email address"
                disabled={formLoading}
              />
            </div>
          </div>
 
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              {loginType === 'admin' ? 'Security Password' : 'Password'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1rem' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, width: '100%', paddingLeft: '2.8rem', paddingRight: '2.8rem', boxSizing: 'border-box' }}
                required
                placeholder="Enter password"
                disabled={formLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            {formLoading 
              ? (loginType === 'admin' ? 'Verifying Admin...' : 'Verifying Client...') 
              : 'Sign In'}
          </button>
        </form>
        {loginType === 'customer' && (
          <>
            {/* OR Visual Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.8rem 0 1.2rem 0', width: '100%' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(139, 119, 137, 0.15)' }}></div>
              <span style={{ padding: '0 1rem', fontSize: '0.7rem', color: '#D98E9B', fontWeight: '700', letterSpacing: '0.05em' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(139, 119, 137, 0.15)' }}></div>
            </div>
     
            <div style={footerStyle}>
              <span>New customer to our house?</span>
              <Link href={`/signup${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`} style={linkStyle}>
                Create an Account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading Sign In...</div>}>
      <LoginContent />
    </Suspense>
  );
}

// Inline styles for Login Page
const pageStyle = {
  paddingTop: '6rem',
  paddingBottom: '8rem',
  background: 'linear-gradient(135deg, #FBF0EC 0%, #F5E5E8 100%)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '85vh',
};

const loadingContainerStyle = {
  textAlign: 'center',
  padding: '10rem 0',
  color: '#000000',
  fontSize: '1.2rem',
  fontFamily: 'var(--font-serif)',
};

const cardStyle = {
  position: 'relative',
  maxWidth: '450px',
  width: 'calc(100% - 2.5rem)',
  backgroundColor: '#FFFFFF',
  padding: '3.5rem 2.5rem 3rem 2.5rem',
  borderRadius: '16px',
  boxShadow: '0 20px 40px rgba(74, 52, 57, 0.05)',
  border: '1px solid rgba(139, 119, 137, 0.08)',
  textAlign: 'center',
  boxSizing: 'border-box',
};

const titleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '2rem',
  color: '#B65C73',
  fontWeight: '400',
};

const dividerStyle = {
  width: '45px',
  height: '1.5px',
  backgroundColor: '#D98E9B',
  margin: '1.2rem auto 2.2rem auto',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.4rem',
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
  padding: '0.85rem 1rem',
  border: '1px solid rgba(139, 119, 137, 0.2)',
  borderRadius: '8px',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
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
  backgroundColor: '#C16C7D',
  color: '#FFFFFF',
  padding: '0.95rem',
  fontSize: '0.85rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  borderRadius: '8px',
  marginTop: '0.8rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(193, 108, 125, 0.15)',
};

const disabledBtnStyle = {
  ...btnStyle,
  backgroundColor: 'rgba(60, 48, 58, 0.15)',
  color: '#000000',
  cursor: 'not-allowed',
  boxShadow: 'none',
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '0.4rem',
  fontSize: '0.8rem',
  color: '#000000',
  marginTop: '1.2rem',
};

const linkStyle = {
  color: '#C16C7D',
  fontWeight: '700',
  textDecoration: 'underline',
};

const tabsContainerStyle = {
  display: 'flex',
  backgroundColor: '#FBF0EC',
  borderRadius: '30px',
  padding: '4px',
  marginBottom: '2rem',
  border: '1px solid rgba(139, 119, 137, 0.08)',
};

const tabStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.6rem 1rem',
  borderRadius: '26px',
  border: 'none',
  backgroundColor: 'transparent',
  color: 'rgba(0, 0, 0, 0.6)',
  fontSize: '0.75rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const activeTabStyle = {
  ...tabStyle,
  backgroundColor: '#C16C7D',
  color: '#FFFFFF',
  boxShadow: '0 4px 10px rgba(193, 108, 125, 0.2)',
};
