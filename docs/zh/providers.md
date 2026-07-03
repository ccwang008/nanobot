<!-- 本文件由 docs/providers.md 翻译生成；原文仍保留在上级目录。 -->

# 提供商和模型

当首次回复因为提供商/模型不匹配而失败时，或当你想把具体的设置示例适配到另一个提供商时，使用此页。如果你已经知道想用哪个提供商，并且只需要一个可直接粘贴的配置，请使用 [`provider-cookbook.md`](./provider-cookbook.md)。

对于每一种设置，回答三个问题：

1. 哪个提供商拥有凭据或端点？
2. 该提供商期望的模型名称是什么？
3. 该提供商需要 `apiKey`、`apiBase`、OAuth 登录、云凭据，还是只需要一个本地服务器 URL？

对于模型/提供商配对，优先使用命名的 `modelPresets` 条目，然后通过 `agents.defaults.modelPreset` 选择它。直接设置 `agents.defaults.provider` 和 `agents.defaults.model` 仍然适用于现有配置，但预设让运行时 `/model` 切换和回退链更清晰。设置过程中将 `provider` 固定在预设内；之后你可以再切回 `"auto"`。

## 不猜测地选择提供商

文档展示具体的提供商名称，是为了让 JSON 可以直接复制，而不是因为 nanobot 会对提供商进行排序。请从你实际控制的服务或端点开始：

| 如果你有... | 配置... |
|---|---|
| 来自托管提供商或网关的 API 密钥 | 该提供商的 `providers.<name>.apiKey`，然后再设置一个使用该提供商名称和该服务中的模型 ID 的预设。 |
| OpenCode Zen 或 Go 密钥 | `providers.opencodeZen.apiKey` 或 `providers.opencodeGo.apiKey`，然后再设置 `provider: "opencode_zen"` 或 `provider: "opencode_go"` 的预设。 |
| 公司代理或区域端点 | 对应的提供商块，如果代理给你一个 URL，则再加上 `apiBase`。 |
| 本地 OpenAI 兼容服务器 | 例如 `ollama`、`vllm`、`lmStudio` 或 `custom` 的本地提供商块，通常带有 `apiBase`。 |
| 基于 OAuth 的账户 | 运行对应的 `nanobot provider login ...` 命令，然后在预设中显式选择该提供商。 |
| 还没有提供商 | 根据账户访问、定价、地区可用性、隐私需求以及你需要的模型 ID，在 nanobot 之外先选一个。然后带着它的密钥和模型 ID 再回来。 |

## 最小形态

```json
{
  "providers": {
    "openrouter": {
      "apiKey": "sk-or-v1-xxx"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "openrouter",
      "model": "anthropic/claude-opus-4.5",
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

提供商配置为 nanobot 提供凭据和端点细节。模型预设命名提供商/模型配对。智能体默认值决定正常轮次使用哪个命名预设。请同时替换示例中的提供商和模型；把一个提供商的 API 密钥和另一个提供商的模型 ID 混在一起，是最常见的首次运行失败原因。

## 提供商、模型、API 密钥和 Base URL

这些字段回答不同的问题：

| 字段 | 所在位置 | 含义 |
|---|---|---|
| `provider` | `modelPresets.<name>.provider` | nanobot 应该使用哪个提供商适配器发送请求。 |
| `model` | `modelPresets.<name>.model` | 该提供商或网关所期望的模型 ID。 |
| `apiKey` | `providers.<provider>.apiKey` | 该提供商的凭据。机密信息请使用 `${ENV_VAR}`。 |
| `apiBase` | `providers.<provider>.apiBase` | 提供商端点的 HTTP base URL。 |
| `proxy` | `providers.<provider>.proxy` | 仅适用于此提供商的可选 HTTP 代理。支持 OpenAI 兼容提供商和 OpenAI Codex。 |

对于 OpenRouter、Anthropic direct、OpenAI direct、Groq 或 Bedrock 等托管内置提供商，通常可以省略 `apiBase`，因为 nanobot 已知它们的默认端点。对于 `custom`、本地 OpenAI 兼容服务器、提供商代理、区域端点或订阅端点，请设置 `apiBase`。当端点需要 API 版本路径时，请包含它，例如 `https://api.example.com/v1` 或 `http://localhost:11434/v1`。

当某个提供商必须通过代理发送 HTTP 流量，而又不想更改进程范围的 `HTTP_PROXY` / `HTTPS_PROXY` 时，请使用 `proxy`。这适用于使用 nanobot 的 OpenAI 兼容客户端的提供商，包括 `openai`、`custom`、命名自定义提供商、OpenRouter 风格网关、本地 OpenAI 兼容服务器以及类似的注册表条目。它也适用于 `openai_codex`，包括 Codex OAuth 令牌交换/刷新和 Codex Responses API 请求。`anthropic`、`bedrock`、`azure_openai` 和 `github_copilot` 等原生提供商后端会拒绝 `proxy`；请改用它们各自特定于端点的配置。

## 常见提供商模式

### OpenRouter 网关

通过 OpenRouter 提供模型 ID 的网关式设置。

```json
{
  "providers": {
    "openrouter": {
      "apiKey": "${OPENROUTER_API_KEY}"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "openrouter",
      "model": "anthropic/claude-opus-4.5",
      "maxTokens": 8192,
      "contextWindowTokens": 65536
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

请严格使用 OpenRouter 列出的模型 ID。

### OpenCode Zen 和 Go

OpenCode Zen 和 OpenCode Go 是由 OpenCode 管理、面向编码智能体模型的网关。
它们共享 `OPENCODE_API_KEY`，但在 nanobot 中使用不同的提供商配置键和默认 base
URL。

```json
{
  "providers": {
    "opencodeZen": {
      "apiKey": "${OPENCODE_API_KEY}"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "opencode_zen",
      "model": "opencode/deepseek-v4-pro",
      "maxTokens": 8192,
      "contextWindowTokens": 65536
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

对于 OpenCode Go，请切换提供商块和预设：

```json
{
  "providers": {
    "opencodeGo": {
      "apiKey": "${OPENCODE_API_KEY}"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "opencode_go",
      "model": "opencode-go/deepseek-v4-flash",
      "maxTokens": 8192,
      "contextWindowTokens": 65536
    }
  }
}
```

OpenCode 对 Zen 使用 `opencode/<model-id>`，对 Go 使用
`opencode-go/<model-id>` 来记录模型 ID。nanobot 接受这些前缀，并在将请求发送给 OpenCode 之前将其剥离。请使用 OpenCode 在 `chat/completions` 端点下列出的模型 ID；仅在 `responses`、
`messages` 或提供商特定端点下列出的模型，不会通过这个 OpenAI 兼容提供商路径处理。

### Anthropic Direct

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "anthropic",
      "model": "claude-opus-4-5",
      "maxTokens": 8192,
      "contextWindowTokens": 200000
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

Anthropic direct 使用原生 Anthropic 提供商。除非提供商就是 OpenRouter，否则不要使用 OpenRouter 的模型 ID。

如果你使用的是兼容 Anthropic 的代理，请保持提供商为 `anthropic`，并覆盖 `apiBase`：

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
      "provider": "anthropic",
      "model": "claude-sonnet-4-5"
    }
  }
}
```

任意自定义提供商名称仅兼容 OpenAI；它们不使用 Anthropic Messages API 请求格式。

### OpenAI Direct

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "openai",
      "model": "gpt-5",
      "maxTokens": 8192,
      "contextWindowTokens": 128000
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

当你需要强制使用特定的 OpenAI API 表面时，可以设置 `providers.openai.apiType`。其他提供商会拒绝 `apiType`；除 `providers.openai` 之外请不要设置它。将模型替换为 OpenAI 账户可用的模型 ID。

### 自定义 OpenAI 兼容端点

`custom` 提供商适用于一个未由命名提供商表示的 OpenAI 兼容端点。

```json
{
  "providers": {
    "custom": {
      "apiKey": "${CUSTOM_API_KEY}",
      "apiBase": "https://example.com/v1"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "custom",
      "model": "provider-model-name",
      "maxTokens": 8192,
      "contextWindowTokens": 65536
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

`custom` 不会推断默认 base URL。请设置 `apiBase`。

如果你有多个自定义 OpenAI 兼容端点，请为每个端点在 `providers` 下提供各自的提供商键，并在模型预设中使用相同的键。这个键可以是与你的环境相符的名称，例如 `companyProxy`、`tenant-a` 或 `dev-local`。

```json
{
  "providers": {
    "companyProxy": {
      "apiKey": "${COMPANY_PROXY_API_KEY}",
      "apiBase": "https://llm-proxy.example.com/v1"
    },
    "tenant-a": {
      "apiBase": "https://tenant-a.example.com/v1"
    }
  },
  "modelPresets": {
    "company": {
      "provider": "companyProxy",
      "model": "gpt-4o-mini",
      "maxTokens": 8192,
      "contextWindowTokens": 65536
    },
    "tenantA": {
      "provider": "tenant-a",
      "model": "served-model-name",
      "maxTokens": 8192,
      "contextWindowTokens": 65536
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "company"
    }
  }
}
```

自定义提供商键会被视为直接的 OpenAI 兼容提供商。由于 nanobot 无法知道端点 URL，因此 `apiBase` 是必需的。对于不需要密钥的本地服务器或私有代理，`apiKey` 是可选的。请选择一个不会与内置提供商名称或别名冲突的名称，例如 `openai`、`openai-codex`、`github-copilot` 或 `lm-studio`。不要在自定义提供商键上设置 `apiType`；`apiType` 仅用于 `providers.openai`。

如果你的自定义端点文档说明了非标准的 thinking 开关，请将 `providers.<name>.thinkingStyle` 设置为 `thinking_type`、`enable_thinking` 或 `reasoning_split`；然后 nanobot 会把 `reasoningEffort` 映射到该提供商特定的请求体。对于普通的 OpenAI 兼容端点，请保持不设置。

这个命名自定义提供商路径不适用于兼容 Anthropic 的端点。对于兼容 Anthropic 的代理，请使用 `providers.anthropic.apiBase` 并将预设提供商设置为 `anthropic`。

### Ollama

先单独启动 Ollama，然后让 nanobot 指向 OpenAI 兼容端点。

```json
{
  "providers": {
    "ollama": {
      "apiBase": "http://localhost:11434/v1"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "ollama",
      "model": "llama3.2",
      "maxTokens": 4096,
      "contextWindowTokens": 32768
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

大多数 Ollama 设置不需要 API 密钥。

### vLLM 或其他本地 OpenAI 兼容服务器

```json
{
  "providers": {
    "vllm": {
      "apiBase": "http://127.0.0.1:8000/v1",
      "apiKey": "EMPTY"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "vllm",
      "model": "served-model-name",
      "maxTokens": 8192,
      "contextWindowTokens": 65536
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

某些 OpenAI 兼容本地服务器即使不校验 API 密钥，也要求提供任意非空 API 密钥。

### LM Studio

```json
{
  "providers": {
    "lmStudio": {
      "apiBase": "http://localhost:1234/v1"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "lm_studio",
      "model": "local-model",
      "maxTokens": 4096,
      "contextWindowTokens": 32768
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

配置键可以是 camelCase 或 snake_case。模型预设中的提供商名称应使用注册表名称，例如 `lm_studio`。
### AWS Bedrock

Bedrock 可根据你的 AWS 配置使用 AWS 凭证链、profile、region 或 Bedrock bearer token。

```json
{
  "providers": {
    "bedrock": {
      "region": "us-east-1",
      "profile": "default"
    }
  },
  "modelPresets": {
    "primary": {
      "provider": "bedrock",
      "model": "bedrock/anthropic.claude-sonnet-4-5-20250929-v1:0",
      "maxTokens": 8192,
      "contextWindowTokens": 200000
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "primary"
    }
  }
}
```

参见 [`configuration.md#providers`](./configuration.md#providers) 中关于 Bedrock 的特定说明。

### OAuth 提供商

某些提供商不会在 `config.json` 中使用 API key。

```bash
nanobot provider login openai-codex
nanobot provider login github-copilot
```

然后在预设中显式选择提供商和模型。OAuth 提供商不能作为有效的自动回退。

对于 OpenAI Codex，只有在 Codex OAuth/token 刷新或 Codex API 请求必须使用代理时，才添加 `providers.openai_codex.proxy`：

```json
{
  "providers": {
    "openai_codex": {
      "proxy": "http://127.0.0.1:7890"
    }
  },
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

如果你在远程/无头机器上运行登录命令，并在本地浏览器中打开授权 URL，请在提示时将最终的 `http://localhost:1455/auth/callback?...` 重定向 URL 重新粘贴回终端。完整的 OAuth 提供商说明请参见 [`configuration.md#providers`](./configuration.md#providers)。

## 提供商解析

推荐路径是由 `agents.defaults.modelPreset` 选择的命名预设。实际生效的模型参数来自：

1. `agents.defaults.modelPreset` 引用的命名 `modelPresets` 条目；
2. 否则来自由 `agents.defaults.model`、`provider`、`maxTokens`、`contextWindowTokens`、`temperature` 以及相关字段构建的隐式 `default` 预设。

提供商选择遵循以下实用规则：

- 活动预设或隐式默认配置中的显式 `provider` 优先生效。
- `provider: "auto"` 会尝试模型名关键词、已配置的 key、本地基础 URL 以及网关提供商。
- OpenRouter 和 AiHubMix 等网关提供商可以路由许多模型家族，因此模型名必须对该网关有效。
- 本地提供商通常应显式指定，因为像 `llama3.2` 这样的通用本地模型名并不总是包含提供商关键词。

### 模型名前缀

`family/model-name` 并不总是会选择 `family` 提供商。基于前缀的提供商推断只会在活动提供商为 `"auto"` 时运行。

- 显式提供商优先生效：`provider: "openrouter"` 搭配 `model: "anthropic/claude-sonnet-4.5"` 调用的是 OpenRouter，而不是 Anthropic。
- 在 `provider: "auto"` 下，与已配置的内置或命名自定义提供商匹配的前缀可以选择该提供商。命名自定义前缀在请求前会被去除，因此 `companyProxy/gpt-4o-mini` 会以上游的 `gpt-4o-mini` 发送。
- 使用显式命名自定义提供商时，模型会按原样发送；`provider: "companyProxy"` 搭配 `model: "openai/gpt-4o-mini"` 会将 `openai/gpt-4o-mini` 发送给 `companyProxy`。

在使用 `anthropic/claude-sonnet-4.5` 之类的网关目录 ID 时，请在预设中固定 `provider`。

## 模型预设

模型预设是推荐的模型配置入口。当你需要命名模型选择、运行时 `/model` 切换或可复用的回退目标时，请使用它们。

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
      "model": "claude-opus-4-5",
      "maxTokens": 8192,
      "contextWindowTokens": 200000,
      "temperature": 0.1
    }
  },
  "agents": {
    "defaults": {
      "modelPreset": "fast"
    }
  }
}
```

预设名 `default` 保留给隐式的 `agents.defaults` 设置。不要定义 `modelPresets.default`；使用 `/model default` 可回到旧配置中的直接 `agents.defaults.*` 字段。

## 回退模型

回退适用于临时的提供商故障、速率限制或模型可用性问题。保持回退与任务大小和工具使用兼容。优先使用回退预设，这样每个候选项都有名称以及完整的提供商、模型、生成和上下文窗口配置。

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
      "model": "claude-opus-4-5",
      "maxTokens": 8192,
      "contextWindowTokens": 200000,
      "temperature": 0.1
    },
    "localSmall": {
      "label": "Local Small",
      "provider": "ollama",
      "model": "llama3.2",
      "maxTokens": 4096,
      "contextWindowTokens": 32768,
      "temperature": 0.2
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

`fallbackModels` 中的字符串条目是预设名称，而不是原始模型名。nanobot 会在活动预设之后按顺序尝试它们。每个回退预设都使用自己的 `provider`、`model`、`maxTokens`、`contextWindowTokens`、`temperature` 和可选的 `reasoningEffort`。

只有在某个模型不值得作为预设命名时，才使用内联回退对象：

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

`fallbackModels` 属于 `agents.defaults` 下，而不是每个预设内部。如果回退候选使用更小的上下文窗口，nanobot 会用活动链中最小的窗口来构建上下文，这样每个候选都能接收相同的提示。失败条件请参见 [`configuration.md#model-fallbacks`](./configuration.md#model-fallbacks)。

## 快速检查

在调试聊天应用前先运行这些检查：

```bash
nanobot status
nanobot agent -m "Hello!"
```

如果 `nanobot agent -m "Hello!"` 失败：

| 症状 | 可能原因 |
|---|---|
| 401、unauthorized、invalid API key | key 缺失、已过期、复制时带了空白，或存储在错误的提供商下 |
| model not found | 所选提供商或网关不存在该模型 ID |
| connection refused | 本地提供商服务器未运行，或 `apiBase` 指向了错误的端口 |
| provider not found | 活动预设使用了拼写错误的提供商；请使用诸如 `openrouter`、`anthropic`、`ollama`、`vllm`、`lm_studio` 之类的注册名 |
| CLI 中可用但聊天应用不可用 | 提供商没问题；请在 [`chat-apps.md`](./chat-apps.md) 或 [`troubleshooting.md`](./troubleshooting.md) 中排查网关/通道设置 |

完整的提供商表和高级的提供商特定说明请参见 [`configuration.md#providers`](./configuration.md#providers)。
