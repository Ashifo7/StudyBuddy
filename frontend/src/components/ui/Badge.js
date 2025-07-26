import React from 'react';
import clsx from 'clsx';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  icon: Icon,
  removable = false,
  onRemove,
  ...props 
}) => {
  const variants = {
    default: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200',
    primary: 'bg-primary-100 text-primary-800 hover:bg-primary-200',
    success: 'bg-success-100 text-success-800 hover:bg-success-200',
    warning: 'bg-warning-100 text-warning-800 hover:bg-warning-200',
    danger: 'bg-danger-100 text-danger-800 hover:bg-danger-200',
    outline: 'bg-transparent border border-secondary-300 text-secondary-700 hover:bg-secondary-50',
    'outline-primary': 'bg-transparent border border-primary-300 text-primary-700 hover:bg-primary-50',
  };
  
  const sizes = {
    xs: 'px-2 py-0.5 text-2xs gap-1',
    sm: 'px-2.5 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };
  
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full transition-all duration-200 ease-out',
        variants[variant],
        sizes[size],
        removable && 'pr-1',
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon className={clsx(
          'flex-shrink-0',
          size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
        )} />
      )}
      
      <span className="truncate">{children}</span>
      
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className={clsx(
            'flex-shrink-0 ml-1 rounded-full transition-colors duration-200 hover:bg-black/10 focus:outline-none focus:bg-black/10',
            size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
          )}
        >
          <svg className="h-full w-full" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </span>
  );
};

export default Badge;