/* community_finder — test suite. Plain Node, no dependencies.
 * Run: node tests/run-tests.js
 */
'use strict';
var path = require('path');
var root = path.join(__dirname, '..');

require(path.join(root, 'src/data/core.js'));
['sf', 'nyc', 'chicago', 'seattle', 'austin', 'boston', 'philadelphia', 'dc', 'la', 'sandiego'].forEach(function (c) {
  require(path.join(root, 'src/data/city-' + c + '.js'));
});
require(path.join(root, 'src/data/universal.js'));
require(path.join(root, 'src/preferences.js'));
require(path.join(root, 'src/match.js'));
var FYC = globalThis.FYC;

var pass = 0, fail = 0, failures = [];
function ok(cond, name) {
  if (cond) { pass++; } else { fail++; failures.push(name); }
}
function eq(a, b, name) { ok(a === b, name + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function group(name, fn) { console.log('\n— ' + name); fn(); }

// ---------------------------------------------------------------- data shape
group('curated data integrity', function () {
  var orgs = FYC.allOrgs();
  ok(orgs.length >= 160, 'at least 160 curated organisations (' + orgs.length + ')');

  var ids = {};
  orgs.forEach(function (o) {
    var n = o.name || o.id;
    ok(!!o.id && !ids[o.id], n + ': unique id');
    ids[o.id] = true;
    ok(typeof o.name === 'string' && o.name.length > 1, n + ': has a name');
    ok(typeof o.blurb === 'string' && o.blurb.length > 40, n + ': has a real blurb');
    ok(/^https:\/\//.test(o.url), n + ': https url');
    ok(Array.isArray(o.interests) && o.interests.length > 0, n + ': has interests');
    o.interests.forEach(function (i) {
      ok(!!FYC.INTERESTS[i], n + ': interest "' + i + '" exists in the taxonomy');
    });
    ok(!!o.firstStep && !!o.firstStep.label, n + ': has a first step label');
    ok(/^https:\/\//.test(o.firstStep.url || ''), n + ': first step has an https url');
    // Two is the floor: some listings simply have fewer logistics worth stating,
    // and padding them back out would mean reintroducing filler.
    ok(Array.isArray(o.expect) && o.expect.length >= 2, n + ': at least 2 what-to-expect bullets');
    ok(o.cost === 0 || o.cost === 1 || o.cost === 2, n + ': cost is 0/1/2');
    ok(o.solo >= 1 && o.solo <= 5, n + ': solo rating in range');
    ok(o.gentleness >= 1 && o.gentleness <= 5, n + ': gentleness rating in range');
    ok(FYC.STRUCTURE.indexOf(o.structure) !== -1, n + ': structure "' + o.structure + '" is known');
    ok(FYC.COMMITMENT.indexOf(o.commitment) !== -1, n + ': commitment "' + o.commitment + '" is known');
    (o.when || []).forEach(function (w) { ok(FYC.WHEN.indexOf(w) !== -1, n + ': when "' + w + '" is known'); });
    (o.goals || []).forEach(function (gl) { ok(FYC.GOALS.indexOf(gl) !== -1, n + ': goal "' + gl + '" is known'); });
    // Listings no longer ship pre-written messages for people to send.
    ok(!o.script, n + ': carries no pre-written message');
  });

  // Every interest in the taxonomy should be reachable somewhere, or the UI
  // offers a pill that can never match anything.
  var covered = {};
  orgs.forEach(function (o) { o.interests.forEach(function (i) { covered[i] = true; }); });
  FYC.RECIPES.forEach(function (r) { (r.interests || []).forEach(function (i) { covered[i] = true; }); });
  Object.keys(FYC.INTERESTS).forEach(function (i) {
    ok(covered[i], 'interest "' + i + '" is reachable from at least one listing');
  });

  // Stronger: every chip the UI offers must reach a real curated organisation
  // somewhere, not just a national directory. Otherwise picking it produces a
  // page of groups that have nothing to do with what was asked for.
  var curatedByInterest = {};
  orgs.forEach(function (o) {
    o.interests.forEach(function (i) { curatedByInterest[i] = (curatedByInterest[i] || 0) + 1; });
  });
  Object.keys(FYC.INTERESTS).forEach(function (i) {
    ok((curatedByInterest[i] || 0) >= 1,
       'interest "' + i + '" has at least one curated listing (' + (curatedByInterest[i] || 0) + ')');
  });

  // Every city covers every interest, so no chip ever falls through to the
  // national routes in a curated city. Keeping this green is the standard a
  // newly added city has to meet.
  FYC.cities.forEach(function (c) {
    Object.keys(FYC.INTERESTS).forEach(function (i) {
      ok(c.orgs.some(function (o) { return o.interests.indexOf(i) !== -1; }),
         c.name + ' covers "' + i + '"');
    });
  });
});

// ---------------------------------------------------------------- city match
group('city lookup', function () {
  eq((FYC.findCity('brooklyn') || {}).id, 'nyc', 'brooklyn resolves to NYC');
  eq((FYC.findCity('Oakland, CA') || {}).id, 'sf', 'Oakland resolves to the Bay Area');
  eq((FYC.findCity('  SEATTLE ') || {}).id, 'sea', 'case and whitespace insensitive');
  eq((FYC.findCity('ATX') || {}).id, 'atx', 'alias lookup');
  eq(FYC.findCity('Boise, Idaho'), null, 'uncurated city returns null');
  eq(FYC.findCity(''), null, 'empty input returns null');
});

// ---------------------------------------------------------------- universal
group('universal fallback', function () {
  var r = FYC.buildUniversal('Boise, ID', ['running', 'volunteering']);
  ok(r.length >= 5, 'builds several routes for an uncurated city (' + r.length + ')');
  r.forEach(function (o) {
    ok(/^https:\/\//.test(o.url), o.id + ': generated https url');
    ok(o.expect.length >= 2, o.id + ': has what-to-expect bullets');
    ok(!!o.firstStep.label, o.id + ': has a first step');
    ok(!o.script, o.id + ': carries no pre-written message');
  });
  var urls = r.map(function (o) { return o.url; });
  ok(urls.some(function (u) { return u.indexOf('Boise') !== -1; }), 'city name is interpolated into at least one link');
  var always = FYC.buildUniversal('Nowhere', []);
  ok(always.length >= 3, 'always-on routes appear even with no interests selected');
});

// ---------------------------------------------------------------- matcher
group('matcher behaviour', function () {
  var nervous = FYC.match({
    location: 'San Francisco', interests: ['outdoors', 'volunteering'],
    comfort: 1, budget: 0, when: ['weekend'], goals: ['friends'], commitment: 'one-off'
  });
  eq(nervous.cityMatched, true, 'curated city is detected');
  ok(nervous.results.length > 0, 'returns results');
  ok(nervous.results[0].org.gentleness >= 4, 'a nervous person gets a gentle option first');
  ok(nervous.results[0].org.solo >= 4, 'top result is easy to attend alone');
  ok(nervous.results.every(function (r) { return r.org.cost === 0; }), 'free-only budget is respected');
  ok(nervous.results[0].reasons.length > 0, 'top result explains itself');

  // Holding interests constant, the comfort dial must actually re-rank: someone
  // who says "throw me in" should see the higher-intensity options sooner.
  function topFor(comfort) {
    return FYC.match({
      location: 'San Francisco', interests: ['fitness', 'outdoors'], comfort: comfort, budget: 2
    }).results.slice(0, 4);
  }
  function avgGentleness(list) {
    return list.reduce(function (a, r) { return a + r.org.gentleness; }, 0) / list.length;
  }
  var timid = topFor(1), bold = topFor(3);
  ok(bold[0].org.id !== timid[0].org.id, 'comfort level changes which listing comes first');
  ok(avgGentleness(bold) < avgGentleness(timid),
     'diving in surfaces more intense options (' + avgGentleness(bold) + ' vs ' + avgGentleness(timid) + ')');

  var interestDriven = FYC.match({ location: 'nyc', interests: ['games'], comfort: 2 });
  ok(interestDriven.results[0].org.interests.indexOf('games') !== -1, 'top result matches the chosen interest');

  var unknown = FYC.match({ location: 'Boise, ID', interests: ['books'], comfort: 2 });
  eq(unknown.cityMatched, false, 'unknown city flagged');
  eq(unknown.results.length, 0, 'no curated results for an unknown city');
  ok(unknown.universal.length > 0, 'but universal routes are always offered');

  var noInterests = FYC.match({ location: 'Chicago', interests: [], comfort: 2 });
  ok(noInterests.results.length > 0, 'still returns something with no interests picked');

  // Scores must be ordered and bounded.
  var ordered = FYC.match({ location: 'Seattle', interests: ['outdoors', 'nature'], comfort: 2 }).results;
  ok(ordered.every(function (r) { return r.score >= 0 && r.score <= 1; }), 'scores are within 0..1');

  // --- the silent-mismatch regression ---------------------------------------
  // Previously, picking an interest with no curated listing returned a
  // confident list of unrelated groups with no matching reason on any card.

  // Use a synthetic city so this test cannot be invalidated by later curation.
  FYC.addCity({
    id: '__gaptest', name: 'Gaptestia', aliases: [], region: 'ZZ',
    orgs: [{
      id: '__gaptest-books', name: 'Gaptestia Reading Room', neighborhood: 'Centre',
      blurb: 'A synthetic listing used only by the test suite to simulate a city that covers one interest and not another.',
      interests: ['books'], url: 'https://example.invalid/',
      firstStep: { kind: 'visit', label: 'Visit', url: 'https://example.invalid/', when: '' },
      script: null, expect: ['a', 'b', 'c'],
      solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
      when: ['weekend'], size: 'small', goals: ['friends']
    }]
  });

  var gap = FYC.match({ location: 'Gaptestia', interests: ['games'], comfort: 2 });
  eq(gap.cityMatched, true, 'uncovered interest: city still recognised');
  eq(gap.results.length, 0, 'uncovered interest returns no curated results');
  ok(gap.uncovered.indexOf('games') !== -1, 'uncovered interest is reported');
  ok(gap.universal.length > 0, 'uncovered interest still gets national routes');

  // A mix of covered and uncovered: keep the real matches, flag the rest.
  var mixed = FYC.match({ location: 'Gaptestia', interests: ['books', 'games'], comfort: 2 });
  ok(mixed.results.length > 0, 'mixed coverage still returns the covered matches');
  ok(mixed.results.every(function (r) { return r.overlap > 0; }),
     'every curated result matches at least one chosen interest');
  ok(mixed.covered.indexOf('books') !== -1, 'covered interest reported as covered');
  ok(mixed.uncovered.indexOf('games') !== -1, 'uncovered interest reported as uncovered');

  // Drop the synthetic city again so it cannot affect anything below.
  FYC.cities = FYC.cities.filter(function (c) { return c.id !== '__gaptest'; });

  // Across every city and every interest: never present a non-match as a match.
  var leaked = 0, reasonless = 0;
  FYC.cities.forEach(function (c) {
    Object.keys(FYC.INTERESTS).forEach(function (i) {
      FYC.match({ location: c.name, interests: [i], comfort: 2 }).results.forEach(function (r) {
        if (r.overlap === 0) leaked++;
        if (!r.reasons.length) reasonless++;
      });
    });
  });
  eq(leaked, 0, 'no zero-overlap listing is ever returned as a match');
  eq(reasonless, 0, 'every returned match explains itself');

  // Diversity: the top 4 should not all be the same single organisation type.
  var diverse = FYC.match({ location: 'nyc', interests: ['volunteering', 'books', 'outdoors'], comfort: 2 }).results;
  var topIds = diverse.slice(0, 4).map(function (r) { return r.org.id; });
  eq(new Set(topIds).size, topIds.length, 'no duplicate organisations in the top results');
});

// ------------------------------------------------------- preference tracker
group('preference tracker', function () {
  // An in-memory store stands in for localStorage.
  var mem = { v: null };
  FYC.prefs._setStore({ get: function () { return mem.v; }, set: function (v) { mem.v = v; } });

  var sf = FYC.cities.filter(function (c) { return c.id === 'sf'; })[0];
  function org(id) { return sf.orgs.filter(function (o) { return o.id === id; })[0]; }

  FYC.prefs.clear();
  var empty = FYC.prefs.profile();
  eq(empty.count, 0, 'starts with nothing recorded');
  eq(empty.ready, false, 'not ready with no data');
  eq(FYC.prefs.fit(org('sf-fuf'), empty), 0.5, 'no opinion before any evidence');
  eq(FYC.prefs.summary(empty), null, 'no summary before any evidence');

  // One action is not a preference.
  FYC.prefs.record('expand', org('sf-fuf'));
  ok(!FYC.prefs.profile().ready, 'a single action is not enough to draw conclusions');

  // Repeated engagement with outdoor, free, gentle listings.
  ['sf-fuf', 'sf-alemany', 'sf-ggba'].forEach(function (id) {
    ['expand', 'open', 'plan', 'step'].forEach(function (t) { FYC.prefs.record(t, org(id)); });
  });
  var p = FYC.prefs.profile();
  ok(p.ready, 'becomes ready after enough actions');
  ok(p.count >= 12, 'records every action (' + p.count + ')');
  ok(p.top.indexOf('outdoors') !== -1 || p.top.indexOf('environment') !== -1,
     'learns the interests behind what was engaged with');
  ok(p.cost < 0.5, 'notices that everything engaged with was free');
  ok(p.gentleness > 4, 'notices a preference for gentle options');
  ok(FYC.prefs.summary(p), 'produces a plain-language summary');
  ok(p.confidence > 0 && p.confidence <= 1, 'confidence is within range');

  // Fit should favour a similar listing over an unrelated one.
  ok(FYC.prefs.fit(org('sf-urbanadamah'), p) > FYC.prefs.fit(org('sf-bats'), p),
     'a similar listing fits the learned profile better than an unrelated one');

  // Negative signals pull an interest back down.
  var beforeTheater = FYC.prefs.profile().affinity['theater'] || 0;
  FYC.prefs.record('unplan', org('sf-bats'));
  var afterTheater = FYC.prefs.profile().affinity['theater'] || 0;
  ok(afterTheater < beforeTheater || afterTheater < 0, 'removing something counts against it');

  // The learned profile nudges the ranking without overriding stated choices.
  var prof = FYC.prefs.profile();
  var withLearning = FYC.match({
    location: 'San Francisco', interests: ['volunteering'], comfort: 2, learned: prof
  });
  ok(withLearning.results.every(function (r) { return r.overlap > 0; }),
     'learning never resurrects a listing that matches no chosen interest');
  ok(withLearning.results.every(function (r) { return r.score >= 0 && r.score <= 1; }),
     'scores stay within range once learning is blended in');

  // Where there are plenty of free options, a stated free-only budget holds.
  // (With almost no affordable matches the matcher deliberately relaxes the
  // budget rather than show an empty page; that is unrelated to learning.)
  var budgeted = FYC.match({
    location: 'San Francisco', interests: ['volunteering', 'outdoors'],
    comfort: 2, budget: 0, learned: prof
  });
  ok(budgeted.results.length >= 4, 'enough free matches to exercise the budget filter');
  ok(budgeted.results.every(function (r) { return r.org.cost === 0; }),
     'learning never overrides a stated budget');

  // The sharper property: learning may reorder results, but must never change
  // which listings qualify in the first place.
  function idsFor(learned) {
    return FYC.match({
      location: 'San Francisco', interests: ['volunteering', 'outdoors'],
      comfort: 2, budget: 0, learned: learned
    }).results.map(function (r) { return r.org.id; }).sort().join(',');
  }
  eq(idsFor(prof), idsFor(null), 'learning reorders results but never admits different ones');

  // Pausing stops collection; clearing erases it.
  FYC.prefs.setEnabled(false);
  var n = FYC.prefs.profile().count;
  FYC.prefs.record('plan', org('sf-np'));
  eq(FYC.prefs.profile().count, n, 'nothing is recorded while paused');
  FYC.prefs.setEnabled(true);
  FYC.prefs.record('plan', org('sf-np'));
  eq(FYC.prefs.profile().count, n + 1, 'recording resumes when turned back on');
  FYC.prefs.clear();
  eq(FYC.prefs.profile().count, 0, 'erasing removes everything');
  eq(FYC.prefs.isEnabled(), true, 'erasing does not silently re-enable or disable tracking');

  // Old actions should matter less than recent ones.
  var now = Date.now();
  var old = now - 1000 * 60 * 60 * 24 * 180;   // six months ago
  FYC.prefs.record('plan', org('sf-bats'), old);
  ['sf-fuf', 'sf-alemany'].forEach(function (id) {
    ['plan', 'open', 'expand', 'step'].forEach(function (t) { FYC.prefs.record(t, org(id), now); });
  });
  var decayed = FYC.prefs.profile(now);
  ok((decayed.affinity['theater'] || 0) < (decayed.affinity['environment'] || 0),
     'a six-month-old action counts for less than this week\'s');

  FYC.prefs.clear();
  // Unknown action types are ignored rather than corrupting the log.
  eq(FYC.prefs.record('nonsense', org('sf-fuf')), null, 'unknown action types are ignored');
  eq(FYC.prefs.record('plan', null), null, 'a missing listing is ignored');
  eq(FYC.prefs.profile().count, 0, 'neither wrote anything');
});

// ---------------------------------------------------------------- wiring
group('front-end wiring', function () {
  var fs = require('fs');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  ['src/data/core.js', 'src/data/city-sf.js', 'src/data/city-nyc.js', 'src/data/city-chicago.js',
   'src/data/city-seattle.js', 'src/data/city-austin.js', 'src/data/city-boston.js',
   'src/data/city-philadelphia.js', 'src/data/city-dc.js', 'src/data/city-la.js',
   'src/data/city-sandiego.js', 'src/data/universal.js',
   'src/preferences.js', 'src/match.js', 'src/app.js', 'assets/styles.css'].forEach(function (f) {
    ok(html.indexOf(f) !== -1, 'index.html loads ' + f);
    ok(fs.existsSync(path.join(root, f)), f + ' exists on disk');
  });
  ok(html.indexOf('fb-tab') !== -1, 'feedback tab is present');
  ok(html.indexOf('id="view-plan"') !== -1, 'plan view is present');
  ok(html.indexOf('id="view-you"') !== -1, 'preferences dashboard is present');
});

console.log('\n' + (fail ? '✗' : '✓') + ' ' + pass + ' passed, ' + fail + ' failed');
if (fail) {
  failures.slice(0, 25).forEach(function (f) { console.log('   ✗ ' + f); });
  if (failures.length > 25) console.log('   … and ' + (failures.length - 25) + ' more');
  process.exit(1);
}
