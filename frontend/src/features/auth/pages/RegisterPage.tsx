import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, RegisterForm } from '..';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return (
    <AuthLayout>
      <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
    </AuthLayout>
  );
};

export default RegisterPage;