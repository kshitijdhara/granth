import type React from "react";
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import "./toast.scss";

interface ToastProps {
	message: string;
	type: "success" | "error" | "info";
	onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
	const icons = {
		success: <CheckCircleIcon className="toast__icon" />,
		error: <ExclamationCircleIcon className="toast__icon" />,
		info: <InformationCircleIcon className="toast__icon" />,
	};

	return (
		<div className={`toast toast--${type}`}>
			<div className="toast__content">
				{icons[type]}
				<p className="toast__message">{message}</p>
			</div>
			<button className="toast__close" onClick={onDismiss} aria-label="Dismiss">
				<XMarkIcon width={16} height={16} />
			</button>
		</div>
	);
};

export default Toast;
