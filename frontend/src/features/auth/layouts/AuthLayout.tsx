import React from 'react';
import './AuthLayout.scss';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-layout">
      <div className="auth-layout__background">
        <div className="auth-layout__gradient"></div>
        <div className="auth-layout__blur"></div>
      </div>
      <div className="auth-layout__container">
        <div className="auth-layout__content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;