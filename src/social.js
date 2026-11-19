/* community_finder — accounts, people and messages.
 *
 * Only active when a backend is present. Served statically (GitHub Pages) the
 * app runs exactly as before, with no account and no network calls.
 */
(function () {
  'use strict';
  var FYC = window.FYC;

  var S = { user: null, online: false, people: [], threads: [], openThread: null, poll: null };

  // ---------- small helpers ----------
  // All of these were a local copy, deliberately, so this file depended on
  // no other feature file. It still does not: dom.js is shared the way
  // core.js and art.js already are, and the copies had drifted apart.
  var D = window.FYC_DOM;
  // Which view is current. See FYC_DOM.turnstile.
  var views = D.turnstile();
  var el = D.el, svg = D.svg, $ = D.$, api = D.api, label = D.label, ago = D.ago;
  // Written out by hand in six places in this file before they lived in dom.js.
  var errLine = D.errLine, showErr = D.showErr, guard = D.guard;

  // ---------- the sign-in gate ----------
  // interestPicker() and pickedInterests() stood here: a thirty-two-pill
  // chooser and the function that read it. Nothing has called either since
  // the sign-up wall came down and the front door went to three fields — the
  // city and the interests come from the answers already given to the finder.
  // Twenty-nine lines of a screen that no longer exists.

  /**
   * The whole of making an account: a username, a password, and whether you
   * are eighteen.
   *
   * This used to be a wall across the front door, and it asked for a display
   * name, a city, two sentences about yourself and a pick from thirty-two
   * interests before showing a single thing the app does — for a finder that
   * runs entirely in the browser and needs no account at all. Everything
   * past the three fields here is either already known or not needed yet:
   * the city and the interests are the answers just given to the finder and
   * go up silently, the display name defaults to the username, and the bio
   * is asked for where it is used — by the trust tier on the You tab, and by
   * the written answer every circle application already requires.
   *
   * @param {{mode?:string, lead?:string, onDone?:Function}} opts
   *   mode  'signup' (default) or 'login'
   *   lead  one sentence saying why an account is being asked for here
   *   onDone called once there is a signed-in user
   */
  function authCard(opts) {
    opts = opts || {};
    var signup = opts.mode !== 'login';
    var err = errLine();

    // What the finder already knows. Nothing is asked for twice.
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('fyc.profile.v1') || 'null'); } catch (e) { saved = null; }
    var knownCity = (saved && saved.location || '').trim();
    var knownInterests = (saved && saved.interests || []).map(function (id) {
      return { id: id, visible: true };
    });

    var user = el('input', { type: 'text', id: 'au-user', required: true,
      autocomplete: 'username', autocapitalize: 'none', autocorrect: 'off',
      spellcheck: 'false', placeholder: 'lowercase, numbers, underscores' });
    var pass = el('input', { type: 'password', id: 'au-pass', required: true, minlength: '8',
      autocomplete: signup ? 'new-password' : 'current-password',
      placeholder: signup ? 'at least 8 characters' : '' });
    var age = el('input', { type: 'checkbox', id: 'au-age', required: true });

    var swap = el('button', { class: 'linkish', type: 'button', onclick: function () {
      var next = authCard({ mode: signup ? 'login' : 'signup', lead: opts.lead, onDone: opts.onDone });
      if (form.parentNode) form.parentNode.replaceChild(next, form);
    } }, [signup ? 'I already have an account' : 'I need an account']);

    var form = el('form', { class: 'card auth-card', onsubmit: async function (e) {
      e.preventDefault();
      err.hidden = true;
      var payload = { username: user.value.trim().toLowerCase(), password: pass.value };
      if (signup) {
        payload.ageOk = age.checked;
        payload.display = payload.username;
        if (knownCity) payload.city = knownCity;
        if (knownInterests.length) payload.interests = knownInterests;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        var out = await api('POST', signup ? '/api/signup' : '/api/login', payload);
        S.user = out.user;
        paintAccountTabs();
        refreshCounts();
        if (opts.onDone) opts.onDone(S.user);
      } catch (e2) {
        err.textContent = e2.message;
        err.hidden = false;
        btn.disabled = false;
      }
    } }, [
      opts.lead ? el('p', { class: 'auth-lead', text: opts.lead }) : null,
      el('h2', { class: 'gate-head', text: signup ? 'Make an account' : 'Welcome back' }),
      el('label', { class: 'field' }, [el('span', { text: 'Username' }), user]),
      el('label', { class: 'field' }, [el('span', { text: 'Password' }), pass]),
      signup ? el('label', { class: 'check' }, [age, el('span', { text: 'I am 18 or over' })]) : null,
      // Why there are only three fields, said next to them rather than under
      // the button, where it read as small print about something else.
      signup ? el('p', { class: 'hint', text: knownCity || knownInterests.length
        ? 'That is everything — your city and what you are into come from the answers you '
          + 'already gave, and the You tab can change them.'
        : 'That is everything. A city, a couple of sentences and what you are into are '
          + 'asked for later, where they are used.' }) : null,
      signup ? el('p', { class: 'hint', text: 'No email here, so there is no password reset.' }) : null,
      err,
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn', type: 'submit' }, [signup ? 'Make an account' : 'Sign in']),
        swap
      ])
    ]);
    return form;
  }

  /** Nothing covers the app any more; this only ever puts it back. */
  function closeGate() {
    $('#auth-gate').hidden = true;
    $('main').hidden = false;
    $('.tabs').hidden = false;
    paintAccountTabs();
    refreshCounts();
  }

  // ---------- tabs ----------
  function paintAccountTabs() {
    // Circles shows for anyone once there is a server to talk to — it is the
    // only way to find out circles exist, and it is where an account is
    // asked for. Inbox needs one to have anything in it.
    var t = document.getElementById('tab-messages');
    if (t) t.hidden = !S.user;
    if (window.FYC_CIRCLES) window.FYC_CIRCLES.enable(S);
  }

  async function refreshCounts() {
    if (!S.user) return;
    try {
      var r = await api('GET', '/api/requests');
      var n = r.incoming.length;
      var badge = document.getElementById('msg-count');
      // circles.js guards this lookup and this did not, so a missing badge
      // would have thrown here and taken the circles refresh below with it.
      if (!badge) return;
      badge.textContent = String(n);
      badge.hidden = n === 0;
      var tab = document.getElementById('tab-messages');
      if (tab) {
        if (n) tab.setAttribute('aria-label', 'Inbox, ' + n + ' waiting');
        else tab.removeAttribute('aria-label');
      }
      if (window.FYC_CIRCLES) window.FYC_CIRCLES.refreshBadge();
    } catch (e) { /* offline */ }
  }

  // ---------- the alignment graph ----------

  /** A small spring/repulsion layout. Deterministic: same data, same picture. */
  function layout(nodes, links, w, h, steps) {
    var byId = {};
    nodes.forEach(function (n, i) {
      // Seeded placement on a circle so the result does not jump around.
      var a = (i / nodes.length) * Math.PI * 2;
      n.x = w / 2 + Math.cos(a) * (n.kind === 'me' ? 0 : n.kind === 'interest' ? w * 0.18 : w * 0.34);
      n.y = h / 2 + Math.sin(a) * (n.kind === 'me' ? 0 : n.kind === 'interest' ? h * 0.18 : h * 0.34);
      byId[n.id] = n;
    });

    for (var s = 0; s < steps; s++) {
      var cool = 1 - s / steps;
      // repulsion
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a1 = nodes[i], b1 = nodes[j];
          var dx = b1.x - a1.x, dy = b1.y - a1.y;
          var d2 = dx * dx + dy * dy || 0.01;
          var f = 9000 / d2;
          var d = Math.sqrt(d2);
          var fx = (dx / d) * f * cool, fy = (dy / d) * f * cool;
          a1.x -= fx; a1.y -= fy; b1.x += fx; b1.y += fy;
        }
      }
      // springs
      links.forEach(function (l) {
        var a2 = byId[l.source], b2 = byId[l.target];
        if (!a2 || !b2) return;
        var dx = b2.x - a2.x, dy = b2.y - a2.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var rest = l.value === 2 ? 110 : 150;
        var f = (d - rest) * 0.04 * cool;
        var fx = (dx / d) * f, fy = (dy / d) * f;
        a2.x += fx; a2.y += fy; b2.x -= fx; b2.y -= fy;
      });
      nodes.forEach(function (n) {
        if (n.kind === 'me') { n.x += (w / 2 - n.x) * 0.25; n.y += (h / 2 - n.y) * 0.25; }
      });
    }

    // Scale the finished layout to fill the canvas. Without this the graph
    // sits in a small clump in the middle and the labels collide.
    var pad = { x: 70, y: 34 };
    var xs = nodes.map(function (n) { return n.x; });
    var ys = nodes.map(function (n) { return n.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var sx = (w - pad.x * 2) / Math.max(1, maxX - minX);
    var sy = (h - pad.y * 2) / Math.max(1, maxY - minY);
    var k = Math.min(sx, sy);
    var offX = (w - (maxX - minX) * k) / 2 - minX * k;
    var offY = (h - (maxY - minY) * k) / 2 - minY * k;
    nodes.forEach(function (n) { n.x = n.x * k + offX; n.y = n.y * k + offY; });
    return byId;
  }

  function graphSvg(data, onPick) {
    var w = 640, h = 420;
    var nodes = data.nodes.map(function (n) { return Object.assign({}, n); });
    var byId = layout(nodes, data.links, w, h, 260);

    var kids = [];
    data.links.forEach(function (l) {
      var a = byId[l.source], b = byId[l.target];
      if (!a || !b) return;
      kids.push(svg('line', {
        x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1),
        class: 'glink' + (l.value === 2 ? ' strong' : '')
      }));
    });

    nodes.forEach(function (n) {
      var r = n.kind === 'me' ? 15 : n.kind === 'interest' ? 7 : 11 + Math.min(6, n.shared || 0);
      // 'g' prefix so graph nodes never collide with the .person cards below.
      var g = svg('g', { class: 'gnode g' + n.kind + (n.canDirect ? ' gdirect' : ''), tabindex: n.kind === 'person' ? '0' : null });
      g.appendChild(svg('circle', { cx: n.x.toFixed(1), cy: n.y.toFixed(1), r: r }));
      var text = n.kind === 'interest' ? label(n.label).split(' & ')[0] : n.label;
      g.appendChild(svg('text', {
        x: n.x.toFixed(1), y: (n.y + r + 13).toFixed(1), 'text-anchor': 'middle',
        class: 'glabel', text: text
      }));
      if (n.kind === 'person' && onPick) {
        g.addEventListener('click', function () { onPick(n); });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(n); }
        });
      }
      kids.push(g);
    });

    return svg('svg', {
      viewBox: '0 0 ' + w + ' ' + h, class: 'graph', role: 'img',
      'aria-label': 'People you share interests with, linked through the interests you have in common'
    }, kids);
  }

  // ---------- People ----------
  function loading(text) {
    // Swapping a panel for a spinner said nothing at all to a screen
    // reader; role=status reads the line out as the panel changes.
    return el('div', { class: 'card loading', role: 'status' }, [
      el('span', { class: 'spinner', 'aria-hidden': 'true' }),
      el('span', { text: text })
    ]);
  }

  async function renderPeople() {
    // The one view in this file with no ticket. Toggling People → Chats →
    // People faster than the two requests come back left two runs in flight,
    // and both painted: every person twice, with duplicate person-N ids, so
    // the graph's jump-to-card landed on whichever copy came first.
    var mine = views.take();
    var host = $('#people-body');
    function reset() { host.innerHTML = ''; host.appendChild(segBar('people')); }
    reset();
    host.appendChild(loading('Looking…'));

    var data, graph;
    try {
      // Independent of each other.
      var both = await Promise.all([api('GET', '/api/people'), api('GET', '/api/graph')]);
      data = both[0];
      graph = both[1];
    }
    catch (e) {
      if (!views.current(mine)) return;
      reset();
      host.appendChild(el('p', { class: 'err', role: 'alert', text: e.message }));
      return;
    }
    if (!views.current(mine)) return;
    reset();
    S.people = data.people;

    if (!data.meVerified) {
      host.appendChild(el('div', { class: 'notice' }, [
        el('b', { text: 'Verify your email to message people. ' }),
        'Add an address on the You tab.'
      ]));
    }

    // The overlap picture is a nice thing to look at once, not something to
    // scroll past every time. Folded away; the list is the page.
    if (graph && graph.nodes.filter(function (n) { return n.kind === 'person'; }).length) {
      var fold = el('details', { class: 'fold' }, [
        el('summary', { text: 'How you overlap' })
      ]);
      // Drawn when it is opened, not before. The layout is 260 iterations of
      // an all-pairs repulsion loop — at forty people and thirty-two
      // interests, something like 650,000 inner steps on the main thread,
      // before a single card painted, for a fold most people never open. It
      // is deterministic, so building it later is the same picture.
      fold.addEventListener('toggle', function () {
        if (!fold.open || fold.dataset.drawn) return;
        fold.dataset.drawn = '1';
        fold.appendChild(graphSvg(graph, function (n) {
          var card = document.getElementById('person-' + n.userId);
          if (card) { card.scrollIntoView({ block: 'center' }); card.classList.add('flash'); setTimeout(function () { card.classList.remove('flash'); }, 1200); }
        }));
      });
      host.appendChild(fold);
    }

    if (!S.people.length) {
      host.appendChild(el('div', { class: 'card empty' }, [
        sceneFor('welcome'),
        el('h2', { text: 'Nobody yet.' }),
        el('p', { text: 'Show a few more interests on the You tab.' })
      ]));
      return;
    }

    S.people.forEach(function (p) {
      var c = p.connection;
      var statusText = !c ? null
        : c.status === 'pending' ? (c.mine ? 'Introduction sent — waiting for a reply' : 'They have sent you an introduction')
        : c.status === 'accepted' ? 'You are connected'
        : 'Not connected';

      var direct = !c && p.canDirect;
      var intro = el('textarea', {
        class: 'intro-box', hidden: true, maxlength: direct ? '2000' : '300',
        placeholder: direct ? 'Message' : 'Say hello in 300 characters'
      });
      var err = errLine();

      var card = el('article', { class: 'card person', id: 'person-' + p.id }, [
        el('div', { class: 'person-top' }, [
          faceFor('person-' + p.id),
          el('h3', { text: p.display }),
          el('span', { class: 'badge', text: p.shared + ' shared' })
        ]),
        el('p', { class: 'where', text: [p.city, 'active ' + ago(p.lastSeen)].filter(Boolean).join(' · ') }),
        p.bio ? el('p', { class: 'blurb', text: p.bio }) : null,
        el('div', { class: 'badges' }, p.interests.slice(0, 6).map(function (i) {
          var A = art();
          return el('span', { class: 'badge' }, [
            A ? A.pictogram(i) : null, el('span', { text: label(i) })
          ]);
        })),
        statusText ? el('p', { class: 'hint', text: statusText }) : null,
        intro, err,
        el('div', { class: 'actions' }, [
          (!c) ? el('button', { class: 'btn sm', type: 'button', onclick: async function (ev) {
            var btn = ev.currentTarget;
            if (intro.hidden) {
              intro.hidden = false;
              intro.focus();
              btn.textContent = direct ? 'Send message' : 'Send introduction';
              return;
            }
            err.hidden = true;
            try {
              if (direct) {
                await api('POST', '/api/direct', { toUserId: p.id, body: intro.value });
              } else {
                await api('POST', '/api/requests', { toUserId: p.id, intro: intro.value });
              }
              btn.disabled = true;
              btn.textContent = 'Sent ✓';
              intro.hidden = true;
            } catch (e2) { err.textContent = e2.message; err.hidden = false; }
          } }, [direct ? 'Message directly' : 'Say hello']) : null,
          // Block and report are safety valves, not things you do to five
          // people a day. One button per card, and these as quiet text.
          el('span', { class: 'quiet-acts' }, [
            el('button', { class: 'linkish', type: 'button', onclick: guard(err, async function () {
              if (!confirm('Block ' + p.display + '? They will disappear from your results and cannot contact you.')) return;
              await api('POST', '/api/blocks', { userId: p.id });
              renderPeople();
            }) }, ['Block']),
            el('button', { class: 'linkish', type: 'button', onclick: guard(err, async function () {
              var reason = prompt('What is the problem? (harassment, spam, fake profile, other)');
              if (!reason) return;
              await api('POST', '/api/reports', { userId: p.id, reason: reason });
              alert('Reported, and they are now blocked.');
              renderPeople();
            }) }, ['Report'])
          ])
        ])
      ]);
      host.appendChild(card);
    });
  }

  // ---------- Messages ----------
  async function renderMessages() {
    var mine = views.take();
    var host = $('#messages-body');
    function reset() { host.innerHTML = ''; host.appendChild(segBar('chats')); }
    reset();
    host.appendChild(loading('Loading…'));
    stopPolling();

    var reqs, threads;
    try {
      reqs = await api('GET', '/api/requests');
      threads = (await api('GET', '/api/threads')).threads;
    } catch (e) {
      if (!views.current(mine)) return;
      reset();
      host.appendChild(el('p', { class: 'err', role: 'alert', text: e.message }));
      return;
    }
    if (!views.current(mine)) return;
    reset();
    S.threads = threads;

    if (reqs.incoming.length) {
      host.appendChild(el('div', { class: 'results-head' }, [
        el('h2', { text: 'Introductions' })
      ]));
      reqs.incoming.forEach(function (r) {
        // Three answers to an introduction, none of which used to say
        // anything when the request failed: the card simply stayed where it
        // was, which is also what it does when nothing is wrong.
        var reqErr = errLine();
        host.appendChild(el('article', { class: 'card' }, [
          el('h3', { text: r.other_name }),
          el('p', { class: 'where', text: [r.other_city, ago(r.created_at)].filter(Boolean).join(' · ') }),
          el('p', { class: 'intro-text', text: r.intro }),
          reqErr,
          el('div', { class: 'actions' }, [
            el('button', { class: 'btn sm', type: 'button', onclick: guard(reqErr, async function () {
              await api('POST', '/api/requests/' + r.id + '/accept');
              renderMessages(); refreshCounts();
            }) }, ['Accept']),
            el('button', { class: 'btn ghost sm', type: 'button', onclick: guard(reqErr, async function () {
              await api('POST', '/api/requests/' + r.id + '/decline');
              renderMessages(); refreshCounts();
            }) }, ['Decline']),
            el('button', { class: 'btn ghost sm', type: 'button', onclick: guard(reqErr, async function () {
              await api('POST', '/api/blocks', { userId: r.from_id });
              renderMessages(); refreshCounts();
            }) }, ['Block'])
          ])
        ]));
      });
    }

    if (reqs.outgoing.length) {
      host.appendChild(el('div', { class: 'results-head' }, [el('h2', { text: 'Waiting on a reply' })]));
      reqs.outgoing.forEach(function (r) {
        host.appendChild(el('article', { class: 'card' }, [
          el('h3', { text: r.other_name }),
          el('p', { class: 'where', text: 'Sent ' + ago(r.created_at) }),
          el('p', { class: 'intro-text', text: r.intro })
        ]));
      });
    }

    if (reqs.incoming.length || reqs.outgoing.length) {
      host.appendChild(el('div', { class: 'results-head' }, [el('h2', { text: 'Conversations' })]));
    }
    if (!threads.length) {
      host.appendChild(el('div', { class: 'card empty' }, [
        sceneFor('inbox'),
        el('h2', { text: 'No conversations yet.' }),
        el('p', { text: 'Say hello to someone under People.' })
      ]));
      return;
    }

    threads.forEach(function (t) {
      host.appendChild(el('article', {
        // Same as a circle card: the button is named for the person, and the
        // last message, the time and the unread count stay as content rather
        // than being read out as part of its name.
        class: 'card thread', role: 'button', tabindex: '0',
        'aria-label': 'Conversation with ' + t.other_name,
        onclick: function () { openThread(t); },
        onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThread(t); } }
      }, [
        el('div', { class: 'who' }, [
          faceFor('person-' + (t.other_id || t.other_name)),
          el('h3', { class: 'who-name', text: t.other_name })
        ]),
        el('p', { class: 'where', text: [t.other_city, t.last_at ? ago(t.last_at) : 'no messages yet'].filter(Boolean).join(' · ') }),
        t.last_body ? el('p', { class: 'blurb', text: t.last_body }) : null
      ]));
    });
  }

  /* The drawn half, guarded: a missing drawing is null and el() drops it. */
  function art() { return window.FYC_ART || null; }
  function faceFor(id) { var A = art(); return A ? A.avatar(id) : null; }
  function sceneFor(n) { var A = art(); return A ? A.scene(n) : null; }

  function stopPolling() {
    // D.every returns its own canceller rather than a numeric id.
    if (S.poll) { S.poll(); S.poll = null; }
  }

  /** The thirty-second unread count, which only means anything signed in. */
  function stopCounts() {
    if (S.counts) { S.counts(); S.counts = null; }
  }

  async function openThread(t) {
    var mine = views.take();
    stopPolling();
    S.openThread = t;
    var host = $('#messages-body');
    host.innerHTML = '';

    // role="log" carries aria-live="polite": a reply arriving on the 5s poll
    // was appended silently, so the only way to find out somebody had written
    // back was to go and read the page again.
    // aria-live starts off: the list is in the document before the first
    // fetch, so a region meant for arriving replies read the whole history
    // out as live updates when the thread opened. Switched on after the
    // first pull, when everything that lands really is news.
    var list = el('div', { class: 'msg-list', id: 'msg-list', role: 'log',
      'aria-live': 'off', 'aria-label': 'Messages with ' + t.other_name });
    // Matches the server's cap; the only two textareas in the app that had none.
    // The placeholder is not a name — it is not read by every screen reader
    // and it disappears the moment anything is typed. This is the control the
    // whole screen is for.
    var input = el('textarea', { class: 'msg-input', maxlength: '2000',
      'aria-label': 'Write a message to ' + t.other_name,
      placeholder: 'Write a message…', rows: '2' });
    var err = errLine();
    var lastId = 0;
    var seen = Object.create(null);   // message ids already on screen
    var pulling = false;              // only one request in flight at a time

    // Sending triggers a pull, and so does the 5s timer. Without the guard and
    // the id check, two overlapping pulls share a cursor and render the same
    // message twice.
    // Within a couple of lines of the end counts as being at the end. Same
    // rule as a circle's chat, which solved this and kept the solution to
    // itself: a one-to-one thread yanked you to the bottom on every poll, so
    // reading back through a conversation was interrupted every five seconds
    // by a jump with nothing to explain it and no way back but scrolling.
    function atEnd() {
      return list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    }
    function toEnd(glide) {
      list.scrollTo({ top: list.scrollHeight, behavior: glide ? 'smooth' : 'auto' });
    }
    var toLatest = el('button', {
      class: 'to-latest', type: 'button', hidden: true,
      onclick: function () { toEnd(false); toLatest.hidden = true; }
    }, ['New messages ↓']);
    list.addEventListener('scroll', function () { if (atEnd()) toLatest.hidden = true; });

    async function pull() {
      if (pulling || !views.current(mine)) return;
      pulling = true;
      // Measured before anything is appended, or the new message is already
      // part of the height being measured against.
      var wasAtEnd = atEnd();
      var first = !lastId;
      try {
        var r = await api('GET', '/api/threads/' + t.id + '/messages?since=' + lastId);
        if (!views.current(mine)) return;
        var added = 0;
        r.messages.forEach(function (m) {
          if (seen[m.id]) return;
          seen[m.id] = true;
          lastId = Math.max(lastId, m.id);
          added++;
          list.appendChild(el('div', { class: 'msg ' + (m.sender_id === S.user.id ? 'mine' : 'theirs') }, [
            el('p', { text: m.body }),
            el('span', { class: 'msg-time', text: ago(m.created_at) })
          ]));
        });
        if (added) {
          if (wasAtEnd) { toEnd(!first); toLatest.hidden = true; }
          else toLatest.hidden = false;
        }
        if (first) list.setAttribute('aria-live', 'polite');
      } catch (e) { /* transient */ } finally {
        pulling = false;
      }
    }

    async function send() {
      var text = input.value.trim();
      if (!text) return;
      err.hidden = true;
      try {
        await api('POST', '/api/threads/' + t.id + '/messages', { body: text });
        input.value = '';
        await pull();
        // Saying something is always a reason to be shown the end of it.
        toEnd(false);
        toLatest.hidden = true;
      } catch (e) { showErr(err, e); }
    }

    host.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: t.other_name }),
      el('p', { text: t.other_city || '' })
    ]));
    // Block and Report both sit behind a confirm, so a failure that showed
    // nothing left the person certain it had happened — and the conversation
    // still open in front of them.
    host.appendChild(el('div', { class: 'actions' }, [
      el('button', { class: 'btn ghost sm', type: 'button', onclick: function () { stopPolling(); renderMessages(); } }, ['← All conversations']),
      el('button', { class: 'btn ghost sm', type: 'button', onclick: guard(err, async function () {
        if (!confirm('Block ' + t.other_name + '? This ends the conversation.')) return;
        await api('POST', '/api/blocks', { userId: t.other_id });
        stopPolling(); renderMessages();
      }) }, ['Block']),
      el('button', { class: 'btn ghost sm', type: 'button', onclick: guard(err, async function () {
        var reason = prompt('What is the problem? (harassment, spam, fake profile, other)');
        if (!reason) return;
        await api('POST', '/api/reports', { userId: t.other_id, reason: reason });
        alert('Reported, and they are now blocked.');
        stopPolling(); renderMessages();
      }) }, ['Report'])
    ]));
    host.appendChild(el('article', { class: 'card' }, [
      el('div', { class: 'chat-wrap' }, [list, toLatest]),
      err,
      el('div', { class: 'composer' }, [
        input,
        el('button', { class: 'btn sm', type: 'button', onclick: send }, ['Send'])
      ])
    ]));

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
    });

    await pull();
    // Backed out of while it was loading: the list this would paint into is
    // already detached, and S.poll belongs to whatever is on screen now.
    if (!views.current(mine)) return;
    stopPolling();
    S.poll = D.every(5000, pull);
  }

  // ---------- profile editing (lives on the You tab) ----------
  function profileCard() {
    // Signed out, this is where the way back in lives. It returned null
    // before, which was fine while a gate covered the app and is a blank
    // half-screen now that nothing does.
    if (!S.user) {
      return el('article', { class: 'card' }, [
        el('h3', { text: 'Your profile' }),
        el('p', { class: 'hint', text: 'Everything on this tab so far is this device\u2019s own. '
          + 'An account adds the parts other people are in — circles, and messages.' }),
        authCard({ onDone: function () { if (window.FYC_VIEWS && window.FYC_VIEWS.you) window.FYC_VIEWS.you(); } })
      ]);
    }
    var u = S.user;
    // Everyone else on People has a face; the card where you set yours up
    // was the only one without one.
    var me = art() ? art().avatar('person-' + u.id) : null;
    if (me) me.classList.add('lg');
    var city = el('input', { type: 'text', value: u.city || '', placeholder: 'Your city',
      autocomplete: 'address-level2', autocapitalize: 'words' });
    var bio = el('textarea', { maxlength: '280', rows: '2', placeholder: 'A sentence about what you are looking for (optional)' });
    bio.value = u.bio || '';
    var disc = el('input', { type: 'checkbox' });
    disc.checked = u.discoverable !== false;
    var saved = el('span', { class: 'copied', hidden: true, text: 'Saved' });

    var rows = el('div', { class: 'vis-list' }, u.interests.map(function (i) {
      var cb = el('input', { type: 'checkbox', 'data-vis': i.id });
      cb.checked = i.visible !== false;
      return el('label', { class: 'vis-row' }, [cb, el('span', { text: label(i.id) })]);
    }));

    var emailInput = el('input', { type: 'email', value: u.email || '', placeholder: 'you@example.com' });
    var emailMsg = el('p', { class: 'hint', hidden: true });
    var emailErr = errLine();
    var directCb = el('input', { type: 'checkbox' });
    directCb.checked = u.openToDirect !== false;

    var emailCard = el('article', { class: 'card' }, [
      el('h3', { text: 'Email' }),
      el('p', { class: 'hint', text: u.emailVerified
        ? 'Verified.'
        : 'Needed before you can message anyone.' }),
      el('label', { class: 'field' }, [
        el('span', { text: u.emailVerified ? 'Verified address' : 'Address' }),
        emailInput
      ]),
      emailMsg, emailErr,
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn sm', type: 'button', onclick: async function (ev) {
          emailErr.hidden = true; emailMsg.hidden = true;
          var btn = ev.currentTarget;
          btn.disabled = true;
          try {
            var out = await api('POST', '/api/email', { email: emailInput.value.trim() });
            emailMsg.textContent = out.transport === 'file'
              ? 'Sent. This server writes mail to server/data/outbox/ and the console — open the link there to finish.'
              : 'Sent. Check your inbox for the link.';
            emailMsg.hidden = false;
          } catch (e) { emailErr.textContent = e.message; emailErr.hidden = false; }
          btn.disabled = false;
        } }, [u.emailVerified ? 'Change address' : 'Send verification link'])
      ]),
      el('label', { class: 'check' }, [
        directCb,
        el('span', { text: 'Let people with a lot in common message me directly' })
      ])
    ]);

    var profileErr = errLine();
    var profile = el('article', { class: 'card' }, [
      el('div', { class: 'who who-head' }, [
        me,
        el('div', {}, [
          el('h3', { text: 'Your profile' }),
          el('p', { class: 'hint', text: 'Signed in as ' + u.display + ' (@' + u.username + ').' })
        ])
      ]),
      el('label', { class: 'field' }, [el('span', { text: 'City' }), city]),
      el('label', { class: 'field' }, [el('span', { text: 'About you' }), bio]),
      el('label', { class: 'check' }, [disc, el('span', { text: 'Let people with shared interests find me' })]),
      u.interests.length ? el('div', { class: 'field' }, [
        el('span', { text: 'Visible to others' }),
        rows
      ]) : null,
      profileErr,
      el('div', { class: 'actions' }, [
        // This had no catch and no disabled state, so offline — or any 4xx —
        // rejected the promise, skipped the "Saved" line and showed nothing
        // at all. A click that fails in exactly the same way as a click that
        // does nothing is the worst of both: the person walks away believing
        // their city and bio are stored.
        el('button', { class: 'btn sm', type: 'button', onclick: async function (ev) {
          var btn = ev.currentTarget;
          var interests = Array.prototype.slice.call(rows.querySelectorAll('[data-vis]')).map(function (cb) {
            return { id: cb.getAttribute('data-vis'), visible: cb.checked };
          });
          btn.disabled = true;
          profileErr.hidden = true;
          try {
            var out = await api('PATCH', '/api/me', {
              city: city.value, bio: bio.value, discoverable: disc.checked,
              openToDirect: directCb.checked,
              interests: interests.length ? interests : undefined
            });
            S.user = out.user;
            saved.hidden = false;
            setTimeout(function () { saved.hidden = true; }, 1600);
          } catch (e) {
            showErr(profileErr, e);
          } finally {
            btn.disabled = false;
          }
        } }, ['Save profile']),
        saved
      ])
    ]);

    var account = el('div', { class: 'actions signout-row' }, [
      el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
        await api('POST', '/api/logout');
        S.user = null;
        stopPolling();
        stopCounts();
        // stopPolling() is this file's own loop. circles.js has another, and
        // the only thing that ever stopped it was show() — which signing out
        // does not call. So a circle left open went on asking the server for
        // its messages every five seconds with no session, silently, until
        // the next reload. The badge is the same oversight the other way
        // round: the Circles tab stays visible when signed out, so it carried
        // on advertising the last person's unread count to whoever was there.
        if (window.FYC_CIRCLES) {
          window.FYC_CIRCLES.stop();
          window.FYC_CIRCLES.clearBadge();
        }
        paintAccountTabs();
        // Repaint what is on screen. Signing out used to raise the gate over
        // the whole app, which hid this; now that nothing is hidden, the You
        // tab would sit there showing the profile of whoever just left.
        if (window.FYC_VIEWS && window.FYC_VIEWS.you) window.FYC_VIEWS.you();
      } }, ['Sign out'])
    ]);

    // What this server holds about you, and the end of it. The privacy page
    // has listed the first and promised the second since it was written, and
    // the promise was "ask whoever runs the server" — which is a sentence on
    // a page rather than something the app does. Folded away, because these
    // are not things anybody needs in front of them every visit.
    var dangerErr = errLine();
    var account2 = el('details', { class: 'fold' }, [
      el('summary', { text: 'Your data on this server' }),
      el('p', { class: 'hint', text:
        'Your answers to the finder, your saved list and what you have clicked are not on '
        + 'the server at all — they are in this browser, and the controls for them are below.' }),
      dangerErr,
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn ghost sm', type: 'button', onclick: guard(dangerErr, async function () {
          // Fetched rather than linked, so a failure is a message on the page
          // instead of a browser tab showing a JSON error.
          var data = await api('GET', '/api/me/export');
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'community-finder-' + u.username + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
        }) }, ['Download everything']),
        el('button', { class: 'btn ghost sm danger', type: 'button', onclick: guard(dangerErr, async function () {
          if (!confirm('Delete your account? Your profile, your messages and your conversations '
            + 'go with it, and it cannot be undone. A circle you host is handed to whoever has '
            + 'been in it longest.')) return;
          // The password, not just the confirm: this is the one thing in the
          // app that cannot be undone, and a session cookie is a thing a
          // borrowed laptop has.
          var pw = prompt('Type your password to confirm.');
          if (!pw) return;
          var out = await api('DELETE', '/api/me', { password: pw });
          S.user = null;
          stopPolling();
          stopCounts();
          if (window.FYC_CIRCLES) {
            window.FYC_CIRCLES.stop();
            window.FYC_CIRCLES.clearBadge();
          }
          paintAccountTabs();
          if (window.FYC_VIEWS && window.FYC_VIEWS.you) window.FYC_VIEWS.you();
          alert('Your account is gone.'
            + (out.handedOver ? ' ' + out.handedOver + (out.handedOver === 1 ? ' circle' : ' circles')
                + ' you hosted ' + (out.handedOver === 1 ? 'has' : 'have') + ' a new host.' : ''));
        }) }, ['Delete my account'])
      ])
    ]);

    var wrap = document.createDocumentFragment();
    wrap.appendChild(profile);
    wrap.appendChild(emailCard);
    wrap.appendChild(account2);
    wrap.appendChild(account);
    return wrap;
  }

  // ---------- boot ----------
  async function init() {
    var gate = $('#auth-gate');
    if (!gate) return;

    // The verification link lands here; consume the token before anything else.
    var verifyNote = null;
    if (location.pathname === '/verify') {
      var token = new URLSearchParams(location.search).get('token');
      try {
        await api('GET', '/api/verify?token=' + encodeURIComponent(token || ''));
        verifyNote = { ok: true, text: 'Email verified. You can contact people now.' };
      } catch (e) {
        verifyNote = { ok: false, text: e.message };
      }
      history.replaceState({}, '', '/');
    }

    try {
      var me = await api('GET', '/api/me');
      S.online = true;
      S.user = me.user;
    } catch (e) {
      // No backend: this is the static build. Leave the app exactly as it was.
      S.online = false;
      return;
    }

    // This used to be printed in the footer, which put it under every screen
    // in the app. It is a fact about where your data lives, so it belongs on
    // the one screen that is about you. You reads it from here.
    window.FYC_STORAGE_NOTE = 'Your profile, messages and circles are stored on this server. Anything you say in a circle is visible to that circle.';

    // Turning the social half on is these tabs appearing. There was also a
    // body.has-accounts class set here, which no stylesheet has ever matched
    // and nothing has ever read.
    document.getElementById('tab-messages').addEventListener('click', function () { show('messages'); });

    // The app opens on the app. This used to raise a full-page sign-up over
    // it, which hid a finder that runs entirely in the browser and has never
    // needed an account for anything.
    closeGate();
    if (S.user) {
      // The tab you were last on is worth reopening. app.js remembers it;
      // show() is this file's, the one that knows about accounts.
      var last = window.FYC_LAST_TAB ? window.FYC_LAST_TAB() : 'find';
      if (last !== 'find' && document.getElementById('tab-' + last)) show(last);
    }

    if (verifyNote) {
      var banner = el('div', { class: 'notice' + (verifyNote.ok ? '' : ' bad') }, [
        el('b', { text: verifyNote.ok ? 'Done. ' : 'That did not work. ' }),
        verifyNote.text
      ]);
      var find = document.querySelector('#view-find .wrap');
      if (find) find.insertBefore(banner, find.firstChild);
    }

    // Let the You tab render the profile editor underneath its charts.
    window.FYC_SOCIAL = { authCard: authCard, profileCard: profileCard, state: S };
    // Held so it can be stopped — and now it is. S.counts was assigned here
    // and never read anywhere, so the comment that used to sit on this line
    // described the problem rather than fixing it: the loop ran every thirty
    // seconds for as long as the page was open, signed in or not. (It does
    // pause while the tab is hidden; D.every sees to that.)
    S.counts = D.every(30000, refreshCounts);
  }

  /** Which half of the inbox is showing. Remembered so the tab reopens where
   *  you left it, the way a mail app does. */
  var inboxSeg = 'chats';

  function show(which) {
    // People is a segment inside the inbox now, so both panels answer to the
    // Inbox tab and neither has a tab of its own.
    var inbox = which === 'messages' || which === 'people';
    ['find', 'plan', 'you', 'circles', 'messages', 'people'].forEach(function (name) {
      var view = document.getElementById('view-' + name);
      if (!view) return;
      view.hidden = name === 'messages' ? !(inbox && inboxSeg === 'chats')
        : name === 'people' ? !(inbox && inboxSeg === 'people')
        : which !== name;
    });
    ['find', 'plan', 'you', 'circles', 'messages'].forEach(function (name) {
      var tab = document.getElementById('tab-' + name);
      if (tab) tab.setAttribute('aria-selected', (name === 'messages' ? inbox : which === name) ? 'true' : 'false');
    });
    if (window.FYC_TAB_IN_VIEW) window.FYC_TAB_IN_VIEW(inbox ? 'messages' : which);
    // Circles and Inbox reach this without going through app.js's showTab,
    // so this is where they get remembered, pushed and named like the rest.
    if (window.FYC_NAV) window.FYC_NAV.noteTab(inbox ? 'messages' : which);
    stopPolling();
    if (window.FYC_CIRCLES) {
      window.FYC_CIRCLES.stop();
      if (which === 'circles') window.FYC_CIRCLES.render();
    }
    if (inbox) { if (inboxSeg === 'people') renderPeople(); else renderMessages(); }
    // The finder's own tabs are rendered by app.js.
    if (window.FYC_VIEWS && window.FYC_VIEWS[which]) window.FYC_VIEWS[which]();
    window.scrollTo({ top: 0 });
  }

  /** The Chats / People switch at the top of the inbox. */
  function segBar(active) {
    var seg = el('div', { class: 'seg', role: 'tablist' }, [
      ['chats', 'Chats'], ['people', 'People']
    ].map(function (pair) {
      return el('button', {
        class: 'seg-btn', type: 'button', role: 'tab',
        'data-seg': pair[0],
        'aria-selected': active === pair[0] ? 'true' : 'false',
        onclick: function () {
          inboxSeg = pair[0];
          show(pair[0] === 'people' ? 'people' : 'messages');
          // show() re-renders the half it switched to, and that render builds
          // a fresh seg bar — so the button that was just clicked is gone and
          // focus has fallen to <body>. wireTablist finds its place in the
          // strip from document.activeElement, so an arrow key worked once
          // and then did nothing at all. Put focus on the button's
          // replacement, which is where the person thinks they are.
          var again = document.querySelector(
            (pair[0] === 'people' ? '#people-body' : '#messages-body') + ' [data-seg="' + pair[0] + '"]');
          if (again) again.focus();
        }
      }, [pair[1]]);
    }));
    D.wireTablist(seg);
    return seg;
  }

  window.FYC_SHOW = show;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
