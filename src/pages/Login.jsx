import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]         = useState({ email: '', password: '', remember: false });
  const [errors, setErrors]     = useState({ email: '', password: '' });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = { email: '', password: '' };
    if (!form.email)                          e.email    = 'Please enter a valid email address';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Please enter a valid email address';
    if (!form.password)                       e.password = 'This field cannot be blank';
    setErrors(e);
    return !e.email && !e.password;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-root">

      {/* ── Top navbar ── */}
      <nav className="login-nav">
        <Link to="/login" className="login-nav-logo">
          <div className="login-nav-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#0d0f14" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <span className="login-nav-logo-text">Library<span>MS</span></span>
        </Link>
      </nav>

      {/* ── Centered form ── */}
      <div className="login-body">
        <div className="login-box">
          <h1 className="login-heading">Welcome!</h1>

          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {apiError && (
              <div className="login-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {apiError}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email" name="email" type="email"
                className={`input${errors.email ? ' input-error' : ''}`}
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                autoFocus
              />
              {errors.email && <span className="field-msg">{errors.email}</span>}
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                className={`input${errors.password ? ' input-error' : ''}`}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && <span className="field-msg">{errors.password}</span>}
            </div>

            <div className="login-bottom-row">
              <label className="remember-row">
                <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} />
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="login-footer">
        LibraryMS &copy; {new Date().getFullYear()} — All rights reserved
      </footer>

    </div>
  );
}