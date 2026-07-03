<!-- 本文件由 docs/quick-start.md 翻译生成；原文仍保留在上级目录。 -->

# 安装与快速开始

本页先让一个本地 nanobot 回复正常工作。之后，你可以添加 WebUI、聊天应用、本地模型、网页搜索、MCP、部署或自定义插件。

如果你以前从未使用过终端或编辑过配置文件，请先阅读 [`start-without-technical-background.md`](./start-without-technical-background.md)。本页假定你已经能够熟练粘贴命令和编辑 JSON 片段。

## 开始之前

你需要：

- Python 3.11 或更新版本。
- 一个你可以调用的 LLM 提供商、公司端点、订阅端点或本地模型服务器。下面的示例使用通用的、兼容 OpenAI 的 `custom` 提供商，因此这个简化路径不会推荐某个托管服务；只要密钥、提供商名称和模型 ID 匹配，任何受支持的提供商都可以。
- 仅在你从源码安装时才需要 Git。
- 仅在你正在开发 WebUI 本身时才需要 Node.js 或 Bun。

> [!IMPORTANT]
> 仓库文档可能会描述一些先在源码中可用的功能。日常稳定版请从 PyPI 或 `uv` 安装；当你想使用仓库里的最新行为，或者计划贡献代码时，请从源码安装。

## 1. 安装

选择一种安装方式。

**一条命令完成设置：**

```bash
curl -fsSL https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.sh | sh
```

在 Windows PowerShell 中：

```powershell
irm https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.ps1 | iex
```

默认命令会从 PyPI 安装或升级 `nanobot-ai`，然后启动 `nanobot onboard --wizard`。它会通过使用当前激活的虚拟环境、`uv`、`pipx`，或位于 `~/.nanobot/venv` 下的受管理 venv，来避免系统级 pip 安装。如果快速开始完成并且你启用了 WebSocket 通道，请直接前往[打开 WebUI](#5-open-the-webui)。

如果你想在不更改环境的情况下预览计划，请添加 `--dry-run`；当你想预览主分支安装时，可将其与 `--dev` 组合使用。

```bash
curl -fsSL https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.sh | sh -s -- --dry-run
```

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.ps1))) --dry-run
```

若要改为安装当前 `main` 分支，请添加 `--dev`：

```bash
curl -fsSL https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.sh | sh -s -- --dev
```

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.ps1))) --dev
```

如果无法使用 `curl` 或 `irm`，或者你的网络阻止了 GitHub raw 下载，请使用下面的某种手动安装方式。

如果你想先查看脚本，请打开 [`../scripts/install.sh`](../scripts/install.sh) 或 [`../scripts/install.ps1`](../scripts/install.ps1)。

**使用 `uv` 的稳定版：**

```bash
uv tool install nanobot-ai
nanobot --version
```

**使用 pip 的稳定版：**

```bash
python -m pip install nanobot-ai
nanobot --version
```

只在你自己控制的环境中使用 pip。如果 pip 在 macOS 或 Linux 上报告 `externally-managed-environment`，请使用一条命令的安装器、`uv tool install nanobot-ai`、`pipx install nanobot-ai`，或先创建一个虚拟环境。

**最新源码检出：**

```bash
git clone https://github.com/HKUDS/nanobot.git
cd nanobot
python -m pip install -e .
nanobot --version
```

如果在 pip 安装后你的 shell 找不到 `nanobot`，请运行模块形式：

```bash
python -m nanobot --version
python -m nanobot onboard
```

在 Windows 上，文档中的 `~` 表示你的用户配置文件目录，例如 `C:\Users\you`。

文档中的命令使用 `python`。如果你的系统将 Python 3.11+ 暴露为 `python3` 或 `py`，请在同一位置使用那个命令，例如 `python3 -m pip install nanobot-ai` 或 `py -m nanobot --version`。

## 2. 初始化

如果一条命令完成设置已经启动了向导并且快速开始在那一步完成了，就跳过本节。

```bash
nanobot onboard
```

如果你更喜欢通过提示而不是手动编辑 JSON，请使用向导：

```bash
nanobot onboard --wizard
```

初始化会创建：

| 路径 | 说明 |
|------|------------|
| `~/.nanobot/config.json` | providers、models、channels、tools、gateway 和 API 的主设置文件 |
| `~/.nanobot/workspace/` | 用于记忆、会话、heartbeat 任务、技能和制品的智能体工作区 |

如果你已经有配置，`nanobot onboard` 可以在不覆盖现有值的情况下刷新缺失的默认字段。

## 3. 配置提供商

如果你已经在向导中配置了提供商和模型设置，请跳过本节。

打开 `~/.nanobot/config.json`。将这些块添加到 `nanobot onboard` 创建的文件中，或与之合并；除非你想重置配置，否则不要替换整个文件。

**API key：**

```json
{
  "providers": {
    "custom": {
      "apiKey": "your-api-key",
      "apiBase": "https://api.example.com/v1"
    }
  }
}
```

**模型预设：**

```json
{
  "modelPresets": {
    "primary": {
      "label": "Primary",
      "provider": "custom",
      "model": "model-id-from-your-provider",
      "maxTokens": 8192,
      "contextWindowTokens": 65536,
      "temperature": 0.1
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

预设中的提供商和模型必须匹配。上面的片段只是示例。对于其他提供商，请同时替换这些值：

| 替换项 | 位置 |
|---|---|
| 提供商配置键，例如 `custom` | `providers.<provider>` |
| API key 或环境变量 | `providers.<provider>.apiKey` |
| 预设提供商名称 | `modelPresets.primary.provider` |
| 模型 ID | `modelPresets.primary.model` |
| 端点 URL，仅在需要时 | `providers.<provider>.apiBase` |

对于现有配置，直接设置 `agents.defaults.provider` 和 `agents.defaults.model` 仍然可用，但推荐使用命名预设，因为它们还能支持 `/model` 切换和回退链。关于直连、网关、OAuth、云端和本地设置的各提供商示例，请参见 [`providers.md`](./providers.md)。

**那 `apiBase` / base URL 呢？**

`apiBase` 是提供商端点的 HTTP base URL，不是模型名称。nanobot 中的大多数托管提供商已经知道它们的默认端点，所以通常你只需要设置 `apiKey` 和一个模型预设。当你使用以下情况时，请设置 `apiBase`：

- `custom`，用于第三方或自托管的、兼容 OpenAI 的 API；
- 本地的、兼容 OpenAI 的服务器，例如 Ollama、vLLM 或 LM Studio；
- 提供商特定的备用端点、区域端点、代理或订阅端点。

示例：

```json
{
  "providers": {
    "custom": {
      "apiKey": "${CUSTOM_API_KEY}",
      "apiBase": "https://api.example.com/v1"
    }
  }
}
```

```json
{
  "providers": {
    "ollama": {
      "apiBase": "http://localhost:11434/v1"
    }
  }
}
```

如果提供商文档说明端点是 `/v1`，请把 `/v1` 包含在 `apiBase` 中。模型 ID 仍然属于当前启用的 `modelPresets` 条目。

如果你不想把密钥存储在 `config.json` 中，请引用一个环境变量，并在启动 nanobot 之前设置它：

```json
{
  "providers": {
    "custom": {
      "apiKey": "${PROVIDER_API_KEY}",
      "apiBase": "https://api.example.com/v1"
    }
  }
}
```

## 4. 检查设置

```bash
nanobot status
```

这应该会显示配置路径、工作区路径、当前模型或预设，以及提供商摘要。它不会向模型发送消息，因此在第一次真正请求之前，可以把它当作快速配置检查。

这样理解：

| 状态行 | 你希望看到的内容 |
|---|---|
| `Config` | 一个勾选标记。 |
| `Workspace` | 一个勾选标记。 |
| `Model` | 你期望的模型或预设。 |
| 提供商列表 | 大多数提供商可以显示 `not set`；当前预设使用的提供商应显示勾选标记、OAuth 状态或本地 URL。 |

## 5. 打开 WebUI

如果快速开始启用了 WebSocket 通道，请启动网关：

```bash
nanobot gateway
```

保持那个终端窗口打开，然后在浏览器中打开 `http://127.0.0.1:8765`。输入你在向导中设置的 WebUI 密码，然后在那里发送第一条消息。

## 6. 测试一条 CLI 消息

如果你跳过了快速开始、拒绝了 WebSocket 通道，或者只想做一次纯终端检查，请使用这个路径。

运行一次性 CLI 消息：

```bash
nanobot agent -m "Hello!"
```

第一次成功运行表明：

- `nanobot` 命令已安装；
- 可以加载 `~/.nanobot/config.json`；
- 选定的提供商和模型可以正常回答；
- 默认工作区可以创建并使用。

回复文本本身会有所不同。任何正常的助手回答都意味着安装、配置、提供商、模型和工作区路径都可用。

如果这一步正常，启动一个交互式 CLI 聊天：

```bash
nanobot agent
```

当交互式会话可以正常回答后，nanobot 就可以帮助你完成它自己的下一步设置。让它阅读相关文档，检查你当前的 `~/.nanobot/config.json`，并做一个具体修改，例如启用 WebUI、添加一个提供商预设，或者配置一个聊天通道。当 nanobot 说配置已更新后，在聊天中运行 `/restart`，或者手动重启 nanobot 进程，以便长时间运行的进程重新加载 `config.json`。

示例提示：

```text
Read docs/quick-start.md, docs/providers.md, and docs/configuration.md in this checkout.
Then update ~/.nanobot/config.json to add a model preset named "primary" for my provider.
Tell me exactly what changed and whether I need to run /restart.
```

使用 `exit`、`quit`、`/exit`、`/quit`、`:q` 或 `Ctrl+D` 退出交互模式。
## 7. 选择下一步

| 想要... | 前往 |
|---|---|
| 了解 config、workspace、gateway、channels、memory 和 tools | [`concepts.md`](./concepts.md) |
| 复制另一个 provider 或本地模型设置 | [`provider-cookbook.md`](./provider-cookbook.md) |
| 了解 provider/model 匹配 | [`providers.md`](./providers.md) |
| 打开随附的浏览器 UI | [`webui.md`](./webui.md) |
| 连接 Telegram、Discord、WeChat、Slack、Email 或其他聊天应用 | [`chat-apps.md`](./chat-apps.md) |
| 配置 web search、MCP、安全、memory、gateway 或运行时设置 | [`configuration.md`](./configuration.md) |
| 使用 Docker、systemd 或 LaunchAgent 运行 | [`deployment.md`](./deployment.md) |
| 调试故障 | [`troubleshooting.md`](./troubleshooting.md) |

## 更新

**pip:**

```bash
python -m pip install -U nanobot-ai
nanobot --version
```

如果 pip 报告 `externally-managed-environment`，请使用安装 nanobot 时相同的隔离方法升级，例如 `uv tool upgrade nanobot-ai`、`pipx upgrade nanobot-ai`，或使用单命令安装器创建的受管理 venv。

**uv:**

```bash
uv tool upgrade nanobot-ai
nanobot --version
```

**pipx:**

```bash
pipx upgrade nanobot-ai
nanobot --version
```

**Source checkout:**

```bash
git pull
python -m pip install -e .
nanobot --version
```

如果你从 source checkout 中使用 WhatsApp，请保持可选依赖已安装：

```bash
python -m pip install -e ".[whatsapp]"
```

## 首次运行故障排查

| 症状 | 检查内容 |
|---------|---------------|
| `nanobot: command not found` | 使用 `python -m nanobot ...`，或者将你的 Python scripts 目录加入 `PATH`。 |
| `ModuleNotFoundError: nanobot` | 确认你安装到了运行该命令的同一个 Python 环境中。 |
| JSON 解析错误 | 检查 `~/.nanobot/config.json` 中的逗号和括号；上面的示例只是需要合并的部分片段。 |
| 认证或 401 错误 | 检查 API key 是否有效、复制时是否未包含空格，以及是否放在你选择的 provider 下。 |
| provider/model 错误 | 确保当前激活的模型预设使用了拥有你的 API key 的 provider，并且该 model 在那里存在。 |
| CLI 可以工作，但聊天应用没有回复 | 先保持 `nanobot gateway` 运行，然后按照 [`chat-apps.md`](./chat-apps.md) 进行。 |
| WebUI 无法打开 | 启用 WebSocket 通道并打开端口 `8765`，而不是 gateway health 端口 `18790`。 |

如需更完整的诊断流程，请参见 [`troubleshooting.md`](./troubleshooting.md)。
