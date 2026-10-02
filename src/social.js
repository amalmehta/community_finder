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
        }, [el('span', { 'aria-hidden': 'true', text: i.icon }), el('span', { text: i.label })]);
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
      el('h2', { class: 'gate-title', text: signup ? 'Create your profile' : 'Welcome back' }),
      el('p', { class: 'hint', text: signup
        ? 'A username and a password. No email address, because there is no reason for us to hold one.'
        : 'Sign in to pick up where you left off.' }),

      el('label', { class: 'field' }, [
        el('span', { text: 'Username' }),
        el('input', { type: 'text', id: 'au-user', required: true, autocomplete: 'username',
                      placeholder: 'lowercase letters, numbers, underscores' })
      ]),
      el('label', { class: 'field' }, [
        el('span', { text: 'Password' }),
        el('input', { type: 'password', id: 'au-pass', required: true, minlength: '8',
                      autocomplete: signup ? 'new-password' : 'current-password',
                      placeholder: signup ? 'at least 8 characters' : '' })
      ]),
      signup ? el('label', { class: 'field' }, [
        el('span', { text: 'Name people will see' }),
        el('input', { type: 'text', id: 'au-display', placeholder: 'optional — your username by default' })
      ]) : null,
      signup ? el('label', { class: 'field' }, [
        el('span', { text: 'Your city' }),
        el('input', { type: 'text', id: 'au-city', placeholder: 'e.g. Boston' })
      ]) : null,

      signup ? el('div', { class: 'field' }, [
        el('span', { text: 'What are you into?' }),
        el('p', { class: 'hint', text: 'Used to find people with something in common. You can hide any of these later, so an interest can guide your results without being visible to anyone.' }),
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
      el('div', { class: 'intro' }, [
        el('h1', { text: 'Find your people, one easy first step at a time.' }),
        el('p', { text: 'Real local groups, plus the people near you looking for the same things.' })
      ]),
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
    ['people', 'messages'].forEach(function (name) {
      var t = document.getElementById('tab-' + name);
      if (t) t.hidden = !S.user;
    });
    var out = document.getElementById('tab-signout');
    if (out) out.hidden = !S.user;
  }

  async function refreshCounts() {
    if (!S.user) return;
    try {
      var r = await api('GET', '/api/requests');
      var n = r.incoming.length;
      var badge = document.getElementById('msg-count');
      badge.textContent = String(n);
      badge.hidden = n === 0;
    } catch (e) { /* offline */ }
  }

  // ---------- People ----------
  async function renderPeople() {
    var host = $('#people-body');
    host.innerHTML = '';
    host.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: 'People with something in common' }),
      el('p', { text: 'Matched on interests you have chosen to show. Nobody can message you until you accept.' })
    ]));

    var data;
    try { data = await api('GET', '/api/people'); }
    catch (e) { host.appendChild(el('p', { class: 'err', text: e.message })); return; }
    S.people = data.people;

    if (!S.people.length) {
      host.appendChild(el('div', { class: 'card empty' }, [
        el('h2', { text: 'Nobody yet.' }),
        el('p', { text: 'Either nobody else shares your visible interests, or you have none showing. Add a few on the You tab.' })
      ]));
      return;
    }

    S.people.forEach(function (p) {
      var c = p.connection;
      var statusText = !c ? null
        : c.status === 'pending' ? (c.mine ? 'Introduction sent — waiting for a reply' : 'They have sent you an introduction')
        : c.status === 'accepted' ? 'You are connected'
        : 'Not connected';

      var intro = el('textarea', {
        class: 'intro-box', hidden: true, maxlength: '300',
        placeholder: 'Say hello. Mention the thing you have in common and suggest something specific — it is much more likely to get a reply.'
      });
      var err = el('p', { class: 'err', hidden: true });

      var card = el('article', { class: 'card person' }, [
        el('div', { class: 'person-top' }, [
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
              btn.textContent = 'Send introduction';
              return;
            }
            err.hidden = true;
            try {
              await api('POST', '/api/requests', { toUserId: p.id, intro: intro.value });
              btn.disabled = true;
              btn.textContent = 'Sent ✓';
              intro.hidden = true;
            } catch (e2) { err.textContent = e2.message; err.hidden = false; }
          } }, ['Say hello']) : null,
          el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
            if (!confirm('Block ' + p.display + '? They will disappear from your results and cannot contact you.')) return;
            await api('POST', '/api/blocks', { userId: p.id });
            renderPeople();
          } }, ['Block']),
          el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
            var reason = prompt('What is the problem? (harassment, spam, fake profile, other)');
            if (!reason) return;
            await api('POST', '/api/reports', { userId: p.id, reason: reason });
            alert('Reported, and they are now blocked.');
            renderPeople();
          } }, ['Report'])
        ])
      ]);
      host.appendChild(card);
    });
  }

  // ---------- Messages ----------
  async function renderMessages() {
    var host = $('#messages-body');
    host.innerHTML = '';
    stopPolling();

    var reqs, threads;
    try {
      reqs = await api('GET', '/api/requests');
      threads = (await api('GET', '/api/threads')).threads;
    } catch (e) {
      host.appendChild(el('p', { class: 'err', text: e.message }));
      return;
    }
    S.threads = threads;

    if (reqs.incoming.length) {
      host.appendChild(el('div', { class: 'results-head' }, [
        el('h2', { text: 'Introductions for you' }),
        el('p', { text: 'Nothing else arrives from them unless you accept.' })
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

    host.appendChild(el('div', { class: 'results-head' }, [el('h2', { text: 'Conversations' })]));
    if (!threads.length) {
      host.appendChild(el('div', { class: 'card empty' }, [
        el('h2', { text: 'No conversations yet.' }),
        el('p', { text: 'Find someone on the People tab and send one introduction. One is plenty.' })
      ]));
      return;
    }

    threads.forEach(function (t) {
      host.appendChild(el('article', {
        class: 'card thread', role: 'button', tabindex: '0',
        onclick: function () { openThread(t); },
        onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThread(t); } }
      }, [
        el('h3', { text: t.other_name }),
        el('p', { class: 'where', text: [t.other_city, t.last_at ? ago(t.last_at) : 'no messages yet'].filter(Boolean).join(' · ') }),
        t.last_body ? el('p', { class: 'blurb', text: t.last_body }) : null
      ]));
    });
  }

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

    async function pull() {
      try {
        var r = await api('GET', '/api/threads/' + t.id + '/messages?since=' + lastId);
        r.messages.forEach(function (m) {
          lastId = Math.max(lastId, m.id);
          list.appendChild(el('div', { class: 'msg ' + (m.sender_id === S.user.id ? 'mine' : 'theirs') }, [
            el('p', { text: m.body }),
            el('span', { class: 'msg-time', text: ago(m.created_at) })
          ]));
        });
        if (r.messages.length) list.scrollTop = list.scrollHeight;
      } catch (e) { /* transient */ }
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

    return el('article', { class: 'card' }, [
      el('h3', { text: 'Your profile' }),
      el('p', { class: 'hint', text: 'Signed in as ' + u.display + ' (@' + u.username + ').' }),
      el('label', { class: 'field' }, [el('span', { text: 'City' }), city]),
      el('label', { class: 'field' }, [el('span', { text: 'About you' }), bio]),
      el('label', { class: 'check' }, [disc, el('span', { text: 'Let people with shared interests find me' })]),
      u.interests.length ? el('div', { class: 'field' }, [
        el('span', { text: 'Which interests are visible to others' }),
        el('p', { class: 'hint', text: 'Unticked interests still shape your results, but nobody can see them or find you through them.' }),
        rows
      ]) : null,
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn sm', type: 'button', onclick: async function () {
          var interests = Array.prototype.slice.call(rows.querySelectorAll('[data-vis]')).map(function (cb) {
            return { id: cb.getAttribute('data-vis'), visible: cb.checked };
          });
          var out = await api('PATCH', '/api/me', {
            city: city.value, bio: bio.value, discoverable: disc.checked,
            interests: interests.length ? interests : undefined
          });
          S.user = out.user;
          saved.hidden = false;
          setTimeout(function () { saved.hidden = true; }, 1600);
        } }, ['Save profile']),
        saved
      ])
    ]);
  }

  // ---------- boot ----------
  async function init() {
    var gate = $('#auth-gate');
    if (!gate) return;

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

    // The static build's footer promises there is no server. With accounts on,
    // that is no longer true, so say what is actually happening instead.
    var foot = document.querySelector('.site-footer .wrap p');
    if (foot) {
      foot.textContent = 'Your searches, plan and what you click stay on this device. Your profile and messages are stored on this server so that other people can reach you — only your city, your shown interests and anything you write are visible to them.';
    }

    document.getElementById('tab-people').addEventListener('click', function () { show('people'); });
    document.getElementById('tab-messages').addEventListener('click', function () { show('messages'); });
    document.getElementById('tab-signout').addEventListener('click', async function () {
      await api('POST', '/api/logout');
      S.user = null;
      stopPolling();
      renderGate('login');
    });

    if (!S.user) renderGate('signup');
    else closeGate();

    // Let the You tab render the profile editor underneath its charts.
    window.FYC_SOCIAL = { profileCard: profileCard, state: S };
    setInterval(refreshCounts, 30000);
  }

  function show(which) {
    ['find', 'plan', 'you', 'people', 'messages'].forEach(function (name) {
      var view = document.getElementById('view-' + name);
      var tab = document.getElementById('tab-' + name);
      if (!view || !tab) return;
      var on = which === name;
      view.hidden = !on;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    stopPolling();
    if (which === 'people') renderPeople();
    if (which === 'messages') renderMessages();
    window.scrollTo({ top: 0 });
  }

  window.FYC_SHOW = show;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
