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
        interests: ['books', 'language', 'social', 'newcomer', 'crafts', 'making', 'writing', 'parents'],
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
      },
      {
        id: 'chi-paws',
        name: 'PAWS Chicago',
        neighborhood: 'Lincoln Park + Little Village',
        blurb: 'The city\'s largest no-kill shelter, with a big, well-run volunteer programme — dog walking, cat socialising and adoption events.',
        interests: ['animals', 'volunteering'],
        url: 'https://www.pawschicago.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for a volunteer orientation',
          url: 'https://www.pawschicago.org/how-to-help/volunteer/',
          when: 'Orientations monthly; shifts daily'
        },
        script: null,
        expect: [
          'Orientation first, then you pick recurring shifts',
          'The animals give you something to do with your hands and eyes',
          'Shift regulars become familiar faces quickly',
          'Free, but they ask for a real commitment after training you'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'chi-filmmakers',
        name: 'Chicago Filmmakers',
        neighborhood: 'Edgewater',
        blurb: 'A film cooperative running classes, screenings and volunteer opportunities for people who want to make things rather than just watch them.',
        interests: ['filmphoto', 'art', 'making', 'social'],
        url: 'https://www.chicagofilmmakers.org/',
        firstStep: {
          kind: 'register',
          label: 'Take one short class, or volunteer at a screening',
          url: 'https://www.chicagofilmmakers.org/',
          when: 'Classes and screenings through the year'
        },
        script: 'Hi! I\'m interested in {interest} and completely new to it. Which class would you point a beginner to, and do you need volunteers at screenings?',
        expect: [
          'Classes are aimed at independent beginners, not industry professionals',
          'Making anything on film requires collaborators — a structural reason to meet people',
          'Classes cost money; volunteering at a screening is free',
          'Screenings are a low-commitment way to see the place first'
        ],
        solo: 4, gentleness: 4, structure: 'course', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'chi-zlmc',
        name: 'Zen Life & Meditation Center of Chicago',
        neighborhood: 'Oak Park',
        blurb: 'Meditation centre running introductory sessions and courses for people with no background, in a deliberately unintimidating, non-monastic setting.',
        interests: ['stillness', 'faith', 'support'],
        url: 'https://www.zlmc.org/',
        firstStep: {
          kind: 'visit',
          label: 'Attend an introductory session',
          url: 'https://www.zlmc.org/',
          when: 'Weekly sittings plus intro courses'
        },
        script: 'Hi — I\'ve never meditated before. Is there an introductory session coming up, and do I need to know anything or bring anything?',
        expect: [
          'The introduction exists for people who have never done it',
          'You are told where to sit and what to do with your hands',
          'Usually by donation or a modest fee',
          'Silence means no pressure to make conversation'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['routine', 'friends']
      },
      {
        id: 'chi-oldtown',
        name: 'Old Town School of Folk Music',
        neighborhood: 'Lincoln Square',
        blurb: 'An institution built on adult group classes for absolute beginners — guitar, banjo, singing, ukulele — that end in a jam session in the bar downstairs.',
        interests: ['music', 'social', 'dance'],
        url: 'https://www.oldtownschool.org/',
        firstStep: {
          kind: 'register',
          label: 'Enrol in an eight-week adult beginner class',
          url: 'https://www.oldtownschool.org/classes/',
          when: 'Terms start several times a year'
        },
        script: null,
        expect: [
          'Group classes for adults who have never touched the instrument are the core of the place',
          'Eight weeks with the same people, then many classes carry on to the bar — this is how people actually make friends there',
          'Classes cost real money; instruments can be rented',
          'Free concerts and open jams are a way to scout first'
        ],
        solo: 5, gentleness: 5, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'chi-garfield',
        name: 'Garfield Park Conservatory',
        neighborhood: 'East Garfield Park',
        blurb: 'One of the largest conservatories in the country, free to enter, with volunteer days among the ferns. In February it is the warmest, greenest room in Chicago.',
        interests: ['gardening', 'nature', 'volunteering', 'social'],
        url: 'https://garfieldconservatory.org/',
        firstStep: {
          kind: 'visit',
          label: 'Visit free, then ask about volunteer days',
          url: 'https://garfieldconservatory.org/',
          when: 'Open most days; volunteer programmes year-round'
        },
        script: 'Hi! I visit often and would like to volunteer. What does getting started involve, and do I need any plant knowledge?',
        expect: [
          'Free admission, so a first visit costs you nothing',
          'Volunteering is indoors and warm, which matters from November to April',
          'No plant knowledge assumed',
          'A quiet place where sitting alone is completely normal'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'medium', goals: ['impact', 'friends', 'routine']
      },
      {
        id: 'chi-plant',
        name: 'Plant Chicago',
        neighborhood: 'Back of the Yards',
        blurb: 'A circular-economy nonprofit in a former meatpacking plant, running a farmers market, workshops and volunteer days around closed-loop food systems.',
        interests: ['environment', 'food', 'volunteering', 'making', 'gardening'],
        url: 'https://plantchicago.org/',
        firstStep: {
          kind: 'signup',
          label: 'Come to the market, or sign up for a volunteer day',
          url: 'https://plantchicago.org/',
          when: 'Markets and volunteer days through the year'
        },
        script: 'Hi! I\'d like to volunteer. I\'m interested in {interest} and new to all of this \u2014 what would suit someone starting out?',
        expect: [
          'Small organisation, so volunteers get talked to rather than processed',
          'Workshops give you a task and a small group',
          'Volunteering is free; workshops have a modest fee',
          'The building itself is worth the trip'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'small', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'chi-experimentalstation',
        name: 'Experimental Station',
        neighborhood: 'Woodlawn / Hyde Park',
        blurb: 'An independent cultural centre housing Blackstone Bicycle Works, a youth bike shop where volunteers teach repair, plus a farmers market and a bookshop.',
        interests: ['making', 'cycling', 'mentoring', 'volunteering', 'books'],
        url: 'https://experimentalstation.org/',
        firstStep: {
          kind: 'email',
          label: 'Ask about volunteering at Blackstone Bicycle Works',
          url: 'https://experimentalstation.org/',
          when: 'Weekday afternoons and Saturdays'
        },
        script: 'Hi! I\'d like to volunteer at the bike shop. I know a bit about bikes but nothing about teaching \u2014 is that a problem, and what\'s the first step?',
        expect: [
          'You teach kids bike repair, which gives every interaction an obvious purpose',
          'Bike knowledge helps but is not required \u2014 they will train you',
          'Free, with a regular weekly slot expected',
          'The shop is loud and busy, which is easier than a quiet room'
        ],
        solo: 5, gentleness: 4, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'small', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'chi-sweetwater',
        name: 'Sweet Water Foundation',
        neighborhood: 'Englewood / Washington Park',
        blurb: 'A "regenerative neighbourhood development" project \u2014 an urban farm, a timber-framed barn built by volunteers, and open community workdays on the South Side.',
        interests: ['gardening', 'making', 'civic', 'volunteering', 'food'],
        url: 'https://www.sweetwaterfoundation.com/',
        firstStep: {
          kind: 'visit',
          label: 'Come to a community workday or open event',
          url: 'https://www.sweetwaterfoundation.com/',
          when: 'Workdays and events through the growing season'
        },
        script: 'Hi! I\'d like to come to a workday. I have no farming or building experience \u2014 is that alright, and when is a good time to come?',
        expect: [
          'Work is shared and taught rather than assigned to specialists',
          'Free',
          'Building and growing things side by side removes the need to make conversation',
          'The place is genuinely unlike anything else in the city'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'small', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'chi-myco',
        name: 'Illinois Mycological Association',
        neighborhood: 'Forays around Chicagoland',
        blurb: 'A mushroom-hunting club running forays into forest preserves, with identification sessions afterwards. Deeply nerdy and very happy to take beginners along.',
        interests: ['nature', 'outdoors', 'food', 'social'],
        url: 'https://illinoismyco.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a foray as a guest',
          url: 'https://illinoismyco.org/',
          when: 'Forays through the warmer months'
        },
        script: 'Hello \u2014 I\'m a complete beginner and know nothing about mushrooms. Can I come along to a foray as a guest, and what should I bring?',
        expect: [
          'Beginners are the favourite kind of guest',
          'Slow walking and crouching, not hiking',
          'Modest membership; guests are usually welcome first',
          'Never eat anything without an expert confirming it'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 1,
        when: ['weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'chi-chesscenter',
        name: 'Chicago Chess Center',
        neighborhood: 'Rogers Park',
        blurb: 'A nonprofit chess club with open play, lessons and tournaments, set up specifically so the city has a permanent place to just turn up and play.',
        interests: ['games', 'social'],
        url: 'https://chicagochesscenter.com/',
        firstStep: {
          kind: 'visit',
          label: 'Come to an open play session',
          url: 'https://chicagochesscenter.com/',
          when: 'Open play most evenings; check the calendar'
        },
        script: 'Hi! I play chess casually and would like to come by. Which night suits an unrated beginner, and what is the fee for a first visit?',
        expect: [
          'A board is a conversation you do not have to start',
          'Open play exists for people who arrive alone \u2014 someone will play you',
          'Small drop-in fee or membership',
          'Being clearly worse than everyone there is a normal way to begin'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'routine', 'skill']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
