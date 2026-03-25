import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const DIST = path.join(ROOT, "dist");

const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response("OK", { headers: { "Content-Type": "text/plain" } });
    }

    const relPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = Bun.file(path.join(DIST, relPath));

    if (await file.exists()) {
      return new Response(file);
    }

    // SPA fallback
    return new Response(Bun.file(path.join(DIST, "index.html")));
  },
});

console.log(`Preview server: http://localhost:${server.port}`);
