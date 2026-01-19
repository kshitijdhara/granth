import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import HomePage from './pages/HomePage/HomePage';
import MainLayout from './pages/MainLayout';
import './shared/styles/global.scss';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Redirect root to /home so /home is treated as the main root */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route path="/home" element={<MainLayout />}>
        <Route index element={<HomePage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
};

export default App;