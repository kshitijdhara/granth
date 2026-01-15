import React from 'react';
import './Input.scss';

interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  placeholder,
  isRequired = false,
  isDisabled = false,
  hasError = false,
  errorMessage,
  onChange,
  onBlur,
}) => {
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = [
    'input',
    hasError && 'input--error',
    isDisabled && 'input--disabled',
  ].filter(Boolean).join(' ');

  return (
    <div className="input-container">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {isRequired && <span className="input-required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={inputClasses}
        type={type}
        value={value}
        placeholder={placeholder}
        required={isRequired}
        disabled={isDisabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {hasError && errorMessage && (
        <span className="input-error">{errorMessage}</span>
      )}
    </div>
  );
};

export default Input;