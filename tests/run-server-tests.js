/* community_finder — server tests. Plain Node, no dependencies.
 * Run: node tests/run-server-tests.js
 */
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { createApp } = require(path.join(__dirname, '..', 'server', 'app.js'));

let pass = 0, fail = 0, failures = [];
const ok = (c, name) => { if (c) pass++; else { fail++; failures.push(name); } };
const eq = (a, b, name) => ok(a === b, `${name} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
const group = (n, fn) => { console.log('\n— ' + n); return fn(); };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fyc-test-'));
// A mailer that captures instead of sending, so verification links can be used.
const sentMail = [];
const captureMailer = {
  transport: 'capture',
  async sendVerification({ to, link }) { sentMail.push({ to, link }); return { ok: true }; }
};

// Signup-per-IP is the one limit that gets in the test's way (every request
// here comes from one address); the limits under test keep their real values.
const { server } = createApp({
  file: path.join(tmp, 'test.db'),
  limits: { signupsPerIpPerHour: 100 },
  mailer: captureMailer
});

/** Minimal cookie-aware client. */
function client() {
  let jar = '';
  return async function call(method, url, body) {
    const res = await fetch(base + url, {
      method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, jar ? { Cookie: jar } : {}),
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    set.forEach((c) => { jar = c.split(';')[0]; });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return { status: res.status, data };
  };
}

let base;

/** Add an address and click the link, the way a person would. */
async function verifyEmail(call, email) {
  const r = await call('POST', '/api/email', { email });
  if (r.status !== 202) return r;
  const link = sentMail[sentMail.length - 1].link;
  const token = new URL(link).searchParams.get('token');
  return call('GET', '/api/verify?token=' + token);
}

(async function main() {
  await new Promise((r) => server.listen(0, r));
  base = 'http://127.0.0.1:' + server.address().port;

  const ava = client(), ben = client(), mal = client();

  await group('signup and sign in', async () => {
    let r = await ava('POST', '/api/signup', { username: 'AVA', password: 'hunter2hunter', display: 'Ava', city: 'Boston', ageOk: true, interests: [{ id: 'outdoors' }, { id: 'support', visible: false }] });
    eq(r.status, 201, 'signup succeeds');
    eq(r.data.user.username, 'ava', 'username is normalised to lowercase');
    eq(r.data.user.display, 'Ava', 'display name keeps its capitals');

    r = await ava('GET', '/api/me');
    eq(r.data.user.username, 'ava', 'session cookie keeps you signed in');

    const anon = client();
    eq((await anon('GET', '/api/me')).data.user, null, 'a stranger is nobody');
    eq((await anon('GET', '/api/people')).status, 401, 'discovery requires a session');
    eq((await anon('POST', '/api/requests', { toUserId: 1, intro: 'hello there friend' })).status, 401,
       'sending a request requires a session');

    eq((await client()('POST', '/api/signup', { username: 'ava', password: 'anotherpassword', ageOk: true })).status, 409,
       'usernames are unique');
    eq((await client()('POST', '/api/signup', { username: 'x', password: 'longenoughpw', ageOk: true })).status, 400,
       'usernames must be at least 3 characters');
    eq((await client()('POST', '/api/signup', { username: 'shorty', password: 'short', ageOk: true })).status, 400,
       'passwords must be at least 8 characters');
    eq((await client()('POST', '/api/signup', { username: 'nokid', password: 'longenoughpw' })).status, 400,
       'signup requires the 18+ confirmation');

    eq((await client()('POST', '/api/login', { username: 'ava', password: 'wrongpassword' })).status, 401,
       'a wrong password is rejected');
    const fresh = client();
    eq((await fresh('POST', '/api/login', { username: 'ava', password: 'hunter2hunter' })).status, 200,
       'the right password signs you in');
  });

  await group('profiles and visibility', async () => {
    await ben('POST', '/api/signup', { username: 'ben', password: 'hunter2hunter', display: 'Ben', city: 'Boston', ageOk: true, interests: [{ id: 'outdoors' }, { id: 'support' }, { id: 'games' }] });

    const r = await ava('GET', '/api/people');
    eq(r.status, 200, 'discovery works once signed in');
    eq(r.data.people.length, 1, 'finds the other person');
    eq(r.data.people[0].display, 'Ben', 'and it is Ben');
    eq(r.data.people[0].shared, 1, 'only the visible shared interest counts');
    ok(r.data.people[0].interests.indexOf('support') === -1 ||
       r.data.people[0].interests.indexOf('outdoors') !== -1,
       'discovery is driven by the viewer\'s visible interests');

    // Ava hid 'support', so it must not be the reason they were matched.
    const sup = await ava('GET', '/api/people?interest=support');
    eq(sup.data.people.length, 0, 'a hidden interest cannot be used to find people');

    // Turning discoverability off removes you from other people's results.
    await ben('PATCH', '/api/me', { city: 'Boston', discoverable: false });
    eq((await ava('GET', '/api/people')).data.people.length, 0, 'opting out of discovery hides you');
    await ben('PATCH', '/api/me', { city: 'Boston', discoverable: true });
    eq((await ava('GET', '/api/people')).data.people.length, 1, 'and opting back in restores you');

    const bad = await ava('PATCH', '/api/me', { city: 'Boston', interests: [{ id: 'not_a_real_interest' }] });
    eq(bad.data.user.interests.length, 0, 'unknown interest ids are discarded');
    await ava('PATCH', '/api/me', { city: 'Boston', interests: [{ id: 'outdoors' }, { id: 'support', visible: false }] });
  });

  await group('email verification', async () => {
    eq((await ava('POST', '/api/requests', { toUserId: 2, intro: 'hello there, nice to meet you' })).status, 403,
       'contacting people is blocked until an email is verified');

    eq((await ava('POST', '/api/email', { email: 'not-an-email' })).status, 400, 'a malformed address is refused');

    const r = await ava('POST', '/api/email', { email: 'ava@example.com' });
    eq(r.status, 202, 'a verification email is accepted for sending');
    eq(sentMail[sentMail.length - 1].to, 'ava@example.com', 'and addressed correctly');

    let me = (await ava('GET', '/api/me')).data.user;
    eq(me.emailVerified, false, 'the address is not verified just by being added');

    const link = sentMail[sentMail.length - 1].link;
    const token = new URL(link).searchParams.get('token');
    eq((await ava('GET', '/api/verify?token=' + token)).status, 200, 'the link verifies the address');
    me = (await ava('GET', '/api/me')).data.user;
    eq(me.emailVerified, true, 'and the account is now verified');

    eq((await ava('GET', '/api/verify?token=' + token)).status, 400, 'a verification link cannot be reused');
    eq((await ava('GET', '/api/verify?token=deadbeef')).status, 400, 'an unknown token is refused');

    await verifyEmail(ben, 'ben@example.com');
    eq((await client()('POST', '/api/email', { email: 'x@example.com' })).status, 401,
       'adding an email requires a session');

    const dupe = await ben('POST', '/api/email', { email: 'ava@example.com' });
    eq(dupe.status, 409, 'an address already in use is refused');
    await verifyEmail(ben, 'ben@example.com');
  });

  await group('request, accept, message', async () => {
    const benId = (await ava('GET', '/api/people')).data.people[0].id;

    eq((await ava('POST', '/api/requests', { toUserId: benId, intro: 'hi' })).status, 400,
       'a one-word introduction is refused');

    const r = await ava('POST', '/api/requests', { toUserId: benId, intro: 'Hello! I saw we both like hiking — fancy a walk sometime?' });
    eq(r.status, 201, 'an introduction can be sent');
    eq((await ava('POST', '/api/requests', { toUserId: benId, intro: 'Hello again, another message here' })).status, 409,
       'you cannot send a second request to the same person');

    // Nothing is a conversation until it is accepted.
    eq((await ava('GET', '/api/threads')).data.threads.length, 0, 'no thread exists before acceptance');
    eq((await ben('GET', '/api/threads')).data.threads.length, 0, 'not for the recipient either');

    const inbox = await ben('GET', '/api/requests');
    eq(inbox.data.incoming.length, 1, 'the request shows up in the inbox');
    eq(inbox.data.incoming[0].other_name, 'Ava', 'with the sender\'s name');

    const id = inbox.data.incoming[0].id;
    eq((await ava('POST', `/api/requests/${id}/accept`)).status, 404,
       'the sender cannot accept their own request');

    eq((await ben('POST', `/api/requests/${id}/accept`)).status, 200, 'the recipient can accept');
    eq((await ben('POST', `/api/requests/${id}/accept`)).status, 404, 'and cannot accept twice');

    const threads = await ava('GET', '/api/threads');
    eq(threads.data.threads.length, 1, 'acceptance creates the thread');
    const tid = threads.data.threads[0].id;

    eq((await ava('POST', `/api/threads/${tid}/messages`, { body: 'Hello!' })).status, 201, 'a message can be sent');
    eq((await ben('GET', `/api/threads/${tid}/messages`)).data.messages.length, 1, 'and the other side sees it');
    eq((await ava('POST', `/api/threads/${tid}/messages`, { body: '   ' })).status, 400, 'empty messages are refused');

    // A third party must not be able to read or write the conversation.
    await mal('POST', '/api/signup', { username: 'mal', password: 'hunter2hunter', display: 'Mal', city: 'Boston', ageOk: true, interests: [{ id: 'outdoors' }] });
    await verifyEmail(mal, 'mal@example.com');
    eq((await mal('GET', `/api/threads/${tid}/messages`)).status, 404, 'an outsider cannot read the thread');
    eq((await mal('POST', `/api/threads/${tid}/messages`, { body: 'butting in' })).status, 404,
       'an outsider cannot post to the thread');
  });

  await group('blocking and reporting', async () => {
    const people = (await ava('GET', '/api/people')).data.people;
    const malId = people.filter((p) => p.display === 'Mal')[0].id;

    await ava('POST', '/api/blocks', { userId: malId });
    const after = (await ava('GET', '/api/people')).data.people.map((p) => p.display);
    eq(after.indexOf('Mal'), -1, 'a blocked person disappears from your results');
    const malSees = (await mal('GET', '/api/people')).data.people.map((p) => p.display);
    eq(malSees.indexOf('Ava'), -1, 'and you disappear from theirs');
    eq((await mal('POST', '/api/requests', { toUserId: 1, intro: 'let me in please now' })).status, 403,
       'a blocked person cannot send you an introduction');

    eq((await ava('GET', '/api/blocks')).data.blocked.length, 1, 'your block list is visible to you');
    await ava('DELETE', `/api/blocks/${malId}`);
    eq((await ava('GET', '/api/blocks')).data.blocked.length, 0, 'and you can undo a block');

    const rep = await ava('POST', '/api/reports', { userId: malId, reason: 'harassment', detail: 'test' });
    eq(rep.status, 201, 'a report can be filed');
    eq(rep.data.blocked, true, 'reporting also blocks, so you stop hearing from them');
  });

  await group('rate limits', async () => {
    // Enough people to exercise the cap rather than just run out of targets.
    for (const name of ['filler1', 'filler2', 'filler3']) {
      await client()('POST', '/api/signup', { username: name, password: 'hunter2hunter', city: 'Boston', ageOk: true, interests: [{ id: 'outdoors' }] });
    }
    const spammer = client();
    await spammer('POST', '/api/signup', { username: 'spammer', password: 'hunter2hunter', city: 'Boston', ageOk: true, interests: [{ id: 'outdoors' }] });
    await verifyEmail(spammer, 'spammer@example.com');
    const targets = (await spammer('GET', '/api/people')).data.people;
    ok(targets.length >= 5, 'there are enough people to attempt a spam run (' + targets.length + ')');

    let sent = 0, blocked = 0;
    for (const t of targets.slice(0, 5)) {
      const r = await spammer('POST', '/api/requests', { toUserId: t.id, intro: 'Hello there, nice to meet you.' });
      if (r.status === 201) sent++;
      if (r.status === 429) blocked++;
    }
    eq(sent, 3, 'a brand new account gets exactly three introductions');
    ok(blocked > 0, 'further attempts are refused');
  });

  await group('alignment, direct messages and the graph', async () => {
    // Two people who align strongly: same city, four shared interests, both verified.
    const dana = client(), eli = client();
    const shared = [{ id: 'books' }, { id: 'games' }, { id: 'stillness' }, { id: 'music' }];
    await dana('POST', '/api/signup', { username: 'dana', password: 'hunter2hunter', display: 'Dana', city: 'Portland', ageOk: true, interests: shared });
    await eli('POST', '/api/signup', { username: 'eli', password: 'hunter2hunter', display: 'Eli', city: 'Portland', ageOk: true, interests: shared });
    await verifyEmail(dana, 'dana@example.com');
    await verifyEmail(eli, 'eli@example.com');

    const seen = (await dana('GET', '/api/people')).data.people.filter((p) => p.display === 'Eli')[0];
    eq(seen.shared, 4, 'four shared interests are counted');
    eq(seen.canDirect, true, 'strong alignment unlocks a direct message');

    const sent = await dana('POST', '/api/direct', { toUserId: seen.id, body: 'Hello! Four things in common — fancy a board game night?' });
    eq(sent.status, 201, 'the direct message is delivered');
    const threads = (await eli('GET', '/api/threads')).data.threads;
    eq(threads.length, 1, 'and it appears as a conversation for the recipient');
    eq((await eli('GET', `/api/threads/${threads[0].id}/messages`)).data.messages.length, 1,
       'with the message already in it');
    eq((await eli('GET', '/api/requests')).data.incoming.length, 0,
       'no pending request is created — that is the point');

    // Every leg of the rule has to hold.
    const far = client();
    await far('POST', '/api/signup', { username: 'far', password: 'hunter2hunter', display: 'Far', city: 'Seattle', ageOk: true, interests: shared });
    await verifyEmail(far, 'far@example.com');
    const farSees = (await far('GET', '/api/people')).data.people.filter((p) => p.display === 'Dana')[0];
    eq(farSees.canDirect, false, 'a different city blocks direct messaging');
    eq((await far('POST', '/api/direct', { toUserId: farSees.id, body: 'Hello from another city entirely' })).status, 403,
       'and the server refuses it, not just the UI');

    const thin = client();
    await thin('POST', '/api/signup', { username: 'thin', password: 'hunter2hunter', display: 'Thin', city: 'Portland', ageOk: true, interests: [{ id: 'books' }, { id: 'games' }] });
    await verifyEmail(thin, 'thin@example.com');
    const thinSees = (await thin('GET', '/api/people')).data.people.filter((p) => p.display === 'Dana')[0];
    eq(thinSees.canDirect, false, 'two shared interests is not enough');
    eq((await thin('POST', '/api/direct', { toUserId: thinSees.id, body: 'Only two things in common here' })).status, 403,
       'the server enforces the minimum');

    const unverified = client();
    await unverified('POST', '/api/signup', { username: 'unver', password: 'hunter2hunter', display: 'Unver', city: 'Portland', ageOk: true, interests: shared });
    const unvSees = (await unverified('GET', '/api/people')).data.people.filter((p) => p.display === 'Dana')[0];
    eq(unvSees.canDirect, false, 'an unverified sender cannot message directly');
    eq((await unverified('POST', '/api/direct', { toUserId: unvSees.id, body: 'Let me straight into your inbox' })).status, 403,
       'and the server refuses that too');

    // The recipient can switch it off for themselves.
    await eli('PATCH', '/api/me', { city: 'Portland', openToDirect: false });
    const after = (await dana('GET', '/api/people')).data.people.filter((p) => p.display === 'Eli')[0];
    eq(after.canDirect, false, 'opting out of direct messages is respected');
    await eli('PATCH', '/api/me', { city: 'Portland', openToDirect: true });

    // Blocking still wins over alignment.
    await eli('POST', '/api/blocks', { userId: (await eli('GET', '/api/people')).data.people.filter((p) => p.display === 'Dana')[0].id });
    eq((await dana('POST', '/api/direct', { toUserId: seen.id, body: 'Trying again after being blocked' })).status, 403,
       'a block beats alignment');

    // The graph.
    const g = (await thin('GET', '/api/graph')).data;
    ok(g.nodes.some((n) => n.kind === 'me'), 'the graph has you in it');
    ok(g.nodes.some((n) => n.kind === 'interest'), 'and interest nodes');
    ok(g.nodes.some((n) => n.kind === 'person'), 'and people');
    ok(g.links.length > 0, 'with links between them');
    eq(g.rule.minShared, 3, 'the graph states the rule it is applying');

    // It must not leak anything discovery would not show.
    const interestIds = g.nodes.filter((n) => n.kind === 'interest').map((n) => n.id.slice(2));
    const mine = (await thin('GET', '/api/me')).data.user.interests.filter((i) => i.visible).map((i) => i.id);
    ok(interestIds.every((i) => mine.indexOf(i) !== -1),
       'every interest node is one of your own visible interests');
    const personIds = g.nodes.filter((n) => n.kind === 'person').map((n) => n.userId);
    const discoverable = (await thin('GET', '/api/people')).data.people.map((p) => p.id);
    ok(personIds.every((id) => discoverable.indexOf(id) !== -1),
       'the graph shows only people discovery already shows');
    eq((await client()('GET', '/api/graph')).status, 401, 'the graph requires a session');
  });

  await group('static files and safety of the server itself', async () => {
    const r = await fetch(base + '/');
    eq(r.status, 200, 'the app itself is served');
    ok((await r.text()).indexOf('community_finder') !== -1, 'and it is the right page');

    eq((await fetch(base + '/assets/styles.css')).status, 200, 'the stylesheet is served');
    eq((await fetch(base + '/src/match.js')).status, 200, 'front-end scripts are served');

    // Only the front end is public. Everything else in the repo stays private,
    // whether or not it exists today.
    for (const p of ['/server/db.js', '/server/app.js', '/package.json', '/.gitignore',
                     '/tests/run-server-tests.js', '/tools/check-links.js', '/mac/build.sh',
                     '/README.md', '/server/data/community.db']) {
      eq((await fetch(base + p)).status, 404, 'not served: ' + p);
    }

    // fetch() normalises '/../' away, so traversal has to be tested encoded
    // and over a raw socket.
    eq((await fetch(base + '/%2e%2e/package.json')).status, 404, 'encoded traversal is refused');
    const raw = await new Promise((resolve) => {
      const net = require('node:net');
      const s = net.connect(server.address().port, '127.0.0.1', () => {
        s.write('GET /../package.json HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n');
      });
      let buf = '';
      s.on('data', (d) => { buf += d; });
      s.on('end', () => resolve(buf.split('\r\n')[0]));
    });
    ok(/ 404 /.test(raw), 'raw-socket path traversal is refused (' + raw.trim() + ')');
    eq((await fetch(base + '/api/nope')).status, 404, 'unknown endpoints 404');

    const cross = await fetch(base + '/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: JSON.stringify({ username: 'ava', password: 'hunter2hunter' })
    });
    eq(cross.status, 403, 'cross-origin writes are refused');
  });

  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log('\n' + (fail ? '✗' : '✓') + ' ' + pass + ' passed, ' + fail + ' failed');
  if (fail) {
    failures.forEach((f) => console.log('   ✗ ' + f));
    process.exit(1);
  }
})();
