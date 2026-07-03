<!-- 本文件由 docs/my-tool.md 翻译生成；原文仍保留在上级目录。 -->

# 我的工具

让智能体感知并调整自身的运行时状态——就像问同事“你现在忙吗？能切换到更大的显示器吗？”

## 为什么你需要它

普通工具让智能体能操作外部世界（读/写文件、搜索代码）。但智能体对自己一无所知——它不知道自己正在运行哪个模型、还剩多少次迭代、已经消耗了多少 token。

我的工具填补了这个空白。借助它，智能体可以：

- **知道自己是谁**：我在使用哪个模型？我的工作区在哪里？还剩多少次迭代？
- **即时适应**：任务复杂？扩大上下文窗口。只是简单聊天？切换到更快的模型。
- **跨轮次记住信息**：把笔记存到草稿区中，并在下一轮对话中继续保留。

## 配置

默认启用（只读模式）。智能体可以检查自己的状态，但不能设置。

```yaml
tools:
  my:
    enable: true       # default: true
    allow_set: false   # default: false (read-only)
```

要允许智能体设置其配置（例如切换模型、调整参数），请设置 `tools.my.allow_set: true`。

旧版 `tools.myEnabled` / `tools.mySet` 键会在加载时自动迁移，并在下次 `nanobot onboard` 刷新配置时原地重写。

所有修改都只保存在内存中——重启后会恢复默认值。

---

## check — 检查“my”的当前状态

不带参数时，返回一个关键配置概览：

```text
my(action="check")
# → max_iterations: 40
#   context_window_tokens: 200000
#   model: 'anthropic/claude-sonnet-4-20250514'
#   workspace: PosixPath('/tmp/workspace')
#   provider_retry_mode: 'standard'
#   max_tool_result_chars: 16000
#   _current_iteration: 3
#   _last_usage: {'prompt_tokens': 45000, 'completion_tokens': 8000}
#   Note: prompt_tokens is cumulative across all turns, not current context window occupancy.
```

带上键参数时，可深入查看特定配置：

```text
my(action="check", key="_last_usage.prompt_tokens")
# → How many prompt tokens I've used so far

my(action="check", key="model")
# → What model I'm currently running on

my(action="check", key="web_config.enable")
# → Whether web search is enabled
```

### 你可以用它做什么

| 场景 | 方法 |
|----------|-----|
| “你正在使用哪个模型？” | `check("model")` |
| “当前启用了哪个模型预设？” | `check("model_preset")` |
| “你还能调用多少次工具？” | `check("max_iterations")` 减去 `check("_current_iteration")` |
| “这个会话已经使用了多少 token？” | `check("_last_usage")` —— 跨所有轮次累计 |
| “你的工作目录在哪里？” | `check("workspace")` |
| “显示你的完整配置” | `check()` |
| “有正在运行的子智能体吗？” | `check("subagents")` —— 显示阶段、迭代、耗时、工具事件 |

---

## set — 运行时调优

更改会立即生效，无需重启。

```text
my(action="set", key="max_iterations", value=80)
# → Bump iteration limit from 40 to 80

my(action="set", key="model_preset", value="fast")
# → Switch to a configured model preset

my(action="set", key="model", value="fast-model")
# → Switch to a raw model and clear the active preset

my(action="set", key="context_window_tokens", value=262144)
# → Expand context window for long documents
```

你也可以把自定义状态存入草稿区：

```text
my(action="set", key="current_project", value="nanobot")
my(action="set", key="user_style_preference", value="concise")
my(action="set", key="task_complexity", value="high")
# → These values persist into the next conversation turn
```

### 受保护的参数

这些参数带有类型和范围校验——无效值会被拒绝：

| 参数 | 类型 | 范围 | 用途 |
|-----------|------|-------|---------|
| `max_iterations` | int | 1–100 | 每轮对话最多工具调用次数 |
| `context_window_tokens` | int | 4,096–1,000,000 | 上下文窗口大小 |
| `model` | str | 非空 | 要使用的 LLM 模型 |
| `model_preset` | str | 已配置的预设名称 | 要使用的命名预设 |

其他参数（例如 `workspace`、`provider_retry_mode`、`max_tool_result_chars`）只要值是 JSON-safe 的，就可以自由设置。

---

## 实际场景

### “这个任务很复杂，我需要更多空间”

```text
Agent: This codebase is large, let me expand my context window to handle it.
→ my(action="set", key="context_window_tokens", value=262144)
```

### “只是个简单问题，别浪费算力”

```text
Agent: This is a straightforward question, let me switch to the fast preset.
→ my(action="set", key="model_preset", value="fast")
```

### “跨轮次记住用户偏好”

```text
Turn 1: my(action="set", key="user_prefers_concise", value=True)
Turn 2: my(action="check", key="user_prefers_concise")
# → True (still remembers the user likes concise replies)
```

### “自我诊断”

```text
User: "Why aren't you searching the web?"
Agent: Let me check my web config.
→ my(action="check", key="web_config.enable")
# → False
Agent: Web search is disabled — please set web.enable: true in your config.
```

### “token 预算管理”

```text
Agent: Let me check how much budget I have left.
→ my(action="check", key="_last_usage")
# → {"prompt_tokens": 45000, "completion_tokens": 8000}
Agent: I've used ~53k tokens total so far. I'll keep my remaining replies concise.
```

### “子智能体监控”

```text
Agent: Let me check on the background tasks.
→ my(action="check", key="subagents")
# → 2 subagent(s):
#   [task-1] 'Code review'
#     phase: running, iteration: 5, elapsed: 12.3s
#     tools: read(✓), grep(✓)
#     usage: {'prompt_tokens': 8000, 'completion_tokens': 1200}
#   [task-2] 'Write tests'
#     phase: pending, iteration: 0, elapsed: 0.2s
#     tools: none
Agent: The code review is progressing well. The test task hasn't started yet.
```

---

## 安全机制

核心设计原则：**所有修改都只存在于内存中。重启会恢复默认值。** 智能体无法造成持久性损坏。

### 禁止访问（BLOCKED）

不能被检查或修改——完全隐藏：

| 类别 | 属性 | 原因 |
|----------|-----------|--------|
| 核心基础设施 | `bus`, `provider`, `_running` | 更改会导致系统崩溃 |
| 工具注册表 | `tools` | 不能移除自己的工具 |
| 子系统 | `runner`, `sessions`, `consolidator`, etc. | 会影响其他用户/会话 |
| 敏感数据 | `_mcp_servers`, `_pending_queues`, etc. | 包含凭证和消息路由 |
| 安全边界 | `restrict_to_workspace`, `channels_config` | 绕过会破坏隔离 |
| Python 内部 | `__class__`, `__dict__`, etc. | 防止逃逸沙箱 |

### 只读（仅 check）

可以检查，但不能设置：

| 类别 | 属性 | 原因 |
|----------|-----------|--------|
| 子智能体管理器 | `subagents` | 可观察，但替换会破坏系统 |
| 执行配置 | `exec_config` | 可以检查沙箱/启用状态，不能更改 |
| Web 配置 | `web_config` | 可以检查启用状态，不能更改 |
| 迭代计数器 | `_current_iteration` | 仅由 runner 更新 |

### 敏感字段保护

匹配敏感名称的子字段（`api_key`、`password`、`secret`、`token` 等）会被禁止进行 check 和 set，不论其父路径为何。这样可以防止通过点路径遍历泄露凭证（例如 `web_config.search.api_key`）。
