import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  HeartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import ContinueWithGoogle from './ContinueWithGoogle';
import { ensureUserKeyPair } from './keyManager';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function Signup() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '',
    password: ''
  });
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/profile-complete');
    }
  }, [navigate]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const name = form.firstName + ' ' + form.lastName;
      const payload = {
        name,
        email: form.email,
        password: form.password,
        subjectsInterested: ['General'],
        studyTime: 'evening',
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in-up">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-large floating">
              <HeartIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-secondary-900 text-balance">
            {step === 1 ? (
              <>
                Join the
                <span className="block gradient-text">StudyBuddy</span>
                community
              </>
            ) : (
              <>
                Verify your
                <span className="block gradient-text">email address</span>
              </>
            )}
          </h2>
          <p className="mt-3 text-secondary-600">
            {step === 1 
              ? 'Create your account and find your perfect study partner'
              : `We've sent a 6-digit code to ${form.email}`
            }
          </p>
        </div>
        
        <Card className="animate-fade-in-up shadow-large" hover>
          <Card.Body className="space-y-6" padding="lg">
            {step === 1 ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="firstName"
                      label="First Name"
                      placeholder="John"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      icon={UserIcon}
                    />
                    <Input
                      name="lastName"
                      label="Last Name"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      icon={UserIcon}
                    />
                  </div>
                  
                  <Input
                    name="email"
                    type="email"
                    label="Email address"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    icon={EnvelopeIcon}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="age"
                      type="number"
                      label="Age"
                      placeholder="20"
                      value={form.age}
                      onChange={handleChange}
                      required
                      min="13"
                      max="100"
                    />
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-secondary-700">
                        Gender <span className="text-danger-500 ml-1">*</span>
                      </label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 text-sm bg-white border border-secondary-200 rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 ease-out hover:border-secondary-300"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="confused">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength="6"
                      icon={LockClosedIcon}
                      helperText="Must be at least 6 characters long"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-11 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {error && (
                    <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 animate-fade-in">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-danger-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-danger-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={loading}
                    className="mt-6"
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </Button>
                </form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-secondary-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-secondary-500 font-medium">Or continue with</span>
                  </div>
                </div>
                
                <ContinueWithGoogle />
              </>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mx-auto mb-4">
                    <CheckCircleIcon className="h-8 w-8 text-success-600" />
                  </div>
                  <p className="text-sm text-secondary-600 mb-6">
                    Enter the verification code we sent to your email
                  </p>
                </div>
                
                <Input
                  name="otp"
                  label="Verification Code"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  maxLength="6"
                  className="text-center text-lg tracking-widest font-mono"
                />
                
                {error && (
                  <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 animate-fade-in">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-danger-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-danger-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => setStep(1)}
                  className="text-secondary-600 hover:text-secondary-900"
                >
                  ← Back to registration
                </Button>
              </form>
            )}
            
            <div className="text-center text-sm text-secondary-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </Card.Body>
        </Card>
        
        {/* Footer */}
        <div className="text-center text-xs text-secondary-500 animate-fade-in">
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}