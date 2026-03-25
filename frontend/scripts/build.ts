import { sassPlugin } from "./sass-plugin";

// import.meta.dir  = .../frontend/scripts
// import.meta.url  = file:///...frontend/scripts/build.ts
const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

const result = await Bun.build({
  entrypoints: [`${ROOT}/index.html`],
  outdir: `${ROOT}/dist`,
  plugins: [sassPlugin],
  // @ts-expect-error bun-types@1.3.11 missing alias field
  alias: { "@": `${ROOT}/src` },
  define: {
    "import.meta.env.API_BASE_URL": JSON.stringify(
      Bun.env.API_BASE_URL ?? "http://localhost:8080"
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
