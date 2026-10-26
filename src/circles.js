/* community_finder — circles.
 *
 * The chat-first half of the product. A circle is a small, vetted, local group
 * that talks in a group thread for as long as it takes, and only once it has
 * actually been a conversation can anyone propose doing something in person.
 *
 * Like social.js, this whole file is inert without a backend: served
 * statically the Circles tab never appears and no network call is made.
 */
(function () {
  'use strict';
  var FYC = window.FYC;

  var S = {
    user: null,
    poll: null,
    openId: null,
    trust: null,
    rule: null,
    capRange: { min: 4, max: 12, default: 8 },
    safety: []
  };

  // ---------- helpers (deliberately a local copy; see social.js) ----------
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
  function icon(id) { return (FYC.INTERESTS[id] || {}).icon || ''; }

  function ago(ts) {
    if (!ts) return 'never';
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  function whenText(ms) {
    if (!ms) return 'time to be decided';
    var d = new Date(ms);
    return d.toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  }

  function loading(text) {
    return el('div', { class: 'card loading' }, [
      el('span', { class: 'spinner', 'aria-hidden': 'true' }),
      el('span', { text: text })
    ]);
  }

  function errLine() { return el('p', { class: 'err', hidden: true }); }
  function showErr(node, e) { node.textContent = e.message || String(e); node.hidden = false; }

  // ---------- the unread badge ----------
  async function refreshBadge() {
    var badge = document.getElementById('circles-count');
    if (!badge) return;
    try {
      var r = await api('GET', '/api/unread');
      var n = r.circles + r.pending;
      badge.textContent = String(n);
      badge.hidden = n === 0;
    } catch (e) { /* offline */ }
  }

  // ---------- trust ----------
  // The vetting ladder, stated plainly. People will only climb it if they can
  // see the rungs.
  function trustCard(t) {
    var steps = [
      { tier: 1, label: 'Verified', note: 'a confirmed email address' },
      { tier: 2, label: 'Introduced', note: 'city, three interests and a couple of sentences about you' },
      { tier: 3, label: 'Vouched for', note: 'two people who have talked with you in a circle' }
    ];
    return el('article', { class: 'card trust' }, [
      el('div', { class: 'person-top' }, [
        el('h3', { text: 'Your standing: ' + t.label }),
        el('span', { class: 'badge', text: 'tier ' + t.tier + ' of 3' })
      ]),
      el('p', { class: 'hint', text: 'Circles set the tier they will accept. This is what each one takes.' }),
      el('ol', { class: 'ladder' }, steps.map(function (s) {
        return el('li', { class: t.tier >= s.tier ? 'done' : '' }, [
          el('b', { text: s.label }),
          el('span', { text: ' — ' + s.note })
        ]);
      })),
      t.missing.length ? el('div', { class: 'notice' }, [
        el('b', { text: 'Next: ' }), t.missing[0]
      ]) : null
    ]);
  }

  // ---------- readiness ----------
  /** The gate, as a thing you can look at and see how far along you are. */
  function readinessBlock(r, opts) {
    var o = opts || {};
    return el('div', { class: 'ready' + (r.ready ? ' is-ready' : '') }, [
      el('div', { class: 'ready-head' }, [
        el('b', { text: r.ready ? 'Ready to plan something' : 'Talking first' }),
        el('span', { class: 'badge', text: r.done + ' of ' + r.of })
      ]),
      o.quiet ? null : el('ul', { class: 'ready-list' }, r.checks.map(function (c) {
        var done = c.have >= c.need;
        return el('li', { class: done ? 'done' : '' }, [
          el('span', { class: 'tick', 'aria-hidden': 'true', text: done ? '✓' : '·' }),
          el('span', { text: Math.min(c.have, c.need) + ' of ' + c.need + ' ' + c.label })
        ]);
      })),
      o.quiet ? null : el('p', { class: 'hint', text: r.ready
        ? 'Anyone here can propose something now. It happens once enough of you say yes.'
        : 'Nobody can propose a meetup until all four are met. That is on purpose: you get to know people here first.' })
    ]);
  }

  function liveLine(c) {
    var bits = [c.members + ' of ' + c.cap + ' people'];
    if (c.live.week > 0) bits.push(c.live.week + ' messages this week from ' + c.live.speakers);
    else if (c.live.messages > 0) bits.push('quiet this week · last spoke ' + ago(c.live.lastAt));
    else bits.push('no conversation yet');
    return bits.join(' · ');
  }

  // ---------- circle cards ----------
  function interestBadges(ids, mineIds) {
    return el('div', { class: 'badges' }, ids.map(function (i) {
      var on = (mineIds || []).indexOf(i) !== -1;
      return el('span', { class: 'badge' + (on ? ' hit' : ''), text: icon(i) + ' ' + label(i) });
    }));
  }

  function myCircleCard(c, unread) {
    return el('article', {
      class: 'card circle mine', role: 'button', tabindex: '0',
      onclick: function () { openCircle(c.id); },
      onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCircle(c.id); } }
    }, [
      el('div', { class: 'person-top' }, [
        el('h3', { text: c.name }),
        el('div', { class: 'badges tight' }, [
          c.myRole === 'host' && c.pending
            ? el('span', { class: 'badge unread', text: c.pending + ' to vet' }) : null,
          unread ? el('span', { class: 'badge unread', text: unread + ' new' }) : null
        ])
      ]),
      el('p', { class: 'where', text: c.city + ' · ' + liveLine(c) + (c.myRole === 'host' ? ' · you host' : '') }),
      interestBadges(c.interests, c.overlapIds),
      readinessBlock(c.readiness, { quiet: true }),
      c.stale ? el('p', { class: 'hint nudge', text: 'Nobody has said anything for a while. Open it and post a prompt.' }) : null
    ]);
  }

  function applyBox(c, onDone) {
    var answer = el('textarea', { rows: '3', maxlength: '1000', placeholder: 'Your answer' });
    var err = errLine();
    var count = el('p', { class: 'hint', text: '0 characters — 40 or more' });
    answer.addEventListener('input', function () {
      var n = answer.value.trim().length;
      count.textContent = n + ' character' + (n === 1 ? '' : 's') + (n >= 40 ? ' — that will do' : ' — 40 or more');
    });
    return el('div', { class: 'applybox' }, [
      el('p', { class: 'question', text: c.question }),
      el('p', { class: 'hint', text: c.apply.waitlist
        ? 'The circle is full, so this joins the waiting list. The host still reads it.'
        : 'The host reads this, and so do the members. Two of them can wave you in without the host.' }),
      answer, count, err,
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn sm', type: 'button', onclick: async function (ev) {
          err.hidden = true;
          var btn = ev.currentTarget;
          btn.disabled = true;
          try {
            await api('POST', '/api/circles/' + c.id + '/apply', { answer: answer.value });
            onDone();
          } catch (e) { showErr(err, e); btn.disabled = false; }
        } }, ['Send it'])
      ])
    ]);
  }

  function discoverCard(c, onChange) {
    var body = [];
    body.push(el('div', { class: 'person-top' }, [
      el('h3', { text: c.name }),
      el('span', { class: 'badge', text: c.overlap ? c.overlap + ' shared' : c.city })
    ]));
    body.push(el('p', { class: 'where', text: c.city + ' · ' + liveLine(c) + ' · host ' + (c.hostName || '—') }));
    body.push(el('p', { class: 'blurb', text: c.blurb }));
    body.push(interestBadges(c.interests, c.overlapIds));
    body.push(readinessBlock(c.readiness, { quiet: true }));

    if (c.myApplication) {
      var st = c.myApplication.status;
      body.push(el('p', { class: 'hint', text:
        st === 'pending' ? 'You applied ' + ago(c.myApplication.at) + '. The circle is reading it.'
        : st === 'waitlisted' ? 'On the waiting list.'
        : st === 'declined' ? 'They said no this time.'
        : 'Approved.' }));
      if (st === 'pending' || st === 'waitlisted') {
        body.push(el('div', { class: 'actions' }, [
          el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
            await api('DELETE', '/api/circles/' + c.id + '/apply');
            onChange();
          } }, ['Withdraw'])
        ]));
      }
    } else if (c.apply.ok) {
      var slot = el('div');
      body.push(el('div', { class: 'actions' }, [
        el('button', { class: 'btn sm', type: 'button', onclick: function (ev) {
          ev.currentTarget.hidden = true;
          slot.appendChild(applyBox(c, onChange));
        } }, [c.apply.waitlist ? 'Ask to join the waiting list' : 'Answer the question to join'])
      ]));
      if (c.apply.why) body.push(el('p', { class: 'hint', text: c.apply.why }));
      body.push(slot);
    } else if (c.apply.why) {
      body.push(el('p', { class: 'hint locked', text: c.apply.why }));
    }

    return el('article', { class: 'card circle' }, body);
  }

  // ---------- starting one ----------
  function createForm(prefill, onDone) {
    var pre = prefill || {};
    var picked = {};
    (pre.interests || []).forEach(function (i) { picked[i] = true; });

    var name = el('input', { type: 'text', maxlength: '60', value: pre.name || '', placeholder: 'e.g. Thursday night board games, Somerville' });
    var city = el('input', { type: 'text', maxlength: '60', value: pre.city || '', placeholder: 'Your city' });
    var blurb = el('textarea', { rows: '3', maxlength: '400', placeholder: 'Who is this for, and what would you eventually like to do together?' });
    var question = el('input', { type: 'text', maxlength: '200', value: pre.question || '', placeholder: 'What will you ask people before letting them in?' });
    var cap = el('input', { type: 'number', min: String(S.capRange.min), max: String(S.capRange.max), value: String(S.capRange.default) });
    var minTrust = el('select', {}, [
      el('option', { value: '1', text: 'Verified — a confirmed email' }),
      el('option', { value: '2', text: 'Introduced — a filled-in profile' }),
      el('option', { value: '3', text: 'Vouched for — two people already stand for them' })
    ]);
    if (pre.blurb) blurb.value = pre.blurb;

    var pills = el('div', { class: 'groups' }, FYC.GROUPS.map(function (grp) {
      return el('div', { class: 'group' }, [
        el('h3', { text: grp.label }),
        el('div', { class: 'pills' }, grp.interests.map(function (i) {
          var btn = el('button', {
            type: 'button', class: 'pill', 'data-pick': i.id,
            'aria-pressed': picked[i.id] ? 'true' : 'false',
            onclick: function () {
              btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
            }
          }, [el('span', { 'aria-hidden': 'true', text: i.icon }), el('span', { text: i.label })]);
          return btn;
        }))
      ]);
    }));

    var err = errLine();
    var form = el('article', { class: 'card' }, [
      el('h3', { text: 'Start a circle' }),
      el('p', { class: 'hint', text: 'You host it: you read the answers, you decide who comes in, and you keep the conversation alive. Keep it small — ' + S.capRange.min + ' to ' + S.capRange.max + ' people.' }),
      el('label', { class: 'field' }, [el('span', { text: 'Name' }), name]),
      el('label', { class: 'field' }, [el('span', { text: 'City' }), city]),
      el('label', { class: 'field' }, [el('span', { text: 'What it is' }), blurb]),
      el('label', { class: 'field' }, [
        el('span', { text: 'The joining question' }),
        question,
        el('p', { class: 'hint', text: 'This is the vetting. Ask something a bot or a drive-by cannot answer: "what brought you here", "what do you actually want out of this".' })
      ]),
      el('div', { class: 'field' }, [el('span', { text: 'Interests (up to four)' }), pills]),
      el('div', { class: 'row2' }, [
        el('label', { class: 'field' }, [el('span', { text: 'Cap' }), cap]),
        el('label', { class: 'field' }, [el('span', { text: 'Who may apply' }), minTrust])
      ]),
      err,
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn sm', type: 'button', onclick: async function (ev) {
          err.hidden = true;
          var btn = ev.currentTarget;
          var ids = Array.prototype.slice.call(pills.querySelectorAll('[aria-pressed="true"]'))
            .map(function (b) { return b.getAttribute('data-pick'); }).slice(0, 4);
          btn.disabled = true;
          try {
            var out = await api('POST', '/api/circles', {
              name: name.value, city: city.value, blurb: blurb.value, question: question.value,
              interests: ids, cap: Number(cap.value), minTrust: Number(minTrust.value)
            });
            onDone(out.circle.id);
          } catch (e) { showErr(err, e); btn.disabled = false; }
        } }, ['Create it'])
      ])
    ]);
    return form;
  }

  // ---------- the list ----------
  async function renderList() {
    stop();
    S.openId = null;
    var host = $('#circles-body');
    host.innerHTML = '';
    host.appendChild(loading('Looking for circles near you…'));

    var data, unread;
    try {
      data = await api('GET', '/api/circles');
      unread = await api('GET', '/api/unread');
    } catch (e) {
      host.innerHTML = '';
      host.appendChild(el('p', { class: 'err', text: e.message }));
      return;
    }
    host.innerHTML = '';
    S.trust = data.trust;
    S.rule = data.rule;
    S.capRange = data.capRange;

    var unreadBy = {};
    (unread.byCircle || []).forEach(function (r) { unreadBy[r.circle_id] = r.unread; });

    host.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: 'Circles' }),
      el('p', { text: 'Small local groups that talk first and decide to meet later. Joining means answering a question, not pressing a button.' })
    ]));

    if (data.mine.length) {
      host.appendChild(el('div', { class: 'results-head sub' }, [el('h2', { text: 'Yours' })]));
      data.mine.forEach(function (c) { host.appendChild(myCircleCard(c, unreadBy[c.id] || 0)); });
    }

    host.appendChild(el('div', { class: 'results-head sub' }, [
      el('h2', { text: data.mine.length ? 'Others near you' : 'Open to you' }),
      el('p', { text: 'Ranked by what you have in common, whether it is in your city, and whether anyone is actually talking.' })
    ]));

    if (!data.circles.length) {
      host.appendChild(el('div', { class: 'card empty' }, [
        el('h2', { text: 'Nothing here yet.' }),
        el('p', { text: 'No circle in your city matches what you are into. The honest fix is to start one — they begin at three people.' })
      ]));
    } else {
      data.circles.slice(0, 12).forEach(function (c) {
        host.appendChild(discoverCard(c, renderList));
      });
    }

    host.appendChild(trustCard(data.trust));

    if (data.trust.tier >= 2) {
      var slot = el('div');
      host.appendChild(el('div', { class: 'actions' }, [
        el('button', { class: 'btn sm', type: 'button', onclick: function (ev) {
          ev.currentTarget.hidden = true;
          var seedCity = data.me.city || '';
          slot.appendChild(createForm({ city: seedCity, question: FYC.PROMPTS[0] }, function (id) { openCircle(id); }));
          slot.scrollIntoView({ block: 'center' });
        } }, ['Start a circle'])
      ]));
      host.appendChild(slot);
    } else {
      host.appendChild(el('p', { class: 'hint', text: 'Hosting a circle needs the "Introduced" tier — a verified email and a filled-in profile. The You tab has both.' }));
    }

    refreshBadge();
  }

  // ---------- one circle ----------
  function stop() {
    if (S.poll) { clearInterval(S.poll); S.poll = null; }
  }

  async function openCircle(id) {
    stop();
    S.openId = id;
    var host = $('#circles-body');
    host.innerHTML = '';
    host.appendChild(loading('Opening…'));

    var d;
    try { d = await api('GET', '/api/circles/' + id); }
    catch (e) {
      host.innerHTML = '';
      host.appendChild(el('p', { class: 'err', text: e.message }));
      return;
    }
    host.innerHTML = '';
    S.safety = d.safety || [];
    var c = d.circle;

    host.appendChild(el('div', { class: 'actions' }, [
      el('button', { class: 'btn ghost sm', type: 'button', onclick: function () { renderList(); } }, ['← All circles'])
    ]));

    host.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: c.name }),
      el('p', { text: c.city + ' · ' + liveLine(c) + ' · host ' + (c.hostName || '—') + (c.status === 'closed' ? ' · closed' : '') })
    ]));
    host.appendChild(el('article', { class: 'card' }, [
      el('p', { class: 'blurb', text: c.blurb }),
      interestBadges(c.interests, c.overlapIds),
      readinessBlock(c.readiness, {})
    ]));

    if (!c.myRole) {
      // The shopfront. No conversation, no member list.
      var slot = el('div');
      host.appendChild(el('article', { class: 'card' }, [
        el('h3', { text: 'To join' }),
        el('p', { class: 'hint', text: 'You answer the circle’s question. The host reads it; two members can also wave you in.' }),
        c.apply.ok ? applyBox(c, function () { openCircle(id); })
          : el('p', { class: 'hint locked', text: c.apply.why || 'Not open to you right now.' }),
        slot
      ]));
      return;
    }

    chatCard(host, c);
    meetupCard(host, c, d.meetups);
    if (d.applications && d.applications.length) applicationsCard(host, c, d.applications);
    membersCard(host, c, d.members);
    hostTools(host, c);
  }

  // ---------- chat ----------
  function chatCard(host, c) {
    var list = el('div', { class: 'msg-list circle-chat' });
    var input = el('textarea', { class: 'msg-input', rows: '2', placeholder: 'Say something to the circle…' });
    var err = errLine();
    var lastId = 0;
    var seen = Object.create(null);
    var pulling = false;
    var readyBox = el('div');

    function paintReady(r) {
      readyBox.innerHTML = '';
      readyBox.appendChild(readinessBlock(r, { quiet: true }));
    }

    async function pull() {
      if (pulling) return;
      pulling = true;
      try {
        var r = await api('GET', '/api/circles/' + c.id + '/messages?since=' + lastId);
        var added = 0;
        r.messages.forEach(function (m) {
          if (seen[m.id]) return;
          seen[m.id] = true;
          lastId = Math.max(lastId, m.id);
          added++;
          if (m.kind === 'system') {
            list.appendChild(el('div', { class: 'msg system' }, [el('p', { text: m.body })]));
          } else if (m.kind === 'prompt') {
            list.appendChild(el('div', { class: 'msg prompt' }, [
              el('span', { class: 'prompt-tag', text: 'Question for the circle' }),
              el('p', { text: m.body })
            ]));
          } else {
            var mine = m.sender_id === (S.user && S.user.id);
            list.appendChild(el('div', { class: 'msg ' + (mine ? 'mine' : 'theirs') }, [
              mine ? null : el('span', { class: 'msg-who', text: m.sender_name }),
              el('p', { text: m.body }),
              el('span', { class: 'msg-time', text: ago(m.created_at) })
            ]));
          }
        });
        if (added) {
          list.scrollTop = list.scrollHeight;
          api('POST', '/api/circles/' + c.id + '/read', { lastId: lastId }).catch(function () {});
        }
      } catch (e) { /* transient */ } finally { pulling = false; }
    }

    async function send() {
      var text = input.value.trim();
      if (!text) return;
      err.hidden = true;
      try {
        var out = await api('POST', '/api/circles/' + c.id + '/messages', { body: text });
        input.value = '';
        if (out.readiness) paintReady(out.readiness);
        await pull();
      } catch (e) { showErr(err, e); }
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
    });

    paintReady(c.readiness);

    host.appendChild(el('article', { class: 'card' }, [
      el('h3', { text: 'The conversation' }),
      c.stale ? el('p', { class: 'hint nudge', text: 'It has gone quiet. A question restarts it faster than a hello.' }) : null,
      list,
      err,
      el('div', { class: 'composer' }, [
        input,
        el('button', { class: 'btn sm', type: 'button', onclick: send }, ['Send'])
      ]),
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn ghost sm', type: 'button', onclick: async function (ev) {
          var btn = ev.currentTarget;
          btn.disabled = true;
          try { await api('POST', '/api/circles/' + c.id + '/prompt'); await pull(); }
          catch (e) { showErr(err, e); }
          btn.disabled = false;
        } }, ['Post a question for everyone'])
      ]),
      readyBox
    ]));

    pull();
    S.poll = setInterval(pull, 5000);
  }

  // ---------- meetups ----------
  /** Real local things in this circle's city that match what it is about.
   *  A proposal anchored to one of these is a plan, not a vague "let's hang". */
  function orgSuggestions(c) {
    var city = FYC.findCity(c.city);
    if (!city) return [];
    return city.orgs.filter(function (o) {
      return o.interests.some(function (i) { return c.interests.indexOf(i) !== -1; });
    }).slice(0, 8);
  }

  function safetyList() {
    return el('details', { class: 'safety' }, [
      el('summary', { text: 'Before a first meetup' }),
      el('ul', {}, (S.safety.length ? S.safety : FYC.MEETUP_SAFETY).map(function (t) {
        return el('li', { text: t });
      }))
    ]);
  }

  function meetupCard(host, c, meetups) {
    var body = [el('h3', { text: 'Doing something' })];

    if (!c.readiness.ready) {
      body.push(el('p', { class: 'hint locked', text: 'Locked until the circle has talked. ' + c.readiness.done + ' of ' + c.readiness.of + ' there.' }));
    }

    (meetups || []).forEach(function (k) {
      var err = errLine();
      var bar = el('div', { class: 'quorum' }, [
        el('div', { class: 'quorum-fill', style: 'width:' + Math.min(100, Math.round(k.yes / k.quorum * 100)) + '%' })
      ]);
      function rsvpBtn(ans, text) {
        return el('button', {
          class: 'btn sm' + (k.myRsvp === ans ? '' : ' ghost'), type: 'button',
          onclick: async function () {
            err.hidden = true;
            try { await api('POST', '/api/meetups/' + k.id + '/rsvp', { answer: ans }); openCircle(c.id); }
            catch (e) { showErr(err, e); }
          }
        }, [text]);
      }
      body.push(el('div', { class: 'meetup' + (k.status === 'on' ? ' on' : '') }, [
        el('div', { class: 'person-top' }, [
          el('h4', { text: k.title }),
          el('span', { class: 'badge' + (k.status === 'on' ? ' hit' : ''), text: k.status === 'on' ? 'It is on' : k.yes + ' of ' + k.quorum })
        ]),
        el('p', { class: 'where', text: k.place + ' · ' + whenText(k.startsAt) + ' · proposed by ' + k.proposer }),
        k.details ? el('p', { class: 'blurb', text: k.details }) : null,
        k.org ? el('p', { class: 'hint' }, [
          'Anchored to ',
          el('a', { href: k.org.url, target: '_blank', rel: 'noopener noreferrer', text: k.org.name })
        ]) : null,
        bar,
        el('p', { class: 'hint', text: k.going.length ? 'Going: ' + k.going.join(', ') : 'Nobody has said yes yet.' }),
        err,
        el('div', { class: 'actions' }, [
          rsvpBtn('yes', 'Yes'), rsvpBtn('maybe', 'Maybe'), rsvpBtn('no', 'No'),
          (k.proposerId === (S.user && S.user.id) || c.myRole === 'host')
            ? el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
                if (!confirm('Call off "' + k.title + '"?')) return;
                await api('POST', '/api/meetups/' + k.id + '/cancel');
                openCircle(c.id);
              } }, ['Call it off']) : null
        ]),
        safetyList()
      ]));
    });

    if (c.readiness.ready && c.status === 'open') {
      var slot = el('div');
      body.push(el('div', { class: 'actions' }, [
        el('button', { class: 'btn sm', type: 'button', onclick: function (ev) {
          ev.currentTarget.hidden = true;
          slot.appendChild(proposeForm(c));
        } }, ['Propose something'])
      ]));
      body.push(slot);
    } else if (!meetups || !meetups.length) {
      body.push(el('p', { class: 'hint', text: 'When the circle is ready, anyone here can propose a thing to do. It only happens once enough of you say yes — never because one person pushed.' }));
    }

    host.appendChild(el('article', { class: 'card' }, body));
  }

  function proposeForm(c) {
    var orgs = orgSuggestions(c);
    var title = el('input', { type: 'text', maxlength: '120', placeholder: 'e.g. Sunday morning walk, then coffee' });
    var place = el('input', { type: 'text', maxlength: '160', placeholder: 'A public place — café, park entrance, the venue' });
    var when = el('input', { type: 'datetime-local' });
    var details = el('textarea', { rows: '2', maxlength: '600', placeholder: 'Anything else worth knowing (optional)' });
    var pick = el('select', {}, [el('option', { value: '', text: 'Nothing in particular' })].concat(
      orgs.map(function (o) { return el('option', { value: o.id, text: o.name + ' — ' + (o.neighborhood || c.city) }); })
    ));
    var err = errLine();

    pick.addEventListener('change', function () {
      var o = orgs.filter(function (x) { return x.id === pick.value; })[0];
      if (!o) return;
      if (!title.value) title.value = o.name;
      if (!place.value) place.value = o.neighborhood || o.cityName || c.city;
      if (!details.value && o.firstStep) details.value = o.firstStep.label + (o.firstStep.when ? ' (' + o.firstStep.when + ')' : '');
    });

    return el('div', { class: 'proposal' }, [
      el('p', { class: 'hint', text: 'A proposal, not a plan. It becomes real when enough people say yes.' }),
      orgs.length ? el('label', { class: 'field' }, [
        el('span', { text: 'Anchor it to a real local thing' }),
        pick,
        el('p', { class: 'hint', text: 'From the finder’s hand-checked listings for ' + c.city + '. Picking one fills in the rest.' })
      ]) : null,
      el('label', { class: 'field' }, [el('span', { text: 'What you would do' }), title]),
      el('label', { class: 'field' }, [el('span', { text: 'Where' }), place]),
      el('label', { class: 'field' }, [el('span', { text: 'When' }), when]),
      el('label', { class: 'field' }, [el('span', { text: 'Details' }), details]),
      err,
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn sm', type: 'button', onclick: async function (ev) {
          err.hidden = true;
          var btn = ev.currentTarget;
          btn.disabled = true;
          var o = orgs.filter(function (x) { return x.id === pick.value; })[0];
          try {
            await api('POST', '/api/circles/' + c.id + '/meetups', {
              title: title.value, place: place.value, details: details.value,
              startsAt: when.value ? new Date(when.value).getTime() : null,
              orgId: o ? o.id : '', orgName: o ? o.name : '', orgUrl: o ? (o.firstStep && o.firstStep.url) || o.url : ''
            });
            openCircle(c.id);
          } catch (e) { showErr(err, e); btn.disabled = false; }
        } }, ['Put it to the circle'])
      ])
    ]);
  }

  // ---------- vetting ----------
  function applicationsCard(host, c, apps) {
    var isHost = c.myRole === 'host';
    host.appendChild(el('article', { class: 'card' }, [
      el('h3', { text: 'People asking to join' }),
      el('p', { class: 'hint', text: isHost
        ? 'You decide. Two members seconding someone also lets them in, so you are not the only gate.'
        : 'You can second someone. Two seconds let them in without the host.' })
    ].concat(apps.map(function (a) {
      var err = errLine();
      function act(path, text, ghost) {
        return el('button', { class: 'btn sm' + (ghost ? ' ghost' : ''), type: 'button', onclick: async function (ev) {
          err.hidden = true;
          ev.currentTarget.disabled = true;
          try { await api('POST', '/api/circles/' + c.id + '/applications/' + a.id + '/' + path); openCircle(c.id); }
          catch (e) { showErr(err, e); ev.currentTarget.disabled = false; }
        } }, [text]);
      }
      return el('div', { class: 'applicant' }, [
        el('div', { class: 'person-top' }, [
          el('h4', { text: a.display }),
          el('span', { class: 'badge', text: (a.status === 'waitlisted' ? 'waiting list · ' : '') + a.seconds + ' seconded' })
        ]),
        el('p', { class: 'where', text: [a.city, a.verified ? 'email verified' : 'not verified',
          a.vouches ? (a.vouches === 1 ? '1 person vouches for them' : a.vouches + ' people vouch for them') : 'nobody vouches yet',
          'applied ' + ago(a.at)].join(' · ') }),
        a.bio ? el('p', { class: 'blurb', text: a.bio }) : null,
        a.interests.length ? interestBadges(a.interests.slice(0, 6), c.interests) : null,
        el('p', { class: 'question', text: c.question }),
        el('p', { class: 'intro-text', text: a.answer }),
        err,
        el('div', { class: 'actions' }, isHost
          ? [act('approve', 'Let them in'), act('decline', 'No', true)]
          : [a.iSeconded ? el('p', { class: 'hint', text: 'You seconded this.' }) : act('second', 'Second them')])
      ]);
    }))));
  }

  function membersCard(host, c, members) {
    host.appendChild(el('article', { class: 'card' }, [
      el('h3', { text: 'Who is here' }),
      el('p', { class: 'hint', text: 'Vouch for someone once you have actually talked. Two vouches move them up a trust tier, which is what gets them into other circles.' })
    ].concat(members.map(function (p) {
      var err = errLine();
      return el('div', { class: 'member' }, [
        el('div', { class: 'person-top' }, [
          el('h4', { text: p.display + (p.role === 'host' ? ' · host' : '') }),
          el('span', { class: 'badge', text: p.said + ' messages' })
        ]),
        p.bio ? el('p', { class: 'blurb', text: p.bio }) : null,
        el('p', { class: 'where', text: [p.city, p.verified ? 'verified' : 'unverified',
          p.vouches === 1 ? '1 vouch' : p.vouches + ' vouches', 'joined ' + ago(p.joinedAt)].join(' · ') }),
        err,
        el('div', { class: 'actions' }, [
          p.iVouched ? el('span', { class: 'badge hit', text: 'You vouch for them' })
            : p.canVouch ? el('button', { class: 'btn ghost sm', type: 'button', onclick: async function (ev) {
                err.hidden = true;
                ev.currentTarget.disabled = true;
                try { await api('POST', '/api/circles/' + c.id + '/vouch', { userId: p.id }); openCircle(c.id); }
                catch (e) { showErr(err, e); ev.currentTarget.disabled = false; }
              } }, ['Vouch for them'])
            : null,
          (c.myRole === 'host' && p.role !== 'host') ? el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
            if (!confirm('Remove ' + p.display + ' from this circle?')) return;
            await api('DELETE', '/api/circles/' + c.id + '/members/' + p.id);
            openCircle(c.id);
          } }, ['Remove']) : null
        ])
      ]);
    }))));
  }

  function hostTools(host, c) {
    var err = errLine();
    var rows = [];
    if (c.myRole === 'host') {
      var blurb = el('textarea', { rows: '2', maxlength: '400' });
      blurb.value = c.blurb;
      var question = el('input', { type: 'text', maxlength: '200', value: c.question });
      var cap = el('input', { type: 'number', min: String(c.members), max: String(S.capRange.max), value: String(c.cap) });
      rows.push(el('label', { class: 'field' }, [el('span', { text: 'What it is' }), blurb]));
      rows.push(el('label', { class: 'field' }, [el('span', { text: 'Joining question' }), question]));
      rows.push(el('label', { class: 'field' }, [el('span', { text: 'Cap' }), cap]));
      rows.push(el('div', { class: 'actions' }, [
        el('button', { class: 'btn sm', type: 'button', onclick: async function () {
          err.hidden = true;
          try {
            await api('PATCH', '/api/circles/' + c.id, { blurb: blurb.value, question: question.value, cap: Number(cap.value) });
            openCircle(c.id);
          } catch (e) { showErr(err, e); }
        } }, ['Save']),
        c.status === 'open' ? el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
          if (!confirm('Close this circle to new people? The conversation stays.')) return;
          await api('POST', '/api/circles/' + c.id + '/close');
          openCircle(c.id);
        } }, ['Close to new people']) : null
      ]));
    }
    rows.push(el('div', { class: 'actions' }, [
      el('button', { class: 'btn ghost sm', type: 'button', onclick: async function () {
        if (!confirm('Leave this circle?')) return;
        err.hidden = true;
        try { await api('POST', '/api/circles/' + c.id + '/leave'); renderList(); }
        catch (e) { showErr(err, e); }
      } }, ['Leave the circle'])
    ]));
    host.appendChild(el('article', { class: 'card' }, [
      el('h3', { text: c.myRole === 'host' ? 'Running it' : 'This circle and you' }), err
    ].concat(rows)));
  }

  // ---------- the strip on the Find tab ----------
  /** Finder results are places to go alone. This offers the other door: a
   *  group that is already talking about the same things, in the same city. */
  async function resultsStrip(host, profile) {
    if (!S.user) return;
    var qs = '?city=' + encodeURIComponent(profile.location || '') +
             '&interests=' + encodeURIComponent((profile.interests || []).join(','));
    var data;
    try { data = await api('GET', '/api/circles' + qs); } catch (e) { return; }

    var open = data.circles.filter(function (c) { return c.overlap > 0; }).slice(0, 3);
    var box = el('div', { class: 'strip' });
    box.appendChild(el('div', { class: 'results-head sub' }, [
      el('h2', { text: open.length ? 'Or talk to people first' : 'Nobody is talking about this yet' }),
      el('p', { text: open.length
        ? 'Circles near you on the same interests. You chat in a group thread before anyone suggests meeting.'
        : 'No circle in your area covers what you picked. Starting one takes a name and a question.' })
    ]));
    open.forEach(function (c) { box.appendChild(discoverCard(c, function () { show(); })); });
    if (!open.length) {
      box.appendChild(el('div', { class: 'actions' }, [
        el('button', { class: 'btn ghost sm', type: 'button', onclick: function () { show(); } }, ['Open Circles'])
      ]));
    }
    host.appendChild(box);
  }

  function show() {
    if (window.FYC_SHOW) window.FYC_SHOW('circles');
  }

  // ---------- wiring ----------
  /** Called by social.js once it knows there is a backend and who you are. */
  function enable(state) {
    S.user = state.user;
    var tab = document.getElementById('tab-circles');
    if (!tab) return;
    tab.hidden = !state.user;
    if (!tab.dataset.wired) {
      tab.dataset.wired = '1';
      tab.addEventListener('click', function () { show(); });
    }
    if (state.user) refreshBadge();
  }

  window.FYC_CIRCLES = {
    enable: enable,
    render: renderList,
    stop: stop,
    refreshBadge: refreshBadge,
    resultsStrip: resultsStrip
  };
})();
