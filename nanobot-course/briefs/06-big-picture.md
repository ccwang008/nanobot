# Brief: Module 6 — "The big picture"

File to write: `modules/06-big-picture.html`
Class: `module module-b` id: `module-6`
Read `../CONVENTIONS.md` in full before writing. This brief gives you everything else you need — do not read the nanobot source code yourself. This is the LAST module — end the course with a sense of completion, not a cliffhanger.

## Teaching arc

**Grounding metaphor (use only in this module): a cockpit with a flight recorder.**
Everything so far has been chat messages in, chat messages out. But there's
also a full web app (the WebUI you might be looking at right now, in a
browser) sitting on top of the exact same MessageBus/AgentLoop from earlier
modules — it's just another "channel," a slightly more special one, that
also happens to serve the web page itself. And every well-built cockpit has
instruments and a flight recorder for when something goes wrong — this
module closes with how nanobot's own "black box" (the turn trace from
Module 3) helps you or an AI coding tool debug it fast instead of guessing.

**Why should I care:** this module is the payoff for the whole course — it's
where "I understand how this works" turns into "I know exactly what to ask
an AI coding tool to check first" when something breaks, and where to add
a feature so it doesn't fight the grain of the design.

**Key insight to land (close the course on this):** everything in this
course was one recurring shape: a small, stable core (the message bus, the
turn state machine) with clearly-bordered, swappable pieces around the edge
(channels, providers, tools). That's not an accident of this one project —
it's a design instinct worth recognizing in *any* codebase you work with:
find the stable core first, then look for the edges you're actually allowed
to touch.

## Pre-extracted code

**1. The WebUI's browser tab talks to nanobot over the same channel system as Telegram or Slack — it's just a `WebSocketChannel`** — describe this in prose using Module 2's `BaseChannel` contract (do not re-paste that code — just say: the WebUI is not a special case wired directly into the agent core; it's another implementation of the same `start` / `stop` / `send` contract every channel follows, which happens to also serve the compiled WebUI's HTML/JS files).

**2. Messages between the browser and nanobot travel as small JSON "envelopes" with a `type` field** — `nanobot/channels/websocket.py:199-218` (trimmed):
```python
def _parse_envelope(raw: str) -> dict[str, Any] | None:
    """Return a typed envelope dict if the frame is a new-style JSON envelope, else None."""
    text = raw.strip()
    if not text.startswith("{"):
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    t = data.get("type")
    if not isinstance(t, str):
        return None
    return data
```
Plain English: every message flowing over the WebSocket connection between
your browser tab and nanobot is a small labeled package — a JSON object with
a `type` field saying what kind of thing it is (a new chat message, a
streamed reply chunk, a status update...). The browser and the server both
speak this same small, explicit vocabulary — nothing is inferred or guessed
from raw text.

**3. Nanobot keeps its own flight recorder — every station from Module 3 is timed and logged individually** — `nanobot/agent/loop.py:101-107` and `:1379-1394` (trimmed):
```python
@dataclass
class StateTraceEntry:
    state: TurnState
    started_at: float
    duration_ms: float
    event: str
    error: str | None = None
```
```python
duration = (time.perf_counter() - t0) * 1000
ctx.trace.append(
    StateTraceEntry(
        state=ctx.state,
        started_at=t0,
        duration_ms=duration,
        event=event,
    )
)
logger.debug(
    "[turn {}] State {} took {:.1f}ms -> event {}",
    ctx.turn_id, ctx.state.name, duration, event,
)
```
Plain English: every single station from Module 3's assembly line
(RESTORE, COMPACT, BUILD, RUN...) gets its own timestamped entry — how long
it took, what it reported, and the error if it failed. If a reply is slow or
wrong, this trace tells you (or an AI debugging tool) exactly which station
to look at first, instead of re-reading the whole turn from scratch.

**4. The project's own rule for where new code belongs — quote this directly, it's from the repo's internal engineering guidelines (`.agent/design.md`), not a code file, so present it as a quoted principle rather than a code block:**
> "New capabilities should be added via `channels/`, `tools/`, skills, or MCP
> servers... If a feature can live in a channel adapter, a tool, or an
> external MCP server, it should not be inlined into the agent loop."

Plain English: this is the project's own explicit answer to "where do I add
my feature?" — and it's the same lesson this whole course has been
building toward through the theater cast (Module 2), the assembly line
(Module 3), and the border crossing (Module 4): find the small stable core,
then extend at the edges.

## Interactive elements (required for this module)

1. At least one **code-translation** block (use snippet 2 or 3).
2. At least one **quiz** — suggest multiple-choice: "Nanobot's reply to your Telegram message is oddly slow today. Which station's timing entry (from the flight recorder) would you check first — RESTORE, BUILD, or RUN?" with an explanation that RUN is where the actual LLM call and tool execution happen, so it's usually the first suspect for slowness, while RESTORE/BUILD are typically fast bookkeeping steps.
3. At least one **glossary** tooltip on: "WebSocket" (plain English: "a phone line that stays open between your browser and the server, so either side can talk at any moment, instead of the browser having to call back and ask 'anything new?' over and over").
4. One or two **callouts**: (a) the "stable core, swappable edges" recap as the course's closing universal insight (this can double as the course's final thought — make it feel like a satisfying close, not just another tip); (b) optionally, a smaller one on why explicit typed envelopes/messages (snippet 2) beat guessing from raw text — general lesson about explicit protocols.
5. A **closing screen** (final `.screen` in this module) that briefly recaps the whole course arc in 4-6 short lines (one per module, one clause each) and ends on an encouraging, practical note about what the reader can now do that they couldn't before (steer an AI tool with the right vocabulary, guess correctly where a bug lives, ask for features scoped the way this codebase actually wants them scoped). Do not introduce any new code or new concepts in this closing screen.

## Transitions

- Open with a callback: "Module 5 was about what nanobot remembers. This last module is about the app you're probably reading this on, and what to do when something goes sideways."
- This is the final module — no forward bridge. End on the closing recap screen described above.
