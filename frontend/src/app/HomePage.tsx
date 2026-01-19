import React from 'react';
import './HomePage.scss';

const HomePage: React.FC = () => {

  return (
    <div className="home-page">
      <div className="home-page__container">
        <header className="home-page__header">
          <h1 className="home-page__title">Granth</h1>
          <p className="home-page__subtitle">Documents and proposals</p>
        </header>

        <main className="home-page__content">
          <section className="home-page__section">
            <h2>Notes</h2>
            <p>Create and organize your thoughts</p>
          </section>
          <section className="home-page__section">
            <h2>Search</h2>
            <p>Find anything instantly</p>
          </section>
          <section className="home-page__section">
            <h2>Collaborate</h2>
            <p>Work with your team</p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomePage;