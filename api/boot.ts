import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { createServer } from "http";
import { initSocketIO } from "./socket";

const app = new Hono<{ Bindings: HttpBindings }>();
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// simple health/word-count endpoint
app.get("/api/words/count", async (c) => {
  const { getWordCount } = await import("./game-engine/wordBank");
  return c.json({ count: getWordCount() });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

// -- server setup --

function honoToNodeListener(fetchHandler: typeof app.fetch) {
  return async (req: import("http").IncomingMessage, res: import("http").ServerResponse) => {
    const url = `http://${req.headers.host}${req.url}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      else headers.set(key, value);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    try {
      const request = new Request(url, {
        method: req.method,
        headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
      });
      const response = await fetchHandler(request);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } catch {
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  };
}

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);
  const port = parseInt(process.env.PORT || "3000");
  const server = createServer(honoToNodeListener(app.fetch));
  initSocketIO(server);
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
} else {
  const server = createServer(honoToNodeListener(app.fetch));
  initSocketIO(server);
  server.listen(3001, () => console.log(`Socket.IO server running on http://localhost:3001/`));
}
