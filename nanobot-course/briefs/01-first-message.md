# Brief: Module 1 — "Meet nanobot: one message's journey"

File to write: `modules/01-first-message.html`
Class: `module module-a` id: `module-1`
Read `../CONVENTIONS.md` in full before writing (markup patterns, content philosophy, common mistakes). This brief gives you everything else you need — do not read the nanobot source code yourself.

## Teaching arc

**Grounding metaphor (use only in this module): mailing a letter.**
A message you send is like dropping a letter in a mailbox: it goes to a
sorting facility, gets picked up by a caseworker who reads it, may send
runners out to fetch things (weather report, a calendar lookup) or write on
your behalf, and then a reply comes back through the same path. Every later
module will zoom into one stop on this route — this module's only job is to
walk the whole route once, at a human pace.

**What nanobot actually is (say this plainly, early):** nanobot is an
open-source, self-hosted personal AI assistant. You run it on your own
machine/server; it connects to chat apps you already use (Telegram, Discord,
Slack, WeChat, a built-in web chat UI, etc.), talks to an LLM (Claude, GPT,
etc.) as its "brain," and can use tools — read/write files, run shell
commands, search the web — to actually get things done, not just chat. The
project's own tagline: "an open-source, ultra-lightweight personal AI agent
you can truly own."

**Opening hook (use near-verbatim, it's concrete and specific):**
Imagine you text your nanobot on Telegram: *"remind me to call mom at 5pm,
and check what the weather's like first."* Less than two seconds later
you're watching it type back. This module is everything that happens in
between.

**Why should I care (state explicitly, early on):** once you can picture
this whole round trip, you can tell an AI coding tool exactly *where* to add
a feature ("that belongs in a channel, not in the core loop") instead of
guessing — and when something breaks, you know which of the 5-ish stops to
suspect first.

**Key insight to land by the end:** nanobot's core is deliberately small.
A message is handed from stop to stop, and every stop only knows how to do
its one job — it doesn't need to know what happens two stops away. That
separation is *why* nanobot can support a dozen chat platforms and several
different AI providers without the core code caring which ones are in use.

## Pre-extracted code (use these verbatim, cite the file:line exactly as given)

**1. The whole reply loop lives on top of two simple queues** — `nanobot/bus/queue.py:16-34`:
```python
def __init__(self):
    self.inbound: asyncio.Queue[InboundMessage] = asyncio.Queue()
    self.outbound: asyncio.Queue[OutboundMessage] = asyncio.Queue()

async def publish_inbound(self, msg: InboundMessage) -> None:
    """Publish a message from a channel to the agent."""
    await self.inbound.put(msg)

async def consume_inbound(self) -> InboundMessage:
    """Consume the next inbound message (blocks until available)."""
    return await self.inbound.get()

async def publish_outbound(self, msg: OutboundMessage) -> None:
    """Publish a response from the agent to channels."""
    await self.outbound.put(msg)
```
Plain English: this whole class is really just two lines — an in-tray and an
out-tray. A "queue" is a list where things get added at one end and taken off
the other, in order (first come, first served) — like a single-file line at
a mailroom window. Every chat platform (Telegram, Slack, the web UI...) drops
letters into the same in-tray; nothing about the sorting facility needs to
know which mailbox the letter came from.

**2. `AgentLoop.run()` is the sorting facility worker, forever pulling the next letter** — `nanobot/agent/loop.py:938-946` (inside the `while self._running:` loop):
```python
try:
    msg = await asyncio.wait_for(self.bus.consume_inbound(), timeout=1.0)
except asyncio.TimeoutError:
    self.auto_compact.check_expired(
        self._schedule_background,
        active_session_keys=self._pending_queues.keys(),
    )
    continue
```
Plain English: it waits up to one second for a new letter; if none shows up,
it uses the idle moment to do housekeeping (checking whether any
conversation has gone quiet long enough to tidy up its memory), then goes
back to waiting.

**3. Each conversation gets dispatched as its own task** — `nanobot/agent/loop.py:1016-1017`:
```python
task = asyncio.create_task(self._dispatch(msg))
self._active_tasks.setdefault(effective_key, []).append(task)
```
Plain English: nanobot doesn't process your message and then sit there
waiting before it can look at anyone else's — it spins your message off as
its own independent errand so it can immediately go back to watching for the
next letter. (Module 3 covers exactly how it keeps *your own* conversation in
order while doing this.)

**4. The final step: writing the reply back to the out-tray** — `nanobot/agent/loop.py:1087-1088`:
```python
if response is not None:
    await self.bus.publish_outbound(response)
```
Plain English: same trick in reverse — the reply goes into the shared
out-tray, and whichever channel adapter is watching for mail addressed to
your Telegram chat picks it up and delivers it.

## Interactive elements (required for this module)

1. **Message/data flow animation — REQUIRED for the whole course, put the primary one here.** Steps should walk: `Telegram (channel)` → `MessageBus (in-tray)` → `AgentLoop (caseworker)` → `AgentRunner + LLM (writes the reply, may dispatch tool "runners")` → `MessageBus (out-tray)` → `Telegram (delivered)`. Use 5-6 `flow-node`s and matching steps; captions should read like a story ("Your text lands in Telegram's inbox for this bot..." → "...and a moment later that same channel delivers the reply."). This is the module's centerpiece — spend the most craft here.
2. At least one **code-translation** block (use snippet 1 or 2 above).
3. At least one **quiz** — suggest a multiple-choice quiz: "When your message arrives, does nanobot handle it immediately or get in line?" with options playing on the queue concept.
4. At least one **glossary** tooltip on first use of: "queue", "async task" (define async as "she can start something and go do other work while it finishes, instead of standing there waiting").
5. One **callout**: something like "Aha! Two independent queues (in and out) is a classic pattern called a message bus — it's how you let two systems (channels and the agent brain) talk without ever needing to know about each other's internals directly."

## Transitions

- This is the first module — no "previous" to reference. End the module with a short bridge sentence pointing forward: something like "We just watched the whole trip happen. Next: meet everyone working at each stop along that route."
- Next module (2) is "Meet the cast" — covers MessageBus, AgentLoop, AgentRunner, Tools, Providers, Channels as distinct actors, using a theater/backstage metaphor. Do not use theater imagery yourself in this module — leave it for module 2.
