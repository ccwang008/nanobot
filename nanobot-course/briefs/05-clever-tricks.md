# Brief: Module 5 — "The clever tricks"

File to write: `modules/05-clever-tricks.html`
Class: `module module-a` id: `module-5`
Read `../CONVENTIONS.md` in full before writing. This brief gives you everything else you need — do not read the nanobot source code yourself.

## Teaching arc

**Grounding metaphor (use only in this module): sleeping and dreaming to consolidate memories.**
This is not a stretch — the codebase's own name for this mechanism is
literally **"Dream."** Neuroscience says your brain doesn't file away a
day's experience as it happens; it replays and consolidates memories while
you sleep, turning a messy stream of moments into a few things worth
keeping. nanobot does the same thing on a schedule: it keeps a running,
append-only diary of everything that happened (`history.jsonl`), and
periodically runs a separate "Dream" pass — an LLM call whose only job is to
read the unprocessed diary entries and boil them down into durable notes
(`MEMORY.md`, `SOUL.md`, `USER.md`).

Two more "clever tricks" belong in this module and connect naturally to the
sleep metaphor as *supporting* ideas (don't force full separate metaphors
for them — a short simile each is enough):
- **Subagents** — like sending an intern out to run an errand while you keep
  working the front desk; they text you the result when they're done instead
  of you standing there waiting.
- **Sustained goals** (`long_task` / `complete_goal`) — a sticky note pinned
  to the top of your desk so a multi-day task doesn't get forgotten even if
  your desk gets cleared (conversation history compacted) in between.

**Why should I care:** understanding that memory consolidation happens
*separately* from live conversation explains why nanobot can stay useful
over weeks without its context window overflowing — and understanding
subagents/sustained goals explains why you can ask it to "keep working on
this for a while" and trust it won't lose the thread.

**Key insight to land:** durability (not losing data) and intelligence
(good judgment about what to remember) are two *different* problems, solved
two different ways here — durability with a boring, rock-solid file-write
trick; judgment with an LLM call. Good engineering often looks like this:
the boring 5% (crash-safety) is handled with total rigor, freeing the
clever 95% (what's worth remembering) to be handled by something smarter.

## Pre-extracted code

**1. The diary: every entry gets a permanent, ordered ticket number** — `nanobot/agent/memory.py:274-289` (trimmed):
```python
# Cursor allocation and the append must be atomic: concurrent writers
# could otherwise read the same current cursor and emit duplicates.
with self._append_lock:
    cursor = self._next_cursor()
    ...
    record = {"cursor": cursor, "timestamp": ts, "content": content}
    if session_key:
        record["session_key"] = session_key
    with open(self.history_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    self._cursor_file.write_text(str(cursor), encoding="utf-8")
```
Plain English: every diary entry gets the next number in line (cursor 1, 2,
3...), and handing out that number plus writing the entry happens as one
uninterruptible step (the `with self._append_lock:` part) — so if two things
try to write a diary entry at the exact same moment, they can't accidentally
get the same ticket number and silently overwrite each other.

**2. Rewriting the whole diary (e.g. after trimming old entries) never leaves it half-written, even if the power dies mid-write** — `nanobot/agent/memory.py:446-455`:
```python
def _write_entries(self, entries: list[dict[str, Any]]) -> None:
    """Overwrite history.jsonl with the given entries (atomic write)."""
    tmp_path = self.history_file.with_suffix(self.history_file.suffix + ".tmp")
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            for entry in entries:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, self.history_file)
```
Plain English: instead of erasing the real diary and writing the new version
into the same spot (risky — a crash halfway through leaves a half-written,
corrupt file), nanobot writes the *entire* new version to a scratch file
first, makes sure it's fully saved to disk (`fsync`), and only *then* swaps
the scratch file in to replace the real one in one atomic move
(`os.replace`). There is never a moment where the real file is partially
written.

**3. The Dream pass: find everything since the last time you slept on it** — `nanobot/agent/memory.py:523-531` (trimmed):
```python
def build_dream_prompt(self, *, max_entries: int = 20) -> tuple[str, int] | None:
    """Build the Dream prompt with unprocessed history context."""
    last_cursor = self.get_last_dream_cursor()
    entries = self.read_unprocessed_history(since_cursor=last_cursor)
    if not entries:
        return None
    batch = entries[:max_entries]
```
Plain English: nanobot remembers the ticket number of the last diary entry
it already "dreamed about," and only feeds the *new* entries since then into
the next Dream pass — so consolidating memory is incremental, not "re-read
your entire life story every night."

**4. Subagents: send an intern out, keep working, get texted when they're done** — `nanobot/agent/subagent.py:181-208` (trimmed):
```python
bg_task = asyncio.create_task(
    self._run_subagent(
        task_id, task, display_label, origin, status,
        origin_message_id, temperature, workspace_scope,
    )
)
self._running_tasks[task_id] = bg_task
...
logger.info("Spawned subagent [{}]: {}", task_id, display_label)
return f"Subagent [{display_label}] started (id: {task_id}). I'll notify you when it completes."
```
Plain English: spawning a subagent doesn't block the main conversation at
all — it kicks off a separate background task and immediately replies "on
it, I'll let you know." When that background task finishes, it announces
its result back onto the same message bus from Module 1/2, tagged as a
system message, so the main conversation picks it back up naturally.

**5. Sustained goals: a sticky note that survives even if the desk gets cleared** — `nanobot/agent/tools/long_task.py:150-179` (trimmed):
```python
async def execute(self, goal: str, ui_summary: str | None = None, **kwargs: Any) -> str:
    sess = self._session()
    ...
    blob = {
        "status": "active",
        "objective": goal.strip(),
        "ui_summary": summary,
        "started_at": _iso_now(),
    }
    sess.metadata[GOAL_STATE_KEY] = blob
    ...
    return (
        "Goal recorded. Keep working toward the objective using ordinary tools. "
        "When fully done (verified against what was asked), call complete_goal with a "
        f"short recap.{extra}"
    )
```
Plain English: this doesn't start some special separate process — it just
writes "here's the standing objective" onto the conversation's own metadata.
Crucially (per the module docstring), that objective gets re-mentioned to
the model on every single turn, specifically *so that* summarizing/trimming
old history (Module elsewhere) can never make the model quietly forget what
it was supposed to be working on.

## Interactive elements (required for this module)

1. Optional **group chat animation** (a second one is fine — only one is mandatory course-wide, and it's already in Module 3): frame it as the main agent "texting" a subagent an errand and getting a result back later — e.g. system: "spawn subagent: research flight prices", subagent: "[working in background]", (pause), subagent: "Done — cheapest is Tuesday, $210. Announcing result.", AgentLoop: "Got it, folding that into the reply."
2. At least one **code-translation** block (use snippet 1 or 2 — the atomic write is the most "aha"-worthy).
3. At least one **quiz** — suggest **spot-the-bug**: show a *broken* version of `_write_entries` that does `open(self.history_file, "w")` directly (no tmp file, no fsync, no `os.replace`) and ask the reader to spot which line would corrupt the diary if the process crashed mid-write. Model this closely on the CONVENTIONS.md spot-the-bug example.
4. At least one **glossary** tooltip on: "atomic" (plain English: "either the whole thing happens, or none of it does — never caught halfway"), "background task" ("work that keeps running without making you wait for it").
5. One **callout**: on the durability-vs-judgment split — e.g. "Aha! Notice the crash-safety trick (atomic write) is dumb, boring, and 100% reliable — no AI involved. The judgment call (what's worth remembering) is the one part handed to an LLM. That split — rigid code for the parts that must never fail, a smarter model for the parts that need judgment — shows up everywhere in well-built AI systems."

## Transitions

- Open with a callback: "Module 4 was about nanobot's border with the outside world. This module is about what it does with everything it learns *after* it comes back inside."
- Close bridging to module 6: something like "One thread is still loose: everything so far has been chat messages in, chat messages out. Next: the web app you might actually be looking at right now, how it's wired to all of this, and what to check first when something misbehaves."
