/* Curated communities — Washington, DC. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'dc',
    name: 'Washington, DC',
    region: 'DC',
    aliases: ['washington', 'washington dc', 'dc', 'district of columbia', 'arlington', 'alexandria', 'bethesda', 'silver spring', 'dmv'],
    orgs: [
      {
        id: 'dc-foodbank',
        name: 'Capital Area Food Bank',
        neighborhood: 'Northeast DC warehouse',
        blurb: 'Warehouse shifts sorting and packing food for the region. Simple, physical, obviously useful, and done alongside a room full of people.',
        interests: ['volunteering', 'food'],
        url: 'https://www.capitalareafoodbank.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book a single volunteer shift',
          url: 'https://www.capitalareafoodbank.org/volunteer/',
          when: 'Day, evening and weekend shifts'
        },
        script: null,
        expect: [
          'Individual sign-ups are the norm',
          'Brief training, then a task you cannot get wrong',
          'Two to three hours, complete in itself',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'dc-dcpl',
        name: 'DC Public Library',
        neighborhood: 'Branches citywide',
        blurb: 'Free book clubs, conversation groups for English learners, writing workshops, craft nights, storytimes and a maker lab — plus one of the best new buildings in the city.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'making', 'parents'],
        url: 'https://www.dclibrary.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your nearest branch',
          url: 'https://www.dclibrary.org/calendar',
          when: 'Daily'
        },
        script: null,
        expect: [
          'Free, mostly with no registration',
          'The Studio Lab at MLK offers free equipment and workshops',
          'Your branch is close enough that leaving early costs nothing',
          'Nobody asks why you came'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'dc-novalabs',
        name: 'Nova Labs',
        neighborhood: 'Reston, VA',
        blurb: 'A large volunteer-run makerspace serving the DC area — woodworking, metal, electronics, lasers — with public open houses and classes for non-members.',
        interests: ['making', 'tech', 'art', 'crafts'],
        url: 'https://www.nova-labs.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come to a public open house or take an intro class',
          url: 'https://www.nova-labs.org/',
          when: 'Open houses and classes through the month'
        },
        script: 'Hi — I\'m interested in {interest} and completely new to it. When\'s the next open house, and is there an intro class for someone who has never used this equipment?',
        expect: [
          'Open houses exist so non-members can wander in and look',
          'Members enjoy being asked what they are building',
          'Visiting is free; classes and membership cost money',
          'It is in Reston, so check the drive or the Silver Line before committing'
        ],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['skill', 'friends']
      },
      {
        id: 'dc-waba',
        name: 'Washington Area Bicyclist Association',
        neighborhood: 'DC, Maryland & Virginia',
        blurb: 'Advocacy plus free classes and group rides, including ones specifically for people who are nervous riding in traffic.',
        interests: ['cycling', 'civic', 'environment', 'social'],
        url: 'https://waba.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Sign up for a free class or a group ride',
          url: 'https://waba.org/events/',
          when: 'Classes and rides most weeks in season'
        },
        script: 'Hi! I\'d like to ride more but I\'m nervous in traffic. Is there a class or a slow group ride coming up that suits a beginner?',
        expect: [
          'Free classes exist specifically for anxious riders',
          'Group rides go at a stated pace and nobody gets dropped',
          'Most classes are free',
          'A shared route removes the need to invent conversation'
        ],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['skill', 'friends', 'impact']
      },
      {
        id: 'dc-dccenter',
        name: 'The DC Center for the LGBT Community',
        neighborhood: 'Northwest DC',
        blurb: 'Free drop-in groups most days — social, support, arts, newcomers, trans and gender-nonconforming — in a space designed for people who arrive knowing nobody.',
        interests: ['lgbtq', 'social', 'support', 'newcomer'],
        url: 'https://thedccenter.org/',
        firstStep: {
          kind: 'visit',
          label: 'Pick one free group from the calendar and go',
          url: 'https://thedccenter.org/',
          when: 'Groups most days, mostly evenings'
        },
        script: 'Hi — I\'m new to DC and looking for community. Is the {interest} group open to drop-ins, or should I register first?',
        expect: [
          'Most groups are free and drop-in',
          'Arriving alone is how most people start',
          'Groups are small enough that you will be spoken to',
          'Staff expect newcomers and will point you somewhere if you say you are new'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'routine']
      },
      {
        id: 'dc-hra',
        name: 'Humane Rescue Alliance',
        neighborhood: 'Northwest & Northeast DC',
        blurb: 'The District\'s animal shelter, with a volunteer programme covering dog walking, cat socialising, fostering and adoption events.',
        interests: ['animals', 'volunteering'],
        url: 'https://www.humanerescuealliance.org/',
        firstStep: {
          kind: 'signup',
          label: 'Apply and attend a volunteer orientation',
          url: 'https://www.humanerescuealliance.org/volunteer',
          when: 'Orientations regularly; shifts most days'
        },
        script: null,
        expect: [
          'Application and orientation come before your first shift',
          'Dog walking is solo-friendly but still puts you among regulars',
          'Free, with a minimum commitment once trained',
          'Fostering is the option if leaving the house is the hard part'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'dc-wit',
        name: 'Washington Improv Theater',
        neighborhood: 'Northwest DC',
        blurb: 'Improv school and company whose beginner class is full of adults who have never done it — a city of serious professionals being deliberately silly on a Tuesday.',
        interests: ['theater', 'social'],
        url: 'https://witdc.org/',
        firstStep: {
          kind: 'register',
          label: 'See a cheap show, then book the beginner class',
          url: 'https://witdc.org/',
          when: 'Shows most weekends; classes in terms'
        },
        script: null,
        expect: [
          'The beginner level assumes zero experience and no early performance',
          'You will learn a dozen names in one evening',
          'Classes cost money; a show is cheap reconnaissance',
          'Everyone is equally uncomfortable for the first twenty minutes'
        ],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'dc-rockcreek',
        name: 'Rock Creek Conservancy',
        neighborhood: 'Rock Creek Park',
        blurb: 'Volunteer workdays removing invasives and restoring the park that runs through the middle of the city. Tools, gloves and instructions provided.',
        interests: ['environment', 'outdoors', 'volunteering', 'gardening', 'nature'],
        url: 'https://www.rockcreekconservancy.org/',
        firstStep: {
          kind: 'signup',
          label: 'Register for one volunteer workday',
          url: 'https://www.rockcreekconservancy.org/volunteer',
          when: 'Weekend mornings, year-round'
        },
        script: null,
        expect: [
          'No experience needed and everything is supplied',
          'Small crews mean you talk to the same few people all morning',
          'Free, a few hours, no follow-up expected',
          'You will be outdoors and slightly muddy, which lowers the stakes'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'dc-levine',
        name: 'Levine Music',
        neighborhood: 'Southeast DC + campuses',
        blurb: 'Community music school with adult group classes, ensembles and a chorus that takes people who cannot read music, with financial aid available.',
        interests: ['music', 'social'],
        url: 'https://www.levinemusic.org/',
        firstStep: {
          kind: 'email',
          label: 'Ask which adult group classes take absolute beginners',
          url: 'https://www.levinemusic.org/',
          when: 'Terms start a few times a year'
        },
        script: 'Hi — I\'m an adult beginner interested in {interest}. Which group classes or ensembles take someone with no background, and is financial aid available?',
        expect: [
          'Adult beginner groups exist and are not full of former prodigies',
          'A weekly ensemble with the same people is the actual friendship mechanism',
          'Classes cost money; ask about financial aid',
          'No audition for the community groups'
        ],
        solo: 4, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'dc-imcw',
        name: 'Insight Meditation Community of Washington',
        neighborhood: 'DC + online',
        blurb: 'A large secular-leaning meditation community with free and donation-based sittings and courses explicitly for people who have never meditated.',
        interests: ['stillness', 'faith', 'support'],
        url: 'https://imcw.org/',
        firstStep: {
          kind: 'visit',
          label: 'Go to one weekly sitting or an introductory course',
          url: 'https://imcw.org/',
          when: 'Weekly sittings; courses through the year'
        },
        script: 'Hi — I\'ve never meditated in a group. Is the weekly sitting open to complete beginners, and what should I expect on a first visit?',
        expect: [
          'Instructions are spoken aloud — you always know what to do',
          'Donation-based; nobody is turned away',
          'You can sit on a chair, and nobody minds',
          'Silence means no obligation to talk until you want to'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['routine', 'friends']
      },
      {
        id: 'dc-caseytrees',
        name: 'Casey Trees',
        neighborhood: 'Neighbourhoods citywide',
        blurb: 'Volunteer tree plantings across the District, in crews of four or five. You spend a Saturday morning putting something permanent in the ground with strangers.',
        interests: ['gardening', 'environment', 'volunteering', 'outdoors', 'civic'],
        url: 'https://caseytrees.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for one Saturday planting',
          url: 'https://caseytrees.org/volunteer/',
          when: 'Spring and fall planting seasons'
        },
        script: null,
        expect: [
          'You are assigned to a small crew — that is what makes conversation easy',
          'Tools, gloves and a short training are provided',
          'Free, and done by early afternoon',
          'No gardening knowledge assumed at all'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'dc-frontrunners',
        name: 'DC Front Runners',
        neighborhood: 'Runs around the city',
        blurb: 'An LGBTQ+ and allies running and walking club with free weekly group runs at every pace, and a social calendar that is arguably the real point.',
        interests: ['running', 'lgbtq', 'social', 'fitness', 'outdoors'],
        url: 'https://dcfrontrunners.org/',
        firstStep: {
          kind: 'dropin',
          label: 'Turn up to a weekly group run — walkers included',
          url: 'https://dcfrontrunners.org/',
          when: 'Several runs a week; check the schedule'
        },
        script: 'Hi! I\'m new to DC and fairly slow. Which of your weekly runs is best for a first-timer, and do I need to be a member to come along?',
        expect: [
          'Walkers and slow runners are explicitly included',
          'Free to come to a group run',
          'The drinks or brunch afterwards is where you actually meet people',
          'Arriving alone is how nearly everyone starts'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'routine']
      },
      {
        id: 'dc-anacostia',
        name: 'Anacostia Watershed Society',
        neighborhood: 'Anacostia River',
        blurb: 'Cleanups, tree plantings and canoe trips on the river, plus habitat restoration — hands-on work with a visible result on a river that needs it.',
        interests: ['environment', 'outdoors', 'volunteering', 'nature'],
        url: 'https://www.anacostiaws.org/',
        firstStep: {
          kind: 'signup',
          label: 'Join a cleanup or a volunteer workday',
          url: 'https://www.anacostiaws.org/volunteer',
          when: 'Weekend mornings through the season'
        },
        script: null,
        expect: [
          'Gloves, bags and instructions are handed to you on arrival',
          'You are placed with a small group at a site',
          'Free, half a day',
          'Canoe trips are the reward version of the same thing'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'dc-afisilver',
        name: 'AFI Silver Theatre',
        neighborhood: 'Silver Spring, MD',
        blurb: 'The American Film Institute\'s repertory cinema, running festivals and themed series in a restored art deco theatre on the Red Line.',
        interests: ['filmphoto', 'art', 'social'],
        url: 'https://afisilver.afi.com/',
        firstStep: {
          kind: 'rsvp',
          label: 'Go to one screening in a series you like the look of',
          url: 'https://afisilver.afi.com/',
          when: 'Screenings daily; festivals through the year'
        },
        script: null,
        expect: [
          'A screening is the classic thing you can do alone without it being odd',
          'Themed series bring back the same faces week after week',
          'Tickets are modest; members pay less',
          'The conversation afterwards has a built-in subject'
        ],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'dc-glenecho',
        name: 'Glen Echo Park social dances',
        neighborhood: 'Glen Echo, MD',
        blurb: 'Contra, swing and waltz dances in a restored 1930s ballroom, several nights a week, each with a beginner lesson first. One of the best social dance scenes in the country.',
        interests: ['dance', 'music', 'social', 'fitness'],
        url: 'https://glenechopark.org/',
        firstStep: {
          kind: 'dropin',
          label: 'Pick one dance night and arrive for the beginner lesson',
          url: 'https://glenechopark.org/dances',
          when: 'Several nights a week, year-round'
        },
        script: null,
        expect: [
          'A beginner lesson runs before every dance \u2014 turn up for that and you will be taught',
          'Contra in particular rotates partners constantly, so coming alone is the norm',
          'No partner, no experience, no particular clothes needed',
          'The ballroom alone is worth the trip'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'dc-wafc',
        name: 'Washington Area Frisbee Club',
        neighborhood: 'Fields across the DMV',
        blurb: 'One of the oldest and largest ultimate frisbee clubs in the country, running leagues and pickup with divisions for people who have never played.',
        interests: ['sports', 'fitness', 'outdoors', 'social'],
        url: 'https://www.wafc.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up solo for a recreational league, or find pickup',
          url: 'https://www.wafc.org/',
          when: 'Seasonal leagues; pickup year-round'
        },
        script: 'Hi! I\'d like to try ultimate and I\'ve never played. Which league is right for a beginner, and is signing up alone normal?',
        expect: [
          'Individuals get drafted onto teams \u2014 no friends needed',
          'Recreational divisions genuinely expect beginners',
          'Leagues cost money; pickup is free',
          'A weekly team fixture is a standing reason to leave the house'
        ],
        solo: 4, gentleness: 3, structure: 'register', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['friends', 'routine', 'skill']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
