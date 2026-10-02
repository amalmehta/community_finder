# The backend

Accounts, people discovery and messaging. Node's built-in SQLite and crypto —
no dependencies, nothing to install.

```bash
node server/app.js            # http://localhost:4000
PORT=8080 node server/app.js  # somewhere else
SECURE=1  node server/app.js  # behind HTTPS: marks the session cookie Secure
```

The database is created at `server/data/community.db` on first run and is
gitignored. Delete that file to start over.

## The Mac app

`community_finder.app` probes this server on launch and uses it if it answers,
falling back to its own bundled copy of the front end when it does not. Point it
at a different instance with View → Server… inside the app.

## What it serves

The same static app, plus an API. The front end calls `GET /api/me` on load:
if that succeeds, accounts are on and the app requires a profile. Served
statically instead (GitHub Pages), the call fails and the app runs exactly as
it did before, with no account and no network calls.

## Safety behaviour worth knowing

- **Nobody can message you until you accept.** A first contact is one
  introduction, capped at 300 characters. Nothing else can be sent until the
  recipient accepts it.
- **New accounts get 3 introductions a day**, established ones 10 a day and 3
  an hour. This is where mass-messaging starts, so it is where the limit is.
- **Hidden interests are never used for discovery.** An interest can shape your
  own results while being invisible to everyone else — which matters for the
  support and LGBTQ+ categories.
- **Reporting someone also blocks them.** Nobody should have to report a person
  and then keep hearing from them.
- **Blocking is mutual and immediate**: they vanish from your discovery, you
  vanish from theirs, and any existing connection is closed.

Limits are configurable — see `DEFAULT_LIMITS` in `server/app.js`.

## Passwords

scrypt (N=16384) with a per-user random salt, compared with
`timingSafeEqual`. Sessions are 32 random bytes in an httpOnly, SameSite=Strict
cookie, and mutations additionally check the Origin header.

No email addresses are stored, which means there is no password reset: a
forgotten password means a new account. That was a deliberate trade — see the
auth decision in the main README.

## Tests

```bash
node tests/run-server-tests.js
```

54 assertions covering signup and sign-in, session isolation, interest
visibility, the request/accept/message flow, outsiders being kept out of other
people's threads, blocking, reporting, rate limits, and that the server will
not serve its own source or escape the project directory.
