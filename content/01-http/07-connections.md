## 7. Connection management

A naive HTTP/1.0 client opened a fresh TCP connection for every image, script, and stylesheet — expensive, because every TCP connection costs a round-trip "handshake" before any data flows.

**Keep-alive** (persistent connections) reuses one connection for many requests. HTTP/2 takes it further by **multiplexing** many streams over a single connection so they don't block each other.

<div class="analogy">
Opening a new connection per request is like hanging up and redialing for every sentence of a phone call. Keep-alive is staying on the line for the whole conversation. Multiplexing is a conference call where several topics are discussed at once without anyone waiting for the previous one to finish.
</div>

<div class="quiz">
<div class="quiz-q">A browser has one HTTP/1.1 keep-alive connection open and needs 5 images. The first response is slow. What happens to the other 4?</div>
<button class="quiz-opt">They arrive in parallel — keep-alive means the connection handles many requests at once</button>
<button class="quiz-opt" data-correct>They wait in line behind the slow one</button>
<button class="quiz-opt">The browser hangs up and opens a fresh connection per image, like HTTP/1.0</button>
<div class="quiz-why">Keep-alive only saves the cost of redialing — the handshake. On an HTTP/1.1 connection, requests are still served one after another, so one slow response blocks the rest. True parallelism on a single connection is exactly what HTTP/2 <b>multiplexing</b> added.</div>
</div>
