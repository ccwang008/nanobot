<!-- 本文件由 docs/configuration.md 翻译生成；原文仍保留在上级目录。 -->

# 配置

配置文件：`~/.nanobot/config.json`

这是完整参考。如果这是你的首次安装，请先从 [`quick-start.md`](./quick-start.md) 开始。如果你正在尝试选择模型或修复提供商/模型匹配，请先查看 [`providers.md`](./providers.md)，再返回这里查看准确字段和高级选项。

下面的 JSON 示例通常是要合并到你现有配置中的部分片段，而不是完整替换文件。关于配置、工作区、网关、通道、会话、工具和记忆背后的心智模型，请参阅 [`concepts.md`](./concepts.md)。

生成的 `config.json` 使用驼峰式键名，例如 `apiKey` 和 `intervalS`。为了兼容性也接受 snake_case 键名，但文档更偏好驼峰式，因为那是 nanobot 写回磁盘时使用的格式。

对于设置和运行时故障，在一次修改多个配置区域之前，请先遵循 [`troubleshooting.md`](./troubleshooting.md) 中的诊断顺序。

> [!NOTE]
> 如果你的配置文件比当前 schema 更旧，你可以在不覆盖现有值的情况下刷新它：运行 `nanobot onboard`，然后在被询问是否覆盖配置时回答 `N`。nanobot 会合并缺失的默认字段，并保留你当前的设置。

## 快速跳转

| 需求 | 章节 |
|---|---|
| 将密钥保留在 `config.json` 之外 | [环境变量中的密钥](#environment-variables-for-secrets) |
| 使用 env vars 调整进程级行为 | [运行时环境变量](#runtime-environment-variables) |
| 跟踪模型调用 | [Langfuse 可观测性](#langfuse-observability) |
| 配置凭据和端点 | [提供商](#providers) |
| 命名并切换模型选择 | [模型预设](#model-presets) |
| 添加回退链 | [模型回退](#model-fallbacks) |
| 配置语音转录 | [转录设置](#transcription-settings) |
| 调整通道默认值 | [通道设置](#channel-settings) |
| 配置网页搜索和抓取 | [网页工具](#web-tools) |
| 启用图像生成 | [图像生成](#image-generation) |
| 添加 MCP 服务器 | [MCP](#mcp-model-context-protocol) |
| 查看 shell、工作区和 SSRF 控制 | [安全性](#security) |
| 控制访问和配对 | [配对](#pairing) |
| 调整网关作业、会话和工具 | [网关心跳](#gateway-heartbeat)、[自动压缩](#auto-compact)、[统一会话](#unified-session)、[工具提示最大长度](#tool-hint-max-length) |

## 先编辑哪里

如果你不确定某个设置属于哪里，请从你要完成的任务入手。大多数更改会涉及一个配置部分和一个验证命令。

| 任务 | 首先检查的键 | 使用什么验证 | 深入了解 |
|---|---|---|---|
| 让第一个模型回复正常工作 | `providers.<name>.apiKey`，可选 `providers.<name>.apiBase`、`modelPresets.<preset>`、`agents.defaults.modelPreset` | `nanobot status`，然后 `nanobot agent -m "Hello!"` | [提供商](#providers)、[模型预设](#model-presets) |
| 添加回退模型 | `modelPresets.<fallback>`、`agents.defaults.fallbackModels` | `nanobot status`，然后正常运行一次智能体 | [模型回退](#model-fallbacks) |
| 将密钥保留在配置文件之外 | 任何字符串值中的 `${ENV_VAR}` 占位符 | 从设置该变量的同一环境启动 nanobot | [环境变量中的密钥](#environment-variables-for-secrets) |
| 打开内置 WebUI | `channels.websocket.enabled`，可选 `channels.websocket.port`、`channels.websocket.tokenIssueSecret` | `nanobot gateway`，然后打开 `http://127.0.0.1:8765` | [通道设置](#channel-settings)、[WebSocket 文档](./websocket.md) |
| 连接一个聊天应用 | `channels.<channel>.enabled`、通道凭据、`channels.<channel>.allowFrom` | `nanobot channels status`，然后 `nanobot gateway --verbose` | [通道设置](#channel-settings)、[聊天应用](./chat-apps.md) |
| 启用语音转录 | `transcription.enabled`、`transcription.provider`、匹配的 `providers.<name>.apiKey` | 通过已配置的界面发送或上传一条简短语音消息 | [转录设置](#transcription-settings) |
| 启用网页搜索或抓取 | `tools.web.search.*`、`tools.web.fetch.*`、可选 `tools.ssrfWhitelist` | 提出一个需要当前网页信息的问题，然后在需要时检查日志 | [网页工具](#web-tools)、[安全性](#security) |
| 启用图像生成 | `tools.imageGeneration.enabled`、`tools.imageGeneration.provider`、`tools.imageGeneration.model`、匹配的提供商凭据 | 在 WebUI 中启用图像生成并发送一条图像请求 | [图像生成](#image-generation) |
| 通过 MCP 添加外部工具 | `tools.mcpServers.<name>` | 启动 `nanobot gateway --verbose` 并检查启动/工具日志 | [MCP](#mcp-model-context-protocol) |
| 加强工具和网络安全 | `tools.restrictToWorkspace`、`tools.exec.sandbox`、`tools.ssrfWhitelist`、`channels.*.allowFrom` | 通过你计划公开的通道或 CLI 运行同一工作流 | [安全性](#security)、[配对](#pairing) |
| 调整请求超时或进程并发 | `NANOBOT_LLM_TIMEOUT_S`、`NANOBOT_STREAM_IDLE_TIMEOUT_S`、`NANOBOT_MAX_CONCURRENT_REQUESTS` | 从同一环境启动 nanobot 并检查启动/运行日志 | [运行时环境变量](#runtime-environment-variables) |
| 运行多个隔离的机器人 | 分开的 `--config` 和 `--workspace` 路径，以及进程一起运行时不同的 `gateway.port` 或通道端口 | 为每个进程使用显式路径启动，并且仅对默认实例运行 `nanobot status` | [多个实例](./multiple-instances.md)、[CLI 参考](./cli-reference.md) |
| 观察模型调用 | `LANGFUSE_SECRET_KEY`、`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_BASE_URL` 环境变量 | 运行一次模型调用，然后检查对应的 Langfuse 项目 | [Langfuse 可观测性](#langfuse-observability) |

## 环境变量中的密钥

你可以使用从启动时环境变量中解析的 `${VAR_NAME}` 引用，而不是将密钥直接存储在 `config.json` 中：

```json
{
  "channels": {
    "telegram": { "token": "${TELEGRAM_TOKEN}" },
    "email": {
      "imapPassword": "${IMAP_PASSWORD}",
      "smtpPassword": "${SMTP_PASSWORD}"
    }
  },
  "providers": {
    "groq": { "apiKey": "${GROQ_API_KEY}" }
  }
}
```

`config.json` 中的任何字符串值都可以使用 `${VAR_NAME}`。解析只在启动时运行一次，并且仅在内存中进行——解析后的值永远不会写回磁盘，因此通过 `nanobot onboard` 或 WebUI 编辑配置时会保留占位符。

如果引用的变量未设置，nanobot 会在启动时快速失败并报 `ValueError: Environment variable 'NAME' referenced in config is not set`。

### 更多示例

**MCP 服务器** — 同时支持 stdio `env` 和 HTTP `headers`：

```json
{
  "tools": {
    "mcpServers": {
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
      },
      "remote": {
        "url": "https://example.com/mcp/",
        "headers": { "Authorization": "Bearer ${REMOTE_MCP_TOKEN}" }
      }
    }
  }
}
```

**网页搜索提供商：**

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "brave",
        "apiKey": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

### 在启动时加载变量

选择最适合你部署方式的方案即可——nanobot 只会在启动时读取 `os.environ`，因此任何能够填充进程环境的方法都可以。

**systemd** — 在服务单元中使用 `EnvironmentFile=` 从一个只有部署用户可读的文件中加载变量：

```ini
# /etc/systemd/system/nanobot.service (excerpt)
[Service]
EnvironmentFile=/home/youruser/nanobot_secrets.env
User=nanobot
ExecStart=...
```

```bash
# /home/youruser/nanobot_secrets.env (mode 600, owned by youruser)
TELEGRAM_TOKEN=your-token-here
IMAP_PASSWORD=your-password-here
```

**Docker** — 将 env file 传给本地构建的镜像（每行一个 `KEY=VALUE`），或者使用 `-e KEY=value`：

```bash
docker run --rm --env-file=./nanobot.env \
  -v ~/.nanobot:/home/nanobot/.nanobot \
  nanobot agent -m "Hello"
```

**direnv** — 在工作目录中放置一个 `.envrc`，然后运行 `direnv allow`：

```bash
# .envrc (auto-loaded by direnv)
export TELEGRAM_TOKEN=your-token-here
export ANTHROPIC_API_KEY=...
```

**密钥管理器（1Password、Bitwarden、pass）** — 将进程包装起来，使密钥只在运行期间以环境变量形式存在，绝不落盘：

```bash
# 1Password — references in .env.tpl look like `op://Vault/Item/field`
op run --env-file=.env.tpl -- nanobot agent

# pass (passwordstore.org)
ANTHROPIC_API_KEY="$(pass show api/anthropic)" nanobot agent

# Bitwarden
ANTHROPIC_API_KEY="$(bw get password api/anthropic)" nanobot agent
```

## 运行时环境变量

这些变量是进程级开关。请在启动 nanobot 的同一个终端、服务单元、容器或 supervisor 中设置它们。

### 运行时控制

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `NANOBOT_MAX_CONCURRENT_REQUESTS` | `3` | 并发运行的入站智能体请求的最大数量。必须是整数；设为 `0` 或负值表示不限制。 |
| `NANOBOT_LLM_TIMEOUT_S` | `300` | 普通 LLM 请求的墙钟超时时间（秒）。设为 `0` 可禁用。持续目标轮次会绕过此墙钟上限。 |
| `NANOBOT_STREAM_IDLE_TIMEOUT_S` | `90` | 流式传输空闲超时时间（秒），供流式提供商使用。无效或非正值会被忽略；高于 `3600` 的值会被截断。 |
| `NANOBOT_OPENAI_COMPAT_TIMEOUT_S` | `120` | 供 OpenAI 兼容提供商使用的 HTTP 请求超时时间（秒）。无效或非正值会被忽略。 |
| `NANOBOT_WORKSPACE_SANDBOX_ENFORCED` | unset | 表示外部工作区沙箱已被强制启用。真值（`1`、`true`、`yes`、`on`、`enabled`）会使用 `NANOBOT_WORKSPACE_SANDBOX_PROVIDER` 作为标签；任何其他非 false 值都会被视为提供商名称。 |
| `NANOBOT_WORKSPACE_SANDBOX_PROVIDER` | `unknown` | 当 `NANOBOT_WORKSPACE_SANDBOX_ENFORCED` 为真值时，外部工作区沙箱的显示标签，例如 `macos_app_sandbox` 或 `bwrap`。 |
| `NANOBOT_SANDBOX_ENFORCED` | unset | `NANOBOT_WORKSPACE_SANDBOX_ENFORCED` 的旧版兼容别名。 |
| `NANOBOT_TMUX_SOCKET_DIR` | `${TMPDIR:-/tmp}/nanobot-tmux-sockets` | 内置 `tmux` 技能脚本使用的套接字目录。 |

### 安装器、构建和 WebUI 开发

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `NANOBOT_BIN_DIR` | `$HOME/.local/bin` | macOS/Linux 上的安装器启动器目录。 |
| `NANOBOT_VENV` | `$HOME/.nanobot/venv` | 安装器回退使用的受管理虚拟环境路径。 |
| `NANOBOT_SKIP_WIZARD` | unset | 设置为 `1` 可在一键安装后跳过 `nanobot onboard --wizard`。 |
| `NANOBOT_SKIP_WEBUI_BUILD` | unset | 设置为 `1` 可在包构建期间跳过 WebUI 打包。 |
| `NANOBOT_FORCE_WEBUI_BUILD` | unset | 即使 `nanobot/web/dist/index.html` 已存在，也设置为 `1` 以重建内置 WebUI。 |
| `NANOBOT_API_URL` | `http://127.0.0.1:8765` | Vite WebUI 开发服务器代理的网关目标。 |

诸如 `NANOBOT_RESTART_*` 和 `NANOBOT_PATH_*` 之类的内部变量由 nanobot 自身设置，不属于支持的用户配置范围。

## Langfuse 可观测性

nanobot 可以通过 Langfuse 的 OpenAI SDK 包装器跟踪 OpenAI 兼容提供商的调用。这个通过环境变量配置，而不是 `config.json`。

在运行 nanobot 的同一 Python 环境中安装可选包：

```bash
python -m pip install langfuse
```

在启动 `nanobot agent`、`nanobot gateway` 或 `nanobot serve` 之前设置 Langfuse 凭据：

```bash
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_BASE_URL="https://cloud.langfuse.com"
```

对于 PowerShell：

```powershell
$env:LANGFUSE_SECRET_KEY = "sk-lf-..."
$env:LANGFUSE_PUBLIC_KEY = "pk-lf-..."
$env:LANGFUSE_BASE_URL = "https://cloud.langfuse.com"
```

当设置了 `LANGFUSE_SECRET_KEY` 且已安装 `langfuse` 包时，nanobot 会对 OpenAI 兼容提供商使用 `langfuse.openai.AsyncOpenAI`，以便将模型请求在后台发送到 Langfuse。如果设置了密钥但缺少 `langfuse`，nanobot 会记录警告并回退到常规 OpenAI 客户端。

请使用与项目匹配的 Langfuse 区域或自托管 URL。[Langfuse OpenAI SDK 文档](https://langfuse.com/integrations/model-providers/openai-py) 对云区域和自托管实例使用 `LANGFUSE_BASE_URL`。

跟踪覆盖的是走 nanobot 的 OpenAI 兼容客户端路径的提供商。不使用该客户端的原生提供商可能不会生成 Langfuse OpenAI 包装器跟踪。
## 提供商

> [!TIP]
> - **语音转录**：语音消息和 WebUI 麦克风输入使用共享的顶层 `transcription` 设置。默认 `transcription.provider` 值是 `"groq"`；将其设为 `"openai"` 以使用 OpenAI Whisper，设为 `"openrouter"` 以使用 OpenRouter 语音转文本模型，设为 `"xiaomi_mimo"` 以使用 Xiaomi MiMo ASR，或设为 `"assemblyai"` 以使用 AssemblyAI。API 密钥仍保存在匹配的 `providers.<provider>` 配置中。
> - **MiniMax Coding Plan**：为 nanobot 社区提供专属折扣链接：[海外](https://platform.minimax.io/subscribe/coding-plan?code=9txpdXw04g&source=link) · [中国大陆](https://platform.minimaxi.com/subscribe/token-plan?code=GILTJpMTqZ&source=link)
> - **MiniMax（中国大陆）**：如果你的 API 密钥来自 MiniMax 的中国大陆平台（minimaxi.com），请在你的 minimax provider 配置中设置 `"apiBase": "https://api.minimaxi.com/v1"`。
> - **MiniMax 思考模式**：`providers.minimaxAnthropic` 是 `reasoningEffort` / 思考模式的配置块。MiniMax 通过其兼容 Anthropic 的 endpoint 暴露该能力，因此 nanobot 将其保留为单独的 provider，而不是在通用的兼容 OpenAI 的 `minimax` endpoint 上猜测 MiniMax 特有的思考参数。它使用相同的 `MINIMAX_API_KEY`。默认兼容 Anthropic 的 base URL：`https://api.minimax.io/anthropic`；在中国大陆请使用 `https://api.minimaxi.com/anthropic`。
> - **Kimi Coding Plan**：将 `providers.kimiCoding` 与 `provider: "kimi_coding"` 一起用于 Kimi 的专用 Anthropic Messages API endpoint。该 endpoint 需要一个兼容 Claude 的 `User-Agent`；nanobot 默认发送 `claude-code/0.1.0`，如果你的账户需要不同的值，可以用 `extraHeaders.User-Agent` 覆盖。
> - **VolcEngine / BytePlus Coding Plan**：订阅 endpoint 通过专用 provider `volcengineCodingPlan` 或 `byteplusCodingPlan` 进行配置，与按量计费的 `volcengine` / `byteplus` provider 分开。
> - **OpenCode Zen / Go**：`providers.opencodeZen` 和 `providers.opencodeGo` 使用相同的 `OPENCODE_API_KEY`，但路由到不同的 OpenCode gateway。这些 provider 使用 OpenCode 的兼容 OpenAI 的 `chat/completions` endpoint；请从该 endpoint 系列中选择 model ID。
> - **Zhipu Coding Plan**：如果你使用的是 Zhipu 的 coding plan，请在你的 zhipu provider 配置中设置 `"apiBase": "https://open.bigmodel.cn/api/coding/paas/v4"`。
> - **Alibaba Cloud BaiLian**：如果你使用的是 Alibaba Cloud BaiLian 的兼容 OpenAI 的 endpoint，请在你的 dashscope provider 配置中设置 `"apiBase": "https://dashscope.aliyuncs.com/compatible-mode/v1"`。
> - **StepFun Step Plan**：如果你使用的是 StepFun 的 Step Plan 订阅，请在你的 stepfun provider 配置中设置 `"apiBase": "https://api.stepfun.ai/step_plan/v1"`。支持的模型包括 `step-3.5-flash`、`step-3.5-flash-2603` 和 `step-router-v1`。
> - **Step Fun（中国大陆）**：如果你的 API 密钥来自 Step Fun 的中国大陆平台（stepfun.com），请在你的 stepfun provider 配置中设置 `"apiBase": "https://api.stepfun.com/v1"`。
> - **Xiaomi MiMo 思考模式**：MiMo 模型（例如 `mimo-v2.5-pro`）默认启用思考。使用 `agents.defaults.reasoningEffort: "none"` 可将其禁用，或使用 `"low"` / `"medium"` / `"high"` 保持开启。省略该字段会保留 provider 按模型的默认值。
> - **Xiaomi MiMo Token Plan**：如果你使用的是 MiMo 的 token plan，请在你的 xiaomi_mimo provider 配置中设置 `"apiBase": "https://token-plan-sgp.xiaomimimo.com/v1"`。
> - **自定义兼容 OpenAI 的 provider**：除了内置的 `custom` provider 之外，`providers` 下的任何额外键都可以定义自己的兼容 OpenAI 的 endpoint。例如，`providers.companyProxy.apiBase` 加上 `modelPresets.primary.provider: "companyProxy"` 会创建一个单独的自定义 provider。设置 `apiBase`；只有当 endpoint 需要时才设置 `apiKey`。这个命名自定义路径仅使用兼容 OpenAI 的请求格式。对于兼容 Anthropic 的代理，请使用 `providers.anthropic.apiBase` 和 `provider: "anthropic"`。
> - **provider 作用域代理**：`providers.<name>.proxy` 仅将该 provider 通过 HTTP proxy 路由。它支持兼容 OpenAI 的 provider 和 `openai_codex`。诸如 `anthropic`、`bedrock`、`azure_openai` 和 `github_copilot` 之类的原生 provider 后端会拒绝 `proxy`。

| Provider | 用途 | 获取 API Key |
|----------|------|--------------|
| `custom` | 任意兼容 OpenAI 的 endpoint | — |
| `openrouter` | LLM gateway，用于托管模型系列 + 语音转录（STT 模型） | [openrouter.ai](https://openrouter.ai) |
| `opencode_zen` | LLM gateway（OpenCode Zen coding-agent 模型） | [opencode.ai/docs/zen](https://opencode.ai/docs/zen/) |
| `opencode_go` | LLM gateway（OpenCode Go 低成本 coding 模型） | [opencode.ai/docs/go](https://opencode.ai/docs/go/) |
| `huggingface` | LLM（Hugging Face Inference Providers） | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `skywork` | LLM（Skywork / APIFree API gateway） | [apifree.ai](https://www.apifree.ai) |
| `volcengine` | LLM（VolcEngine，按量计费） | [Coding Plan](https://www.volcengine.com/activity/codingplan?utm_campaign=nanobot&utm_content=nanobot&utm_medium=devrel&utm_source=OWO&utm_term=nanobot) · [volcengine.com](https://www.volcengine.com) |
| `volcengine_coding_plan` | LLM（VolcEngine Coding Plan 订阅 endpoint） | [volcengine.com](https://www.volcengine.com/activity/codingplan?utm_campaign=nanobot&utm_content=nanobot&utm_medium=devrel&utm_source=OWO&utm_term=nanobot) |
| `byteplus` | LLM（VolcEngine 国际版，按量计费） | [Coding Plan](https://www.byteplus.com/en/activity/codingplan?utm_campaign=nanobot&utm_content=nanobot&utm_medium=devrel&utm_source=OWO&utm_term=nanobot) · [byteplus.com](https://www.byteplus.com) |
| `byteplus_coding_plan` | LLM（BytePlus Coding Plan 订阅 endpoint） | [byteplus.com](https://www.byteplus.com/en/activity/codingplan?utm_campaign=nanobot&utm_content=nanobot&utm_medium=devrel&utm_source=OWO&utm_term=nanobot) |
| `anthropic` | LLM（Claude 直连） | [console.anthropic.com](https://console.anthropic.com) |
| `azure_openai` | LLM（Azure OpenAI） | [portal.azure.com](https://portal.azure.com) |
| `bedrock` | LLM（AWS Bedrock Converse，Claude/Nova/Llama 等） | [aws.amazon.com/bedrock](https://aws.amazon.com/bedrock/) |
| `openai` | LLM + 语音转录（Whisper） | [platform.openai.com](https://platform.openai.com) |
| `assemblyai` | 仅语音转录 | [assemblyai.com](https://www.assemblyai.com/) |
| `deepseek` | LLM（DeepSeek 直连） | [platform.deepseek.com](https://platform.deepseek.com) |
| `groq` | LLM + 语音转录（Whisper，默认） | [console.groq.com](https://console.groq.com) |
| `minimax` | LLM（MiniMax 直连） | [platform.minimaxi.com](https://platform.minimaxi.com) |
| `minimax_anthropic` | LLM（MiniMax 兼容 Anthropic 的 endpoint，思考模式） | [platform.minimaxi.com](https://platform.minimaxi.com) |
| `gemini` | LLM（Gemini 直连） | [aistudio.google.com](https://aistudio.google.com) |
| `aihubmix` | LLM（API gateway，访问所有模型） | [aihubmix.com](https://aihubmix.com) |
| `siliconflow` | LLM（SiliconFlow/硅基流动） | [siliconflow.cn](https://siliconflow.cn) |
| `novita` | LLM（Novita AI 兼容 OpenAI 的 gateway） | [novita.ai](https://novita.ai) |
| `dashscope` | LLM（Qwen） | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com) |
| `moonshot` | LLM（Moonshot/Kimi） | [platform.kimi.com](https://platform.kimi.com?aff=nanobot) |
| `kimi_coding` | LLM（Kimi Coding Plan，Anthropic Messages API） | [platform.kimi.com](https://platform.kimi.com?aff=nanobot) |
| `zhipu` | LLM（Zhipu GLM） | [open.bigmodel.cn](https://open.bigmodel.cn) |
| `xiaomi_mimo` | LLM（MiMo） | [platform.xiaomimimo.com](https://platform.xiaomimimo.com) |
| `longcat` | LLM（LongCat） | [longcat.chat](https://longcat.chat/platform/docs/zh/) |
| `ant_ling` | LLM（Ant Ling / 蚂蚁百灵） | [developer.ant-ling.com](https://developer.ant-ling.com/en/docs/api-reference/openai/) |
| `ollama` | LLM（本地，Ollama） | — |
| `lm_studio` | LLM（本地，LM Studio） | — |
| `atomic_chat` | LLM（本地，[Atomic Chat](https://atomic.chat/)） | — |
| `mistral` | LLM | [docs.mistral.ai](https://docs.mistral.ai/) |
| `stepfun` | LLM（Step Fun/阶跃星辰）+ 语音转录（ASR） | [platform.stepfun.com](https://platform.stepfun.com) |
| `ovms` | LLM（本地，OpenVINO Model Server） | [docs.openvino.ai](https://docs.openvino.ai/2026/model-server/ovms_docs_llm_quickstart.html) |
| `vllm` | LLM（本地，任何兼容 OpenAI 的 server） | — |
| `nvidia` | LLM（NVIDIA NIM） | [build.nvidia.com](https://build.nvidia.com/) |
| `openai_codex` | LLM（Codex，OAuth） | `nanobot provider login openai-codex` |
| `github_copilot` | LLM（GitHub Copilot，OAuth） | `nanobot provider login github-copilot` |
| `qianfan` | LLM（Baidu Qianfan） | [cloud.baidu.com](https://cloud.baidu.com/doc/qianfan/s/Hmh4suq26) |

<details>
<summary><b>OpenAI</b></summary>

默认情况下，OpenAI 使用 `apiType: "auto"`：nanobot 通常调用 Chat Completions，并在有用时将 GPT-5/o-series 或显式 `reasoningEffort` 请求路由到 Responses API。你可以强制使用特定的 API surface：

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "apiType": "chat_completions"
    }
  }
}
```

有效的 `apiType` 值只有 `auto`、`chat_completions` 和 `responses`。

`extraBody` 遵循所选的 OpenAI API surface。使用 Chat Completions 时，nanobot 会将其作为 SDK 的 `extra_body` 值透传。使用 Responses 时，请在 Responses API body 结构中进行配置；nanobot 会将普通的顶层字段合并到 Responses 请求体中，将 `extraBody.tools` 追加到生成的函数工具之后，并合并 `extraBody.include` 而不产生重复：

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "apiType": "responses",
      "extraBody": {
        "tools": [{ "type": "web_search" }],
        "include": ["web_search_call.action.sources"]
      }
    }
  }
}
```

</details>

<details>
<summary><b>Azure OpenAI</b></summary>

`azure_openai` provider 通过 OpenAI **Responses API**（`/openai/v1/responses`）与你的 Azure OpenAI resource 通信。模型名称映射到 **deployment 名称**，而不是 OpenAI model ID。支持两种认证模式。

**模式 1：静态 API key**（最简单）

```json
{
  "providers": {
    "azure_openai": {
      "apiKey": "${AZURE_OPENAI_API_KEY}",
      "apiBase": "https://my-resource.openai.azure.com"
    }
  },
  "modelPresets": {
    "azure": {
      "provider": "azure_openai",
      "model": "my-gpt-5-deployment"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "azure"
    }
  }
}
```

**模式 2：通过 `DefaultAzureCredential` 使用 Microsoft Entra ID（Azure AD）**

省略 `apiKey`（或将其留空 / 不设置）。该 provider 会回退到 [`DefaultAzureCredential`](https://learn.microsoft.com/azure/developer/python/sdk/authentication/credential-chains#defaultazurecredential-overview)，并为每个请求获取一个作用域为 `https://cognitiveservices.azure.com/.default` 的 bearer token。Azure SDK 自身基于 MSAL 的缓存会返回有效 token，而无需网络往返。

```json
{
  "providers": {
    "azure_openai": {
      "apiBase": "https://my-resource.openai.azure.com"
    }
  },
  "modelPresets": {
    "azure": {
      "provider": "azure_openai",
      "model": "my-gpt-5-deployment"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "azure"
    }
  }
}
```

安装可选依赖：

```bash
python -m pip install 'nanobot-ai[azure]'
```

`DefaultAzureCredential` 按顺序遍历此链，并使用第一个成功的身份：

1. **EnvironmentCredential** — 读取 `AZURE_TENANT_ID`、`AZURE_CLIENT_ID`，以及 `AZURE_CLIENT_SECRET` / `AZURE_CLIENT_CERTIFICATE_PATH` / `AZURE_USERNAME` + `AZURE_PASSWORD` 中的一种。
2. **WorkloadIdentityCredential** — 用于 AKS workload-identity / 联合令牌（`AZURE_FEDERATED_TOKEN_FILE`）。
3. **ManagedIdentityCredential** — 用于 Azure VMs、App Service、Functions、Container Apps 等。
4. **AzureCliCredential** — 使用你开发机器上 `az login` 中的令牌。
5. **AzurePowerShellCredential** — 使用 `Connect-AzAccount` 中的令牌。
6. **AzureDeveloperCliCredential** — 使用 `azd auth login` 中的令牌。
7. **InteractiveBrowserCredential** *(默认禁用)*。

最终为请求签名的身份 **必须在 Azure OpenAI 资源上分配 `Cognitive Services OpenAI User` RBAC 角色**（或更高权限）。没有该角色时，你会在首次请求时看到 `401`/`403` 错误。

> `apiBase` 在两种模式下都仍然是必需的 —— 它是你的 Azure 资源端点，无法自动推断。若既未设置 `apiKey` 也未安装 `azure-identity`，提供商会报出清晰错误，并指向 `python -m pip install 'nanobot-ai[azure]'`。

</details>

<details>
<summary><b>Skywork / APIFree</b></summary>

Skywork 使用 APIFree 的 OpenAI 兼容 Agent API 端点。先配置一次提供商，然后使用诸如 `skywork-ai/skyclaw-v1` 之类的 Skywork 模型 ID。

```json
{
  "providers": {
    "skywork": {
      "apiKey": "${SKYWORK_API_KEY}",
      "apiBase": "https://api.apifree.ai/agent/v1"
    }
  },
  "modelPresets": {
    "skywork": {
      "provider": "skywork",
      "model": "skywork-ai/skyclaw-v1",
      "maxTokens": 32768,
      "contextWindowTokens": 131072
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "skywork"
    }
  }
}
```

如果你的环境是这样命名该凭据的，你也可以在 `apiKey` 中引用 `${APIFREE_API_KEY}`。

</details>

<details>
<summary><b>AWS Bedrock (Converse API)</b></summary>

Bedrock 使用原生 `bedrock-runtime` Converse API，因此可以调用 Bedrock 模型 ID，例如 Claude Opus 4.7、Claude Sonnet、Amazon Nova、Meta Llama、Mistral、Qwen，以及其他支持 Converse 的模型。它支持普通聊天、流式传输、工具调用、工具结果、令牌使用情况，以及 Bedrock 错误元数据。

此提供商用于 Bedrock 的原生 Converse API，而不是 Bedrock 的 OpenAI 兼容 `/openai/v1` 端点。对于 OpenAI 兼容的 Bedrock 模型，如果你特别想使用该 API 形态，仍然可以使用 `custom`。

**1. 配置凭据**

使用标准 AWS 凭据链（`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`、AWS 配置文件，或 IAM 角色）。IAM 身份需要：

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": "*"
}
```

你也可以将 `providers.bedrock.apiKey` 设置为 Bedrock API 密钥；nanobot 会将其导出为 `AWS_BEARER_TOKEN_BEDROCK` 供 AWS SDK 使用。

凭据选项：

- **AWS CLI/default profile**: 保持 `apiKey` 和 `profile` 为空，然后运行 `aws configure`，或提供 `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`。
- **命名 AWS profile**: 将 `profile` 设置为 `~/.aws/config` 或 `~/.aws/credentials` 中的某个 profile。
- **IAM role**: 在 EC2/ECS/Lambda 上，保持 `apiKey` 和 `profile` 为空，并附加一个具有 Bedrock 权限的角色。
- **Bedrock API key**: 设置 `apiKey` 或 `AWS_BEARER_TOKEN_BEDROCK`；`profile` 可以保持 `null`。

**2. 最小配置**

对于非 Anthropic 模型，例如 Amazon Nova：

```json
{
  "providers": {
    "bedrock": {
      "region": "us-east-1"
    }
  },
  "modelPresets": {
    "bedrockNova": {
      "provider": "bedrock",
      "model": "bedrock/amazon.nova-lite-v1:0",
      "reasoningEffort": null
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "bedrockNova"
    }
  }
}
```

使用 Bedrock API key：

```json
{
  "providers": {
    "bedrock": {
      "region": "us-east-1",
      "apiKey": "${AWS_BEARER_TOKEN_BEDROCK}"
    }
  },
  "modelPresets": {
    "bedrockNova": {
      "provider": "bedrock",
      "model": "bedrock/amazon.nova-lite-v1:0",
      "reasoningEffort": null
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "bedrockNova"
    }
  }
}
```

使用命名 AWS profile：

```json
{
  "providers": {
    "bedrock": {
      "region": "us-east-1",
      "profile": "my-bedrock-profile"
    }
  },
  "modelPresets": {
    "bedrockNova": {
      "provider": "bedrock",
      "model": "bedrock/amazon.nova-lite-v1:0"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "bedrockNova"
    }
  }
}
```

**3. Claude Opus 4.7 示例**

```json
{
  "providers": {
    "bedrock": {
      "region": "us-east-1"
    }
  },
  "modelPresets": {
    "bedrockClaude": {
      "provider": "bedrock",
      "model": "bedrock/global.anthropic.claude-opus-4-7",
      "reasoningEffort": "medium",
      "maxTokens": 8192
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "bedrockClaude"
    }
  }
}
```

对于区域路由，请使用 Bedrock 的某个 inference ID，例如 `bedrock/us.anthropic.claude-opus-4-7`、`bedrock/eu.anthropic.claude-opus-4-7` 或 `bedrock/jp.anthropic.claude-opus-4-7`。

Claude Opus 4.7 不接受 `temperature`、`top_p` 或 `top_k`；nanobot 会为该模型自动省略 `temperature`。如果 `reasoningEffort` 设置为 `low`、`medium`、`high`、`max` 或 `adaptive`，nanobot 会发送 Bedrock 的自适应思考参数。

Bedrock 上的 Anthropic 模型还可能需要 Anthropic 用例注册，并受 Anthropic 支持的国家/地区限制。如果 Claude 因不支持的国家或地区而失败并报出 `ValidationException`，请尝试使用非 Anthropic 的 Bedrock 模型，例如 Amazon Nova，以验证提供商设置。

**4. 模型 ID**

在 nanobot 配置中使用带 `bedrock/` 前缀的 Bedrock 模型 ID 或 inference profile ID。nanobot 会在调用 AWS 前移除该前缀。

示例：

- `bedrock/amazon.nova-micro-v1:0`
- `bedrock/amazon.nova-lite-v1:0`
- `bedrock/global.anthropic.claude-opus-4-7`
- `bedrock/us.anthropic.claude-opus-4-7`
- `bedrock/openai.gpt-oss-20b-1:0`
- `bedrock/meta.llama...`
- `bedrock/mistral...`

请在 Bedrock 控制台中查看准确的模型 ID 和区域可用性。某些模型需要跨区域 inference profile ID，例如 `us.*`、`eu.*` 或 `global.*`。

**5. 高级模型字段**

可以使用 `extraBody` 提供模型特定字段；nanobot 会将其合并到 Converse `additionalModelRequestFields` 中：

```json
{
  "providers": {
    "bedrock": {
      "region": "us-east-1",
      "extraBody": {
        "thinking": {
          "type": "adaptive",
          "effort": "medium",
          "display": "summarized"
        }
      }
    }
  }
}
```

仅当你使用自定义 Bedrock Runtime 端点 URL 时才使用 `apiBase`，例如 VPC endpoint 或代理。对于常规 AWS 区域不需要它。

当前范围：nanobot 会传递 `messages`、`system`、`inferenceConfig`、`toolConfig` 和 `additionalModelRequestFields`。Bedrock Prompt Management、Guardrails、`serviceTier` 以及其他顶层 Converse 选项目前还不是一等配置字段。

**6. 快速检查**

```bash
# For AWS credential-chain usage:
aws sts get-caller-identity

# For API-key usage:
export AWS_BEARER_TOKEN_BEDROCK="your-bedrock-api-key"
export AWS_REGION="us-east-1"
```

然后运行：

```bash
nanobot agent -m "Reply with one short sentence."
```

</details>


<details>
<summary><b>OpenAI Codex (OAuth)</b></summary>

Codex 使用 OAuth，而不是 API keys。需要已配置的 ChatGPT Plus 或 Pro 账户。`nanobot provider login` 会将 OAuth 会话存储在配置之外。`providers.openai_codex` 块是可选的，仅在需要代理等提供商特定设置时才需要。

**1. 登录：**
```bash
nanobot provider login openai-codex
```

如果运行 nanobot 的机器无法打开图形浏览器，请将打印出的 URL 复制到真正的浏览器中。对于远程 SSH 登录，先在本地打开该 URL，然后在提示时将最终的 `http://localhost:1455/auth/callback?...` 重定向 URL 粘贴回终端。

**2. 可选代理**（如果 Codex OAuth 或 Codex API 流量必须使用代理，则合并到 `~/.nanobot/config.json` 中）：

```json
{
  "providers": {
    "openai_codex": {
      "proxy": "http://127.0.0.1:7890"
    }
  }
}
```

该代理适用于 Codex OAuth token 刷新、交互式 token 交换以及 Codex Responses API 请求。它不会影响其他提供商；请在每个需要的受支持提供商上分别配置 `proxy`。

**3. 设置模型**（合并到 `~/.nanobot/config.json` 中）：
```json
{
  "modelPresets": {
    "codex": {
      "provider": "openai_codex",
      "model": "gpt-5.1-codex",
      "reasoningEffort": "high"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "codex"
    }
  }
}
```

在预设中使用 `reasoningEffort`，以发送 Codex reasoning effort，例如 `"low"`、`"medium"`、`"high"`，或所选模型支持的其他值。当 `provider` 明确为 `openai_codex` 时，模型名称不需要 `openai-codex/` 前缀。

**4. 聊天：**
```bash
nanobot agent -m "Hello!"

# Target a specific workspace/config locally
nanobot agent -c ~/.nanobot-telegram/config.json -m "Hello!"

# One-off workspace override on top of that config
nanobot agent -c ~/.nanobot-telegram/config.json -w /tmp/nanobot-telegram-test -m "Hello!"
```

> Docker 用户：交互式 OAuth 登录请使用 `docker run -it`。

</details>


<details>
<summary><b>GitHub Copilot (OAuth)</b></summary>

GitHub Copilot 使用 OAuth，而不是 API keys。需要配置一个 [带有方案的 GitHub 账户](https://github.com/features/copilot/plans)。`providers.github_copilot` 块在 `config.json` 中不是必需的；`nanobot provider login` 会将 OAuth 会话存储在配置之外。

对于 GitHub Enterprise / Copilot for Business，请在登录前设置你需要的端点覆盖：
```bash
export NANOBOT_GITHUB_COPILOT_CLIENT_ID="your-enterprise-client-id"
export NANOBOT_GITHUB_DEVICE_CODE_URL="https://ghe.example/login/device/code"
export NANOBOT_GITHUB_ACCESS_TOKEN_URL="https://ghe.example/login/oauth/access_token"
export NANOBOT_GITHUB_USER_URL="https://api.ghe.example/user"
export NANOBOT_COPILOT_TOKEN_URL="https://api.ghe.example/copilot_internal/v2/token"
export NANOBOT_COPILOT_BASE_URL="https://copilot-api.ghe.example"
```

**1. 登录：**
```bash
nanobot provider login github-copilot
```

**2. 设置模型**（合并到 `~/.nanobot/config.json` 中）：
```json
{
  "modelPresets": {
    "copilot": {
      "provider": "github_copilot",
      "model": "github-copilot/gpt-4.1"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "copilot"
    }
  }
}
```

**3. 聊天：**
```bash
nanobot agent -m "Hello!"

# Target a specific workspace/config locally
nanobot agent -c ~/.nanobot-telegram/config.json -m "Hello!"

# One-off workspace override on top of that config
nanobot agent -c ~/.nanobot-telegram/config.json -w /tmp/nanobot-telegram-test -m "Hello!"
```

> Docker 用户：交互式 OAuth 登录请使用 `docker run -it`。

</details>

<details>
<summary><b>OpenCode Zen / Go</b></summary>

OpenCode Zen 和 OpenCode Go 可通过 nanobot 内置的
OpenAI 兼容提供商流程使用。它们共享 `OPENCODE_API_KEY` 环境
变量，但使用独立的提供商键和默认基础 URL：

| Provider | Default API base | Model prefix accepted by nanobot |
|----------|------------------|-----------------------------------|
| `opencode_zen` | `https://opencode.ai/zen/v1` | `opencode/<model-id>` |
| `opencode_go` | `https://opencode.ai/zen/go/v1` | `opencode-go/<model-id>` |

OpenCode Zen：

```json
{
  "providers": {
    "opencodeZen": {
      "apiKey": "${OPENCODE_API_KEY}"
    }
  },
  "modelPresets": {
    "opencodeZen": {
      "provider": "opencode_zen",
      "model": "opencode/deepseek-v4-pro"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "opencodeZen"
    }
  }
}
```

OpenCode Go：

```json
{
  "providers": {
    "opencodeGo": {
      "apiKey": "${OPENCODE_API_KEY}"
    }
  },
  "modelPresets": {
    "opencodeGo": {
      "provider": "opencode_go",
      "model": "opencode-go/deepseek-v4-flash"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "opencodeGo"
    }
  }
}
```

OpenCode 自己的文档列出了跨 `responses`、`messages`、
提供商特定的模型端点，以及 `chat/completions` 的模型。nanobot 的 OpenCode
提供商使用 OpenAI 兼容的 `chat/completions` 路径，因此请选择来自该端点系列的模型 ID。
`opencode/...` 和 `opencode-go/...` 前缀会被接受用于提高配置可读性，并在发送请求前移除。

</details>

<details>
<summary><b>LongCat (OpenAI-compatible)</b></summary>

LongCat 可通过 nanobot 内置的 OpenAI 兼容提供商流程使用。默认 API base 已经指向 `https://api.longcat.chat/openai/v1`，因此通常只需要设置 `apiKey`。

```json
{
  "providers": {
    "longcat": {
      "apiKey": "${LONGCAT_API_KEY}"
    }
  },
  "modelPresets": {
    "longcat": {
      "provider": "longcat",
      "model": "LongCat-2.0-Preview",
      "maxTokens": 8192,
      "contextWindowTokens": 1048576
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "longcat"
    }
  }
}
```

当前 LongCat API 文档列出了 `LongCat-2.0-Preview` 作为受支持模型。较旧的 `LongCat-Flash-*` 模型已于 2026-05-29 被 LongCat 停用。

</details>

<details>
<summary><b>Xiaomi MiMo</b></summary>

当模型名称包含 `mimo` 时，Xiaomi MiMo 模型会被 `xiaomi_mimo` 提供商自动检测到。默认 API base 是 `https://api.xiaomimimo.com/v1`。

> **Token Plan**: 如果你使用 MiMo 的 token plan，请将 `apiBase` 覆盖为专用端点：
>
> ```json
> {
>   "providers": {
>     "xiaomi_mimo": {
>       "apiKey": "${XIAOMIMIMO_API_KEY}",
>       "apiBase": "https://token-plan-sgp.xiaomimimo.com/v1"
>     }
>   },
>   "modelPresets": {
>     "mimo": {
>       "provider": "xiaomi_mimo",
>       "model": "xiaomi/mimo-v2.5-pro"
>     }
>   },
>   "agents": {
>     "defaults": {
>       "modelPreset": "mimo"
>     }
>   }
> }
> ```
>
> 使用 MiMo token plan 控制台中的模型 ID 和 API key，并在 MiMo 平台上查看最新支持的模型名称。

</details>

<details>
<summary><b>StepFun Step Plan (subscription)</b></summary>

Step Plan 是 StepFun 面向高频 AI 开发者的订阅制服务。如果你使用 Step Plan 订阅，请在现有的 `stepfun` 提供商配置中覆盖 `apiBase`，使其指向专用的 Step Plan 端点。

```json
{
  "providers": {
    "stepfun": {
      "apiKey": "${STEPFUN_API_KEY}",
      "apiBase": "https://api.stepfun.ai/step_plan/v1"
    }
  },
  "modelPresets": {
    "stepfun": {
      "provider": "stepfun",
      "model": "step-3.5-flash"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "stepfun"
    }
  }
}
```

受支持的模型包括 `step-3.5-flash`、`step-3.5-flash-2603` 和 `step-router-v1`。

</details>

<details>
<summary><b>Ant Ling (OpenAI-compatible)</b></summary>

Ant Ling 可通过 nanobot 内置的 OpenAI 兼容提供商流程使用。默认 API base 指向 `https://api.ant-ling.com/v1`，因此通常只需要设置 `apiKey`。

```json
{
  "providers": {
    "antLing": {
      "apiKey": "${ANT_LING_API_KEY}"
    }
  },
  "modelPresets": {
    "antLing": {
      "provider": "ant_ling",
      "model": "Ling-2.6-flash"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "antLing"
    }
  }
}
```

官方 OpenAI 兼容模型名称包括 `Ling-2.6-1T`、`Ling-2.6-flash`、`Ling-2.5-1T`、`Ling-1T`、`Ring-2.5-1T` 和 `Ring-1T`。

</details>

<details>
<summary><b>自定义提供商（任何 OpenAI 兼容 API）</b></summary>
直接连接到任何 OpenAI 兼容端点——llama.cpp、Together AI、Fireworks、Azure OpenAI，或任何自托管服务器。模型名称会原样传递。

```json
{
  "providers": {
    "custom": {
      "apiKey": "your-api-key",
      "apiBase": "https://api.your-provider.com/v1"
    }
  },
  "modelPresets": {
    "custom": {
      "provider": "custom",
      "model": "your-model-name"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "custom"
    }
  }
}
```

> 对于不需要身份验证的本地服务器，将 `apiKey` 设置为 `null`。
>
> `custom` 是针对提供 OpenAI 兼容 **chat completions** API 的提供商的正确选择。它不会强制将第三方端点改用 OpenAI/Azure **Responses API**。
>
> 如果你的代理或网关明确与 Responses API 兼容，请配置 `azure_openai` 提供商形态，并将 `apiBase` 指向该端点：
>
> ```json
> {
>   "providers": {
>     "azure_openai": {
>       "apiKey": "your-api-key",
>       "apiBase": "https://api.your-provider.com",
>       "defaultModel": "your-model-name"
>     }
>   },
>   "modelPresets": {
>     "responsesProxy": {
>       "provider": "azure_openai",
>       "model": "your-model-name"
>     }
>   },
>   "agents": {
>     "defaults": {
>       "modelPreset": "responsesProxy"
>     }
>   }
> }
> ```
>
> Anthropic 兼容端点是单独的：使用 `providers.anthropic.apiBase`，并将预设提供商设置为 `anthropic`。任意自定义提供商名称不使用 Anthropic Messages API 格式。
>
> 简而言之：**chat-completions 兼容端点 → `custom` 或一个命名的自定义提供商**；**Responses 兼容端点 → `azure_openai`**；**Anthropic 兼容端点 → `anthropic` 并使用 `apiBase`**。

一些 OpenAI 兼容网关会暴露请求体扩展，例如 vLLM guided decoding 或本地采样控制。将它们放在 `extraBody` 下；nanobot 会在其提供商默认值之后，将它们合并到 chat-completions 请求体中：

```json
{
  "providers": {
    "custom": {
      "apiKey": "your-api-key",
      "apiBase": "https://api.your-provider.com/v1",
      "extraBody": {
        "repetition_penalty": 1.15,
        "chat_template_kwargs": {
          "enable_thinking": false
        }
      }
    }
  }
}
```

如果自定义的 OpenAI 兼容端点暴露了提供商特定的 thinking 开关，请设置 `thinkingStyle`，以便 nanobot 可以将 `reasoningEffort` 转换为正确的请求体。支持的样式有 `thinking_type` (`{"thinking":{"type":"enabled"}}`)、`enable_thinking` (`{"enable_thinking": true}`) 和 `reasoning_split` (`{"reasoning_split": true}`)：

```json
{
  "providers": {
    "companyProxy": {
      "apiKey": "${COMPANY_PROXY_API_KEY}",
      "apiBase": "https://api.your-provider.com/v1",
      "thinkingStyle": "enable_thinking"
    }
  },
  "modelPresets": {
    "company": {
      "provider": "companyProxy",
      "model": "served-model-name",
      "reasoningEffort": "high"
    }
  }
}
```

除非该端点明确记录了上述某种 wire format，否则请保持 `thinkingStyle` 未设置。`extraBody` 仍然会最后应用，因此高级用户可以覆盖生成的值。

</details>

<a id="local-providers"></a>
<a id="ollama-local"></a>
<details>
<summary><b>Ollama（本地）</b></summary>

使用 Ollama 运行本地模型，然后添加到配置中：

**1. 启动 Ollama**（示例）：
```bash
ollama run llama3.2
```

**2. 添加到配置**（部分 — 合并到 `~/.nanobot/config.json`）：
```json
{
  "providers": {
    "ollama": {
      "apiBase": "http://localhost:11434"
    }
  },
  "modelPresets": {
    "ollama": {
      "provider": "ollama",
      "model": "llama3.2"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "ollama"
    }
  }
}
```

> 即使配置了 `providers.ollama.apiBase`，`provider: "auto"` 也同样可用，但在预设中固定 `"provider": "ollama"` 是最清晰的选择。

</details>

<details>
<summary><b>LM Studio（本地）</b></summary>

[LM Studio](https://lmstudio.ai/) 提供一个本地 OpenAI 兼容服务器，用于运行 LLM。通过 LM Studio UI 下载模型，然后启动本地服务器。

**1. 启动 LM Studio 服务器：**
- 启动 LM Studio
- 转到 "Local Server" 选项卡
- 加载一个模型（例如，Llama、Mistral、Qwen）
- 点击 "Start Server"（默认端口：1234）

**2. 添加到配置**（部分 — 合并到 `~/.nanobot/config.json`）：
```json
{
  "providers": {
    "lm_studio": {
      "apiKey": null,
      "apiBase": "http://localhost:1234/v1"
    }
  },
  "modelPresets": {
    "lmStudio": {
      "provider": "lm_studio",
      "model": "local-model"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "lmStudio"
    }
  }
}
```

> **注意：** 由于 LM Studio 运行在本地且不需要身份验证，请将 `apiKey` 设置为 `null`。模型名称应与 LM Studio UI 中显示的内容一致。即使配置了 `providers.lm_studio.apiBase`，`provider: "auto"` 也同样可用，但在预设中固定 `"provider": "lm_studio"` 是最清晰的选择。

</details>

<a id="atomic-chat-local"></a>
<details>
<summary><b>Atomic Chat（本地）</b></summary>

[Atomic Chat](https://atomic.chat/) 是一款本地优先的桌面应用，提供一个 **OpenAI 兼容** 的 HTTP API（默认 `http://localhost:1337/v1`）。当你想在自己的机器上运行 nanobot，而不是使用托管 API 提供商时，可以使用此设置。

**1. 启动 Atomic Chat**

- 在你的机器上安装 [Atomic Chat](https://atomic.chat/)。
- 打开 Atomic Chat，下载一个模型，并保持应用运行。本地 API 默认已启用。
- 复制本地 API 暴露的模型 ID。例如，`Qwen 3 32B` 的模型 ID 可能是 `qwen3-32b`。

**2. 添加到配置**（部分 — 合并到 `~/.nanobot/config.json`）：

```json
{
  "providers": {
    "atomic_chat": {
      "apiKey": null,
      "apiBase": "http://localhost:1337/v1"
    }
  },
  "modelPresets": {
    "atomic": {
      "provider": "atomic_chat",
      "model": "qwen3-32b"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "atomic"
    }
  }
}
```

> **注意：** 将 `qwen3-32b` 替换为来自 Atomic Chat 的模型 ID。如果你的 Atomic Chat 服务器不需要密钥，请将 `apiKey` 设置为 `null`。如果需要，请将 `apiKey`（或 `ATOMIC_CHAT_API_KEY` 环境变量）设置为 Atomic Chat 期望的值。

> 即使配置了 `providers.atomic_chat.apiBase`，`provider: "auto"` 也同样可用，但在预设中固定 `"provider": "atomic_chat"` 是最清晰的选择。

</details>

<details>
<summary><b>OpenVINO Model Server（本地 / OpenAI 兼容）</b></summary>

使用 [OpenVINO Model Server](https://docs.openvino.ai/2026/model-server/ovms_docs_llm_quickstart.html) 在 Intel GPU 上本地运行 LLM。OVMS 在 `/v3` 提供 OpenAI 兼容 API。

> 需要 Docker 和具有驱动访问权限的 Intel GPU（`/dev/dri`）。

**1. 拉取模型**（示例）：

```bash
mkdir -p ov/models && cd ov

docker run -d \
  --rm \
  --user $(id -u):$(id -g) \
  -v $(pwd)/models:/models \
  openvino/model_server:latest-gpu \
  --pull \
  --model_name openai/gpt-oss-20b \
  --model_repository_path /models \
  --source_model OpenVINO/gpt-oss-20b-int4-ov \
  --task text_generation \
  --tool_parser gptoss \
  --reasoning_parser gptoss \
  --enable_prefix_caching true \
  --target_device GPU
```

> 这会下载模型权重。请等待容器完成后再继续。

**2. 启动服务器**（示例）：

```bash
docker run -d \
  --rm \
  --name ovms \
  --user $(id -u):$(id -g) \
  -p 8000:8000 \
  -v $(pwd)/models:/models \
  --device /dev/dri \
  --group-add=$(stat -c "%g" /dev/dri/render* | head -n 1) \
  openvino/model_server:latest-gpu \
  --rest_port 8000 \
  --model_name openai/gpt-oss-20b \
  --model_repository_path /models \
  --source_model OpenVINO/gpt-oss-20b-int4-ov \
  --task text_generation \
  --tool_parser gptoss \
  --reasoning_parser gptoss \
  --enable_prefix_caching true \
  --target_device GPU
```

**3. 添加到配置**（部分 — 合并到 `~/.nanobot/config.json`）：

```json
{
  "providers": {
    "ovms": {
      "apiBase": "http://localhost:8000/v3"
    }
  },
  "modelPresets": {
    "ovms": {
      "provider": "ovms",
      "model": "openai/gpt-oss-20b"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "ovms"
    }
  }
}
```

> OVMS 是本地服务器——不需要 API key。支持 tool calling（`--tool_parser gptoss`）、reasoning（`--reasoning_parser gptoss`）和流式输出。更多详情请参见 [官方 OVMS 文档](https://docs.openvino.ai/2026/model-server/ovms_docs_llm_quickstart.html)。
</details>

<a id="vllm-local-openai-compatible"></a>
<details>
<summary><b>vLLM（本地 / OpenAI 兼容）</b></summary>

使用 vLLM 或任何 OpenAI 兼容服务器运行你自己的模型，然后添加到配置中：

**1. 启动服务器**（示例）：
```bash
vllm serve meta-llama/Llama-3.1-8B-Instruct --port 8000
```

**2. 添加到配置**（部分 — 合并到 `~/.nanobot/config.json`）：

*提供商（本地服务器将 API key 设为 null）：*
```json
{
  "providers": {
    "vllm": {
      "apiKey": null,
      "apiBase": "http://localhost:8000/v1"
    }
  }
}
```

*模型预设：*
```json
{
  "modelPresets": {
    "vllm": {
      "provider": "vllm",
      "model": "meta-llama/Llama-3.1-8B-Instruct"
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "vllm"
    }
  }
}
```

</details>

关于添加新提供商的贡献者说明位于 [`development.md`](./development.md#adding-an-llm-provider)。

## 模型预设

模型预设允许你为完整的模型配置命名，并在运行时用 `/model <preset>` 切换它。它们是配置模型的推荐方式，因为同样的名称可以用于启动时选择、聊天命令切换以及回退链。

现有配置无需更改。直接的 `agents.defaults.model`、`provider`、`maxTokens`、`contextWindowTokens`、`temperature` 和 `reasoningEffort` 字段仍然定义隐式的 `default` 预设。对于新配置，优先使用顶层 `modelPresets` 加 `agents.defaults.modelPreset`。

```json
{
  "modelPresets": {
    "fast": {
      "provider": "openrouter",
      "model": "anthropic/claude-sonnet-4.5",
      "maxTokens": 4096,
      "contextWindowTokens": 65536
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "fast",
      "fallbackModels": ["deep", "localSmall"]
    }
  },
  "modelPresets": {
    "fast": {
      "label": "Fast",
      "model": "gpt-4.1-mini",
      "provider": "openai",
      "maxTokens": 4096,
      "contextWindowTokens": 128000,
      "temperature": 0.2,
      "reasoningEffort": "low"
    },
    "deep": {
      "label": "Deep",
      "model": "claude-opus-4-5",
      "provider": "anthropic",
      "maxTokens": 8192,
      "contextWindowTokens": 200000,
      "reasoningEffort": "high"
    },
    "localSmall": {
      "label": "Local Small",
      "model": "llama3.2",
      "provider": "ollama",
      "maxTokens": 4096,
      "contextWindowTokens": 32768,
      "temperature": 0.2
    }
  }
}
```

`modelPresets` 是一个顶层对象。其下的键（`fast`、`deep`、`coding` 等）是用户定义的预设名称。每个预设支持：

| 字段 | 描述 |
|-------|-------------|
| `label` | 可选的显示名称，显示在模型列表中。 |
| `model` | 此预设要使用的模型名称。 |
| `provider` | 提供商名称，或 `"auto"` 以使用提供商自动检测。 |
| `maxTokens` | 最大 completion/output token 数。 |
| `contextWindowTokens` | 用于提示词构建和整合决策的上下文窗口大小。 |
| `temperature` | 采样 temperature。 |
| `reasoningEffort` | 可选的 reasoning/thinking 设置。提供商支持情况各不相同。 |

`default` 是保留项，始终表示由直接 `agents.defaults.*` 字段构建的隐式预设；不要定义 `modelPresets.default`。使用 `/model default` 可以在现有配置中切换回这些直接字段。

设置 `agents.defaults.modelPreset` 以选择启动预设。当 `modelPreset` 为 `null` 或省略时，启动时使用来自直接 `agents.defaults.*` 字段的隐式 `default` 预设。使用 `/model <preset>` 做出的运行时更改不会写回 `config.json`；它们会影响后续轮次，直到进程重启或其他模型/配置更改将其替换。

### 模型回退

`agents.defaults.fallbackModels` 定义了活动模型配置的有序故障转移链。主模型仍由 `agents.defaults.modelPreset` 选择，或者在较旧的配置中由直接 `agents.defaults.*` 字段构建的隐式 `default` 预设选择。

每个回退候选项可以是：

- 来自 `modelPresets` 的预设名称，例如 `"deep"`。这是推荐形式。将使用该预设完整的模型、提供商、生成和上下文窗口配置。
- 一个内联回退对象，至少包含 `provider` 和 `model`。可选的 `maxTokens`、`contextWindowTokens` 和 `temperature` 字段在省略时会从活动主配置继承。`reasoningEffort` 不会继承；省略它可让该回退保持不启用 reasoning，或为支持 reasoning 的模型显式设置它。

预设回退链：

```json
{
  "modelPresets": {
    "fast": {
      "model": "gpt-4.1-mini",
      "provider": "openai",
      "maxTokens": 4096,
      "contextWindowTokens": 128000,
      "temperature": 0.2
    },
    "deep": {
      "model": "claude-opus-4-5",
      "provider": "anthropic",
      "maxTokens": 8192,
      "contextWindowTokens": 200000,
      "reasoningEffort": "high"
    },
    "localSmall": {
      "model": "llama3.2",
      "provider": "ollama",
      "maxTokens": 4096,
      "contextWindowTokens": 32768
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "fast",
      "fallbackModels": ["deep", "localSmall"]
    }
  }
}
```

字符串条目是预设名称，而不是原始模型名称。在上面的示例中，`"deep"` 表示 `modelPresets.deep`；nanobot 不会将其解释为提供商模型 ID。更改一个预设会同时更新 `/model <preset>` 切换以及引用它的任何回退链。

内联回退对象：

```json
{
  "modelPresets": {
    "fast": {
      "provider": "openrouter",
      "model": "anthropic/claude-sonnet-4.5",
      "maxTokens": 4096,
      "contextWindowTokens": 65536
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "fast",
      "fallbackModels": [
        {
          "provider": "deepseek",
          "model": "deepseek-v4-pro",
          "maxTokens": 4096,
          "contextWindowTokens": 262144
        }
      ]
    }
  }
}
```

仅当某个回退不值得命名为可复用预设时，才使用内联对象。`fallbackModels` 应放在 `agents.defaults` 下，而不是放在单独的 `modelPresets` 条目中。

故障转移通常在主提供商在任何答案文本被流式输出之前返回可重试的模型/提供商错误时运行。流式停滞超时是恢复的例外：如果提供商已经输出了部分答案文本，然后停滞，nanobot 会关闭当前流段，并在新的流段中重试/故障转移。典型的回退场景包括超时、连接错误、5xx 服务器错误、429 限流、过载以及配额/余额耗尽。对于格式错误的请求、身份验证/权限错误、内容过滤/拒绝，或上下文长度/消息格式错误，则不会运行。

如果回退候选项使用更小的 `contextWindowTokens` 值，nanobot 会使用活动链中最小的窗口来构建上下文，以便每个候选项都能接收到相同的提示词。
## 转录设置

音频转录是一项共享能力，供聊天通道语音消息和 WebUI 麦克风输入使用。聊天通道语音消息会在进入智能体之前自动转录。WebUI 麦克风输入会先转录到编辑框中，因此你可以在发送前编辑文本。

在顶层 `transcription` 部分下配置转录：

```json
{
  "transcription": {
    "enabled": true,
    "provider": "groq",
    "model": null,
    "language": null,
    "maxDurationSec": 120,
    "maxUploadMb": 25
  }
}
```

| 设置 | 默认值 | 描述 |
|---------|---------|-------------|
| `enabled` | `true` | 为聊天通道语音消息和 WebUI 麦克风输入启用音频转录。 |
| `provider` | `"groq"` | 转录后端：`"groq"`、`"openai"`、`"openrouter"`、`"xiaomi_mimo"`、`"stepfun"`，或 `"assemblyai"`。 |
| `model` | provider default | 可选的转录模型覆盖值。Groq 默认为 `whisper-large-v3`，OpenAI 默认为 `whisper-1`，OpenRouter 默认为 `openai/whisper-1`，小米 MiMo ASR 默认为 `mimo-v2.5-asr`，StepFun ASR 默认为 `stepaudio-2.5-asr`，AssemblyAI 默认为 `universal-3-pro,universal-2`。OpenRouter 在其转录端点上只接受语音转文本模型，例如 `nvidia/parakeet-tdt-0.6b-v3`、`openai/whisper-1` 或 `openai/gpt-4o-transcribe`；聊天 LLM 会被拒绝。AssemblyAI 接受以逗号分隔的模型回退列表。 |
| `language` | `null` | 可选的 ISO-639 语言提示，例如 `"en"`、`"zh"`、`"ko"` 或 `"ja"`。 |
| `maxDurationSec` | `120` | WebUI 录音的最大时长。 |
| `maxUploadMb` | `25` | WebUI 音频上传的最大大小。 |

提供商和语言的解析顺序是刻意按以下顺序排列，以保持向后兼容：

1. `transcription.provider` / `transcription.language`
2. 旧版 `channels.transcriptionProvider` / `channels.transcriptionLanguage`
3. 内置默认值（`provider: "groq"`，无语言提示）

旧版 `channels.*` 转录字段在转录成为聊天通道和 WebUI 麦克风输入的共享能力之前就已经存在。它们仍然会被读取，因此旧的 `config.json` 文件可以继续工作，但它们不再是首选的配置入口。如果同时存在旧字段和新字段，则以顶层 `transcription` 值为准。

转录凭据刻意不存放在 `transcription` 中。请将 API key 和可选端点放在对应的提供商配置里：

```json
{
  "providers": {
    "groq": {
      "apiKey": "gsk-...",
      "apiBase": "https://api.groq.com/openai/v1"
    }
  },
  "transcription": {
    "provider": "groq",
    "language": "zh"
  }
}
```

选择转录提供商本身不会配置凭据。例如，为了兼容性，实际提供商可能默认是 Groq，但只有在 `providers.groq.apiKey` 或对应的、由环境变量支持的配置可用时，转录才可使用。Settings UI 只会写入顶层 `transcription` 字段。

如果你要新增一个转录提供商，请参阅 [`development.md`](./development.md#adding-a-transcription-provider)。

## 通道设置

适用于所有通道的全局设置。在 `channels` 部分下的 `~/.nanobot/config.json` 中配置：

```json
{
  "channels": {
    "sendProgress": true,
    "sendToolHints": false,
    "extractDocumentText": true,
    "sendMaxRetries": 3,
    "telegram": {
      "enabled": false
    }
  }
}
```

| 设置 | 默认值 | 描述 |
|---------|---------|-------------|
| `sendProgress` | `true` | 将智能体的文本进度流式发送到通道 |
| `sendToolHints` | `false` | 流式发送工具调用提示（例如 `read_file("…")`） |
| `showReasoning` | `true` | 允许通道展示模型推理/思考内容（DeepSeek-R1 `reasoning_content`、Anthropic `thinking_blocks`、内联 `<think>` 标签）。推理会作为带有 `_reasoning_delta` / `_reasoning_end` 标记的独立流传输——通道会覆盖 `send_reasoning_delta` / `send_reasoning_end` 以渲染原地更新。即使启用 `true`，没有这些覆盖的通道仍会静默保持无操作。目前在 CLI 和 WebSocket/WebUI 中可见（斜体闪烁标题，流结束后自动折叠）；Telegram / Slack / Discord / Feishu / WeChat / Matrix 仍保持基础无操作，直到它们的气泡 UI 被适配。与 `sendProgress` 无关。 |
| `extractDocumentText` | `true` | 将受支持的文档/文本附件提取到模型提示中。设为 `false` 可将文档内容排除在提示之外，并改为包含附件路径引用。 |
| `sendMaxRetries` | `3` | 每条出站消息的最大投递尝试次数，包括初始发送（配置范围 0-10，实际最少 1 次尝试） |

`channels.transcriptionProvider` 和 `channels.transcriptionLanguage` 是已弃用的兼容字段。它们仍作为旧配置的只读回退保留，但新的配置应使用顶层 `transcription.provider` 和 `transcription.language`。

`sendProgress` 和 `sendToolHints` 也可以按通道覆盖。全局值会作为未自行设置值的通道默认值：

```json
{
  "channels": {
    "sendProgress": true,
    "sendToolHints": false,
    "telegram": {
      "enabled": true,
      "sendProgress": false
    },
    "websocket": {
      "enabled": true,
      "sendToolHints": true
    }
  }
}
```

Telegram `richMessages` 默认值为 `false`。仅在你希望启用 Bot API 10.1 `sendRichMessage` 渲染时才开启；对于会对富消息显示“不支持消息”错误的 Telegram Web 客户端，请保持关闭。

### 重试行为

重试故意设计得很简单。

当某个通道的 `send()` 抛出异常时，nanobot 会在通道管理器层重试。默认情况下，`channels.sendMaxRetries` 为 `3`，且该计数包含初始发送。

- **第 1 次尝试**：立即发送
- **第 2 次尝试**：在 `1s` 后重试
- **第 3 次尝试**：在 `2s` 后重试
- **更高的重试预算**：退避将继续按 `1s`、`2s`、`4s` 执行，然后保持上限为 `4s`
- **瞬态故障**：网络波动和临时 API 限制通常会在下一次尝试中恢复
- **永久故障**：无效令牌、已撤销访问权限或被封禁的通道会耗尽重试预算并干净地失败

> [!NOTE]
> 该设计是有意为之：通道实现应在投递失败时抛出异常，而通道管理器负责共享的重试策略。
>
> 某些通道可能仍会在内部对特定 API 做少量重试。例如，Telegram 会在向管理器暴露最终失败之前，单独重试超时和限流错误。
>
> 如果某个通道完全不可达，nanobot 无法通过该通道本身通知用户。请查看日志中的 `Failed to send to {channel} after N attempts` 以发现持续的投递失败。

## Web 工具

nanobot 内置了用于访问 Web 的基础工具。这些工具包括通过 API 搜索，以及以 Markdown 格式获取任意网页。它们默认启用，并且可以在 `~/.nanobot/config.json` 下的 `tools.web` 中配置。

如果你想禁用它们，从发送给 LLM 的工具列表中移除 `web_search` 和 `web_fetch`，请将 `tools.web.enable` 设为 `false`：

```json
{
  "tools": {
    "web": {
      "enable": false
    }
  }
}
```

nanobot 对内置网页抓取和 HTTP/SSE MCP 连接使用共享的 SSRF 防护。默认会阻止回环地址、RFC1918/私有地址段、CGNAT/Tailscale 地址段、链路本地地址以及云元数据端点。如果你需要允许受信任的私有地址段，请使用 `tools.ssrfWhitelist` 显式将它们从 SSRF 阻止中豁免：

```json
{
  "tools": {
    "ssrfWhitelist": ["100.64.0.0/10"]
  }
}
```

请尽量保持白名单条目尽可能窄，例如仅允许单个主机 CIDR（`192.168.1.50/32`）。该白名单对共享 SSRF 防护是全局生效的；它并不局限于某一个工具或某一个 MCP 服务器。

> [!TIP]
> 在 `proxy` 中使用 `tools.web`，即可让所有 Web 请求（搜索 + 抓取）都通过代理：
> ```json
> { "tools": { "web": { "proxy": "http://127.0.0.1:7890" } } }
> ```

### `tools.web`

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `enable` | boolean | `true` | 启用或禁用所有内置 Web 工具（`web_search` + `web_fetch`） |
| `proxy` | string or null | `null` | 所有 Web 请求的代理，例如 `http://127.0.0.1:7890` |
| `userAgent` | string or null | `null` | 所有 Web 请求的 User-Agent 请求头。如果为 null，将使用浏览器的 User-Agent |
### 网络搜索

nanobot 支持多个网页搜索提供商。在 `~/.nanobot/config.json` 下的 `tools.web.search` 中进行配置。

默认情况下，网页搜索使用 `duckduckgo`，无需 API key 即可开箱即用。

| 提供商 | 配置字段 | 环境变量回退 | 免费 |
|----------|--------------|------------------|------|
| `brave` | `apiKey` | `BRAVE_API_KEY` | 否 |
| `tavily` | `apiKey` | `TAVILY_API_KEY` | 否 |
| `jina` | `apiKey` | `JINA_API_KEY` | 免费层级（1000 万 tokens） |
| `kagi` | `apiKey` | `KAGI_API_KEY` | 否 |
| `olostep` | `apiKey` | `OLOSTEP_API_KEY` | 否 |
| `bocha` | `apiKey` | `BOCHA_API_KEY` | 免费层级（初创公司 100 万次调用） |
| `volcengine` | `apiKey` | `VOLCENGINE_SEARCH_API_KEY` 或 `WEB_SEARCH_API_KEY` | 每月配额，之后付费 |
| `keenable` | `apiKey`（可选） | `KEENABLE_API_KEY` | 是（无需 key；使用 key 可提高限制） |
| `searxng` | `baseUrl` | `SEARXNG_BASE_URL` | 是（自托管） |
| `duckduckgo`（默认） | — | — | 是 |

**Brave：**
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "brave",
        "apiKey": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

**Tavily：**
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "tavily",
        "apiKey": "${TAVILY_API_KEY}"
      }
    }
  }
}
```

**Jina**（免费层级，1000 万 tokens）：
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "jina",
        "apiKey": "${JINA_API_KEY}"
      }
    }
  }
}
```

**Kagi：**
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "kagi",
        "apiKey": "${KAGI_API_KEY}"
      }
    }
  }
}
```

**Olostep：**
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "olostep",
        "apiKey": "${OLOSTEP_API_KEY}"
      }
    }
  }
}
```

你也可以将 `OLOSTEP_API_KEY` 设置在环境变量中，而不是存储在配置中。

**Bocha**（面向 AI 优化的搜索，提供免费层级）：
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "bocha",
        "apiKey": "${BOCHA_API_KEY}"
      }
    }
  }
}
```

在 [open.bochaai.com](https://open.bochaai.com) 创建你的 API key。
Bocha 返回为 AI 消费优化的结构化结果，并支持可选摘要。
你也可以将 `BOCHA_API_KEY` 设置在环境变量中，而不是存储在配置中。

**Volcengine Search：**
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "volcengine",
        "apiKey": "${VOLCENGINE_SEARCH_API_KEY}"
      }
    }
  }
}
```

你也可以为与 Volcengine web-search skill 兼容而设置 `WEB_SEARCH_API_KEY`。先在 [Volcengine web search 控制台](https://console.volcengine.com/search-infinity/web-search) 中创建 key，然后从 [API keys](https://console.volcengine.com/search-infinity/api-key) 复制。Volcengine Ark keys 是单独的，不适用于此搜索提供商。

**Keenable**（免费层级下无需 API key 即可使用）：
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "keenable"
      }
    }
  }
}
```

Keenable search 可通过其无 token 的公共端点开箱即用，无需账户（免费层级，每小时限 1,000 次请求）。从 [keenable.ai](https://keenable.ai) 设置 `apiKey`（或 `KEENABLE_API_KEY`）可移除每小时限制。

**SearXNG**（自托管，无需 API key）：
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "searxng",
        "baseUrl": "https://searx.example"
      }
    }
  }
}
```

**DuckDuckGo**（零配置）：
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "duckduckgo"
      }
    }
  }
}
```

#### `tools.web.search`

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `provider` | string | `"duckduckgo"` | 搜索后端：`brave`、`tavily`、`jina`、`kagi`、`olostep`、`bocha`、`volcengine`、`keenable`、`searxng`、`duckduckgo` |
| `apiKey` | string | `""` | 基于 API 的搜索提供商的 API key |
| `baseUrl` | string | `""` | SearXNG 的基础 URL |
| `maxResults` | integer | `5` | 每次搜索的结果数（1–10） |

### 网页获取

> [!TIP]
> 如果你在 JS proof-of-work 或 Cloudflare 验证码方面遇到问题，请设置随机 user agent 并禁用 Jina Reader：
> ```json
> { "tools": { "web": { "userAgent": "Not-A-Browser", "fetch": { "useJinaReader": false } } } }
> ```

nanobot 默认使用 [Jina Reader](https://jina.ai/reader/) 这一第三方 API，将任意页面转换为 Markdown 格式，便于 LLM 消化；如果前者失败，则使用基于 [readability-lxml](https://github.com/buriy/python-readability) 的本地回退。

如果你想始终使用本地转换，可以强制使用：

```json
{
  "tools": {
    "web": {
      "fetch": {
        "useJinaReader": false
      }
    }
  }
}
```

#### `tools.web.fetch`

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `useJinaReader` | boolean | `true` | 若为 true，则优先使用 Jina Reader 而不是本地转换 |

## 图像生成

图像生成功能在 `tools.imageGeneration` 下配置，并使用所选提供商的 `providers.<name>` 块中的凭据。

有关 WebUI 用法、提供商示例、artifact 存储和故障排除，请参见 [图像生成](./image-generation.md)。

## MCP（模型上下文协议）

> [!TIP]
> 配置格式与 Claude Desktop / Cursor 兼容。你可以直接从任何 MCP server 的 README 中复制 MCP server 配置。

nanobot 支持 [MCP](https://modelcontextprotocol.io/)——连接外部工具服务器并将其作为原生智能体工具使用。

将 MCP servers 添加到你的 `config.json`：

```json
{
  "tools": {
    "mcpServers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
      },
      "my-remote-mcp": {
        "url": "https://example.com/mcp/",
        "headers": {
          "Authorization": "Bearer xxxxx"
        }
      }
    }
  }
}
```

支持两种传输模式：

| 模式 | 配置 | 示例 |
|------|--------|---------|
| **Stdio** | `command` + `args` | 通过 `npx` / `uvx` 运行的本地进程 |
| **HTTP** | `url` + `headers`（可选） | 远程端点（`https://mcp.example.com/sse`） |

> [!IMPORTANT]
> HTTP/SSE MCP URLs 会在探测或连接前进行验证，并且每个发出的 MCP HTTP 请求在跟随重定向前都会再次验证。`localhost`、`127.0.0.1`、RFC1918/私有 IP、CGNAT/Tailscale 网段、链路本地地址以及云元数据端点默认都会被阻止。这可能会破坏此前可用的本地或私有 HTTP MCP 配置，直到通过 `tools.ssrfWhitelist` 显式允许该端点为止，最好使用单主机 CIDR，例如 `127.0.0.1/32`、`::1/128` 或 `192.168.1.50/32`。Stdio MCP servers 不受影响。

对慢速服务器，可使用 `toolTimeout` 覆盖默认的每次调用 30 秒超时：

```json
{
  "tools": {
    "mcpServers": {
      "my-slow-server": {
        "url": "https://example.com/mcp/",
        "toolTimeout": 120
      }
    }
  }
}
```

使用 `enabledTools` 仅注册 MCP server 中的一部分工具：

```json
{
  "tools": {
    "mcpServers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"],
        "enabledTools": ["read_file", "mcp_filesystem_write_file"]
      }
    }
  }
}
```

`enabledTools` 可以接受原始 MCP 工具名（例如 `read_file`）或封装后的 nanobot 工具名（例如 `mcp_filesystem_write_file`）。

- 省略 `enabledTools`，或将其设为 `["*"]`，以注册全部能力（工具、资源和 prompts）。
- 将 `enabledTools` 设为 `[]`，则不会从该 server 注册任何工具。资源和 prompts 也会被跳过，因为它们没有按名称过滤。
- 将 `enabledTools` 设为非空名称列表，则仅注册这些工具——资源和 prompts 不会被注册。

MCP 工具会在启动时自动发现并注册。LLM 可以将它们与内置工具一起使用——无需额外配置。




## 安全

> [!TIP]
> 对于生产部署，请在配置中同时设置 `"restrictToWorkspace": true` 和 `"tools.exec.sandbox": "bwrap"`。`restrictToWorkspace` 为 nanobot 提供应用层 workspace 保护；`tools.exec.sandbox` 为 shell 命令提供进程级隔离。

有关 API keys、tokens 和其他密钥，请参见 [Environment Variables for Secrets](#environment-variables-for-secrets)——避免直接将它们存储在 `config.json` 中。

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
| `tools.restrictToWorkspace` | `false` | 当 `true` 时，为感知 workspace 的工具启用 nanobot 的应用层 workspace 保护。文件工具会在当前 workspace 下解析路径；可将选定的内部根目录添加为只读或显式启用写入的根目录，并且媒体上传默认只读。Shell 执行会拒绝 workspace 外的 `working_dir` 值并尽力执行命令路径检查，但这不是 OS sandbox。 |
| `tools.exec.sandbox` | `""` | Shell 命令的 sandbox 后端。设为 `"bwrap"` 可将 exec 调用包装在 [bubblewrap](https://github.com/containers/bubblewrap) sandbox 中——进程只能看到 workspace（读写）和媒体目录（只读）；配置文件和 API keys 会被隐藏。会自动为文件工具启用 workspace 限制。**仅限 Linux**——需要已安装 `bwrap`（`apt install bubblewrap`；Docker 镜像中已预装）。macOS 或 Windows 不可用（bwrap 依赖 Linux kernel namespaces）。 |
| `tools.exec.enable` | `true` | 当 `false` 时，shell `exec` 工具根本不会注册。可用它来完全禁用 shell 命令执行。 |
| `tools.exec.timeout` | `60` | shell 命令的默认硬超时时间（秒）。配置值可以超过单次调用工具上限；将 `0` 设为可绕过硬超时，适用于受信任的长时间运行命令。 |
| `tools.exec.pathPrepend` | `""` | 运行 shell 命令时，要预先加入到 `PATH` 的额外目录。用于配置好的工具应优先于可执行文件查找顺序的场景，例如 Python virtual environment 的 `bin` 或 `Scripts` 目录。 |
| `tools.exec.pathAppend` | `""` | 运行 shell 命令时，要追加到 `PATH` 的额外目录（例如用于 `/usr/sbin` 的 `ufw`）。 |
| `tools.ssrfWhitelist` | `[]` | 从 web fetch 和 HTTP/SSE MCP 连接所使用的共享 SSRF 保护中豁免的 CIDR 范围。优先使用精确的主机 CIDR，例如 `192.168.1.50/32`；范围过大会增加 SSRF 暴露风险。 |
| `channels.*.allowFrom` | 省略 | 每个 channel 的访问控制。省略则使用仅 pairing 模式；设置 `["*"]` 可允许所有人；或列出特定 user IDs。详情参见 [Pairing](#pairing)。 |

**Docker 安全性**：官方 Docker 镜像以非 root 用户（`nanobot`，UID 1000）运行，并预装 bubblewrap。使用 `docker-compose.yml` 时，container 会放弃除 `SYS_ADMIN` 之外的所有 Linux capabilities（这是 bwrap 的 namespace 隔离所必需的）。


## 配对

配对允许用户通过简单的代码交换获得对 bot 的访问权限——无需编辑配置。这既适用于新用户，也适用于从新 channel 连接的现有用户（例如，已在 Telegram 上获批的人现在正在设置 Discord）。

### 工作原理

1. 用户在任意尚未获批的 channel（Telegram、Discord、Slack 等）上向 bot 发送 DM。
2. bot 回复一个配对代码（如 `ABCD-EFGH`），并告诉他们把它转发给你。
3. 你批准该代码：

```text
/pairing approve ABCD-EFGH
```

4. 之后用户就可以正常与 bot 聊天了。

配对仅适用于 **DMs**——群聊中未获批的用户会被静默忽略。
### 仅配对模式

默认情况下，如果你没有设置 `allowFrom`，任何尚未通过批准的人在私信机器人时都会收到一个配对码。这意味着你可以完全跳过 `allowFrom`，并通过配对来管理所有访问：

```json
{
  "channels": {
    "telegram": {
      "enabled": true
    }
  }
}
```

如果你更希望不经批准就允许所有人访问：

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "allowFrom": ["*"]
    }
  }
}
```

### 管理访问

| 命令 | 作用 |
|---------|-------------|
| `/pairing` | 显示所有待处理的配对请求 |
| `/pairing approve <code>` | 批准一个请求 — 发送者现在可以聊天 |
| `/pairing deny <code>` | 拒绝一个待处理请求 |
| `/pairing revoke <user_id>` | 将先前已批准的用户从当前通道移除 |
| `/pairing revoke <channel> <user_id>` | 从特定通道移除一个用户 |

你可以在 `/pairing list` 的输出中找到用户 ID。

从终端：

```bash
nanobot agent -m "/pairing list"
nanobot agent -m "/pairing approve ABCD-EFGH"
```


## 网关心跳

网关可以运行一个受保护的心跳 cron 作业，周期性检查活动工作区中的 `HEARTBEAT.md`。当你运行 `nanobot gateway` 时，默认会启用此功能。

```json
{
  "gateway": {
    "heartbeat": {
      "enabled": true,
      "intervalS": 1800,
      "keepRecentMessages": 8
    }
  }
}
```

如果 `HEARTBEAT.md` 在 `## Active Tasks` 下有任务，智能体会执行它们，并且只将有用/可操作的结果发送到最近活跃的聊天目标。如果该文件没有活动任务，或者结果只是例行内容、没有什么有用信息可报告，则会静默跳过心跳。

这与用户创建的 cron 作业是刻意不同的。使用 `cron` 工具创建的 cron 作业，会作为其原始聊天/会话中的一个计划轮次运行，通常会把结果返回到该通道。对于不应在每次运行时都通知用户的循环后台检查，请使用 `HEARTBEAT.md`。

心跳作业由与用户创建的提醒相同的 cron 服务提供支持。它存储在活动工作区（`<workspace>/cron/jobs.json`）下，并会以 `cron(action="list")` 的形式显示在 `heartbeat` 中，但它由系统管理，不能使用 `cron` 工具移除。如果你不想要周期性的心跳检查，请通过配置禁用它并重启网关。

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
| `gateway.heartbeat.enabled` | `true` | 在网关启动时注册内置心跳 cron 作业。 |
| `gateway.heartbeat.intervalS` | `1800` | 心跳检查之间的秒数。 |
| `gateway.heartbeat.keepRecentMessages` | `8` | 每次运行后保留的最近心跳会话消息数量。 |
| `gateway.restartMode` | `auto` | `/restart` 的重启策略：`auto` 在 Windows 前台运行时使用 `spawn`，其他情况下使用 `exec`。对于 WinSW 或 nssm 等 Windows 服务包装器，请使用 `exit`，以便由服务管理器接管重启。 |


## 子智能体并发

默认情况下，nanobot 一次只允许一个已派生的子智能体运行。当达到上限时，`spawn` 工具会返回错误，以便智能体决定等待或重新安排工作。这可以保护本地 LLM 服务器免于同时加载多个 KV cache。如果你的提供商能够处理更多并行工作，可以提高该限制：

```json
{
  "agents": {
    "defaults": {
      "maxConcurrentSubagents": 2
    }
  }
}
```

当子智能体的某个工具返回执行错误时，子智能体也会立即停止。这个默认行为可让父智能体清楚看到失败。如果你的子智能体工作流使用的工具可能会出现临时性失败，并且应该由模型重试或绕过，请禁用硬停止行为：

```json
{
  "agents": {
    "defaults": {
      "failOnToolError": false
    }
  }
}
```

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
| `agents.defaults.maxConcurrentSubagents` | `1` | 同时运行的已派生子智能体最大数量。尝试派生超过此限制会返回错误。 |
| `agents.defaults.failOnToolError` | `true` | 当工具执行失败时停止已派生的子智能体。将其设为 `false` 可将工具错误返回给子智能体模型，使其能够在同一次运行中恢复。 |


## 自动压缩

当用户空闲时间超过配置阈值时，nanobot 会**主动**将会话上下文中较早的部分压缩成摘要，同时保留最近的一段合法活跃消息后缀。这样可以降低 token 成本，并在用户返回时减少首 token 延迟——模型接收的是压缩后的摘要、最近的活跃上下文以及新的输入，而不是重新处理一段过长且过时、KV cache 也已失效的上下文。

```json
{
  "agents": {
    "defaults": {
      "idleCompactAfterMinutes": 15
    }
  }
}
```

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
| `agents.defaults.idleCompactAfterMinutes` | `15` | 自动压缩开始前的空闲分钟数。设为 `0` 可禁用。默认值接近典型 LLM KV cache 过期窗口，因此过时会话会在用户返回前被压缩。 |

`sessionTtlMinutes` 仍然作为向后兼容的旧别名被接受，但未来更推荐使用 `idleCompactAfterMinutes` 作为配置键。

其工作方式如下：
1. **空闲检测**：在每次空闲 tick（约 1 秒）时，检查所有会话是否过期。
2. **后台压缩**：空闲会话通过 LLM 总结较早的活跃前缀，并保留最近的合法后缀（当前为 8 条消息）。
3. **摘要注入**：当用户返回时，摘要会作为运行时上下文注入（一次性，不持久化），并与保留的最近后缀一起使用。
4. **重启安全恢复**：摘要也会镜像到会话元数据中，因此在进程重启后仍可恢复。

> [!NOTE]
> 心智模型："总结较早上下文，保留最新的活跃轮次，**并用压缩后的形式覆盖会话文件。**" 这不是完整的 `session.clear()`，但它确实会写入——不是软游标移动。
>
> 具体来说，自动压缩会原地重写 `sessions/<key>.jsonl`：较早的消息（包括其结构化 `tool_calls` / `tool_call_id` / `reasoning_content`）会被仅保留的最近后缀替换（当前为 8 条消息），而归档前缀只会以纯文本摘要的形式追加到 `memory/history.jsonl`（如果 LLM 摘要失败，则追加为 `[RAW] ...` 展平转储）。这些轮次原始的结构化 JSON 将不再能从会话文件中恢复。
>
> 这不同于当提示超过上下文预算时触发的**基于 token 的软整合**：那条路径只会推进一个内部 `last_consolidated` 游标，并且不会修改会话文件，因此原始的工具调用轨迹仍保留在磁盘上，之后仍可回放或审计。如果你在调试或审计时依赖这条轨迹，请将 `idleCompactAfterMinutes` 设为 `0`，并让仅基于 token 的路径运行。

## 时区

时间就是上下文。上下文应当精确。

默认情况下，nanobot 使用 `UTC` 作为运行时的时间上下文。如果你希望智能体以你的本地时间思考，请将 `agents.defaults.timezone` 设置为有效的 [IANA 时区名称](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)：

```json
{
  "agents": {
    "defaults": {
      "timezone": "Asia/Shanghai"
    }
  }
}
```

这会影响显示给模型的运行时时间字符串，例如运行时上下文。它也会在 cron 表达式省略 `tz` 时，成为 cron 调度的默认时区；以及在 ISO datetime 没有显式偏移量时，成为一次性 `at` 时间的默认时区。

常见示例：`UTC`、`America/New_York`、`America/Los_Angeles`、`Europe/London`、`Europe/Berlin`、`Asia/Tokyo`、`Asia/Shanghai`、`Asia/Singapore`、`Australia/Sydney`。

> 需要其他时区？请浏览完整的 [IANA 时区数据库](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)。

## 统一会话

默认情况下，每个通道 × chat ID 组合都有自己的会话。如果你在多个通道中使用 nanobot（例如 Telegram + Discord + CLI），并希望它们共享同一段对话，请启用 `unifiedSession`：

```json
{
  "agents": {
    "defaults": {
      "unifiedSession": true
    }
  }
}
```

启用后，所有传入消息——无论它们来自哪个通道——都会路由到同一个共享会话中。从 Telegram 切换到 Discord（或任何其他通道）时，会无缝继续同一段对话。

| 行为 | `false`（默认） | `true` |
|----------|-------------------|--------|
| 会话键 | `channel:chat_id` | `unified:default` |
| 跨通道连续性 | 否 | 是 |
| `/new` 清除 | 当前通道会话 | 共享会话 |
| `/stop` 查找任务 | 按通道会话 | 按共享会话 |
| 现有 `session_key_override`（例如 Telegram 线程） | 会保留 | 仍会保留 — 不会被覆盖 |

> 这是为单用户、多设备场景设计的。它默认是**关闭**的——现有用户不会看到任何行为变化。

## 已禁用的技能

nanobot 自带内置技能，你的工作区也可以在 `skills/` 下定义自定义技能。如果你想对智能体隐藏特定技能，请将 `agents.defaults.disabledSkills` 设置为技能目录名列表：

```json
{
  "agents": {
    "defaults": {
      "disabledSkills": ["github", "weather"]
    }
  }
}
```

已禁用的技能会从主智能体的技能摘要、始终启用的技能注入，以及子智能体的技能摘要中排除。当某些捆绑技能对你的部署并不必要，或者不应暴露给最终用户时，这很有用。

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
| `agents.defaults.disabledSkills` | `[]` | 要从加载中排除的技能目录名列表。适用于内置技能和工作区技能。 |

## 工具提示最大长度

工具提示是智能体调用工具时显示的简短进度消息（例如 `$ cd …/project && npm test`）。默认情况下，这些内容会被截断为 40 个字符，这会让长命令变得难以阅读。

设置 `agents.defaults.toolHintMaxLength` 来控制截断阈值：

```json
{
  "agents": {
    "defaults": {
      "toolHintMaxLength": 120
    }
  }
}
```

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
| `agents.defaults.toolHintMaxLength` | `40` | 工具提示显示的最大字符数。范围：20–500。更高的值会显示更多命令或路径；更低的值会让提示更紧凑。 |
