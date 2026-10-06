# Deploying

Two things can be deployed, independently.

## 1. The finder, as a static site

No server, no accounts, nothing transmitted. This is what is published today at
<https://amalmehta.github.io/community_finder/>.

Any static host works — push to `main` and GitHub Pages rebuilds, or copy
`index.html`, `privacy.html`, `terms.html`, `robots.txt`, `site.webmanifest`,
`assets/` and `src/` anywhere. There is no build step.

## 2. The full app, with accounts and messaging

```bash
docker build -t community_finder .
docker run -d --name community_finder \
  -p 4000:4000 \
  -e SECURE=1 \
  -v community_data:/app/server/data \
  --restart unless-stopped \
  community_finder
```

Or without Docker, on any host with Node 22+:

```bash
npm run start:bg        # detached, pid file and log in server/data/
npm run status
npm run stop
```

### Environment

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `4000` | Port to listen on |
| `SECURE` | unset | Set to `1` **only** behind TLS. Marks the session cookie `Secure` and sends HSTS |
| `MAIL_TRANSPORT` | `file` | `file` writes verification emails to `server/data/outbox/` and the log. Anything else needs a transport implemented in `server/mail.js` |
| `DB` | `server/data/community.db` | Used by the backup and moderation tools |

### Put it behind TLS

The server speaks plain HTTP by design; terminate TLS at a reverse proxy
(Caddy, nginx, a platform router) and set `SECURE=1`. Without TLS the session
cookie travels in the clear and the `Secure` flag must stay off, which is why it
is opt-in rather than automatic.

Caddy is two lines:

```
community.example.com {
    reverse_proxy 127.0.0.1:4000
}
```

## Before you let anyone in

- [ ] **TLS terminated** and `SECURE=1` set
- [ ] **Email actually sends.** The default transport writes to a folder. Until
      a real transport is configured nobody can verify an address, and
      verification is what unlocks messaging — the social half of the app is
      inert without it
- [ ] **Backups scheduled.** `npm run backup` takes a consistent snapshot with
      `VACUUM INTO` and keeps the last 14. A daily cron entry is enough.
      Restore instructions print with every backup
- [ ] **Someone reads the reports.** `npm run moderate reports` is the whole
      moderation surface. An app where strangers message lonely people needs a
      person on the other end of that command
- [ ] **Health check wired up.** `GET /api/health` returns 200 with `db: "ok"`,
      503 if the database stops answering. The Dockerfile already uses it
- [ ] **Log rotation.** The server writes one line per request to stdout;
      `start:bg` appends to `server/data/server.log`, which nothing truncates
- [ ] **Decide the privacy and terms pages are true for you.** They describe
      what the software does, including that messages are stored in plain text
      and readable by whoever runs the server
- [ ] **Link check is green.** `npm run links` — the dataset decays, and CI runs
      it weekly only on the GitHub repository

## What is deliberately not here

- **No password reset.** No email is stored at signup, by design. A forgotten
  password means a new account
- **No end-to-end encryption.** Messages are plain text in SQLite
- **No horizontal scaling.** One process, one SQLite file. That is appropriate
  for the size this is; it is not a cluster
- **No analytics.** None, anywhere, deliberately
