import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../shared/components/Navbar';

const MainLayout: React.FC = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="app__main">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;