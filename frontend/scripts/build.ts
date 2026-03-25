import path from "node:path";
import { sassPlugin } from "./sass-plugin";

const ROOT = path.resolve(import.meta.dir, "..");

const result = await Bun.build({
  entrypoints: [path.join(ROOT, "index.html")],
  outdir: path.join(ROOT, "dist"),
  plugins: [sassPlugin],
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      Bun.env.VITE_API_BASE_URL ?? "http://localhost:8080/"
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

console.log(`Build complete → dist/`);
