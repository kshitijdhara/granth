import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react-swc";
import status from "http-status";
import {
	defineConfig,
	type Plugin,
	type PreviewServer,
	type ViteDevServer,
} from "vite";

const healthCheckPlugin = (): Plugin => ({
	name: "health-check",
	configureServer(server: ViteDevServer) {
		server.middlewares.use(
			"/health",
			(_req: IncomingMessage, res: ServerResponse) => {
				try {
					res.statusCode = status.OK;
					res.setHeader("Content-Type", "text/plain");
					res.end("OK");
				} catch {
					res.statusCode = status.INTERNAL_SERVER_ERROR;
					res.setHeader("Content-Type", "text/plain");
					res.end("Unhealthy");
				}
			},
		);
	},
	configurePreviewServer(server: PreviewServer) {
		server.middlewares.use(
			"/health",
			(_req: IncomingMessage, res: ServerResponse) => {
				try {
					res.statusCode = status.OK;
					res.setHeader("Content-Type", "text/plain");
					res.end("OK");
				} catch {
					res.statusCode = status.INTERNAL_SERVER_ERROR;
					res.setHeader("Content-Type", "text/plain");
					res.end("Unhealthy");
				}
			},
		);
	},
});

export default defineConfig({
	plugins: [react(), healthCheckPlugin()],
	server:{
		port: 3000,
		host: "0.0.0.0",
		allowedHosts: ["127.0.0.1"],
		strictPort: true
	},
	preview:{
		port: 3000,
		host: "0.0.0.0",
		allowedHosts: ["127.0.0.1"],
		strictPort: true
	},
	envDir: "../.env"
});
