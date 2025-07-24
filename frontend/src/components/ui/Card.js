import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={clsx(
        'bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={clsx(
        'px-6 py-4 border-b border-gray-200 bg-gray-50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={clsx('px-6 py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;

export default Card;