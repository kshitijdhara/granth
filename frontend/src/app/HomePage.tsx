import React from 'react';
import './HomePage.scss';

const HomePage: React.FC = () => {

  return (
    <div className="home-page">
      <div className="home-page__container">
        <header className="home-page__header">
          <h1 className="home-page__title">Welcome to Granth</h1>
          <p className="home-page__subtitle">Your personal knowledge management platform</p>
        </header>

        <main className="home-page__content">
          <div className="home-page__card">
            <h2 className="home-page__card-title">Getting Started</h2>
            <p className="home-page__card-text">
              Granth helps you organize and manage your knowledge with powerful tools
              for note-taking, research, and collaboration.
            </p>
            <div className="home-page__features">
              <div className="home-page__feature">
                <h3>📝 Notes</h3>
                <p>Create and organize your thoughts</p>
              </div>
              <div className="home-page__feature">
                <h3>🔍 Search</h3>
                <p>Find anything instantly</p>
              </div>
              <div className="home-page__feature">
                <h3>🤝 Collaborate</h3>
                <p>Work with your team</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;