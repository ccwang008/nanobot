<!-- 本文件由 docs/cli-reference.md 翻译生成；原文仍保留在上级目录。 -->

# CLI 参考

当你已经知道想运行什么、并且需要命令形式时，请使用此页面。要进行引导式首次运行，请从 [`quick-start.md`](./quick-start.md) 开始。

## 选择命令

| 目标 | 命令 | 备注 |
|---|---|---|
| 检查安装 | `nanobot --version` | 如果失败，尝试 `python -m nanobot --version` |
| 创建或刷新配置 | `nanobot onboard` | 会创建 `~/.nanobot/config.json` 和 `~/.nanobot/workspace/` |
| 使用引导式设置 | `nanobot onboard --wizard` | 当你更喜欢提示而不是手动编辑 JSON 时最适合 |
| 在不调用模型的情况下检查配置 | `nanobot status` | 读取默认配置并汇总当前启用的模型/提供商 |
| 发送一条测试消息 | `nanobot agent -m "Hello!"` | 首次证明安装、配置、提供商、模型和工作区都正常工作 |
| 在终端中聊天 | `nanobot agent` | 交互式本地聊天；使用 `exit`、`/exit`、`:q` 或 `Ctrl+D` 退出 |
| 使用 WebUI 或聊天应用 | `nanobot gateway` | 保持此终端运行，或使用 `nanobot gateway --background` |
| 传递本地触发器 | `nanobot trigger <id> "message"` | 首先使用 `/trigger <name>` 在目标聊天/会话中创建 |
| 提供 OpenAI 兼容 API | `nanobot serve` | 启动 `/v1/chat/completions`、`/v1/models` 和 `/health` |
| 检查聊天通道设置 | `nanobot channels status` | 在启动 `nanobot gateway` 之前很有用 |
| 登录基于 QR/OAuth 的通道 | `nanobot channels login <channel>` | 用于 WhatsApp 和 WeChat 等通道 |
| 登录 OAuth 提供商 | `nanobot provider login <provider>` | 用于 OpenAI Codex 和 GitHub Copilot 等 OAuth 提供商 |

## 全局

```bash
nanobot --help
nanobot --version
python -m nanobot --help
python -m nanobot --version
```

`python -m nanobot ...` 在包已安装但 `nanobot` 脚本不在 `PATH` 上时很有用。

## 常见模式

大多数日常命令都使用默认配置和工作区。高级或多实例运行通常会显式传入两个路径：

```bash
nanobot agent --config ./bot-a/config.json --workspace ./bot-a/workspace -m "Hello"
nanobot gateway --config ./bot-a/config.json --workspace ./bot-a/workspace
nanobot serve --config ./bot-a/config.json --workspace ./bot-a/workspace
```

当你需要启动或运行时日志时，在长时间运行的进程上使用 `--verbose`：

```bash
nanobot gateway --verbose
nanobot serve --verbose
```

长时间运行的命令会一直工作，直到你停止它们。按下该终端中的 `Ctrl+C`
以停止前台 `nanobot gateway` 或 `nanobot serve`。如果你使用 `--background` 启动了网关，
请使用 `nanobot gateway stop`。

## 设置

| 命令 | 描述 |
|---|---|
| `nanobot onboard` | 初始化或刷新默认配置和工作区 |
| `nanobot onboard --wizard` | 使用交互式设置向导 |
| `nanobot onboard --config <path> --workspace <path>` | 初始化或刷新特定实例 |

默认路径：

| 路径 | 默认值 |
|---|---|
| 配置 | `~/.nanobot/config.json` |
| 工作区 | `~/.nanobot/workspace/` |

## 智能体 CLI

| 命令 | 描述 |
|---|---|
| `nanobot agent -m "Hello!"` | 发送一条消息并退出 |
| `nanobot agent` | 启动交互式终端聊天 |
| `nanobot agent --session <id>` | 使用特定会话键 |
| `nanobot agent --workspace <path>` | 覆盖工作区 |
| `nanobot agent --config <path>` | 使用特定配置文件 |
| `nanobot agent --no-markdown` | 输出纯文本，而不是 Rich 渲染的 Markdown |
| `nanobot agent --logs` | 在聊天时显示运行时日志 |

交互模式会在 `exit`、`quit`、`/exit`、`/quit`、`:q` 或 `Ctrl+D` 时退出。

## 网关

`nanobot gateway` 会启动已启用的聊天通道、已配置时的 WebUI/WebSocket、基于 cron 的系统作业、Dream、heartbeat 以及健康检查端点。默认情况下它以前台方式运行，这会保持现有脚本和终端工作流不变。当你想要一个可通过 CLI 管理的本地 macOS、Linux 或 Windows 进程时，请使用 `--background`。

| 命令 | 描述 |
|---|---|
| `nanobot gateway` | 使用配置默认值以前台方式启动网关 |
| `nanobot gateway --verbose` | 显示详细运行时输出 |
| `nanobot gateway --port <port>` | 覆盖健康检查端点的 `gateway.port` |
| `nanobot gateway --workspace <path>` | 覆盖工作区 |
| `nanobot gateway --config <path>` | 使用特定配置文件 |
| `nanobot gateway --background` | 将网关作为后台进程启动 |
| `nanobot gateway status` | 显示记录的后台网关 PID、状态文件和日志文件 |
| `nanobot gateway logs --no-follow` | 输出最近的后台网关日志并退出 |
| `nanobot gateway logs` | 跟随后台网关日志 |
| `nanobot gateway restart` | 使用当前配置重启记录的后台网关 |
| `nanobot gateway stop` | 停止记录的后台网关 |
| `nanobot gateway install-service` | 安装 systemd 用户服务或 macOS LaunchAgent |
| `nanobot gateway install-service --dry-run` | 预览生成的服务文件和系统命令 |
| `nanobot gateway uninstall-service` | 删除已安装的系统服务 |

对于自定义实例，请将相同的选择器标志传递给管理命令：

```bash
nanobot gateway --background --config ./bot-a/config.json --workspace ./bot-a/workspace
nanobot gateway status --config ./bot-a/config.json --workspace ./bot-a/workspace
nanobot gateway stop --config ./bot-a/config.json --workspace ./bot-a/workspace
nanobot gateway install-service --config ./bot-a/config.json --workspace ./bot-a/workspace --name bot-a
```

`--background` 是一个轻量级的分离进程。`install-service` 用于
登录/启动集成：Linux 使用 systemd 用户服务；macOS 使用
LaunchAgent plist。系统服务在操作系统监督器下运行前台网关，
而不是再嵌套一个后台进程。

默认健康检查端点：

```text
http://127.0.0.1:18790/health
```

内置 WebUI 由 WebSocket 通道提供服务，通常运行在 `8765` 端口，而不是由网关健康检查端点提供服务。

## 本地触发器

`nanobot trigger` 会将一条本地消息发送给通过
`/trigger <name>` 从聊天/会话中创建的触发器。

```bash
nanobot trigger trg_8K4P2Q9X "Review PR #4502"
```

请保持 `nanobot gateway` 运行，这样消息才能被传递到关联的
聊天/会话中。该消息会作为该会话中的自动化轮次记录，
而不是作为用户键入的普通聊天消息。

该命令会写入工作区本地的持久队列。如果 `nanobot gateway`
尚未运行，消息会在该工作区中等待。如果目标会话
已经在运行一个轮次，触发器会等待该会话变为空闲。如果
网关在领取投递后但在关联轮次完成前退出，
下次网关启动时会重新入队该投递。该队列是至少一次，而不是
恰好一次，因此在进程中断后同一条消息可能会再次投递。如果智能体接收了投递但轮次失败，投递会被标记为失败，而不是无限重试。每次投递还会在 `<workspace>/triggers/runs` 下写入一条审计记录。每个
工作区只运行一个网关消费者；这个本地队列不是分布式多消费者队列。

当另一个本地进程生成消息时，请使用 stdin：

```bash
generate-report | nanobot trigger trg_8K4P2Q9X
```

选项：

| 命令 | 描述 |
|---|---|
| `nanobot trigger <id> "message"` | 通过触发器传递一条消息 |
| `nanobot trigger <id>` | 从 stdin 读取消息 |
| `nanobot trigger --config <path> <id> "message"` | 使用特定配置的工作区 |
| `nanobot trigger --workspace <path> <id> "message"` | 使用特定工作区 |

触发器由 WebUI 的 Automations 视图管理，而不是通过单独的
`list`、`revoke` 或 `delete` CLI 子命令管理。从那里你可以暂停/恢复、
重命名、删除、搜索，并复制每个触发器的命令。

对于 webhook 或其他外部系统，请运行你自己的小型服务，并在它
决定 nanobot 应该接收什么消息后调用此 CLI。

## OpenAI 兼容 API

| 命令 | 描述 |
|---|---|
| `nanobot serve` | 启动 `/v1/chat/completions`、`/v1/models` 和 `/health` |
| `nanobot serve --host <host>` | 覆盖 API 绑定主机 |
| `nanobot serve --port <port>` | 覆盖 API 端口 |
| `nanobot serve --timeout <seconds>` | 覆盖每请求超时 |
| `nanobot serve --verbose` | 显示运行时日志 |
| `nanobot serve --workspace <path>` | 覆盖工作区 |
| `nanobot serve --config <path>` | 使用特定配置文件 |

默认 API 端点：

```text
http://127.0.0.1:8900
```

有关请求示例，请参见 [`openai-api.md`](./openai-api.md)。

## 状态

```bash
nanobot status
```

显示默认配置路径、工作区路径、当前启用的模型以及提供商摘要。此命令当前不接受 `--config`；在调试特定实例时，请在 `--config`、`--workspace` 或 `agent`、`gateway` 或 `serve` 上使用显式 `--config` 和 `--workspace`。

## 通道

| 命令 | 描述 |
|---|---|
| `nanobot channels status` | 显示已配置的通道状态 |
| `nanobot channels status --config <path>` | 显示特定配置的通道状态 |
| `nanobot channels login <channel>` | 为受支持的通道运行交互式登录 |
| `nanobot channels login <channel> --force` | 即使凭据已存在也重新认证 |
| `nanobot channels login <channel> --config <path>` | 使用特定配置文件 |

示例：

```bash
nanobot channels login whatsapp
nanobot channels login weixin
nanobot channels status
```

有关通道特定设置，请参见 [`chat-apps.md`](./chat-apps.md)。

## 提供商 OAuth

| 命令 | 描述 |
|---|---|
| `nanobot provider login openai-codex` | 认证 OpenAI Codex 提供商 |
| `nanobot provider login github-copilot` | 认证 GitHub Copilot 提供商 |
| `nanobot provider logout openai-codex` | 删除 OpenAI Codex OAuth 状态 |
| `nanobot provider logout github-copilot` | 删除 GitHub Copilot OAuth 状态 |

有关何时需要为 OAuth 提供商显式选择提供商/模型，请参见 [`providers.md`](./providers.md#oauth-providers)。

## 有用的首次检查

```bash
nanobot --version
nanobot status
nanobot agent -m "Hello!"
```

如果这些失败，请在调试 WebUI、聊天应用、Docker、systemd 或 SDK 集成之前先使用 [`troubleshooting.md`](./troubleshooting.md)。
