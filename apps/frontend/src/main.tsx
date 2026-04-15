import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { AuthProvider } from "@/features/auth/auth.context";
import { WorkspaceProvider } from "@/features/workspaces/workspace.context";
import { ThemeProvider } from "@/theme.context";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<BrowserRouter>
			<ThemeProvider>
				<AuthProvider>
					<WorkspaceProvider>
						<App />
					</WorkspaceProvider>
				</AuthProvider>
			</ThemeProvider>
		</BrowserRouter>
	</React.StrictMode>
);
