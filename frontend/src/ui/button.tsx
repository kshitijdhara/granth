import React from "react";
import "./button.scss";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  isDisabled?: boolean;
  isFullWidth?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "medium",
  isDisabled = false,
  isFullWidth = false,
  onClick,
  type = "button",
  className,
}) => {
  const classes = [
    "button",
    `button--${variant}`,
    `button--${size}`,
    isFullWidth && "button--full-width",
    isDisabled && "button--disabled",
    className || null,
  ].filter(Boolean).join(" ");

  return (
    <button className={classes} disabled={isDisabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
};

export default Button;
