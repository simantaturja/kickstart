## 7. Latency vs bandwidth — why the speed of light runs the web

Riddle: a courier company offers to drive a station wagon full of hard drives from Amsterdam to Madrid. Total capacity: 500 terabytes, arriving in 18 hours. That beats most fiber links ever installed — the wagon's *bandwidth* is enormous. Would you video-call over it? Obviously not: your "hello" would take 18 hours to arrive. The wagon has world-class bandwidth and catastrophic **latency** — and they are completely different things.

- **Bandwidth** — how much data fits through per second. The *width* of the pipe.
- **Latency** — how long one bit takes to get there. The *length* of the pipe.

Money buys bandwidth: lay more fiber, the pipe widens every year. Latency has a wall physics won't move: light in fiber travels at roughly **200,000 km/s** (about two-thirds of light in vacuum). Amsterdam–New York and back is ~12,000 km — so **~60 ms round trip is the theoretical floor**, before adding a single router. No product, protocol, or budget shrinks it. Real-world round-trip time (**RTT**) on that route is ~75–90 ms.

### RTT is the currency of the web

Why obsess over RTT? Because nothing on the web happens in one direction — everything is ask-and-wait. Count the round trips your browser pays before the *first byte* of a page from a never-visited HTTPS site:

| Step | What happens | Cost |
|---|---|---|
| DNS (§3) | resolve the name (cache cold) | ~1 RTT |
| TCP (§5) | three-way handshake | 1 RTT |
| TLS ([Chapter ①](#01-http) §11) | encryption handshake (TLS 1.3) | 1 RTT |
| HTTP | request → response | 1 RTT |

**~4 round trips before one pixel.** At 80 ms RTT that's ~320 ms of pure *waiting* — and a typical small API response (a few KB) adds almost nothing on top, whether your connection is 10 Mbps or 10 Gbps. For the small requests that dominate web traffic, **latency is the whole game and bandwidth is nearly irrelevant**. (Bandwidth takes over only for big transfers: video, downloads, that 200 MB bundle someone shipped.)

This explains tricks you've already met as one family: keep-alive and multiplexing (Chapter ① §6–7) exist to pay the handshake RTTs **once** instead of per request; caching (Chapter ① §8) makes the RTT count **zero**.

### Why CDNs exist

Now the punchline. If you can't make light faster, **move the conversation closer**. A CDN puts copies of your content in hundreds of cities so the user in Jakarta talks to a server in Jakarta: the 280 ms RTT to your Virginia origin becomes 15 ms — and *every* round trip in the table above shrinks ~20×, handshakes included. That's the entire trick. CDNs don't make pipes fatter; **they make pipes shorter.**

<div class="analogy">
Bandwidth upgrades are hiring more waiters; latency is the distance to the kitchen. If the kitchen is across town, hiring fifty waiters won't make your starter arrive sooner — every "could I also get…?" still takes a round trip across town. A CDN doesn't hire waiters; <b>it builds a kitchen on your street</b>.
</div>

<div class="quiz">
<div class="quiz-q">Your API client in Sydney calls a server in London (RTT ~250 ms) and each call takes ~1 second, even though responses are tiny. The team proposes upgrading both ends from 100 Mbps to 1 Gbps. Will it help?</div>
<button class="quiz-opt">Yes — ten times the bandwidth means roughly ten times faster calls</button>
<button class="quiz-opt" data-correct>Barely — the second is ~4 round trips of waiting (DNS, TCP, TLS, HTTP); reusing connections or moving the server closer would help, more bandwidth won't</button>
<button class="quiz-opt">Yes, but only if the server is upgraded too</button>
<div class="quiz-why">A few KB pass through 100 Mbps in under a millisecond — the pipe was never the problem; the 250 ms of distance, paid ~4 times, is. Real fixes attack RTTs: keep-alive connections (pay handshakes once), an edge server near Sydney, or batching to spend fewer round trips. The first instinct to check on a slow network call: <b>is this bandwidth-bound or latency-bound?</b> Small payload → almost always latency.</div>
</div>

<div class="funfact">
Computer-science folklore, via Andrew Tanenbaum (1981): <i>"Never underestimate the bandwidth of a station wagon full of tapes hurtling down the highway."</i> Still true — when Amazon customers need to move petabytes into AWS, Amazon offers physical devices shipped by truck (the late, beloved <b>AWS Snowmobile</b> was a literal 45-foot semi-trailer hauling up to 100 PB). For sheer volume, trucks still beat fiber. For your API call, physics already voted: send packets, keep them short-haul.
</div>
