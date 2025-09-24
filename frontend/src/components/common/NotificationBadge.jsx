// src/components/common/NotificationBadge.jsx
import React from 'react';
import { Bell } from 'lucide-react';

const NotificationBadge = ({ count = 0, onClick, className = '', size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-5 w-5',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  const badgeSizeClasses = {
    small: 'h-4 w-4 text-xs',
    medium: 'h-5 w-5 text-xs',
    large: 'h-6 w-6 text-sm'
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
      title={`${count} notification(s)`}
    >
      <Bell className={`text-gray-600 ${sizeClasses[size]}`} />
      {count > 0 && (
        <span className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-medium ${badgeSizeClasses[size]}`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBadge;