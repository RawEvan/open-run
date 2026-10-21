# Open Run Protocol（ORP）

编排方调用任意已注册执行方：发现、开跑、SSE 事件、取消。

执行方内部怎么干活由 **Open Run Backend Profile（ORBP）** 描述：独立 schema，discovery 只通告。

本仓遵循 [Joint-spec Development](https://github.com/RawEvan/joint-spec)（卯合开发）。

[English](README.en.md)

## 结构

| 层 | 路径 |
| --- | --- |
| ORP 语义 | `docs/SPEC.md` |
| ORBP 语义 | `docs/ORBP.md` |
| 形状 | `schema/open-run.v1.schema.json`、`schema/orbp.v1.schema.json` |
| Fixtures | `schema/fixtures/` |
| 内存示例执行方 | `examples/memory-executor/` |
| Conformance | `conformance/` |

## 试用

```bash
npm install
npm test
npm run start:example   # http://127.0.0.1:38471
```

## 许可证

MIT。
