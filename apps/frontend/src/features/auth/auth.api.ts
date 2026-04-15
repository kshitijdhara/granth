import { http } from "@/lib/http";

interface LoginResponse {
	userID: string;
	username: string;
	accessToken: string;
	refreshToken: string;
}

interface RefreshResponse {
	accessToken: string;
	refreshToken: string;
}

export const authApi = {
	login: (email: string, password: string) =>
		http.post<LoginResponse>("/auth/login", { email, password }),

	register: (name: string, email: string, password: string) =>
		http.post<LoginResponse>("/auth/register", { name, email, password }),

	refreshToken: (refreshToken: string) =>
		http.post<RefreshResponse>("/auth/refreshToken", { refreshToken }),

	logout: () => http.post<void>("/auth/logout"),

	getProfile: () => http.get<{ id: string; username: string; email: string }>("/auth/profile"),
};
