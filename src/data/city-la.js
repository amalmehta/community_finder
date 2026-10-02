/* Curated communities — Los Angeles. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'la',
    name: 'Los Angeles',
    region: 'CA',
    aliases: ['los angeles', 'la', 'l a', 'socal', 'southern california', 'hollywood', 'santa monica', 'pasadena', 'long beach', 'silver lake', 'echo park', 'the valley', 'san fernando valley'],
    orgs: [
      {
        id: 'la-laworks',
        name: 'L.A. Works',
        neighborhood: 'Citywide',
        blurb: 'The city\'s clearing house for one-off volunteer projects — park cleanups, meal service, tutoring, builds — each run by a trained leader whose job is to welcome newcomers.',
        interests: ['volunteering', 'social', 'mentoring', 'civic'],
        url: 'https://www.laworks.com/',
        firstStep: {
          kind: 'signup',
          label: 'Pick one project from the calendar and sign up',
          url: 'https://www.laworks.com/',
          when: 'Projects most days, including weekends'
        },
        expect: [
          'One project at a time — no ongoing obligation',
          'Projects are spread across the county, so something will be near you',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'la-foodbank',
        name: 'Los Angeles Regional Food Bank',
        neighborhood: 'City of Commerce warehouse',
        blurb: 'Warehouse shifts sorting and packing food for the county. Simple, physical, obviously useful, and done shoulder to shoulder with a room full of people.',
        interests: ['volunteering', 'food'],
        url: 'https://www.lafoodbank.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book a single volunteer shift',
          url: 'https://www.lafoodbank.org/volunteer/',
          when: 'Morning and afternoon shifts most days'
        },
        expect: [
          'Five minutes of training, then a task you cannot get wrong',
          'Two to three hours and you are done',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'la-lapl',
        name: 'Los Angeles Public Library',
        neighborhood: '70+ branches',
        blurb: 'Free book clubs, conversation groups for English learners, writing workshops, craft nights, storytimes and talks, in every neighbourhood across the city.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'parents'],
        url: 'https://www.lapl.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your nearest branch',
          url: 'https://www.lapl.org/whats-on',
          when: 'Daily'
        },
        expect: [
          'Free, and usually no registration',
          'In a city this spread out, your branch is the nearest thing to a town square',
          'Conversation groups exist so strangers talk to each other',
          'Nobody asks why you came'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'la-crashspace',
        name: 'CRASH Space',
        neighborhood: 'Culver City',
        blurb: 'A long-running volunteer hackerspace with electronics, 3D printing, laser cutting and sewing, plus open nights where anyone can walk in and look around.',
        interests: ['making', 'tech', 'art', 'crafts'],
        url: 'https://crashspace.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come to an open night',
          url: 'https://crashspace.org/',
          when: 'Weekly open evening — check the site'
        },
        expect: [
          'Open nights exist precisely so strangers can come in',
          '"Can you show me around?" is a sentence these places hear constantly',
          'Visiting is free; membership costs money'
        ],
        solo: 4, gentleness: 3, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-eve'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'la-lgbtcenter',
        name: 'Los Angeles LGBT Center',
        neighborhood: 'Hollywood + Anita May Rosenstein campus',
        blurb: 'The largest LGBTQ+ organisation in the world, with free groups, arts programming, a senior centre and youth services across several campuses.',
        interests: ['lgbtq', 'social', 'support', 'newcomer'],
        url: 'https://lalgbtcenter.org/',
        firstStep: {
          kind: 'visit',
          label: 'Pick one free group or event from the calendar',
          url: 'https://lalgbtcenter.org/',
          when: 'Programs most days'
        },
        expect: [
          'Most programs are free',
          'Staff are used to people arriving knowing nobody',
          'The scale means there is something for almost every age and interest',
          'Volunteering is a good way in if attending a group feels like too much'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'la-spcala',
        name: 'spcaLA',
        neighborhood: 'Los Angeles + Long Beach',
        blurb: 'Animal shelter with a volunteer programme covering dog walking, cat socialising and adoption events — work where the animal carries the social load.',
        interests: ['animals', 'volunteering'],
        url: 'https://spcala.com/',
        firstStep: {
          kind: 'signup',
          label: 'Apply and attend a volunteer orientation',
          url: 'https://spcala.com/volunteer/',
          when: 'Orientations regularly; shifts most days'
        },
        expect: [
          'Application and orientation come before your first shift',
          'Dog walking is solo-friendly but still puts you among the regulars',
          'Free, with a minimum commitment once trained',
          'Fostering is the option if leaving the house is the hard part'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'large', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'la-treepeople',
        name: 'TreePeople',
        neighborhood: 'Coldwater Canyon + plantings citywide',
        blurb: 'Volunteer tree plantings and park restoration days across the county. You get put in a small crew, handed a shovel, and plant something permanent before lunch.',
        interests: ['environment', 'gardening', 'volunteering', 'outdoors'],
        url: 'https://treepeople.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for one planting or restoration day',
          url: 'https://treepeople.org/volunteer/',
          when: 'Weekend mornings through the season'
        },
        expect: [
          'Crews of four or five — the small group is what makes talking easy',
          'Tools, gloves and a short training are provided',
          'Free, and finished by early afternoon',
          'No gardening knowledge assumed'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'la-healthebay',
        name: 'Heal the Bay',
        neighborhood: 'Beaches across the county',
        blurb: 'Beach cleanups and an aquarium on the Santa Monica pier. A cleanup is two hours outdoors with a clear task and no requirement to be interesting.',
        interests: ['environment', 'outdoors', 'volunteering', 'nature'],
        url: 'https://healthebay.org/',
        firstStep: {
          kind: 'signup',
          label: 'Join one beach cleanup',
          url: 'https://healthebay.org/volunteer/',
          when: 'Monthly cleanups plus bigger seasonal ones'
        },
        expect: [
          'Bags, gloves and instructions are handed to you when you arrive',
          'Two hours, outdoors, finished by lunchtime',
          'Free, and you end up at the beach either way',
          'People come alone constantly'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'la-labike',
        name: 'Los Angeles County Bicycle Coalition',
        neighborhood: 'Countywide',
        blurb: 'Advocacy plus group rides and free classes for riding in a city built for cars — which is exactly the situation where riding with a group helps.',
        interests: ['cycling', 'civic', 'environment', 'social'],
        url: 'https://la-bike.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a group ride or a free confidence class',
          url: 'https://la-bike.org/',
          when: 'Rides and classes through the year'
        },
        expect: [
          'Classes exist specifically for people who find the roads frightening',
          'A group of fifteen is visible in a way you alone are not',
          'Usually free or low-cost'
        ],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['skill', 'friends', 'impact']
      },
      {
        id: 'la-ciclavia',
        name: 'CicLAvia',
        neighborhood: 'Rotating routes across LA',
        blurb: 'Closes miles of LA streets to cars for a day and fills them with people walking and cycling. Volunteering puts you at a junction with a job and thousands of cheerful strangers.',
        interests: ['cycling', 'civic', 'volunteering', 'social', 'outdoors'],
        url: 'https://www.ciclavia.org/',
        firstStep: {
          kind: 'signup',
          label: 'Volunteer at the next event, or just turn up and ride it',
          url: 'https://www.ciclavia.org/volunteer',
          when: 'Several events a year, on Sundays'
        },
        expect: [
          'Free, and the event itself is free to attend',
          'It is the one day LA feels like a single city rather than a hundred suburbs',
          'A few hours, no ongoing commitment'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'la-groundlings',
        name: 'The Groundlings',
        neighborhood: 'Melrose Avenue',
        blurb: 'The improv and sketch school behind a startling number of comedians, with a basic class full of people who have never done it and shows most nights.',
        interests: ['theater', 'social'],
        url: 'https://groundlings.com/',
        firstStep: {
          kind: 'register',
          label: 'See a cheap show first, then book the basic class',
          url: 'https://groundlings.com/',
          when: 'Shows most nights; classes in terms'
        },
        expect: [
          'The basic level assumes no experience and no early performing',
          'You will know a dozen names after one evening',
          'Classes cost real money — a show is cheap reconnaissance first',
          'Being bad at it together is the entire activity'
        ],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'la-insightla',
        name: 'InsightLA',
        neighborhood: 'Several locations + online',
        blurb: 'Secular mindfulness and meditation community with free weekly sittings and introductory courses aimed at people who have never meditated.',
        interests: ['stillness', 'faith', 'support'],
        url: 'https://insightla.org/',
        firstStep: {
          kind: 'visit',
          label: 'Go to one free weekly sitting, or an intro course',
          url: 'https://insightla.org/',
          when: 'Sittings weekly; courses through the year'
        },
        expect: [
          'Instructions are spoken aloud, so you always know what to do',
          'Many sittings are free or by donation',
          'You can sit on a chair; no particular posture is required',
          'Silence means no obligation to talk until you want to'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['routine', 'friends']
      },
      {
        id: 'la-cinematheque',
        name: 'American Cinematheque',
        neighborhood: 'Egyptian & Aero Theatres',
        blurb: 'Repertory screenings in two historic theatres, with Q&As and themed series. Volunteering is a way in, and the audience actually talks about the film afterwards.',
        interests: ['filmphoto', 'art', 'volunteering', 'social'],
        url: 'https://www.americancinematheque.com/',
        firstStep: {
          kind: 'rsvp',
          label: 'Go to one screening in a series you like',
          url: 'https://www.americancinematheque.com/',
          when: 'Screenings most nights'
        },
        expect: [
          'Themed series bring back the same faces week after week',
          'Tickets are modest; membership is cheaper per film',
          'In a company town, the post-film conversation is never short'
        ],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'la-frontrunners',
        name: 'LA Frontrunners',
        neighborhood: 'Griffith Park, West Hollywood & more',
        blurb: 'An LGBTQ+ and allies running and walking club with free weekly group runs at every pace, and coffee afterwards that is arguably the real event.',
        interests: ['running', 'lgbtq', 'social', 'fitness', 'outdoors'],
        url: 'https://lafrontrunners.com/',
        firstStep: {
          kind: 'dropin',
          label: 'Turn up to a weekly group run — walkers included',
          url: 'https://lafrontrunners.com/',
          when: 'Several runs a week; check the schedule'
        },
        expect: [
          'Walkers and slow runners are explicitly part of the point',
          'Free to come to a group run',
          'Coffee or brunch afterwards is where you actually meet people'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['friends', 'routine']
      },
      {
        id: 'la-silverlake',
        name: 'Silverlake Conservatory of Music',
        neighborhood: 'Silver Lake',
        blurb: 'A non-profit community music school with adult group classes and ensembles, and a financial aid programme that is central to how it runs rather than an afterthought.',
        interests: ['music', 'social'],
        url: 'https://silverlakeconservatory.com/',
        firstStep: {
          kind: 'email',
          label: 'Ask which adult group classes take absolute beginners',
          url: 'https://silverlakeconservatory.com/',
          when: 'Terms start a few times a year'
        },
        expect: [
          'Adult beginner groups exist and are not full of former prodigies',
          'A weekly ensemble with the same people is the actual friendship mechanism',
          'Classes cost money; ask about financial aid, which they take seriously',
          'No audition for the community groups'
        ],
        solo: 4, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'la-lindygroove',
        name: 'Lindy Groove',
        neighborhood: 'Pasadena',
        blurb: 'A long-running weekly swing dance with a beginner lesson beforehand. Partner dancing with rotation is one of the most efficient ways to meet people that exists.',
        interests: ['dance', 'music', 'social', 'fitness'],
        url: 'https://www.lindygroove.com/',
        firstStep: {
          kind: 'dropin',
          label: 'Arrive early for the beginner lesson, then stay for the dance',
          url: 'https://www.lindygroove.com/',
          when: 'Weekly dance night \u2014 check the site'
        },
        expect: [
          'A beginner lesson runs before the dance — turn up for that and you are taught the basics',
          'Partners rotate during the lesson, so you do not need to bring one',
          'One fixed night a week, which is what turns faces into friends'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve'], size: 'large', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'la-laout',
        name: 'LAOUT (Los Angeles Organization of Ultimate Teams)',
        neighborhood: 'Fields across the county',
        blurb: 'Ultimate frisbee leagues and pickup across LA, with beginner-friendly divisions and individual sign-ups that place you on a team.',
        interests: ['sports', 'fitness', 'outdoors', 'social'],
        url: 'https://laout.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up solo for a beginner-friendly league, or find pickup',
          url: 'https://laout.org/',
          when: 'Seasonal leagues; pickup year-round'
        },
        expect: [
          'Beginner divisions exist and are where to start',
          'Pickup is usually free; leagues cost money',
          'In a city this spread out, a weekly fixture is worth a lot'
        ],
        solo: 4, gentleness: 3, structure: 'register', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['friends', 'routine', 'skill']
      },
      {
        id: 'la-bicyclekitchen',
        name: 'The Bicycle Kitchen',
        neighborhood: 'East Hollywood',
        blurb: 'A volunteer-run DIY bike repair co-op where you fix your own bike with their tools and a "cook" looking over your shoulder when you get stuck.',
        interests: ['making', 'cycling', 'volunteering', 'social'],
        url: 'https://bicyclekitchen.org/',
        firstStep: {
          kind: 'visit',
          label: 'Bring your bike during open shop hours',
          url: 'https://bicyclekitchen.org/',
          when: 'Open shop several days a week'
        },
        expect: [
          'Volunteers teach rather than fix it for you',
          'Small hourly donation; far cheaper than a shop',
          'In a city built for cars, this is a room full of people who chose otherwise'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'la-myco',
        name: 'Los Angeles Mycological Society',
        neighborhood: 'Forays in the mountains & canyons',
        blurb: 'A mushroom club running forays into the Angeles National Forest and local canyons after the rains, plus identification meetings.',
        interests: ['nature', 'outdoors', 'food', 'social'],
        url: 'https://lamushrooms.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a foray or a meeting as a guest',
          url: 'https://lamushrooms.org/',
          when: 'Forays after winter rain; meetings through the year'
        },
        expect: [
          'A good excuse to get out of the basin and into the mountains',
          'Modest membership; guests usually welcome first',
          'Never eat anything without an expert confirming it'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 1,
        when: ['weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'la-velaslavasay',
        name: 'Velaslavasay Panorama',
        neighborhood: 'University Park',
        blurb: 'A 360-degree painted panorama in a former 1920s cinema, with a garden behind it, run as a deliberately anachronistic exhibition hall. There is nothing else like it.',
        interests: ['art', 'filmphoto', 'social', 'books'],
        url: 'https://panoramaonview.org/',
        firstStep: {
          kind: 'visit',
          label: 'Visit on an open afternoon, or go to one event',
          url: 'https://panoramaonview.org/',
          when: 'Weekend open hours plus events'
        },
        expect: [
          'Tiny admission, and the visit takes under an hour',
          'The garden behind it is free to sit in',
          'Events are small, odd and friendly',
          'An easy place to go alone and then have something to tell people about'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 1,
        when: ['weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'la-clockshop',
        name: 'Clockshop',
        neighborhood: 'Frogtown / Elysian Valley',
        blurb: 'An arts organisation that puts on free readings, talks and performances in odd public places along the LA River, including the former Bowtie rail yard.',
        interests: ['art', 'books', 'writing', 'social', 'outdoors'],
        url: 'https://clockshop.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'RSVP to a free event',
          url: 'https://clockshop.org/',
          when: 'Events through the year, mostly weekends'
        },
        expect: [
          'Most events are free with an RSVP',
          'Outdoor settings are less intense than a gallery opening',
          'Small crowds, so people actually talk to each other',
          'It takes you to parts of the river you would never otherwise visit'
        ],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'la-gardencouncil',
        name: 'LA Community Garden Council',
        neighborhood: 'Gardens across the county',
        blurb: 'Supports more than a hundred community gardens across LA. Most have workdays and waiting lists, and the council can point you at the one nearest you.',
        interests: ['gardening', 'food', 'environment', 'civic', 'volunteering'],
        url: 'https://www.lagardencouncil.org/',
        firstStep: {
          kind: 'email',
          label: 'Ask which garden near you is taking volunteers or members',
          url: 'https://www.lagardencouncil.org/',
          when: 'Workdays vary by garden'
        },
        expect: [
          'You meet people who live within a few blocks of you, which is rare in LA',
          'Plots often have waiting lists, but volunteering usually does not',
          'Free or a small annual plot fee'
        ],
        solo: 4, gentleness: 4, structure: 'register', commitment: 'seasonal', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'small', goals: ['friends', 'impact', 'skill']
      },
      {
        id: 'la-gamehaus',
        name: 'The Game Haus Cafe',
        neighborhood: 'Glendale',
        blurb: 'A board game cafe with a library of well over a thousand games and staff whose job is to teach them to you and seat you with other people.',
        interests: ['games', 'social'],
        url: 'https://gamehauscafe.com/',
        firstStep: {
          kind: 'visit',
          label: 'Come in alone and ask to be seated with a group',
          url: 'https://gamehauscafe.com/',
          when: 'Open daily, afternoons and evenings'
        },
        expect: [
          'A board game is the easiest possible structure for talking to strangers',
          'Small cover charge for unlimited play',
          'In a city where everything requires a plan, this requires none'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'routine', 'skill']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
