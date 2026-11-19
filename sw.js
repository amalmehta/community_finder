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

// Bump this when the *behaviour* of this worker changes.
var VERSION = 'v2';

// A digest of what is *in* the shell files, not just which files there are.
//
// The fingerprint below covers the list, which catches a file being added and
// nothing else: edit styles.css or app.js and the cache keeps its name, so a
// device that installed the worker and then went offline holds that old copy
// indefinitely with nothing to say so. The only escape was to remember to
// bump VERSION by hand, which is the same thing that was already forgotten
// once — and the suite pinned the literal 'v1', so doing it failed CI.
//
// A worker cannot hash files at run time and this project has no build step,
// so the digest is stamped in by `npm run stamp` and checked by the suite:
// change a shell file and the tests say so, and one command fixes it.
var SHELL_HASH = 'si3mw2';

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
  'assets/apple-touch-icon.png',
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
  'src/dom.js',
  'src/preferences.js',
  'src/intake.js',
  'src/match.js',
  'src/art.js',
  'src/app.js',
  'src/social.js',
  'src/circles.js'
];

// The cache is named after the list above as well as the version, so a file
// added to the app cannot end up missing from a cache that still looks
// current. Bumping a number by hand was the plan, and the very first time the
// shell changed — src/dom.js, when the duplicated helpers were pulled out of
// the three front-end files — it was forgotten. A device that had installed
// the worker before that kept a cache named for a shell it no longer had.
//
// FNV-1a over the list: a worker has no synchronous hash, and all this has to
// do is differ when the list differs.
function fingerprint(s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h.toString(36);
}
var CACHE = 'fyc-shell-' + VERSION + '-' + fingerprint(SHELL.join('\n')) + '-' + SHELL_HASH;

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

/**
 * The cache entry a URL belongs under, or null if it is not part of the shell.
 *
 * The query string is dropped deliberately. A cache is a key-value store and
 * the key was the whole URL, so every distinct query string became an entry
 * of its own that nothing ever removed: '?tab=plan' from the installed
 * shortcut, a '?org=' link for each listing anyone opened, and — the one that
 * actually matters — '/verify?token=…', which wrote a single-use email
 * verification token into storage on the device and left it there. They are
 * all the same two files underneath. Keyed by path, the shell is the shell:
 * the same fourteen-odd entries however the app is entered, each one
 * refreshed rather than joined by a near-duplicate.
 */
var SHELL_URLS = null;
function shellKey(url) {
  if (!SHELL_URLS) {
    SHELL_URLS = Object.create(null);
    SHELL.forEach(function (p) { SHELL_URLS[new URL(p, self.location).href] = true; });
  }
  var bare = url.origin + url.pathname;
  return SHELL_URLS[bare] ? bare : null;
}

function putCopy(req, res) {
  // Opaque and error responses are not worth keeping, and caching a 404
  // would make a bad deploy permanent.
  if (!res || !res.ok || res.type === 'opaque') return res;
  var url;
  try { url = new URL(req.url); } catch (e) { return res; }
  var key = shellKey(url);
  if (!key) return res;
  var copy = res.clone();
  caches.open(CACHE).then(function (c) { c.put(key, copy); }).catch(function () {});
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

/**
 * Which pages came out of the cache, by the id of the page itself.
 *
 * The stopwatch above is per request, which quietly reintroduced the bug
 * network-first was chosen to avoid. On a connection that straddles 2500 ms,
 * index.html can win its race and come back fresh while eight of the
 * twenty-three scripts lose theirs and come back from the cache — new HTML
 * driving old JavaScript, by a different route.
 *
 * So a navigation records where it came from, and the subresources that
 * follow it go the same way the page did: a cached page is answered from the
 * cache throughout, which is both consistent and much faster than making
 * every one of those files wait out its own 2.5 seconds. A live page still
 * races, which is what keeps a deploy reaching people.
 *
 * Keyed by client, not held as one flag, because one worker serves every tab:
 * a second window open offline would otherwise pin a live window's scripts to
 * the cache, which is the same bug again with a smaller audience. The map is
 * swept when it grows, since a closed tab never tells us it has gone.
 */
var cachedClients = Object.create(null);
var cachedCount = 0;

function noteSource(id, fromTheCache) {
  if (!id) return;
  if (fromTheCache) {
    if (!cachedClients[id]) cachedCount++;
    cachedClients[id] = true;
    // Ask who is actually still open, and forget the rest.
    if (cachedCount > 20 && self.clients && self.clients.matchAll) {
      self.clients.matchAll({ type: 'window' }).then(function (open) {
        var live = Object.create(null);
        open.forEach(function (c) { if (cachedClients[c.id]) live[c.id] = true; });
        cachedClients = live;
        cachedCount = open.length;
      }).catch(function () {});
    }
  } else if (cachedClients[id]) {
    delete cachedClients[id];
    cachedCount--;
  }
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (!ours(url, req)) return;

  var navigating = req.mode === 'navigate';
  // A navigation's own id is resultingClientId: the page it is about to
  // become. Everything after it arrives under clientId, which is that page.
  var who = navigating ? (e.resultingClientId || e.clientId) : e.clientId;

  function fromCache() {
    // Look it up under the same key it was stored under, so '?tab=plan'
    // and a '?org=' link both find the page they are.
    return caches.match(shellKey(url) || req).then(function (hit) {
      if (hit) {
        if (navigating) noteSource(who, true);
        return hit;
      }
      // Any URL under the app opens the app: '?tab=plan' from the
      // installed shortcut has to work with the radio off, and it is not
      // a URL anything ever cached under that name.
      if (navigating) {
        return caches.match(new URL('index.html', self.location).href)
          .then(function (page) {
            if (page) noteSource(who, true);
            return page || Response.error();
          });
      }
      return Response.error();
    });
  }

  // A subresource of a page that came from the cache belongs to that page.
  if (!navigating && who && cachedClients[who]) {
    e.respondWith(fromCache().then(function (hit) {
      // Not in the shell — a file the cached page asks for and the cache
      // does not have. The network is the only place left to look.
      return hit && hit.type !== 'error' ? hit : raceNetwork(req).catch(fromCache);
    }));
    return;
  }

  e.respondWith(
    raceNetwork(req).then(function (res) {
      if (navigating) noteSource(who, false);
      return res;
    }, fromCache)
  );
});
