# Open Run Backend Profile 1

[中文](../ORBP.md)

Media type `application/vnd.open-run-backend+json`. Protocol string `open-run-backend`, integer version `1`.

ORBP describes **how** an executor works. Same HTTP origin as ORP is allowed; schema/fixtures/conformance stay separate. Discovery only advertises this document.

Phase 1 kinds: `agent-remote`, `agent-hook`, `direct-llm`, `assist`, `os-ax`.

`agent-manual` is not in v1.

Chinese ORBP is normative.
