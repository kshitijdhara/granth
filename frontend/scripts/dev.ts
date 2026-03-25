import { watch } from "node:fs";
import path from "node:path";
import { sassPlugin } from "./sass-plugin";

const ROOT = path.resolve(import.meta.dir, "..");
const DIST = path.join(ROOT, "dist");

const sseClients = new Set<ReadableStreamDefaultController<string>>();

function notifyClients() {
  for (const ctrl of sseClients) {
    try {
      ctrl.enqueue("data: reload\n\n");
    } catch {
      sseClients.delete(ctrl);
    }
  }
}

async function build() {
  const result = await Bun.build({
    entrypoints: [path.join(ROOT, "index.html")],
    outdir: DIST,
    plugins: [sassPlugin],
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        Bun.env.VITE_API_BASE_URL ?? "http://localhost:8080/"
      ),
      "import.meta.env.DEV": "true",
      "import.meta.env.PROD": "false",
      "import.meta.env.MODE": '"development"',
    },
    sourcemap: "inline",
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log.message);
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] rebuilt`);
    notifyClients();
  }
}

// Initial build
await build();

// Watch src and index.html for changes
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRebuild() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(build, 80);
}

watch(path.join(ROOT, "src"), { recursive: true }, scheduleRebuild);
watch(path.join(ROOT, "index.html"), scheduleRebuild);

// Inject live-reload script into index.html response
const LIVE_RELOAD_SCRIPT = `<script>
  new EventSource("/__dev_reload").onmessage = () => location.reload();
</script>`;

function injectLiveReload(html: string): string {
  return html.replace("</body>", `${LIVE_RELOAD_SCRIPT}\n</body>`);
}

const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response("OK", { headers: { "Content-Type": "text/plain" } });
    }

    if (url.pathname === "/__dev_reload") {
      let controller!: ReadableStreamDefaultController<string>;
      const stream = new ReadableStream<string>({
        start(ctrl) {
          controller = ctrl;
          sseClients.add(ctrl);
        },
        cancel() {
          sseClients.delete(controller);
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Serve static files from dist, fall back to index.html for SPA routing
    const relPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const filePath = path.join(DIST, relPath);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      if (relPath === "index.html" || relPath === "") {
        const html = await file.text();
        return new Response(injectLiveReload(html), {
          headers: { "Content-Type": "text/html" },
        });
      }
      return new Response(file);
    }

    // SPA fallback
    const indexFile = Bun.file(path.join(DIST, "index.html"));
    if (await indexFile.exists()) {
      const html = await indexFile.text();
      return new Response(injectLiveReload(html), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Dev server: http://localhost:${server.port}`);
