import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const Layout = ({ children, user, showNavigation = true }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && (
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">StudyBuddy</h1>
                <div className="hidden md:flex space-x-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/home')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Discover
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/matches')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Messages
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/profile-complete')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Profile
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      src={user.profilePic} 
                      name={user.name} 
                      size="sm"
                    />
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {user.name}
                    </span>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;