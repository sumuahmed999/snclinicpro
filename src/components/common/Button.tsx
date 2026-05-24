import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed tap-target shadow-card hover:shadow-card-hover transform hover:-translate-y-0.5';
  
  const variantStyles = {
    primary: 'bg-primary-500 text-cream-500 hover:bg-primary-600 hover:shadow-lg active:scale-95',
    secondary: 'bg-gold-500 text-white hover:bg-gold-600 hover:shadow-lg active:scale-95',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg active:scale-95',
    success: 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg active:scale-95',
    outline: 'bg-white text-charcoal-600 border-2 border-sage-300 hover:border-primary-500 hover:text-primary-500 hover:bg-primary-50 active:scale-95',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-[38px]',
    md: 'px-6 py-3 text-base min-h-[46px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]',
  };
  
  const widthStyle = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
          role="status"
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
      )}
      {isLoading && <span className="sr-only">Loading...</span>}
      {children}
    </button>
  );
};

export default Button;
