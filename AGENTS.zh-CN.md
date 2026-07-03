本文件为在此仓库中工作的 AI 编码代理提供指导。

## 项目概览

nanobot 是一个轻量级、开源的 AI Agent 框架，使用 Python 编写，并带有 React/TypeScript WebUI。它围绕一个小型 Agent 循环构建：从聊天渠道接收消息，调用 LLM Provider，执行工具，并管理会话记忆。

## 开发命令

```bash
# Python: 运行单个测试 / lint
pytest tests/test_openai_api.py::test_function -v
ruff check nanobot/

# WebUI: 开发服务器（将 API/WS 代理到 gateway :8765）、构建、测试
# 构建输出到 ../nanobot/web/dist（会打包进 Python wheel）
cd webui && bun run dev      # 或 NANOBOT_API_URL=... bun run dev
cd webui && bun run build
cd webui && bun run test

# Gateway
nanobot gateway
```

## 高层架构

### 核心数据流

消息通过异步 `MessageBus`（`nanobot/bus/queue.py`）流转，它将聊天渠道与 Agent 核心解耦：

1. **Channels**（`nanobot/channels/`）从外部平台接收消息，并向总线发布 `InboundMessage` 事件。
2. **`AgentLoop`**（`nanobot/agent/loop.py`）消费入站消息，构建上下文，并协调本轮处理。
3. **`AgentRunner`**（`nanobot/agent/runner.py`）处理实际的 LLM 对话循环：向 Provider 发送消息，接收工具调用，执行工具，并流式输出响应。
4. 响应会作为 `OutboundMessage` 事件发布回相应渠道。

### 关键子系统

- **Agent Loop**（`nanobot/agent/loop.py`、`runner.py`）：核心处理引擎。`AgentLoop` 管理会话键、hooks 和上下文构建。`AgentRunner` 执行带工具调用的多轮 LLM 对话。
- **LLM Providers**（`nanobot/providers/`）：Provider 实现（Anthropic、OpenAI-compatible、OpenAI Responses API、Azure、Bedrock、GitHub Copilot、OpenAI Codex 等）都基于公共基类（`base.py`）构建。包含图像生成（`image_generation.py`）和音频转写（`transcription.py`）。`factory.py` 和 `registry.py` 负责实例化与模型发现。
- **Channels**（`nanobot/channels/`）：平台集成（Telegram、Discord、Slack、飞书、Matrix、WhatsApp、QQ、微信、WeCom、钉钉、Email、MoChat、MS Teams、WebSocket）。`manager.py` 负责发现和协调它们。Channels 通过 `pkgutil` 扫描 + entry-point 插件自动发现。
- **Tools**（`nanobot/agent/tools/`）：暴露给 LLM 的 Agent 能力：文件系统（读取/写入/编辑/列出）、shell 执行（带沙箱后端）、网页搜索/抓取、MCP servers、cron、notebook 编辑、subagent spawning、长任务 / 持续目标（`long_task.py`）、图像生成和自我修改。Tools 通过 `pkgutil` 扫描 + entry-point 插件自动发现。
- **Memory**（`nanobot/agent/memory.py`）：会话历史持久化，包含 Dream 两阶段记忆整合。使用带 fsync 的原子写入保证持久性。
- **Session Management**（`nanobot/session/`）：按会话维护历史、上下文压缩、基于 TTL 的自动压缩（`manager.py`），以及持续目标状态跟踪（`goal_state.py`）。
- **Config**（`nanobot/config/schema.py`、`loader.py`）：基于 Pydantic 的配置，从 `~/.nanobot/config.json` 加载。支持用于 JSON 兼容性的 camelCase 别名。
- **WebUI**（`webui/`）：基于 Vite 的 React SPA，通过 WebSocket 多路复用协议与 gateway 通信。开发服务器会将 `/api`、`/webui`、`/auth` 和 WebSocket 流量代理到 gateway。
- **API Server**（`nanobot/api/server.py`）：OpenAI-compatible HTTP API（`/v1/chat/completions`、`/v1/models`），用于程序化访问。
- **Command Router**（`nanobot/command/`）：Slash command 路由和内置命令处理器。
- **Heartbeat**（`nanobot/templates/HEARTBEAT.md`）：通过 `cron` jobs 检查的周期性任务列表（旧的专用服务已移除）。
- **Pairing**（`nanobot/pairing/`）：DM 发送者审批存储，并为每个渠道维护持久配对码。
- **Skills**（`nanobot/skills/`）：内置 skill 定义（long-goal、cron、github、image-generation 等），会加载到 Agent 上下文中。
- **Security**（`nanobot/security/`）：PTH 文件防护以及其他在 CLI 入口激活的安全措施。

### 入口点

- **CLI**：`nanobot/cli/commands.py`
- **Python SDK**：`nanobot/nanobot.py`

## 项目特定说明

- 架构约束：[`.agent/design.md`](.agent/design.md)
- 安全边界：[`.agent/security.md`](.agent/security.md)
- 常见坑点：[`.agent/gotchas.md`](.agent/gotchas.md)

## 贡献流程

贡献流程和 PR 指南见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

## 代码风格

- Python 3.11+，全项目使用 asyncio。
- 行宽：100。
- Linting：`ruff`，启用规则 E、F、I、N、W（忽略 E501）。
- pytest 使用 `asyncio_mode = "auto"`。

## 常见文件位置

- 配置 schema：`nanobot/config/schema.py`
- Provider 基类 / 新 Provider 模板：`nanobot/providers/base.py`
- Channel 基类 / 新 Channel 模板：`nanobot/channels/base.py`
- Tool registry：`nanobot/agent/tools/registry.py`
- WebUI 开发代理配置：`webui/vite.config.ts`
- 测试结构与 `nanobot/` 包结构对应。
