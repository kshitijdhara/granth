import { watch } from "fs";
import { sassPlugin } from "./sass-plugin";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DIST = `${ROOT}/dist`;

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
    entrypoints: [`${ROOT}/index.html`],
    outdir: DIST,
    plugins: [sassPlugin],
    // @ts-expect-error bun-types@1.3.11 missing alias field
    alias: { "@": `${ROOT}/src` },
    define: {
      "import.meta.env.API_BASE_URL": JSON.stringify(
        Bun.env.API_BASE_URL ?? "http://localhost:8080/api"
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

await build();

let debounceTimer: Timer | null = null;
function scheduleRebuild() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(build, 80);
}

watch(`${ROOT}/src`, { recursive: true }, scheduleRebuild);
watch(`${ROOT}/index.html`, scheduleRebuild);

const LIVE_RELOAD_SCRIPT = `<script>
  new EventSource("/__dev_reload").onmessage = () => location.reload();
</script>`;

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

    const relPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = Bun.file(`${DIST}/${relPath}`);

    if (await file.exists()) {
      if (relPath === "index.html") {
        const html = await file.text();
        return new Response(html.replace("</body>", `${LIVE_RELOAD_SCRIPT}\n</body>`), {
          headers: { "Content-Type": "text/html" },
        });
      }
      return new Response(file);
    }

    // SPA fallback
    const indexFile = Bun.file(`${DIST}/index.html`);
    if (await indexFile.exists()) {
      const html = await indexFile.text();
      return new Response(html.replace("</body>", `${LIVE_RELOAD_SCRIPT}\n</body>`), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Dev server: http://localhost:${server.port}`);
