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
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  isDisabled = false,
  isFullWidth = false,
  onClick,
  type = 'button',
  className,
}) => {
  const buttonClasses = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    isFullWidth && 'button--full-width',
    isDisabled && 'button--disabled',
    // allow custom class names (e.g., navbar__toggle-btn)
    (typeof className === 'string' && className) || null,
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