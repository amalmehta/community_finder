#!/usr/bin/env node
/* Moderation console.
 *
 * Reports are only worth collecting if a person reads them. This is that
 * person's tool: list what is open, look at a conversation that was reported,
 * suspend an account, and mark the report resolved with a note.
 *
 *   node tools/moderate.js reports
 *   node tools/moderate.js user <username>
 *   node tools/moderate.js suspend <username> [reason]
 *   node tools/moderate.js unsuspend <username>
 *   node tools/moderate.js resolve <report-id> [note]
 */
'use strict';
const path = require('node:path');
const { open, createStore } = require(path.join(__dirname, '..', 'server', 'db.js'));

const FILE = process.env.DB || path.join(__dirname, '..', 'server', 'data', 'community.db');
const store = createStore(open(FILE));
const [cmd, arg1, ...rest] = process.argv.slice(2);
const when = (ms) => (ms ? new Date(ms).toISOString().replace('T', ' ').slice(0, 16) : '—');

function userByName(name) {
  const u = store.userByName(String(name || ''));
  if (!u) {
    console.error(`No user "${name}".`);
    process.exit(1);
  }
  return u;
}

if (cmd === 'reports') {
  const open_ = store.openReports();
  const counts = store.reportCounts();
  console.log(`${counts.open} open, ${counts.total} total, ${counts.suspended} suspended\n`);
  if (!open_.length) {
    console.log('Nothing to review.');
    process.exit(0);
  }
  open_.forEach((r) => {
    console.log(`#${r.id}  ${when(r.created_at)}`);
    console.log(`  ${r.reporter} reported ${r.reported}${r.suspended ? ' (already suspended)' : ''}`);
    console.log(`  reason: ${r.reason}`);
    if (r.detail) console.log(`  detail: ${r.detail}`);
    console.log(`  → node tools/moderate.js user ${r.reported}`);
    console.log(`  → node tools/moderate.js suspend ${r.reported} "<reason>"`);
    console.log(`  → node tools/moderate.js resolve ${r.id} "<what you did>"\n`);
  });
  process.exit(0);
}

if (cmd === 'user') {
  const u = userByName(arg1);
  const interests = store.interestsOf(u.id).map((i) => i.interest + (i.visible ? '' : ' (hidden)'));
  console.log(`${u.display} (@${u.username})${u.suspended ? '  [SUSPENDED]' : ''}`);
  console.log(`  joined ${when(u.created_at)}, last seen ${when(u.last_seen)}`);
  console.log(`  city: ${u.city || '—'}   email: ${u.email || '—'}${u.email_verified ? ' (verified)' : ''}`);
  console.log(`  bio: ${u.bio || '—'}`);
  console.log(`  interests: ${interests.join(', ') || '—'}`);
  const sent = store.db.prepare('SELECT COUNT(*) AS n FROM connections WHERE from_id = ?').get(u.id).n;
  const msgs = store.db.prepare('SELECT COUNT(*) AS n FROM messages WHERE sender_id = ?').get(u.id).n;
  const against = store.db.prepare('SELECT COUNT(*) AS n FROM reports WHERE reported_id = ?').get(u.id).n;
  console.log(`  ${sent} conversations started, ${msgs} messages sent, ${against} reports against`);
  process.exit(0);
}

if (cmd === 'suspend' || cmd === 'unsuspend') {
  const u = userByName(arg1);
  const on = cmd === 'suspend';
  store.setSuspended(u.id, on);
  console.log(on
    ? `Suspended @${u.username}. Sessions ended, removed from discovery.${rest.length ? ' Reason: ' + rest.join(' ') : ''}`
    : `Unsuspended @${u.username}. They will need to sign in again.`);
  process.exit(0);
}

if (cmd === 'resolve') {
  const id = Number(arg1);
  if (!id) { console.error('Usage: resolve <report-id> [note]'); process.exit(1); }
  store.resolveReport(id, rest.join(' '));
  console.log(`Report #${id} marked resolved.`);
  process.exit(0);
}

console.log(`Moderation console

  node tools/moderate.js reports                     what needs reviewing
  node tools/moderate.js user <username>             who they are, what they have done
  node tools/moderate.js suspend <username> [reason] end sessions, hide from discovery
  node tools/moderate.js unsuspend <username>
  node tools/moderate.js resolve <id> [note]         close a report

Reads ${path.relative(process.cwd(), FILE)} (override with DB=...).`);
