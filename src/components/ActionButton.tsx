import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 focus:ring-sky-500',
    secondary: 'bg-charcoal/10 hover:bg-charcoal/20 text-charcoal focus:ring-charcoal/50',
    danger: 'bg-coral-500 hover:bg-coral-600 text-white shadow-lg shadow-coral-500/30 focus:ring-coral-500',
    success: 'bg-lime-500 hover:bg-lime-600 text-white shadow-lg shadow-lime-500/30 focus:ring-lime-500',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
