import type React from "react";
import "./card.scss";

interface CardProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	variant?: "default" | "elevated" | "outlined";
	padding?: "none" | "sm" | "md" | "lg";
}

const Card: React.FC<CardProps> = ({
	children,
	className = "",
	onClick,
	variant = "default",
	padding = "md",
}) => {
	const classes = [
		"card",
		`card--${variant}`,
		`card--padding-${padding}`,
		onClick ? "card--clickable" : "",
		className,
	]
		.filter(Boolean)
		.join(" ");

	if (onClick) {
		return (
			<button type="button" className={classes} onClick={onClick}>
				{children}
			</button>
		);
	}

	return <div className={classes}>{children}</div>;
};

export default Card;
