<!-- 本文件由 docs/provider-cookbook.md 翻译生成；原文仍保留在上级目录。 -->

# 提供商食谱

本页适用于你已经知道要连接什么、并且需要一份可直接粘贴的设置的情况。每个配方都会展示要设置什么、要运行什么，以及常见故障通常意味着什么。

如果这是你第一次安装，而且终端命令对你来说还是新东西，请先阅读 [`start-without-technical-background.md`](./start-without-technical-background.md)。如果你想要按字段逐项解释，请先阅读 [`providers.md`](./providers.md)，然后再阅读 [`configuration.md#providers`](./configuration.md#providers)。

下面的大多数示例都是要合并到 `~/.nanobot/config.json` 中的片段。保留你仍然需要的任何现有部分，并且只在你自己的机器上把 `${OPENROUTER_API_KEY}` 之类的占位键替换为环境变量引用或真实值。

这些配方只是示例，不是排名。请选择与你已经打算使用的凭据、端点和模型 ID 相匹配的配方。

## 选择一个配方

将配方与你已有的凭据或端点相匹配：

| 你已有的内容 | 配方 | 必须匹配 |
|---|---|---|
| 一个网关密钥，以及包含模型家族路径的模型 ID，例如 `provider/model-name` | [OpenRouter 网关](#recipe-openrouter-gateway) | API key、provider 配置键、预设提供商，以及网关模型 ID |
| 一个 OpenCode Zen 或 Go 密钥 | [OpenCode Zen 或 Go](#recipe-opencode-zen-or-go) | `OPENCODE_API_KEY`、Zen/Go 提供商键，以及来自匹配的 OpenCode 端点的模型 ID |
| 一个 OpenAI 平台 API key 和 OpenAI 模型 ID | [OpenAI 直连](#recipe-openai-direct) | `OPENAI_API_KEY`、`provider: "openai"`，以及该账户可用的 OpenAI 模型 |
| 一个 Anthropic API key 和 Anthropic 模型 ID | [Anthropic 直连](#recipe-anthropic-direct) | `ANTHROPIC_API_KEY`、`provider: "anthropic"`，以及一个非网关模型 ID |
| 一个 Kimi Coding Plan key | [Kimi Coding Plan](#recipe-kimi-coding-plan) | `KIMI_CODING_API_KEY`、`provider: "kimi_coding"`，以及 `model: "kimi-for-coding"` |
| 一个 OpenAI 兼容的 `/v1` 端点，但不是已命名的 nanobot 提供商 | [自定义 OpenAI 兼容提供商](#recipe-custom-openai-compatible-provider) | `apiBase`、可选 API key，以及该端点提供的模型 ID |
| Ollama 已在本地运行 | [Ollama 本地模型](#recipe-ollama-local-model) | Ollama `apiBase`、已拉取的模型名，以及本地服务器可用性 |
| vLLM、LM Studio 或其他本地 OpenAI 兼容服务器 | [vLLM 或 LM Studio](#recipe-vllm-or-lm-studio) | 本地 `/v1` 基础 URL、任何所需密钥，以及提供的模型名 |
| 一个主模型加一个或多个回退 | [回退预设](#recipe-fallback-presets) | `modelPresets` 中命名的预设，由 `agents.defaults.fallbackModels` 引用 |
| 一个可工作的智能体和一个 Langfuse 项目 | [Langfuse 跟踪](#recipe-langfuse-tracing) | 启动 nanobot 的同一进程环境中的 Langfuse 环境变量 |

## 如何使用配方

1. 安装 nanobot，并运行一次 `nanobot onboard`，这样 `~/.nanobot/config.json` 就会存在。如果你更喜欢提示而不是手动编辑 JSON，可以使用 `nanobot onboard --wizard`。
2. 尽可能把密钥放在环境变量中。
3. 将配方片段合并到 `~/.nanobot/config.json`。
4. 运行 `nanobot status`。
5. 运行 `nanobot agent -m "Hello!"`。
6. 如果 CLI 可用，再连接 WebUI、网关或聊天应用。

活动模型通常应来自 `agents.defaults.modelPreset`，并且该名称应指向 `modelPresets` 中的一个条目。直接设置 `agents.defaults.provider` 和 `agents.defaults.model` 对旧配置仍然有效，但预设更容易切换，也更容易复用为回退。

## 密钥设置

环境变量可以将 API key 排除在配置文件之外。

使用你所选配方中显示的变量名。下面的命令仅以 `OPENROUTER_API_KEY` 为例；OpenAI 直连配方使用 `OPENAI_API_KEY`，Anthropic 直连配方使用 `ANTHROPIC_API_KEY`，而自定义端点可以使用你在 `config.json` 中引用的任何变量名。

**macOS / Linux**

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
nanobot agent -m "Hello!"
```

**Windows PowerShell**

```powershell
$env:OPENROUTER_API_KEY = "sk-or-v1-..."
nanobot agent -m "Hello!"
```

以这种方式设置的环境变量只对当前终端生效。对于 systemd、Docker、LaunchAgent 或远程 shell 等长时间运行的服务，请在启动 nanobot 之前先在该服务的环境中设置这些变量。

## 配方：OpenRouter 网关

当一个 API key 路由到许多托管的模型家族时，适用此配方。

```json
{
  "providers": {
    "openrouter": {
      "apiKey": "${OPENROUTER_API_KEY}"
    }
  },
  "modelPresets": {
    "primary": {
      "label": "Primary",
      "provider": "openrouter",
      "model": "anthropic/claude-sonnet-4.5",
      "maxTokens": 4096,
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

验证：

```bash
nanobot status
nanobot agent -m "Hello!"
```

如果这里失败并显示 `401` 或 `unauthorized`，请检查 `OPENROUTER_API_KEY` 是否在启动 nanobot 的同一个终端或服务中可见。如果失败并显示 `model not found`，请选择 OpenRouter 在你的账户中列出的模型 ID。

## 配方：OpenCode Zen 或 Go

当你的凭据来自 OpenCode Zen 或 OpenCode Go 时，适用此配方。  
这两个提供商都使用 `OPENCODE_API_KEY`；请选择与你想使用的订阅或余额相匹配的提供商块。

OpenCode Zen：

```json
{
  "providers": {
    "opencodeZen": {
      "apiKey": "${OPENCODE_API_KEY}"
    }
  },
  "modelPresets": {
    "primary": {
      "label": "OpenCode Zen",
      "provider": "opencode_zen",
      "model": "opencode/deepseek-v4-pro",
      "maxTokens": 4096,
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

OpenCode Go：

```json
{
  "providers": {
    "opencodeGo": {
      "apiKey": "${OPENCODE_API_KEY}"
    }
  },
  "modelPresets": {
    "primary": {
      "label": "OpenCode Go",
      "provider": "opencode_go",
      "model": "opencode-go/deepseek-v4-flash",
      "maxTokens": 4096,
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

验证：

```bash
nanobot status
nanobot agent -m "Hello!"
```

OpenCode 的文档列出了跨多种端点类型的模型。nanobot 中的 `opencode_zen` 和 `opencode_go` 提供商使用的是 OpenAI 兼容的 `chat/completions` 路径。如果某个模型失败并显示 `model not found` 或端点形状错误，请选择 OpenCode 在匹配的 Zen 或 Go 端点下的 `chat/completions` 中列出的模型。

## 配方：OpenAI 直连

当你拥有 OpenAI API key，并且想直接调用 OpenAI 而不是通过网关时，适用此配方。

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    }
  },
  "modelPresets": {
    "primary": {
      "label": "OpenAI",
      "provider": "openai",
      "model": "gpt-5",
      "maxTokens": 4096,
      "contextWindowTokens": 128000,
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

验证：

```bash
OPENAI_API_KEY="sk-..." nanobot agent -m "Hello!"
```

如果你的 shell 不能使用内联环境变量，请先设置 `OPENAI_API_KEY`，然后再运行 `nanobot agent -m "Hello!"`。如果提供商拒绝 `apiType`，请移除 `apiType`，除非你正在使用文档中说明的 OpenAI 特定模式。

## 配方：Anthropic 直连

当你的密钥来自 Anthropic，并且你的模型名是 Anthropic 模型 ID，而不是 OpenRouter 模型路径时，适用此配方。

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  },
  "modelPresets": {
    "primary": {
      "label": "Anthropic",
      "provider": "anthropic",
      "model": "claude-sonnet-4-5",
      "maxTokens": 4096,
      "contextWindowTokens": 200000,
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

验证：

```bash
ANTHROPIC_API_KEY="sk-ant-..." nanobot agent -m "Hello!"
```

如果你复制了类似 `anthropic/claude-sonnet-4.5` 的模型名，那是网关风格的模型路径，应放在 `provider: "openrouter"` 下，而不是 `provider: "anthropic"` 下。

如果你使用 Anthropic 兼容代理，请保持预设提供商为 `anthropic`，并设置 `providers.anthropic.apiBase`：

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "apiBase": "https://anthropic-proxy.example.com"
    }
  },
  "modelPresets": {
    "primary": {
      "label": "Anthropic proxy",
      "provider": "anthropic",
      "model": "claude-sonnet-4-5",
      "maxTokens": 4096,
      "contextWindowTokens": 200000,
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

不要把 Anthropic 兼容端点配置成任意自定义提供商名称；命名的自定义提供商使用 OpenAI 兼容的请求格式。

## 配方：Kimi Coding Plan

当你的密钥来自 Kimi 的 Coding Plan 端点时，适用此配方。Nanobot 为这个 Anthropic Messages API 端点使用专用的 `kimi_coding` 提供商；不要把它配置成通用的 `custom` 提供商。

```json
{
  "providers": {
    "kimiCoding": {
      "apiKey": "${KIMI_CODING_API_KEY}"
    }
  },
  "modelPresets": {
    "kimiCoding": {
      "label": "Kimi Coding",
      "provider": "kimi_coding",
      "model": "kimi-for-coding",
      "maxTokens": 4096,
      "temperature": 0.1
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "kimiCoding"
    }
  }
}
```

验证：

```bash
nanobot status
nanobot agent -m "Hello!"
```

默认基础 URL 是 `https://api.kimi.com/coding/v1`。此端点要求使用与 Claude 兼容的 `User-Agent`；nanobot 默认发送 `claude-code/0.1.0`。如果你的账户要求不同的值，可通过 `providers.kimiCoding.extraHeaders.User-Agent` 覆盖它。

## 配方：自定义 OpenAI 兼容提供商

此配方适用于一个 OpenAI 兼容服务，但它不是已命名的 nanobot 提供商。

```json
{
  "providers": {
    "custom": {
      "apiKey": "${CUSTOM_API_KEY}",
      "apiBase": "https://api.example.com/v1"
    }
  },
  "modelPresets": {
    "primary": {
      "label": "Custom",
      "provider": "custom",
      "model": "provider-model-name",
      "maxTokens": 4096,
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

在把问题归咎于 nanobot 之前，先验证端点：

```bash
curl -sS https://api.example.com/v1/models
nanobot agent -m "Hello!"
```

`apiBase` 是 HTTP 基础 URL，不是模型名。如果服务需要版本路径，请包含它，例如 `/v1`。如果服务要求非空密钥但不会校验它，请使用诸如 `"apiKey": "EMPTY"` 之类的占位值。

对于多个自定义端点，不要滥用单个 `custom` 块。请在 `providers` 下为每个端点命名，并在预设中引用同一个名称：

```json
{
  "providers": {
    "workProxy": {
      "apiKey": "${WORK_PROXY_API_KEY}",
      "apiBase": "https://proxy.example.com/v1"
    },
    "lab-local": {
      "apiBase": "http://127.0.0.1:8000/v1"
    }
  },
  "modelPresets": {
    "work": {
      "label": "Work proxy",
      "provider": "workProxy",
      "model": "gpt-4o-mini",
      "maxTokens": 4096,
      "contextWindowTokens": 65536,
      "temperature": 0.1
    },
    "lab": {
      "label": "Lab local",
      "provider": "lab-local",
      "model": "served-model-name",
      "maxTokens": 4096,
      "contextWindowTokens": 65536,
      "temperature": 0.1
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "work"
    }
  }
}
```

这些自定义名称的行为类似于直接的 OpenAI 兼容提供商：`apiBase` 是必需的；当端点允许匿名或占位凭据时，`apiKey` 是可选的；`apiType` 应保持未设置。它们不支持 Anthropic 兼容端点；对此类情况请使用带有 `apiBase` 的 `anthropic` 提供商。
## 配方：Ollama 本地模型

当 Ollama 已经安装且模型已被拉取到本地时，使用此配方。

```bash
ollama serve
ollama pull llama3.2
```

```json
{
  "providers": {
    "ollama": {
      "apiBase": "http://localhost:11434/v1"
    }
  },
  "modelPresets": {
    "local": {
      "label": "Local",
      "provider": "ollama",
      "model": "llama3.2",
      "maxTokens": 2048,
      "contextWindowTokens": 32768,
      "temperature": 0.2
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "local"
    }
  }
}
```

验证：

```bash
curl -sS http://localhost:11434/v1/models
nanobot agent -m "Hello!"
```

如果你看到 `connection refused`，说明 Ollama 没有运行，或者 `apiBase` 指向了错误的端口。如果响应非常慢，尝试更小的本地模型或降低 `contextWindowTokens`。

## 配方：vLLM 或 LM Studio

当本地服务器暴露了兼容 OpenAI 的 `/v1` API 时，使用此配方。

```json
{
  "providers": {
    "vllm": {
      "apiBase": "http://127.0.0.1:8000/v1",
      "apiKey": "EMPTY"
    }
  },
  "modelPresets": {
    "local": {
      "label": "Local",
      "provider": "vllm",
      "model": "served-model-name",
      "maxTokens": 4096,
      "contextWindowTokens": 65536,
      "temperature": 0.2
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "local"
    }
  }
}
```

对于 LM Studio，请使用其本地 base URL 和 provider 名称：

```json
{
  "providers": {
    "lmStudio": {
      "apiBase": "http://localhost:1234/v1"
    }
  },
  "modelPresets": {
    "local": {
      "label": "LM Studio",
      "provider": "lm_studio",
      "model": "local-model",
      "maxTokens": 2048,
      "contextWindowTokens": 32768
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "local"
    }
  }
}
```

配置键可以是 `lmStudio` 或 `lm_studio`，但模型预设的 provider 应使用注册表名称 `lm_studio`。

## 配方：回退预设

当某个提供商有时会限流、某个模型很昂贵，或者你想要一个本地备份时，使用此配方。

```json
{
  "modelPresets": {
    "fast": {
      "label": "Fast",
      "provider": "openrouter",
      "model": "anthropic/claude-sonnet-4.5",
      "maxTokens": 4096,
      "contextWindowTokens": 65536,
      "temperature": 0.1
    },
    "deep": {
      "label": "Deep",
      "provider": "anthropic",
      "model": "claude-sonnet-4-5",
      "maxTokens": 4096,
      "contextWindowTokens": 200000,
      "temperature": 0.1
    },
    "local": {
      "label": "Local",
      "provider": "ollama",
      "model": "llama3.2",
      "maxTokens": 2048,
      "contextWindowTokens": 32768,
      "temperature": 0.2
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "fast",
      "fallbackModels": ["deep", "local"]
    }
  }
}
```

`fallbackModels` 属于 `agents.defaults`。字符串条目是模型预设名称，而不是原始模型名称。nanobot 会先尝试当前激活的预设，然后按顺序尝试回退预设。

保持回退候选切实可行。如果本地回退模型的上下文窗口更小，nanobot 必须构建出适合当前链中最小窗口的上下文。

## 配方：Langfuse 跟踪

当智能体已经能正常工作，而你希望对兼容 OpenAI 的提供商调用进行可观测性分析时，使用此配方。

在运行 nanobot 的同一个 Python 环境中安装可选包：

```bash
python -m pip install langfuse
```

在启动 nanobot 之前设置环境变量：

```bash
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_BASE_URL="https://cloud.langfuse.com"
nanobot agent -m "Hello!"
```

PowerShell：

```powershell
$env:LANGFUSE_SECRET_KEY = "sk-lf-..."
$env:LANGFUSE_PUBLIC_KEY = "pk-lf-..."
$env:LANGFUSE_BASE_URL = "https://cloud.langfuse.com"
nanobot agent -m "Hello!"
```

Langfuse 不是 `config.json` 中的模型提供商。它通过环境变量进行配置，并会跟踪受支持的兼容 OpenAI 的提供商调用。不使用该客户端路径的原生提供商可能不会生成 Langfuse 的 OpenAI 包装器跟踪。

## 配方：在运行时切换模型

在你拥有多个预设并且通过受支持的通道进行聊天之后，使用此方法。

```json
{
  "modelPresets": {
    "fast": {
      "label": "Fast",
      "provider": "openrouter",
      "model": "anthropic/claude-sonnet-4.5",
      "maxTokens": 4096,
      "contextWindowTokens": 65536
    },
    "local": {
      "label": "Local",
      "provider": "ollama",
      "model": "llama3.2",
      "maxTokens": 2048,
      "contextWindowTokens": 32768
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "fast"
    }
  }
}
```

在聊天中：

```text
/model
/model local
/model fast
```

`/model` 切换仅在运行时生效。它不会重写 `config.json`，而且正在进行中的一轮仍会使用其开始时的模型。

## 快速故障映射

| 症状 | 通常表示 | 首先检查 |
|---|---|---|
| `401`、`unauthorized` 或 `invalid API key` | 密钥缺失、错误、已过期，或属于错误的提供商 | 在同一个终端或服务中打印或重新设置环境变量 |
| `model not found` | 模型 ID 不属于所选提供商或网关 | 对比 `modelPresets.<name>.provider` 和 `modelPresets.<name>.model` |
| `connection refused` | 本地服务器未运行，或 `apiBase` 的端口/路径错误 | 运行 `curl <apiBase>/models` |
| `provider not found` | provider 名称拼写错误，或使用了配置键而不是注册表名称 | 使用诸如 `openrouter`、`openai`、`anthropic`、`ollama`、`vllm`、`lm_studio` 这样的名称 |
| Langfuse 没有显示任何跟踪 | 缺少环境变量，当前 Python 环境未安装 `langfuse`，或者 provider 路径是原生的 | 运行 `python -m pip show langfuse`，并从同一个环境重新启动 nanobot |

## 下一步参考

| 需要 | 阅读 |
|---|---|
| 字段含义和 provider 解析 | [`providers.md`](./providers.md) |
| 完整 schema 和 provider 表 | [`configuration.md#providers`](./configuration.md#providers) |
| Langfuse 详情 | [`configuration.md#langfuse-observability`](./configuration.md#langfuse-observability) |
| 首次运行诊断 | [`troubleshooting.md`](./troubleshooting.md) |
