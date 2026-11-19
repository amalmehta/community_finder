#!/usr/bin/env node
/* Snapshot the database safely.
 *
 * Copying a live SQLite file risks a torn copy; VACUUM INTO takes a consistent
 * snapshot while the server keeps running. Keeps the last 14 and prunes.
 *
 *   node tools/backup.js            → server/data/backups/<timestamp>.db
 *   node tools/backup.js <path>
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.join(__dirname, '..');
const SRC = process.env.DB || path.join(ROOT, 'server', 'data', 'community.db');
const KEEP = 14;

if (!fs.existsSync(SRC)) {
  console.error(`No database at ${SRC}. Nothing to back up.`);
  process.exit(1);
}

const dir = process.argv[2] || path.join(ROOT, 'server', 'data', 'backups');
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const out = path.join(dir, `community-${stamp}.db`);

const db = new DatabaseSync(SRC, { readOnly: true });
// The one tool guaranteed to be reading while the server is writing, and
// the only one that was not willing to wait for the lock: server/db.js sets
// this on every connection it opens, and this file does not go through it.
db.exec('PRAGMA busy_timeout = 10000;');
db.exec(`VACUUM INTO '${out.replace(/'/g, "''")}'`);
db.close();

// Read the snapshot back before trusting it. Pruning runs straight after
// this, so a backup that was written but is not readable would have taken a
// good one off the end of the list with it.
try {
  const check = new DatabaseSync(out, { readOnly: true });
  const r = check.prepare('PRAGMA quick_check').get();
  const users = check.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  check.close();
  const verdict = r && (r.quick_check || r['quick_check']);
  if (verdict !== 'ok') throw new Error('quick_check said: ' + verdict);
  console.log(`Verified: ${verdict}, ${users} user${users === 1 ? '' : 's'}.`);
} catch (e) {
  console.error(`Snapshot at ${out} did not read back: ${e.message}`);
  console.error('Keeping every older backup. Nothing pruned.');
  process.exit(1);
}

const size = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`Backed up to ${path.relative(process.cwd(), out)} (${size} KB)`);

// Prune, oldest first.
const old = fs.readdirSync(dir)
  .filter((f) => f.startsWith('community-') && f.endsWith('.db'))
  .sort()
  .slice(0, -KEEP);
old.forEach((f) => fs.unlinkSync(path.join(dir, f)));
if (old.length) console.log(`Pruned ${old.length} older backup${old.length === 1 ? '' : 's'} (keeping ${KEEP}).`);

// The -wal and -shm sidecars have to go with it. A clean stop checkpoints
// and removes them, so copying over the database alone usually works — but
// the time you restore from a backup is the time the server did not stop
// cleanly, and then a stale WAL is still sitting next to the file. SQLite
// replays what it finds, over the snapshot that was just put there.
const rel = (p) => path.relative(process.cwd(), p);
console.log(`\nRestore:  npm run stop \\
          && rm -f "${rel(SRC)}-wal" "${rel(SRC)}-shm" \\
          && cp "${rel(out)}" "${rel(SRC)}" \\
          && npm run start:bg`);
