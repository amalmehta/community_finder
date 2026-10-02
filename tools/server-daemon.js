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
  process.kill(pid);
  try { fs.unlinkSync(PID_FILE); } catch (e) { /* fine */ }
  console.log(`Stopped (pid ${pid}).`);
  process.exit(0);
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
