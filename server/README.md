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
- from at least three different people, and from `minVoices` (60%) of the circle
  once 60% of it is more than three,
- across two separate days,
- with no single person accounting for more than `maxShare` (50%) of the
  messages.

`POST /api/circles/:id/meetups` returns 409 with exactly what is missing until
all five are met. The front end draws the same five as a checklist, so the gate
is visible rather than a disabled button.

The last two are from Woolley, Chabris, Pentland, Hashmi & Malone (2010), who
found a group's collective intelligence predicted by the equality of
conversational turn-taking rather than by the ability of its members. The first
three checks could not tell a conversation from a broadcast: twenty messages
from three of eight people passed, and so did twenty messages where one person
wrote seventeen. `circleStats` returns `loudest` (the largest per-sender count)
and `readiness` turns it into a percentage. It is the only check expressed as a
ceiling: checks carry either `need` (a floor) or `max`, and the only part of the
gate a circle can fail by talking more.

**The ceiling** (`DRIFT_RULE`). The floor above stops cold meetings; this stops
the opposite failure. Ramirez & Zhang (2007) found that late online-to-offline
switches produce worse outcomes than never meeting at all. `circles.ready_at`
is stamped the first time a circle passes the gate, and the clock runs from
whichever is later, that or the last occurrence:

| Days ready and unmet | `drift.stage` | What happens |
|---|---|---|
| a confirmed meetup is in the future | `planned` | clock stopped |
| 0–13 | `ok` | nothing |
| 14–27 | `nudge` | the circle is told it is time |
| 28+ | `drifting` | named as avoidance, **and `POST /prompt` returns 409** |

Refusing the icebreaker is deliberate: posting another question to a circle
that has been able to meet for a month is the avoidance, not the cure. It is
checked before the twelve-hour prompt limit, so the person gets the useful
refusal rather than "wait twelve hours".

**Hours, not messages** (`HALL`). Hall (2018): ~50 hours together to a casual
friend, 90 to a friend, 200+ to a close friend. `meetup_occurrences` is the
ledger and `attendance` is the record; hours are banked only when someone says
they were there (`POST /api/occurrences/:id/attended`). An occurrence counts
towards the *circle's* hours only once two people have confirmed, so one person
claiming a meetup nobody attended does nothing.

**Repeating** (`CADENCES`: weekly, fortnightly, monthly). A recurring meetup row
is always the *next* occurrence. When its end time passes, `rollCircle` files an
occurrence, clears the RSVPs and advances the date; a one-off becomes `done`
instead. Rolling is lazy — it happens when a member looks at the circle.

**A meetup is a proposal until a quorum says yes.** Quorum is
`max(2, ceil(members / 3))`. Enough yes RSVPs flips it to `on` automatically; it
never happens because one person pushed. A proposal can be anchored to a
hand-checked listing from the finder's own city data, so "do something" names a
real place. Every meetup card carries the first-meetup checklist from
`FYC.MEETUP_SAFETY`.

**A yes carries a plan** (`INTENTION`, `PLAN_ASK`). Gollwitzer & Sheeran (2006),
meta-analysing 94 studies, found that naming when, where and how you will act
moves people from intending to doing with a medium-to-large effect. A yes is
exactly a bare intention, and the quorum means others are relying on it, so
`POST /api/meetups/:id/rsvp` requires `plan` of 12 characters or more when
`answer` is `yes` — and nothing at all for `maybe` or `no`. Proposing counts as
your yes, so `POST /api/circles/:id/meetups` requires one too. The plan lives on
the RSVP row, is returned only to its author as `myPlan`, and is deleted with
the RSVP when a recurring meetup rolls on: each date needs its own cue.

**Questions that escalate as the circle earns them** (`PROMPT_SETS`,
`DISCLOSURE`). Aron et al. (1997) produced more closeness between strangers in
45 minutes than small talk ever does, by walking them up three sets of
increasingly personal questions — the escalation is the mechanism. Reis &
Shaver's intimacy model supplies the condition: disclosure only builds closeness
when somebody responds to it. So `FYC.PROMPT_SETS` has three sets (Easy,
Personal, Real) and a circle opens the next one by answering two questions at
its current level, where "answered" means two or more different people replied
before the next question went up (`promptRuns` in `db.js`). A question nobody
answers buys nothing, and a circle cannot reach the deep end by waiting.
`POST /api/circles/:id/prompt` draws from the earned set and reports
`disclosure` back.

**And when nobody replies, the rest of the circle hears about it.**
`lastUnanswered` finds the case the model warns about: someone answered the
question, nobody said anything back, and the person who went first is worse off
than if they had said nothing. After `respondAfterHours` (4) it appears on the
circle as `respond` — for everyone **except** the person it happened to. Telling
them nobody replied would be the one genuinely cruel thing the app could do.

**The question is handed to whoever has gone quiet** (`QUIET`, `quietMembers`).
Preece, Nonnecke & Andrews (2004) asked people in online communities why they
read without posting: not indifference, but having nothing to add yet, not
wanting to intrude, and never having been asked anything. So
`POST /api/circles/:id/prompt` picks up to `invite` (2) members who have said
nothing for `quietHours` (48) and joined more than `graceHours` (24) ago,
quietest first, and stores their ids on the message's `invites` column. Excluded:
whoever pressed the button, and anyone named on the previous question
(`lastInvites`) — nobody is spotlit twice running. `GET /messages` resolves the
ids to names as `invited` and the raw column never leaves the server. The
question itself still comes from the fixed list; this only records who it was
handed to. It is also what gets a circle past the turn-taking half of the gate.

**What the circle says it is** (`WANTS`, `story`). Campbell (1958) called it
entitativity; Lickel, Hamilton et al. (2000) identified the features behind the
perception — interaction, shared goals, duration, importance to the members —
and Postmes, Spears, Lee & Novak (2005) found an identity induced from members'
own contributions held more strongly than one deduced from a label handed down.
`POST /api/circles/:id/wants` stores one line per membership (8–140 characters,
empty clears it), returned to other members as `wants`. The circle view's
`story` carries `since`, `days`, `occurrences` and `regulars` — who has
attended every single occurrence, from `regulars` in `db.js`, which needs at
least two before anyone counts as one. `story` is computed only for members and
only when `viewCircle` is called with `deep`, so a list of sixty circles does
not pay for it.

**Bonds, not just a shared subject** (`BOND`, `sideThread`). Ren, Kraut &
Kiesler (2007) separate identity-based attachment (to the group and its
subject) from bond-based attachment (to the particular people in it). One group
thread can only build the first, and the second is what survives the group
going quiet. Two things make the second possible: the member list shows what any
two people both picked (`sharedInterests`, visible interests on both sides
only), and `POST /api/circles/:id/threads` opens a one-to-one conversation with
someone from the circle. The door is narrow — you have both already spoken
there, which is what stops it being a cold DM — and the thread is an ordinary
accepted connection, so it lands in Messages under the same blocking, reporting
and daily caps as everything else. `openToDirect` is still respected.

Circles are capped at 4–8 people, 6 by default (`CAP_RANGE`); past the cap an
application is waitlisted rather than refused. The ceiling was 12 and came down
on the strength of Fay, Garrod & Carletta (2000) — the same discussion task held
a dialogue in groups of five and collapsed into serial monologue in groups of
ten — and Dunbar, Duncan & Nettle (1995), who found conversations fragmenting
past about four people. `createApp` calls `store.lowerCaps(CAP_RANGE.max)` once
at startup, which brings existing circles under the new ceiling without removing
anyone: a circle with ten members keeps `cap` 10 and loses only its empty
seats. A non-member sees a circle's name, city,
description, joining question, size and liveliness — never the conversation,
never the member list, and not how deep its questions have got. Questions come
from `FYC.PROMPT_SETS` in `src/data/core.js`, shared with the front end so
nobody can post an invented one, rate-limited to one per circle per twelve
hours.

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
GET    /api/circles/:id/messages?since=  members only; prompts carry `invited`
POST   /api/circles/:id/messages
POST   /api/circles/:id/read             move the unread marker
POST   /api/circles/:id/prompt           the next question, from the set you have earned
POST   /api/circles/:id/threads          one-to-one, if you have both spoken here
POST   /api/circles/:id/wants            your line on what you came for; '' clears it
POST   /api/circles/:id/vouch
POST   /api/circles/:id/meetups          409 until the circle is ready; needs a plan
POST   /api/meetups/:id/rsvp             yes | maybe | no; a yes needs a plan
POST   /api/meetups/:id/cancel           proposer or host
POST   /api/occurrences/:id/attended     were you there? the only thing that banks hours
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

311 assertions covering signup and sign-in, session isolation, interest
visibility, the request/accept/message flow, outsiders being kept out of other
people's threads, blocking, reporting, rate limits, the full circle lifecycle
(trust tiers, written applications, member seconding, the readiness gate,
quorum, vouching, caps and waitlists, host tools), the drift clock and its
refusal of icebreakers, the hours ledger, recurring meetups rolling forward,
the escalating question sets refusing to advance on an unanswered question, the
responsiveness nudge staying hidden from the person it is about, the one-to-one
thread gate in both directions, if-then plans being required on a yes and
visible to nobody else, the turn-taking check holding the gate shut on a circle
where one person wrote most of it, a question being handed by name to the member
who has never spoken (and never to whoever asked for it, or the same person
twice running), what a circle says it is for staying inside it, the ceiling
coming down to eight without removing anyone, and that the server will not serve
its own source or escape the project directory.

Two things are relaxed, both because a circle's whole life happens in
milliseconds there: the "two separate days" rung of the readiness gate, via
`createApp({ ready: { minDays: 1 } })`, and the four-hour grace period before
anyone is told nobody replied, via `disclosure: { respondAfterHours: 0 }`. The
other four rungs, and everything else, are tested at their real values. The
twelve-hour gap between questions, the 48-hour quiet window and the 24-hour
grace period for a new member are all real, and the tests work around them by
winding the message clock and the join dates back rather than switching the
rules off.
