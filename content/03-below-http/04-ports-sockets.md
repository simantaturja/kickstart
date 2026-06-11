## 4. Ports & sockets — getting to the right program

DNS gave you an IP address — that gets packets to the right *machine*. But that machine is running a web server, a database, an SSH daemon, and forty other programs. Who gets your bytes?

That's what a **port** answers: a number from 0–65535 that names a "door" on the machine. The IP address gets you to the building; the port gets you to the right office. Conventions you already know without knowing them: **443** = HTTPS, **80** = HTTP, **22** = SSH, **5432** = PostgreSQL. When you type `https://example.com`, your browser silently means *port 443*.

### What a socket actually is

A **socket** is the OS object a program uses to send and receive over the network — the thing `connect()`, `read()` and `write()` operate on. And here's the key insight: an established connection is identified not by one port, but by the full **4-tuple**:

```
(your IP, your port, server IP, server port)
(203.0.113.7, 51844, 93.184.215.14, 443)
```

(Pedantically a 5-tuple — the protocol, TCP or UDP, is the fifth element.) When a packet arrives, the OS reads these values off it and hands the data to exactly the right socket.

### "But how do 10,000 users fit on one port 443?"

A classic beginner puzzle: if the server has only one port 443, isn't it… occupied? No — because connections are distinguished by the **whole tuple**, not the server's port. Ten thousand clients connecting to `93.184.215.14:443` produce ten thousand *different* tuples, because each client brings its own IP and its own randomly-assigned **ephemeral port** (your OS picks one from a high range for every outgoing connection — 49152–65535 on macOS, 32768–60999 on typical Linux — that's the `51844` above). Same server door, ten thousand distinguishable conversations.

<div class="analogy">
A company's switchboard number (<b>port 443</b>) is printed on every business card, and thousands of people call it simultaneously — no caller ever gets "line busy because someone else is talking to the company." Why? The phone network distinguishes calls by <i>both ends</i>: <b>your</b> number plus theirs. Your callback number is the ephemeral port — assigned for this one call, recycled afterwards.
</div>

### What `listen` and `accept` mean

Server code everywhere — Node, Spring, Django — eventually says something like *listen on port 443*. Conceptually two kinds of socket are involved:

- The **listening socket** does no data transfer at all. It's a receptionist: it just waits at port 443 for new connection attempts.
- Each time a client completes a handshake (next section!), `accept()` hands the server a **brand-new connected socket** dedicated to that one client — identified by that client's unique 4-tuple. The receptionist immediately goes back to waiting.

So a busy server holds *one* listening socket and *thousands* of connected sockets, all on port 443. You can see them yourself with `lsof -i :443` (§9).

<div class="quiz">
<div class="quiz-q">Your laptop opens two browser tabs to the same site. Both connections go to <code>93.184.215.14:443</code> from your single IP. How does the server's OS keep the two streams apart?</div>
<button class="quiz-opt">It can't — the tabs share one connection by definition</button>
<button class="quiz-opt">By a session cookie the browser sends on each connection</button>
<button class="quiz-opt" data-correct>Each connection got a different ephemeral port on your side, so the 4-tuples differ in one element — and one element is enough</button>
<div class="quiz-why">Three parts of the tuple are identical (your IP, server IP, server port 443) — but your OS gave each connection its own ephemeral port, say 51844 and 51845. Different tuple → different socket → cleanly separated streams. Cookies live way up in HTTP land ([Chapter ①](#01-http) §9); the kernel sorting packets has never heard of them. (Whether the browser actually opens a second connection or multiplexes both tabs over one is an HTTP/2 story — Chapter ① §6.)</div>
</div>
