import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, HeartIcon } from '@heroicons/react/24/outline';
import ContinueWithGoogle from './ContinueWithGoogle';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
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
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error || 'Login failed');
      
      localStorage.setItem('token', data.token);
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
            Welcome back to
            <span className="block gradient-text">StudyBuddy</span>
          </h2>
          <p className="mt-3 text-secondary-600">
            Sign in to continue your learning journey
          </p>
        </div>
        
        <Card className="animate-fade-in-up shadow-large" hover>
          <Card.Body className="space-y-6" padding="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                name="email"
                type="email"
                label="Email address"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                icon={EnvelopeIcon}
                error={error && error.toLowerCase().includes('email') ? error : ''}
              />
              
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  icon={LockClosedIcon}
                  error={error && !error.toLowerCase().includes('email') ? error : ''}
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
              
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                disabled={!form.email || !form.password}
                className="mt-6"
              >
                {loading ? 'Signing in...' : 'Sign in'}
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
            
            <div className="text-center space-y-3">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200 hover:underline"
              >
                Forgot your password?
              </Link>
              <div className="text-sm text-secondary-600">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200 hover:underline"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </Card.Body>
        </Card>
        
        {/* Footer */}
        <div className="text-center text-xs text-secondary-500 animate-fade-in">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}