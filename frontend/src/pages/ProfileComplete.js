import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Example options for dropdowns and blocks
const SUBJECT_OPTIONS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science', 'Economics'
];
const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Bengali'
];
const NATIONALITY_OPTIONS = [
  'Indian', 'American', 'British', 'Canadian', 'Australian', 'Chinese', 'French', 'German'
];
const RELIGION_OPTIONS = [
  'Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Jewish', 'Other'
];
const ETHNICITY_OPTIONS = [
  'Asian', 'African', 'Caucasian', 'Hispanic', 'Middle Eastern', 'Native American', 'Pacific Islander', 'Other'
];
const CULTURE_OPTIONS = [
  'Western', 'Eastern', 'Latin', 'African', 'Middle Eastern', 'South Asian', 'East Asian', 'Other'
];
const STATE_CITY = {
  'Karnataka': ['Bangalore', 'Mysore', 'Mangalore'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara'],
  'Other': ['Other']
};
const STATE_OPTIONS = Object.keys(STATE_CITY);

const initialState = {
  name: '',
  bio: '',
  studyGoals: '', // keep in state for future use
  subjectsInterested: [],
  studyTime: '', // keep in state for future use
  location: { state: '', city: '', coordinates: { coordinates: ['', ''] }, formattedAddress: '' },
  personalInfo: {
    gender: '', age: '', dateOfBirth: '', nationality: '', languages: [], religion: '', ethnicity: '', culturalBackground: '',
    privacySettings: { showAge: true, showGender: true, showReligion: true, showEthnicity: true, showCulturalBackground: true }
  },
  preferences: {
    preferredGender: '',
    // ageRange, languagePreference, culturalPreferences removed
  },
  profilePic: ''
};

export default function ProfileComplete() {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [cityOptions, setCityOptions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadTimer, setUploadTimer] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser({ ...initialState, ...data.user });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  // Update city options when state changes
  useEffect(() => {
    const state = user.location?.state;
    if (state && STATE_CITY[state]) {
      setCityOptions(STATE_CITY[state]);
    } else {
      setCityOptions([]);
    }
  }, [user.location?.state]);

  // Automatically upload profile picture when file is selected
  useEffect(() => {
    if (!profilePicFile) return;
    let didCancel = false;
    setUploading(true);
    setMessage('Uploading profile picture...');
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePic', profilePicFile);
    const controller = new AbortController();
    // Start 20s timer
    const timer = setTimeout(() => {
      controller.abort();
      setUploading(false);
      setMessage('Upload timed out. You can try again or save without uploading.');
    }, 20000);
    setUploadTimer(timer);
    fetch('/api/users/me/profile-pic/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      signal: controller.signal
    })
      .then(res => res.json())
      .then(data => {
        if (didCancel) return;
        clearTimeout(timer);
        setUploadTimer(null);
        if (data.success) {
          setUser(u => ({ ...u, profilePic: data.url }));
          setMessage('Profile picture updated!');
        } else {
          setMessage(data.error || 'Error uploading picture');
        }
        setUploading(false);
        setProfilePicFile(null);
      })
      .catch(err => {
        if (didCancel) return;
        clearTimeout(timer);
        setUploadTimer(null);
        if (err.name === 'AbortError') {
          setMessage('Upload timed out. You can try again or save without uploading.');
        } else {
          setMessage('Error uploading picture');
        }
        setUploading(false);
        setProfilePicFile(null);
      });
    return () => {
      didCancel = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [profilePicFile]);

  // Handle block selection for subjects and languages
  const toggleBlock = (field, value) => {
    setUser(u => {
      const arr = Array.isArray(u[field]) ? u[field] : [];
      return { ...u, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };
  const toggleLanguage = value => {
    setUser(u => {
      const arr = Array.isArray(u.personalInfo.languages) ? u.personalInfo.languages : [];
      return { ...u, personalInfo: { ...u.personalInfo, languages: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] } };
    });
  };

  // Handle dropdowns with word matching
  const handleDropdownChange = (field, value) => {
    if (field.startsWith('personalInfo.')) {
      setUser(u => ({ ...u, personalInfo: { ...u.personalInfo, [field.split('.')[1]]: value } }));
    } else if (field.startsWith('location.')) {
      setUser(u => ({ ...u, location: { ...u.location, [field.split('.')[1]]: value } }));
    } else if (field.startsWith('preferences.')) {
      setUser(u => ({ ...u, preferences: { ...u.preferences, [field.split('.')[1]]: value } }));
    } else {
      setUser(u => ({ ...u, [field]: value }));
    }
  };

  // Get device location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUser(u => ({
          ...u,
          location: {
            ...u.location,
            coordinates: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] }
          }
        }));
        setMessage('Location set!');
      },
      err => setMessage('Could not get location')
    );
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (name.startsWith('location.')) {
      setUser(u => ({ ...u, location: { ...u.location, [name.split('.')[1]]: value } }));
    } else if (name.startsWith('personalInfo.')) {
      setUser(u => ({ ...u, personalInfo: { ...u.personalInfo, [name.split('.')[1]]: value } }));
    } else if (name.startsWith('preferences.')) {
      setUser(u => ({ ...u, preferences: { ...u.preferences, [name.split('.')[1]]: value } }));
    } else {
      setUser(u => ({ ...u, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const token = localStorage.getItem('token');
    // Always send privacySettings as all true
    const toSend = {
      ...user,
      personalInfo: {
        ...user.personalInfo,
        privacySettings: {
          showAge: true,
          showGender: true,
          showReligion: true,
          showEthnicity: true,
          showCulturalBackground: true
        }
      }
    };
    delete toSend.studyGoals;
    delete toSend.studyTime;
    if (toSend.preferences) {
      delete toSend.preferences.ageRange;
      delete toSend.preferences.languagePreference;
      delete toSend.preferences.culturalPreferences;
    }
    const res = await fetch('/api/users/me/any', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(toSend)
    });
    const data = await res.json();
    if (data.success) setMessage('Profile saved!');
    else setMessage(data.error || 'Error saving profile');
    setSaving(false);
  };

  const handleProfilePicInput = e => {
    setProfilePicFile(e.target.files[0]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20, border: '1px solid #eee', borderRadius: 8, background: '#fafbfc', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => navigate('/home')} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Home</button>
        <button onClick={handleLogout} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Logout</button>
      </div>
      <h2 style={{ textAlign: 'center', marginBottom: 16, fontWeight: 400 }}>Complete Your Profile</h2>
      <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
        <label>Name:<br /><input name="name" value={user.name} onChange={handleChange} style={{ width: '100%' }} /></label><br /><br />
        <label>Bio:<br /><textarea name="bio" value={user.bio} onChange={handleChange} style={{ width: '100%' }} /></label><br /><br />
        {/* Study Goals removed */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 4 }}>Subjects Interested:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUBJECT_OPTIONS.map(subj => (
              <div
                key={subj}
                onClick={() => toggleBlock('subjectsInterested', subj)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 16,
                  border: user.subjectsInterested.includes(subj) ? '2px solid #007bff' : '1px solid #ccc',
                  background: user.subjectsInterested.includes(subj) ? '#e6f0ff' : '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {subj}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 4 }}>Languages:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGE_OPTIONS.map(lang => (
              <div
                key={lang}
                onClick={() => toggleLanguage(lang)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 16,
                  border: user.personalInfo.languages.includes(lang) ? '2px solid #007bff' : '1px solid #ccc',
                  background: user.personalInfo.languages.includes(lang) ? '#e6f0ff' : '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {lang}
              </div>
            ))}
          </div>
        </div>
        <label>State:<br />
          <input
            list="state-list"
            name="location.state"
            value={user.location?.state || ''}
            onChange={e => handleDropdownChange('location.state', e.target.value)}
            style={{ width: '100%' }}
            autoComplete="off"
          />
          <datalist id="state-list">
            {STATE_OPTIONS.map(state => <option key={state} value={state} />)}
          </datalist>
        </label><br /><br />
        <label>City:<br />
          <input
            list="city-list"
            name="location.city"
            value={user.location?.city || ''}
            onChange={e => handleDropdownChange('location.city', e.target.value)}
            style={{ width: '100%' }}
            autoComplete="off"
          />
          <datalist id="city-list">
            {cityOptions.map(city => <option key={city} value={city} />)}
          </datalist>
        </label><br /><br />
        <div style={{ marginBottom: 10 }}>
          <button type="button" onClick={handleGetLocation} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', marginBottom: 4 }}>Get Location</button>
          {user.location?.coordinates?.coordinates?.length === 2 && (
            <div style={{ fontSize: 12, color: '#555' }}>
              Lat: {user.location.coordinates.coordinates[1]}, Lng: {user.location.coordinates.coordinates[0]}
            </div>
          )}
        </div>
        <label>Formatted Address:<br /><input name="location.formattedAddress" value={user.location?.formattedAddress || ''} onChange={handleChange} style={{ width: '100%' }} /></label><br /><br />
        <fieldset style={{ border: '1px solid #eee', padding: 10, marginBottom: 10 }}>
          <legend>Personal Info</legend>
          <label>Gender:<br />
            <select name="personalInfo.gender" value={user.personalInfo?.gender || ''} onChange={handleChange} style={{ width: '100%' }}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="confused">Confused</option>
            </select>
          </label><br /><br />
          <label>Age:<br /><input name="personalInfo.age" value={user.personalInfo?.age || ''} onChange={handleChange} style={{ width: '100%' }} type="number" /></label><br /><br />
          <label>Date of Birth:<br /><input name="personalInfo.dateOfBirth" value={user.personalInfo?.dateOfBirth ? user.personalInfo.dateOfBirth.substring(0,10) : ''} onChange={handleChange} style={{ width: '100%' }} type="date" /></label><br /><br />
          <label>Nationality:<br />
            <input
              list="nationality-list"
              name="personalInfo.nationality"
              value={user.personalInfo?.nationality || ''}
              onChange={e => handleDropdownChange('personalInfo.nationality', e.target.value)}
              style={{ width: '100%' }}
              autoComplete="off"
            />
            <datalist id="nationality-list">
              {NATIONALITY_OPTIONS.map(opt => <option key={opt} value={opt} />)}
            </datalist>
          </label><br /><br />
          <label>Religion:<br />
            <input
              list="religion-list"
              name="personalInfo.religion"
              value={user.personalInfo?.religion || ''}
              onChange={e => handleDropdownChange('personalInfo.religion', e.target.value)}
              style={{ width: '100%' }}
              autoComplete="off"
            />
            <datalist id="religion-list">
              {RELIGION_OPTIONS.map(opt => <option key={opt} value={opt} />)}
            </datalist>
          </label><br /><br />
          <label>Ethnicity:<br />
            <input
              list="ethnicity-list"
              name="personalInfo.ethnicity"
              value={user.personalInfo?.ethnicity || ''}
              onChange={e => handleDropdownChange('personalInfo.ethnicity', e.target.value)}
              style={{ width: '100%' }}
              autoComplete="off"
            />
            <datalist id="ethnicity-list">
              {ETHNICITY_OPTIONS.map(opt => <option key={opt} value={opt} />)}
            </datalist>
          </label><br /><br />
          <label>Cultural Background:<br />
            <input
              list="culture-list"
              name="personalInfo.culturalBackground"
              value={user.personalInfo?.culturalBackground || ''}
              onChange={e => handleDropdownChange('personalInfo.culturalBackground', e.target.value)}
              style={{ width: '100%' }}
              autoComplete="off"
            />
            <datalist id="culture-list">
              {CULTURE_OPTIONS.map(opt => <option key={opt} value={opt} />)}
            </datalist>
          </label><br /><br />
        </fieldset>
        <fieldset style={{ border: '1px solid #eee', padding: 10, marginBottom: 10 }}>
          <legend>Preferences</legend>
          <label>Preferred Gender:<br />
            <select name="preferences.preferredGender" value={typeof user.preferences?.preferredGender === 'string' ? user.preferences.preferredGender : ''} onChange={handleChange} style={{ width: '100%' }}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="confused">Confused</option>
            </select>
          </label><br /><br />
        </fieldset>
        <div style={{ marginBottom: 10 }}>
          <label>Profile Picture:<br />
            {user.profilePic && <img src={user.profilePic} alt="Profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', display: 'block', marginBottom: 8 }} />}
            <input type="file" accept="image/*" onChange={handleProfilePicInput} disabled={uploading} />
            {/* Upload button removed, upload is automatic */}
          </label>
        </div>
        <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 10, borderRadius: 4, border: 'none', background: '#007bff', color: '#fff', fontWeight: 500, cursor: saving || uploading ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save'}</button>
      </form>
      {message && <div style={{ marginTop: 16, color: message.includes('error') ? 'red' : 'green' }}>{message}</div>}
    </div>
  );
} 