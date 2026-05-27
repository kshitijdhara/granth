import type React from "react";
import "./badge.scss";

interface BadgeProps {
	children: React.ReactNode;
	variant?: "open" | "accepted" | "declined" | "conflict" | "neutral";
	size?: "small" | "medium";
	className?: string;
}

const Badge: React.FC<BadgeProps> = ({
	children,
	variant = "neutral",
	size = "medium",
	className,
}) => {
	const classes = [
		"badge",
		`badge--${variant}`,
		`badge--${size}`,
		className || null,
	]
		.filter(Boolean)
		.join(" ");

	return <span className={classes}>{children}</span>;
};

export default Badge;
