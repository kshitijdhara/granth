import { useState, useCallback } from "react";

export interface Toast {
	id: string;
	message: string;
	type: "success" | "error" | "info";
	duration?: number;
}

export const useToast = () => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback(
		(message: string, type: "success" | "error" | "info" = "info", duration = 4000) => {
			const id = Math.random().toString(36).slice(2, 9);
			const newToast: Toast = { id, message, type, duration };

			setToasts((prev) => [...prev, newToast]);

			if (duration > 0) {
				setTimeout(() => {
					setToasts((prev) => prev.filter((t) => t.id !== id));
				}, duration);
			}

			return id;
		},
		[]
	);

	const dismissToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return { toasts, showToast, dismissToast };
};
