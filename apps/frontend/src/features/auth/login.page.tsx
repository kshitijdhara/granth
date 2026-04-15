import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/http";
import Button from "@/ui/button";
import Input from "@/ui/input";
import { useAuth } from "./auth.context";
import AuthLayout from "./auth.layout";
import "./login.page.scss";

const LoginPage: React.FC = () => {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const validateEmail = (v: string) => {
		if (!v) return "Email is required";
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address";
		return "";
	};

	const validatePassword = (v: string) => {
		if (!v) return "Password is required";
		if (v.length < 8) return "Password must be at least 8 characters";
		return "";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const eErr = validateEmail(email);
		const pErr = validatePassword(password);
		setEmailError(eErr);
		setPasswordError(pErr);
		if (eErr || pErr) return;

		setIsSubmitting(true);
		try {
			await login(email, password);
			navigate("/home");
		} catch (err) {
			if (err instanceof ApiError && err.status === 401) {
				setEmailError("Invalid email or password");
			} else if (err instanceof ApiError && err.status === 429) {
				setEmailError("Too many login attempts. Please try again later.");
			} else {
				setEmailError("Login failed. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AuthLayout>
			<form className="login-form" onSubmit={handleSubmit}>
				<div className="login-form__header">
					<h1 className="login-form__title">Welcome back</h1>
					<p className="login-form__subtitle">Sign in to your account</p>
				</div>

				<div className="login-form__fields">
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
						placeholder="Enter your password"
						isRequired
						hasError={!!passwordError}
						errorMessage={passwordError}
						onChange={setPassword}
						onBlur={() => setPasswordError(validatePassword(password))}
					/>
				</div>

				<div className="login-form__actions">
					<Button
						type="submit"
						variant="primary"
						size="large"
						isDisabled={isSubmitting}
						isFullWidth
					>
						{isSubmitting ? "Signing in…" : "Sign in"}
					</Button>
					<div className="login-form__switch">
						<span className="login-form__switch-text">Don't have an account?</span>
						<button
							type="button"
							className="login-form__switch-link"
							onClick={() => navigate("/register")}
						>
							Sign up
						</button>
					</div>
				</div>
			</form>
		</AuthLayout>
	);
};

export default LoginPage;
