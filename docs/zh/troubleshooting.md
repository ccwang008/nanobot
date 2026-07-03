<!-- 本文件由 docs/troubleshooting.md 翻译生成；原文仍保留在上级目录。 -->

# 故障排查

使用此页来隔离故障所在的位置。先从能证明最多内容的最小范围开始：先本地 CLI，然后是网关，再到 WebUI 或聊天应用。

## 快速诊断顺序

按顺序运行以下命令：

```bash
nanobot --version
nanobot status
nanobot agent -m "Hello!"
```

然后，仅当 CLI 正常时：

```bash
nanobot gateway
```

这会将故障分层：

| 层 | 它证明了什么 |
|---|---|
| `nanobot --version` | 安装和 shell 命令发现 |
| `nanobot status` | 配置路径、工作区路径、活动模型，以及提供商摘要 |
| `nanobot agent -m "Hello!"` | 配置加载、提供商/模型访问、工作区写入，以及智能体循环 |
| `nanobot gateway` | 通道启动、cron 系统任务、心跳、WebUI/WebSocket，以及健康检查端点 |

如果 `nanobot agent -m "Hello!"` 失败，请先修复它，再去调试 WebUI、Telegram、Discord、Docker、systemd，或任何聊天应用。

## 如何阅读 `nanobot status`

`nanobot status` 不会调用模型。它只会检查 nanobot 是否能找到默认配置、默认工作区、活动模型或预设，以及提供商设置摘要。

输出格式如下：

```text
nanobot Status

Config: /path/to/config.json ✓
Workspace: /path/to/workspace ✓
Model: provider/model-name (preset: primary)
Provider A: not set
Provider B: ✓
Local Provider: ✓ http://localhost:11434/v1
OAuth Provider: ✓ (OAuth)
```

可按如下方式阅读：

| 行 | 良好迹象 | 如果看起来不对该怎么办 |
|---|---|---|
| `Config` | 它指向你想使用的配置文件，并显示 `✓`。 | 运行 `nanobot onboard`，或者在测试非默认实例时向 `nanobot agent`、`gateway` 或 `serve` 传入 `--config`。 |
| `Workspace` | 它指向你想使用的工作区，并显示 `✓`。 | 运行 `nanobot onboard`，创建该文件夹，修复权限，或者在支持的命令上传入 `--workspace`。 |
| `Model` | 它显示你预期的活动模型或预设名称。 | 将 `agents.defaults.modelPreset` 设置为目标预设，或者如果你在聊天会话中切换过模型，请检查 `/model`。 |
| 提供商行 | 活动预设使用的提供商显示 `✓`、OAuth 标记或本地 URL。 | 先只配置活动提供商。未使用的提供商显示 `not set` 是正常的。 |

如果 `nanobot status` 看起来正常，但 `nanobot agent -m "Hello!"` 失败，那么安装和配置路径大概率没问题。继续查看 [提供商和模型问题](#provider-and-model-problems)。

## 安装问题

安装检查和模块回退都使用同一个 Python 命令。在 macOS/Linux 上这可能是 `python3`；在 Windows 上可能是 `python` 或 `py`。

| 症状 | 检查 |
|---|---|
| `python: command not found` | 在 macOS/Linux 上尝试 `python3 --version`，或在 Windows 上尝试 `py --version`。然后把文档命令中的 `python` 替换为可用的命令。 |
| `curl: command not found` | macOS/Linux 的单命令安装器无法下载脚本。安装 curl，或者使用手动隔离安装，例如 `uv tool install nanobot-ai` 或 `pipx install nanobot-ai`。 |
| `irm` is not recognized | PowerShell 无法运行下载辅助程序。使用手动安装：`uv tool install nanobot-ai`、`pipx install nanobot-ai`，或在你可控的环境中使用 `py -m pip install nanobot-ai`。 |
| 无法下载 `raw.githubusercontent.com` | 你的网络、代理或防火墙阻止了安装脚本下载。使用来自 PyPI 的手动安装，或者配置代理后重新运行命令。 |
| `nanobot: command not found` | 使用模块形式，例如 `python -m nanobot ...`、`python3 -m nanobot ...` 或 `py -m nanobot ...`。用相同的 Python 命令重新安装，或者把该 Python 的 scripts 目录加入 `PATH`。 |
| `No module named nanobot` | 你运行的 Python 不是安装时使用的那个。运行 `python -m pip show nanobot-ai`、`python3 -m pip show nanobot-ai`，或 `py -m pip show nanobot-ai`，并与安装 nanobot 时使用的命令保持一致。 |
| `pip is not available` | 当安装器使用虚拟环境时，它会尝试 `python -m ensurepip --upgrade`。如果失败，请为该 Python 安装 pip，或者使用包含 pip 的 Python 安装程序/发行版。 |
| `externally-managed-environment` | 你的系统 Python 阻止全局 pip 安装。使用单命令安装器、`uv tool install nanobot-ai`、`pipx install nanobot-ai`，或创建虚拟环境；不要为 nanobot 添加 `--break-system-packages`。 |
| 安装器选择了错误的 Python | 在运行安装器前设置 `PYTHON`，例如 `curl -fsSL https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.sh | PYTHON=python3 sh`，或在 PowerShell 命令前设置 `$env:PYTHON="py"`。 |
| 可编辑源码安装未更新 | 在仓库根目录，使用开发时所用的 Python 命令再次运行 `python -m pip install -e .`，然后检查 `python -m nanobot --version` 或 `nanobot --version`。 |
| 缺少 WebUI 构建工具 | 它们只在 WebUI 开发时需要。打包安装已经包含 WebUI bundle。 |

## 配置问题

默认配置路径：

```text
~/.nanobot/config.json
```

默认工作区路径：

```text
~/.nanobot/workspace/
```

`nanobot status` 读取默认配置。调试多个实例时，请在支持这些参数的命令上使用显式路径：

```bash
nanobot agent --config ./bot-a/config.json --workspace ./bot-a/workspace -m "Hello"
nanobot gateway --config ./bot-a/config.json --workspace ./bot-a/workspace
```

常见配置错误：

| 症状 | 检查 |
|---|---|
| JSON 解析错误 | 检查逗号、花括号和引号。大多数文档示例都是需要合并的片段，而不是完整片段。 |
| 未知或缺失的提供商 | 使用提供商注册表名称，例如 `openrouter`、`anthropic`、`openai`、`ollama`、`vllm`、`lm_studio`，或者在 `providers` 下定义自定义的 OpenAI 兼容提供商键，并在活动预设中引用该精确键。 |
| snake_case 与 camelCase 混淆 | 两者都接受，但文档使用 camelCase，因为 nanobot 会用诸如 `apiKey`、`modelPresets`、`intervalS` 之类的别名写入配置。 |
| 环境变量错误 | `${VAR_NAME}` 引用会在启动时解析。请在运行 nanobot 之前设置该变量。 |
| 已编辑配置但行为未改变 | 重启 `nanobot gateway`；长时间运行的进程会在启动时读取配置。 |

要在不覆盖现有设置的情况下刷新缺失的默认值，请运行：

```bash
nanobot onboard
```

当提示是否覆盖配置时，选择保留当前值并合并缺失默认值的选项。

## 提供商和模型问题

先在 CLI 中证明提供商可用：

```bash
nanobot agent -m "Hello!"
```

然后将你的配置与 [`providers.md`](./providers.md) 对比。

如果你需要一个已知可用的片段而不是诊断信息，请使用 [`provider-cookbook.md`](./provider-cookbook.md)。

| 症状 | 可能原因 |
|---|---|
| 401、unauthorized、invalid API key | 密钥缺失、已过期、粘贴时包含空白，或者位于错误的提供商键下。 |
| Model not found | 模型 ID 属于不同的提供商或网关。 |
| 无法推断提供商 | 在活动预设中固定 `modelPresets.<name>.provider`，不要使用 `"auto"`。对于旧式直接配置，请固定 `agents.defaults.provider`。 |
| 本地模型连接被拒绝 | Ollama、vLLM、LM Studio 或其他本地服务器未运行，或者 `apiBase` 指向了错误的端口。 |
| Bedrock 验证错误 | 检查 AWS 区域、凭据、模型访问权限、模型 ID，以及该模型是否支持 Converse。 |
| OAuth 提供商失败 | 运行 `nanobot provider login openai-codex` 或 `nanobot provider login github-copilot`，然后显式选择该提供商。 |

## Langfuse 问题

Langfuse 跟踪是可选的，并由环境变量控制。

| 症状 | 检查 |
|---|---|
| `LANGFUSE_SECRET_KEY is set but langfuse is not installed` | 在运行 nanobot 的同一个 Python 环境中安装 `langfuse`，然后重启进程。 |
| 没有出现 traces | 在启动 nanobot 之前设置 `LANGFUSE_SECRET_KEY`、`LANGFUSE_PUBLIC_KEY` 和 `LANGFUSE_BASE_URL`。 |
| Langfuse 项目或区域错误 | 检查密钥对和 `LANGFUSE_BASE_URL` 是否来自同一个 Langfuse 项目/区域。 |
| 只有部分提供商有 trace | Langfuse 跟踪适用于 OpenAI 兼容提供商调用；原生提供商可能不会使用该客户端路径。 |

有关设置命令，请参见 [`configuration.md#langfuse-observability`](./configuration.md#langfuse-observability)。
## 网关问题

`nanobot gateway` 是 WebUI、聊天应用、heartbeat、Dream 以及长连接通道连接所必需的。

默认端口：

| 界面 | 默认值 |
|---|---|
| Gateway 健康检查端点 | `http://127.0.0.1:18790/health` |
| WebUI/WebSocket 通道 | `http://127.0.0.1:8765` |
| OpenAI 兼容 API（`nanobot serve`） | `http://127.0.0.1:8900` |

常见网关检查：

```bash
nanobot gateway --verbose
```

| 症状 | 检查 |
|---|---|
| 端口已被占用 | 更改 `gateway.port`、`channels.websocket.port`，或对相关命令使用 `--port` CLI 标志。 |
| WebUI 打开的是 `18790` 但没有显示有用内容 | 打开 `8765`；`18790` 是健康检查端点。 |
| 配置更改未生效 | 重启网关。 |
| heartbeat 从未运行 | 保持网关运行，在 `<workspace>/HEARTBEAT.md` -> `## Active Tasks` 下添加任务，并确保 `gateway.heartbeat.enabled` 为 true。 |
| 切换工作区后 cron 任务消失了 | cron 任务在 `<workspace>/cron/jobs.json` 中按工作区范围生效；检查你是否正在使用预期的工作区。 |

## WebUI 问题

打包的 WebUI 由 WebSocket 通道提供服务。

最小配置：

```json
{
  "channels": {
    "websocket": {
      "enabled": true
    }
  }
}
```

然后运行：

```bash
nanobot gateway
```

打开：

```text
http://127.0.0.1:8765
```

如果从另一台设备访问，将 WebSocket 通道绑定到 `0.0.0.0`，并设置 `token` 或 `tokenIssueSecret`。WebSocket 通道在没有 token 或 token issue secret 的情况下会拒绝公共绑定。

有关 LAN 设置，请参见 [`webui.md#lan-access`](./webui.md#lan-access)；有关前端开发，请参见 [`../webui/README.md`](../webui/README.md)。

## 聊天应用问题

在调试聊天应用之前：

```bash
nanobot agent -m "Hello!"
nanobot channels status
nanobot gateway
```

然后检查：

| 症状 | 检查 |
|---|---|
| 机器人从不回复 | 网关未运行、通道未启用，或者机器人/应用 token 错误。 |
| 未知发送者被忽略 | 配置 `allowFrom`、pairing，或通道特定的允许列表。 |
| Telegram 失败 | 确认 BotFather token 和 `allowFrom` 用户 ID。 |
| Discord 回复缺失 | 启用 Message Content intent，并以所需权限邀请机器人。 |
| WhatsApp 或 WeChat 登录已过期 | 重新运行 `nanobot channels login whatsapp` 或 `nanobot channels login weixin`。 |
| 聊天应用可用但 WebUI 不可用 | 提供商和网关大概率正常；请单独调试 WebSocket 通道。 |

有关通道特定设置，请参见 [`chat-apps.md`](./chat-apps.md)。

## 工具和工作区问题

| 症状 | 检查 |
|---|---|
| 文件访问被拒绝 | 检查 `tools.restrictToWorkspace` 以及目标路径是否位于活动工作区内。 |
| Shell 命令在 Docker 中失败 | 沙箱设置可能需要 Linux capabilities；请参见 [`deployment.md`](./deployment.md)。 |
| Web fetch 被阻止 | SSRF 防护会阻止不安全的目标；仅对受信任的私有网络使用 `tools.ssrfWhitelist`。 |
| MCP 工具缺失 | 检查 `tools.mcpServers`、服务器启动命令、环境变量和工具允许列表。 |
| 生成的产物缺失 | 检查活动工作区和通道媒体目录。 |

## 记忆和会话问题

| 症状 | 检查 |
|---|---|
| 对话上下文似乎不对 | 确认活动工作区和会话。WebUI 聊天和聊天应用线程可能使用不同的会话。 |
| 记忆没有立即更新 | Dream consolidation 是周期性的；最近的轮次仍保留在会话历史中。 |
| 移动配置后出现旧会话 | 会话文件存储在 `<workspace>/sessions/` 下；请验证工作区路径。 |
| 你想在多个设备间共享一个会话 | 有意设置 `agents.defaults.unifiedSession`；否则请保持会话分离。 |

## 收集有用证据

在提交 issue 或寻求帮助时，请包括：

- 安装方式和 `nanobot --version`；
- 操作系统和 Python 版本；
- 你运行的命令；
- 相关的 `nanobot status` 输出；
- 已清理敏感信息的配置片段，尤其是提供商、模型、通道和工具设置；
- 来自 `nanobot gateway --verbose` 的网关日志；
- `nanobot agent -m "Hello!"` 是否可用。

切勿在公开 issue 中粘贴真实的 API key、bot token、OAuth token 或私有聊天 ID。

如果你发现文档错误、过时的命令或令人困惑的步骤，请提交 issue：<https://github.com/HKUDS/nanobot/issues>。
