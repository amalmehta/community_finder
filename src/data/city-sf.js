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
        expect: [
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
        expect: [
          'Training takes about five minutes and assumes you know nothing',
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
        expect: [
          'Binoculars can often be borrowed — just ask when you RSVP',
          'The pace is slow walking and a lot of standing. It is not a hike',
          'Most trips are free and open to non-members'
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
        expect: [
          'The intro exists precisely for people who have never done it',
          'They tell you where to sit, how to sit, and when to stand'
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
        expect: [
          'Both the casual room and the tournament room exist — pick the casual one first',
          'There is a membership/entry fee for most events — usually modest'
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
        expect: [
          'The night starts with newcomer introductions and a tour of the projects',
          'Non-engineers are wanted — research, writing and design are always short-handed',
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
        expect: [
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
        expect: [
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
        expect: [
          'Everything is free and most things need no registration',
          'Your nearest branch is probably a 15-minute walk — low cost to bail',
          'Conversation clubs for language learners are specifically designed for strangers to talk'
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
        expect: [
          'No experience needed and no religious participation required',
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
        expect: [
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
        expect: [
          'Neighbourhood groups put you with parents who live near you and have same-age kids',
          'There is a membership fee — check the current rate before joining',
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
        expect: [
          'Volunteers work shifts in small teams and usually get into screenings free',
          'Festival volunteering is intense but time-boxed to a couple of weeks',
          'Screenings on their own are a zero-commitment way to start'
        ],
        solo: 5, gentleness: 4, structure: 'shift', commitment: 'seasonal', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'impact']
      },
      {
        id: 'sf-dancemission',
        name: 'Dance Mission Theater',
        neighborhood: 'Mission',
        blurb: 'A community dance centre running drop-in classes for adults \u2014 Afro-Cuban, hip hop, salsa, contemporary \u2014 where turning up to a single class with no experience is the normal way in.',
        interests: ['dance', 'fitness', 'art', 'social'],
        url: 'https://www.dancemission.com/',
        firstStep: {
          kind: 'dropin',
          label: 'Take one drop-in class at the absolute beginner level',
          url: 'https://www.dancemission.com/',
          when: 'Classes most days, mornings through evenings'
        },
        expect: [
          'Drop-in means one class, one payment, no term to commit to',
          'Beginner-level classes assume you have never done it',
          'You stand at the back and copy people. That is the whole method',
          'A regular weekly class means the same faces, which is how it stops being strangers'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend', 'weekday-day'], size: 'medium', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'sf-alemany',
        name: 'Alemany Farm',
        neighborhood: 'Bernal Heights / Alemany',
        blurb: 'A four-acre farm hidden behind a housing development off the 280, run entirely by volunteers. Most San Franciscans have no idea it exists. Everything grown is given away free.',
        interests: ['gardening', 'food', 'environment', 'volunteering', 'outdoors'],
        url: 'https://www.alemanyfarm.org/',
        firstStep: {
          kind: 'dropin',
          label: 'Turn up to a volunteer day \u2014 no signup, no experience',
          url: 'https://www.alemanyfarm.org/',
          when: 'Regular volunteer days \u2014 check the site for this week'
        },
        expect: [
          'No registration: you walk in, someone hands you a tool and explains the job',
          'Free, and you can take produce home',
          'Wear shoes you do not mind ruining'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'small', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'sf-bikekitchen',
        name: 'The Bike Kitchen',
        neighborhood: 'Mission',
        blurb: 'A volunteer-run DIY bike repair co-op where you fix your own bike using their tools, with someone experienced looking over your shoulder when you get stuck.',
        interests: ['making', 'cycling', 'volunteering', 'social'],
        url: 'https://bikekitchen.org/',
        firstStep: {
          kind: 'visit',
          label: 'Bring your bike to an open shop night',
          url: 'https://bikekitchen.org/',
          when: 'Open shop hours several evenings a week'
        },
        expect: [
          'Volunteers teach rather than fix it for you \u2014 that is the whole model',
          'Small shop fee or membership; far less than a bike shop'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'sf-mssf',
        name: 'Mycological Society of San Francisco',
        neighborhood: 'Forays around the Bay Area',
        blurb: 'A mushroom-hunting society running forays into the woods, monthly meetings and an annual Fungus Fair. Deeply nerdy, entirely welcoming, and almost nobody knows it exists.',
        interests: ['nature', 'outdoors', 'food', 'social'],
        url: 'https://mssf.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a foray or come to a monthly meeting',
          url: 'https://mssf.org/',
          when: 'Forays in the wet season; meetings monthly'
        },
        expect: [
          'Walking slowly through woods looking at the ground is the entire activity',
          'Modest membership; meetings are cheap or free to visit',
          'Never eat anything without an expert confirming it, which is also the social mechanism'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'sf-prelinger',
        name: 'Prelinger Library',
        neighborhood: 'SoMa',
        blurb: 'A private, free, appropriation-friendly research library arranged geographically rather than by subject, so browsing it is deliberately serendipitous. You can scan or photograph anything.',
        interests: ['books', 'writing', 'art', 'filmphoto'],
        url: 'https://www.prelingerlibrary.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come during open hours and just browse',
          url: 'https://www.prelingerlibrary.org/',
          when: 'Limited open hours \u2014 check the site before going'
        },
        expect: [
          'Browsing with no purpose is explicitly encouraged',
          'Free, and you may photograph or scan whatever you like',
          'The hours are genuinely limited \u2014 check before you go',
          'Quiet and small, so the librarians will talk to you'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-day'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'sf-oddsalon',
        name: 'Odd Salon',
        neighborhood: 'Rotating bars & venues',
        blurb: 'An evening of short talks by enthusiasts about obscure corners of history, science and misadventure, held in bars. Founded in San Francisco and still at its best here.',
        interests: ['books', 'social', 'art', 'writing'],
        url: 'https://oddsalon.com/',
        firstStep: {
          kind: 'rsvp',
          label: 'Buy a ticket to the next salon',
          url: 'https://oddsalon.com/',
          when: 'Monthly-ish evening events'
        },
        expect: [
          'The talks give you something to say to the stranger beside you',
          'Tickets are the price of a couple of drinks',
          'A fixed start and end time means you always have an exit'
        ],
        solo: 5, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'sf-harveymilkphoto',
        name: 'Harvey Milk Photo Center',
        neighborhood: 'Duboce Park',
        blurb: 'A city-run darkroom \u2014 the largest public one in the country \u2014 with cheap classes, enlargers and a community of people who still shoot film. Hidden in plain sight behind a rec centre.',
        interests: ['filmphoto', 'art', 'making', 'social'],
        url: 'https://www.harveymilkphotocenter.org/',
        firstStep: {
          kind: 'register',
          label: 'Sign up for a beginner darkroom class',
          url: 'https://www.harveymilkphotocenter.org/',
          when: 'Classes run in terms; open darkroom hours for members'
        },
        expect: [
          'City-run, so the prices are a fraction of a private studio',
          'Classes run over several weeks with the same small group',
          'A darkroom is dark and quiet, which suits people who find socialising tiring',
          'Beginners are the main audience'
        ],
        solo: 5, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'sf-rubysclay',
        name: "Ruby's Clay Studio & Gallery",
        neighborhood: 'Noe Valley',
        blurb: 'A member-run co-operative pottery studio, running since the 1970s, with beginner classes and open studio time. Clay is the most forgiving possible excuse to stand near people.',
        interests: ['art', 'crafts', 'making', 'social'],
        url: 'https://www.rubysclaystudio.org/',
        firstStep: {
          kind: 'register',
          label: 'Book a beginner wheel-throwing class',
          url: 'https://www.rubysclaystudio.org/',
          when: 'Classes in terms; one-off workshops too'
        },
        expect: [
          'Beginner classes assume you have never done it',
          'Several weeks with the same small group is the friendship mechanism',
          'Classes cost real money; clay and firing are usually included'
        ],
        solo: 5, gentleness: 5, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'sf-nerdnite',
        name: 'Nerd Nite SF',
        neighborhood: 'Rotating bars',
        blurb: 'Three people give entertaining talks about something they know far too much about, in a bar, while you drink. Billed as "it\'s like the Discovery Channel, with beer".',
        interests: ['tech', 'social', 'books', 'nature'],
        url: 'https://sf.nerdnite.com/',
        firstStep: {
          kind: 'rsvp',
          label: 'Get a ticket to the next one',
          url: 'https://sf.nerdnite.com/',
          when: 'Monthly, evenings'
        },
        expect: [
          'Cheap ticket, and you can leave whenever you like',
          'Low stakes in a way that a networking event never is'
        ],
        solo: 5, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'sf-dolphinclub',
        name: 'Dolphin Club',
        neighborhood: 'Aquatic Park',
        blurb: 'An 1877 swimming and rowing club on Aquatic Park where people swim in the open bay without wetsuits, year-round. Day use lets you try it before committing to anything.',
        interests: ['fitness', 'outdoors', 'social'],
        url: 'https://dolphinclub.org/',
        firstStep: {
          kind: 'visit',
          label: 'Come on a day-use day and swim or watch',
          url: 'https://dolphinclub.org/',
          when: 'Open to the public on alternating days \u2014 check the site'
        },
        expect: [
          'A small day-use fee lets you try before any membership question arises',
          'The water is roughly 10\u201315\u00b0C. Start with five minutes and build up',
          'Never swim alone there \u2014 which is exactly why it is social',
          'The sauna afterwards is where the conversation happens'
        ],
        solo: 4, gentleness: 3, structure: 'drop-in', commitment: 'one-off', cost: 1,
        when: ['weekday-day', 'weekend'], size: 'medium', goals: ['friends', 'routine']
      },
      {
        id: 'sf-ggmrc',
        name: 'Golden Gate Model Railroad Club',
        neighborhood: 'Randall Museum, Corona Heights',
        blurb: 'A vast model railroad in the basement of a free city museum, built and run by a club since 1946. Open to the public on Saturdays, and they are delighted when anyone asks.',
        interests: ['games', 'making', 'social', 'parents'],
        url: 'https://ggmrc.org/',
        firstStep: {
          kind: 'visit',
          label: 'Visit on a Saturday open day and ask how it works',
          url: 'https://ggmrc.org/',
          when: 'Saturday open hours at the Randall Museum'
        },
        expect: [
          'Free to visit, inside a free museum with a view over the city',
          'Members are usually running trains and happy to explain',
          '"How does this work?" is the only sentence you need',
          'The Randall Museum around it has live animals and a workshop, so the trip is worth it either way'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'small', goals: ['friends', 'skill']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
