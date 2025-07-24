import React from 'react';
import clsx from 'clsx';

const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  className = '',
  ...props 
}) => {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-2xl',
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
  
  if (src) {
    return (
      <img
        className={clsx(
          'rounded-full object-cover border-2 border-white shadow-sm',
          sizes[size],
          className
        )}
        src={src}
        alt={alt || name}
        {...props}
      />
    );
  }
  
  return (
    <div
      className={clsx(
        'rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium border-2 border-white shadow-sm',
        sizes[size],
        className
      )}
      {...props}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;