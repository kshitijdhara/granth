import type { BunPlugin } from "bun";
import { compile } from "sass";

const sassPlugin: BunPlugin = {
  name: "sass",
  setup(build) {
    build.onLoad({ filter: /\.(scss|sass)$/ }, async ({ path }) => {
      const result = await compile(path);
      return { contents: result.css, loader: "css" };
    });
  },
};

// import.meta.dir  = .../frontend/scripts
// import.meta.url  = file:///...frontend/scripts/build.ts
const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = `${ROOT}/dist`;

// --preview: skip build, just serve the existing dist/
if (Bun.argv.includes("--preview")) {
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
} else {
  const result = await Bun.build({
    entrypoints: [`${ROOT}/index.html`],
    outdir: DIST,
    plugins: [sassPlugin],
    // @ts-expect-error bun-types@1.3.11 missing alias field
    alias: { "@": `${ROOT}/src` },
    define: {
      "import.meta.env.API_BASE_URL": JSON.stringify(
        Bun.env.API_BASE_URL ?? "http://localhost:8080/api"
      ),
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": '"production"',
    },
    minify: true,
    sourcemap: "external",
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log.message);
    process.exit(1);
  }

  console.log("Build complete → dist/");
}
