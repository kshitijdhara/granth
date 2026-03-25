import React from "react";
import { useAuth } from "@/features/auth/auth.context";
import "./profile.page.scss";

const initialsFrom = (name?: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ProfilePage: React.FC = () => {
  const { username, userId } = useAuth();
  const email = username ? `${username}@example.com` : null;
  const bio = "This concise profile focuses on clarity and directness—only the most relevant information is shown here.";

  return (
    <main className="profile-page">
      <header className="profile-top">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-sub">A concise place for your personal details and quick actions.</p>
        </div>
        <div className="profile-actions">
          <button className="btn btn-primary" onClick={() => alert("Edit profile — implement form")} aria-label="Edit profile">
            Edit
          </button>
        </div>
      </header>

      <section className="profile-view" aria-labelledby="profile-heading">
        <div className="profile-card">
          <div className="profile-avatar" aria-hidden>
            <div className="avatar-initials">{initialsFrom(username)}</div>
          </div>
          <div className="profile-main">
            <div className="profile-title">
              <h2 id="profile-heading" className="profile-name">{username ?? "Unknown"}</h2>
              <div className="profile-username">{userId ? `ID • ${userId}` : ""}</div>
            </div>
            <div className="profile-details">
              <div className="profile-email" aria-label={`Email ${email ?? "not provided"}`}>
                {email ?? "Email not provided"}
              </div>
              {bio && <p className="profile-bio">{bio}</p>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProfilePage;
