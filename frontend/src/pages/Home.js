import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartIcon, 
  XMarkIcon, 
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
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
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600">Finding your perfect study matches...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-center space-x-3">
            <SparklesIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-4xl font-bold gradient-text">Discover Study Partners</h1>
          </div>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto text-balance">
            Find your perfect study match and accelerate your learning journey together
          </p>
          
          <div className="flex items-center justify-center space-x-6 pt-4">
            <div className="flex items-center space-x-2 text-sm text-secondary-600">
              <UserGroupIcon className="h-5 w-5 text-primary-500" />
              <span>{users.length} potential matches</span>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              icon={FunnelIcon}
              size="sm"
              className="shadow-soft"
            >
              Filters
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="animate-slide-down shadow-large">
            <Card.Header gradient>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 text-secondary-700" />
                  <h3 className="text-lg font-semibold text-secondary-900">Filter Options</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  icon={XMarkIcon}
                />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-secondary-700">Subject</label>
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
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-secondary-700">Language</label>
                  <select
                    value={filters['personalInfo.languages'] || ''}
                    onChange={e => setFilters(f => ({ ...f, 'personalInfo.languages': e.target.value }))}
                    className="input"
                  >
                    <option value="">Any language</option>
                    {languageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    )
                    }
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-secondary-700">Gender</label>
                  <select
                    value={filters['personalInfo.gender'] || ''}
                    onChange={e => setFilters(f => ({ ...f, 'personalInfo.gender': e.target.value }))}
                    className="input"
                  >
                    <option value="">Any gender</option>
                    {genderOptions.map(opt => <option key={opt} value={opt} className="capitalize">{opt}</option>)}
                    )
                    }
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-secondary-700">City</label>
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
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-secondary-700">State</label>
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
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-secondary-700">Study Time</label>
                  <input
                    list="studytime-list"
                    value={filters['studyTime'] || ''}
                    onChange={e => setFilters(f => ({ ...f, 'studyTime': e.target.value }))}
                    className="input"
                    placeholder="Any time"
                  />
                  <datalist id="studytime-list">
                    {studyTimeOptions.map(opt => <option key={opt} value={opt} className="capitalize" />)}
                  </datalist>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-secondary-200">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={showRated}
                    onChange={e => setShowRated(e.target.checked)}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-secondary-700">Show rated users</span>
                </label>
                
                <Button
                  variant="ghost"
                  onClick={() => setFilters({})}
                  size="sm"
                  className="text-secondary-600 hover:text-secondary-900"
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
            <div className="flex justify-center animate-fade-in">
              <Card className="w-full max-w-sm shadow-large hover:shadow-glow transition-all duration-500">
                <Card.Body className="text-center space-y-6" padding="lg">
                  <div className="relative">
                    <Avatar
                      src={current.profilePic}
                      name={current.name}
                      size="3xl"
                      className="mx-auto ring-4 ring-white shadow-large"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-medium">
                      #{filteredIndex + 1}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-secondary-900">{current.name}</h2>
                    <div className="flex items-center justify-center space-x-4 text-sm text-secondary-600">
                      {current.personalInfo?.age && (
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{current.personalInfo.age}</span>
                          <span>years</span>
                        </div>
                      )}
                      {current.personalInfo?.gender && (
                        <Badge variant="outline" size="sm" className="capitalize">
                          {current.personalInfo.gender}
                        </Badge>
                      )}
                    </div>
                    
                    {(current.location?.city || current.location?.state) && (
                      <div className="flex items-center justify-center space-x-1 text-secondary-600">
                        <MapPinIcon className="h-4 w-4" />
                        <span className="text-sm">
                          {current.location.city}{current.location.city && current.location.state && ', '}{current.location.state}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {Array.isArray(current.subjectsInterested) && current.subjectsInterested.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-secondary-700 flex items-center justify-center space-x-1">
                          <SparklesIcon className="h-4 w-4" />
                          <span>Subjects</span>
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {current.subjectsInterested.slice(0, 4).map(subject => (
                            <Badge key={subject} variant="primary" size="sm">
                              {subject}
                            </Badge>
                          ))}
                          {current.subjectsInterested.length > 4 && (
                            <Badge variant="outline" size="sm">
                              +{current.subjectsInterested.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {Array.isArray(current.personalInfo?.languages) && current.personalInfo.languages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-secondary-700">Languages</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {current.personalInfo.languages.slice(0, 3).map(lang => (
                            <Badge key={lang} variant="default" size="sm">
                              {lang}
                            </Badge>
                          ))}
                          {current.personalInfo.languages.length > 3 && (
                            <Badge variant="outline" size="sm">
                              +{current.personalInfo.languages.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {current.studyTime && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-secondary-700 flex items-center justify-center space-x-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>Preferred Study Time</span>
                        </p>
                        <Badge variant="success" className="capitalize">
                          {current.studyTime}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-4 pt-6">
                    <Button
                      variant="secondary"
                      onClick={() => handleAction('dislike', current._id)}
                      disabled={actionLoading}
                      icon={XMarkIcon}
                      size="lg"
                      className="flex-1 border-2 hover:border-danger-300 hover:text-danger-600"
                    >
                      Pass
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleAction('like', current._id)}
                      disabled={actionLoading}
                      icon={HeartIcon}
                      size="lg"
                      className="flex-1 shadow-glow"
                    >
                      Like
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-in">
              <div className="space-y-6">
                <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full mx-auto">
                  <HeartIcon className="h-12 w-12 text-primary-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-secondary-900">No more profiles</h3>
                  <p className="text-secondary-600 max-w-md mx-auto text-balance">
                    {message || 'You\'ve seen all available study partners. Check back later for new matches!'}
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                  icon={SparklesIcon}
                  className="shadow-medium"
                >
                  Refresh Matches
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-secondary-900">Rated Users</h2>
              <p className="text-secondary-600 mt-2">Users you've already interacted with</p>
            </div>
            
            {ratedUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mx-auto">
                    <UserGroupIcon className="h-8 w-8 text-secondary-400" />
                  </div>
                  <p className="text-secondary-600">
                    {Object.values(filters).some(Boolean) ? 'No rated users match your filters.' : 'No rated users yet.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ratedUsers.map(user => (
                  <Card key={user._id} className="hover:shadow-large transition-all duration-300 hover:-translate-y-1" interactive>
                    <Card.Body className="text-center space-y-4">
                      <Avatar
                        src={user.profilePic}
                        name={user.name}
                        size="xl"
                        className="mx-auto"
                      />
                      
                      <div className="space-y-2">
                        <h3 className="font-semibold text-secondary-900">{user.name}</h3>
                        <div className="flex items-center justify-center space-x-2 text-sm text-secondary-600">
                          {user.personalInfo?.age && <span>{user.personalInfo.age} years</span>}
                          }
                          {user.personalInfo?.gender && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{user.personalInfo.gender}</span>
                            </>
                          )}
                        </div>
                        {(user.location?.city || user.location?.state) && (
                          <div className="flex items-center justify-center space-x-1 text-sm text-secondary-600">
                            <MapPinIcon className="h-3 w-3" />
                            <span>
                              {user.location.city}{user.location.city && user.location.state && ', '}{user.location.state}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 justify-center">
                        <Button
                          variant={ratedMap[user._id] === 'dislike' ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => handleAction('dislike', user._id)}
                          disabled={actionLoading}
                          icon={XMarkIcon}
                        />
                        <Button
                          variant={ratedMap[user._id] === 'like' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => handleAction('like', user._id)}
                          disabled={actionLoading}
                          icon={ratedMap[user._id] === 'like' ? HeartSolidIcon : HeartIcon}
                        />
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