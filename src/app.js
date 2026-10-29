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
  var KEY = { plan: 'fyc.plan.v1', profile: 'fyc.profile.v1', feedback: 'fyc.feedback.v1', intake: 'fyc.intake.v1' };
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
  var browsePick = 0;   // which listing the detail pane is showing
  var plan = load(KEY.plan, []);

  // ---------- the adaptive intake ----------
  var I = FYC.intake;
  var session = null;

  function newSession() {
    session = I.blankState();
    save(KEY.intake, session);
    return session;
  }

  function resumeSession() {
    var saved = load(KEY.intake, null);
    session = (saved && Array.isArray(saved.asked)) ? saved : I.blankState();
    return session;
  }

  // Where the progress bar was left, so the next one can move rather than
  // appear already full. A fresh element set straight to its final width has
  // nothing to transition from.
  var lastPct = 0;

  function questionCard(q) {
    var prog = I.progress(session);
    var box = el('article', { class: 'card question' });

    var bar = el('i');
    var pct = Math.round((prog.asked / prog.total) * 100);
    bar.style.width = lastPct + '%';
    bar.setAttribute('data-to', pct + '%');   // moved to once it is on the page
    lastPct = pct;
    box.appendChild(el('div', { class: 'q-head' }, [
      I.canGoBack(session) ? el('button', {
        class: 'q-back', type: 'button', 'aria-label': 'Back', title: 'Back', onclick: goBack
      }, ['\u2190']) : null,
      el('div', { class: 'progress', role: 'progressbar',
        'aria-valuenow': String(prog.asked), 'aria-valuemin': '0', 'aria-valuemax': String(prog.total),
        'aria-label': 'Question ' + (prog.asked + 1) + ' of ' + prog.total }, [bar])
    ]));

    // A hint says how to answer \u2014 "up to three", "anywhere works". Four of
    // them used to say why the question was worth asking instead, which is an
    // argument with the person in the middle of them doing what it wants.
    // Those are gone from the question set; this still draws the rest.
    box.appendChild(el('h2', { class: 'q-prompt', text: q.prompt }));
    if (q.hint) box.appendChild(el('p', { class: 'hint', text: q.hint }));

    var answer = null;
    var previous = session.answers[q.id];      // set when they came back to it
    var sofar = I.toProfile(session);
    var enough = !!(sofar.location && sofar.interests.length);

    if (q.kind === 'text') {
      var input = el('input', { type: 'text', placeholder: q.placeholder || '', 'aria-label': q.prompt });
      if (typeof previous === 'string') input.value = previous;
      else if (q.id === 'city' && session.city) input.value = session.city;
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submit(input.value); }
      });
      box.appendChild(input);
      answer = function () { return input.value; };
      setTimeout(function () { input.focus(); }, 30);

    } else if (q.kind === 'one') {
      var choices = el('div', { class: 'choices' });
      q.options.forEach(function (o, idx) {
        choices.appendChild(el('button', {
          type: 'button', class: 'choice',
          'aria-pressed': previous === o.id ? 'true' : 'false',
          onclick: function () { submit(o.id); }
        }, [
          el('span', { class: 'key', 'aria-hidden': 'true', text: String(idx + 1) }),
          el('b', { text: o.label }),
          o.hint ? el('span', { text: o.hint }) : null
        ]));
      });
      box.appendChild(choices);

    } else {
      var picked = Array.isArray(previous) ? previous.slice() : [];
      var pills = el('div', { class: 'pills' });
      q.options.forEach(function (o, idx) {
        var btn = el('button', {
          type: 'button', class: 'pill',
          'aria-pressed': picked.indexOf(o.id) !== -1 ? 'true' : 'false',
          'data-idx': String(idx + 1),
          onclick: function () {
            var at = picked.indexOf(o.id);
            if (at !== -1) picked.splice(at, 1);
            else if (picked.length < (q.max || 99)) picked.push(o.id);
            btn.setAttribute('aria-pressed', picked.indexOf(o.id) !== -1 ? 'true' : 'false');
          }
        }, [el('span', { class: 'key', 'aria-hidden': 'true', text: String(idx + 1) }), el('span', { text: o.label })]);
        pills.appendChild(btn);
      });
      box.appendChild(pills);
      answer = function () { return picked; };
    }

    // A single-choice question needs no Next — picking is answering. The rest
    // of the row is quiet: skipping and leaving early are ways out, not offers.
    if (q.kind !== 'one') {
      box.appendChild(el('div', { class: 'actions' }, [
        el('button', { class: 'btn', type: 'button', onclick: function () { submit(answer()); } }, ['Continue'])
      ]));
    }
    box.appendChild(el('div', { class: 'q-outs' }, [
      el('button', {
        class: 'linkish', type: 'button',
        onclick: function () { submit(q.kind === 'many' ? [] : null); }
      }, ['Skip']),
      // Only offered once it would actually produce something. It used to be
      // on every question, including the first, where it led to a card that
      // said "Not enough to go on." — a button that promises results and
      // delivers a wall is worse than no button.
      enough ? el('button', {
        class: 'linkish', type: 'button', onclick: function () { finish(true); }
      }, ['See results now']) : null
    ]));
    box.appendChild(el('p', { class: 'err', id: 'q-error', hidden: true }));
    return box;
  }

  function goBack() {
    session = I.back(session);
    save(KEY.intake, session);
    $('#results').hidden = true;
    paintIntake();
  }

  /** 1–9 picks an option, Enter advances, Backspace goes back. */
  function intakeKeys(e) {
    if ($('#view-find').hidden || !$('#intake') || !$('#intake').firstChild) return;
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea';

    if (e.key === 'Backspace' && !typing && I.canGoBack(session)) {
      e.preventDefault();
      return goBack();
    }
    if (typing) return;

    if (/^[1-9]$/.test(e.key)) {
      var n = Number(e.key) - 1;
      var opts = $('#intake').querySelectorAll('.choice, .pill');
      if (opts[n]) {
        e.preventDefault();
        opts[n].click();
      }
      return;
    }
    if (e.key === 'Enter') {
      var next = Array.prototype.slice.call($('#intake').querySelectorAll('button'))
        .filter(function (b) { return b.textContent === 'Next'; })[0];
      if (next) { e.preventDefault(); next.click(); }
    }
  }

  function submit(value) {
    var q = I.nextQuestion(session);
    if (!q) return finish(false);

    if (q.id === 'city' && !String(value || '').trim()) {
      var e = $('#q-error');
      if (e) { e.textContent = 'A city is needed — everything else depends on it.'; e.hidden = false; }
      return;
    }
    if (value !== null) I.answer(session, q, value);
    else session.asked.push(q.id);           // skipped: counts, contributes nothing

    save(KEY.intake, session);
    paintIntake();
  }

  /**
   * Take the host from the height it had to the height it needs, then hand the
   * height back to the layout. Without this the card's frame snaps to the new
   * size on the same frame the new question fades in, and twenty questions
   * read as twenty cards rather than one form being filled in.
   */
  function settleHeight(host, from) {
    host.style.height = '';
    host.classList.remove('settling');
    var to = host.scrollHeight;
    if (!from || from === to) return;
    host.classList.add('settling');
    host.style.height = from + 'px';
    void host.offsetHeight;                   // read, so there is a start value
    host.style.height = to + 'px';
    var done = function (e) {
      if (e && e.propertyName !== 'height') return;
      host.style.height = '';
      host.classList.remove('settling');
      host.removeEventListener('transitionend', done);
    };
    host.addEventListener('transitionend', done);
    // A transition that never fires — reduced motion, a hidden tab — must not
    // leave the card pinned to a stale height.
    setTimeout(done, 400);
  }

  function paintIntake() {
    var host = $('#intake');
    var from = host.firstChild ? host.offsetHeight : 0;
    host.innerHTML = '';
    if (I.done(session)) return finish(false);
    var q = I.nextQuestion(session);
    if (!q) return finish(false);
    host.appendChild(questionCard(q));

    // Start the bar moving. A forced reflow rather than requestAnimationFrame:
    // rAF is throttled in a background tab, which would leave someone who
    // switched away mid-form looking at the previous question's progress.
    var bar = host.querySelector('.progress i');
    if (bar) {
      void bar.offsetWidth;
      bar.style.width = bar.getAttribute('data-to');
    }

    settleHeight(host, from);

    // Move focus to the new question, so keyboard and screen-reader users are
    // not left behind at the button they just pressed.
    var heading = host.querySelector('.q-prompt');
    if (heading && q.kind !== 'text') {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  /** Build the profile and show results. `early` = they pressed the escape. */
  function finish(early) {
    var p = I.toProfile(session);
    if (!p.location) {
      $('#intake').innerHTML = '';
      $('#intake').appendChild(questionCard(I.QUESTIONS[0]));
      return;
    }
    save(KEY.profile, p);
    if (FYC.prefs && FYC.prefs.isEnabled()) p.learned = FYC.prefs.profile();

    // Nothing is printed here any more. A wall of chips restating the answers,
    // above a count of them, was two lines of the app describing its own input
    // before it showed a single result. The city heads the list column and the
    // way back in sits beside it.
    var host = $('#intake');
    host.style.height = '';
    host.classList.remove('settling');
    host.innerHTML = '';

    if (!p.interests.length) {
      $('#results').innerHTML = '';
      $('#results').appendChild(el('div', { class: 'card empty' }, [
        el('h2', { text: 'Not enough to go on yet.' }),
        el('p', { text: 'A few more answers and this fills in.' })
      ]));
      $('#results').hidden = false;
      return;
    }
    render(FYC.match(p), p);
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

  /** What gets sent: the name, where, the first step, and the link. */
  function shareText(org) {
    var where = [org.neighborhood, org.cityName].filter(Boolean).join(', ');
    return [
      org.name + (where ? ' — ' + where : ''),
      org.firstStep.label + (org.firstStep.when ? ' (' + org.firstStep.when + ')' : ''),
      org.firstStep.url || org.url
    ].join('\n');
  }

  /**
   * Native share sheet where there is one (phones), clipboard everywhere else.
   * Returns a promise for 'shared' | 'copied' | 'failed'.
   */
  function shareOrg(org) {
    var text = shareText(org);
    var url = org.firstStep.url || org.url;
    if (navigator.share) {
      return navigator.share({ title: org.name, text: text, url: url })
        .then(function () { return 'shared'; })
        .catch(function (e) {
          // A cancelled share is not a failure; say nothing.
          return (e && e.name === 'AbortError') ? 'cancelled' : copyText(text);
        });
    }
    return Promise.resolve(copyText(text));
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return 'copied'; })
        .catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok ? 'copied' : 'failed';
  }

  var STRUCTURE_LABEL = {
    'drop-in': 'Drop-in', 'register': 'Sign up first', 'course': 'Runs as a course',
    'shift': 'Book a shift', 'rsvp': 'RSVP first', 'search': 'Directory'
  };
  var COMMIT_LABEL = { 'one-off': 'One-off', 'weekly': 'Weekly-ish', 'seasonal': 'Season-long' };
  var COST_LABEL = ['Free', 'Low cost', 'Costs money'];

  // Three facts are worth knowing before you click: how hard it is to walk
  // into, how often it runs, what it costs. They were three chips in a row
  // above a three-bullet list. One line says the same thing.
  function factLine(r) {
    return [
      r.ease.label,
      COMMIT_LABEL[r.org.commitment] || r.org.commitment,
      COST_LABEL[r.org.cost] || ''
    ].filter(Boolean).join('  \u00b7  ');
  }

  function detailPane(r, p, onBack) {
    var org = r.org;
    var pane = el('div', { class: 'detail' });

    pane.appendChild(el('div', { class: 'detail-head' }, [
      el('button', {
        class: 'back-btn', type: 'button', 'aria-label': 'Back to the list', onclick: onBack
      }, ['\u2190']),
      el('div', { class: 'detail-title' }, [
        el('h2', { text: org.name }),
        el('p', { class: 'where', text: [org.neighborhood, org.cityName].filter(Boolean).join(' \u00b7 ') })
      ])
    ]));

    pane.appendChild(el('p', { class: 'blurb', text: org.blurb }));
    pane.appendChild(el('p', { class: 'facts', text: factLine(r) }));
    // "Over your budget" is a fact about this listing against what you said,
    // and you would want it before you click, not after.
    if ((r.caveats || []).length) {
      pane.appendChild(el('p', { class: 'caveat-line', text: r.caveats.join(' \u00b7 ') }));
    }

    var note = el('span', { class: 'copied', hidden: true });
    pane.appendChild(el('div', { class: 'step-box' }, [
      el('h3', { text: org.firstStep.label }),
      org.firstStep.when ? el('p', { class: 'when', text: org.firstStep.when }) : null,
      el('div', { class: 'actions' }, [
        el('a', {
          class: 'btn', href: org.firstStep.url || org.url,
          target: '_blank', rel: 'noopener noreferrer',
          onclick: function () { track('open', org); }
        }, [org.universal ? 'Open the directory \u2192' : 'Open the page \u2192']),
        el('button', {
          class: 'btn ghost', type: 'button',
          onclick: function (e) { addToPlan(org, e.currentTarget); }
        }, ['Save']),
        el('span', { class: 'share-wrap' }, [
          el('button', { class: 'btn ghost', type: 'button', onclick: function () {
            shareOrg(org).then(function (how) {
              if (how === 'cancelled') return;
              track('share', org);
              note.textContent = how === 'shared' ? 'Shared' : how === 'copied' ? 'Copied' : 'Could not copy';
              note.hidden = false;
              setTimeout(function () { note.hidden = true; }, 2000);
            });
          } }, ['Share']),
          note
        ])
      ])
    ]));

    // What the place is like, in its own right. Plain lines: three bullets
    // under three chips read as a spec sheet, which is not what they are.
    if ((org.expect || []).length) {
      pane.appendChild(el('div', { class: 'expect' },
        org.expect.map(function (t) { return el('p', { text: t }); })));
    }

    // The data is a snapshot. Said where it is about the listing in front of
    // you rather than about the product.
    pane.appendChild(el('p', { class: 'list-foot', text: 'Details change \u2014 check before you go.' }));
    return pane;
  }

  function render(m, p) {
    var host = $('#results');
    host.innerHTML = '';

    // A curated city with nothing matching the chosen interests is not a
    // curated result \u2014 fall through to the national routes rather than
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
        el('h2', { text: 'Nothing matched.' }),
        el('p', { text: 'Try a wider budget, or a few more interests.' })
      ]));
      host.hidden = false;
      return;
    }

    var where = m.cityMatched ? m.city.name : (p.location || 'your area');

    // One row per listing in a column you can see all of, with the chosen one
    // open beside it. The page used to give a 1180px window to one card.
    var items = primary.map(function (r) { return { r: r, head: null }; });
    if (hasCurated && uni.length) {
      uni.forEach(function (r, i) { items.push({ r: r, head: i === 0 ? 'Anywhere' : null }); });
    }

    var rows = el('ol', { class: 'rows' });
    var detail = el('section', { class: 'browse-detail' });
    var wrap = el('div', { class: 'browse' });
    var buttons = [];

    function back() {
      wrap.classList.remove('on-detail');
      var cur = buttons[browsePick];
      if (cur) cur.focus();
    }

    function pick(i, push) {
      browsePick = i;
      buttons.forEach(function (b, j) {
        b.setAttribute('aria-current', j === i ? 'true' : 'false');
      });
      detail.innerHTML = '';
      detail.appendChild(detailPane(items[i].r, p, back));
      detail.scrollTop = 0;
      // Under the breakpoint there is only room for one pane, so choosing a
      // row is a navigation. Above it both are on screen and nothing moves.
      if (push) {
        wrap.classList.add('on-detail');
        track('expand', items[i].r.org);
        var h = detail.querySelector('h2');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
      }
    }

    items.forEach(function (it, i) {
      if (it.head) rows.appendChild(el('li', { class: 'rows-head', text: it.head }));
      var b = el('button', {
        class: 'row', type: 'button', 'aria-current': 'false',
        onclick: function () { pick(i, true); }
      }, [
        el('span', { class: 'row-name', text: it.r.org.name }),
        el('span', { class: 'row-sub', text: it.r.org.neighborhood || it.r.org.cityName || '' })
      ]);
      buttons.push(b);
      rows.appendChild(el('li', {}, [b]));
    });

    var more = !I.done(session);
    var listCol = el('aside', { class: 'browse-list' }, [
      el('div', { class: 'browse-bar' }, [
        el('h2', { text: where }),
        el('button', { class: 'linkish', type: 'button', onclick: function () {
          if (!more) newSession();
          host.hidden = true;
          paintIntake();
        } }, [more ? 'Change answers' : 'Start over'])
      ])
    ]);

    // Say outright which interests this city has no hand-picked listing for.
    if (m.cityMatched && m.uncovered && m.uncovered.length) {
      listCol.appendChild(el('div', { class: 'notice' }, [
        'Nothing hand-picked for ' + joinList(labels(m.uncovered)) + ' here yet.'
      ]));
    }
    if (!m.cityMatched) {
      listCol.appendChild(el('div', { class: 'notice' }, [
        'No hand-picked list for ' + where + ' yet \u2014 these work anywhere.'
      ]));
    }

    listCol.appendChild(rows);

    // With a backend, the other door: circles near here on the same interests,
    // where you talk to people before anyone suggests turning up somewhere.
    if (window.FYC_CIRCLES && window.FYC_CIRCLES.resultsStrip) {
      window.FYC_CIRCLES.resultsStrip(listCol, p);
    }

    wrap.appendChild(listCol);
    wrap.appendChild(detail);
    host.appendChild(wrap);

    pick(browsePick < items.length ? browsePick : 0, false);
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
      if (btn) btn.textContent = 'Saved';
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
    if (btn) { btn.textContent = 'Saved \u2713'; btn.disabled = true; }
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
      host.appendChild(el('div', { class: 'screen-head' }, [el('h2', { text: 'Saved' })]));
      host.appendChild(el('div', { class: 'card empty' }, [
        el('h2', { text: 'Nothing saved yet.' }),
        el('p', { text: 'Add something from Find.' })
      ]));
      return;
    }

    host.appendChild(el('div', { class: 'screen-head' }, [el('h2', { text: 'Saved' })]));

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

    host.appendChild(el('div', { class: 'screen-head' }, [el('h2', { text: 'You' })]));

    // Your profile is what this tab is for, so it comes first. It used to sit
    // under two cards of the app analysing you, which is not the thing you
    // came here to change.
    if (window.FYC_SOCIAL && window.FYC_SOCIAL.profileCard) {
      var pc = window.FYC_SOCIAL.profileCard();
      if (pc) host.appendChild(pc);
    }

    // What it has picked up, folded away — and only once there is something
    // in it. An empty card explaining why it is empty is worse than no card.
    if (profile.ready) {
      var summary = FYC.prefs.summary(profile);
      var fold = el('details', { class: 'fold' }, [
        el('summary', { text: 'What you tend to go for' }),
        el('p', { class: 'you-summary', text: summary ? summary.charAt(0).toUpperCase() + summary.slice(1) + '.' : 'Still forming a picture.' })
      ]);
      var chart = affinityChart(profile);
      if (chart) fold.appendChild(chart);
      [
        leaning('How gentle you like it', profile.gentleness, 1, 5, 'will brave the intense ones', 'the gentlest options'),
        leaning('What you will pay', profile.cost, 0, 2, 'free only', 'cost is no object'),
        leaning('Going alone', profile.solo, 1, 5, 'prefers company', 'happy to turn up alone')
      ].filter(Boolean).forEach(function (n) { fold.appendChild(n); });
      host.appendChild(fold);
    }

    host.appendChild(el('details', { class: 'fold' }, [
      el('summary', { text: enabled ? 'What this device remembers' : 'Remembering is paused' }),
      // True with or without an account: the learned preferences are local
      // either way. The footer says what the server holds.
      el('p', { class: 'hint', text: profile.count
        ? profile.count + (profile.count === 1 ? ' action' : ' actions') + ', kept on this device only.'
        : 'Nothing yet. Kept on this device only.' }),
      // Where the rest of it lives. This used to be printed in the footer,
      // under every screen in the app; it is a fact about you, so it is here.
      el('p', { class: 'hint', text: window.FYC_STORAGE_NOTE || 'Nothing leaves this browser.' }),
      el('div', { class: 'actions' }, [
        el('button', {
          class: 'btn ghost sm', type: 'button',
          onclick: function () { FYC.prefs.setEnabled(!enabled); renderYou(); }
        }, [enabled ? 'Pause' : 'Resume']),
        profile.count ? el('button', {
          class: 'btn ghost sm', type: 'button',
          onclick: function () { FYC.prefs.clear(); renderYou(); }
        }, ['Erase it']) : null
      ])
    ]));
  }

  // ---------- tabs ----------
  /**
   * The tab strip scrolls on a phone — six tabs do not fit in 375px. Without
   * this, choosing Circles leaves the strip showing Find, Saved and You,
   * and nothing on screen says which tab you are on.
   */
  function keepTabInView(which) {
    var tab = $('#tab-' + which);
    var strip = tab && tab.parentElement;
    if (!tab || !strip || strip.scrollWidth <= strip.clientWidth) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Measured, not offsetLeft: the strip is not the offset parent — the
    // sticky header is — so offsetLeft carries the brand's width with it and
    // scrolls to the wrong place.
    var stripBox = strip.getBoundingClientRect();
    var tabBox = tab.getBoundingClientRect();
    var to = strip.scrollLeft + (tabBox.left - stripBox.left)
      - (strip.clientWidth - tabBox.width) / 2;
    var max = strip.scrollWidth - strip.clientWidth;
    strip.scrollTo({ left: Math.max(0, Math.min(max, to)), behavior: reduce ? 'auto' : 'smooth' });
  }
  /** Called whenever a tab is shown, by whichever file is doing the showing. */
  function onTabShown(which) {
    keepTabInView(which);
    // The feedback pill sits bottom-right, which is on top of a conversation.
    // It belongs on the screens you browse, not the ones you type into.
    var fb = $('#fb-tab');
    var panel = $('#fb-panel');
    if (fb) {
      var noisy = which === 'circles' || which === 'messages' || which === 'people';
      fb.hidden = noisy;
      if (noisy && panel && !panel.hidden) {
        panel.hidden = true;
        fb.setAttribute('aria-expanded', 'false');
      }
    }
  }
  window.FYC_TAB_IN_VIEW = onTabShown;

  function showTab(which) {
    // With a backend there are more tabs than these three; social.js owns the
    // switching in that case so every view is hidden correctly.
    keepTabInView(which);
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

  // ---------- theme ----------
  // Three states, because "follow the system" is a real preference and not the
  // same as picking light.
  var THEMES = ['auto', 'light', 'dark'];
  // Drawn rather than typed. The glyphs (☀ ☾ ◐) render at wildly different
  // weights across platforms, and at 15px the sun was a smudge.
  var THEME_UI = {
    auto: { label: 'Auto', paths: ['M12 4a8 8 0 100 16 8 8 0 000-16z', 'M12 4v16a8 8 0 000-16z'], fill: 1 },
    light: { label: 'Light', paths: ['M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z',
      'M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4'] },
    dark: { label: 'Dark', paths: ['M19.5 14.6A8.2 8.2 0 019.4 4.5a7.7 7.7 0 1010.1 10.1z'] }
  };

  function currentTheme() {
    var t = null;
    try { t = localStorage.getItem('fyc.theme.v1'); } catch (e) { t = null; }
    return THEMES.indexOf(t) !== -1 ? t : 'auto';
  }

  function applyTheme(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    try {
      if (t === 'auto') localStorage.removeItem('fyc.theme.v1');
      else localStorage.setItem('fyc.theme.v1', t);
    } catch (e) { /* private mode */ }
    paintTheme();
  }

  function paintTheme() {
    var btn = $('#theme-toggle');
    if (!btn) return;
    var t = currentTheme();
    var ui = THEME_UI[t];
    btn.innerHTML = '';
    btn.appendChild(svg('svg', { class: 'ti theme-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
      ui.paths.map(function (d, i) {
        return svg('path', { d: d, fill: (ui.fill && i === 1) ? 'currentColor' : 'none' });
      })));
    btn.appendChild(el('span', { class: 'theme-label', text: ui.label }));
    btn.setAttribute('title', 'Theme: ' + ui.label + ' (click to change)');
    btn.setAttribute('aria-label', 'Colour theme: ' + ui.label);
  }

  function wireTheme() {
    var btn = $('#theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
      applyTheme(next);
    });
    paintTheme();
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
    wireTheme();
    wireFeedback();
    paintPlanCount();

    $('#tab-find').addEventListener('click', function () { showTab('find'); });
    $('#tab-plan').addEventListener('click', function () { showTab('plan'); });
    $('#tab-you').addEventListener('click', function () { showTab('you'); });

    window.FYC_VIEWS = { plan: renderPlan, you: renderYou };

    document.addEventListener('keydown', intakeKeys);

    resumeSession();
    if (I.done(session) && session.city) finish(false);
    else paintIntake();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
