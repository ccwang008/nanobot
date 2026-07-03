<!-- 本文件由 docs/memory.md 翻译生成；原文仍保留在上级目录。 -->

# nanobot 中的记忆

nanobot 的记忆建立在一个简单的信念之上：记忆应该有生命感，但不应该显得混乱。

好的记忆不是一堆笔记。它是一个安静的注意力系统。它会留意什么值得保留，放下那些不再需要聚光灯的内容，并把亲身经历转化为某种平静、持久且有用的东西。

这就是 nanobot 中记忆的形态。

## 设计

nanobot 不会把记忆当作一个巨大的文件来处理。

它将记忆分成多层，因为不同类型的记忆应该使用不同的工具：

- `session.messages` 保存实时的短期对话。
- `memory/history.jsonl` 是压缩后的过往轮次的持续归档。
- `SOUL.md`、`USER.md` 和 `memory/MEMORY.md` 是持久化的知识文件。
- `GitStore` 记录这些持久化文件如何随时间变化。

这让系统在当下保持轻量，同时又能随着时间进行反思。

## 流程

记忆在 nanobot 中分两个阶段流动。

### 阶段 1：Consolidator

当对话增长到足以给上下文窗口带来压力时，nanobot 不会试图永远携带每一条旧消息。

相反，`Consolidator` 会对对话中最早且安全的一段进行摘要，并将该摘要追加到 `memory/history.jsonl`。

这个文件具有以下特性：

- 仅追加
- 基于游标
- 优先优化机器消费，其次才是人工查看

每一行都是一个 JSON 对象：

```json
{"cursor": 42, "timestamp": "2026-04-03 00:02", "content": "- User prefers dark mode\n- Decided to use PostgreSQL"}
```

它不是最终记忆。它是塑造最终记忆的材料。

### 阶段 2：Dream

`Dream` 是更慢、更审慎的一层。默认情况下它按 cron 计划运行，也可以手动触发。

Dream 会读取：

- 来自 `memory/history.jsonl` 的新条目
- 当前的 `SOUL.md`
- 当前的 `USER.md`
- 当前的 `memory/MEMORY.md`

然后它会在单次通过中对长期文件进行外科手术式编辑——不是重写一切，而是做出最小且诚实的改动，以保持记忆一致。

这就是为什么 nanobot 的记忆不只是归档。它还是解释性的。

## 文件

```text
workspace/
├── SOUL.md              # The bot's long-term voice and communication style
├── USER.md              # Stable knowledge about the user
├── prompts/
│   ├── README.md        # Notes for memory guidance files
│   └── dream.md         # Optional instructions for how Dream organizes memory
└── memory/
    ├── MEMORY.md        # Project facts, decisions, and durable context
    ├── history.jsonl    # Append-only history summaries
    ├── .cursor          # Consolidator write cursor
    ├── .dream_cursor    # Dream consumption cursor
    └── .git/            # Version history for long-term memory files
```

这些文件扮演着不同的角色：

- `SOUL.md` 记录 nanobot 应该如何表达。
- `USER.md` 记录用户是谁以及他们的偏好。
- `MEMORY.md` 记录关于工作本身仍然成立的内容。
- `history.jsonl` 记录一路走来发生了什么。

## 为什么使用 `history.jsonl`

旧的 `HISTORY.md` 格式适合随意阅读，但作为运行底座来说太脆弱了。

`history.jsonl` 为 nanobot 提供了：

- 稳定的增量游标
- 更安全的机器解析
- 更容易的批处理
- 更清晰的迁移和压缩
- 原始历史与精选知识之间更好的边界

你仍然可以用熟悉的工具搜索它：

```bash
# grep
grep -i "keyword" memory/history.jsonl

# jq
cat memory/history.jsonl | jq -r 'select(.content | test("keyword"; "i")) | .content' | tail -20

# Python
python -c "import json; [print(json.loads(l).get('content','')) for l in open('memory/history.jsonl','r',encoding='utf-8') if l.strip() and 'keyword' in l.lower()][-20:]"
```

不同之处既是哲学上的，也是技术上的：

- `history.jsonl` 用于结构
- `SOUL.md`、`USER.md` 和 `MEMORY.md` 用于意义

## 命令

记忆并不是藏在幕后。用户可以查看并引导它。

| 命令 | 功能 |
|---------|--------------|
| `/dream` | 立即运行 Dream |
| `/dream-log` | 显示最新的 Dream 记忆变更 |
| `/dream-log <sha>` | 显示某一次特定的 Dream 变更 |
| `/dream-restore` | 列出最近的 Dream 记忆版本 |
| `/dream-restore <sha>` | 将记忆恢复到某次特定变更之前的状态 |
| `/dream-prompt` | 显示 Dream 在记忆方面是如何被引导的 |
| `/dream-prompt init` | 在 `prompts/dream.md` 创建一个可编辑的 Dream 记忆指南 |

这些命令存在是有原因的：自动记忆很强大，但用户始终应该保留查看、理解和恢复它的权利。

## 版本化记忆

当 Dream 更改长期记忆文件后，nanobot 可以用 `GitStore` 记录该变更。

这为记忆本身赋予了历史：

- 你可以查看发生了什么变化
- 你可以比较不同版本
- 你可以恢复到之前的状态

这就把记忆从静默变更变成了可审计的过程。

## 引导 Dream

Dream 会使用 nanobot 内置的记忆指令来决定保留、更新或遗忘什么。大多数用户可以不用管它。

如果某个工作区需要不同的记忆风格，可以创建一个可编辑指南：

```text
/dream-prompt init
```

这会创建：

```text
workspace/prompts/dream.md
```

用普通 Markdown 编辑该文件。当它有内容时，Dream 会在读取最新对话历史之前，先根据这个工作区中的内容来执行。你不需要把历史粘贴到文件里；Dream 会自动添加当前的 `## Conversation History` 区块。

要恢复到 nanobot 的默认行为，请删除 `prompts/dream.md`，或者将其留空。

每个工作区都有自己的指南。修改这个文件不会影响其他 nanobot 工作区。

## 配置

Dream 在 `agents.defaults.dream` 下进行配置：

```json
{
  "agents": {
    "defaults": {
      "dream": {
        "intervalH": 2,
        "modelOverride": null,
        "maxBatchSize": 20,
        "maxIterations": 10
      }
    }
  }
}
```

| 字段 | 含义 |
|-------|---------|
| `intervalH` | Dream 运行的频率，单位为小时 |
| `cron` | cron 表达式覆盖项（优先于 `intervalH`） |
| `modelOverride` | 可选的 Dream 专用模型覆盖 *(待实现)* |
| `maxBatchSize` | *(已弃用 — 不再使用)* |
| `maxIterations` | *(已弃用 — 不再使用)* |

在实际使用中：

- `intervalH` 是配置 Dream 频率的常规方式。其内部会作为 `every` 计划运行。
- 设置 `cron` 时会覆盖 `intervalH`，从而允许使用精确的 cron 表达式（例如 `0 */4 * * *`）。
- `modelOverride` 为未来版本保留。目前 Dream 使用与主智能体相同的模型。
- `maxBatchSize` 和 `maxIterations` 为了配置兼容性而保留，但不再影响行为。

## 实际使用

这在日常使用中的含义很简单：

- 对话可以保持快速，而不必携带无限上下文
- 持久化事实可以随着时间变得更清晰，而不是更嘈杂
- 用户可以在需要时查看和恢复记忆

记忆不应该像垃圾堆。它应该像连续性。

这正是这个设计想要守护的东西。
