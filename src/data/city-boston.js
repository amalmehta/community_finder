/* Curated communities — Boston. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'bos',
    name: 'Boston',
    region: 'MA',
    aliases: ['boston', 'bos', 'cambridge', 'somerville', 'brookline', 'greater boston', 'jamaica plain', 'allston'],
    orgs: [
      {
        id: 'bos-np',
        name: 'November Project Boston',
        neighborhood: 'Harvard Stadium & rotating',
        blurb: 'The original November Project: a free outdoor group workout at dawn, all levels, built entirely around welcoming strangers loudly and by name.',
        interests: ['fitness', 'running', 'social', 'outdoors'],
        url: 'https://november-project.com/boston/',
        firstStep: {
          kind: 'dropin',
          label: 'Just show up — nothing to sign, nothing to pay',
          url: 'https://november-project.com/boston/',
          when: 'Wednesday mornings (check the site for this week\'s location)'
        },
        script: null,
        expect: [
          'First-timers raise a hand and get cheered at — mortifying for 20 seconds, then you know people',
          'The stadium stairs are brutal and nobody cares how slowly you do them',
          'Free, weekly, in all weather. This is where the whole thing started',
          'Everyone hugs. Consider yourself warned'
        ],
        solo: 5, gentleness: 3, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'bos-gbfb',
        name: 'Greater Boston Food Bank',
        neighborhood: 'Newmarket',
        blurb: 'Warehouse shifts sorting and packing food for the region. Simple, physical, obviously useful, and done shoulder to shoulder with a room full of people.',
        interests: ['volunteering', 'food'],
        url: 'https://www.gbfb.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book a single volunteer shift',
          url: 'https://www.gbfb.org/volunteer/',
          when: 'Day and evening shifts most days'
        },
        script: null,
        expect: [
          'Individuals sign up constantly — you will not be the only person alone',
          'Short training, then a task you cannot get wrong',
          'Two to three hours, complete in itself, no follow-up expected',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'bos-bostoncares',
        name: 'Boston Cares',
        neighborhood: 'Citywide',
        blurb: 'The city\'s clearing house for one-off volunteer projects — tutoring, meal service, park cleanups — each run by a trained volunteer leader whose job is to welcome you.',
        interests: ['volunteering', 'social', 'mentoring', 'civic'],
        url: 'https://www.bostoncares.org/',
        firstStep: {
          kind: 'signup',
          label: 'Do the orientation, then claim one project',
          url: 'https://www.bostoncares.org/',
          when: 'Projects daily, including evenings and weekends'
        },
        script: null,
        expect: [
          'Every project has a leader who expects people arriving alone',
          'You pick one project at a time — no ongoing obligation',
          'Hundreds of options a month, so something will fit your schedule',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'bos-artisans',
        name: "Artisan's Asylum",
        neighborhood: 'Allston',
        blurb: 'An enormous community makerspace — welding, woodworking, electronics, textiles, bikes — with classes and tours open to people who are not members.',
        interests: ['making', 'tech', 'art', 'crafts'],
        url: 'https://artisansasylum.com/',
        firstStep: {
          kind: 'visit',
          label: 'Take a tour or a one-off intro class',
          url: 'https://artisansasylum.com/',
          when: 'Tours and classes through the month'
        },
        script: 'Hi — I\'m interested in {interest} and I\'m a beginner. When\'s the next tour, and is there a one-off class that suits someone who has never used any of this equipment?',
        expect: [
          'A tour is a zero-commitment way to see it without having to join anything',
          'Members like being asked what they are building',
          'Classes and membership cost money; a tour does not',
          'The scale of the place is the point — go and gawk'
        ],
        solo: 4, gentleness: 4, structure: 'register', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['skill', 'friends']
      },
      {
        id: 'bos-bpl',
        name: 'Boston Public Library',
        neighborhood: 'Copley + branches citywide',
        blurb: 'Free book groups, ESOL conversation circles, writing groups, craft nights, storytimes and talks — in a building that is itself worth the trip.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'parents'],
        url: 'https://www.bpl.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your nearest branch',
          url: 'https://www.bpl.org/events/',
          when: 'Daily, including evenings and weekends'
        },
        script: null,
        expect: [
          'Free, and mostly no registration at all',
          'Conversation circles for English learners exist so strangers talk to each other',
          'Your nearest branch is walkable, so leaving early costs nothing',
          'Nobody asks why you came'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'bos-cyclists',
        name: 'Boston Cyclists Union',
        neighborhood: 'Citywide',
        blurb: 'Advocacy plus group rides and free classes for people who find Boston traffic terrifying — which is a reasonable position to hold about Boston traffic.',
        interests: ['cycling', 'civic', 'environment', 'social'],
        url: 'https://bostoncyclistsunion.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a group ride or a confidence class',
          url: 'https://bostoncyclistsunion.org/',
          when: 'Rides and events through the riding season'
        },
        script: 'Hi! I\'d like to ride more but I\'m nervous in traffic. Is there a class or a slow group ride coming up that would suit someone just starting?',
        expect: [
          'Classes exist specifically for anxious riders',
          'A group of fifteen people is visible in a way you alone are not',
          'Usually free or low-cost',
          'A shared route removes the need to invent conversation'
        ],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['skill', 'friends', 'impact']
      },
      {
        id: 'bos-amc',
        name: 'AMC Boston Chapter',
        neighborhood: 'Trips across New England',
        blurb: 'The Appalachian Mountain Club\'s Boston chapter runs hundreds of volunteer-led hikes, paddles and ski trips a year, graded by difficulty, many of them deliberately beginner-friendly.',
        interests: ['outdoors', 'nature', 'fitness', 'social'],
        url: 'https://www.outdoors.org/',
        firstStep: {
          kind: 'register',
          label: 'Sign up for one easy, beginner-rated trip',
          url: 'https://www.outdoors.org/',
          when: 'Trips year-round, most on weekends'
        },
        script: 'Hi! I\'m new to this and I\'ll be coming on my own. Which upcoming trip would you recommend for a beginner who isn\'t especially fit?',
        expect: [
          'Trips are graded honestly — pick an easy one and you will be fine',
          'Leaders are volunteers who enjoy taking beginners out',
          'Coming alone is the normal way people join',
          'Some trips are free; membership is modest'
        ],
        solo: 5, gentleness: 4, structure: 'register', commitment: 'one-off', cost: 1,
        when: ['weekend'], size: 'large', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'bos-mspca',
        name: 'MSPCA-Angell',
        neighborhood: 'Jamaica Plain',
        blurb: 'The city\'s best-known animal shelter, with a volunteer programme covering dog walking, cat socialising and adoption events.',
        interests: ['animals', 'volunteering'],
        url: 'https://www.mspca.org/',
        firstStep: {
          kind: 'signup',
          label: 'Apply and attend a volunteer orientation',
          url: 'https://www.mspca.org/',
          when: 'Orientations regularly; shifts most days'
        },
        script: null,
        expect: [
          'Expect an application and training before your first shift',
          'The animals do the social work for you',
          'Recurring shifts mean the same volunteers each week',
          'Free, with a minimum commitment once trained'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'medium', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'bos-improvasylum',
        name: 'Improv Asylum',
        neighborhood: 'North End',
        blurb: 'Improv theatre and school with a beginner level-one class full of adults who have never done it and are quietly terrified. That shared terror is the bonding mechanism.',
        interests: ['theater', 'social'],
        url: 'https://www.improvasylum.com/',
        firstStep: {
          kind: 'register',
          label: 'See a cheap show first, then book Level 1',
          url: 'https://www.improvasylum.com/',
          when: 'Shows most nights; classes in terms'
        },
        script: null,
        expect: [
          'Level 1 assumes zero experience and no public performance early on',
          'You will learn a dozen names in a single evening',
          'Classes cost money — a show is cheap reconnaissance first',
          'Everyone is equally bad for the first twenty minutes, then it stops mattering'
        ],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'bos-massaudubon',
        name: 'Mass Audubon',
        neighborhood: 'Sanctuaries around Greater Boston',
        blurb: 'Guided bird walks and nature programmes at sanctuaries across the region. Slow, quiet, outdoors, and full of people delighted to explain things to beginners.',
        interests: ['nature', 'outdoors', 'environment'],
        url: 'https://www.massaudubon.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a beginner bird walk or a sanctuary programme',
          url: 'https://www.massaudubon.org/',
          when: 'Weekend and weekday mornings, best in spring and fall'
        },
        script: 'Hello — I\'m a complete beginner and don\'t own binoculars. Is the next walk suitable for me, and do you have loaner pairs?',
        expect: [
          'Beginner walks are a standing category — you are the intended guest',
          'Loaner binoculars are often available if you ask when booking',
          'Mostly standing still rather than hiking',
          'Small fee for some programmes; sanctuary walks are often free'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'bos-cmcb',
        name: 'Community Music Center of Boston',
        neighborhood: 'South End',
        blurb: 'Sliding-scale music school with adult group classes and ensembles for people who are not musicians and have no plans to become one.',
        interests: ['music', 'social'],
        url: 'https://cmcb.org/',
        firstStep: {
          kind: 'email',
          label: 'Ask which adult group classes take absolute beginners',
          url: 'https://cmcb.org/',
          when: 'Terms start a few times a year'
        },
        script: 'Hi — I\'m an adult beginner interested in {interest}. Which group classes or ensembles take people with no background, and how does the sliding scale work?',
        expect: [
          'Sliding-scale pricing is real and asking about it is normal',
          'Adult beginner groups are not full of former prodigies',
          'An ensemble is a weekly commitment with the same people — the thing that builds friendship',
          'No audition for the community groups'
        ],
        solo: 4, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'bos-cimc',
        name: 'Cambridge Insight Meditation Center',
        neighborhood: 'Cambridge',
        blurb: 'A secular-leaning meditation centre with drop-in sittings and introductory courses that explain, out loud, exactly what to do.',
        interests: ['stillness', 'faith', 'support'],
        url: 'https://www.cimc.info/',
        firstStep: {
          kind: 'visit',
          label: 'Go to one drop-in sitting or an introduction course',
          url: 'https://www.cimc.info/',
          when: 'Sittings most weeks; courses through the year'
        },
        script: 'Hi — I\'ve never meditated in a group before. Is the drop-in sitting open to complete beginners, and what should I expect on a first visit?',
        expect: [
          'Instructions are spoken aloud, so you always know what to do',
          'Silence means you are not required to talk to anyone',
          'By donation — nobody checks what you give',
          'You may sit on a chair; no particular posture is required'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'bos-brattle',
        name: 'The Brattle Theatre',
        neighborhood: 'Harvard Square, Cambridge',
        blurb: 'A beloved repertory cinema running themed series and festivals, with volunteer opportunities and an audience that actually talks about the film afterwards.',
        interests: ['filmphoto', 'art', 'volunteering', 'social'],
        url: 'https://www.brattlefilm.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Go to one screening, or ask about volunteering',
          url: 'https://www.brattlefilm.org/',
          when: 'Screenings most nights'
        },
        script: 'Hi! I\'d like to get more involved. Do you take volunteers, and is there a regular series that draws the same crowd each week?',
        expect: [
          'A screening is the classic thing you can do alone without it being strange',
          'Recurring series bring back the same faces',
          'Tickets are cheap; volunteering is free and usually comes with screenings',
          'The conversation afterwards has a built-in subject'
        ],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'bos-theateroffensive',
        name: 'The Theater Offensive',
        neighborhood: 'Roxbury / citywide',
        blurb: 'Queer and trans theatre company running free community programmes, workshops and performances \u2014 a place to be in a room with other LGBTQ+ people around a shared activity rather than a bar.',
        interests: ['lgbtq', 'theater', 'art', 'social', 'newcomer'],
        url: 'https://thetheateroffensive.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Go to one performance or community event',
          url: 'https://thetheateroffensive.org/',
          when: 'Programmes and performances through the year'
        },
        script: 'Hi \u2014 I\'m new to Boston and looking for queer community. Are your events open to people who haven\'t been before, and is there one coming up you\'d recommend?',
        expect: [
          'A performance gives you somewhere to look and something to talk about afterwards',
          'Many community events are free',
          'Workshops put you in a small group with a shared task',
          'Coming alone is normal'
        ],
        solo: 5, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
