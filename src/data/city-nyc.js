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
        expect: [
          'Every project has a trained team leader — you will be told exactly what to do',
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
        expect: [
          'Everyone in the room signed up alone to learn something they know nothing about',
          'One evening, one class — no term, no cohort, no commitment',
          'Cheap enough that bailing costs you almost nothing'
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
        expect: [
          'Gardens are run by neighbours, so you meet people who live on your actual block',
          'Many have a posted open-hours sign — turning up then is expected',
          'Usually free or a nominal membership; workdays are open to anyone'
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
        expect: [
          'Most groups are free and drop-in',
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
        interests: ['books', 'language', 'social', 'newcomer', 'crafts', 'writing', 'games', 'parents'],
        url: 'https://www.bklynlibrary.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your nearest branch',
          url: 'https://www.bklynlibrary.org/calendar',
          when: 'Daily, including evenings and weekends'
        },
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
        expect: [
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
        expect: [
          'Beginner walks are a standing category — you are the target audience',
          'Loaner binoculars are often available if you ask',
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
        expect: [
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
        expect: [
          'Annual membership is a fraction of a private gym, and some centers are free',
          'Recurring classes mean you see the same faces weekly',
          'Staff are used to people walking in to ask questions',
          'Bring ID and proof of address when you sign up'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['routine', 'friends']
      },
      {
        id: 'nyc-acc',
        name: 'Animal Care Centers of NYC',
        neighborhood: 'Manhattan, Brooklyn, Staten Island',
        blurb: 'The city\'s shelter system. Volunteers walk dogs, socialise cats and help at adoption events — work where the animal carries the social load for you.',
        interests: ['animals', 'volunteering'],
        url: 'https://www.nycacc.org/',
        firstStep: {
          kind: 'signup',
          label: 'Apply and attend a volunteer orientation',
          url: 'https://www.nycacc.org/',
          when: 'Orientations run regularly; shifts daily'
        },
        expect: [
          'Expect an application and an orientation — shelters invest in training you',
          'Dog walking and cat socialising are solo-friendly by design',
          'You see the same regular volunteers week to week',
          'Free, with a minimum commitment once you are trained'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'nyc-parkslopeparents',
        name: 'Park Slope Parents',
        neighborhood: 'Brooklyn',
        blurb: 'A long-running Brooklyn parents\' network with new-parent groups organised by your baby\'s birth month — which means everyone in the room is at exactly your stage.',
        interests: ['parents', 'social', 'newcomer', 'support'],
        url: 'https://parkslopeparents.com/',
        firstStep: {
          kind: 'signup',
          label: 'Join and sign up for a new-parent group',
          url: 'https://parkslopeparents.com/',
          when: 'Groups form continuously'
        },
        expect: [
          'Birth-month groups mean everyone is dealing with the same week of chaos you are',
          'There is a membership fee — check the current rate',
          'Meetings happen in homes and parks, which is lower-key than an event',
          'The classifieds and advice archive alone are worth the membership'
        ],
        solo: 4, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 1,
        when: ['weekday-day', 'weekend'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'nyc-bronxdoc',
        name: 'Bronx Documentary Center',
        neighborhood: 'South Bronx',
        blurb: 'A photography and documentary space running free classes and exhibitions, with a strong commitment to its own neighbourhood rather than the art world.',
        interests: ['filmphoto', 'art', 'civic', 'social'],
        url: 'https://www.bronxdoc.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Go to a free exhibition opening, or apply for a free class',
          url: 'https://www.bronxdoc.org/',
          when: 'Exhibitions and classes through the year'
        },
        expect: [
          'Free classes exist and are aimed at the community, not professionals',
          'Openings are free and you can look at photographs instead of making conversation',
          'Small space, so people notice and talk to newcomers',
          'A course gives you the same group of people over several weeks'
        ],
        solo: 5, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'nyc-nyinsight',
        name: 'New York Insight Meditation Center',
        neighborhood: 'Chelsea',
        blurb: 'Secular-leaning meditation centre with free and donation-based sittings, plus courses explicitly for people who have never meditated.',
        interests: ['stillness', 'faith', 'support', 'social'],
        url: 'https://www.nyimc.org/',
        firstStep: {
          kind: 'visit',
          label: 'Go to one drop-in sitting or an introductory course',
          url: 'https://www.nyimc.org/',
          when: 'Sittings most weeks; courses through the year'
        },
        expect: [
          'Instructions are given out loud — you are told exactly what to do',
          'Silence means you are not required to talk to anyone',
          'Courses run in blocks, so you see the same faces repeatedly'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'nyc-bkcm',
        name: 'Brooklyn Conservatory of Music',
        neighborhood: 'Park Slope',
        blurb: 'Community music school with adult group classes, ensembles and a community chorus that takes people who cannot read music.',
        interests: ['music', 'social'],
        url: 'https://www.bkcm.org/',
        firstStep: {
          kind: 'email',
          label: 'Ask which adult group class or chorus takes beginners',
          url: 'https://www.bkcm.org/',
          when: 'Terms start a few times a year'
        },
        expect: [
          'Adult beginner groups exist and are not full of former prodigies',
          'A chorus or ensemble is a weekly commitment with the same people — the thing that builds friendships',
          'Classes cost money; ask about sliding scale or aid',
          'No audition for the community groups'
        ],
        solo: 4, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'nyc-cityreliquary',
        name: 'City Reliquary',
        neighborhood: 'Williamsburg',
        blurb: 'A tiny volunteer-run museum of New York ephemera \u2014 subway tokens, Statue of Liberty souvenirs, a rock from every borough \u2014 that also throws block parties and runs a backyard bar.',
        interests: ['art', 'books', 'social', 'volunteering'],
        url: 'https://cityreliquary.org/',
        firstStep: {
          kind: 'visit',
          label: 'Visit on an open day, or come to one of their events',
          url: 'https://cityreliquary.org/',
          when: 'Weekend open hours plus events'
        },
        expect: [
          'Tiny admission, and the whole place takes twenty minutes',
          'It is run by volunteers, so asking how to help is a normal thing to do',
          'The backyard events are low-key and full of people who like odd things'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'nyc-brooklyngrange',
        name: 'Brooklyn Grange',
        neighborhood: 'Brooklyn Navy Yard & Sunset Park rooftops',
        blurb: 'Rooftop farms on top of industrial buildings, with volunteer days and open hours. Weeding a field of kale with the Manhattan skyline behind it is a strange and excellent way to spend a morning.',
        interests: ['gardening', 'food', 'environment', 'volunteering', 'outdoors'],
        url: 'https://www.brooklyngrangefarm.com/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for a volunteer day',
          url: 'https://www.brooklyngrangefarm.com/',
          when: 'Volunteer days in the growing season'
        },
        expect: [
          'No farming experience assumed at all',
          'Volunteer days are free; some events are ticketed',
          'The view is the reason to come back'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'nyc-bigreuse',
        name: 'Big Reuse',
        neighborhood: 'Gowanus & Astoria',
        blurb: 'A reuse warehouse selling salvaged building materials, plus one of the city\'s largest community compost sites under the Queensboro Bridge.',
        interests: ['environment', 'gardening', 'volunteering', 'making', 'outdoors'],
        url: 'https://www.bigreuse.org/',
        firstStep: {
          kind: 'signup',
          label: 'Join a compost volunteer session, or visit the warehouse',
          url: 'https://www.bigreuse.org/',
          when: 'Volunteer sessions through the week'
        },
        expect: [
          'Turning compost is simple physical work with clear instructions',
          'Free, and the warehouse is worth a look either way',
          'Sessions are a couple of hours with no ongoing obligation'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'small', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'nyc-caveat',
        name: 'Caveat',
        neighborhood: 'Lower East Side',
        blurb: 'A basement theatre for "intelligent nightlife" \u2014 nerdy live shows where scientists, historians and comedians explain something obscure to an audience holding drinks.',
        interests: ['social', 'books', 'tech', 'theater'],
        url: 'https://www.caveat.nyc/',
        firstStep: {
          kind: 'rsvp',
          label: 'Buy a ticket to whichever show sounds strangest',
          url: 'https://www.caveat.nyc/',
          when: 'Shows most nights'
        },
        expect: [
          'The show gives you something to say to whoever is next to you',
          'Going alone is entirely normal here',
          'Tickets are cheap and there is a fixed end time',
          'Audience participation is optional and never cruel'
        ],
        solo: 5, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'nyc-mycological',
        name: 'New York Mycological Society',
        neighborhood: 'Forays in parks across the city',
        blurb: 'Founded in part by the composer John Cage, this club walks slowly through city parks looking at mushrooms. Free, beginner-friendly, and almost nobody knows it exists.',
        interests: ['nature', 'outdoors', 'food', 'social'],
        url: 'https://newyorkmyc.org/',
        firstStep: {
          kind: 'dropin',
          label: 'Join a free foray \u2014 just turn up at the meeting point',
          url: 'https://newyorkmyc.org/',
          when: 'Weekend forays through the season'
        },
        expect: [
          'Free, and no membership needed to join a walk',
          'Slow walking and a lot of crouching. It is not a hike',
          'Never eat anything without an expert confirming it'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'nyc-greenwood',
        name: 'Green-Wood Cemetery',
        neighborhood: 'Sunset Park, Brooklyn',
        blurb: 'A 478-acre Victorian cemetery that doubles as an arboretum, bird sanctuary and events venue, with volunteer days, tours and a resident flock of monk parakeets.',
        interests: ['nature', 'outdoors', 'volunteering', 'books', 'social'],
        url: 'https://www.green-wood.com/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a tour or a volunteer day',
          url: 'https://www.green-wood.com/',
          when: 'Tours and volunteer days year-round'
        },
        expect: [
          'Free to walk in, and it is enormous and quiet',
          'Volunteer days involve gardening and restoration with a small crew',
          'The view from the top is one of the best in the city'
        ],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekend', 'weekday-day'], size: 'medium', goals: ['friends', 'impact']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
