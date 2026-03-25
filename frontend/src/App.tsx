import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/main.layout";
import LoginPage from "@/features/auth/login.page";
import RegisterPage from "@/features/auth/register.page";
import HomePage from "@/pages/home.page";
import DocumentListPage from "@/features/documents/document-list.page";
import DocumentDetailPage from "@/features/documents/document-detail.page";
import DocumentEditorPage from "@/features/documents/document-editor.page";
import ProfilePage from "@/features/user/profile.page";
import "@/styles/global.scss";

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/home" replace />} />

    <Route path="/home" element={<MainLayout />}>
      <Route index element={<HomePage />} />
    </Route>

    <Route path="/documents" element={<MainLayout />}>
      <Route index element={<DocumentListPage />} />
      <Route path=":id" element={<DocumentDetailPage />} />
      <Route path=":id/edit" element={<DocumentEditorPage />} />
    </Route>

    <Route path="/profile" element={<MainLayout />}>
      <Route index element={<ProfilePage />} />
    </Route>

    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Routes>
);

export default App;
