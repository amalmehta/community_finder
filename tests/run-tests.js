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
require(path.join(root, 'src/intake.js'));
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

// ---------------------------------------------------------- adaptive intake
group('adaptive intake', function () {
  var I = FYC.intake;

  /** Walk the whole intake, answering from `script`, else `fallback`. */
  function walk(script, fallback) {
    var s = I.blankState(), asked = [];
    var guard = 0;
    while (!I.done(s) && guard++ < 60) {
      var q = I.nextQuestion(s);
      if (!q) break;
      var v = script[q.id];
      if (v === undefined) {
        var idx = fallback === 'last' ? q.options.length - 1 : 0;
        v = q.kind === 'text' ? 'Boston' : q.kind === 'many' ? [q.options[idx].id] : q.options[idx].id;
      }
      asked.push(q.id);
      I.answer(s, q, v);
    }
    return { state: s, asked: asked, profile: I.toProfile(s) };
  }

  eq(I.TOTAL, 20, 'the intake is twenty questions');
  ok(I.QUESTIONS.length > 30, 'the bank is bigger than the run, so it can adapt (' + I.QUESTIONS.length + ')');

  var fresh = I.blankState();
  eq(I.nextQuestion(fresh).id, 'city', 'it opens by asking where you are');
  eq(I.done(fresh), false, 'a fresh session is not finished');

  // Every question must be answerable and well formed.
  I.QUESTIONS.forEach(function (q) {
    ok(!!q.prompt, q.id + ': has a prompt');
    ok(['text', 'one', 'many'].indexOf(q.kind) !== -1, q.id + ': known kind');
    if (q.kind !== 'text') {
      ok(q.options && q.options.length >= 2, q.id + ': has at least two options');
      q.options.forEach(function (o) {
        ok(!!o.label, q.id + '/' + o.id + ': option has a label');
        if (o.effects && o.effects.interests) {
          Object.keys(o.effects.interests).forEach(function (iid) {
            ok(!!FYC.INTERESTS[iid], q.id + '/' + o.id + ': scores a real interest "' + iid + '"');
          });
        }
      });
    }
  });

  var giver = walk({ city: 'Boston', pull: ['give', 'grow'], comfort: 'low', commitment: 'one', budget: 'free', when: ['weekend'], goal: ['impact'] }, 'first');
  var maker = walk({ city: 'Austin', pull: ['make', 'think'], comfort: 'high', commitment: 'season', budget: 'any', when: ['weekday-eve'], goal: ['skill'] }, 'first');

  eq(giver.asked.length, 20, 'a full run asks exactly twenty questions');
  eq(maker.asked.length, 20, 'and so does a different run');

  // The whole point: different answers produce different questions.
  var differing = giver.asked.filter(function (q) { return maker.asked.indexOf(q) === -1; });
  ok(differing.length >= 4, 'different answers lead to different questions (' + differing.length + ' differ)');

  ok(giver.asked.indexOf('give-how') !== -1, 'picking Give asks how you want to be useful');
  ok(giver.asked.indexOf('make-what') === -1, 'and does not ask the Make drill-downs');
  ok(maker.asked.indexOf('make-what') !== -1, 'picking Make asks what you want to make');
  ok(maker.asked.indexOf('give-how') === -1, 'and skips the Give drill-downs');

  // Follow-ups that depend on an earlier answer.
  ok(giver.asked.indexOf('easier') !== -1, 'saying it is hard asks what would make it easier');
  ok(maker.asked.indexOf('easier') === -1, 'saying it is easy does not');

  // Profiles must be usable by the matcher.
  [giver, maker].forEach(function (r, n) {
    var p = r.profile;
    ok(!!p.location, 'run ' + n + ': profile has a location');
    ok(p.interests.length > 0, 'run ' + n + ': profile has interests');
    ok(p.interests.length <= 6, 'run ' + n + ': at most six interests');
    p.interests.forEach(function (id) { ok(!!FYC.INTERESTS[id], 'run ' + n + ': "' + id + '" is a real interest'); });
    ok([1, 2, 3].indexOf(p.comfort) !== -1, 'run ' + n + ': comfort is 1-3');
    var m = FYC.match(p);
    ok(m.results.length > 0 || m.universal.length > 0, 'run ' + n + ': the matcher accepts the profile');
    m.results.forEach(function (x) { ok(x.overlap > 0, 'run ' + n + ': every result matches a chosen interest'); });
  });

  // Interests are ranked, because the matcher weights the first pick most.
  var ranked = walk({ city: 'Boston', pull: ['give'], 'give-how': 'shift', comfort: 'mid' }, 'first');
  ok(ranked.profile.interests.indexOf('volunteering') === 0,
     'the strongest signal ends up first (' + ranked.profile.interests.join(', ') + ')');

  // Negative answers push things down rather than merely not boosting them.
  var avoids = walk({ city: 'Boston', pull: ['move'], avoid: ['loud'], comfort: 'mid' }, 'first');
  ok(avoids.profile.interests.indexOf('fitness') === -1,
     'saying you avoid loud things keeps fitness out of the profile');

  // Skipping a question still advances the count.
  var skipper = I.blankState();
  var q1 = I.nextQuestion(skipper);
  I.answer(skipper, q1, 'Boston');
  var before = I.progress(skipper).asked;
  skipper.asked.push(I.nextQuestion(skipper).id);
  eq(I.progress(skipper).asked, before + 1, 'a skipped question still counts toward the twenty');

  // It must terminate however it is answered.
  ['first', 'last'].forEach(function (mode) {
    var r = walk({ city: 'Boston' }, mode);
    ok(r.asked.length <= 20, 'never asks more than twenty (' + mode + ')');
    ok(r.asked.length >= 15, 'and gets a decent way through (' + mode + ': ' + r.asked.length + ')');
    eq(new Set(r.asked).size, r.asked.length, 'never repeats a question (' + mode + ')');
  });
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

  // Sharing is a strong signal, and must be weighted like one.
  ok(FYC.prefs.ACTION_WEIGHTS.share > 0, 'sharing counts as interest');
  ok(FYC.prefs.ACTION_WEIGHTS.share >= FYC.prefs.ACTION_WEIGHTS.open,
     'and counts for at least as much as merely opening the page');
  ok(FYC.prefs.ACTION_WEIGHTS.share < FYC.prefs.ACTION_WEIGHTS.plan,
     'but less than actually saving it');
  FYC.prefs.clear();

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
   'src/preferences.js', 'src/intake.js', 'src/match.js', 'src/app.js', 'assets/styles.css'].forEach(function (f) {
    ok(html.indexOf(f) !== -1, 'index.html loads ' + f);
    ok(fs.existsSync(path.join(root, f)), f + ' exists on disk');
  });
  ok(html.indexOf('fb-tab') !== -1, 'feedback tab is present');
  ok(html.indexOf('id="view-plan"') !== -1, 'plan view is present');
  ok(html.indexOf('id="view-you"') !== -1, 'preferences dashboard is present');

  var app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  ok(app.indexOf('navigator.share') !== -1, 'share uses the native sheet where there is one');
  ok(app.indexOf('legacyCopy') !== -1, 'with a clipboard fallback');
  ok(app.indexOf("track('share'") !== -1, 'and sharing is recorded as a preference signal');

  // Theme: a manual choice has to beat the system setting, and be applied
  // before first paint or the page flashes the wrong colours.
  ok(html.indexOf('id="theme-toggle"') !== -1, 'the theme toggle is in the header');
  ok(html.indexOf("localStorage.getItem('fyc.theme.v1')") !== -1,
     'the saved theme is read inline, before the stylesheet renders');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
  ok(css.indexOf(':root[data-theme="dark"]') !== -1, 'an explicit dark theme exists');
  ok(css.indexOf(':root:not([data-theme="light"])') !== -1,
     'and choosing light overrides a system that prefers dark');
  ok(app.indexOf("THEMES = ['auto', 'light', 'dark']") !== -1,
     'the toggle has three states, so following the system stays an option');
});

console.log('\n' + (fail ? '✗' : '✓') + ' ' + pass + ' passed, ' + fail + ' failed');
if (fail) {
  failures.slice(0, 25).forEach(function (f) { console.log('   ✗ ' + f); });
  if (failures.length > 25) console.log('   … and ' + (failures.length - 25) + ' more');
  process.exit(1);
}
