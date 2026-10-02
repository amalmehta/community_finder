/* community_finder — matching engine.
 * Pure functions: profile in, ranked+explained results out. No DOM, no I/O,
 * so it can be unit-tested in Node.
 */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./data/core.js');

  // Ceiling on how much the learned profile may move a score.
  var LEARNED_MAX = 0.18;

  var WEIGHTS = {
    interest: 0.44,
    gentleness: 0.20,
    commitment: 0.10,
    cost: 0.08,
    schedule: 0.10,
    goals: 0.08
  };

  // Rank decay: the first interest someone picks matters most.
  function rankWeight(i) {
    return [1, 0.88, 0.78, 0.7, 0.64, 0.6][i] || 0.55;
  }

  function clamp01(n) {
    return n < 0 ? 0 : n > 1 ? 1 : n;
  }

  function interestScore(org, interests) {
    if (!interests.length) return 0.5;
    var got = 0, max = 0;
    interests.forEach(function (id, i) {
      var w = rankWeight(i);
      max += w;
      if (org.interests.indexOf(id) !== -1) got += w;
    });
    // Reward depth of overlap, but don't require a perfect match.
    return max ? clamp01(Math.pow(got / max, 0.65)) : 0;
  }

  // comfort: 1 = "this feels hard", 2 = "a bit nervous", 3 = "throw me in"
  // Normalised to the full 0..1 range so this dimension can actually move the
  // ranking rather than nudging it by a rounding error.
  function gentlenessScore(org, comfort) {
    var gentle = ((org.gentleness || 3) - 1) / 4;
    var solo = ((org.solo || 3) - 1) / 4;
    if (comfort === 1) return clamp01(gentle * 0.7 + solo * 0.3);
    if (comfort === 2) return clamp01(0.3 + gentle * 0.45 + solo * 0.25);
    // Ready to dive in: a bit of intensity is a feature, not a cost.
    return clamp01(0.35 + (1 - gentle) * 0.35 + solo * 0.3);
  }

  var COMMIT_ORDER = ['one-off', 'weekly', 'seasonal'];
  function commitmentScore(org, want) {
    if (!want || want === 'any') return 0.8;
    var a = COMMIT_ORDER.indexOf(org.commitment);
    var b = COMMIT_ORDER.indexOf(want);
    if (a === -1 || b === -1) return 0.6;
    var d = Math.abs(a - b);
    return d === 0 ? 1 : d === 1 ? 0.6 : 0.3;
  }

  function costScore(org, budget) {
    if (budget == null) return 0.8;
    if (org.cost <= budget) return 1;
    return org.cost - budget === 1 ? 0.35 : 0.15;
  }

  function scheduleScore(org, when) {
    if (!when || !when.length || when.indexOf('flexible') !== -1) return 0.9;
    if (!org.when || !org.when.length) return 0.7;
    if (org.when.indexOf('flexible') !== -1) return 1;
    var hit = org.when.some(function (w) {
      return when.indexOf(w) !== -1;
    });
    return hit ? 1 : 0.3;
  }

  function goalScore(org, goals) {
    if (!goals || !goals.length) return 0.7;
    var hits = (org.goals || []).filter(function (x) {
      return goals.indexOf(x) !== -1;
    }).length;
    return clamp01(hits / Math.min(goals.length, 2));
  }

  var WHEN_LABEL = {
    'weekday-day': 'weekday daytimes',
    'weekday-eve': 'weekday evenings',
    'weekend': 'weekends',
    'flexible': 'a flexible schedule'
  };

  /** Human-readable reasons this org surfaced, for the "why" line on the card. */
  function explain(org, p, parts) {
    var reasons = [];
    var matched = (p.interests || []).filter(function (id) {
      return org.interests.indexOf(id) !== -1;
    });
    if (matched.length) {
      reasons.push(
        'Matches ' +
          matched
            .slice(0, 3)
            .map(function (id) {
              return (FYC.INTERESTS[id] || {}).label || id;
            })
            .join(' + ')
      );
    }
    if (p.comfort === 1 && org.gentleness >= 4 && org.solo >= 4) {
      reasons.push('Low-pressure and easy to attend alone');
    } else if (org.solo >= 4) {
      reasons.push('Turning up alone is normal here');
    }
    if (org.cost === 0) reasons.push('Free');
    else if (org.cost > (p.budget == null ? 2 : p.budget)) reasons.push('Costs more than your budget — listed anyway because it fits well');
    if (parts.schedule === 1 && p.when && p.when.length && p.when.indexOf('flexible') === -1) {
      var labels = (org.when || [])
        .filter(function (w) { return p.when.indexOf(w) !== -1; })
        .map(function (w) { return WHEN_LABEL[w]; })
        .filter(Boolean);
      if (labels.length) reasons.push('Runs on ' + labels.slice(0, 2).join(' and '));
    }
    if (org.commitment === 'one-off' && (p.commitment === 'one-off' || !p.commitment)) {
      reasons.push('One-off — you can try it once and never go back');
    }
    return reasons.slice(0, 4);
  }

  /** 1–3 "how hard is this to walk into" rating, used for the ease badge. */
  function ease(org) {
    var e = ((org.gentleness || 3) + (org.solo || 3)) / 2;
    if (e >= 4.5) return { level: 3, label: 'Very easy to walk into' };
    if (e >= 3.5) return { level: 2, label: 'Easy once you arrive' };
    return { level: 1, label: 'Worth the nerve' };
  }

  /** How many of the person's chosen interests this listing actually covers. */
  function overlapCount(org, interests) {
    return (interests || []).filter(function (id) {
      return org.interests.indexOf(id) !== -1;
    }).length;
  }

  function scoreOrg(org, p) {
    var parts = {
      interest: interestScore(org, p.interests || []),
      gentleness: gentlenessScore(org, p.comfort || 2),
      commitment: commitmentScore(org, p.commitment),
      cost: costScore(org, p.budget),
      schedule: scheduleScore(org, p.when),
      goals: goalScore(org, p.goals)
    };
    var total = 0;
    Object.keys(WEIGHTS).forEach(function (k) {
      total += WEIGHTS[k] * parts[k];
    });

    // What someone has actually done nudges the ranking, but never drives it:
    // the stated interests, budget and comfort still decide. The pull scales
    // with how much evidence there is, up to a hard ceiling.
    var learned = null;
    if (p.learned && p.learned.ready && FYC.prefs) {
      var fit = FYC.prefs.fit(org, p.learned);
      var pull = LEARNED_MAX * p.learned.confidence;
      total = total * (1 - pull) + fit * pull;
      learned = { fit: fit, pull: pull };
    }
    var r = {
      org: org, score: total, parts: parts,
      reasons: explain(org, p, parts), ease: ease(org),
      overlap: overlapCount(org, p.interests),
      learned: learned
    };
    // Say so when the learned profile is why something rose.
    if (learned && learned.fit > 0.72 && r.reasons.length < 4) {
      r.reasons.push('Like the things you keep coming back to');
    }
    return r;
  }

  /**
   * Re-rank so the top of the list isn't five versions of the same thing.
   * Each time an interest is re-used by a higher-ranked result, later results
   * leaning on that same interest are nudged down.
   */
  function diversify(results, interests) {
    var used = {};
    var out = [];
    var pool = results.slice();
    while (pool.length) {
      var bestIdx = 0, bestVal = -1;
      for (var i = 0; i < pool.length; i++) {
        var r = pool[i];
        var primary = (interests || []).filter(function (id) {
          return r.org.interests.indexOf(id) !== -1;
        });
        var penalty = primary.reduce(function (acc, id) {
          return acc + (used[id] || 0);
        }, 0);
        var adj = r.score * Math.pow(0.93, penalty);
        if (adj > bestVal) { bestVal = adj; bestIdx = i; }
      }
      var chosen = pool.splice(bestIdx, 1)[0];
      (interests || []).forEach(function (id) {
        if (chosen.org.interests.indexOf(id) !== -1) used[id] = (used[id] || 0) + 1;
      });
      out.push(chosen);
    }
    return out;
  }

  /**
   * @param {Object} p profile: {location, interests[], comfort 1-3, commitment,
   *                             budget 0-2, when[], goals[], name}
   * @returns {{city, cityMatched, results, universal}}
   */
  FYC.match = function (p) {
    p = p || {};
    p.interests = p.interests || [];
    var city = FYC.findCity(p.location);
    var pool = city ? city.orgs : [];

    var scored = pool.map(function (o) { return scoreOrg(o, p); });

    // Which of the chosen interests this city actually has listings for. An
    // interest nobody covers is reported, not quietly padded out with
    // unrelated groups that happen to score well on cost and gentleness.
    var uncovered = (p.interests || []).filter(function (id) {
      return !pool.some(function (o) { return o.interests.indexOf(id) !== -1; });
    });

    // A listing that matches none of the chosen interests is not a match.
    if ((p.interests || []).length) {
      scored = scored.filter(function (r) { return r.overlap > 0; });
    }

    // Budget is a stated constraint: filter, but relax if it empties the list.
    var affordable = scored.filter(function (r) { return r.org.cost <= (p.budget == null ? 2 : p.budget); });
    var results = affordable.length >= 4 ? affordable : scored;

    results.sort(function (a, b) { return b.score - a.score; });
    results = diversify(results, p.interests);

    var uni = FYC.buildUniversal(city ? city.name : p.location, p.interests)
      .map(function (o) { return scoreOrg(o, p); });
    uni.sort(function (a, b) { return b.score - a.score; });
    uni = diversify(uni, p.interests);

    return {
      city: city,
      learned: p.learned && p.learned.ready ? p.learned : null,
      cityMatched: !!city,
      locationText: p.location || '',
      results: results,
      universal: uni,
      // Interests this city has no hand-picked listing for, so the UI can say so.
      uncovered: uncovered,
      covered: (p.interests || []).filter(function (id) { return uncovered.indexOf(id) === -1; })
    };
  };

  FYC._internals = { scoreOrg: scoreOrg, interestScore: interestScore, diversify: diversify, ease: ease };

  if (typeof module !== 'undefined' && module.exports) module.exports = FYC;
})(typeof globalThis !== 'undefined' ? globalThis : this);
