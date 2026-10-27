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

// ---------------------------------------------------------------- circles
// The whole point of this product: a circle talks first, and only once it has
// genuinely been a conversation can anyone propose doing something in person.
// These are the two gates that enforce the order.

const PROMPTS = globalThis.FYC.PROMPTS;

// Small by design, and smaller than it was. Fay, Garrod & Carletta (2000)
// recorded the same discussion task in groups of five and groups of ten: the
// fives held a dialogue, where what one person said was picked up and built
// on, while the tens collapsed into serial monologue addressed to the room.
// Dunbar, Duncan & Nettle (1995) found conversations in the wild fragmenting
// once more than about four people were in them. Eight is the ceiling and six
// the default, because the thing we are trying not to build is a feed.
const CAP_RANGE = { min: 4, max: 8, default: 6 };

// Woolley, Chabris, Pentland, Hashmi & Malone (2010) found a group's
// collective intelligence predicted by two things more than by the ability of
// its members: the social sensitivity of the people in it, and the *equality*
// of conversational turn-taking. Groups with one dominant voice did worse.
// Neither of the first two gates could tell a conversation from a broadcast —
// twenty messages from three of eight people passed, and so did twenty
// messages where one person wrote seventeen. These two can.
const READY_RULE = {
  minMembers: 3,     // three is the smallest number that is not a pair
  minMessages: 20,   // enough that it is a thread, not an exchange of hellos
  minSpeakers: 3,    // not two people talking while the rest watch
  minDays: 2,        // across more than one sitting
  minVoices: 60,     // and at least this percent of the circle, once it is big
  maxShare: 50       // nobody is more than half of it
};

/** Why a circle can or cannot plan something yet, in the words the UI shows.
 *  Most checks are floors; `max` marks the one that is a ceiling. */
function readiness(stats, rule) {
  const voices = Math.max(rule.minSpeakers,
    Math.ceil(stats.members * rule.minVoices / 100));
  const share = stats.messages
    ? Math.round((stats.loudest || 0) * 100 / stats.messages) : 0;
  const checks = [
    { id: 'members', label: 'people in the circle', have: stats.members, need: rule.minMembers },
    { id: 'messages', label: 'messages between you', have: stats.messages, need: rule.minMessages },
    { id: 'speakers', label: 'different people talking', have: stats.speakers, need: voices },
    { id: 'days', label: 'separate days of conversation', have: stats.days, need: rule.minDays },
    { id: 'balance', label: 'of it from any one person', have: share, max: rule.maxShare, unit: '%' }
  ];
  const met = (c) => (c.max === undefined ? c.have >= c.need : c.have <= c.max);
  const done = checks.filter(met).length;
  return { ready: done === checks.length, checks, done, of: checks.length };
}

// Trust tiers. Each one is earned by doing something that costs a little
// effort, which is the only thing that reliably keeps a local group local.
const TRUST_LABELS = ['New here', 'Verified', 'Introduced', 'Vouched for'];

function trustOf(u, store) {
  const verified = !!u.email_verified;
  const interests = store.interestsOf(u.id).length;
  const bio = String(u.bio || '').trim();
  const city = String(u.city || '').trim();
  const vouches = store.vouchCount(u.id);
  const complete = verified && city.length >= 2 && bio.length >= 40 && interests >= 3;

  let tier = 0;
  if (verified) tier = 1;
  if (complete) tier = 2;
  if (complete && vouches >= 2) tier = 3;

  const missing = [];
  if (!verified) missing.push('Verify your email address.');
  if (city.length < 2) missing.push('Add your city.');
  if (bio.length < 40) missing.push('Write a couple of sentences about yourself (40 characters or more).');
  if (interests < 3) missing.push('Pick at least three interests.');
  if (vouches < 2) missing.push('Be vouched for by two people you have talked to in a circle.');

  return { tier, label: TRUST_LABELS[tier], verified, complete, vouches, interests, missing };
}

/** Enough yes-votes to turn a proposal into a plan. Always at least two. */
function quorumFor(members) {
  return Math.min(members, Math.max(2, Math.ceil(members / 3)));
}

// The gate above is a floor. This is the ceiling, and it exists because of
// Ramirez & Zhang (2007): partners who switched from online to face-to-face
// *early* had better relational outcomes, while those who switched late had
// worse outcomes than partners who never met at all. Walther's hyperpersonal
// model gives the mechanism — text-only invites both sides to idealise, and a
// meeting months later has to survive that idealisation.
//
// So a circle that has been able to meet for weeks and has not is avoiding,
// and the honest thing is to say so rather than keep congratulating it on its
// conversation. The clock runs from whichever is later: becoming ready, or
// the last time the circle actually did something.
const DRIFT_RULE = { nudgeDays: 14, driftDays: 28 };

// Hall (2018): roughly 50 hours of time together to reach a casual friend, 90
// to a friend, 200+ to a close friend — and leisure hours count while hours
// spent working alongside someone do not. Messages are not hours. The ledger
// counts only time people confirm they actually spent together.
const HALL = [
  { hours: 50, label: 'casual friends' },
  { hours: 90, label: 'friends' },
  { hours: 200, label: 'close friends' }
];

// Adams's conditions for close friendship are proximity, *repeated* unplanned
// interaction, and somewhere safe enough to confide. A one-off meetup fails
// the middle one, which is the real defect in dinner-with-strangers apps: you
// never see those people again, so no hours ever accumulate.
const CADENCES = {
  '': { label: 'Just the once', days: 0 },
  weekly: { label: 'Every week', days: 7 },
  fortnightly: { label: 'Every two weeks', days: 14 },
  monthly: { label: 'Every four weeks', days: 28 }
};

// Ren, Kraut & Kiesler (2007) separate two reasons people stay with a group:
// identity-based attachment, to the group and its subject, and bond-based
// attachment, to the particular people in it. One group thread can only build
// the first — bonds need to know about individuals, and somewhere to talk to
// one of them. These are the two cheapest ways to make that possible without
// turning a circle into a dating app: show what any two people actually have
// in common, and open a one-to-one thread between people who have both
// already spoken in the circle.
const BOND = { bothSpoken: true };

// Aron et al. (1997): strangers taken up a ladder of escalating questions
// reported more closeness after forty-five minutes than small-talk controls,
// and the escalation is the mechanism rather than the questions. Reis &
// Shaver's intimacy model supplies the condition — disclosure only builds
// closeness when someone responds to it — so a circle earns the next set by
// answering the one it is on, and an unanswered question earns nothing.
const PROMPT_SETS = globalThis.FYC.PROMPT_SETS;
const DISCLOSURE = {
  answersToAdvance: 2,    // answered questions needed to open the next set
  answeredBy: 2,          // different people replying is what "answered" means
  respondAfterHours: 4    // how long someone hangs before anyone is nudged
};

// Gollwitzer & Sheeran (2006), meta-analysing 94 studies: forming an if-then
// plan that names when, where and how you will act has a medium-to-large
// effect on whether you do it — far more than intending to. A yes to a meetup
// is a goal intention, and the quorum means other people are relying on it,
// so saying yes costs one sentence about how you will actually get there.
const INTENTION = { minChars: 12 };
const PLAN_ASK = 'Say how you will get there: where you are setting off from, when, and how. ' +
  'That sentence is most of the difference between meaning to go and going.';

// Preece, Nonnecke & Andrews (2004) asked people in online communities why
// they read without ever posting. The reasons were not indifference: they had
// nothing to add yet, they did not want to intrude, and nobody had ever asked
// them anything. That is the gap between a circle of eight and a conversation
// between three, and it is also the gap the turn-taking gate above now
// refuses to let a circle meet across. So when the app posts a question it
// hands it to the people who have not spoken lately — by name, with no
// obligation, and never to the same person twice running.
const QUIET = {
  quietHours: 48,    // not a word in this long, and the question is yours
  graceHours: 24,    // somebody who joined this morning is not quiet, just new
  invite: 2          // two at most: a spotlight on everyone is a roll call
};

// Campbell (1958) called it entitativity — the degree to which a collection
// of people is perceived as a real unit rather than an aggregate. Lickel,
// Hamilton et al. (2000) sorted out which features drive that perception:
// interaction, shared goals, duration, and importance to the members.
// Postmes, Spears, Lee & Novak (2005) add that an identity induced from what
// members themselves contribute is held more strongly than one deduced from a
// label handed to them. A circle already has interaction and duration; what
// it has no way to say is what it is *for*, in the members' own words. So:
// one line each, and the lines together are the answer.
const WANTS = { maxChars: 140, minChars: 8 };

/** How deep this circle has earned the right to ask, and what is left. */
function disclosureOf(runs, rule) {
  const answered = PROMPT_SETS.map(() => 0);
  runs.forEach((r) => {
    const d = globalThis.FYC.promptDepth(r.body);
    if (d && r.answeredBy >= rule.answeredBy) answered[d - 1]++;
  });
  let depth = 1;
  while (depth < PROMPT_SETS.length && answered[depth - 1] >= rule.answersToAdvance) depth++;
  const set = PROMPT_SETS[depth - 1];
  return {
    depth, of: PROMPT_SETS.length, label: set.label, note: set.note,
    answered: answered[depth - 1],
    needed: depth < PROMPT_SETS.length ? rule.answersToAdvance : 0,
    answeredBy: rule.answeredBy
  };
}

/** Where someone is on Hall's ladder, and what the next rung is. */
function hallLadder(hours) {
  const h = Math.round(hours * 10) / 10;
  return {
    hours: h,
    rungs: HALL,
    reached: HALL.filter((r) => h >= r.hours).slice(-1)[0] || null,
    next: HALL.filter((r) => h < r.hours)[0] || null
  };
}

// ---------------------------------------------------------------- helpers
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json'
};

// The app loads no third-party scripts, styles, fonts or images, so the policy
// can be strict. 'unsafe-inline' covers only the theme script in index.html,
// which has to run before the stylesheet renders.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'"
].join('; ');

function securityHeaders(secure) {
  const h = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': CSP,
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()'
  };
  // Only meaningful over TLS, and actively harmful to send otherwise.
  if (secure) h['Strict-Transport-Security'] = 'max-age=15552000; includeSubDomains';
  return h;
}

let SECURE_MODE = false;

function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, Object.assign({
    'Content-Type': typeof body === 'object' && !Buffer.isBuffer(body)
      ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(data)
  }, securityHeaders(SECURE_MODE), headers));
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
  verificationsPerHour: 5,
  circleMessagesPerHour: 120,
  applicationsPerDay: 5,
  circlesPerWeek: 2,
  meetupsPerDay: 3
};

const VERSION = require('../package.json').version;

function createApp({ file = path.join(__dirname, 'data', 'community.db'), secure = false,
                    limits = {}, mailer = null, baseUrl = null, log = null, ready = {},
                    drift = {}, disclosure = {}, quiet = {} } = {}) {
  const L = Object.assign({}, DEFAULT_LIMITS, limits);
  // Tests run a circle's whole life in a few milliseconds, so the "separate
  // days" part of the gate has to be adjustable. Nothing else overrides it.
  const R = Object.assign({}, READY_RULE, ready);
  const D = Object.assign({}, DRIFT_RULE, drift);
  const DI = Object.assign({}, DISCLOSURE, disclosure);
  const Q = Object.assign({}, QUIET, quiet);
  SECURE_MODE = !!secure;
  const store = createStore(open(file));
  // Circles made under the old twelve-person ceiling come down to the new
  // one. Nobody is removed: a circle that already has ten people keeps room
  // for ten, and only loses the empty seats above it.
  store.lowerCaps(CAP_RANGE.max);
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
    if (body.bio) store.updateProfile(id, { city: String(body.city || '').slice(0, 60), bio: String(body.bio), discoverable: 1 });
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

  // ------------------------------------------------------------------ circles
  const norm = (x) => String(x || '').trim().toLowerCase();

  /** Close the books on any confirmed meetup whose time has come and gone:
   *  file it in the ledger, then either roll a recurring one on to its next
   *  date or mark a one-off done. Lazy — it runs when a circle is looked at. */
  function rollCircle(circleId) {
    store.dueMeetups(circleId).forEach((m) => {
      store.recordOccurrence(m);
      const days = (CADENCES[m.cadence] || CADENCES['']).days;
      if (!days) return store.rollMeetup(m.id, null);
      let next = m.starts_at;
      while (next <= Date.now()) next += days * DAY;
      store.rollMeetup(m.id, next);
    });
  }

  /** How long this circle has been able to meet without doing so. */
  function driftOf(c, isReady) {
    const lastMet = store.lastMetAt(c.id);
    const next = store.nextPlanned(c.id);
    const from = Math.max(c.ready_at || 0, lastMet || 0);
    const base = { lastMet, next, metBefore: !!lastMet, nudgeDays: D.nudgeDays, driftDays: D.driftDays };

    if (!isReady || !from) return Object.assign({ stage: 'none', days: 0 }, base);
    if (next) return Object.assign({ stage: 'planned', days: 0 }, base);
    const days = Math.floor((Date.now() - from) / DAY);
    const stage = days >= D.driftDays ? 'drifting' : days >= D.nudgeDays ? 'nudge' : 'ok';
    return Object.assign({ stage, days }, base);
  }

  /** Whether this person can open a one-to-one thread with that one, and if
   *  not, the reason in the words the UI shows. Narrow on purpose: nobody
   *  gets a private message from someone who has not spoken in the circle,
   *  in either direction, so it can never be a cold approach. */
  function sideThread(circleId, me, them) {
    const no = (why) => ({ canMessage: false, whyNot: why, threadId: null });
    if (them.id === me.id) return no(null);
    if (store.isBlocked(me.id, them.id)) return no(null);
    const conn = store.connectionBetween(me.id, them.id);
    if (conn && conn.status === 'accepted') {
      return { canMessage: true, whyNot: null, threadId: conn.id };
    }
    if (conn && conn.status === 'pending') {
      return no('There is already an introduction waiting with them.');
    }
    if (!them.open_to_direct) return no(them.display + ' only takes introductions.');
    if (BOND.bothSpoken && !store.saidIn(circleId, me.id)) {
      return no('Say something to the circle first.');
    }
    if (BOND.bothSpoken && !them.said) return no('Once they have said something here.');
    return { canMessage: true, whyNot: null, threadId: null };
  }

  /** Everything the UI needs about one circle, from this person's angle.
   *  `deep` adds what only the circle's own page shows, and costs a query per
   *  question the circle has asked — so the list of sixty does without it. */
  function viewCircle(c, u, trust, deep) {
    const stats = store.circleStats(c.id);
    const interests = c.interests !== undefined && c.interests !== null
      ? String(c.interests).split(',').filter(Boolean)
      : store.circleInterests(c.id);
    const mem = store.memberOf(c.id, u.id);
    const app = mem ? null : store.myApplication(c.id, u.id);
    const mine = store.interestsOf(u.id).filter((r) => r.visible).map((r) => r.interest);
    const overlap = interests.filter((i) => mine.indexOf(i) !== -1);
    const sameCity = !!norm(c.city) && norm(c.city) === norm(u.city);
    const full = stats.members >= c.cap;

    let apply = { ok: true, waitlist: false, why: null };
    if (c.status !== 'open') apply = { ok: false, waitlist: false, why: 'This circle is closed.' };
    else if (mem || app) apply = { ok: false, waitlist: false, why: null };
    else if (!sameCity) {
      apply = { ok: false, waitlist: false, why: norm(u.city)
        ? `This circle is in ${c.city}. Yours says ${u.city}.`
        : 'Add your city on the You tab first — circles are local.' };
    } else if (trust.tier < c.min_trust) {
      apply = { ok: false, waitlist: false, why: `Needs the "${TRUST_LABELS[c.min_trust]}" tier. ${trust.missing[0] || ''}`.trim() };
    } else if (full) {
      apply = { ok: true, waitlist: true, why: 'Full right now — you would join the waiting list.' };
    }

    // The first time a circle could have met, note when that was: the drift
    // clock runs from here.
    const rd = readiness(stats, R);
    if (rd.ready && !c.ready_at) {
      store.markReady(c.id);
      c.ready_at = Date.now();
    }

    // How deep the questions have earned the right to go, and whether anyone
    // is currently hanging. Members only: neither is any of a stranger's
    // business. The nudge is cheap enough to carry on a card in the list; the
    // ladder is not, and only the circle's own page draws it.
    const disc = mem && deep ? disclosureOf(store.promptRuns(c.id), DI) : null;
    let respond = null;
    if (mem) {
      const un = store.lastUnanswered(c.id);
      // Never shown to the person who is waiting. "Nobody replied to you" is
      // not something to tell the one it happened to.
      if (un && un.userId !== u.id && Date.now() - un.at >= DI.respondAfterHours * HOUR) {
        respond = { display: un.display, at: un.at, hours: DI.respondAfterHours };
      }
    }

    // What the circle *is*, as against what it is doing this week: how long
     // it has been going, how much of it there has been, and who has turned up
     // to all of it. Entitativity, in Campbell's word — and it is the one
     // thing a group thread cannot show you about itself.
    const story = mem && deep ? (() => {
      const reg = store.regulars(c.id);
      return {
        since: c.created_at, days: stats.days,
        occurrences: reg.total, regulars: reg.names,
        maxChars: WANTS.maxChars, minChars: WANTS.minChars
      };
    })() : null;

    return {
      id: c.id, name: c.name, city: c.city, blurb: c.blurb, question: c.question,
      hostId: c.host_id, hostName: c.host_name || (store.userById(c.host_id) || {}).display || null,
      cap: c.cap, minTrust: c.min_trust, minTrustLabel: TRUST_LABELS[c.min_trust],
      status: c.status, createdAt: c.created_at,
      interests, overlap: overlap.length, overlapIds: overlap, sameCity,
      members: stats.members, room: Math.max(0, c.cap - stats.members),
      live: {
        messages: stats.messages, week: stats.weekMessages,
        speakers: stats.weekSpeakers, lastAt: stats.lastAt
      },
      stale: !!(mem && (!stats.lastAt || Date.now() - stats.lastAt > 6 * DAY)),
      readiness: rd,
      readyAt: c.ready_at || null,
      drift: driftOf(c, rd.ready),
      met: store.metCount(c.id),
      hours: {
        mine: hallLadder(store.hoursOf(u.id, c.id)),
        circle: Math.round(store.circleHours(c.id) * 10) / 10
      },
      disclosure: disc,
      respond,
      story,
      myRole: mem ? mem.role : null,
      myApplication: app ? { id: app.id, status: app.status, at: app.created_at } : null,
      pending: c.pending === undefined ? undefined : c.pending,
      apply
    };
  }

  /** Overlap first, then whether it is alive, then whether it has room. */
  function rankCircles(list, interestOverride) {
    const want = interestOverride && interestOverride.length ? interestOverride : null;
    return list.map((v) => {
      const overlap = want ? v.interests.filter((i) => want.indexOf(i) !== -1).length : v.overlap;
      const alive = v.live.week > 0 ? 1 : 0;
      v.score = overlap * 4 + (v.sameCity ? 3 : 0) + alive * 2
        + Math.min(2, v.live.speakers) + (v.room > 0 ? 1 : 0);
      if (want) v.overlap = overlap;
      return v;
    }).sort((a, b) => b.score - a.score || b.live.week - a.live.week || b.id - a.id);
  }

  function requireMember(req, res, id) {
    const u = currentUser(req);
    if (!u) { fail(res, 401, 'Sign in first.'); return null; }
    const c = store.circleById(id);
    if (!c) { fail(res, 404, 'No such circle.'); return null; }
    const mem = store.memberOf(c.id, u.id);
    if (!mem) { fail(res, 403, 'That is a members-only conversation.'); return null; }
    return { u, c, mem };
  }

  route('GET', /^\/api\/circles$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const url = new URL(req.url, 'http://x');
    const trust = trustOf(u, store);
    const override = String(url.searchParams.get('interests') || '').split(',').filter(Boolean);

    const rows = store.listCircles(u.id, {});
    rows.forEach((c) => { if (store.memberOf(c.id, u.id)) rollCircle(c.id); });
    let views = store.listCircles(u.id, {}).map((c) => viewCircle(c, u, trust));
    const city = url.searchParams.get('city');
    if (city) views = views.filter((v) => norm(v.city) === norm(city) || v.myRole);

    const mine = views.filter((v) => v.myRole);
    const open = rankCircles(views.filter((v) => !v.myRole), override);

    send(res, 200, {
      mine, circles: open, trust, rule: R, capRange: CAP_RANGE,
      trustLabels: TRUST_LABELS, prompts: PROMPTS.length, promptSets: PROMPT_SETS,
      hall: HALL, cadences: CADENCES, planAsk: PLAN_ASK,
      me: { id: u.id, city: u.city, display: u.display }
    });
  });

  route('POST', /^\/api\/circles$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const trust = trustOf(u, store);
    if (trust.tier < 2) {
      return fail(res, 403, 'Starting a circle needs the "Introduced" tier: ' + trust.missing.slice(0, 2).join(' '));
    }
    if (store.countSince('u:' + u.id, 'circle', 7 * DAY) >= L.circlesPerWeek) {
      return fail(res, 429, `You can start ${L.circlesPerWeek} circles a week. Tend the ones you have.`);
    }
    const body = await readJson(req);
    const name = String(body.name || '').trim();
    const city = String(body.city || u.city || '').trim();
    const blurb = String(body.blurb || '').trim();
    const question = String(body.question || '').trim();
    const interests = cleanInterests(body.interests).map((i) => i.id).slice(0, 4);

    if (name.length < 3 || name.length > 60) return fail(res, 400, 'Give it a name of 3–60 characters.');
    if (!city) return fail(res, 400, 'A circle needs a city.');
    if (blurb.length < 40) return fail(res, 400, 'Say what this circle is for, in 40 characters or more.');
    if (question.length < 10) return fail(res, 400, 'Ask applicants something — that question is the whole vetting step.');
    if (!interests.length) return fail(res, 400, 'Pick at least one interest so people can find it.');

    const cap = Math.min(CAP_RANGE.max, Math.max(CAP_RANGE.min, Number(body.cap) || CAP_RANGE.default));
    const minTrust = Math.min(3, Math.max(1, Number(body.minTrust) || 1));

    const id = store.createCircle({ name, city, blurb, question, hostId: u.id, cap, minTrust, interests });
    store.note('u:' + u.id, 'circle');
    store.addCircleMessage(id, null, `${u.display} started this circle. ${PROMPTS[0]}`, 'system');
    send(res, 201, { circle: viewCircle(store.circleById(id), u, trust) });
  });

  route('GET', /^\/api\/circles\/(\d+)$/, async (req, res, m) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    let c = store.circleById(Number(m[1]));
    if (!c) return fail(res, 404, 'No such circle.');
    if (store.memberOf(c.id, u.id)) {
      rollCircle(c.id);
      c = store.circleById(c.id);
    }
    const trust = trustOf(u, store);
    const v = viewCircle(c, u, trust, true);
    const mem = !!v.myRole;

    // A non-member sees the shopfront: what it is, how busy, what it will ask
    // them. Never the conversation, and never who is in it.
    if (!mem) {
      return send(res, 200, {
        circle: v, trust, rule: R, members: null, meetups: [], occurrences: [], confirm: [],
        cadences: CADENCES, hall: HALL, promptSets: PROMPT_SETS, planAsk: PLAN_ASK,
        safety: globalThis.FYC.MEETUP_SAFETY
      });
    }

    const members = store.circleMembers(c.id).map((p) => Object.assign({
      id: p.id, display: p.display, city: p.city, bio: p.bio,
      role: p.role, joinedAt: p.joined_at, said: p.said, vouches: p.vouches,
      verified: !!p.email_verified, hours: Math.round(store.hoursOf(p.id, c.id) * 10) / 10,
      iVouched: store.hasVouched(c.id, u.id, p.id),
      canVouch: p.id !== u.id && p.said > 0 && !store.hasVouched(c.id, u.id, p.id),
      // What the two of you have in common, which the group thread never
      // says out loud. Visible interests only, on both sides.
      shared: p.id === u.id ? [] : store.sharedInterests(u.id, p.id),
      // What they said they came for, in their own words.
      wants: p.wants || ''
    }, sideThread(c.id, u, p)));
    const meetups = store.meetupsFor(c.id).map((k) => {
      const rsvps = store.rsvpsFor(k.id);
      const mineR = store.myRsvp(k.id, u.id);
      return {
        id: k.id, title: k.title, place: k.place, startsAt: k.starts_at, details: k.details,
        org: k.org_name ? { id: k.org_id, name: k.org_name, url: k.org_url } : null,
        quorum: k.quorum, yes: k.yes, maybe: k.maybe, status: k.status,
        cadence: k.cadence || '', cadenceLabel: (CADENCES[k.cadence] || CADENCES['']).label,
        hours: k.hours, recurring: !!k.cadence,
        proposer: k.proposer_name, proposerId: k.proposer_id,
        myRsvp: mineR ? mineR.answer : null,
        // Your own if-then plan, returned to nobody but you.
        myPlan: mineR ? mineR.plan || '' : '',
        going: rsvps.filter((r) => r.answer === 'yes').map((r) => r.display)
      };
    });

    send(res, 200, {
      circle: v, trust, rule: R, members, meetups,
      cadences: CADENCES, hall: HALL, promptSets: PROMPT_SETS, planAsk: PLAN_ASK,
      wants: WANTS,
      // What has already happened, and anything this person has not yet said
      // whether they turned up to. Hours are only banked on a yes here.
      occurrences: store.occurrencesFor(c.id, 10).map((o) => ({
        id: o.id, title: o.title, startsAt: o.starts_at, hours: o.hours, attended: o.attended
      })),
      confirm: store.unconfirmedFor(c.id, u.id).map((o) => ({
        id: o.id, title: o.title, startsAt: o.starts_at, hours: o.hours
      })),
      safety: globalThis.FYC.MEETUP_SAFETY,
      applications: v.myRole === 'host' || members.length > 2 ? store.applicationsFor(c.id).map((a) => ({
        id: a.id, display: a.display, city: a.city, bio: a.bio, answer: a.answer,
        status: a.status, at: a.created_at, vouches: a.vouches, verified: !!a.email_verified,
        seconds: a.seconds, iSeconded: store.hasSeconded(a.id, u.id),
        interests: String(a.interests || '').split(',').filter(Boolean)
      })) : []
    });
  });

  route('PATCH', /^\/api\/circles\/(\d+)$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    if (got.mem.role !== 'host') return fail(res, 403, 'Only the host can change this.');
    const body = await readJson(req);
    const blurb = String(body.blurb || got.c.blurb).trim();
    const question = String(body.question || got.c.question).trim();
    if (blurb.length < 40) return fail(res, 400, 'Keep the description at 40 characters or more.');
    if (question.length < 10) return fail(res, 400, 'Keep a real joining question.');
    const cap = Math.min(CAP_RANGE.max, Math.max(
      Math.max(CAP_RANGE.min, store.memberCount(got.c.id)), Number(body.cap) || got.c.cap));
    const minTrust = Math.min(3, Math.max(1, Number(body.minTrust) || got.c.min_trust));
    store.updateCircle(got.c.id, { blurb, question, cap, minTrust });
    send(res, 200, { circle: viewCircle(store.circleById(got.c.id), got.u, trustOf(got.u, store)) });
  });

  route('POST', /^\/api\/circles\/(\d+)\/close$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    if (got.mem.role !== 'host') return fail(res, 403, 'Only the host can close a circle.');
    store.closeCircle(got.c.id);
    store.addCircleMessage(got.c.id, null, 'The host closed this circle to new people.', 'system');
    send(res, 200, { ok: true });
  });

  // ---- applying: a written answer, then the circle's own say-so ----
  route('POST', /^\/api\/circles\/(\d+)\/apply$/, async (req, res, m) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const c = store.circleById(Number(m[1]));
    if (!c) return fail(res, 404, 'No such circle.');
    const trust = trustOf(u, store);
    const v = viewCircle(c, u, trust);
    if (v.myRole) return fail(res, 409, 'You are already in this circle.');
    if (v.myApplication) return fail(res, 409, 'You have already applied.');
    if (!v.apply.ok) return fail(res, 403, v.apply.why || 'You cannot apply to this circle.');
    if (store.countSince('u:' + u.id, 'apply', DAY) >= L.applicationsPerDay) {
      return fail(res, 429, `${L.applicationsPerDay} applications a day is the limit. Wait for a reply.`);
    }
    const body = await readJson(req);
    const answer = String(body.answer || '').trim();
    if (answer.length < 40) {
      return fail(res, 400, 'Answer the question in 40 characters or more. This is what the circle reads.');
    }
    const id = store.applyToCircle(c.id, u.id, answer, v.apply.waitlist ? 'waitlisted' : 'pending');
    store.note('u:' + u.id, 'apply');
    send(res, 201, { id, status: v.apply.waitlist ? 'waitlisted' : 'pending' });
  });

  route('DELETE', /^\/api\/circles\/(\d+)\/apply$/, async (req, res, m) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    store.withdrawApplication(Number(m[1]), u.id);
    send(res, 200, { ok: true });
  });

  route('POST', /^\/api\/circles\/(\d+)\/applications\/(\d+)\/(approve|decline|second)$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    const app = store.applicationById(Number(m[2]));
    if (!app || app.circle_id !== got.c.id) return fail(res, 404, 'No such application.');
    if (app.status === 'approved' || app.status === 'declined') return fail(res, 409, 'Already decided.');
    const host = got.mem.role === 'host';
    const action = m[3];

    if (action === 'second') {
      if (host) return fail(res, 400, 'As host you can approve it outright.');
      if (store.hasSeconded(app.id, got.u.id)) return fail(res, 409, 'You have already seconded this.');
      store.secondApplication(app.id, got.u.id);
      // Two members carry it without the host: vetting belongs to the circle.
      if (store.secondsFor(app.id) >= 2) return admit(res, got, app);
      return send(res, 200, { seconds: store.secondsFor(app.id), status: app.status });
    }
    if (!host) return fail(res, 403, 'Only the host decides outright — you can second it instead.');
    if (action === 'decline') {
      store.decideApplication(app.id, 'declined');
      return send(res, 200, { status: 'declined' });
    }
    return admit(res, got, app);
  });

  /** Approve an application, respecting the cap by shunting overflow to the list. */
  function admit(res, got, app) {
    if (store.memberCount(got.c.id) >= got.c.cap) {
      store.decideApplication(app.id, 'waitlisted');
      return send(res, 200, { status: 'waitlisted', why: 'The circle is at its cap.' });
    }
    store.decideApplication(app.id, 'approved');
    store.addMember(got.c.id, app.user_id, 'member');
    const who = store.userById(app.user_id);
    store.addCircleMessage(got.c.id, null,
      `${who ? who.display : 'Someone'} joined. ${PROMPTS[store.memberCount(got.c.id) % PROMPTS.length]}`, 'system');
    send(res, 201, { status: 'approved' });
  }

  route('POST', /^\/api\/circles\/(\d+)\/leave$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    if (got.mem.role === 'host' && store.memberCount(got.c.id) > 1) {
      return fail(res, 409, 'Hand the circle on or close it before leaving — people are relying on it.');
    }
    store.removeMember(got.c.id, got.u.id);
    if (store.memberCount(got.c.id) === 0) store.closeCircle(got.c.id);
    else store.addCircleMessage(got.c.id, null, `${got.u.display} left the circle.`, 'system');
    send(res, 200, { ok: true });
  });

  route('DELETE', /^\/api\/circles\/(\d+)\/members\/(\d+)$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    if (got.mem.role !== 'host') return fail(res, 403, 'Only the host can remove someone.');
    const target = Number(m[2]);
    if (target === got.u.id) return fail(res, 400, 'Use leave for yourself.');
    if (!store.memberOf(got.c.id, target)) return fail(res, 404, 'They are not in this circle.');
    store.removeMember(got.c.id, target);
    store.addCircleMessage(got.c.id, null, 'The host removed someone from this circle.', 'system');
    send(res, 200, { ok: true });
  });

  // ---- the conversation ----
  route('GET', /^\/api\/circles\/(\d+)\/messages$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    const url = new URL(req.url, 'http://x');
    const since = Number(url.searchParams.get('since') || 0);
    const rows = store.circleMessages(got.c.id, since);
    // A question handed to particular people travels with their names, so the
    // conversation never has to guess who it was for.
    const names = {};
    if (rows.some((r) => r.invites)) {
      store.circleMembers(got.c.id).forEach((p) => { names[p.id] = p.display; });
    }
    send(res, 200, { messages: rows.map((r) => {
      const ids = String(r.invites || '').split(',').map(Number).filter(Boolean);
      delete r.invites;
      r.invited = ids.map((i) => ({ id: i, display: names[i] || 'someone who left' }));
      return r;
    }) });
  });

  route('POST', /^\/api\/circles\/(\d+)\/messages$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    if (store.countSince('u:' + got.u.id, 'cmessage', HOUR) >= L.circleMessagesPerHour) {
      return fail(res, 429, 'Slow down a little.');
    }
    const body = await readJson(req);
    const text = String(body.body || '').trim();
    if (!text) return fail(res, 400, 'Empty message.');
    const id = store.addCircleMessage(got.c.id, got.u.id, text, 'chat');
    store.note('u:' + got.u.id, 'cmessage');
    store.markCircleRead(got.c.id, got.u.id, id);
    send(res, 201, { id, readiness: readiness(store.circleStats(got.c.id), R) });
  });

  route('POST', /^\/api\/circles\/(\d+)\/read$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    const body = await readJson(req);
    store.markCircleRead(got.c.id, got.u.id, Number(body.lastId) || 0);
    send(res, 200, { ok: true });
  });

  /** Post the next unused question. A dead group chat is the default state of
   *  every group chat; this is the cheapest thing that fixes it. The question
   *  comes from whichever set the circle has earned: three sets, each more
   *  personal than the last, and a set opens only once the one below it has
   *  been answered by more than one person. */
  route('POST', /^\/api\/circles\/(\d+)\/prompt$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    // Posting another question to a circle that has been able to meet for a
    // month is the avoidance, not the cure. This is the one place the app
    // refuses to help you keep talking — and it is checked before the rate
    // limit, because "wait twelve hours" is the wrong thing to be told here.
    const dr = driftOf(got.c, readiness(store.circleStats(got.c.id), R).ready);
    if (dr.stage === 'drifting') {
      return fail(res, 409, `This circle has been ready to meet for ${dr.days} days. Another question is not what it needs — propose something.`);
    }
    if (Date.now() - store.lastPromptAt(got.c.id) < 12 * HOUR) {
      return fail(res, 429, 'One prompt every twelve hours. Let the last one breathe.');
    }
    const disc = disclosureOf(store.promptRuns(got.c.id), DI);
    const used = store.promptsUsed(got.c.id);
    const unused = (list) => list.filter((t) => used.indexOf(t) === -1);
    // The earned set first; if it is used up, anything still unasked rather
    // than nothing — a circle that has worked through fifteen questions does
    // not need to be told to wait.
    const next = unused(PROMPT_SETS[disc.depth - 1].prompts)[0]
      || unused(PROMPTS)[0]
      || PROMPTS[used.length % PROMPTS.length];
    // And it is handed to whoever has not spoken lately. Preece et al.: the
    // usual reason somebody reads a group for weeks without posting is not
    // indifference, it is that nobody ever asked them anything. Never the
    // person who pressed the button, and never the same people as last time.
    const invited = store.quietMembers(got.c.id, {
      quietMs: Q.quietHours * HOUR,
      graceMs: Q.graceHours * HOUR,
      skip: store.lastInvites(got.c.id).concat([got.u.id]),
      limit: Q.invite
    });
    const id = store.addCircleMessage(got.c.id, null, next, 'prompt', invited.map((p) => p.id));
    send(res, 201, {
      id, body: next, disclosure: disc, invited: invited.map((p) => p.display)
    });
  });

  /** Your one line on what you want out of this circle.
   *
   *  Lickel et al. (2000): shared goals are among the features that make a
   *  set of people read as a group rather than an aggregate. Postmes et al.
   *  (2005): an identity induced from what the members themselves say is held
   *  harder than one deduced from a label handed down. The host already wrote
   *  what the circle is; this is what the people in it came for, and it is
   *  theirs. An empty string clears it, because changing your mind in public
   *  should not need an apology. */
  route('POST', /^\/api\/circles\/(\d+)\/wants$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    const body = await readJson(req);
    const text = String(body.wants || '').trim().slice(0, WANTS.maxChars);
    if (text && text.length < WANTS.minChars) {
      return fail(res, 400, `A few more words than that — ${WANTS.minChars} characters or more.`);
    }
    store.setWants(got.c.id, got.u.id, text);
    send(res, 200, { wants: text });
  });

  /** A thread with one person from the circle.
   *
   *  Ren, Kraut & Kiesler (2007): attachment to a group is either to the group
   *  and its subject, or to the particular people in it. A single group thread
   *  can only ever build the first kind, and the second is what survives the
   *  group going quiet. So: a door to one person — but a narrow one. You have
   *  both already spoken here, which is what stops it being a cold DM, and the
   *  thread lands in Messages like any other conversation, under the same
   *  blocking, reporting and rate limits. */
  route('POST', /^\/api\/circles\/(\d+)\/threads$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    const body = await readJson(req);
    const them = store.circleMembers(got.c.id).filter((p) => p.id === Number(body.userId))[0];
    if (!them) return fail(res, 404, 'They are not in this circle.');

    const gate = sideThread(got.c.id, got.u, them);
    if (!gate.canMessage) return fail(res, 403, gate.whyNot || 'You cannot message this person.');
    if (store.countSince('u:' + got.u.id, 'request', DAY) >= L.requestsPerDay) {
      return fail(res, 429, `That is ${L.requestsPerDay} new conversations today.`);
    }
    const text = String(body.body || '').trim();
    if (text.length < 10) return fail(res, 400, 'Write at least a sentence.');

    let threadId = gate.threadId;
    if (!threadId) {
      threadId = store.createAccepted(got.u.id, them.id);
      store.note('u:' + got.u.id, 'request');
    }
    store.addMessage(threadId, got.u.id, text);
    send(res, 201, { threadId });
  });

  route('POST', /^\/api\/circles\/(\d+)\/vouch$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    const body = await readJson(req);
    const target = Number(body.userId);
    if (target === got.u.id) return fail(res, 400, 'You cannot vouch for yourself.');
    if (!store.memberOf(got.c.id, target)) return fail(res, 404, 'They are not in this circle.');
    // A vouch has to mean "we have talked", or it is just a follow button.
    const said = store.circleMembers(got.c.id).filter((p) => p.id === target)[0];
    if (!said || said.said < 1) return fail(res, 400, 'Vouch for someone once they have said something here.');
    store.vouch(got.c.id, got.u.id, target);
    send(res, 201, { vouches: store.vouchCount(target) });
  });

  // ---- meetups: only after the circle has actually talked ----
  route('POST', /^\/api\/circles\/(\d+)\/meetups$/, async (req, res, m) => {
    const got = requireMember(req, res, Number(m[1]));
    if (!got) return;
    const stats = store.circleStats(got.c.id);
    const rd = readiness(stats, R);
    if (!rd.ready) {
      const short = rd.checks.filter((c) => c.have < c.need)
        .map((c) => `${c.need - c.have} more ${c.label}`).join(', ');
      return fail(res, 409, 'Not yet — this circle still needs ' + short + '. Talk first.');
    }
    if (store.countSince('u:' + got.u.id, 'meetup', DAY) >= L.meetupsPerDay) {
      return fail(res, 429, 'That is enough proposals for one day.');
    }
    const body = await readJson(req);
    const title = String(body.title || '').trim();
    const place = String(body.place || '').trim();
    const startsAt = Number(body.startsAt) || null;
    const cadence = Object.prototype.hasOwnProperty.call(CADENCES, body.cadence || '') ? (body.cadence || '') : '';
    const hours = Math.min(12, Math.max(0.5, Number(body.hours) || 2));
    const plan = String(body.plan || '').trim();
    if (title.length < 4) return fail(res, 400, 'Say what you would do.');
    if (place.length < 3) return fail(res, 400, 'Name a public place to meet.');
    if (!startsAt) return fail(res, 400, 'Pick a date and time — a plan without one is a wish.');
    if (startsAt < Date.now() - HOUR) return fail(res, 400, 'Pick a time that has not happened yet.');
    // Proposing something counts as your yes, so it carries a plan like one.
    if (plan.length < INTENTION.minChars) return fail(res, 400, PLAN_ASK);

    const id = store.createMeetup({
      circleId: got.c.id, proposerId: got.u.id, title, place, startsAt,
      details: String(body.details || ''),
      orgId: body.orgId, orgName: body.orgName, orgUrl: body.orgUrl,
      quorum: quorumFor(stats.members), cadence, hours, plan
    });
    store.note('u:' + got.u.id, 'meetup');
    const repeats = cadence ? ` ${CADENCES[cadence].label.toLowerCase()}` : '';
    store.addCircleMessage(got.c.id, null,
      `${got.u.display} proposed: ${title} — ${place}${repeats}. It is on once ${quorumFor(stats.members)} of you say yes.`, 'system');
    send(res, 201, { id, quorum: quorumFor(stats.members), cadence, hours });
  });

  route('POST', /^\/api\/meetups\/(\d+)\/rsvp$/, async (req, res, m) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const k = store.meetupById(Number(m[1]));
    if (!k) return fail(res, 404, 'No such meetup.');
    if (!store.memberOf(k.circle_id, u.id)) return fail(res, 403, 'Members only.');
    if (k.status === 'cancelled') return fail(res, 409, 'That was cancelled.');
    const body = await readJson(req);
    const answer = ['yes', 'maybe', 'no'].indexOf(body.answer) === -1 ? null : body.answer;
    if (!answer) return fail(res, 400, 'Answer yes, maybe or no.');
    // Only a yes needs a plan: a maybe promises nothing and a no costs nobody
    // anything. A yes counts towards the quorum other people are relying on,
    // which is exactly the intention an if-then plan is for.
    const plan = String(body.plan || '').trim();
    if (answer === 'yes' && plan.length < INTENTION.minChars) return fail(res, 400, PLAN_ASK);
    store.rsvp(k.id, u.id, answer, answer === 'yes' ? plan : '');
    const yes = store.yesCount(k.id);
    if (yes >= k.quorum && k.status === 'proposed') {
      store.confirmMeetup(k.id);
      store.addCircleMessage(k.circle_id, null, `It is on: ${k.title} — ${k.place}.`, 'system');
    }
    send(res, 200, { yes, quorum: k.quorum, status: store.meetupById(k.id).status });
  });

  route('POST', /^\/api\/meetups\/(\d+)\/cancel$/, async (req, res, m) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const k = store.meetupById(Number(m[1]));
    if (!k) return fail(res, 404, 'No such meetup.');
    const mem = store.memberOf(k.circle_id, u.id);
    if (!mem) return fail(res, 403, 'Members only.');
    if (k.proposer_id !== u.id && mem.role !== 'host') {
      return fail(res, 403, 'Only whoever proposed it, or the host, can call it off.');
    }
    store.cancelMeetup(k.id);
    store.addCircleMessage(k.circle_id, null, `${k.title} is off.`, 'system');
    send(res, 200, { ok: true });
  });

  /** Hours only count when someone says they were actually there. An RSVP is
   *  an intention; this is the record. */
  route('POST', /^\/api\/occurrences\/(\d+)\/attended$/, async (req, res, m) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const o = store.occurrenceById(Number(m[1]));
    if (!o) return fail(res, 404, 'No such meetup.');
    if (!store.memberOf(o.circle_id, u.id)) return fail(res, 403, 'Members only.');
    if (Date.now() - o.starts_at > 30 * DAY) return fail(res, 409, 'Too long ago to log.');
    const body = await readJson(req);
    store.setAttendance(o.id, u.id, body.attended !== false);
    send(res, 200, {
      hours: hallLadder(store.hoursOf(u.id, o.circle_id)),
      circleHours: Math.round(store.circleHours(o.circle_id) * 10) / 10
    });
  });

  // One call for every badge in the header.
  route('GET', /^\/api\/unread$/, async (req, res) => {
    const u = currentUser(req);
    if (!u) return fail(res, 401, 'Sign in first.');
    const rows = store.circleUnread(u.id);
    const intros = store.requestsFor(u.id).incoming.length;
    let pending = 0;
    store.listCircles(u.id, {}).forEach((c) => {
      const mem = store.memberOf(c.id, u.id);
      if (mem && mem.role === 'host') pending += c.pending || 0;
    });
    send(res, 200, {
      circles: rows.reduce((n, r) => n + r.unread, 0),
      byCircle: rows, intros, pending
    });
  });

  // ---- static files ----
  // Only what the browser actually needs. An allowlist rather than a denylist,
  // so adding a file to the repo can never accidentally publish it.
  const SERVE_EXACT = new Set([
    'index.html', 'privacy.html', 'terms.html', 'robots.txt', 'site.webmanifest'
  ]);
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
      // The HTML must always be revalidated or a deploy never reaches anyone;
      // the assets it references are safe to cache for a short while.
      const isPage = rel.endsWith('.html');
      send(res, 200, data, {
        'Content-Type': MIME[path.extname(target)] || 'application/octet-stream',
        'Cache-Control': isPage ? 'no-cache' : 'public, max-age=300, must-revalidate'
      });
    });
  }

  // Uptime checks need something cheap that also proves the database answers.
  route('GET', /^\/api\/health$/, async (req, res) => {
    let db = 'ok';
    try { store.db.prepare('SELECT 1').get(); } catch (e) { db = 'error'; }
    send(res, db === 'ok' ? 200 : 503, {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      uptime: Math.round(process.uptime()),
      version: VERSION
    });
  });

  const server = http.createServer(async (req, res) => {
    const started = Date.now();
    res.on('finish', () => {
      if (!log) return;
      // One line per request: method, path, status, ms. No query strings, no
      // bodies, no cookies — none of that should end up in a log file.
      const pathOnly = String(req.url || '').split('?')[0];
      log(`${new Date().toISOString()} ${req.method} ${pathOnly} ${res.statusCode} ${Date.now() - started}ms`);
    });
    try {
      const pathname = new URL(req.url, 'http://x').pathname;
      if (pathname.startsWith('/api/')) {
        // Nothing the API returns should ever be cached, by a browser or a
        // proxy. Set once here rather than per route, where it gets forgotten.
        res.setHeader('Cache-Control', 'no-store');
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

  /** Stop accepting connections, finish what is in flight, close the database. */
  function shutdown(signal) {
    if (log) log(`${new Date().toISOString()} shutting down on ${signal}`);
    server.close(() => {
      try { store.db.close(); } catch (e) { /* already closed */ }
      process.exit(0);
    });
    // Do not hang forever on a stuck connection.
    setTimeout(() => process.exit(0), 8000).unref();
  }

  return { server, store, shutdown };
}

module.exports = { createApp, hashPassword, verifyPassword, DEFAULT_LIMITS };

if (require.main === module) {
  const port = Number(process.env.PORT || 4000);
  const { server, shutdown } = createApp({
    secure: process.env.SECURE === '1',
    log: (line) => console.log(line)
  });
  ['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => shutdown(sig)));

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
