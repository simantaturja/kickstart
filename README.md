# Freshers Kick-Start — Software Engineering Fundamentals

A self-contained learning site for new engineers. Two chapters — **HTTP & The Web** and **REST APIs** — each with plain-English explanations, real-world analogies, and tiered thinking problems (🟢 easy / 🟡 medium / 🔴 hard) with story, hints, and answers.

## Run it

```bash
python3 -m http.server 8000
```

Open **http://localhost:8000**.

> Opening `index.html` directly (`file://`) won't work — browsers block loading the local Markdown files. Any static server is fine: `npx serve .` or `php -S localhost:8000`.

## Structure

```
index.html              # thin HTML skeleton — layout only, no logic
assets/
  styles.css            # all site styling, incl. the special content blocks
  app.js                # rendering, navigation, quizzes, progress tracking
content/
  chapters.json         # manifest: chapter ids, titles, and ordered section files
  00-intro.md           # welcome + how to use
  01-http/              # Chapter ① — HTTP & The Web, one file per section
    00-overview.md
    01-internet.md
    …
    13-resources.md
  02-rest/              # Chapter ② — REST APIs, one file per section
    00-overview.md
    …
    09-further-reading.md
  03-brainstorm.md      # 🧠 Brainstorm — open-ended discussion questions
```

A chapter is an entry in `content/chapters.json` listing its section files in order. The site fetches them all and renders them as one page, joined with `---` dividers — so a chapter can be a single file (like the intro) or a folder of sections.

There is still no build step: rendering is done in the browser by CDN libraries — [marked](https://marked.js.org/) (Markdown), [highlight.js](https://highlightjs.org/) (code), [Mermaid](https://mermaid.js.org/) (diagrams), and [canvas-confetti](https://github.com/catdad/canvas-confetti) (completion celebration).

## Progress tracking

Progress is tracked at two levels, saved in the browser's `localStorage` under the key `fks-progress-v2` (older `fks-progress-v1` data is migrated automatically):

- **Sections** — every section ends with a small **"Mark as read"** toggle; read sections get a ✓ in the "On this page" sidebar list.
- **Chapters** — each chapter page ends with a **"Mark chapter as complete"** button. The two stay in sync: marking the last section read completes the chapter (and vice versa, the chapter button marks/clears all its sections). Completed chapters get a ✓ in the sidebar, and the progress card shows both counts.

It's per-browser and per-device; clearing site data resets it.

The sidebar has a **"★ Star on GitHub" button** with a live star count. It's hidden until you set `REPO_URL` at the top of `assets/app.js` to the repo's GitHub URL.

The site also has a **dark / light toggle** (button next to the brand in the sidebar, and in the mobile topbar). The choice is saved under `fks-theme`; first visit follows the OS `prefers-color-scheme`. Code blocks and Mermaid diagrams intentionally stay dark in light mode. Other niceties: prev/next chapter links at the bottom of every page, ←/→ keyboard navigation, reading-time estimate under each chapter title, and a back-to-top button.

## Editing content

All learning content is plain Markdown in `content/`. Edit those files and refresh — no build step. Don't add a trailing `---` to section files; the divider between sections is inserted automatically. Special blocks use small HTML wrappers that `index.html` styles:

- `<div class="analogy">…</div>` — highlighted analogy box
- `<div class="funfact">…</div>` — "💡 Did you know?" trivia box
- `<div class="quiz">…</div>` — interactive multiple-choice quick check. Inside: a `<div class="quiz-q">` question, 3–4 `<button class="quiz-opt">` options (mark the right one with `data-correct`), and a `<div class="quiz-why">` explanation revealed after answering. Use HTML tags (`<code>`, `<b>`) inside, no blank lines within the block.
- `<div class="problem easy|medium|hard">…</div>` — a problem card
- `<details class="hint"><summary>Hint</summary><div class="inner">…</div></details>` — collapsible hint
- `<details class="answer"><summary>Answer</summary><div class="inner">…</div></details>` — collapsible answer
- ` ```mermaid ` fenced code blocks — rendered as [Mermaid](https://mermaid.js.org/) diagrams (sequence diagrams, flowcharts) in the site's dark theme
- `<p class="diagram-caption">…</p>` — small centered caption under a diagram
- `<div class="httpflow">…</div>` — animated request/response packet flow (see Chapter ① §2 for the markup)

## Adding a chapter

1. Create `content/03-yourtopic/` with numbered section files (`00-overview.md`, `01-….md`, …).
2. Add an entry to `content/chapters.json`:
   ```json
   {
     "id": "03-yourtopic",
     "title": "③ Your Topic",
     "group": "chapters",
     "files": ["content/03-yourtopic/00-overview.md", "content/03-yourtopic/01-first-section.md"]
   }
   ```

The `id` is also the URL hash (`#03-yourtopic`) — link between chapters with `[Chapter ③](#03-yourtopic)`.

`group` controls the sidebar: `chapters` (tracked in progress, gets section toggles and the complete button), `practice` (untracked pages like Brainstorm), `about` (intro). Brainstorm questions use `<div class="problem brainstorm">` cards with a `🧠 Brainstorm` difficulty chip.

## Adding a section to an existing chapter

1. Create the file, e.g. `content/01-http/14-websockets.md`.
2. Add its path to that chapter's `files` array in `content/chapters.json` (order in the array = order on the page).
