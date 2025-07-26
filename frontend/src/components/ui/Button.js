import React from 'react';
import clsx from 'clsx';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500 shadow-soft',
    secondary: 'bg-white text-secondary-700 border border-secondary-200 hover:bg-secondary-50 hover:border-secondary-300 hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500 shadow-soft',
    danger: 'bg-gradient-to-r from-danger-600 to-danger-700 text-white hover:from-danger-700 hover:to-danger-800 hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0 focus:ring-danger-500 shadow-soft',
    ghost: 'bg-transparent text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 focus:ring-primary-500',
    success: 'bg-gradient-to-r from-success-600 to-success-700 text-white hover:from-success-700 hover:to-success-800 hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0 focus:ring-success-500 shadow-soft',
  };
  
  const sizes = {
    xs: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    sm: 'px-4 py-2 text-sm rounded-lg gap-2',
    md: 'px-6 py-3 text-sm rounded-xl gap-2',
    lg: 'px-8 py-4 text-base rounded-2xl gap-3',
    xl: 'px-10 py-5 text-lg rounded-2xl gap-3',
  };
  
  const LoadingSpinner = () => (
    <svg 
      className={clsx(
        'animate-spin',
        size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-4 w-4' : size === 'lg' || size === 'xl' ? 'h-5 w-5' : 'h-4 w-4'
      )} 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
      />
    </svg>
  );
  
  return (
    <button
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={clsx(
          'transition-transform duration-300 group-hover:scale-110',
          size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-4 w-4' : size === 'lg' || size === 'xl' ? 'h-5 w-5' : 'h-4 w-4'
        )} />
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={clsx(
          'transition-transform duration-300 group-hover:scale-110',
          size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-4 w-4' : size === 'lg' || size === 'xl' ? 'h-5 w-5' : 'h-4 w-4'
        )} />
      )}
    </button>
  );
};

export default Button;