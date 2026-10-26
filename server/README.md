# The backend

Accounts, circles, people discovery and messaging. Node's built-in SQLite and
crypto — no dependencies, nothing to install.

```bash
npm run start:bg   # detached; survives closing the terminal
npm run status     # is it up, and on what pid
npm run log        # last 40 lines
npm run stop
```

Or in the foreground, where Ctrl-C stops it:

```bash
npm start                     # http://localhost:4000
PORT=8080 npm start           # somewhere else
SECURE=1  npm start           # behind HTTPS: marks the session cookie Secure
```

Run it in a terminal tab and it dies when that tab is closed, reused or
interrupted — which is easy to do by accident. `start:bg` detaches it, writes
`server/data/server.pid` and logs to `server/data/server.log`.

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

- **Strong alignment can skip the request step**: 3+ shared visible interests,
  the same city, and both people verified. Every leg is checked server-side, the
  recipient can turn it off with `openToDirect`, and blocking still wins. See
  `DIRECT_RULE` in `server/app.js`.
- **Contacting anyone requires a verified email.** The finder does not.

Limits and the alignment rule are configurable — see `DEFAULT_LIMITS` and
`DIRECT_RULE` in `server/app.js`.

## Circles

A circle is a small, vetted, local group with one group chat. The order is
fixed: talk, then decide to meet. Four things enforce it.

**Joining is an application, not a click.** Every circle has a question its
host wrote, and you answer it in 40 characters or more. The host can let you in
outright; failing that, two existing members seconding you carries it. Circles
are local — applying requires the same city as the circle.

**Trust tiers** (`trustOf` in `server/app.js`), which a circle sets a floor on:

| Tier | Name | Earned by |
|---|---|---|
| 0 | New here | an account, and nothing else |
| 1 | Verified | a confirmed email address |
| 2 | Introduced | tier 1, plus a city, three interests and a bio of 40+ characters |
| 3 | Vouched for | tier 2, plus two people who have talked with you in a circle |

Starting a circle needs tier 2. A vouch is only possible between members of the
same circle, and only once the person has actually said something in it, which
is what stops it becoming a follow button.

**The readiness gate** (`READY_RULE`). Nobody — host included — can propose a
meetup until the circle has had a real conversation:

- three people in it,
- twenty messages,
- from three different people,
- across two separate days.

`POST /api/circles/:id/meetups` returns 409 with exactly what is missing until
all four are met. The front end draws the same four as a checklist, so the gate
is visible rather than a disabled button.

**A meetup is a proposal until a quorum says yes.** Quorum is
`max(2, ceil(members / 3))`. Enough yes RSVPs flips it to `on` automatically; it
never happens because one person pushed. A proposal can be anchored to a
hand-checked listing from the finder's own city data, so "do something" names a
real place. Every meetup card carries the first-meetup checklist from
`FYC.MEETUP_SAFETY`.

Circles are capped at 4–12 people (`CAP_RANGE`); past the cap an application is
waitlisted rather than refused. A non-member sees a circle's name, city,
description, joining question, size and liveliness — never the conversation and
never the member list. Icebreakers come from `FYC.PROMPTS` in
`src/data/core.js`, shared with the front end so nobody can post an invented
one, rate-limited to one per circle per twelve hours.

### Endpoints

```
GET    /api/circles                      discovery, ranked; your circles; your trust
POST   /api/circles                      start one (tier 2+)
GET    /api/circles/:id                  detail — shopfront, or everything if you are in it
PATCH  /api/circles/:id                  host edits
POST   /api/circles/:id/close            stop new people joining
POST   /api/circles/:id/apply            a written answer
DELETE /api/circles/:id/apply            withdraw
POST   /api/circles/:id/applications/:a/(approve|decline|second)
POST   /api/circles/:id/leave
DELETE /api/circles/:id/members/:uid     host removes someone
GET    /api/circles/:id/messages?since=  members only
POST   /api/circles/:id/messages
POST   /api/circles/:id/read             move the unread marker
POST   /api/circles/:id/prompt           post the next icebreaker
POST   /api/circles/:id/vouch
POST   /api/circles/:id/meetups          409 until the circle is ready
POST   /api/meetups/:id/rsvp             yes | maybe | no; quorum confirms it
POST   /api/meetups/:id/cancel           proposer or host
GET    /api/unread                       every badge in the header, in one call
```

## Mail

`server/mail.js` has one interface and a default transport that writes to the
console and `server/data/outbox/`. That is enough to run and test the whole
verification flow with no provider. For real delivery, implement a transport
there and set `MAIL_TRANSPORT`.

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

179 assertions covering signup and sign-in, session isolation, interest
visibility, the request/accept/message flow, outsiders being kept out of other
people's threads, blocking, reporting, rate limits, the full circle lifecycle
(trust tiers, written applications, member seconding, the readiness gate,
quorum, vouching, caps and waitlists, host tools), and that the server will not
serve its own source or escape the project directory.

The "two separate days" rung of the readiness gate is the one thing the tests
relax, via `createApp({ ready: { minDays: 1 } })` — a circle's whole life
happens in milliseconds there. The other three rungs are tested for real.
