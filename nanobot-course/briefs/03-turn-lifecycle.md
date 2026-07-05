# Brief: Module 3 — "Anatomy of a turn"

File to write: `modules/03-turn-lifecycle.html`
Class: `module module-a` id: `module-3`
Read `../CONVENTIONS.md` in full before writing. This brief gives you everything else you need — do not read the nanobot source code yourself.

## Teaching arc

**Grounding metaphor (use only in this module): a factory assembly line / relay race with stations.**
One "turn" (one message in, one reply out) doesn't happen in one big step —
it moves through a fixed sequence of stations, each one doing exactly one
job and then handing the (increasingly-finished) work to the next station:
RESTORE → COMPACT → COMMAND → BUILD → RUN → SAVE → RESPOND → DONE. Nobody
skips a station out of order; the line only moves forward station-by-station
(with one shortcut lane for slash commands, covered below).

**Why should I care:** when a conversation seems "stuck" or a feature
request is "the reply forgets something," knowing there's a fixed sequence
of named stations means you can ask an AI tool to check *one specific
station* instead of "look at the whole agent," and you can reason about
*why* a mid-conversation follow-up message doesn't start a brand new,
competing process.

**Key insight to land:** this is called a **state machine** — a system that
is always in exactly one named state, with explicit rules for what state
comes next. State machines make complex, multi-step processes debuggable:
instead of a tangle of if/else, you get a small table you can read start to
finish, and every station's duration and errors get logged individually
(this codebase literally times and records each station — see the trace
snippet below).

## Pre-extracted code

**1. The eight stations, named** — `nanobot/agent/loop.py:90-98`:
```python
class TurnState(Enum):
    RESTORE = auto()
    COMPACT = auto()
    COMMAND = auto()
    BUILD = auto()
    RUN = auto()
    SAVE = auto()
    RESPOND = auto()
    DONE = auto()
```
Plain English: this is the full route, in order, listed once, top to bottom.
No station is hidden anywhere else in the code.

**2. The rulebook for what comes after what** — `nanobot/agent/loop.py:183-192`:
```python
_TRANSITIONS: dict[tuple[TurnState, str], TurnState] = {
    (TurnState.RESTORE, "ok"): TurnState.COMPACT,
    (TurnState.COMPACT, "ok"): TurnState.COMMAND,
    (TurnState.COMMAND, "dispatch"): TurnState.BUILD,
    (TurnState.COMMAND, "shortcut"): TurnState.DONE,
    (TurnState.BUILD, "ok"): TurnState.RUN,
    (TurnState.RUN, "ok"): TurnState.SAVE,
    (TurnState.SAVE, "ok"): TurnState.RESPOND,
    (TurnState.RESPOND, "ok"): TurnState.DONE,
}
```
Plain English: each station reports back one word (an "event," almost always
`"ok"`), and this table says which station is next given the current one and
that word. Notice `COMMAND` has two possible destinations: if you type a
slash command like `/new`, it takes the `"shortcut"` exit straight to `DONE`
— skipping BUILD/RUN/SAVE entirely, because there's no need to ask the LLM
anything for a command nanobot already knows how to handle itself.

**3. What each station actually does, one line each (translate these into your own words, don't just list them robotically):**
- `_state_restore` (`loop.py:1446`) — recover any in-progress work from before a crash/interruption; pull out any attached files/images.
- `_state_compact` (`loop.py:1482`) — check whether this conversation's history has grown too long and needs summarizing first.
- `_state_command` (`loop.py:1487`) — check if the message is a slash command (`/new`, `/stop`, etc.); if so, handle it directly and take the shortcut exit.
- `_state_build` (`loop.py:1512`) — assemble everything the LLM needs to see: conversation history, the new message, current tool list.
- `_state_run` (`loop.py:1558`) — the actual back-and-forth with the LLM and its tools (this is where Module 2's "lead actor," `AgentRunner`, takes over — detailed below).
- `_state_save` (`loop.py:1594`) — write the new turn to the conversation's permanent history.
- `_state_respond` (`loop.py:1633`) — package the final reply to send back down the pipe to the channel.

**4. The line runs one conversation at a time, but different conversations run side by side** — `nanobot/agent/loop.py:1033-1042` (inside `_dispatch`):
```python
lock = self._session_locks.setdefault(session_key, asyncio.Lock())
gate = self._concurrency_gate or nullcontext()

pending: asyncio.Queue | None = None
try:
    async with lock, gate:
        # Only the task that owns the session lock may publish the
        # active mid-turn injection queue for this session.
        pending = asyncio.Queue(maxsize=20)
        self._pending_queues[session_key] = pending
```
Plain English: each conversation gets its own lock — like a single-occupancy
turnstile. Your conversation with nanobot can't have two turns processing at
once and stepping on each other, but a *different* conversation (someone
else's DM, or a different chat) has its own separate turnstile and runs
fully in parallel.

**5. If you send a follow-up while nanobot is still replying, it doesn't start a second, competing turn** — `nanobot/agent/loop.py:986-1002` (inside `run()`):
```python
if effective_key in self._pending_queues:
    if self.commands.is_dispatchable_command(raw):
        await self._dispatch_command_inline(...)
        continue
    pending_msg = msg
    ...
    try:
        self._pending_queues[effective_key].put_nowait(pending_msg)
    ...
    else:
        logger.info(
            "Routed follow-up message to pending queue for session {}",
            effective_key,
        )
        continue
```
Plain English: your second message gets slipped into a small waiting line
for *that same conversation's* current turn to notice and fold in — rather
than nanobot trying to answer both at once and potentially replying twice,
out of order.

**6. Inside the RUN station: tool calls that don't depend on each other run at the same time** — `nanobot/agent/runner.py:1138-1145`:
```python
if spec.concurrent_tools and len(batch) > 1:
    batch_results = await asyncio.gather(*(
        self._run_tool(
            spec, tool_call, external_lookup_counts, workspace_violation_counts,
        )
        for tool_call in batch
    ))
    tool_results.extend(batch_results)
```
Plain English: if the LLM asks for three things at once — say, check the
weather, read a file, and search the web — none of those three need to wait
on each other, so nanobot fires them all off together and waits for all
three to finish, instead of doing them one at a time.

## Interactive elements (required for this module)

1. **Group chat animation — REQUIRED for the whole course, put the primary one here.** Frame it as a conversation between the stations/actors processing one turn. Suggested log (adapt freely, keep it snappy):
   - system: "New message: session tg:8821"
   - AgentLoop: "Restoring state, checking history length... looks fine, no compaction needed."
   - AgentLoop: "Not a slash command — building the prompt now."
   - AgentRunner: "Calling the model with 12 tools available..."
   - AgentRunner: "Model wants `get_weather` and `read_file` — running both at once."
   - AgentRunner: "Both done. Sending results back to the model for a final answer."
   - AgentLoop: "Saving this turn to history and sending the reply."
2. At least one **code-translation** block (use snippet 4 or 6).
3. At least one **quiz** — suggest multiple-choice using the scenario from snippet 5: "You send nanobot two messages in a row before it's replied to the first. What happens?"
4. At least one **glossary** tooltip on: "state machine" (plain English already given above — reuse it), "lock" ("a rule that only one thing at a time can hold — like a single key to a single door").
5. One **callout**: on state machines as a general debugging tool — e.g. "Aha! Any time a process has 'phases' (checkout flows, deploy pipelines, onboarding wizards), a state machine like this one is often how it's actually built under the hood — and it's exactly why good logs name the phase, not just 'something broke'."

## Transitions

- Open with a callback: "Module 2 introduced the director and lead actor. Now watch them run one full scene, station by station."
- Close bridging to module 4: something like "Everything so far has happened inside nanobot's own walls. Next: what happens the moment nanobot needs to reach *outside* — a different chat platform, a different AI provider, or the open internet."
