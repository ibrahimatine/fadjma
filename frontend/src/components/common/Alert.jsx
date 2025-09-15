import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

const Alert = ({ type = 'info', title, message, onClose }) => {
  const types = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-400'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-400'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertCircle,
      iconColor: 'text-yellow-400'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-400'
    }
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} ${config.text} border rounded-lg p-4`}>
      <div className="flex">
        <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0`} />
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {message && <div className="text-sm mt-1">{message}</div>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 ${config.text} hover:opacity-75`}
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};