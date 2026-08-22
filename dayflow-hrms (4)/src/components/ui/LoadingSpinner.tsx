import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Loading...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-600 dark:text-indigo-400 mb-3`} />
      {message && <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{message}</p>}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full animate-pulse space-y-3 p-4">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-full mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded-md flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
