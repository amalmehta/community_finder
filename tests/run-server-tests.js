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
  ready: { minDays: 1 }
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
      startsAt: Date.now() + 5 * 86400000, orgId: 'den-x', orgName: 'Tattered Cover', orgUrl: 'https://www.tatteredcover.com/'
    });
    eq(r.status, 201, 'once ready, any member can propose something');
    const mid = (await fay('GET', '/api/circles/' + cid)).data.meetups[0].id;
    let k = (await fay('GET', '/api/circles/' + cid)).data.meetups[0];
    eq(k.status, 'proposed', 'it starts as a proposal');
    eq(k.yes, 1, 'with the proposer already in');
    eq(k.org.name, 'Tattered Cover', 'anchored to a real local listing');

    eq((await far('POST', '/api/meetups/' + mid + '/rsvp', { answer: 'yes' })).status, 403,
       'a non-member cannot vote on it');
    r = await fay('POST', '/api/meetups/' + mid + '/rsvp', { answer: 'yes' });
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
