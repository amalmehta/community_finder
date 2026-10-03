/* Curated communities — Portland. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'pdx',
    name: 'Portland',
    region: 'OR',
    aliases: ['portland', 'pdx', 'portland or', 'portland oregon', 'beaverton', 'gresham', 'se portland', 'ne portland'],
    orgs: [
      {
        id: 'pdx-foodbank', name: 'Oregon Food Bank', neighborhood: 'NE Portland warehouse',
        blurb: 'Warehouse shifts repacking food for the region, with evening slots and music on. Among the easiest ways to spend two hours usefully among strangers.',
        interests: ['volunteering', 'food'], url: 'https://www.oregonfoodbank.org/',
        firstStep: { kind: 'signup', label: 'Book a single volunteer shift', url: 'https://www.oregonfoodbank.org/volunteer/', when: 'Day and evening shifts most days' },
        expect: ['Short training, then a repetitive task you cannot get wrong', 'Two to three hours, complete in itself', 'Free'],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'pdx-library', name: 'Multnomah County Library', neighborhood: '19 branches',
        blurb: 'Free book groups, English conversation circles, writing workshops, craft nights, board games and storytimes in every neighbourhood.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'parents', 'games'],
        url: 'https://multcolib.org/',
        firstStep: { kind: 'rsvp', label: 'Find one event at your nearest branch', url: 'https://multcolib.org/events', when: 'Daily' },
        expect: ['Free and mostly drop-in', 'Conversation circles exist so strangers talk to each other', 'Branches are small and local'],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'pdx-ctrlh', name: 'ctrl-H', neighborhood: 'Southeast Portland',
        blurb: 'Portland\'s volunteer-run hackerspace — electronics, 3D printing, lasers, lockpicking — with open nights for anyone who wants to look.',
        interests: ['making', 'tech', 'art'], url: 'https://ctrl-h.org/',
        firstStep: { kind: 'visit', label: 'Come to an open night', url: 'https://ctrl-h.org/', when: 'Weekly open evening — check the site' },
        expect: ['Open nights exist so strangers can wander in', 'Visiting is free; membership costs money', 'Nobody expects you to know how anything works'],
        solo: 4, gentleness: 3, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekday-eve'], size: 'small', goals: ['skill', 'friends']
      },
      {
        id: 'pdx-streettrust', name: 'The Street Trust', neighborhood: 'Citywide',
        blurb: 'Advocacy for biking, walking and transit, with volunteer events and rides — a way to be useful about something you already have opinions on.',
        interests: ['cycling', 'civic', 'environment', 'volunteering'], url: 'https://www.thestreettrust.org/',
        firstStep: { kind: 'rsvp', label: 'Volunteer at an event or join a ride', url: 'https://www.thestreettrust.org/', when: 'Events through the year' },
        expect: ['Event volunteering gives you a specific job', 'Free', 'A shared cause skips a lot of small talk'],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'pdx-frontrunners', name: 'Portland Frontrunners', neighborhood: 'Runs around the city',
        blurb: 'An LGBTQ+ and allies running and walking club with free weekly runs at every pace and coffee afterwards.',
        interests: ['running', 'lgbtq', 'social', 'fitness', 'outdoors'], url: 'https://portlandfrontrunners.org/',
        firstStep: { kind: 'dropin', label: 'Turn up to a weekly run — walkers included', url: 'https://portlandfrontrunners.org/', when: 'Several runs a week' },
        expect: ['Walkers and slow runners are part of the point', 'Free to come to a group run', 'The coffee afterwards is where people actually talk'],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['friends', 'routine']
      },
      {
        id: 'pdx-mazamas', name: 'Mazamas', neighborhood: 'SE Portland + trips',
        blurb: 'A mountaineering club founded on Mount Hood in 1894, teaching hiking, climbing and navigation through courses that run with the same cohort for weeks.',
        interests: ['outdoors', 'nature', 'fitness', 'social'], url: 'https://mazamas.org/',
        firstStep: { kind: 'register', label: 'Join a beginner-rated hike or an intro course', url: 'https://mazamas.org/', when: 'Hikes year-round; courses seasonal' },
        expect: ['Hikes are graded, and the easy ones are genuinely easy', 'Courses put you with the same people for weeks', 'Membership has a fee; many hikes are open to non-members'],
        solo: 5, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'pdx-friendsoftrees', name: 'Friends of Trees', neighborhood: 'Plantings citywide',
        blurb: 'Saturday-morning tree plantings in neighbourhoods across the city. You are put in a small crew, handed a shovel, and done by lunchtime.',
        interests: ['environment', 'gardening', 'volunteering', 'outdoors'], url: 'https://friendsoftrees.org/',
        firstStep: { kind: 'signup', label: 'Sign up for one Saturday planting', url: 'https://friendsoftrees.org/volunteer/', when: 'Saturday mornings, planting season' },
        expect: ['Crews of four or five, which makes talking easy', 'Tools, gloves and training provided', 'Free, and finished by early afternoon'],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'pdx-audubon', name: 'Portland Audubon', neighborhood: 'Forest Park sanctuary',
        blurb: 'A wildlife sanctuary in Forest Park with free guided bird walks, a care centre for injured birds, and classes for beginners.',
        interests: ['nature', 'outdoors', 'environment', 'animals'], url: 'https://audubonportland.org/',
        firstStep: { kind: 'rsvp', label: 'Join a beginner bird walk', url: 'https://audubonportland.org/', when: 'Weekend and weekday mornings' },
        expect: ['Beginner walks are a standing offering', 'Loaner binoculars are often available if you ask', 'The sanctuary trails are free and open daily'],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'pdx-qcenter', name: 'Q Center', neighborhood: 'North Portland',
        blurb: 'Portland\'s LGBTQ+ community centre, with free drop-in groups, social events and support most days of the week.',
        interests: ['lgbtq', 'social', 'support', 'newcomer'], url: 'https://www.pdxqcenter.org/',
        firstStep: { kind: 'visit', label: 'Pick one free group from the calendar', url: 'https://www.pdxqcenter.org/', when: 'Programs most days' },
        expect: ['Most programs are free and drop-in', 'Staff expect people who know nobody', 'You can sit in the space without joining anything'],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'routine']
      },
      {
        id: 'pdx-humane', name: 'Oregon Humane Society', neighborhood: 'Northeast Portland',
        blurb: 'Large shelter with a well-run volunteer programme — dog walking, cat socialising, adoption support — and proper training first.',
        interests: ['animals', 'volunteering'], url: 'https://www.oregonhumane.org/',
        firstStep: { kind: 'signup', label: 'Apply and book a volunteer orientation', url: 'https://www.oregonhumane.org/volunteer/', when: 'Orientations regularly; shifts most days' },
        expect: ['Application and orientation before your first shift', 'Recurring shifts mean the same volunteers weekly', 'Free, with a minimum commitment once trained'],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'pdx-curious', name: 'Curious Comedy Theater', neighborhood: 'NE Alberta',
        blurb: 'A non-profit improv theatre with beginner classes and cheap shows, where the level-one room is entirely people who have never done it.',
        interests: ['theater', 'social'], url: 'https://curiouscomedy.org/',
        firstStep: { kind: 'register', label: 'See a cheap show, then book a beginner class', url: 'https://curiouscomedy.org/', when: 'Shows most weekends; classes in terms' },
        expect: ['Beginner classes assume nothing', 'You will know a dozen names after one evening', 'Classes cost money; a show is cheap reconnaissance'],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'pdx-ethos', name: 'Ethos Music Center', neighborhood: 'North Portland',
        blurb: 'A non-profit music school with adult group classes and lessons on a sliding scale, built so that cost is not the reason you never learned.',
        interests: ['music', 'social'], url: 'https://ethos.org/',
        firstStep: { kind: 'email', label: 'Ask which adult group classes take beginners', url: 'https://ethos.org/', when: 'Terms through the year' },
        expect: ['Sliding-scale pricing is real and asking about it is normal', 'Adult beginner groups exist', 'A weekly class with the same people is the point'],
        solo: 4, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'pdx-multnomaharts', name: 'Multnomah Arts Center', neighborhood: 'Multnomah Village',
        blurb: 'A city-run arts centre in an old school building with cheap adult classes in ceramics, drawing, dance, textiles and music.',
        interests: ['art', 'crafts', 'dance', 'music', 'making'], url: 'https://www.portland.gov/parks/multnomah-arts-center',
        firstStep: { kind: 'register', label: 'Register for one seasonal adult class', url: 'https://www.portland.gov/parks/multnomah-arts-center', when: 'Seasonal terms' },
        expect: ['City-run, so prices are a fraction of a private studio', 'Eight to ten weeks with the same group', 'Adult beginner sections for nearly everything'],
        solo: 4, gentleness: 5, structure: 'course', commitment: 'seasonal', cost: 1,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'routine']
      },
      {
        id: 'pdx-hollywood', name: 'Hollywood Theatre', neighborhood: 'NE Sandy Boulevard',
        blurb: 'A non-profit cinema in a 1926 building, running repertory series, oddities and a volunteer programme that gets you in free.',
        interests: ['filmphoto', 'art', 'volunteering', 'social'], url: 'https://hollywoodtheatre.org/',
        firstStep: { kind: 'rsvp', label: 'Go to one screening, or ask about volunteering', url: 'https://hollywoodtheatre.org/', when: 'Screenings most nights' },
        expect: ['Volunteering gives you a defined job for an evening and usually a free film', 'Recurring series bring back the same faces', 'Tickets are cheap'],
        solo: 5, gentleness: 5, structure: 'rsvp', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill', 'impact']
      },
      {
        id: 'pdx-dharmarain', name: 'Dharma Rain Zen Center', neighborhood: 'NE Portland',
        blurb: 'A zen centre on a reclaimed landfill turned garden, with introductory sessions aimed squarely at people who have never meditated.',
        interests: ['stillness', 'faith', 'support'], url: 'https://dharma-rain.org/',
        firstStep: { kind: 'visit', label: 'Go to an introduction session', url: 'https://dharma-rain.org/', when: 'Introductions and weekly sittings' },
        expect: ['The introduction exists for complete beginners', 'You are told exactly what to do and when', 'By donation'],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends']
      },
      {
        id: 'pdx-countrydance', name: 'Portland Country Dance Community', neighborhood: 'Halls around the city',
        blurb: 'Contra and English country dances with a beginner lesson first and live music. Contra rotates partners constantly, so you dance with everyone.',
        interests: ['dance', 'music', 'social', 'fitness'], url: 'https://portlandcountrydance.org/',
        firstStep: { kind: 'dropin', label: 'Come for the beginner lesson before the dance', url: 'https://portlandcountrydance.org/', when: 'Regular dance nights — check the calendar' },
        expect: ['A beginner lesson runs before the dance', 'No partner needed; contra rotates constantly', 'Small door charge, live band'],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'pdx-ultimate', name: 'Portland Ultimate', neighborhood: 'Fields across the city',
        blurb: 'Ultimate frisbee leagues and pickup, with recreational divisions and individual sign-ups that place you on a team.',
        interests: ['sports', 'fitness', 'outdoors', 'social'], url: 'https://www.portlandultimate.com/',
        firstStep: { kind: 'signup', label: 'Sign up solo for a recreational league', url: 'https://www.portlandultimate.com/', when: 'Seasonal leagues; pickup year-round' },
        expect: ['Individual sign-ups are placed on teams', 'Recreational divisions expect beginners', 'Leagues cost money; pickup is usually free'],
        solo: 4, gentleness: 3, structure: 'register', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['friends', 'routine', 'skill']
      },
      {
        id: 'pdx-guardian', name: 'Guardian Games', neighborhood: 'Inner Southeast',
        blurb: 'An enormous game shop with a pub and tables upstairs, running open play nights, learn-to-play sessions and tournaments most evenings.',
        interests: ['games', 'social'], url: 'https://guardiangames.com/',
        firstStep: { kind: 'visit', label: 'Come to an open play or learn-to-play night', url: 'https://guardiangames.com/', when: 'Game nights through the week' },
        expect: ['Learn-to-play sessions assume you know nothing', 'Staff will seat solo visitors into a game', 'Usually free or the price of a drink'],
        solo: 5, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['friends', 'routine', 'skill']
      },
      {
        id: 'pdx-friendsofchildren', name: 'Friends of the Children', neighborhood: 'Portland-wide',
        blurb: 'Founded in Portland: pairs children facing the hardest circumstances with a paid, long-term mentor, with volunteer and support roles alongside.',
        interests: ['mentoring', 'volunteering'], url: 'https://friendsofthechildren.org/',
        firstStep: { kind: 'signup', label: 'Enquire about volunteering or supporting a chapter', url: 'https://friendsofthechildren.org/', when: 'Rolling' },
        expect: ['Expect an application and a background check', 'The model is deliberately long-term, not a one-off', 'Free to you'],
        solo: 5, gentleness: 4, structure: 'register', commitment: 'seasonal', cost: 0,
        when: ['flexible'], size: 'large', goals: ['impact']
      },
      {
        id: 'pdx-growinggardens', name: 'Growing Gardens', neighborhood: 'Home gardens citywide',
        blurb: 'Builds vegetable gardens in people\'s back yards and schools. Volunteer build days are a morning of digging with a small crew and an obvious result.',
        interests: ['gardening', 'food', 'volunteering', 'outdoors'], url: 'https://www.growing-gardens.org/',
        firstStep: { kind: 'signup', label: 'Join a garden build day', url: 'https://www.growing-gardens.org/', when: 'Build days in spring and autumn' },
        expect: ['No gardening knowledge assumed; tools provided', 'Small crews working in one back garden', 'Free, and done by early afternoon'],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'small', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'pdx-scrap', name: 'SCRAP Creative Reuse', neighborhood: 'North Portland',
        blurb: 'A shop selling donated craft and art materials by the bagful, with volunteer sorting shifts and cheap workshops.',
        interests: ['crafts', 'art', 'environment', 'volunteering', 'making'], url: 'https://www.scrappdx.org/',
        firstStep: { kind: 'visit', label: 'Visit the shop, or sign up for a volunteer sorting shift', url: 'https://www.scrappdx.org/', when: 'Shop open most days; workshops monthly' },
        expect: ['Sorting donated materials needs no skills at all', 'Free to volunteer; materials are cheap', 'Workshops send you home with a finished thing'],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'pdx-literaryarts', name: 'Literary Arts', neighborhood: 'Downtown',
        blurb: 'Runs Portland Book Festival, Portland Arts & Lectures and a programme of adult writing classes, plus volunteer roles at every event.',
        interests: ['writing', 'books', 'social', 'volunteering'], url: 'https://literary-arts.org/',
        firstStep: { kind: 'register', label: 'Take one short writing class, or volunteer at an event', url: 'https://literary-arts.org/', when: 'Classes in terms; events year-round' },
        expect: ['Classes run in short blocks with the same small group', 'Festival volunteering is a defined shift', 'Classes cost money; volunteering is free and gets you in'],
        solo: 5, gentleness: 4, structure: 'course', commitment: 'one-off', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['skill', 'friends', 'impact']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
