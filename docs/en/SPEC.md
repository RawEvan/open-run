# Open Run Protocol 1

[中文](../SPEC.md)

Media type `application/vnd.open-run+json`. Errors use `application/problem+json`. Times are UTC ISO-8601 with `Z`. Unknown fields → 400 `validation_error`.

Describes **one executor origin**. Orchestrators list multiple `baseUrl` values locally; executors do not proxy other ORP origins.

Protocol string `open-run`, integer version `1`.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/discovery` | Discovery |
| POST | `/v1/runs` | Create run |
| GET | `/v1/runs/{id}` | Run detail |
| GET | `/v1/runs/{id}/events` | **SSE** only |
| POST | `/v1/runs/{id}/cancel` | Cancel |

`POST /v1/runs/{id}/input` is not in v1.

See the Chinese SPEC for field tables, errors, and versioning. Chinese is normative.
