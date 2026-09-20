/* Curated communities — Chicago. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'chi',
    name: 'Chicago',
    region: 'IL',
    aliases: ['chicago', 'chi', 'chicagoland'],
    orgs: [
      {
        id: 'chi-hacknight',
        name: 'Chi Hack Night',
        neighborhood: 'Loop / downtown',
        blurb: 'A free weekly civic-tech gathering that has run for over a decade. It opens with a talk anyone can follow, then breaks into project groups. Famously welcoming to people who cannot code.',
        interests: ['tech', 'civic', 'volunteering', 'social'],
        url: 'https://chihacknight.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'RSVP and come for the talk — staying after is optional',
          url: 'https://chihacknight.org/',
          when: 'Tuesday evenings, weekly'
        },
        script: 'Hi! I\'d like to come to my first Hack Night. I\'m interested in {interest} but I\'m not a developer — is there a group that could use me, or should I just come and listen first?',
        expect: [
          'The first hour is a public talk — you can sit, listen, and leave with zero interaction',
          'Newcomers are asked to stand up and are then applauded, not quizzed',
          'Free, and food is usually there',
          'Designers, writers, researchers and curious civilians are all wanted'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve'], size: 'large', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'chi-cares',
        name: 'Chicago Cares',
        neighborhood: 'Citywide',
        blurb: 'Matches volunteers to one-off projects across the city — tutoring, park cleanups, meal service — each led by a trained volunteer leader.',
        interests: ['volunteering', 'social', 'mentoring', 'civic'],
        url: 'https://www.chicagocares.org/',
        firstStep: {
          kind: 'signup',
          label: 'Create an account and claim one project',
          url: 'https://www.chicagocares.org/volunteer',
          when: 'Projects most days and weekends'
        },
        script: null,
        expect: [
          'Every project has a leader whose explicit job is to orient newcomers',
          'Most volunteers sign up alone',
          'One project at a time — no ongoing commitment',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'chi-foodDepository',
        name: 'Greater Chicago Food Depository',
        neighborhood: 'Archer Heights warehouse + partner sites',
        blurb: 'Warehouse shifts repacking produce for the region\'s food pantries. Simple, physical, obviously useful, and done in a line of friendly strangers.',
        interests: ['volunteering', 'food'],
        url: 'https://www.chicagosfoodbank.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book a single volunteer shift',
          url: 'https://www.chicagosfoodbank.org/volunteer/',
          when: 'Morning, afternoon and some evening shifts'
        },
        script: null,
        expect: [
          'Individuals sign up constantly — you will not be the only solo person',
          'Five-minute training, then a repetitive task you cannot get wrong',
          'Two to three hours, then done',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'chi-psone',
        name: 'Pumping Station: One',
        neighborhood: 'Avondale',
        blurb: 'A member-run makerspace with woodworking, metal, electronics, textiles and 3D printing, plus regular open houses and classes for non-members.',
        interests: ['making', 'tech', 'art', 'crafts'],
        url: 'https://pumpingstationone.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come to a public open house or tour',
          url: 'https://pumpingstationone.org/events/',
          when: 'Regular open nights — check the calendar'
        },
        script: 'Hi — I\'m interested in {interest} and would like to see the space. When\'s the next open house, and is it fine to come alone with no project in mind?',
        expect: [
          'Open houses exist so strangers can look around without joining',
          'Members like showing off their machines — asking is a favour, not an imposition',
          'Visiting is free; membership and classes cost money',
          'You can spend the whole visit asking questions and touching nothing'
        ],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends']
      },
      {
        id: 'chi-activetrans',
        name: 'Active Transportation Alliance',
        neighborhood: 'Citywide + suburbs',
        blurb: 'Advocacy for biking, walking and transit, with volunteer events, group rides and neighbourhood campaigns you can join for a single afternoon.',
        interests: ['cycling', 'civic', 'environment', 'volunteering'],
        url: 'https://activetrans.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Sign up for one volunteer shift or ride',
          url: 'https://activetrans.org/',
          when: 'Events through the riding season'
        },
        script: 'Hi! I\'d like to volunteer. I\'m new to this and don\'t know anyone — which upcoming event is the easiest one to start with?',
        expect: [
          'Event volunteering is the low-commitment entry point',
          'You are given a specific job, which is much easier than mingling',
          'Free',
          'A shared cause skips a lot of small talk'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'chi-openlands',
        name: 'Openlands TreeKeepers',
        neighborhood: 'Forest preserves & neighborhoods',
        blurb: 'Volunteer workdays caring for Chicago\'s trees, plus a certification course if you fall for it. Outdoors, hands busy, easy conversation.',
        interests: ['environment', 'gardening', 'outdoors', 'volunteering'],
        url: 'https://openlands.org/',
        firstStep: {
          kind: 'signup',
          label: 'Join a volunteer workday',
          url: 'https://openlands.org/volunteer/',
          when: 'Weekend mornings in season'
        },
        script: null,
        expect: [
          'No experience needed for workdays; tools are provided',
          'Small crews, so you actually get to know people',
          'Free',
          'The TreeKeepers course is there if you want a deeper group later'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'chi-cara',
        name: 'Chicago Area Runners Association',
        neighborhood: 'Group runs across the metro',
        blurb: 'Training groups and free group runs at every pace, including beginners who are running for the first time in their adult life.',
        interests: ['running', 'fitness', 'outdoors', 'social'],
        url: 'https://www.cararuns.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find a group run at your pace',
          url: 'https://www.cararuns.org/',
          when: 'Weekend mornings and weekday evenings'
        },
        script: 'Hi! I\'m slow and just getting started. Is there a group run or training program where I wouldn\'t be the only beginner?',
        expect: [
          'Pace groups mean you run with people who run your speed',
          'Training programs run in multi-week blocks, so you see the same people repeatedly',
          'Some runs are free; training programs have a fee',
          'Running side by side is easier than sitting across a table'
        ],
        solo: 4, gentleness: 4, structure: 'register', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['routine', 'friends']
      },
      {
        id: 'chi-centeronhalsted',
        name: 'Center on Halsted',
        neighborhood: 'Lakeview / Boystown',
        blurb: 'The Midwest\'s largest LGBTQ+ community center: free groups, a gym, a rooftop, a cafe and a calendar full of things you can attend alone.',
        interests: ['lgbtq', 'social', 'support', 'newcomer', 'fitness'],
        url: 'https://www.centeronhalsted.org/',
        firstStep: {
          kind: 'visit',
          label: 'Pick one free program and walk in',
          url: 'https://www.centeronhalsted.org/programs.html',
          when: 'Programs daily'
        },
        script: 'Hi — I\'m new to Chicago and looking to meet people. Is the {interest} group open to drop-ins?',
        expect: [
          'Most programs are free and drop-in',
          'The cafe and lobby are places you are allowed to just be',
          'Staff are used to "I don\'t know anyone here"',
          'A lot of people arrive alone'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'chi-cpl',
        name: 'Chicago Public Library',
        neighborhood: '80+ branches',
        blurb: 'Free book clubs, conversation circles for English learners, maker labs at Harold Washington, chess, crafts and talks — in every neighbourhood.',
        interests: ['books', 'language', 'social', 'newcomer', 'crafts', 'making', 'writing'],
        url: 'https://www.chipublib.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your branch',
          url: 'https://www.chipublib.org/events/',
          when: 'Daily'
        },
        script: null,
        expect: [
          'Free, mostly no registration',
          'The Maker Lab downtown offers free equipment workshops',
          'Your nearest branch is close enough that leaving early costs nothing',
          'Nobody asks why you came'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'chi-parkdistrict',
        name: 'Chicago Park District programs',
        neighborhood: '600+ parks',
        blurb: 'Cheap adult classes and leagues at neighbourhood field houses — volleyball, dance, pottery, yoga, ice skating. Registration is per-season, which builds a rhythm.',
        interests: ['sports', 'fitness', 'dance', 'art', 'social'],
        url: 'https://anc.apm.activecommunities.com/chicagoparkdistrict/home',
        firstStep: {
          kind: 'register',
          label: 'Register for one seasonal adult program near you',
          url: 'https://anc.apm.activecommunities.com/chicagoparkdistrict/activity/search',
          when: 'Seasonal registration — check dates'
        },
        script: null,
        expect: [
          'Prices are low by design — many programs are under $50 for a season',
          'You see the same group weekly for 8–10 weeks, which is how friendships actually form',
          'Adult beginner sections exist for most activities',
          'Register early — popular programs fill'
        ],
        solo: 4, gentleness: 4, structure: 'register', commitment: 'seasonal', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends', 'skill']
      },
      {
        id: 'chi-cic',
        name: 'CIC Theater',
        neighborhood: 'Uptown',
        blurb: 'An indie improv theater with cheap classes and shows, less intimidating than the big schools and full of people doing this for the joy of it.',
        interests: ['theater', 'social'],
        url: 'https://www.cictheater.com/',
        firstStep: {
          kind: 'register',
          label: 'See a cheap show first, then book a beginner class',
          url: 'https://www.cictheater.com/',
          when: 'Shows most weekends; classes in terms'
        },
        script: null,
        expect: [
          'Seeing a show first is a legitimate, zero-risk way to scope the place',
          'Beginner classes assume nothing',
          'Cheaper than the famous schools',
          'You will know everyone\'s name by week two'
        ],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'chi-chicagoriver',
        name: 'Friends of the Chicago River',
        neighborhood: 'Along the river',
        blurb: 'Cleanups, canoe trips and habitat workdays on the river. The annual Chicago River Day is a city-wide volunteer morning that anyone can join.',
        interests: ['environment', 'outdoors', 'volunteering', 'nature'],
        url: 'https://www.chicagoriver.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for a cleanup or workday',
          url: 'https://www.chicagoriver.org/take-action/volunteer',
          when: 'Spring through fall, mostly weekend mornings'
        },
        script: null,
        expect: [
          'Gloves, bags and instructions provided',
          'You are placed at a site with a small group',
          'Free, half a day',
          'Ending muddy with strangers is a surprisingly effective social solvent'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
