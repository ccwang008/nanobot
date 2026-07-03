<!-- 本文件由 docs/websocket.md 翻译生成；原文仍保留在上级目录。 -->

# WebSocket 服务器通道

Nanobot 可以充当 WebSocket 服务器，允许外部客户端（Web 应用、CLI、脚本）通过持久连接与智能体实时交互。

## 功能

- 通过 WebSocket 进行双向实时通信
- 支持流式传输 —— 逐个 token 接收智能体响应
- 基于 token 的身份验证（静态 token 和短期签发 token）
- 多会话复用 —— 一条连接可并发运行多个 `chat_id`
- 支持 TLS/SSL（WSS），并强制最低 TLSv1.2
- 通过 `allowFrom` 进行客户端允许列表控制
- 自动清理失效连接

## 快速开始

### 1. 配置

在 `config.json` 的 `channels.websocket` 下添加：

```json
{
  "channels": {
    "websocket": {
      "enabled": true,
      "host": "127.0.0.1",
      "port": 8765,
      "path": "/",
      "tokenIssueSecret": "your-webui-password",
      "websocketRequiresToken": true,
      "allowFrom": ["*"],
      "streaming": true
    }
  }
}
```

### 2. 启动 nanobot

```bash
nanobot gateway
```

你应该会看到：

```text
WebSocket server listening on ws://127.0.0.1:8765/
```

### 3. 连接客户端

```bash
# Using websocat
websocat ws://127.0.0.1:8765/?client_id=alice

# Using Python
import asyncio, json, websockets

async def main():
    async with websockets.connect("ws://127.0.0.1:8765/?client_id=alice") as ws:
        ready = json.loads(await ws.recv())
        print(ready)  # {"event": "ready", "chat_id": "...", "client_id": "alice"}
        await ws.send(json.dumps({"content": "Hello nanobot!"}))
        reply = json.loads(await ws.recv())
        print(reply["text"])

asyncio.run(main())
```

## 连接 URL

```text
ws://{host}:{port}{path}?client_id={id}&token={token}
```

| 参数 | 必需 | 描述 |
|-----------|----------|-------------|
| `client_id` | 否 | 用于 `allowFrom` 授权的标识符。若省略，将自动生成为 `anon-xxxxxxxxxxxx`。截断为 128 个字符。 |
| `token` | 条件 | 身份验证 token。当配置了 `websocketRequiresToken` 为 `true` 或配置了 `token`（静态密钥）时必填。 |

## 线路协议

所有帧都是 JSON 文本。每条消息都有一个 `event` 字段。

### 服务器 → 客户端

**`ready`** — 在连接建立后立即发送：

```json
{
  "event": "ready",
  "chat_id": "uuid-v4",
  "client_id": "alice"
}
```

**`message`** — 完整的智能体响应：

```json
{
  "event": "message",
  "chat_id": "uuid-v4",
  "text": "Hello! How can I help?",
  "media": ["/tmp/image.png"],
  "reply_to": "msg-id"
}
```

`media` 和 `reply_to` 仅在适用时出现。

**`delta`** — 流式文本片段（仅当 `streaming: true` 时）：

```json
{
  "event": "delta",
  "chat_id": "uuid-v4",
  "text": "Hello",
  "stream_id": "s1"
}
```

**`stream_end`** — 表示一个流式片段结束：

```json
{
  "event": "stream_end",
  "chat_id": "uuid-v4",
  "stream_id": "s1"
}
```

**`reasoning_delta`** — 当前 assistant 回合的增量模型推理/思考片段。作用与 `delta` 相同，但目标是答案上方的推理气泡，而不是答案正文：

```json
{
  "event": "reasoning_delta",
  "chat_id": "uuid-v4",
  "text": "Let me decompose ",
  "stream_id": "r1"
}
```

**`reasoning_end`** — 当前推理流的结束标记。WebUI 使用它来锁定原位气泡，并将闪烁的标题切换为静态折叠状态：

```json
{
  "event": "reasoning_end",
  "chat_id": "uuid-v4",
  "stream_id": "r1"
}
```

只有当通道的 `showReasoning` 为 `true`（默认）且模型返回推理内容（DeepSeek-R1 / Kimi / MiMo / OpenAI reasoning models、Anthropic extended thinking，或内联 `<think>` / `<thought>` 标签）时，推理帧才会传输。没有推理的模型不会产生任何 `reasoning_delta` 帧。

**`runtime_model_updated`** — 当网关运行时模型发生变化时广播，例如在 `/model <preset>` 之后：

```json
{
  "event": "runtime_model_updated",
  "model_name": "openai/gpt-4.1-mini",
  "model_preset": "fast"
}
```

当没有启用命名模型预设时，`model_preset` 会被省略。WebUI 客户端使用此事件在斜杠命令、配置重载和设置变更之间保持显示的模型徽标同步。

**`attached`** — 对 `new_chat` / `attach` 入站信封的确认（见[多会话复用](#multi-chat-multiplexing)）：

```json
{"event": "attached", "chat_id": "uuid-v4"}
```

**`error`** — 针对格式错误的入站信封的软错误。连接保持打开：

```json
{"event": "error", "detail": "invalid chat_id"}
```

### 客户端 → 服务器

**旧版（默认会话）：** 发送纯字符串，或带有可识别文本字段的 JSON 对象：

```json
"Hello nanobot!"
```

```json
{"content": "Hello nanobot!"}
```

可识别字段：`content`、`text`、`message`（按此顺序检查）。无效 JSON 会被视为纯文本。这些帧会路由到连接的默认 `chat_id`（即在 `ready` 中宣布的那个）。

**类型化信封（多会话）：** 任何带有字符串 `type` 字段的 JSON 对象都是类型化信封：

| `type` | 字段 | 作用 |
|--------|------|------|
| `new_chat` | — | 服务器生成新的 `chat_id`，订阅此连接，并回复 `attached`。 |
| `attach` | `chat_id` | 订阅一个现有的 `chat_id`（例如页面刷新后）。回复 `attached`。 |
| `message` | `chat_id`, `content` | 在 `chat_id` 上发送 `content`。首次使用时会自动配对；无需显式 `attach`。 |

完整流程请参见[多会话复用](#multi-chat-multiplexing)。

## 配置参考

所有字段都位于 `config.json` 的 `channels.websocket` 下。

### 连接

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `enabled` | bool | `false` | 启用 WebSocket 服务器。 |
| `host` | string | `"127.0.0.1"` | 绑定地址。使用 `"0.0.0.0"` 可接受外部连接。 |
| `port` | int | `8765` | 监听端口。 |
| `path` | string | `"/"` | WebSocket 升级路径。尾部斜杠会被规范化（根路径 `/` 会保留）。 |
| `maxMessageBytes` | int | `37748736` | 入站消息的最大字节大小（1 KB – 40 MB）。默认值（36 MB）经过设计，可接受最多 4 个 base64 编码的图片附件，每个 8 MB；如果通道只承载文本，可以调低。 |

### 身份验证

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `token` | string | `""` | 静态共享密钥。设置后，客户端必须提供与此密钥匹配的 `?token=<value>`（使用时序安全比较）。签发的 token 也可作为回退接受。 |
| `websocketRequiresToken` | bool | `true` | 当为 `true` 且未配置静态 `token` 时，客户端仍必须提供有效的签发 token。设为 `false` 可允许未认证连接（仅在本地/受信网络中安全）。 |
| `tokenIssuePath` | string | `""` | 用于签发短期 token 的 HTTP 路径。必须与 `path` 不同。参见[Token 签发](#token-issuance)。 |
| `tokenIssueSecret` | string | `""` | 通过签发端点获取 token 所需的密钥。如果为空，任何客户端都可以获取 token（会记录警告）。 |
| `tokenTtlS` | int | `300` | 签发 token 的生存时间，单位为秒（30 – 86,400）。 |

### 访问控制

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `allowFrom` | list of string | `["*"]` | 允许的 `client_id` 值。`"*"` 表示允许全部；`[]` 表示全部拒绝。 |

### 流式传输

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `streaming` | bool | `true` | 启用流式模式。智能体发送 `delta` + `stream_end` 帧，而不是单个 `message`。 |

### 保活

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `pingIntervalS` | float | `20.0` | WebSocket ping 间隔，单位秒（5 – 300）。 |
| `pingTimeoutS` | float | `20.0` | 在关闭连接前等待 pong 的时间，单位秒（5 – 300）。 |

### TLS/SSL

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `sslCertfile` | string | `""` | TLS 证书文件路径（PEM）。启用 WSS 时必须同时设置 `sslCertfile` 和 `sslKeyfile`。 |
| `sslKeyfile` | string | `""` | TLS 私钥文件路径（PEM）。最低 TLS 版本强制为 TLSv1.2。 |

## Token 签发

对于 `websocketRequiresToken: true` 的生产部署，请使用短期 token，而不要在客户端中嵌入静态密钥。

### 工作原理

1. 客户端发送 `GET {tokenIssuePath}`，并带上 `Authorization: Bearer {tokenIssueSecret}`（或 `X-Nanobot-Auth` 头）。
2. 服务器响应一个一次性 token：

```json
{"token": "nbwt_aBcDeFg...", "expires_in": 300}
```

3. 客户端使用 `?token=nbwt_aBcDeFg...&client_id=...` 打开 WebSocket。
4. 该 token 会被消耗（单次使用），不能重复使用。

### 示例设置

```json
{
  "channels": {
    "websocket": {
      "enabled": true,
      "port": 8765,
      "path": "/ws",
      "tokenIssuePath": "/auth/token",
      "tokenIssueSecret": "your-secret-here",
      "tokenTtlS": 300,
      "websocketRequiresToken": true,
      "allowFrom": ["*"],
      "streaming": true
    }
  }
}
```

客户端流程：

```bash
# 1. Obtain a token
curl -H "Authorization: Bearer your-secret-here" http://127.0.0.1:8765/auth/token

# 2. Connect using the token
websocat "ws://127.0.0.1:8765/ws?client_id=alice&token=nbwt_aBcDeFg..."
```

### 限制

- 签发的 token 为单次使用——每个 token 只能完成一次握手。
- 未完成使用的 token 上限为 10,000。超过此数量的请求将返回 HTTP 429。
- 过期 token 会在每次签发或验证请求时懒清理。

## 多会话复用

单个 WebSocket 可以承载多个并发会话。服务器将 `chat_id -> {connections}` 作为一个扇出集合进行跟踪，因此同一个会话也可以在多个连接之间镜像（例如两个浏览器标签页）。
### 典型流程（带侧边栏的 Web UI）

```text
client                                server
  | --- connect -------------------->  |
  | <-- {"event":"ready",              |
  |      "chat_id":"d3..."}   (default)|
  |                                     |
  | --- {"type":"new_chat"} --------->  |
  | <-- {"event":"attached",            |
  |      "chat_id":"a1..."}             |
  |                                     |
  | --- {"type":"message",              |
  |      "chat_id":"a1...",             |
  |      "content":"hi"} ------------>  |
  | <-- {"event":"delta", ...}          |
  | <-- {"event":"stream_end", ...}     |
  |                                     |
  | --- {"type":"attach",               |  # after page reload
  |      "chat_id":"a1..."} --------->  |
  | <-- {"event":"attached", ...}       |
```

### 规则

- 每个出站事件都携带 `chat_id`。客户端必须按该字段进行分发。
- `chat_id` 格式：`^[A-Za-z0-9_:-]{1,64}$`。不匹配的值会返回 `error`。
- `message` 会在首次使用时自动附加——对于服务器创建的聊天（`new_chat`），在同一连接上不需要单独的 `attach`。
- 错误（无效信封、未知 `type`、错误的 `chat_id`）是软错误：服务器会回复 `{"event":"error","detail":"..."}` 并保持连接打开。

### 向后兼容性

仅发送纯文本或 `{"content": ...}` 的旧客户端可以继续正常工作：这些帧会路由到连接的默认 `chat_id`（即来自 `ready` 的那个）。不需要任何配置标志。

### 安全边界

`chat_id` 是一种 *capability*：任何持有有效 WebSocket 身份验证凭据以及该 chat_id 的人，都可以附加到该对话并查看其输出。这对 nanobot 的本地、单用户模型是安全的。多租户部署应按用户对 chat_id 进行命名空间隔离（或引入按租户的认证门禁）——nanobot 目前还没有这样做。

## 安全说明

- **防时序攻击比较**：静态令牌验证使用 `hmac.compare_digest` 以防止时序攻击。
- **纵深防御**：`allowFrom` 在 HTTP 握手级别和消息级别都会被检查。
- **chat_id 作为 capability**：见 [多聊天复用](#multi-chat-multiplexing)。WebSocket 握手上的认证是唯一防线；通过认证的调用方可以附加到其知道的任何 chat_id。
- **TLS 强制**：启用 SSL 时，TLSv1.2 是允许的最低版本。
- **默认安全**：`websocketRequiresToken` 默认为 `true`。仅在受信任网络上才显式将其设为 `false`。

## 媒体文件

出站 `message` 事件可能包含一个 `media` 字段，其中包含本地文件系统路径。远程客户端无法直接访问这些文件——它们需要以下任一方式：

- 共享文件系统挂载，或
- 提供 nanobot 媒体目录的 HTTP 文件服务器

## 常见模式

### 受信任的本地网络（无认证）

```json
{
  "channels": {
    "websocket": {
      "enabled": true,
      "host": "0.0.0.0",
      "port": 8765,
      "websocketRequiresToken": false,
      "allowFrom": ["*"],
      "streaming": true
    }
  }
}
```

### 静态令牌（简单认证）

```json
{
  "channels": {
    "websocket": {
      "enabled": true,
      "token": "my-shared-secret",
      "allowFrom": ["alice", "bob"]
    }
  }
}
```

客户端使用 `?token=my-shared-secret&client_id=alice` 连接。

### 使用签发令牌的公共端点

```json
{
  "channels": {
    "websocket": {
      "enabled": true,
      "host": "0.0.0.0",
      "port": 8765,
      "path": "/ws",
      "tokenIssuePath": "/auth/token",
      "tokenIssueSecret": "production-secret",
      "websocketRequiresToken": true,
      "sslCertfile": "/etc/ssl/certs/server.pem",
      "sslKeyfile": "/etc/ssl/private/server-key.pem",
      "allowFrom": ["*"]
    }
  }
}
```

### 自定义路径

```json
{
  "channels": {
    "websocket": {
      "enabled": true,
      "path": "/chat/ws",
      "allowFrom": ["*"]
    }
  }
}
```

客户端连接到 `ws://127.0.0.1:8765/chat/ws?client_id=...`。尾随斜杠会被规范化，因此 `/chat/ws/` 的效果相同。
