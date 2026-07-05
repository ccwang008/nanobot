# Brief: Module 2 — "Meet the cast"

File to write: `modules/02-actors.html`
Class: `module module-b` id: `module-2`
Read `../CONVENTIONS.md` in full before writing. This brief gives you everything else you need — do not read the nanobot source code yourself.

## Teaching arc

**Grounding metaphor (use only in this module): a theater production.**
Module 1 walked the whole route a message takes. This module stops the tour
and introduces everyone working backstage, the way a theater program lists
its cast and crew before the show starts:
- **Channels** (Telegram, Discord, Slack, the web UI, 15+ others) are the
  **ushers who speak the audience's language** — each one translates a
  different platform's way of sending a message into one common form
  everyone backstage understands.
- **MessageBus** is the **stage manager's call sheet** — the shared list
  everyone reads from and writes to, so the ushers never need to talk to the
  actors directly.
- **AgentLoop** is the **director** — owns the whole show for one
  conversation: decides what happens next, in what order, and calls the cues.
- **AgentRunner** is the **lead actor actually improvising the scene** — the
  one who's on stage doing the actual back-and-forth with the LLM and
  requesting props (tools) when needed.
- **ToolRegistry** is the **prop table** — everything the actor is allowed to
  reach for (read a file, run a shell command, search the web), catalogued
  and ready to hand over on request.
- **Providers** are the **scriptwriter** — the LLM (Claude, GPT, etc.) that's
  actually generating the lines; nanobot can swap which scriptwriter it's
  using without changing anyone else's job.

**Why should I care:** knowing which actor owns which job is exactly what
lets you tell an AI coding tool "add this feature as a new channel" or "that
belongs in the tool registry, not the director's script" — and to guess
correctly which file to open when something's broken.

**Key insight to land:** every actor here is *replaceable on its own*. You
can add a 16th channel, or swap the scriptwriter (provider) for a different
LLM, or add a new tool to the prop table — without touching the director's
script (`agent/loop.py`) at all. That's a deliberate design rule in this
codebase, not an accident.

## Pre-extracted code

**1. Every channel is required to implement the same three cues** — `nanobot/channels/base.py:74-102` (abbreviated, keep the docstrings — they read like stage directions):
```python
@abstractmethod
async def start(self) -> None:
    """
    Start the channel and begin listening for messages.
    This should be a long-running async task that:
    1. Connects to the chat platform
    2. Listens for incoming messages
    3. Forwards messages to the bus via _handle_message()
    """

@abstractmethod
async def stop(self) -> None:
    """Stop the channel and clean up resources."""

@abstractmethod
async def send(self, msg: OutboundMessage) -> None:
    """Send a message through this channel."""
```
Plain English: this is the contract every usher (channel) must sign — however
Telegram's API and Slack's API differ under the hood, both must know how to
start listening, stop, and hand a reply to their platform. Nobody else in
the codebase needs to know those differences exist.

**2. Channels aren't hand-registered one by one — they're discovered automatically** — `nanobot/channels/manager.py:96-104` (comment + first lines):
```python
def _init_channels(self) -> None:
    """Initialize channels discovered via pkgutil scan + entry_points plugins."""
    from nanobot.channels.registry import discover_channel_names, discover_enabled
    # Collect enabled module names first, then only import those.
    names = discover_channel_names()
```
Plain English: nanobot scans its own `channels/` folder (and any installed
plugins) for anything that looks like a channel, rather than keeping a
hardcoded list somewhere that someone has to remember to update. Add a new
file that follows the contract above, and it's automatically found.

**3. The prop table: tools are registered by name and executed by name** — `nanobot/agent/tools/registry.py:24-27` and `:165-179`:
```python
def register(self, tool: Tool) -> None:
    """Register a tool."""
    self._tools[tool.name] = tool
    self._cached_definitions = None
```
```python
async def execute(self, name: str, params: Any) -> Any:
    """Execute a tool by name with given parameters."""
    hint = "\n\n[Analyze the error above and try a different approach.]"
    tool, params, error = self.prepare_call(name, params)
    if error:
        return ToolResult.error(str(error) + hint)
    try:
        assert tool is not None
        result = await tool.execute(**params)
        ...
```
Plain English: the registry is a dictionary from tool name to tool object.
When the LLM says "call `read_file` with this path," the registry looks up
`read_file`, validates the arguments, and only then actually runs it — the
lead actor (AgentRunner) never talks to the filesystem directly.

**4. The director hands the scene to the lead actor** — `nanobot/agent/loop.py:294` (inside `AgentLoop.__init__`):
```python
self.runner = AgentRunner(provider)
```
Plain English: one line, but it's the seam between this module's two most
important actors — the director (`AgentLoop`) owns the conversation and its
memory; the lead actor (`AgentRunner`, Module 3's subject) owns the actual
back-and-forth with the LLM and its tools, one turn at a time.

**5. The scriptwriter's contract includes automatic retrying** — `nanobot/providers/base.py:724-736` (signature + docstring only, do not include the body):
```python
async def chat_with_retry(
    self,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]] | None = None,
    model: str | None = None,
    ...
    retry_mode: str = "standard",
    on_retry_wait: Callable[[str], Awaitable[None]] | None = None,
) -> LLMResponse:
    """Call chat() with retry on transient provider failures."""
```
Plain English: every provider (Anthropic, OpenAI, Azure, Bedrock...) shares
this same method name and shape. If the scriptwriter's line is temporarily
unavailable (a rate limit, a dropped connection), this automatically waits
and asks again — the rest of the cast doesn't need to know that happened.

## Interactive elements (required for this module)

1. **Pattern cards grid** (optional element type, use it here) — one card per actor (Channels, MessageBus, AgentLoop, AgentRunner, ToolRegistry, Providers), one sentence each, matching the theater role assigned above.
2. At least one **code-translation** block (use snippet 1 or 3).
3. At least one **quiz** — suggest **drag-and-drop matching**: match each actor name (chip) to its one-line job description (drop zone) — e.g. "MessageBus" → "the shared list everyone reads from", "ToolRegistry" → "the catalogue of things the actor is allowed to use".
4. At least one **glossary** tooltip on: "abstract class / contract" (plain English: "a rulebook every implementation must follow, even though each one fills in the details differently"), "registry" ("a lookup table you can add new entries to without changing the code that reads from it").
5. One **callout**: on the "extend at the edges" principle — something like "Aha! Notice nobody here needs to change `AgentLoop` itself to add a 16th chat platform or a new AI provider. That's what software people call a stable core with pluggable edges — it's why large systems don't collapse under their own feature list."

## Transitions

- Open with a one-line callback to module 1: "We just watched a letter travel the whole route. Now let's meet everyone working at each stop."
- Close with a bridge to module 3: something like "Knowing who's who is step one. Next: watch the director (AgentLoop) and lead actor (AgentRunner) actually run one scene from first line to last, including what happens when two lines want to be spoken at once."
- Do NOT use the assembly-line/relay metaphor here — that belongs to module 3.
