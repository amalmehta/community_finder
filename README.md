# community_finder

A small web app for the problem of *"I live here and I don't know anyone."*

It asks **twenty questions, chosen one at a time**. What you have already said
decides what comes next: pick "Give" and it asks what kind of useful; say a room
of strangers is hard and it asks what would make it easier; say you want friends
and it asks whether you want the same faces every week. Once your chosen areas
are drilled out it probes the ones you skipped, at half weight — which is where
the surprises come from.

Then it returns real local groups —
and for each one, the information you can't get without ringing round: **the
concrete first step, what it costs, what the commitment is, and what actually
happens when you turn up.**

It assumes you are capable. It does not write your messages for you, reassure
you, or tell you it's okay to leave early. It tells you that the bird walk lends
binoculars, that the shelter wants an orientation first, that the league places
solo sign-ups on a team, and that the dance teaches the steps beforehand — the
specifics that decide whether something is worth your Saturday.

- **Thirteen cities are hand-curated** — San Francisco Bay Area, New York City,
  Los Angeles, Chicago, Seattle, Austin, Boston, Philadelphia, Washington DC,
  San Diego, Denver, Portland and Minneapolis (305 organisations, every link
  checked). Every city covers every one of the 32 interests, and the test suite
  enforces that. Listings mix the big
  obvious institutions with genuinely obscure ones, on the theory that a
  hidden four-acre farm is easier to walk into than a famous nonprofit.
- **Every other city works too.** A fallback engine builds live, working links
  into national directories (Meetup, VolunteerMatch, parkrun, Feeding America,
  CenterLink, Repair Café, Audubon, RRCA and more), pointed at the city you
  typed and the interests you picked.
- **And, with a server behind it, circles** — small vetted local groups that
  **talk first and decide to meet later**. See below.

---

## Circles: chat first, meet later

Every app in this space makes the first thing you do with a stranger the
hardest thing: turn up somewhere. Timeleft and 222 seat you at a dinner with
five people you have never spoken to. The dinner is the product. Whether you
actually have anything to say to each other is left to chance and to you, on
the night, in person, with no way out before dessert.

A **circle** inverts that. It is four to twelve people in one city who share
interests and one group chat. You talk. Only when the circle has genuinely been
a conversation does the app let anyone propose doing something — and then only
if enough people say yes.

**Joining is an application, not a click.** Every circle has a question its host
wrote: *"what are you reading or playing at the moment, and what are you
actually after here?"* You answer it in your own words. The host reads it; two
existing members seconding you carries it without the host, so the gate belongs
to the circle rather than one person. Circles are local: you apply in your own
city.

**Trust is earned in tiers**, and a circle picks the floor it will accept:

| Tier | Name | Earned by |
|---|---|---|
| 0 | New here | an account, and nothing else |
| 1 | Verified | a confirmed email address |
| 2 | Introduced | tier 1, plus a city, three interests and a real bio |
| 3 | Vouched for | tier 2, plus two people who have talked with you in a circle |

A vouch only exists between two people in the same circle, and only once the
other person has actually said something. That is what keeps it from being a
follow button. Starting a circle needs tier 2.

**The meetup button is locked until the circle has talked.** Not a nudge, not a
suggestion — the server returns 409. Four conditions, shown as a checklist that
fills in as the conversation happens:

- three people in the circle,
- twenty messages,
- from three different people,
- across two separate days.

**And it is unlocked again by a ceiling.** Ramirez & Zhang (2007) found that
partners who moved from online to face-to-face *early* had better relational
outcomes, while those who left it late did **worse than partners who never met
at all** — Walther's hyperpersonal model gives the mechanism, since text-only
invites both sides to idealise and the meeting has to survive it. So the clock
starts the moment a circle *could* have met. At a fortnight it is nudged; at a
month the app says plainly that the circle is avoiding it, and refuses to post
another icebreaker. A date in the diary stops the clock. Chat first, then meet
soon — not chat indefinitely.

**Hours, not messages.** Hall (2018) puts a casual friend at roughly 50 hours
together, a friend at 90 and a close friend at 200+, and found that leisure
hours count while hours spent working alongside someone do not. A circle with
four hundred messages and no hours should be able to see that about itself, so
the ledger counts only time people confirm they actually spent together — an
RSVP banks nothing.

**Repeating by default.** Adams's conditions for close friendship are
proximity, *repeated* unplanned interaction, and somewhere safe enough to
confide. One evening with five strangers fails the middle one, which is the
real defect in dinner-with-strangers apps: you never see those people again, so
no hours ever accumulate. A meetup can repeat weekly, fortnightly or every four
weeks; when one passes it is filed in the ledger and the series rolls on to its
next date with the RSVPs cleared. One-offs are offered last.

**A meetup is a proposal until a quorum says yes.** Someone suggests a thing, a
place and a time; it becomes real when `max(2, ceil(members / 3))` people say
yes, and not before. It never happens because one person pushed. A proposal can
be anchored to one of the finder's hand-checked listings for that city, so "let's
do something" names a real place with a real first step. Every meetup card
carries the same five-line first-meetup checklist: public place, tell someone,
your own way home, leaving early is fine, report anyone who pushes past a no.

**The questions get harder as the circle earns them.** Aron et al. (1997) got
strangers to report more closeness after forty-five minutes than small talk ever
produces, by walking them up three sets of increasingly personal questions — the
escalation is the mechanism, not the questions. So the shared list comes in
three sets: *Easy* (facts and recommendations), *Personal* (what you like, avoid
and are actually like) and *Real* (the things people only say once they trust the
room). A circle opens the next set by answering the one it is on — two
questions, each answered by two or more people. Reis & Shaver's intimacy model
is why that condition exists: disclosure only brings people closer when somebody
responds to it, so a question nobody answers buys nothing and no circle can
reach the deep end by waiting.

**And if somebody answers and nobody replies, the rest of the circle hears
about it.** That is the exact failure the same model predicts: the disclosure
happened, the response did not, and the person who went first is worse off than
if they had said nothing. Everyone sees that notice except the one person it is
about — being told nobody replied to you is the one genuinely unkind thing this
app could do.

**A group chat builds attachment to the group. Friendships need the people.**
Ren, Kraut & Kiesler (2007) separate attachment to a group and its subject from
attachment to its particular members, and a single group thread can only build
the first — while the second is the kind that survives the group going quiet. Two
things make it possible: the member list says what any two of you actually both
picked, and you can open a one-to-one thread with someone in your circle. That
door is narrow on purpose — you have both already spoken there, so it is never a
cold DM — and the conversation lands in Messages under the same blocking,
reporting and daily caps as every other one.

**Saying yes costs a sentence.** Gollwitzer & Sheeran (2006), across 94 studies,
found that naming when, where and how you will act is most of the difference
between intending to do something and doing it. A yes to a meetup is exactly a
bare intention, and the quorum means other people are relying on it, so a yes
asks how you will get there: where you are setting off from, when, and how. Only
you ever see it, it is shown back to you on the card as the reminder, and when a
repeating meetup rolls on it goes with the RSVP — each date needs its own plan.

**Dead group chats are the default**, so the circle can post a question from the
set it has earned — one per twelve hours — and a circle nobody has spoken in for
six days says so on its card.

---

## Two builds, one codebase

The app runs in either of two modes, decided at load time by whether an API is
reachable:

| | Static (GitHub Pages) | With the server |
|---|---|---|
| Accounts | none | required |
| Finder, plan, learned preferences | yes | yes |
| People and messaging | no | yes |
| Data leaves your device | never | your profile and messages only |

The published site at <https://amalmehta.github.io/community_finder/> is the
static one: no account, no server, nothing transmitted. Running `npm start`
gives you the account build on localhost. Nothing needs rebuilding to switch —
the front end calls `GET /api/me`, and falls back to solo mode if that fails.

## Run it

No build step, no dependencies, no server required.

```bash
open index.html
```

That is genuinely it — double-clicking `index.html` works, because the data
files are plain `<script>` tags rather than `fetch`ed JSON.

If you prefer to serve it over HTTP (recommended, and required if you later add
anything that needs an origin):

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

### As a Mac app

There is a native macOS wrapper in `mac/`. It builds a real double-clickable
`.app` with its own icon and Dock entry, with the whole site bundled inside, so
it works with no internet connection and no dev server.

```bash
./mac/build.sh
open "mac/dist/community_finder.app"
```

Needs only the Xcode command line tools (`swiftc`, `iconutil`) — no npm, no
Rust, no Electron. The result is about 1 MB.

Drag it to `/Applications` to keep it. It's ad-hoc signed for local use, so if
you ever move it to another Mac, Gatekeeper will ask you to confirm the first
launch (right-click → Open).

**It uses the account server when one is running.** On launch the app probes
`http://127.0.0.1:4000/api/me` (2-second timeout). If that answers it loads the
backend, so the Mac app gets profiles, People and Messages. If it does not, the
app falls back to the copy bundled inside it and runs as the finder alone —
still fully offline, just without accounts. The title bar says which mode you
are in: the server's host, or "offline copy".

**View → Server…** (⌘,) points it somewhere else, including a deployed
instance. **View → Reconnect to Server** (⇧⌘R) retries after you start the
server. Sign-in persists between launches; the Mac app keeps its own cookie
store, separate from your browser.

**How it works.** `mac/Sources/main.swift` is a Cocoa app hosting a `WKWebView`;
`mac/Sources/StaticServer.swift` is a small read-only HTTP server bound to
loopback on a random port, serving `Contents/Resources/web`. The server exists
because WKWebView gives `file://` pages an opaque origin, which disables
`localStorage` and would break your saved plan. Serving from `127.0.0.1` gives
the page a normal web origin, so the app behaves exactly like the browser build.
Links to real organisations open in your default browser rather than inside the
app window. ⌘R reloads. View → Clear Local Data erases your saved search, plan and learned preferences on this device.

### With accounts and messaging

```bash
npm start          # http://localhost:4000
```

Node 22+ only — it uses the built-in `node:sqlite`. Still no dependencies and
nothing to install. The database appears at `server/data/community.db`.

**Email verification** is optional for the finder and required before you can
contact anyone. The default mail transport writes the message to the console
and to `server/data/outbox/`, so the whole flow works with no provider, no API
key and no cost — open the link in the file to finish verifying. Swapping in a
real sender means one transport in `server/mail.js`.

**The alignment graph** on the People tab draws you, your visible interests, and
the people who share them, so you can see *why* someone is recommended. It is
bipartite on purpose: it exposes nothing that discovery does not already show.

**Messaging without a request** is unlocked by strong alignment: 3+ shared
interests, the same city, and both people verified. The recipient can switch it
off, blocking always wins, and the daily caps still apply.

**Circles** live on their own tab, and the finder's results offer them
alongside the places you would go alone — the other door into the same city.

See [server/README.md](server/README.md) for the API, the safety rules and how
to change the rate limits. In short: contact is request-then-accept, a new
account gets three introductions a day, interests can be hidden from discovery
while still shaping your own results, and reporting someone blocks them.

**Before putting this on the public internet**, you would want at minimum: TLS
(then run with `SECURE=1` so the session cookie is marked Secure), a backup of
the SQLite file, and someone actually reading the `reports` table. The safety
mechanics are built; the operational side is not something code can supply.

### Deploying

See **[DEPLOY.md](DEPLOY.md)** for the Docker image, the environment variables,
TLS, and the checklist to work through before letting anyone in.



It is a static site. Push the repo and point GitHub Pages at the root, or drop
the folder on any static host. There is no backend to run.

---

## Verify it works

Two checks, both zero-dependency:

```bash
npm test        # both suites
```

```bash
node tests/run-tests.js
```

7900+ assertions covering data integrity (every listing has a valid first step,
a real URL, interests that exist in the taxonomy, ratings in range), city lookup
and aliasing, the universal fallback engine, matcher behaviour (a nervous person
gets gentle options first, budget is respected, the comfort dial actually
re-ranks, no duplicate results), that `index.html` loads every file it needs,
and that every number the circles argument rests on is still the number the
research says — the four rungs of the gate, 14 and 28 days, 50/90/200 hours,
three escalating question sets, two answers to climb one. Change one of those
and this suite fails, which is the point of pinning them.

```bash
node tools/check-links.js
```

Fetches every URL in the dataset and reports broken ones. Expected result:
**0 broken.** It also reports an "unverifiable" bucket — around 22 URLs at
sites that refuse automated requests (403), sit behind a virtual queue, or are
intercepted by a corporate TLS proxy. Those are not dead links; they were
confirmed live by hand and their DNS resolves. Pass `--all` to also check the
national directory URLs used by the fallback engine.

### Automated checks

`.github/workflows/check-links.yml` runs the test suite and the link checker
every Monday on GitHub Actions, and opens an issue if a listing's link breaks.
It keeps a single open issue and comments on it rather than filing a new one
each week. You can also run it on demand from the Actions tab.

```bash
node tests/run-server-tests.js
```

263 assertions against a real HTTP server on a throwaway database: signup and
sign-in, session isolation, that a hidden interest cannot be used to find you,
the request/accept/message flow, outsiders being locked out of other people's
threads, blocking, reporting, rate limits, the whole life of a circle — vetting,
the gate, the drift clock, the hours ledger, meetups rolling forward, the
question sets refusing to escalate on an unanswered question, one-to-one threads
being closed to anyone who has not spoken, if-then plans being required on a yes
and shown to nobody else — and that the server serves only the front end, not
its own source, the database, or anything reachable by path traversal.

**Moving around it:** every question has **Back**, which replays your earlier
answers from scratch rather than keeping undo state — the engine is pure, so the
adaptive path recomputes exactly and a changed answer leaves no residue. Coming
back to a question prefills what you said. On a keyboard, **1–9** picks an
option, **Enter** continues and **Backspace** goes back; focus follows the
question so screen-reader and keyboard users are not left behind.

The intake has its own tests: that a run is exactly twenty questions, that
different answers produce measurably different questions, that choosing an area
asks its drill-downs and skips the others, that deliberate answers outrank
probes, that negative answers push things down, and that it terminates however
it is answered.

Manual check: open the app, type `Brooklyn`, pick a few interests, and confirm
you get New York listings with a "Start here" card. Then type `Boise, Idaho` and
confirm you get the national-routes view instead.

---

## How it works

```
index.html            the whole UI
assets/styles.css     styling, light + dark, mobile-first breakpoints
src/
  data/core.js        interest taxonomy (32 interests in 6 groups) + city registry
  data/city-*.js      the thirteen hand-curated city datasets
  data/universal.js   fallback recipes → real deep links for any city
  intake.js           the adaptive 20-question engine (pure functions, no DOM)
  preferences.js      on-device preference tracker (pure functions, injectable storage)
  social.js           accounts, people and messaging UI (inert without a backend)
  match.js            the scoring engine (pure functions, no DOM)
  app.js              DOM rendering, plan, feedback
tests/run-tests.js    the test suite
tools/check-links.js  the link checker
tools/moderate.js     moderation console: reports, suspensions
tools/backup.js       consistent SQLite snapshots
tools/server-daemon.js  start/stop the server detached
server/
  db.js               SQLite schema and queries
  app.js              HTTP server, auth, API, rate limits
  README.md           API and safety notes
mac/
  Sources/main.swift        Cocoa + WKWebView shell, menus, link handling
  Sources/StaticServer.swift  loopback static server (so localStorage works)
  makeicon.swift            generates the app icon
  build.sh                  builds mac/dist/community_finder.app
```

### The matcher

`FYC.match(profile)` scores every listing on six weighted dimensions:

| dimension | weight | what it does |
|---|---|---|
| interest | 0.44 | overlap with the interests you picked, decayed by pick order |
| gentleness | 0.20 | how low-pressure and solo-friendly it is, *interpreted through your comfort setting* |
| commitment | 0.10 | one-off vs weekly vs season-long |
| schedule | 0.10 | when it runs vs when you are free |
| cost | 0.08 | against your budget |
| goals | 0.08 | friends / impact / skill / routine |

Budget is treated as a real constraint (filtered, then relaxed if that would
leave you with almost nothing). Results are then passed through a diversity
re-rank so the top of the list isn't five variations of the same activity.

The comfort setting is not cosmetic: "honestly, daunting" and "ready to dive in"
produce measurably different rankings, and the test suite asserts it.

### The data

Each listing carries a first step (`drop-in` / `sign up` / `book a shift` /
`RSVP` / `email`), a `when`, and two to four factual "what to expect" bullets —
logistics, cost, what's provided, what's expected of you. Ratings for `solo`
(can you turn up alone) and `gentleness` (low-key or full-on) drive the badge
and the matching.

Listings deliberately carry **no** pre-written messages. An earlier version
shipped a copy-and-paste introduction for each one; it was cut, along with the
reassurance copy, on the grounds that the audience is perfectly capable of
writing their own sentence.

### Theme

The header toggle cycles **Auto → Light → Dark**. Auto follows the operating
system; the other two override it and persist. The saved choice is applied by an
inline script before the stylesheet renders, so there is no flash of the wrong
theme on load.

### Sharing

Every listing has a **Share** button. It sends the name, where it is, the
concrete first step and the link — enough for someone to act on without opening
the app. On a phone it opens the native share sheet; everywhere else it copies
to the clipboard, with a `document.execCommand` fallback for browsers that block
the async clipboard API.

Sharing is also recorded as a preference signal, weighted like opening the page
but below saving it: sending something to a friend says you meant it.

### Learned preferences

The app watches what you actually do — which first steps you expand, which
links you open, what you copy, save and tick off — and builds a weighted
profile from it. Recent actions count for more than old ones (they halve in
influence every 45 days), and removing something from your plan counts against
it.

That profile nudges the ranking but never drives it: it is capped at 18% of the
score, scaled by how much evidence there is, and it can never override your
stated city, interests or budget, nor resurrect a listing that matches nothing
you asked for. The test suite asserts all of that.

The **You** tab shows exactly what has been inferred — an affinity chart, your
gentleness, cost and solo leanings, and how heavily the matcher is leaning on
them — with buttons to pause tracking or erase it.

`src/preferences.js` is the engine; its storage is injectable so it can be
tested in Node without a browser.

### Privacy

Everything stays in the browser. `localStorage` holds your last search, your
plan, your feedback and the record of what you have clicked. There is no
account, no server, no analytics and no network request other than the links
you choose to click. Nothing is ever transmitted, and the You tab can erase the
behavioural record completely.

---

## Known limits

- Curated coverage is thirteen metros. Everywhere else gets the fallback engine,
  which is genuinely useful but not the same as a hand-picked list.
- Listings are a point-in-time snapshot. Groups fold, move and change schedules.
  Re-run `node tools/check-links.js` periodically; the app tells users to check
  the organisation's own page before going.
- Contact details are organisation contact *pages*, never scraped personal
  email addresses.
- A circle has to reach three people before it can plan anything, which means a
  brand-new city starts cold. That is the honest cost of refusing to seat
  strangers at a table on day one.
- The drift thresholds (14 and 28 days) are a judgement call. Ramirez & Zhang
  established the *direction* — late switches go worse — in a lab, not the
  crossover point in weeks.
- Hours are self-reported. Someone can claim a meetup they skipped, and the
  only check is that two people have to confirm before it counts as the
  circle's hours rather than one person's.
- "Two people replied" is a crude stand-in for "the room responded". Reis and
  Shaver's point is about perceived understanding, which no amount of counting
  messages can detect; a circle could answer two questions dismissively and
  still climb a rung.
- The if-then plan is not checked against anything. Nobody verifies that the
  bus exists or that you got on it — the research is about writing the plan,
  and that is all this does.
- One-to-one threads cut both ways. They are the mechanism that turns a group
  into friendships, and they are also how a group quietly becomes two people
  and some bystanders. The gate (both of you having spoken in the circle) is
  about safety, not about that.
- Vetting is the host's judgement plus two seconds. It is a real filter and not
  a background check, and nothing here verifies that anyone is who they say.
- Circle messages are plain text in the database, readable by whoever runs the
  server. Not end-to-end encrypted, and the privacy page says so.
