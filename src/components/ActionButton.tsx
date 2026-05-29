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
  const baseStyles = 'font-black rounded-full transition-all duration-200 transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const variants = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 focus:ring-sky-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-charcoal focus:ring-slate-400',
    danger: 'bg-coral-500 hover:bg-coral-600 text-white shadow-lg shadow-coral-500/30 focus:ring-coral-500',
    success: 'bg-lime-500 hover:bg-lime-600 text-white shadow-lg shadow-lime-500/30 focus:ring-lime-500',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
