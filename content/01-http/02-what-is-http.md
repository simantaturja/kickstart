## 2. What is HTTP?

**HTTP** = HyperText Transfer Protocol. It is a **request–response** protocol:

1. A **client** (your browser, a mobile app, `curl`) sends a **request**.
2. A **server** sends back a **response**.
3. Done. The connection's job for that exchange is over.

That's the whole shape. Everything else is detail. Watch it happen:

<div class="httpflow">
  <div class="node">💻 Client</div>
  <div class="wire">
    <div class="packet req">GET /articles/http-basics</div>
    <div class="packet res">200 OK + HTML</div>
  </div>
  <div class="node">🖥️ Server</div>
</div>

A crucial property: **HTTP is text-based and human-readable**. A request is literally just formatted text. Here is a real one:

```http
GET /articles/http-basics HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: text/html
```

And a response:

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 1024

<!DOCTYPE html><html>...</html>
```

<div class="analogy">
HTTP is like ordering at a café counter. You walk up (open connection), say a clear sentence — "One flat white, oat milk, to go" (the request, with its method and details). The barista hands back your drink or says "we're out of oat milk" (the response, with its status). Each order is self-contained; the barista doesn't need to remember your last visit to serve you now.
</div>

### Anatomy of an HTTP message

Both requests and responses share the same structure:

| Part | Request | Response |
|---|---|---|
| **Start line** | method + path + version (`GET /home HTTP/1.1`) | version + status (`HTTP/1.1 200 OK`) |
| **Headers** | metadata (`Host`, `Accept`, `Cookie`) | metadata (`Content-Type`, `Set-Cookie`) |
| **Blank line** | separates headers from body | separates headers from body |
| **Body** | optional (form data, JSON) | optional (HTML, JSON, image bytes) |
