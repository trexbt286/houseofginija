'use client';

import { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/context/StoreContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignupContent() {
  const { login, user, loading } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/account';

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user) {
      router.push(redirectUrl);
    }
  }, [user, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        login(data.user);
        router.push(redirectUrl);
      } else {
        setFormError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setFormError('An error occurred. Please check your network and try again.');
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
        <span style={subtitleStyle}>Client Registration</span>
        <h1 style={titleStyle}>Create Account</h1>
        <div style={dividerStyle}></div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              required
              placeholder="Aria Sharma"
              disabled={formLoading}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
              placeholder="client@houseofginija.com"
              disabled={formLoading}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
              placeholder="At least 6 characters"
              disabled={formLoading}
            />
          </div>

          {formError && <p style={errorStyle}>{formError}</p>}

          <button
            type="submit"
            style={formLoading ? disabledBtnStyle : btnStyle}
            disabled={formLoading}
          >
            {formLoading ? 'Registering Client...' : 'Create Account'}
          </button>
        </form>

        <div style={footerStyle}>
          <span>Already registered with us?</span>
          <Link href={`/login${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`} style={linkStyle}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading Registration...</div>}>
      <SignupContent />
    </Suspense>
  );
}

// Inline styles for Signup Page (matching Login Page exactly)
const pageStyle = {
  paddingTop: '5rem',
  paddingBottom: '7rem',
  backgroundColor: '#FFFFFF',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const loadingContainerStyle = {
  textAlign: 'center',
  padding: '10rem 0',
  color: '#000000',
  fontSize: '1.2rem',
  fontFamily: 'var(--font-serif)',
};

const cardStyle = {
  maxWidth: '450px',
  width: '100%',
  backgroundColor: '#FFFFFF',
  padding: '3rem 2.5rem',
  borderRadius: '8px',
  boxShadow: 'var(--shadow-md)',
  border: '1px solid rgba(139, 119, 137, 0.12)',
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

const footerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '0.4rem',
  fontSize: '0.8rem',
  color: '#000000',
  marginTop: '1.8rem',
};

const linkStyle = {
  color: '#000000',
  fontWeight: '600',
  textDecoration: 'underline',
};
