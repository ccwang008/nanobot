# Module authoring conventions

You are writing ONE file: `modules/0N-slug.html`. It must contain ONLY a
single `<section class="module module-a|module-b" id="module-N">...</section>`
element and its contents. Do NOT include `<html>`, `<head>`, `<body>`,
`<style>`, or `<script>` tags — those live in `_base.html` / `_footer.html`
and are assembled by `build.sh`. Do NOT touch `styles.css` or `main.js`.

Alternate `module-a` / `module-b` per your assigned module number (odd =
`module-a`, even = `module-b`) — this is what produces the alternating
background rhythm across the course.

## Section skeleton

```html
<section class="module module-a" id="module-1">
  <div class="module-inner">
    <p class="module-eyebrow">Module 1</p>
    <h2 class="module-title">Meet nanobot: one message's journey</h2>
    <p class="lede">Opening hook paragraph — 1-3 sentences, concrete, grounded in a real user action.</p>

    <div class="screen">
      <!-- screen 1 content -->
    </div>
    <div class="screen">
      <!-- screen 2 content -->
    </div>
    <!-- 3-6 screens total -->
  </div>
</section>
```

Each `.screen` is one scrollable beat within the module. Keep each screen to
2-4 short paragraphs max — this course is read on a phone as often as a
laptop. Never wall-of-text. White space is part of the design, not a gap to
fill.

## Content philosophy (read before writing prose)

- **Zero technical background assumed.** The reader is a "vibe coder" who
  directs AI coding tools in plain language. They have never heard the words
  "async", "queue", "state machine", or "dependency injection" — define every
  term the first time it appears in your module, in plain English, via a
  `.glossary` tooltip (see below).
- **Every module opens with "why should I care?"** before "how does it
  work?" The payoff is always practical: this helps you steer AI better,
  debug faster, or make a smarter architectural call. Say that payoff
  explicitly in the first screen.
- **One grounding metaphor per module**, used consistently within that
  module, then dropped. Never reuse a metaphor across modules. Never use a
  restaurant metaphor — it's the most overused metaphor in tech education
  and immediately reads as generic. Your assigned brief names the metaphor
  for your module; if it feels forced anywhere, adapt the wording but keep
  the same underlying image.
- **Ground abstractions in the concrete code.** Don't describe what the code
  "generally does" — quote it, then translate it. Every code snippet in your
  brief has a real file path and line number; keep those visible via the
  `.filename` element so the reader trusts this is real, not illustrative
  pseudocode.
- **Callouts are for universal insights**, not codebase trivia. A callout
  should teach something that generalizes beyond nanobot (e.g. "this is why
  systems use state machines," "this is what 'atomic write' means and why
  crash-safety needs it") — not just restate what the code does.

## Interactive element markup

### Code block (with optional syntax spans)

```html
<div class="code-block">
  <span class="filename">nanobot/bus/queue.py:20-22</span>
  <pre><code><span class="tok-kw">async def</span> <span class="tok-fn">publish_inbound</span>(self, msg): <span class="tok-com"># hand a message to the agent</span>
    <span class="tok-kw">await</span> self.inbound.put(msg)</code></pre>
</div>
```

Token span classes: `tok-kw` (keywords), `tok-str` (strings), `tok-com`
(comments), `tok-fn` (function/method names), `tok-num` (numbers), `tok-punct`
(punctuation you want to highlight, use sparingly). You don't need to tag
every token — tag enough that the block doesn't look like a flat gray wall,
skip the rest.

### Code ↔ plain-English translation (at least one per module, non-negotiable)

```html
<div class="code-translation">
  <div class="code-block">
    <span class="filename">path/to/file.py:12</span>
    <pre><code>...</code></pre>
  </div>
  <div class="plain-pane">
    <p class="plain-label">In plain English</p>
    <p>What this code does, in one or two sentences a non-programmer can follow.</p>
  </div>
</div>
```

### Callout / "aha!" box (1-2 per module)

```html
<div class="callout">
  <p class="callout-label">Aha!</p>
  <p>The universal CS insight, stated in one or two sentences.</p>
</div>
```

### Glossary tooltip (first use of every technical term, per module)

```html
<span class="glossary" tabindex="0">queue<span class="glossary-tip">A list where things get added at one end and taken off the other, in order — like a line at a checkout counter.</span></span>
```

### Multiple-choice quiz (at least one per module)

```html
<div class="quiz" data-quiz="mc">
  <p class="quiz-question">If two chat messages arrive for the same conversation at once, what does nanobot do?</p>
  <ul class="quiz-options">
    <li><button class="quiz-option" data-correct="false" data-explain="Close — but nanobot doesn't drop the second message.">Only the first one gets a reply</button></li>
    <li><button class="quiz-option" data-correct="true" data-explain="Right — a per-session lock means one conversation is processed at a time, in order.">The second one waits its turn for that same conversation</button></li>
    <li><button class="quiz-option" data-correct="false" data-explain="Different conversations do run concurrently — but not the same one.">They're always processed at the same time no matter what</button></li>
  </ul>
  <div class="quiz-feedback"></div>
</div>
```

### Spot-the-bug quiz

```html
<div class="quiz" data-quiz="spot">
  <div class="code-block">
    <pre><code><span class="spot-line" data-correct="false">def append_history(self, entry):</span>
<span class="spot-line" data-correct="false">    with open(self.history_file, "w") as f:</span>
<span class="spot-line" data-correct="true" data-explain="Opening in 'w' mode truncates the file, wiping every prior entry before writing the new one.">        f.write(entry)</span></code></pre>
  </div>
  <div class="quiz-feedback"></div>
</div>
```

### Drag-and-drop matching quiz

```html
<div class="quiz dragdrop" data-quiz="dragdrop">
  <div class="dragdrop-chips">
    <span class="dragdrop-chip" draggable="true" data-value="bus">MessageBus</span>
    <span class="dragdrop-chip" draggable="true" data-value="loop">AgentLoop</span>
  </div>
  <div class="dragdrop-zones">
    <div class="dragdrop-zone" data-answer="bus"><span class="zone-label">Holds messages waiting to be processed</span></div>
    <div class="dragdrop-zone" data-answer="loop"><span class="zone-label">Runs the turn state machine</span></div>
  </div>
  <div class="quiz-feedback"></div>
</div>
```

Works by drag, or by click-chip-then-click-zone (touch-friendly automatically
— no extra markup needed).

### Group chat animation (at least one across the whole course — check your brief)

```html
<div class="chat-window" data-autoplay data-speed="900">
  <div class="chat-title">#agent-internals <button class="chat-replay">Replay</button></div>
  <div class="chat-log">
    <div class="chat-bubble system">Telegram → MessageBus</div>
    <div class="chat-bubble left"><span class="who">AgentLoop</span>New message for session tg:8821. Locking that session, handing off to AgentRunner.</div>
    <div class="chat-bubble right"><span class="who">AgentRunner</span>Got it. Calling the model with tools available...</div>
  </div>
</div>
```
`left` = "internal system speaking," `right` = "the component that answers,"
`system` = a small centered label for a transition. Pick sides by whichever
reads better for your conversation — consistency within the bubble log
matters more than a strict rule.

### Message / data flow animation (at least one across the whole course — check your brief)

```html
<div class="flow-animation" data-steps='[
  {"active":["channel"],"packetFrom":0,"packetTo":0,"packetProgress":1,"caption":"You send a message in Telegram."},
  {"active":["bus"],"packetFrom":0,"packetTo":1,"packetProgress":1,"caption":"The channel drops it in the inbound queue."},
  {"active":["loop"],"packetFrom":1,"packetTo":2,"packetProgress":1,"caption":"AgentLoop picks it up and starts a turn."}
]'>
  <div class="flow-track">
    <div class="flow-node" data-id="channel">Telegram</div>
    <div class="flow-node" data-id="bus">MessageBus</div>
    <div class="flow-node" data-id="loop">AgentLoop</div>
    <div class="flow-packet"></div>
  </div>
  <div class="flow-caption"></div>
  <div class="flow-controls">
    <button class="flow-step-btn" data-dir="prev">&larr; Back</button>
    <span class="flow-progress"></span>
    <button class="flow-step-btn" data-dir="next">Next &rarr;</button>
    <button class="flow-replay">Replay</button>
  </div>
</div>
```
`packetFrom`/`packetTo` are zero-based indexes into the `.flow-node` list in
document order. Steps auto-play the first frame when scrolled into view;
Next/Back/Replay are manual controls — always include all three buttons.

### Pattern cards (optional — for "meet the actors" style enumeration)

```html
<div class="pattern-grid">
  <div class="pattern-card"><h4>MessageBus</h4><p>Two async queues. Channels put messages in, AgentLoop takes them out.</p></div>
  <div class="pattern-card"><h4>AgentLoop</h4><p>Owns one conversation's turn: builds context, calls the runner, saves history.</p></div>
</div>
```

### Architecture diagram wrapper (optional, for anything wide/complex)

```html
<div class="diagram">
  <!-- inline SVG or an ASCII/HTML box diagram; wrapped so it scrolls horizontally instead of breaking layout -->
</div>
```

## Common mistakes to avoid

- Forgetting the `.quiz-feedback` div — quizzes render but never show a result without it.
- Nesting a `.module` inside a `.module` — one `<section class="module">` per file.
- Putting real prose inside `<pre><code>` — only literal code/output goes there.
- Skipping the file:line citation on a code block — every snippet should look traceable back to the repo.
- Writing more than ~6 screens — if you need more, the module is trying to teach two things; lean on your brief's scope instead.
- Reusing another module's metaphor or opening line style — read the "why it matters" framing in your brief and make the opening feel specific to your topic.
