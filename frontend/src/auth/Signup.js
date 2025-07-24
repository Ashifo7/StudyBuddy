import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
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
  const [step, setStep] = useState(1); // 1: form, 2: otp
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
    if (error) setError(''); // Clear error when user starts typing
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {step === 1 ? 'Create your account' : 'Verify your email'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 
              ? 'Join StudyBuddy and find your perfect study partner'
              : `We've sent a verification code to ${form.email}`
            }
          </p>
        </div>
        
        <Card className="animate-fade-in">
          <Card.Body className="space-y-6">
            {step === 1 ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="firstName"
                      label="First Name"
                      placeholder="John"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      name="lastName"
                      label="Last Name"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={handleChange}
                      required
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
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Gender <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full"
                    loading={loading}
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </Button>
                </form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>
                
                <ContinueWithGoogle />
              </>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <Input
                  name="otp"
                  label="Verification Code"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  maxLength="6"
                  className="text-center text-lg tracking-widest"
                />
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full"
                  loading={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
                
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Back to registration
                </button>
              </form>
            )}
            
            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}