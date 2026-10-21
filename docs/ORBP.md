# Open Run Backend Profile 1

[English](en/ORBP.md)

媒体类型 `application/vnd.open-run-backend+json`。协议字符串 `open-run-backend`，版本整数 `1`。

ORBP 描述执行方**内部**怎么干活。与 ORP **同一 HTTP origin 可以同时提供**，但是 **另一份** schema / fixtures / conformance。ORP discovery 只通告本文档与 `backends[]`，不代替本 schema。

## Phase 1 kinds（闭集）

| kind | 含义 |
| --- | --- |
| `agent-remote` | 无头占有外部 coding agent 进程 |
| `agent-hook` | 人在 IDE 里跑，经 hooks 回传事件 |
| `direct-llm` | 一轮补全插座 |
| `assist` | 本机轻量旁白 |
| `os-ax` | 系统级辅助功能 / 窗口位图操作与截帧 |

未知 kind → ORP 返回 `capability_unsupported`，不静默换成其它 kind。

## 后续版本（不在 v1）

| kind | 含义 |
| --- | --- |
| `agent-manual` | 人做完再回传（需 ORP `POST …/input`） |

## Backend 摘要对象

| 字段 | 说明 |
| --- | --- |
| `id` | 执行方内唯一 |
| `kind` | 上表之一 |
| `capabilities` | 闭集 boolean（如 `complete`、`tools`、`approvals`、`capture`、`teach`） |
| `label` | 可选显示名 |

## 版本

ORBP 与 ORP **各自**计 version。一方升大版本不强迫另一方同号；discovery 必须写清两份。
