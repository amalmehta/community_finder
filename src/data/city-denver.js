/* Curated communities — Denver. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'den',
    name: 'Denver',
    region: 'CO',
    aliases: ['denver', 'den', 'boulder', 'aurora', 'lakewood', 'front range', 'rino', 'capitol hill denver'],
    orgs: [
      {
        id: 'den-foodbank', name: 'Food Bank of the Rockies', neighborhood: 'Northeast Denver warehouse',
        blurb: 'Warehouse shifts sorting and repacking food for the region. Simple, physical, and done in a line of people doing the same thing.',
        interests: ['volunteering', 'food'], url: 'https://www.foodbankrockies.org/',
        firstStep: { kind: 'signup', label: 'Book a single volunteer shift', url: 'https://www.foodbankrockies.org/volunteer/', when: 'Morning, afternoon and some evening shifts' },
        expect: ['Short training, then a task you cannot get wrong', 'Two to three hours, complete in itself', 'Free'],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'den-library', name: 'Denver Public Library', neighborhood: '25 branches',
        blurb: 'Free book clubs, conversation circles for English learners, writing groups, craft nights, board game afternoons and storytimes across the city.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'parents', 'games'],
        url: 'https://www.denverlibrary.org/',
        firstStep: { kind: 'rsvp', label: 'Find one event at your nearest branch', url: 'https://www.denverlibrary.org/events', when: 'Daily' },
        expect: ['Free, and usually no registration', 'Conversation circles are built around strangers talking', 'Your branch is close enough that leaving early costs nothing'],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'den-growhaus', name: 'The GrowHaus', neighborhood: 'Elyria-Swansea',
        blurb: 'An indoor farm and food-access hub in a neighbourhood the city spent decades neglecting, with volunteer days in the greenhouse.',
        interests: ['gardening', 'food', 'environment', 'volunteering'], url: 'https://www.thegrowhaus.org/',
        firstStep: { kind: 'signup', label: 'Sign up for a volunteer day', url: 'https://www.thegrowhaus.org/', when: 'Regular volunteer sessions' },
        expect: ['No growing experience needed; everything is shown to you', 'Indoors, which matters from November to March', 'Free, and produce goes to the neighbourhood'],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'small', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'den-denhac', name: 'denhac', neighborhood: 'Northeast Denver',
        blurb: 'Denver\'s hackerspace: laser cutters, electronics, woodworking and 3D printing, run by members, with open nights for anyone curious.',
        interests: ['making', 'tech', 'art', 'crafts'], url: 'https://www.denhac.org/',
        firstStep: { kind: 'visit', label: 'Come to an open night', url: 'https://www.denhac.org/', when: 'Weekly open evening — check the site' },
        expect: ['Open nights exist so non-members can look round', 'Visiting is free; membership costs money', 'Bring a project or bring nothing'],
        solo: 4, gentleness: 3, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-eve'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'den-bikecolorado', name: 'Bicycle Colorado', neighborhood: 'Statewide, Denver-based',
        blurb: 'Advocacy plus rides and classes, including ones for people who have never ridden in traffic and would rather not start alone.',
        interests: ['cycling', 'civic', 'environment', 'social'], url: 'https://www.bicyclecolorado.org/',
        firstStep: { kind: 'rsvp', label: 'Join a ride or a confidence class', url: 'https://www.bicyclecolorado.org/', when: 'Events through the riding season' },
        expect: ['Classes are aimed at nervous riders', 'Usually free or low-cost', 'Rides state their pace up front'],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['skill', 'friends', 'impact']
      },
      {
        id: 'den-rmrr', name: 'Rocky Mountain Road Runners', neighborhood: 'Runs across the Front Range',
        blurb: 'A volunteer-run club since 1967, with cheap low-key races and group runs at every pace, including distinctly unserious ones.',
        interests: ['running', 'fitness', 'outdoors', 'social'], url: 'https://www.rmrr.org/',
        firstStep: { kind: 'dropin', label: 'Turn up to a group run or a cheap club race', url: 'https://www.rmrr.org/', when: 'Weekend mornings and weekday evenings' },
        expect: ['Club races cost a few dollars, not forty', 'Pace groups mean there is someone your speed', 'Altitude is real — go slower than you think for a month'],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'den-cmc', name: 'Colorado Mountain Club', neighborhood: 'Golden + trips statewide',
        blurb: 'A century-old club that teaches people to hike, climb, ski and snowshoe through structured courses. The clearest answer to "I moved to Denver and know nobody".',
        interests: ['outdoors', 'nature', 'fitness', 'social'], url: 'https://www.cmc.org/',
        firstStep: { kind: 'register', label: 'Join a beginner-rated hike or an intro course', url: 'https://www.cmc.org/', when: 'Trips year-round; courses seasonal' },
        expect: ['Trips are graded honestly — the easy ones are genuinely easy', 'Courses run over weeks with the same cohort, which is the friendship mechanism', 'Membership has a fee; some trips are open to non-members'],
        solo: 5, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'den-voc', name: 'Volunteers for Outdoor Colorado', neighborhood: 'Projects across the state',
        blurb: 'Trail-building and restoration weekends where a crew of strangers spends a day moving rock and eating lunch on a log together.',
        interests: ['environment', 'outdoors', 'volunteering', 'nature'], url: 'https://www.voc.org/',
        firstStep: { kind: 'signup', label: 'Sign up for one project day', url: 'https://www.voc.org/', when: 'Weekends through the season' },
        expect: ['Tools, training and a crew leader are provided', 'A full day with the same eight people beats a one-hour event', 'Free, and they usually feed you'],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'den-audubon', name: 'Audubon Rockies', neighborhood: 'Walks around the Front Range',
        blurb: 'Guided bird walks and nature programmes. Slow, quiet, outdoors, and full of people glad to explain what you are looking at.',
        interests: ['nature', 'outdoors', 'environment'], url: 'https://rockies.audubon.org/',
        firstStep: { kind: 'rsvp', label: 'Join a beginner bird walk', url: 'https://rockies.audubon.org/', when: 'Weekend and weekday mornings' },
        expect: ['Beginner walks are a standing offering', 'Loaner binoculars are often available if you ask', 'Many walks are free'],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'den-center', name: 'The Center on Colfax', neighborhood: 'Capitol Hill',
        blurb: 'The Rocky Mountain region\'s LGBTQ+ centre: free groups most days, from youth and elders to trans support and social nights.',
        interests: ['lgbtq', 'social', 'support', 'newcomer'], url: 'https://lgbtqcolorado.org/',
        firstStep: { kind: 'visit', label: 'Pick one free group from the calendar', url: 'https://lgbtqcolorado.org/', when: 'Programs most days' },
        expect: ['Most programs are free and drop-in', 'Staff expect people who know nobody', 'Capitol Hill location makes it easy to combine with something else'],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'den-ddfl', name: 'Denver Dumb Friends League', neighborhood: 'Quebec Street + Buddy Center',
        blurb: 'One of the oldest and largest shelters in the country, with a big volunteer programme — dog walking, cat care, adoption support.',
        interests: ['animals', 'volunteering'], url: 'https://www.ddfl.org/',
        firstStep: { kind: 'signup', label: 'Apply and attend a volunteer orientation', url: 'https://www.ddfl.org/', when: 'Orientations regularly; shifts most days' },
        expect: ['Application and orientation come before your first shift', 'Recurring shifts mean the same volunteers each week', 'Free, with a minimum commitment once trained'],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'den-bovine', name: 'Bovine Metropolis Theater', neighborhood: 'Downtown',
        blurb: 'Denver\'s improv theatre and school, with a level-one class made up entirely of people who have never done it and cheap shows most weekends.',
        interests: ['theater', 'social'], url: 'https://bovinemetropolis.com/',
        firstStep: { kind: 'register', label: 'See a cheap show, then book Level 1', url: 'https://bovinemetropolis.com/', when: 'Shows most weekends; classes in terms' },
        expect: ['Level 1 assumes nothing and has no public performance early on', 'You will learn a dozen names in one evening', 'Classes cost money; a show is cheap reconnaissance'],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'den-swallowhill', name: 'Swallow Hill Music', neighborhood: 'Yale Avenue',
        blurb: 'A folk music school and venue running adult group classes for absolute beginners — guitar, ukulele, singing — that end in people playing together.',
        interests: ['music', 'social'], url: 'https://swallowhillmusic.org/',
        firstStep: { kind: 'register', label: 'Enrol in an adult beginner group class', url: 'https://swallowhillmusic.org/', when: 'Terms start several times a year' },
        expect: ['Group classes for adults who have never touched the instrument are the core of the place', 'Several weeks with the same people', 'Classes cost money; instruments can be rented'],
        solo: 5, gentleness: 5, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'den-asld', name: 'Art Students League of Denver', neighborhood: 'Sherman Street',
        blurb: 'A non-profit art school in an old schoolhouse, with short adult courses in drawing, painting, ceramics and printmaking at sensible prices.',
        interests: ['art', 'crafts', 'making', 'social'], url: 'https://asld.org/',
        firstStep: { kind: 'register', label: 'Book a short beginner course or a one-day workshop', url: 'https://asld.org/', when: 'Courses and workshops year-round' },
        expect: ['Beginner courses assume no training', 'One-day workshops exist if a term feels like too much', 'Materials are sometimes included — check the listing'],
        solo: 5, gentleness: 5, structure: 'course', commitment: 'one-off', cost: 2,
        when: ['weekday-eve', 'weekend', 'weekday-day'], size: 'medium', goals: ['skill', 'friends']
      },
      {
        id: 'den-denverfilm', name: 'Denver Film', neighborhood: 'Sie FilmCenter, Colfax',
        blurb: 'Runs a year-round arthouse cinema and the Denver Film Festival, with volunteer roles at both.',
        interests: ['filmphoto', 'art', 'volunteering', 'social'], url: 'https://www.denverfilm.org/',
        firstStep: { kind: 'rsvp', label: 'Go to one screening, or volunteer at the festival', url: 'https://www.denverfilm.org/', when: 'Screenings daily; festival is seasonal' },
        expect: ['Festival volunteers work shifts in teams and usually get in free', 'A screening is a defined, time-boxed thing to do alone', 'Membership lowers ticket prices'],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'den-zen', name: 'Zen Center of Denver', neighborhood: 'Harvard Gulch',
        blurb: 'A long-established zen centre with introductory sessions that explain, out loud, exactly what to do with your body and your hands.',
        interests: ['stillness', 'faith', 'support'], url: 'https://www.zencenterofdenver.org/',
        firstStep: { kind: 'register', label: 'Attend an introduction to meditation session', url: 'https://www.zencenterofdenver.org/', when: 'Introductions and weekly sittings' },
        expect: ['The introduction is for people who have never done it', 'You are told where to sit and when to stand', 'Usually by donation or a modest fee'],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['routine', 'friends']
      },
      {
        id: 'den-turnverein', name: 'Denver Turnverein', neighborhood: 'Capitol Hill',
        blurb: 'A German-American social club founded in 1865 that now runs swing, salsa and ballroom dances with a beginner lesson before each one.',
        interests: ['dance', 'music', 'social', 'fitness'], url: 'https://denverturnverein.org/',
        firstStep: { kind: 'dropin', label: 'Arrive early for the beginner lesson, then stay for the dance', url: 'https://denverturnverein.org/', when: 'Dances several nights a week' },
        expect: ['A beginner lesson runs before the dance and partners rotate', 'No partner and no experience needed', 'Small door charge'],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'den-parks', name: 'Denver Parks & Recreation', neighborhood: 'Rec centres citywide',
        blurb: 'City rec centres with cheap adult classes and drop-in sports — basketball, volleyball, pickleball, swimming, fitness — in most neighbourhoods.',
        interests: ['sports', 'fitness', 'dance', 'social'], url: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Parks-Recreation',
        firstStep: { kind: 'register', label: 'Find your nearest rec centre and register for one class or drop-in', url: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Parks-Recreation', when: 'Drop-in weekly; classes seasonal' },
        expect: ['Drop-in sessions cost a few dollars', 'Seasonal classes mean the same faces for eight weeks', 'Adult beginner sections exist for most things'],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends', 'skill']
      },
      {
        id: 'den-toollibrary',
        name: 'Denver Tool Library',
        neighborhood: 'Globeville',
        blurb: 'A lending library for tools rather than books, with a workshop, classes and volunteer nights. Membership costs less than buying one decent drill.',
        interests: ['making', 'tech', 'environment', 'volunteering', 'crafts'],
        url: 'https://denvertoollibrary.org/',
        firstStep: {
          kind: 'visit',
          label: 'Visit during open hours, or come to a volunteer night',
          url: 'https://denvertoollibrary.org/',
          when: 'Open hours several days a week'
        },
        expect: [
          'Borrowing a tool is a low-stakes reason to walk in',
          'Volunteer nights need no skills \u2014 you are shown what to do',
          'Membership is modest and visiting is free'
        ],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['skill', 'impact', 'friends']
      },
      {
        id: 'den-bbbs', name: 'Big Brothers Big Sisters of Colorado', neighborhood: 'Metro Denver',
        blurb: 'Matches you with one young person for regular, low-key time together, with a caseworker supporting the match.',
        interests: ['mentoring', 'volunteering'], url: 'https://www.biglittlecolorado.org/',
        firstStep: { kind: 'signup', label: 'Start an enquiry to be matched', url: 'https://www.biglittlecolorado.org/', when: 'Rolling; expect a few weeks to be matched' },
        expect: ['Expect an application, background check and interview — this is a real commitment', 'A caseworker supports the match, so you are never on your own', 'Usually a year and a couple of hours a month'],
        solo: 5, gentleness: 4, structure: 'register', commitment: 'seasonal', cost: 0,
        when: ['flexible'], size: 'large', goals: ['impact']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
