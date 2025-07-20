import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ContinueWithGoogle from './ContinueWithGoogle';
import { ensureUserKeyPair } from './keyManager';

export default function Signup() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '',
    password: ''
  });
  const [step, setStep] = useState(1); // 1: form, 2: otp
  const [otp, setOtp] = useState('');
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
      // Compose name
      const name = form.firstName + ' ' + form.lastName;
      // Compose payload
      const payload = {
        name,
        email: form.email,
        password: form.password,
        subjectsInterested: ['General'], // placeholder
        studyTime: 'evening', // placeholder
        location: {
          state: '', city: '', coordinates: { type: 'Point', coordinates: [0,0] }, formattedAddress: ''
        },
        personalInfo: {
          age: Number(form.age),
          gender: form.gender
        }
      };
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Registration failed');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleOtpSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/users/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'OTP verification failed');
      localStorage.setItem('token', data.token);
      await ensureUserKeyPair(data.token);
      navigate('/profile-complete');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center' }}>Sign Up</h2>
      {step === 1 && (
        <form onSubmit={handleSubmit}>
          <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required style={{ width: '100%', marginBottom: 8, padding: 8 }} />
          <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required style={{ width: '100%', marginBottom: 8, padding: 8 }} />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required style={{ width: '100%', marginBottom: 8, padding: 8 }} />
          <input name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} required style={{ width: '100%', marginBottom: 8, padding: 8 }} />
          <select name="gender" value={form.gender} onChange={handleChange} required style={{ width: '100%', marginBottom: 8, padding: 8 }}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="confused">Confused</option>
          </select>
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required style={{ width: '100%', marginBottom: 8, padding: 8 }} />
          <button type="submit" style={{ width: '100%', padding: 10 }} disabled={loading}>{loading ? 'Registering...' : 'Sign Up'}</button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleOtpSubmit}>
          <input name="otp" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} required style={{ width: '100%', marginBottom: 8, padding: 8 }} />
          <button type="submit" style={{ width: '100%', padding: 10 }} disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
        </form>
      )}
      <ContinueWithGoogle />
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <Link to="/login">Already have an account? Login</Link>
      </div>
      {error && <div style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>{error}</div>}
    </div>
  );
} 