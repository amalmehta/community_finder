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
db.exec(`VACUUM INTO '${out.replace(/'/g, "''")}'`);
db.close();

const size = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`Backed up to ${path.relative(process.cwd(), out)} (${size} KB)`);

// Prune, oldest first.
const old = fs.readdirSync(dir)
  .filter((f) => f.startsWith('community-') && f.endsWith('.db'))
  .sort()
  .slice(0, -KEEP);
old.forEach((f) => fs.unlinkSync(path.join(dir, f)));
if (old.length) console.log(`Pruned ${old.length} older backup${old.length === 1 ? '' : 's'} (keeping ${KEEP}).`);

console.log(`\nRestore:  npm run stop && cp "${path.relative(process.cwd(), out)}" "${path.relative(process.cwd(), SRC)}" && npm run start:bg`);
