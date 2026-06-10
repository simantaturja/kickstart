## Thinking problems

Work these top to bottom. Guess first, peek at the hint only when stuck, check the answer last.

<div class="problem easy">
<span class="difficulty">🟢 Easy</span>

### The vanishing shopping cart

> Maya is building her first webshop. She adds "Wireless Mouse" to the cart and the server confirms it. But when she loads the checkout page a second later, the cart is empty — every single time. Her code is correct: the server *does* store the cart, keyed by a user ID. She just never told the browser to hold onto anything.

**Question:** Which HTTP mechanism is Maya missing, and what's the one-line cause of the empty cart?

<details class="hint"><summary>Hint</summary>
<div class="inner">
Recall section 9. HTTP forgets you between requests by default. What word describes that, and what's the standard fix for "remember me across requests"?
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
HTTP is <b>stateless</b> — each request is independent, so the second request (checkout) arrives with no way to identify Maya, and the server can't find her cart. The missing mechanism is a <b>cookie</b> (or session token): the server should send <code>Set-Cookie: session=…</code> after the first request, and the browser then automatically attaches <code>Cookie: session=…</code> to the checkout request, letting the server look up her cart.
</div></details>
</div>

<div class="problem medium">
<span class="difficulty">🟡 Medium</span>

### The double-charged customer

> A payment endpoint is built as `POST /charge`. On a shaky train connection, Sam taps "Pay" once. The request is slow, so the app auto-retries after a timeout. The first request *did* succeed — the network just dropped the response. Sam gets charged twice. The team argues: "just make POST idempotent." A senior engineer says "POST is the right method, but you need one more thing."

**Question:** Why doesn't simply "making POST idempotent" describe a real fix, and what concrete technique actually prevents the double charge while keeping `POST`?

<details class="hint"><summary>Hint</summary>
<div class="inner">
Idempotency isn't magic the method grants — it's a property your handler must guarantee. How could the server <i>recognize</i> that the retry is the same logical request as the first one, and refuse to charge again? Think about something the client attaches that stays constant across retries.
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
<code>POST</code> is <b>not idempotent by definition</b>, and "make it idempotent" is just a goal, not a mechanism — the server has to <i>implement</i> that guarantee. The standard technique is an <b>idempotency key</b>: the client generates a unique key once (e.g. a UUID) and sends it on every retry of that same payment, typically as an <code>Idempotency-Key</code> header. The server records the key with the result of the first successful charge. When the retry arrives with the same key, the server recognizes it, skips the second charge, and returns the original result. The retry stays a <code>POST</code>; the server makes the <i>operation</i> idempotent. (Stripe's API works exactly this way.)
</div></details>
</div>

<div class="problem hard">
<span class="difficulty">🔴 Hard</span>

### The API that works in Postman but not the browser

> Priya ships a React app on `https://app.acme.com` that calls her API on `https://api.acme.com`. In Postman every endpoint returns `200`. In the browser, `GET /me` works fine, but `DELETE /account` fails — the browser console shows a CORS error and a mysterious extra request to `/account` with method `OPTIONS` that her server answered with `404`. She didn't write any `OPTIONS` handler. Meanwhile the *server logs* for the `DELETE` show it was never even reached.

**Questions:** (1) Why does it work in Postman but not the browser? (2) Why is there an `OPTIONS` request she never wrote? (3) Why did `GET /me` succeed but `DELETE /account` trigger this? (4) What must the server send to fix it?

<details class="hint"><summary>Hint</summary>
<div class="inner">
Two ideas from sections 3 and 10 collide here. First: <i>who</i> enforces CORS — the browser or the server? That answers (1). Second: certain methods are "non-simple" and the browser checks permission <i>before</i> sending them — that's a preflight, and it uses a specific method. <code>GET</code> is "simple"; <code>DELETE</code> is not.
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
<b>(1)</b> CORS is enforced <b>by the browser, not the server</b>. Postman is not a browser and ignores the same-origin policy entirely, so it always works — the request itself is fine. <br><br>
<b>(2)</b> The <code>OPTIONS</code> request is a <b>CORS preflight</b> the browser sends automatically. Before issuing a "non-simple" cross-origin request, the browser asks the server "do you allow a <code>DELETE</code> from <code>https://app.acme.com</code>?" via <code>OPTIONS</code>. Priya never wrote it because the <i>browser</i> generates it. <br><br>
<b>(3)</b> <code>GET /me</code> is a <b>simple request</b> (simple method, no custom headers) so no preflight is needed — it goes straight through and any CORS response headers are checked after. <code>DELETE</code> is <b>not simple</b>, so it triggers a preflight. The server returned <code>404</code> for the unexpected <code>OPTIONS</code>, the preflight failed, and the browser <b>never sent the real <code>DELETE</code></b> — which is why the server's DELETE handler logs show it was never reached. <br><br>
<b>(4)</b> The server must <b>handle <code>OPTIONS</code></b> on that route and return the CORS headers: <code>Access-Control-Allow-Origin: https://app.acme.com</code>, <code>Access-Control-Allow-Methods: GET, DELETE, …</code>, and (since this is a cross-subdomain authenticated call) likely <code>Access-Control-Allow-Credentials: true</code>. Once the preflight gets a successful response permitting <code>DELETE</code> from that origin, the browser sends the real request.
</div></details>
</div>
