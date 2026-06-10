## 6. Representations

The "R" in REST. A **resource** is an abstract thing (user 42); a **representation** is a concrete *format* of it sent over the wire — usually JSON, but it could be XML, HTML, or CSV.

The client and server negotiate format with headers (Chapter ①, §5):

- Client: `Accept: application/json` — "send me JSON."
- Server: `Content-Type: application/json` — "here's JSON."

The same resource can have many representations. `GET /users/42` might return JSON for an app and HTML for a browser — *same resource, different representation*. The server transfers a *representation of the resource's state* — which is literally what "Representational State Transfer" means.

<div class="analogy">
A resource is a song; a representation is the file format. The song "exists" abstractly, but you receive it as an MP3, a FLAC, or sheet music depending on what your player asked for. Same song (resource), different encodings (representations). <code>Accept</code> is you telling the store which format your device supports.
</div>

<div class="quiz">
<div class="quiz-q">Your team needs user 42 as both JSON and CSV. A teammate proposes two endpoints: <code>/users/42.json</code> and <code>/users/42.csv</code>. What's the REST-ful alternative?</div>
<button class="quiz-opt">Keep both URIs — different formats are different resources, so they need different addresses</button>
<button class="quiz-opt" data-correct>One URI, <code>/users/42</code>; the client picks the format with <code>Accept: application/json</code> or <code>Accept: text/csv</code></button>
<button class="quiz-opt">One endpoint that always returns JSON — REST requires JSON anyway</button>
<div class="quiz-why">JSON and CSV are two <b>representations</b> of the <i>same</i> resource (user 42), and format is negotiated with headers, not baked into the name. The <code>.json</code> suffix multiplies your URIs per format and confuses identity with encoding — and REST doesn't mandate JSON at all; that's just today's most popular representation.</div>
</div>
