// nanobot course — interaction layer.
// Everything here is wired via data-* attributes / class names so module
// authors never write JS, only HTML. See CONVENTIONS.md for the markup.

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Nav dots: scroll spy + click-to-scroll
     --------------------------------------------------------------------- */

  function initNavDots() {
    const dots = Array.from(document.querySelectorAll(".nav-dot"));
    const modules = dots
      .map((d) => document.getElementById(d.dataset.target))
      .filter(Boolean);
    if (!dots.length || !modules.length) return;

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const target = document.getElementById(dot.dataset.target);
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const dot = dots.find((d) => d.dataset.target === entry.target.id);
          if (!dot) return;
          if (entry.isIntersecting) {
            dots.forEach((d) => d.classList.remove("active"));
            dot.classList.add("active");
          }
        });
      },
      { threshold: 0.5 }
    );
    modules.forEach((m) => observer.observe(m));
  }

  /* ---------------------------------------------------------------------
     Multiple-choice quizzes: <div class="quiz" data-quiz="mc">
       <p class="quiz-question">...</p>
       <ul class="quiz-options">
         <li><button class="quiz-option" data-correct="true|false" data-explain="...">...</button></li>
       </ul>
       <div class="quiz-feedback"></div>
     --------------------------------------------------------------------- */

  function initMcQuizzes() {
    document.querySelectorAll('.quiz[data-quiz="mc"]').forEach((quiz) => {
      const options = quiz.querySelectorAll(".quiz-option");
      const feedback = quiz.querySelector(".quiz-feedback");
      options.forEach((opt) => {
        opt.addEventListener("click", () => {
          if (opt.dataset.locked) return;
          quiz.dataset.locked = "true";
          options.forEach((o) => {
            o.setAttribute("disabled", "true");
            o.dataset.locked = "true";
          });
          const isCorrect = opt.dataset.correct === "true";
          opt.classList.add(isCorrect ? "correct" : "wrong");
          if (!isCorrect) {
            const correctOpt = Array.from(options).find(
              (o) => o.dataset.correct === "true"
            );
            if (correctOpt) correctOpt.classList.add("correct");
          }
          if (feedback) {
            feedback.textContent =
              opt.dataset.explain || (isCorrect ? "Correct!" : "Not quite.");
            feedback.classList.add("show", isCorrect ? "good" : "bad");
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Spot-the-bug: <div class="quiz" data-quiz="spot">
       <div class="code-block"><pre><code>
         <span class="spot-line" data-correct="false">...</span>
         <span class="spot-line" data-correct="true" data-explain="...">...</span>
       </code></pre></div>
       <div class="quiz-feedback"></div>
     --------------------------------------------------------------------- */

  function initSpotQuizzes() {
    document.querySelectorAll('.quiz[data-quiz="spot"]').forEach((quiz) => {
      const lines = quiz.querySelectorAll(".spot-line");
      const feedback = quiz.querySelector(".quiz-feedback");
      lines.forEach((line) => {
        line.addEventListener("click", () => {
          if (quiz.dataset.locked) return;
          quiz.dataset.locked = "true";
          const isCorrect = line.dataset.correct === "true";
          line.classList.add(isCorrect ? "picked-correct" : "picked-wrong");
          if (!isCorrect) {
            const correctLine = Array.from(lines).find(
              (l) => l.dataset.correct === "true"
            );
            if (correctLine) correctLine.classList.add("picked-correct");
          }
          if (feedback) {
            feedback.textContent =
              line.dataset.explain ||
              (isCorrect ? "That's the one." : "Not the bug — look again.");
            feedback.classList.add("show", isCorrect ? "good" : "bad");
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Drag & drop quizzes: <div class="quiz dragdrop" data-quiz="dragdrop">
       <div class="dragdrop-chips">
         <span class="dragdrop-chip" draggable="true" data-value="id">label</span>
       </div>
       <div class="dragdrop-zones">
         <div class="dragdrop-zone" data-answer="id"><span class="zone-label">Prompt:</span></div>
       </div>
       <div class="quiz-feedback"></div>
     Click-to-place also works (select a chip, then click a zone) so it
     degrades gracefully on touch devices.
     --------------------------------------------------------------------- */

  function initDragDropQuizzes() {
    document.querySelectorAll('.quiz[data-quiz="dragdrop"]').forEach((quiz) => {
      const chips = quiz.querySelectorAll(".dragdrop-chip");
      const zones = quiz.querySelectorAll(".dragdrop-zone");
      const feedback = quiz.querySelector(".quiz-feedback");
      let selectedChip = null;

      function place(chip, zone) {
        if (chip.classList.contains("placed")) return;
        const correct = chip.dataset.value === zone.dataset.answer;
        const label = document.createElement("span");
        label.textContent = chip.textContent;
        label.className = "dragdrop-chip placed";
        zone.appendChild(label);
        zone.classList.add(correct ? "filled-correct" : "filled-wrong");
        chip.classList.add("placed");
        chip.setAttribute("draggable", "false");
        if (feedback) {
          feedback.classList.add("show", correct ? "good" : "bad");
          feedback.textContent = correct
            ? "Correct match!"
            : "That's not quite the right pairing — check the highlighted ones once you finish.";
        }
      }

      chips.forEach((chip) => {
        chip.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", chip.dataset.value);
        });
        chip.addEventListener("click", () => {
          if (chip.classList.contains("placed")) return;
          chips.forEach((c) => c.classList.remove("selected"));
          if (selectedChip === chip) {
            selectedChip = null;
          } else {
            selectedChip = chip;
            chip.classList.add("selected");
          }
        });
      });

      zones.forEach((zone) => {
        zone.addEventListener("dragover", (e) => {
          e.preventDefault();
          zone.classList.add("over");
        });
        zone.addEventListener("dragleave", () => zone.classList.remove("over"));
        zone.addEventListener("drop", (e) => {
          e.preventDefault();
          zone.classList.remove("over");
          const value = e.dataTransfer.getData("text/plain");
          const chip = Array.from(chips).find((c) => c.dataset.value === value);
          if (chip) place(chip, zone);
        });
        zone.addEventListener("click", () => {
          if (selectedChip) {
            place(selectedChip, zone);
            selectedChip.classList.remove("selected");
            selectedChip = null;
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Glossary tooltips: <span class="glossary" tabindex="0"
       data-tip="Plain-English definition">term<span class="glossary-tip">definition</span></span>
     Simpler authoring: just wrap the term and give it a title-less tooltip
     child element .glossary-tip (already inside markup written by authors).
     --------------------------------------------------------------------- */

  function initGlossary() {
    document.querySelectorAll(".glossary").forEach((term) => {
      const show = () => term.classList.add("tip-visible");
      const hide = () => term.classList.remove("tip-visible");
      term.addEventListener("mouseenter", show);
      term.addEventListener("mouseleave", hide);
      term.addEventListener("focus", show);
      term.addEventListener("blur", hide);
      term.addEventListener("click", (e) => {
        e.stopPropagation();
        term.classList.toggle("tip-visible");
      });
    });
    document.addEventListener("click", () => {
      document
        .querySelectorAll(".glossary.tip-visible")
        .forEach((t) => t.classList.remove("tip-visible"));
    });
  }

  /* ---------------------------------------------------------------------
     Group chat animation:
     <div class="chat-window" data-autoplay data-speed="900">
       <div class="chat-title">Title <button class="chat-replay">Replay</button></div>
       <div class="chat-log">
         <div class="chat-bubble left"><span class="who">Name</span>message</div>
         <div class="chat-bubble right"><span class="who">Name</span>message</div>
       </div>
     </div>
     Bubbles are authored already in the DOM (for no-JS fallback/SEO) and
     hidden/revealed in sequence when the window scrolls into view.
     --------------------------------------------------------------------- */

  function initChatWindows() {
    document.querySelectorAll(".chat-window").forEach((win) => {
      const log = win.querySelector(".chat-log");
      const bubbles = Array.from(log.querySelectorAll(".chat-bubble"));
      const replayBtn = win.querySelector(".chat-replay");
      const speed = parseInt(win.dataset.speed || "900", 10);
      let typingEl = null;
      let running = false;

      function ensureTyping() {
        if (!typingEl) {
          typingEl = document.createElement("div");
          typingEl.className = "chat-typing";
          typingEl.innerHTML = "<span></span><span></span><span></span>";
          log.appendChild(typingEl);
        }
        return typingEl;
      }

      async function play() {
        if (running) return;
        running = true;
        bubbles.forEach((b) => b.classList.remove("visible"));
        const typing = ensureTyping();
        log.appendChild(typing); // keep it last
        for (const bubble of bubbles) {
          const wait = bubble.classList.contains("right") || bubble.classList.contains("left");
          if (wait) {
            typing.classList.add("visible");
            log.insertBefore(typing, bubble);
            await sleep(Math.max(350, speed * 0.55));
            typing.classList.remove("visible");
          }
          bubble.classList.add("visible");
          await sleep(speed);
        }
        log.appendChild(typing);
        running = false;
      }

      if (replayBtn) replayBtn.addEventListener("click", play);

      if (win.hasAttribute("data-autoplay")) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                play();
                observer.disconnect();
              }
            });
          },
          { threshold: 0.4 }
        );
        observer.observe(win);
      }
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* ---------------------------------------------------------------------
     Flow / data animation:
     <div class="flow-animation" data-steps='[
       {"active":["channel"],"packetFrom":0,"packetTo":0,"caption":"..."},
       {"active":["bus"],"packetFrom":0,"packetTo":1,"caption":"..."}
     ]'>
       <div class="flow-track">
         <div class="flow-node" data-id="channel">Channel</div>
         <div class="flow-node" data-id="bus">MessageBus</div>
         ...
         <div class="flow-packet"></div>
       </div>
       <div class="flow-caption"></div>
       <div class="flow-controls">
         <button class="flow-step-btn" data-dir="prev">&larr;</button>
         <span class="flow-progress"></span>
         <button class="flow-step-btn" data-dir="next">Next &rarr;</button>
         <button class="flow-replay">Replay</button>
       </div>
     </div>
     --------------------------------------------------------------------- */

  function initFlowAnimations() {
    document.querySelectorAll(".flow-animation").forEach((flow) => {
      let steps;
      try {
        steps = JSON.parse(flow.dataset.steps || "[]");
      } catch (e) {
        return;
      }
      if (!steps.length) return;

      const nodes = Array.from(flow.querySelectorAll(".flow-node"));
      const packet = flow.querySelector(".flow-packet");
      const caption = flow.querySelector(".flow-caption");
      const progress = flow.querySelector(".flow-progress");
      const prevBtn = flow.querySelector('[data-dir="prev"]');
      const nextBtn = flow.querySelector('[data-dir="next"]');
      const replayBtn = flow.querySelector(".flow-replay");
      let index = -1;

      function nodeCenter(i) {
        const node = nodes[i];
        const track = flow.querySelector(".flow-track");
        if (!node || !track) return 0;
        const nodeRect = node.getBoundingClientRect();
        const trackRect = track.getBoundingClientRect();
        return nodeRect.left - trackRect.left + nodeRect.width / 2;
      }

      function render(i) {
        index = Math.max(0, Math.min(steps.length - 1, i));
        const step = steps[index];
        nodes.forEach((n) =>
          n.classList.toggle("active", (step.active || []).includes(n.dataset.id))
        );
        if (packet) {
          const from = nodeCenter(step.packetFrom ?? 0);
          const to = nodeCenter(step.packetTo ?? step.packetFrom ?? 0);
          const progressRatio = step.packetProgress ?? 1;
          const left = from + (to - from) * progressRatio;
          packet.style.left = left + "px";
        }
        if (caption) caption.textContent = step.caption || "";
        if (progress) progress.textContent = `${index + 1} / ${steps.length}`;
      }

      if (prevBtn) prevBtn.addEventListener("click", () => render(index - 1));
      if (nextBtn) nextBtn.addEventListener("click", () => render(index + 1));
      if (replayBtn) replayBtn.addEventListener("click", () => render(0));

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && index === -1) {
              render(0);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(flow);
      window.addEventListener("resize", () => render(index === -1 ? 0 : index));
    });
  }

  /* ---------------------------------------------------------------------
     boot
     --------------------------------------------------------------------- */

  function boot() {
    initNavDots();
    initMcQuizzes();
    initSpotQuizzes();
    initDragDropQuizzes();
    initGlossary();
    initChatWindows();
    initFlowAnimations();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
