import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  id?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  change,
  changeType = 'neutral',
  subtext,
  id,
  onClick,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top line: Title & Icon */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className="text-slate-500 shrink-0">
          {icon}
        </div>
      </div>

      {/* Main Value */}
      <div className="mt-3">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
          {value}
        </span>
      </div>

      {/* Bottom line: Change & subtext (Image 2 style) */}
      {(change || subtext) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {change && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                changeType === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : changeType === 'negative'
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {changeType === 'positive' && <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />}
              {changeType === 'negative' && <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
              {changeType === 'neutral' && <Minus className="w-3 h-3 shrink-0" />}
              <span>{change}</span>
            </span>
          )}
          {subtext && (
            <span className="text-slate-400 dark:text-slate-500 truncate">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
