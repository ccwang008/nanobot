<!-- 本文件由 docs/development.md 翻译生成；原文仍保留在上级目录。 -->

# 开发

本页汇集了为扩展 nanobot 而面向贡献者的说明。面向用户的设置和运行时选项位于 [`configuration.md`](./configuration.md)。

## 添加 LLM 提供商

nanobot 使用 `nanobot/providers/registry.py` 中的 provider registry 作为 LLM 提供商元数据的权威来源。大多数兼容 OpenAI 的提供商只需要两处改动。

1. 向 `PROVIDERS` 添加一个 `ProviderSpec` 条目：

```python
ProviderSpec(
    name="myprovider",
    keywords=("myprovider", "mymodel"),
    env_key="MYPROVIDER_API_KEY",
    display_name="My Provider",
    default_api_base="https://api.myprovider.com/v1",
)
```

2. 在 `nanobot/config/schema.py` 中的 `ProvidersConfig` 添加一个字段：

```python
class ProvidersConfig(BaseModel):
    ...
    myprovider: ProviderConfig = Field(default_factory=ProviderConfig)
```

环境变量、配置匹配、提供商状态以及 WebUI 凭据显示都由这两个条目派生出来。

有用的 `ProviderSpec` 选项：

| 字段 | 说明 |
|---|---|
| `default_api_base` | 默认的兼容 OpenAI 的 base URL。 |
| `env_extras` | 从提供商配置派生出的额外环境变量。 |
| `model_overrides` | 针对每个模型的请求参数覆盖。 |
| `is_gateway` | 提供商可以路由多个模型家族，例如 OpenRouter。 |
| `detect_by_key_prefix` | 通过 API key 前缀匹配已配置的网关。 |
| `detect_by_base_keyword` | 通过 API base URL 匹配已配置的网关。 |
| `strip_model_prefix` | 在将模型发送到上游 API 之前去除 `provider/`。 |
| `supports_max_completion_tokens` | 使用 `max_completion_tokens` 而不是 `max_tokens`。 |
| `is_transcription_only` | 提供商有凭据，但不能提供聊天补全。 |

## 添加转录提供商

转录被刻意拆分为两个层：

- `nanobot/audio/transcription_registry.py` 负责 provider 名称、别名、默认模型以及适配器加载。
- `nanobot/providers/transcription.py` 负责 provider 特定的 HTTP 行为。

凭据仍然位于 `providers.<provider>` 下，因此 chat 通道和 WebUI 会以相同方式解析 API keys 和 API bases。

1. 向 `ProvidersConfig` 添加提供商凭据。

```python
class ProvidersConfig(BaseModel):
    ...
    my_stt: ProviderConfig = Field(default_factory=ProviderConfig)
```

2. 在 `nanobot/providers/registry.py` 中添加一个 `ProviderSpec`。

对于仅转录的提供商，设置 `is_transcription_only=True`，这样它们会出现在凭据/设置界面中，但不会出现在聊天模型选择中。

```python
ProviderSpec(
    name="my_stt",
    keywords=("my_stt",),
    env_key="MY_STT_API_KEY",
    display_name="My STT",
    default_api_base="https://api.example.com/v1",
    is_transcription_only=True,
)
```

3. 在 `nanobot/providers/transcription.py` 中添加一个适配器类。

适配器接收已解析的凭据和设置。对于提供商错误，它们返回空字符串，这样通道语音消息会静默失败，而不是让智能体循环崩溃。

```python
class MySTTTranscriptionProvider:
    def __init__(
        self,
        api_key: str | None = None,
        api_base: str | None = None,
        language: str | None = None,
        model: str | None = None,
    ):
        self.api_key = api_key or os.environ.get("MY_STT_API_KEY")
        self.api_base = api_base or "https://api.example.com/v1"
        self.language = language or None
        self.model = model or "my-default-stt-model"

    async def transcribe(self, file_path: str | Path) -> str:
        ...
```

4. 在 `nanobot/audio/transcription_registry.py` 中注册该适配器。

```python
TranscriptionProviderSpec(
    name="my_stt",
    default_model="my-default-stt-model",
    adapter="nanobot.providers.transcription:MySTTTranscriptionProvider",
    aliases=("mystt",),
)
```

5. 添加测试。

至少应覆盖：

- `tests/providers/test_transcription.py` 中的配置解析
- 适配器请求/响应行为以及重试/错误处理
- `tests/webui/test_settings_api.py` 中的 WebUI 设置载荷/更新行为
- 如果提供商会出现在 Settings 中，则覆盖 provider brand 映射

6. 更新面向用户的文档。

在用户选择 `transcription.provider` 的 [`configuration.md`](./configuration.md) 中添加该提供商，但将实现细节保留在本开发指南中。
