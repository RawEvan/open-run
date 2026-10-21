#!/usr/bin/env node
/**
 * In-memory ORP executor for conformance and local demos.
 */
import http from "node:http";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.OPEN_RUN_PORT || 38471);
const MEDIA = "application/vnd.open-run+json";

/** @type {Map<string, object>} */
const runs = new Map();

const discovery = {
  protocol: "open-run",
  version: 1,
  capabilities: { runs: true, events_sse: true, cancel: true },
  orbp: {
    protocol: "open-run-backend",
    version: 1,
    document_url: "https://github.com/RawEvan/open-run/blob/main/docs/ORBP.md",
    media_type: "application/vnd.open-run-backend+json",
  },
  backends: [
    {
      id: "echo",
      kind: "direct-llm",
      capabilities: { complete: true },
      label: "Echo",
    },
  ],
};

function now() {
  return new Date().toISOString();
}

function sendJson(res, status, body, media = MEDIA) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": media,
    "content-length": Buffer.byteLength(raw),
  });
  res.end(raw);
}

function problem(res, status, code, title, extra = {}) {
  sendJson(
    res,
    status,
    { type: "about:blank", title, status, code, ...extra },
    "application/problem+json",
  );
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function createRun(body) {
  if (body.protocol != null && body.protocol !== "open-run") {
    const err = new Error("unsupported protocol");
    err.code = "protocol_version_unsupported";
    throw err;
  }
  if (body.version != null && body.version !== 1) {
    const err = new Error("unsupported version");
    err.code = "protocol_version_unsupported";
    throw err;
  }
  for (const banned of ["step", "gate", "publish"]) {
    if (Object.prototype.hasOwnProperty.call(body, banned)) {
      const err = new Error(`unknown field ${banned}`);
      err.code = "validation_error";
      throw err;
    }
  }
  if (!body.backendId) {
    const err = new Error("backendId required");
    err.code = "validation_error";
    throw err;
  }
  if (!discovery.backends.some((b) => b.id === body.backendId)) {
    const err = new Error("unknown backend");
    err.code = "backend_unknown";
    throw err;
  }
  if (!body.prompt && !Array.isArray(body.messages)) {
    const err = new Error("prompt or messages required");
    err.code = "validation_error";
    throw err;
  }
  const id = `run_${randomBytes(6).toString("hex")}`;
  const ts = now();
  const prompt =
    body.prompt ||
    (body.messages || []).map((m) => m.content).join("\n");
  const run = {
    id,
    status: "queued",
    backendId: body.backendId,
    clientRef: body.clientRef ?? null,
    created_at: ts,
    updated_at: ts,
    _prompt: prompt,
    _chunks: [],
  };
  runs.set(id, run);
  queueMicrotask(() => {
    run.status = "running";
    run.updated_at = now();
    const reply = `echo: ${prompt}`;
    run._chunks.push(reply);
    run.text = reply;
    run.status = "completed";
    run.updated_at = now();
  });
  return publicRun(run);
}

function publicRun(run) {
  const { _prompt, _chunks, ...rest } = run;
  return rest;
}

function handleEvents(req, res, id) {
  const run = runs.get(id);
  if (!run) {
    problem(res, 404, "run_not_found", "Run not found");
    return;
  }
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  const write = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };
  write({ type: "status", status: run.status, ts: now() });
  const tick = setInterval(() => {
    const r = runs.get(id);
    if (!r) {
      clearInterval(tick);
      res.end();
      return;
    }
    if (r._chunks.length) {
      write({ type: "chunk", text: r._chunks.shift(), ts: now() });
    }
    if (r.status === "completed" || r.status === "cancelled" || r.status === "failed") {
      write({ type: "done", status: r.status, ts: now() });
      clearInterval(tick);
      res.end();
    }
  }, 20);
  req.on("close", () => clearInterval(tick));
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1`);
    const path = url.pathname;

    try {
      if (req.method === "GET" && path === "/v1/discovery") {
        sendJson(res, 200, discovery);
        return;
      }
      if (req.method === "POST" && path === "/v1/runs") {
        const body = await readBody(req);
        const run = createRun(body);
        sendJson(res, 200, { run });
        return;
      }
      const runMatch = path.match(/^\/v1\/runs\/([^/]+)(\/events|\/cancel)?$/);
      if (runMatch) {
        const id = decodeURIComponent(runMatch[1]);
        const sub = runMatch[2];
        if (req.method === "GET" && !sub) {
          const run = runs.get(id);
          if (!run) {
            problem(res, 404, "run_not_found", "Run not found");
            return;
          }
          sendJson(res, 200, { run: publicRun(run) });
          return;
        }
        if (req.method === "GET" && sub === "/events") {
          handleEvents(req, res, id);
          return;
        }
        if (req.method === "POST" && sub === "/cancel") {
          const run = runs.get(id);
          if (!run) {
            problem(res, 404, "run_not_found", "Run not found");
            return;
          }
          if (run.status === "queued" || run.status === "running") {
            run.status = "cancelled";
            run.updated_at = now();
          }
          sendJson(res, 200, { run: publicRun(run) });
          return;
        }
      }
      problem(res, 404, "not_found", "Not found");
    } catch (err) {
      const code = err.code || "internal_error";
      const status =
        code === "validation_error" || code === "backend_unknown"
          ? 400
          : code === "protocol_version_unsupported" || code === "capability_unsupported"
            ? 400
            : 500;
      problem(res, status, code, String(err.message || err));
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const server = createServer();
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`open-run memory executor http://127.0.0.1:${PORT}`);
  });
}
