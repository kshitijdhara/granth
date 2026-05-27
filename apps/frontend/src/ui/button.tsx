import type React from "react";
import "./button.scss";

interface ButtonProps {
	children: React.ReactNode;
	variant?: "primary" | "secondary" | "ghost" | "danger" | "glass";
	size?: "small" | "medium" | "large";
	disabled?: boolean;
	isLoading?: boolean;
	isFullWidth?: boolean;
	onClick?: () => void;
	type?: "button" | "submit" | "reset";
	className?: string;
}

const Button: React.FC<ButtonProps> = ({
	children,
	variant = "primary",
	size = "medium",
	disabled = false,
	isLoading = false,
	isFullWidth = false,
	onClick,
	type = "button",
	className,
}) => {
	const isDisabledOrLoading = disabled || isLoading;

	const classes = [
		"button",
		`button--${variant}`,
		`button--${size}`,
		isFullWidth && "button--full-width",
		isDisabledOrLoading && "button--disabled",
		isLoading && "button--loading",
		className || null,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<button
			className={classes}
			disabled={isDisabledOrLoading}
			onClick={onClick}
			type={type}
		>
			{isLoading ? (
				<>
					<span className="button__spinner" />
					{children}
				</>
			) : (
				children
			)}
		</button>
	);
};

export default Button;
