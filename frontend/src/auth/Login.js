import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ContinueWithGoogle from './ContinueWithGoogle';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/profile-complete');
    }
  }, [navigate]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      navigate('/profile-complete');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center' }}>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required style={{ width: '100%', marginBottom: 8, padding: 8 }} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required style={{ width: '100%', marginBottom: 8, padding: 8 }} />
        <button type="submit" style={{ width: '100%', padding: 10 }} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <ContinueWithGoogle />
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <Link to="/signup">Don't have an account? Sign up</Link>
      </div>
      {error && <div style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>{error}</div>}
    </div>
  );
} 