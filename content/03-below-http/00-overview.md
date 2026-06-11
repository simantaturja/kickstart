# Chapter ③ — Below HTTP

> **Learning objective:** Understand what actually happens *underneath* an HTTP request — how data is sliced into IP packets, how DNS turns names into addresses, what ports and sockets really are, how TCP builds a reliable "connection" out of an unreliable network, and why round-trip latency (not bandwidth) decides how fast the web feels.

> This chapter builds directly on **[Chapter ①](#01-http)** — and then digs *below* it. There we treated "DNS lookup", "TCP handshake", and "connection" as black boxes. Here we open every one of them. By the end, you'll be able to read every single line of `curl -v` output and know exactly what the machine is doing.
