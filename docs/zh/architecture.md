<!-- 本文件由 docs/architecture.md 翻译生成；原文仍保留在上级目录。 -->

# 架构

本页将 nanobot 的运行时行为映射到源文件。当你在调试内部实现、审查 PR、添加提供商/通道/工具，或者想弄清某个用户可见行为的来源时，可以使用它。

关于产品层面的心智模型，请先阅读 [`concepts.md`](./concepts.md)。

## 核心流程

```mermaid
flowchart LR
    Channel["Channel<br/>CLI, WebUI, chat apps"] --> Bus["MessageBus<br/>InboundMessage"]
    Bus --> Loop["AgentLoop<br/>session, workspace, context"]
    Loop --> Runner["AgentRunner<br/>provider/tool loop"]
    Runner --> Provider["Provider<br/>LLM backend"]
    Provider --> Runner
    Runner --> Tools["Tools<br/>files, shell, web, MCP, cron"]
    Tools --> Runner
    Runner --> Loop
    Loop --> Outbound["MessageBus<br/>OutboundMessage"]
    Outbound --> Channel

    Loop -. reads/writes .-> State["Session, memory,<br/>hooks, skills, templates"]
```

主要文件：

| 区域 | 文件 |
|---|---|
| 消息事件与队列 | `nanobot/bus/events.py`, `nanobot/bus/queue.py` |
| 回合编排 | `nanobot/agent/loop.py` |
| 提供商/工具对话循环 | `nanobot/agent/runner.py` |
| 上下文构建 | `nanobot/agent/context.py` |
| 会话存储与压缩 | `nanobot/session/manager.py` |
| 长期记忆与 Dream | `nanobot/agent/memory.py` |

## 智能体循环 vs 智能体运行器

`AgentLoop` 负责面向通道的回合：

- 接收传入消息；
- 确定生效的会话和工作区范围；
- 构建上下文；
- 连接 hooks、进度和通道元数据；
- 发布传出消息。

`AgentRunner` 负责面向模型的循环：

- 向选定的提供商发送消息；
- 处理流式 delta 和 reasoning 块；
- 执行工具调用；
- 将工具结果反馈给模型；
- 在生成最终答案或触及运行时限制时停止。

调试时请记住这个拆分。如果问题涉及通道路由、会话键、工作区选择或传出交付，应从 `agent/loop.py` 开始。如果问题涉及提供商调用、工具调用、流式传输或迭代限制，应从 `agent/runner.py` 开始。

## 提供商

提供商元数据集中定义在 `nanobot/providers/registry.py` 中。配置字段位于 `nanobot/config/schema.py`。

提供商选择使用：

- 显式 `agents.defaults.provider` 或预设提供商；
- 提供商注册表关键字；
- API key 前缀和 API base URL 提示；
- 配置了 `apiBase` 时的本地提供商回退；
- 可路由多个模型家族的提供商的网关回退。

提供商实现位于 `nanobot/providers/`。大多数托管提供商使用 OpenAI 兼容实现，而 Anthropic、Azure OpenAI、AWS Bedrock、OpenAI Codex 和 GitHub Copilot 具有专门路径。

有用的文档：

- [`providers.md`](./providers.md) 用于实际配置；
- [`configuration.md#providers`](./configuration.md#providers) 用于精确的提供商参考。

## 通道

通道将外部平台转换为 `InboundMessage` 事件，并将 `OutboundMessage` 事件发送回平台。

主要文件：

| 区域 | 文件 |
|---|---|
| 基础通道契约 | `nanobot/channels/base.py` |
| 内置通道 | `nanobot/channels/*.py` |
| 发现与生命周期 | `nanobot/channels/manager.py` |
| WebSocket/WebUI 通道 | `nanobot/channels/websocket.py` |

通道通过内置模块扫描和插件入口点来发现。自定义通道应遵循 [`channel-plugin-guide.md`](./channel-plugin-guide.md)。

## WebUI 和网关

`nanobot gateway` 启动：

- 已启用的聊天通道；
- 配置后启用的 WebSocket 通道；
- 工作区范围的 cron 服务；
- Dream 和 heartbeat 等系统任务；
- 位于 `gateway.port` 的健康检查端点。

打包后的 WebUI 由 WebSocket 通道提供服务，而不是健康检查端点：

| 表面 | 默认值 |
|---|---|
| 健康检查端点 | `http://127.0.0.1:18790/health` |
| WebUI/WebSocket | `http://127.0.0.1:8765` |

WebUI 源码位于 `webui/`。生产构建会写入 `nanobot/web/dist/` 并打包进 wheel。

有用的文档：

- [`webui.md`](./webui.md) 用于 WebUI 用户指南；
- [`../webui/README.md`](../webui/README.md) 用于前端源码开发；
- [`websocket.md`](./websocket.md) 用于协议细节。

## 工具

工具通过 `nanobot/agent/tools/` 和插件入口点发现。

重要文件：

| 工具区域 | 文件 |
|---|---|
| 工具基础与 schema | `nanobot/agent/tools/base.py`, `nanobot/agent/tools/schema.py` |
| 发现 | `nanobot/agent/tools/registry.py` |
| Shell 执行 | `nanobot/agent/tools/shell.py` |
| 文件系统工具 | `nanobot/agent/tools/filesystem.py` |
| Web 搜索/获取 | `nanobot/agent/tools/web.py` |
| MCP 工具 | `nanobot/agent/tools/mcp.py` |
| Cron | `nanobot/agent/tools/cron.py`, `nanobot/cron/` |
| 图像生成 | `nanobot/agent/tools/image_generation.py` |
| 运行时自检 | `nanobot/agent/tools/self.py` |

工具行为是模型契约的一部分。除非变更是有意为之，否则请保持用户可见的工具名称、schema 和错误消息稳定。

## 配置和路径

配置 schema 位于 `nanobot/config/schema.py`。加载和保存位于 `nanobot/config/loader.py`。运行时路径辅助函数位于 `nanobot/config/paths.py`。

默认值：

| 路径 | 默认值 |
|---|---|
| 配置 | `~/.nanobot/config.json` |
| 工作区 | `~/.nanobot/workspace/` |
| 会话 | `<workspace>/sessions/*.jsonl` |
| 记忆 | `<workspace>/memory/` |
| Cron 存储 | `<workspace>/cron/jobs.json` |
| WebUI/媒体/日志运行时数据 | 配置目录下的子目录，例如 `webui/`、`media/` 和 `logs/` |

schema 同时接受 camelCase 和 snake_case 键，但会使用 camelCase 别名保存配置。

## 记忆和会话

会话历史是近期对话回放。记忆是更长期的工作区状态。

| 存储 | 文件区域 |
|---|---|
| Session JSONL 文件 | `<workspace>/sessions/` |
| 长期记忆 | `<workspace>/memory/MEMORY.md` |
| 整合源历史 | `<workspace>/memory/history.jsonl` |
| 启动身份文件 | `<workspace>/SOUL.md`, `<workspace>/USER.md`, `nanobot/templates/` 下的模板 |

Dream 实现在 `nanobot/agent/memory.py` 中，并在启用时由运行时调度。

## 安全边界

安全敏感代码路径包括：

| 边界 | 文件 |
|---|---|
| 工作区范围 | `nanobot/security/workspace_access.py`, `nanobot/security/workspace_policy.py` |
| Shell 沙箱 | `nanobot/agent/tools/shell.py` |
| SSRF/网络检查 | `nanobot/security/network.py`, `nanobot/agent/tools/web.py` |
| PTH 防护与 CLI 启动安全 | `nanobot/security/` 和 CLI 入口点 |
| 通道访问控制 | `nanobot/channels/*.py` 中的通道配置 |

在更改工具、通道、文件访问、WebUI 工作区行为或网络获取时，请将安全视为功能行为的一部分；如果用户可见边界发生变化，请更新文档。

## 扩展点

| 扩展 | 方法 |
|---|---|
| 提供商 | 在 `providers/registry.py` 中添加 `ProviderSpec`，在 `config/schema.py` 中添加 schema 字段；如果通用后端不够用，再实现专用提供商 |
| 通道 | 实现 `BaseChannel`，暴露一个入口点，遵循 [`channel-plugin-guide.md`](./channel-plugin-guide.md) |
| 工具 | 在 `agent/tools/` 下实现一个工具，或暴露一个插件入口点 |
| MCP | 添加 `tools.mcpServers` 配置 |
| 技能 | 在 `<workspace>/skills/` 下添加工作区技能文件，或在 `nanobot/skills/` 下添加内置技能 |

优先使用现有的注册表/发现模式，而不是临时连线。

## 测试与验证

常见检查：

```bash
pytest tests/test_openai_api.py::test_function -v
ruff check nanobot/
cd webui && bun run test
cd webui && bun run build
```

根据变更的表面选择测试：

| 变更 | 最低有用验证 |
|---|---|
| 提供商行为 | 提供商单元测试或模拟 API 路径；在可能时使用安全配置进行 `nanobot agent -m "Hello!"` |
| 通道行为 | 通道测试以及 `nanobot gateway` 启动路径 |
| WebUI 行为 | WebUI 测试/构建，对于路由/设置/聊天变更，通过网关进行浏览器级验证 |
| 工具行为 | 工具单元测试；如果 schema 或面向模型的行为发生变化，则进行智能体运行路径验证 |
| 文档 | 链接检查、命令与 CLI/schema 的准确性，以及 `git diff --check` |

对于用户可见流程，优先至少选择一个通过用户实际接触的公共表面的验证路径：CLI 命令、HTTP 端点、WebSocket/WebUI、聊天通道，或打包导入。
