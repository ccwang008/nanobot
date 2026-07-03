<!-- 本文件由 docs/channel-plugin-guide.md 翻译生成；原文仍保留在上级目录。 -->

# 通道插件指南

只需三步即可构建自定义 nanobot 通道：继承、打包、安装。

> **注意：** 我们建议基于 nanobot 的源代码检出（`python -m pip install -e .`）来开发通道插件，而不是使用 PyPI 发行版，这样你始终可以访问最新的基础通道功能和 API。

## 工作原理

nanobot 通过 Python [入口点](https://packaging.python.org/en/latest/specifications/entry-points/) 发现通道插件。当 `nanobot gateway` 启动时，它会扫描：

1. `nanobot/channels/` 中的内置通道
2. 在 `nanobot.channels` 入口点组下注册的外部包

如果某个匹配的配置段具有 `"enabled": true`，则会实例化并启动该通道。

## 快速开始

我们将构建一个最小的 webhook 通道，它通过 HTTP POST 接收消息，并将回复发回。

### 项目结构

```text
nanobot-channel-webhook/
├── nanobot_channel_webhook/
│   ├── __init__.py          # re-export WebhookChannel
│   └── channel.py           # channel implementation
└── pyproject.toml
```

### 1. 创建你的通道

```python
# nanobot_channel_webhook/__init__.py
from nanobot_channel_webhook.channel import WebhookChannel

__all__ = ["WebhookChannel"]
```

```python
# nanobot_channel_webhook/channel.py
import asyncio
from typing import Any

from aiohttp import web
from loguru import logger
from pydantic import Field

from nanobot.channels.base import BaseChannel
from nanobot.bus.events import OutboundMessage
from nanobot.bus.queue import MessageBus
from nanobot.config.schema import Base


class WebhookConfig(Base):
    """Webhook channel configuration."""
    enabled: bool = False
    port: int = 9000
    allow_from: list[str] = Field(default_factory=list)


class WebhookChannel(BaseChannel):
    name = "webhook"
    display_name = "Webhook"

    def __init__(self, config: Any, bus: MessageBus):
        if isinstance(config, dict):
            config = WebhookConfig(**config)
        super().__init__(config, bus)

    @classmethod
    def default_config(cls) -> dict[str, Any]:
        return WebhookConfig().model_dump(by_alias=True)

    async def start(self) -> None:
        """Start an HTTP server that listens for incoming messages.

        IMPORTANT: start() must block forever (or until stop() is called).
        If it returns, the channel is considered dead.
        """
        self._running = True
        port = self.config.port

        app = web.Application()
        app.router.add_post("/message", self._on_request)
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", port)
        await site.start()
        logger.info("Webhook listening on :{}", port)

        # Block until stopped
        while self._running:
            await asyncio.sleep(1)

        await runner.cleanup()

    async def stop(self) -> None:
        self._running = False

    async def send(self, msg: OutboundMessage) -> None:
        """Deliver an outbound message.

        msg.content  — markdown text (convert to platform format as needed)
        msg.media    — list of local file paths to attach
        msg.chat_id  — the recipient (same chat_id you passed to _handle_message)
        msg.metadata — channel routing context such as message/thread ids
        msg.event    — typed runtime event for progress/status messages
        """
        logger.info("[webhook] -> {}: {}", msg.chat_id, msg.content[:80])
        # In a real plugin: POST to a callback URL, send via SDK, etc.

    async def _on_request(self, request: web.Request) -> web.Response:
        """Handle an incoming HTTP POST."""
        body = await request.json()
        sender = body.get("sender", "unknown")
        chat_id = body.get("chat_id", sender)
        text = body.get("text", "")
        media = body.get("media", [])       # list of URLs

        # This is the key call: validates allowFrom, then puts the
        # message onto the bus for the agent to process.
        await self._handle_message(
            sender_id=sender,
            chat_id=chat_id,
            content=text,
            media=media,
        )

        return web.json_response({"ok": True})
```

### 2. 注册入口点

```toml
# pyproject.toml
[project]
name = "nanobot-channel-webhook"
version = "0.1.0"
dependencies = ["nanobot-ai", "aiohttp"]

[project.entry-points."nanobot.channels"]
webhook = "nanobot_channel_webhook:WebhookChannel"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["nanobot_channel_webhook"]
```

键（`webhook`）会变成配置段名称。值指向你的 `BaseChannel` 子类。

### 3. 安装并配置

```bash
python -m pip install -e .
nanobot plugins list      # verify "Webhook" shows as "plugin"
nanobot onboard           # auto-adds default config for detected plugins
```

编辑 `~/.nanobot/config.json`：

```json
{
  "channels": {
    "webhook": {
      "enabled": true,
      "port": 9000,
      "allowFrom": ["*"]
    }
  }
}
```

### 4. 运行并测试

```bash
nanobot gateway
```

在另一个终端中：

```bash
curl -X POST http://localhost:9000/message \
  -H "Content-Type: application/json" \
  -d '{"sender": "user1", "chat_id": "user1", "text": "Hello!"}'
```

智能体接收消息并进行处理。回复会到达你的 `send()` 方法。

## BaseChannel API

### 必需（抽象）

| 方法 | 描述 |
|--------|-------------|
| `async start()` | **必须永远阻塞。** 连接到平台，监听消息，对每条消息调用 `_handle_message()`。如果这里返回了，通道就已经失效。 |
| `async stop()` | 设置 `self._running = False` 并进行清理。在 gateway 关闭时调用。 |
| `async send(msg: OutboundMessage)` | 将出站消息发送到平台。 |

### 交互式登录

如果你的通道需要交互式认证（例如扫描二维码），请重写 `login(force=False)`：

```python
async def login(self, force: bool = False) -> bool:
    """
    Perform channel-specific interactive login.

    Args:
        force: If True, ignore existing credentials and re-authenticate.

    Returns True if already authenticated or login succeeds.
    """
    # For QR-code-based login:
    # 1. If force, clear saved credentials
    # 2. Check if already authenticated (load from disk/state)
    # 3. If not, show QR code and poll for confirmation
    # 4. Save token on success
```

不需要交互式登录的通道（例如带 bot token 的 Telegram、带 bot token 的 Discord）会继承默认的 `login()`，它只会返回 `True`。

用户通过以下方式触发交互式登录：
```bash
nanobot channels login <channel_name>
nanobot channels login <channel_name> --force  # re-authenticate
```

### Base 提供

| 方法 / 属性 | 描述 |
|-------------------|-------------|
| `_handle_message(sender_id, chat_id, content, media?, metadata?, session_key?)` | **收到消息时调用此方法。** 检查 `is_allowed()`，然后发布到总线。如果 `supports_streaming` 为 true，则会自动设置 `_wants_stream`。 |
| `is_allowed(sender_id)` | 基于 `config.allow_from` 进行检查；`"*"` 放行所有，`[]` 拒绝所有。 |
| `default_config()` (classmethod) | 返回 `nanobot onboard` 的默认 config 字典。重写它以声明你的字段。 |
| `transcribe_audio(file_path)` | 通过共享的顶层 `transcription` 配置转写音频（如果已配置）。 |
| `supports_streaming` (property) | 当 config 具有 `"streaming": true` **且** 子类重写了 `send_delta()` 时返回 `True`。 |
| `is_running` | 返回 `self._running`。 |
| `login(force=False)` | 执行交互式登录（例如扫描二维码）。如果已通过认证或登录成功，则返回 `True`。支持交互式登录的子类应重写此方法。 |
| `send_reasoning_delta(chat_id, delta, metadata?, *, stream_id?)` | 面向流式模型推理/思考内容的可选钩子。默认无操作。 |
| `send_reasoning_end(chat_id, metadata?, *, stream_id?)` | 标记一个推理块结束的可选钩子。默认无操作。 |
| `send_reasoning(msg)` | 可选的一次性推理回退。默认会转换为 `send_reasoning_delta()` + `send_reasoning_end()`。 |

### 可选（流式）

| 方法 | 描述 |
|--------|-------------|
| `async send_delta(chat_id, delta, metadata?, *, stream_id?, stream_end=False, resuming=False)` | 重写以接收流式分块。详见 [流式支持](#streaming-support)。 |

### 消息类型

```python
@dataclass
class OutboundMessage:
    channel: str        # your channel name
    chat_id: str        # recipient (same value you passed to _handle_message)
    content: str        # markdown text — convert to platform format as needed
    media: list[str]    # local file paths to attach (images, audio, docs)
    metadata: dict      # channel routing context, e.g. "message_id" for threading
    event: object | None # typed runtime/UI event; usually inspect with isinstance()
```

运行时/UI 语义位于 `msg.event` 上。插件作者生成的出站消息应使用类型化事件，而不是诸如 `_progress`、`_stream_delta`、`_stream_end`、`_reasoning_delta`、`_turn_end` 或 `_goal_status` 之类的旧版元数据标志。nanobot 仍然接受这些旧标志，作为对现有进程内扩展的兼容桥梁，但新的插件代码不应再对它们产生新的依赖。

## 流式支持

通道可以启用实时流式输出——智能体会逐 token 发送内容，而不是一次性发送最终消息。这完全是可选的；即使不启用，通道也能正常工作。

### 工作原理

当同时满足**两个**条件时，智能体会通过你的通道流式发送内容：

1. config 具有 `"streaming": true`
2. 你的子类重写了 `send_delta()`

如果任一条件缺失，智能体会回退到正常的一次性 `send()` 路径。

### 实现 `send_delta`

重写 `send_delta` 来处理两种调用类型：

```python
async def send_delta(
    self,
    chat_id: str,
    delta: str,
    metadata: dict[str, Any] | None = None,
    *,
    stream_id: str | None = None,
    stream_end: bool = False,
    resuming: bool = False,
) -> None:
    buffer_key = stream_id or chat_id
    if stream_end:
        # Streaming finished — do final formatting, cleanup, etc.
        return

    # Regular delta — append text, update the message on screen
    # delta contains a small chunk of text (a few tokens)
```

流式状态通过仅限关键字参数传递，而不是通过 `_stream_delta` 或 `_stream_end` 元数据标志。使用 `stream_id` 为每个流缓冲区建立键；如果它缺失，则回退到 `chat_id`。

### 示例：带流式的 webhook

```python
class WebhookChannel(BaseChannel):
    name = "webhook"
    display_name = "Webhook"

    def __init__(self, config: Any, bus: MessageBus):
        if isinstance(config, dict):
            config = WebhookConfig(**config)
        super().__init__(config, bus)
        self._buffers: dict[str, str] = {}

    async def send_delta(
        self,
        chat_id: str,
        delta: str,
        metadata: dict[str, Any] | None = None,
        *,
        stream_id: str | None = None,
        stream_end: bool = False,
        resuming: bool = False,
    ) -> None:
        buffer_key = stream_id or chat_id
        if stream_end:
            text = self._buffers.pop(buffer_key, "")
            # Final delivery — format and send the complete message
            await self._deliver(chat_id, text, final=True)
            return

        self._buffers.setdefault(buffer_key, "")
        self._buffers[buffer_key] += delta
        # Incremental update — push partial text to the client
        await self._deliver(chat_id, self._buffers[buffer_key], final=False)

    async def send(self, msg: OutboundMessage) -> None:
        # Non-streaming path — unchanged
        await self._deliver(msg.chat_id, msg.content, final=True)
```

### 配置

为每个通道启用流式：

```json
{
  "channels": {
    "webhook": {
      "enabled": true,
      "streaming": true,
      "allowFrom": ["*"]
    }
  }
}
```

当 `streaming` 为 `false`（默认）或省略时，只会调用 `send()` —— 不会有流式开销。

### BaseChannel 流式 API

| 方法 / 属性 | 描述 |
|-------------------|-------------|
| `async send_delta(chat_id, delta, metadata?, *, stream_id?, stream_end=False, resuming=False)` | 重写以处理流式分块。默认无操作。 |
| `supports_streaming` (property) | 当 config 具有 `streaming: true` **且** 子类重写了 `send_delta` 时返回 `True`。 |

## 进度、工具提示和推理

除了正常的助手文本之外，nanobot 还可以输出低强调度的追踪块。这些内容面向诸如状态行、可折叠的“已使用工具”分组，或推理/思考块之类的 UI 表现形式。不适合放置这些内容的平台可以安全地忽略它们。

### 进度和工具提示

进度和工具提示会通过正常的 `send(msg)` 路径到达。渲染前请检查 `msg.event`：

```python
from nanobot.bus.outbound_events import ProgressEvent

async def send(self, msg: OutboundMessage) -> None:
    event = msg.event

    if isinstance(event, ProgressEvent) and event.tool_hint:
        # A short tool breadcrumb, e.g. read_file("config.json")
        await self._send_trace(msg.chat_id, msg.content, kind="tool")
        return

    if isinstance(event, ProgressEvent):
        # Generic non-final status, e.g. "Thinking..." or "Running command..."
        await self._send_trace(msg.chat_id, msg.content, kind="progress")
        return

    await self._send_message(msg.chat_id, msg.content, media=msg.media)
```

对于大多数通道，工具提示默认关闭。用户可以全局启用，也可以按通道启用：

```json
{
  "channels": {
    "sendToolHints": true,
    "webhook": {
      "enabled": true,
      "sendToolHints": true
    }
  }
}
```

### 推理块

推理通过专用的可选钩子传递，而不是通过 `send()`。如果你的平台可以将模型推理显示为一个低调/可折叠的块，请重写 `send_reasoning_delta()` 和 `send_reasoning_end()`。默认实现是无操作，因此不支持的通道会直接丢弃推理内容。

```python
class WebhookChannel(BaseChannel):
    name = "webhook"
    display_name = "Webhook"

    def __init__(self, config: Any, bus: MessageBus):
        if isinstance(config, dict):
            config = WebhookConfig(**config)
        super().__init__(config, bus)
        self._reasoning_buffers: dict[str, str] = {}

    async def send_reasoning_delta(
        self,
        chat_id: str,
        delta: str,
        metadata: dict[str, Any] | None = None,
        *,
        stream_id: str | None = None,
    ) -> None:
        buffer_key = stream_id or chat_id
        self._reasoning_buffers[buffer_key] = self._reasoning_buffers.get(buffer_key, "") + delta
        await self._update_reasoning_block(chat_id, self._reasoning_buffers[buffer_key], final=False)

    async def send_reasoning_end(
        self,
        chat_id: str,
        metadata: dict[str, Any] | None = None,
        *,
        stream_id: str | None = None,
    ) -> None:
        buffer_key = stream_id or chat_id
        text = self._reasoning_buffers.pop(buffer_key, "")
        if text:
            await self._update_reasoning_block(chat_id, text, final=True)
```

**推理参数：**

| 参数 | 含义 |
|------|---------|
| `delta` | 用于 `send_reasoning_delta()` 的推理/思考分块。 |
| `stream_id` | 此次 assistant 回合/片段的稳定 id。用它来为缓冲区建立键，而不要只依赖 `chat_id`。 |
| `send_reasoning_end()` | 当前推理块已完成。 |

推理可见性由全局或按通道的 `showReasoning` 控制：

```json
{
  "channels": {
    "showReasoning": true,
    "webhook": {
      "enabled": true,
      "showReasoning": true
    }
  }
}
```

建议的渲染方式：

- 将工具提示和进度渲染为追踪/状态 UI，而不是正常的 assistant 回复。
- 推理应使用更低的视觉强调度，在平台支持时于完成后将其折叠。
- 将推理与最终答案文本分开。最终答案仍会通过 `send()` 或 `send_delta()` 到达。

## 配置

### 为什么需要 Pydantic model

`BaseChannel.is_allowed()` 通过 `getattr(self.config, "allow_from", [])` 读取权限列表。这对于 Pydantic model 是有效的，因为 `allow_from` 是真实的 Python 属性，但对普通 `dict` 会**静默失败**——`dict` 没有 `allow_from` 属性，因此 `getattr` 总是返回默认的 `[]`，导致所有消息都被拒绝。

内置通道使用 Pydantic config models（继承自 `Base` 的 `nanobot.config.schema`）。插件通道**必须也这样做**。

### 模式

1. 定义一个继承自 `nanobot.config.schema.Base` 的 Pydantic model：

```python
from pydantic import Field
from nanobot.config.schema import Base

class WebhookConfig(Base):
    """Webhook channel configuration."""
    enabled: bool = False
    port: int = 9000
    allow_from: list[str] = Field(default_factory=list)
```

`Base` 通过 `alias_generator=to_camel` 和 `populate_by_name=True` 进行配置，因此像 `"allowFrom"` 和 `"allow_from"` 这样的 JSON 键都可以接受。

2. 在 `__init__` 中将 `dict` → model：

```python
from typing import Any
from nanobot.bus.queue import MessageBus

class WebhookChannel(BaseChannel):
    def __init__(self, config: Any, bus: MessageBus):
        if isinstance(config, dict):
            config = WebhookConfig(**config)
        super().__init__(config, bus)
```

3. 以属性方式访问 config（而不是 `.get()`）：

```python
async def start(self) -> None:
    port = self.config.port
    token = self.config.token
```

`allowFrom` 会由 `_handle_message()` 自动处理——你不需要自己检查它。

重写 `default_config()`，使 `nanobot onboard` 自动填充 `config.json`：

```python
@classmethod
def default_config(cls) -> dict[str, Any]:
    return WebhookConfig().model_dump(by_alias=True)
```

> **注意：** `default_config()` 返回的是普通 `dict`（而不是 Pydantic model），因为它用于序列化为 `config.json`。推荐的方式是实例化你的 config model 并调用 `model_dump(by_alias=True)` ——这会自动使用 camelCase 键（`allowFrom`），并将默认值保留在单一事实来源中。

如果未重写，基类会返回 `{"enabled": false}`。

## 命名约定

| 内容 | 格式 | 示例 |
|------|---------|------|
| PyPI 包 | `nanobot-channel-{name}` | `nanobot-channel-webhook` |
| 入口点键 | `{name}` | `webhook` |
| 配置段 | `channels.{name}` | `channels.webhook` |
| Python 包 | `nanobot_channel_{name}` | `nanobot_channel_webhook` |

## 本地开发

```bash
git clone https://github.com/you/nanobot-channel-webhook
cd nanobot-channel-webhook
python -m pip install -e .
nanobot plugins list    # should show "Webhook" as "plugin"
nanobot gateway         # test end-to-end
```

## 验证

```bash
$ nanobot plugins list

  Name       Source    Enabled
  telegram   builtin  yes
  discord    builtin  no
  webhook    plugin   yes
```

