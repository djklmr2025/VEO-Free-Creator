
import React from 'react';
import { Spinner } from './Icons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gemini-blue hover:bg-gemini-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gemini-blue disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 ${className}`}
      {...props}
    >
      {isLoading && <Spinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />}
      {children}
    </button>
  );
};

export default Button;
