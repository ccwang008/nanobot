<!-- 本文件由 docs/start-without-technical-background.md 翻译生成；原文仍保留在上级目录。 -->

# 无技术背景也能开始

如果你从未使用过终端、编辑过 JSON 文件，或者配置过 AI 模型，这一页就是给你的。

目标很小：让 nanobot 在你的浏览器里给出一个本地回复。先不要连接 Telegram、Discord、Docker、本地模型或部署。这些在第一次回复成功后会更容易。

## 你正在设置什么

快速开始只需要记住这些词：

| 词 | 直白含义 |
|---|---|
| 终端 | 你可以粘贴命令并按 Enter 的文本窗口。 |
| 命令 | 你在终端里运行的一行文本。 |
| API key | 来自 AI 提供商的、类似密码的令牌。不要公开分享。 |
| 配置文件 | nanobot 启动时读取的设置文件。 |
| 向导 | 一个交互式终端菜单，会帮你编辑配置文件。 |
| 浏览器 UI | 你与 nanobot 聊天的本地网页。 |

## 1. 打开终端

你将把命令粘贴到终端里。每个代码块里只复制命令文本；不要复制 ``` 标记。

| 系统 | 如何打开 |
|---|---|
| Windows | 按 `Win`，输入 `PowerShell`，然后打开 **Windows PowerShell**。 |
| macOS | 按 `Command` + `Space`，输入 `Terminal`，然后按 `Enter`。 |
| Linux | 打开你的应用启动器，搜索 `Terminal`，然后打开它。 |

终端打开后，点击其中，粘贴命令，然后按 `Enter`。如果某个命令打印了文本并返回到提示符，这通常是正常的。

## 2. 安装 Python

从 [python.org](https://www.python.org/downloads/) 安装 Python 3.11 或更新版本。

在 Windows 上，如果安装程序显示该选项，请在安装过程中启用 **Add python.exe to PATH**。

在那个终端里，检查 Python：

```bash
python --version
```

如果 Windows 提示找不到 `python`，请关闭并重新打开 PowerShell。如果还是不行，试试：

```bash
py --version
```

如果 `py` 能用但 `python` 不能用，请把下面命令里的 `python` 替换为 `py`。

如果 macOS 或 Linux 提示找不到 `python`，试试：

```bash
python3 --version
```

如果 `python3` 能用但 `python` 不能用，请把下面手动命令里的 `python` 替换为 `python3`。一键安装器已经会同时检查 `python3` 和 `python`。

## 3. 获取提供商 API key

nanobot 不会替你创建 AI 账户或 API keys。请使用你已经控制的 AI 提供商账户、公司端点、订阅端点，或本地模型服务器。如果提供商文档里有 OpenAI-compatible base URL，也一并记下来。

设置路径如下：

1. 打开你的提供商的 API key 页面。
2. 创建或复制一个 API key。
3. 保持该 key 私密。
4. 如果提供商文档显示了 base URL，也一并记下来。

## 4. 安装 nanobot

最简单的方式是一键安装器。它会安装或升级 nanobot，然后启动设置向导。在 macOS 和 Linux 上，它会通过使用已激活的虚拟环境、`uv`、`pipx`，或 `~/.nanobot/venv` 下受管理的 venv，来避免系统级 pip 安装。

**macOS / Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.sh | sh
```

**Windows PowerShell**

```powershell
irm https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.ps1 | iex
```

这些命令会安装稳定的 PyPI 包。若想在不更改环境的情况下预览安装器会做什么，可以传入 `--dry-run`：

```bash
curl -fsSL https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.sh | sh -s -- --dry-run
```

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.ps1))) --dry-run
```

只有在维护者要求你测试当前 `main` 分支时，才使用开发版安装器：

```bash
curl -fsSL https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.sh | sh -s -- --dev
```

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/HKUDS/nanobot/main/scripts/install.ps1))) --dev
```

如果命令提示找不到 `curl` 或 `irm`，或者无法从 GitHub 下载，请使用下面的手动安装命令之一。

如果安装了 `uv`，请使用：

```bash
uv tool install nanobot-ai
```

如果你更喜欢 pip，请只在你自己控制的环境中使用：

```bash
python -m pip install nanobot-ai
```

如果 pip 在 macOS 或 Linux 上报告 `externally-managed-environment`，请返回使用一键安装器，使用 `uv tool install nanobot-ai`，使用 `pipx install nanobot-ai`，或者先创建一个虚拟环境。

然后检查 nanobot 是否已安装：

```bash
nanobot --version
```

如果终端找不到 `nanobot`，请使用模块形式：

```bash
python -m nanobot --version
```

如果在第 2 步中可用的 Python 命令是 `python3` 或 `py`，请使用 `python3 -m nanobot --version` 或 `py -m nanobot --version`。

## 5. 运行设置向导

一键安装器会在安装后自动为你启动这个步骤。如果你是手动安装的，请运行：

```bash
nanobot onboard --wizard
```

如果找不到 `nanobot`，请运行：

```bash
python -m nanobot onboard --wizard
```

如果在第 2 步中可用的 Python 命令是 `python3` 或 `py`，请使用 `python3 -m nanobot onboard --wizard` 或 `py -m nanobot onboard --wizard`。

这个向导是一个终端菜单。它不是图形应用，但它允许你通过选择选项来配置，而不是手动编辑每个 JSON 字段。

你会看到一个类似这样的菜单：

```text
> What would you like to do?
  [Q] Quick Start
  [A] Advanced Settings
  [X] Exit
```

按以下方式在向导中操作：

| 当你看到 | 这样做 |
|---|---|
| 一个菜单 | 使用方向键高亮某个选项，然后按 `Enter`。 |
| 提供商菜单 | 选择你想使用的公司或服务。 |
| 一个端点菜单 | 选择与你的 key 匹配的标准 API 或订阅计划端点。 |
| 一个 API key 字段 | 粘贴 key，然后按 `Enter`。 |
| 一个提供商 base URL 字段 | 从其文档中粘贴提供商 base URL，然后按 `Enter`。 |
| Model ID 字段 | 从你的提供商那里粘贴一个模型名称，然后按 `Enter`。 |
| 高级设置中的返回选项 | 选择它返回上一级菜单。 |

首次设置时，选择 `[Q] Quick Start`。它会为你配置推荐的本地浏览器 UI 和默认 AI 设置。只有在你需要聊天应用、工具设置或提供商特定字段时，之后再使用 `Advanced Settings`。

1. 选择 `[Q] Quick Start`。
2. 选择你想使用的提供商。
3. 如果向导询问，选择端点，例如 Standard API、Coding Plan、Token Plan 或 Step Plan。
4. 如果向导要求，粘贴你的 API key。
5. 如果向导要求，粘贴提供商 base URL。
6. 粘贴该提供商可以运行的 model ID。
7. 确认 Quick Start 应为本地 WebUI 启用 WebSocket 通道。
8. 按提示设置 WebUI 密码。
9. 查看 Quick Start 摘要。Quick Start 完成后，向导会保存并退出。

推荐路径会为本地 WebUI 启用 `channels.websocket`，要求设置 WebUI 密码，并写入默认 AI 设置。第一次运行时，你不需要单独选择聊天应用。

如果你已经知道自己需要自定义 headers、提供商特定请求字段、聊天应用或工具，请改为选择 `Advanced Settings`。[`provider-cookbook.md`](./provider-cookbook.md) 提供了几个常见提供商设置的可复制示例。更改高级设置后，主菜单中会出现保存选项。请选择 `[S] Save and Exit`。

向导会创建或更新：

| 路径 | 含义 |
|---|---|
| `~/.nanobot/config.json` | 设置文件。 |
| `~/.nanobot/workspace/` | 用于记忆、会话和生成文件的工作文件夹。 |

如果 Quick Start 成功完成，请跳到 [打开 WebUI](#7-open-the-webui)。接下来的两个部分只适用于手动设置。

## 手动设置：如何合并 JSON 片段

大多数文档示例是片段，不是完整文件。你的 `config.json` 只有一个外层 `{ ... }`。把诸如 `providers`、`modelPresets`、`agents` 或 `channels` 这样的新顶层部分，添加到同一个外层对象中。

不要把两个独立的 JSON 对象粘贴到一个文件里：

```text
{
  "providers": { "...": "..." }
}
{
  "channels": { "...": "..." }
}
```

把它们合并成一个对象：

```json
{
  "providers": {
    "custom": {
      "apiKey": "your-api-key",
      "apiBase": "https://api.example.com/v1"
    }
  },
  "channels": {
    "websocket": {
      "enabled": true,
      "tokenIssueSecret": "your-webui-password",
      "websocketRequiresToken": true
    }
  }
}
```

注意 `providers` 块后面的逗号。JSON 需要在同级部分之间使用逗号，但最后一个部分后面不需要。如果这感觉很难，请尽可能使用 `nanobot onboard --wizard`。
## 6. 手动设置：配置回退

仅当向导不可用，或者你更想自己打开文件时才使用此方法。

如果 `~/.nanobot/config.json` 还不存在，请先运行 `nanobot onboard`。

使用以下命令之一：

**Windows PowerShell**

```powershell
notepad "$env:USERPROFILE\.nanobot\config.json"
```

**macOS**

```bash
open -e ~/.nanobot/config.json
```

**Linux**

```bash
xdg-open ~/.nanobot/config.json
```

如果这是全新安装，且你还没有配置任何其他内容，请将文件替换为此最小配置：

```json
{
  "providers": {
    "custom": {
      "apiKey": "your-api-key",
      "apiBase": "https://api.example.com/v1"
    }
  },
  "modelPresets": {
    "primary": {
      "label": "Primary",
      "provider": "custom",
      "model": "model-id-from-your-provider",
      "maxTokens": 4096,
      "contextWindowTokens": 65536,
      "temperature": 0.1
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  },
  "channels": {
    "websocket": {
      "enabled": true,
      "tokenIssueSecret": "your-webui-password",
      "websocketRequiresToken": true
    }
  }
}
```

将 `your-api-key`、`https://api.example.com/v1`、`model-id-from-your-provider` 和 `your-webui-password` 替换为你自己的值。

如需可直接复制的、按提供商区分的示例，请使用 [`provider-cookbook.md`](./provider-cookbook.md)。

保存文件。

## 7. 打开 WebUI

先检查 nanobot 是否能读取已保存的设置：

```bash
nanobot status
```

这应该会显示配置文件路径、工作区路径，以及当前激活的模型或预设。如果找不到 `nanobot`，请使用 `python -m nanobot status`、`python3 -m nanobot status` 或 `py -m nanobot status`，并与第 2 步中可用的 Python 命令保持一致。

大多数提供商显示 `not set` 是正常的。只有你在当前预设中选定的那个提供商需要看起来已配置好。

启动本地浏览器 UI：

```bash
nanobot gateway
```

保持该终端窗口打开，然后在浏览器中打开 `http://127.0.0.1:8765`。输入你在向导中设置的 WebUI 密码，或者手动配置中的 `tokenIssueSecret` 值。

在浏览器中发送第一条消息：

```text
Hello!
```

如果这一步成功，说明 nanobot 已安装并且可以调用模型。你应该会在浏览器中看到正常的助手回复。具体措辞会不同，但大致会是这种形式：

```text
Hello! How can I help you today?
```

如果找不到 `nanobot`，请运行：

```bash
python -m nanobot gateway
```

如果第 2 步中可用的是 `python3` 命令，则使用 `python3 -m nanobot gateway`；如果可用的是 `py`，则使用 `py -m nanobot gateway`。

一旦这一步可用，nanobot 就可以帮助完成它自己的下一步设置。在浏览器 UI 中，要求它阅读这些文档，并针对某个具体目标更新你当前的配置；然后当 nanobot 告诉你配置已准备好时，运行 `/restart`。例如，你可以让它添加一个提供商预设，或者配置一个聊天应用。

## 8. 如果出现问题

不要同时改很多东西。请检查具体错误：

| 错误或症状 | 通常表示什么 |
|---|---|
| `JSON parse error` | 配置文件中缺少逗号、多了逗号，或者大括号不匹配。请重新复制示例。 |
| `401`、`unauthorized` 或 `invalid API key` | API key 错误、已过期、包含多余空格，或者被粘贴到了错误的提供商下。 |
| `model not found` | 你的账户无法使用默认模型。返回 `nanobot onboard --wizard`，选择 `Advanced Settings`，然后编辑 `Model Presets`。 |
| `nanobot: command not found` | Python 中安装成功了，但你的 shell 找不到这个脚本。请使用 `python -m nanobot ...`、`python3 -m nanobot ...` 或 `py -m nanobot ...`，并与之前可用的 Python 命令保持一致。 |
| 编辑配置后没有响应 | 重启该命令。长时间运行的进程会在启动时读取配置。 |

更完整的诊断路径请参见 [`troubleshooting.md`](./troubleshooting.md)。

## 目前不要配置的内容

在第一条本地消息成功之前，先跳过这些内容：

- `apiBase`：托管的内置提供商通常已经有默认端点。只有在本地模型、代理、自定义 OpenAI 兼容提供商，或特殊的区域/订阅端点场景下才需要 `apiBase`。
- 聊天应用：先证明本地浏览器 UI 可以正常回复。
- 回退模型：以后会有用，但第一条回复不需要。
- Langfuse：有助于可观测性，但初始设置不需要。

## 下一步

第一条回复成功后，只选择一个下一个目标。只要你在使用 WebUI 或聊天应用，就保持运行 `nanobot gateway` 的终端窗口打开。

### 再次打开浏览器 UI

运行：

```bash
nanobot gateway
```

保持该终端窗口打开，然后在浏览器中打开 `http://127.0.0.1:8765`。

稍后若要停止 WebUI，请回到 gateway 终端并按 `Ctrl+C`。

如果找不到 `nanobot`，请运行 `python -m nanobot gateway`、`python3 -m nanobot gateway` 或 `py -m nanobot gateway`，并与之前可用的 Python 命令保持一致。更多细节见 [`webui.md`](./webui.md)。

### 连接聊天应用

1. 阅读 [`chat-apps.md`](./chat-apps.md) 中某一个应用对应的部分。
2. 只添加该应用的配置片段。将其合并到现有文件中，不要替换整个文件。
3. 运行：

```bash
nanobot channels status
nanobot gateway
```

4. 保持 gateway 终端打开，然后从允许的账户发送一条消息。

请先从私聊或测试服务器开始。除非你有意让任何能访问该通道的人都能和机器人对话，否则不要将 `allowFrom` 设置为 `["*"]`。

### 更改模型或添加备用项

当某个提供商/模型组合失败时，请使用 [`providers.md`](./providers.md)；当你需要可直接复制的片段时，请使用 [`provider-cookbook.md`](./provider-cookbook.md)。将模型选择保留在 `modelPresets` 中，然后通过 `agents.defaults.modelPreset` 选择当前激活的模型预设。

### 寻求帮助

当你寻求帮助时，请包含以下信息：

- 你的操作系统；
- 你运行的命令；
- `nanobot --version`;
- `nanobot status`;
- 浏览器 UI 是否能回复 `Hello!`；
- 完整的错误文本；
- 一段已移除 API keys 和 tokens 的配置片段。

不要在公开 issue 或聊天中粘贴真实的 API keys、机器人 token、OAuth token 或私有聊天 ID。

如果你发现文档错误、过时的命令，或者令人困惑的步骤，请提交 issue：<https://github.com/HKUDS/nanobot/issues>。
