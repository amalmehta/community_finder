# find your community

A small web app for the problem of *"I live here and I don't know anyone."*

Tell it where you live and what you're drawn to. It returns real local groups —
and for each one, the thing that actually stops people: **what to do first, what
will happen when you get there, and what to say.**

It is deliberately anti-intimidation. Every listing carries a concrete first
step, a "what to expect" list written for someone who is nervous, and where
relevant a copy-and-paste message you can send without composing it yourself.

- **Five cities are hand-curated** — San Francisco Bay Area, New York City,
  Chicago, Seattle and Austin (72 organisations, every link checked).
- **Every other city works too.** A fallback engine builds live, working links
  into national directories (Meetup, VolunteerMatch, parkrun, Feeding America,
  CenterLink, Repair Café, Audubon, RRCA and more), pointed at the city you
  typed and the interests you picked.

---

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

### Deploying

It is a static site. Push the repo and point GitHub Pages at the root, or drop
the folder on any static host. There is no backend to run.

---

## Verify it works

Two checks, both zero-dependency:

```bash
node tests/run-tests.js
```

1670+ assertions covering data integrity (every listing has a valid first step,
a real URL, interests that exist in the taxonomy, ratings in range), city lookup
and aliasing, the universal fallback engine, matcher behaviour (a nervous person
gets gentle options first, budget is respected, the comfort dial actually
re-ranks, no duplicate results), and that `index.html` loads every file it needs.

```bash
node tools/check-links.js
```

Fetches every URL in the dataset and reports broken ones. Expected result:
**0 broken.** It also reports an "unverifiable" bucket — around 22 URLs at
sites that refuse automated requests (403), sit behind a virtual queue, or are
intercepted by a corporate TLS proxy. Those are not dead links; they were
confirmed live by hand and their DNS resolves. Pass `--all` to also check the
national directory URLs used by the fallback engine.

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
  data/city-*.js      the five hand-curated city datasets
  data/universal.js   fallback recipes → real deep links for any city
  match.js            the scoring engine (pure functions, no DOM)
  app.js              DOM rendering, plan, feedback
tests/run-tests.js    the test suite
tools/check-links.js  the link checker
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
`RSVP` / `email`), a `when`, three to four "what to expect" bullets, and often a
message template with `{interest}` and `{city}` placeholders filled in at render
time. Ratings for `solo` (how easy to show up alone) and `gentleness` (how
low-pressure) drive the ease badge and the comfort matching.

### Privacy

Everything stays in the browser. `localStorage` holds your last search, your
plan and any feedback you leave. There is no account, no server, no analytics
and no network request other than the links you choose to click.

---

## Known limits

- Curated coverage is five metros. Everywhere else gets the fallback engine,
  which is genuinely useful but not the same as a hand-picked list.
- Listings are a point-in-time snapshot. Groups fold, move and change schedules.
  Re-run `node tools/check-links.js` periodically; the app tells users to check
  the organisation's own page before going.
- Contact details are organisation contact *pages*, never scraped personal
  email addresses.
