## 5. Headers

Headers are **key–value metadata** attached to a message. They don't carry the main content — they describe it, or control behavior.

Common request headers:

- `Host` — which site you want (one server, many sites).
- `Accept` — what formats the client can handle (`application/json`).
- `Authorization` — credentials (`Bearer <token>`).
- `Cookie` — stored state sent back to the server.
- `User-Agent` — what client is asking.

Common response headers:

- `Content-Type` — what the body is (`application/json`, `image/png`).
- `Content-Length` — how many bytes the body is.
- `Set-Cookie` — server asks the client to store state.
- `Cache-Control` — how long this may be cached.
- `Location` — where to go (used with 3xx redirects).

<div class="analogy">
Headers are the information on a parcel's shipping label, separate from what's inside the box. "Fragile", "Contains liquid", "Signature required", "Return to sender at…" — none of it is the gift itself, but it tells everyone handling the parcel how to treat it. The body is the gift; the headers are the label.
</div>

<div class="funfact">
One of the most-sent headers on the web is a typo. <code>Referer</code> (which page the request came from) should be spelled "Referrer" — but the misspelling shipped in the original HTTP/1.0 spec (RFC 1945, 1996), and changing it would break everything, so the web has faithfully preserved the mistake ever since.
</div>
