import React from 'react';
import './Button.scss';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  isDisabled?: boolean;
  isFullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  isDisabled = false,
  isFullWidth = false,
  onClick,
  type = 'button',
}) => {
  const buttonClasses = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    isFullWidth && 'button--full-width',
    isDisabled && 'button--disabled',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;