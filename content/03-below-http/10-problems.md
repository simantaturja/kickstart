## Thinking problems

Guess first. Open the hint only when stuck. Check the answer last.

<div class="problem easy">
<span class="difficulty">🟢 Easy</span>

### The migration that wouldn't finish

> Lena moves her site to a new server on Friday at 17:00 and updates the DNS A record. She tells the team "give it 24–48 hours to propagate." Sure enough, traffic trickles between old and new servers all weekend. Her record's TTL had been set to `86400` for years. Her teammate Ravi claims that with one change *a day earlier*, the cutover could have completed in minutes — and that "propagation" isn't even a real thing.

**Questions:** (1) Why does the old server keep receiving traffic, mechanically — what is actually "propagating"? (2) What was Ravi's one change?

<details class="hint"><summary>Hint</summary>
<div class="inner">
Section 3, "the propagation myth." Nothing pushes DNS records anywhere. Who is holding the old answer, and what number tells them how long they may keep holding it? When does each holder ask again?
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
<b>(1)</b> Nothing is propagating. Resolvers around the world <b>cached</b> the old answer with its TTL of <code>86400</code> seconds (24 hours). Each cache keeps serving the old IP until <i>its own copy</i> expires — at a different moment for each resolver, depending on when it last looked the name up. That staggered expiry <i>looks like</i> a slow outward spread, hence the myth. <br><br>
<b>(2)</b> Lower the TTL <b>in advance</b>: a day before the move, set the TTL to something small like <code>60</code>. He has to do it a day early precisely because the <i>old</i> 24-hour TTL governs how long caches keep the record that still carries it — the new short TTL only takes effect once those expire. After that, every cache worldwide re-asks within a minute of the IP change, and the cutover completes in minutes. (Then raise the TTL back, so resolvers aren't re-asking forever.)
</div></details>
</div>

<div class="problem easy">
<span class="difficulty">🟢 Easy</span>

### "Port 443 must be full"

> In a design review, an intern asks a sincere question: "Our server listens on port 443. When a user connects, doesn't that occupy the port? How do we serve a second user — do we open port 444 for them? How can one port possibly hold a million users?"

**Question:** Explain, using what the OS actually uses to tell connections apart, why one port serves a million users — and what *does* eventually limit the number of connections.

<details class="hint"><summary>Hint</summary>
<div class="inner">
Section 4. A connection is not identified by the server's port alone. Write out the full identifier of a connection and count how many of its parts differ between two different users — or even two tabs of the same user.
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
A connection is identified by the full <b>4-tuple</b>: <code>(client IP, client port, server IP, server port)</code>. The server side is identical for everyone — <code>server-IP:443</code> — but every client brings its own IP and its own <b>ephemeral port</b>, so every connection's tuple is unique and the kernel routes packets to the right socket by matching the whole tuple. One <i>listening</i> socket waits on 443; <code>accept()</code> spawns a dedicated <i>connected</i> socket per client — all sharing port 443. Nothing is "occupied." <br><br>
The real limits are <b>resources, not port numbers</b>: each connection costs kernel memory and a file descriptor, so the practical ceiling is RAM, file-descriptor limits, and CPU. (Fun corollary: it's the <i>client</i> that burns a port per connection — ephemeral ports are why one client machine maxes out at tens of thousands of connections <i>to the same server</i>, while the server itself can hold millions across many clients.)
</div></details>
</div>

<div class="problem medium">
<span class="difficulty">🟡 Medium</span>

### The gigabit upgrade that changed nothing

> A trading-adjacent dashboard in Singapore polls a REST API in Frankfurt (RTT ~180 ms) once per second. Each response is 4 KB, yet each request takes ~750 ms. The team upgrades the office line from 100 Mbps to 1 Gbps. Result: each request takes… ~750 ms. Packet captures show the client opening a **fresh HTTPS connection for every poll**.

**Questions:** (1) Account for the ~750 ms — where does it go? (2) Why was the bandwidth upgrade powerless? (3) Name two changes that would actually cut the time, and roughly what each saves.

<details class="hint"><summary>Hint</summary>
<div class="inner">
Sections 5 and 7. Count the round trips a <i>cold</i> HTTPS request pays: DNS (maybe cached), TCP handshake, TLS handshake, then request/response. Multiply by 180 ms. Then ask: which of those purchases could be made once and reused?
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
<b>(1)</b> A fresh connection pays roughly: TCP handshake (1 RTT = 180 ms) + TLS handshake (~1 RTT = 180 ms) + HTTP request/response (1 RTT = 180 ms) ≈ <b>540 ms of pure waiting</b>, plus DNS when its cache is cold and server processing time — landing right around 750 ms. The 4 KB payload itself needs ~0.3 ms at 100 Mbps. <br><br>
<b>(2)</b> The request is <b>latency-bound, not bandwidth-bound</b>. A wider pipe moves the 0.3 ms part faster; it cannot shorten the 180 ms light-and-routers round trips that happen 3–4 times. Physics doesn't take payment in megabits. <br><br>
<b>(3)</b> Attack the RTT count or the RTT size: <b>(a) Reuse the connection</b> (keep-alive / a persistent HTTP client) — handshakes paid once at startup, each poll drops to ~1 RTT ≈ 180–200 ms. <b>(b) Move the conversation closer</b> — an edge/CDN node or a Singapore replica turns 180 ms RTTs into ~5 ms ones. (Also worth questioning the design: polling once a second across the planet might really want a push channel.)
</div></details>
</div>

<div class="problem medium">
<span class="difficulty">🟡 Medium</span>

### Reading the timing tea leaves

> Three users report "the API is slow." You run the §9 timing one-liner from each of their machines against `https://api.acme.com/health` and get:
> ```
> User A: dns: 4.012  tcp: 4.095  tls: 4.181  first byte: 4.270  total: 4.281
> User B: dns: 0.021  tcp: 0.024  tls: 0.031  first byte: 2.953  total: 2.961
> User C: dns: 0.019  tcp: 0.310  tls: 0.604  first byte: 0.911  total: 0.924
> ```
> (Values are cumulative seconds since the start of the request.)

**Question:** Each user has a *different* problem. Diagnose all three — which act of §8 is slow in each case, and what's the likely culprit?

<details class="hint"><summary>Hint</summary>
<div class="inner">
Subtract neighbors: the <i>gap</i> between consecutive numbers is the duration of that act. For C, notice the gaps are suspiciously <i>equal</i> — what single quantity, paid once per act, would do that? For B, everything network-ish is instant but one gap is enormous — who were we waiting for?
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
<b>User A:</b> the first gap is 4.0 s of <b>DNS</b> — everything after it (tcp +83 ms, tls +86 ms, response +89 ms) is healthy. A misbehaving or unreachable resolver (a classic: the first configured DNS server times out before the second is tried). Fix the resolver config; the API was never slow. <br><br>
<b>User B:</b> DNS, TCP and TLS complete in ~31 ms — the network is local-fast — then <b>~2.9 s waiting for the first byte</b>. That's the gap where the <i>server</i> is thinking: slow handler, exhausted database pool, overloaded backend. This is the only one of the three cases that's actually the API team's bug. <br><br>
<b>User C:</b> look at the rhythm — dns→tcp ≈ 290 ms, tcp→tls ≈ 295 ms, tls→first-byte ≈ 300 ms. Each act costs one round trip, so this user simply has a <b>~300 ms RTT</b> to the server: they're far away (or on satellite/VPN). Nothing is broken; §7 is happening to them. Mitigations are architectural — edge nodes, connection reuse — not bug fixes. <br><br>
One command, three different layers, three different teams to page. That's why you measure before guessing.
</div></details>
</div>

<div class="problem medium">
<span class="difficulty">🟡 Medium</span>

### The mystery of the 10,000 TIME_WAITs

> After every load test, Dev runs `netstat` on the API server and finds ~10,000 connections in `TIME_WAIT`. He files a bug: "connection leak — sockets not being closed properly." A senior engineer closes the ticket with one line: "Working as intended. Also: you closed first."

**Questions:** (1) Why is this not a leak — what is TIME_WAIT *for*? (2) What does "you closed first" mean, and what detail of the teardown does it reveal? (3) When *could* heavy TIME_WAIT accumulation become a real (client-side) problem?

<details class="hint"><summary>Hint</summary>
<div class="inner">
Section 5, teardown. Old packets from a finished conversation can still be wandering the network when it ends. What could go wrong if the same 4-tuple were reused immediately — and which side takes on the duty of waiting? Then recall: every connection a <i>client</i> opens consumes what finite resource (§4)?
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
<b>(1)</b> TIME_WAIT is TCP being deliberately careful: after the final FIN/ACK exchange, stray packets from the just-closed conversation may still be in flight. If a <b>new</b> connection immediately reused the exact same 4-tuple, those ghosts could be mistaken for its data. So the closer holds the tuple in quarantine (a minute or so, ~2× the maximum expected packet lifetime) until any stragglers have died. 10,000 closed-per-minute connections ⇒ ~10,000 entries. Each is just a tiny kernel record counting down — not a held-open socket, not a leak. <br><br>
<b>(2)</b> TIME_WAIT lands on whichever side sends the <b>first FIN</b> — the <i>active closer</i>. The server having all the TIME_WAITs means the server initiated the closes (common: the load tester didn't use keep-alive, so the server closed after each response). Teardown isn't symmetric in its consequences. <br><br>
<b>(3)</b> On a <b>client</b> hammering one server: each new outgoing connection consumes an ephemeral port, and ports stuck in TIME_WAIT can't be reused for the same destination — burn through ~16k–28k of them within the quarantine window and new connections start failing. The real fix is almost never "tune TIME_WAIT away"; it's <b>connection reuse</b> — which also wins you back all the handshake RTTs from §7. The deep lesson: the protocol's "weird states" are usually load-bearing.
</div></details>
</div>

<div class="problem hard">
<span class="difficulty">🔴 Hard</span>

### Why your video call doesn't want TCP's help

> A team is building a video-conferencing product. A new grad proposes sending the audio/video streams over TCP: "Reliability is free — TCP retransmits lost packets, guarantees order, and we already know it works with HTTPS everywhere." The streaming veteran on the team winces: "Every guarantee you just listed would make calls *worse*. We're using UDP — and then rebuilding *some* of TCP on top, but not those parts."

**Questions:** (1) Walk through what TCP's retransmission + in-order delivery does to live audio when one packet is lost on a 200 ms-RTT link — why is the "repaired" stream worse than a broken one? (2) Which TCP-ish features would you still rebuild on top of UDP, and which would you deliberately leave out? (3) Connect this to why HTTP/3/QUIC also chose UDP ([Chapter ①](#01-http) §6) — same choice, different reason. What's the difference?

<details class="hint"><summary>Hint</summary>
<div class="inner">
Section 6: when packet №17 is lost, what happens to already-arrived packets №18–40, and how many RTTs until №17's replacement lands? Now ask: what is a 300 ms-old syllable of speech <i>worth</i> on a live call — and what would the listener prefer the app do instead? For (3): QUIC <i>does</i> retransmit everything. So what did it keep from TCP, and what did it fix?
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
<b>(1)</b> Audio packet №17 is lost. TCP's in-order promise makes the receiver's kernel <b>buffer packets №18–40 and release nothing</b> until №17's retransmission arrives — detection plus re-send costs on the order of an RTT or more, so ~200–400 ms of <i>already-arrived</i> audio sits frozen (§6's head-of-line blocking). Then it's all released at once: the app must either play stale audio late (and stay permanently behind) or skip ahead anyway — meaning the retransmission was pure waste. A live call would rather have a 20 ms click (conceal one lost packet, move on) than a half-second freeze followed by a time-warp. <b>For real-time data, a late packet is exactly as useless as a lost one — but TCP makes everything behind it late too.</b> <br><br>
<b>(2)</b> Keep (rebuilt app-side, e.g. via RTP/WebRTC): <b>sequence numbers</b> — not to enforce order, but to <i>detect</i> loss and reorder within a tiny playback buffer; <b>timestamps</b> for sync; <b>congestion control</b> — you must still back off when the network chokes (typically by lowering video bitrate, not by pausing reality); selective repair only where it's cheap (FEC, or retransmitting only key video frames). Leave out: <b>guaranteed delivery</b> of every packet and <b>strict in-order release</b> — the two guarantees whose price is waiting. <br><br>
<b>(3)</b> QUIC also fled TCP — but it wants <i>full</i> reliability (web pages must arrive complete). Its quarrel was with TCP's <b>single ordered byte stream</b>: one loss stalls all multiplexed streams. On UDP, QUIC rebuilds retransmission and ordering <b>per stream</b>, so a loss stalls only its own stream. Same escape hatch, opposite endpoints: video calls drop reliability they don't want; QUIC keeps reliability but re-scopes it. The shared insight is the chapter's deepest: <b>TCP is one bundle of policies, not a law of nature — and UDP is the door you take when any policy in the bundle doesn't fit.</b>
</div></details>
</div>

<div class="problem hard">
<span class="difficulty">🔴 Hard</span>

### The first request is always slow

> An SRE notices a pattern on a freshly deployed API: the very first request from any new client takes ~900 ms, the second ~210 ms, and by the tenth they cruise at ~190 ms — *for every client, every time, on every network*. Even stranger: the first **large** download from a new connection crawls for the first second, then visibly accelerates, even on fat office links. No code changed between request one and ten.

**Questions:** Explain both effects using this chapter. (1) Itemize what the first request pays that the tenth doesn't. (2) Why does a fresh connection's *throughput* start low and climb — even with zero packet loss and huge bandwidth? (3) An engineer proposes "warming" connections (opening and exercising them before real traffic). What exactly does warming buy, layer by layer?

<details class="hint"><summary>Hint</summary>
<div class="inner">
(1) is §7's table plus §3's caches — list every cache and handshake that's cold. (2) is the <i>other</i> slow thing in §6: how much does a new TCP connection dare to send in its first round trip, and what happens each RTT after? (3) follow each cost from (1) and (2) and mark which ones persist after the warm-up requests complete.
</div></details>

<details class="answer"><summary>Answer</summary>
<div class="inner">
<b>(1)</b> Request one pays, stacked: a cold <b>DNS</b> lookup (no cached answer anywhere — possibly a full root→TLD→authoritative walk), the <b>TCP handshake</b> (1 RTT), the <b>TLS handshake</b> (~1 RTT), and often server-side cold costs too (its own cold caches, JIT, pool spin-up). Request two inherits the cached DNS answer and — with keep-alive — the <i>same established, encrypted connection</i>, so it pays ~1 RTT plus server time. By request ten even the server is warm: 190 ms ≈ RTT + processing, the irreducible floor. <br><br>
<b>(2)</b> <b>Slow start</b> (§6). A new connection has no idea what the path can carry, so congestion control begins timidly — roughly 10 packets (~14 KB) in flight in the first RTT — then doubles every round trip until it finds the ceiling. The visible "acceleration" is exponential growth in action: for the first ~5–10 RTTs, throughput is capped by the congestion window, <i>not</i> by your gigabit link. This is why a fresh connection physically cannot saturate a fat pipe immediately, loss or no loss. <br><br>
<b>(3)</b> Layer by layer, warming buys: <b>DNS</b> — answer cached (until TTL expiry); <b>TCP</b> — handshake done, connection held open; <b>TLS</b> — keys established (and a session ticket for cheap resumption even if the connection drops); <b>congestion window</b> — already grown on a connection that's moved real data, so big transfers start near full speed; <b>server warmth</b> — pools filled, caches primed. This is precisely why browsers speculatively pre-connect, why HTTP clients pool connections, and why load balancers keep hot connection pools to backends. The grand unifying lesson of the chapter: <b>"slow" on the web is usually not slow code — it's cold state, counted in round trips.</b>
</div></details>
</div>
