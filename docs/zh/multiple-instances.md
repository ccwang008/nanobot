<!-- 本文件由 docs/multiple-instances.md 翻译生成；原文仍保留在上级目录。 -->

# 多实例

同时运行多个 nanobot 实例，分别使用独立的配置和运行时数据。使用 `--config` 作为主要入口点。如果你想为特定实例初始化或更新已保存的工作区，可在 `onboard` 期间可选地传入 `--workspace`。

## 快速开始

如果你希望每个实例从一开始就拥有自己专用的工作区，请在 onboarding 期间同时传入 `--config` 和 `--workspace`。

**初始化实例：**

```bash
# Create separate instance configs and workspaces
nanobot onboard --config ~/.nanobot-telegram/config.json --workspace ~/.nanobot-telegram/workspace
nanobot onboard --config ~/.nanobot-discord/config.json --workspace ~/.nanobot-discord/workspace
nanobot onboard --config ~/.nanobot-feishu/config.json --workspace ~/.nanobot-feishu/workspace
```

**配置每个实例：**

编辑 `~/.nanobot-telegram/config.json`、`~/.nanobot-discord/config.json` 等文件，使用不同的通道设置。你在 `onboard` 时传入的工作区会被保存到每个配置中，作为该实例的默认工作区。

**运行实例：**

```bash
# Instance A - Telegram bot
nanobot gateway --config ~/.nanobot-telegram/config.json

# Instance B - Discord bot
nanobot gateway --config ~/.nanobot-discord/config.json

# Instance C - Feishu bot with custom port
nanobot gateway --config ~/.nanobot-feishu/config.json --port 18792
```

## 路径解析

使用 `--config` 时，nanobot 会根据配置文件位置推导其运行时数据目录。工作区仍然来自 `agents.defaults.workspace`，除非你使用 `--workspace` 覆盖它。

要在本地打开连接到这些实例之一的 CLI 会话：

```bash
nanobot agent -c ~/.nanobot-telegram/config.json -m "Hello from Telegram instance"
nanobot agent -c ~/.nanobot-discord/config.json -m "Hello from Discord instance"

# Optional one-off workspace override
nanobot agent -c ~/.nanobot-telegram/config.json -w /tmp/nanobot-telegram-test
```

> `nanobot agent` 使用所选的工作区/配置启动一个本地 CLI 智能体。它不会附加到已在运行的 `nanobot gateway` 进程，也不会通过该进程进行代理转发。

| 组件 | 来源 | 示例 |
|-----------|---------------|---------|
| **配置** | `--config` 路径 | `~/.nanobot-A/config.json` |
| **工作区** | `--workspace` 或配置 | `~/.nanobot-A/workspace/` |
| **Cron 任务** | 工作区目录 | `~/.nanobot-A/workspace/cron/` |
| **媒体 / 运行时状态** | 配置目录 | `~/.nanobot-A/media/` |

## 工作原理

- `--config` 选择要加载的配置文件
- 默认情况下，工作区来自该配置中的 `agents.defaults.workspace`
- 如果你传入 `--workspace`，它会覆盖配置文件中的工作区

## 最小设置

1. 将你的基础配置复制到一个新的实例目录中。
2. 为该实例设置不同的 `agents.defaults.workspace`。
3. 使用 `--config` 启动该实例。

配置片段示例：

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.nanobot-telegram/workspace"
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "token": "YOUR_TELEGRAM_BOT_TOKEN"
    }
  },
  "gateway": {
    "host": "127.0.0.1",
    "port": 18790
  }
}
```

复制后的基础配置可以继续使用相同的 `modelPresets` 和 `agents.defaults.modelPreset`。如果该实例需要不同的模型，请添加另一个预设，并将 `agents.defaults.modelPreset` 设置为该预设名称。

启动独立实例：

```bash
nanobot gateway --config ~/.nanobot-telegram/config.json
nanobot gateway --config ~/.nanobot-discord/config.json
```

每个 gateway 实例还会在 `gateway.host:gateway.port` 上暴露一个轻量级 HTTP 健康检查端点。默认情况下，gateway 绑定到 `127.0.0.1`，因此除非你显式将 `gateway.host` 设置为公共地址或面向 LAN 的地址，否则该端点始终仅限本地访问。

- `GET /health` 返回 `{"status":"ok"}`
- 其他路径返回 `404`

在需要时，为一次性运行覆盖工作区：

```bash
nanobot gateway --config ~/.nanobot-telegram/config.json --workspace /tmp/nanobot-telegram-test
```

## 常见用例

- 为 Telegram、Discord、Feishu 和其他平台运行独立的机器人
- 将测试和生产实例隔离开来
- 为不同团队使用不同的模型或提供商
- 使用独立的配置和运行时数据为多个租户提供服务

## 说明

- 如果同时运行，每个实例必须使用不同的端口
- 如果你希望记忆、会话和技能彼此隔离，请为每个实例使用不同的工作区
- `--workspace` 会覆盖配置文件中定义的工作区
- Cron 任务存储在活动工作区中；运行时媒体/状态则从配置目录派生
