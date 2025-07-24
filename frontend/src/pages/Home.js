import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';

function getUniqueOptions(users, fieldPath) {
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
  const [currentUser, setCurrentUser] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [showRated, setShowRated] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    Promise.all([
      fetch('/api/users/recommendations', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('/api/interactions/my', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ])
      .then(([rec, ints, user]) => {
        if (rec.success) setUsers(rec.users);
        else setMessage(rec.error || 'Could not fetch recommendations');
        if (ints.success) setInteractions(ints.interactions || []);
        if (user.success) setCurrentUser(user.user);
        setLoading(false);
      })
      .catch(() => {
        setMessage('Could not fetch recommendations');
        setLoading(false);
      });
  }, [navigate]);

  const ratedMap = useMemo(() => {
    const map = {};
    interactions.forEach(i => {
      if (i.targetUserId?._id) map[i.targetUserId._id] = i.type;
      else if (typeof i.targetUserId === 'string') map[i.targetUserId] = i.type;
    });
    return map;
  }, [interactions]);

  const filteredUsers = useMemo(() => {
    let filtered = users;
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
    if (!showRated) {
      filtered = filtered.filter(u => !ratedMap[u._id]);
    }
    return filtered;
  }, [users, filters, showRated, ratedMap]);

  const ratedUsers = useMemo(() => {
    let filtered = users.filter(u => ratedMap[u._id]);
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

  const subjectOptions = useMemo(() => getUniqueOptions(users, 'subjectsInterested'), [users]);
  const languageOptions = useMemo(() => getUniqueOptions(users, 'personalInfo.languages'), [users]);
  const genderOptions = useMemo(() => getUniqueOptions(users, 'personalInfo.gender'), [users]);
  const cityOptions = useMemo(() => getUniqueOptions(users, 'location.city'), [users]);
  const stateOptions = useMemo(() => getUniqueOptions(users, 'location.state'), [users]);
  const studyTimeOptions = useMemo(() => getUniqueOptions(users, 'studyTime'), [users]);

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
    
    const ints = await fetch('/api/interactions/my', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
    if (ints.success) setInteractions(ints.interactions || []);
    setActionLoading(false);
    
    if (!showRated) setFilteredIndex(i => i + 1);
  };

  if (loading) {
    return (
      <Layout user={currentUser}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discover Study Partners</h1>
            <p className="text-gray-600">Find your perfect study match</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            <span>Filters</span>
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="animate-slide-up">
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Filter Options</h3>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    list="subject-list"
                    value={filters.subjectsInterested || ''}
                    onChange={e => setFilters(f => ({ ...f, subjectsInterested: e.target.value }))}
                    className="input"
                    placeholder="Any subject"
                  />
                  <datalist id="subject-list">
                    {subjectOptions.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={filters['personalInfo.languages'] || ''}
                    onChange={e => setFilters(f => ({ ...f, 'personalInfo.languages': e.target.value }))}
                    className="input"
                  >
                    <option value="">Any language</option>
                    {languageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={filters['personalInfo.gender'] || ''}
                    onChange={e => setFilters(f => ({ ...f, 'personalInfo.gender': e.target.value }))}
                    className="input"
                  >
                    <option value="">Any gender</option>
                    {genderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    list="city-list"
                    value={filters['location.city'] || ''}
                    onChange={e => setFilters(f => ({ ...f, 'location.city': e.target.value }))}
                    className="input"
                    placeholder="Any city"
                  />
                  <datalist id="city-list">
                    {cityOptions.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    list="state-list"
                    value={filters['location.state'] || ''}
                    onChange={e => setFilters(f => ({ ...f, 'location.state': e.target.value }))}
                    className="input"
                    placeholder="Any state"
                  />
                  <datalist id="state-list">
                    {stateOptions.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Study Time</label>
                  <input
                    list="studytime-list"
                    value={filters['studyTime'] || ''}
                    onChange={e => setFilters(f => ({ ...f, 'studyTime': e.target.value }))}
                    className="input"
                    placeholder="Any time"
                  />
                  <datalist id="studytime-list">
                    {studyTimeOptions.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showRated}
                    onChange={e => setShowRated(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Show rated users</span>
                </label>
                
                <Button
                  variant="secondary"
                  onClick={() => setFilters({})}
                  size="sm"
                >
                  Clear all filters
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Main Content */}
        {!showRated ? (
          current ? (
            <div className="flex justify-center">
              <Card className="w-full max-w-md animate-fade-in">
                <Card.Body className="text-center space-y-4">
                  <Avatar
                    src={current.profilePic}
                    name={current.name}
                    size="2xl"
                    className="mx-auto"
                  />
                  
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{current.name}</h2>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mt-1">
                      {current.personalInfo?.age && <span>{current.personalInfo.age} years</span>}
                      {current.personalInfo?.gender && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{current.personalInfo.gender}</span>
                        </>
                      )}
                    </div>
                    {(current.location?.city || current.location?.state) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {current.location.city}{current.location.city && current.location.state && ', '}{current.location.state}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {Array.isArray(current.subjectsInterested) && current.subjectsInterested.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Subjects</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {current.subjectsInterested.map(subject => (
                            <Badge key={subject} variant="primary" size="sm">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {Array.isArray(current.personalInfo?.languages) && current.personalInfo.languages.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Languages</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {current.personalInfo.languages.map(lang => (
                            <Badge key={lang} variant="default" size="sm">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {current.studyTime && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Preferred Study Time</p>
                        <Badge variant="success" className="mt-1 capitalize">
                          {current.studyTime}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <Button
                      variant="danger"
                      onClick={() => handleAction('dislike', current._id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      <span>Pass</span>
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleAction('like', current._id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2"
                    >
                      <HeartIcon className="h-5 w-5" />
                      <span>Like</span>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <HeartIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No more profiles</h3>
              <p className="text-gray-600">{message || 'Check back later for new study partners!'}</p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Rated Users</h2>
            {ratedUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {Object.values(filters).some(Boolean) ? 'No rated users match your filters.' : 'No rated users yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ratedUsers.map(user => (
                  <Card key={user._id} className="hover:shadow-medium transition-shadow">
                    <Card.Body className="text-center space-y-3">
                      <Avatar
                        src={user.profilePic}
                        name={user.name}
                        size="lg"
                        className="mx-auto"
                      />
                      
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                          {user.personalInfo?.age && <span>{user.personalInfo.age} years</span>}
                          {user.personalInfo?.gender && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{user.personalInfo.gender}</span>
                            </>
                          )}
                        </div>
                        {(user.location?.city || user.location?.state) && (
                          <p className="text-sm text-gray-600">
                            {user.location.city}{user.location.city && user.location.state && ', '}{user.location.state}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 justify-center">
                        <Button
                          variant={ratedMap[user._id] === 'dislike' ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => handleAction('dislike', user._id)}
                          disabled={actionLoading}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={ratedMap[user._id] === 'like' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => handleAction('like', user._id)}
                          disabled={actionLoading}
                        >
                          {ratedMap[user._id] === 'like' ? (
                            <HeartSolidIcon className="h-4 w-4" />
                          ) : (
                            <HeartIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}