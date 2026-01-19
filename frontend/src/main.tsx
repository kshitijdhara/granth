import React from "react";
import ReactDom from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import App from "./App.tsx";
import { AuthProvider } from "./shared/contexts/AuthContext.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Failed to find the root element");
}

ReactDom.createRoot(rootElement).render(
	<React.StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<App />
			</AuthProvider>
		</BrowserRouter>
	</React.StrictMode>,
);
