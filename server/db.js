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
`;

// Columns added after the first release. Existing databases are migrated in
// place rather than rebuilt, so nobody loses their messages to an upgrade.
const ADDED_COLUMNS = [
  ['users', 'email', "TEXT NOT NULL DEFAULT ''"],
  ['users', 'email_verified', 'INTEGER NOT NULL DEFAULT 0'],
  ['users', 'open_to_direct', 'INTEGER NOT NULL DEFAULT 1']
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
      return row || null;
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
