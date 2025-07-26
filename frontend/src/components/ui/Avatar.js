import React from 'react';
import clsx from 'clsx';

const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  className = '',
  status,
  ring = false,
  ...props 
}) => {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-2xl',
    '3xl': 'h-24 w-24 text-3xl',
  };
  
  const statusSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
    '2xl': 'h-4 w-4',
    '3xl': 'h-5 w-5',
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getGradientFromName = (name) => {
    if (!name) return 'from-secondary-400 to-secondary-600';
    
    const gradients = [
      'from-primary-400 to-primary-600',
      'from-success-400 to-success-600',
      'from-warning-400 to-warning-600',
      'from-danger-400 to-danger-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-cyan-400 to-cyan-600',
    ];
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return gradients[Math.abs(hash) % gradients.length];
  };
  
  return (
    <div className="relative inline-block">
      {src ? (
        <img
          className={clsx(
            'rounded-full object-cover transition-all duration-300 ease-out',
            ring && 'ring-2 ring-white shadow-medium',
            !ring && 'shadow-soft',
            'hover:shadow-medium hover:scale-105',
            sizes[size],
            className
          )}
          src={src}
          alt={alt || name}
          {...props}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center text-white font-semibold transition-all duration-300 ease-out',
            ring && 'ring-2 ring-white shadow-medium',
            !ring && 'shadow-soft',
            'hover:shadow-medium hover:scale-105',
            'bg-gradient-to-br',
            getGradientFromName(name),
            sizes[size],
            className
          )}
          {...props}
        >
          {getInitials(name)}
        </div>
      )}
      
      {status && (
        <div
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            statusSizes[size],
            status === 'online' && 'bg-success-500',
            status === 'offline' && 'bg-secondary-400',
            status === 'away' && 'bg-warning-500',
            status === 'busy' && 'bg-danger-500'
          )}
        />
      )}
    </div>
  );
};

export default Avatar;