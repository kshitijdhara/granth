import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../shared/components/Sidebar/Sidebar';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      setSidebarOpen(JSON.parse(saved));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  return (
    <div className="app">
      <Navbar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <main className={`app__main ${sidebarOpen ? 'app__main--sidebar-open' : 'app__main--sidebar-closed'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;