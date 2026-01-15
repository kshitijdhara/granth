import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import { useAuth } from '../../../shared/contexts/AuthContext';
import './LoginForm.scss';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value: string) => {
    if (!value) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return '';
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError(validateEmail(value));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) {
      setPasswordError(validatePassword(value));
    }
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/home');
    } catch (error: any) {
      console.error('Login failed:', error);
      // Handle different error types
      if (error.response?.status === 401) {
        setEmailError('Invalid email or password');
      } else if (error.response?.status === 429) {
        setEmailError('Too many login attempts. Please try again later.');
      } else {
        setEmailError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-form__header">
        <h1 className="login-form__title">Welcome back</h1>
        <p className="login-form__subtitle">Sign in to your account</p>
      </div>

      <div className="login-form__fields">
        <Input
          label="Email"
          type="email"
          value={email}
          placeholder="Enter your email"
          isRequired
          hasError={!!emailError}
          errorMessage={emailError}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
        />

        <Input
          label="Password"
          type="password"
          value={password}
          placeholder="Enter your password"
          isRequired
          hasError={!!passwordError}
          errorMessage={passwordError}
          onChange={handlePasswordChange}
          onBlur={handlePasswordBlur}
        />
      </div>

      <div className="login-form__actions">
        <Button
          type="submit"
          variant="primary"
          size="large"
          isDisabled={isSubmitting}
          isFullWidth
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>

        <div className="login-form__switch">
          <span className="login-form__switch-text">Don't have an account?</span>
          <button
            type="button"
            className="login-form__switch-link"
            onClick={onSwitchToRegister}
          >
            Sign up
          </button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;