# Welcome 👋

This is your **kick-start guide** to the fundamentals every software engineer leans on every single day. You can read the source as plain Markdown on GitHub, or run it as a small website (recommended — the hints and answers become clickable).

## What's inside

| Chapter | Topic              | Why it matters                                                                                      |
| ------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| ①       | **HTTP & The Web** | Every web app, mobile app, and API talks over HTTP. Understand it once, debug everything faster.    |
| ②       | **REST APIs**      | The dominant style for designing web APIs. Get the principles and your endpoints stop being a mess. |

## How each chapter is built

Every chapter follows the same rhythm so you always know where you are:

1. **Plain-English explanation** of each concept.
2. **🧠 Analogies** — a real-world picture for every tricky idea, because "stateless" means nothing until you've seen the coat-check counter.
3. **Thinking problems** at three levels — 🟢 Easy, 🟡 Medium, 🔴 Hard — each wrapped in a short story.
4. **Hints** (click to reveal) when you're stuck but want to keep thinking.
5. **Answers** (click to reveal) when you want to check your reasoning.
6. **Resources** — curated links to go deeper.

> **Don't rush to the answer.** The thinking is the point. Read the story, sit with it for a few minutes, jot a guess, _then_ open the hint. The struggle is where the learning sticks.

## How to run the website

From this folder:

```bash
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser. Opening `index.html` directly won't work — browsers block local file loading for security.

No Python? Any static server works:

```bash
npx serve .          # Node
php -S localhost:8000 # PHP
```

## A note on mindset

You are not expected to memorize status codes or header names. Engineers look those up constantly. What you _are_ building here is a **mental model** — knowing that a request is just text, that the server is stateless, that a cache sits in the middle. With the model, the details are a search away. Without it, even the search results don't make sense.

Pick **Chapter ①** in the sidebar and let's go.
