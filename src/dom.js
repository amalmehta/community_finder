/* community_finder — the handful of helpers every screen needs.
 *
 * app.js, social.js and circles.js each carried their own copy of these. The
 * comment on one of them said the duplication was deliberate, so that no
 * feature file depended on another, and that reasoning is right — but three
 * copies of a function is three functions, and these had already drifted
 * into being different:
 *
 *   - el() grew an `html` branch in app.js and nowhere else, which was an
 *     innerHTML sink nothing used
 *   - ago() answered '' for a missing timestamp in one file and 'never' in
 *     the other
 *
 * So they live here instead. No feature file depends on another; they all
 * depend on this, the way they already all depend on core.js and art.js.
 */
(function (g) {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /**
   * Build an element. `text` sets textContent, `on*` adds a listener, true
   * sets a bare attribute, and null/false/undefined leave it off entirely.
   * Children that are null or false are dropped, so a caller can write
   * `cond ? node : null` inline.
   *
   * There is deliberately no way to pass markup. Everything in this app that
   * reaches a screen has been typed by somebody — a message, a bio, a circle
   * name — and textContent is what keeps that text rather than running it.
   */
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), props[k]);
      else if (props[k] === true) n.setAttribute(k, '');
      else if (props[k] !== false && props[k] != null) n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  /** The same, namespaced, for the charts and the drawn half. */
  function svg(tag, props, kids) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'text') n.textContent = props[k];
      else if (props[k] != null) n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  // ---------- talking to the server ----------

  /**
   * Where the API lives, relative to the page rather than the host.
   *
   * Every call site writes '/api/me', which asks the host's root. Served from
   * a subdirectory — which is how GitHub Pages serves this — that is a path
   * this app does not own, and on a user site it belongs to whatever else is
   * published there. Resolving against the document's own base keeps every
   * request inside the app, the same way sw.js keeps its scope inside it.
   *
   * baseURI is safe to trust here: the content policy sets base-uri 'none',
   * so nothing injected into the page can move it and redirect these calls.
   */
  function apiUrl(route) {
    var rel = String(route).replace(/^\/+/, '');
    try { return new URL(rel, document.baseURI).href; } catch (e) { return '/' + rel; }
  }

  // Long enough for a slow phone on a train, short enough that a request
  // which is never going to answer stops being something the person waits on
  // with no way to tell whether it is working.
  var TIMEOUT = 15000;

  function api(method, route, body) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : null;
    return fetch(apiUrl(route), {
      method: method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok) throw new Error((data && data.error) || ('Request failed (' + res.status + ')'));
        return data;
      });
    }, function (e) {
      // fetch rejects with the browser's own wording — 'Failed to fetch',
      // 'Load failed', 'NetworkError when attempting to fetch resource'. All
      // three reach the screen through the same catch, and none of them is a
      // sentence anyone should be shown. The app works offline now, so this
      // is a state people will actually be in.
      if (e && e.name === 'AbortError') {
        throw new Error('That is taking too long. Try again in a moment.');
      }
      throw new Error(navigator.onLine === false
        ? 'You are offline, so this could not be sent.'
        : 'Could not reach the server. Check your connection and try again.');
    }).then(function (data) {
      if (timer) clearTimeout(timer);
      return data;
    }, function (e) {
      if (timer) clearTimeout(timer);
      throw e;
    });
  }

  /**
   * Arrow-key movement inside a role="tablist".
   *
   * There are three of these — the app bar, and the segmented control at the
   * head of Inbox and of an open circle — and none of them answered an arrow
   * key. Declaring role="tablist" is a promise that they will: it is the one
   * thing the ARIA practices say a tablist must do, and it is how anyone
   * driving the app from the keyboard expects to cross a strip of tabs. The
   * result rows, which are not a tablist, already had roving navigation.
   *
   * Left/Right move, Home/End jump to the ends, and the strip wraps, which
   * is what makes a five-tab bar quick rather than a counting exercise.
   *
   * Every tab stays in the tab order. The practices ask for a roving
   * tabindex as well, so Tab passes the whole strip in one go, but that has
   * to be kept in step with every way the selection can change — and a
   * roving tabindex that falls out of step leaves nothing in the strip
   * reachable by Tab at all. Five stops is a smaller problem than none.
   */
  function wireTablist(strip) {
    if (!strip) return;
    strip.addEventListener('keydown', function (e) {
      var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      var tabs = $$('[role="tab"]', strip).filter(function (t) { return !t.hidden; });
      if (!tabs.length) return;
      var at = tabs.indexOf(document.activeElement);
      if (at === -1) return;
      var to;
      if (step) to = (at + step + tabs.length) % tabs.length;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = tabs.length - 1;
      else return;
      e.preventDefault();
      // Focus follows selection here, which is the pattern's default and the
      // right one for panels this cheap to render.
      tabs[to].focus();
      tabs[to].click();
    });
  }

  // ---------- small shared formatting ----------

  function label(id) {
    var FYC = g.FYC || {};
    return ((FYC.INTERESTS || {})[id] || {}).label || id;
  }

  /**
   * '3m ago'. `missing` is what to say with no timestamp at all: the two
   * copies of this disagreed about that, and the answer depends on the
   * sentence it lands in — 'quiet since never' reads, 'active ' does not.
   */
  function ago(ts, missing) {
    if (!ts) return missing || '';
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  g.FYC_DOM = {
    $: $, $$: $$, el: el, svg: svg,
    api: api, apiUrl: apiUrl, API_TIMEOUT: TIMEOUT,
    wireTablist: wireTablist,
    label: label, ago: ago
  };
}(typeof window !== 'undefined' ? window : globalThis));
