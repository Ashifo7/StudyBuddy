import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

function getUniqueOptions(users, fieldPath) {
  // fieldPath: e.g. 'personalInfo.gender' or 'subjectsInterested'
  const values = new Set();
  users.forEach(u => {
    let val = u;
    for (const key of fieldPath.split('.')) {
      if (val && typeof val === 'object') val = val[key];
      else val = undefined;
    }
    if (Array.isArray(val)) val.forEach(v => values.add(v));
    else if (val) values.add(val);
  });
  return Array.from(values).filter(Boolean);
}

export default function Home() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [interactions, setInteractions] = useState([]); // {targetUserId, type}
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [showRated, setShowRated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    Promise.all([
      fetch('/api/users/recommendations', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('/api/interactions/my', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ])
      .then(([rec, ints]) => {
        if (rec.success) setUsers(rec.users);
        else setMessage(rec.error || 'Could not fetch recommendations');
        if (ints.success) setInteractions(ints.interactions || []);
        setLoading(false);
      })
      .catch(() => {
        setMessage('Could not fetch recommendations');
        setLoading(false);
      });
  }, [navigate]);

  // Build a map of rated userIds to type
  const ratedMap = useMemo(() => {
    const map = {};
    interactions.forEach(i => {
      if (i.targetUserId?._id) map[i.targetUserId._id] = i.type;
      else if (typeof i.targetUserId === 'string') map[i.targetUserId] = i.type;
    });
    return map;
  }, [interactions]);

  // Filtering logic
  const filteredUsers = useMemo(() => {
    let filtered = users;
    // Apply filters
    Object.entries(filters).forEach(([key, val]) => {
      if (!val) return;
      filtered = filtered.filter(u => {
        let fieldVal = u;
        for (const k of key.split('.')) {
          if (fieldVal && typeof fieldVal === 'object') fieldVal = fieldVal[k];
          else fieldVal = undefined;
        }
        if (Array.isArray(fieldVal)) return fieldVal.includes(val);
        return fieldVal === val;
      });
    });
    // Hide rated users unless showRated is on
    if (!showRated) {
      filtered = filtered.filter(u => !ratedMap[u._id]);
    }
    return filtered;
  }, [users, filters, showRated, ratedMap]);

  // For rated users list (filtered)
  const ratedUsers = useMemo(() => {
    let filtered = users.filter(u => ratedMap[u._id]);
    // Apply filters
    Object.entries(filters).forEach(([key, val]) => {
      if (!val) return;
      filtered = filtered.filter(u => {
        let fieldVal = u;
        for (const k of key.split('.')) {
          if (fieldVal && typeof fieldVal === 'object') fieldVal = fieldVal[k];
          else fieldVal = undefined;
        }
        if (Array.isArray(fieldVal)) return fieldVal.includes(val);
        return fieldVal === val;
      });
    });
    return filtered;
  }, [users, ratedMap, filters]);

  // Unique options for filters
  const subjectOptions = useMemo(() => getUniqueOptions(users, 'subjectsInterested'), [users]);
  const languageOptions = useMemo(() => getUniqueOptions(users, 'personalInfo.languages'), [users]);
  const genderOptions = useMemo(() => getUniqueOptions(users, 'personalInfo.gender'), [users]);
  const cityOptions = useMemo(() => getUniqueOptions(users, 'location.city'), [users]);
  const stateOptions = useMemo(() => getUniqueOptions(users, 'location.state'), [users]);
  const studyTimeOptions = useMemo(() => getUniqueOptions(users, 'studyTime'), [users]);

  const [filterInput, setFilterInput] = useState({});

  // Index for filtered users
  const [filteredIndex, setFilteredIndex] = useState(0);
  useEffect(() => { setFilteredIndex(0); }, [filteredUsers.length, filters, showRated]);

  const current = filteredUsers[filteredIndex];

  const handleAction = async (type, userId) => {
    setActionLoading(true);
    const token = localStorage.getItem('token');
    await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUserId: userId, type })
    });
    // Refresh interactions
    const ints = await fetch('/api/interactions/my', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
    if (ints.success) setInteractions(ints.interactions || []);
    setActionLoading(false);
    // Move to next card if in recommendations
    if (!showRated) setFilteredIndex(i => i + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading recommendations...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, background: '#fafbfc', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <button onClick={() => navigate('/profile-complete')} style={{ marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333', fontWeight: 500, cursor: 'pointer' }}>Profile</button>
          <button onClick={() => navigate('/matches')} style={{ marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333', fontWeight: 500, cursor: 'pointer' }}>Message Matches</button>
        </div>
        <button onClick={handleLogout} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333', fontWeight: 500, cursor: 'pointer' }}>Logout</button>
      </div>
      {/* Filter UI */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div>
          <label>Subject:<br />
            <input list="subject-list" value={filterInput.subjectsInterested || ''} onChange={e => { setFilterInput(f => ({ ...f, subjectsInterested: e.target.value })); setFilters(f => ({ ...f, subjectsInterested: e.target.value })); }} style={{ width: 120 }} placeholder="Any" />
            <datalist id="subject-list">{subjectOptions.map(opt => <option key={opt} value={opt} />)}</datalist>
          </label>
        </div>
        <div>
          <label>Language:<br />
            <select value={filterInput['personalInfo.languages'] || ''} onChange={e => { setFilterInput(f => ({ ...f, 'personalInfo.languages': e.target.value })); setFilters(f => ({ ...f, 'personalInfo.languages': e.target.value })); }} style={{ width: 120 }}>
              <option value="">Any</option>
              {languageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label>Gender:<br />
            <select value={filterInput['personalInfo.gender'] || ''} onChange={e => { setFilterInput(f => ({ ...f, 'personalInfo.gender': e.target.value })); setFilters(f => ({ ...f, 'personalInfo.gender': e.target.value })); }} style={{ width: 100 }}>
              <option value="">Any</option>
              {genderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label>City:<br />
            <input list="city-list" value={filterInput['location.city'] || ''} onChange={e => { setFilterInput(f => ({ ...f, 'location.city': e.target.value })); setFilters(f => ({ ...f, 'location.city': e.target.value })); }} style={{ width: 120 }} placeholder="Any" />
            <datalist id="city-list">{cityOptions.map(opt => <option key={opt} value={opt} />)}</datalist>
          </label>
        </div>
        <div>
          <label>State:<br />
            <input list="state-list" value={filterInput['location.state'] || ''} onChange={e => { setFilterInput(f => ({ ...f, 'location.state': e.target.value })); setFilters(f => ({ ...f, 'location.state': e.target.value })); }} style={{ width: 120 }} placeholder="Any" />
            <datalist id="state-list">{stateOptions.map(opt => <option key={opt} value={opt} />)}</datalist>
          </label>
        </div>
        <div>
          <label>Study Time:<br />
            <input list="studytime-list" value={filterInput['studyTime'] || ''} onChange={e => { setFilterInput(f => ({ ...f, 'studyTime': e.target.value })); setFilters(f => ({ ...f, 'studyTime': e.target.value })); }} style={{ width: 120 }} placeholder="Any" />
            <datalist id="studytime-list">{studyTimeOptions.map(opt => <option key={opt} value={opt} />)}</datalist>
          </label>
        </div>
        <div>
          <label style={{ fontWeight: 500, marginLeft: 12 }}>
            <input type="checkbox" checked={showRated} onChange={e => setShowRated(e.target.checked)} style={{ marginRight: 4 }} /> Show Rated Users
          </label>
        </div>
        <div>
          <button onClick={() => { setFilters({}); setFilterInput({}); }} style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Clear Filters</button>
        </div>
      </div>
      {/* Recommendations or Rated Users */}
      {!showRated ? (
        current ? (
          <div style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            borderRadius: 16,
            background: '#fff',
            padding: 24,
            marginBottom: 24,
            textAlign: 'center',
            position: 'relative',
            minHeight: 340
          }}>
            {current.profilePic && <img src={current.profilePic} alt="Profile" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: 16, border: '3px solid #007bff' }} />}
            <h3 style={{ margin: '8px 0 4px 0', fontWeight: 500 }}>{current.name}</h3>
            <div style={{ color: '#555', marginBottom: 8 }}>
              {current.personalInfo?.age && <span>{current.personalInfo.age} yrs</span>}
              {current.personalInfo?.gender && <span> &middot; {current.personalInfo.gender}</span>}
            </div>
            <div style={{ color: '#555', marginBottom: 8 }}>
              {current.location?.city && <span>{current.location.city}</span>}
              {current.location?.state && <span>{current.location.city ? ', ' : ''}{current.location.state}</span>}
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 500, color: '#007bff' }}>Subjects:</span> {Array.isArray(current.subjectsInterested) ? current.subjectsInterested.join(', ') : ''}
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 500, color: '#007bff' }}>Languages:</span> {Array.isArray(current.personalInfo?.languages) ? current.personalInfo.languages.join(', ') : ''}
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 500, color: '#007bff' }}>Study Time:</span> {current.studyTime || 'N/A'}
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => handleAction('dislike', current._id)}
                disabled={actionLoading}
                style={{ width: 120, padding: 12, borderRadius: 8, border: 'none', background: '#f44336', color: '#fff', fontWeight: 500, fontSize: 16, cursor: actionLoading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(244,67,54,0.08)' }}
              >
                &#8592; Dislike
              </button>
              <button
                onClick={() => handleAction('like', current._id)}
                disabled={actionLoading}
                style={{ width: 120, padding: 12, borderRadius: 8, border: 'none', background: '#4caf50', color: '#fff', fontWeight: 500, fontSize: 16, cursor: actionLoading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(76,175,80,0.08)' }}
              >
                Like &#8594;
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#888', fontSize: 18, marginTop: 60 }}>
            {message || 'No more users to show!'}
          </div>
        )
      ) : (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ textAlign: 'center', fontWeight: 400, marginBottom: 16 }}>Rated Users</h3>
          {ratedUsers.length === 0 && <div style={{ color: '#888', textAlign: 'center' }}>{Object.values(filters).some(Boolean) ? 'No rated users match your filters.' : 'No rated users yet.'}</div>}
          {ratedUsers.map(u => (
            <div key={u._id} style={{
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              borderRadius: 12,
              background: '#fff',
              padding: 16,
              marginBottom: 18,
              textAlign: 'center',
              position: 'relative',
              minHeight: 120
            }}>
              {u.profilePic && <img src={u.profilePic} alt="Profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '2px solid #007bff' }} />}
              <div style={{ fontWeight: 500, fontSize: 18 }}>{u.name}</div>
              <div style={{ color: '#555', marginBottom: 4 }}>
                {u.personalInfo?.age && <span>{u.personalInfo.age} yrs</span>}
                {u.personalInfo?.gender && <span> &middot; {u.personalInfo.gender}</span>}
              </div>
              <div style={{ color: '#555', marginBottom: 4 }}>
                {u.location?.city && <span>{u.location.city}</span>}
                {u.location?.state && <span>{u.location.city ? ', ' : ''}{u.location.state}</span>}
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 500, color: '#007bff' }}>Subjects:</span> {Array.isArray(u.subjectsInterested) ? u.subjectsInterested.join(', ') : ''}
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 500, color: '#007bff' }}>Languages:</span> {Array.isArray(u.personalInfo?.languages) ? u.personalInfo.languages.join(', ') : ''}
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 500, color: '#007bff' }}>Study Time:</span> {u.studyTime || 'N/A'}
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 16 }}>
                <button
                  onClick={() => handleAction('dislike', u._id)}
                  disabled={actionLoading}
                  style={{ width: 80, padding: 8, borderRadius: 8, border: 'none', background: ratedMap[u._id] === 'dislike' ? '#f44336' : '#eee', color: ratedMap[u._id] === 'dislike' ? '#fff' : '#333', fontWeight: 500, fontSize: 15, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                  Dislike
                </button>
                <button
                  onClick={() => handleAction('like', u._id)}
                  disabled={actionLoading}
                  style={{ width: 80, padding: 8, borderRadius: 8, border: 'none', background: ratedMap[u._id] === 'like' ? '#4caf50' : '#eee', color: ratedMap[u._id] === 'like' ? '#fff' : '#333', fontWeight: 500, fontSize: 15, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                  Like
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 