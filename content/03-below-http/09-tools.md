## 9. Your toolbox — poke the layers yourself

Everything in this chapter is observable from the terminal you already have. Five tools, one per layer — all copy-paste-able on macOS and Linux.

### `dig` — interrogate DNS (§3)

```bash
dig example.com                 # full answer with TTL
dig +short example.com          # just the IP
dig +short example.com AAAA     # IPv6 record
dig +short example.com MX       # who takes this domain's email?
dig example.com @8.8.8.8        # ask a specific resolver
dig example.com @ns1.example.net # ask the authoritative server directly — bypasses ALL caches
```

In the full output, the number after the name **is the TTL counting down** — run the same query twice and watch it shrink. That's a cache aging before your eyes. The last variant is the pro move during a DNS migration: ask the source of truth directly instead of arguing with stale caches. (`nslookup example.com` exists everywhere too, but `dig` shows more.)

### `ping` — measure your RTT (§7)

```bash
ping -c 5 example.com
```

```
64 bytes from 93.184.215.14: icmp_seq=0 ttl=56 time=89.4 ms
```

That `time=` is your round-trip time — the currency from §7. Ping something nearby (your router: often `192.168.1.1`, ~2 ms), then something across an ocean (~80–300 ms). You're feeling the speed of light. (Some hosts ignore pings; silence isn't always "down".)

### `traceroute` — watch the hops (§2)

```bash
traceroute example.com          # macOS / Linux
```

Each line is a router your packets pass through — your home router, your ISP, a backbone, an undersea cable's landing point, the destination's network. Watch the times jump when the route crosses an ocean. `* * *` lines are routers that don't answer; the packets still pass through fine.

### `curl -w` — time every act of §8

```bash
curl -o /dev/null -s -w "dns: %{time_namelookup}s\ntcp: %{time_connect}s\ntls: %{time_appconnect}s\nfirst byte: %{time_starttransfer}s\ntotal: %{time_total}s\n" https://example.com/
```

```
dns: 0.027s          ← Act 1 done (§3)
tcp: 0.117s          ← Act 2 done: +1 RTT (§5)
tls: 0.219s          ← Act 3 done: +1 more RTT (TLS)
first byte: 0.331s   ← Act 4–5: server thinking + 1 more RTT
total: 0.342s
```

Each value is cumulative since the start — the *gaps* between them time each act. This one-liner answers "why is this endpoint slow?" with *which layer* is slow: a fat `dns` gap means resolver trouble; `tcp`→`tls`→`first byte` gaps of roughly one RTT each are §7's table, measured live.

Want to *see* connection reuse? Give curl the URL **twice in one command** — it reuses the connection for the second transfer:

```bash
curl -s -o /dev/null -o /dev/null -w "tcp: %{time_connect}s  tls: %{time_appconnect}s\n" https://example.com/ https://example.com/
```

The timings print once per transfer: the first pays the handshakes; the second reports `tcp: 0.000000s  tls: 0.000000s` — the handshake gaps literally collapse to zero. That's §7's keep-alive economics, measured on your own machine.

### `lsof -i` / `netstat` — see the sockets (§4–5)

```bash
lsof -iTCP -sTCP:ESTABLISHED   # every live TCP connection on your machine, with 4-tuples
lsof -i :3000                  # who is squatting on port 3000? (every dev's weekly question)
netstat -an | grep TIME_WAIT   # §5's polite ghosts, counting down
```

The `lsof` output literally prints the 4-tuples from §4: `chrome … 192.168.1.5:51844->93.184.215.14:443 (ESTABLISHED)`. Open a few browser tabs and run it — there's the shared illusion, listed in your own kernel.

<div class="analogy">
These five tools are a doctor's kit for the network: <code>dig</code> checks the patient's ID, <code>ping</code> takes the pulse, <code>traceroute</code> is the X-ray of the path, <code>curl -w</code> is the full blood panel with a number per organ, and <code>lsof</code> is the live monitor showing every heartbeat your machine currently maintains. When someone says "the API is down," you now have a differential diagnosis instead of a shrug.
</div>
