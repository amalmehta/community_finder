/* community_finder — data layer.
 * SQLite via node:sqlite (built in since Node 22). No dependencies.
 */
'use strict';
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,      -- stored lowercase
  display     TEXT NOT NULL,             -- as typed
  pass        TEXT NOT NULL,             -- scrypt hash
  salt        TEXT NOT NULL,
  city        TEXT NOT NULL DEFAULT '',
  bio         TEXT NOT NULL DEFAULT '',
  age_ok      INTEGER NOT NULL DEFAULT 0,
  discoverable INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL,
  last_seen   INTEGER NOT NULL
);

-- An interest is only usable for discovery when visible = 1. Someone can look
-- for hiking partners without their support or LGBTQ+ interests being exposed.
CREATE TABLE IF NOT EXISTS user_interests (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest  TEXT NOT NULL,
  visible   INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, interest)
);

-- A verification token is single-use and short-lived.
CREATE TABLE IF NOT EXISTS verifications (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- One intro, then silence until the recipient accepts.
CREATE TABLE IF NOT EXISTS connections (
  id         INTEGER PRIMARY KEY,
  from_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending',   -- pending | accepted | declined
  intro      TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  decided_at INTEGER,
  UNIQUE (from_id, to_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id            INTEGER PRIMARY KEY,
  connection_id INTEGER NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  sender_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  detail      TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL
);

-- Used for rate limiting; pruned as it is read.
CREATE TABLE IF NOT EXISTS actions (
  id      INTEGER PRIMARY KEY,
  who     TEXT NOT NULL,     -- "u:<id>" or "ip:<addr>"
  kind    TEXT NOT NULL,
  at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_actions ON actions(who, kind, at);
CREATE INDEX IF NOT EXISTS idx_msg_conn ON messages(connection_id, id);
CREATE INDEX IF NOT EXISTS idx_ui_interest ON user_interests(interest, visible);

-- ---------------------------------------------------------------- circles
-- A circle is a small, vetted, local group that talks first and only decides
-- to meet once it has actually been a conversation. Everything below exists
-- to make that order the only possible one.
CREATE TABLE IF NOT EXISTS circles (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  blurb       TEXT NOT NULL DEFAULT '',
  question    TEXT NOT NULL DEFAULT '',   -- what applicants have to answer
  host_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cap         INTEGER NOT NULL DEFAULT 8, -- small by design; see CAP_RANGE
  min_trust   INTEGER NOT NULL DEFAULT 1, -- the trust tier needed to apply
  status      TEXT NOT NULL DEFAULT 'open',   -- open | closed
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS circle_interests (
  circle_id INTEGER NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  interest  TEXT NOT NULL,
  PRIMARY KEY (circle_id, interest)
);

-- last_read_id is what makes the unread badge honest without a read receipt
-- table: one integer per person per circle.
CREATE TABLE IF NOT EXISTS circle_members (
  circle_id    INTEGER NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member',   -- host | member
  joined_at    INTEGER NOT NULL,
  last_read_id INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (circle_id, user_id)
);

-- Joining is an application with a written answer, never a click.
CREATE TABLE IF NOT EXISTS circle_applications (
  id         INTEGER PRIMARY KEY,
  circle_id  INTEGER NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer     TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | declined | waitlisted
  created_at INTEGER NOT NULL,
  decided_at INTEGER,
  UNIQUE (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS circle_messages (
  id         INTEGER PRIMARY KEY,
  circle_id  INTEGER NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  sender_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  body       TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'chat',   -- chat | prompt | system
  created_at INTEGER NOT NULL
);

-- A vouch is only possible between people who have talked in the same circle,
-- so it means something that a follow or a like does not.
CREATE TABLE IF NOT EXISTS vouches (
  circle_id  INTEGER NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  from_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (circle_id, from_id, to_id)
);

-- A meetup is a proposal until enough people say yes. org_* anchors it to a
-- real listing from the finder, so "do something" means something specific.
CREATE TABLE IF NOT EXISTS meetups (
  id           INTEGER PRIMARY KEY,
  circle_id    INTEGER NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  proposer_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  place        TEXT NOT NULL DEFAULT '',
  starts_at    INTEGER,
  details      TEXT NOT NULL DEFAULT '',
  org_id       TEXT NOT NULL DEFAULT '',
  org_name     TEXT NOT NULL DEFAULT '',
  org_url      TEXT NOT NULL DEFAULT '',
  quorum       INTEGER NOT NULL DEFAULT 3,
  status       TEXT NOT NULL DEFAULT 'proposed',  -- proposed | on | cancelled
  created_at   INTEGER NOT NULL,
  confirmed_at INTEGER
);

CREATE TABLE IF NOT EXISTS meetup_rsvps (
  meetup_id INTEGER NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer    TEXT NOT NULL,            -- yes | maybe | no
  at        INTEGER NOT NULL,
  PRIMARY KEY (meetup_id, user_id)
);

-- A member can second an application. Two seconds carry it without the host,
-- so vetting is the circle's, not one person's.
CREATE TABLE IF NOT EXISTS application_votes (
  app_id  INTEGER NOT NULL REFERENCES circle_applications(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  at      INTEGER NOT NULL,
  PRIMARY KEY (app_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cmsg ON circle_messages(circle_id, id);
CREATE INDEX IF NOT EXISTS idx_cmem ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_cint ON circle_interests(interest);
`;

// Columns added after the first release. Existing databases are migrated in
// place rather than rebuilt, so nobody loses their messages to an upgrade.
const ADDED_COLUMNS = [
  ['users', 'email', "TEXT NOT NULL DEFAULT ''"],
  ['users', 'email_verified', 'INTEGER NOT NULL DEFAULT 0'],
  ['users', 'open_to_direct', 'INTEGER NOT NULL DEFAULT 1'],
  ['users', 'suspended', 'INTEGER NOT NULL DEFAULT 0'],
  ['reports', 'resolved_at', 'INTEGER'],
  ['reports', 'note', "TEXT NOT NULL DEFAULT ''"]
];

function migrate(db) {
  ADDED_COLUMNS.forEach(([table, column, decl]) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
    if (!cols.includes(column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`);
    }
  });
}

function open(file) {
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/** Everything the API needs, bound to one database handle. */
function createStore(db) {
  const q = (sql) => db.prepare(sql);
  const now = () => Date.now();

  const S = {
    db,

    // ---- users ----
    createUser({ username, display, pass, salt, city, ageOk }) {
      const t = now();
      const info = q(`INSERT INTO users (username, display, pass, salt, city, age_ok, created_at, last_seen)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(username, display, pass, salt, city || '', ageOk ? 1 : 0, t, t);
      return Number(info.lastInsertRowid);
    },
    userByName(username) {
      return q('SELECT * FROM users WHERE username = ?').get(String(username).toLowerCase());
    },
    userById(id) {
      return q('SELECT * FROM users WHERE id = ?').get(id);
    },
    touch(id) {
      q('UPDATE users SET last_seen = ? WHERE id = ?').run(now(), id);
    },
    updateProfile(id, { city, bio, discoverable }) {
      q('UPDATE users SET city = ?, bio = ?, discoverable = ? WHERE id = ?')
        .run(city || '', (bio || '').slice(0, 280), discoverable ? 1 : 0, id);
    },

    // ---- interests ----
    setInterests(userId, list) {
      q('DELETE FROM user_interests WHERE user_id = ?').run(userId);
      const ins = q('INSERT INTO user_interests (user_id, interest, visible) VALUES (?, ?, ?)');
      (list || []).slice(0, 12).forEach((it) => {
        ins.run(userId, String(it.id), it.visible === false ? 0 : 1);
      });
    },
    interestsOf(userId) {
      return q('SELECT interest, visible FROM user_interests WHERE user_id = ?').all(userId);
    },

    // ---- discovery ----
    /**
     * People sharing at least one *visible* interest, ranked by overlap.
     * Blocks apply in both directions, and only visible interests are returned.
     */
    discover(userId, { city, interest, limit = 40 } = {}) {
      const mine = q('SELECT interest FROM user_interests WHERE user_id = ? AND visible = 1')
        .all(userId).map((r) => r.interest);
      if (!mine.length) return [];
      const wanted = interest ? mine.filter((i) => i === interest) : mine;
      if (!wanted.length) return [];

      const marks = wanted.map(() => '?').join(',');
      const rows = q(`
        SELECT u.id, u.display, u.city, u.bio, u.last_seen,
               u.email_verified, u.open_to_direct,
               COUNT(*) AS shared,
               GROUP_CONCAT(ui.interest) AS interests
        FROM user_interests ui
        JOIN users u ON u.id = ui.user_id
        WHERE ui.interest IN (${marks})
          AND ui.visible = 1
          AND u.id != ?
          AND u.discoverable = 1
          AND u.suspended = 0
          AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker_id = ? AND b.blocked_id = u.id)
          AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker_id = u.id AND b.blocked_id = ?)
          ${city ? 'AND LOWER(u.city) = LOWER(?)' : ''}
        GROUP BY u.id
        ORDER BY shared DESC, u.last_seen DESC
        LIMIT ?
      `).all(...wanted, userId, userId, userId, ...(city ? [city] : []), limit);

      return rows.map((r) => ({
        id: r.id, display: r.display, city: r.city, bio: r.bio,
        shared: r.shared, lastSeen: r.last_seen,
        verified: !!r.email_verified, openToDirect: !!r.open_to_direct,
        interests: String(r.interests || '').split(',').filter(Boolean)
      }));
    },

    // ---- connections ----
    connectionBetween(a, b) {
      return q(`SELECT * FROM connections
                WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)`)
        .get(a, b, b, a);
    },
    createRequest(fromId, toId, intro) {
      const info = q(`INSERT INTO connections (from_id, to_id, status, intro, created_at)
                      VALUES (?, ?, 'pending', ?, ?)`)
        .run(fromId, toId, String(intro || '').slice(0, 300), now());
      return Number(info.lastInsertRowid);
    },
    decideRequest(id, userId, status) {
      const c = q('SELECT * FROM connections WHERE id = ?').get(id);
      if (!c || c.to_id !== userId || c.status !== 'pending') return null;
      q('UPDATE connections SET status = ?, decided_at = ? WHERE id = ?').run(status, now(), id);
      return q('SELECT * FROM connections WHERE id = ?').get(id);
    },
    requestsFor(userId) {
      const incoming = q(`SELECT c.*, u.display AS other_name, u.city AS other_city
                          FROM connections c JOIN users u ON u.id = c.from_id
                          WHERE c.to_id = ? AND c.status = 'pending' ORDER BY c.created_at DESC`).all(userId);
      const outgoing = q(`SELECT c.*, u.display AS other_name, u.city AS other_city
                          FROM connections c JOIN users u ON u.id = c.to_id
                          WHERE c.from_id = ? AND c.status = 'pending' ORDER BY c.created_at DESC`).all(userId);
      return { incoming, outgoing };
    },
    threadsFor(userId) {
      return q(`
        SELECT c.id, c.from_id, c.to_id,
               u.id AS other_id, u.display AS other_name, u.city AS other_city,
               (SELECT body FROM messages m WHERE m.connection_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_body,
               (SELECT created_at FROM messages m WHERE m.connection_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_at
        FROM connections c
        JOIN users u ON u.id = CASE WHEN c.from_id = ? THEN c.to_id ELSE c.from_id END
        WHERE (c.from_id = ? OR c.to_id = ?) AND c.status = 'accepted'
        ORDER BY COALESCE(last_at, c.decided_at) DESC
      `).all(userId, userId, userId);
    },
    connectionForUser(id, userId) {
      return q(`SELECT * FROM connections
                WHERE id = ? AND status = 'accepted' AND (from_id = ? OR to_id = ?)`)
        .get(id, userId, userId);
    },

    // ---- messages ----
    addMessage(connectionId, senderId, body) {
      const info = q('INSERT INTO messages (connection_id, sender_id, body, created_at) VALUES (?, ?, ?, ?)')
        .run(connectionId, senderId, String(body).slice(0, 2000), now());
      return Number(info.lastInsertRowid);
    },
    messages(connectionId, sinceId = 0) {
      return q(`SELECT id, sender_id, body, created_at FROM messages
                WHERE connection_id = ? AND id > ? ORDER BY id ASC LIMIT 300`)
        .all(connectionId, sinceId);
    },

    // ---- safety ----
    block(blockerId, blockedId) {
      q('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)')
        .run(blockerId, blockedId, now());
      // A block ends any existing connection in both directions.
      q(`UPDATE connections SET status = 'declined', decided_at = ?
         WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)`)
        .run(now(), blockerId, blockedId, blockedId, blockerId);
    },
    unblock(blockerId, blockedId) {
      q('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').run(blockerId, blockedId);
    },
    isBlocked(a, b) {
      return !!q(`SELECT 1 FROM blocks
                  WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`)
        .get(a, b, b, a);
    },
    blockedBy(userId) {
      return q(`SELECT u.id, u.display FROM blocks b JOIN users u ON u.id = b.blocked_id
                WHERE b.blocker_id = ?`).all(userId);
    },
    report(reporterId, reportedId, reason, detail) {
      q('INSERT INTO reports (reporter_id, reported_id, reason, detail, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(reporterId, reportedId, String(reason).slice(0, 60), String(detail || '').slice(0, 1000), now());
    },

    // ---- email verification ----
    setEmail(userId, email) {
      q('UPDATE users SET email = ?, email_verified = 0 WHERE id = ?')
        .run(String(email).toLowerCase().slice(0, 190), userId);
    },
    emailInUse(email, exceptUserId) {
      const row = q('SELECT id FROM users WHERE email = ? AND email != \'\' AND id != ?')
        .get(String(email).toLowerCase(), exceptUserId || 0);
      return !!row;
    },
    createVerification(token, userId, email, ttlMs) {
      const t = now();
      q('DELETE FROM verifications WHERE user_id = ? AND used_at IS NULL').run(userId);
      q('INSERT INTO verifications (token, user_id, email, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
        .run(token, userId, String(email).toLowerCase(), t, t + ttlMs);
    },
    /** Consume a token. Returns the user id, or null if unknown/expired/used. */
    useVerification(token) {
      const v = q('SELECT * FROM verifications WHERE token = ?').get(String(token || ''));
      if (!v || v.used_at || v.expires_at < now()) return null;
      q('UPDATE verifications SET used_at = ? WHERE token = ?').run(now(), token);
      q('UPDATE users SET email = ?, email_verified = 1 WHERE id = ?').run(v.email, v.user_id);
      return v.user_id;
    },
    setOpenToDirect(userId, on) {
      q('UPDATE users SET open_to_direct = ? WHERE id = ?').run(on ? 1 : 0, userId);
    },

    // ---- connections created without a request ----
    createAccepted(fromId, toId) {
      const t = now();
      const info = q(`INSERT INTO connections (from_id, to_id, status, intro, created_at, decided_at)
                      VALUES (?, ?, 'accepted', '', ?, ?)`).run(fromId, toId, t, t);
      return Number(info.lastInsertRowid);
    },

    // ---- moderation ----
    openReports() {
      return q(`SELECT r.*, a.username AS reporter, b.username AS reported, b.suspended
                FROM reports r
                JOIN users a ON a.id = r.reporter_id
                JOIN users b ON b.id = r.reported_id
                WHERE r.resolved_at IS NULL
                ORDER BY r.created_at ASC`).all();
    },
    resolveReport(id, note) {
      q('UPDATE reports SET resolved_at = ?, note = ? WHERE id = ?')
        .run(now(), String(note || '').slice(0, 500), id);
    },
    /** Suspending ends sessions as well as access: a live cookie is access. */
    setSuspended(userId, on) {
      q('UPDATE users SET suspended = ?, discoverable = ? WHERE id = ?')
        .run(on ? 1 : 0, on ? 0 : 1, userId);
      if (on) q('DELETE FROM sessions WHERE user_id = ?').run(userId);
    },
    reportCounts() {
      return {
        open: q('SELECT COUNT(*) AS n FROM reports WHERE resolved_at IS NULL').get().n,
        total: q('SELECT COUNT(*) AS n FROM reports').get().n,
        suspended: q('SELECT COUNT(*) AS n FROM users WHERE suspended = 1').get().n
      };
    },

    // ---------------------------------------------------------- circles
    createCircle({ name, city, blurb, question, hostId, cap, minTrust, interests }) {
      const t = now();
      const info = q(`INSERT INTO circles (name, city, blurb, question, host_id, cap, min_trust, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(String(name).slice(0, 60), String(city || '').slice(0, 60),
             String(blurb || '').slice(0, 400), String(question || '').slice(0, 200),
             hostId, cap, minTrust, t);
      const id = Number(info.lastInsertRowid);
      S.setCircleInterests(id, interests);
      q(`INSERT INTO circle_members (circle_id, user_id, role, joined_at) VALUES (?, ?, 'host', ?)`)
        .run(id, hostId, t);
      return id;
    },
    circleById(id) {
      return q('SELECT * FROM circles WHERE id = ?').get(Number(id));
    },
    setCircleInterests(circleId, list) {
      q('DELETE FROM circle_interests WHERE circle_id = ?').run(circleId);
      const ins = q('INSERT OR IGNORE INTO circle_interests (circle_id, interest) VALUES (?, ?)');
      (list || []).slice(0, 6).forEach((i) => ins.run(circleId, String(i)));
    },
    circleInterests(circleId) {
      return q('SELECT interest FROM circle_interests WHERE circle_id = ?').all(circleId)
        .map((r) => r.interest);
    },
    updateCircle(id, { blurb, question, cap, minTrust }) {
      q('UPDATE circles SET blurb = ?, question = ?, cap = ?, min_trust = ? WHERE id = ?')
        .run(String(blurb || '').slice(0, 400), String(question || '').slice(0, 200), cap, minTrust, id);
    },
    closeCircle(id) {
      q(`UPDATE circles SET status = 'closed' WHERE id = ?`).run(id);
    },

    // ---- membership ----
    memberOf(circleId, userId) {
      return q('SELECT * FROM circle_members WHERE circle_id = ? AND user_id = ?').get(circleId, userId);
    },
    memberCount(circleId) {
      return q('SELECT COUNT(*) AS n FROM circle_members WHERE circle_id = ?').get(circleId).n;
    },
    circleMembers(circleId) {
      return q(`SELECT cm.role, cm.joined_at, u.id, u.display, u.username, u.city, u.bio,
                       u.email_verified, u.suspended,
                       (SELECT COUNT(*) FROM circle_messages m
                         WHERE m.circle_id = cm.circle_id AND m.sender_id = u.id AND m.kind = 'chat') AS said,
                       (SELECT COUNT(*) FROM vouches v WHERE v.to_id = u.id) AS vouches
                FROM circle_members cm JOIN users u ON u.id = cm.user_id
                WHERE cm.circle_id = ?
                ORDER BY cm.role = 'host' DESC, cm.joined_at ASC`).all(circleId);
    },
    addMember(circleId, userId, role = 'member') {
      q(`INSERT OR IGNORE INTO circle_members (circle_id, user_id, role, joined_at)
         VALUES (?, ?, ?, ?)`).run(circleId, userId, role, now());
    },
    removeMember(circleId, userId) {
      q('DELETE FROM circle_members WHERE circle_id = ? AND user_id = ?').run(circleId, userId);
      q('DELETE FROM vouches WHERE circle_id = ? AND (from_id = ? OR to_id = ?)')
        .run(circleId, userId, userId);
    },
    circleIdsOf(userId) {
      return q('SELECT circle_id FROM circle_members WHERE user_id = ?').all(userId)
        .map((r) => r.circle_id);
    },

    /** What the readiness gate and the liveliness line are both computed from. */
    circleStats(circleId) {
      const r = q(`SELECT COUNT(*) AS messages,
                          COUNT(DISTINCT sender_id) AS speakers,
                          COUNT(DISTINCT CAST(created_at / 86400000 AS INTEGER)) AS days,
                          MAX(created_at) AS last_at
                   FROM circle_messages WHERE circle_id = ? AND kind = 'chat'`).get(circleId);
      const wk = q(`SELECT COUNT(*) AS messages, COUNT(DISTINCT sender_id) AS speakers
                    FROM circle_messages
                    WHERE circle_id = ? AND kind = 'chat' AND created_at > ?`)
        .get(circleId, now() - 7 * 86400000);
      return {
        messages: r.messages || 0, speakers: r.speakers || 0, days: r.days || 0,
        lastAt: r.last_at || null,
        weekMessages: wk.messages || 0, weekSpeakers: wk.speakers || 0,
        members: S.memberCount(circleId)
      };
    },

    /** Every open circle, annotated with this person's standing in it. */
    listCircles(userId, { includeClosed = false, limit = 60 } = {}) {
      return q(`
        SELECT c.*, u.display AS host_name,
               (SELECT COUNT(*) FROM circle_members cm WHERE cm.circle_id = c.id) AS members,
               (SELECT GROUP_CONCAT(interest) FROM circle_interests ci WHERE ci.circle_id = c.id) AS interests,
               (SELECT role FROM circle_members cm WHERE cm.circle_id = c.id AND cm.user_id = ?) AS my_role,
               (SELECT status FROM circle_applications a WHERE a.circle_id = c.id AND a.user_id = ?) AS my_app,
               -- Waitlisted applications are still in the host's queue: they
               -- are what applicationsFor shows, so they are what we count.
               (SELECT COUNT(*) FROM circle_applications a
                 WHERE a.circle_id = c.id AND a.status IN ('pending', 'waitlisted')) AS pending
        FROM circles c JOIN users u ON u.id = c.host_id
        ${includeClosed ? '' : "WHERE c.status = 'open'"}
        ORDER BY c.created_at DESC
        LIMIT ?
      `).all(userId, userId, limit);
    },

    // ---- applications ----
    applyToCircle(circleId, userId, answer, status) {
      const info = q(`INSERT INTO circle_applications (circle_id, user_id, answer, status, created_at)
                      VALUES (?, ?, ?, ?, ?)`)
        .run(circleId, userId, String(answer || '').slice(0, 1000), status, now());
      return Number(info.lastInsertRowid);
    },
    myApplication(circleId, userId) {
      return q('SELECT * FROM circle_applications WHERE circle_id = ? AND user_id = ?')
        .get(circleId, userId);
    },
    applicationById(id) {
      return q('SELECT * FROM circle_applications WHERE id = ?').get(Number(id));
    },
    applicationsFor(circleId) {
      return q(`SELECT a.*, u.display, u.username, u.city, u.bio, u.email_verified,
                       (SELECT COUNT(*) FROM vouches v WHERE v.to_id = u.id) AS vouches,
                       (SELECT GROUP_CONCAT(interest) FROM user_interests ui
                         WHERE ui.user_id = u.id AND ui.visible = 1) AS interests,
                       (SELECT COUNT(*) FROM application_votes v WHERE v.app_id = a.id) AS seconds
                FROM circle_applications a JOIN users u ON u.id = a.user_id
                WHERE a.circle_id = ? AND a.status IN ('pending', 'waitlisted')
                ORDER BY a.created_at ASC`).all(circleId);
    },
    secondApplication(appId, userId) {
      q('INSERT OR IGNORE INTO application_votes (app_id, user_id, at) VALUES (?, ?, ?)')
        .run(appId, userId, now());
    },
    secondsFor(appId) {
      return q('SELECT COUNT(*) AS n FROM application_votes WHERE app_id = ?').get(appId).n;
    },
    hasSeconded(appId, userId) {
      return !!q('SELECT 1 FROM application_votes WHERE app_id = ? AND user_id = ?').get(appId, userId);
    },
    decideApplication(id, status) {
      q('UPDATE circle_applications SET status = ?, decided_at = ? WHERE id = ?')
        .run(status, now(), id);
    },
    withdrawApplication(circleId, userId) {
      q('DELETE FROM circle_applications WHERE circle_id = ? AND user_id = ?').run(circleId, userId);
    },

    // ---- circle chat ----
    addCircleMessage(circleId, senderId, body, kind = 'chat') {
      const info = q(`INSERT INTO circle_messages (circle_id, sender_id, body, kind, created_at)
                      VALUES (?, ?, ?, ?, ?)`)
        .run(circleId, senderId, String(body).slice(0, 2000), kind, now());
      return Number(info.lastInsertRowid);
    },
    circleMessages(circleId, sinceId = 0) {
      return q(`SELECT m.id, m.sender_id, m.body, m.kind, m.created_at,
                       COALESCE(u.display, 'someone who left') AS sender_name
                FROM circle_messages m LEFT JOIN users u ON u.id = m.sender_id
                WHERE m.circle_id = ? AND m.id > ?
                ORDER BY m.id ASC LIMIT 300`).all(circleId, sinceId);
    },
    promptsUsed(circleId) {
      return q(`SELECT body FROM circle_messages WHERE circle_id = ? AND kind = 'prompt'`)
        .all(circleId).map((r) => r.body);
    },
    lastPromptAt(circleId) {
      const r = q(`SELECT MAX(created_at) AS at FROM circle_messages
                   WHERE circle_id = ? AND kind = 'prompt'`).get(circleId);
      return r.at || 0;
    },
    markCircleRead(circleId, userId, lastId) {
      q(`UPDATE circle_members SET last_read_id = MAX(last_read_id, ?)
         WHERE circle_id = ? AND user_id = ?`).run(Number(lastId) || 0, circleId, userId);
    },
    /** Unread per circle, for the tab badge. Membership rows only. */
    circleUnread(userId) {
      return q(`SELECT cm.circle_id, c.name,
                       (SELECT COUNT(*) FROM circle_messages m
                         WHERE m.circle_id = cm.circle_id AND m.id > cm.last_read_id
                           AND m.sender_id IS NOT ?) AS unread
                FROM circle_members cm JOIN circles c ON c.id = cm.circle_id
                WHERE cm.user_id = ?`).all(userId, userId);
    },

    // ---- vouches ----
    vouch(circleId, fromId, toId) {
      q('INSERT OR IGNORE INTO vouches (circle_id, from_id, to_id, created_at) VALUES (?, ?, ?, ?)')
        .run(circleId, fromId, toId, now());
    },
    hasVouched(circleId, fromId, toId) {
      return !!q('SELECT 1 FROM vouches WHERE circle_id = ? AND from_id = ? AND to_id = ?')
        .get(circleId, fromId, toId);
    },
    vouchCount(userId) {
      return q('SELECT COUNT(DISTINCT from_id) AS n FROM vouches WHERE to_id = ?').get(userId).n;
    },

    // ---- meetups ----
    createMeetup(m) {
      const info = q(`INSERT INTO meetups
          (circle_id, proposer_id, title, place, starts_at, details, org_id, org_name, org_url,
           quorum, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(m.circleId, m.proposerId, String(m.title).slice(0, 120),
             String(m.place || '').slice(0, 160), m.startsAt || null,
             String(m.details || '').slice(0, 600),
             String(m.orgId || '').slice(0, 60), String(m.orgName || '').slice(0, 120),
             String(m.orgUrl || '').slice(0, 300), m.quorum, now());
      const id = Number(info.lastInsertRowid);
      S.rsvp(id, m.proposerId, 'yes');
      return id;
    },
    meetupById(id) {
      return q('SELECT * FROM meetups WHERE id = ?').get(Number(id));
    },
    meetupsFor(circleId) {
      return q(`SELECT m.*, u.display AS proposer_name,
                       (SELECT COUNT(*) FROM meetup_rsvps r WHERE r.meetup_id = m.id AND r.answer = 'yes') AS yes,
                       (SELECT COUNT(*) FROM meetup_rsvps r WHERE r.meetup_id = m.id AND r.answer = 'maybe') AS maybe
                FROM meetups m JOIN users u ON u.id = m.proposer_id
                WHERE m.circle_id = ? AND m.status != 'cancelled'
                ORDER BY COALESCE(m.starts_at, m.created_at) ASC`).all(circleId);
    },
    rsvp(meetupId, userId, answer) {
      q(`INSERT INTO meetup_rsvps (meetup_id, user_id, answer, at) VALUES (?, ?, ?, ?)
         ON CONFLICT (meetup_id, user_id) DO UPDATE SET answer = excluded.answer, at = excluded.at`)
        .run(meetupId, userId, answer, now());
    },
    rsvpsFor(meetupId) {
      return q(`SELECT r.answer, r.user_id, u.display FROM meetup_rsvps r
                JOIN users u ON u.id = r.user_id WHERE r.meetup_id = ?`).all(meetupId);
    },
    yesCount(meetupId) {
      return q(`SELECT COUNT(*) AS n FROM meetup_rsvps WHERE meetup_id = ? AND answer = 'yes'`)
        .get(meetupId).n;
    },
    confirmMeetup(id) {
      q(`UPDATE meetups SET status = 'on', confirmed_at = ? WHERE id = ? AND status = 'proposed'`)
        .run(now(), id);
    },
    cancelMeetup(id) {
      q(`UPDATE meetups SET status = 'cancelled' WHERE id = ?`).run(id);
    },

    // ---- moderation over circles ----
    circleOverview() {
      return q(`SELECT c.id, c.name, c.city, c.status, u.username AS host,
                       (SELECT COUNT(*) FROM circle_members cm WHERE cm.circle_id = c.id) AS members,
                       (SELECT COUNT(*) FROM circle_messages m WHERE m.circle_id = c.id AND m.kind = 'chat') AS messages,
                       (SELECT MAX(created_at) FROM circle_messages m WHERE m.circle_id = c.id) AS last_at,
                       (SELECT COUNT(*) FROM circle_applications a WHERE a.circle_id = c.id AND a.status = 'pending') AS pending
                FROM circles c JOIN users u ON u.id = c.host_id
                ORDER BY c.created_at ASC`).all();
    },

    // ---- sessions ----
    createSession(token, userId, ttlMs) {
      const t = now();
      q('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .run(token, userId, t, t + ttlMs);
    },
    sessionUser(token) {
      if (!token) return null;
      const row = q(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
                     WHERE s.token = ? AND s.expires_at > ?`).get(token, now());
      if (!row || row.suspended) return null;
      return row;
    },
    destroySession(token) {
      q('DELETE FROM sessions WHERE token = ?').run(token);
    },

    // ---- rate limiting ----
    note(who, kind) {
      q('INSERT INTO actions (who, kind, at) VALUES (?, ?, ?)').run(who, kind, now());
    },
    countSince(who, kind, sinceMs) {
      return q('SELECT COUNT(*) AS n FROM actions WHERE who = ? AND kind = ? AND at > ?')
        .get(who, kind, now() - sinceMs).n;
    },
    prune() {
      q('DELETE FROM actions WHERE at < ?').run(now() - 7 * 86400000);
      q('DELETE FROM sessions WHERE expires_at < ?').run(now());
    }
  };
  return S;
}

module.exports = { open, createStore, SCHEMA };
