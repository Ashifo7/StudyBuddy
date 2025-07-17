import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/profile-complete');
    } else if (error === 'email_exists') {
      navigate('/login?error=email_exists');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{textAlign: 'center', marginTop: 40}}>
      Processing Google login...
    </div>
  );
} 