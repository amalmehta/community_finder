/* community_finder — HTTP server.
 * Serves the static app and the social API. No dependencies.
 */
'use strict';
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { open, createStore } = require('./db.js');
const { createMailer } = require('./mail.js');

const ROOT = path.join(__dirname, '..');

// The interest taxonomy is shared with the front end, so signup can't invent ids.
require(path.join(ROOT, 'src/data/core.js'));
const INTERESTS = globalThis.FYC.INTERESTS;

const SESSION_TTL = 30 * 24 * 3600 * 1000;   // 30 days
const VERIFY_TTL = 24 * 3600 * 1000;         // 24 hours
const DAY = 86400000, HOUR = 3600000;

// "Enough things align" to skip the request step. Deliberately strict: the
// recipient can still turn it off, block, and report, and rate limits apply.
const DIRECT_RULE = {
  minShared: 3,
  sameCity: true,
  bothVerified: true
};

/** Can `from` message `to` without waiting to be accepted? */
function directAllowed(from, to, shared) {
  if (!to.open_to_direct) return { ok: false, why: 'They only accept introductions.' };
  if (DIRECT_RULE.bothVerified && (!from.email_verified || !to.email_verified)) {
    return { ok: false, why: 'Both people need a verified email.' };
  }
  if (DIRECT_RULE.sameCity &&
      String(from.city || '').trim().toLowerCase() !== String(to.city || '').trim().toLowerCase()) {
    return { ok: false, why: 'Direct messages are for people in the same city.' };
  }
  if (shared < DIRECT_RULE.minShared) {
    return { ok: false, why: `${DIRECT_RULE.minShared} shared interests needed; you have ${shared}.` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------- helpers
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};

function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, Object.assign({
    'Content-Type': typeof body === 'object' && !Buffer.isBuffer(body)
      ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin'
  }, headers));
  res.end(data);
}
const fail = (res, status, error) => send(res, status, { error });

function readJson(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => {
      buf += c;
      if (buf.length > limit) { reject(new Error('body too large')); req.destroy(); }
    });
    req.on('end', () => {
      if (!buf) return resolve({});
      try { resolve(JSON.parse(buf)); } catch (e) { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

// ---------------------------------------------------------------- passwords
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return { hash, salt };
}
function verifyPassword(password, salt, expected) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex'), b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------------------------------------------------------------- validation
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function cleanInterests(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.map((raw) => {
    const id = typeof raw === 'string' ? raw : raw && raw.id;
    if (!id || !INTERESTS[id] || seen.has(id)) return null;
    seen.add(id);
    return { id, visible: !(raw && raw.visible === false) };
  }).filter(Boolean).slice(0, 12);
}

const publicUser = (u, store) => ({
  id: u.id, username: u.username, display: u.display, city: u.city, bio: u.bio,
  discoverable: !!u.discoverable, createdAt: u.created_at,
  email: u.email || '', emailVerified: !!u.email_verified,
  openToDirect: !!u.open_to_direct,
  interests: store.interestsOf(u.id).map((r) => ({ id: r.interest, visible: !!r.visible }))
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------------------------------------------------------------- server
// Defaults are deliberately tight. Tests and self-hosting can adjust them.
const DEFAULT_LIMITS = {
  signupsPerIpPerHour: 5,
  loginsPerIpPer15Min: 10,
  requestsPerDayNewAccount: 3,
  requestsPerDay: 10,
  requestsPerHour: 3,
  messagesPerHour: 60,
  reportsPerDay: 10,
  verificationsPerHour: 5
};

function createApp({ file = path.join(__dirname, 'data', 'community.db'), secure = false,
                    limits = {}, mailer = null, baseUrl = null } = {}) {
  const L = Object.assign({}, DEFAULT_LIMITS, limits);
  const store = createStore(open(file));
  const mail = mailer || createMailer();
  setInterval(() => store.prune(), HOUR).unref?.();

  function setSession(res, token) {
    const bits = [`sid=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${SESSION_TTL / 1000}`];
    if (secure) bits.push('Secure');
    res.setHeader('Set-Cookie', bits.join('; '));
  }

  function currentUser(req) {
    const u = store.sessionUser(cookies(req).sid);
    if (u) store.touch(u.id);
    return u;
  }

  function clientIp(req) {
    return (req.socket.remoteAddress || 'unknown').replace(/^::ffff:/, '');
  }

  /** Mutations must come from our own origin: the session cookie is SameSite,
   *  but this closes the gap for clients that ignore that. */
  function sameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true;                       // same-origin fetches often omit it
    try {
      return new URL(origin).host === req.headers.host;
    } catch (e) { return false; }
  }

  const routes = [];
  const route = (method, pattern, handler) => routes.push({ method, pattern, handler });

  // ---- auth ----
  route('POST', /^\/api\/signup$/, async (req, res) => {
    const ip = clientIp(req);
    if (store.countSince('ip:' + ip, 'signup', HOUR) >= L.signupsPerIpPerHour) {
      return fail(res, 429, 'Too many accounts created from here. Try again in an hour.');
    }
    const body = await readJson(req);
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const display = String(body.display || body.username || '').trim().slice(0, 30);

    if (!USERNAME_RE.test(username)) {
      return fail(res, 400, 'Username must be 3–20 characters: lowercase letters, numbers or underscores.');
    }
    if (password.length < 8) return fail(res, 400, 'Password must be at least 8 characters.');
    if (!body.ageOk) return fail(res, 400, 'You must confirm you are 18 or over.');
    if (store.userByName(username)) return fail(res, 409, 'That username is taken.');

    const { hash, salt } = hashPassword(password);
    const id = store.createUser({
      username, display: display || username, pass: hash, salt,
      city: String(body.city || '').slice(0, 60), ageOk: true
    });
    store.setInterests(id, cleanInterests(body.interests));
    store.note('ip:' + ip, 'signup');

    const token = crypto.randomBytes(32).toString('hex');
    store.createSession(token, id, SESSION_TTL);
    setSession(res, token);
    send(res, 201, { user: publicUser(store.userById(id), store) });
  });

  route('POST', /^\/api\/login$/, async (req, res) => {
    const ip = clientIp(req);
    if (store.countSince('ip:' + ip, 'login', 15 * 60000) >= L.loginsPerIpPer15Min) {
      return fail(res, 429, 'Too many attempts. Wait a few minutes.');
    }
    store.note('ip:' + ip, 'login');
    const body = await readJson(req);
    const user = store.userByName(String(body.username || '').trim());
    const ok = user && verifyPassword(String(body.password || ''), user.salt, user.pass);
    if (!ok) return fail(res, 401, 'That username and password do not match.');

    const token = crypto.randomBytes(32).toString('hex');
    store.createSession(token, user.id, SESSION_TTL);
    setSession(res, token);
    send(res, 200, { user: publicUser(user, store) });
  });

  route('POST', /^\/api\/logout$/, async (req, res) => {
    store.destroySession(cookies(req).sid);
    res.setHeader('Set-Cookie', 'sid=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    send(res, 200, { ok: true });
  });

  route('GET', /^\/api\/me$/, async (req, res) => {
    const u = currentUser(req);
    send(res, 200, { user: u ? publicUser(u, store) : null });
  });

  route('PATCH', /^\/api\/me$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const body = await readJson(req);
    store.updateProfile(u.id, {
      city: String(body.city || '').slice(0, 60),
      bio: String(body.bio || ''),
      discoverable: body.discoverable !== false
    });
    if (body.openToDirect !== undefined) store.setOpenToDirect(u.id, body.openToDirect !== false);
    if (body.interests) store.setInterests(u.id, cleanInterests(body.interests));
    send(res, 200, { user: publicUser(store.userById(u.id), store) });
  });

  // ---- email verification ----
  function origin(req) {
    return baseUrl || `http://${req.headers.host || '127.0.0.1:4000'}`;
  }

  route('POST', /^\/api\/email$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    if (store.countSince('u:' + u.id, 'verify', HOUR) >= L.verificationsPerHour) {
      return fail(res, 429, 'Too many verification emails. Wait an hour.');
    }
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 190) return fail(res, 400, 'That does not look like an email address.');
    if (store.emailInUse(email, u.id)) return fail(res, 409, 'That address is already in use.');

    store.setEmail(u.id, email);
    const token = crypto.randomBytes(32).toString('hex');
    store.createVerification(token, u.id, email, VERIFY_TTL);
    store.note('u:' + u.id, 'verify');

    const link = `${origin(req)}/verify?token=${token}`;
    try {
      await mail.sendVerification({ to: email, link, display: u.display });
    } catch (e) {
      return fail(res, 502, 'Could not send the email: ' + e.message);
    }
    send(res, 202, { sent: true, transport: mail.transport });
  });

  route('GET', /^\/api\/verify$/, async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const id = store.useVerification(url.searchParams.get('token'));
    if (!id) return fail(res, 400, 'That link is invalid, already used, or expired.');
    send(res, 200, { verified: true });
  });

  // ---- the alignment graph ----
  // Bipartite on purpose: you → your visible interests → people who share them.
  // It shows why someone is recommended without exposing anything that is not
  // already visible through discovery.
  route('GET', /^\/api\/graph$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const people = store.discover(u.id, {});
    const mineVisible = store.interestsOf(u.id).filter((r) => r.visible).map((r) => r.interest);

    const used = new Set();
    const links = [];
    people.forEach((p) => {
      p.interests.forEach((i) => {
        if (mineVisible.indexOf(i) === -1) return;
        used.add(i);
        links.push({ source: 'i:' + i, target: 'p:' + p.id, value: 1 });
      });
    });

    const nodes = [{ id: 'me', kind: 'me', label: u.display }]
      .concat(Array.from(used).map((i) => ({ id: 'i:' + i, kind: 'interest', label: i })))
      .concat(people.map((p) => {
        const d = directAllowed(u, { open_to_direct: p.openToDirect, email_verified: p.verified, city: p.city }, p.shared);
        const c = store.connectionBetween(u.id, p.id);
        return {
          id: 'p:' + p.id, kind: 'person', label: p.display, userId: p.id,
          city: p.city, shared: p.shared, interests: p.interests,
          canDirect: d.ok, why: d.why || null,
          connection: c ? { id: c.id, status: c.status, mine: c.from_id === u.id } : null
        };
      }));

    Array.from(used).forEach((i) => links.push({ source: 'me', target: 'i:' + i, value: 2 }));
    send(res, 200, { nodes, links, rule: DIRECT_RULE, meVerified: !!u.email_verified });
  });

  // ---- messaging someone directly, when alignment allows it ----
  route('POST', /^\/api\/direct$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const body = await readJson(req);
    const other = store.userById(Number(body.toUserId));
    if (!other || other.id === u.id) return fail(res, 400, 'No such person.');
    if (store.isBlocked(u.id, other.id)) return fail(res, 403, 'You cannot contact this person.');

    const shared = store.discover(u.id, {}).filter((p) => p.id === other.id)[0];
    const verdict = directAllowed(u, other, shared ? shared.shared : 0);
    if (!verdict.ok) return fail(res, 403, verdict.why);

    // Same limits as introductions; alignment removes the wait, not the cap.
    if (store.countSince('u:' + u.id, 'request', DAY) >= L.requestsPerDay) {
      return fail(res, 429, `That is ${L.requestsPerDay} new conversations today.`);
    }
    const text = String(body.body || '').trim();
    if (text.length < 10) return fail(res, 400, 'Write at least a sentence.');

    let conn = store.connectionBetween(u.id, other.id);
    if (!conn) {
      const id = store.createAccepted(u.id, other.id);
      conn = { id };
      store.note('u:' + u.id, 'request');
    } else if (conn.status !== 'accepted') {
      return fail(res, 409, 'There is already a pending request with this person.');
    }
    store.addMessage(conn.id, u.id, text);
    send(res, 201, { threadId: conn.id });
  });

  // ---- discovery ----
  route('GET', /^\/api\/people$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const url = new URL(req.url, 'http://x');
    const people = store.discover(u.id, {
      city: url.searchParams.get('city') || '',
      interest: url.searchParams.get('interest') || ''
    });
    // Annotate with any existing connection so the UI knows what to offer.
    send(res, 200, {
      people: people.map((p) => {
        const c = store.connectionBetween(u.id, p.id);
        const d = directAllowed(u, { open_to_direct: p.openToDirect, email_verified: p.verified, city: p.city }, p.shared);
        return Object.assign({}, p, {
          connection: c ? { id: c.id, status: c.status, mine: c.from_id === u.id } : null,
          canDirect: d.ok, directBlockedBecause: d.why || null
        });
      }),
      meVerified: !!u.email_verified
    });
  });

  // ---- connection requests ----
  route('POST', /^\/api\/requests$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const body = await readJson(req);
    const toId = Number(body.toUserId);
    const other = store.userById(toId);
    if (!other || other.id === u.id) return fail(res, 400, 'No such person.');
    if (store.isBlocked(u.id, other.id)) return fail(res, 403, 'You cannot contact this person.');
    if (store.connectionBetween(u.id, other.id)) return fail(res, 409, 'There is already a conversation or request with this person.');
    if (!u.email_verified) return fail(res, 403, 'Verify your email before contacting people.');

    // New accounts are limited harder: this is where mass-messaging starts.
    const fresh = Date.now() - u.created_at < DAY;
    const perDay = fresh ? L.requestsPerDayNewAccount : L.requestsPerDay;
    if (store.countSince('u:' + u.id, 'request', DAY) >= perDay) {
      return fail(res, 429, fresh
        ? `New accounts can send ${L.requestsPerDayNewAccount} introductions a day. This keeps the place calm.`
        : `That is ${L.requestsPerDay} introductions today. Try again tomorrow.`);
    }
    if (store.countSince('u:' + u.id, 'request', HOUR) >= L.requestsPerHour) {
      return fail(res, 429, `${L.requestsPerHour} introductions an hour is the limit. Give people a chance to reply.`);
    }

    const intro = String(body.intro || '').trim();
    if (intro.length < 10) return fail(res, 400, 'Write at least a sentence — it makes a reply far more likely.');

    const id = store.createRequest(u.id, other.id, intro);
    store.note('u:' + u.id, 'request');
    send(res, 201, { id });
  });

  route('GET', /^\/api\/requests$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    send(res, 200, store.requestsFor(u.id));
  });

  route('POST', /^\/api\/requests\/(\d+)\/(accept|decline)$/, async (req, res, m) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const updated = store.decideRequest(Number(m[1]), u.id, m[2] === 'accept' ? 'accepted' : 'declined');
    if (!updated) return fail(res, 404, 'No pending request with that id.');
    send(res, 200, { status: updated.status, id: updated.id });
  });

  // ---- threads & messages ----
  route('GET', /^\/api\/threads$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    send(res, 200, { threads: store.threadsFor(u.id) });
  });

  route('GET', /^\/api\/threads\/(\d+)\/messages$/, async (req, res, m) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const conn = store.connectionForUser(Number(m[1]), u.id);
    if (!conn) return fail(res, 404, 'No such conversation.');
    const url = new URL(req.url, 'http://x');
    send(res, 200, { messages: store.messages(conn.id, Number(url.searchParams.get('since') || 0)) });
  });

  route('POST', /^\/api\/threads\/(\d+)\/messages$/, async (req, res, m) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const conn = store.connectionForUser(Number(m[1]), u.id);
    if (!conn) return fail(res, 404, 'No such conversation.');
    const otherId = conn.from_id === u.id ? conn.to_id : conn.from_id;
    if (store.isBlocked(u.id, otherId)) return fail(res, 403, 'This conversation is closed.');
    if (store.countSince('u:' + u.id, 'message', HOUR) >= L.messagesPerHour) {
      return fail(res, 429, 'Slow down a little.');
    }
    const body = await readJson(req);
    const text = String(body.body || '').trim();
    if (!text) return fail(res, 400, 'Empty message.');
    const id = store.addMessage(conn.id, u.id, text);
    store.note('u:' + u.id, 'message');
    send(res, 201, { id });
  });

  // ---- safety ----
  route('POST', /^\/api\/blocks$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const body = await readJson(req);
    const other = store.userById(Number(body.userId));
    if (!other || other.id === u.id) return fail(res, 400, 'No such person.');
    store.block(u.id, other.id);
    send(res, 200, { ok: true });
  });

  route('DELETE', /^\/api\/blocks\/(\d+)$/, async (req, res, m) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    store.unblock(u.id, Number(m[1]));
    send(res, 200, { ok: true });
  });

  route('GET', /^\/api\/blocks$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    send(res, 200, { blocked: store.blockedBy(u.id) });
  });

  route('POST', /^\/api\/reports$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    if (store.countSince('u:' + u.id, 'report', DAY) >= L.reportsPerDay) return fail(res, 429, 'Too many reports today.');
    const body = await readJson(req);
    const other = store.userById(Number(body.userId));
    if (!other) return fail(res, 400, 'No such person.');
    store.report(u.id, other.id, String(body.reason || 'unspecified'), String(body.detail || ''));
    store.note('u:' + u.id, 'report');
    // Reporting also blocks: nobody should have to report and then keep hearing from them.
    store.block(u.id, other.id);
    send(res, 201, { ok: true, blocked: true });
  });

  // ---- static files ----
  // Only what the browser actually needs. An allowlist rather than a denylist,
  // so adding a file to the repo can never accidentally publish it.
  const SERVE_EXACT = new Set(['index.html']);
  const SERVE_DIRS = ['assets/', 'src/'];

  function serveStatic(req, res, pathname) {
    let rel;
    try {
      rel = decodeURIComponent(pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
    } catch (e) {
      return fail(res, 404, 'Not found');
    }
    // Normalise first, then check: '..' must not survive into the final path.
    rel = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
    const allowed = SERVE_EXACT.has(rel) || SERVE_DIRS.some((d) => rel.startsWith(d));
    if (!allowed || rel.includes('..')) return fail(res, 404, 'Not found');

    const target = path.join(ROOT, rel);
    if (!target.startsWith(ROOT + path.sep)) return fail(res, 404, 'Not found');

    fs.readFile(target, (err, data) => {
      if (err) return fail(res, 404, 'Not found');
      send(res, 200, data, { 'Content-Type': MIME[path.extname(target)] || 'application/octet-stream' });
    });
  }

  const server = http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://x').pathname;
      if (pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && !sameOrigin(req)) return fail(res, 403, 'Cross-origin requests are not allowed.');
        for (const r of routes) {
          const m = pathname.match(r.pattern);
          if (m && r.method === req.method) return await r.handler(req, res, m);
        }
        return fail(res, 404, 'No such endpoint.');
      }
      if (req.method !== 'GET') return fail(res, 405, 'Method not allowed');
      // The verification link is a page; the front end reads the token from it.
      if (pathname === '/verify') return serveStatic(req, res, '/index.html');
      serveStatic(req, res, pathname);
    } catch (err) {
      fail(res, 400, err.message || 'Bad request');
    }
  });

  return { server, store };
}

module.exports = { createApp, hashPassword, verifyPassword, DEFAULT_LIMITS };

if (require.main === module) {
  const port = Number(process.env.PORT || 4000);
  const { server } = createApp({ secure: process.env.SECURE === '1' });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\nPort ${port} is already in use — community_finder is probably already running.\n` +
        `  Open it:        http://localhost:${port}\n` +
        `  Use another:    PORT=4001 npm start\n` +
        `  Stop the other: lsof -ti :${port} | xargs kill\n`
      );
    } else if (err.code === 'EACCES') {
      console.error(`\nNot allowed to listen on port ${port}. Try PORT=4000 npm start.\n`);
    } else {
      console.error('\nCould not start: ' + err.message + '\n');
    }
    process.exit(1);
  });

  server.listen(port, () => {
    console.log('community_finder running at http://localhost:' + port);
  });
}
