import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../../shared/components/Button/Button";
import Input from "../../../../shared/components/Input/Input";
import { useAuth } from "../../../../shared/contexts/AuthContext";
import "./RegisterForm.scss";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = (value: string) => {
    if (!value.trim()) {
      return "Name is required";
    }
    if (value.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
    return "";
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      return "Please confirm your password";
    }
    if (value !== password) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) {
      setNameError(validateName(value));
    }
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
    // Also validate confirm password if it has a value
    if (confirmPassword && confirmPasswordError) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (confirmPasswordError) {
      setConfirmPasswordError(validateConfirmPassword(value));
    }
  };

  const handleNameBlur = () => {
    setNameError(validateName(name));
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  const handleConfirmPasswordBlur = () => {
    setConfirmPasswordError(validateConfirmPassword(confirmPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword);

    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);

    if (nameErr || emailErr || passwordErr || confirmPasswordErr) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name, email, password);
      navigate("/home");
    } catch (error: any) {
      console.error("Registration failed:", error);
      const errorMessage = error.response?.data || error.message || "";

      setEmailError(`${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="register-form__header">
        <h1 className="register-form__title">Create account</h1>
        <p className="register-form__subtitle">Join us today</p>
      </div>

      <div className="register-form__fields">
        <Input
          label="Full name"
          type="text"
          value={name}
          placeholder="Enter your full name"
          isRequired
          hasError={!!nameError}
          errorMessage={nameError}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
        />

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
          placeholder="Create a password"
          isRequired
          hasError={!!passwordError}
          errorMessage={passwordError}
          onChange={handlePasswordChange}
          onBlur={handlePasswordBlur}
        />

        <Input
          label="Confirm password"
          type="password"
          value={confirmPassword}
          placeholder="Confirm your password"
          isRequired
          hasError={!!confirmPasswordError}
          errorMessage={confirmPasswordError}
          onChange={handleConfirmPasswordChange}
          onBlur={handleConfirmPasswordBlur}
        />
      </div>

      <div className="register-form__actions">
        <Button
          type="submit"
          variant="primary"
          size="large"
          isDisabled={isSubmitting}
          isFullWidth
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <div className="register-form__switch">
          <span className="register-form__switch-text">
            Already have an account?
          </span>
          <button
            type="button"
            className="register-form__switch-link"
            onClick={onSwitchToLogin}
          >
            Sign in
          </button>
        </div>
      </div>
    </form>
  );
};

export default RegisterForm;
