import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import type React from "react";
import { useId, useState } from "react";
import "./password-input.scss";

interface PasswordInputProps {
	label?: string;
	value: string;
	placeholder?: string;
	isRequired?: boolean;
	isDisabled?: boolean;
	hasError?: boolean;
	errorMessage?: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
	label,
	value,
	placeholder,
	isRequired = false,
	isDisabled = false,
	hasError = false,
	errorMessage,
	onChange,
	onBlur,
}) => {
	const id = useId();
	const [isVisible, setIsVisible] = useState(false);

	const classes = ["input", hasError && "input--error", isDisabled && "input--disabled"]
		.filter(Boolean)
		.join(" ");

	return (
		<div className="input-container">
			{label && (
				<label htmlFor={id} className="input-label">
					{label}
					{isRequired && <span className="input-required">*</span>}
				</label>
			)}
			<div className="password-input-wrapper">
				<input
					id={id}
					className={classes}
					type={isVisible ? "text" : "password"}
					value={value}
					placeholder={placeholder}
					required={isRequired}
					disabled={isDisabled}
					onChange={(e) => onChange(e.target.value)}
					onBlur={onBlur}
				/>
				<button
					type="button"
					className="password-input-toggle"
					onClick={() => setIsVisible(!isVisible)}
					disabled={isDisabled}
					aria-label={isVisible ? "Hide password" : "Show password"}
					aria-pressed={isVisible}
					tabIndex={0}
				>
					{isVisible ? (
						<EyeSlashIcon style={{ width: 20, height: 20 }} />
					) : (
						<EyeIcon style={{ width: 20, height: 20 }} />
					)}
				</button>
			</div>
			{hasError && errorMessage && <span className="input-error">{errorMessage}</span>}
		</div>
	);
};

export default PasswordInput;
