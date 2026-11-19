# What is where

Every file in the repository that matters, one line each. Line counts are
there to say which files are substantial, not as a target.

The shape to hold in your head: **the browser half runs on its own** (`src/`,
`index.html`, `assets/`, `sw.js`), **the server half is optional** (`server/`),
and **nothing is built** — what is in the repository is what runs.

---

## The app, in the browser

| Path | Lines | What it is |
|---|---:|---|
| `index.html` | 209 | The whole frame: the app bar, five tab panels, the feedback tab, and 23 `<script>` tags. The only HTML the app has. |
| `assets/styles.css` | 1401 | Every style. One typeface, one accent, light and dark palettes, mobile-first breakpoints. The dark values are declared once as `--d-*` and assigned twice. |
| `assets/icon.svg` | — | The mark. The source for every other icon. |
| `assets/apple-touch-icon.png` | — | A 180px raster of it, because iOS ignores an SVG there. |
| `assets/social.svg` | — | The 1200×630 share card. |
| `assets/social.png` | — | The raster `og:image` actually points at, because no major platform renders an SVG share card. |

Both rasters are generated from the SVG beside them, so the SVG is the thing to
edit. To make them again:

```bash
rsvg-convert -w 180 -h 180 assets/icon.svg -o assets/apple-touch-icon.png
```

```bash
rsvg-convert -w 1200 -h 630 assets/social.svg -o assets/social.png
```
| `site.webmanifest` | — | Installability: name, icons, theme colours, and the Saved / You shortcuts. |
| `sw.js` | 278 | The service worker. Network-first with a 2.5s stopwatch; a page served from the cache gets its scripts from the cache too. The cache name carries a version, the shell list and a digest of the shell's contents. |
| `privacy.html` | — | What is stored, where, who can see it, and how to take it with you or end it. |
| `terms.html` | — | The terms. |
| `robots.txt` | — | The finder is indexable; anything to do with accounts is not. |
| `sitemap.xml` | — | The three public pages. |

### `src/` — the code

| Path | Lines | What it is |
|---|---:|---|
| `src/data/core.js` | 347 | The interest taxonomy (32 interests, 6 groups), the city registry, the location matcher, and the circle prompt sets. Everything else reads from here. |
| `src/data/city-*.js` | 207–694 | Thirteen hand-curated metros, 305 listings. Each registers itself with `FYC.addCity`. The tests and the link checker read the directory, so a new file is picked up automatically. |
| `src/data/universal.js` | 564 | 27 recipes that build real deep links into national directories for any uncurated city, in the same shape a curated listing has. |
| `src/intake.js` | 599 | The adaptive form: ~37 questions, a priority function, and an honest progress total. Pure, so it tests in Node. |
| `src/match.js` | 273 | Scoring on six weighted dimensions, the explanations, and the diversity re-rank. Pure. |
| `src/preferences.js` | 240 | What someone actually does, turned into a weighted profile that nudges the ranking by at most 18%. Storage is injectable. |
| `src/dom.js` | 288 | The helpers every screen needs: `el`, `svg`, `api`, the view turnstile, the visibility-aware interval, the error line, the guarded click. Written once, because three copies had drifted. |
| `src/app.js` | 1503 | The finder's screens: the form, the results list and detail pane, the saved list, the You tab, the theme, the back button, feedback. |
| `src/art.js` | 336 | Every drawing, built as inline SVG at run time: avatars, one pictogram per interest, five spot illustrations, a guide figure. No sprite sheet, nothing fetched. |
| `src/social.js` | 994 | Accounts, discovery, the overlap graph, one-to-one messaging, the profile card. Inert with no backend. |
| `src/circles.js` | 1558 | Circles: applying, vetting, the group chat, the readiness gate, the hours ledger, meetups and RSVPs. |

### Which file to open

| If you want to change… | Open |
|---|---|
| A listing, or add a city | `src/data/city-*.js` |
| What the form asks, or in what order | `src/intake.js` |
| How results are ranked | `src/match.js` |
| What a result card says | `src/app.js` (`detailPane`, `factLine`) |
| A national directory route | `src/data/universal.js` |
| Anything about how it looks | `assets/styles.css` |
| The circle gate's numbers | `server/app.js` (`READY_RULE`) — the client only draws it |
| An API route, auth, or a rate limit | `server/app.js` |
| A table or a query | `server/db.js` |

## `server/` — accounts, circles, messages

| Path | Lines | What it is |
|---|---:|---|
| `server/app.js` | 1827 | One HTTP server: routes, sessions, rate limits, security headers, static files. No framework, no dependencies. |
| `server/db.js` | 1295 | The schema and every query, on `node:sqlite`. Prepared statements, `tx()` for atomic writes, the export and the account deletion. |
| `server/mail.js` | 60 | Verification mail. The default transport writes to `server/data/outbox/`. |
| `server/README.md` | — | The API, the safety rules, and how to change the limits. |
| `server/data/` | — | **Not in git.** The database, its backups, the outbox, the pid file and the log. |

## `tests/` — both suites

| Path | Lines | What it is |
|---|---:|---|
| `tests/run-tests.js` | 3024 | ~9,500 assertions: data integrity for curated listings *and* fallback recipes, city lookup, the matcher, the intake, the preference tracker, the service worker run for real in a VM, and a contrast check of every text token against every surface in both palettes. |
| `tests/run-server-tests.js` | 1926 | ~460 assertions against a real HTTP server on a throwaway database, including a group pinning defects that were reproduced before they were fixed. |

## `tools/` — the things an operator runs

| Path | Lines | What it is |
|---|---:|---|
| `tools/check-links.js` | 93 | Fetches every URL in the dataset and reports what no longer resolves. `--all` adds the national directories. |
| `tools/backup.js` | 74 | A consistent SQLite snapshot with `VACUUM INTO`, verified before older ones are pruned. Keeps 14. |
| `tools/moderate.js` | 156 | The moderation console: reports, users, suspensions, circles. |
| `tools/server-daemon.js` | 127 | Start, stop, status and log for a detached server. Checks the pid is actually this server before signalling it. |
| `tools/stamp.js` | 80 | Stamps the shell digest into `sw.js`. `--check` is what the test suite runs. |

## `mac/` — the native wrapper

| Path | What it is |
|---|---|
| `mac/build.sh` | Builds `mac/dist/community_finder.app`. Needs only the Xcode command line tools. |
| `mac/Sources/main.swift` | A Cocoa app hosting a `WKWebView`, with the menus, the server picker and link handling. |
| `mac/Sources/StaticServer.swift` | A read-only HTTP server on loopback, so the page gets a real web origin and `localStorage` works. |
| `mac/makeicon.swift` | Draws the app icon at every size `iconutil` wants. |
| `mac/build/`, `mac/dist/` | **Not in git.** Build output. |

## Documentation and configuration

| Path | What it is |
|---|---|
| `README.md` | What this is, what it looks like, and where everything else is. |
| `docs/SYSTEM-DESIGN.md` | Architecture, components, flows, where data lives, decisions, the threat model, scale and limits. |
| `docs/INSTRUCTIONS.md` | Setting it up, running it, using it, and running one for other people. |
| `docs/FILE-STRUCTURE.md` | This file. |
| `docs/PROMPTS.md` | What was asked for in each session, word for word, and what it led to. |
| `docs/images/` | The screenshots the README uses. Not shipped with the app. |
| `DEPLOY.md` | The Docker image, environment variables, TLS, and the checklist before letting anyone in. |
| `package.json` | Thirteen scripts and `engines: node >= 22`. No dependencies, so no lock file. |
| `Dockerfile`, `.dockerignore` | The image: non-root, data on a volume, health check on `/api/health`. |
| `.github/workflows/check-links.yml` | Both suites on every push; the link checker weekly, opening one issue when the world moves on. |
| `CLAUDE.md`, `Shortcuts.md` | Project conventions. |
| `.gitignore` | `server/data/`, `mac/build/`, `mac/dist/`, `.claude/`, and the project brief. |

## What is deliberately absent

- **No lock file, no `node_modules/`.** There are no dependencies.
- **No build output in `src/`.** What is in the repository is what runs.
- **No `server/data/` in git.** The database, backups and outbox are an
  install's own.
- **No test framework.** Both suites are plain Node with an `ok()` and an
  `eq()`.
