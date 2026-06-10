## 2. Resources — the heart of REST

In REST you stop thinking in *actions* and start thinking in *things* — **resources**. A resource is any noun your system cares about: a user, an order, a comment, a photo.

The classic beginner mistake is designing endpoints as **verbs**:

```
❌  POST /createUser
❌  POST /getUserById
❌  POST /deleteUser
❌  POST /updateUserEmail
```

The RESTful way exposes a *resource* and lets the **HTTP method** be the verb:

```
✅  POST   /users          → create a user
✅  GET    /users/42       → read user 42
✅  DELETE /users/42       → delete user 42
✅  PATCH  /users/42       → update user 42
```

One noun, many verbs. The method already tells you the action, so the URL shouldn't repeat it.

<div class="analogy">
A bad API is a restaurant with a separate, oddly-named door for every action: a "GetSoup" door, a "MakeSoup" door, a "ThrowAwaySoup" door. A REST API is <i>one</i> kitchen (<code>/soup</code>) where the <i>verb</i> you use — order, prepare, discard — does the work. Fewer doors, and you already know how to use them all.
</div>

<div class="funfact">
Roy Fielding got so frustrated with RPC-style APIs like <code>POST /getUserById</code> calling themselves "REST" that in 2008 he wrote a famous blog post titled <i>"REST APIs must be hypertext-driven"</i> — bluntly telling the industry that most self-described REST APIs don't actually follow his constraints. The debate it sparked is still going.
</div>
