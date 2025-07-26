import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon, 
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const Layout = ({ children, user, showNavigation = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  const navigation = [
    { name: 'Discover', href: '/home', icon: HomeIcon, current: location.pathname === '/home' },
    { name: 'Messages', href: '/matches', icon: ChatBubbleLeftRightIcon, current: location.pathname === '/matches' },
    { name: 'Profile', href: '/profile-complete', icon: UserIcon, current: location.pathname === '/profile-complete' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50/30">
      {showNavigation && (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-secondary-200/50 shadow-soft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-medium">
                  <HeartIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    StudyBuddy
                  </h1>
                  <p className="text-xs text-secondary-500 -mt-1">Find your study partner</p>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.href)}
                      className={clsx(
                        'flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out',
                        item.current
                          ? 'bg-primary-100 text-primary-700 shadow-soft'
                          : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* User Menu */}
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-white/60 rounded-xl border border-secondary-200/50">
                    <Avatar 
                      src={user.profilePic} 
                      name={user.name} 
                      size="sm"
                      status="online"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-secondary-900 truncate max-w-32">
                        {user.name}
                      </p>
                      <p className="text-xs text-secondary-500">Online</p>
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  icon={ArrowRightOnRectangleIcon}
                  className="hidden md:flex text-secondary-600 hover:text-secondary-900"
                >
                  Logout
                </Button>
                
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-colors duration-200"
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-secondary-200/50 animate-slide-down">
              <div className="px-4 py-3 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={clsx(
                        'flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-out',
                        item.current
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
                
                {user && (
                  <div className="flex items-center space-x-3 px-4 py-3 bg-secondary-50 rounded-xl mt-4">
                    <Avatar 
                      src={user.profilePic} 
                      name={user.name} 
                      size="sm"
                      status="online"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-secondary-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-secondary-500">Online</p>
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  icon={ArrowRightOnRectangleIcon}
                  fullWidth
                  className="mt-4 text-secondary-600 hover:text-secondary-900 justify-start"
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </nav>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      {/* Floating Action Button for Mobile */}
      {showNavigation && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
            variant="primary"
            size="lg"
            icon={SparklesIcon}
            className="rounded-full shadow-large hover:shadow-glow"
            onClick={() => navigate('/home')}
          />
        </div>
      )}
    </div>
  );
};

// Add clsx import at the top
import clsx from 'clsx';

export default Layout;