#!/usr/bin/env node
/* Start/stop the server as a detached background process.
 *
 * Running it in a terminal tab means it dies whenever that tab is closed,
 * reused or interrupted. This keeps it alive independently, with a pid file
 * and a log you can tail.
 *
 *   node tools/server-daemon.js start|stop|status|log
 */
'use strict';
const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'server', 'data');
const PID_FILE = path.join(DIR, 'server.pid');
const LOG_FILE = path.join(DIR, 'server.log');
const PORT = process.env.PORT || 4000;

function running() {
  if (!fs.existsSync(PID_FILE)) return 0;
  const pid = Number(fs.readFileSync(PID_FILE, 'utf8').trim());
  if (!pid) return 0;
  try { process.kill(pid, 0); return pid; } catch (e) { return 0; }
}

function portHolder() {
  try {
    return execSync(`lsof -ti :${PORT}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim().split('\n').filter(Boolean);
  } catch (e) { return []; }
}

const cmd = process.argv[2] || 'status';

if (cmd === 'start') {
  const pid = running();
  if (pid) {
    console.log(`Already running (pid ${pid}) on port ${PORT}.`);
    process.exit(0);
  }
  const others = portHolder();
  if (others.length) {
    console.error(`Port ${PORT} is held by pid ${others.join(', ')} — not ours.\n` +
                  `  Stop it:  kill ${others.join(' ')}\n` +
                  `  Or:       PORT=4001 node tools/server-daemon.js start`);
    process.exit(1);
  }

  fs.mkdirSync(DIR, { recursive: true });
  const out = fs.openSync(LOG_FILE, 'a');
  const child = spawn(process.execPath, [path.join(ROOT, 'server', 'app.js')], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', out, out],
    env: Object.assign({}, process.env, { PORT: String(PORT) })
  });
  child.unref();
  fs.writeFileSync(PID_FILE, String(child.pid));
  console.log(`Started (pid ${child.pid}) on http://localhost:${PORT}`);
  console.log(`  log:  ${path.relative(ROOT, LOG_FILE)}`);
  console.log(`  stop: npm run stop`);
  process.exit(0);
}

if (cmd === 'stop') {
  const pid = running();
  if (!pid) {
    console.log('Not running.');
    try { fs.unlinkSync(PID_FILE); } catch (e) { /* fine */ }
    process.exit(0);
  }
  // SIGTERM, then wait for it to actually go. This used to print 'Stopped'
  // the instant the signal was sent, so anything chained after it with &&
  // raced the shutdown — including the restore that tools/backup.js prints,
  // which copies a file the server may still have open.
  process.kill(pid, 'SIGTERM');
  const deadline = Date.now() + 10000;
  let gone = false;
  while (Date.now() < deadline) {
    try { process.kill(pid, 0); } catch (e) { gone = true; break; }
    // No sleep() in a sync script; a short blocking wait is what this needs.
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  }
  try { fs.unlinkSync(PID_FILE); } catch (e) { /* fine */ }
  if (gone) {
    console.log(`Stopped (pid ${pid}).`);
    process.exit(0);
  }
  console.error(`pid ${pid} did not stop within 10s. Still running; not removing anything it holds.`);
  process.exit(1);
}

if (cmd === 'log') {
  if (!fs.existsSync(LOG_FILE)) { console.log('No log yet.'); process.exit(0); }
  console.log(fs.readFileSync(LOG_FILE, 'utf8').split('\n').slice(-40).join('\n'));
  process.exit(0);
}

const pid = running();
console.log(pid ? `Running (pid ${pid}) on port ${PORT}.` : 'Not running.');
const others = portHolder().filter((p) => Number(p) !== pid);
if (others.length) console.log(`Also on port ${PORT}: ${others.join(', ')}`);
