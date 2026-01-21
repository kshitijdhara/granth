import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import HomePage from './pages/HomePage/HomePage';
import DocumentsPage from './features/documents/pages/DocumentPage/DocumentsPage';
import DocumentDetail from './features/documents/pages/DocumentDetail/DocumentDetail';
import DocumentEditor from './features/documents/pages/DocumentEditor/DocumentEditor';
import MainLayout from './pages/MainLayout';
import ProfilePage from './features/user/pages/ProfilePage/ProfilePage';
import './shared/styles/global.scss';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Redirect root to /home so /home is treated as the main root */}
      <Route path="/" element={<Navigate to="/home" replace />} />

         <Route path="/home" element={<MainLayout />}>
           <Route index element={<HomePage />} />
         </Route>

         {/* Documents routes at top-level so `/documents/:id` matches directly */}
         <Route path="/documents" element={<MainLayout />}>
           <Route index element={<DocumentsPage />} />
          <Route path=":id" element={<DocumentDetail />} />
          <Route path=":id/edit" element={<DocumentEditor />} />
         </Route>

           <Route path="/profile" element={<MainLayout />}>
             <Route index element={<ProfilePage />} />
           </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
};

export default App;