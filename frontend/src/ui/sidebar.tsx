import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth.context";
import { useTheme } from "@/theme.context";
import { documentsApi } from "@/features/documents/documents.api";
import type { Document } from "@/features/documents/types";
import {
  HomeIcon, DocumentTextIcon, UserCircleIcon, PlusIcon,
  Bars3Icon, XMarkIcon, ArrowRightStartOnRectangleIcon,
  SunIcon, MoonIcon,
} from "@heroicons/react/24/solid";
import "./sidebar.scss";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    documentsApi.getAll()
      .then(setDocuments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const isAuth = location.pathname === "/login" || location.pathname === "/register";
  if (isAuth) return null;

  const isActive = (path: string) =>
    path === "/home"
      ? location.pathname === "/home" || location.pathname === "/"
      : location.pathname.startsWith(path);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await documentsApi.create("Untitled Document");
      const updated = await documentsApi.getAll();
      setDocuments(updated);
      if (res?.document_id) navigate(`/documents/${res.document_id}/edit`);
    } catch (err) {
      console.error("Failed to create document:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <nav className={`sidebar ${isOpen ? "sidebar--open" : "sidebar--closed"}`} aria-label="Main navigation">
      <div className="sidebar__inner">
        <div className="sidebar__header">
          <button className="sidebar__toggle" onClick={onToggle}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}>
            {isOpen ? <XMarkIcon className="sidebar__icon" /> : <Bars3Icon className="sidebar__icon" />}
          </button>
          {isOpen && (
            <span className="sidebar__brand" role="button" tabIndex={0}
              onClick={() => navigate("/home")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/home")}>
              Granth
            </span>
          )}
        </div>

        <nav className="sidebar__nav" aria-label="Primary navigation">
          {(["home", "documents"] as const).map((key) => {
            const path = `/${key}`;
            const Icon = key === "home" ? HomeIcon : DocumentTextIcon;
            return (
              <button key={key} className={`sidebar__nav-item ${isActive(path) ? "sidebar__nav-item--active" : ""}`}
                onClick={() => navigate(path)} title={key.charAt(0).toUpperCase() + key.slice(1)}>
                <Icon className="sidebar__icon" />
                {isOpen && <span className="sidebar__nav-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>}
              </button>
            );
          })}
        </nav>

        {isOpen && isAuthenticated && (
          <div className="sidebar__documents">
            <div className="sidebar__section-header">
              <span className="sidebar__section-title">Recent</span>
              <button className="sidebar__new-btn" onClick={handleCreate} disabled={creating}
                title="New document" aria-label="New document">
                <PlusIcon className="sidebar__icon sidebar__icon--sm" />
              </button>
            </div>
            {loading ? (
              <div className="sidebar__loading">
                <div className="sidebar__skeleton" />
                <div className="sidebar__skeleton" />
                <div className="sidebar__skeleton" />
              </div>
            ) : documents.length > 0 ? (
              <ul className="sidebar__doc-list" role="list">
                {documents.slice(0, 12).map((doc) => (
                  <li key={doc.id}>
                    <button
                      className={`sidebar__doc-item ${location.pathname.includes(doc.id) ? "sidebar__doc-item--active" : ""}`}
                      onClick={() => navigate(`/documents/${doc.id}`)} title={doc.title}>
                      <span className="sidebar__doc-icon">
                        <DocumentTextIcon style={{ width: 12, height: 12 }} />
                      </span>
                      <span className="sidebar__doc-title">{doc.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sidebar__empty">No documents yet</p>
            )}
          </div>
        )}

        <div className="sidebar__footer">
          <button className="sidebar__nav-item sidebar__nav-item--theme" onClick={toggleTheme}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>
            {theme === "light" ? <MoonIcon className="sidebar__icon" /> : <SunIcon className="sidebar__icon" />}
            {isOpen && <span className="sidebar__nav-label">{theme === "light" ? "Dark mode" : "Light mode"}</span>}
          </button>

          {isAuthenticated ? (
            <>
              <button className={`sidebar__nav-item ${isActive("/profile") ? "sidebar__nav-item--active" : ""}`}
                onClick={() => navigate("/profile")} title="Profile">
                <UserCircleIcon className="sidebar__icon" />
                {isOpen && <span className="sidebar__nav-label">Profile</span>}
              </button>
              <button className="sidebar__nav-item sidebar__nav-item--logout" onClick={() => void logout()} title="Sign out">
                <ArrowRightStartOnRectangleIcon className="sidebar__icon" />
                {isOpen && <span className="sidebar__nav-label">Sign out</span>}
              </button>
            </>
          ) : (
            <button className="sidebar__nav-item sidebar__nav-item--active" onClick={() => navigate("/login")} title="Sign in">
              <ArrowRightStartOnRectangleIcon className="sidebar__icon" />
              {isOpen && <span className="sidebar__nav-label">Sign in</span>}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
