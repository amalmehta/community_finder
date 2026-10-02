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
        expect: [
          'First-timers raise a hand and get cheered at — mortifying for 20 seconds, then you know people',
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
        expect: [
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
        expect: [
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
        expect: [
          'Classes exist specifically for anxious riders',
          'A group of fifteen people is visible in a way you alone are not',
          'Usually free or low-cost'
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
        expect: [
          'Some trips are free; membership is modest',
          'Trips are graded honestly — pick an easy one and you will be fine'
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
        expect: [
          'Expect an application and training before your first shift',
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
        expect: [
          'Level 1 assumes zero experience and no public performance early on',
          'You will learn a dozen names in a single evening',
          'Classes cost money — a show is cheap reconnaissance first'
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
        expect: [
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
        expect: [
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
        expect: [
          'Instructions are spoken aloud, so you always know what to do',
          'Silence means you are not required to talk to anyone',
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
        expect: [
          'Recurring series bring back the same faces',
          'Tickets are cheap; volunteering is free and usually comes with screenings'
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
        expect: [
          'A performance gives you somewhere to look and something to talk about afterwards',
          'Many community events are free',
          'Workshops put you in a small group with a shared task'
        ],
        solo: 5, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'bos-swing',
        name: 'Boston Swing Central',
        neighborhood: 'Cambridge / Somerville',
        blurb: 'A weekly swing dance with a beginner lesson first and a live band. Partner dancing with rotation means you meet a dozen people in an evening without arranging anything.',
        interests: ['dance', 'music', 'social', 'fitness'],
        url: 'https://www.bostonswingcentral.org/',
        firstStep: {
          kind: 'dropin',
          label: 'Come for the beginner lesson before the dance',
          url: 'https://www.bostonswingcentral.org/',
          when: 'Weekly dance night \u2014 check the site'
        },
        expect: [
          'A beginner lesson runs before the dance — turn up for that and you are taught the basics',
          'Partners rotate during the lesson, so you do not need to bring one',
          'One fixed night a week, which is what turns faces into friends'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'bos-buda',
        name: 'Boston Ultimate Disc Alliance',
        neighborhood: 'Fields across Greater Boston',
        blurb: 'Runs the region\'s ultimate frisbee leagues, including beginner and recreational divisions you can join as an individual rather than as a team.',
        interests: ['sports', 'fitness', 'outdoors', 'social'],
        url: 'https://www.buda.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up solo for a recreational or beginner league',
          url: 'https://www.buda.org/',
          when: 'Seasonal leagues, spring through fall plus indoor winter'
        },
        expect: [
          'Recreational divisions are genuinely recreational',
          'Leagues cost money; hat leagues are the cheapest way in',
          'A weekly fixture with the same team is the whole point'
        ],
        solo: 4, gentleness: 3, structure: 'register', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['friends', 'routine', 'skill']
      },
      {
        id: 'bos-myco',
        name: 'Boston Mycological Club',
        neighborhood: 'Forays around New England',
        blurb: 'Founded in 1895, the oldest mushroom club in America, still walking slowly through the woods every autumn looking at the ground.',
        interests: ['nature', 'outdoors', 'food', 'social'],
        url: 'https://www.bostonmycologicalclub.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a foray as a guest',
          url: 'https://www.bostonmycologicalclub.org/',
          when: 'Forays through the season; meetings monthly'
        },
        expect: [
          'Slow walking and crouching, not hiking',
          'Modest membership; guests usually welcome first',
          'Never eat anything without an expert confirming it'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 1,
        when: ['weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'bos-bikesnotbombs',
        name: 'Bikes Not Bombs',
        neighborhood: 'Jamaica Plain',
        blurb: 'A bike shop and youth programme that ships refurbished bicycles overseas, with volunteer wrench nights where you learn repair while doing something useful.',
        interests: ['making', 'cycling', 'volunteering', 'mentoring'],
        url: 'https://bikesnotbombs.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come to a volunteer wrench night',
          url: 'https://bikesnotbombs.org/',
          when: 'Weekly volunteer nights'
        },
        expect: [
          'You are taught as you go; no mechanical knowledge assumed',
          'Free, and the same people turn up weekly',
          'The bikes go somewhere, so the work is not busywork'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'bos-recordco',
        name: 'The Record Co.',
        neighborhood: 'Roxbury',
        blurb: 'A nonprofit offering absurdly cheap rehearsal and recording rooms, plus community events \u2014 built so that being in a band does not require money.',
        interests: ['music', 'making', 'social'],
        url: 'https://therecord.co/',
        firstStep: {
          kind: 'visit',
          label: 'Book a cheap rehearsal hour, or come to a community event',
          url: 'https://therecord.co/',
          when: 'Rooms bookable daily; events through the month'
        },
        expect: [
          'Rates are set low on purpose \u2014 this is a nonprofit, not a studio',
          'Community events are where people actually meet collaborators',
          'You do not need to be good',
          'Rooms are bookable by the hour, so the commitment is tiny'
        ],
        solo: 4, gentleness: 4, structure: 'register', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'bos-growingcenter',
        name: 'Somerville Community Growing Center',
        neighborhood: 'Somerville',
        blurb: 'A quarter-acre of garden hidden behind the shops on Somerville Avenue, run by volunteers, with free seasonal festivals and open work sessions.',
        interests: ['gardening', 'environment', 'volunteering', 'outdoors', 'parents'],
        url: 'https://thegrowingcenter.org/',
        firstStep: {
          kind: 'dropin',
          label: 'Come to a work session or a free seasonal festival',
          url: 'https://thegrowingcenter.org/',
          when: 'Work sessions and festivals through the growing season'
        },
        expect: [
          'Tiny, volunteer-run and genuinely hidden \u2014 you walk past the entrance without seeing it',
          'Free, and no gardening knowledge assumed'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'small', goals: ['impact', 'friends']
      },
      {
        id: 'bos-athenaeum',
        name: 'Boston Athenaeum',
        neighborhood: 'Beacon Hill',
        blurb: 'One of the oldest independent libraries in the country, with a reading room overlooking a burying ground, plus public talks, tours and exhibitions.',
        interests: ['books', 'art', 'writing', 'social'],
        url: 'https://bostonathenaeum.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Take a public tour or go to one talk',
          url: 'https://bostonathenaeum.org/',
          when: 'Tours and events through the week'
        },
        expect: [
          'Tours are open to non-members and are the easiest way in',
          'Talks give you a reason to be there and something to discuss afterwards',
          'Membership is expensive; tours and many events are not',
          'The fifth-floor reading room is one of the best rooms in the city'
        ],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-day', 'weekday-eve'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'bos-boylston',
        name: 'Boylston Chess Club',
        neighborhood: 'Somerville',
        blurb: 'One of the oldest chess clubs in the country, running casual play alongside tournaments in its own dedicated space.',
        interests: ['games', 'social'],
        url: 'https://boylstonchess.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come to a casual club night',
          url: 'https://boylstonchess.org/',
          when: 'Club nights through the week'
        },
        expect: [
          'Casual nights are separate from the rated tournaments \u2014 start there',
          'Small entry fee or membership',
          'Unrated beginners do turn up, and have for a century'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'routine', 'skill']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
