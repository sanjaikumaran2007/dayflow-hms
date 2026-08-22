import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#1E293B] transition-colors dark:bg-[#0B0F17] dark:text-slate-100 flex flex-col font-sans antialiased">
      {/* Fixed Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-60 transition-all duration-300">
        <Navbar onMobileMenuClick={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-7 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
