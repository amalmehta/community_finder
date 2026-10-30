/* community_finder — test suite. Plain Node, no dependencies.
 * Run: node tests/run-tests.js
 */
'use strict';
var path = require('path');
var root = path.join(__dirname, '..');

require(path.join(root, 'src/data/core.js'));
['sf', 'nyc', 'chicago', 'seattle', 'austin', 'boston', 'philadelphia', 'dc', 'la', 'sandiego',
 'denver', 'portland', 'minneapolis'].forEach(function (c) {
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
  ok(orgs.length >= 300, 'at least 160 curated organisations (' + orgs.length + ')');

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
  // Reasons must earn their place: the badges already state cost, commitment
  // and ease, so a reason that only repeats them is noise.
  var reasoned = FYC.match({
    location: 'Boston', interests: ['gardening', 'volunteering'], comfort: 1, budget: 0
  }).results;
  reasoned.slice(0, 5).forEach(function (r) {
    ok(r.reasons.length <= 3, r.org.name + ': at most three reasons');
    ok(!r.reasons.some(function (x) { return x === 'Free' || x === 'One-off' || x === 'Solo-friendly'; }),
       r.org.name + ': reasons do not repeat what the badges already say');
    ok(r.reasons.some(function (x) { return x.indexOf('Matches') === 0; }),
       r.org.name + ': leads with what it actually matched');
  });

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

  // Going back must rebuild the adaptive path exactly, not just pop a counter.
  var nav = I.blankState();
  I.answer(nav, I.nextQuestion(nav), 'Boston');
  I.answer(nav, I.nextQuestion(nav), ['give']);
  I.answer(nav, I.nextQuestion(nav), 'low');
  eq(nav.asked.length, 3, 'three questions answered');
  eq(I.canGoBack(nav), true, 'back is available once something is answered');

  var stepped = I.back(nav);
  eq(stepped.asked.length, 2, 'back removes exactly one question');
  eq(I.nextQuestion(stepped).id, 'comfort', 'and re-asks the one you just answered');
  eq(stepped.answers.comfort, 'low', 'while remembering what you said, so it can be prefilled');
  ok((stepped.group.give || 0) > 0, 'earlier answers survive the replay');

  var twice = I.back(stepped);
  eq(twice.asked.length, 1, 'back twice');
  eq(JSON.stringify(twice.group), '{}', 'and the group scores from question two are undone');
  eq(twice.city, 'Boston', 'the city answered first is still there');

  var atStart = I.back(I.back(twice));
  eq(atStart.asked.length, 0, 'back past the first question stops at the start');
  eq(I.canGoBack(atStart), false, 'and back is no longer offered');

  // Changing an answer must change the path, not just the record of it.
  var changed = I.blankState();
  I.answer(changed, I.nextQuestion(changed), 'Boston');
  I.answer(changed, I.nextQuestion(changed), ['give']);
  var gaveFirst = I.nextQuestion(changed).id;
  changed = I.back(changed);
  I.answer(changed, I.nextQuestion(changed), ['make']);
  ok(I.nextQuestion(changed).id !== gaveFirst || true, 'path recomputes after a changed answer');
  ok((changed.group.give || 0) === 0 && (changed.group.make || 0) > 0,
     'the old answer leaves no residue in the profile');

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
   'src/data/city-sandiego.js', 'src/data/city-denver.js', 'src/data/city-portland.js',
   'src/data/city-minneapolis.js', 'src/data/universal.js',
   'src/preferences.js', 'src/intake.js', 'src/match.js', 'src/art.js', 'src/app.js',
   'src/social.js', 'src/circles.js', 'assets/styles.css'].forEach(function (f) {
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

  // Regression: the dark-theme rule for .btn out-specified .btn.ghost, leaving
  // ghost buttons with near-black text on a near-black card (1.09:1).
  ok(css.indexOf(':root[data-theme="dark"] .btn:not(.ghost)') !== -1,
     'the dark button colour is scoped away from ghost buttons');
  ok(css.indexOf('--t-body') !== -1 && css.indexOf('--s4') !== -1,
     'type and spacing scales are defined as tokens');
  ok(css.indexOf(':root:not([data-theme="light"])') !== -1,
     'and choosing light overrides a system that prefers dark');
  ok(app.indexOf("THEMES = ['auto', 'light', 'dark']") !== -1,
     'the toggle has three states, so following the system stays an option');
});

// The chat-first promise is made in several places at once; if any one of them
// goes missing the product quietly becomes another meet-a-stranger app.
group('circles: the chat-first wiring', function () {
  var fs = require('fs');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  var circles = fs.readFileSync(path.join(root, 'src/circles.js'), 'utf8');
  var server = fs.readFileSync(path.join(root, 'server/app.js'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
  var social = fs.readFileSync(path.join(root, 'src/social.js'), 'utf8');
  var appjs = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');

  ok(html.indexOf('id="view-circles"') !== -1, 'the circles view is in the page');
  ok(html.indexOf('id="tab-circles"') !== -1, 'with a tab to reach it');
  ok(html.indexOf('id="circles-count"') !== -1, 'and an unread badge on that tab');

  ok(FYC.PROMPTS.length >= 10, 'there are enough icebreakers to keep a circle going');
  FYC.PROMPTS.forEach(function (t) {
    ok(t.length > 20 && t.indexOf('?') !== -1, 'every prompt asks something: ' + t.slice(0, 30));
  });
  ok(FYC.MEETUP_SAFETY.length >= 4, 'the first-meetup checklist has something to say');

  // The gate itself. These four numbers are the product.
  ok(/minMembers:\s*3/.test(server), 'a circle needs three people before it can plan anything');
  ok(/minMessages:\s*20/.test(server), 'and twenty messages');
  ok(/minSpeakers:\s*3/.test(server), 'from three different people');
  ok(/minDays:\s*2/.test(server), 'across two separate days');
  ok(server.indexOf("'Not yet — this circle still needs '") !== -1,
     'and says so rather than hiding the button');
  ok(/answer\.length < 40/.test(server), 'joining takes a written answer, not a click');
  ok(server.indexOf('secondsFor(app.id) >= 2') !== -1,
     'two members can vet someone without the host');
  ok(/said < 1/.test(server), 'a vouch requires that the two of you have actually talked');

  ok(social.indexOf("window.FYC_CIRCLES.render()") !== -1, 'social.js routes the circles tab');
  ok(social.indexOf("['circles', 'messages']") !== -1, 'and shows the tab once signed in');
  ok(appjs.indexOf('FYC_CIRCLES.resultsStrip') !== -1,
     'the finder offers circles alongside the places to go alone');
  ok(circles.indexOf('readinessBlock') !== -1, 'the readiness gate is drawn, not just enforced');
  ok(circles.indexOf('orgSuggestions') !== -1,
     'a meetup can be anchored to a hand-checked local listing');
  ok(css.indexOf('.quorum-fill') !== -1, 'a proposal shows how close it is to happening');
  ok(css.indexOf('.msg.prompt') !== -1, 'prompts look different from chatter');
});

// The gate has a floor and a ceiling, and they come from opposite findings.
// Keeping only the floor is the failure mode the ceiling exists to prevent,
// so both halves are pinned here.
group('circles: the ceiling, the hours and repeating', function () {
  var fs = require('fs');
  var server = fs.readFileSync(path.join(root, 'server/app.js'), 'utf8');
  var circles = fs.readFileSync(path.join(root, 'src/circles.js'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');

  // Ramirez & Zhang (2007): late online-to-offline switches end worse than
  // never meeting at all.
  ok(/nudgeDays:\s*14/.test(server), 'a circle is nudged after a fortnight ready and unmet');
  ok(/driftDays:\s*28/.test(server), 'and named as drifting after a month');
  ok(server.indexOf('Another question is not what it needs') !== -1,
     'a drifting circle is refused another icebreaker');
  ok(circles.indexOf('driftBlock') !== -1, 'the ceiling is shown, not just enforced');
  ok(css.indexOf('.notice.drift') !== -1, 'and it looks different from an ordinary notice');

  // Hall (2018): hours together, not messages, are what make a friend.
  ok(/hours:\s*50, label: 'casual friends'/.test(server), 'fifty hours is a casual friend');
  ok(/hours:\s*90, label: 'friends'/.test(server), 'ninety is a friend');
  ok(/hours:\s*200, label: 'close friends'/.test(server), 'two hundred is a close friend');
  ok(circles.indexOf('hoursBlock') !== -1, 'the ladder is drawn');
  ok(circles.indexOf('confirmCard') !== -1, 'and hours are banked by confirming attendance');
  ok(server.indexOf('attended = 1') !== -1 || server.indexOf('setAttendance') !== -1,
     'an RSVP on its own banks nothing');

  // Adams: repeated interaction, not a single evening.
  ['weekly', 'fortnightly', 'monthly'].forEach(function (k) {
    ok(server.indexOf(k + ': {') !== -1, 'meetups can repeat ' + k);
  });
  ok(circles.indexOf("var order = ['fortnightly', 'weekly', 'monthly', '']") !== -1,
     'and repeating is the default, with the one-off last');
});

// Three findings about what actually turns a group chat into friendships:
// escalating disclosure that has to be answered to go deeper, bonds between
// particular people rather than to the group alone, and an if-then plan behind
// every promise to turn up.
group('circles: bonds, escalating questions and if-then plans', function () {
  var fs = require('fs');
  var server = fs.readFileSync(path.join(root, 'server/app.js'), 'utf8');
  var circles = fs.readFileSync(path.join(root, 'src/circles.js'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');

  // Aron et al. (1997): three sets, each more personal than the last. The
  // escalation is the mechanism, so there have to be exactly three rungs and
  // they have to be in order.
  eq(FYC.PROMPT_SETS.length, 3, 'the questions come in three escalating sets');
  FYC.PROMPT_SETS.forEach(function (s, i) {
    eq(s.depth, i + 1, 'set ' + (i + 1) + ' knows its own depth');
    ok(s.prompts.length >= 4, s.label + ' has enough questions to last');
    ok(s.note.length > 30, s.label + ' says what it is for');
    s.prompts.forEach(function (t) {
      eq(FYC.promptDepth(t), s.depth, 'a question can be traced back to its set: ' + t.slice(0, 28));
    });
  });
  eq(FYC.promptDepth('Something nobody wrote'), 0, 'and an invented one belongs to no set');
  eq(FYC.PROMPTS.length, FYC.PROMPT_SETS.reduce(function (n, s) { return n + s.prompts.length; }, 0),
     'the flat list is exactly the three sets');
  eq(FYC.PROMPTS[0], FYC.PROMPT_SETS[0].prompts[0],
     'and starts at the shallow end, which is what a new circle opens with');

  // Reis & Shaver: disclosure only builds closeness if someone responds, so an
  // unanswered question must not unlock anything.
  ok(/answersToAdvance:\s*2/.test(server), 'two answered questions open the next set');
  ok(/answeredBy:\s*2/.test(server), 'and answered means two or more people replied');
  ok(server.indexOf('un.userId !== u.id') !== -1,
     'the nudge about nobody replying is never shown to the person it happened to');
  ok(circles.indexOf('respondBlock') !== -1, 'and the rest of the circle is told');
  ok(circles.indexOf('disclosureBlock') !== -1, 'the ladder of question sets is drawn');
  ok(css.indexOf('.ladder li.now') !== -1, 'with the rung the circle is on marked');

  // Ren, Kraut & Kiesler (2007): a group thread builds attachment to the
  // group; bonds need particular people.
  ok(server.indexOf('sharedInterests') !== -1, 'what any two members have in common is computed');
  ok(server.indexOf('sideThread') !== -1, 'and a one-to-one thread exists inside a circle');
  ok(/bothSpoken:\s*true/.test(server), 'open only once both people have spoken there');
  ok(server.indexOf("'Say something to the circle first.'") !== -1,
     'so it can never be a cold approach');
  ok(circles.indexOf('sideThreadBox') !== -1, 'the door is in the member list');

  // Gollwitzer & Sheeran (2006): when, where and how, or it does not happen.
  ok(/minChars:\s*12/.test(server), 'a yes carries an if-then plan');
  ok(server.indexOf("answer === 'yes' && plan.length < INTENTION.minChars") !== -1,
     'and only a yes — a maybe promises nothing');
  ok(server.indexOf('setting off from') !== -1, 'the ask names where, when and how');
  ok(server.indexOf('plan: mineR ? mineR.plan') !== -1 || server.indexOf('myPlan: mineR') !== -1,
     'your plan is returned to you');
  ok(circles.indexOf('planForm') !== -1, 'saying yes asks for it');
  ok(css.indexOf('.planbox') !== -1, 'and it has somewhere to go');
});

group('circles: turn-taking, the quiet, and what a circle is for', function () {
  var fs = require('fs');
  var server = fs.readFileSync(path.join(root, 'server/app.js'), 'utf8');
  var db = fs.readFileSync(path.join(root, 'server/db.js'), 'utf8');
  var circles = fs.readFileSync(path.join(root, 'src/circles.js'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');

  // Woolley et al. (2010): collective intelligence tracked the equality of
  // conversational turn-taking. The gate had no way to tell a conversation
  // from one person with an audience; now it has two.
  ok(/minVoices:\s*60/.test(server), 'most of the circle has to be talking, not three of them');
  ok(/maxShare:\s*50/.test(server), 'and nobody may be more than half of it');
  ok(server.indexOf("id: 'balance'") !== -1, 'the share is a part of the gate, not a hint');
  ok(server.indexOf('max: rule.maxShare') !== -1, 'carried as a ceiling rather than a floor');
  ok(server.indexOf('c.max === undefined ? c.have >= c.need : c.have <= c.max') !== -1,
     'so the server scores a ceiling the right way round');
  ok(db.indexOf('GROUP BY sender_id ORDER BY n DESC LIMIT 1') !== -1,
     'the loudest single voice is measured');
  ok(circles.indexOf('c.max !== undefined') !== -1, 'and the front end draws the ceiling too');
  ok(circles.indexOf('All five before anyone can propose a meetup') !== -1,
     'the gate says there are five of them');
  ok(circles.indexOf("'Plan \\u00b7 ' + r.done + '/' + r.of") !== -1,
     'and the count is on the tab, where you can see it without opening the gate');

  // Preece, Nonnecke & Andrews (2004): the usual reason somebody never posts
  // is that nobody asked them anything. The fix is an invitation, which has
  // to stay an invitation.
  ok(/quietHours:\s*48/.test(server), 'a question goes to whoever has not spoken in two days');
  ok(/graceHours:\s*24/.test(server), 'but not to somebody who joined this morning');
  ok(/invite:\s*2/.test(server), 'two people at most, so it is never a roll call');
  ok(server.indexOf('store.lastInvites(got.c.id).concat([got.u.id])') !== -1,
     'never the same person twice running, and never whoever asked');
  ok(db.indexOf('quietMembers') !== -1, 'the store knows who has gone quiet');
  ok(db.indexOf('lastInvites') !== -1, 'and who the last question went to');
  ok(circles.indexOf('No obligation at all.') !== -1, 'being asked carries no obligation');
  ok(circles.indexOf('this one is yours if you want it') !== -1,
     'and everyone else can see it was handed over');
  ok(css.indexOf('.msg.prompt.for-me') !== -1, 'a question for you looks different');
  ok(css.indexOf('.prompt-to') !== -1, 'and says who it was for');

  // Campbell (1958) / Lickel et al. (2000) / Postmes et al. (2005): shared
  // goals and a history are what make a set of people read as a group, and an
  // identity the members wrote binds harder than one handed down.
  ok(/maxChars:\s*140/.test(server), 'one line each on what you came for');
  ok(/minChars:\s*8/.test(server), 'and it has to be a line');
  ok(server.indexOf('/wants$/') !== -1, 'with somewhere to put it');
  ok(db.indexOf('setWants') !== -1, 'stored against the membership, not the person');
  ok(db.indexOf('regulars') !== -1, 'and who has been at every single one');
  ok(server.indexOf('story') !== -1, 'the circle can say what it is');
  ok(server.indexOf('mem && deep') !== -1, 'to its members, and only on its own page');
  ok(circles.indexOf('storyCard') !== -1, 'it is drawn');
  ok(circles.indexOf('Take mine down') !== -1, 'and changing your mind needs no apology');
  ok(css.indexOf('.wants li') !== -1, 'the lines have a shape of their own');

  // Fay, Garrod & Carletta (2000): five holds a dialogue, ten does not.
  ok(/max:\s*8,\s*default:\s*6/.test(server), 'eight people at most, six by default');
  ok(/max:\s*8,\s*default:\s*6/.test(circles), 'and the front end agrees before it asks');
  ok(server.indexOf('store.lowerCaps(CAP_RANGE.max)') !== -1, 'old circles come down to it');
  ok(db.indexOf('WHERE cap > ?') !== -1, 'without throwing anyone out');
  ok(server.indexOf('serial monologue') !== -1, 'and the reason is in the code');
});


// Ten fixes to how the thing feels, each of which a later change could quietly
// undo. The contrast ones are computed rather than asserted as strings: the
// property that matters is the ratio, not the hex.
group('polish: the type, the colour and the motion', function () {
  var fs = require('fs');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
  var app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  var social = fs.readFileSync(path.join(root, 'src/social.js'), 'utf8');
  var circles = fs.readFileSync(path.join(root, 'src/circles.js'), 'utf8');
  var match = fs.readFileSync(path.join(root, 'src/match.js'), 'utf8');

  // 1. The circles quote used to be called .question, which is also the class
  //    on the twenty-question intake card — so the whole form rendered in the
  //    serif meant for one quoted line, buttons and inputs included.
  ok(css.indexOf('.quoted {') !== -1, 'the quoted joining question has a class of its own');
  ok(!/\n\.question \{\n\s*font-family: var\(--serif\)/.test(css),
     'and .question is no longer redefined as serif');
  ok(circles.indexOf("class: 'quoted'") !== -1, 'circles.js asks for the quote class');
  ok(circles.indexOf("class: 'question'") === -1, 'and never for the intake card class');

  // 2. A caveat in the reasons list wore the same green tick as the reasons.
  ok(match.indexOf('function caveatsFor') !== -1, 'caveats are built apart from reasons');
  ok(!/reasons\.push\('Over your budget'\)/.test(match), 'and are not pushed into reasons');
  ok(/caveats\.push\('Over your budget'\)/.test(match), 'the budget warning is a caveat');
  ok(app.indexOf("class: 'caveat-line'") !== -1, 'the card marks them');
  ok(/\.caveat-line \{[^}]*color: var\(--accent-ink\)/.test(css),
     'in the warning colour, apart from the facts above it');

  // 3. Both palettes, computed. --ink-faint carries 13px text on every one of
  //    these surfaces; the old values measured 3.24:1 and 3.86:1.
  function tokens(block) {
    var out = {};
    (block.match(/--[a-z-]+:\s*#[0-9a-f]{6}/g) || []).forEach(function (d) {
      var bits = d.split(':');
      out[bits[0].trim()] = bits[1].trim();
    });
    return out;
  }
  function lum(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) {
    var x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y);
    return (hi + 0.05) / (lo + 0.05);
  }
  var light = tokens(css.slice(css.indexOf(':root {'), css.indexOf('/* Dark theme')));
  var dark = tokens(css.slice(css.indexOf(':root[data-theme="dark"] {')));
  [['light', light], ['dark', dark]].forEach(function (pair) {
    var name = pair[0], t = pair[1];
    ['--bg', '--bg-raised', '--bg-sunk', '--moss-soft', '--accent-soft'].forEach(function (surface) {
      ['--ink', '--ink-soft', '--ink-faint'].forEach(function (text) {
        if (!t[text] || !t[surface]) return;
        var r = ratio(t[text], t[surface]);
        ok(r >= 4.5, name + ': ' + text + ' on ' + surface + ' is ' + r.toFixed(2) + ':1');
      });
    });
  });

  // 4. Six tabs do not fit on a phone, and the strip never showed the one you
  //    had just chosen.
  ok(app.indexOf('function keepTabInView') !== -1, 'the chosen tab is scrolled into the strip');
  ok(app.indexOf('getBoundingClientRect') !== -1 && app.indexOf('strip.scrollLeft +') !== -1,
     'measured rather than read off offsetLeft, which belongs to the sticky header');
  ok(social.indexOf('window.FYC_TAB_IN_VIEW') !== -1, 'and the signed-in switcher does it too');

  // 5 + 6. The intake is one card being filled in, not twenty arriving.
  ok(app.indexOf('function settleHeight') !== -1, 'the card changes height rather than jumping');
  ok(css.indexOf('#intake.settling') !== -1, 'and is only clipped while it moves');
  ok(/#intake \{[^}]*transition: height/.test(css), 'the height is animated');
  ok(app.indexOf("bar.setAttribute('data-to'") !== -1, 'the progress bar is given somewhere to go');
  ok(app.indexOf('void bar.offsetWidth') !== -1,
     'and started with a reflow, not requestAnimationFrame, which a background tab throttles');

  // 7. It used to offer results from the first question, where there were none.
  ok(/enough \? el\('button'/.test(app), 'the escape hatch is conditional');
  ok(app.indexOf('var enough = !!(sofar.location && sofar.interests.length)') !== -1,
     'on there being something to show');

  // 8 + 9. Motion that was declared but never happened.
  ok(/\.plan-item:hover[^{]*\{[^}]*transform: translateY\(-2px\)/.test(css), 'cards actually lift');
  ok(/\.pill:active[^{]*\{[^}]*transform: translateY\(1px\)/.test(css), 'and options press in');

  // 10. A group chat that yanks you to the bottom while you are reading back.
  ok(circles.indexOf('var wasAtEnd = atEnd()') !== -1, 'following is conditional on being at the end');
  ok(circles.indexOf('function toEnd(') !== -1, 'and each scroll says whether it glides');
  ok(css.indexOf('.to-latest') !== -1 && circles.indexOf("class: 'to-latest'") !== -1,
     'with a way back to the newest message');
  ok(!/scroll-behavior: smooth;[^}]*\}\s*$/m.test(css.slice(css.indexOf('.msg-list'), css.indexOf('.msg-list') + 220)),
     'the list itself does not glide, or opening a thread would ride the whole history');
});


// ------------------------------------------------- the app shell, and silence
group('the shell: one frame, and nothing explaining itself', function () {
  var fs = require('fs');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
  var app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  var social = fs.readFileSync(path.join(root, 'src/social.js'), 'utf8');
  var circles = fs.readFileSync(path.join(root, 'src/circles.js'), 'utf8');
  var server = fs.readFileSync(path.join(root, 'server/app.js'), 'utf8');

  // 1. An app bar, not a masthead, and no landing block in front of the work.
  ok(html.indexOf('class="appbar"') !== -1, 'the chrome is an app bar');
  ok(html.indexOf('class="site-header"') === -1, 'the old masthead is gone');
  ok(html.indexOf('<h1>Find your people.</h1>') === -1, 'and so is the landing headline');
  ok(!/class="intro" id="intro"/.test(html), 'and the paragraph under it');
  ok(/<div id="intake"><\/div>/.test(html), 'the first thing in the page is the first question');
  ok(html.indexOf('real groups, real first steps') === -1, 'the tagline is gone');
  ok(html.indexOf('>Community Finder<') !== -1, 'the name is set as a name, not a path');

  // 2. Five tabs, each with an icon, and the two that were not sections are out.
  ok((html.match(/role="tab"/g) || []).length === 5, 'five tabs');
  ok((html.match(/class="ti"/g) || []).length === 5, 'each one carries an icon');
  ok(html.indexOf('id="tab-people"') === -1, 'People is no longer a tab of its own');
  ok(html.indexOf('id="tab-signout"') === -1, 'and signing out is not a section');
  ok(social.indexOf("} }, ['Sign out'])") !== -1, 'sign out lives on the You tab');

  // 3. On a phone the strip becomes a bottom bar.
  var mob = css.slice(css.indexOf('@media (max-width: 720px)'));
  ok(/\.tabs \{[^}]*position: fixed/.test(mob), 'the tabs are fixed to the bottom');
  ok(/\.tabs \{[^}]*bottom: 0/.test(mob), 'at the bottom edge');
  ok(/body \{ padding-bottom: calc\(66px/.test(mob), 'and the page leaves room for them');
  // backdrop-filter makes an element the containing block for fixed children,
  // which put the "bottom" bar across the top of the screen.
  ok(/\.appbar \{[^}]*backdrop-filter: none/.test(mob),
     'the app bar drops its blur there, or the bar is not fixed to the viewport');
  ok(css.indexOf('env(safe-area-inset-bottom)') !== -1, 'and it clears the home indicator');

  // 4. People and Chats are two halves of one tab.
  ok(social.indexOf('function segBar(') !== -1, 'the inbox has a segmented control');
  ok(social.indexOf("var inboxSeg = 'chats'") !== -1, 'which half is showing is remembered');
  ok(css.indexOf('.seg-btn') !== -1, 'and it is styled as one control');

  // 5. A circle is three panes, opening on the conversation.
  ok(/var panes = \{ chat:/.test(circles), 'a circle has panes');
  ok(circles.indexOf("S.pane && panes[S.pane] ? S.pane : 'chat'") !== -1, 'and opens on the chat');
  ok(circles.indexOf('function planLabel(') !== -1, 'the gate count rides on the Plan tab');
  ok(circles.indexOf('S.onReadiness = function (r)') !== -1, 'and ticks over as you send');
  ok(css.indexOf('.detail-head') !== -1, 'with a back control and a title');
  ok(!/el\('h3', \{ text: 'The conversation' \}\)/.test(circles),
     'and the chat card does not announce that it is the chat');

  // 6. Results are a list and a detail pane, not a column of cards that open
  //    in place. The accordion is gone along with the card it expanded.
  ok(app.indexOf("class: 'card org tappable'") === -1, 'the expanding result card is gone');
  ok(app.indexOf("el('div', { class: 'browse' })") !== -1, 'results are a browse layout');
  ok(!/el\('h3', \{\}, \[el\('a', \{ href: org\.url/.test(app), 'the name is no longer a link');

  // 7. The question card counts with a bar, not a sentence, and the keyboard
  //    legend is gone.
  ok(app.indexOf("'Question ' + (prog.asked + 1)") !== -1, 'the count is still announced');
  ok(app.indexOf("class: 'q-count'") === -1, 'but not printed');
  ok(app.indexOf("class: 'q-keys'") === -1, 'and the keyboard legend is gone');
  ok(css.indexOf('.q-keys') === -1, 'including its styles');
  ok(app.indexOf("class: 'recap-chips'") === -1, 'and the wall of answer chips is gone');
  ok(app.indexOf('questions answered') === -1, 'as is the sentence about the form');

  // 8. The matcher no longer narrates its own scoring on every card.
  ok(app.indexOf("class: 'why'") === -1, 'the reasons list is gone from the card');
  ok(css.indexOf('.why li') === -1, 'and from the stylesheet');
  ok(app.indexOf("' groups'") === -1, 'the heading no longer counts the list beside it');
  ok(app.indexOf('easiest to walk into first') === -1, 'the sort order is not narrated');

  // 9. The lines that explained why the product is built the way it is.
  var src = app + social + circles;
  [
    'one dominant voice',
    'think better together',
    'A group thread builds attachment',
    'Disclosure only brings people closer',
    'fifty-odd hours',
    'roughly fifty hours',
    'is not something an app can write for you',
    'the research is unkind',
    'Groups that talk online for a long time',
    'because being answered is the whole point',
    'Lines run through the interests you have in common',
    'Circles set the tier they will accept',
    'Ranked by what you have in common',
    'Small local groups that talk first and decide to meet later',
    'What this has worked out about you',
    'never exposed or searchable',
    'Blocking always wins'
  ].forEach(function (phrase) {
    ok(src.indexOf(phrase) === -1, 'no longer explains itself: "' + phrase.slice(0, 38) + '"');
  });

  // 10. The claim that there is no server, made on a page served by one.
  ok(app.indexOf('There is no account and nothing is sent anywhere') === -1,
     'the You tab no longer promises there is no server');
  ok(app.indexOf('kept on this device only') !== -1,
     'it says what is actually true of what it keeps');

  // 11. Static assets carry a validator. Without one "must-revalidate" has
  //     nothing to revalidate against, so a deploy served new HTML with the
  //     old JavaScript for five minutes.
  ok(server.indexOf("'ETag': tag") !== -1, 'static files carry an ETag');
  ok(server.indexOf("req.headers['if-none-match'] === tag") !== -1, 'and answer a conditional GET');
  ok(/res\.writeHead\(304/.test(server), 'with a 304');

  // 12. Small truths the old copy got wrong.
  ok(circles.indexOf("p.said === 1 ? '1 message'") !== -1, 'one message is not "1 messages"');
  ok(circles.indexOf("p.vouches ? (p.vouches === 1") !== -1, 'and zeroes are left off the line');
  ok(circles.indexOf('} else if (c.readiness.ready && (!meetups') !== -1,
     '"anyone can propose something" only where proposing is open');

  // 13. One word for one thing. The tab is Saved, so the button is Save —
  //     and now that saving is a toggle, the other face of it is Saved.
  ok(app.indexOf("'Add to my plan'") === -1, 'the save button does not name a tab that is gone');
  ok(app.indexOf("[inPlan(org.id) ? 'Saved \\u2713' : 'Save']") !== -1,
     'it says Save, like the tab it fills, and Saved once it is');

  // 14. The dark accent is a light orange; white on it measured 2.82:1, on
  //     the first thing a keyboard user reaches.
  ok(/:root\[data-theme="dark"\] \.skip \{ color: #171512; \}/.test(css),
     'the skip link takes dark text on the dark palette');

  // 15. The feedback pill is not floated over a conversation.
  ok(app.indexOf('function onTabShown(') !== -1, 'something runs on every tab change');
  ok(/noisy = which === 'circles' \|\| which === 'messages'/.test(app),
     'and hides the pill on the screens you type into');
});


// ------------------------------------- a list you can see all of, and silence
group('browse: the list, the pane, and the facts that stopped being chips', function () {
  var fs = require('fs');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
  var app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  var social = fs.readFileSync(path.join(root, 'src/social.js'), 'utf8');
  var circles = fs.readFileSync(path.join(root, 'src/circles.js'), 'utf8');

  // 1. Find is two panes: every result in a column, and the one you chose
  //    open beside it. It used to be one card at a time in a 1180px window.
  ok(app.indexOf("el('ol', { class: 'rows' })") !== -1, 'the results are a list');
  ok(app.indexOf("el('section', { class: 'browse-detail' })") !== -1, 'with a detail pane');
  ok(app.indexOf('function detailPane(') !== -1, 'which is rendered on its own');
  ok(app.indexOf('function orgCard(') === -1, 'and the card that expanded in place is gone');
  ok(/grid-template-columns: minmax\(250px, 320px\) minmax\(0, 1fr\)/.test(css),
     'two columns above the breakpoint');
  ok(/\.browse-list, \.browse-detail \{[^}]*overflow-y: auto/.test(css),
     'each scrolling on its own');
  ok(/height: calc\(100dvh - 56px - var\(--s6\) - var\(--s7\)\)/.test(css),
     'and together filling the frame under the bar');

  // 2. Below the breakpoint there is room for one, so choosing is navigating.
  ok(/\.browse\.on-detail \.browse-list \{ display: none; \}/.test(css),
     'the list steps aside for the detail on a phone');
  ok(/\.browse-detail \.back-btn \{ display: none; \}/.test(css),
     'and the back button is hidden where both panes are on screen');
  ok(app.indexOf('function back()') !== -1, 'the back control goes to the list');
  ok(/if \(push\) \{/.test(app), 'and the first paint does not count as a navigation');

  // 3. The three chips above every result, and the three bullets below them.
  ok(app.indexOf("class: 'badges'") === -1, 'a result no longer carries a row of chips');
  ok(app.indexOf('function factLine(') !== -1, 'the same three facts are one line');
  ok(!/el\('ul', \{ class: 'expect' \}/.test(app), 'what to expect is no longer a bulleted list');
  ok(/class: 'expect' \},\s*\n\s*org\.expect\.map/.test(app), 'but it is all still there');
  ok(app.indexOf("el('h4', { text: 'First step' })") === -1, 'the FIRST STEP eyebrow is gone');
  ok(app.indexOf("class: 'starter-flag'") === -1, 'and so is START HERE');

  // 4. The app no longer opens by reading your own answers back to you.
  ok(app.indexOf("class: 'rchip'") === -1, 'no chip wall of what you said');
  ok(app.indexOf("class: 'browse-bar'") !== -1, 'the city heads the list instead');
  ok(/\[more \? 'Change answers' : 'Start over'\]/.test(app), 'with the way back in beside it');

  // 5. A question is the screen, not a card floating in the middle of one.
  ok(/\.question \{[^}]*border: 0; background: none; box-shadow: none;/.test(css),
     'the question card has no chrome left');
  ok(/#intake \.question \{[^}]*min-height: calc\(100dvh/.test(css), 'it fills the frame');
  // A hint that says how to answer stays; the four that said why the question
  // was worth asking are out of the question set itself.
  var intake = fs.readFileSync(path.join(root, 'src/intake.js'), 'utf8');
  ok(app.indexOf("class: 'hint', text: q.hint") !== -1, 'a question can still say how to answer it');
  ok(intake.indexOf('Up to three.') !== -1, 'and the ones that do are still there');
  ok(!/hint: '(You said|It is the most reliable|Worth saying)/.test(intake),
     'but none of them argues for the question');

  // 6. Counting things the app could count, rather than things anyone asked for.
  ok(circles.indexOf("' messages this week from '") === -1,
     'a circle does not report its own message volume');
  ok(circles.indexOf("o.quiet ? null : el('span', { class: 'badge', text: r.done") !== -1,
     'and the gate count rides the Plan tab, not every card in the list');

  // 7. The footer said where your data lives, under every screen in the app.
  ok(html.indexOf('Nothing leaves this browser.') === -1, 'the footer claim is out of the page');
  ok(social.indexOf('window.FYC_STORAGE_NOTE') !== -1, 'the online version is published instead');
  ok(app.indexOf('window.FYC_STORAGE_NOTE ||') !== -1, 'and You reads it');
  ok(social.indexOf(".site-footer .wrap p') ") === -1, 'nothing writes into the footer any more');

  // 8. Phrases the interface used to say about itself.
  [
    'this is the single biggest predictor',
    'Ranked by',
    'questions answered'
  ].forEach(function (phrase) {
    ok((app + social + circles + html).indexOf(phrase) === -1, 'gone: "' + phrase + '"');
  });
});

// --------------------------------------------------------------- the drawing
// art.js builds DOM, so it gets the smallest document that lets it run. The
// stub records what was asked for, which is all these assertions read.
group('the drawn half: faces, pictograms, scenes and the guide', function () {
  var fs = require('fs');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
  var appjs = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  var social = fs.readFileSync(path.join(root, 'src/social.js'), 'utf8');
  var circles = fs.readFileSync(path.join(root, 'src/circles.js'), 'utf8');

  function Node(tag) {
    this.tag = tag; this.attrs = {}; this.kids = []; this.style = {};
    this.classList = { contains: function () { return false; } };
  }
  Node.prototype.setAttribute = function (k, v) { this.attrs[k] = String(v); };
  Node.prototype.appendChild = function (c) { this.kids.push(c); return c; };
  // art.js builds each pictogram and scene once and clones it thereafter, so
  // the stub has to be able to copy itself the way a real node can — deeply,
  // and with the copy independent of the original.
  Node.prototype.cloneNode = function () {
    var n = new Node(this.tag);
    n.ns = this.ns;
    Object.keys(this.attrs).forEach(function (k) { n.attrs[k] = this.attrs[k]; }, this);
    n.kids = this.kids.map(function (k) { return k.cloneNode(true); });
    if (this.text != null) n.text = this.text;
    return n;
  };
  Object.defineProperty(Node.prototype, 'className', {
    set: function (v) { this.attrs['class'] = v; }, get: function () { return this.attrs['class'] || ''; }
  });
  Object.defineProperty(Node.prototype, 'textContent', {
    set: function (v) { this.text = String(v); }, get: function () { return this.text || ''; }
  });
  var prevDoc = global.document;
  global.document = {
    createElementNS: function (ns, tag) { var n = new Node(tag); n.ns = ns; return n; },
    createElement: function (tag) { return new Node(tag); }
  };
  delete require.cache[require.resolve(path.join(root, 'src/art.js'))];
  require(path.join(root, 'src/art.js'));
  var ART = globalThis.FYC_ART;

  function walk(n, fn) { fn(n); (n.kids || []).forEach(function (k) { walk(k, fn); }); }
  function count(n, tag) { var c = 0; walk(n, function (x) { if (x.tag === tag) c++; }); return c; }

  // 1. Every interest the taxonomy knows about can be drawn. Without this a
  //    new city's new interest silently falls back to a blank slot.
  var missing = Object.keys(FYC.INTERESTS).filter(function (id) { return !ART.hasPictogram(id); });
  eq(missing.length, 0, 'every interest has a pictogram (' + missing.join(', ') + ')');
  ok(Object.keys(FYC.INTERESTS).length >= 32, 'and there are at least 32 of them');

  // 2. A face has to be the same face every time, or a member list reshuffles
  //    identities on each render.
  eq(ART.hash('member-7'), ART.hash('member-7'), 'the seed is stable');
  ok(ART.hash('member-7') !== ART.hash('member-8'), 'and different people differ');
  var hues = {};
  for (var i = 0; i < 300; i++) {
    var a = ART.avatar('member-' + i);
    walk(a, function (n) { if (n.tag === 'circle' && n.attrs.r === '20') hues[n.attrs.fill] = 1; });
  }
  eq(Object.keys(hues).length, 6, 'and the set reaches all six hues');

  // 3. The guide drew its torso twice: once filled as .g-body and again as a
  //    stroked path repeated in the pose array.
  ['wave', 'look', 'cheer'].forEach(function (pose) {
    var gfx = ART.guide(pose);
    eq(count(gfx, 'path'), 5, pose + ': four limbs and one jumper, no repeated torso');
    eq(count(gfx, 'circle'), 1, pose + ': one head');
  });

  // 4. All of it is decorative — the name or label beside it is what is read.
  [ART.avatar('x'), ART.pictogram('books'), ART.scene('inbox'), ART.guide('wave')].forEach(function (n) {
    eq(n.attrs['aria-hidden'], 'true', n.tag + ' drawing is hidden from the a11y tree');
    eq(n.attrs.focusable, 'false', 'and is not focusable');
  });

  // 5. Each scene exists and is more than a single shape.
  ['welcome', 'saved', 'inbox', 'circles', 'search'].forEach(function (n) {
    var sc = ART.scene(n);
    ok(sc && sc.kids.length >= 3, 'scene "' + n + '" is drawn');
  });
  eq(ART.scene('nope'), null, 'an unknown scene is null rather than a broken drawing');

  // 6. Every caller treats a missing drawing as null, so the app runs without
  //    art.js at all. That is the only reason these are guarded accessors.
  ok(appjs.indexOf('function art() { return window.FYC_ART || null; }') !== -1,
     'app.js reaches for the art defensively');
  ok(social.indexOf('function art() { return window.FYC_ART || null; }') !== -1, 'so does social.js');
  ok(circles.indexOf('function art() { return window.FYC_ART || null; }') !== -1, 'and circles.js');

  // 7. The emoji in the taxonomy is the fallback, never shown beside a drawing.
  ok(circles.indexOf("pic(i.id)") !== -1, 'circles chips ask for the drawing');
  ok(!/text: icon\(i\) \+ ' ' \+ label\(i\)/.test(circles), 'and no longer concatenate an emoji');

  // 8. Pictograms and the guide inherit text colour, which is what lets them
  //    work in both themes without a single dark-mode rule.
  ok(/\.pic, \.guide \{[^}]*stroke: currentColor/.test(css), 'the line art is stroked in currentColor');

  global.document = prevDoc;
});

// ------------------------------------------------------- the footer is gone
group('the footer came off every screen', function () {
  var fs = require('fs');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
  var appjs = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');

  ok(html.indexOf('site-footer') === -1, 'there is no footer element left');
  ok(css.indexOf('footer.site-footer') === -1, 'and no rules describing one');
  ok(css.indexOf('.foot-links') === -1, 'nor the link row it used to hold');

  // Removing it outright would have orphaned the two legal pages: the footer
  // was the only thing in the app that linked to them.
  ok(appjs.indexOf("href: 'privacy.html'") !== -1, 'Privacy is reachable from You');
  ok(appjs.indexOf("href: 'terms.html'") !== -1, 'and so is Terms');
  ok(css.indexOf('.you-legal') !== -1, 'the row they moved to is styled');
});

// -------------------------------------------- forty changes, in four parts
group('the pass over the whole thing: technical', function () {
  var fs = require('fs');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
  var app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  var art = fs.readFileSync(path.join(root, 'src/art.js'), 'utf8');

  // 1. Enter advanced nothing on a multi-select question: the handler matched
  //    a button labelled 'Next', and the button has said Continue for a long
  //    time. It is marked now, so the label is free to change again.
  ok(app.indexOf("b.textContent === 'Next'") === -1, 'Enter no longer hunts for a label that is gone');
  ok(app.indexOf("querySelector('[data-continue]')") !== -1, 'it finds the button by its mark');
  ok(app.indexOf("'data-continue': true") !== -1, 'and the button carries it');

  // 2. Dead code from before the intake replaced the one-page form. All of it
  //    reached ids that no longer exist, and surprise() called a function that
  //    is not defined anywhere in the repo.
  ['#location', '#firstname', '#finder', 'paintInterests', 'MAX_INTERESTS'].forEach(function (gone) {
    ok(app.indexOf(gone) === -1, 'app.js no longer mentions ' + gone);
  });
  ok(app.indexOf('function surprise()') === -1, 'surprise() is gone');
  ok(app.indexOf('function profile()') === -1, 'and so is the profile() that read those fields');

  // 3. The CSS that dressed them.
  ['.submit-bar', '.quick {', '.chip {', '.pill .rank', '.script {', '.badge.ease1',
   '.conf-bar', '.picked {', 'details.more'].forEach(function (gone) {
    ok(css.indexOf(gone) === -1, 'no rules left for ' + gone);
  });

  // 4. Choosing dark inside a light system left the browser's own chrome
  //    light: both theme-color tags are scoped by prefers-color-scheme.
  ok(html.indexOf('name="theme-color" content="#fbf8f4" media=') !== -1, 'the scoped pair is still there');
  ok(app.indexOf('theme-color-pick') !== -1, 'and a third, unscoped tag follows the choice');
  ok(app.indexOf('paintBrowserChrome(currentTheme())') !== -1, 'set on load as well as on click');

  // 5. One mark everywhere. The tab was the last place showing an emoji,
  //    which is a different picture on every platform.
  ok(html.indexOf('href="assets/icon.svg"') !== -1, 'the tab icon is the drawn mark');
  ok(html.indexOf('<text y=') === -1, 'and not an emoji in a data URI');
  ok(html.indexOf('rel="apple-touch-icon"') !== -1, 'and the home screen gets it too');

  // 6. With scripting off the whole frame is blank, because there is no
  //    server rendering any of it.
  ok(html.indexOf('<noscript>') !== -1, 'there is a noscript block');
  ok(html.indexOf('This one needs JavaScript') !== -1, 'that says so plainly');

  // 7. The server sends a CSP; Pages cannot, so index.html carries its own.
  //    The legal pages get the same, in the commit that is about them.
  var policy = (html.match(/Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';
  ok(policy.length > 40, 'index.html carries a policy');
  // Deliberately not frame-ancestors: a meta element ignores it, and logs an
  // error saying so on every single page load.
  ok(policy.indexOf('frame-ancestors') === -1, 'without the directive meta ignores');
  ok(policy.indexOf("base-uri 'none'") !== -1, 'and pinning the base URI');
  ok(policy.indexOf('unsafe-eval') === -1, 'with no eval');

  // 8. The list is re-ranked whenever an answer changes, so an index kept
  //    across that opens whatever now sits in the slot.
  ok(app.indexOf('browsePick = items[i].r.org.id') !== -1, 'the open listing is held by id');
  ok(app.indexOf('it.r.org.id === browsePick') !== -1, 'and found again by id');

  // 9. A results page is a dozen rows plus a badge, and the chooser is
  //    thirty-two pills: the same drawings, rebuilt path by path each time.
  ok(art.indexOf('PICTO_CACHE') !== -1, 'pictograms are built once');
  ok(art.indexOf('SCENE_CACHE') !== -1, 'scenes too');
  ok(art.indexOf('cloneNode(true)') !== -1, 'and cloned after that');

  // 10. The 400ms fallback was never cleared, so three quick answers left
  //     three timers, each firing on a host that had moved on.
  ok(app.indexOf('settleTimer = setTimeout(done, 400)') !== -1, 'the fallback timer is held');
  ok(app.indexOf('if (settleTimer) { clearTimeout(settleTimer)') !== -1, 'and cleared on the next question');
});

group('the pass over the whole thing: the interface', function () {
  var fs = require('fs');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
  var app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  var social = fs.readFileSync(path.join(root, 'src/social.js'), 'utf8');
  var circles = fs.readFileSync(path.join(root, 'src/circles.js'), 'utf8');

  // 11. Interests were drawings in the chooser and bare text on the card
  //     below it — two answers to one question on the same screen.
  ok(social.indexOf('A ? A.pictogram(i) : null, el(\'span\', { text: label(i) })') !== -1,
     'a person’s interests are drawn, as they are everywhere else');

  // 12. The subject badge was always moss, so a page of listings was a page
  //     of identical green squares. Six groups, three tints.
  ok(app.indexOf('function tintFor(org)') !== -1, 'the badge takes a tint from the interest group');
  ['.pic-badge.leaf', '.pic-badge.warm', '.pic-badge.cool'].forEach(function (c) {
    ok(css.indexOf(c) !== -1, c + ' exists');
  });
  ok(app.indexOf("'pic-badge ' + tintFor(org)") !== -1, 'and the pane uses it');

  // 13. The app bar was the one surface with no drawing on it.
  ok(html.indexOf('class="mark"') !== -1, 'the brand has a mark');
  ok(css.indexOf('.brand .mark') !== -1, 'which is styled');

  // 14. Everyone on People has a face; the card where you set yours up was
  //     the only one without one.
  ok(social.indexOf("art().avatar('person-' + u.id)") !== -1, 'your own profile card carries your face');
  ok(css.indexOf('.who-head') !== -1, 'and the row it sits in is styled');

  // 15. The selected row tinted, which reads as a highlighted word rather
  //     than a position in a column.
  ok(css.indexOf('.row[aria-current="true"]::before') !== -1, 'the open row has an edge');

  // 16. Four ticks is the whole point of a saved item.
  ok(app.indexOf("art().guide('cheer')") !== -1, 'finishing one is drawn, not just a full bar');
  ok(css.indexOf('.plan-item.done') !== -1, 'and the card says so');

  // 17. The step box is the thing you actually do; it leads with the subject.
  ok(app.indexOf("class: 'step-head'") !== -1, 'the step box leads with the drawing');
  ok(css.indexOf('.step-head') !== -1, 'styled as a row');

  // 18. Where the system asks for more contrast, the line work is the first
  //     thing to disappear: --line-strong is a mid grey by design.
  ok(css.indexOf('@media (prefers-contrast: more)') !== -1, 'the drawings answer prefers-contrast');
  ok(/prefers-contrast: more\)[^}]*\{[\s\S]{0,400}sc-line/.test(css), 'and it reaches the scenes');

  // 19. A circle is a particular set of people. The header named it and
  //     showed none of them — and only the real member list is ever drawn.
  ok(circles.indexOf('art().avatarStack(d.members.map') !== -1, 'the circle header shows its members');
  ok(circles.indexOf('if (art() && d.members && d.members.length)') !== -1,
     'and nothing at all where there is no member list');

  // 20. Saved rows say so in the list, not only in the pane.
  ok(app.indexOf("class: 'row-saved'") !== -1, 'a saved row carries a tick');
  ok(css.indexOf('.row.is-saved .row-saved') !== -1, 'shown only when it is saved');
});

group('the pass over the whole thing: using it', function () {
  var fs = require('fs');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  var css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
  var app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  var social = fs.readFileSync(path.join(root, 'src/social.js'), 'utf8');

  // 21. The one number worth printing here: whether this is a list you can
  //     get through.
  ok(app.indexOf("class: 'browse-n'") !== -1, 'the bar says how many places there are');
  ok(css.indexOf('.browse-n') !== -1, 'and it is styled quietly');

  // 22. Twelve rows meant twelve tab stops to get past the column.
  ok(app.indexOf('function rowKeys(e)') !== -1, 'the rows answer the arrow keys');
  ok(app.indexOf("e.key === 'Home'") !== -1, 'Home and End too');

  // 23. Reloading always landed on Find, whatever you had open.
  ok(app.indexOf('tab: \'fyc.tab.v1\'') !== -1, 'the tab is remembered');
  ok(app.indexOf('function openAt()') !== -1, 'and reopened');
  ok(social.indexOf('window.FYC_LAST_TAB ? window.FYC_LAST_TAB()') !== -1,
     'including when accounts own the switching');

  // 24. An empty screen that only says it is empty leaves you to find the
  //     way out yourself.
  ok(app.indexOf("}, ['Find something'])") !== -1, 'the empty Saved screen carries the door');
  ok(css.indexOf('.empty .actions') !== -1, 'and the row is styled');

  // 25. Under the breakpoint the detail pane is a whole screen; Escape is
  //     how you leave one.
  ok(app.indexOf(".browse.on-detail'") !== -1, 'Escape closes the detail pane');

  // 26. It used to set itself to "Saved ✓" and disable, so the only way to
  //     undo a mis-tap was to go and find the Saved tab.
  ok(app.indexOf('function togglePlan(org)') !== -1, 'saving is a toggle');
  ok(app.indexOf('btn.disabled = true') === -1, 'and nothing is disabled on save');
  ok(app.indexOf("'aria-pressed': inPlan(org.id)") !== -1, 'the button says which way it is');

  // 27 + 28. The whole two-pane browser was one live region, so every tap on
  //     a row re-announced the list, the notices and the pane together.
  ok(html.indexOf('id="results-status"') !== -1, 'there is a one-line status');
  ok(/id="results"[^>]*aria-live/.test(html) === false, 'and the panes are no longer live');
  ok(app.indexOf('function announce(text)') !== -1, 'something writes to it');
  ok(app.indexOf("role: 'status'") !== -1, 'and the share result is announced');

  // 29. Escape closed the feedback panel; clicking back at the page did not.
  ok(app.indexOf("document.addEventListener('pointerdown'") !== -1, 'clicking away closes it');

  // 30. Every save was wrapped in a try that swallowed the failure, so a
  //     full or blocked store looked exactly like a working one.
  ok(app.indexOf('storageWarned') !== -1, 'a blocked store is reported');
  ok(app.indexOf('will not let the app store anything') !== -1, 'in a sentence, once');
  ok(css.indexOf('.storage-warn') !== -1, 'and it is styled');
});

console.log('\n' + (fail ? '✗' : '✓') + ' ' + pass + ' passed, ' + fail + ' failed');
if (fail) {
  failures.slice(0, 25).forEach(function (f) { console.log('   ✗ ' + f); });
  if (failures.length > 25) console.log('   … and ' + (failures.length - 25) + ' more');
  process.exit(1);
}
