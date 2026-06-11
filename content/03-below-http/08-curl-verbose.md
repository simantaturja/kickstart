## 8. Anatomy of `curl -v` — now you can read every line

You've typed this a hundred times. Time to cash in everything from this chapter: run it once more, and this time understand *every single line*.

```bash
curl -v https://example.com/
```

Here's the output (trimmed; IPs and versions will differ on your machine), split into the five acts you now know by name:

**Act 1 — DNS resolution (§3)**

```
* Host example.com:443 was resolved.
* IPv6: 2606:2800:21f:cb07:6820:80da:af6b:8b2c
* IPv4: 93.184.215.14
```

The name became addresses — an **A** record and an **AAAA** record (§3's table). If this took noticeable time, the caches were cold and a recursive resolver walked the hierarchy for you. Note `:443` — the port was implied by `https://` (§4).

**Act 2 — TCP connect (§4–5)**

```
*   Trying 93.184.215.14:443...
* Connected to example.com (93.184.215.14) port 443
```

Between those two lines: SYN → SYN-ACK → ACK. One full round trip; two kernels now hold the shared illusion (§5). Your OS silently picked an ephemeral port for its end of the 4-tuple (§4).

**Act 3 — TLS handshake ([Chapter ①](#01-http) §11)**

```
* ALPN: curl offers h2,http/1.1
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
* ALPN: server accepted h2
* Server certificate:
*  subject: CN=example.com
*  SSL certificate verify ok.
```

Encryption keys agreed, certificate checked against trusted authorities — Chapter ① §11 in the flesh, costing one more round trip. The sneaky-interesting lines are **ALPN**: during the TLS handshake, client and server *also* negotiated which HTTP version to speak. curl offered `h2` (HTTP/2) and HTTP/1.1; the server picked `h2` — so version negotiation cost zero extra round trips.

**Act 4 — the HTTP request (Chapter ① §2)**

```
* using HTTP/2
> GET / HTTP/2
> Host: example.com
> User-Agent: curl/8.7.1
> Accept: */*
```

Only *now* — three acts and ~3 round trips in — does HTTP begin. `>` marks bytes curl sends. This is the part of the iceberg Chapter ① was about; everything above it was below the waterline.

**Act 5 — the response, and the polite goodbye**

```
< HTTP/2 200
< content-type: text/html; charset=UTF-8
< cache-control: max-age=86400
<
<!doctype html><html>…
* Connection #0 to host example.com left intact
```

`<` marks bytes received: status line, headers, body — Chapter ① §2/§4/§5. Underneath, TCP was numbering, ACKing and (if needed) retransmitting every byte of it (§6).

Don't skim the last line. **`left intact`** means curl did *not* send a FIN — the connection stays open for reuse, because acts 1–3 are expensive (§7: ~3 RTTs!) and nobody wants to pay them twice. That one humble line is keep-alive (Chapter ① §7), connection reuse, and the entire economics of §7 — compressed into three words.

<div class="analogy">
Reading <code>curl -v</code> used to be like hearing one side of a phone call in a language you didn't speak. Now it reads like a play with a fixed dramatic structure: <b>find them</b> (DNS), <b>shake hands</b> (TCP), <b>agree to whisper</b> (TLS), <b>talk</b> (HTTP), <b>stay on the line</b> (reuse). Every network debugging session of your career will be about figuring out <i>which act</i> went wrong.
</div>

<div class="quiz">
<div class="quiz-q">A teammate's <code>curl -v</code> hangs for 30 seconds after printing <code>* Trying 93.184.215.14:443...</code> and then fails. Which act broke, and what do you know for sure?</div>
<button class="quiz-opt">DNS is broken — the name never resolved</button>
<button class="quiz-opt" data-correct>TCP connect — DNS already succeeded (there's an IP on screen), but no SYN-ACK ever came back: host down, port closed, or a firewall eating packets</button>
<button class="quiz-opt">The TLS certificate is invalid</button>
<div class="quiz-why">The transcript tells you exactly how far the play got. An IP was printed, so Act 1 (DNS) finished. "Trying…" with no "Connected" means the handshake's SYN got no reply — Act 2. TLS (Act 3) was never reached, so certificates can't be the issue. This which-act-failed reading turns "it doesn't work" into a precise, googleable diagnosis — and it's the single most useful debugging skill in this chapter.</div>
</div>
