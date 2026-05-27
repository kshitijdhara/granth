import type React from "react";
import "./avatar.scss";

interface AvatarProps {
	initials: string;
	name?: string;
	size?: "xs" | "sm" | "md" | "lg";
	className?: string;
}

// 7-color palette hashed from string
const AVATAR_COLORS = [
	"#2563EB", // blue
	"#06B6D4", // cyan
	"#10B981", // emerald
	"#F59E0B", // amber
	"#EF4444", // red
	"#8B5CF6", // violet
	"#EC4899", // pink
];

// Simple hash function
const hashString = (str: string): number => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash) % AVATAR_COLORS.length;
};

const Avatar: React.FC<AvatarProps> = ({
	initials,
	name = "",
	size = "md",
	className,
}) => {
	const colorIndex = hashString(name || initials);
	const backgroundColor = AVATAR_COLORS[colorIndex];

	const classes = [
		"avatar",
		`avatar--${size}`,
		className || null,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			className={classes}
			style={{ backgroundColor }}
			title={name || initials}
		>
			<span className="avatar__text">
				{initials.toUpperCase().slice(0, 2)}
			</span>
		</div>
	);
};

export default Avatar;
