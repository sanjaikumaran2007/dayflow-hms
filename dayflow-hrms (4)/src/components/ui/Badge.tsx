import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'neutral'
  | 'active'
  | 'remote'
  | 'on_leave';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  status?: string;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = 'md',
  className = '',
  dot = true,
}) => {
  let computedVariant: BadgeVariant = variant || 'default';

  if (status) {
    const s = status.toUpperCase().replace(/\s+/g, '_');
    if (['ACTIVE', 'PRESENT', 'PROCESSED', 'PAID'].includes(s)) {
      computedVariant = 'active';
    } else if (['REMOTE', 'CONTRACT'].includes(s)) {
      computedVariant = 'remote';
    } else if (['ON_LEAVE', 'LEAVE', 'HALF_DAY'].includes(s)) {
      computedVariant = 'on_leave';
    } else if (['APPROVED'].includes(s)) {
      computedVariant = 'info';
    } else if (['PENDING', 'DRAFT', 'PROCESSING'].includes(s)) {
      computedVariant = 'purple';
    } else if (['REJECTED', 'ABSENT', 'CANCELLED', 'TERMINATED'].includes(s)) {
      computedVariant = 'danger';
    } else if (['INACTIVE'].includes(s)) {
      computedVariant = 'neutral';
    }
  }

  const variantStyles = {
    default: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    active: 'bg-[#E8F8EE] text-[#0E8A42] font-medium dark:bg-emerald-950/50 dark:text-emerald-300',
    remote: 'bg-[#F3EEFE] text-[#7C3AED] font-medium dark:bg-purple-950/50 dark:text-purple-300',
    on_leave: 'bg-[#FEF5E7] text-[#D97706] font-medium dark:bg-amber-950/50 dark:text-amber-300',
    success: 'bg-[#E8F8EE] text-[#0E8A42] font-medium dark:bg-emerald-950/50 dark:text-emerald-300',
    warning: 'bg-[#FEF5E7] text-[#D97706] font-medium dark:bg-amber-950/50 dark:text-amber-300',
    danger: 'bg-[#FEECEC] text-[#DC2626] font-medium dark:bg-rose-950/50 dark:text-rose-300',
    info: 'bg-[#E0F2FE] text-[#0284C7] font-medium dark:bg-sky-950/50 dark:text-sky-300',
    purple: 'bg-[#F3EEFE] text-[#7C3AED] font-medium dark:bg-purple-950/50 dark:text-purple-300',
    neutral: 'bg-slate-100 text-slate-600 font-medium dark:bg-slate-800 dark:text-slate-300',
  };

  const dotColors = {
    default: 'bg-blue-500',
    active: 'bg-[#10B981]',
    remote: 'bg-[#8B5CF6]',
    on_leave: 'bg-[#F59E0B]',
    success: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    danger: 'bg-[#EF4444]',
    info: 'bg-[#0284C7]',
    purple: 'bg-[#8B5CF6]',
    neutral: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
  };

  const displayLabel = children || (status ? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()).replace('_', ' ') : '');

  return (
    <span
      className={`inline-flex items-center rounded-full capitalize whitespace-nowrap leading-tight transition-colors ${
        sizeStyles[size]
      } ${variantStyles[computedVariant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[computedVariant]}`} />}
      <span>{displayLabel}</span>
    </span>
  );
};
