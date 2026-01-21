import React from 'react';
import './ProfileView.scss';

interface ProfileViewProps {
  username?: string | null;
  userId?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

const initialsFrom = (name?: string | null) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ProfileView: React.FC<ProfileViewProps> = ({ username, userId, email, avatarUrl, bio }) => {
  return (
    <section className="profile-view" aria-labelledby="profile-heading">
      <div className="profile-card">
        <div className="profile-avatar" aria-hidden>
          {avatarUrl ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img src={avatarUrl} alt="User avatar" />
          ) : (
            <div className="avatar-initials">{initialsFrom(username)}</div>
          )}
        </div>

        <div className="profile-main">
          <div className="profile-title">
            <h2 id="profile-heading" className="profile-name">{username ?? 'Unknown'}</h2>
            <div className="profile-username">{userId ? `ID • ${userId}` : ''}</div>
          </div>

          <div className="profile-details">
            <div className="profile-email" aria-label={`Email ${email ?? 'not provided'}`}>{email ?? 'Email not provided'}</div>
            {bio && <p className="profile-bio">{bio}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileView;
