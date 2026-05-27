import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAccessTokenExpired } from "@/lib/auth-token";
import { configureHttp } from "@/lib/http";
import { authApi } from "./auth.api";

export interface User {
	userId: string;
	username: string;
	accessToken: string;
	refreshToken: string;
}

interface AuthContextValue {
	userId: string | null;
	username: string | null;
	accessToken: string | null;
	isAuthenticated: boolean;
	/** True while login/register is in progress. */
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (name: string, email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	updateUsername: (newUsername: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "granth:auth";

function readStorage(): User | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as User) : null;
	} catch {
		return null;
	}
}

function writeStorage(user: User | null) {
	try {
		if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
		else localStorage.removeItem(STORAGE_KEY);
	} catch {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const navigate = useNavigate();
	const stored = readStorage();

	const [userId, setUserId] = useState<string | null>(stored?.userId ?? null);
	const [username, setUsername] = useState<string | null>(stored?.username ?? null);
	const [accessToken, setAccessToken] = useState<string | null>(stored?.accessToken ?? null);
	const [isLoading, setIsLoading] = useState(false);

	function applyUser(user: User) {
		setUserId(user.userId);
		setUsername(user.username);
		setAccessToken(user.accessToken);
		writeStorage(user);
	}

	function clearUser() {
		setUserId(null);
		setUsername(null);
		setAccessToken(null);
		writeStorage(null);
	}

	const refreshAccessToken = async (): Promise<string> => {
		const current = readStorage();
		if (!current?.refreshToken) throw new Error("No refresh token");
		const res = await authApi.refreshToken(current.refreshToken);
		const updated: User = {
			userId: current.userId,
			username: current.username,
			accessToken: res.accessToken,
			refreshToken: res.refreshToken,
		};
		applyUser(updated);
		return res.accessToken;
	};

	const updateUsername = async (newUsername: string): Promise<void> => {
		await authApi.updateProfile(newUsername);
		const current = readStorage();
		if (current) {
			const updated: User = { ...current, username: newUsername };
			applyUser(updated);
		}
	};

	const logout = async (): Promise<void> => {
		try {
			await authApi.logout();
		} catch {}
		clearUser();
		navigate("/login");
	};

	// Wire http + restore session on mount. Proactive refresh in http.ts covers in-flight calls.
	useEffect(() => {
		configureHttp({
			getToken: () => readStorage()?.accessToken ?? null,
			onRefresh: refreshAccessToken,
			onLogout: () => void logout(),
		});

		const current = readStorage();
		if (current?.accessToken && isAccessTokenExpired(current.accessToken)) {
			void refreshAccessToken().catch(() => clearUser());
		}
		// Mount-only; callbacks read fresh from localStorage, not React state.
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	}, []);

	const login = async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const res = await authApi.login(email, password);
			applyUser({
				userId: res.userID,
				username: res.username,
				accessToken: res.accessToken,
				refreshToken: res.refreshToken,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const register = async (name: string, email: string, password: string) => {
		setIsLoading(true);
		try {
			const res = await authApi.register(name, email, password);
			applyUser({
				userId: res.userID,
				username: res.username,
				accessToken: res.accessToken,
				refreshToken: res.refreshToken,
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				userId,
				username,
				accessToken,
				isAuthenticated: !!accessToken,
				isLoading,
				login,
				register,
				logout,
				updateUsername,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = (): AuthContextValue => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
};
