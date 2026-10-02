/* community_finder — UI.
 * Vanilla DOM, no build step, no network. State lives in localStorage.
 */
(function () {
  'use strict';
  var FYC = window.FYC;

  // ---------- tiny DOM helpers ----------
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === 'class') n.className = props[k];
        else if (k === 'text') n.textContent = props[k];
        else if (k === 'html') n.innerHTML = props[k];
        else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), props[k]);
        else if (props[k] === true) n.setAttribute(k, '');
        else if (props[k] !== false && props[k] != null) n.setAttribute(k, props[k]);
      });
    }
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  /** Namespaced element builder, for the charts on the You tab. */
  function svg(tag, props, kids) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'text') n.textContent = props[k];
      else n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  /** Note an action against a listing, if tracking is on. */
  function track(type, org) {
    if (FYC.prefs) FYC.prefs.record(type, org);
  }

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  // ---------- storage ----------
  var KEY = { plan: 'fyc.plan.v1', profile: 'fyc.profile.v1', feedback: 'fyc.feedback.v1' };
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ }
  }

  // ---------- selection state ----------
  var state = {
    interests: [],           // ordered
    comfort: 1,
    when: [],
    goals: [],
    commitment: null,
    budget: null
  };
  var MAX_INTERESTS = 6;
  var plan = load(KEY.plan, []);

  // ---------- build the form ----------
  function buildCityChips() {
    var host = $('#city-quick');
    FYC.cities.forEach(function (c) {
      host.appendChild(el('button', {
        type: 'button', class: 'chip',
        onclick: function () { $('#location').value = c.name; paintPicked(); }
      }, [c.name]));
    });
  }

  function buildInterests() {
    var host = $('#interest-groups');
    FYC.GROUPS.forEach(function (grp) {
      var pills = el('div', { class: 'pills' });
      grp.interests.forEach(function (i) {
        var btn = el('button', {
          type: 'button', class: 'pill', 'aria-pressed': 'false', 'data-interest': i.id,
          onclick: function () { toggleInterest(i.id); }
        }, [
          el('span', { 'aria-hidden': 'true', text: i.icon }),
          el('span', { text: i.label }),
          el('span', { class: 'rank', hidden: true })
        ]);
        pills.appendChild(btn);
      });
      host.appendChild(el('div', { class: 'group' }, [el('h3', { text: grp.label }), pills]));
    });
  }

  function toggleInterest(id) {
    var at = state.interests.indexOf(id);
    if (at !== -1) state.interests.splice(at, 1);
    else if (state.interests.length >= MAX_INTERESTS) {
      flashError('That&rsquo;s six &mdash; plenty. Unpick one if you&rsquo;d rather swap.');
      return;
    } else state.interests.push(id);
    paintInterests();
  }

  // One-line readiness hint beside the submit button, so people can see what's
  // still missing without scrolling back up.
  function paintPicked() {
    var box = $('#picked');
    var city = $('#location').value.trim();
    var n = state.interests.length;
    var missing = [];
    if (!city) missing.push('a city');
    if (!n) missing.push('at least one interest');
    box.classList.toggle('ready', !missing.length);
    box.textContent = missing.length
      ? missing.join(' and ') + ' needed'
      : (FYC.findCity(city) ? FYC.findCity(city).name : city) + ' · ' + n + (n === 1 ? ' interest' : ' interests');
  }

  function paintInterests() {
    paintPicked();
    $$('[data-interest]').forEach(function (btn) {
      var idx = state.interests.indexOf(btn.getAttribute('data-interest'));
      var on = idx !== -1;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var rank = btn.querySelector('.rank');
      rank.hidden = !on;
      rank.textContent = on ? String(idx + 1) : '';
    });
  }

  // Generic pill group wiring. `multi` = checkbox-style, else radio-style.
  function wirePills(sel, key, multi, cast) {
    $$(sel + ' .pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var raw = btn.getAttribute('data-value');
        var val = cast ? cast(raw) : raw;
        if (multi) {
          var arr = state[key];
          var at = arr.indexOf(val);
          if (at === -1) arr.push(val); else arr.splice(at, 1);
        } else {
          state[key] = state[key] === val ? null : val;
        }
        $$(sel + ' .pill').forEach(function (b) {
          var v = cast ? cast(b.getAttribute('data-value')) : b.getAttribute('data-value');
          var on = multi ? state[key].indexOf(v) !== -1 : state[key] === v;
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    });
  }

  function wireComfort() {
    $$('#comfort .choice').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.comfort = Number(btn.getAttribute('data-value'));
        $$('#comfort .choice').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
      });
    });
  }

  function flashError(msgHtml) {
    var box = $('#form-error');
    box.innerHTML = msgHtml;
    box.hidden = false;
    clearTimeout(flashError.t);
    flashError.t = setTimeout(function () { box.hidden = true; }, 5000);
  }

  // ---------- results ----------
  function profile() {
    return {
      location: $('#location').value.trim(),
      name: $('#firstname').value.trim(),
      interests: state.interests.slice(),
      comfort: state.comfort,
      when: state.when.slice(),
      goals: state.goals.slice(),
      commitment: state.commitment,
      budget: state.budget
    };
  }

  var STRUCTURE_LABEL = {
    'drop-in': 'Drop-in', 'register': 'Sign up first', 'course': 'Runs as a course',
    'shift': 'Book a shift', 'rsvp': 'RSVP first', 'search': 'Directory'
  };
  var COMMIT_LABEL = { 'one-off': 'One-off', 'weekly': 'Weekly-ish', 'seasonal': 'Season-long' };
  var COST_LABEL = ['Free', 'Low cost', 'Costs money'];

  function orgCard(r, p, opts) {
    opts = opts || {};
    var org = r.org;
    var body = el('div', { class: 'org-body' });

    var head = el('div', {}, [
      opts.starter ? el('span', { class: 'starter-flag', text: 'Start here' }) : null,
      el('h3', {}, [el('a', { href: org.url, target: '_blank', rel: 'noopener noreferrer', text: org.name })]),
      el('p', { class: 'where', text: [org.neighborhood, org.cityName].filter(Boolean).join(' · ') }),
      el('p', { class: 'blurb', text: org.blurb })
    ]);

    var badges = el('div', { class: 'badges' }, [
      el('span', { class: 'badge ease' + r.ease.level, text: r.ease.label }),
      el('span', { class: 'badge', text: STRUCTURE_LABEL[org.structure] || org.structure }),
      el('span', { class: 'badge', text: COMMIT_LABEL[org.commitment] || org.commitment }),
      el('span', { class: 'badge', text: COST_LABEL[org.cost] || '' })
    ]);

    var why = el('ul', { class: 'why' }, r.reasons.map(function (t) { return el('li', { text: t }); }));

    // --- first step panel ---
    var step = el('div', { class: 'first-step' }, [
      el('h4', { text: 'First step' }),
      el('p', { class: 'do', text: org.firstStep.label }),
      org.firstStep.when ? el('p', { class: 'when', text: org.firstStep.when }) : null,
      el('div', { class: 'actions' }, [
        el('a', {
          class: 'btn sm', href: org.firstStep.url || org.url,
          target: '_blank', rel: 'noopener noreferrer',
          onclick: function () { track('open', org); }
        }, [org.universal ? 'Open the directory →' : 'Open the page →']),
        el('button', {
          class: 'btn ghost sm', type: 'button',
          onclick: function (e) { addToPlan(org, e.currentTarget); }
        }, ['Add to my plan'])
      ]),
      el('ul', { class: 'expect' }, org.expect.map(function (t) { return el('li', { text: t }); }))
    ]);

    body.appendChild(head);
    body.appendChild(badges);
    if (r.reasons.length) body.appendChild(why);

    if (opts.starter) {
      body.appendChild(step);
    } else {
      var wrapStep = el('div', { hidden: true }, [step]);
      var toggle = el('button', {
        class: 'toggle', type: 'button', 'aria-expanded': 'false',
        onclick: function (e) {
          var open = wrapStep.hidden;
          if (open) track('expand', org);
          wrapStep.hidden = !open;
          e.currentTarget.setAttribute('aria-expanded', open ? 'true' : 'false');
          e.currentTarget.textContent = open ? 'Hide' : 'Details';
        }
      }, ['Details']);
      body.appendChild(toggle);
      body.appendChild(wrapStep);
    }

    return el('article', { class: 'card org' + (opts.starter ? ' starter' : '') }, [body]);
  }

  function render(m, p) {
    var host = $('#results');
    host.innerHTML = '';

    // A curated city with nothing matching the chosen interests is not a
    // curated result — fall through to the national routes rather than
    // padding the page with groups that match nothing the person asked for.
    var hasCurated = m.cityMatched && m.results.length > 0;
    var curated = m.results.slice(0, 8);
    var uni = m.universal.slice(0, hasCurated ? 4 : 8);
    var primary = hasCurated ? curated : uni;

    function labels(ids) {
      return (ids || []).map(function (id) {
        return (FYC.INTERESTS[id] || {}).label || id;
      });
    }
    function joinList(arr) {
      if (arr.length <= 1) return arr[0] || '';
      return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
    }

    if (!primary.length) {
      host.appendChild(el('div', { class: 'empty' }, [
        el('h2', { text: 'No matches.' }),
        el('p', { text: 'Loosen the budget or timing filters, or pick more interests.' })
      ]));
      host.hidden = false;
      return;
    }

    var where = m.cityMatched ? m.city.name : (p.location || 'your area');
    host.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: hasCurated ? 'Places to start in ' + where : 'Ways in, near ' + where }),
      el('p', { text: primary.length + ' matches, easiest to walk into first' })
    ]));

    // Say outright which interests this city has no hand-picked listing for.
    if (m.cityMatched && m.uncovered && m.uncovered.length) {
      var missing = joinList(labels(m.uncovered));
      host.appendChild(el('div', { class: 'notice' }, [
        el('b', { text: 'No hand-picked ' + missing + ' listings in ' + where + ' yet. ' }),
        hasCurated
          ? 'The groups below match your other interests. For ' + missing +
            ', use the national routes further down — they are live searches, not guesses.'
          : 'Rather than show you groups that match none of that, here are the national routes for it.'
      ]));
    }

    if (!m.cityMatched) {
      host.appendChild(el('div', { class: 'notice' }, [
        el('b', { text: 'No hand-picked list for ' + where + ' yet. ' }),
        'These are national directories and programmes that exist almost everywhere, pointed at your city and your interests. ' +
        'Every link below is a live search or finder, not a guess.'
      ]));
    }

    primary.forEach(function (r, i) {
      host.appendChild(orgCard(r, p, { starter: i === 0 }));
    });

    if (hasCurated && uni.length) {
      var uncoveredLabels = labels(m.uncovered || []);
      host.appendChild(el('div', { class: 'results-head' }, [
        el('h2', { text: 'Works anywhere' }),
        el('p', {
          text: uncoveredLabels.length
            ? 'Including ' + joinList(uncoveredLabels)
            : 'National routes in, if none of the above fits'
        })
      ]));
      uni.forEach(function (r) { host.appendChild(orgCard(r, p, {})); });
    }

    host.hidden = false;
  }

  // ---------- plan ----------
  var PLAN_STEPS = [
    'Read what it involves',
    null, // replaced by the org's own first step
    'Go',
    'Go again'
  ];

  function addToPlan(org, btn) {
    if (plan.some(function (x) { return x.id === org.id; })) {
      if (btn) btn.textContent = 'Already in your plan';
      return;
    }
    track('plan', org);
    plan.push({
      id: org.id,
      name: org.name,
      cityName: org.cityName,
      url: org.firstStep.url || org.url,
      stepLabel: org.firstStep.label,
      when: org.firstStep.when || '',
      done: [false, false, false, false],
      added: Date.now(),
      // kept so ticking a step or removing it can still be attributed
      attrs: {
        id: org.id, interests: org.interests, cost: org.cost,
        gentleness: org.gentleness, solo: org.solo,
        structure: org.structure, commitment: org.commitment,
        universal: !!org.universal
      }
    });
    save(KEY.plan, plan);
    paintPlanCount();
    renderPlan();
    if (btn) { btn.textContent = 'Added ✓'; btn.disabled = true; }
  }

  function paintPlanCount() {
    var c = $('#plan-count');
    c.textContent = String(plan.length);
    c.hidden = plan.length === 0;
  }

  function renderPlan() {
    var host = $('#plan-body');
    host.innerHTML = '';
    if (!plan.length) {
      host.appendChild(el('div', { class: 'empty' }, [
        el('h2', { text: 'Nothing saved.' }),
        el('p', { text: 'Add something from the Find tab.' })
      ]));
      return;
    }

    host.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: 'My plan' }),
      el('p', { text: plan.length + (plan.length === 1 ? ' saved' : ' saved') })
    ]));

    plan.forEach(function (item, idx) {
      var steps = PLAN_STEPS.map(function (s, i) { return i === 1 ? item.stepLabel : s; });
      var doneCount = item.done.filter(Boolean).length;
      var bar = el('i');
      bar.style.width = (doneCount / 4 * 100) + '%';

      var list = el('ul', { class: 'steps' }, steps.map(function (label, i) {
        var cbId = 'plan-' + idx + '-' + i;
        var span = el('span', { class: item.done[i] ? 'done' : '', text: label });
        var cb = el('input', { type: 'checkbox', id: cbId });
        cb.checked = !!item.done[i];
        cb.addEventListener('change', function () {
          item.done[i] = cb.checked;
          if (cb.checked && item.attrs) track('step', item.attrs);
          save(KEY.plan, plan);
          renderPlan();
        });
        return el('li', {}, [cb, el('label', { for: cbId }, [span])]);
      }));

      host.appendChild(el('article', { class: 'card plan-item' }, [
        el('h3', { text: item.name }),
        el('p', { class: 'where', text: [item.cityName, item.when].filter(Boolean).join(' · ') }),
        el('div', { class: 'progress' }, [bar]),
        list,
        el('div', { class: 'actions' }, [
          el('a', { class: 'btn ghost sm', href: item.url, target: '_blank', rel: 'noopener noreferrer' }, ['Open the page →']),
          el('button', {
            class: 'btn ghost sm', type: 'button',
            onclick: function () {
              if (item.attrs) track('unplan', item.attrs);
              plan.splice(idx, 1);
              save(KEY.plan, plan);
              paintPlanCount();
              renderPlan();
            }
          }, ['Remove'])
        ])
      ]));
    });
  }

  // ---------- the You tab: what has been learned, and the controls for it ----

  /** Horizontal bar chart of interest affinity, -1..1. */
  function affinityChart(profile) {
    var ids = profile.top.concat(profile.avoided);
    if (!ids.length) return null;

    var rowH = 26, padL = 196, w = 520, h = ids.length * rowH + 8;
    var mid = padL;
    var maxBar = w - padL - 20;

    var kids = [
      svg('line', { x1: mid, y1: 2, x2: mid, y2: h - 6, class: 'axis' })
    ];

    ids.forEach(function (id, i) {
      var v = profile.affinity[id] || 0;
      var y = i * rowH + 6;
      var len = Math.abs(v) * maxBar * 0.5;
      var name = (FYC.INTERESTS[id] || {}).label || id;
      if (name.length > 22) name = name.slice(0, 21) + '\u2026';
      kids.push(svg('text', {
        x: mid - 10, y: y + 13, class: 'lbl', 'text-anchor': 'end', text: name
      }));
      kids.push(svg('rect', {
        x: v >= 0 ? mid : mid - len, y: y + 3, width: Math.max(2, len), height: 14,
        rx: 3, class: v >= 0 ? 'bar pos' : 'bar neg'
      }));
    });

    return svg('svg', {
      viewBox: '0 0 ' + w + ' ' + h, class: 'chart', role: 'img',
      'aria-label': 'How strongly each interest shows up in what you actually click'
    }, kids);
  }

  /** A labelled 0..1 scale with a marker, for the gentleness/cost leanings. */
  function leaning(label, value, min, max, lowText, highText) {
    if (value == null) return null;
    var pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
    var w = 440, h = 46;
    return el('div', { class: 'leaning' }, [
      el('h4', { text: label }),
      svg('svg', { viewBox: '0 0 ' + w + ' ' + h, class: 'chart', role: 'img',
                   'aria-label': label + ': ' + lowText + ' to ' + highText }, [
        svg('line', { x1: 8, y1: 16, x2: w - 8, y2: 16, class: 'track' }),
        svg('circle', { cx: 8 + pct * (w - 16), cy: 16, r: 7, class: 'dot' }),
        svg('text', { x: 8, y: 38, class: 'lbl', text: lowText }),
        svg('text', { x: w - 8, y: 38, class: 'lbl', 'text-anchor': 'end', text: highText })
      ])
    ]);
  }

  function renderYou() {
    var host = $('#you-body');
    host.innerHTML = '';
    if (!FYC.prefs) return;

    var profile = FYC.prefs.profile();
    var enabled = profile.enabled;

    host.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: 'What this has worked out about you' }),
      el('p', { text: profile.count + (profile.count === 1 ? ' action' : ' actions') + ' noticed, all of it on this device' })
    ]));

    if (!profile.ready) {
      host.appendChild(el('div', { class: 'card empty' }, [
        el('h2', { text: enabled ? 'Not enough to go on yet.' : 'Tracking is paused.' }),
        el('p', {
          text: enabled
            ? 'Open a few first steps, save something to your plan, and this page will start showing what you are drawn to in practice — which is often not what you ticked in the form.'
            : 'Turn it back on below if you want results to adapt to what you actually do.'
        })
      ]));
    } else {
      var summary = FYC.prefs.summary(profile);
      host.appendChild(el('article', { class: 'card' }, [
        el('h3', { class: 'you-summary', text: summary ? 'So far: ' + summary + '.' : 'Still forming a picture.' }),
        el('p', { class: 'hint', text: 'This nudges your results. It never overrides the city, interests or budget you choose.' }),
        el('div', { class: 'conf' }, [
          el('span', { class: 'conf-label', text: 'How much it leans on this' }),
          el('div', { class: 'conf-bar' }, [(function () {
            var i = el('i');
            i.style.width = Math.round(profile.confidence * 100) + '%';
            return i;
          })()])
        ])
      ]));

      var chart = affinityChart(profile);
      if (chart) {
        host.appendChild(el('article', { class: 'card' }, [
          el('h3', { text: 'What you actually click' }),
          el('p', { class: 'hint', text: 'Bars to the right are things you open and save. To the left, things you back away from.' }),
          chart
        ]));
      }

      var leanings = [
        leaning('How gentle you like it', profile.gentleness, 1, 5, 'will brave the intense ones', 'the gentlest options'),
        leaning('What you will pay', profile.cost, 0, 2, 'free only', 'cost is no object'),
        leaning('Going alone', profile.solo, 1, 5, 'prefers company', 'happy to turn up alone')
      ].filter(Boolean);
      if (leanings.length) {
        host.appendChild(el('article', { class: 'card' }, [
          el('h3', { text: 'Your leanings' })
        ].concat(leanings)));
      }
    }

    // When signed in, the profile editor belongs here too.
    if (window.FYC_SOCIAL && window.FYC_SOCIAL.profileCard) {
      var pc = window.FYC_SOCIAL.profileCard();
      if (pc) host.appendChild(pc);
    }

    host.appendChild(el('article', { class: 'card' }, [
      el('h3', { text: 'Your data' }),
      el('p', { class: 'hint', text: 'This never leaves your browser. There is no account and nothing is sent anywhere. Erasing it here erases it completely.' }),
      el('div', { class: 'actions' }, [
        el('button', {
          class: 'btn ghost sm', type: 'button',
          onclick: function () {
            FYC.prefs.setEnabled(!enabled);
            renderYou();
          }
        }, [enabled ? 'Pause tracking' : 'Resume tracking']),
        el('button', {
          class: 'btn ghost sm', type: 'button',
          onclick: function () {
            if (!profile.count) return;
            FYC.prefs.clear();
            renderYou();
          }
        }, ['Erase what it has learned'])
      ])
    ]));
  }

  // ---------- tabs ----------
  function showTab(which) {
    // With a backend there are more tabs than these three; social.js owns the
    // switching in that case so every view is hidden correctly.
    if (window.FYC_SHOW) return window.FYC_SHOW(which);
    ['find', 'plan', 'you'].forEach(function (name) {
      var on = which === name;
      $('#view-' + name).hidden = !on;
      $('#tab-' + name).setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (which === 'plan') renderPlan();
    if (which === 'you') renderYou();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // ---------- feedback ----------
  function wireFeedback() {
    var panel = $('#fb-panel'), tab = $('#fb-tab'), thanks = $('#fb-thanks');
    var rating = 0;

    tab.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      tab.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
      if (!panel.hidden) $('#fb-text').focus();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; tab.setAttribute('aria-expanded', 'false'); tab.focus(); }
    });
    $$('#fb-stars button').forEach(function (b) {
      b.addEventListener('click', function () {
        rating = Number(b.getAttribute('data-v'));
        $$('#fb-stars button').forEach(function (x) {
          var on = Number(x.getAttribute('data-v')) <= rating;
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
          x.classList.toggle('lit', on);
        });
      });
    });
    function payload() {
      return {
        rating: rating,
        text: $('#fb-text').value.trim(),
        at: new Date().toISOString(),
        page: location.pathname
      };
    }
    $('#fb-send').addEventListener('click', function () {
      var all = load(KEY.feedback, []);
      all.push(payload());
      save(KEY.feedback, all);
      thanks.hidden = false;
      setTimeout(function () {
        thanks.hidden = true;
        panel.hidden = true;
        tab.setAttribute('aria-expanded', 'false');
        $('#fb-text').value = '';
      }, 1200);
    });
    $('#fb-copy').addEventListener('click', function () {
      var p = payload();
      var text = 'community_finder feedback\nRating: ' + (p.rating || '-') + '/5\n' + p.text;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(function () {});
      thanks.textContent = 'Copied.';
      thanks.hidden = false;
      setTimeout(function () { thanks.hidden = true; thanks.textContent = 'Thank you.'; }, 1600);
    });
  }

  // ---------- surprise me ----------
  function surprise() {
    var city = FYC.cities[Math.floor(Math.random() * FYC.cities.length)];
    $('#location').value = city.name;
    var ids = Object.keys(FYC.INTERESTS);
    state.interests = [];
    while (state.interests.length < 3) {
      var pick = ids[Math.floor(Math.random() * ids.length)];
      if (state.interests.indexOf(pick) === -1) state.interests.push(pick);
    }
    paintInterests();
    $('#finder').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }

  // ---------- boot ----------
  function init() {
    buildCityChips();
    buildInterests();
    wireComfort();
    wirePills('#when', 'when', true);
    wirePills('#goals', 'goals', true);
    wirePills('#commitment', 'commitment', false);
    wirePills('#budget', 'budget', false, Number);
    wireFeedback();
    paintPlanCount();

    $('#tab-find').addEventListener('click', function () { showTab('find'); });
    $('#tab-plan').addEventListener('click', function () { showTab('plan'); });
    $('#tab-you').addEventListener('click', function () { showTab('you'); });
    $('#surprise').addEventListener('click', surprise);
    $('#location').addEventListener('input', paintPicked);

    // Restore the last search so a refresh doesn't punish you.
    var saved = load(KEY.profile, null);
    if (saved) {
      $('#location').value = saved.location || '';
      $('#firstname').value = saved.name || '';
      state.interests = (saved.interests || []).slice(0, MAX_INTERESTS);
      state.comfort = saved.comfort || 1;
      state.when = saved.when || [];
      state.goals = saved.goals || [];
      state.commitment = saved.commitment || null;
      state.budget = saved.budget == null ? null : saved.budget;
      paintInterests();
      $$('#comfort .choice').forEach(function (b) {
        b.setAttribute('aria-pressed', Number(b.getAttribute('data-value')) === state.comfort ? 'true' : 'false');
      });
      [['#when', 'when', true], ['#goals', 'goals', true], ['#commitment', 'commitment', false], ['#budget', 'budget', false]]
        .forEach(function (cfg) {
          $$(cfg[0] + ' .pill').forEach(function (b) {
            var raw = b.getAttribute('data-value');
            var v = cfg[0] === '#budget' ? Number(raw) : raw;
            var on = cfg[2] ? state[cfg[1]].indexOf(v) !== -1 : state[cfg[1]] === v;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
    }

    paintPicked();

    // social.js owns tab switching when a backend is present, so it needs a way
    // to run these renderers. Without this the Plan and You tabs show empty.
    window.FYC_VIEWS = { plan: renderPlan, you: renderYou };

    $('#finder').addEventListener('submit', function (e) {
      e.preventDefault();
      var p = profile();
      if (!p.location) {
        flashError('Where are you? A city name is enough.');
        $('#location').focus();
        return;
      }
      if (!p.interests.length) {
        flashError('Pick at least one thing you&rsquo;re drawn to.');
        return;
      }
      save(KEY.profile, p);
      if (FYC.prefs && FYC.prefs.isEnabled()) p.learned = FYC.prefs.profile();
      var m = FYC.match(p);
      render(m, p);
      $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
