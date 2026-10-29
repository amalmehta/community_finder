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
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), props[k]);
      else if (props[k] === true) n.setAttribute(k, '');
      else if (props[k] !== false && props[k] != null) n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  /** Namespaced element builder for the graph. (app.js has its own copy; these
   *  two files are separate scopes on purpose, so neither depends on the other.) */
  function svg(tag, props, kids) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(props || {}).forEach(function (k) {
      if (props[k] == null) return;
      if (k === 'text') n.textContent = props[k];
      else n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  function $(s) { return document.querySelector(s); }

  async function api(method, url, body) {
    var res = await fetch(url, {
      method: method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    var data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }
    if (!res.ok) throw new Error((data && data.error) || ('Request failed (' + res.status + ')'));
    return data;
  }

  function label(id) { return (FYC.INTERESTS[id] || {}).label || id; }
  function ago(ts) {
    if (!ts) return '';
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  // ---------- the sign-in gate ----------
  function interestPicker(selected) {
    var chosen = {};
    (selected || []).forEach(function (i) { chosen[i.id] = i.visible !== false; });
    var box = el('div', { class: 'groups' });
    FYC.GROUPS.forEach(function (grp) {
      var pills = el('div', { class: 'pills' });
      grp.interests.forEach(function (i) {
        var btn = el('button', {
          type: 'button', class: 'pill', 'data-pick': i.id,
          'aria-pressed': chosen[i.id] ? 'true' : 'false',
          onclick: function () {
            var on = btn.getAttribute('aria-pressed') === 'true';
            btn.setAttribute('aria-pressed', on ? 'false' : 'true');
          }
        }, [
          (art() && art().pictogram(i.id)) ||
            el('span', { 'aria-hidden': 'true', text: i.icon }),
          el('span', { text: i.label })
        ]);
        pills.appendChild(btn);
      });
      box.appendChild(el('div', { class: 'group' }, [el('h3', { text: grp.label }), pills]));
    });
    return box;
  }

  function pickedInterests(scope) {
    return Array.prototype.slice.call(scope.querySelectorAll('[data-pick][aria-pressed="true"]'))
      .map(function (b) { return { id: b.getAttribute('data-pick'), visible: true }; });
  }

  function renderGate(mode) {
    var gate = $('#auth-gate');
    gate.innerHTML = '';
    gate.hidden = false;
    $('main').hidden = true;
    $('.tabs').hidden = true;

    var signup = mode !== 'login';
    var err = el('p', { class: 'err', hidden: true });

    // Reuse whatever they already picked in the finder, if anything.
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('fyc.profile.v1') || 'null'); } catch (e) { saved = null; }
    var pre = (saved && saved.interests || []).map(function (id) { return { id: id, visible: true }; });

    var form = el('form', { class: 'card', onsubmit: async function (e) {
      e.preventDefault();
      err.hidden = true;
      var payload = {
        username: $('#au-user').value.trim().toLowerCase(),
        password: $('#au-pass').value
      };
      if (signup) {
        payload.display = $('#au-display').value.trim() || payload.username;
        payload.city = $('#au-city').value.trim();
        payload.bio = $('#au-bio').value.trim();
        payload.ageOk = $('#au-age').checked;
        payload.interests = pickedInterests(form);
      }
      try {
        var out = await api('POST', signup ? '/api/signup' : '/api/login', payload);
        S.user = out.user;
        closeGate();
      } catch (e2) {
        err.textContent = e2.message;
        err.hidden = false;
      }
    } }, [
      el('h2', { class: 'gate-head', text: signup ? 'Create your profile' : 'Welcome back' }),
      signup ? el('p', { class: 'hint', text: 'No email at this step, so there is no password reset.' }) : null,

      el('label', { class: 'field' }, [
        el('span', { text: 'Username' }),
        el('input', { type: 'text', id: 'au-user', required: true, autocomplete: 'username',
                      placeholder: 'lowercase, numbers, underscores' })
      ]),
      el('label', { class: 'field' }, [
        el('span', { text: 'Password' }),
        el('input', { type: 'password', id: 'au-pass', required: true, minlength: '8',
                      autocomplete: signup ? 'new-password' : 'current-password',
                      placeholder: signup ? 'at least 8 characters' : '' })
      ]),
      signup ? el('label', { class: 'field' }, [
        el('span', { text: 'Name people will see' }),
        el('input', { type: 'text', id: 'au-display', placeholder: 'optional' })
      ]) : null,
      signup ? el('label', { class: 'field' }, [
        el('span', { text: 'Your city' }),
        el('input', { type: 'text', id: 'au-city', placeholder: 'e.g. Boston' })
      ]) : null,
      signup ? el('label', { class: 'field' }, [
        el('span', { text: 'About you' }),
        el('textarea', { id: 'au-bio', rows: '2', maxlength: '280',
                         placeholder: 'What you are looking for, and what you are like to be around' })
      ]) : null,

      signup ? el('div', { class: 'field' }, [
        el('span', { text: 'What are you into?' }),
        interestPicker(pre)
      ]) : null,

      signup ? el('label', { class: 'check' }, [
        el('input', { type: 'checkbox', id: 'au-age', required: true }),
        el('span', { text: 'I am 18 or over' })
      ]) : null,

      err,
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn', type: 'submit' }, [signup ? 'Create profile' : 'Sign in']),
        el('button', { class: 'btn ghost sm', type: 'button', onclick: function () { renderGate(signup ? 'login' : 'signup'); } },
          [signup ? 'I already have one' : 'I need an account'])
      ])
    ]);

    gate.appendChild(el('div', { class: 'wrap' }, [
      el('h1', { class: 'gate-title', text: 'Find your people.' }),
      form
    ]));
  }

  function closeGate() {
    $('#auth-gate').hidden = true;
    $('main').hidden = false;
    $('.tabs').hidden = false;
    paintAccountTabs();
    refreshCounts();
  }

  // ---------- tabs ----------
  function paintAccountTabs() {
    ['circles', 'messages'].forEach(function (name) {
      var t = document.getElementById('tab-' + name);
      if (t) t.hidden = !S.user;
    });
    if (window.FYC_CIRCLES) window.FYC_CIRCLES.enable(S);
  }

  async function refreshCounts() {
    if (!S.user) return;
    try {
      var r = await api('GET', '/api/requests');
      var n = r.incoming.length;
      var badge = document.getElementById('msg-count');
      badge.textContent = String(n);
      badge.hidden = n === 0;
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
    return el('div', { class: 'card loading' }, [
      el('span', { class: 'spinner', 'aria-hidden': 'true' }),
      el('span', { text: text })
    ]);
  }

  async function renderPeople() {
    var host = $('#people-body');
    function reset() { host.innerHTML = ''; host.appendChild(segBar('people')); }
    reset();
    host.appendChild(loading('Looking…'));

    var data, graph;
    try {
      data = await api('GET', '/api/people');
      graph = await api('GET', '/api/graph');
    }
    catch (e) {
      reset();
      host.appendChild(el('p', { class: 'err', text: e.message }));
      return;
    }
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
        el('summary', { text: 'How you overlap' }),
        graphSvg(graph, function (n) {
          var card = document.getElementById('person-' + n.userId);
          if (card) { card.scrollIntoView({ block: 'center' }); card.classList.add('flash'); setTimeout(function () { card.classList.remove('flash'); }, 1200); }
        })
      ]);
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
      var err = el('p', { class: 'err', hidden: true });

      var card = el('article', { class: 'card person', id: 'person-' + p.id }, [
        el('div', { class: 'person-top' }, [
          faceFor('person-' + p.id),
          el('h3', { text: p.display }),
          el('span', { class: 'badge', text: p.shared + ' shared' })
        ]),
        el('p', { class: 'where', text: [p.city, 'active ' + ago(p.lastSeen)].filter(Boolean).join(' · ') }),
        p.bio ? el('p', { class: 'blurb', text: p.bio }) : null,
        el('div', { class: 'badges' }, p.interests.slice(0, 6).map(function (i) {
          return el('span', { class: 'badge', text: label(i) });
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
            el('button', { class: 'linkish', type: 'button', onclick: async function () {
              if (!confirm('Block ' + p.display + '? They will disappear from your results and cannot contact you.')) return;
              await api('POST', '/api/blocks', { userId: p.id });
              renderPeople();
            } }, ['Block']),
            el('button', { class: 'linkish', type: 'button', onclick: async function () {
              var reason = prompt('What is the problem? (harassment, spam, fake profile, other)');
              if (!reason) return;
              await api('POST', '/api/reports', { userId: p.id, reason: reason });
              alert('Reported, and they are now blocked.');
              renderPeople();
            } }, ['Report'])
          ])
        ])
      ]);
      host.appendChild(card);
    });
  }

  // ---------- Messages ----------
  async function renderMessages() {
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
      reset();
      host.appendChild(el('p', { class: 'err', text: e.message }));
      return;
    }
    reset();
    S.threads = threads;

    if (reqs.incoming.length) {
      host.appendChild(el('div', { class: 'results-head' }, [
        el('h2', { text: 'Introductions' })
      ]));
      reqs.incoming.forEach(function (r) {
        host.appendChild(el('article', { class: 'card' }, [
          el('h3', { text: r.other_name }),
          el('p', { class: 'where', text: [r.other_city, ago(r.created_at)].filter(Boolean).join(' · ') }),
          el('p', { class: 'intro-text', text: r.intro }),
          el('div', { class: 'actions' }, [
            el('button', { class: 'btn sm', type: 'button', onclick: async function () {
              await api('POST', '/api/requests/' + r.id + '/accept');
              renderMessages(); refreshCounts();
            } }, ['Accept']),
            el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
              await api('POST', '/api/requests/' + r.id + '/decline');
              renderMessages(); refreshCounts();
            } }, ['Decline']),
            el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
              await api('POST', '/api/blocks', { userId: r.from_id });
              renderMessages(); refreshCounts();
            } }, ['Block'])
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
        class: 'card thread', role: 'button', tabindex: '0',
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
    if (S.poll) { clearInterval(S.poll); S.poll = null; }
  }

  async function openThread(t) {
    S.openThread = t;
    var host = $('#messages-body');
    host.innerHTML = '';

    var list = el('div', { class: 'msg-list', id: 'msg-list' });
    var input = el('textarea', { class: 'msg-input', placeholder: 'Write a message…', rows: '2' });
    var err = el('p', { class: 'err', hidden: true });
    var lastId = 0;
    var seen = Object.create(null);   // message ids already on screen
    var pulling = false;              // only one request in flight at a time

    // Sending triggers a pull, and so does the 5s timer. Without the guard and
    // the id check, two overlapping pulls share a cursor and render the same
    // message twice.
    async function pull() {
      if (pulling) return;
      pulling = true;
      try {
        var r = await api('GET', '/api/threads/' + t.id + '/messages?since=' + lastId);
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
        if (added) list.scrollTop = list.scrollHeight;
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
      } catch (e) { err.textContent = e.message; err.hidden = false; }
    }

    host.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: t.other_name }),
      el('p', { text: t.other_city || '' })
    ]));
    host.appendChild(el('div', { class: 'actions' }, [
      el('button', { class: 'btn ghost sm', type: 'button', onclick: function () { stopPolling(); renderMessages(); } }, ['← All conversations']),
      el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
        if (!confirm('Block ' + t.other_name + '? This ends the conversation.')) return;
        await api('POST', '/api/blocks', { userId: t.other_id });
        stopPolling(); renderMessages();
      } }, ['Block']),
      el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
        var reason = prompt('What is the problem? (harassment, spam, fake profile, other)');
        if (!reason) return;
        await api('POST', '/api/reports', { userId: t.other_id, reason: reason });
        alert('Reported, and they are now blocked.');
        stopPolling(); renderMessages();
      } }, ['Report'])
    ]));
    host.appendChild(el('article', { class: 'card' }, [
      list,
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
    S.poll = setInterval(pull, 5000);
  }

  // ---------- profile editing (lives on the You tab) ----------
  function profileCard() {
    if (!S.user) return null;
    var u = S.user;
    var city = el('input', { type: 'text', value: u.city || '', placeholder: 'Your city' });
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
    var emailErr = el('p', { class: 'err', hidden: true });
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

    var profile = el('article', { class: 'card' }, [
      el('h3', { text: 'Your profile' }),
      el('p', { class: 'hint', text: 'Signed in as ' + u.display + ' (@' + u.username + ').' }),
      el('label', { class: 'field' }, [el('span', { text: 'City' }), city]),
      el('label', { class: 'field' }, [el('span', { text: 'About you' }), bio]),
      el('label', { class: 'check' }, [disc, el('span', { text: 'Let people with shared interests find me' })]),
      u.interests.length ? el('div', { class: 'field' }, [
        el('span', { text: 'Visible to others' }),
        rows
      ]) : null,
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn sm', type: 'button', onclick: async function () {
          var interests = Array.prototype.slice.call(rows.querySelectorAll('[data-vis]')).map(function (cb) {
            return { id: cb.getAttribute('data-vis'), visible: cb.checked };
          });
          var out = await api('PATCH', '/api/me', {
            city: city.value, bio: bio.value, discoverable: disc.checked,
            openToDirect: directCb.checked,
            interests: interests.length ? interests : undefined
          });
          S.user = out.user;
          saved.hidden = false;
          setTimeout(function () { saved.hidden = true; }, 1600);
        } }, ['Save profile']),
        saved
      ])
    ]);

    var account = el('div', { class: 'actions signout-row' }, [
      el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
        await api('POST', '/api/logout');
        S.user = null;
        stopPolling();
        renderGate('login');
      } }, ['Sign out'])
    ]);

    var wrap = document.createDocumentFragment();
    wrap.appendChild(profile);
    wrap.appendChild(emailCard);
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

    document.body.classList.add('has-accounts');

    // This used to be printed in the footer, which put it under every screen
    // in the app. It is a fact about where your data lives, so it belongs on
    // the one screen that is about you. You reads it from here.
    window.FYC_STORAGE_NOTE = 'Your profile, messages and circles are stored on this server. Anything you say in a circle is visible to that circle.';

    document.getElementById('tab-messages').addEventListener('click', function () { show('messages'); });

    if (!S.user) renderGate('signup');
    else closeGate();

    if (verifyNote) {
      var banner = el('div', { class: 'notice' + (verifyNote.ok ? '' : ' bad') }, [
        el('b', { text: verifyNote.ok ? 'Done. ' : 'That did not work. ' }),
        verifyNote.text
      ]);
      var find = document.querySelector('#view-find .wrap');
      if (find) find.insertBefore(banner, find.firstChild);
    }

    // Let the You tab render the profile editor underneath its charts.
    window.FYC_SOCIAL = { profileCard: profileCard, state: S };
    setInterval(refreshCounts, 30000);
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
    return el('div', { class: 'seg', role: 'tablist' }, [
      ['chats', 'Chats'], ['people', 'People']
    ].map(function (pair) {
      return el('button', {
        class: 'seg-btn', type: 'button', role: 'tab',
        'aria-selected': active === pair[0] ? 'true' : 'false',
        onclick: function () { inboxSeg = pair[0]; show(pair[0] === 'people' ? 'people' : 'messages'); }
      }, [pair[1]]);
    }));
  }

  window.FYC_SHOW = show;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
