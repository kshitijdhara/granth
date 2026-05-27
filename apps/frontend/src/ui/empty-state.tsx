import type React from "react";
import Button from "./button";
import "./empty-state.scss";

interface EmptyStateProps {
	icon?: React.ReactNode;
	heading: string;
	description?: string;
	cta?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
	icon,
	heading,
	description,
	cta,
	className,
}) => {
	return (
		<div className={`empty-state ${className || ""}`}>
			{icon && <div className="empty-state__icon">{icon}</div>}
			<h3 className="empty-state__heading">{heading}</h3>
			{description && <p className="empty-state__description">{description}</p>}
			{cta && (
				<Button variant="primary" onClick={cta.onClick} size="medium">
					{cta.label}
				</Button>
			)}
		</div>
	);
};

export default EmptyState;
