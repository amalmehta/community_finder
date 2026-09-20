/* Curated communities — New York City. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'nyc',
    name: 'New York City',
    region: 'NY',
    aliases: ['new york', 'nyc', 'new york city', 'brooklyn', 'manhattan', 'queens', 'the bronx', 'bronx', 'staten island', 'ny ny'],
    orgs: [
      {
        id: 'nyc-newyorkcares',
        name: 'New York Cares',
        neighborhood: 'All five boroughs',
        blurb: 'The city\'s clearing house for one-off volunteer projects — a few hours painting a school, serving meals, coaching a class. Hundreds of projects a month, each with a team leader whose job is to welcome you.',
        interests: ['volunteering', 'social', 'mentoring', 'civic'],
        url: 'https://www.newyorkcares.org/',
        firstStep: {
          kind: 'signup',
          label: 'Do the online orientation, then claim one project',
          url: 'https://www.newyorkcares.org/volunteer',
          when: 'Projects every day, including evenings and weekends'
        },
        script: null,
        expect: [
          'Every project has a trained team leader — you will be told exactly what to do',
          'Showing up alone is the norm, not the exception',
          'You pick one project at a time. There is no ongoing obligation',
          'Free, and there is something within a subway ride of wherever you live'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'nyc-openrun',
        name: 'NYRR Open Run',
        neighborhood: 'Parks across all five boroughs',
        blurb: 'A free, volunteer-run, untimed group run/walk every Saturday morning in dozens of neighborhood parks. No membership, no fee, no minimum pace.',
        interests: ['running', 'fitness', 'outdoors', 'social'],
        url: 'https://www.nyrr.org/openrun',
        firstStep: {
          kind: 'dropin',
          label: 'Find your nearest park and show up Saturday',
          url: 'https://www.nyrr.org/openrun',
          when: 'Saturday mornings, year-round'
        },
        script: null,
        expect: [
          'Walkers are explicitly welcome and finish last on purpose',
          'It is run by neighbours, not by a club — the vibe is local, not competitive',
          'Free. There is nothing to join',
          'Twenty minutes of your Saturday, and you can leave straight after'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'nyc-brainery',
        name: 'Brooklyn Brainery',
        neighborhood: 'Prospect Heights',
        blurb: 'Cheap, short, unpretentious classes on everything from pickling to tarot to Roman history, taught by locals. Most cost about the price of two coffees and last a single evening.',
        interests: ['crafts', 'food', 'books', 'art', 'writing', 'social'],
        url: 'https://brooklynbrainery.com/',
        firstStep: {
          kind: 'register',
          label: 'Book one single-evening class on something you know nothing about',
          url: 'https://brooklynbrainery.com/',
          when: 'Evenings and weekends, new classes monthly'
        },
        script: null,
        expect: [
          'Everyone in the room signed up alone to learn something they know nothing about',
          'One evening, one class — no term, no cohort, no commitment',
          'Cheap enough that bailing costs you almost nothing',
          'The shared subject means you never have to invent conversation'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'nyc-greenthumb',
        name: 'GreenThumb Community Gardens',
        neighborhood: '550+ gardens citywide',
        blurb: 'The city program behind hundreds of community gardens. Most have open hours and welcome new members — it is the most neighborhood-scale way to meet people in New York.',
        interests: ['gardening', 'environment', 'civic', 'social', 'food'],
        url: 'https://greenthumb.nycgovparks.org/',
        firstStep: {
          kind: 'visit',
          label: 'Find your nearest garden and go during open hours',
          url: 'https://greenthumb.nycgovparks.org/gardensearch.php',
          when: 'Open hours vary by garden; weekends are safest'
        },
        script: 'Hi! I live nearby and I\'d love to get involved with the garden. Are you taking new members or volunteers, and when is a good time to stop by?',
        expect: [
          'Gardens are run by neighbours, so you meet people who live on your actual block',
          'Many have a posted open-hours sign — turning up then is expected',
          'Usually free or a nominal membership; workdays are open to anyone',
          'A shared task removes the awkwardness of introductions'
        ],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'seasonal', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'small', goals: ['friends', 'impact', 'skill']
      },
      {
        id: 'nyc-resistor',
        name: 'NYC Resistor',
        neighborhood: 'Downtown Brooklyn',
        blurb: 'A long-running hacker collective with laser cutters, a well-stocked shop, classes, and regular open "craft night" evenings where anyone can walk in.',
        interests: ['making', 'tech', 'art'],
        url: 'https://www.nycresistor.com/',
        firstStep: {
          kind: 'visit',
          label: 'Come to an open craft night or class',
          url: 'https://www.nycresistor.com/',
          when: 'Regular open evenings — check the calendar'
        },
        script: 'Hi — I\'d like to come to an open night. I\'m interested in {interest} and I\'m a beginner. Is there anything I should bring, and is it OK to just turn up?',
        expect: [
          'Open nights exist specifically so strangers can come in',
          'Bring a project or bring nothing — both are fine',
          'People there like being asked what they are working on',
          'Open nights are free; classes cost money'
        ],
        solo: 4, gentleness: 3, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'nyc-prospectpark',
        name: 'Prospect Park Alliance volunteering',
        neighborhood: 'Brooklyn',
        blurb: 'Weekend stewardship days pulling invasive plants, mulching and restoring woodlands, in the best park in New York. Hard to feel awkward while holding a rake.',
        interests: ['environment', 'volunteering', 'outdoors', 'gardening'],
        url: 'https://www.prospectpark.org/',
        firstStep: {
          kind: 'signup',
          label: 'Register for a volunteer day',
          url: 'https://www.prospectpark.org/get-involved/volunteer/',
          when: 'Weekend mornings, seasonal'
        },
        script: null,
        expect: [
          'Tools, gloves and instructions are handed to you on arrival',
          'Groups are small enough that you end up talking to the same 3 people all morning',
          'Free, a few hours, no follow-up expected',
          'You will be outdoors and slightly muddy, which is a good excuse not to look polished'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'nyc-transalt',
        name: 'Transportation Alternatives',
        neighborhood: 'Borough committees citywide',
        blurb: 'Street-safety advocacy with volunteer committees in every borough. Monthly meetings, plus rides and actions — a way to be useful about something you already have opinions about.',
        interests: ['civic', 'cycling', 'environment', 'volunteering'],
        url: 'https://www.transalt.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Go to your borough committee\'s monthly meeting',
          url: 'https://www.transalt.org/volunteer',
          when: 'Monthly, usually weekday evenings'
        },
        script: 'Hi! I live in {city} and I\'d like to get involved with the local committee. Is the next meeting open to someone brand new, and do I need to prepare anything?',
        expect: [
          'Monthly meetings mean low commitment and a predictable rhythm',
          'New people are usually asked to introduce themselves — one sentence is fine',
          'Free',
          'You will be given something concrete to do if you want it, and nothing if you don\'t'
        ],
        solo: 4, gentleness: 4, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-eve'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'nyc-housingworks',
        name: 'Housing Works Bookstore',
        neighborhood: 'SoHo',
        blurb: 'A beautiful used bookstore staffed largely by volunteers, with readings and events most weeks. Profits fund services for people living with HIV/AIDS and homelessness.',
        interests: ['books', 'volunteering', 'writing', 'social'],
        url: 'https://www.housingworks.org/',
        firstStep: {
          kind: 'signup',
          label: 'Apply for a weekly bookstore shift',
          url: 'https://www.housingworks.org/volunteer',
          when: 'Weekly shifts; events most evenings'
        },
        script: 'Hi — I\'m interested in volunteering at the bookstore. What does the sign-up process look like, and what kind of time commitment are you looking for?',
        expect: [
          'Shelving books is a genuinely calming first volunteer job',
          'You see the same volunteers weekly, which is how acquaintances become friends',
          'Free readings in the evenings are a zero-commitment way to visit first',
          'Expect an application and a regular weekly slot'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'medium', goals: ['impact', 'friends', 'routine']
      },
      {
        id: 'nyc-lgbtcenter',
        name: 'The NYC LGBT Community Center',
        neighborhood: 'West Village',
        blurb: 'Hundreds of free groups every month — recovery, arts, parenting, trans and gender-nonconforming, newcomers, board games. You can walk in and sit in the cafe.',
        interests: ['lgbtq', 'social', 'support', 'newcomer'],
        url: 'https://gaycenter.org/',
        firstStep: {
          kind: 'visit',
          label: 'Pick one free group from the calendar and go',
          url: 'https://gaycenter.org/community/',
          when: 'Groups daily, mostly evenings'
        },
        script: 'Hi — I\'m new to the Center. Is the {interest} group open to drop-ins, and do I need to register beforehand?',
        expect: [
          'Most groups are free and drop-in',
          'You are allowed to sit in the lobby and leave without going to anything',
          'Staff expect people to arrive knowing nobody',
          'Groups are small enough that you will be spoken to'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'nyc-bpl',
        name: 'Brooklyn & New York Public Libraries',
        neighborhood: 'Every neighborhood',
        blurb: 'Free book clubs, ESOL conversation groups, knitting circles, chess, writing workshops and talks at hundreds of branches. Nobody asks why you came.',
        interests: ['books', 'language', 'social', 'newcomer', 'crafts', 'writing', 'games'],
        url: 'https://www.bklynlibrary.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your nearest branch',
          url: 'https://www.bklynlibrary.org/calendar',
          when: 'Daily, including evenings and weekends'
        },
        script: null,
        expect: [
          'Free, and usually no registration',
          'Branches are walkable, so bailing costs you nothing',
          'Conversation groups for English learners are built around strangers talking',
          'Also check nypl.org if you are in Manhattan, the Bronx or Staten Island'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'nyc-magnet',
        name: 'Magnet Theater',
        neighborhood: 'Chelsea',
        blurb: 'Improv school and theater with a famously warm beginner level-one class, plus cheap shows most nights. Level one is 100% people who have never done it.',
        interests: ['theater', 'social'],
        url: 'https://www.magnettheater.com/',
        firstStep: {
          kind: 'register',
          label: 'Sign up for a level-one class (or just see a cheap show first)',
          url: 'https://www.magnettheater.com/classes/',
          when: 'Terms start regularly; shows most nights'
        },
        script: null,
        expect: [
          'Level one assumes zero experience and no performance at the end for a while',
          'You will learn 12 names in one evening, which is more than most New Yorkers manage in a month',
          'Classes cost money — a $10 show is a good way to scout the building first',
          'Being bad at it is the shared activity'
        ],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'nyc-cityharvest',
        name: 'City Harvest',
        neighborhood: 'Citywide',
        blurb: 'Rescues food and distributes it through mobile markets. Volunteer shifts include handing out produce directly to neighbours — an afternoon with a very clear purpose.',
        interests: ['volunteering', 'food', 'civic'],
        url: 'https://www.cityharvest.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book a single mobile market or warehouse shift',
          url: 'https://www.cityharvest.org/volunteer/',
          when: 'Weekday and weekend shifts'
        },
        script: null,
        expect: [
          'One shift, fully self-contained',
          'Simple physical tasks with clear instructions',
          'You work in a small crew, which makes talking easy',
          'Free, and shifts run in most boroughs'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'nyc-5bbc',
        name: 'Five Boro Bicycle Club',
        neighborhood: 'Rides from all boroughs',
        blurb: 'A volunteer-run cycling club running graded rides every weekend, including genuinely slow ones. Rides are led, the pace is stated up front, and nobody gets dropped.',
        interests: ['cycling', 'outdoors', 'fitness', 'social'],
        url: 'https://www.5bbc.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join one "C" (relaxed) pace ride',
          url: 'https://www.5bbc.org/rides',
          when: 'Weekends, mostly mornings'
        },
        script: 'Hi! I\'d like to join a ride but I\'m not fast. Which upcoming ride would you recommend for someone who hasn\'t ridden with a group before?',
        expect: [
          'Rides are graded by pace — pick the slowest one and you will be fine',
          'A leader and a sweep mean you cannot get lost or left behind',
          'Most rides are free or nearly free for non-members to try',
          'Four hours side by side on a bike is a lot of conversation'
        ],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'weekly', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['friends', 'routine']
      },
      {
        id: 'nyc-audubon',
        name: 'NYC Bird Alliance',
        neighborhood: 'Parks in every borough',
        blurb: 'Guided bird walks — many free — in Central Park, Prospect Park and further out. Slow, quiet, outdoors, and full of people delighted to point at a warbler for you.',
        interests: ['nature', 'outdoors', 'environment'],
        url: 'https://www.nycbirdalliance.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a beginner bird walk',
          url: 'https://www.nycbirdalliance.org/events',
          when: 'Weekend and weekday mornings, strongest in spring and fall migration'
        },
        script: 'Hello — I\'m completely new to birding and don\'t have binoculars. Is the upcoming walk OK for beginners, and do you have loaners?',
        expect: [
          'Beginner walks are a standing category — you are the target audience',
          'Loaner binoculars are often available if you ask',
          'A lot of standing still, which is much easier than it sounds',
          'Many walks are free; some have a small fee'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'nyc-marshall',
        name: 'Marshall Chess Club',
        neighborhood: 'Greenwich Village',
        blurb: 'A 100-year-old chess club in a Village townhouse, with casual play alongside tournaments. A board means you never have to invent something to say.',
        interests: ['games', 'social'],
        url: 'https://www.marshallchessclub.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come by for casual play or a beginner event',
          url: 'https://www.marshallchessclub.org/',
          when: 'Most evenings; see the calendar'
        },
        script: 'Hi — I play chess casually and would like to visit. Is there an evening that suits an unrated player, and what\'s the fee for a first visit?',
        expect: [
          'There are entry fees and memberships — ask before you go',
          'Unrated beginners do show up; the club has run beginner nights for decades',
          'Playing is the social activity, so you can be quiet and still belong',
          'The building alone is worth the trip'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'routine', 'friends']
      },
      {
        id: 'nyc-betanyc',
        name: 'BetaNYC',
        neighborhood: 'Civic tech, Manhattan + online',
        blurb: 'Civic technology community running open hack nights and data workshops for community boards and neighbours. Non-technical people are actively wanted.',
        interests: ['tech', 'civic', 'volunteering'],
        url: 'https://beta.nyc/',
        firstStep: {
          kind: 'rsvp',
          label: 'RSVP to a hack night or workshop',
          url: 'https://beta.nyc/events/',
          when: 'Regular evening sessions'
        },
        script: 'Hi! I\'d like to come to an upcoming session. I\'m interested in {interest} — is it OK to come with no specific project and mostly listen the first time?',
        expect: [
          'Sessions usually start with newcomer introductions',
          'You do not need to code — research and writing help is short-handed',
          'Free',
          'Coming once and deciding it is not for you is completely fine'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve'], size: 'medium', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'nyc-fixers',
        name: 'Fixers Collective',
        neighborhood: 'Brooklyn',
        blurb: 'A repair collective where people bring broken lamps, toasters and radios and fix them together. Bringing a problem is the perfect excuse to talk to a stranger.',
        interests: ['making', 'environment', 'social'],
        url: 'https://fixerscollective.org/',
        firstStep: {
          kind: 'visit',
          label: 'Bring one broken thing to a session',
          url: 'https://fixerscollective.org/',
          when: 'Check the site for the current session schedule'
        },
        script: 'Hi — I have a broken {interest} item I\'d like to try fixing. Is the next session open to newcomers, and should I bring anything besides the object?',
        expect: [
          'You arrive with an object and a problem, which does all the social work for you',
          'No skills required — you work alongside someone who knows more',
          'Usually free or donation-based',
          'There is no expectation that the thing gets fixed'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends', 'impact']
      },
      {
        id: 'nyc-recenters',
        name: 'NYC Parks Recreation Centers',
        neighborhood: '30+ centers citywide',
        blurb: 'City-run gyms and rec centers with very cheap annual membership, plus free classes — basketball, swimming, dance, fitness — open to residents of any borough.',
        interests: ['fitness', 'sports', 'dance', 'social'],
        url: 'https://www.nycgovparks.org/facilities/recreationcenters',
        firstStep: {
          kind: 'visit',
          label: 'Find your nearest center and ask for a tour',
          url: 'https://www.nycgovparks.org/facilities/recreationcenters',
          when: 'Open daily; class schedules posted per center'
        },
        script: 'Hi — I live nearby and I\'m thinking about joining. Could I come look around, and which classes are included with a membership?',
        expect: [
          'Annual membership is a fraction of a private gym, and some centers are free',
          'Recurring classes mean you see the same faces weekly',
          'Staff are used to people walking in to ask questions',
          'Bring ID and proof of address when you sign up'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['routine', 'friends']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
