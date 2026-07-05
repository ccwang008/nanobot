# Brief: Module 4 — "The outside world"

File to write: `modules/04-outside-world.html`
Class: `module module-a` id: `module-4`
Read `../CONVENTIONS.md` in full before writing. This brief gives you everything else you need — do not read the nanobot source code yourself.

## Teaching arc

**Grounding metaphor (use only in this module): an international border crossing.**
Everything so far happened inside nanobot's own building. This module is
about the border: chat platforms speaking different "languages" get
translated into one common form the moment they cross in (interpreters at
the gate); if your first-choice interpreter (AI provider) is unavailable, a
backup steps in automatically; and anything trying to reach *out* through
that border — a web fetch, an MCP server call — has to clear a checkpoint
that refuses to let it sneak into restricted territory.

**Why should I care:** this is the module that explains why nanobot can be
trusted to run with real power (reading files, running shell commands,
fetching URLs) without becoming a security hole — and it's the part of the
codebase you must not casually bypass when an AI coding tool suggests a
"quick fix" that reaches the network directly.

**Key insight to land:** a security boundary is only as good as the *one*
place everything is forced to go through. nanobot has exactly one checkpoint
function that every outbound web request passes through — not a rule
copy-pasted in twenty different tools. That's the difference between a
boundary you can actually trust and one that's just "mostly followed."

## Pre-extracted code

**1. Interpreters translate everything into one shape before it goes further in — recap only, do not re-paste this code (already shown in Module 2), just refer back to it in prose:** every channel implements the same `start` / `stop` / `send` contract, so Telegram's format and Slack's format both arrive as the same `InboundMessage` shape. Say this in one sentence and move on — the code snippet already lived in Module 2.

**2. If your first-choice AI provider is unavailable, a backup steps in automatically** — `nanobot/providers/factory.py:184-197`:
```python
resolved = _resolve_model_preset(config, preset_name=preset_name, preset=preset)
provider = _make_provider_core(config, preset_name=preset_name, preset=preset, model=model)
fallback_presets = _resolve_fallback_presets(config, resolved)

if fallback_presets:
    provider = FallbackProvider(
        primary=provider,
        fallback_presets=fallback_presets,
        provider_factory=lambda fb: _make_provider_core(
            config, preset_name=preset_name, preset=fb
        ),
    )

return provider
```
Plain English: if you've configured backup models, nanobot doesn't just wrap
one AI provider — it wraps a *primary* provider plus a list of fallbacks. If
the primary is down or rate-limited, the wrapper quietly tries the next one.
The rest of the codebase just calls "the provider" and never needs to know
whether it's talking to the first choice or the third.

**3. The one checkpoint every outbound web request must clear — the no-fly list** — `nanobot/security/network.py:11-22`:
```python
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),   # carrier-grade NAT
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),   # link-local / cloud metadata
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),          # unique local
    ipaddress.ip_network("fe80::/10"),         # link-local v6
]
```
Plain English: these are ranges of addresses that mean "something on this
private network" or "internal cloud infrastructure," not "the public
internet." If a URL resolves to one of these, it gets blocked — this is what
stops an AI-controlled web-fetch tool from being tricked into reading your
router's admin page or a cloud provider's internal secrets endpoint.

**4. The actual checkpoint function — every fetch gets checked before it's allowed through** — `nanobot/security/network.py:61-77` (trimmed):
```python
def validate_url_target(url: str, *, allow_loopback: bool = False) -> tuple[bool, str]:
    """Validate a URL is safe to fetch: scheme, hostname, and resolved IPs."""
    try:
        p = urlparse(url)
    except Exception as e:
        return False, str(e)

    if p.scheme not in ("http", "https"):
        return False, f"Only http/https allowed, got '{p.scheme or 'none'}'"
    if not p.netloc:
        return False, "Missing domain"
    ...
```
Plain English: notice this checks the *resolved* address, not just the text
of the URL — a sneaky domain name that *looks* public but actually points at
an internal address still gets caught, because nanobot resolves it first and
checks the real destination.

**5. When the checkpoint blocks something, the model is told firmly, not vaguely** — `nanobot/agent/runner.py:1323-1330`:
```python
_SSRF_BOUNDARY_NOTE: str = (
    "This is a non-bypassable security boundary. Stop trying to access "
    "private/internal URLs. Do not retry with curl, wget, encoded IPs, "
    "alternate DNS, redirects, proxies, or another tool. Ask the user for "
    "local files, logs, screenshots, or an explicit safe public URL instead. "
    "If the user explicitly trusts this private URL, ask them to whitelist "
    "the exact IP/CIDR via tools.ssrfWhitelist."
)
```
Plain English: this is the message the AI model itself sees when it hits the
checkpoint. It's deliberately blunt — telling the model exactly which
workarounds not to try, because a capable model might otherwise "get
creative" trying to route around a block it doesn't understand is
intentional and permanent.

## Interactive elements (required for this module)

1. At least one **code-translation** block (use snippet 3 or 4).
2. At least one **quiz** — suggest multiple-choice: give 3-4 URLs (e.g. `http://example.com`, `http://169.254.169.254/`, `http://10.0.0.5/admin`, `https://api.weather.gov`) and ask which one(s) the checkpoint would block. Use the network ranges from snippet 3 to write accurate `data-correct` / `data-explain` values.
3. Optional bonus **message/data flow animation** (not required — only one is mandatory for the whole course and it's already in Module 1 — but add one here if it fits naturally): a URL going channel → checkpoint (blocked) vs channel → checkpoint (allowed) → fetched.
4. At least one **glossary** tooltip on: "SSRF" (plain English: "tricking a server into fetching an address it shouldn't be able to reach on your behalf — like tricking a hotel concierge into handing you a master key by asking very confidently"), "resolve a hostname" ("look up the actual numeric address a web address like example.com points to").
5. One **callout**: on defense in depth / single-choke-point security design — e.g. "Aha! Notice this check lives in exactly one function that every tool calls, instead of being copy-pasted into every tool that touches the network. A security rule that exists in twenty places is a security rule that's wrong in at least one of them."

## Transitions

- Open with a callback: "Module 3 watched one turn run start to finish, entirely inside nanobot. This module is about the border around that building."
- Close bridging to module 5: something like "We've covered how nanobot talks to the world safely. Next: what it does with everything it learns — including a genuinely clever trick borrowed from how your own brain works."
