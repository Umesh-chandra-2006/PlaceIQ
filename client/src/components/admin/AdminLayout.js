import React from 'react';
import Sidebar from '../shared/Sidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 selection:bg-primary-500/30 selection:text-primary-100 font-sans">
      <Sidebar />
      <div className="flex-1 md:ml-64 pt-16 md:pt-8 p-4 md:p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
