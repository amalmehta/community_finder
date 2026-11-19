# Setting it up, running it, using it

Every command here was run on a clean checkout while this was being written.
Node 22 or later is the only requirement, and only for the server and the
tests — the finder itself needs nothing at all.

- [The fastest thing that works](#the-fastest-thing-that-works)
- [Running it properly](#running-it-properly)
- [With accounts, circles and messages](#with-accounts-circles-and-messages)
- [As a Mac app](#as-a-mac-app)
- [Using it](#using-it)
- [Checking it works](#checking-it-works)
- [Running one for other people](#running-one-for-other-people)
- [Changing the data](#changing-the-data)
- [When something is wrong](#when-something-is-wrong)

---

## The fastest thing that works

```bash
open index.html
```

That is genuinely it. No install, no build, no server. The 305 listings are
plain `<script>` tags rather than fetched JSON, so the page works straight off
the disk.

Two things do not work from `file://`, and neither matters for a look around: a
service worker cannot be registered, so there is no offline copy; and there is
no server, so there are no accounts, circles or messages.

## Running it properly

Over HTTP, which is what you want for the offline copy and anything that needs
a real origin:

```bash
npm start
```

Then open <http://localhost:4000>. The same command serves the static app and
the API — there is no separate front-end server.

To use a different port:

```bash
PORT=4100 npm start
```

## With accounts, circles and messages

`npm start` is already the full build. The database appears at
`server/data/community.db` on first run; nothing to create or migrate.

**To get to the social half you need a verified email address.** With no mail
provider configured — which is the default — the verification mail is written
to a file instead of being sent:

1. Open the app, go to **Circles**, and make an account (a username, a
   password, and whether you are eighteen; nothing else).
2. Go to **You**, put any address in the Email box, and press **Send
   verification link**.
3. Open the newest file in `server/data/outbox/` and click the link in it:

   ```bash
   ls -t server/data/outbox | head -1
   ```

4. You are now **Verified** (tier 1). Add your city and a couple of sentences
   about yourself on the You tab and you are **Introduced** (tier 2), which is
   what starting a circle needs.

To send real mail, implement a transport in `server/mail.js` and set
`MAIL_TRANSPORT` to its name. Nothing else changes.

### Running it in the background

```bash
npm run start:bg     # detached; pid and log in server/data/
npm run status
npm run log          # the last 40 lines
npm run stop
```

## As a Mac app

A real double-clickable `.app` with its own icon and Dock entry, with the whole
site bundled inside, so it works with no internet and no dev server.

```bash
npm run mac
open "mac/dist/community_finder.app"
```

It needs only the Xcode command line tools (`swiftc`, `iconutil`) — no npm, no
Electron. The result is about 1.9 MB, most of which is the icon and the 305
listings.

On launch it probes `http://127.0.0.1:4000/api/me` for two seconds. If a server
answers, it loads that and you get circles and messages; if not, it falls back
to the copy inside the bundle and runs as the finder alone. The title bar says
which. **View → Server…** (⌘,) points it somewhere else, including a deployed
instance, and **View → Reconnect to Server** (⇧⌘R) retries.

It is ad-hoc signed for local use, so moving it to another Mac means
right-click → Open the first time.

## Using it

### Finding somewhere to go

Type a city and answer the questions. Each one decides what comes next, so two
people answering differently see different forms. A run is sixteen to twenty
questions depending on what you say, and the bar tells you where you are in
*your* run rather than in a fixed twenty.

- **1–9** picks an option, **Enter** continues, **Backspace** goes back.
- **Skip** is always there, on every question but the city.
- **See results now** appears once there is enough to go on. It is remembered:
  reload and you land back on the results, not in the form.
- **Back** replays your earlier answers from scratch, so a changed answer
  leaves no residue, and coming back to a question prefills what you said.

Then: one row per match in a column you can see all of, with the one you chose
open beside it. **↑ ↓** walk the list, **Enter** opens, **Escape** closes the
detail pane on a narrow screen. Every listing carries the first step, what it
costs, what the commitment is, and what actually happens when you turn up.

**Save** puts something on the Saved tab with a four-step checklist. A saved
place follows the dataset, so a link fixed by the weekly checker reaches the
list you kept.

### Circles

Four to eight people in one city who share interests and one group chat. You
talk; only once the circle has genuinely been a conversation does the app let
anyone propose doing something.

- **Applying is writing an answer**, not clicking a button. The host reads it;
  two existing members seconding you carries it without them.
- **The meetup button is locked** until three people have sent twenty messages
  across two days, from three different people, with nobody over half of it.
  The Plan tab's label counts it down.
- **A meetup is a proposal** until `max(2, ceil(members / 3))` people say yes,
  and a yes asks how you will get there. Only you ever see that plan.

### Your data

Everything the finder knows is in your browser: the **You** tab shows what it
has learned from what you click, with buttons to pause or erase it. With an
account, the same tab has **Download everything** — a JSON file of everything
the server holds about you — and **Delete my account**, which asks for your
password and cannot be undone.

## Checking it works

```bash
npm test
```

Around 9,500 assertions over the data and the pure engines, then 460 against a
real HTTP server on a throwaway database. Expect `0 failed` from both. They
take a few seconds and need no network.

```bash
npm run links
```

Fetches every URL in the dataset — 389 of them — and reports anything broken.
Expect **0 broken**. It also reports an "unverifiable" bucket, around 46 on the
last run: sites that answer 403 to anything that looks automated, sit behind a
virtual queue, or are intercepted by a corporate TLS proxy. Those are not dead
links. Pass `--all` to check the national directories too.

A single run can also throw up a transient 500 or a DNS blip. Re-run it before
changing a listing: this is a check on the world, and the world is flaky.

```bash
npm run stamp
```

Re-stamps the service worker's content digest. Run it after changing anything
the worker caches — the test suite tells you when it is stale, and names this
command.

**By hand, in a browser.** Type `Brooklyn`, pick a few interests, and confirm
you get New York listings. Then type `Boise, Idaho` and confirm you get the
national-routes view instead. Then turn the network off and reload: the app
should still open, with a line saying the links out will not work.

## Running one for other people

See **[DEPLOY.md](../DEPLOY.md)** for the Docker image, the environment
variables, TLS and the full checklist. The short version:

```bash
docker build -t community_finder .
```

```bash
docker run -d --name community_finder -p 4000:4000 -e SECURE=1 -v community_data:/app/server/data --restart unless-stopped community_finder
```

Set `SECURE=1` only behind TLS, and `TRUST_PROXY` to the number of proxies in
front of the process — leaving it at `0` behind one makes the signup and login
limits apply to the whole internet at once.

Two commands you will want on a schedule:

```bash
npm run backup
```

A consistent snapshot with `VACUUM INTO`, keeping the last 14. It prints the
restore command with every run. Daily is enough.

```bash
npm run moderate reports
```

The whole moderation surface. `npm run moderate` on its own lists what it can
do: look a user up, suspend them, resolve a report, inspect a circle. An app
where strangers message lonely people needs a person on the other end of that
command.

## Changing the data

**Adding a city**: copy an existing `src/data/city-*.js`, change the id, name,
aliases and listings, then add a `<script>` line to `index.html` and an entry
to `SHELL` in `sw.js`. The tests and the link checker find it off the directory
and will start enforcing it immediately — including that it covers all 32
interests. Then `npm run stamp && npm test && npm run links`.

**Adding a national route**: a recipe in `src/data/universal.js`. It needs the
same fields a curated listing has; the suite builds all 27 and checks them
against the same invariants.

**Changing the interest taxonomy**: `src/data/core.js`. Every city has to cover
every interest, so adding one means adding a listing for it in thirteen cities.

## When something is wrong

| What you see | What it is |
|---|---|
| `PORT=... is not a port number` | `PORT` was set to something that is not a number. |
| `Port 4000 is already in use` | Something else has it — the message names the pid. `npm run stop`, or `PORT=4100 npm start`. |
| `sw.js shell digest is X, should be Y` in the tests | A cached file changed. `npm run stamp`. |
| Circles says you need the "Introduced" tier | Verify an email address, then add a city and a bio on the You tab. |
| Verification mail never arrives | The default transport writes to `server/data/outbox/` rather than sending. Open the newest file there. |
| The app opens but every link out fails | You are offline. The app and your saved list still work; the links to real organisations do not. |
| `npm run stop` says "Not running" with a server running | The pid file names a process that is not this server. Check `npm run status`. |
