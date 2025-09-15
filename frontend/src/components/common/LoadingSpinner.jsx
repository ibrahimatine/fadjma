import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Chargement...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-primary-200 border-t-primary-600`}></div>
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
