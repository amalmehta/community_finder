/* Curated communities — Philadelphia. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'phl',
    name: 'Philadelphia',
    region: 'PA',
    aliases: ['philadelphia', 'philly', 'phl', 'south philly', 'west philly', 'fishtown', 'germantown'],
    orgs: [
      {
        id: 'phl-philabundance',
        name: 'Philabundance',
        neighborhood: 'South Philadelphia warehouse',
        blurb: 'The region\'s largest hunger-relief organisation. Warehouse shifts sorting and repacking food are the easiest possible way to spend three useful hours among strangers.',
        interests: ['volunteering', 'food'],
        url: 'https://www.philabundance.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book a single volunteer shift',
          url: 'https://www.philabundance.org/volunteer/',
          when: 'Weekday and weekend shifts'
        },
        script: null,
        expect: [
          'Signing up alone is completely normal',
          'Five minutes of training and a task you cannot get wrong',
          'Two to three hours, then you are done',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'phl-freelibrary',
        name: 'Free Library of Philadelphia',
        neighborhood: '50+ branches',
        blurb: 'Free book clubs, conversation groups for English learners, writing workshops, craft nights, storytimes and talks, in every neighbourhood in the city.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'parents'],
        url: 'https://www.freelibrary.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your nearest branch',
          url: 'https://www.freelibrary.org/calendar',
          when: 'Daily'
        },
        script: null,
        expect: [
          'Free, and usually no registration',
          'Your branch is close enough that bailing costs you nothing',
          'Conversation groups are built around strangers talking to each other',
          'Nobody asks why you came'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'phl-hive76',
        name: 'Hive76',
        neighborhood: 'Kensington',
        blurb: 'A long-running volunteer hackerspace with electronics, 3D printing, woodworking and laser cutting, and open nights where anyone can wander in.',
        interests: ['making', 'tech', 'art', 'crafts'],
        url: 'https://www.hive76.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come to an open night',
          url: 'https://www.hive76.org/',
          when: 'Weekly open evening — check the site'
        },
        script: 'Hi — I\'d like to visit for the first time. I\'m interested in {interest} and a total beginner. When\'s the open night, and is it fine to come with no project?',
        expect: [
          'Open nights exist precisely so strangers can come in and look',
          '"Can you show me around?" is a sentence these places hear constantly',
          'Visiting is free; membership costs money',
          'Nobody expects you to know how anything works'
        ],
        solo: 4, gentleness: 3, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-eve'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'phl-bicyclecoalition',
        name: 'Bicycle Coalition of Greater Philadelphia',
        neighborhood: 'Citywide',
        blurb: 'Advocacy plus rides, classes and volunteer events — a way to be useful about something you already have opinions on while meeting the people who share them.',
        interests: ['cycling', 'civic', 'environment', 'volunteering'],
        url: 'https://bicyclecoalition.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join one ride or volunteer at an event',
          url: 'https://bicyclecoalition.org/',
          when: 'Events through the riding season'
        },
        script: 'Hi! I\'d like to get involved and I don\'t know anyone. Which upcoming ride or volunteer event is the easiest one to start with?',
        expect: [
          'Event volunteering gives you a specific job, which beats open-ended mingling',
          'Rides are graded by pace — pick a relaxed one',
          'Free or low-cost',
          'A shared cause skips a lot of small talk'
        ],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'phl-williamway',
        name: 'William Way LGBT Community Center',
        neighborhood: 'Washington Square West',
        blurb: 'Philadelphia\'s LGBTQ+ centre: free drop-in groups, an archive, a cafe space and a calendar full of things you can attend without knowing anyone.',
        interests: ['lgbtq', 'social', 'support', 'newcomer', 'books'],
        url: 'https://www.waygay.org/',
        firstStep: {
          kind: 'visit',
          label: 'Pick one free group from the calendar and walk in',
          url: 'https://www.waygay.org/',
          when: 'Programs most days'
        },
        script: 'Hi — I\'m new to the city and looking for community. Is the {interest} group open to drop-ins, or do I need to register first?',
        expect: [
          'Walking in without a plan is the intended use of the building',
          'Most programs are free',
          'Staff are used to "I don\'t know anyone here"',
          'A lot of people there arrived alone'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'routine']
      },
      {
        id: 'phl-paws',
        name: 'PAWS Philly',
        neighborhood: 'Grays Ferry + Old City',
        blurb: 'The city\'s largest no-kill rescue, run heavily on volunteers — dog walking, cat care, adoption events and fostering.',
        interests: ['animals', 'volunteering'],
        url: 'https://phillypaws.org/',
        firstStep: {
          kind: 'signup',
          label: 'Attend a volunteer orientation',
          url: 'https://phillypaws.org/how-to-help/volunteer/',
          when: 'Orientations regularly; shifts most days'
        },
        script: null,
        expect: [
          'Orientation first, then you pick recurring shifts',
          'The animals give you something to do with your hands and your eyes',
          'Shift regulars become familiar faces fast',
          'Free, and fostering is an option if leaving the house is the hard part'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'medium', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'phl-phit',
        name: 'Philly Improv Theater (PHIT)',
        neighborhood: 'Center City',
        blurb: 'Improv and sketch school with cheap shows and a beginner level-one class made up entirely of people who have never done it.',
        interests: ['theater', 'social'],
        url: 'https://phit.org/',
        firstStep: {
          kind: 'register',
          label: 'Watch a cheap show, then sign up for Level 1',
          url: 'https://phit.org/',
          when: 'Shows most weekends; classes in terms'
        },
        script: null,
        expect: [
          'Level 1 assumes nothing and has no public performance early on',
          'You will be on first-name terms with a dozen people within two sessions',
          'Classes cost money; a show is cheap reconnaissance',
          'Being bad at it together is the entire activity'
        ],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'phl-fairmount',
        name: 'Fairmount Park Conservancy',
        neighborhood: 'Parks citywide',
        blurb: 'Volunteer workdays in the largest urban park system in the country — planting, clearing, trail work. Tools and instructions handed to you on arrival.',
        interests: ['environment', 'outdoors', 'volunteering', 'gardening'],
        url: 'https://myphillypark.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for one volunteer workday',
          url: 'https://myphillypark.org/',
          when: 'Weekend mornings in season'
        },
        script: null,
        expect: [
          'No experience needed; everything is provided',
          'Small crews mean you talk to the same few people all morning',
          'Free, and finished by lunchtime',
          'Ending slightly muddy with strangers is a surprisingly effective social solvent'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'phl-settlement',
        name: 'Settlement Music School',
        neighborhood: 'Queen Village + branches',
        blurb: 'A century-old community music school with adult group classes and ensembles on a sliding scale, open to people with no background at all.',
        interests: ['music', 'social'],
        url: 'https://www.settlementmusic.org/',
        firstStep: {
          kind: 'email',
          label: 'Ask which adult group classes take beginners',
          url: 'https://www.settlementmusic.org/',
          when: 'Terms start a few times a year'
        },
        script: 'Hi — I\'m an adult beginner interested in {interest}. Which group classes or ensembles are open to someone with no experience, and how does the sliding scale work?',
        expect: [
          'Sliding-scale tuition is real; asking about it is expected',
          'Adult beginner groups exist and are not intimidating',
          'Weekly ensemble with the same people is how acquaintance turns into friendship',
          'No audition for community groups'
        ],
        solo: 4, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'phl-filmsociety',
        name: 'Philadelphia Film Society',
        neighborhood: 'Center City cinemas',
        blurb: 'Runs the city\'s cinemas and the Philadelphia Film Festival. Festival volunteering puts you on a team for a fortnight with people who like films enough to give up their evenings.',
        interests: ['filmphoto', 'art', 'volunteering', 'social'],
        url: 'https://filmadelphia.org/',
        firstStep: {
          kind: 'signup',
          label: 'Volunteer at the festival, or go to one screening',
          url: 'https://filmadelphia.org/',
          when: 'Festival volunteering is seasonal; screenings year-round'
        },
        script: 'Hi! I\'d like to volunteer at the festival. I haven\'t done it before and I\'ll be on my own — which roles suit a first-timer, and when does sign-up open?',
        expect: [
          'Volunteers work shifts in small teams and usually get in free',
          'A film gives you something to talk about afterwards',
          'Festival work is intense but time-boxed to a couple of weeks',
          'Screenings on their own are a zero-commitment start'
        ],
        solo: 5, gentleness: 4, structure: 'shift', commitment: 'seasonal', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'impact']
      },
      {
        id: 'phl-treetenders',
        name: 'PHS Tree Tenders',
        neighborhood: 'Neighbourhoods citywide',
        blurb: 'The Pennsylvania Horticultural Society trains neighbours to plant and care for street trees, then sends them out in crews to do it.',
        interests: ['gardening', 'environment', 'volunteering', 'civic', 'outdoors'],
        url: 'https://phsonline.org/',
        firstStep: {
          kind: 'register',
          label: 'Join a tree planting, or take the Tree Tenders course',
          url: 'https://phsonline.org/',
          when: 'Plantings in spring and fall; courses through the year'
        },
        script: 'Hi! I\'d like to help with tree plantings in my neighbourhood. Do I need the training course first, or can I come to a planting as a newcomer?',
        expect: [
          'You are put in a crew of four or five — the small group is what makes talking easy',
          'Tools, gloves and a short training are provided',
          'No gardening knowledge assumed',
          'The course gives you a cohort if you want something ongoing'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'phl-muralarts',
        name: 'Mural Arts Philadelphia',
        neighborhood: 'Citywide',
        blurb: 'The largest public art programme in the country. Volunteers help paint murals alongside artists and neighbours — a shared task with an obvious, visible result.',
        interests: ['art', 'volunteering', 'civic', 'social'],
        url: 'https://www.muralarts.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for a community paint day',
          url: 'https://www.muralarts.org/',
          when: 'Paint days and tours through the year'
        },
        script: 'Hi! I\'d like to help at a community paint day. I have no art training at all — is that fine, and when\'s the next one?',
        expect: [
          'No art ability required; the work is guided and forgiving',
          'Painting beside someone removes the pressure to make eye contact',
          'Free',
          'You can walk past the result for years afterwards'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'phl-backonmyfeet',
        name: 'Back on My Feet Philadelphia',
        neighborhood: 'Early-morning runs citywide',
        blurb: 'A running club that pairs volunteers with people experiencing homelessness for early-morning runs three times a week. Founded in Philadelphia.',
        interests: ['running', 'volunteering', 'fitness', 'social'],
        url: 'https://backonmyfeet.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up as a volunteer runner',
          url: 'https://backonmyfeet.org/',
          when: 'Runs three mornings a week, very early'
        },
        script: 'Hi! I\'d like to volunteer as a runner. I\'m not fast — is that a problem, and what\'s the first step?',
        expect: [
          'Pace genuinely does not matter; showing up repeatedly does',
          'Running beside someone is far easier than talking across a table',
          'Free, but the mornings are early — that is the real commitment',
          'You see the same team three times a week, which builds something quickly'
        ],
        solo: 5, gentleness: 4, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day'], size: 'medium', goals: ['impact', 'friends', 'routine']
      },
      {
        id: 'phl-meditation',
        name: 'Philadelphia Meditation Center',
        neighborhood: 'Center City',
        blurb: 'A small, non-sectarian meditation centre with free weekly sittings and introductions aimed squarely at people who have never done it.',
        interests: ['stillness', 'faith', 'support'],
        url: 'https://philadelphiameditation.org/',
        firstStep: {
          kind: 'visit',
          label: 'Go to one weekly sitting',
          url: 'https://philadelphiameditation.org/',
          when: 'Weekly sittings \u2014 check the schedule'
        },
        script: 'Hi \u2014 I\'ve never meditated in a group before. Is the weekly sitting open to complete beginners, and is there anything I should bring?',
        expect: [
          'Instructions are given aloud, so you always know what to do',
          'Free or by donation',
          'Silence means no obligation to make conversation',
          'Small enough that someone will say hello'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['routine', 'friends']
      },
      {
        id: 'phl-swing',
        name: 'Philly Swing Dance Society',
        neighborhood: 'Center City',
        blurb: 'Weekly swing dances with a beginner lesson beforehand. The lesson rotates partners, so you arrive alone and have danced with fifteen people by the end of the night.',
        interests: ['dance', 'music', 'social', 'fitness'],
        url: 'https://phillyswing.com/',
        firstStep: {
          kind: 'dropin',
          label: 'Turn up for the beginner lesson before the dance',
          url: 'https://phillyswing.com/',
          when: 'Weekly dance night \u2014 check the site'
        },
        script: null,
        expect: [
          'A beginner lesson runs before the dance — turn up for that and you are taught the basics',
          'Partners rotate during the lesson, so you do not need to bring one',
          'Nobody cares that you are bad; everyone there was bad once and remembers it',
          'One fixed night a week, which is what turns faces into friends'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'phl-pada',
        name: 'Philadelphia Area Disc Alliance',
        neighborhood: 'Fields across the city',
        blurb: 'Ultimate frisbee leagues and pickup across Philadelphia, with recreational divisions built for people who have never played.',
        interests: ['sports', 'fitness', 'outdoors', 'social'],
        url: 'https://pada.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up solo for a recreational league, or find pickup',
          url: 'https://pada.org/',
          when: 'Seasonal leagues; pickup year-round'
        },
        script: 'Hi! I\'ve never played ultimate but I\'d like to try. Which league suits a complete beginner, and can I sign up on my own?',
        expect: [
          'Individuals are placed on teams \u2014 you do not need to bring anyone',
          'Recreational divisions expect beginners',
          'Pickup is usually free; leagues have a fee',
          'The same team every week is what makes it stick'
        ],
        solo: 4, gentleness: 3, structure: 'register', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['friends', 'routine', 'skill']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
