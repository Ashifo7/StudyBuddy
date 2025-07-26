import React, { useState } from 'react';
import clsx from 'clsx';

const Input = ({ 
  label, 
  error, 
  success,
  helperText,
  className = '', 
  required = false,
  icon: Icon,
  iconPosition = 'left',
  ...props 
}) => {
  const [focused, setFocused] = useState(false);
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-secondary-700">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
          }
        </label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className={clsx(
              'h-5 w-5 transition-colors duration-300',
              error ? 'text-danger-400' : 
              success ? 'text-success-400' :
              focused ? 'text-primary-500' : 'text-secondary-400'
            )} />
          </div>
        )}
        
        <input
          className={clsx(
            'block w-full px-4 py-3 text-sm bg-white border rounded-xl shadow-soft placeholder-secondary-400 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1',
            Icon && iconPosition === 'left' && 'pl-12',
            Icon && iconPosition === 'right' && 'pr-12',
            error 
              ? 'border-danger-300 focus:ring-danger-500 focus:border-danger-500 bg-danger-50/30' 
              : success
              ? 'border-success-300 focus:ring-success-500 focus:border-success-500 bg-success-50/30'
              : 'border-secondary-200 focus:ring-primary-500 focus:border-primary-500 hover:border-secondary-300',
            className
          )}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Icon className={clsx(
              'h-5 w-5 transition-colors duration-300',
              error ? 'text-danger-400' : 
              success ? 'text-success-400' :
              focused ? 'text-primary-500' : 'text-secondary-400'
            )} />
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div className="flex items-start gap-2">
          {error && (
            <div className="flex items-center gap-2 text-sm text-danger-600">
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          {success && !error && (
            <div className="flex items-center gap-2 text-sm text-success-600">
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}
          
          {helperText && !error && !success && (
            <p className="text-sm text-secondary-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Input;