/* community_finder — test suite. Plain Node, no dependencies.
 * Run: node tests/run-tests.js
 */
'use strict';
var path = require('path');
var root = path.join(__dirname, '..');

require(path.join(root, 'src/data/core.js'));
['sf', 'nyc', 'chicago', 'seattle', 'austin', 'boston', 'philadelphia', 'dc'].forEach(function (c) {
  require(path.join(root, 'src/data/city-' + c + '.js'));
});
require(path.join(root, 'src/data/universal.js'));
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
  ok(orgs.length >= 120, 'at least 120 curated organisations (' + orgs.length + ')');

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
    ok(Array.isArray(o.expect) && o.expect.length >= 3, n + ': at least 3 what-to-expect bullets');
    ok(o.cost === 0 || o.cost === 1 || o.cost === 2, n + ': cost is 0/1/2');
    ok(o.solo >= 1 && o.solo <= 5, n + ': solo rating in range');
    ok(o.gentleness >= 1 && o.gentleness <= 5, n + ': gentleness rating in range');
    ok(FYC.STRUCTURE.indexOf(o.structure) !== -1, n + ': structure "' + o.structure + '" is known');
    ok(FYC.COMMITMENT.indexOf(o.commitment) !== -1, n + ': commitment "' + o.commitment + '" is known');
    (o.when || []).forEach(function (w) { ok(FYC.WHEN.indexOf(w) !== -1, n + ': when "' + w + '" is known'); });
    (o.goals || []).forEach(function (gl) { ok(FYC.GOALS.indexOf(gl) !== -1, n + ': goal "' + gl + '" is known'); });
    if (o.script) ok(o.script.length > 20, n + ': script is a real message');
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
    ok(o.expect.length >= 3, o.id + ': has what-to-expect bullets');
    ok(!!o.firstStep.label, o.id + ': has a first step');
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

  // Chicago has no curated board-games listing; the app must say so rather
  // than pad the page out.
  var gap = FYC.match({ location: 'Chicago', interests: ['games'], comfort: 2 });
  eq(gap.cityMatched, true, 'uncovered interest: city still recognised');
  eq(gap.results.length, 0, 'uncovered interest returns no curated results');
  ok(gap.uncovered.indexOf('games') !== -1, 'uncovered interest is reported');
  ok(gap.universal.length > 0, 'uncovered interest still gets national routes');

  // A mix of covered and uncovered: keep the real matches, flag the rest.
  var mixed = FYC.match({ location: 'Chicago', interests: ['books', 'games'], comfort: 2 });
  ok(mixed.results.length > 0, 'mixed coverage still returns the covered matches');
  ok(mixed.results.every(function (r) { return r.overlap > 0; }),
     'every curated result matches at least one chosen interest');
  ok(mixed.covered.indexOf('books') !== -1, 'covered interest reported as covered');
  ok(mixed.uncovered.indexOf('games') !== -1, 'uncovered interest reported as uncovered');

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

// ---------------------------------------------------------------- wiring
group('front-end wiring', function () {
  var fs = require('fs');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  ['src/data/core.js', 'src/data/city-sf.js', 'src/data/city-nyc.js', 'src/data/city-chicago.js',
   'src/data/city-seattle.js', 'src/data/city-austin.js', 'src/data/city-boston.js',
   'src/data/city-philadelphia.js', 'src/data/city-dc.js', 'src/data/universal.js',
   'src/match.js', 'src/app.js', 'assets/styles.css'].forEach(function (f) {
    ok(html.indexOf(f) !== -1, 'index.html loads ' + f);
    ok(fs.existsSync(path.join(root, f)), f + ' exists on disk');
  });
  ok(html.indexOf('fb-tab') !== -1, 'feedback tab is present');
  ok(html.indexOf('id="view-plan"') !== -1, 'plan view is present');
});

console.log('\n' + (fail ? '✗' : '✓') + ' ' + pass + ' passed, ' + fail + ' failed');
if (fail) {
  failures.slice(0, 25).forEach(function (f) { console.log('   ✗ ' + f); });
  if (failures.length > 25) console.log('   … and ' + (failures.length - 25) + ' more');
  process.exit(1);
}
