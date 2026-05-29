import React from 'react';

/**
 * Shared UI Components for Qithym App
 * Standardized design system based on "Session in progress" screen
 */

// ============================================================================
// PANEL COMPONENTS
// ============================================================================

interface AppPanelProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Large app shell panel - 24px border radius
 * Use for main content areas and large sections
 */
export const AppPanel: React.FC<AppPanelProps> = ({ 
  children, 
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6 md:p-8'
  };

  return (
    <div className={`panel-card ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

// ============================================================================
// CARD COMPONENTS
// ============================================================================

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'colored';
  color?: 'sky' | 'lime' | 'violet' | 'orange' | 'slate';
}

/**
 * Medium card - 20px border radius
 * Use for content cards, forms, and standard containers
 */
export const AppCard: React.FC<AppCardProps> = ({ 
  children, 
  className = '',
  variant = 'default',
  color = 'slate'
}) => {
  const baseStyles = 'rounded-[20px] ring-1';
  
  const variants = {
    default: 'bg-white/80 ring-slate-200',
    subtle: 'bg-white/75 ring-slate-200',
    colored: {
      sky: 'bg-sky-50 ring-sky-100',
      lime: 'bg-lime-50 ring-lime-100',
      violet: 'bg-violet-50 ring-violet-100',
      orange: 'bg-orange-50 ring-orange-100',
      slate: 'bg-slate-50 ring-slate-200'
    }[color]
  };

  const finalVariant = variant === 'colored' ? variants.colored : variants[variant];

  return (
    <div className={`${baseStyles} ${finalVariant} ${className}`}>
      {children}
    </div>
  );
};

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  color?: 'sky' | 'lime' | 'violet' | 'orange' | 'slate';
}

/**
 * Small metric card - 16px border radius
 * Use for stats, metrics, and small data displays
 */
export const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  delta,
  icon,
  className = '',
  color = 'slate'
}) => {
  const colorBg = {
    sky: 'bg-sky-50',
    lime: 'bg-lime-50',
    violet: 'bg-violet-50',
    orange: 'bg-orange-50',
    slate: 'bg-slate-50'
  }[color];

  return (
    <div className={`metric-card ${className}`}>
      <div className="flex-1">
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
        {delta && <p className="metric-delta">{delta}</p>}
      </div>
      {icon && (
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${colorBg}`}>
          {icon}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================

interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  className?: string;
}

/**
 * Standardized section header with eyebrow, title, and optional description
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  eyebrow, 
  title, 
  description,
  className = ''
}) => {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 text-xl font-black text-navy md:text-2xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-charcoal/58">
          {description}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  heading: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Standardized empty state for lists, tables, and content areas
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ 
  heading, 
  description, 
  action,
  icon,
  className = ''
}) => {
  return (
    <AppCard className={`p-8 text-center ${className}`}>
      {icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-black text-navy">{heading}</h3>
      <p className="mt-2 text-sm font-semibold text-charcoal/55">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </AppCard>
  );
};

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

interface ButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

interface PrimaryButtonProps extends ButtonProps {}
interface SecondaryButtonProps extends ButtonProps {}
interface DangerButtonProps extends ButtonProps {}

const baseButtonStyles = 'font-black rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transform active:scale-[0.98]';

/**
 * Primary button - Sky blue (#2FBFA6)
 * Use for main CTAs and primary actions
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  children,
  className = '',
  size = 'md',
  fullWidth = false
}) => {
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseButtonStyles}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        bg-sky-500 text-white shadow-lg shadow-sky-500/30
        hover:bg-sky-600
        focus:ring-sky-500
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * Secondary button - Neutral gray
 * Use for secondary actions, cancel buttons, and less prominent CTAs
 */
export const SecondaryButton: React.FC<SecondaryButtonProps> = ({ 
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  children,
  className = '',
  size = 'md',
  fullWidth = false
}) => {
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseButtonStyles}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        bg-slate-100 text-charcoal
        hover:bg-slate-200
        focus:ring-slate-400
        ${className}
      `}
    >
      {children}
    </button>
  );
};

/**
 * Danger button - Coral/orange
 * Use for destructive actions like delete, remove, etc.
 */
export const DangerButton: React.FC<DangerButtonProps> = ({ 
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  children,
  className = '',
  size = 'md',
  fullWidth = false
}) => {
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseButtonStyles}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        bg-coral-500 text-white shadow-lg shadow-coral-500/30
        hover:bg-coral-600
        focus:ring-coral-500
        ${className}
      `}
    >
      {children}
    </button>
  );
};

/**
 * Ghost button - Minimal, outline style
 * Use for tertiary actions, links that look like buttons
 */
export const GhostButton: React.FC<PrimaryButtonProps & { variant?: 'sky' | 'neutral' }> = ({ 
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  children,
  className = '',
  size = 'md',
  fullWidth = false,
  variant = 'sky'
}) => {
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };

  const variants = {
    sky: 'bg-white text-sky-600 ring-1 ring-sky-100 hover:bg-sky-50',
    neutral: 'bg-white text-charcoal ring-1 ring-slate-200 hover:bg-slate-50'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseButtonStyles}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// ============================================================================
// FORM COMPONENTS
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const TextInput: React.FC<InputProps> = ({ 
  label,
  error,
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <label className={`block ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <span className="text-sm font-bold text-charcoal/70">{label}</span>
      )}
      <input
        id={inputId}
        className={`
          mt-2 min-h-[48px] w-full rounded-xl border border-slate-200 
          bg-white px-4 font-semibold text-charcoal outline-none transition
          focus:border-sky-400 focus:ring-4 focus:ring-sky-100
          disabled:bg-slate-50 disabled:text-charcoal/50
          ${error ? 'border-coral-500 focus:border-coral-500 focus:ring-orange-100' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm font-semibold text-coral-500">{error}</p>
      )}
    </label>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const SelectInput: React.FC<SelectProps> = ({ 
  label,
  error,
  fullWidth = true,
  className = '',
  id,
  children,
  ...props
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <label className={`block ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <span className="text-sm font-bold text-charcoal/70">{label}</span>
      )}
      <select
        id={selectId}
        className={`
          mt-2 min-h-[48px] w-full rounded-xl border border-slate-200 
          bg-white px-4 font-bold text-charcoal outline-none transition
          focus:border-sky-400 focus:ring-4 focus:ring-sky-100
          ${error ? 'border-coral-500 focus:border-coral-500 focus:ring-orange-100' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm font-semibold text-coral-500">{error}</p>
      )}
    </label>
  );
};

interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-charcoal mb-2">
        {label}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-sky-500"
      />
      <div className="text-sm text-charcoal/60 mt-1">
        {value}{unit}
      </div>
    </div>
  );
};

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  color?: 'sky' | 'lime' | 'gradient' | 'coral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  color = 'gradient',
  size = 'md',
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const colors = {
    sky: 'bg-sky-500',
    lime: 'bg-lime-500',
    coral: 'bg-coral-500',
    gradient: 'bg-gradient-to-r from-sky-500 via-lime-400 to-lavender'
  };

  return (
    <div className={className}>
      <div className={`w-full overflow-hidden rounded-full bg-slate-200 ${heights[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs font-semibold text-charcoal/55">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
};

// ============================================================================
// BADGE COMPONENT
// ============================================================================

interface BadgeProps {
  children: React.ReactNode;
  color?: 'sky' | 'lime' | 'violet' | 'orange' | 'slate' | 'coral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'slate',
  size = 'md',
  className = ''
}) => {
  const colors = {
    sky: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',
    lime: 'bg-lime-50 text-lime-700 ring-1 ring-lime-100',
    violet: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100',
    orange: 'bg-orange-50 text-coral-500 ring-1 ring-orange-100',
    slate: 'bg-slate-100 text-charcoal/70 ring-1 ring-slate-200',
    coral: 'bg-coral-50 text-coral-500 ring-1 ring-coral-100'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs'
  };

  return (
    <span className={`inline-block font-black rounded-full ${colors[color]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
