import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
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
    if (error) setError(''); // Clear error when user starts typing
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your StudyBuddy account
          </p>
        </div>
        
        <Card className="animate-fade-in">
          <Card.Body className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="email"
                type="email"
                label="Email address"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
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
                  error={error && !error.toLowerCase().includes('email') ? error : ''}
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
              
              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={!form.email || !form.password}
              >
                {loading ? 'Signing in...' : 'Sign in'}
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
            
            <div className="text-center space-y-2">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
              >
                Forgot your password?
              </Link>
              <div className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}