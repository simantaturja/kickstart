## 1. What is REST?

**REST** = **RE**presentational **S**tate **T**ransfer. It's an **architectural style** — a set of constraints — described by Roy Fielding in his 2000 PhD dissertation. It is *not* a protocol, a standard, or a library. You can't `npm install rest`.

The core idea in one sentence: **expose your application's data as "resources," give each a URL, and manipulate them using standard HTTP methods.**

A REST API that follows the constraints tends to be:

- **Predictable** — once you know one endpoint, you can guess the rest.
- **Scalable** — statelessness lets you add servers freely.
- **Decoupled** — client and server evolve independently.

<div class="analogy">
REST is like a well-organized public library that follows universal conventions. Every book (<b>resource</b>) has a unique catalog number (<b>URI</b>). The actions are the same everywhere — borrow, return, reserve (<b>HTTP methods</b>) — so once you've used one library, you can use any library on earth without instructions. REST is that shared convention applied to data over HTTP.
</div>

<div class="funfact">
REST comes from Chapter 5 of Roy Fielding's 2000 PhD dissertation at UC Irvine — and Fielding wasn't just theorizing from the sidelines. He was a principal author of the HTTP/1.1 specification itself and a co-founder of the Apache HTTP Server project. REST is essentially him writing down <i>why the web's architecture works so well</i>.
</div>
