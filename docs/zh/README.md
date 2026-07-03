<!-- 本文件由 docs/README.md 翻译生成；原文仍保留在上级目录。 -->

# nanobot 文档

如需查看已发布版本的文档，请访问 [nanobot.wiki](https://nanobot.wiki/docs/latest/getting-started/nanobot-overview)。本目录中的页面会跟踪当前仓库，可能会描述尚未发布到站点上的功能。

如果你以前从未使用过终端或编辑过配置文件，请从 [`start-without-technical-background.md`](./start-without-technical-background.md) 开始。否则，请从 [`quick-start.md`](./quick-start.md) 开始，并先让一个本地 `nanobot agent -m "Hello!"` 回复正常工作，然后再连接聊天应用、WebUI、Docker 或自定义工具。

这些文档中的大多数 JSON 示例都是用于合并到 `~/.nanobot/config.json` 中的片段，而不是完整的替换文件。

提供商示例是具体的操作步骤，而不是排名或背书。请使用你实际控制其密钥、端点和模型 ID 的提供商。

如果你发现文档错误、过时的命令或令人困惑的步骤，请提交 issue：<https://github.com/HKUDS/nanobot/issues>。

## 选择一条路径

| 你是 | 从这里开始 | 然后使用 |
|---|---|---|
| 对终端和配置文件不熟悉 | [`start-without-technical-background.md`](./start-without-technical-background.md) | 如果第一次回复失败，再看 [`troubleshooting.md`](./troubleshooting.md) |
| 习惯粘贴命令和 JSON | [`quick-start.md`](./quick-start.md) | 用 [`provider-cookbook.md`](./provider-cookbook.md) 获取可直接粘贴的提供商配置 |
| 运营一个长期运行的机器人 | [`concepts.md`](./concepts.md) | [`chat-apps.md`](./chat-apps.md)、[`webui.md`](./webui.md) 和 [`deployment.md`](./deployment.md) |
| 集成或扩展 nanobot | [`architecture.md`](./architecture.md) | [`configuration.md`](./configuration.md)、[`openai-api.md`](./openai-api.md)、[`python-sdk.md`](./python-sdk.md)、[`development.md`](./development.md) 和 [`channel-plugin-guide.md`](./channel-plugin-guide.md) |

## 从这里开始

| 目标 | 阅读 | 结果 |
|---|---|---|
| 从零技术背景开始 | [`start-without-technical-background.md`](./start-without-technical-background.md) | 一条命令完成安装、终端基础、配置、API 密钥，以及第一次回复 |
| 安装并获得第一次回复 | [`quick-start.md`](./quick-start.md) | 一个可工作的 CLI 智能体和一个已知可用的配置路径 |
| 理解各部分如何协同工作 | [`concepts.md`](./concepts.md) | 对配置、工作区、网关、通道、工具、记忆和会话的心智模型 |
| 选择或更换模型提供商 | [`providers.md`](./providers.md) | 无需阅读完整配置参考即可正确匹配提供商/模型 |
| 复制一份提供商配置示例 | [`provider-cookbook.md`](./provider-cookbook.md) | 可直接粘贴的 OpenRouter、OpenAI、Anthropic、本地模型、回退和 Langfuse 配置 |
| 修复首次运行或运行时问题 | [`troubleshooting.md`](./troubleshooting.md) | 面向常见故障的诊断顺序和针对性检查 |

## 第一次回复正常工作之后

不要一次性配置所有内容。请选择一个下一步方向：

如果本地 `nanobot agent` 会话已经可以正常回答，你也可以让 nanobot 帮你配置它自己：让它阅读相关文档、检查你当前的配置、做出一个明确的下一步更改，并告诉你何时运行 `/restart`。

| 下一目标 | 阅读 | 首先检查 |
|---|---|---|
| 在浏览器中使用 nanobot | [`webui.md`](./webui.md) | 启用 WebSocket，运行 `nanobot gateway`，打开 `http://127.0.0.1:8765` |
| 通过聊天应用对话 | [`chat-apps.md`](./chat-apps.md) | 合并一个通道片段，运行 `nanobot channels status`，保持 `nanobot gateway` 运行 |
| 更换提供商或添加回退 | [`provider-cookbook.md`](./provider-cookbook.md) | 保持 `modelPresets` 命名并设置 `agents.defaults.modelPreset` |
| 在 Python 中调用 nanobot | [`python-sdk.md`](./python-sdk.md) | 代码中复用同一配置/工作区，然后运行或流式传输一次智能体轮次 |
| 长期运行前先理解 | [`concepts.md`](./concepts.md) | 了解配置、工作区、网关、会话、记忆和工具的含义 |
| 排查新的故障 | [`troubleshooting.md`](./troubleshooting.md) | 从 `nanobot status` 开始，然后进行 `nanobot agent -m "Hello!"` |

## 使用 nanobot

| 目标 | 阅读 | 结果 |
|---|---|---|
| 打开内置浏览器 UI | [`webui.md`](./webui.md) | 运行在 `8765` 端口上的 WebUI、聊天工作区、Apps、Skills、Automations 和设置 |
| 连接 Telegram、Discord、WeChat、Slack 和其他应用 | [`chat-apps.md`](./chat-apps.md) | 一个由网关支持、带访问控制的聊天通道 |
| 使用斜杠命令和自动化 | [`chat-commands.md`](./chat-commands.md) | 配对、模型预设、本地触发器、心跳任务和聊天侧控制 |
| 生成图片 | [`image-generation.md`](./image-generation.md) | 图片提供商配置、WebUI 图片模式和制品行为 |
| 运行多个隔离的机器人 | [`multiple-instances.md`](./multiple-instances.md) | 独立的配置、工作区、端口和会话 |
| 在终端之外部署 | [`deployment.md`](./deployment.md) | Docker、systemd 用户服务和 macOS LaunchAgent 设置 |
| 加入智能体社区 | [`agent-social-network.md`](./agent-social-network.md) | 外部智能体社区设置 |

## 参考

| 领域 | 阅读 | 最适合 |
|---|---|---|
| 完整配置 schema | [`configuration.md`](./configuration.md) | 精确字段、默认值、提供商表、Web 工具、MCP、安全性和运行时选项 |
| CLI 命令 | [`cli-reference.md`](./cli-reference.md) | 命令名称、常用标志和入口点 |
| 架构 | [`architecture.md`](./architecture.md) | 核心流程、提供商、通道、工具、WebUI、记忆、安全性和扩展点的源代码级运行图 |
| 开发 | [`development.md`](./development.md) | 为添加提供商和转写适配器的贡献者说明 |
| 记忆 | [`memory.md`](./memory.md) | 会话历史、Dream consolidation、记忆文件和版本管理 |
| 可观测性 | [`configuration.md#langfuse-observability`](./configuration.md#langfuse-observability) | Langfuse 跟踪设置和必需的环境变量 |
| WebSocket 协议 | [`websocket.md`](./websocket.md) | 自定义客户端、令牌签发、多路复用聊天、媒体和协议事件 |
| OpenAI 兼容 API | [`openai-api.md`](./openai-api.md) | `/v1/chat/completions`、`/v1/models`、文件上传以及兼容 SDK 的使用方式 |
| Python SDK | [`python-sdk.md`](./python-sdk.md) | SDK 入门、会话、流式传输、模型覆盖、运行时辅助工具和钩子 |
| 运行时自检 | [`my-tool.md`](./my-tool.md) | 检查和调优当前智能体运行 |

## 快速查找

| 需要 | 跳转到 |
|---|---|
| 提供商/模型解析顺序 | [`providers.md#provider-resolution`](./providers.md#provider-resolution) |
| 模型预设和回退链 | [`providers.md#model-presets`](./providers.md#model-presets) 和 [`providers.md#fallback-models`](./providers.md#fallback-models) |
| Langfuse 环境变量 | [`configuration.md#langfuse-observability`](./configuration.md#langfuse-observability) |
| WebSocket/WebUI 协议细节 | [`websocket.md`](./websocket.md) |
| OpenAI 兼容 API 用法 | [`openai-api.md`](./openai-api.md) |
| Python SDK 用法 | [`python-sdk.md`](./python-sdk.md) |
| 多个配置、工作区和端口 | [`multiple-instances.md`](./multiple-instances.md) |
| 安全性、沙箱和 SSRF 控制 | [`configuration.md#security`](./configuration.md#security) |
| 通道插件开发 | [`channel-plugin-guide.md`](./channel-plugin-guide.md) |

## 扩展 nanobot

| 目标 | 阅读 | 结果 |
|---|---|---|
| 添加提供商或转写适配器 | [`development.md`](./development.md) | 一个与注册表/schema 对齐的实现路径 |
| 添加聊天通道插件 | [`channel-plugin-guide.md`](./channel-plugin-guide.md) | 一个通过入口点发现的已打包通道 |
| 添加自定义 MCP 服务器 | [`configuration.md#mcp-model-context-protocol`](./configuration.md#mcp-model-context-protocol) | 通过 MCP 向智能体暴露的外部工具 |
| 调整工具安全性 | [`configuration.md#security`](./configuration.md#security) | Shell 沙箱、工作区限制和 SSRF 策略 |

## 阅读策略

如果你不确定该去哪里，请按以下顺序阅读文档：

1. 如果你对终端命令或配置文件不熟悉，[`start-without-technical-background.md`](./start-without-technical-background.md) 会解释这些设置术语，并使用一个具体的提供商示例，这样一次只需要做一个决定。
2. [`quick-start.md`](./quick-start.md) 会验证安装、配置加载和提供商访问。
3. [`concepts.md`](./concepts.md) 会解释运行模型，方便后续页面更容易浏览。
4. [`provider-cookbook.md`](./provider-cookbook.md) 提供可直接粘贴的提供商、回退、本地模型和 Langfuse 配置示例。
5. 一个任务指南，例如 [`chat-apps.md`](./chat-apps.md)、[`image-generation.md`](./image-generation.md) 或 [`deployment.md`](./deployment.md)，可以让一个工作流先跑通。
6. 当你需要某个特定字段、默认值或高级选项时，[`configuration.md`](./configuration.md) 是唯一可信来源。
7. [`troubleshooting.md`](./troubleshooting.md) 有助于判断故障是与安装、配置、提供商、网关、通道还是工具有关。
