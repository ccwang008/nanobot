<!-- 本文件由 docs/webui.md 翻译生成；原文仍保留在上级目录。 -->

# WebUI

WebUI 是 nanobot 的浏览器工作台。在基础 CLI 回复已经
可用之后使用它；当你希望在一个地方获得持久的聊天工作区、可见的智能体活动、
工作区控制、Apps、Skills、设置和 Automations 时使用它。

已发布的 `nanobot-ai` wheel 已经包含 WebUI bundle。你只有在修改前端本身时，
才需要 `webui/` 源代码目录。

## 打开 WebUI

首先确认你的提供商和模型可以回答：

```bash
nanobot agent -m "Hello!"
```

然后将 WebSocket 通道合并到你现有的 `~/.nanobot/config.json` 中。
将 `tokenIssueSecret` 设置为你将在 WebUI 登录表单中输入的密码：

```json
{
  "channels": {
    "websocket": {
      "enabled": true,
      "tokenIssueSecret": "your-webui-password",
      "websocketRequiresToken": true
    }
  }
}
```

如果你不熟悉 JSON 片段，请参见
[`start-without-technical-background.md#how-to-merge-json-snippets`](./start-without-technical-background.md#how-to-merge-json-snippets)。

启动网关：

```bash
nanobot gateway
```

保持网关运行并打开
[`http://127.0.0.1:8765`](http://127.0.0.1:8765)。WebUI 默认由
端口 `8765` 上的 WebSocket 通道提供服务。网关健康检查端点，
默认是 `18790`，不是浏览器 UI。
当 WebUI 要求输入密码时，输入 `tokenIssueSecret`。

## 用途

| Area | Use it for |
|---|---|
| Chat | 启动、切换、搜索、分叉和删除浏览器会话 |
| Agent activity | 在上下文中查看思考、工具调用、文件活动、命令输出和生成的产物 |
| Workspace | 在请求文件或 shell 工作之前选择项目工作区 |
| Access | 为你的网关配置所允许的本地能力选择访问模式 |
| Composer | 发送文本、图片、语音输入、斜杠命令以及用于 Apps 或 MCP 预设的 `@` 提及 |
| Apps | 安装、测试、更新和使用本地 CLI App 适配器和 MCP 预设 |
| Skills | 在依赖它们之前检查可用的内置和工作区技能 |
| Automations | 查看、搜索、运行、暂停、编辑和删除计划的以及本地触发器的智能体回合 |
| Settings | 调整模型、提供商、图像生成、语音、Web 工具、运行时和安全选项 |

## 聊天工作区

侧边栏是会话切换器。一个会话保留自己的历史、标题、
工作区元数据和关联的 automations。当你需要
独立上下文时使用新会话；当你想从现有点继续但不改变原始线程时使用分叉。

消息时间线同时显示用户可见的回复和智能体活动。较长的
工具或推理部分在你需要细节时可以展开。

## 工作区和访问

在开始项目特定工作之前使用工作区选择器。这会为
智能体提供正确的项目上下文，以用于文件路径、shell 命令和会话
元数据。

composer 中的访问控制用于控制该聊天的本地能力级别。
它不会绕过你的网关、提供商、shell 沙箱或操作系统配置；
它只是从已经可用于此 WebUI 会话的能力中进行选择。

## Composer

composer 支持普通消息、图片附件、已配置转录时的语音输入、
斜杠命令，以及对已安装 Apps 或 MCP 预设的 `@` 提及。
模型徽标显示当前模型或预设，并在设置未完成时链接回模型设置。

对于图像生成，先配置一个图像提供商，然后在 composer 中使用 WebUI
图像模式。有关提供商设置和输出行为，请参见
[`image-generation.md`](./image-generation.md)。

## Apps

从侧边栏或设置导航打开 Apps，以管理 nanobot 可以从聊天中调用的集成。
CLI Apps 安装本地适配器，nanobot 在你的机器上运行这些适配器；
它们不会修改原生应用本身。MCP 预设添加预定义的 MCP 服务器配置。

某些 MCP 预设连接到托管的无密钥端点。例如，Firecrawl
预设使用 Firecrawl 托管的 MCP 端点来提供搜索、抓取、爬取和
提取工具，而不需要 API key。这并不会取代 nanobot 内置的 Web 搜索提供商；当某个回合需要 Firecrawl 更丰富的 Web 数据工具时，使用 `@` 提及 Firecrawl MCP 预设。

一旦 App 或 MCP 预设可用，就在 composer 中用 `@`
提及它，以将该能力附加到下一条消息。

## Skills

Skills 视图显示可供智能体使用的 skill 指令，包括
内置 skills 和工作区提供的 skills。当你想知道 nanobot 在让它执行任务之前
是否已经有针对该任务的专门工作流时，请查看此视图。

## Automations

Automations 是稍后在关联聊天/会话中运行的智能体回合。它们应当从
预期运行的聊天、通道或会话中创建，以便 nanobot 保持正确的目标上下文。
当 automation 运行时，它通常会把结果发送回那个关联的聊天。

有两种面向用户的 automation 类型：

- 计划的 automations，由智能体的 cron 工具创建，在某个时间、
  间隔或 cron 表达式时运行。
- 本地触发器，使用 `/trigger <name>` 创建，在你调用本地
  命令时运行，例如 `nanobot trigger trg_8K4P2Q9X "Review PR #4502"`。

如果 GitHub webhook、CI 系统或其他服务应该唤醒 nanobot，请将
该 webhook/服务保留在 nanobot 之外，并让它使用最终消息调用触发器命令。

触发器投递使用与网关相同的工作区。它们在网关重启后仍然存在，
如果进程在关联回合完成之前退出，它们会被重新入队。如果关联的会话已经
在运行一个回合，本地触发器会等待该会话空闲，而不是注入到当前
正在执行的回合中。这是一个至少一次的本地队列，因此在进程中断后可能
会重复投递。已投递的触发器会在关联会话中记录为一个 automation 回合；
如果智能体收到了它但该回合失败，Automations 会将运行标记为失败，而不是无限重试。

对于应保持安静、除非有有用信息可报告的定期后台检查，请编辑 `HEARTBEAT.md`
使用受保护的 heartbeat 任务，而不是创建聊天 automation。

使用 Automations 视图来：

- 按全部、活动、暂停、需要关注或系统任务进行筛选。
- 按任务名称、消息、触发器命令、关联聊天、计划或状态搜索。
- 按下次运行、上次运行、更新时间或名称排序。
- 立即运行计划的 automations。
- 暂停或恢复、重命名或删除用户创建的 automations。
- 复制本地触发器的 CLI 命令。
- 查看受保护的系统 automations 而不更改它们。

搜索支持纯文本以及字段筛选器，例如 `name:backup`,
`chat:WeChat`, `schedule:09:30`, `cron:"0 23 * * *"`, `trigger` 和
`status:paused`。

没有关联聊天的 automation 无法在 WebUI 中启用或运行，
因为 nanobot 不知道应将计划回合投递到哪里。请从目标聊天或通道中重新创建它，
以便 automation 拥有完整上下文。

本地触发器没有 WebUI 的“Run now”操作，因为每次运行都需要一条消息。
使用复制的 `nanobot trigger ...` 命令，并将 `"message"` 替换为应当投递的内容。

## 设置

设置是浏览器会话和由网关支持的运行时配置的控制面板。使用它来查看或调整模型预设、
提供商可见性、图像生成、语音转录、Web 工具、Apps、Automations、Skills、运行时身份
以及高级安全控制。

某些设置会立即生效。影响网关或智能体进程的运行时设置可能需要重启；
WebUI 会在相关控制项旁显示该要求。

## LAN 访问

要从同一网络中的另一台设备打开 WebUI，请将 WebSocket
通道绑定到所有接口并设置 token 或 token issue secret：

```json
{
  "channels": {
    "websocket": {
      "enabled": true,
      "host": "0.0.0.0",
      "port": 8765,
      "tokenIssueSecret": "your-secret-here"
    }
  }
}
```

当 `host` 设置为 `"0.0.0.0"` 时，若未配置 `token` 或
`tokenIssueSecret`，网关会拒绝启动。网关启动后，从另一台设备打开
`http://<your-ip>:8765`，并在登录表单中输入 secret。
## 故障排查

如果页面无法打开，请按以下顺序检查：

1. `nanobot agent -m "Hello!"` 在相同的 Python 环境中可以正常工作。
2. `~/.nanobot/config.json` 中已启用 WebSocket 通道。
3. `nanobot gateway` 仍在运行。
4. 你打开的是端口 `8765`，而不是网关健康检查端口。
5. LAN 访问使用 `host: "0.0.0.0"`，并提供 token 或 token 问题 secret。

有关详细诊断，请参见
[`troubleshooting.md#webui-problems`](./troubleshooting.md#webui-problems)。
有关前端开发，请参见 [`../webui/README.md`](../webui/README.md)。
