/* Curated communities — San Francisco Bay Area. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'sf',
    name: 'San Francisco Bay Area',
    region: 'CA',
    aliases: ['san francisco', 'sf', 'bay area', 'oakland', 'berkeley', 'sf bay', 'south bay', 'the city', 'san fran'],
    orgs: [
      {
        id: 'sf-np',
        name: 'November Project SF',
        neighborhood: 'Rotating parks & stairs',
        blurb: 'A free, loud, absurdly welcoming group workout that happens outdoors every week, rain or shine. No fitness level required — people race and people walk.',
        interests: ['fitness', 'running', 'social', 'outdoors'],
        url: 'https://november-project.com/san-francisco-ca/',
        firstStep: {
          kind: 'dropin',
          label: 'Just show up — no signup, no fee',
          url: 'https://november-project.com/san-francisco-ca/',
          when: 'Wednesday mornings (check the site for this week\'s location)'
        },
        script: 'Hi! I saw November Project SF online and I\'m thinking of coming to my first workout. Is the Wednesday location still the one listed on the site?',
        expect: [
          'Newcomers get introduced by name in the first two minutes — you will not be invisible',
          'The greeting is a hug. That is a real rule and it is the whole point',
          'You can walk the whole thing. Nobody tracks you',
          'Free, forever. There is nothing to sign up for'
        ],
        solo: 5, gentleness: 3, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'sf-foodbank',
        name: 'SF-Marin Food Bank',
        neighborhood: 'Potrero Hill + Marin warehouse',
        blurb: 'Book a single warehouse shift sorting and packing food. It is the easiest possible way to spend three hours next to strangers doing something obviously useful.',
        interests: ['volunteering', 'food', 'social'],
        url: 'https://www.sfmfoodbank.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book one volunteer shift online',
          url: 'https://www.sfmfoodbank.org/volunteer/',
          when: 'Shifts most days, including evenings and weekends'
        },
        script: null,
        expect: [
          'Signing up alone is completely normal — most people do',
          'Training takes about five minutes and assumes you know nothing',
          'You stand at a table with 5–10 others; conversation happens by itself',
          'One shift, zero ongoing obligation'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'sf-noisebridge',
        name: 'Noisebridge',
        neighborhood: 'Mission',
        blurb: 'A free, member-run hackerspace full of laser cutters, sewing machines, electronics and people who will happily show you how any of it works.',
        interests: ['making', 'tech', 'art'],
        url: 'https://www.noisebridge.net/',
        firstStep: {
          kind: 'visit',
          label: 'Walk in during an open event or the weekly meeting',
          url: 'https://www.noisebridge.net/wiki/Events',
          when: 'Tuesday evening general meeting + classes through the week'
        },
        script: 'Hi — I\'ve never been to Noisebridge before and I\'m interested in {interest}. Is there a good night this week for a first visit, and is there anything I should know before I come?',
        expect: [
          'It is a workshop, not a class. Wandering in and looking around is the expected behaviour',
          '"Hi, it\'s my first time — can someone show me around?" is a sentence people there hear constantly',
          'Free to visit. Donations only if you want to',
          'Expect chaos and duct tape, not polish'
        ],
        solo: 4, gentleness: 3, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends']
      },
      {
        id: 'sf-bike',
        name: 'San Francisco Bicycle Coalition',
        neighborhood: 'Citywide',
        blurb: 'Part advocacy group, part social club. They run free classes on riding in the city and group rides that go at the pace of the slowest person.',
        interests: ['cycling', 'civic', 'environment', 'social'],
        url: 'https://sfbike.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'RSVP to a free class or group ride',
          url: 'https://sfbike.org/events/',
          when: 'Classes and rides most weeks'
        },
        script: 'Hi! I\'m new-ish to riding in the city and would like to join a group ride. Is there one coming up that\'s good for someone who\'s a bit nervous in traffic?',
        expect: [
          'The beginner rides genuinely are beginner rides',
          'Free classes exist specifically for people who are scared of city traffic',
          'You can borrow confidence from a group of 15 people in a way you cannot alone',
          'Membership is optional for most events'
        ],
        solo: 4, gentleness: 4, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['skill', 'friends', 'impact']
      },
      {
        id: 'sf-fuf',
        name: 'Friends of the Urban Forest',
        neighborhood: 'Citywide plantings',
        blurb: 'Saturday-morning tree plantings and sidewalk-garden days. You get put in a small crew, hand a shovel, and by 11am you have planted something permanent with four strangers.',
        interests: ['environment', 'gardening', 'volunteering', 'outdoors'],
        url: 'https://www.fuf.net/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for one Saturday planting',
          url: 'https://www.fuf.net/volunteer/',
          when: 'Saturday mornings, usually done by early afternoon'
        },
        script: null,
        expect: [
          'You are assigned to a crew of 4–5 — the small group is what makes it easy to talk',
          'Tools, gloves and a short training are provided',
          'No gardening knowledge assumed at all',
          'Half a day, and then you are free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'sf-826',
        name: '826 Valencia',
        neighborhood: 'Mission / Tenderloin',
        blurb: 'Tutoring and writing help for local kids, run out of a pirate supply store. Volunteers do after-school homework help and creative writing workshops.',
        interests: ['mentoring', 'writing', 'volunteering'],
        url: 'https://826valencia.org/',
        firstStep: {
          kind: 'signup',
          label: 'Attend a volunteer orientation',
          url: 'https://826valencia.org/volunteer/',
          when: 'Orientations run regularly; after-school shifts are weekday afternoons'
        },
        script: 'Hi — I\'d like to volunteer as a tutor. I don\'t have a teaching background; is the orientation the right first step for someone like me?',
        expect: [
          'No teaching background needed — they train you',
          'You work alongside other volunteers, not alone with a room of kids',
          'Expect a background check and a real orientation before you start',
          'Weekly-ish commitment during the school term'
        ],
        solo: 5, gentleness: 4, structure: 'register', commitment: 'seasonal', cost: 0,
        when: ['weekday-day'], size: 'medium', goals: ['impact', 'skill']
      },
      {
        id: 'sf-ggba',
        name: 'Golden Gate Bird Alliance',
        neighborhood: 'Field trips across SF & the East Bay',
        blurb: 'Free guided bird walks, most of which are mostly standing still in a nice place while someone kind explains what you are looking at.',
        interests: ['nature', 'outdoors', 'environment'],
        url: 'https://goldengatebirdalliance.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a free field trip',
          url: 'https://goldengatebirdalliance.org/field-trips/',
          when: 'Weekend mornings and some weekdays'
        },
        script: 'Hello — I\'m a complete beginner at birding and don\'t own binoculars. Is the upcoming field trip suitable for me, and can I borrow a pair?',
        expect: [
          'Binoculars can often be borrowed — just ask when you RSVP',
          'The pace is slow walking and a lot of standing. It is not a hike',
          'Most trips are free and open to non-members',
          'Beginners are genuinely the favourite kind of guest — people love explaining'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'sf-zen',
        name: 'San Francisco Zen Center',
        neighborhood: 'Hayes Valley',
        blurb: 'Introductory meditation sessions on Saturday mornings where they explain, out loud, exactly what to do with your body and your hands. Nothing is assumed.',
        interests: ['stillness', 'faith', 'support'],
        url: 'https://www.sfzc.org/',
        firstStep: {
          kind: 'visit',
          label: 'Go to a Saturday introduction session',
          url: 'https://www.sfzc.org/practice-centers/city-center',
          when: 'Saturday mornings (check the calendar first)'
        },
        script: 'Hi — I\'ve never meditated in a group before. Is the Saturday introduction open to someone with no experience, and is there anything I need to bring or wear?',
        expect: [
          'The intro exists precisely for people who have never done it',
          'They tell you where to sit, how to sit, and when to stand',
          'Silence means you do not have to make conversation until you want to',
          'Usually by donation — you will not be pressured'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'sf-chess',
        name: "Mechanics' Institute Chess Club",
        neighborhood: 'Financial District',
        blurb: 'The oldest chess club in the country, upstairs in a beautiful old library. There are casual nights and beginner-friendly events alongside the serious tournaments.',
        interests: ['games', 'books', 'social'],
        url: 'https://www.milibrary.org/chess',
        firstStep: {
          kind: 'visit',
          label: 'Come to a casual club night',
          url: 'https://www.milibrary.org/chess',
          when: 'Weekday evenings; see the club calendar'
        },
        script: 'Hi — I play chess casually and would like to come by. Which evening is best for someone who is not a rated tournament player?',
        expect: [
          'A board is a conversation you do not have to start',
          'Both the casual room and the tournament room exist — pick the casual one first',
          'There is a membership/entry fee for most events — usually modest',
          'Being clearly worse than everyone there is a normal way to start'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'sf-cfsf',
        name: 'Code for San Francisco',
        neighborhood: 'Civic tech, meets online & in person',
        blurb: 'A weekly volunteer hack night where designers, coders and non-coders work on projects for local nonprofits and the city. Explicitly built for drop-ins.',
        interests: ['tech', 'civic', 'volunteering'],
        url: 'https://www.codeforsanfrancisco.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'RSVP to a weekly hack night',
          url: 'https://www.codeforsanfrancisco.org/',
          when: 'Weekly evening session'
        },
        script: 'Hi! I\'d like to come to a hack night. I\'m interested in {interest} — is there a project that could use someone new, and is the first night mostly just listening?',
        expect: [
          'The night starts with newcomer introductions and a tour of the projects',
          'Non-engineers are wanted — research, writing and design are always short-handed',
          'You can go once and never again with no awkwardness',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve'], size: 'medium', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'sf-lgbtcenter',
        name: 'SF LGBT Center',
        neighborhood: 'Market St, Castro-adjacent',
        blurb: 'Drop-in space and a full calendar of free groups — youth, trans, arts, employment, elders. A building whose entire purpose is that you can walk in without knowing anyone.',
        interests: ['lgbtq', 'social', 'support', 'newcomer'],
        url: 'https://www.sfcenter.org/',
        firstStep: {
          kind: 'visit',
          label: 'Check the calendar and walk into one free group',
          url: 'https://www.sfcenter.org/events/',
          when: 'Programs most days'
        },
        script: 'Hi — I\'m new to the city and looking for community. Is the {interest} group open to drop-ins, and do I need to register first?',
        expect: [
          'Walking in without a plan is the intended use of the building',
          'Most programs are free',
          'Staff at the front desk will point you at something if you say "I\'m new here"',
          'A lot of people there arrived alone'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'sf-bats',
        name: 'BATS Improv',
        neighborhood: 'Fort Mason',
        blurb: 'Improv classes and shows in a building on the water. The level-one class is full of people who have never done it and are terrified, which is the entire fun of it.',
        interests: ['theater', 'social'],
        url: 'https://improv.org/',
        firstStep: {
          kind: 'register',
          label: 'Take a one-off drop-in or intro class',
          url: 'https://improv.org/',
          when: 'Evenings and weekends'
        },
        script: 'Hi! I\'ve never done improv. Is there a one-off or intro class coming up where everyone will be a beginner?',
        expect: [
          'Everyone in the room is equally uncomfortable in the first 20 minutes. Then it stops',
          'No performing in front of strangers on day one',
          'Classes cost money — look for the single drop-in rate before committing to a term',
          'It is the fastest way to be on first-name terms with 12 people'
        ],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'weekly', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'sf-cmc',
        name: 'Community Music Center',
        neighborhood: 'Mission + Richmond',
        blurb: 'Sliding-scale music lessons, adult choruses and free concerts in a 100-year-old house. Adults who "aren\'t musical" are a core audience.',
        interests: ['music', 'social'],
        url: 'https://sfcmc.org/',
        firstStep: {
          kind: 'email',
          label: 'Ask about adult group classes & sliding scale',
          url: 'https://sfcmc.org/contact-us/',
          when: 'Terms start a few times a year'
        },
        script: 'Hi — I\'m an adult beginner interested in {interest}. Could you tell me which group classes or choruses are open to people with no background, and how the sliding scale works?',
        expect: [
          'Sliding-scale pricing is real and asking about it is normal',
          'Adult beginner groups exist and are not full of prodigies',
          'Choruses usually take anyone who shows up',
          'Free concerts are a zero-pressure way to see the place first'
        ],
        solo: 4, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'sf-disc',
        name: 'Bay Area Disc',
        neighborhood: 'Fields across SF & the East Bay',
        blurb: 'Ultimate frisbee leagues and pickup, including explicitly beginner divisions. Ultimate is the rare sport whose culture is built around being nice to people who are bad at it.',
        interests: ['sports', 'fitness', 'social', 'outdoors'],
        url: 'https://www.bayareadisc.org/',
        firstStep: {
          kind: 'signup',
          label: 'Join a beginner league or find pickup',
          url: 'https://www.bayareadisc.org/leagues',
          when: 'Seasonal leagues; pickup games year-round'
        },
        script: 'Hi! I\'d like to try ultimate but I\'ve basically never played. Is there a beginner-friendly league or a pickup game where turning up alone is normal?',
        expect: [
          'Signing up as an individual gets you placed on a team — you do not need friends first',
          'Beginner divisions exist and are where you should start',
          'Leagues cost money; pickup is usually free',
          'A team is a built-in group of people who expect you weekly'
        ],
        solo: 4, gentleness: 3, structure: 'register', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['friends', 'routine', 'skill']
      },
      {
        id: 'sf-sfpl',
        name: 'San Francisco Public Library',
        neighborhood: 'Every neighborhood',
        blurb: 'Free book clubs, language conversation circles, writing groups, craft nights and lectures at 27 branches. The most underrated free social infrastructure in the city.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'parents'],
        url: 'https://sfpl.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your nearest branch',
          url: 'https://sfpl.org/events',
          when: 'Daily, including evenings and weekends'
        },
        script: null,
        expect: [
          'Everything is free and most things need no registration',
          'Your nearest branch is probably a 15-minute walk — low cost to bail',
          'Conversation clubs for language learners are specifically designed for strangers to talk',
          'Nobody will ask you to explain why you came'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'sf-parkrun',
        name: 'Crissy Field parkrun',
        neighborhood: 'Crissy Field, Presidio',
        blurb: 'A free, timed 5k every Saturday morning with the Golden Gate Bridge in front of you. Walkers are officially welcome and there is always someone at the back.',
        interests: ['running', 'outdoors', 'fitness', 'social'],
        url: 'https://www.parkrun.us/crissyfield/',
        firstStep: {
          kind: 'signup',
          label: 'Register once online, print your barcode, show up Saturday',
          url: 'https://www.parkrun.us/crissyfield/',
          when: 'Saturday mornings, every week'
        },
        script: null,
        expect: [
          'It is free and the registration is one form, one time, valid at every parkrun on earth',
          'There is a newcomers briefing before the start — stand there and you will be talked to',
          'A designated volunteer runs at the very back so nobody finishes alone',
          'Many people go for the coffee afterwards, which is the actual point'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'sf-urbanadamah',
        name: 'Urban Adamah',
        neighborhood: 'Berkeley',
        blurb: 'An urban farm running volunteer days, free community festivals and classes. Jewish-rooted but explicitly open to everyone, and the farm work is the easy kind.',
        interests: ['gardening', 'food', 'faith', 'volunteering', 'environment'],
        url: 'https://urbanadamah.org/',
        firstStep: {
          kind: 'signup',
          label: 'Join a community volunteer day',
          url: 'https://urbanadamah.org/volunteer/',
          when: 'Regular volunteer days plus seasonal festivals'
        },
        script: 'Hi — I\'d like to come to a volunteer day. I have no farming experience and I\'m not Jewish; is that fine?',
        expect: [
          'No experience needed and no religious participation required',
          'Working with your hands next to someone removes the pressure to make eye contact',
          'Volunteer days are free; some classes are not',
          'Produce goes to food justice programs, so the work is not busywork'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'sf-crucible',
        name: 'The Crucible',
        neighborhood: 'West Oakland',
        blurb: 'An industrial arts school where civilians learn blacksmithing, glass blowing, neon and welding. The intro classes are short, one-off, and genuinely thrilling.',
        interests: ['making', 'art'],
        url: 'https://www.thecrucible.org/',
        firstStep: {
          kind: 'register',
          label: 'Book a one-night intro class',
          url: 'https://www.thecrucible.org/classes/',
          when: 'Evenings and weekends'
        },
        script: null,
        expect: [
          'One-night "taster" classes exist so you can try without a term-long commitment',
          'All safety gear and tools are provided',
          'Classes cost real money — check the price before you fall in love with glassblowing',
          'Doing something slightly scary next to strangers bonds people fast'
        ],
        solo: 5, gentleness: 4, structure: 'course', commitment: 'one-off', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'sf-muttville',
        name: 'Muttville Senior Dog Rescue',
        neighborhood: 'Mission',
        blurb: 'A rescue for older dogs that runs a "Cuddle Club" — you turn up, sit on the floor, and senior dogs climb into your lap. That is the entire activity and it is genuinely therapeutic.',
        interests: ['animals', 'volunteering', 'support', 'social'],
        url: 'https://muttville.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book a Cuddle Club session or a volunteer orientation',
          url: 'https://muttville.org/volunteer',
          when: 'Cuddle Club runs regularly; check the calendar'
        },
        script: null,
        expect: [
          'The dogs do all the social work — nobody expects you to make conversation',
          'Cuddle Club needs no experience and no ongoing commitment',
          'Free, and you will see the same volunteers if you keep coming',
          'Regular volunteering needs an orientation first'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'small', goals: ['impact', 'friends', 'routine']
      },
      {
        id: 'sf-ggmg',
        name: 'Golden Gate Mothers Group',
        neighborhood: 'Citywide',
        blurb: 'A large parents\' network running neighbourhood groups, playdates and parent nights. Being new and knowing nobody is the standard reason people join.',
        interests: ['parents', 'social', 'newcomer', 'support'],
        url: 'https://www.ggmg.org/',
        firstStep: {
          kind: 'signup',
          label: 'Join and ask to be placed in a neighbourhood group',
          url: 'https://www.ggmg.org/',
          when: 'Groups and events year-round'
        },
        script: 'Hi! I\'m a new-ish parent in {city} and I don\'t know many other parents here. How do I get into a neighbourhood group, and is there an upcoming event that\'s good for a first-timer?',
        expect: [
          'Neighbourhood groups put you with parents who live near you and have same-age kids',
          'There is a membership fee — check the current rate before joining',
          'Having a child with you removes most of the awkwardness of meeting strangers',
          'Events range from playdates to parent nights out'
        ],
        solo: 4, gentleness: 4, structure: 'register', commitment: 'seasonal', cost: 1,
        when: ['weekday-day', 'weekend'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'sf-sffilm',
        name: 'SFFILM',
        neighborhood: 'Citywide venues',
        blurb: 'The organisation behind the San Francisco International Film Festival. Volunteering at the festival puts you on a team for a week with other people who like films enough to give up their evenings.',
        interests: ['filmphoto', 'art', 'volunteering', 'social'],
        url: 'https://sffilm.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up as a festival volunteer, or go to one screening',
          url: 'https://sffilm.org/',
          when: 'Festival volunteering is seasonal; screenings year-round'
        },
        script: 'Hi! I\'d like to volunteer at the festival. I haven\'t done it before and I\'ll be coming on my own — what roles suit a first-timer, and when does sign-up open?',
        expect: [
          'Volunteers work shifts in small teams and usually get into screenings free',
          'A film gives you something to talk about afterwards, which is easier than small talk',
          'Festival volunteering is intense but time-boxed to a couple of weeks',
          'Screenings on their own are a zero-commitment way to start'
        ],
        solo: 5, gentleness: 4, structure: 'shift', commitment: 'seasonal', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'impact']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
