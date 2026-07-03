<!-- 本文件由 docs/chat-commands.md 翻译生成；原文仍保留在上级目录。 -->

# 聊天内命令

这些命令可在聊天通道和交互式智能体会话中使用：

| 命令 | 说明 |
|---------|-------------|
| `/new` | 停止当前任务并开始新的对话 |
| `/stop` | 停止当前任务 |
| `/restart` | 重启机器人 |
| `/status` | 显示机器人状态 |
| `/model` | 显示当前模型和可用的模型预设 |
| `/model <preset>` | 为后续轮次切换运行时模型预设 |
| `/dream` | 立即运行 Dream 记忆整合 |
| `/dream-log` | 显示最新的 Dream 记忆变更 |
| `/dream-log <sha>` | 显示特定的 Dream 记忆变更 |
| `/dream-restore` | 列出最近的 Dream 记忆版本 |
| `/dream-restore <sha>` | 将记忆恢复到某次特定变更之前的状态 |
| `/dream-prompt` | 显示 Dream 的记忆引导方式 |
| `/dream-prompt init` | 在 `prompts/dream.md` 创建可编辑的 Dream 记忆指南 |
| `/skill` | 列出已启用的技能及其说明 |
| `/trigger` | 显示本地触发器用法 |
| `/trigger <name>` | 为当前聊天/会话创建一个命名的本地触发器 |
| `/pairing` | 列出待处理的配对请求 |
| `/pairing approve <code>` | 批准一个配对代码 |
| `/pairing deny <code>` | 拒绝一个待处理的配对请求 |
| `/pairing revoke <user_id>` | 取消当前通道上先前批准的用户 |
| `/pairing revoke <channel> <user_id>` | 取消某个特定通道上先前批准的用户 |
| `/help` | 显示可用的聊天内命令 |

## 配对

当有人向机器人发送 DM 且不在允许列表中时——无论是新用户还是在新通道上的现有用户——nanobot 都会自动回复一个**配对代码**（例如 `ABCD-EFGH`），该代码会在 10 分钟后过期。要授予他们访问权限：

```text
/pairing approve ABCD-EFGH
```

要查看谁在等待，请使用 `/pairing`。要在之后移除某人，请使用 `/pairing revoke <user_id>`——你可以在 `/pairing list` 输出中找到用户 ID。

完整设置指南请参见 [配置：配对](./configuration.md#pairing)。

## 模型预设

使用 `/model` 查看当前运行时模型：

```text
/model
```

响应会显示当前模型、当前预设以及可用的预设名称。命名预设来自顶层 `modelPresets` 配置，是配置模型选择的推荐方式。`default` 始终可用，表示来自直接 `agents.defaults.*` 字段的模型设置。

要为后续轮次切换预设：

```text
/model fast
/model deep
/model default
```

预设名称来自顶层 `modelPresets` 配置。切换仅限运行时：不会重写 `config.json`，且正在进行中的轮次会继续使用其开始时所用的模型。设置详情请参见 [配置：模型预设](./configuration.md#model-presets)。

## 本地触发器

当本地脚本或其他服务需要稍后向当前聊天/会话发送消息时，请使用 `/trigger <name>`。名称是必需的；仅使用 `/trigger` 只会显示用法提示。

从未来消息应到达的聊天中创建触发器：

```text
/trigger PR review
```

nanobot 会回复一个触发器 ID 和一条如下形式的命令：

```bash
nanobot trigger trg_8K4P2Q9X "Review PR #4502"
```

将 `"Review PR #4502"` 替换为你希望 nanobot 接收的消息。触发器绑定到创建它的会话，因此消息会返回到同一个聊天。请保持 `nanobot gateway` 运行，以便传递触发器消息。触发器消息会在该会话中启动一个自动化轮次，并记录你通过 CLI 传入的消息；它不会被视为普通用户消息。如果该会话当时已经在运行一个轮次，触发器会等待直到会话空闲，而不是注入到当前活动轮次中。

触发器投递会保存在工作区中，直到其关联的智能体轮次成功完成。如果网关在声明某次投递后、但在轮次完成前退出，下一次网关启动时会重新入队该投递。这是一个至少一次的本地队列：如果进程在错误的时机退出，某次投递可能会运行多次，因此外部脚本应确保重复的触发器消息是安全的。如果投递到达智能体且智能体轮次失败，则该投递会在 Automations 中标记为失败，而不是无限重试。

对于更长或生成的内容，可省略消息参数并通过 stdin 管道输入：

```bash
printf '%s\n' "Review the latest failed CI job" | nanobot trigger trg_8K4P2Q9X
```

如果外部 webhook 应该唤醒 nanobot，请运行你自己的小型 webhook 服务，并让它在构建好最终消息后调用触发器命令：

```bash
nanobot trigger <trigger-id> "<message>"
```

如果你运行多个 nanobot 实例，请传入与网关使用的相同配置或工作区选择器：

```bash
nanobot trigger --config ./bot-a/config.json trg_8K4P2Q9X "Nightly report"
nanobot trigger --workspace ./bot-a/workspace trg_8K4P2Q9X "Nightly report"
```

可在 WebUI 的 Automations 视图中管理触发器。你可以在那里搜索、暂停/恢复、重命名、删除以及复制触发器命令。一个会话可以有多个触发器，就像它可以有多个计划的自动化一样。

## 周期性任务

周期性后台检查由工作区中的 `HEARTBEAT.md`（`~/.nanobot/workspace/HEARTBEAT.md`）驱动。当 `nanobot gateway` 启动时，默认会注册一个受保护的心跳 cron 任务。每 30 分钟，该任务会检查该文件；如果它发现 `## Active Tasks` 下有任务，智能体就会执行这些任务，并且只把通过通知门控的结果发送到你最近活跃的聊天通道。如果没有活跃任务，或者结果只是例行内容、没有值得报告的信息，心跳就会静默跳过。

心跳适合用于通常应保持静默的重复检查。用户创建的 cron 任务则不同：它们会作为计划轮次在创建它们的聊天/会话中运行，并且通常会将结果返回到该通道。

**设置：**编辑 `~/.nanobot/workspace/HEARTBEAT.md`（由 `nanobot onboard` 自动创建）：

```markdown
## Active Tasks

- Check weather forecast and notify me only if storms are expected
- Scan inbox for urgent emails and notify me if any are found
```

智能体也可以自行管理这个文件——让它“添加一个周期性后台检查”或“定期检查这个，但只有在有变化时才通知我”，它就会为你更新 `HEARTBEAT.md`。已完成的任务应从文件中删除，而不是移动到另一个部分。

你可以在 `~/.nanobot/config.json` 中更改间隔或禁用内置心跳：

```json
{
  "gateway": {
    "heartbeat": {
      "enabled": true,
      "intervalS": 1800
    }
  }
}
```

心跳任务会在 `cron(action="list")` 中以 `heartbeat` 的形式可见，但它由系统管理，不能使用 `cron` 工具移除。要停止它，请将 `gateway.heartbeat.enabled` 设为 `false`，然后重启网关。

> **注意：**网关必须正在运行（`nanobot gateway`），并且你必须至少与机器人聊过一次，这样它才知道应将结果发送到哪个通道。
