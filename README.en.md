# Open Run Protocol (ORP)

Orchestrators call any registered executor: discovery, create run, SSE events, cancel.

How an executor does work is **Open Run Backend Profile (ORBP)**: a separate schema; discovery only advertises it.

This repo follows [Joint-spec Development](https://github.com/RawEvan/joint-spec).

[中文](README.md)

## Layout

| Layer | Path |
| --- | --- |
| ORP semantics | `docs/SPEC.md` |
| ORBP semantics | `docs/ORBP.md` |
| Shape | `schema/open-run.v1.schema.json`, `schema/orbp.v1.schema.json` |
| Fixtures | `schema/fixtures/` |
| In-memory example | `examples/memory-executor/` |
| Conformance | `conformance/` |

## Try

```bash
npm install
npm test
npm run start:example   # http://127.0.0.1:38471
```

## License

MIT.
