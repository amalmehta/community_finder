/* find_your_community — UI.
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
        onclick: function () { $('#location').value = c.name; }
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

  function paintInterests() {
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

  function fillScript(tpl, p, org) {
    if (!tpl) return null;
    var firstInterest = p.interests.length ? (FYC.INTERESTS[p.interests[0]] || {}).label : 'this';
    var out = tpl
      .replace(/\{interest\}/g, String(firstInterest).toLowerCase())
      .replace(/\{city\}/g, p.location || org.cityName || 'the area');
    if (p.name) out += '\n\nThanks,\n' + p.name;
    return out;
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
      el('h4', { text: 'Your first step' }),
      el('p', { class: 'do', text: org.firstStep.label }),
      org.firstStep.when ? el('p', { class: 'when', text: org.firstStep.when }) : null,
      el('div', { class: 'actions' }, [
        el('a', {
          class: 'btn sm', href: org.firstStep.url || org.url,
          target: '_blank', rel: 'noopener noreferrer'
        }, [org.universal ? 'Open the directory →' : 'Open the page →']),
        el('button', {
          class: 'btn ghost sm', type: 'button',
          onclick: function (e) { addToPlan(org, e.currentTarget); }
        }, ['Add to my plan'])
      ]),
      el('ul', { class: 'expect' }, org.expect.map(function (t) { return el('li', { text: t }); }))
    ]);

    var scriptText = fillScript(org.script, p, org);
    if (scriptText) {
      var ta = el('textarea', { readonly: true, 'aria-label': 'Message you can send' });
      ta.value = scriptText;
      var copied = el('span', { class: 'copied', hidden: true, text: 'Copied' });
      step.appendChild(el('div', { class: 'script' }, [
        el('label', { text: 'What to say (copy this)' }),
        ta,
        el('div', { class: 'actions' }, [
          el('button', {
            class: 'btn ghost sm', type: 'button',
            onclick: function () {
              ta.select();
              var ok = false;
              try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(ta.value).catch(function () {});
                ok = true;
              }
              if (ok) { copied.hidden = false; setTimeout(function () { copied.hidden = true; }, 2000); }
            }
          }, ['Copy message']),
          copied
        ])
      ]));
    }

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
          wrapStep.hidden = !open;
          e.currentTarget.setAttribute('aria-expanded', open ? 'true' : 'false');
          e.currentTarget.textContent = open ? 'Hide the first step' : 'Show me the first step →';
        }
      }, ['Show me the first step →']);
      body.appendChild(toggle);
      body.appendChild(wrapStep);
    }

    return el('article', { class: 'card org' + (opts.starter ? ' starter' : '') }, [body]);
  }

  function render(m, p) {
    var host = $('#results');
    host.innerHTML = '';

    var curated = m.results.slice(0, 8);
    var uni = m.universal.slice(0, m.cityMatched ? 3 : 8);
    var primary = m.cityMatched ? curated : uni;

    if (!primary.length) {
      host.appendChild(el('div', { class: 'empty' }, [
        el('h2', { text: 'Nothing matched that combination.' }),
        el('p', { text: 'Try picking a couple more interests, or loosening the budget and timing filters.' })
      ]));
      host.hidden = false;
      return;
    }

    var where = m.cityMatched ? m.city.name : (p.location || 'your area');
    host.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: m.cityMatched ? 'Places to start in ' + where : 'Ways in, near ' + where }),
      el('p', { text: primary.length + ' matches, easiest to walk into first' })
    ]));

    if (!m.cityMatched) {
      host.appendChild(el('div', { class: 'notice' }, [
        el('b', { text: 'No hand-picked list for ' + where + ' yet. ' }),
        'These are national directories and programmes that exist almost everywhere, pointed at your city and your interests. ' +
        'Every link below is a live search or finder, not a guess.'
      ]));
    }

    if (p.comfort === 1) {
      host.appendChild(el('div', { class: 'notice' }, [
        el('b', { text: 'One thing, once. ' }),
        'Do not plan a social life. Pick the first card, do only the first step this week, and ignore everything else on this page.'
      ]));
    }

    primary.forEach(function (r, i) {
      host.appendChild(orgCard(r, p, { starter: i === 0 }));
    });

    if (m.cityMatched && uni.length) {
      host.appendChild(el('div', { class: 'results-head' }, [
        el('h2', { text: 'Works anywhere' }),
        el('p', { text: 'National routes in, if none of the above fits' })
      ]));
      uni.forEach(function (r) { host.appendChild(orgCard(r, p, {})); });
    }

    host.hidden = false;
  }

  // ---------- plan ----------
  var PLAN_STEPS = [
    'Open the page and read what actually happens there',
    null, // replaced by the org's own first step
    'Go once. You are allowed to leave early',
    'Go back a second time — this is the one that turns it into a community'
  ];

  function addToPlan(org, btn) {
    if (plan.some(function (x) { return x.id === org.id; })) {
      if (btn) btn.textContent = 'Already in your plan';
      return;
    }
    plan.push({
      id: org.id,
      name: org.name,
      cityName: org.cityName,
      url: org.firstStep.url || org.url,
      stepLabel: org.firstStep.label,
      when: org.firstStep.when || '',
      done: [false, false, false, false],
      added: Date.now()
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
        el('h2', { text: 'Your plan is empty.' }),
        el('p', { text: 'Find something on the Find tab and add it here. One is the right number to start with.' })
      ]));
      return;
    }

    host.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: 'My plan' }),
      el('p', { text: plan.length === 1 ? 'One thing. Good.' : plan.length + ' saved — do the top one first and ignore the rest until it is done.' })
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

  // ---------- tabs ----------
  function showTab(which) {
    var find = which === 'find';
    $('#view-find').hidden = !find;
    $('#view-plan').hidden = find;
    $('#tab-find').setAttribute('aria-selected', find ? 'true' : 'false');
    $('#tab-plan').setAttribute('aria-selected', find ? 'false' : 'true');
    if (!find) renderPlan();
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
      var text = 'find_your_community feedback\nRating: ' + (p.rating || '-') + '/5\n' + p.text;
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
    $('#surprise').addEventListener('click', surprise);

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
      var m = FYC.match(p);
      render(m, p);
      $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
