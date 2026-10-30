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
  /* The drawn half. Guarded: every caller treats a missing drawing as null,
     and el() drops null children, so the app still runs if art.js does not. */
  function art() { return window.FYC_ART || null; }

  /** A listing's first interest is the one it is mostly about. */
  function orgPic(org, cls) {
    var A = art();
    if (!A) return null;
    var id = (org.interests || [])[0];
    return id ? A.pictogram(id, cls) : null;
  }

  /**
   * Which tint the subject badge takes. The taxonomy already sorts every
   * interest into one of six groups, so the colour says something true about
   * the listing rather than decorating it: moving and making are warm, the
   * rest are the moss the app already uses for "this is the thing".
   */
  var TINT = { move: 'warm', make: 'warm', think: 'cool', grow: 'leaf', give: 'leaf', belong: 'cool' };
  function tintFor(org) {
    var id = (org.interests || [])[0];
    var grp = id && FYC.INTERESTS[id] ? FYC.INTERESTS[id].group : null;
    return TINT[grp] || 'leaf';
  }

  /** A drawing for a screen with nothing on it yet. */
  function sceneFor(name) {
    var A = art();
    return A ? A.scene(name) : null;
  }

  function track(type, org) {
    if (FYC.prefs) FYC.prefs.record(type, org);
  }

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  // ---------- storage ----------
  var KEY = {
    plan: 'fyc.plan.v1', profile: 'fyc.profile.v1', feedback: 'fyc.feedback.v1',
    intake: 'fyc.intake.v1', tab: 'fyc.tab.v1'
  };
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  var storageWarned = false;
  function save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      // Private mode, or a full quota. Silently dropping every save meant the
      // plan looked saved and was gone on the next load, with nothing said.
      if (storageWarned) return;
      storageWarned = true;
      var bar = el('p', { class: 'storage-warn', role: 'status',
        text: 'This browser will not let the app store anything, so nothing here will survive a reload.' });
      var m = $('#main');
      if (m) m.insertBefore(bar, m.firstChild);
    }
  }

  // Which listing the detail pane is showing, held by id rather than by
  // position: the list is re-ranked whenever the answers change, and an index
  // kept across that lands on whatever happens to be sitting in that slot.
  var browsePick = null;
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
    // Once, at the top of the form. On question two it would be furniture.
    if (prog.asked === 0 && art()) {
      box.appendChild(el('div', { class: 'intake-guide' }, [
        art().guide('wave'),
        el('p', { text: 'Twenty short questions. Skip any of them.' })
      ]));
    }
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
        el('button', {
          class: 'btn', type: 'button', 'data-continue': true,
          onclick: function () { submit(answer()); }
        }, ['Continue'])
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
      // The button is marked, not matched on its text. It used to be found by
      // reading every button's label and comparing it to 'Next', which is not
      // what it has said for a long time — so Enter did nothing on every
      // multi-select question in the form.
      var next = $('#intake').querySelector('[data-continue]');
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
  var settleTimer = null;
  function settleHeight(host, from) {
    if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
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
    settleTimer = setTimeout(done, 400);
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
        sceneFor('search'),
        el('h2', { text: 'Not enough to go on yet.' }),
        el('p', { text: 'A few more answers and this fills in.' })
      ]));
      $('#results').hidden = false;
      return;
    }
    render(FYC.match(p), p);
  }

  // ---------- results ----------
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

  function detailPane(r, p, onBack, onSaveChange) {
    var org = r.org;
    var pane = el('div', { class: 'detail' });

    pane.appendChild(el('div', { class: 'detail-head' }, [
      el('button', {
        class: 'back-btn', type: 'button', 'aria-label': 'Back to the list', onclick: onBack
      }, ['\u2190']),
      el('span', { class: 'pic-badge ' + tintFor(org) }, [orgPic(org)]),
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

    var note = el('span', { class: 'copied', role: 'status', hidden: true });
    // Saving is a toggle. It used to set the button to "Saved ✓" and disable
    // it, so the only way to undo a mis-tap was to find the Saved tab.
    var saveBtn = el('button', {
      class: 'btn ghost', type: 'button',
      'aria-pressed': inPlan(org.id) ? 'true' : 'false',
      onclick: function () {
        var now = togglePlan(org);
        saveBtn.setAttribute('aria-pressed', now ? 'true' : 'false');
        saveBtn.textContent = now ? 'Saved \u2713' : 'Save';
        if (onSaveChange) onSaveChange();
      }
    }, [inPlan(org.id) ? 'Saved \u2713' : 'Save']);

    pane.appendChild(el('div', { class: 'step-box' }, [
      el('div', { class: 'step-head' }, [
        el('span', { class: 'pic-badge ' + tintFor(org) }, [orgPic(org)]),
        el('div', {}, [
          el('h3', { text: org.firstStep.label }),
          org.firstStep.when ? el('p', { class: 'when', text: org.firstStep.when }) : null
        ])
      ]),
      el('div', { class: 'actions' }, [
        el('a', {
          class: 'btn', href: org.firstStep.url || org.url,
          target: '_blank', rel: 'noopener noreferrer',
          onclick: function () { track('open', org); }
        }, [org.universal ? 'Open the directory \u2192' : 'Open the page \u2192']),
        saveBtn,
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

  /** Say one short thing to a screen reader. The panes themselves are quiet. */
  function announce(text) {
    var s = $('#results-status');
    if (s) s.textContent = text;
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
        sceneFor('search'),
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
    var at = 0;                       // which row is open, as a position

    function back() {
      wrap.classList.remove('on-detail');
      var cur = buttons[at];
      if (cur) cur.focus();
    }

    function pick(i, push) {
      at = i;
      // Held by id, so re-ranking after a changed answer reopens the listing
      // you were reading rather than whatever now sits in that slot.
      browsePick = items[i].r.org.id;
      buttons.forEach(function (b, j) {
        b.setAttribute('aria-current', j === i ? 'true' : 'false');
      });
      detail.innerHTML = '';
      detail.appendChild(detailPane(items[i].r, p, back, repaintRows));
      detail.scrollTop = 0;
      // Under the breakpoint there is only room for one pane, so choosing a
      // row is a navigation. Above it both are on screen and nothing moves.
      if (push) {
        wrap.classList.add('on-detail');
        track('expand', items[i].r.org);
        announce(items[i].r.org.name + '. ' + factLine(items[i].r) + '.');
        var h = detail.querySelector('h2');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
      }
    }

    /** Re-tick the saved markers after something is saved or unsaved. */
    function repaintRows() {
      buttons.forEach(function (b, j) {
        b.classList.toggle('is-saved', inPlan(items[j].r.org.id));
      });
      paintPlanCount();
    }

    /**
     * Up and down walk the list the way a mail client does: one roving stop
     * for the whole column, rather than twelve tab stops to get past it.
     */
    function rowKeys(e) {
      var d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1
        : e.key === 'Home' ? -items.length : e.key === 'End' ? items.length : 0;
      if (!d) return;
      e.preventDefault();
      var to = Math.max(0, Math.min(items.length - 1, at + d));
      if (to === at) return;
      pick(to, false);
      buttons[to].focus();
    }

    items.forEach(function (it, i) {
      if (it.head) rows.appendChild(el('li', { class: 'rows-head', text: it.head }));
      var b = el('button', {
        class: 'row' + (inPlan(it.r.org.id) ? ' is-saved' : ''),
        type: 'button', 'aria-current': 'false',
        onclick: function () { pick(i, true); },
        onkeydown: rowKeys
      }, [
        orgPic(it.r.org, 'row-pic'),
        el('span', { class: 'row-text' }, [
          el('span', { class: 'row-name', text: it.r.org.name }),
          el('span', { class: 'row-sub', text: it.r.org.neighborhood || it.r.org.cityName || '' })
        ]),
        // A tick, not a word: the row is a name and a place, and a second
        // label on it would compete with both.
        el('span', { class: 'row-saved', 'aria-hidden': 'true', text: '\u2713' })
      ]);
      buttons.push(b);
      rows.appendChild(el('li', {}, [b]));
    });

    var more = !I.done(session);
    var listCol = el('aside', { class: 'browse-list' }, [
      el('div', { class: 'browse-bar' }, [
        el('h2', { text: where }),
        el('span', { class: 'browse-n', text: String(items.length) }),
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

    var was = 0;
    items.forEach(function (it, i) { if (it.r.org.id === browsePick) was = i; });
    pick(was, false);
    announce(items.length + (items.length === 1 ? ' place' : ' places') + ' in ' + where + '.');
    host.hidden = false;
  }

  // ---------- plan ----------
  var PLAN_STEPS = [
    'Read what it involves',
    null, // replaced by the org's own first step
    'Go',
    'Go again'
  ];

  function inPlan(id) {
    return plan.some(function (x) { return x.id === id; });
  }

  /** Save or unsave. Returns whether it is saved afterwards. */
  function togglePlan(org) {
    var at = -1;
    plan.forEach(function (x, i) { if (x.id === org.id) at = i; });
    if (at !== -1) {
      if (plan[at].attrs) track('unplan', plan[at].attrs);
      plan.splice(at, 1);
      save(KEY.plan, plan);
      paintPlanCount();
      renderPlan();
      return false;
    }
    addToPlan(org);
    return true;
  }

  function addToPlan(org) {
    if (inPlan(org.id)) return;
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
  }

  function paintPlanCount() {
    var c = $('#plan-count');
    c.textContent = String(plan.length);
    c.hidden = plan.length === 0;
  }

  function renderPlan() {
    var host = $('#plan-body');
    if (!host) return;
    host.innerHTML = '';
    if (!plan.length) {
      host.appendChild(el('div', { class: 'screen-head' }, [el('h2', { text: 'Saved' })]));
      host.appendChild(el('div', { class: 'empty' }, [
        sceneFor('saved'),
        el('h2', { text: 'Nothing saved yet.' }),
        el('p', { text: 'Anything you like the look of lands here, with its first step.' }),
        el('div', { class: 'actions' }, [
          el('button', { class: 'btn', type: 'button', onclick: function () { showTab('find'); } }, ['Find something'])
        ])
      ]));
      return;
    }

    host.appendChild(el('div', { class: 'screen-head' }, [el('h2', { text: 'Saved' })]));

    plan.forEach(function (item, idx) {
      var steps = PLAN_STEPS.map(function (s, i) { return i === 1 ? item.stepLabel : s; });
      var doneCount = item.done.filter(Boolean).length;
      var finished = doneCount === item.done.length;
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

      host.appendChild(el('article', { class: 'card plan-item' + (finished ? ' done' : '') }, [
        el('div', { class: 'plan-top' }, [
          el('div', { class: 'plan-title' }, [
            el('h3', { text: item.name }),
            el('p', { class: 'where', text: [item.cityName, item.when].filter(Boolean).join(' · ') })
          ]),
          // Four ticks is the whole point of the list, so finishing it gets
          // a drawing rather than a bar that has quietly reached the end.
          finished ? el('span', { class: 'plan-done', title: 'You went.' }, [
            art() ? art().guide('cheer') : null
          ]) : null
        ]),
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

    // Privacy and Terms used to ride a footer under every screen. The footer
    // is gone and these are the only way into those pages, so they land here,
    // beside the rest of what the app holds about you.
    host.appendChild(el('p', { class: 'you-legal' }, [
      el('a', { href: 'privacy.html', text: 'Privacy' }),
      ' · ',
      el('a', { href: 'terms.html', text: 'Terms' }),
      ' · ',
      el('a', { href: 'https://github.com/amalmehta/community_finder', text: 'Source' })
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
  var TABS = ['find', 'plan', 'you', 'circles', 'messages'];
  /**
   * Where to open: whatever ?tab= asks for, else where you were when you
   * closed it, else Find. The query form is what the installed app's
   * shortcuts point at, so "Saved" from the dock opens Saved.
   */
  function openAt() {
    var want = null;
    try { want = new URLSearchParams(location.search).get('tab'); } catch (e) { want = null; }
    if (want && TABS.indexOf(want) !== -1) return want;
    var last = load(KEY.tab, 'find');
    return TABS.indexOf(last) !== -1 ? last : 'find';
  }
  window.FYC_LAST_TAB = openAt;

  function showTab(which) {
    // With a backend there are more tabs than these three; social.js owns the
    // switching in that case so every view is hidden correctly.
    save(KEY.tab, which);
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

  /* The two <meta name="theme-color"> tags in the head are scoped by
     prefers-color-scheme, which is right up to the moment someone overrides
     the system. From then on the page is dark and the browser's own chrome
     around it is not, which is the one place the choice visibly fails to
     take. A third, unscoped tag wins over both and is removed on auto. */
  var BAR = { light: '#fbf8f4', dark: '#171512' };
  function paintBrowserChrome(t) {
    var tag = document.getElementById('theme-color-pick');
    if (t === 'auto') { if (tag) tag.remove(); return; }
    if (!tag) {
      tag = document.createElement('meta');
      tag.id = 'theme-color-pick';
      tag.setAttribute('name', 'theme-color');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', BAR[t]);
  }

  function applyTheme(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    paintBrowserChrome(t);
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
    paintBrowserChrome(currentTheme());
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
    // A panel floating over the page should close when you go back to the
    // page. Escape already did; a click anywhere else did nothing.
    document.addEventListener('pointerdown', function (e) {
      if (panel.hidden) return;
      if (panel.contains(e.target) || tab.contains(e.target)) return;
      panel.hidden = true;
      tab.setAttribute('aria-expanded', 'false');
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

  // ---------- the network going away ----------
  /**
   * With the worker installed the app itself keeps working offline — the
   * listings are in the bundle and what you saved is on the device. What
   * stops working is every link out of it, which is most of the point of a
   * first step. So this says that, rather than a bare "you are offline" over
   * an app that is plainly still running.
   *
   * It informs and never blocks. navigator.onLine is false behind some
   * captive portals and true on others, so a disabled "Open the page" button
   * would be wrong about as often as it was right — and a tap costs the
   * person nothing when signal has come back a second before.
   */
  function wireOffline() {
    function paint() {
      var off = navigator.onLine === false;
      document.documentElement.classList.toggle('is-offline', off);
      var bar = $('#offline-warn');
      if (!off) {
        if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
        return;
      }
      if (bar) return;
      var m = $('#main');
      if (!m) return;
      bar = el('p', { id: 'offline-warn', class: 'storage-warn offline-warn', role: 'status',
        text: 'You are offline. Everything here still works — but the links out to each group will not until you are back.' });
      m.insertBefore(bar, m.firstChild);
    }
    window.addEventListener('online', paint);
    window.addEventListener('offline', paint);
    paint();
  }

  // ---------- boot ----------
  function init() {
    wireTheme();
    wireFeedback();
    wireOffline();
    paintPlanCount();

    $('#tab-find').addEventListener('click', function () { showTab('find'); });
    $('#tab-plan').addEventListener('click', function () { showTab('plan'); });
    $('#tab-you').addEventListener('click', function () { showTab('you'); });

    window.FYC_VIEWS = { plan: renderPlan, you: renderYou };

    document.addEventListener('keydown', intakeKeys);

    // Under the breakpoint the detail pane is a whole screen, reached by
    // choosing a row. Escape is how you leave a screen like that; the back
    // arrow was the only way out.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open = document.querySelector('.browse.on-detail');
      if (!open) return;
      var back = open.querySelector('.back-btn');
      if (back) { e.preventDefault(); back.click(); }
    });

    resumeSession();
    if (I.done(session) && session.city) finish(false);
    else paintIntake();

    // Gated on the button being available rather than on there being no
    // backend: social.js assigns FYC_SHOW when it parses, before it has
    // asked anyone whether they are signed in, so "is there a backend" is
    // not a question this can answer yet. Circles and Inbox stay hidden
    // until an account exists, and social.js reopens those itself.
    var last = openAt();
    var btn = $('#tab-' + last);
    if (last !== 'find' && btn && !btn.hidden) showTab(last);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
