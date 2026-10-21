import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../examples/memory-executor/server.js";
import { createOpenRunClient } from "../sdk/typescript/src/index.js";

describe("ORP conformance (memory executor)", () => {
  /** @type {import('node:http').Server} */
  let server;
  /** @type {string} */
  let baseUrl;
  /** @type {ReturnType<typeof createOpenRunClient>} */
  let client;

  before(async () => {
    server = createServer();
    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
    client = createOpenRunClient(baseUrl);
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("discovery advertises open-run v1 and backends", async () => {
    const d = await client.discovery();
    assert.equal(d.protocol, "open-run");
    assert.equal(d.version, 1);
    assert.equal(d.capabilities.events_sse, true);
    assert.equal(d.orbp.protocol, "open-run-backend");
    assert.ok(d.backends.some((b) => b.kind === "direct-llm"));
  });

  it("creates run and reaches completed", async () => {
    const { run } = await client.createRun({ backendId: "echo", prompt: "hi" });
    assert.match(run.id, /^run_/);
    let status = run.status;
    for (let i = 0; i < 50 && status !== "completed"; i++) {
      await new Promise((r) => setTimeout(r, 20));
      const again = await client.getRun(run.id);
      status = again.run.status;
    }
    assert.equal(status, "completed");
    const final = await client.getRun(run.id);
    assert.match(final.run.text || "", /echo: hi/);
  });

  it("rejects wrong protocol version", async () => {
    await assert.rejects(
      () => client.createRun({ backendId: "echo", prompt: "x", version: 99 }),
      (err) => err.code === "protocol_version_unsupported",
    );
  });

  it("rejects unknown backend", async () => {
    await assert.rejects(
      () => client.createRun({ backendId: "nope", prompt: "x" }),
      (err) => err.code === "backend_unknown",
    );
  });

  it("rejects business fields like step", async () => {
    await assert.rejects(
      () =>
        client.createRun({ backendId: "echo", prompt: "x", step: 1 }),
      (err) => err.code === "validation_error",
    );
  });
});
