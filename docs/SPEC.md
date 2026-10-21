# Open Run Protocol 1

[English](en/SPEC.md)

媒体类型 `application/vnd.open-run+json`。错误用 `application/problem+json`。时间 UTC ISO-8601（含 `Z`）。请求体出现 schema 未定义字段时返回 400 `validation_error`，不忽略。

本协议描述**一个执行方 origin**。编排方用本地注册表列出多个 `baseUrl`；执行方不代理其它 ORP origin。

协议字符串 `open-run`，版本整数 `1`。

## 1. 能力面

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/v1/discovery` | 发现文档 |
| POST | `/v1/runs` | 创建 run |
| GET | `/v1/runs/{id}` | run 详情 |
| GET | `/v1/runs/{id}/events` | **SSE** 事件流 |
| POST | `/v1/runs/{id}/cancel` | 取消 |

`POST /v1/runs/{id}/input` **不在 v1**（与 ORBP `agent-manual` 同进后续版本）。

路径前缀 `/v1` 固定。成功响应 `Content-Type: application/vnd.open-run+json`（SSE 除外：`text/event-stream`）。

## 2. Discovery

```json
{
  "protocol": "open-run",
  "version": 1,
  "capabilities": {
    "runs": true,
    "events_sse": true,
    "cancel": true
  },
  "orbp": {
    "protocol": "open-run-backend",
    "version": 1,
    "document_url": "https://example.invalid/docs/ORBP.md",
    "media_type": "application/vnd.open-run-backend+json"
  },
  "backends": [
    {
      "id": "demo",
      "kind": "direct-llm",
      "capabilities": { "complete": true }
    }
  ]
}
```

- `capabilities`：闭集 boolean；缺键 = false。
- `orbp`：通告 ORBP 文档，**不内嵌** ORBP schema。
- `backends[]`：本机 backend 摘要（id、kind、capabilities）。未知 kind 创建 run 时返回 `capability_unsupported`。

不支持的协议 version → `protocol_version_unsupported`，`detail` 含通告的 version 列表。禁止静默按其它 version 处理。

## 3. Run

### 3.1 创建 `POST /v1/runs`

请求体（无业务枚举字段）：

| 字段 | 说明 |
| --- | --- |
| `backendId` | 必填，对应 discovery `backends[].id` |
| `prompt` | 与 `messages` 二选一 |
| `messages` | `{ role, content }[]` |
| `cwd` | 可选工作目录 |
| `clientRef` | 可选不透明关联串 |
| `attachments` | 可选附件元数据数组 |
| `protocol` / `version` | 可选；若出现必须为 `open-run` / `1` |

禁止字段：step、gate、publish 及任何产品业务态。

响应：`{ "run": Run }`。

### 3.2 Run 对象

| 字段 | 说明 |
| --- | --- |
| `id` | 前缀 `run_` |
| `status` | `queued` \| `running` \| `completed` \| `cancelled` \| `failed` |
| `backendId` | |
| `clientRef` | 或 `null` |
| `created_at` `updated_at` | |
| `text` | 可选最终文本 |
| `error` | 失败时可选 |

### 3.3 事件 SSE `GET /v1/runs/{id}/events`

每条 `data:` 为 JSON：

```json
{ "type": "status", "status": "running", "ts": "…" }
{ "type": "chunk", "text": "…", "ts": "…" }
{ "type": "done", "status": "completed", "ts": "…" }
```

v1 **仅 SSE**，不用 WebSocket。

### 3.4 取消 `POST /v1/runs/{id}/cancel`

将 run 标为 `cancelled`（若仍可取消）。

## 4. 错误

| code | 何时 |
| --- | --- |
| `validation_error` | 形状不符 / 未知字段 |
| `capability_unsupported` | backend kind 或能力不支持 |
| `protocol_version_unsupported` | version 对不上 |
| `run_not_found` | 未知 run id |
| `backend_unknown` | `backendId` 不在 discovery |

## 5. 版本

见 Joint-spec [VERSIONING](https://github.com/RawEvan/joint-spec/blob/main/docs/VERSIONING.md)。破坏性改形状 → `open-run.v2.schema.json` 与 version `2`。上一整数在下一整数发布后再保留至少 90 天。

## 6. 注册（编排方）

编排方本地配置 `executors[]: { id, baseUrl }`。缺项失败。不做 UDP / 扫盘发现。凭证不进本仓 fixtures。
