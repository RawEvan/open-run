import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020.js").default;
const addFormats = require("ajv-formats");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const openRun = JSON.parse(
  readFileSync(join(root, "schema/open-run.v1.schema.json"), "utf8"),
);
const orbp = JSON.parse(readFileSync(join(root, "schema/orbp.v1.schema.json"), "utf8"));

ajv.addSchema(openRun);
const validateDiscovery = ajv.getSchema(
  "https://raw.githubusercontent.com/RawEvan/open-run/main/schema/open-run.v1.schema.json#/$defs/discovery",
);
const validateCreate = ajv.getSchema(
  "https://raw.githubusercontent.com/RawEvan/open-run/main/schema/open-run.v1.schema.json#/$defs/createRun",
);
const validateOrbp = ajv.compile(orbp);

function loadDir(rel) {
  const dir = join(root, rel);
  return readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .map((n) => ({
      name: n,
      data: JSON.parse(readFileSync(join(dir, n), "utf8")),
    }));
}

describe("open-run schema fixtures", () => {
  for (const { name, data } of loadDir("schema/fixtures/valid/open-run")) {
    it(`valid ${name}`, () => {
      const fn = name.startsWith("discovery") ? validateDiscovery : validateCreate;
      assert.ok(fn, "validator missing");
      assert.equal(fn(data), true, JSON.stringify(fn.errors));
    });
  }
  for (const { name, data } of loadDir("schema/fixtures/invalid/open-run")) {
    it(`invalid ${name}`, () => {
      const fn = name.includes("discovery") ? validateDiscovery : validateCreate;
      assert.equal(fn(data), false);
    });
  }
});

describe("orbp schema fixtures", () => {
  for (const { name, data } of loadDir("schema/fixtures/valid/orbp")) {
    it(`valid ${name}`, () => {
      assert.equal(validateOrbp(data), true, JSON.stringify(validateOrbp.errors));
    });
  }
  for (const { name, data } of loadDir("schema/fixtures/invalid/orbp")) {
    it(`invalid ${name}`, () => {
      assert.equal(validateOrbp(data), false);
    });
  }
});
