const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = `${ROOT}/dist`;

const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response("OK", { headers: { "Content-Type": "text/plain" } });
    }

    const relPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = Bun.file(`${DIST}/${relPath}`);

    if (await file.exists()) return new Response(file);

    // SPA fallback
    return new Response(Bun.file(`${DIST}/index.html`));
  },
});

console.log(`Preview server: http://localhost:${server.port}`);
