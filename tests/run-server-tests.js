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
const { server, store } = createApp({
  file: path.join(tmp, 'test.db'),
  limits: { signupsPerIpPerHour: 100 },
  mailer: captureMailer,
  // A circle's whole life happens in milliseconds here, so the "separate days
  // of conversation" rung is the one thing relaxed. The other three are real.
  ready: { minDays: 1 },
  // Likewise the grace period before anyone is told that somebody answered a
  // question and got nothing back: four hours of real time, none here.
  disclosure: { respondAfterHours: 0 }
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
    await verifyEmail(far, 'faraway@example.com');
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

  await group('circles: vetting and the chat-first gate', async () => {
    const BIO = 'Moved here in the spring and would rather know a few people properly than meet forty once.';
    const INT = [{ id: 'books' }, { id: 'games' }, { id: 'food' }];
    const people = {};
    const CREW = { fay: 'fayc', gus: 'gusc', hal: 'halc', ivy: 'ivyc', jo: 'joec' };
    for (const [short, username] of Object.entries(CREW)) {
      const c = client();
      await c('POST', '/api/signup', {
        username, password: 'hunter2hunter', display: short[0].toUpperCase() + short.slice(1),
        city: 'Denver', bio: BIO, ageOk: true, interests: INT
      });
      await verifyEmail(c, username + '@example.com');
      people[short] = c;
    }
    const { fay, gus, hal, ivy, jo } = people;

    // ---- trust tiers ----
    let r = await fay('GET', '/api/circles');
    eq(r.data.trust.tier, 2, 'a verified, filled-in profile reaches the "Introduced" tier');
    ok(r.data.trust.missing.some((m) => /vouched/i.test(m)), 'and is told that vouches are what is left');

    const blank = client();
    await blank('POST', '/api/signup', { username: 'blankslate', password: 'hunter2hunter', city: 'Denver', ageOk: true });
    eq((await blank('GET', '/api/circles')).data.trust.tier, 0, 'a bare account is tier 0');
    eq((await blank('POST', '/api/circles', { name: 'Anything', city: 'Denver', blurb: BIO, question: 'Why are you here, in a sentence?', interests: ['books'] })).status,
       403, 'tier 0 cannot start a circle');

    // ---- starting one, and the vetting question being mandatory ----
    eq((await fay('POST', '/api/circles', { name: 'Books and dice', city: 'Denver', blurb: 'Too short', question: 'Why are you here, in a sentence?', interests: ['books'] })).status,
       400, 'a circle needs a real description');
    eq((await fay('POST', '/api/circles', { name: 'Books and dice', city: 'Denver', blurb: BIO, question: 'hi', interests: ['books'] })).status,
       400, 'and a real joining question — that is the vetting');

    r = await fay('POST', '/api/circles', {
      name: 'Books and dice', city: 'Denver', blurb: BIO,
      question: 'What are you reading or playing at the moment, and what are you after here?',
      interests: ['books', 'games'], cap: 4
    });
    eq(r.status, 201, 'a filled-in host can start a circle');
    const cid = r.data.circle.id;
    eq(r.data.circle.myRole, 'host', 'the founder is the host');
    eq(r.data.circle.cap, 4, 'the cap is kept small');

    // ---- the shopfront: a non-member sees the circle, never the conversation ----
    r = await gus('GET', '/api/circles/' + cid);
    eq(r.data.members, null, 'a non-member cannot see who is in a circle');
    eq((await gus('GET', '/api/circles/' + cid + '/messages')).status, 403,
       'nor read a word of the conversation');

    // ---- applying is a written answer, not a click ----
    eq((await gus('POST', '/api/circles/' + cid + '/apply', { answer: 'sounds fun' })).status, 400,
       'a one-liner is not an application');
    eq((await gus('POST', '/api/circles/' + cid + '/apply', { answer: 'Reading Piranesi, playing too much Wingspan, and I would like three or four people I can text about either.' })).status,
       201, 'a real answer applies');
    eq((await gus('POST', '/api/circles/' + cid + '/apply', { answer: 'Reading Piranesi, playing too much Wingspan, and I would like three or four people I can text about either.' })).status,
       409, 'and cannot be sent twice');

    // ---- circles are local ----
    const far = client();
    await far('POST', '/api/signup', { username: 'faraway', password: 'hunter2hunter', display: 'Faraway', city: 'Miami', bio: BIO, ageOk: true, interests: INT });
    await verifyEmail(far, 'far@example.com');
    const seenFar = (await far('GET', '/api/circles')).data.circles.filter((c) => c.id === cid)[0];
    eq(seenFar.apply.ok, false, 'someone in another city cannot apply');
    ok(/Denver/.test(seenFar.apply.why), 'and is told which city it is in');

    // ---- the host decides, and the answer is what they read ----
    r = await fay('GET', '/api/circles/' + cid);
    eq(r.data.applications.length, 1, 'the host sees the application');
    ok(/Piranesi/.test(r.data.applications[0].answer), 'with the answer attached');
    const gusApp = r.data.applications[0].id;
    eq((await gus('POST', `/api/circles/${cid}/applications/${gusApp}/approve`)).status, 403,
       'an applicant cannot approve themselves');
    eq((await fay('POST', `/api/circles/${cid}/applications/${gusApp}/approve`)).status, 201,
       'the host can let them in');
    eq((await gus('GET', '/api/circles/' + cid + '/messages')).status, 200,
       'and then the conversation opens up');

    await hal('POST', '/api/circles/' + cid + '/apply', { answer: 'Mostly non-fiction and a long-running D&D game. Looking for people to actually talk to rather than a weekly event.' });
    const halApp = (await fay('GET', '/api/circles/' + cid)).data.applications[0].id;
    await fay('POST', `/api/circles/${cid}/applications/${halApp}/approve`);
    eq(store.memberCount(cid), 3, 'three in the circle');

    // ---- two members carry an application without the host ----
    await ivy('POST', '/api/circles/' + cid + '/apply', { answer: 'I run a tiny book swap at work and want something less work-shaped. Happy to be the one who organises.' });
    const ivyApp = (await gus('GET', '/api/circles/' + cid)).data.applications.filter((a) => a.display === 'Ivy')[0].id;
    eq((await fay('POST', `/api/circles/${cid}/applications/${ivyApp}/second`)).status, 400,
       'the host approves outright rather than seconding');
    r = await gus('POST', `/api/circles/${cid}/applications/${ivyApp}/second`);
    eq(r.status, 200, 'a member can second an application');
    eq(r.data.seconds, 1, 'one second so far');
    eq((await gus('POST', `/api/circles/${cid}/applications/${ivyApp}/second`)).status, 409,
       'and cannot second twice');
    eq((await hal('POST', `/api/circles/${cid}/applications/${ivyApp}/second`)).status, 201,
       'two seconds let someone in without the host');
    eq(store.memberCount(cid), 4, 'four in the circle');

    // ---- the cap holds, and overflow waits ----
    r = await jo('POST', '/api/circles/' + cid + '/apply', { answer: 'Would happily be the fifth. I am around most evenings and I bring the snacks nobody asked for.' });
    eq(r.data.status, 'waitlisted', 'past the cap, an application joins the waiting list');

    // ---- meetups are locked until the circle has actually talked ----
    r = await fay('POST', '/api/circles/' + cid + '/meetups', { title: 'Coffee on Sunday', place: 'Union Station' });
    eq(r.status, 409, 'nobody can propose a meetup before the circle has talked');
    ok(/Talk first/.test(r.data.error), 'and is told why, in those words');

    // Twenty messages, three different people, which is the gate.
    for (let i = 0; i < 7; i++) {
      await fay('POST', '/api/circles/' + cid + '/messages', { body: 'Fay message ' + i });
      await gus('POST', '/api/circles/' + cid + '/messages', { body: 'Gus message ' + i });
      await hal('POST', '/api/circles/' + cid + '/messages', { body: 'Hal message ' + i });
    }
    r = await fay('GET', '/api/circles/' + cid);
    eq(r.data.circle.readiness.ready, true, 'twenty messages from three people opens the gate');
    eq(r.data.circle.live.speakers, 3, 'and the liveliness line counts the speakers');

    // ---- a proposal is a proposal until enough people say yes ----
    r = await gus('POST', '/api/circles/' + cid + '/meetups', {
      title: 'Sunday morning coffee and a game', place: 'Union Station, main hall',
      startsAt: Date.now() + 5 * 86400000, orgId: 'den-x', orgName: 'Tattered Cover', orgUrl: 'https://www.tatteredcover.com/',
      plan: 'Light rail from Alameda at half nine'
    });
    eq(r.status, 201, 'once ready, any member can propose something');
    const mid = (await fay('GET', '/api/circles/' + cid)).data.meetups[0].id;
    let k = (await fay('GET', '/api/circles/' + cid)).data.meetups[0];
    eq(k.status, 'proposed', 'it starts as a proposal');
    eq(k.yes, 1, 'with the proposer already in');
    eq(k.org.name, 'Tattered Cover', 'anchored to a real local listing');

    eq((await far('POST', '/api/meetups/' + mid + '/rsvp', { answer: 'yes', plan: 'Flying in specially' })).status, 403,
       'a non-member cannot vote on it');
    r = await fay('POST', '/api/meetups/' + mid + '/rsvp', { answer: 'yes', plan: 'Walking down from Curtis Park at nine' });
    eq(r.status, 200, 'a member can say yes');
    eq(r.data.status, 'on', `and at quorum (${k.quorum}) it becomes a plan`);

    // ---- vouching has to mean "we have talked" ----
    eq((await fay('POST', '/api/circles/' + cid + '/vouch', { userId: r.data.id || 0 })).status, 404,
       'you cannot vouch for a stranger');
    const ivyId = (await fay('GET', '/api/circles/' + cid)).data.members.filter((m) => m.display === 'Ivy')[0].id;
    eq((await fay('POST', '/api/circles/' + cid + '/vouch', { userId: ivyId })).status, 400,
       'nor for someone who has not said anything yet');
    const gusId = (await fay('GET', '/api/circles/' + cid)).data.members.filter((m) => m.display === 'Gus')[0].id;
    r = await fay('POST', '/api/circles/' + cid + '/vouch', { userId: gusId });
    eq(r.status, 201, 'you can vouch for someone you have talked to');
    await hal('POST', '/api/circles/' + cid + '/vouch', { userId: gusId });
    eq((await gus('GET', '/api/circles')).data.trust.tier, 3, 'two vouches reach the "Vouched for" tier');

    // ---- icebreakers, and not too many of them ----
    r = await fay('POST', '/api/circles/' + cid + '/prompt');
    eq(r.status, 201, 'a member can post a question for the whole circle');
    ok(globalThis.FYC.PROMPTS.indexOf(r.data.body) !== -1, 'drawn from the shared list, never invented');
    eq((await gus('POST', '/api/circles/' + cid + '/prompt')).status, 429, 'one prompt at a time');

    // ---- unread, and the host's queue ----
    r = await fay('GET', '/api/unread');
    ok(r.data.circles > 0, 'unread counts what other people said');
    eq(r.data.pending, 1, 'and the host sees the application still waiting');

    // ---- the host cannot walk out on people ----
    eq((await fay('POST', '/api/circles/' + cid + '/leave')).status, 409,
       'the host cannot leave a circle with people in it');
    eq((await hal('POST', '/api/circles/' + cid + '/leave')).status, 200, 'a member can leave');
    eq(store.memberCount(cid), 3, 'and is gone');

    // ---- host tools ----
    eq((await gus('DELETE', `/api/circles/${cid}/members/${ivyId}`)).status, 403,
       'only the host removes someone');
    eq((await fay('DELETE', `/api/circles/${cid}/members/${ivyId}`)).status, 200, 'the host can');
    eq((await fay('POST', '/api/circles/' + cid + '/close')).status, 200, 'and can close it to new people');
    const closed = (await jo('GET', '/api/circles')).data.circles.filter((c) => c.id === cid)[0];
    eq(closed, undefined, 'a closed circle leaves discovery');
  });

  await group('circles: the ceiling, the hours and repeating', async () => {
    const BIO = 'Here for a handful of people I actually know rather than a long list of ones I have met once.';
    const INT = [{ id: 'outdoors' }, { id: 'food' }, { id: 'music' }];
    const crew = {};
    for (const [short, username] of Object.entries({ kit: 'kitc', lou: 'louc', max: 'maxc' })) {
      const c = client();
      await c('POST', '/api/signup', {
        username, password: 'hunter2hunter', display: short[0].toUpperCase() + short.slice(1),
        city: 'Austin', bio: BIO, ageOk: true, interests: INT
      });
      await verifyEmail(c, username + '@example.com');
      crew[short] = c;
    }
    const { kit, lou, max } = crew;

    let r = await kit('POST', '/api/circles', {
      name: 'Walks and a coffee', city: 'Austin', blurb: BIO,
      question: 'What does a good Sunday morning look like for you?',
      interests: ['outdoors', 'food'], cap: 6
    });
    const cid = r.data.circle.id;
    eq(r.data.circle.readyAt, null, 'a new circle has no clock running yet');
    eq(r.data.circle.drift.stage, 'none', 'and is not drifting, because it could not meet anyway');

    for (const [who, answer] of [[lou, 'Long walks and then sitting down somewhere with a coffee for an hour. That is the whole ambition.'],
                                 [max, 'I walk most weekends alone and would rather not. Also I know every coffee place in this city.']]) {
      await who('POST', '/api/circles/' + cid + '/apply', { answer });
      const app = (await kit('GET', '/api/circles/' + cid)).data.applications[0];
      await kit('POST', `/api/circles/${cid}/applications/${app.id}/approve`);
    }
    for (let i = 0; i < 7; i++) {
      await kit('POST', '/api/circles/' + cid + '/messages', { body: 'Kit ' + i });
      await lou('POST', '/api/circles/' + cid + '/messages', { body: 'Lou ' + i });
      await max('POST', '/api/circles/' + cid + '/messages', { body: 'Max ' + i });
    }

    // ---- the clock starts the moment the circle could have met ----
    r = await kit('GET', '/api/circles/' + cid);
    ok(r.data.circle.readyAt > 0, 'becoming ready stamps the clock');
    eq(r.data.circle.drift.stage, 'ok', 'and a circle that just became ready is not drifting');
    eq(r.data.circle.hours.mine.hours, 0, 'no hours yet — messages do not count as hours');
    eq(r.data.circle.hours.mine.next.hours, 50, 'the next rung is Hall’s fifty hours');
    eq(r.data.circle.hours.mine.next.label, 'casual friends', 'which is where casual friendship starts');

    const back = (d) => store.db.prepare('UPDATE circles SET ready_at = ? WHERE id = ?')
      .run(Date.now() - d * 86400000, cid);

    // ---- the ceiling: Ramirez & Zhang, late switches go worse ----
    back(15);
    r = await kit('GET', '/api/circles/' + cid);
    eq(r.data.circle.drift.stage, 'nudge', 'a fortnight ready and unmet is a nudge');
    eq(r.data.circle.drift.days, 15, 'and it says how long it has been');
    eq(r.data.circle.drift.metBefore, false, 'this circle has never met');

    back(30);
    r = await kit('GET', '/api/circles/' + cid);
    eq(r.data.circle.drift.stage, 'drifting', 'a month ready and unmet is drifting');

    // The one place the app refuses to help you keep talking.
    r = await kit('POST', '/api/circles/' + cid + '/prompt');
    eq(r.status, 409, 'a drifting circle cannot post another icebreaker');
    ok(/propose something/.test(r.data.error), 'it says what to do instead');

    // ---- a date in the diary stops the clock ----
    eq((await kit('POST', '/api/circles/' + cid + '/meetups',
      { title: 'Sunday walk', place: 'Barton Springs gate' })).status, 400,
      'a plan without a time is refused');

    r = await kit('POST', '/api/circles/' + cid + '/meetups', {
      title: 'Sunday walk and a coffee', place: 'Barton Springs gate',
      startsAt: Date.now() + 3 * 86400000, cadence: 'weekly', hours: 2,
      plan: 'Cycling from home at half eight'
    });
    eq(r.status, 201, 'a dated proposal is accepted');
    eq(r.data.cadence, 'weekly', 'and can repeat');
    const mid = (await kit('GET', '/api/circles/' + cid)).data.meetups[0].id;
    await lou('POST', '/api/meetups/' + mid + '/rsvp', { answer: 'yes', plan: 'Bus down South Lamar at nine' });

    r = await kit('GET', '/api/circles/' + cid);
    eq(r.data.meetups[0].status, 'on', 'quorum confirms it');
    eq(r.data.circle.drift.stage, 'planned', 'and the clock stops while something is in the diary');
    eq((await lou('POST', '/api/circles/' + cid + '/prompt')).status, 201,
       'with a plan booked, prompts are fine again');

    // ---- a recurring meetup rolls itself forward ----
    const was = store.meetupById(mid).starts_at;
    store.db.prepare('UPDATE meetups SET starts_at = ? WHERE id = ?')
      .run(Date.now() - 2 * 86400000, mid);
    r = await kit('GET', '/api/circles/' + cid);
    eq(r.data.occurrences.length, 1, 'once its time passes it is filed in the ledger');
    eq(r.data.meetups.length, 1, 'and the series is still live');
    ok(r.data.meetups[0].startsAt > Date.now(), 'rolled on to its next date');
    eq(r.data.meetups[0].yes, 0, 'with the RSVPs cleared — you say yes to each one');
    eq(r.data.circle.met, 1, 'the circle has met once');
    ok(r.data.circle.drift.metBefore, 'which the clock now measures from');
    ok(was > 0, 'the original date was real');

    // ---- hours are banked by turning up, not by saying you would ----
    eq(r.data.circle.hours.mine.hours, 0, 'an RSVP alone banks nothing');
    eq(r.data.confirm.length, 1, 'everyone is asked whether they were actually there');
    const occ = r.data.confirm[0].id;

    eq((await client()('POST', '/api/occurrences/' + occ + '/attended', { attended: true })).status, 401,
       'a stranger cannot log attendance');
    r = await kit('POST', '/api/occurrences/' + occ + '/attended', { attended: true });
    eq(r.status, 200, 'a member can say they were there');
    eq(r.data.hours.hours, 2, 'which banks the hours');
    eq(r.data.circleHours, 0, 'but one person turning up is not the circle meeting');

    await lou('POST', '/api/occurrences/' + occ + '/attended', { attended: true });
    await max('POST', '/api/occurrences/' + occ + '/attended', { attended: false });
    r = await kit('GET', '/api/circles/' + cid);
    eq(r.data.circle.hours.circle, 2, 'two people confirming makes it the circle’s hours');
    eq(r.data.confirm.length, 0, 'and the question stops being asked');
    eq(r.data.members.filter((m) => m.display === 'Max')[0].hours, 0,
       'someone who missed it banks nothing');
    eq(r.data.circle.hours.mine.next.hours, 50, 'two hours of fifty');

    // ---- a one-off finishes rather than repeating ----
    r = await lou('POST', '/api/circles/' + cid + '/meetups', {
      title: 'One-off gallery thing', place: 'Blanton steps',
      startsAt: Date.now() + 86400000, cadence: '', hours: 1,
      plan: 'Straight there after work'
    });
    const oneOff = r.data.id;
    await kit('POST', '/api/meetups/' + oneOff + '/rsvp', { answer: 'yes', plan: 'Walking over from campus' });
    store.db.prepare('UPDATE meetups SET starts_at = ? WHERE id = ?')
      .run(Date.now() - 86400000, oneOff);
    r = await kit('GET', '/api/circles/' + cid);
    eq(store.meetupById(oneOff).status, 'done', 'a one-off is done once it has happened');
    ok(!r.data.meetups.some((k) => k.id === oneOff), 'and drops out of the live list');
    eq(r.data.occurrences.length, 2, 'while staying in the history');
  });

  await group('circles: bonds, escalating questions and if-then plans', async () => {
    const BIO = 'I have lived in four cities and learned that the second year is the one where you either know people or do not.';
    const INT = [{ id: 'books' }, { id: 'music' }, { id: 'tech' }];
    const crew = {};
    for (const [short, username] of Object.entries({ nia: 'niac', oli: 'olic', pip: 'pipc', qui: 'quic' })) {
      const c = client();
      await c('POST', '/api/signup', {
        username, password: 'hunter2hunter', display: short[0].toUpperCase() + short.slice(1),
        city: 'Seattle', bio: BIO, ageOk: true, interests: INT
      });
      await verifyEmail(c, username + '@example.com');
      crew[short] = c;
    }
    const { nia, oli, pip, qui } = crew;

    // Somebody in another city, to check the doors from outside.
    const outsider = client();
    await outsider('POST', '/api/signup', {
      username: 'outsidr', password: 'hunter2hunter', display: 'Outsidr',
      city: 'Tucson', bio: BIO, ageOk: true, interests: INT
    });
    await verifyEmail(outsider, 'outsidr@example.com');

    let r = await nia('POST', '/api/circles', {
      name: 'Records and reading', city: 'Seattle', blurb: BIO,
      question: 'What is on your turntable or your bedside table at the moment?',
      interests: ['books', 'music'], cap: 6
    });
    const cid = r.data.circle.id;

    for (const [who, answer] of [[oli, 'Mostly secondhand jazz records and a pile of library books I renew instead of reading. Would like people to go rummaging with.'],
                                 [pip, 'I run out of things to say at parties but could talk about a record sleeve for an hour. Looking for the second kind of evening.'],
                                 [qui, 'New to the city in August, know precisely two people, and both of them are colleagues. That is the whole situation.']]) {
      await who('POST', '/api/circles/' + cid + '/apply', { answer });
      const app = (await nia('GET', '/api/circles/' + cid)).data.applications[0];
      await nia('POST', `/api/circles/${cid}/applications/${app.id}/approve`);
    }
    // Three of the four talk. Qui joins and says nothing, which is what makes
    // them the test case for the side-thread gate.
    for (let i = 0; i < 7; i++) {
      await nia('POST', '/api/circles/' + cid + '/messages', { body: 'Nia ' + i });
      await oli('POST', '/api/circles/' + cid + '/messages', { body: 'Oli ' + i });
      await pip('POST', '/api/circles/' + cid + '/messages', { body: 'Pip ' + i });
    }

    // ---- questions that get harder as the circle earns them ----
    // Aron et al. (1997): the escalation is the mechanism. Reis & Shaver: an
    // unanswered question is not disclosure, so it buys nothing.
    const SETS = globalThis.FYC.PROMPT_SETS;
    r = await nia('GET', '/api/circles/' + cid);
    eq(r.data.circle.disclosure.depth, 1, 'a circle starts on the easy questions');
    eq(r.data.circle.disclosure.label, 'Easy', 'and is told which set that is');
    eq(r.data.circle.disclosure.needed, 2, 'two answered questions open the next one');
    eq(r.data.circle.disclosure.answeredBy, 2, 'answered meaning two or more people replied');

    // Twelve hours between prompts is real, so the clock is wound back rather
    // than switched off.
    const agePrompts = () => store.db.prepare(
      `UPDATE circle_messages SET created_at = created_at - ? WHERE circle_id = ? AND kind = 'prompt'`
    ).run(13 * 3600000, cid);

    async function ask(repliers) {
      const p = await nia('POST', '/api/circles/' + cid + '/prompt');
      agePrompts();
      for (const who of repliers) {
        await who('POST', '/api/circles/' + cid + '/messages', { body: 'My answer to that one, at some length.' });
      }
      return p;
    }

    let p = await ask([oli, pip]);
    eq(p.status, 201, 'anyone can put a question to the circle');
    ok(SETS[0].prompts.indexOf(p.data.body) !== -1, 'drawn from the set the circle is on');
    r = await nia('GET', '/api/circles/' + cid);
    eq(r.data.circle.disclosure.answered, 1, 'an answered question counts towards the next set');
    eq(r.data.circle.disclosure.depth, 1, 'but one is not two');

    p = await ask([oli]);
    ok(SETS[0].prompts.indexOf(p.data.body) !== -1, 'still the easy set');
    r = await nia('GET', '/api/circles/' + cid);
    eq(r.data.circle.disclosure.answered, 1, 'a question only one person answered does not count');

    p = await ask([oli, pip]);
    r = await nia('GET', '/api/circles/' + cid);
    eq(r.data.circle.disclosure.depth, 2, 'two answered questions open the personal set');
    eq(r.data.circle.disclosure.label, 'Personal', 'which is what it is called');

    p = await nia('POST', '/api/circles/' + cid + '/prompt');
    agePrompts();
    ok(SETS[1].prompts.indexOf(p.data.body) !== -1, 'and the next question comes from it');
    eq(p.data.disclosure.depth, 2, 'the answer says which set it came from');
    eq((await outsider('GET', '/api/circles/' + cid)).data.circle.disclosure, null,
       'a stranger is not shown how far in the circle has got');

    // ---- somebody answered and nobody replied ----
    await pip('POST', '/api/circles/' + cid + '/messages', { body: 'Honestly? The thing I am worst at is asking people twice.' });
    r = await nia('GET', '/api/circles/' + cid);
    eq(r.data.circle.respond.display, 'Pip', 'the rest of the circle is told that somebody is hanging');
    eq((await pip('GET', '/api/circles/' + cid)).data.circle.respond, null,
       'and the person who answered is never told that nobody replied');
    await oli('POST', '/api/circles/' + cid + '/messages', { body: 'Same, and it is the only thing that has ever worked for me.' });
    eq((await nia('GET', '/api/circles/' + cid)).data.circle.respond, null, 'a reply clears it');

    // ---- what any two of you have in common, and a door to one person ----
    // Ren, Kraut & Kiesler (2007): bond-based attachment needs individuals,
    // not just a shared subject.
    r = await nia('GET', '/api/circles/' + cid);
    const row = (name) => r.data.members.filter((p2) => p2.display === name)[0];
    eq(row('Oli').shared.length, 3, 'the member list says what the two of you both picked');
    eq(row('Nia').shared.length, 0, 'and does not do it for you and yourself');
    eq(row('Oli').canMessage, true, 'two people who have both spoken here can talk one to one');
    eq(row('Qui').canMessage, false, 'not with someone who has said nothing yet');
    ok(/said something/.test(row('Qui').whyNot), 'and it says why');

    const oliId = row('Oli').id, quiId = row('Qui').id, niaId = row('Nia').id;
    eq((await nia('POST', '/api/circles/' + cid + '/threads',
      { userId: quiId, body: 'You have not said anything but hello, so this is a cold approach.' })).status, 403,
      'the server enforces that, not just the UI');
    eq((await outsider('POST', '/api/circles/' + cid + '/threads',
      { userId: oliId, body: 'Butting in from another city entirely, hello there.' })).status, 403,
      'and an outsider cannot use the door at all');
    eq((await nia('POST', '/api/circles/' + cid + '/threads', { userId: oliId, body: 'hi' })).status, 400,
       'a one-word opener is refused, same as everywhere else');

    r = await nia('POST', '/api/circles/' + cid + '/threads',
      { userId: oliId, body: 'That record shop you mentioned — which one was it? I am out that way on Saturday.' });
    eq(r.status, 201, 'you can start a thread with someone you have actually talked to here');
    const inbox = (await oli('GET', '/api/threads')).data.threads;
    ok(inbox.some((t) => t.other_name === 'Nia'), 'it lands in Messages like any other conversation');
    eq((await oli('GET', '/api/requests')).data.incoming.length, 0,
       'with nothing to accept — you are already in a circle together');

    // A hidden interest stays hidden, even from people in your own circle.
    await pip('PATCH', '/api/me', {
      city: 'Seattle', bio: BIO,
      interests: [{ id: 'books' }, { id: 'music', visible: false }, { id: 'tech' }]
    });
    r = await nia('GET', '/api/circles/' + cid);
    eq(r.data.members.filter((p2) => p2.display === 'Pip')[0].shared.length, 2,
       'a hidden interest is not exposed by the overlap line');

    // Blocking closes the door again, as it does everywhere.
    await oli('POST', '/api/blocks', { userId: niaId });
    r = await nia('GET', '/api/circles/' + cid);
    eq(r.data.members.filter((p2) => p2.display === 'Oli')[0].canMessage, false,
       'a block beats being in the same circle');
    await oli('DELETE', '/api/blocks/' + niaId);

    // ---- the plan behind a yes ----
    // Gollwitzer & Sheeran (2006): naming when, where and how is most of the
    // difference between intending and doing.
    const proposal = {
      title: 'Record shop crawl and a coffee', place: 'Easy Street Records, Queen Anne',
      startsAt: Date.now() + 4 * 86400000, cadence: 'fortnightly', hours: 3
    };
    r = await nia('POST', '/api/circles/' + cid + '/meetups', proposal);
    eq(r.status, 400, 'a proposal with no plan for getting there is refused');
    ok(/setting off from/.test(r.data.error), 'and is told what is wanted');

    r = await nia('POST', '/api/circles/' + cid + '/meetups',
      Object.assign({ plan: 'Walking down from Capitol Hill at eleven' }, proposal));
    eq(r.status, 201, 'with a plan it goes up — proposing is a yes, and a yes carries one');
    const mid = r.data.id;

    eq((await oli('POST', '/api/meetups/' + mid + '/rsvp', { answer: 'yes' })).status, 400,
       'a yes with no plan is refused too');
    eq((await oli('POST', '/api/meetups/' + mid + '/rsvp', { answer: 'yes', plan: 'soon' })).status, 400,
       'and so is a one-word one');
    eq((await oli('POST', '/api/meetups/' + mid + '/rsvp', { answer: 'maybe' })).status, 200,
       'a maybe promises nothing, so it is asked for nothing');
    eq((await oli('POST', '/api/meetups/' + mid + '/rsvp', { answer: 'no' })).status, 200,
       'nor is a no');
    r = await oli('POST', '/api/meetups/' + mid + '/rsvp',
      { answer: 'yes', plan: 'The 13 bus from Broadway, quarter to eleven' });
    eq(r.status, 200, 'a yes with a real plan counts');
    eq(r.data.status, 'on', 'and at quorum it becomes a plan for everyone');

    r = await oli('GET', '/api/circles/' + cid);
    eq(r.data.meetups[0].myPlan, 'The 13 bus from Broadway, quarter to eleven',
       'your own plan is shown back to you, which is the half that makes it work');
    r = await nia('GET', '/api/circles/' + cid);
    eq(r.data.meetups[0].myPlan, 'Walking down from Capitol Hill at eleven',
       'everyone sees their own');
    ok(JSON.stringify(r.data.meetups[0]).indexOf('13 bus') === -1, 'and nobody else\'s');

    // Each occasion needs its own cue, so a roll takes the plan with the RSVP.
    store.db.prepare('UPDATE meetups SET starts_at = ? WHERE id = ?')
      .run(Date.now() - 4 * 3600000, mid);
    r = await nia('GET', '/api/circles/' + cid);
    eq(r.data.meetups[0].myPlan, '', 'when the series rolls on, the plan rolls off with the RSVP');
    eq(r.data.meetups[0].yes, 0, 'so the next date is planned for on its own terms');
  });

  await group('circles: turn-taking, the quiet, and what a circle is for', async () => {
    const BIO = 'Moved here for a job and stayed for the hills. Good at starting things, historically bad at keeping them going.';
    const INT = [{ id: 'outdoors' }, { id: 'food' }, { id: 'games' }];
    const crew = {};
    for (const [short, username] of Object.entries({
      ada: 'adad', ben: 'bend', cal: 'cald', dee: 'deed', eve: 'eved', fay: 'fayd'
    })) {
      const c = client();
      await c('POST', '/api/signup', {
        username, password: 'hunter2hunter', display: short[0].toUpperCase() + short.slice(1),
        city: 'Portland', bio: BIO, ageOk: true, interests: INT
      });
      await verifyEmail(c, username + '@example.com');
      crew[short] = c;
    }
    const { ada, ben, cal, dee, eve, fay } = crew;

    // ---- the cap came down ----
    // Fay, Garrod & Carletta (2000): a discussion in a group of five stays a
    // dialogue; the same discussion in a group of ten becomes serial
    // monologue. Eight is the ceiling now, and asking for twelve gets eight.
    let r = await ada('POST', '/api/circles', {
      name: 'Hills and dinner, Southeast', city: 'Portland', blurb: BIO,
      question: 'What is the last walk you did that you would do again?',
      interests: ['outdoors', 'food'], cap: 12
    });
    const cid = r.data.circle.id;
    eq(r.data.circle.cap, 8, 'a circle cannot be built for twelve people any more');
    eq((await ada('GET', '/api/circles')).data.capRange.max, 8, 'and the ceiling is published');
    eq((await ada('GET', '/api/circles')).data.capRange.default, 6, 'with six the default');

    for (const who of [ben, cal, dee, eve, fay]) {
      await who('POST', '/api/circles/' + cid + '/apply', {
        answer: 'The Wildwood from the zoo end, in the rain, which is the only way I have ever done it. Would like company next time.'
      });
      const app = (await ada('GET', '/api/circles/' + cid)).data.applications[0];
      await ada('POST', `/api/circles/${cid}/applications/${app.id}/approve`);
    }
    eq((await ada('GET', '/api/circles/' + cid)).data.circle.members, 6, 'six people in it');

    // ---- turn-taking equality ----
    // Woolley et al. (2010): collective intelligence tracked the equality of
    // conversational turn-taking, not the brilliance of the members. One
    // person writing the whole thing is a broadcast, and the old gate let it
    // through.
    const gate = async (who) => (await who('GET', '/api/circles/' + cid)).data.circle.readiness;
    const check = (rd, id) => rd.checks.filter((c) => c.id === id)[0];

    for (let i = 0; i < 22; i++) {
      await ada('POST', '/api/circles/' + cid + '/messages', { body: 'Ada again, message ' + i });
    }
    let rd = await gate(ada);
    eq(rd.of, 5, 'the gate has five parts now');
    eq(check(rd, 'messages').have >= 20, true, 'twenty messages are there');
    eq(check(rd, 'speakers').need, 4, 'and four of six people have to be talking');
    eq(check(rd, 'balance').have, 100, 'one voice is all of it');
    eq(check(rd, 'balance').max, 50, 'where half is the most anyone may be');
    eq(rd.ready, false, 'so twenty-two messages from one person is not a conversation');

    // Three people talking is still not four of six.
    for (const who of [ben, cal]) {
      await who('POST', '/api/circles/' + cid + '/messages', { body: 'Agreed, broadly.' });
    }
    rd = await gate(ada);
    eq(check(rd, 'speakers').have, 3, 'three of them have spoken');
    eq(rd.ready, false, 'which in a circle of six is still an audience');

    await dee('POST', '/api/circles/' + cid + '/messages', { body: 'Me too, for what it is worth.' });
    rd = await gate(ada);
    ok(check(rd, 'speakers').have >= check(rd, 'speakers').need, 'four of six are talking');
    eq(rd.ready, false, 'and it is the share, on its own, still holding the gate shut');
    eq(rd.done, 4, 'four of the five parts met');
    eq(check(rd, 'balance').have > 50, true, 'because one person is still most of it');

    // Now everyone else talks enough that nobody is more than half.
    for (let i = 0; i < 6; i++) {
      for (const who of [ben, cal, dee, eve]) {
        await who('POST', '/api/circles/' + cid + '/messages', { body: 'Something of my own to add, number ' + i });
      }
    }
    rd = await gate(ada);
    ok(check(rd, 'balance').have <= 50, 'nobody is more than half the conversation');
    eq(rd.ready, true, 'and now the circle can plan something');

    // ---- the question gets handed to whoever has gone quiet ----
    // Preece, Nonnecke & Andrews (2004): people who read without posting
    // mostly have not been asked anything. Fay is in this circle and has
    // never said a word, which is exactly the case.
    const backdate = (hours) => {
      store.db.prepare('UPDATE circle_members SET joined_at = joined_at - ? WHERE circle_id = ?')
        .run(hours * 3600000, cid);
      store.db.prepare(`UPDATE circle_messages SET created_at = created_at - ? WHERE circle_id = ?`)
        .run(hours * 3600000, cid);
    };
    const agePrompts = () => store.db.prepare(
      `UPDATE circle_messages SET created_at = created_at - ? WHERE circle_id = ? AND kind = 'prompt'`
    ).run(13 * 3600000, cid);

    backdate(72);
    // Eve speaks now, so she is not quiet; Fay has still never spoken.
    await eve('POST', '/api/circles/' + cid + '/messages', { body: 'Still here, still reading.' });

    let p = await ada('POST', '/api/circles/' + cid + '/prompt');
    eq(p.status, 201, 'a question goes up');
    ok(p.data.invited.indexOf('Fay') !== -1, 'and it is handed to the person who has never spoken');
    eq(p.data.invited.indexOf('Eve'), -1, 'not to someone who spoke a minute ago');
    eq(p.data.invited.indexOf('Ada'), -1, 'and never to whoever pressed the button');
    ok(p.data.invited.length <= 2, 'two at the most: a spotlight on everyone is a roll call');
    const firstInvited = p.data.invited.slice();

    r = await fay('GET', '/api/circles/' + cid + '/messages');
    const asked = r.data.messages.filter((m) => m.kind === 'prompt').slice(-1)[0];
    ok(Array.isArray(asked.invited), 'the question carries who it was for');
    ok(asked.invited.some((x) => x.display === 'Fay'), 'by name, so the UI never has to guess');
    ok(asked.invites === undefined, 'and the raw id list does not leave the server');

    agePrompts();
    p = await ada('POST', '/api/circles/' + cid + '/prompt');
    firstInvited.forEach((name) => {
      eq(p.data.invited.indexOf(name), -1, name + ' is not asked twice running');
    });

    // ---- what the circle says it is ----
    // Lickel et al. (2000): shared goals are part of what makes a set of
    // people read as a group. Postmes et al. (2005): the members have to have
    // written it themselves.
    const LINE = 'Somebody to walk with on a Sunday who does not mind the rain.';
    eq((await ada('POST', '/api/circles/' + cid + '/wants', { wants: 'eh' })).status, 400,
       'a line has to be a line');
    eq((await ada('POST', '/api/circles/' + cid + '/wants', { wants: LINE })).status, 200,
       'and then it is yours');
    r = await ben('GET', '/api/circles/' + cid);
    eq(r.data.members.filter((m) => m.display === 'Ada')[0].wants, LINE,
       'the rest of the circle can read it');
    eq(r.data.wants.maxChars, 140, 'one line, and the limit says so');

    await ben('POST', '/api/circles/' + cid + '/wants', { wants: 'x'.repeat(300) });
    eq((await ben('GET', '/api/circles/' + cid)).data.members
      .filter((m) => m.display === 'Ben')[0].wants.length, 140, 'anything longer is cut to length');
    await ben('POST', '/api/circles/' + cid + '/wants', { wants: '' });
    eq((await ben('GET', '/api/circles/' + cid)).data.members
      .filter((m) => m.display === 'Ben')[0].wants, '', 'and taking it down needs no explanation');

    const outsider = client();
    await outsider('POST', '/api/signup', {
      username: 'nonmembr', password: 'hunter2hunter', display: 'Nonmembr',
      city: 'Portland', bio: BIO, ageOk: true, interests: INT
    });
    await verifyEmail(outsider, 'nonmembr@example.com');
    eq((await outsider('POST', '/api/circles/' + cid + '/wants', { wants: LINE })).status, 403,
       'somebody outside the circle cannot write what it is for');
    eq((await outsider('GET', '/api/circles/' + cid)).data.circle.story, null,
       'and cannot read it either');

    r = await ada('GET', '/api/circles/' + cid);
    ok(r.data.circle.story.since > 0, 'the circle knows how long it has been going');
    ok(r.data.circle.story.days >= 1, 'and across how many days it has talked');
    eq(r.data.circle.story.occurrences, 0, 'nothing has happened in person yet');
    eq(r.data.circle.story.regulars.length, 0, 'so nobody is a regular');
    const listed = await ada('GET', '/api/circles');
    eq(listed.data.mine.concat(listed.data.circles).filter((x) => x.id === cid)[0].story, null,
       'and a list of sixty circles does not pay for any of it');

    // Who has been at every single one, which is the half of a shared history
    // that cannot be faced out of.
    const ids = {};
    r.data.members.forEach((m) => { ids[m.display] = m.id; });
    const prop = await ada('POST', '/api/circles/' + cid + '/meetups', {
      title: 'Wildwood from the zoo end', place: 'Washington Park, by the station',
      startsAt: Date.now() + 5 * 86400000, details: 'Three hours, out and back, rain regardless.',
      hours: 3, plan: 'Taking the MAX to Washington Park for half nine'
    });
    eq(prop.status, 201, 'a ready circle can propose something');
    const occ = store.db.prepare(`INSERT INTO meetup_occurrences
      (meetup_id, circle_id, title, starts_at, hours, created_at) VALUES (?, ?, ?, ?, 2, ?)`);
    const bind = (title, at) => occ.run(prop.data.id, cid, title, at, Date.now());
    const o1 = Number(bind('A walk', Date.now() - 86400000).lastInsertRowid);
    eq(store.regulars(cid).names.length, 0, 'one occasion is not a habit');
    const o2 = Number(bind('Another walk', Date.now() - 3600000).lastInsertRowid);
    [o1, o2].forEach((o) => {
      store.setAttendance(o, ids.Ada, true);
      store.setAttendance(o, ids.Ben, true);
    });
    store.setAttendance(o2, ids.Cal, true);
    const reg = store.regulars(cid);
    eq(reg.total, 2, 'two occasions on the record');
    eq(reg.names.join(','), 'Ada,Ben', 'and the two who were at both of them');
    ok(reg.names.indexOf('Cal') === -1, 'turning up once is not turning up every time');

    // ---- the old ceiling comes down without throwing anyone out ----
    store.db.prepare('UPDATE circles SET cap = 12 WHERE id = ?').run(cid);
    store.lowerCaps(8);
    eq(store.circleById(cid).cap, 8, 'a circle built for twelve comes down to eight');
    store.lowerCaps(4);
    eq(store.circleById(cid).cap, 6, 'but never below the people already in it');
    store.db.prepare('UPDATE circles SET cap = 8 WHERE id = ?').run(cid);
  });

  await group('production readiness', async () => {
    const r = await fetch(base + '/api/health');
    eq(r.status, 200, 'health check answers');
    const h = await r.json();
    eq(h.status, 'ok', 'and reports healthy');
    eq(h.db, 'ok', 'having actually queried the database');
    ok(typeof h.uptime === 'number', 'with an uptime');

    // Security headers on every response, page and API alike.
    for (const p of ['/', '/api/health']) {
      const res = await fetch(base + p);
      eq(res.headers.get('x-content-type-options'), 'nosniff', `nosniff on ${p}`);
      eq(res.headers.get('x-frame-options'), 'DENY', `framing denied on ${p}`);
      ok((res.headers.get('content-security-policy') || '').includes("default-src 'self'"),
         `content security policy on ${p}`);
      ok((res.headers.get('content-security-policy') || '').includes("frame-ancestors 'none'"),
         `frame-ancestors on ${p}`);
    }
    // HSTS only over TLS; sending it on plain http would be wrong.
    eq((await fetch(base + '/')).headers.get('strict-transport-security'), null,
       'no HSTS when not running behind TLS');

    // Caching: the page must revalidate or a deploy never lands; assets may cache.
    eq((await fetch(base + '/')).headers.get('cache-control'), 'no-cache', 'the page revalidates');
    ok((await fetch(base + '/assets/styles.css')).headers.get('cache-control').includes('max-age'),
       'assets are cacheable');
    eq((await fetch(base + '/api/me')).headers.get('cache-control'), 'no-store', 'API responses are never cached');

    // The public, non-app files a deployment needs.
    for (const p of ['/privacy.html', '/terms.html', '/robots.txt', '/site.webmanifest']) {
      eq((await fetch(base + p)).status, 200, `serves ${p}`);
    }
    ok((await (await fetch(base + '/robots.txt')).text()).includes('Disallow: /api/'),
       'robots keeps crawlers out of the API');

    // Suspension has to end access, not just hide the profile.
    const victim = client();
    await victim('POST', '/api/signup', { username: 'badactor', password: 'hunter2hunter', city: 'Boston', ageOk: true, interests: [{ id: 'outdoors' }] });
    eq((await victim('GET', '/api/me')).data.user.username, 'badactor', 'signed in before suspension');
    const row = store.userByName('badactor');
    store.setSuspended(row.id, true);
    eq((await victim('GET', '/api/me')).data.user, null, 'a suspended account is signed out immediately');
    eq((await victim('GET', '/api/people')).status, 401, 'and cannot use the API');
    const seenBy = (await ava('GET', '/api/people')).data.people.map((p) => p.display);
    ok(seenBy.indexOf('badactor') === -1, 'and disappears from discovery');
    store.setSuspended(row.id, false);
  });

  await group('static files and safety of the server itself', async () => {
    const r = await fetch(base + '/');
    eq(r.status, 200, 'the app itself is served');
    ok((await r.text()).indexOf('community_finder') !== -1, 'and it is the right page');

    eq((await fetch(base + '/assets/styles.css')).status, 200, 'the stylesheet is served');
    eq((await fetch(base + '/src/match.js')).status, 200, 'front-end scripts are served');

    // Assets are cached for five minutes with must-revalidate, which needs a
    // validator to revalidate against. Without one a deploy handed people the
    // new page driving the old scripts.
    const asset = await fetch(base + '/src/match.js');
    const tag = asset.headers.get('etag');
    ok(!!tag, 'a static asset carries an ETag (' + tag + ')');
    const again = await fetch(base + '/src/match.js', { headers: { 'If-None-Match': tag } });
    eq(again.status, 304, 'and a conditional GET is answered with a 304');
    eq(again.headers.get('etag'), tag, 'the 304 repeats the tag');
    const changed = await fetch(base + '/src/match.js', { headers: { 'If-None-Match': '"nonsense"' } });
    eq(changed.status, 200, 'a stale tag gets the file');

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
