## 4. Response status codes

Every response carries a **3-digit status code**. The first digit tells you the category:

| Range | Category | Vibe | Examples |
|---|---|---|---|
| **1xx** | Informational | "Hold on, working…" | `100 Continue` |
| **2xx** | Success | "Here you go" | `200 OK`, `201 Created`, `204 No Content` |
| **3xx** | Redirection | "It's over there" | `301 Moved Permanently`, `304 Not Modified` |
| **4xx** | Client error | "*You* messed up" | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests` |
| **5xx** | Server error | "*We* messed up" | `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable` |

<div class="analogy">
Status codes are a receptionist's responses. <b>2xx</b>: "Done, here's your file." <b>3xx</b>: "That office moved to floor 4." <b>4xx</b>: "You filled the form wrong" / "You're not on the guest list" / "There's no such person here." <b>5xx</b>: "Our computer just crashed, not your fault, try again." Knowing the digit tells you <i>who to blame and what to do next</i> before you read a single word.
</div>

The single most useful debugging habit: **read the status code first.** A `401` vs `403` vs `404` points you at completely different bugs — auth missing, auth present-but-forbidden, or wrong URL.

<div class="quiz">
<div class="quiz-q">A user is logged in but tries to open the admin panel they have no rights to. Which status fits best?</div>
<button class="quiz-opt">401 Unauthorized</button>
<button class="quiz-opt" data-correct>403 Forbidden</button>
<button class="quiz-opt">404 Not Found</button>
<div class="quiz-why">401 really means "unauthenticated — who are you?"; the server knows exactly who this user is. 403 is "I know you, and the answer is no." (404 is reasonable only when you want to hide that the page exists.)</div>
</div>

<div class="funfact">
There is a real status code <code>418 I'm a teapot</code> — the response a teapot must give when asked to brew coffee. It comes from RFC 2324, the <i>Hyper Text Coffee Pot Control Protocol</i>, published as an April Fools' joke in 1998. The joke stuck: many serious frameworks still implement 418, and a 2017 attempt to remove it sparked a "Save 418" campaign that won.
</div>
