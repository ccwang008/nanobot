<!-- 本文件由 docs/concepts.md 翻译生成；原文仍保留在上级目录。 -->

# 概念

在更改高级设置之前，如果你想先理解 nanobot，请使用本页。它会在不要求你先阅读源代码的情况下解释各个组成部分。

如果你想了解源文件归属和扩展点，请在阅读完本页后查看 [`architecture.md`](./architecture.md)。

## 运行时形态

nanobot 只有一个很小的核心循环，以及若干进入该循环的方式：

| 部分 | 它的作用 |
|---|---|
| 智能体循环 | 构建上下文，选择会话，调用提供商，运行工具，并发布回复 |
| 提供商 | LLM 后端，例如 OpenRouter、Anthropic、OpenAI、Bedrock、Ollama、vLLM，以及其他 OpenAI-compatible APIs |
| 通道 | 面向用户的传输层，例如 CLI、WebUI/WebSocket、Telegram、Discord、Slack、Feishu、WeChat、Email 等 |
| 工具 | 模型可能调用的能力，包括文件、shell、web search/fetch、MCP、cron、图像生成和子智能体 |
| 记忆 | 工作区文件和会话历史，用于在不同轮次之间保留有用上下文 |
| 网关 | 长运行进程，连接已启用的通道并提供健康检查端点 |

最简单的路径是 `nanobot agent -m "Hello!"`：一条传入消息经过智能体循环，并在你的终端中打印回复。长运行路径是 `nanobot gateway`：通道从聊天应用或 WebUI 接收消息，将其发布到同一个智能体循环，然后把回复发送回原始通道。

## 配置 vs 工作区

默认实例位于 `~/.nanobot/`：

| 路径 | 含义 |
|---|---|
| `~/.nanobot/config.json` | 实例配置：提供商、模型默认值、通道、工具、网关、API 和运行时选项 |
| `~/.nanobot/workspace/` | 智能体工作区：记忆、会话、heartbeat 任务、cron 作业、技能和生成的工件 |

你可以用命令标志覆盖这两者：

```bash
nanobot onboard --config ./bot-a/config.json --workspace ./bot-a/workspace
nanobot agent --config ./bot-a/config.json --workspace ./bot-a/workspace -m "Hello"
nanobot gateway --config ./bot-a/config.json --workspace ./bot-a/workspace
```

配置文件控制 nanobot 可以使用什么。工作区是 nanobot 为该实例保存状态的地方。

## 配置格式

`config.json` 同时接受 camelCase 和 snake_case 键。文档使用 camelCase，因为 nanobot 会把配置以 camelCase 别名写回磁盘，例如 `apiKey`、`modelPresets`、`intervalS` 和 `maxToolResultChars`。

大多数示例都是部分片段。将它们合并到由 `nanobot onboard` 创建的现有文件中；除非你想重置实例，否则不要替换整个文件。

## 一次智能体轮次

正常轮次遵循以下流程：

1. 某个通道接收用户消息，并将其发布到消息总线。
2. 智能体循环选择会话键，并从工作区、技能、记忆、最近消息、通道元数据和运行时设置构建上下文。
3. 提供商接收模型请求。
4. 如果模型请求工具，运行器会执行这些工具并把结果反馈给模型。
5. 最终回复会保存到会话中，并通过通道发送回去。

无论消息起始于 CLI、WebUI、Telegram、Discord 还是其他通道，这一流程都相同。

## CLI、网关、API 和 WebUI

| 入口点 | 命令 | 用途 |
|---|---|---|
| CLI 单次执行 | `nanobot agent -m "..."` | 首次运行检查、脚本和快速本地提问 |
| CLI 交互式 | `nanobot agent` | 具有持久会话历史的终端聊天 |
| 网关 | `nanobot gateway` | 聊天应用、WebUI、heartbeat、Dream 和长运行服务模式 |
| OpenAI-compatible API | `nanobot serve` | 通过 `/v1/chat/completions` 进行程序化访问 |
| WebUI | `nanobot gateway` 加上 WebSocket 通道 | 由 WebSocket 通道在端口 `8765` 提供的浏览器工作台 |

网关健康检查端点位于 `gateway.port`（默认是 `18790`）。浏览器 WebUI 由 WebSocket 通道提供（默认是 `8765`），而不是由健康检查端点提供。

## 提供商和模型选择

活动模型通常应来自由 `agents.defaults.modelPreset` 选择的命名 `modelPresets` 条目。直接的 `agents.defaults.provider` 和 `agents.defaults.model` 仍然构成用于旧版或最小配置的隐式 `default` 预设。活动提供商按以下顺序解析：

1. 如果活动预设提供商或隐式默认提供商不是 `"auto"`，nanobot 就使用该提供商。
2. 如果 provider 是 `"auto"`，nanobot 会尝试从模型名称、已配置的 API keys、本地提供商 base URLs 或网关提供商中推断提供商。
3. OpenAI Codex 和 GitHub Copilot 等 OAuth 提供商需要显式登录，并在活动预设中显式选择提供商/模型。

首次设置时，请将提供商固定在预设中。这样更容易调试：

```json
{
  "modelPresets": {
    "primary": {
      "provider": "openrouter",
      "model": "anthropic/claude-opus-4.5"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

请参阅 [`providers.md`](./providers.md) 获取实际示例，以及 [`configuration.md#providers`](./configuration.md#providers) 获取完整的提供商参考。

## 通道和会话

每个通道都会将传入消息映射到一个会话键。这样独立对话就能保留各自的历史。WebUI 还支持多个聊天，以及用于项目工作区的工作区范围元数据。

`agents.defaults.unifiedSession` 可以有意在多个通道之间共享一个会话，以支持单用户多设备设置。如果你希望不同的人、群组、通道或项目保持独立上下文，请将其关闭。

## 记忆、会话和 Dream

nanobot 使用两个相关的存储：

| 存储 | 位置 | 目的 |
|---|---|---|
| 会话 | `<workspace>/sessions/*.jsonl` | 重放到上下文中的最近对话轮次 |
| 记忆 | `<workspace>/memory/MEMORY.md` 和 `<workspace>/memory/history.jsonl` | 长期事实和汇总历史 |

Dream 是一个周期性的汇总任务。它读取累积的历史，并更新工作区记忆，使有用上下文能够在短期会话重放之外继续保留。

详细设计请参阅 [`memory.md`](./memory.md)。

## 工具和安全

工具会从内置模块和插件入口点自动发现。常见的工具组包括：

- 文件读/写/编辑和补丁应用；
- 具有可配置沙箱的 shell 执行；
- 带 SSRF 检查的 web search 和 web fetch；
- MCP servers；
- cron 提醒、本地触发器和 heartbeat 任务；
- 图像生成；
- 子智能体和运行时自检。

安全敏感控制位于 [`configuration.md#security`](./configuration.md#security)。在生产环境或共享聊天应用中，还应配置通道访问控制，例如 `allowFrom`、配对或 WebSocket tokens。

## 后台任务

当 `nanobot gateway` 启动时，它会运行工作区范围的自动化并注册系统任务：

- `dream`，当 `agents.defaults.dream.enabled` 为 true 时；
- `heartbeat`，当 `gateway.heartbeat.enabled` 为 true 时。

Heartbeat 会读取 `<workspace>/HEARTBEAT.md`。如果文件中在 `## Active Tasks` 下有任务，nanobot 会执行它们，并只将有用/可操作的结果发送到最近活动的聊天目标。常规的“没有变化”结果会被抑制。

用户创建的提醒使用同一个 cron 服务，但并不等同于受保护的 heartbeat 系统任务。它们会作为按计划的轮次在其来源聊天/会话中运行，并通常将结果返回到该通道。

本地触发器同样绑定到会话，但它们没有自己的计划。先使用 `/trigger <name>` 从目标聊天创建一个，然后在本地脚本或外部服务希望 nanobot 在该会话中响应时调用 `nanobot trigger <id> "<message>"`。Webhook 服务器、第三方认证以及事件到消息的格式化都保持在 nanobot 之外。触发器投递会存储在工作区中，直到关联的智能体轮次成功完成。如果目标会话正忙，触发器会等待该会话空闲，而不是注入到当前活动轮次中。该消息会作为该会话中的一次自动化轮次被记录。投递采用至少一次语义，因此外部系统应能容忍重复的触发器消息；到达智能体但失败的投递会被标记为失败，而不是无限重试。

## 接下来去哪里

| 需求 | 阅读 |
|---|---|
| 第一个可工作的安装 | [`quick-start.md`](./quick-start.md) |
| 提供商/模型设置 | [`providers.md`](./providers.md) |
| 聊天应用设置 | [`chat-apps.md`](./chat-apps.md) |
| 完整配置参考 | [`configuration.md`](./configuration.md) |
| 运行时调试 | [`troubleshooting.md`](./troubleshooting.md) |
