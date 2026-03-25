import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/ui/sidebar";

const MainLayout: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("granth:sidebar");
    if (saved !== null) setIsOpen(JSON.parse(saved));
  }, []);

  const toggle = () => {
    setIsOpen((prev) => {
      localStorage.setItem("granth:sidebar", JSON.stringify(!prev));
      return !prev;
    });
  };

  return (
    <div className="app">
      <Sidebar isOpen={isOpen} onToggle={toggle} />
      <main
        className={`app__main ${isOpen ? "app__main--sidebar-open" : "app__main--sidebar-closed"}`}
        id="main-content"
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
