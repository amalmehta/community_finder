/* Curated communities — Austin. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'atx',
    name: 'Austin',
    region: 'TX',
    aliases: ['austin', 'atx', 'austin tx', 'central texas'],
    orgs: [
      {
        id: 'atx-parks',
        name: 'Austin Parks Foundation',
        neighborhood: 'Parks & trails citywide',
        blurb: 'Volunteer workdays in neighbourhood parks and on the trails — planting, mulching, cleanups. Small crews, a few hours, tools provided.',
        interests: ['environment', 'outdoors', 'volunteering', 'gardening'],
        url: 'https://austinparks.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for one park workday',
          url: 'https://austinparks.org/volunteer/',
          when: 'Weekend mornings, year-round'
        },
        script: null,
        expect: [
          'No experience needed; gloves and tools are handed to you',
          'You work in a small crew for the morning, which makes talking easy',
          'Free, and finished before it gets hot',
          'Look for "It\'s My Park Day" for the biggest, friendliest version'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'atx-foodbank',
        name: 'Central Texas Food Bank',
        neighborhood: 'South Austin warehouse + mobile sites',
        blurb: 'Warehouse and mobile-pantry shifts. One of the easiest ways in Austin to spend three useful hours next to people you have never met.',
        interests: ['volunteering', 'food'],
        url: 'https://www.centraltexasfoodbank.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book a single volunteer shift',
          url: 'https://www.centraltexasfoodbank.org/volunteer',
          when: 'Most days, including evenings and weekends'
        },
        script: null,
        expect: [
          'Individual sign-ups are completely normal',
          'Brief training, simple task',
          'Two to three hours, then you are done',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'atx-library',
        name: 'Austin Public Library',
        neighborhood: 'Branches citywide + Central Library',
        blurb: 'Free book clubs, conversation circles, writing groups, craft nights and talks — plus one of the best public buildings in Texas downtown.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'parents'],
        url: 'https://library.austintexas.gov/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your branch',
          url: 'https://library.austintexas.gov/events',
          when: 'Daily'
        },
        script: null,
        expect: [
          'Free and usually drop-in',
          'Conversation circles exist specifically so strangers talk to each other',
          'The rooftop at Central Library is a good low-stakes place to just be',
          'No explanation required for showing up'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'atx-hackerspace',
        name: 'ATX Hackerspace',
        neighborhood: 'South Austin',
        blurb: 'A member-run workshop with woodworking, metal, electronics, lasers and 3D printing, plus open nights and classes you can attend without joining.',
        interests: ['making', 'tech', 'art', 'crafts'],
        url: 'https://atxhackerspace.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come to an open house or a class',
          url: 'https://atxhackerspace.org/',
          when: 'Open nights and classes — check the calendar'
        },
        script: 'Hi — I\'m interested in {interest} and would like to visit. When\'s a good open night, and is it OK to come with no project and just look?',
        expect: [
          'Open nights exist so non-members can wander in',
          'Asking someone what they are building is always welcome',
          'Visiting is free; membership and materials are not',
          'Nobody expects you to know how anything works'
        ],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'atx-openaustin',
        name: 'Open Austin',
        neighborhood: 'Civic tech, in person + online',
        blurb: 'Volunteers who build digital tools with and for the community and local government. Open meetings, non-coders explicitly welcome.',
        interests: ['tech', 'civic', 'volunteering'],
        url: 'https://www.open-austin.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'RSVP to an upcoming meeting',
          url: 'https://www.open-austin.org/',
          when: 'Regular evening sessions'
        },
        script: 'Hi! I\'d like to come to a meeting. I\'m interested in {interest} — is there something a newcomer could help with, or should I just come and listen?',
        expect: [
          'Meetings open with introductions, so you are not invisible',
          'Research, design and writing help is always needed',
          'Free',
          'Attending once and deciding is fine'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve'], size: 'small', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'atx-keepbeautiful',
        name: 'Keep Austin Beautiful',
        neighborhood: 'Creeks, streets & parks',
        blurb: 'Creek cleanups, tree plantings and neighbourhood beautification projects. Short, outdoors, no experience, and an obvious shared task to talk over.',
        interests: ['environment', 'volunteering', 'outdoors', 'civic'],
        url: 'https://keepaustinbeautiful.org/',
        firstStep: {
          kind: 'signup',
          label: 'Join one cleanup',
          url: 'https://keepaustinbeautiful.org/volunteer/',
          when: 'Weekend mornings, most weeks'
        },
        script: null,
        expect: [
          'Supplies and a site leader are provided',
          'Two to three hours, early enough to beat the heat',
          'Free',
          'Small groups mean you talk to the same people throughout'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'atx-hideout',
        name: 'The Hideout Theatre',
        neighborhood: 'Downtown, Congress Ave',
        blurb: 'Improv theater and school with beginner classes and cheap shows in a coffeehouse downtown. The beginner level is entirely people who have never tried it.',
        interests: ['theater', 'social'],
        url: 'https://www.hideouttheatre.com/',
        firstStep: {
          kind: 'register',
          label: 'Watch a cheap show, then book Level 1',
          url: 'https://www.hideouttheatre.com/classes',
          when: 'Shows most nights; classes in terms'
        },
        script: null,
        expect: [
          'Level 1 assumes nothing and there is no public performance early on',
          'You will be on first-name terms with a dozen people within two sessions',
          'Classes cost money; a show is cheap reconnaissance',
          'The coffeehouse downstairs makes arriving early painless'
        ],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'atx-runners',
        name: 'Austin Runners Club',
        neighborhood: 'Town Lake trail & around',
        blurb: 'Free weekly group runs at a range of paces, plus beginner training programs. Turning up alone is the standard way people join.',
        interests: ['running', 'fitness', 'outdoors', 'social'],
        url: 'https://www.austinrunners.org/',
        firstStep: {
          kind: 'dropin',
          label: 'Turn up to a free weekly group run',
          url: 'https://www.austinrunners.org/',
          when: 'Weekday evenings and weekend mornings'
        },
        script: 'Hi! I\'m new and fairly slow. Which of your group runs is the most beginner-friendly, and do I need to be a member to come along?',
        expect: [
          'Pace groups mean there is always someone your speed',
          'Weekly group runs are usually free and open to non-members',
          'Beginner training programs run in multi-week blocks',
          'Running beside someone is easier than talking across a table'
        ],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'atx-allgo',
        name: 'allgo',
        neighborhood: 'Austin & statewide',
        blurb: 'A queer people of color organization running arts programming, wellness events and community gatherings in Austin.',
        interests: ['lgbtq', 'social', 'support', 'art', 'newcomer'],
        url: 'https://allgo.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Check the calendar and RSVP to one event',
          url: 'https://allgo.org/events/',
          when: 'Events through the month'
        },
        script: 'Hi — I\'m new to Austin and looking for community. Is the upcoming event open to people who haven\'t been before?',
        expect: [
          'Events are built for people arriving without a group',
          'Many are free',
          'Arts and wellness events give you something to look at besides each other',
          'Staff are used to newcomers'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'routine']
      },
      {
        id: 'atx-sfc',
        name: 'Sustainable Food Center',
        neighborhood: 'Farmers markets + teaching kitchen',
        blurb: 'Runs Austin farmers markets, cooking classes and garden programs, with volunteer roles at markets and in the kitchen.',
        interests: ['food', 'gardening', 'volunteering', 'environment'],
        url: 'https://sustainablefoodcenter.org/',
        firstStep: {
          kind: 'signup',
          label: 'Volunteer at a farmers market or take a cooking class',
          url: 'https://sustainablefoodcenter.org/volunteer',
          when: 'Markets on weekends; classes through the week'
        },
        script: 'Hi! I\'d like to volunteer. I\'m interested in {interest} — which role would suit someone brand new?',
        expect: [
          'Market shifts are a few hours and very social by nature',
          'Cooking classes give you a task, which beats mingling',
          'Volunteering is free; classes may have a sliding-scale fee',
          'Food is the easiest thing in the world to talk about'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'atx-bikeaustin',
        name: 'Bike Austin',
        neighborhood: 'Citywide',
        blurb: 'Advocacy plus social and educational rides, including classes for people who are nervous riding in traffic.',
        interests: ['cycling', 'civic', 'environment', 'social'],
        url: 'https://bikeaustin.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a social ride or a confidence class',
          url: 'https://bikeaustin.org/',
          when: 'Rides and classes through the season'
        },
        script: 'Hi! I\'d like to ride more but I\'m nervous in traffic. Do you have a class or a slow social ride coming up that would suit me?',
        expect: [
          'Classes exist specifically for anxious riders',
          'Social rides go at a conversational pace',
          'Usually free or low-cost',
          'A shared route removes the need to invent conversation'
        ],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['skill', 'friends', 'impact']
      },
      {
        id: 'atx-creativereuse',
        name: 'Austin Creative Reuse',
        neighborhood: 'North Austin',
        blurb: 'A nonprofit shop that rescues craft and art materials from landfill and sells them cheap. Volunteers sort donations together — which is oddly absorbing and very easy to talk over.',
        interests: ['crafts', 'art', 'environment', 'volunteering', 'making'],
        url: 'https://austincreativereuse.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for one volunteer sorting shift',
          url: 'https://austincreativereuse.org/',
          when: 'Shifts through the week; check the volunteer page'
        },
        script: 'Hi! I\'d like to volunteer. I\'m interested in {interest} and I\'ve never volunteered with you before — what\'s the first step, and when are shifts available?',
        expect: [
          'Sorting beads and fabric next to someone is a low-stakes way to spend two hours',
          'No skills needed at all',
          'Free, and you can browse the shop afterwards',
          'Regular volunteers see each other weekly, which is how it stops being strangers'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'atx-pets-alive',
        name: 'Austin Pets Alive!',
        neighborhood: 'Town Lake + Tarrytown',
        blurb: 'One of the biggest no-kill shelters in the country, with a volunteer programme that genuinely runs on volunteers — dog walking, cat care, fostering.',
        interests: ['animals', 'volunteering'],
        url: 'https://www.austinpetsalive.org/',
        firstStep: {
          kind: 'signup',
          label: 'Do the volunteer orientation, then pick a shift',
          url: 'https://www.austinpetsalive.org/volunteer',
          when: 'Orientations regularly; shifts daily'
        },
        script: null,
        expect: [
          'Orientation first, then you choose what you want to do',
          'Dog walking is a solo-friendly task that still puts you among people',
          'Free, and fostering is an option if leaving the house is the hard part',
          'Regular shifts mean the same faces each week'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'atx-afs',
        name: 'Austin Film Society',
        neighborhood: 'AFS Cinema, north Austin',
        blurb: 'Runs a cinema, classes and a members\' community for people who make and watch films. Volunteering and member screenings are the easy ways in.',
        interests: ['filmphoto', 'art', 'volunteering', 'social'],
        url: 'https://www.austinfilm.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Go to one screening, or sign up to volunteer',
          url: 'https://www.austinfilm.org/',
          when: 'Screenings most nights; events year-round'
        },
        script: 'Hi! I\'d like to get involved. I\'m interested in {interest} and new to this — do you need volunteers, and which events suit someone coming alone?',
        expect: [
          'A screening is the classic thing you can do alone without it being odd',
          'The conversation afterwards has a built-in subject',
          'Membership and tickets cost money; volunteering does not',
          'Classes and workshops exist for people who want to make things'
        ],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'atx-zen',
        name: 'Austin Zen Center',
        neighborhood: 'North Loop / Hyde Park',
        blurb: 'A quiet residential zendo with introductory sessions that explain, out loud, exactly what to do. Newcomers are expected, not tolerated.',
        interests: ['stillness', 'faith', 'support'],
        url: 'https://www.austinzencenter.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come to a newcomer introduction session',
          url: 'https://www.austinzencenter.org/',
          when: 'Weekly sittings plus newcomer sessions'
        },
        script: 'Hi — I\'ve never meditated in a group before. Is there an introduction session for newcomers, and is there anything I should wear or bring?',
        expect: [
          'The introduction is specifically for people who have never done this',
          'You are shown where to sit and when to stand — nothing is assumed',
          'By donation; nobody checks',
          'Silence means you do not have to talk until you want to'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['routine', 'friends']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
