import React from 'react';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  fullScreen?: boolean;
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  text,
}) => {
  const sizeStyles = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };
  
  const colorStyles = {
    primary: 'border-primary-500',
    secondary: 'border-sage-500',
    white: 'border-white',
  };
  
  const dotColorStyles = {
    primary: 'bg-primary-500',
    secondary: 'bg-sage-500',
    white: 'bg-white',
  };
  
  const textColorStyles = {
    primary: 'text-primary-500',
    secondary: 'text-sage-600',
    white: 'text-white',
  };
  
  const spinner = (
    <div 
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Lightweight spinning circle with single dot */}
      <div className="relative">
        {/* Spinning ring */}
        <div 
          className={`${sizeStyles[size]} rounded-full border-2 ${colorStyles[color]} border-t-transparent animate-spin`}
          style={{ animationDuration: '0.8s' }}
        />
        
        {/* Center dot with pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={`w-2 h-2 rounded-full ${dotColorStyles[color]} animate-pulse`}
            style={{ animationDuration: '1.2s' }}
          />
        </div>
      </div>
      
      <span className="sr-only">{text || 'Loading...'}</span>
      {text && (
        <p className={`text-sm font-medium ${textColorStyles[color]}`} aria-hidden="true">
          {text}
        </p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }
  
  return spinner;
};

export default Loader;
