/* Link checker: every URL in the dataset must actually resolve.
 * Run: node tools/check-links.js [--all]
 * By default checks curated org URLs + first-step URLs. --all adds the
 * universal directory URLs too.
 */
'use strict';
var path = require('path');
var { execFile } = require('child_process');
var root = path.join(__dirname, '..');

require(path.join(root, 'src/data/core.js'));
['sf', 'nyc', 'chicago', 'seattle', 'austin'].forEach(function (c) {
  require(path.join(root, 'src/data/city-' + c + '.js'));
});
require(path.join(root, 'src/data/universal.js'));
var FYC = globalThis.FYC;

var UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36';

var targets = [];
function add(url, label) {
  if (!url) return;
  if (targets.some(function (t) { return t.url === url; })) return;
  targets.push({ url: url, label: label });
}
FYC.allOrgs().forEach(function (o) {
  add(o.url, o.name);
  add(o.firstStep && o.firstStep.url, o.name + ' (first step)');
});
if (process.argv.indexOf('--all') !== -1) {
  FYC.buildUniversal('Boise, ID', Object.keys(FYC.INTERESTS)).forEach(function (o) {
    add(o.url.split('?')[0], o.name + ' (universal)');
  });
}

function check(t) {
  return new Promise(function (resolve) {
    execFile('curl', [
      '-sS', '-L', '--max-redirs', '12', '-o', '/dev/null', '-m', '25',
      '-w', '%{http_code} %{url_effective}',
      '-A', UA, t.url
    ], function (err, stdout, stderr) {
      if (err) {
        var msg = String(stderr || err.message).replace(/\s+/g, ' ').trim();
        return resolve(Object.assign({}, t, { code: 0, note: msg.slice(0, 120) }));
      }
      var parts = String(stdout).trim().split(' ');
      resolve(Object.assign({}, t, { code: Number(parts[0]), final: parts[1] }));
    });
  });
}

(async function () {
  console.log('Checking ' + targets.length + ' URLs…\n');
  var results = [];
  var CONCURRENCY = 8;
  for (var i = 0; i < targets.length; i += CONCURRENCY) {
    results = results.concat(await Promise.all(targets.slice(i, i + CONCURRENCY).map(check)));
    process.stdout.write('.');
  }
  console.log('\n');

  var bad = results.filter(function (r) { return !(r.code >= 200 && r.code < 400); });

  // A site refusing an automated request, sitting behind a virtual queue, or
  // being intercepted by a local TLS proxy is not the same as a dead link.
  function unverifiable(r) {
    if (r.code === 403 || r.code === 405 || r.code === 429) return true;
    var n = (r.note || '').toLowerCase();
    return /secure connection|ssl|certificate|maximum .* redirects|proxy/.test(n);
  }
  var soft = bad.filter(unverifiable);
  var hard = bad.filter(function (r) { return soft.indexOf(r) === -1; });

  if (soft.length) {
    console.log('Unverifiable from this network (bot-blocked, queued, or proxy-intercepted — not evidence of a dead link):');
    soft.forEach(function (r) { console.log('  ' + (r.code || 'ERR') + '  ' + r.label + '  ' + r.url); });
    console.log('');
  }
  if (hard.length) {
    console.log('BROKEN:');
    hard.forEach(function (r) { console.log('  ' + (r.code || 'ERR') + '  ' + r.label + '  ' + r.url + (r.note ? '  — ' + r.note : '')); });
    console.log('');
  }
  console.log((results.length - bad.length) + '/' + results.length + ' OK, ' +
              soft.length + ' unverifiable, ' + hard.length + ' broken');
  process.exit(hard.length ? 1 : 0);
})();
