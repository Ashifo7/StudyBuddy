import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('/api/interactions/my-mutual', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setMatches(data.users);
        else setMessage(data.error || 'Could not fetch matches');
        setLoading(false);
      })
      .catch(() => {
        setMessage('Could not fetch matches');
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 10, background: '#fafbfc', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <button onClick={() => navigate('/home')} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333', fontWeight: 500, cursor: 'pointer' }}>Home</button>
        <button onClick={handleLogout} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333', fontWeight: 500, cursor: 'pointer' }}>Logout</button>
      </div>
      <h2 style={{ textAlign: 'center', marginBottom: 24, fontWeight: 400 }}>Your Matches</h2>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>Loading matches...</div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', fontSize: 18, marginTop: 60 }}>No matches yet.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 0 }}>
          {matches.map(u => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', padding: '16px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', transition: 'background 0.2s' }}>
              <img src={u.profilePic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name)} alt="Profile" style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', marginRight: 16, border: '2px solid #007bff' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 18 }}>{u.name}</div>
                <div style={{ color: '#888', fontSize: 14 }}>Last message: <span style={{ color: '#bbb' }}>(coming soon)</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {message && <div style={{ marginTop: 16, color: 'red', textAlign: 'center' }}>{message}</div>}
    </div>
  );
} 