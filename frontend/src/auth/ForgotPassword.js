import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: otp+new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/profile-complete');
    }
  }, [navigate]);

  const handleEmailSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send OTP');
      setMessage('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to reset password');
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center' }}>Forgot Password</h2>
      {step === 1 && (
        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 8, padding: 8 }}
          />
          <button type="submit" style={{ width: '100%', padding: 10 }} disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleResetSubmit}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 8, padding: 8 }}
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 8, padding: 8 }}
          />
          <button type="submit" style={{ width: '100%', padding: 10 }} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
      {error && <div style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>{error}</div>}
      {message && <div style={{ color: 'green', marginTop: 12, textAlign: 'center' }}>{message}</div>}
    </div>
  );
} 