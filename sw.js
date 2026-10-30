/* community_finder — service worker.
 *
 * The app already holds everything it needs: the listings are JavaScript
 * files, the matching runs in the browser, and what you saved is in
 * localStorage. The only reason it ever needed the network was to fetch its
 * own files. So the one moment it was most likely to fail was the moment it
 * was most useful — standing outside the place, phone in hand, no signal,
 * wanting the first step it told you about.
 *
 * This caches the whole app on the first visit and falls back to that copy
 * whenever the network cannot answer in time. Nothing third-party is touched,
 * nothing is sent anywhere, and the API is deliberately left alone: a stale
 * answer about who is in a circle is worse than no answer.
 */
'use strict';

// Bump this to retire every old cache on the next load. It is the only thing
// that has to change when the shell below changes.
var VERSION = 'v1';
var CACHE = 'fyc-shell-' + VERSION;

// Where the app lives, read off this file rather than assumed: it is served
// from a subdirectory on GitHub Pages and from the root by the Node server,
// and an absolute '/index.html' is wrong in the first case.
var BASE = new URL('./', self.location).pathname;

// Every file the app loads, in one list. A test asserts each one exists and
// that nothing index.html pulls in is missing from it — which is what makes
// the all-or-nothing install below safe. A half-cached app that boots and
// then fails on a missing city is worse than one that stayed online.
var SHELL = [
  './',
  'index.html',
  'privacy.html',
  'terms.html',
  'site.webmanifest',
  'assets/styles.css',
  'assets/icon.svg',
  'src/data/core.js',
  'src/data/city-sf.js',
  'src/data/city-nyc.js',
  'src/data/city-chicago.js',
  'src/data/city-seattle.js',
  'src/data/city-austin.js',
  'src/data/city-boston.js',
  'src/data/city-philadelphia.js',
  'src/data/city-dc.js',
  'src/data/city-la.js',
  'src/data/city-sandiego.js',
  'src/data/city-denver.js',
  'src/data/city-portland.js',
  'src/data/city-minneapolis.js',
  'src/data/universal.js',
  'src/preferences.js',
  'src/intake.js',
  'src/match.js',
  'src/art.js',
  'src/app.js',
  'src/social.js',
  'src/circles.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // cache: 'reload' so the install reads from the network rather than
      // picking up whatever the HTTP cache happens to be holding. Otherwise
      // the first worker can precache the files it was meant to replace.
      return c.addAll(SHELL.map(function (p) {
        return new Request(new URL(p, self.location), { cache: 'reload' });
      }));
    }).then(function () {
      // Don't sit in waiting until every tab closes. All of this app's
      // scripts load in one go at boot, so there is no half-new page to
      // create: the open tab keeps the code it already has and the next
      // reload gets the new everything.
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE && k.indexOf('fyc-shell-') === 0) return caches.delete(k);
        return null;
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/** Whether this is one of ours, and safe to answer from a cache. */
function ours(url, req) {
  if (req.method !== 'GET') return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.indexOf(BASE) !== 0) return false;
  // The server half. Accounts, circles and messages are shared state, and a
  // cached copy of shared state is a lie with a timestamp on it.
  if (url.pathname.indexOf(BASE + 'api/') === 0) return false;
  return true;
}

function putCopy(req, res) {
  // Opaque and error responses are not worth keeping, and caching a 404
  // would make a bad deploy permanent.
  if (!res || !res.ok || res.type === 'opaque') return res;
  var copy = res.clone();
  caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
  return res;
}

/**
 * Race the network against a stopwatch.
 *
 * Network-first, not cache-first, and the reason is in server/app.js: a
 * deploy that hands people new HTML driving old JavaScript was a real bug
 * here once, and serving the page live while answering its scripts from a
 * cache would reintroduce it on every deploy. So the live copy wins whenever
 * there is one.
 *
 * The stopwatch is there because plain network-first makes a bad connection
 * worse than no worker at all — a request that will fail in thirty seconds
 * blocks a file already sitting on the device. Which is the bus this whole
 * thing is for. A fetch that loses the race still finishes and still updates
 * the cache; it just stops being what the page waits on.
 */
var NET_WAIT = 2500;

function raceNetwork(req) {
  return new Promise(function (resolve, reject) {
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      reject(new Error('slow'));
    }, NET_WAIT);
    fetch(req).then(function (res) {
      putCopy(req, res);
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(res);
    }, function (err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (!ours(url, req)) return;

  e.respondWith(
    raceNetwork(req).catch(function () {
      return caches.match(req).then(function (hit) {
        if (hit) return hit;
        // Any URL under the app opens the app: '?tab=plan' from the
        // installed shortcut has to work with the radio off, and it is not
        // a URL anything ever cached under that name.
        if (req.mode === 'navigate') {
          return caches.match(new URL('index.html', self.location).href)
            .then(function (page) { return page || Response.error(); });
        }
        return Response.error();
      });
    })
  );
});
