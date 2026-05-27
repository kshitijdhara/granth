import type React from "react";
import { useId } from "react";
import "./input.scss";

interface InputProps {
	label?: string;
	type?: "text" | "email" | "password";
	value: string;
	placeholder?: string;
	isRequired?: boolean;
	isDisabled?: boolean;
	hasError?: boolean;
	errorMessage?: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
}

const Input: React.FC<InputProps> = ({
	label,
	type = "text",
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
	const isFocused = false; // In a real app, track focus state
	const hasValue = value && value.length > 0;
	const shouldFloatLabel = hasValue || isFocused || !placeholder;

	const classes = [
		"input",
		hasError && "input--error",
		isDisabled && "input--disabled",
	]
		.filter(Boolean)
		.join(" ");

	const containerClasses = [
		"input-container",
		shouldFloatLabel && "input-container--floating",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={containerClasses}>
			{label && (
				<label htmlFor={id} className="input-label">
					{label}
					{isRequired && <span className="input-required">*</span>}
				</label>
			)}
			<input
				id={id}
				className={classes}
				type={type}
				value={value}
				placeholder={placeholder}
				required={isRequired}
				disabled={isDisabled}
				onChange={(e) => onChange(e.target.value)}
				onBlur={onBlur}
			/>
			{hasError && errorMessage && <span className="input-error">{errorMessage}</span>}
		</div>
	);
};

export default Input;
