#!/usr/bin/env node
/* Stamp the shell digest into sw.js.
 *
 *   node tools/stamp.js          write it
 *   node tools/stamp.js --check  exit 1 if it is out of date, change nothing
 *
 * Why this exists. The service worker names its cache after the *list* of
 * files it holds, which changes when a file is added and not when one is
 * edited. So a device that installed the worker and then lost signal kept
 * whatever styles.css and app.js it had on the day, with nothing to say so
 * and nothing to make it look again. Bumping a version by hand was the plan,
 * and it was forgotten the first time the shell changed.
 *
 * A worker has no synchronous hash and no filesystem, and this project has no
 * build step, so the digest cannot be computed where it is used. It is
 * stamped in here instead, and the test suite checks it — change a shell file
 * and the suite says so, and `npm run stamp` fixes it in one command.
 *
 * The same FNV-1a as sw.js, over the bytes of every file in SHELL, so the two
 * halves of this agree on what a digest is.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SW = path.join(ROOT, 'sw.js');

/** The SHELL array, read out of sw.js rather than kept in step by hand. */
function shellOf(src) {
  const block = src.slice(src.indexOf('var SHELL = ['), src.indexOf('];', src.indexOf('var SHELL = [')));
  return (block.match(/'([^']+)'/g) || []).map((s) => s.slice(1, -1));
}

function fnv1a(bytes) {
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return (h >>> 0).toString(36);
}

/** A digest of the contents of every shell file, in list order. */
function digest(shell) {
  const parts = [];
  shell.forEach((rel) => {
    // './' is index.html under another name; it is already in the list.
    if (rel === './') return;
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
      console.error(`sw.js lists ${rel}, which does not exist.`);
      process.exit(1);
    }
    parts.push(Buffer.from(rel + '\0'));
    parts.push(fs.readFileSync(file));
    parts.push(Buffer.from('\0'));
  });
  return fnv1a(Buffer.concat(parts));
}

const src = fs.readFileSync(SW, 'utf8');
const want = digest(shellOf(src));
const have = (src.match(/var SHELL_HASH = '([^']*)'/) || [])[1];

if (process.argv.includes('--check')) {
  if (have === want) {
    console.log(`sw.js shell digest is current (${want}).`);
    process.exit(0);
  }
  console.error(`sw.js shell digest is ${have}, should be ${want}.\n  Fix it:  npm run stamp`);
  process.exit(1);
}

if (have === want) {
  console.log(`Already current (${want}).`);
  process.exit(0);
}
fs.writeFileSync(SW, src.replace(/var SHELL_HASH = '[^']*'/, `var SHELL_HASH = '${want}'`));
console.log(`sw.js shell digest ${have} → ${want}`);
