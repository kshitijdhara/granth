import React from "react";
import ReactDom from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import App from "./App.tsx";
import { AuthProvider } from "./shared/contexts/AuthContext.tsx";
import { ThemeProvider } from "./shared/contexts/ThemeContext";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Failed to find the root element");
}

ReactDom.createRoot(rootElement).render(
	<React.StrictMode>
		<BrowserRouter>
				<ThemeProvider>
					<AuthProvider>
						<App />
					</AuthProvider>
				</ThemeProvider>
		</BrowserRouter>
	</React.StrictMode>,
);
