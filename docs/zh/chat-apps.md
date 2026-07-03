<!-- 本文件由 docs/chat-apps.md 翻译生成；原文仍保留在上级目录。 -->

# 聊天应用

将 nanobot 连接到你最喜欢的聊天平台。想自己构建一个？请参阅 [通道插件指南](./channel-plugin-guide.md)。

在配置聊天应用之前，请确保本地 CLI 路径可用：

```bash
nanobot agent -m "Hello!"
```

如果失败，请先使用 [`quick-start.md`](./quick-start.md)、[`providers.md`](./providers.md) 和 [`troubleshooting.md`](./troubleshooting.md) 修复安装、配置、提供商或模型设置。聊天应用要求 `nanobot gateway` 在通道配置后保持运行。

下面的大多数示例都是要合并到 `~/.nanobot/config.json` 中的片段。
## 常见设置模式

每个聊天应用都使用相同的结构：

1. 在聊天平台中创建或准备机器人/账号。
2. 复制该平台提供的令牌、密钥、二维码登录状态、webhook URL 或账号 ID。
3. 将该平台的 JSON 片段合并到 `~/.nanobot/config.json` 中。
4. 一开始用 `allowFrom` 或平台特定的允许列表将访问控制范围收窄。
5. 检查 nanobot 是否能看到已配置的通道：

```bash
nanobot channels status
```

6. 启动网关并让那个终端保持运行：

```bash
nanobot gateway
```

7. 从允许的账号发送消息。在群聊中，遵循该通道的 `groupPolicy` 行为：许多通道默认仅允许提及回复，而 Matrix 和 WhatsApp 默认对群组回复开放。

如果 `nanobot channels status` 没有显示该通道已启用，说明配置片段放错了位置、通道名称拼写有误，或者你编辑的配置文件不是 nanobot 正在读取的那个。如果通道已启用但消息仍未到达，请运行 `nanobot gateway --verbose` 并对比平台侧凭据、事件权限以及允许列表。

> `["*"]` 允许任何能够访问该通道的人与机器人对话。只有在这是你有意为之时才使用它，或者在私有沙盒中测试时临时使用。

| 通道 | 你需要什么 |
|---------|---------------|
| **Telegram** | 来自 @BotFather 的机器人令牌 |
| **Discord** | 机器人令牌 + Message Content intent |
| **WhatsApp** | 扫描二维码（`nanobot channels login whatsapp`） |
| **WeChat (Weixin)** | 扫描二维码（`nanobot channels login weixin`） |
| **Feishu** | 扫描二维码（`nanobot channels login feishu`）或 App ID + App Secret |
| **DingTalk** | App Key + App Secret |
| **Slack** | 机器人令牌 + App-Level token |
| **Matrix** | Homeserver URL + Access token |
| **Email** | IMAP/SMTP 凭据 |
| **QQ** | App ID + App Secret |
| **Napcat (QQ)** | Napcat Forward WebSocket URL + access token |
| **Wecom** | Bot ID + Bot Secret |
| **Microsoft Teams** | App ID + App Password + 公共 HTTPS 端点 |
| **Mochat** | Claw token（支持自动设置） |
| **Signal** | signal-cli 守护进程 + 手机号 |

<details>
<summary><b>Telegram</b></summary>

**1. 创建机器人**
- 打开 Telegram，搜索 `@BotFather`
- 发送 `/newbot`，按提示操作
- 复制令牌

**2. 配置**

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "token": "YOUR_BOT_TOKEN",
      "allowFrom": ["YOUR_USER_ID"]
    }
  }
}
```

> 你可以在 Telegram 设置中找到你的 **User ID**。它显示为 `@yourUserId`。复制该值时**不要带上 `@` 符号**，并将其粘贴到配置文件中。
>
> `richMessages` 默认值为 `false`。只有当你的 Telegram 客户端支持 Bot API 10.1 富消息并且你希望获得更丰富的 markdown 渲染时，才将其设置为 `true`；对于 Telegram Web 请保持禁用，因为富消息可能会显示不支持消息的错误。


**3. 运行**

```bash
nanobot gateway
```

**Webhook 模式（可选）**

Telegram 默认使用长轮询。若要通过 webhook 接收更新，请暴露一个公共 HTTPS URL，将其转发到 nanobot 的本地监听器，并将 `mode` 设置为 `webhook`：

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "token": "YOUR_BOT_TOKEN",
      "mode": "webhook",
      "webhookUrl": "https://example.com/telegram",
      "webhookListenHost": "127.0.0.1",
      "webhookListenPort": 8081,
      "webhookPath": "/telegram",
      "webhookSecretToken": "CHANGE_ME_RANDOM_SECRET",
      "webhookMaxConnections": 4,
      "allowFrom": ["YOUR_USER_ID"]
    }
  }
}
```

> Webhook 模式下需要 `webhookSecretToken`。不要在没有反向代理或隧道保护的情况下将本地 webhook 监听器直接暴露到公共互联网。TLS/Host 策略由你的代理处理；nanobot 只监听 `webhookListenHost:webhookListenPort` 并验证 Telegram 的 webhook secret token。`webhookMaxConnections` 默认为 `4`；nanobot 仍会在转发给智能体之前按会话对 Telegram 更新进行串行化处理。
>
> `webhookUrl` 是向 Telegram 注册的公共 HTTPS URL。`webhookPath` 是 nanobot 监听的本地路径。它们通常使用相同的路径，但在反向代理或隧道重写请求路径时可能不同。

</details>

<details>
<summary><b>Mochat (Claw IM)</b></summary>

默认使用 **Socket.IO WebSocket**，并在 HTTP 轮询失败时回退。

**1. 让 nanobot 为你设置 Mochat**

只需将这条消息发送给 nanobot（将 `xxx@xxx` 替换为你的真实邮箱）：

```
Read https://raw.githubusercontent.com/HKUDS/MoChat/refs/heads/main/skills/nanobot/skill.md and register on MoChat. My Email account is xxx@xxx Bind me as your owner and DM me on MoChat.
```

nanobot 将自动注册、配置 `~/.nanobot/config.json`，并连接到 Mochat。

**2. 重启网关**

```bash
nanobot gateway
```

就这样 —— 其余部分由 nanobot 处理！

<br>

<details>
<summary>手动配置（高级）</summary>

如果你更愿意手动配置，请将以下内容添加到 `~/.nanobot/config.json` 中：

> 请保持 `claw_token` 私密。它只应作为 `X-Claw-Token` header 发送到你的 Mochat API 端点。

```json
{
  "channels": {
    "mochat": {
      "enabled": true,
      "base_url": "https://mochat.io",
      "socket_url": "https://mochat.io",
      "socket_path": "/socket.io",
      "claw_token": "claw_xxx",
      "agent_user_id": "6982abcdef",
      "sessions": ["*"],
      "panels": ["*"],
      "reply_delay_mode": "non-mention",
      "reply_delay_ms": 120000
    }
  }
}
```



</details>

</details>

<details>
<summary><b>Discord</b></summary>

**1. 创建机器人**
- 前往 https://discord.com/developers/applications
- 创建 application → Bot → Add Bot
- 复制机器人令牌

**2. 启用 intents**
- 在 Bot 设置中启用 **MESSAGE CONTENT INTENT**
- （可选）如果你计划使用基于成员数据的允许列表，启用 **SERVER MEMBERS INTENT**

**3. 获取你的 User ID**
- Discord 设置 → Advanced → 启用 **Developer Mode**
- 右键单击你的头像 → **Copy User ID**

**4. 配置**

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "token": "YOUR_BOT_TOKEN",
      "allowFrom": ["YOUR_USER_ID"],
      "allowChannels": [],
      "groupPolicy": "mention",
      "streaming": true
    }
  }
}
```

> `groupPolicy` 控制机器人在群组通道中的响应方式：
> - `"mention"`（默认）—— 仅在被 @ 提及时响应
> - `"open"`—— 响应所有消息
> 当发送者在 `allowFrom` 中时，DM 总会响应。
> - 如果你将群组策略设置为 open，请新建线程为私有线程，然后在其中 @ 机器人。否则，线程本身以及你创建它的通道都会触发一个机器人会话。
> `allowChannels` 将机器人限制为特定的 Discord 通道 ID。留空（默认）表示响应机器人可见的每个通道。示例：`["1234567890", "0987654321"]`。该过滤器在 `allowFrom` 之后应用，因此两者都必须通过。允许的父通道下的 Discord 线程也同样被允许；对于 Forum 通道，允许父 Forum 通道即表示允许该论坛中的所有线程/帖子。
> `streaming` 默认值为 `true`。只有在你明确希望非流式回复时才禁用它。

**5. 邀请机器人**
- OAuth2 → URL Generator
- Scopes: `bot`
- Bot Permissions: `Send Messages`, `Read Message History`
- 打开生成的邀请 URL，将机器人添加到你的服务器

**6. 运行**

```bash
nanobot gateway
```

</details>

<details>
<summary><b>Matrix (Element)</b></summary>

先安装 Matrix 依赖：

```bash
python -m pip install "nanobot-ai[matrix]"
```

> [!NOTE]
> Windows 不支持 Matrix。`matrix-nio[e2e]` 依赖于 `python-olm`，它没有预构建的 Windows wheel，并且会被 `matrix` extra 在 `sys_platform == 'win32'` 上跳过。上述命令在 Windows 上仍会成功，但不会安装 `matrix-nio`，因此启用 Matrix 通道时启动会失败。请使用 macOS、Linux 或 WSL2。

**1. 创建/选择一个 Matrix 账号**

- 在你的 homeserver 上创建或复用一个 Matrix 账号（例如 `matrix.org`）。
- 确认你可以使用 Element 登录。

**2. 获取凭据**

- 你需要：
  - `userId`（示例：`@nanobot:matrix.org`）
  - `password`

（注意：出于兼容旧版本的原因，`accessToken` 和 `deviceId` 仍受支持，但为了可靠的加密，推荐改用密码登录。如果提供了 `password`，`accessToken` 和 `deviceId` 将被忽略。）

**3. 配置**

```json
{
  "channels": {
    "matrix": {
      "enabled": true,
      "homeserver": "https://matrix.org",
      "userId": "@nanobot:matrix.org",
      "password": "mypasswordhere",
      "e2eeEnabled": true,
      "sasVerification": true,
      "allowFrom": ["@your_user:matrix.org"],
      "groupPolicy": "open",
      "groupAllowFrom": [],
      "allowRoomMentions": false,
      "maxMediaBytes": 20971520
    }
  }
}
```

> 请保留一个持久的 `matrix-store` —— 如果这些值在重启之间发生变化，加密会话状态将丢失。

| 选项 | 说明 |
|--------|-------------|
| `allowFrom` | 允许交互的 User ID。留空表示拒绝所有人；使用 `["*"]` 允许所有人。 |
| `groupPolicy` | `open`（默认）、`mention` 或 `allowlist`。 |
| `groupAllowFrom` | 房间允许列表（当策略为 `allowlist` 时使用）。 |
| `allowRoomMentions` | 在提及模式下接受 `@room` 提及。 |
| `e2eeEnabled` | E2EE 支持（默认 `true`）。设置为 `false` 可仅限明文。 |
| `sasVerification` | 自动完成来自允许用户的 SAS 设备验证请求（默认 `false`）。对 Element X 很有用，因为它不提供对第三方设备的手动信任。 |
| `maxMediaBytes` | 最大附件大小（默认 `20MB`）。设置为 `0` 可阻止所有媒体。 |




**4. 运行**

```bash
nanobot gateway
```

</details>

<details>
<summary><b>WhatsApp</b></summary>

需要 WhatsApp 可选依赖项：

```bash
pip install "nanobot-ai[whatsapp]"
# Source checkout:
python -m pip install -e ".[whatsapp]"
```

**1. 通过二维码绑定设备**

```bash
nanobot channels login whatsapp
# Scan QR with WhatsApp → Settings → Linked Devices
```

**2. 配置**

```json
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "allowFrom": ["1234567890"]
    }
  }
}
```

可选的会话数据库路径：

```json
{
  "channels": {
    "whatsapp": {
      "databasePath": "~/.nanobot/whatsapp-auth/neonize.db"
    }
  }
}
```

**从旧桥接迁移**

- 删除 `bridgeUrl` 和 `bridgeToken`；WhatsApp 不再运行本地 Node.js 桥接。
- 重新运行 `nanobot channels login whatsapp`；旧的 Baileys bridge 认证数据不会被 neonize 复用。
- 将 `allowFrom` 条目更新为不带前导 `+` 的 WhatsApp 发送者 ID。

**3. 运行**

```bash
nanobot gateway
```

**可选：静态 LID 映射**

现代 WhatsApp 可能会传递发送者的 LID，而不是他们的手机号。nanobot 会在运行时于两种标识符都存在时学习 LID 到手机号的映射，但你也可以提前种入映射，这样从
第一条消息开始就能解析出手机号：

```json
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "allowFrom": ["1234567890"],
      "lidMappings": { "123456789012345": "1234567890" }
    }
  }
}
```

</details>

<details>
<summary><b>Feishu</b></summary>

默认使用 **WebSocket** 长连接——无需公网 IP。

**快速设置：二维码登录**

```bash
nanobot channels login feishu
# Use --force to create/sign in with a new bot
```

在手机上打开打印出的 URL，或使用 Feishu/Lark 扫描二维码。如果安装了可选的 `qrcode` 包，nanobot 会显示终端二维码；否则会打印登录 URL。nanobot 会将 `appId`、`appSecret`、`domain` 和 `enabled` 写入活动配置文件中的 `channels.feishu` 下。使用 `--config <path>` 更新非默认配置。

如果你的账号不可用二维码登录，请使用下面的手动设置。

**手动设置**

**1. 创建 Feishu 机器人**
- 访问 [Feishu Open Platform](https://open.feishu.cn/app)
- 创建新应用 → 启用 **Bot** 能力
- **权限**：
  - `im:message`（发送消息）和 `im:message.p2p_msg:readonly`（接收消息）
  - **Streaming replies**（nanobot 中的默认项）：添加 **`cardkit:card:write`**（在 Feishu 开发者控制台中通常标记为 **Create and update cards**）。这是 CardKit 实体和流式助手文本所必需的。较旧的应用可能尚未包含此项——打开 **Permission management**，启用该作用域，然后如果控制台要求，**发布**一个新的应用版本。
  - 如果你**无法**添加 `cardkit:card:write`，请将 `"streaming": false` 设为 `channels.feishu`（见下文）。机器人仍可正常工作；回复将使用普通交互卡片，而不是逐 token 流式输出。
- **事件**：添加 `im.message.receive_v1`（接收消息）
- 选择 **长连接** 模式（需要先运行 nanobot 以建立连接）
- 从“Credentials & Basic Info”获取 **App ID** 和 **App Secret**
- 发布应用

**2. 配置**

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "cli_xxx",
      "appSecret": "xxx",
      "encryptKey": "",
      "verificationToken": "",
      "allowFrom": ["ou_YOUR_OPEN_ID"],
      "groupPolicy": "mention",
      "reactEmoji": "OnIt",
      "doneEmoji": "DONE",
      "toolHintPrefix": "🔧",
      "streaming": true,
      "domain": "feishu"
    }
  }
}
```

> `streaming` 默认值为 `true`。如果你的应用没有 **`cardkit:card:write`**（见上方权限），请使用 `false`。
> `encryptKey` 和 `verificationToken` 在长连接模式下是可选的。
> `allowFrom`：添加你的 open_id（当你给机器人发消息时，可在 nanobot 日志中找到）。使用 `["*"]` 允许所有用户。
> `groupPolicy`：`"mention"`（默认——仅在被 @ 提及时响应），`"open"`（响应所有群消息）。私聊始终会响应。
> `reactEmoji`：用于“处理中”状态的表情（默认：`OnIt`）。参见 [可用表情](https://open.larkoffice.com/document/server-docs/im-v1/message-reaction/emojis-introduce)。
> `doneEmoji`：可选的“已完成”状态表情（例如 `DONE`、`OK`、`HEART`）。设置后，机器人会在移除 `reactEmoji` 后添加该反应。
> `toolHintPrefix`：流式卡片中内联工具提示的前缀（默认：`🔧`）。
> `domain`：`"feishu"`（默认）用于中国区（open.feishu.cn），`"lark"` 用于国际版 Lark（open.larksuite.com）。

**3. 运行**

```bash
nanobot gateway
```

> [!TIP]
> Feishu 使用 WebSocket 接收消息——无需 webhook 或公网 IP！

</details>

<details>
<summary><b>QQ（QQ单聊）</b></summary>

使用 **botpy SDK** 通过 WebSocket 连接——不需要公网 IP。目前仅支持 **私聊**。

**1. 注册并创建机器人**
- 访问 [QQ Open Platform](https://q.qq.com) → 注册为开发者（个人或企业）
- 创建新的机器人应用
- 进入 **开发设置 (Developer Settings)** → 复制 **AppID** 和 **AppSecret**

**2. 为测试设置沙箱**
- 在机器人管理控制台中，找到 **沙箱配置 (Sandbox Config)**
- 在 **在消息列表配置** 下，点击 **添加成员** 并添加你自己的 QQ 号码
- 添加后，用手机 QQ 扫描机器人的二维码 → 打开机器人资料页 → 点击“发消息”开始聊天

**3. 配置**

> - `allowFrom`：添加你的 openid（当你给机器人发消息时，可在 nanobot 日志中找到）。使用 `["*"]` 允许公开访问。
> - `msgFormat`：可选。为获得与旧版 QQ 客户端的最大兼容性，使用 `"plain"`（默认）；或者使用 `"markdown"` 以便在新版客户端获得更丰富的格式。
> - 生产环境：在机器人控制台提交审核并发布。有关完整发布流程，请参见 [QQ Bot Docs](https://bot.q.qq.com/wiki/)。

```json
{
  "channels": {
    "qq": {
      "enabled": true,
      "appId": "YOUR_APP_ID",
      "secret": "YOUR_APP_SECRET",
      "allowFrom": ["YOUR_OPENID"],
      "msgFormat": "plain"
    }
  }
}
```

**4. 运行**

```bash
nanobot gateway
```

现在从 QQ 给机器人发送一条消息——它应该会响应！

</details>

<details>
<summary><b>Napcat（通过 OneBot v11 支持群聊等功能）</b></summary>

通过其 **forward WebSocket**（OneBot v11）连接到一个 [Napcat](https://github.com/NapNeko/NapCatQQ) 实例。当你有自己的 QQ 账号通过 Napcat 运行，并希望完整支持私聊 + 群聊时使用此方式。

**1. 设置 Napcat**

- 安装并登录 Napcat，然后启用 **Forward WebSocket** 服务器。参见 [官方 Napcat Docker 教程](https://github.com/NapNeko/NapCat-Docker)。
- 在 webui 中，依次进入“网络配置” -> “新建” -> “Websocket 服务器”来创建 forward websocket 服务器。默认 URL 为 `ws://127.0.0.1:3001`
- 复制 forward websocket 服务器的 token
- （可选）在 webui 中，依次进入“系统配置” -> “登陆配置” -> “快速登录QQ”，以便在重启后自动登录

**2. 配置**

```json
{
  "channels": {
    "napcat": {
      "enabled": true,
      "wsUrl": "ws://127.0.0.1:3001",
      "accessToken": "YOUR_WEBSOCKET_TOKEN",
      "allowFrom": ["*"],
      "groupPolicy": "mention",
      "groupPolicyOverrides": {
        "123456789": "open",
        "987654321": 0.2
      },
      "welcomeNewMembers": true
    }
  }
}
```

| 选项 | 作用 |
|--------|------|
| `wsUrl` | Napcat forward-WebSocket 端点。通过 `accessToken` 发送 Bearer 认证到 `Authorization` 请求头中。 |
| `allowFrom` | 允许与机器人对话的 QQ 号码。`["*"]` = 任何人。`["*"]`（或包含加入的用户）是 `welcomeNewMembers` 触发所必需的。 |
| `groupPolicy` | `"mention"`（默认）——仅在被 @ 提及或回复机器人自己的消息时响应。`"open"`——响应每一条群消息。`p` 中的浮点数 `[0.0, 1.0]`——@ 提及和回复机器人消息时总是响应；其他群消息以概率 `p` 响应（因此 `0.0` ≡ `"mention"`，`1.0` ≡ `"open"`）。私聊始终响应。 |
| `groupPolicyOverrides` | 按群组覆盖 `groupPolicy` 的可选配置，以群组 ID（字符串）为键。每个值的结构与 `groupPolicy` 相同（`"mention"`、`"open"`，或浮点数）。未列出的群组将回退到 `groupPolicy`。 |
| `welcomeNewMembers` | 为 true 时，`notice.group_increase` 事件会作为合成消息推送到总线，这样智能体就能欢迎新加入者。 |
| `maxImageBytes` | 入站图片下载的硬性大小上限（字节）。默认 20 MB。更大的图片会被丢弃并给出警告。 |

</details>

<details>
<summary><b>DingTalk（钉钉）</b></summary>

使用 **流模式**——不需要公网 IP。

**1. 创建钉钉机器人**
- 访问 [DingTalk Open Platform](https://open-dev.dingtalk.com/)
- 创建新应用 -> 添加 **Robot** 能力
- **配置**：
  - 打开 **Stream Mode**
- **权限**：添加发送消息所需的权限
- 从“Credentials”中获取 **AppKey**（Client ID）和 **AppSecret**（Client Secret）
- 发布应用

**2. 配置**

```json
{
  "channels": {
    "dingtalk": {
      "enabled": true,
      "clientId": "YOUR_APP_KEY",
      "clientSecret": "YOUR_APP_SECRET",
      "allowFrom": ["YOUR_STAFF_ID"],
      "groupUserIsolation": false
    }
  }
}
```

> `allowFrom`：添加你的工号。使用 `["*"]` 允许所有用户。
>
> `groupUserIsolation`：可选。默认值为 `false`，这会为每个群聊保持一个共享会话。将其设为 `true` 可让钉钉群聊中的每个发送者拥有各自独立的会话，同时回复仍会发回同一个群组。

**3. 运行**

```bash
nanobot gateway
```

</details>

<details>
<summary><b>Slack</b></summary>

使用 **Socket Mode**——不需要公网 URL。

**1. 创建 Slack 应用**
- 进入 [Slack API](https://api.slack.com/apps) → **Create New App** → “From scratch”
- 选择名称并选择你的工作区

**2. 配置应用**
- **Socket Mode**：打开 → 使用 `connections:write` 范围生成 **App-Level Token** → 复制它（`xapp-...`）
- **OAuth & Permissions**：添加 bot scopes：`chat:write`、`reactions:write`、`app_mentions:read`、`files:read`、`files:write`、`channels:history`、`groups:history`、`im:history`、`mpim:history`
- **Event Subscriptions**：打开 → 订阅 bot 事件：`message.im`、`message.channels`、`app_mention` → 保存更改
- **App Home**：滚动到 **Show Tabs** → 启用 **Messages Tab** → 勾选 **"Allow users to send Slash commands and messages from the messages tab"**
- **Install App**：点击 **Install to Workspace** → 授权 → 复制 **Bot Token**（`xoxb-...`）

> `files:read` 是读取用户发送给 nanobot 的文件所必需的。`files:write` 是 nanobot 发送图片、视频及其他文件上传所必需的。如果你之后再添加任一范围，请重新将 Slack 应用安装到工作区并重启 nanobot，以便它使用更新后的 bot token。

**3. 配置 nanobot**

```json
{
  "channels": {
    "slack": {
      "enabled": true,
      "botToken": "xoxb-...",
      "appToken": "xapp-...",
      "allowFrom": ["YOUR_SLACK_USER_ID"],
      "groupPolicy": "mention"
    }
  }
}
```

**4. 运行**

```bash
nanobot gateway
```

直接私信机器人，或在频道中 @ 提及它——它应该会响应！

> [!TIP]
> - `groupPolicy`：`"mention"`（默认——仅在被 @ 提及时响应）、`"open"`（响应所有频道消息），或 `"allowlist"`（通过 `groupAllowFrom` 限制为特定频道）。
> - `groupAllowFrom`：当 `groupPolicy` 为 `"allowlist"` 时，机器人可以响应的频道 ID。
> - `groupRequireMention`：当 `true` 且 `groupPolicy` 为 `"allowlist"` 时，机器人只会回复 `groupAllowFrom` 中的频道 **并且** 仅在被 @ 提及时回复（而不是每条消息）。对 `"mention"`/`"open"` 无效。可用它将机器人限定到已批准频道，同时保持仅 @ 提及才响应的行为。
> - DM 策略默认开放。设置 `"dm": {"enabled": false}` 可禁用私信。

</details>

<details>
<summary><b>Email</b></summary>

给 nanobot 配置一个专用邮箱。它通过 **IMAP** 轮询接收邮件，并通过 **SMTP** 回复——就像一个个人邮件助手。

**1. 获取凭据（Gmail 示例）**
- 为你的机器人创建一个专用 Gmail 账号（例如 `my-nanobot@gmail.com`）
- 启用两步验证 → 创建一个 [App Password](https://myaccount.google.com/apppasswords)
- IMAP 和 SMTP 都使用这个应用专用密码

**2. 配置**

> - `consentGranted` 必须为 `true` 才能允许访问邮箱。这是一个安全门控——设置 `false` 可完全禁用。
> - `allowFrom`：添加你的电子邮件地址。使用 `["*"]` 接受来自任何人的邮件。
> - `smtpUseTls` 和 `smtpUseSsl` 默认分别为 `true` / `false`，这对 Gmail 来说是正确的（587 端口 + STARTTLS）。无需显式设置。
> - 如果你只想读取/分析邮件而不自动回复，请设置 `"autoReplyEnabled": false`。
> - `postAction`：对已处理邮件的可选后处理：`"delete"` 或 `"move"`（默认 `null`）。
>   这只会在被接受的邮件成功送达 AI 流水线之后运行。
> - `postActionMoveMailbox`：当 `postAction` 为 `"move"` 时使用的目标邮箱（例如 `"Processed"` 或 `"[Gmail]/Trash"`）。
> - `postActionIgnoreSkipped`：如果为 `true`（默认），被跳过的邮件会在后续动作中被忽略，且不会被移动/删除。
> - `postActionExpunge`：当 `true` 时，如果无法使用 UID 范围的 expunge 或失败，则该通道允许进行整个邮箱的 `EXPUNGE` 回退（默认 `false`）。仅在非常老旧且缺少现代 UIDPLUS 支持的 IMAP 服务器上启用。注意，此回退会 expunge 邮箱中**所有**标记为已删除的消息，包括未被智能体处理的消息。对所有现代 IMAP 服务器，保持关闭都是安全的。
> - `allowedAttachmentTypes`：保存与这些 MIME 类型匹配的入站附件——`["*"]` 表示全部，例如 `["application/pdf", "image/*"]`（默认 `[]` = 禁用）。
> - `maxAttachmentSize`：每个附件的最大大小（字节）（默认 `2000000` / 2MB）。
> - `maxAttachmentsPerEmail`：每封邮件最多保存的附件数量（默认 `5`）。

```json
{
  "channels": {
    "email": {
      "enabled": true,
      "consentGranted": true,
      "imapHost": "imap.gmail.com",
      "imapPort": 993,
      "imapUsername": "my-nanobot@gmail.com",
      "imapPassword": "your-app-password",
      "smtpHost": "smtp.gmail.com",
      "smtpPort": 587,
      "smtpUsername": "my-nanobot@gmail.com",
      "smtpPassword": "your-app-password",
      "fromAddress": "my-nanobot@gmail.com",
      "allowFrom": ["your-real-email@gmail.com"],
      "postAction": "move",
      "postActionMoveMailbox": "[Gmail]/Trash",
      "postActionIgnoreSkipped": true,
      "postActionExpunge": false,
      "allowedAttachmentTypes": ["application/pdf", "image/*"]
    }
  }
}
```


**3. 运行**

```bash
nanobot gateway
```

</details>

<details>
<summary><b>WeChat（微信 / Weixin）</b></summary>

使用带二维码登录的 **HTTP long-poll**，通过 ilinkai 个人微信 API。无需本地微信桌面客户端。

**1. 安装微信支持**

```bash
python -m pip install "nanobot-ai[weixin]"
```

**2. 配置**
```json
{
  "channels": {
    "weixin": {
      "enabled": true,
      "allowFrom": ["YOUR_WECHAT_USER_ID"]
    }
  }
}
```

> - `allowFrom`：添加你在 nanobot 日志中看到、对应你 WeChat 账号的发送者 ID。使用 `["*"]` 可允许所有用户。
> - `token`：可选。若省略，将以交互方式登录，nanobot 会为你保存令牌。
> - `routeTag`：可选。当你的上游 Weixin 部署需要请求路由时，nanobot 会将其作为 `SKRouteTag` 标头发送。
> - `stateDir`：可选。默认为 nanobot 运行时目录中的 Weixin 状态目录。
> - `pollTimeout`：可选的长轮询超时时间，单位为秒。

**3. 登录**

```bash
nanobot channels login weixin
```

使用 `--force` 重新认证并忽略任何已保存的令牌：

```bash
nanobot channels login weixin --force
```

**4. 运行**

```bash
nanobot gateway
```

</details>

<details>
<summary><b>Wecom (企业微信)</b></summary>

> 这里我们使用 [wecom-aibot-sdk-python](https://github.com/chengyongru/wecom_aibot_sdk)（官方 [@wecom/aibot-node-sdk](https://www.npmjs.com/package/@wecom/aibot-node-sdk) 的社区 Python 版本）。
>
> 使用 **WebSocket** 长连接——不需要公网 IP。

**1. 安装可选依赖**

```bash
python -m pip install "nanobot-ai[wecom]"
```

**2. 创建 WeCom AI Bot**

前往企业微信管理后台 → 智能机器人 → 创建机器人 → 选择带有 **长连接** 的 **API 模式**。复制 Bot ID 和 Secret。

**3. 配置**

```json
{
  "channels": {
    "wecom": {
      "enabled": true,
      "botId": "your_bot_id",
      "secret": "your_bot_secret",
      "allowFrom": ["your_id"]
    }
  }
}
```

**4. 运行**

```bash
nanobot gateway
```

</details>

<details>
<summary><b>Microsoft Teams</b>（MVP — 仅 DM）</summary>

> 支持双向直消息文本、租户感知 OAuth、会话引用持久化。
> 使用公共 HTTPS webhook——不需要 WebSocket；你需要隧道或反向代理。

**1. 安装可选依赖**

```bash
python -m pip install "nanobot-ai[msteams]"
```

**2. 创建 Teams / Azure bot 应用注册**

创建或复用一个 Microsoft Teams / Azure bot 应用注册。将 bot 消息端点设置为一个以 `/api/messages` 结尾的公共 HTTPS URL。

**3. 配置**

```json
{
  "channels": {
    "msteams": {
      "enabled": true,
      "appId": "YOUR_APP_ID",
      "appPassword": "YOUR_APP_SECRET",
      "tenantId": "YOUR_TENANT_ID",
      "host": "0.0.0.0",
      "port": 3978,
      "path": "/api/messages",
      "allowFrom": ["*"],
      "replyInThread": true,
      "mentionOnlyResponse": "Hi — what can I help with?",
      "validateInboundAuth": true,
      "refTtlDays": 30,
      "pruneWebChatRefs": true,
      "pruneNonPersonalRefs": true,
      "refTouchIntervalS": 300
    }
  }
}
```

> - `replyInThread: true` 会在存在已保存的 `activity_id` 时，回复触发该操作的 Teams 活动。
> - `mentionOnlyResponse` 控制当用户只发送 bot 提及（`<at>Nanobot</at>`）时 Nanobot 接收什么内容。设置为 `""` 可忽略仅提及消息。
> - `validateInboundAuth: true` 启用入站 Bot Framework bearer token 验证（签名、颁发者、受众、有效期、`serviceUrl`）。这对于公共部署是安全的默认设置。仅在本地开发或严格受控的测试中将其设为 `false`。
> - `refTtlDays`（默认 `30`）控制已保存会话引用在被清理前可以有多旧。
> - `pruneWebChatRefs`（默认 `true`）会丢弃带有 `webchat.botframework.com` 服务 URL 的引用。
> - `pruneNonPersonalRefs`（默认 `true`）会丢弃其 `conversation_type` 不是 `personal` 的引用。
> - `refTouchIntervalS`（默认 `300`）限制成功发送刷新 `updated_at` 对活动引用的频率。

**4. 运行**

```bash
nanobot gateway
```

</details>

<details>
<summary><b>Signal</b></summary>

使用 **signal-cli** 守护进程的 HTTP 模式——通过 SSE 接收消息，通过 JSON-RPC 发送消息。

**1. 安装 signal-cli**

安装 [signal-cli](https://github.com/AsamK/signal-cli) 并注册一个电话号码：

```bash
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify <CODE>
```

启动守护进程：

```bash
signal-cli -a +1234567890 daemon --http localhost:8080
```

**2. 配置**

```json
{
  "channels": {
    "signal": {
      "enabled": true,
      "phoneNumber": "+1234567890",
      "daemonHost": "localhost",
      "daemonPort": 8080,
      "dm": {
        "enabled": true,
        "policy": "open"
      },
      "group": {
        "enabled": true,
        "policy": "open",
        "requireMention": true
      }
    }
  }
}
```

> - `phoneNumber`：你注册的 Signal 电话号码。
> - `daemonHost` / `daemonPort`：signal-cli 守护进程监听的位置（默认 `localhost:8080`）。
> - `dm.policy`：`"open"`（任何人都可以 DM）或 `"allowlist"`（仅限列出的号码/UUID）。当为 `"allowlist"` 时，未列出的 DM 发送者会收到配对码。
> - `dm.allowFrom`：允许的电话号码或 UUID 列表（当策略为 `"allowlist"` 时使用）。
> - `group.policy`：`"open"`（所有群组）或 `"allowlist"`（仅列出的群组 ID）。
> - `group.requireMention`：当 `true`（默认）时，机器人仅在群组中被 @提及时响应。
> - `group.allowFrom`：允许的群组 ID 列表（当群组策略为 `"allowlist"` 时使用）。
> - `attachmentsDir`：覆盖 signal-cli 存储入站附件的目录。默认是 `~/.local/share/signal-cli/attachments`（Linux 默认值）。如果 signal-cli 以自定义 `XDG_DATA_HOME` 运行，或在 macOS/Windows 上运行，请设置此项。
> - `groupMessageBufferSize`：保留用于上下文的最近群组消息数量（默认 `20`，必须大于 0）。

**3. 运行**

```bash
nanobot gateway
```

> [!TIP]
> 如果连接断开，该通道会使用指数退避自动重新连接到 signal-cli 守护进程。
> 机器人回复中的 Markdown 会自动转换为 Signal 文本样式（加粗、斜体、代码等）。

</details>
