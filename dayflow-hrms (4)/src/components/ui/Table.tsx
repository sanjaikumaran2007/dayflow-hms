import React from 'react';

interface TableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '', id }) => {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800/90 dark:bg-slate-900 ${className}`}>
      <table id={id} className="w-full text-left border-collapse">
        <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800 backdrop-blur-xs">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap dark:text-slate-400"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
          {children}
        </tbody>
      </table>
    </div>
  );
};
