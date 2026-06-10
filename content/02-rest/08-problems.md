## Thinking problems

Guess first. Open the hint only when stuck. Check the answer last.

<div class="problem easy">
<span class="difficulty">🟢 Easy</span>

### The verb-in-the-URL trap

> Jonas inherited an API with these endpoints:
> ```
> POST /getProduct
> POST /createProduct
> POST /deleteProduct
> POST /updateProductPrice
> ```
> Everything is `POST`, every action is baked into the path. His tech lead asks him to "make it RESTful" without changing what the API can do.

**Question:** Rewrite these four endpoints the RESTful way (correct URIs + methods).

<details class="hint"><summary>Hint</summary>
<div class="inner">
Sections 2–4. There is really only <i>one noun</i> here — product. Let the HTTP method carry the verb instead of the URL. "Update price" is a partial change to a product.
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
One resource (<code>/products</code>), methods do the work:
<pre><code>GET    /products/{id}     → read a product   (was getProduct)
POST   /products          → create a product  (was createProduct)
DELETE /products/{id}     → delete a product  (was deleteProduct)
PATCH  /products/{id}     → update fields like price (was updateProductPrice)</code></pre>
Note: updating just the price is a <b>partial</b> update, so <code>PATCH</code> (not <code>PUT</code>, which would replace the entire product). Body: <code>{"price": 19.99}</code>.
</div></details>
</div>

<div class="problem medium">
<span class="difficulty">🟡 Medium</span>

### The login that broke at scale

> A team runs one API server. To stay logged in, the server stores each user's session in its own memory after login — fast and simple. Traffic grows, so they add a second server behind a load balancer. Suddenly users are randomly logged out: they log in (handled by server A), but their next request lands on server B, which has never heard of them. The team's quick fix is "sticky sessions" — pin each user to one server. It works, but a senior engineer says "you've broken a REST principle, and sticky sessions are a band-aid that will bite you."

**Questions:** (1) Which REST principle did the original design violate? (2) Why are sticky sessions a fragile fix? (3) What's the stateless way to keep users logged in across many servers?

<details class="hint"><summary>Hint</summary>
<div class="inner">
Section 5. Where is the session state living, and why does that make a request "stuck" to one machine? For the fix: what could the <i>client</i> carry on every request so that <i>any</i> server can verify identity without local memory?
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
<b>(1)</b> It violates <b>statelessness</b>. Session state lived in one server's memory, so a request only made sense on the machine that happened to handle the login — the request was no longer self-contained. <br><br>
<b>(2)</b> Sticky sessions pin each user to a single server, which <b>defeats the point of horizontal scaling</b>: load can't be balanced freely, and if that server restarts or dies, every user pinned to it is logged out and loses their session. It also makes deploys and autoscaling painful. <br><br>
<b>(3)</b> Make auth <b>stateless</b>: after login, issue a <b>self-contained token</b> (e.g. a signed JWT) that the client sends on every request (typically <code>Authorization: Bearer …</code>, per Chapter ① §5). Any server can <i>cryptographically verify</i> the token without shared memory, so requests can hit any server. If you need server-side sessions, store them in a <b>shared store</b> (Redis/DB) all servers read — the state still isn't pinned to one machine.
</div></details>
</div>

<div class="problem hard">
<span class="difficulty">🔴 Hard</span>

### The "everything is 200" disaster

> An API team wraps every response — success or failure — in `200 OK` with a body like `{"ok": false, "error": "not found"}`. "It's simpler," they say, "clients just check the `ok` field." Then three things break in one week:
> 1. A **CDN** (Chapter ① §8) starts serving a *cached* "not found" body to users even after the data exists, for hours.
> 2. The mobile app's generic retry layer never retries genuinely failed requests, but hammers the server retrying ones that "succeeded."
> 3. Monitoring dashboards show **100% success rate** while users are furious.

**Questions:** (1) Explain why using `200` for errors caused each of the three failures. (2) What status codes *should* the relevant cases use? (3) State the underlying REST principle being violated.

<details class="hint"><summary>Hint</summary>
<div class="inner">
Section 4, plus Chapter ① §4 (status code categories) and §8 (caching). Lots of machinery — caches, retry logic, monitoring — reads <i>only the status code</i> and never your JSON body. What do those machines now believe about every response? Think about what a cache does with a <code>200</code>, what a retry layer keys off, and what a dashboard counts.
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
<b>(1) Why each broke:</b>
<ul>
<li><b>CDN caching:</b> intermediary caches key their behavior off the <b>status code</b>, not your body. A <code>200</code> is treated as a cacheable successful response, so the CDN happily caches the "not found" payload and serves that stale error to everyone — even once the resource exists. A real <code>404</code>/<code>5xx</code> would not have been cached like a success.</li>
<li><b>Retry logic:</b> generic client retry layers retry on <code>5xx</code>/network errors and stop on <code>2xx</code>. Since failures came back as <code>200</code>, the layer thought they <i>succeeded</i> (so it never retried real failures) — and any retry heuristics it did have were keyed on the wrong signal, causing it to behave backwards.</li>
<li><b>Monitoring:</b> dashboards compute error rate from status codes. Every response was <code>200</code>, so the error rate read <b>0%</b> while users hit constant failures — the outage was invisible.</li>
</ul>
<b>(2) Correct codes:</b> resource missing → <code>404 Not Found</code>; bad input → <code>400 Bad Request</code>; not authenticated → <code>401</code>; forbidden → <code>403</code>; server fault → <code>500</code>; conflict → <code>409</code>. The error <i>details</i> still go in the body, but the <b>status line must tell the truth</b>.<br><br>
<b>(3) Principle violated:</b> REST mandates the <b>uniform interface</b> — using HTTP's own semantics honestly, including <b>meaningful status codes</b>. The whole ecosystem (browsers, caches, proxies, monitoring, client libraries) relies on the status code as the source of truth. Hiding errors behind <code>200</code> lies to every one of those layers at once.
</div></details>
</div>
