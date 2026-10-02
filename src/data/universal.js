/* Universal fallback engine.
 * For any city we have not hand-curated, build real, working links into national
 * directories and search tools, keyed to the person's interests. Every recipe
 * carries the same "first step / what to expect" shape as a curated org so the
 * rest of the app treats them identically.
 */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  function slug(s) {
    return FYC.normalize(s).replace(/ /g, '-');
  }
  function enc(s) {
    return encodeURIComponent(String(s || '').trim());
  }
  /** Search terms for the chosen interests, best-first. */
  function kw(ctx) {
    var t = ctx.interests
      .map(function (id) {
        return FYC.INTERESTS[id] && FYC.INTERESTS[id].search;
      })
      .filter(Boolean);
    return t.length ? t[0] : 'community';
  }

  // Each recipe: `always` ones show for everyone; the rest are interest-gated.
  var RECIPES = [
    {
      id: 'u-meetup',
      always: true,
      name: 'Meetup — groups in {city}',
      blurb: 'The biggest index of recurring local groups. Filter by your interest and sort by "newest members" — a group that is still growing is far easier to join than a settled one.',
      interests: ['social', 'newcomer'],
      link: function (ctx) {
        return 'https://www.meetup.com/find/?keywords=' + enc(kw(ctx)) + '&location=' + enc(ctx.city);
      },
      step: 'Open the search, pick ONE group, and RSVP to its next event',
      expect: [
        'Message the organiser before you go. Organisers love this and will look out for you',
        'Pick an event with 10–30 RSVPs: big enough to hide, small enough to be spoken to',
        'Recurring events beat one-offs — seeing the same faces is what turns strangers into friends',
        'Most are free or cost the price of a drink'
      ],
      solo: 5, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 1,
      when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'routine']
    },
    {
      id: 'u-library',
      always: true,
      name: 'Your public library in {city}',
      blurb: 'Free book clubs, language conversation circles, craft nights, chess, talks and maker labs — in a building nobody has to justify being in. The most underrated social infrastructure in any city.',
      interests: ['books', 'language', 'social', 'newcomer', 'crafts', 'writing'],
      link: function (ctx) {
        return 'https://duckduckgo.com/?q=' + enc(ctx.city + ' public library events calendar');
      },
      step: 'Find your nearest branch\'s events calendar and pick one thing this month',
      expect: [
        'Free, and usually no registration at all',
        'Your nearest branch is walkable, so leaving early costs you nothing',
        'Conversation circles for language learners are literally designed for strangers to talk'
      ],
      solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
      when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
    },
    {
      id: 'u-volunteermatch',
      always: true,
      name: 'VolunteerMatch — one-off shifts near {city}',
      blurb: 'Search local volunteer roles by cause and filter to one-time opportunities. A single shift is the lowest-commitment way to be in a room with people who share a value with you.',
      interests: ['volunteering', 'impact'],
      link: function (ctx) {
        return 'https://www.volunteermatch.org/search/?l=' + enc(ctx.city) + '&k=' + enc(kw(ctx));
      },
      step: 'Filter to one-time opportunities and sign up for exactly one',
      expect: [
        'One-time shifts have no ongoing obligation whatsoever',
        'Free'
      ],
      solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
      when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'medium', goals: ['impact', 'friends']
    },
    {
      id: 'u-parkrun',
      interests: ['running', 'fitness', 'outdoors', 'social'],
      name: 'parkrun — free weekly 5k',
      blurb: 'A free, timed 5k every Saturday morning in thousands of parks worldwide. Walkers are officially welcome, there is a volunteer who runs at the very back, and most people go for coffee afterwards.',
      link: function () {
        return 'https://www.parkrun.us/';
      },
      step: 'Register once (one form, valid at every parkrun on earth), print the barcode, walk up on Saturday',
      expect: [
        'Free, every single week, forever',
        'The coffee afterwards is the real event'
      ],
      solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
      when: ['weekend'], size: 'medium', goals: ['routine', 'friends']
    },
    {
      id: 'u-np',
      interests: ['fitness', 'running', 'social', 'outdoors'],
      name: 'November Project — free group workout',
      blurb: 'A free outdoor group workout built around welcoming strangers loudly and by name. It now runs in a short list of cities — check the locations page to see whether yours is one.',
      link: function () {
        return 'https://november-project.com/locations/';
      },
      step: 'Check the locations list for your city, then just turn up — there is nothing to sign or pay',
      expect: [
        'First-timers are introduced out loud. Mortifying for 20 seconds, then you know people',
        'You can walk the whole workout — nobody is timing you',
        'Free, weekly, in all weather',
        'Only a handful of cities have an active group — check the list before you plan around it'
      ],
      solo: 5, gentleness: 3, structure: 'drop-in', commitment: 'weekly', cost: 0,
      when: ['weekday-day'], size: 'large', goals: ['friends', 'routine']
    },
    {
      id: 'u-rrca',
      interests: ['running', 'fitness', 'social'],
      name: 'Find a local running club (RRCA)',
      blurb: 'The Road Runners Club of America directory lists community running clubs by state. Almost all of them have a free weekly group run open to non-members.',
      link: function () {
        return 'https://www.rrca.org/for-runners/find-a-running-club';
      },
      step: 'Find the club nearest you and email asking which weekly run suits a beginner',
      expect: [
        'Nearly every club has a free weekly run open to visitors',
        'Pace groups mean there is someone your speed',
        'Clubs are always trying to recruit — your email will be welcome'
      ],
      solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 0,
      when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends']
    },
    {
      id: 'u-foodbank',
      interests: ['volunteering', 'food'],
      name: 'Your local food bank',
      blurb: 'Feeding America\'s finder locates the food bank serving your zip code. Warehouse sorting shifts are the single most beginner-friendly volunteering that exists.',
      link: function () {
        return 'https://www.feedingamerica.org/find-your-local-foodbank';
      },
      step: 'Find your food bank, then book one sorting shift on their site',
      expect: [
        'Five minutes of training and a task you cannot get wrong',
        'Two to three hours, free, no follow-up'
      ],
      solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
      when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
    },
    {
      id: 'u-garden',
      interests: ['gardening', 'environment', 'food', 'civic'],
      name: 'Community gardens near you',
      blurb: 'The American Community Gardening Association maps community gardens. Most have open workdays and are run by neighbours who live within a few blocks of you.',
      link: function () {
        return 'https://www.communitygarden.org/garden';
      },
      step: 'Find the nearest garden and email or visit during an open workday',
      expect: [
        'You meet people who live on your actual block, which is rarer than it should be',
        'Usually free or a small annual plot fee',
        'No gardening knowledge assumed'
      ],
      solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'seasonal', cost: 0,
      when: ['weekend', 'weekday-eve'], size: 'small', goals: ['friends', 'skill', 'impact']
    },
    {
      id: 'u-audubon',
      interests: ['nature', 'outdoors', 'environment'],
      name: 'Your local bird club (Audubon near you)',
      blurb: 'Local chapters run free guided bird walks almost everywhere. Birding is slow, quiet, outdoors, and populated by people who are thrilled to explain things to beginners.',
      link: function () {
        return 'https://www.audubon.org/audubon-near-you';
      },
      step: 'Find your chapter, then sign up for a beginner walk and ask to borrow binoculars',
      expect: [
        'Loaner binoculars are often available if you ask in advance',
        'It is mostly standing still, not hiking',
        'Most walks are free and open to non-members'
      ],
      solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
      when: ['weekend', 'weekday-day'], size: 'small', goals: ['friends', 'skill']
    },
    {
      id: 'u-hackerspace',
      interests: ['making', 'tech', 'art'],
      name: 'Hackerspaces & makerspaces near you',
      blurb: 'The hackerspaces directory lists member-run workshops worldwide. Nearly all have an open night when anyone can walk in and look around.',
      link: function () {
        return 'https://wiki.hackerspaces.org/List_of_hackerspaces';
      },
      step: 'Find the nearest space and email asking when the next open night is',
      expect: [
        'Open nights exist precisely so strangers can wander in',
        '"Can you show me around?" is a sentence these spaces hear constantly',
        'Visiting is usually free; membership costs money',
        'Asking someone what they\'re building is always welcome'
      ],
      solo: 4, gentleness: 3, structure: 'drop-in', commitment: 'one-off', cost: 0,
      when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
    },
    {
      id: 'u-repaircafe',
      interests: ['making', 'environment', 'social'],
      name: 'Repair Café',
      blurb: 'Volunteer-run events where people bring broken things and fix them together. Arriving with a broken lamp does all your social work for you.',
      link: function () {
        return 'https://www.repaircafe.org/en/visit/';
      },
      step: 'Find the nearest Repair Café and bring one broken object to the next session',
      expect: [
        'You arrive with an object and a problem — instant conversation starter',
        'No skills required; you work next to someone who knows more',
        'Free or donation-based'
      ],
      solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
      when: ['weekend'], size: 'small', goals: ['skill', 'friends', 'impact']
    },
    {
      id: 'u-lgbtcenter',
      interests: ['lgbtq', 'support', 'social', 'newcomer'],
      name: 'Your nearest LGBTQ+ community center',
      blurb: 'CenterLink maps LGBTQ+ community centers across the country. They exist specifically so that people can walk in knowing nobody.',
      link: function () {
        return 'https://www.lgbtqcenters.org/LGBTCenters';
      },
      step: 'Find your nearest center, then pick one free drop-in group from its calendar',
      expect: [
        'Most programs are free and drop-in',
        'Front-desk staff are used to "I don\'t know anyone here"',
        'A large share of people there arrived alone'
      ],
      solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
      when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'routine']
    },
    {
      id: 'u-nami',
      interests: ['support'],
      name: 'NAMI peer support groups',
      blurb: 'Free, confidential peer-led support groups for mental health, run by local NAMI affiliates in most of the country — for people struggling and for family members.',
      link: function () {
        return 'https://www.nami.org/Support-Education/Support-Groups/';
      },
      step: 'Find your local affiliate and check the schedule for a group that fits',
      expect: [
        'Free and confidential',
        'Peer-led, not clinical — the facilitator has been through it too',
        'You can attend and say nothing at all',
        'Many affiliates run online groups if leaving the house is the hard part'
      ],
      solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
      when: ['weekday-eve'], size: 'small', goals: ['friends', 'routine']
    },
    {
      id: 'u-toastmasters',
      interests: ['social', 'writing', 'newcomer'],
      name: 'Toastmasters',
      blurb: 'Public-speaking clubs that meet weekly almost everywhere. Deeply structured meetings, guests always welcome, and the format means you are spoken to whether or not you can make small talk.',
      link: function (ctx) {
        return 'https://www.toastmasters.org/find-a-club?t=' + enc(ctx.city);
      },
      step: 'Find a nearby club and email the VP of Membership to visit as a guest',
      expect: [
        'Guests can attend free and are not required to speak',
        'The meeting has an agenda, which removes all unstructured social anxiety',
        'You will be introduced and welcomed as a matter of club procedure',
        'Weekly rhythm with the same people is what builds the familiarity'
      ],
      solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
      when: ['weekday-day', 'weekday-eve'], size: 'small', goals: ['skill', 'friends', 'routine']
    },
    {
      id: 'u-buynothing',
      interests: ['civic', 'social', 'environment', 'newcomer'],
      name: 'Buy Nothing group for your neighborhood',
      blurb: 'Hyper-local gift economy groups. You give away a chair and meet the person three streets over — the lowest-effort way to know faces in your actual neighbourhood.',
      link: function () {
        return 'https://buynothingproject.org/find-a-group';
      },
      step: 'Join your neighbourhood group and give one thing away this week',
      expect: [
        'Doorstep handovers are a two-minute, perfectly scripted interaction',
        'You accumulate familiar faces without attending anything',
        'Completely free, by design',
        'Good for people who find events exhausting'
      ],
      solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
      when: ['flexible'], size: 'small', goals: ['friends', 'impact']
    },
    {
      id: 'u-ccl',
      interests: ['environment', 'civic'],
      name: "Citizens' Climate Lobby chapter",
      blurb: 'Local volunteer chapters meeting monthly across the country, with a famously structured and welcoming onboarding for people who have never done advocacy.',
      link: function () {
        return 'https://citizensclimatelobby.org/chapters/';
      },
      step: 'Find your chapter and come to one monthly meeting',
      expect: [
        'Monthly meetings are a very low-commitment rhythm',
        'New people are formally welcomed and given an onboarding call if they want one',
        'Free',
        'You are given concrete tasks only if you ask for them'
      ],
      solo: 4, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
      when: ['weekday-eve', 'weekend'], size: 'small', goals: ['impact', 'friends']
    },
    {
      id: 'u-habitat',
      interests: ['volunteering', 'making', 'civic'],
      name: 'Habitat for Humanity build day',
      blurb: 'Local affiliates run build days and ReStore shifts. A full day on a site with the same crew, doing physical work, with all tools and training supplied.',
      link: function () {
        return 'https://www.habitat.org/volunteer';
      },
      step: 'Find your local affiliate and sign up for one build day',
      expect: [
        'No construction experience needed — most volunteers have none',
        'A full day with the same small crew beats a one-hour event for actually meeting people',
        'Free, tools and safety gear provided',
        'ReStore shifts are the indoor, lower-intensity version'
      ],
      solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
      when: ['weekday-day', 'weekend'], size: 'medium', goals: ['impact', 'skill', 'friends']
    },
    {
      id: 'u-shelter',
      interests: ['animals', 'volunteering'],
      name: 'Animal shelters & rescues near you',
      blurb: 'Petfinder\'s directory lists local shelters and rescues. Dog-walking and cat-socialising shifts are a rare kind of volunteering where the animal carries the social load.',
      link: function (ctx) {
        return 'https://www.petfinder.com/animal-shelters-and-rescues/search/?location=' + enc(ctx.city);
      },
      step: 'Find a shelter near you and ask about their volunteer orientation',
      expect: [
        'Expect an orientation and often a minimum commitment — shelters invest in training you',
        'You work alongside regular volunteers who see each other weekly',
        'Free',
        'Animals make an excellent excuse for not talking when you don\'t feel like it'
      ],
      solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
      when: ['weekday-day', 'weekend'], size: 'small', goals: ['impact', 'routine', 'friends']
    },
    {
      id: 'u-bbbs',
      interests: ['mentoring', 'volunteering'],
      name: 'Mentoring a young person',
      blurb: 'Big Brothers Big Sisters and similar programs match you with one young person for regular, low-key time together. Highly structured, heavily supported.',
      link: function () {
        return 'https://www.bbbs.org/get-involved/';
      },
      step: 'Start an enquiry with your local agency',
      expect: [
        'Expect a real application, background check and interview — this is a serious commitment',
        'Agencies support the match with a caseworker, so you are never on your own',
        'Usually a commitment of a year and a couple of hours a month',
        'Free to you'
      ],
      solo: 5, gentleness: 4, structure: 'register', commitment: 'seasonal', cost: 0,
      when: ['flexible'], size: 'small', goals: ['impact']
    },
    {
      id: 'u-redcross',
      interests: ['volunteering', 'support', 'civic'],
      name: 'American Red Cross volunteering',
      blurb: 'Structured volunteer roles from blood-drive support to disaster response teams, with training provided and local chapters everywhere.',
      link: function () {
        return 'https://www.redcross.org/volunteer/become-a-volunteer.html';
      },
      step: 'Browse local roles and apply for one',
      expect: [
        'Training is provided for every role',
        'Roles range from a few hours at a blood drive to on-call response teams',
        'Expect an application process rather than instant sign-up',
        'Free'
      ],
      solo: 5, gentleness: 4, structure: 'register', commitment: 'weekly', cost: 0,
      when: ['flexible'], size: 'large', goals: ['impact', 'skill']
    },
    {
      id: 'u-sierra',
      interests: ['outdoors', 'environment', 'nature'],
      name: 'Sierra Club local outings',
      blurb: 'Local chapters run volunteer-led hikes, paddles and conservation outings that are open to the public and graded by difficulty.',
      link: function () {
        return 'https://www.sierraclub.org/outings/local';
      },
      step: 'Find your chapter\'s outings list and sign up for an easy one',
      expect: [
        'Outings are led by volunteers who state the difficulty honestly',
        'Coming alone is standard',
        'Usually free or a small fee',
        'A few hours walking beside someone is a lot of conversation'
      ],
      solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
      when: ['weekend'], size: 'medium', goals: ['friends', 'routine']
    },
    {
      id: 'u-eventbrite',
      interests: ['music', 'theater', 'art', 'filmphoto', 'food', 'games', 'dance', 'books'],
      name: 'Eventbrite — what\'s on in {city}',
      blurb: 'Good for one-off classes, workshops, gigs and tastings. A ticketed event with a defined end time is the easiest kind of thing to attend alone.',
      link: function (ctx) {
        return 'https://www.eventbrite.com/d/' + slug(ctx.city) + '/' + slug(kw(ctx)) + '/';
      },
      step: 'Buy one ticket for something with a clear start and end time',
      expect: [
        'Recurring series are worth more than one-off events — go back a second time',
        'Costs vary; filter by free if budget matters',
        'A defined end time means you always have an exit'
      ],
      solo: 5, gentleness: 4, structure: 'register', commitment: 'one-off', cost: 1,
      when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
    },
    {
      id: 'u-conversationexchange',
      interests: ['language', 'newcomer', 'social'],
      name: 'Language exchange in {city}',
      blurb: 'Conversation Exchange pairs you with someone locally who wants to practise your language while you practise theirs. A coffee with a built-in agenda.',
      link: function (ctx) {
        return 'https://www.conversationexchange.com/?city=' + enc(ctx.city);
      },
      step: 'Set up a profile and message two people offering to meet for coffee',
      expect: [
        'The half-and-half format means neither person has to carry the conversation',
        'Meeting in a cafe is a naturally time-limited first meeting',
        'Free'
      ],
      solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'one-off', cost: 1,
      when: ['flexible'], size: 'small', goals: ['friends', 'skill']
    },
    {
      id: 'u-reddit',
      interests: ['social', 'newcomer', 'games', 'tech'],
      name: 'Your city\'s subreddit & local Discords',
      blurb: 'Most cities have an active subreddit with weekly "who wants to hang out" threads, plus linked Discord servers for hobbies. A useful low-stakes place to lurk first.',
      link: function (ctx) {
        return 'https://www.reddit.com/search/?q=' + enc(ctx.city) + '&type=sr';
      },
      step: 'Find your city subreddit, read the weekly social thread, and reply to one post',
      expect: [
        'Lurking first is expected and costs nothing',
        'Weekly social threads exist in most large city subreddits',
        'Meet in public places, and tell someone where you are going',
        'Free'
      ],
      solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
      when: ['flexible'], size: 'large', goals: ['friends']
    },
    {
      id: 'u-parksrec',
      interests: ['sports', 'fitness', 'dance', 'art', 'crafts', 'social', 'parents'],
      name: 'City parks & recreation programs in {city}',
      blurb: 'Municipal rec departments run the cheapest adult classes and drop-in sports in any city — pottery, volleyball, swimming, dance. Seasonal terms mean you see the same people for weeks.',
      link: function (ctx) {
        return 'https://duckduckgo.com/?q=' + enc(ctx.city + ' parks and recreation adult classes drop-in');
      },
      step: 'Find your city\'s rec catalogue and register for one seasonal class',
      expect: [
        'Far cheaper than private studios — often under $100 for a whole term',
        'The same faces every week for 8–10 weeks is the actual mechanism of friendship',
        'Adult beginner sections exist for nearly everything',
        'Register early; the good ones fill up'
      ],
      solo: 4, gentleness: 4, structure: 'register', commitment: 'seasonal', cost: 1,
      when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends', 'skill']
    },
    {
      id: 'u-faith',
      interests: ['faith', 'social', 'newcomer'],
      name: 'A congregation with a newcomers table',
      blurb: 'Whatever your tradition, look for congregations that advertise a newcomers or "coffee hour" ministry — that phrase means someone\'s actual job is to talk to you.',
      link: function (ctx) {
        return 'https://duckduckgo.com/?q=' + enc(ctx.city + ' congregation newcomers welcome visitors');
      },
      step: 'Pick one, go once, and stay for the coffee afterwards',
      expect: [
        'The coffee hour after the service is where the community actually is',
        'Most congregations have someone designated to greet new faces',
        'Free; donations are never required of visitors',
        'Visiting once obliges you to nothing'
      ],
      solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 0,
      when: ['weekend'], size: 'medium', goals: ['friends', 'routine']
    },
    {
      id: 'u-parents',
      interests: ['parents', 'social'],
      name: 'Parent groups & library storytime in {city}',
      blurb: 'Library storytimes, playgroups and local parent networks. Having a child with you removes almost all of the awkwardness of talking to strangers.',
      link: function (ctx) {
        return 'https://duckduckgo.com/?q=' + enc(ctx.city + ' library storytime playgroup parents group');
      },
      step: 'Go to one library storytime and talk to one other adult there',
      expect: [
        'Storytimes are free, weekly and drop-in',
        'Other parents are usually just as keen to talk to an adult',
        'The children provide the entire conversational agenda',
        'Same time every week means you recognise faces quickly'
      ],
      solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
      when: ['weekday-day', 'weekend'], size: 'small', goals: ['friends', 'routine']
    }
  ];

  /**
   * Build org-shaped results for a non-curated city.
   * @param {string} city    free-text city the person typed
   * @param {string[]} interests  selected interest ids
   */
  FYC.buildUniversal = function (city, interests) {
    var ctx = { city: city || 'your city', interests: interests || [] };
    var picked = RECIPES.filter(function (r) {
      if (r.always) return true;
      return (r.interests || []).some(function (i) {
        return ctx.interests.indexOf(i) !== -1;
      });
    });
    return picked.map(function (r) {
      var url = r.link(ctx);
      return {
        id: r.id,
        universal: true,
        name: r.name.replace('{city}', ctx.city),
        cityName: ctx.city,
        neighborhood: 'Nationwide directory',
        blurb: r.blurb,
        interests: r.interests || [],
        url: url,
        firstStep: { kind: 'search', label: r.step, url: url, when: '' },
        expect: r.expect,
        solo: r.solo, gentleness: r.gentleness, structure: r.structure,
        commitment: r.commitment, cost: r.cost, when: r.when,
        size: r.size, goals: r.goals
      };
    });
  };

  FYC.RECIPES = RECIPES;
})(typeof globalThis !== 'undefined' ? globalThis : this);
