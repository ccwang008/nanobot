<!-- 本文件由 docs/image-generation.md 翻译生成；原文仍保留在上级目录。 -->

# 图像生成

nanobot 可以通过 `generate_image` 工具生成和编辑图像。在 WebUI 中，用户可以从 composer 里启用 **Image Generation**，选择宽高比，并在同一聊天中对生成的图像继续迭代。

该功能默认禁用。在 `~/.nanobot/config.json` 中启用它，配置受支持的图像提供商，然后重启网关。

## 快速设置

此片段使用当前内置的图像生成默认值，因此 JSON 中包含具体名称。它不是对某个提供商的推荐；请将 `provider` 和 `model` 替换为你打算使用的任意受支持图像提供商和模型。

```json
{
  "providers": {
    "openrouter": {
      "apiKey": "${OPENROUTER_API_KEY}"
    }
  },
  "tools": {
    "imageGeneration": {
      "enabled": true,
      "provider": "openrouter",
      "model": "openai/gpt-5.4-image-2"
    }
  }
}
```

有关 Custom、AIHubMix、MiniMax、Gemini、Ollama、StepFun 和 Zhipu 的配置示例，请参见 [Provider Notes](#provider-notes)。

> [!TIP]
> 优先使用环境变量存放 API 密钥。nanobot 会在启动时从环境中解析 `${VAR_NAME}` 的值。

## WebUI 使用方法

在 WebUI composer 中：

1. 点击 **Image Generation**。
2. 选择宽高比：`Auto`、`1:1`、`3:4`、`9:16`、`4:3` 或 `16:9`。
3. 描述你想要的图像或编辑内容。
4. 在编辑现有图像时，附加参考图像。

生成的图像会作为 assistant media 渲染在聊天中。后续提示词，例如 “make it warmer”、“change the background” 或 “try a 16:9 version”，可以复用最近生成的产物。

WebUI 会对用户隐藏提供商存储细节。智能体在内部会看到已保存的产物路径，并且可以将其作为 `reference_images` 传回 `generate_image` 以进行迭代编辑。

## 配置参考

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `tools.imageGeneration.enabled` | boolean | `false` | 注册 `generate_image` 工具 |
| `tools.imageGeneration.provider` | string | `"openrouter"` | 当前内置图像提供商默认值。支持的值：`openrouter`、`openai`、`openai_codex`、`custom`、`aihubmix`、`minimax`、`gemini`、`ollama`、`stepfun`、`zhipu` |
| `tools.imageGeneration.model` | string | `"openai/gpt-5.4-image-2"` | 提供商模型名称 |
| `tools.imageGeneration.defaultAspectRatio` | string | `"1:1"` | 当提示词/工具调用未指定时的默认比例 |
| `tools.imageGeneration.defaultImageSize` | string | `"1K"` | 默认尺寸提示，例如 `1K`、`2K`、`4K` 或 `1024x1024` |
| `tools.imageGeneration.maxImagesPerTurn` | number | `4` | 单次工具调用接受的最大 `count`。有效范围：`1` 到 `8` |
| `tools.imageGeneration.saveDir` | string | `"generated"` | nanobot 媒体目录下用于保存生成产物的相对目录 |

提供商设置会复用常规 provider 配置字段：

| 选项 | 描述 |
|--------|-------------|
| `providers.<name>.apiKey` | 提供商 API 密钥。优先使用 `${ENV_VAR}` |
| `providers.<name>.apiBase` | 可选的自定义基础 URL |
| `providers.<name>.extraHeaders` | 合并到提供商请求中的请求头 |
| `providers.<name>.extraBody` | 合并到提供商请求体中的额外 JSON 字段 |

camelCase 和 snake_case 配置键都可接受，但文档使用 camelCase 以与 `config.json` 保持一致。

## 提供商说明

### OpenRouter

OpenRouter 使用聊天补全风格的图像响应。配置如下：

```json
{
  "tools": {
    "imageGeneration": {
      "enabled": true,
      "provider": "openrouter",
      "model": "openai/gpt-5.4-image-2"
    }
  }
}
```

如果你想使用参考图像编辑，请使用支持图像生成和图像编辑的模型。

### Custom（OpenAI 兼容）

`custom` 图像提供商适用于实现同步 OpenAI Images API 的服务：

```text
POST /v1/images/generations
```

响应必须在 `data[].b64_json` 或 `data[].url` 中包含生成的图像。原生 prediction API，例如 Replicate 的 `/v1/models/{owner}/{model}/predictions`，如果不在前面放置一个 OpenAI 兼容网关，就无法直接兼容。

配置如下：

```json
{
  "providers": {
    "custom": {
      "apiKey": "${CUSTOM_IMAGE_API_KEY}",
      "apiBase": "https://api.example.com/v1"
    }
  },
  "tools": {
    "imageGeneration": {
      "enabled": true,
      "provider": "custom",
      "model": "your-model-name"
    }
  }
}
```

`apiBase` 是必需的。该提供商会使用 OpenAI Images API 格式向 `{apiBase}/images/generations` 发送请求，并设置 `response_format: "b64_json"`。对于本地或未认证端点，`apiKey` 是可选的。通用的 `custom` 提供商不支持参考图像编辑。

`extraBody` 可以适配提供商特有的差异，因为它会最后合并到请求体中。示例：

- Agnes AI 文档说明返回 URL 响应，因此使用 `"extraBody": {"response_format": "url"}`。
- Together AI 文档说明 `"response_format": "base64"`，因此覆盖默认值。
- Volcengine Ark Seedream 模型可能需要尺寸提示，例如 `"2K"`、`"3K"`、`"4K"` 或显式尺寸。将 `tools.imageGeneration.defaultImageSize` 或 `providers.custom.extraBody.size` 设置为所选模型支持的值。

为了兼容 nanobot 的默认设置，custom 会将 `defaultImageSize: "1K"` 映射为 `1024x1024`。其他显式尺寸提示会原样传递。

### AIHubMix

AIHubMix `gpt-image-2-free` 通过 AIHubMix 的统一 predictions API 提供支持。nanobot 在内部调用：

```text
/v1/models/openai/gpt-image-2-free/predictions
```

配置如下：

```json
{
  "providers": {
    "aihubmix": {
      "apiKey": "${AIHUBMIX_API_KEY}",
      "extraBody": {
        "quality": "low"
      }
    }
  },
  "tools": {
    "imageGeneration": {
      "enabled": true,
      "provider": "aihubmix",
      "model": "gpt-image-2-free"
    }
  }
}
```

`quality: low` 是可选的。它可以让免费图像模型更快，并降低超时概率，但并非正确运行所必需。

### MiniMax

MiniMax `image-01` 支持文生图和参考图像（主体参考）编辑。支持的宽高比为 `1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16` 和 `21:9`。

```json
{
  "providers": {
    "minimax": {
      "apiKey": "${MINIMAX_API_KEY}"
    }
  },
  "tools": {
    "imageGeneration": {
      "enabled": true,
      "provider": "minimax",
      "model": "image-01",
      "defaultAspectRatio": "1:1"
    }
  }
}
```

### Gemini

nanobot 通过 Google 的 Generative Language API 支持两类 Gemini 图像生成模型家族：

| 模型 | 端点 | 参考图像 |
|-------|----------|-----------------|
| `imagen-4.0-generate-001` | `:predict` | 此集成不支持 |
| `gemini-2.5-flash-image` | `:generateContent` | 支持 |

对于参考图像编辑，请使用 Gemini Flash 图像模型：

```json
{
  "providers": {
    "gemini": {
      "apiKey": "${GEMINI_API_KEY}"
    }
  },
  "tools": {
    "imageGeneration": {
      "enabled": true,
      "provider": "gemini",
      "model": "gemini-2.5-flash-image"
    }
  }
}
```

Imagen 4 支持 `1:1`、`9:16`、`16:9`、`3:4` 和 `4:3` 这些宽高比。不支持的比例会被忽略，模型将使用其默认值。`defaultImageSize` 设置对 Gemini 模型无效；尺寸仅由 `defaultAspectRatio` 控制。通过 Imagen 模型传入的参考图像会被忽略（并记录警告）。

### Ollama

Ollama 的实验性原生图像生成 API 可用于本地服务器和托管的 ollama.com 模型。访问 `http://localhost:11434/api` 的本地服务不需要 API 密钥；只有在目标为 `https://ollama.com/api` 时才设置 `providers.ollama.apiKey`。

```json
{
  "providers": {
    "ollama": {
      "apiBase": "http://localhost:11434/api"
    }
  },
  "tools": {
    "imageGeneration": {
      "enabled": true,
      "provider": "ollama",
      "model": "x/z-image-turbo",
      "defaultAspectRatio": "16:9",
      "defaultImageSize": "2K"
    }
  }
}
```

Ollama 会将 `defaultAspectRatio` 和 `defaultImageSize` 映射为原生 `width` 和 `height` 值。此集成不支持参考图像。

### StepFun

StepFun（阶跃星辰）`step-image-edit-2` 支持文生图生成。`step-1x-medium` 变体还支持 **style-reference** 图像编辑，其中参考图像会引导输出的视觉风格。

支持的宽高比：`1:1`、`16:9`、`9:16`、`3:4`、`4:3`。尺寸以 `WIDTHxHEIGHT` 形式指定（例如 `1024x1024`、`1280x800`、`800x1280`）。

```json
{
  "providers": {
    "stepfun": {
      "apiKey": "${STEPFUN_API_KEY}"
    }
  },
  "tools": {
    "imageGeneration": {
      "enabled": true,
      "provider": "stepfun",
      "model": "step-image-edit-2"
    }
  }
}
```

> [!NOTE]
> StepFun 提供商复用了现有的 `providers.stepfun` 配置块（与 StepFun 的 LLM API 使用的是同一个配置块）。只需设置一次 `providers.stepfun.apiKey`，它会在文本生成和图像生成之间共享。
>
> 使用 `step-image-edit-2` 时，`reference_images` 会被忽略（该模型不支持 style reference）。切换到 `step-1x-medium` 以使用参考图像引导的生成。

#### StepPlan（订阅）

StepPlan 是 StepFun 的订阅层级，使用不同的 API 基础 URL。图像生成端点路径相同——只需覆盖 `apiBase`：

```json
{
  "providers": {
    "stepfun": {
      "apiKey": "${STEPFUN_API_KEY}",
      "apiBase": "https://api.stepfun.ai/step_plan/v1"
    }
  },
  "tools": {
    "imageGeneration": {
      "enabled": true,
      "provider": "stepfun",
      "model": "step-image-edit-2"
    }
  }
}
```

`apiBase` 优先于注册表默认值，因此配置了 StepPlan 基础 URL 后，图像请求会发送到 `https://api.stepfun.ai/step_plan/v1/images/generations` —— 与 LLM 调用使用相同的路径前缀。API 密钥与标准 StepFun 提供商共享。
### Zhipu

Zhipu（智谱）`glm-image` 模型支持文本到图像生成。API 返回临时图片 URL（有效期 30 天）；nanobot 会下载并将其重新编码为 base64 数据 URL。

支持的宽高比：`1:1`、`16:9`、`9:16`、`3:4`、`4:3`。尺寸可以指定为 `WIDTHxHEIGHT`（例如 `1280x1280`、`1728x960`），或使用宽高比预设。

```json
{
  "providers": {
    "zhipu": {
      "apiKey": "${ZAI_API_KEY}"
    }
  },
  "tools": {
    "imageGeneration": {
      "enabled": true,
      "provider": "zhipu",
      "model": "glm-image"
    }
  }
}
```

其他支持的模型：`cogview-4`、`cogview-4-250304`、`cogview-3-flash`。此集成不支持参考图像。

## 产物

生成的图片存储在当前 nanobot 实例的媒体目录下：

```text
~/.nanobot/media/generated/YYYY-MM-DD/img_<id>.<ext>
~/.nanobot/media/generated/YYYY-MM-DD/img_<id>.json
```

对于非默认配置位置，媒体目录相对于当前配置文件所在目录。

JSON sidecar 存储：

| 字段 | 含义 |
|-------|---------|
| `id` | 生成的图片短 ID，例如 `img_ab12cd34ef56` |
| `path` | 内部用于后续编辑的本地图片路径 |
| `mime` | 检测到的图片 MIME 类型 |
| `prompt` | 用于生成的提示词 |
| `model` | 提供商模型 |
| `provider` | 提供商名称 |
| `source_images` | 用于编辑的参考图像路径 |
| `created_at` | 创建时间戳 |

不要将 base64 图片负载粘贴到聊天中。除非用户明确要求调试细节，否则智能体应将本地产物路径保留在内部。

## 提示词编写

好的图片提示词应包括：

- 主体和场景。
- 构图、镜头或布局。
- 风格、氛围、光照和配色方案。
- 必须出现在图片中的准确文本，并用引号括起来。
- 诸如“保持相同角色”或“保留 logo”之类的约束。

示例：

```text
A minimal app icon for nanobot: friendly robot head, rounded square, soft blue and white palette, clean vector style, no text
```

对于编辑，请描述应该改变什么，以及必须保持不变的内容：

```text
Use the reference image. Keep the same robot and composition, change the palette to warm orange, and add a subtle sunrise background.
```

## 故障排查

| 症状 | 检查 |
|---------|-------|
| `generate_image` 不可用 | 将 `tools.imageGeneration.enabled` 设置为 `true` 并重启网关 |
| 缺少 API key 错误 | 配置 `providers.<provider>.apiKey`；如果使用 `${VAR_NAME}`，请确认该环境变量对网关进程可见 |
| `unsupported image generation provider` | 使用 `openrouter`、`openai`、`openai_codex`、`custom`、`aihubmix`、`minimax`、`gemini`、`ollama`、`stepfun` 或 `zhipu` |
| AIHubMix 提示 `Incorrect model ID` | 使用 `model: "gpt-image-2-free"`；nanobot 会在内部将其扩展为所需的 `openai/gpt-image-2-free` 模型路径 |
| 生成超时 | 尝试更小/默认的图片尺寸，将 AIHubMix 的 `extraBody.quality` 设为 `"low"`，或稍后重试 |
| 参考图像被拒绝 | 参考图像路径必须位于工作区或 nanobot 媒体目录内，并且必须是有效的图片文件 |
