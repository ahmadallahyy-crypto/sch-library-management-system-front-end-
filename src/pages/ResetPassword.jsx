import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/axios';
import '../styles/Login.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      // Go to reset page with email pre-filled
      setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(email)}`), 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-root">
      <div className="login-card" style={{ maxWidth: 460, minHeight: 'auto' }}>
        <div className="login-panel" style={{ flex: 1, padding: '48px 44px' }}>
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#0d0f14" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
            <span className="login-logo-text">Library<span>MS</span></span>
          </div>

          <h1 className="login-heading">Forgot password?</h1>
          <p className="login-sub">Enter your email and we'll send you a reset code.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {sent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--success-dim)', border: '1px solid #3ecf8e30', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.85rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Reset code sent! Redirecting…
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" className="input"
                placeholder="you@library.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading || sent}>
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.85rem', cursor: 'pointer' }}>
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}