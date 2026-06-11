## 6. Reliability & ordering — TCP's promise, and its price

Hold two facts side by side. Fact one, from §2: the network **loses, reorders, and duplicates** packets routinely. Fact two, from your entire life: you have *never* downloaded a JSON response with a hole in the middle. Someone between those two facts is doing heroic work. Here's how TCP does it.

### The machinery, in three moves

- **Sequence numbers.** TCP numbers every *byte* it sends (using the starting numbers exchanged in the §5 handshake). Whatever order packets arrive in, the receiver knows exactly where each byte belongs.
- **ACKs.** The receiver continuously reports back: *"I have everything up to byte №8000."* Duplicate arrivals are recognized by number and discarded.
- **Retransmission.** The sender keeps a copy of everything un-ACKed. If an ACK doesn't arrive in time — or the receiver's ACKs make a gap obvious — the sender sends the missing bytes again. Lost packets become, simply, *late* packets.

Out of lost, shuffled, duplicated postcards, the receiver reconstructs a perfect, ordered byte stream. Your application reads it like a file and never learns about the chaos below.

### The promise: order. Not speed.

Read TCP's contract carefully: *bytes arrive complete and in order* — there is no clause about *when*. The two guarantees are actually in tension. Suppose packet №17 is lost but №18–№40 arrive fine. The receiver's kernel **already holds** those later bytes — yet it refuses to hand your application a single one of them, because delivering byte 18,000 before byte 17,000 would break the in-order promise. Everything waits, buffered, until the retransmitted №17 finally lands.

That stall has a name you've met before: **head-of-line blocking** — this time at the TCP level. One lost packet (~1.5 KB) freezes the entire connection for a round trip or more. And it's precisely why HTTP/3 abandoned TCP for QUIC ([Chapter ①](#01-http) §6): HTTP/2 multiplexes many streams over *one* TCP connection, so one lost packet stalls *every* stream — even ones whose packets all arrived. QUIC keeps reliability per-stream, so a loss only stalls the stream it belongs to.

<div class="analogy">
A colleague dictates a 40-page report to you over a crackly phone, page by numbered page, and you must hand finished pages to your boss <b>strictly in order</b>. Page 17 gets garbled. Pages 18–40 come through fine — you stack them on your desk, but your boss gets <i>nothing</i> until the re-read of page 17 arrives. The report is guaranteed complete and ordered; nobody guaranteed your boss wouldn't sit idle. That desk-stack-while-waiting is head-of-line blocking.
</div>

### Two brakes: flow control and congestion control

TCP also deliberately limits its own speed — twice:

- **Flow control** protects the *receiver*: every ACK advertises how much buffer space the receiver has left, and the sender never sends more than that. You can't pour data into a phone faster than its app drains it.
- **Congestion control** protects the *network*: there's no one to advertise the capacity of twenty router hops, so TCP probes for it. It starts cautiously — roughly 10 packets (~14 KB) in the first round trip — then ramps up fast, doubling each round trip (**slow start**, ironically named for how it ends up: exponential). When loss appears — essentially the network's only way of saying "too much" — it backs off and re-probes.

Practical consequence: **every fresh TCP connection starts slow** and earns its speed over several round trips. A brand-new connection physically cannot use your gigabit pipe in its first few exchanges — one more reason browsers fight to reuse connections (Chapter ① §7), and a perfect bridge to the next section.

<div class="quiz">
<div class="quiz-q">On an HTTP/2 connection, 10 images stream in parallel over one TCP connection. One packet belonging to <i>image 3</i> is lost. What happens to the other nine images?</div>
<button class="quiz-opt">Nothing — they're independent streams, so they keep flowing</button>
<button class="quiz-opt" data-correct>They all stall until image 3's packet is retransmitted — TCP delivers one ordered byte stream and holds back everything after the gap</button>
<button class="quiz-opt">Image 3 is dropped from the page and the rest continue</button>
<div class="quiz-why">HTTP/2's streams are an illusion painted <i>on top of</i> a single TCP byte stream. TCP doesn't know about images; it knows byte №17,000 is missing, so bytes 18,000+ — whichever stream they belong to — wait in the kernel buffer. This is TCP-level head-of-line blocking, and fixing it required replacing TCP itself: that's QUIC / HTTP/3.</div>
</div>
