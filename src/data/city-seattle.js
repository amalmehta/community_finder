/* Curated communities — Seattle. */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./core.js');

  FYC.addCity({
    id: 'sea',
    name: 'Seattle',
    region: 'WA',
    aliases: ['seattle', 'sea', 'bellevue', 'eastside', 'tacoma', 'puget sound', 'kirkland', 'redmond'],
    orgs: [
      {
        id: 'sea-mountaineers',
        name: 'The Mountaineers',
        neighborhood: 'Magnuson Park + branches',
        blurb: 'A 100-year-old outdoors club that teaches people to hike, climb, ski and paddle through structured courses. The single best answer to "I moved here and know nobody".',
        interests: ['outdoors', 'fitness', 'nature', 'social'],
        url: 'https://www.mountaineers.org/',
        firstStep: {
          kind: 'register',
          label: 'Join a beginner-friendly day hike or an intro course',
          url: 'https://www.mountaineers.org/activities',
          when: 'Activities year-round; courses run seasonally'
        },
        script: 'Hi! I\'m new to the area and would like to get outdoors with people. I\'m a beginner at {interest} — which activity or course would you point a total newcomer to?',
        expect: [
          'Trips are graded, and the easy ones are genuinely easy',
          'Courses run over several weeks with the same cohort — this is the friendship mechanism',
          'Membership has a fee; some activities are open to non-members',
          'Trip leaders are volunteers who like teaching beginners'
        ],
        solo: 5, gentleness: 4, structure: 'course', commitment: 'seasonal', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'sea-wta',
        name: 'Washington Trails Association work parties',
        neighborhood: 'Trails across the region',
        blurb: 'Volunteer trail-maintenance days where a crew of strangers spends a day building tread and eating lunch on a log together. No experience, tools provided.',
        interests: ['outdoors', 'environment', 'volunteering', 'nature'],
        url: 'https://www.wta.org/',
        firstStep: {
          kind: 'signup',
          label: 'Sign up for one day work party',
          url: 'https://www.wta.org/volunteer',
          when: 'Weekends and weekdays through the season'
        },
        script: null,
        expect: [
          'Tools, training and a crew leader are all provided',
          'A full day with the same 8 people is far more social than a one-hour event',
          'Free — they often feed you',
          'Beginners are the majority on most work parties'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'medium', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'sea-frontrunners',
        name: 'Seattle Frontrunners',
        neighborhood: 'Green Lake & Capitol Hill',
        blurb: 'An LGBTQ+ and allies running and walking club with free weekly group runs at every pace, plus brunch afterwards. Welcoming newcomers is more or less the club\'s whole personality.',
        interests: ['running', 'lgbtq', 'social', 'fitness', 'outdoors'],
        url: 'https://seattlefrontrunners.org/',
        firstStep: {
          kind: 'dropin',
          label: 'Turn up to a weekly group run — walkers included',
          url: 'https://seattlefrontrunners.org/',
          when: 'Weekly group runs; check the site for times'
        },
        script: 'Hi! I\'m new to Seattle and would like to join a run. I\'m slow and I\'ll be coming on my own — which run would you recommend for a first-timer?',
        expect: [
          'Walkers and slow runners are explicitly part of the point',
          'Free — there is no fee to come to a group run',
          'The post-run coffee or brunch is where you actually meet people',
          'Arriving alone is how almost everyone starts'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['friends', 'routine']
      },
      {
        id: 'sea-cascade',
        name: 'Cascade Bicycle Club',
        neighborhood: 'Rides across the region',
        blurb: 'One of the largest cycling clubs in the country, with free daily rides graded by pace, including very relaxed ones, plus classes for nervous riders.',
        interests: ['cycling', 'fitness', 'outdoors', 'social'],
        url: 'https://cascade.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join one free "social pace" ride',
          url: 'https://cascade.org/rides-events',
          when: 'Rides most days; more in summer'
        },
        script: 'Hi! I\'d like to try a club ride but I\'m slow and have never ridden in a group. Which ride would you recommend for a first-timer?',
        expect: [
          'Pace ratings are honest — pick the slowest',
          'Free daily rides exist alongside the paid events',
          'Ride leaders introduce newcomers at the start',
          'Nobody gets dropped on a social-pace ride'
        ],
        solo: 4, gentleness: 4, structure: 'rsvp', commitment: 'weekly', cost: 0,
        when: ['weekend', 'weekday-eve'], size: 'large', goals: ['friends', 'routine']
      },
      {
        id: 'sea-earthcorps',
        name: 'EarthCorps volunteer days',
        neighborhood: 'Parks & shorelines citywide',
        blurb: 'Restoration workdays pulling ivy and planting natives in Seattle parks. Three hours, outdoors, tools provided, and a crew that talks while it works.',
        interests: ['environment', 'gardening', 'outdoors', 'volunteering'],
        url: 'https://www.earthcorps.org/',
        firstStep: {
          kind: 'signup',
          label: 'Register for one volunteer event',
          url: 'https://www.earthcorps.org/volunteer/',
          when: 'Weekend mornings, year-round'
        },
        script: null,
        expect: [
          'Zero experience required and everything is supplied',
          'Groups are small and stay together for the morning',
          'Free',
          'It rains. Bring a jacket, everyone will be equally damp'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'medium', goals: ['impact', 'friends']
      },
      {
        id: 'sea-openseattle',
        name: 'Open Seattle',
        neighborhood: 'Civic tech, in person + online',
        blurb: 'Volunteer civic technologists who build things with and for local nonprofits and government. Open meetups with explicit newcomer time.',
        interests: ['tech', 'civic', 'volunteering'],
        url: 'https://openseattle.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'RSVP to the next open meetup',
          url: 'https://openseattle.org/',
          when: 'Regular evening sessions'
        },
        script: 'Hi! I\'d like to come to a meetup. I\'m interested in {interest} and happy to help with non-code work — is there a project that needs someone?',
        expect: [
          'Non-developers are genuinely useful here',
          'Meetings open with introductions',
          'Free',
          'Coming once to look is normal'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve'], size: 'medium', goals: ['impact', 'skill', 'friends']
      },
      {
        id: 'sea-foodlifeline',
        name: 'Food Lifeline',
        neighborhood: 'SODO / Hunger Solution Center',
        blurb: 'Warehouse shifts sorting donated food for the region. Music on, simple task, a room full of people doing it beside you.',
        interests: ['volunteering', 'food'],
        url: 'https://foodlifeline.org/',
        firstStep: {
          kind: 'signup',
          label: 'Book one shift',
          url: 'https://foodlifeline.org/volunteer/',
          when: 'Day and evening shifts, most days'
        },
        script: null,
        expect: [
          'Individuals are welcome and common',
          'Short training, nothing you can get wrong',
          'Two to three hours, complete in itself',
          'Free'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['impact', 'friends']
      },
      {
        id: 'sea-birdsconnect',
        name: 'Birds Connect Seattle',
        neighborhood: 'Parks across the city',
        blurb: 'Free and low-cost guided bird walks and classes. Slow, quiet, outdoors — and among the least intimidating group activities that exist.',
        interests: ['nature', 'outdoors', 'environment'],
        url: 'https://birdsconnectsea.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Join a beginner bird walk',
          url: 'https://birdsconnectsea.org/',
          when: 'Weekend and weekday mornings'
        },
        script: 'Hi — I\'m a beginner and don\'t own binoculars. Is the upcoming walk right for me, and are loaners available?',
        expect: [
          'Beginner walks are a standing offering',
          'Loaner binoculars are often available — just ask',
          'Slow pace, frequent stopping',
          'Many walks are free'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'sea-gaycity',
        name: 'Gay City',
        neighborhood: 'Capitol Hill',
        blurb: 'Seattle\'s LGBTQ+ center: a free queer library and cafe space, drop-in programs, arts events and health services in one building on Capitol Hill.',
        interests: ['lgbtq', 'social', 'support', 'newcomer', 'books'],
        url: 'https://www.gaycity.org/',
        firstStep: {
          kind: 'visit',
          label: 'Sit in the library, or pick one free event',
          url: 'https://www.gaycity.org/events/',
          when: 'Open weekdays; events through the week'
        },
        script: 'Hi — I\'m new here and trying to meet people. Is the {interest} event drop-in, or do I need to sign up first?',
        expect: [
          'The library is a place you are allowed to exist with no agenda',
          'Most programs are free',
          'Capitol Hill location makes it easy to combine with anything else',
          'Arriving alone is normal'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve'], size: 'medium', goals: ['friends', 'routine']
      },
      {
        id: 'sea-spl',
        name: 'Seattle Public Library',
        neighborhood: '27 branches',
        blurb: 'Free book groups, Talk Time conversation circles for English learners, writing groups, craft nights and lectures — including in the famous downtown building.',
        interests: ['books', 'language', 'social', 'newcomer', 'writing', 'crafts', 'parents'],
        url: 'https://www.spl.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Find one event at your branch',
          url: 'https://www.spl.org/programs-and-services',
          when: 'Daily, including evenings and weekends'
        },
        script: null,
        expect: [
          '"Talk Time" conversation circles are explicitly designed for strangers to talk',
          'Free and mostly drop-in',
          'Branches are small and local',
          'Nobody asks anything of you'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'routine']
      },
      {
        id: 'sea-jetcity',
        name: 'Jet City Improv',
        neighborhood: 'University District',
        blurb: 'Improv theater with beginner classes and cheap shows. A level-one class is a room of adults being equally bad at something together, on purpose.',
        interests: ['theater', 'social'],
        url: 'https://jetcityimprov.org/',
        firstStep: {
          kind: 'register',
          label: 'See a show, then sign up for a beginner class',
          url: 'https://jetcityimprov.org/classes/',
          when: 'Shows most weekends; classes in terms'
        },
        script: null,
        expect: [
          'Level one is designed for people who have never done it',
          'You will learn a dozen names in one night',
          'Classes cost money; a show is a cheap way to scout first',
          'No performing in front of an audience until much later'
        ],
        solo: 5, gentleness: 3, structure: 'course', commitment: 'seasonal', cost: 2,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill']
      },
      {
        id: 'sea-parks',
        name: 'Seattle Parks & Recreation',
        neighborhood: 'Community centers citywide',
        blurb: 'Cheap adult classes and drop-in sports at neighbourhood community centers — badminton, volleyball, pottery, dance, swimming.',
        interests: ['sports', 'fitness', 'dance', 'art', 'social'],
        url: 'https://www.seattle.gov/parks',
        firstStep: {
          kind: 'register',
          label: 'Find drop-in sports or a class at your community center',
          url: 'https://www.seattle.gov/parks/recreation',
          when: 'Drop-in sessions weekly; classes seasonal'
        },
        script: null,
        expect: [
          'Drop-in gym sessions cost a few dollars and require no commitment',
          'Seasonal classes mean the same faces for 8 weeks',
          'Adult beginner sections exist for most things',
          'Your nearest community center is probably closer than you think'
        ],
        solo: 4, gentleness: 4, structure: 'drop-in', commitment: 'weekly', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'medium', goals: ['routine', 'friends', 'skill']
      },
      {
        id: 'sea-humane',
        name: 'Seattle Humane',
        neighborhood: 'Bellevue',
        blurb: 'Regional shelter with a large volunteer programme — animal care, dog walking, adoption support — and proper training before you start.',
        interests: ['animals', 'volunteering'],
        url: 'https://www.seattlehumane.org/',
        firstStep: {
          kind: 'signup',
          label: 'Apply and book a volunteer orientation',
          url: 'https://www.seattlehumane.org/volunteer/',
          when: 'Orientations regularly; shifts most days'
        },
        script: null,
        expect: [
          'Application and orientation come before your first shift',
          'Animals mean you never have to invent small talk',
          'Recurring shifts put you with the same volunteers each week',
          'Free, with a minimum commitment expected after training'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 0,
        when: ['weekday-day', 'weekend'], size: 'large', goals: ['impact', 'routine', 'friends']
      },
      {
        id: 'sea-peps',
        name: 'PEPS (Program for Early Parent Support)',
        neighborhood: 'Groups across the region',
        blurb: 'Seattle\'s answer to new-parent isolation: small groups of parents with same-age babies, meeting weekly in each other\'s homes with a trained facilitator.',
        interests: ['parents', 'support', 'social', 'newcomer'],
        url: 'https://www.peps.org/',
        firstStep: {
          kind: 'signup',
          label: 'Register for a newborn or new-parent group near you',
          url: 'https://www.peps.org/',
          when: 'Groups form continuously'
        },
        script: 'Hi! I\'m a new parent and new-ish to the area. How do I join a group near me, and what happens if I can\'t afford the fee?',
        expect: [
          'Small groups of 6\u201310 parents whose babies are the same age as yours',
          'A trained facilitator runs the first weeks, so nobody has to break the ice',
          'There is a fee, with financial assistance available — ask',
          'Many groups keep meeting for years after the programme ends'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'weekly', cost: 1,
        when: ['weekday-day', 'weekday-eve'], size: 'small', goals: ['friends', 'routine']
      },
      {
        id: 'sea-nwff',
        name: 'Northwest Film Forum',
        neighborhood: 'Capitol Hill',
        blurb: 'Cinema and film-arts centre with classes, workshops and a volunteer programme. Volunteers usher screenings and get to watch for free.',
        interests: ['filmphoto', 'art', 'volunteering', 'social'],
        url: 'https://nwfilmforum.org/',
        firstStep: {
          kind: 'signup',
          label: 'Volunteer as an usher, or book a workshop',
          url: 'https://nwfilmforum.org/',
          when: 'Screenings most nights; workshops through the year'
        },
        script: 'Hi! I\'d like to volunteer. I\'m interested in {interest} and I\'ll be coming alone — what does an usher shift involve and how do I start?',
        expect: [
          'Ushering is a defined job for an evening, which is far easier than mingling',
          'Volunteers usually watch the film free',
          'You see the same volunteers and staff repeatedly',
          'Workshops cost money; volunteering does not'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'skill', 'impact']
      },
      {
        id: 'sea-insight',
        name: 'Seattle Insight Meditation Society',
        neighborhood: 'Central Seattle + online',
        blurb: 'Large secular-leaning meditation community with free weekly sittings and talks, and introductory courses for people who have never sat still on purpose.',
        interests: ['stillness', 'faith', 'support'],
        url: 'https://seattleinsight.org/',
        firstStep: {
          kind: 'visit',
          label: 'Go to one weekly sitting, or sign up for an intro course',
          url: 'https://seattleinsight.org/',
          when: 'Weekly sittings; courses through the year'
        },
        script: 'Hi — I\'m completely new to meditation. Is the weekly sitting open to beginners, and what should I expect on a first visit?',
        expect: [
          'Guidance is spoken aloud, so you always know what to do',
          'Donation-based — nobody is turned away',
          'You can sit on a chair; no particular posture is required',
          'Tea afterwards is where the talking happens, and it is optional'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'weekly', cost: 0,
        when: ['weekday-eve', 'weekend'], size: 'large', goals: ['routine', 'friends']
      },
      {
        id: 'sea-raincity',
        name: 'Rain City Rock Camp',
        neighborhood: 'Central District',
        blurb: 'Runs an adult rock camp where grown-ups with no musical experience form a band with strangers over a weekend and play a show at the end.',
        interests: ['music', 'social', 'lgbtq'],
        url: 'https://raincityrockcamp.org/',
        firstStep: {
          kind: 'register',
          label: 'Sign up for adult rock camp, or volunteer at a youth session',
          url: 'https://raincityrockcamp.org/',
          when: 'Adult camps run periodically; volunteering year-round'
        },
        script: 'Hi! I have no musical experience at all. Is adult rock camp genuinely open to someone like me, and when is the next one?',
        expect: [
          'No experience required — that is the entire premise',
          'You are placed in a band, so the group is assigned rather than negotiated',
          'Camp costs money, usually with sliding-scale places — ask',
          'Volunteering at youth sessions is the free way in'
        ],
        solo: 5, gentleness: 4, structure: 'course', commitment: 'one-off', cost: 2,
        when: ['weekend'], size: 'medium', goals: ['skill', 'friends']
      },
      {
        id: 'sea-cwb',
        name: 'The Center for Wooden Boats',
        neighborhood: 'South Lake Union',
        blurb: 'A free public boatyard on the lake that gives away free rides on historic sailboats every Sunday, and teaches volunteers to build and restore wooden boats.',
        interests: ['making', 'outdoors', 'volunteering', 'social'],
        url: 'https://cwb.org/',
        firstStep: {
          kind: 'dropin',
          label: 'Sign up on the day for a free Sunday public sail',
          url: 'https://cwb.org/',
          when: 'Public sails on Sundays; volunteer days through the week'
        },
        script: 'Hi! I\'d like to come to a public sail and I\'ve never been on a sailboat. How does sign-up work on the day, and do you need volunteers?',
        expect: [
          'The Sunday sails are genuinely free \u2014 you sign up in person that morning',
          'You are in a small boat with a volunteer skipper and a few strangers for an hour',
          'Boatshop volunteering teaches woodworking with no experience required',
          'Nobody expects you to know any sailing terms'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekend', 'weekday-day'], size: 'medium', goals: ['friends', 'skill', 'impact']
      },
      {
        id: 'sea-beaconfoodforest',
        name: 'Beacon Food Forest',
        neighborhood: 'Beacon Hill',
        blurb: 'A seven-acre public food forest on city land where anyone may pick the fruit, maintained by volunteers at open work parties. One of the largest of its kind anywhere.',
        interests: ['gardening', 'food', 'environment', 'volunteering', 'outdoors'],
        url: 'https://beaconfoodforest.org/',
        firstStep: {
          kind: 'dropin',
          label: 'Turn up to a work party \u2014 no signup needed',
          url: 'https://beaconfoodforest.org/',
          when: 'Regular work parties \u2014 check the site'
        },
        script: null,
        expect: [
          'You walk in, someone hands you a tool and shows you the job',
          'Free, and the food is free for anyone to pick',
          'No gardening knowledge assumed',
          'Work parties end with people standing around talking, which is the point'
        ],
        solo: 5, gentleness: 5, structure: 'drop-in', commitment: 'one-off', cost: 0,
        when: ['weekend'], size: 'small', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'sea-psms',
        name: 'Puget Sound Mycological Society',
        neighborhood: 'Forays across the region',
        blurb: 'One of the biggest mushroom clubs in the country, running forays, identification clinics and an annual exhibit. The Pacific Northwest is the best place on earth for this.',
        interests: ['nature', 'outdoors', 'food', 'social'],
        url: 'https://www.psms.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Come to a monthly meeting or join a foray',
          url: 'https://www.psms.org/',
          when: 'Meetings monthly; forays in the wet season'
        },
        script: 'Hello \u2014 I\'m a complete beginner. Can I come to a meeting or a foray as a guest, and is there anything I need to bring?',
        expect: [
          'Beginners are the favourite kind of guest \u2014 identification is a shared activity',
          'Meetings are easy to attend alone; forays are slow walks in the woods',
          'Modest membership; visitors usually welcome first',
          'Never eat anything without an expert confirming it'
        ],
        solo: 5, gentleness: 5, structure: 'register', commitment: 'one-off', cost: 1,
        when: ['weekend', 'weekday-eve'], size: 'medium', goals: ['friends', 'skill']
      },
      {
        id: 'sea-recreative',
        name: 'Seattle ReCreative',
        neighborhood: 'Greenwood',
        blurb: 'A creative reuse shop and art centre selling donated craft materials by the bagful, with drop-in workshops and volunteer shifts sorting the donations.',
        interests: ['crafts', 'art', 'environment', 'volunteering', 'making'],
        url: 'https://seattlerecreative.org/',
        firstStep: {
          kind: 'visit',
          label: 'Visit the shop, or sign up for a volunteer sorting shift',
          url: 'https://seattlerecreative.org/',
          when: 'Shop open most days; workshops through the month'
        },
        script: 'Hi! I\'d like to volunteer. I\'m interested in {interest} \u2014 what do shifts involve, and how do I get started?',
        expect: [
          'Sorting buttons and fabric next to someone is oddly absorbing and easy to talk over',
          'No skills needed at all',
          'Free to volunteer; materials are cheap',
          'Drop-in workshops give you a finished thing to take home'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 0,
        when: ['weekday-day', 'weekday-eve', 'weekend'], size: 'small', goals: ['impact', 'friends', 'skill']
      },
      {
        id: 'sea-fremontabbey',
        name: 'Fremont Abbey Arts Center',
        neighborhood: 'Fremont',
        blurb: 'A converted church running concerts, open mics and all-ages arts events, with a volunteer programme that gets you in free and gives you a job for the evening.',
        interests: ['music', 'art', 'social', 'volunteering', 'writing'],
        url: 'https://www.fremontabbey.org/',
        firstStep: {
          kind: 'rsvp',
          label: 'Go to one show, or volunteer at an event',
          url: 'https://www.fremontabbey.org/',
          when: 'Events most weeks'
        },
        script: 'Hi! I\'d like to volunteer at events. What roles do you need filled, and what\'s the first step for someone new?',
        expect: [
          'Volunteering gives you a defined job, which is far easier than mingling',
          'Volunteers usually see the show free',
          'All-ages and alcohol-light, which suits people who do not want a bar',
          'The same volunteers turn up repeatedly, so faces become familiar'
        ],
        solo: 5, gentleness: 5, structure: 'shift', commitment: 'one-off', cost: 1,
        when: ['weekday-eve', 'weekend'], size: 'small', goals: ['friends', 'impact', 'skill']
      }
    ]
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
