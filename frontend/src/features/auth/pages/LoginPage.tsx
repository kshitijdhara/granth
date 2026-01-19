import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, LoginForm } from '..';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSwitchToRegister = () => {
    navigate('/register');
  };

  return (
    <AuthLayout>
      <LoginForm onSwitchToRegister={handleSwitchToRegister} />
    </AuthLayout>
  );
};

export default LoginPage;