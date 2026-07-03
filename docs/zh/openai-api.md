<!-- 本文件由 docs/openai-api.md 翻译生成；原文仍保留在上级目录。 -->

# OpenAI 兼容 API

nanobot 可以为本地集成暴露一个最小的 OpenAI 兼容端点：

```bash
python -m pip install "nanobot-ai[api]"
nanobot agent -m "Hello!"
nanobot serve
```

先运行 CLI 检查。如果 `nanobot agent -m "Hello!"` 失败，请在调试 API 服务器之前先修复提供商或配置设置。默认情况下，API 绑定到 `127.0.0.1:8900`。你可以在 `config.json` 中更改它。

如需设置帮助，请参见 [`quick-start.md`](./quick-start.md)、[`providers.md`](./providers.md) 和 [`troubleshooting.md`](./troubleshooting.md)。

## 身份验证

仅限本地 `127.0.0.1` 使用时不需要 API key。如果你将 API
服务器绑定到所有接口，并设置 `api.host: "0.0.0.0"` 或 `"::"`，nanobot 需要
`api.apiKey`；否则启动会失败，以避免在网络上暴露未认证的智能体
端点。

```json
{
  "api": {
    "host": "0.0.0.0",
    "port": 8900,
    "apiKey": "${NANOBOT_API_KEY}"
  }
}
```

当设置了 `api.apiKey` 时，请在 API 路由上将其作为 Bearer token 发送。健康
端点仍然不需要认证，因此本地探测和负载均衡器仍可
检查进程健康状态。

```bash
curl http://127.0.0.1:8900/v1/models \
  -H "Authorization: Bearer $NANOBOT_API_KEY"
```

## 行为

- 会话隔离：在请求体中传入 `"session_id"` 以隔离对话；省略则使用共享的默认会话（`api:default`）
- 单条消息输入：每个请求必须且只能包含一条 `user` 消息
- 固定模型：省略 `model`，或传入与 `/v1/models` 显示相同的模型
- 流式传输：设置 `stream=true` 以接收 Server-Sent Events（`text/event-stream`），返回与 OpenAI 兼容的 delta 块，并以 `data: [DONE]` 结束；省略或设置 `stream=false` 则返回单个 JSON 响应
- **文件上传**：支持通过 JSON base64 或 `multipart/form-data` 上传图片、PDF、Word（.docx）、Excel（.xlsx）、PowerPoint（.pptx）（每个文件最大 10MB）
- API 请求在合成的 `api` 通道中运行，因此 `message` 工具不会**自动**投递到 Telegram/Discord/etc.。要主动发送到另一个聊天，请在已启用的通道上使用显式的 `channel` 和 `chat_id` 调用 `message`。

来自 API 会话的跨通道投递示例工具调用：

```json
{
  "content": "Build finished successfully.",
  "channel": "telegram",
  "chat_id": "123456789"
}
```

如果 `channel` 指向一个在你的配置中未启用的通道，nanobot 会排队出站事件，但不会发生平台投递。

## 端点

- `GET /health`
- `GET /v1/models`
- `POST /v1/chat/completions`

## curl

```bash
curl http://127.0.0.1:8900/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "hi"}],
    "session_id": "my-session"
  }'
```

## 文件上传（JSON base64）

使用 OpenAI 多模态内容格式以内联方式发送图片：

```bash
curl http://127.0.0.1:8900/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": [
      {"type": "text", "text": "Describe this image"},
      {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBOR..."}}
    ]}]
  }'
```

## 文件上传（multipart/form-data）

通过 multipart 上传任何受支持的文件类型（图片、PDF、Word、Excel、PPT）：

```bash
# Single file
curl http://127.0.0.1:8900/v1/chat/completions \
  -F "message=Summarize this report" \
  -F "files=@report.docx"

# Multiple files with session isolation
curl http://127.0.0.1:8900/v1/chat/completions \
  -F "message=Compare these files" \
  -F "files=@chart.png" \
  -F "files=@data.xlsx" \
  -F "session_id=my-session"
```

支持的文件类型：
- **图片**：PNG、JPEG、GIF、WebP（作为 base64 发送给 AI 进行视觉分析）
- **文档**：PDF、Word（.docx）、Excel（.xlsx）、PowerPoint（.pptx）（提取文本后发送给 AI）
- **文本**：TXT、Markdown、CSV、JSON 等（直接读取）

## Python (`requests`)

```python
import requests

resp = requests.post(
    "http://127.0.0.1:8900/v1/chat/completions",
    json={
        "messages": [{"role": "user", "content": "hi"}],
        "session_id": "my-session",  # optional: isolate conversation
    },
    timeout=120,
)
resp.raise_for_status()
print(resp.json()["choices"][0]["message"]["content"])
```

## Python (`openai`)

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8900/v1",
    api_key="dummy",
)

resp = client.chat.completions.create(
    model="MiniMax-M2.7",
    messages=[{"role": "user", "content": "hi"}],
    extra_body={"session_id": "my-session"},  # optional: isolate conversation
)
print(resp.choices[0].message.content)
```

