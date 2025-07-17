import React from 'react';

export default function ContinueWithGoogle() {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/users/google';
  };
  return (
    <button
      onClick={handleGoogleLogin}
      style={{
        width: '100%',
        padding: 10,
        margin: '12px 0',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 500
      }}
    >
      <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google" style={{ width: 20, height: 20, marginRight: 8 }} />
      Continue with Google
    </button>
  );
} 