/* Curated communities — Minneapolis. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'msp',
    name: 'Minneapolis',
    region: 'MN',
    aliases: ['minneapolis', 'msp', 'twin cities', 'st paul', 'saint paul', 'minneapolis mn', 'northeast minneapolis', 'uptown minneapolis'],
    orgs: [
      {
        id: 'msp-2harvest', name: 'Second Harvest Heartland', neighborhood: 'Brooklyn Park warehouse',
        blurb: 'One of the largest food banks in the country. Warehouse shifts repacking produce, with evening and weekend slots.',
        interests: ['volunteering', 'food'], url: 'https://www.2harvest.org/',
        firstStep: { kind: 'signup', label: 'Book a single volunteer shift', url: 'https://www.2harvest.org/', when: 'Day, evening and weekend shifts' },
        expect: ['Short training, then a task you cannot get wrong', 'Two to three hours, complete in itself', 'Free'],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'msp-library', name: 'Hennepin County Library', neighborhood: '41 branches',
        blurb: 'Free book clubs, English conversation circles, writing groups, craft nights, board games and storytimes across the county.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'parents', 'games'],
        url: 'https://www.hclib.org/',
        firstStep: { kind: 'rsvp', label: 'Find one event at your nearest branch', url: 'https://www.hclib.org/programs', when: 'Daily' },
        expect: ['Free and mostly drop-in', 'Conversation circles are designed around strangers talking', 'A warm building you can be in all winter for nothing'],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'msp-tcmaker', name: 'Twin Cities Maker (Hack Factory)', neighborhood: 'Seward',
        blurb: 'A member-run workshop with woodworking, metal, electronics and textiles, plus open house nights where anyone can walk in.',
        interests: ['making', 'tech', 'art', 'crafts'], url: 'https://tcmaker.org/',
        firstStep: { kind: 'visit', label: 'Come to an open house', url: 'https://tcmaker.org/', when: 'Regular open nights — check the calendar' },
        expect: ['Open nights exist so non-members can look round', 'Visiting is free; membership costs money', 'Members enjoy being asked what they are building'],
        solo: 4, gentleness: 3, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-eve'], size: 'medium', goals: ['skill', 'friends']
      },
      {
        id: 'msp-ourstreets', name: 'Our Streets Minneapolis', neighborhood: 'Citywide',
        blurb: 'Campaigns for streets that work for walking, biking and rolling, with volunteer events and neighbourhood organising.',
        interests: ['cycling', 'civic', 'environment', 'volunteering'], url: 'https://www.ourstreetsmpls.org/',
        firstStep: { kind: 'rsvp', label: 'Come to a volunteer event or a campaign meeting', url: 'https://www.ourstreetsmpls.org/', when: 'Events and meetings monthly' },
        expect: ['Meetings open with introductions', 'Free', 'You are given something concrete to do if you want it'],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'msp-millcity', name: 'Mill City Running', neighborhood: 'Northeast Minneapolis',
        blurb: 'A running shop whose free group runs leave from the door several times a week, at every pace, year-round — including through January.',
        interests: ['running', 'fitness', 'social', 'outdoors'], url: 'https://www.millcityrunning.com/',
        firstStep: { kind: 'dropin', label: 'Turn up to a free group run', url: 'https://www.millcityrunning.com/', when: 'Several evenings and weekend mornings' },
        expect: ['Free, and no membership', 'Pace groups mean there is someone your speed', 'They run in winter; dress for it and nobody will comment'],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'msp-parks', name: 'Minneapolis Parks & Recreation', neighborhood: 'Rec centres citywide',
        blurb: 'The best-funded park system in the country: cheap adult classes, drop-in sports, swimming, skating and dance at neighbourhood rec centres.',
        interests: ['sports', 'fitness', 'dance', 'outdoors', 'social'], url: 'https://www.minneapolisparks.org/',
        firstStep: { kind: 'register', label: 'Find your nearest rec centre and register for one class or drop-in', url: 'https://www.minneapolisparks.org/', when: 'Drop-in weekly; classes seasonal' },
        expect: ['Drop-in sessions cost a few dollars', 'Seasonal classes mean the same faces for eight weeks', 'Outdoor rinks in winter are free'],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['routine', 'friends', 'skill']
      },
      {
        id: 'msp-fmr', name: 'Friends of the Mississippi River', neighborhood: 'River sites across the metro',
        blurb: 'Habitat restoration and cleanup events along the river — pulling invasives, planting natives, picking up what the flood left.',
        interests: ['environment', 'outdoors', 'volunteering', 'nature', 'gardening'], url: 'https://fmr.org/',
        firstStep: { kind: 'signup', label: 'Sign up for one volunteer event', url: 'https://fmr.org/volunteer', when: 'Weekend mornings in season' },
        expect: ['Tools, gloves and instructions provided', 'Small crews, so you talk to the same few people', 'Free, a few hours, no follow-up expected'],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'msp-audubon', name: 'Minneapolis Audubon Chapter', neighborhood: 'Parks across the city',
        blurb: 'Free bird walks and monthly meetings. Slow, quiet, outdoors — and the Mississippi flyway runs straight through the city.',
        interests: ['nature', 'outdoors', 'environment'], url: 'https://audubonchapterofminneapolis.org/',
        firstStep: { kind: 'rsvp', label: 'Join a free bird walk', url: 'https://audubonchapterofminneapolis.org/', when: 'Weekend mornings, best in spring and autumn migration' },
        expect: ['Walks are free and open to non-members', 'Mostly standing still rather than hiking', 'Loaner binoculars are often available if you ask'],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'msp-outfront', name: 'OutFront Minnesota', neighborhood: 'Statewide, Minneapolis-based',
        blurb: 'The state\'s main LGBTQ+ organisation, running support programmes, community events and volunteer organising.',
        interests: ['lgbtq', 'social', 'support', 'civic', 'newcomer'], url: 'https://www.outfront.org/',
        firstStep: { kind: 'visit', label: 'Check the calendar and go to one event', url: 'https://www.outfront.org/', when: 'Events and programmes through the month' },
        expect: ['Many events are free', 'Volunteering is a lower-pressure way in than a social event', 'Staff are used to people arriving alone'],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'impact', 'routine']
      },
      {
        id: 'msp-humane', name: 'Animal Humane Society', neighborhood: 'Golden Valley + metro sites',
        blurb: 'Large shelter network with a structured volunteer programme — dog walking, cat care, fostering — and training before you start.',
        interests: ['animals', 'volunteering'], url: 'https://www.animalhumanesociety.org/',
        firstStep: { kind: 'signup', label: 'Apply and book a volunteer orientation', url: 'https://www.animalhumanesociety.org/', when: 'Orientations regularly; shifts most days' },
        expect: ['Application and orientation come before your first shift', 'Recurring shifts mean the same volunteers each week', 'Free, with a minimum commitment once trained'],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'msp-huge', name: 'HUGE Improv Theater', neighborhood: 'Lyn-Lake',
        blurb: 'A non-profit improv theatre running shows most nights and beginner classes where everyone in the room has never done it.',
        interests: ['theater', 'social'], url: 'https://hugetheater.com/',
        firstStep: { kind: 'register', label: 'See a cheap show, then book a beginner class', url: 'https://hugetheater.com/', when: 'Shows most nights; classes in terms' },
        expect: ['Beginner classes assume nothing', 'You will know a dozen names after one evening', 'Shows are cheap; classes cost money'],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'msp-macphail', name: 'MacPhail Center for Music', neighborhood: 'Downtown riverfront',
        blurb: 'A large community music school with adult group classes and ensembles for people who are not musicians and never expect to be.',
        interests: ['music', 'social'], url: 'https://www.macphail.org/',
        firstStep: { kind: 'email', label: 'Ask which adult group classes take absolute beginners', url: 'https://www.macphail.org/', when: 'Terms through the year' },
        expect: ['Adult beginner groups exist and are not full of prodigies', 'A weekly ensemble with the same people is the point', 'Classes cost money; ask about financial aid'],
        solo: 4, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'msp-clay', name: 'Northern Clay Center', neighborhood: 'Seward',
        blurb: 'A ceramics centre with beginner wheel-throwing classes, open studio time and a gallery. Clay is a forgiving excuse to stand near people.',
        interests: ['art', 'crafts', 'making', 'social'], url: 'https://www.northernclaycenter.org/',
        firstStep: { kind: 'register', label: 'Book a beginner wheel-throwing class', url: 'https://www.northernclaycenter.org/', when: 'Classes in terms; one-off workshops too' },
        expect: ['Beginner classes assume you have never touched a wheel', 'Several weeks with the same small group', 'Clay and firing are usually included; classes cost money'],
        solo: 5, gentleness: 5, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'msp-trylon', name: 'Trylon Cinema', neighborhood: 'Seward',
        blurb: 'A tiny volunteer-run repertory cinema showing 35mm prints and themed series, with cheap tickets and a volunteer programme.',
        interests: ['filmphoto', 'art', 'volunteering', 'social'], url: 'https://trylon.org/',
        firstStep: { kind: 'rsvp', label: 'Go to one screening, or ask about volunteering', url: 'https://trylon.org/', when: 'Screenings most nights' },
        expect: ['Volunteer-run, so asking how to help is normal', 'Tickets are among the cheapest in the city', 'Themed series bring back the same faces'],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'impact']
      },
      {
        id: 'msp-commonground', name: 'Common Ground Meditation Center', neighborhood: 'Seward',
        blurb: 'A donation-based meditation centre with free weekly sittings and introductory classes for people who have never meditated.',
        interests: ['stillness', 'faith', 'support'], url: 'https://www.commongroundmeditation.org/',
        firstStep: { kind: 'visit', label: 'Go to one weekly sitting or an intro class', url: 'https://www.commongroundmeditation.org/', when: 'Weekly sittings; courses through the year' },
        expect: ['Instructions are spoken aloud throughout', 'Donation-based; nobody is turned away', 'You may sit on a chair'],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'msp-tapestry', name: 'Tapestry Folkdance Center', neighborhood: 'South Minneapolis',
        blurb: 'A dedicated folk dance hall running contra, swing and international dances with a beginner lesson before each one and live music.',
        interests: ['dance', 'music', 'social', 'fitness'], url: 'https://www.tapestryfolkdance.org/',
        firstStep: { kind: 'dropin', label: 'Arrive early for the beginner lesson, then stay for the dance', url: 'https://www.tapestryfolkdance.org/', when: 'Dances several nights a week' },
        expect: ['A beginner lesson runs before the dance and partners rotate', 'No partner and no experience needed', 'Small door charge; live band most nights'],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'msp-textile', name: 'Textile Center', neighborhood: 'Prospect Park',
        blurb: 'A national centre for fiber art with classes in weaving, dyeing, knitting and sewing, a library of 30,000 books, and volunteer days.',
        interests: ['crafts', 'art', 'making', 'volunteering'], url: 'https://textilecentermn.org/',
        firstStep: { kind: 'register', label: 'Book a beginner class, or volunteer in the library', url: 'https://textilecentermn.org/', when: 'Classes year-round' },
        expect: ['Beginner classes assume no experience', 'The library is free to browse', 'Classes cost money; volunteering does not'],
        solo: 5, gentleness: 5, structure: 'course', commitment: 'one-off', cost: 1,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'impact']
      },
      {
        id: 'msp-loft', name: 'The Loft Literary Center', neighborhood: 'Open Book, Washington Avenue',
        blurb: 'One of the largest independent literary centres in the country, with adult writing classes at every level and free readings.',
        interests: ['writing', 'books', 'social'], url: 'https://loft.org/',
        firstStep: { kind: 'register', label: 'Take one short class, or go to a free reading', url: 'https://loft.org/', when: 'Classes in terms; readings through the year' },
        expect: ['Classes run in short blocks with the same small group', 'Readings are free and easy to attend alone', 'Classes cost money; scholarships exist'],
        solo: 5, gentleness: 4, structure: 'course', commitment: 'one-off', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['skill', 'friends']
      },
      {
        id: 'msp-bbbs', name: 'Big Brothers Big Sisters Twin Cities', neighborhood: 'Metro-wide',
        blurb: 'Matches you with one young person for regular time together, with a caseworker supporting the match throughout.',
        interests: ['mentoring', 'volunteering'], url: 'https://www.bigstwincities.org/',
        firstStep: { kind: 'signup', label: 'Start an enquiry to be matched', url: 'https://www.bigstwincities.org/', when: 'Rolling; expect a few weeks' },
        expect: ['Expect an application, background check and interview', 'A caseworker supports the match', 'Usually a year and a couple of hours a month'],
        solo: 5, gentleness: 4, structure: 'register', commitment: 'seasonal', cost: 0,
        when: ['flexible'], size: 'large', goals: ['impact']
      },
      {
        id: 'msp-ultimate', name: 'MN Ultimate', neighborhood: 'Fields across the Twin Cities',
        blurb: 'Runs the region\'s ultimate frisbee leagues, including recreational divisions you can join alone and be placed on a team.',
        interests: ['sports', 'fitness', 'outdoors', 'social'], url: 'https://www.mnultimate.org/',
        firstStep: { kind: 'signup', label: 'Sign up solo for a recreational league', url: 'https://www.mnultimate.org/', when: 'Seasonal leagues, plus indoor winter' },
        expect: ['Individual sign-ups are placed on teams', 'Recreational divisions expect beginners', 'Leagues cost money; there is indoor play in winter'],
        solo: 4, gentleness: 3, structure: 'register', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['friends', 'routine', 'skill']
      },
      {
        id: 'msp-urbanroots', name: 'Urban Roots', neighborhood: 'East Side, St Paul',
        blurb: 'Youth-led urban farms and a conservation crew on the East Side, with volunteer days in the gardens alongside the young people who run them.',
        interests: ['gardening', 'food', 'mentoring', 'environment', 'volunteering'], url: 'https://www.urbanrootsmn.org/',
        firstStep: { kind: 'signup', label: 'Join a volunteer day at one of the farms', url: 'https://www.urbanrootsmn.org/', when: 'Volunteer days through the growing season' },
        expect: ['No growing experience needed', 'You work alongside the youth crew rather than supervising them', 'Free'],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'small', goals: ['impact', 'friends', 'skill']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
