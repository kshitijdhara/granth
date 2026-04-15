import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/http";
import Button from "@/ui/button";
import Input from "@/ui/input";
import { useAuth } from "./auth.context";
import AuthLayout from "./auth.layout";
import "./register.page.scss";

const RegisterPage: React.FC = () => {
	const navigate = useNavigate();
	const { register } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [nameError, setNameError] = useState("");
	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [confirmPasswordError, setConfirmPasswordError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const validateName = (v: string) => {
		if (!v.trim()) return "Name is required";
		if (v.trim().length < 2) return "Name must be at least 2 characters";
		return "";
	};

	const validateEmail = (v: string) => {
		if (!v) return "Email is required";
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address";
		return "";
	};

	const validatePassword = (v: string) => {
		if (!v) return "Password is required";
		if (v.length < 8) return "Password must be at least 8 characters";
		if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v))
			return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
		return "";
	};

	const validateConfirmPassword = (v: string) => {
		if (!v) return "Please confirm your password";
		if (v !== password) return "Passwords do not match";
		return "";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const nErr = validateName(name);
		const eErr = validateEmail(email);
		const pErr = validatePassword(password);
		const cErr = validateConfirmPassword(confirmPassword);
		setNameError(nErr);
		setEmailError(eErr);
		setPasswordError(pErr);
		setConfirmPasswordError(cErr);
		if (nErr || eErr || pErr || cErr) return;

		setIsSubmitting(true);
		try {
			await register(name, email, password);
			navigate("/home");
		} catch (err) {
			const msg = err instanceof ApiError ? err.message : "Registration failed. Please try again.";
			setEmailError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AuthLayout>
			<form className="register-form" onSubmit={handleSubmit}>
				<div className="register-form__header">
					<h1 className="register-form__title">Create account</h1>
					<p className="register-form__subtitle">Join us today</p>
				</div>

				<div className="register-form__fields">
					<Input
						label="Full name"
						type="text"
						value={name}
						placeholder="Enter your full name"
						isRequired
						hasError={!!nameError}
						errorMessage={nameError}
						onChange={setName}
						onBlur={() => setNameError(validateName(name))}
					/>
					<Input
						label="Email"
						type="email"
						value={email}
						placeholder="Enter your email"
						isRequired
						hasError={!!emailError}
						errorMessage={emailError}
						onChange={setEmail}
						onBlur={() => setEmailError(validateEmail(email))}
					/>
					<Input
						label="Password"
						type="password"
						value={password}
						placeholder="Create a password"
						isRequired
						hasError={!!passwordError}
						errorMessage={passwordError}
						onChange={(v) => {
							setPassword(v);
							if (confirmPassword)
								setConfirmPasswordError(validateConfirmPassword(confirmPassword));
						}}
						onBlur={() => setPasswordError(validatePassword(password))}
					/>
					<Input
						label="Confirm password"
						type="password"
						value={confirmPassword}
						placeholder="Confirm your password"
						isRequired
						hasError={!!confirmPasswordError}
						errorMessage={confirmPasswordError}
						onChange={setConfirmPassword}
						onBlur={() => setConfirmPasswordError(validateConfirmPassword(confirmPassword))}
					/>
				</div>

				<div className="register-form__actions">
					<Button
						type="submit"
						variant="primary"
						size="large"
						isDisabled={isSubmitting}
						isFullWidth
					>
						{isSubmitting ? "Creating account…" : "Create account"}
					</Button>
					<div className="register-form__switch">
						<span className="register-form__switch-text">Already have an account?</span>
						<button
							type="button"
							className="register-form__switch-link"
							onClick={() => navigate("/login")}
						>
							Sign in
						</button>
					</div>
				</div>
			</form>
		</AuthLayout>
	);
};

export default RegisterPage;
