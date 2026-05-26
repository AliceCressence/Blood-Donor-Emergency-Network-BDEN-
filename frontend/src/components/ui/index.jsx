// src/components/ui/index.jsx
// All reusable primitive components — import from here

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

// ─────────────────────────────────────────────
//  BUTTON
// ─────────────────────────────────────────────
const variantMap = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  outline:   'btn-outline',
  ghost:     'btn-ghost',
  emergency: 'btn-emergency',
}

const sizeMap = {
  sm:  'btn-sm',
  md:  'btn',
  lg:  'btn-lg',
}

export const Button = forwardRef(({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  icon,
  iconEnd,
  children,
  className = '',
  ...props
}, ref) => {
  const base = variant === 'sm' || variant === 'lg'
    ? sizeMap[variant]
    : `${variantMap[variant] ?? 'btn-primary'} ${sizeMap[size] ?? ''}`

  return (
    <button
      ref={ref}
      className={`${base} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading
        ? <Loader2 size={15} className="animate-spin" />
        : icon}
      {children}
      {!loading && iconEnd}
    </button>
  )
})
Button.displayName = 'Button'


// ─────────────────────────────────────────────
//  BADGE
// ─────────────────────────────────────────────
const badgeVariantMap = {
  emergency: 'badge-emergency',
  verified:  'badge-verified',
  pending:   'badge-pending',
  info:      'badge-info',
  neutral:   'badge-neutral',
}

export function Badge({ variant = 'neutral', dot = false, children, className = '' }) {
  return (
    <span className={`${badgeVariantMap[variant] ?? 'badge-neutral'} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full inline-block ${
          variant === 'emergency' ? 'bg-blood-500 animate-pulse' :
          variant === 'verified'  ? 'bg-teal-500'  :
          variant === 'pending'   ? 'bg-amber-500' :
          variant === 'info'      ? 'bg-blue-500'  : 'bg-warm-400'
        }`} />
      )}
      {children}
    </span>
  )
}


// ─────────────────────────────────────────────
//  BLOOD TYPE CHIP
// ─────────────────────────────────────────────
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export function BloodTypeChip({ type, size = 'md', unknown = false, className = '' }) {
  const sizeClasses = {
    sm: 'w-9 h-9 text-xs rounded-lg',
    md: 'w-12 h-12 text-sm rounded-xl',
    lg: 'w-16 h-16 text-base rounded-2xl',
  }

  if (unknown || !BLOOD_TYPES.includes(type)) {
    return (
      <span className={`chip-blood-type ${sizeClasses[size] ?? sizeClasses.md} bg-warm-100 text-warm-400 border-warm-200 ${className}`}>
        ?
      </span>
    )
  }

  return (
    <span className={`chip-blood-type ${sizeClasses[size] ?? sizeClasses.md} ${className}`}>
      {type}
    </span>
  )
}


// ─────────────────────────────────────────────
//  CARD
// ─────────────────────────────────────────────
export function Card({ hover = false, className = '', children, ...props }) {
  return (
    <div className={`${hover ? 'card-hover' : 'card'} ${className}`} {...props}>
      {children}
    </div>
  )
}


// ─────────────────────────────────────────────
//  INPUT
// ─────────────────────────────────────────────
export const Input = forwardRef(({
  label,
  error,
  hint,
  icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`input ${error ? 'input-error' : ''} ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      {hint && !error && <p className="text-xs text-warm-400 mt-1">{hint}</p>}
    </div>
  )
})
Input.displayName = 'Input'


// ─────────────────────────────────────────────
//  SELECT
// ─────────────────────────────────────────────
export const Select = forwardRef(({ label, error, className = '', children, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
})
Select.displayName = 'Select'


// ─────────────────────────────────────────────
//  SPINNER
// ─────────────────────────────────────────────
export function Spinner({ size = 24, className = '' }) {
  return (
    <Loader2
      size={size}
      className={`animate-spin text-blood-500 ${className}`}
    />
  )
}


// ─────────────────────────────────────────────
//  EMPTY STATE
// ─────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-warm-100 flex items-center justify-center mb-4 text-warm-400">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-warm-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-warm-500 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}


// ─────────────────────────────────────────────
//  SECTION HEADER
// ─────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
