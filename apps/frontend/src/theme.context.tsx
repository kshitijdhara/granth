import type React from "react";
import { createContext, useContext, useEffect } from "react";

// Liquid Truth is a dark-mode-only design system.
interface ThemeContextValue {
	theme: "dark";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	useEffect(() => {
		document.documentElement.classList.remove("theme-light", "theme-dark");
		document.documentElement.setAttribute("data-theme", "liquid-truth");
	}, []);

	return (
		<ThemeContext.Provider value={{ theme: "dark" }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = (): ThemeContextValue => {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
};
