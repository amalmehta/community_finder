/* Curated communities — San Diego. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'sd',
    name: 'San Diego',
    region: 'CA',
    aliases: ['san diego', 'sd', 'north park', 'la jolla', 'oceanside', 'chula vista', 'encinitas', 'pacific beach'],
    orgs: [
      {
        id: 'sd-foodbank',
        name: 'San Diego Food Bank',
        neighborhood: 'Miramar warehouse + North County',
        blurb: 'Warehouse shifts sorting and packing food for the county. Simple, physical, obviously useful, and done beside a room full of other people.',
        interests: ['volunteering', 'food'],
        url: 'https://sandiegofoodbank.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book a single volunteer shift',
          url: 'https://sandiegofoodbank.org/volunteer/',
          when: 'Morning and afternoon shifts most days'
        },
        script: null,
        expect: [
          'Signing up alone is completely normal',
          'Brief training, then a task you cannot get wrong',
          'Two to three hours, complete in itself',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'sd-library',
        name: 'San Diego Public Library',
        neighborhood: '35+ branches',
        blurb: 'Free book clubs, conversation groups for English learners, writing workshops, craft nights, storytimes and talks — plus a central library worth visiting on its own.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'parents'],
        url: 'https://www.sandiego.gov/public-library',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your nearest branch',
          url: 'https://www.sandiego.gov/public-library',
          when: 'Daily'
        },
        script: null,
        expect: [
          'Free, and usually no registration',
          'Your branch is close enough that leaving early costs nothing',
          'Conversation groups are designed around strangers talking to each other',
          'Nobody asks why you came'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'sd-fablab',
        name: 'Fab Lab San Diego',
        neighborhood: 'Barrio Logan',
        blurb: 'A community fabrication lab with laser cutters, 3D printers and electronics, running workshops and open hours for people who are not members.',
        interests: ['making', 'tech', 'art', 'crafts'],
        url: 'https://fablabsd.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come to open hours or take a beginner workshop',
          url: 'https://fablabsd.org/',
          when: 'Open hours and workshops through the month'
        },
        script: 'Hi — I\'m interested in {interest} and a complete beginner. When are your open hours, and is there a workshop that suits someone who has never used this equipment?',
        expect: [
          'Open hours exist so non-members can come and look',
          'Asking what someone is building is always welcome',
          'Visiting is usually free; workshops and materials cost money',
          'Nobody expects you to arrive knowing anything'
        ],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'sd-center',
        name: 'The San Diego LGBT Community Center',
        neighborhood: 'Hillcrest',
        blurb: 'Free drop-in groups most days — social, support, youth, trans, elders — in a building whose entire purpose is that you can walk in knowing nobody.',
        interests: ['lgbtq', 'social', 'support', 'newcomer'],
        url: 'https://thecentersd.org/',
        firstStep: {
          kind: 'visit',
          label: 'Pick one free group from the calendar and go',
          url: 'https://thecentersd.org/',
          when: 'Programs most days'
        },
        script: 'Hi — I\'m new to San Diego and looking for community. Is the {interest} group open to drop-ins, or should I register first?',
        expect: [
          'Most programs are free and drop-in',
          'Staff expect people who say "I don\'t know anyone here"',
          'Hillcrest means you can combine it with somewhere to go afterwards',
          'A lot of people there arrived alone'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'sd-humane',
        name: 'San Diego Humane Society',
        neighborhood: 'Campuses countywide',
        blurb: 'Large shelter network with a well-run volunteer programme — dog walking, cat socialising, fostering and adoption events, with proper training first.',
        interests: ['animals', 'volunteering'],
        url: 'https://www.sdhumane.org/',
        firstStep: {
          kind: 'signup',
          label: 'Apply and book a volunteer orientation',
          url: 'https://www.sdhumane.org/volunteer/',
          when: 'Orientations regularly; shifts most days'
        },
        script: null,
        expect: [
          'Application and orientation come before your first shift',
          'The animals do the social work for you',
          'Recurring shifts mean the same volunteers each week',
          'Free, with a minimum commitment once trained'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'sd-improv',
        name: 'Finest City Improv',
        neighborhood: 'North Park',
        blurb: 'Improv theatre and school with cheap shows and a level-one class made up entirely of people who have never done it before.',
        interests: ['theater', 'social'],
        url: 'https://finestcityimprov.com/',
        firstStep: {
          kind: 'register',
          label: 'Watch a cheap show, then sign up for Level 1',
          url: 'https://finestcityimprov.com/',
          when: 'Shows most weekends; classes in terms'
        },
        script: null,
        expect: [
          'Level 1 assumes nothing and has no public performance early on',
          'You will be on first-name terms with a dozen people within two sessions',
          'Classes cost money; a show is cheap reconnaissance',
          'Everyone is equally uncomfortable for the first twenty minutes'
        ],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'sd-cleansd',
        name: 'I Love A Clean San Diego',
        neighborhood: 'Beaches, canyons & creeks countywide',
        blurb: 'Runs cleanups across the county year-round, including the enormous Coastal Cleanup Day. A couple of hours outdoors with a clear task and no small talk required.',
        interests: ['environment', 'outdoors', 'volunteering'],
        url: 'https://cleansd.org/',
        firstStep: {
          kind: 'signup',
          label: 'Join one cleanup near you',
          url: 'https://cleansd.org/',
          when: 'Cleanups most weekends'
        },
        script: null,
        expect: [
          'Bags, gloves and instructions are handed to you on arrival',
          'Two to three hours, finished by lunchtime',
          'Free, and you end up somewhere beautiful either way',
          'People come alone constantly'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'sd-audubon',
        name: 'San Diego Audubon',
        neighborhood: 'Reserves across the county',
        blurb: 'Free guided bird walks in one of the richest birding regions in the country. Slow, quiet, outdoors, and full of people delighted to explain things.',
        interests: ['nature', 'outdoors', 'environment'],
        url: 'https://www.sandiegoaudubon.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a beginner bird walk',
          url: 'https://www.sandiegoaudubon.org/',
          when: 'Weekend and weekday mornings'
        },
        script: 'Hello — I\'m a complete beginner and don\'t own binoculars. Is your next walk suitable for me, and do you have loaner pairs?',
        expect: [
          'Beginner walks are a standing offering — you are the intended guest',
          'Loaner binoculars are often available if you ask when booking',
          'Mostly standing still rather than hiking',
          'Most walks are free and open to non-members'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'sd-bike',
        name: 'San Diego County Bicycle Coalition',
        neighborhood: 'Countywide',
        blurb: 'Advocacy plus group rides and classes, including ones aimed squarely at people who have never ridden in traffic and would rather not start alone.',
        interests: ['cycling', 'civic', 'environment', 'social'],
        url: 'https://sdbikecoalition.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a group ride or a confidence class',
          url: 'https://sdbikecoalition.org/',
          when: 'Rides and classes through the year'
        },
        script: 'Hi! I\'d like to ride more but I\'m nervous in traffic. Is there a class or a relaxed group ride coming up that suits a beginner?',
        expect: [
          'Classes exist specifically for anxious riders',
          'Rides state their pace up front, and nobody gets dropped',
          'Usually free or low-cost',
          'The weather means this works year-round here'
        ],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['skill', 'friends', 'impact']
      },
      {
        id: 'sd-dharmabums',
        name: 'The Dharma Bum Temple',
        neighborhood: 'Bankers Hill',
        blurb: 'A deliberately beginner-focused Buddhist temple whose entire premise is introducing newcomers — free classes, free meditation and no expectation that you join anything.',
        interests: ['stillness', 'faith', 'support', 'social'],
        url: 'https://thedharmabums.org/',
        firstStep: {
          kind: 'visit',
          label: 'Go to a free beginner meditation session',
          url: 'https://thedharmabums.org/',
          when: 'Sessions and classes through the week'
        },
        script: 'Hi — I\'ve never meditated before and I\'m not Buddhist. Is the beginner session right for me, and is there anything I should know before coming?',
        expect: [
          'Being a complete beginner is the assumed starting point, not an exception',
          'Free, and you are not asked to convert to anything',
          'Instructions are spoken aloud throughout',
          'They actively point newcomers to other local groups too'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'sd-athenaeum',
        name: 'Athenaeum Music & Arts Library',
        neighborhood: 'La Jolla',
        blurb: 'A members\' music and arts library running concerts, lectures and art classes — an unusually civilised place to turn up alone and sit among people.',
        interests: ['music', 'art', 'books', 'social'],
        url: 'https://ljathenaeum.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Go to one concert or lecture, or book an art class',
          url: 'https://ljathenaeum.org/',
          when: 'Concerts, lectures and classes through the year'
        },
        script: 'Hi! I\'m interested in {interest} and new to the area. Are concerts and classes open to non-members, and which would you suggest for a first visit?',
        expect: [
          'A concert is something you can attend alone without it being odd',
          'Art classes put you in a small group with a shared task',
          'Tickets and classes cost money; members pay less',
          'The building itself is a reason to go'
        ],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'sd-mediaarts',
        name: 'Media Arts Center San Diego',
        neighborhood: 'Digital Gym Cinema, El Cajon Blvd',
        blurb: 'Independent cinema plus filmmaking classes and youth programmes, with volunteer roles at screenings and the San Diego Latino Film Festival.',
        interests: ['filmphoto', 'art', 'volunteering', 'social'],
        url: 'https://mediaartscenter.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Go to one screening, or ask about volunteering',
          url: 'https://mediaartscenter.org/',
          when: 'Screenings most nights; festival is seasonal'
        },
        script: 'Hi! I\'d like to get involved. I\'m interested in {interest} — do you take volunteers at screenings or the festival, and what\'s the first step?',
        expect: [
          'A screening is a defined, time-boxed thing you can do alone',
          'Festival volunteering puts you on a team for a fortnight',
          'Tickets are cheap; volunteering is free',
          'Classes exist if you want to make things rather than watch them'
        ],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'impact']
      },
      {
        id: 'sd-canyonlands',
        name: 'San Diego Canyonlands',
        neighborhood: 'Canyons across the city',
        blurb: 'Restoration workdays and trail building in the canyons that run through San Diego\'s neighbourhoods — outdoors, hands busy, easy conversation.',
        interests: ['outdoors', 'environment', 'volunteering', 'gardening', 'nature'],
        url: 'https://sdcanyonlands.org/',
        firstStep: {
          kind: 'signup',
          label: 'Join one canyon workday',
          url: 'https://sdcanyonlands.org/',
          when: 'Weekend mornings through the year'
        },
        script: null,
        expect: [
          'Tools, gloves and instructions are provided',
          'Small crews mean you talk to the same few people all morning',
          'Free, a few hours, no follow-up expected',
          'You discover canyons ten minutes from your house that you never knew existed'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'sd-trackclub',
        name: 'San Diego Track Club',
        neighborhood: 'Group runs across the county',
        blurb: 'A long-running club with free weekly group runs at a range of paces and beginner training programmes. Turning up alone is the standard way people join.',
        interests: ['running', 'fitness', 'outdoors', 'social'],
        url: 'https://sdtc.com/',
        firstStep: {
          kind: 'dropin',
          label: 'Turn up to a weekly group run',
          url: 'https://sdtc.com/',
          when: 'Weekday evenings and weekend mornings'
        },
        script: 'Hi! I\'m new and fairly slow. Which of your group runs is the most beginner-friendly, and do I need to be a member to come along?',
        expect: [
          'Pace groups mean there is always someone your speed',
          'Weekly runs are usually free and open to non-members',
          'Training programmes run in multi-week blocks with the same people',
          'Running beside someone is easier than talking across a table'
        ],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'sd-parksrec',
        name: 'San Diego Parks & Recreation',
        neighborhood: 'Rec centres citywide',
        blurb: 'City-run recreation centres with cheap adult classes and drop-in sports \u2014 dance, volleyball, basketball, pickleball, fitness \u2014 in nearly every neighbourhood.',
        interests: ['sports', 'dance', 'fitness', 'social', 'art'],
        url: 'https://www.sandiego.gov/parks-and-recreation',
        firstStep: {
          kind: 'register',
          label: 'Find your nearest rec centre and register for one class or drop-in session',
          url: 'https://www.sandiego.gov/parks-and-recreation',
          when: 'Drop-in sessions weekly; classes run seasonally'
        },
        script: null,
        expect: [
          'Drop-in sessions cost a few dollars and need no commitment',
          'Seasonal classes mean the same faces for eight to ten weeks, which is how friendships actually form',
          'Adult beginner sections exist for most activities',
          'Your nearest centre is probably closer than you think'
        ],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend', 'weekday-day'], size: 'medium', goals: ['routine', 'friends', 'skill']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
