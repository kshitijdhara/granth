import type React from "react";
import { useEffect, useRef } from "react";
import "./modal.scss";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	className?: string;
}

const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	title,
	children,
	footer,
	className,
}) => {
	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		// Handle escape key
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		// Prevent body scroll
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = originalOverflow;
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className={`modal ${className || ""}`}
				ref={modalRef}
				onClick={(e) => e.stopPropagation()}
			>
				{title && <div className="modal__header">{title}</div>}
				<div className="modal__content">{children}</div>
				{footer && <div className="modal__footer">{footer}</div>}
			</div>
		</div>
	);
};

export default Modal;
