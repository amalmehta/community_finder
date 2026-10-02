/* community_finder — on-device preference tracker.
 *
 * Watches what someone actually does (expands, opens, saves, ticks off) rather
 * than only what they tick in the form, and turns it into a weighted profile
 * the matcher can lean on.
 *
 * Everything lives in this browser. Nothing is sent anywhere, the raw log is
 * visible on the You tab, and it can be paused or erased at any time.
 */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./data/core.js');

  var KEY = 'fyc.prefs.v1';
  var MAX_EVENTS = 400;
  var HALF_LIFE_DAYS = 45;      // older actions count for less
  var MIN_EVENTS = 4;           // below this we don't presume to know anything

  // What each action says about how much someone liked a listing.
  var WEIGHTS = {
    expand: 1,      // opened the first-step panel
    open: 2,        // followed the link to the organisation
    copy: 3,        // copied the message to send — real intent
    plan: 4,        // saved it
    step: 3,        // ticked off one of the plan steps
    unplan: -3,     // removed it again
    skip: -1        // explicitly dismissed
  };

  // Storage is injectable so the engine can be tested without a browser.
  var store = {
    get: function () {
      try { return localStorage.getItem(KEY); } catch (e) { return null; }
    },
    set: function (v) {
      try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ }
    }
  };

  function blank() {
    return { enabled: true, events: [] };
  }

  function load() {
    try {
      var raw = store.get();
      if (!raw) return blank();
      var d = JSON.parse(raw);
      if (!d || !Array.isArray(d.events)) return blank();
      if (typeof d.enabled !== 'boolean') d.enabled = true;
      return d;
    } catch (e) { return blank(); }
  }

  function save(d) {
    try { store.set(JSON.stringify(d)); } catch (e) { /* ignore */ }
  }

  /** Recency weight: an action halves in influence every HALF_LIFE_DAYS. */
  function recency(at, now) {
    var days = Math.max(0, (now - at) / 86400000);
    return Math.pow(0.5, days / HALF_LIFE_DAYS);
  }

  var prefs = {};

  prefs.ACTION_WEIGHTS = WEIGHTS;
  prefs.MIN_EVENTS = MIN_EVENTS;
  prefs._setStore = function (s) { store = s; };   // tests only

  prefs.isEnabled = function () { return load().enabled !== false; };

  prefs.setEnabled = function (on) {
    var d = load();
    d.enabled = !!on;
    save(d);
    return d.enabled;
  };

  prefs.clear = function () {
    var d = load();
    save({ enabled: d.enabled, events: [] });
  };

  prefs.raw = function () { return load(); };

  /**
   * Record one action against a listing.
   * Stores only the attributes the matcher uses — never the listing's text.
   */
  prefs.record = function (type, org, now) {
    if (!WEIGHTS.hasOwnProperty(type) || !org) return null;
    var d = load();
    if (d.enabled === false) return null;

    d.events.push({
      t: type,
      at: now || Date.now(),
      id: org.id,
      i: (org.interests || []).slice(0, 8),
      c: org.cost,
      ge: org.gentleness,
      so: org.solo,
      st: org.structure,
      cm: org.commitment,
      u: !!org.universal
    });
    if (d.events.length > MAX_EVENTS) d.events = d.events.slice(-MAX_EVENTS);
    save(d);
    return d.events.length;
  };

  function weightedMean(pairs) {
    var num = 0, den = 0;
    pairs.forEach(function (p) {
      if (p[1] <= 0 || p[0] == null) return;
      num += p[0] * p[1];
      den += p[1];
    });
    return den ? num / den : null;
  }

  /**
   * Build the profile. Positive actions pull the averages toward what someone
   * engages with; negative actions only subtract from interest affinity, since
   * "I removed this" is weak evidence about cost or gentleness.
   */
  prefs.profile = function (now) {
    now = now || Date.now();
    var d = load();
    var evs = d.events || [];

    var interests = {};
    var gentle = [], cost = [], solo = [];
    var structure = {}, commitment = {};
    var positive = 0, total = 0;

    evs.forEach(function (e) {
      var w = (WEIGHTS[e.t] || 0) * recency(e.at, now);
      if (!w) return;
      total += Math.abs(w);
      (e.i || []).forEach(function (id) {
        interests[id] = (interests[id] || 0) + w;
      });
      if (w > 0) {
        positive += w;
        gentle.push([e.ge, w]);
        cost.push([e.c, w]);
        solo.push([e.so, w]);
        if (e.st) structure[e.st] = (structure[e.st] || 0) + w;
        if (e.cm) commitment[e.cm] = (commitment[e.cm] || 0) + w;
      }
    });

    // Normalise interest affinity to -1..1 against the strongest signal.
    var peak = 0;
    Object.keys(interests).forEach(function (k) {
      peak = Math.max(peak, Math.abs(interests[k]));
    });
    var affinity = {};
    Object.keys(interests).forEach(function (k) {
      affinity[k] = peak ? interests[k] / peak : 0;
    });

    var ranked = Object.keys(affinity).sort(function (a, b) {
      return affinity[b] - affinity[a];
    });

    return {
      enabled: d.enabled !== false,
      count: evs.length,
      // Confidence ramps up over the first ~20 meaningful actions.
      confidence: Math.max(0, Math.min(1, (evs.length - MIN_EVENTS) / 20)),
      ready: evs.length >= MIN_EVENTS,
      affinity: affinity,
      top: ranked.filter(function (k) { return affinity[k] > 0.15; }).slice(0, 6),
      avoided: ranked.filter(function (k) { return affinity[k] < -0.15; }).reverse().slice(0, 3),
      gentleness: weightedMean(gentle),
      cost: weightedMean(cost),
      solo: weightedMean(solo),
      structure: structure,
      commitment: commitment,
      weight: positive
    };
  };

  /**
   * How well a listing fits the learned profile, 0..1 (0.5 = no opinion).
   * Deliberately gentle: this nudges the ranking, it does not drive it.
   */
  prefs.fit = function (org, profile) {
    if (!profile || !profile.ready) return 0.5;

    var scores = [];

    var ints = (org.interests || []).map(function (id) {
      return profile.affinity[id];
    }).filter(function (v) { return typeof v === 'number'; });
    if (ints.length) {
      var best = Math.max.apply(null, ints);
      scores.push([(best + 1) / 2, 2]);          // -1..1 → 0..1, double weight
    }

    if (profile.gentleness != null && org.gentleness != null) {
      scores.push([1 - Math.abs(org.gentleness - profile.gentleness) / 4, 1]);
    }
    if (profile.cost != null && org.cost != null) {
      scores.push([1 - Math.abs(org.cost - profile.cost) / 2, 1]);
    }
    if (profile.solo != null && org.solo != null) {
      scores.push([1 - Math.abs(org.solo - profile.solo) / 4, 0.5]);
    }

    if (!scores.length) return 0.5;
    var num = 0, den = 0;
    scores.forEach(function (s) { num += s[0] * s[1]; den += s[1]; });
    return Math.max(0, Math.min(1, num / den));
  };

  /** One plain sentence describing what has been learned, or null. */
  prefs.summary = function (profile) {
    if (!profile || !profile.ready) return null;
    var bits = [];
    if (profile.top.length) {
      bits.push('you keep going back to ' + profile.top.slice(0, 2).map(function (id) {
        return ((FYC.INTERESTS[id] || {}).label || id).toLowerCase();
      }).join(' and '));
    }
    if (profile.gentleness != null) {
      bits.push(profile.gentleness >= 4.3 ? 'and you pick the gentlest options'
        : profile.gentleness <= 3.2 ? 'and you are not put off by the intense ones'
        : 'and you are comfortable with a bit of pressure');
    }
    if (profile.cost != null && profile.cost < 0.4) bits.push('almost always free');
    return bits.length ? bits.join(', ') : null;
  };

  FYC.prefs = prefs;
  if (typeof module !== 'undefined' && module.exports) module.exports = prefs;
})(typeof globalThis !== 'undefined' ? globalThis : this);
