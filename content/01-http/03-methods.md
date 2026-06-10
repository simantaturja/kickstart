## 3. Request methods (verbs)

The **method** says *what you want to do* with a resource. The common ones:

| Method | Meaning | Safe? | Idempotent? |
|---|---|---|---|
| `GET` | Read / fetch a resource | ✅ | ✅ |
| `POST` | Create something / submit data | ❌ | ❌ |
| `PUT` | Replace a resource entirely | ❌ | ✅ |
| `PATCH` | Partially update a resource | ❌ | ❌ |
| `DELETE` | Remove a resource | ❌ | ✅ |
| `HEAD` | Like GET but headers only, no body | ✅ | ✅ |
| `OPTIONS` | Ask what's allowed (used by CORS) | ✅ | ✅ |

Two words that confuse everyone:

- **Safe** = doesn't change anything on the server (read-only). `GET` is safe.
- **Idempotent** = doing it once or ten times leaves the server in the same state. `DELETE`-ing the same item twice ends with it gone either way, so it's idempotent. `POST`-ing "add to cart" twice gives you two items, so it's *not*.

<div class="analogy">
Idempotency is a light switch with a fixed label. A switch marked <b>"OFF"</b> (PUT/DELETE): flip it once or five times, the light is off — same result. A switch marked <b>"TOGGLE"</b> (POST): each press flips the state, so pressing it twice ≠ pressing it once. That's why your browser warns "resubmit form?" when you refresh after a POST — it might run the toggle again.
</div>

<div class="quiz">
<div class="quiz-q">A user clicks "Pay now", the request times out, and your client automatically retries it. With which design is the retry safe?</div>
<button class="quiz-opt"><code>POST /payments</code> — retries are always safe because the first request timed out</button>
<button class="quiz-opt" data-correct><code>PUT /payments/order-42</code> — replaying it leaves the server in the same state</button>
<button class="quiz-opt">Neither — no HTTP method can ever be retried safely</button>
<div class="quiz-why">PUT is idempotent: it <i>replaces</i> the resource, so sending it once or three times still ends with exactly one payment recorded for order-42. A timeout doesn't mean the first POST failed — it may have already gone through, and POST ("create something") would create a <b>second</b> charge on retry. That's the light-switch labeled TOGGLE.</div>
</div>
