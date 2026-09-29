/* community_finder — data core.
 * Defines the interest taxonomy and the registry that city data files push into.
 * Works as a plain <script> in the browser and as a require() in Node (tests).
 */
(function (g) {
  'use strict';

  // --- Interest taxonomy -----------------------------------------------------
  // `search` terms are used by the universal fallback engine to build real
  // search URLs for cities we have not hand-curated.
  var GROUPS = [
    {
      id: 'move',
      label: 'Move',
      interests: [
        { id: 'outdoors', label: 'Hiking & outdoors', icon: '🥾', search: 'hiking outdoors' },
        { id: 'running', label: 'Running & walking', icon: '🏃', search: 'running club' },
        { id: 'cycling', label: 'Cycling', icon: '🚲', search: 'cycling bike club' },
        { id: 'fitness', label: 'Fitness & movement', icon: '💪', search: 'fitness workout group' },
        { id: 'sports', label: 'Pickup & team sports', icon: '⚽', search: 'pickup sports league' },
        { id: 'dance', label: 'Dance', icon: '💃', search: 'dance class social' },
        { id: 'stillness', label: 'Yoga & meditation', icon: '🧘', search: 'meditation yoga group' }
      ]
    },
    {
      id: 'make',
      label: 'Make',
      interests: [
        { id: 'art', label: 'Art & drawing', icon: '🎨', search: 'art drawing group' },
        { id: 'crafts', label: 'Crafts & textiles', icon: '🧶', search: 'knitting crafts circle' },
        { id: 'music', label: 'Music & singing', icon: '🎵', search: 'community choir music jam' },
        { id: 'theater', label: 'Theater & improv', icon: '🎭', search: 'improv theater class' },
        { id: 'filmphoto', label: 'Film & photography', icon: '📷', search: 'photography film club' },
        { id: 'writing', label: 'Writing', icon: '✍️', search: 'writing group workshop' },
        { id: 'making', label: 'Building, repair & hackerspaces', icon: '🔧', search: 'makerspace repair' }
      ]
    },
    {
      id: 'think',
      label: 'Think & play',
      interests: [
        { id: 'books', label: 'Books & reading', icon: '📚', search: 'book club' },
        { id: 'tech', label: 'Tech & coding', icon: '💻', search: 'coding tech meetup' },
        { id: 'games', label: 'Board games & tabletop', icon: '🎲', search: 'board games tabletop' },
        { id: 'language', label: 'Languages & exchange', icon: '🌐', search: 'language exchange' }
      ]
    },
    {
      id: 'grow',
      label: 'Grow',
      interests: [
        { id: 'food', label: 'Food & cooking', icon: '🍳', search: 'cooking food community' },
        { id: 'gardening', label: 'Gardening & plants', icon: '🌱', search: 'community garden' },
        { id: 'animals', label: 'Animals', icon: '🐾', search: 'animal shelter volunteer' },
        { id: 'nature', label: 'Birding & nature', icon: '🦅', search: 'birding nature walk' },
        { id: 'environment', label: 'Environment & climate', icon: '🌍', search: 'climate environmental group' }
      ]
    },
    {
      id: 'give',
      label: 'Give',
      interests: [
        { id: 'volunteering', label: 'Volunteering & mutual aid', icon: '🤝', search: 'volunteer' },
        { id: 'civic', label: 'Civic & neighborhood', icon: '🏛️', search: 'neighborhood association civic' },
        { id: 'mentoring', label: 'Mentoring & tutoring', icon: '🎓', search: 'tutoring mentoring volunteer' }
      ]
    },
    {
      id: 'belong',
      label: 'Belong',
      interests: [
        { id: 'lgbtq', label: 'LGBTQ+ community', icon: '🏳️‍🌈', search: 'LGBTQ community center' },
        { id: 'newcomer', label: 'New in town', icon: '🧳', search: 'newcomers social group' },
        { id: 'parents', label: 'Parents & family', icon: '👶', search: 'parents group family' },
        { id: 'faith', label: 'Faith & spiritual', icon: '🕊️', search: 'faith spiritual community' },
        { id: 'support', label: 'Support & wellbeing', icon: '💬', search: 'peer support group' },
        { id: 'social', label: 'Low-key hangs', icon: '☕', search: 'social meetup new friends' }
      ]
    }
  ];

  var INTERESTS = {};
  GROUPS.forEach(function (grp) {
    grp.interests.forEach(function (i) {
      i.group = grp.id;
      INTERESTS[i.id] = i;
    });
  });

  // --- Vocabularies used by the matcher -------------------------------------
  var WHEN = ['weekday-day', 'weekday-eve', 'weekend', 'flexible'];
  var GOALS = ['friends', 'impact', 'skill', 'routine'];
  var STRUCTURE = ['drop-in', 'register', 'course', 'shift', 'rsvp', 'search'];
  var COMMITMENT = ['one-off', 'weekly', 'seasonal'];

  var FYC = g.FYC || {};
  FYC.GROUPS = GROUPS;
  FYC.INTERESTS = INTERESTS;
  FYC.WHEN = WHEN;
  FYC.GOALS = GOALS;
  FYC.STRUCTURE = STRUCTURE;
  FYC.COMMITMENT = COMMITMENT;
  FYC.cities = FYC.cities || [];

  /**
   * Register a curated city.
   * @param {{id:string,name:string,aliases:string[],region:string,orgs:Object[]}} city
   */
  FYC.addCity = function (city) {
    city.orgs.forEach(function (o) {
      o.cityId = city.id;
      o.cityName = city.name;
    });
    FYC.cities.push(city);
    return city;
  };

  /** Normalise a free-text location for matching against city names/aliases. */
  FYC.normalize = function (s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  /** Find the curated city whose name or alias matches the typed location. */
  FYC.findCity = function (input) {
    var q = FYC.normalize(input);
    if (!q) return null;
    var best = null;
    FYC.cities.forEach(function (c) {
      var keys = [c.name].concat(c.aliases || []).map(FYC.normalize);
      keys.forEach(function (k) {
        if (!k) return;
        var hit = q === k ? 3 : q.indexOf(k) !== -1 ? 2 : k.indexOf(q) !== -1 && q.length >= 4 ? 1 : 0;
        if (hit && (!best || hit > best.score)) best = { city: c, score: hit };
      });
    });
    return best ? best.city : null;
  };

  /** Every curated org across every city. */
  FYC.allOrgs = function () {
    return FYC.cities.reduce(function (acc, c) {
      return acc.concat(c.orgs);
    }, []);
  };

  g.FYC = FYC;
  if (typeof module !== 'undefined' && module.exports) module.exports = FYC;
})(typeof globalThis !== 'undefined' ? globalThis : this);
