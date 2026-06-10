## 4. REST leverages HTTP methods

This is where Chapter ① pays off. REST maps **CRUD** (Create, Read, Update, Delete) onto HTTP methods:

| Action | Method | Example | Typical success code |
|---|---|---|---|
| Create | `POST` | `POST /articles` | `201 Created` |
| Read (list) | `GET` | `GET /articles` | `200 OK` |
| Read (one) | `GET` | `GET /articles/9` | `200 OK` |
| Replace | `PUT` | `PUT /articles/9` | `200 OK` / `204 No Content` |
| Update (partial) | `PATCH` | `PATCH /articles/9` | `200 OK` |
| Delete | `DELETE` | `DELETE /articles/9` | `204 No Content` |

And it uses **status codes honestly** (Chapter ①, §4): `201` when something is created, `404` when a resource doesn't exist, `400` for bad input, `401`/`403` for auth, `409` for conflicts. A REST API that returns `200 OK` with `{"error": "not found"}` in the body is lying to every cache and client between it and the user.

<div class="analogy">
Think of <code>PUT</code> vs <code>PATCH</code> as editing a document. <code>PUT</code> is "here is the entire new version, replace the whole file" — anything you leave out gets erased. <code>PATCH</code> is a sticky note: "just change the title to X" — everything else stays. Sending a half-filled object with <code>PUT</code> can silently wipe fields; that's why partial edits should use <code>PATCH</code>.
</div>

<div class="quiz">
<div class="quiz-q">User 9 wants to change only their email. Your teammate sends <code>PUT /users/9</code> with body <code>{"email": "new@example.com"}</code>. What happens, strictly by PUT semantics?</div>
<button class="quiz-opt">Only the email changes — the server merges the body into the existing user</button>
<button class="quiz-opt" data-correct>The whole resource is replaced, so every field not in the body (name, address…) can be wiped — this edit should be a <code>PATCH</code></button>
<button class="quiz-opt">It fails with <code>405 Method Not Allowed</code> because PUT can only create new resources</button>
<div class="quiz-why"><code>PUT</code> means "here is the <b>entire</b> new state of this resource" — omitted fields aren't preserved, they're gone. The merge behaviour you probably expected is exactly what <code>PATCH</code> is for; many real APIs do merge on PUT, but relying on that is relying on a bug-shaped convenience.</div>
</div>
