import React from 'react';
import './ProfilePage.scss';
import ProfileView from '../../components/ProfileView/ProfileView';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { useTheme } from '../../../../shared/contexts/ThemeContext';

const ProfilePage: React.FC = () => {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Derive a safe email fallback for demo purposes
  const email = auth.username ? `${auth.username}@example.com` : null;

  return (
    <main className="profile-page">
      <header className="profile-top">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-sub">A concise place for your personal details and quick actions.</p>
        </div>

        <div className="profile-actions">
          <button
            className="btn btn-ghost"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => alert('Edit profile — implement form')}
            aria-label="Edit profile"
          >
            Edit
          </button>
        </div>
      </header>

      <ProfileView
        username={auth.username}
        userId={auth.userId ?? undefined}
        email={email}
        bio={"This concise profile focuses on clarity and directness—only the most relevant information is shown here."}
      />
    </main>
  );
};

export default ProfilePage;
