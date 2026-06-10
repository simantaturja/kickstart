# 🧠 Brainstorm

These are not quiz questions — there is no single right answer, and nobody expects you to "solve" them in one sitting. Each one is a real engineering tension hiding behind something you've already learned in [Chapter ①](#01-http) and [Chapter ②](#02-rest).

**How to use this page:** pick one question, set a 15-minute timer, and think (or argue with a teammate) *before* opening anything. "Threads to pull" gives you angles to explore when you stall. "Where this leads" is not the answer — it's a map of where experienced engineers usually end up, so you can compare routes.

<div class="problem brainstorm">
<span class="difficulty">🧠 Brainstorm</span>

### 1. The stateful web that never was

> Imagine an alternate 1991: HTTP is designed **stateful**. Every connection opens a session, and the server remembers everything about you — who you are, what you've requested, where you are in a flow — until you disconnect. No cookies needed, ever. Sounds *more* convenient, right?

**Brainstorm:** Play this universe forward 30 years. What breaks, what gets harder, what gets easier? Think about: a site that suddenly gets popular and needs ten servers instead of one; a server that crashes mid-afternoon; a cache that wants to serve the same page to a million people. Then the twist — we bolted state back on anyway with cookies and sessions. Was that inevitable? What's the *right layer* for state to live in?

<details class="hint"><summary>Threads to pull</summary>
<div class="inner">
If the server holds your session in memory, can a load balancer send your next request to a <i>different</i> server? What happens to a million sessions when that server reboots? Can a shared cache reuse a response whose meaning depends on everything you said before? And notice: cookies put the state in the <i>request</i>, not in the connection — why is that distinction huge?
</div></details>

<details class="answer"><summary>Where this leads</summary>
<div class="inner">
Statelessness is what makes the web <b>horizontally scalable</b>: any server can answer any request, so you can add machines behind a load balancer without "sticky" routing; a crashed server loses nothing because there's nothing in it to lose; and caches can reuse responses because each request carries its full meaning. Stateful-by-default would have made every popular site face the hard problems of session replication and failover from day one. The cookie compromise is subtler than it looks: state lives at the <i>application</i> layer, carried inside each request, while the <i>protocol</i> stays stateless — servers still treat every request as self-contained, they just get handed an identifier to look things up with. That's why engineers push session data into shared stores (databases, Redis) or sign it into tokens (JWTs) instead of keeping it in web-server memory: it keeps the fleet interchangeable. The deep lesson: <b>where state lives determines how a system scales and fails.</b>
</div></details>
</div>

<div class="problem brainstorm">
<span class="difficulty">🧠 Brainstorm</span>

### 2. The 5-minute outage that lasts an hour

> A wildly popular API goes down for five minutes — a bad deploy, quickly rolled back. The servers come back healthy… and immediately collapse again. And again. Each restart dies faster than the last, even though the original bug is long gone. Total outage: over an hour. Nobody touched anything after the rollback.

**Brainstorm:** What's happening? Millions of clients saw their requests fail — picture what each one of them does next, all at the same time. Then design defenses: what should well-behaved *clients* do differently, and what can the *server side* do to survive a stampede it can't prevent? Try to find at least three mechanisms on each side.

<details class="hint"><summary>Threads to pull</summary>
<div class="inner">
Every failed client retries. If they all retry on a fixed timer, what does the traffic graph look like when the server returns — a gentle ramp or a synchronized wave? What HTTP status and header could the server use to say "back off, try later"? Could caches answer some of this traffic with slightly old data instead of letting it reach the origin at all? And is serving <i>some</i> users better than serving none?
</div></details>

<details class="answer"><summary>Where this leads</summary>
<div class="inner">
This is a <b>retry storm</b> (the "thundering herd"): the recovering service faces normal traffic <i>plus</i> every queued retry at once, synchronized into waves. Client-side defenses: <b>exponential backoff</b> (wait 1s, 2s, 4s…) with <b>jitter</b> (randomness that de-synchronizes the herd), <b>retry budgets</b> (give up after N attempts), and <b>circuit breakers</b> (after repeated failures, stop calling entirely for a cooldown). Server-side: respond <code>503</code> with a <code>Retry-After</code> header so backoff is server-guided; <b>load-shed</b> by rejecting excess requests cheaply and early rather than slowly choking on all of them; let CDN/caches serve stale content during the outage (<code>stale-if-error</code>); and ramp traffic back gradually instead of opening the floodgates. The deep lesson: <b>failure handling is part of the protocol conversation</b> — a fleet of "helpful" clients that retry naively is indistinguishable from a DDoS attack on yourself.
</div></details>
</div>

<div class="problem brainstorm">
<span class="difficulty">🧠 Brainstorm</span>

### 3. Design the idempotency-key service

> In Chapter ① you learned the fix for double-charged payments: the client sends an <code>Idempotency-Key</code> header, and the server refuses to do the same work twice. Easy to say. Now <i>you</i> are the engineer who has to build that server side — for a payment API doing thousands of requests per second.

**Brainstorm:** Design it for real. Where do the keys live? What *exactly* happens when a retry arrives while the first attempt is **still running** — not finished, not failed, just in flight? What should the second caller get back? How long do you remember keys, and what happens when you forget one too early? And the nasty one: same key, but the retry has a *different request body* — bug or feature? What do you return?

<details class="hint"><summary>Threads to pull</summary>
<div class="inner">
Two identical requests hitting two different servers in the same millisecond — what stops <i>both</i> from charging? You need something atomic; in-memory checks on one server won't cut it. For the in-flight case: wait, reject, or process anyway? For replays: is it enough to skip the charge, or must you return the <i>same response</i> the first call got — and what does that force you to store? For mismatched bodies: what does the client's bug look like from your side?
</div></details>

<details class="answer"><summary>Where this leads</summary>
<div class="inner">
The core is an <b>atomic claim</b>: insert the key into shared storage (a database unique constraint, or Redis <code>SET NX</code>) <i>before</i> doing the work — whoever inserts first wins; the loser knows it's a duplicate. Each key tracks a state machine: <i>in-progress → succeeded/failed</i>. A retry that finds <i>in-progress</i> either waits briefly or returns <code>409 Conflict</code> ("original still running — try again shortly"); a retry that finds <i>succeeded</i> gets a <b>replay of the stored response</b> — which means you must persist the response body and status, not just a "done" flag. Keys get a TTL (Stripe keeps them 24h): long enough to outlive any sane retry loop, short enough not to store responses forever — and a retry after expiry is simply a new request, which is why TTL choice is a real risk decision. Same key + different body is a client bug; answering it with either stored or fresh results would be silently wrong, so reject it loudly (Stripe returns <code>422</code>). The deep lesson: "just make it idempotent" unpacks into <b>distributed locking, response storage, state machines, and TTL trade-offs</b> — one HTTP header, a whole system behind it.
</div></details>
</div>

<div class="problem brainstorm">
<span class="difficulty">🧠 Brainstorm</span>

### 4. REST a game of chess

> Your team is building online chess. The architect says: "Model it as a REST API — resources, methods, statelessness, the works." Two players, alternating turns, illegal moves rejected, and your opponent should see your move *immediately*.

**Brainstorm:** Try it honestly. What are the resources and URIs? What does making a move look like — which method, on what? Is a *move* a thing or an action? How does the server reject "not your turn" vs "illegal move" — which status codes? Two moves from the same player arrive nearly simultaneously — what stops the second one? And the hard wall: how does the *opponent* find out you moved, when REST servers can't call clients? At what point, if any, do you abandon REST — and for which part exactly?

<details class="hint"><summary>Threads to pull</summary>
<div class="inner">
Try <code>/games/42</code> and <code>/games/42/moves</code> — what do GET and POST on each mean? A move that <i>was made</i> is a historical fact: does that make it a resource after all? For the race: Chapter ① had a header pair (<code>ETag</code> / <code>If-Match</code>) built for exactly "only apply this if the state hasn't changed." For notifications: list every way a client can learn something changed — repeated polling, a request the server holds open, a permanent two-way connection — and price each in latency and server cost.
</div></details>

<details class="answer"><summary>Where this leads</summary>
<div class="inner">
The resource model is genuinely elegant: <code>POST /games/42/moves</code> creates a move in an <b>append-only collection</b> — moves are facts, so the history is naturally a list of resources, and <code>GET /games/42</code> returns current board state, whose turn it is, and (HATEOAS!) whether <i>you</i> may move. Rejections split cleanly: <code>422</code> for an illegal move (the request is understood but invalid by the rules), <code>409</code> for "not your turn" (conflict with current state). The simultaneous-move race is optimistic concurrency: the client sends <code>If-Match</code> with the game-state ETag; the second move fails with <code>412 Precondition Failed</code>. But the notification wall is real: request–response means servers answer, never announce. Polling wastes requests; long-polling and SSE stretch the model; at "show the move instantly" most teams add a <b>WebSocket purely for pushing events</b>, while keeping REST for state, history, and making moves. The deep lesson: <b>REST is a superb fit for state and history, and a poor fit for "tell me the moment something happens"</b> — mature systems mix paradigms deliberately rather than forcing one to do everything.
</div></details>
</div>

<div class="problem brainstorm">
<span class="difficulty">🧠 Brainstorm</span>

### 5. One typo, two hundred caches

> You run a news site behind a CDN: every article is cached on ~200 edge servers worldwide with a one-hour TTL, and that's the only reason your origin survives the traffic. An editor fixes an embarrassing typo in a breaking-news headline and expects the fix to be live *everywhere, now*. With a naive setup it'll linger for up to an hour.

**Brainstorm:** Generate every approach you can think of to get fresh content out faster — aim for at least four fundamentally different ones. For each: what does it cost in origin load, complexity, or new failure modes? Why doesn't the asset trick — <code>app.39fa2c.js</code> with an infinite TTL — work for the article page itself? And what should happen to readers if the origin dies right after the caches empty?

<details class="hint"><summary>Threads to pull</summary>
<div class="inner">
The obvious knobs: shorter TTL (what happens to origin traffic?), and an explicit "purge" API call to all 200 edges (what if 3 of them are unreachable right then — what does "purged" even mean?). The clever knob: why does <i>renaming</i> a file beat <i>updating</i> it, and what's special about the URL a human types that makes it un-renameable? The subtle knobs: can a cache serve the old copy <i>while</i> fetching the new one? Can the article's URL stay stable while everything it references is versioned?
</div></details>

<details class="answer"><summary>Where this leads</summary>
<div class="inner">
The classic menu: <b>(1) shorter TTLs</b> — simple, but origin load rises in proportion, and "shorter" is never "instant"; <b>(2) purge/invalidation API</b> — what news CDNs (including Fastly-style setups) actually do, often with <b>surrogate keys</b> ("purge everything tagged article-8841"), but now you own a distributed-delete problem: purges that race with re-fills, edges that are briefly unreachable, and the question of whether "purged" means <i>all</i> 200 confirmed or just <i>most</i>; <b>(3) versioned URLs</b> — perfect immutability for assets, useless for the article page itself because its URL is the identity readers hold (bookmarks, links, search) — you can't rename the thing people navigate to; so the hybrid: stable HTML page with a short TTL referencing fingerprinted assets with infinite TTLs; <b>(4) <code>stale-while-revalidate</code> / <code>stale-if-error</code></b> — serve the old copy while fetching the new one in the background, and keep serving it if the origin is down: freshness traded for resilience, deliberately. The deep lesson is Phil Karlton's old joke — <i>"there are only two hard things in computer science: cache invalidation and naming things"</i> — and this problem is both at once: every strategy is really a decision about <b>what a URL names</b>: a fixed identity whose content changes, or an immutable snapshot you replace.
</div></details>
</div>

---

**Done with these?** Try inventing your own: take any rule from the chapters — "GET must be safe", "URIs name nouns", "every response declares its cacheability" — and ask *"what would the world look like if this rule didn't exist?"* That question turns almost any convention into a brainstorm.
