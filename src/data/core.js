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

  // --- Circles: what a chat-first group needs before it meets ---------------
  // Shared with the server so the prompt a circle sees and the prompt the
  // server stores are the same list, and nobody can post an invented one.
  //
  // Three sets, deliberately escalating. Aron et al. (1997) got strangers to
  // report more closeness in forty-five minutes than small-talk controls by
  // walking them up a ladder of increasingly personal questions — the
  // escalation is the mechanism, not the questions. A circle climbs it by
  // answering: a set opens up once the one below it has actually been
  // answered, by more than one person. Reis & Shaver's intimacy model is why
  // that condition is there — disclosure only builds closeness when somebody
  // responds to it, so an unanswered question earns nothing.
  var PROMPT_SETS = [
    {
      depth: 1,
      label: 'Easy',
      note: 'Facts, places, recommendations. Nobody has to give anything away.',
      prompts: [
        'What made you look for a group like this one?',
        'What is something you have done near here lately that you would recommend?',
        'What does a good weekend look like for you?',
        'What time of day are you actually any good?',
        'What is a small thing in this city that you think is underrated?'
      ]
    },
    {
      depth: 2,
      label: 'Personal',
      note: 'What you like, what you avoid, what you are actually like.',
      prompts: [
        'What are you slightly bad at but enjoy anyway?',
        'What is the last thing you got properly absorbed in?',
        'Where do you go when you want to be around people without talking to them?',
        'What puts you off a group? Useful to know before we plan anything.',
        'What is something you have changed your mind about recently?'
      ]
    },
    {
      depth: 3,
      label: 'Real',
      note: 'The things people only say once they trust the room. This is where a group chat becomes a group.',
      prompts: [
        'What is something you are quietly proud of that never comes up in conversation?',
        'When did you last feel properly part of something, and what was it?',
        'What is the hardest part of making friends somewhere new, for you?',
        'What would you like to be doing more of six months from now?',
        'If we did one thing together this month, what would you want it to be?'
      ]
    }
  ];

  // The flat list, in ladder order: PROMPTS[0] is still the easiest opener,
  // which is what a new circle and the default joining question both use.
  var PROMPTS = PROMPT_SETS.reduce(function (acc, s) { return acc.concat(s.prompts); }, []);

  /** Which set a prompt came from, found by its text so nothing has to be
   *  stored alongside the message. 0 if it is not one of ours. */
  function promptDepth(body) {
    var found = 0;
    PROMPT_SETS.forEach(function (s) {
      if (s.prompts.indexOf(String(body)) !== -1) found = s.depth;
    });
    return found;
  }

  // Shown on every meetup card. Not legal cover — it is the advice you would
  // give a friend, in the place they would read it.
  var MEETUP_SAFETY = [
    'First time: somewhere public, in daylight if you can.',
    'Tell someone outside the circle where you are going and when.',
    'Your own way there and back. Nobody needs your address.',
    'Leaving early is always fine, and needs no reason.',
    'If someone pushes past a no, report them — the host and we both see it.'
  ];

  var FYC = g.FYC || {};
  FYC.PROMPTS = PROMPTS;
  FYC.PROMPT_SETS = PROMPT_SETS;
  FYC.promptDepth = promptDepth;
  FYC.MEETUP_SAFETY = MEETUP_SAFETY;
  FYC.GROUPS = GROUPS;
  FYC.INTERESTS = INTERESTS;
  FYC.WHEN = WHEN;
  FYC.GOALS = GOALS;
  FYC.STRUCTURE = STRUCTURE;
  FYC.COMMITMENT = COMMITMENT;
  FYC.cities = FYC.cities || [];

  /**
   * Register a curated city.
   * @param {{id:string,name:string,aliases:string[],region:string,
   *          states?:string[],orgs:Object[]}} city
   */
  FYC.addCity = function (city) {
    city.orgs.forEach(function (o) {
      o.cityId = city.id;
      o.cityName = city.name;
    });
    // Which states this city's aliases legitimately reach into. A metro area
    // crosses state lines — Arlington is DC, Cambridge is Boston — so the
    // city's own region is only the default.
    if (!city.states) city.states = [city.region];
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

  // --- Location matching ----------------------------------------------------
  // Matching used to be done on raw substrings, and the short aliases made
  // that a lottery: 'la' is inside Dallas, Atlanta, Cleveland and Orlando,
  // 'chi' is inside Wichita, 'den' is inside Ogden. Every one of those typed
  // in the box came back with a city on the other side of the country, and
  // "Portland, Maine" came back as Los Angeles, because 'la' is inside
  // Portland too and LA is registered first. Everything below matches whole
  // words instead, and throws out a match the typed state contradicts.

  var STATES = {
    al: 'alabama', ak: 'alaska', az: 'arizona', ar: 'arkansas', ca: 'california',
    co: 'colorado', ct: 'connecticut', de: 'delaware', dc: 'district of columbia',
    fl: 'florida', ga: 'georgia', hi: 'hawaii', id: 'idaho', il: 'illinois',
    in: 'indiana', ia: 'iowa', ks: 'kansas', ky: 'kentucky', la: 'louisiana',
    me: 'maine', md: 'maryland', ma: 'massachusetts', mi: 'michigan',
    mn: 'minnesota', ms: 'mississippi', mo: 'missouri', mt: 'montana',
    ne: 'nebraska', nv: 'nevada', nh: 'new hampshire', nj: 'new jersey',
    nm: 'new mexico', ny: 'new york', nc: 'north carolina', nd: 'north dakota',
    oh: 'ohio', ok: 'oklahoma', or: 'oregon', pa: 'pennsylvania',
    ri: 'rhode island', sc: 'south carolina', sd: 'south dakota',
    tn: 'tennessee', tx: 'texas', ut: 'utah', vt: 'vermont', va: 'virginia',
    wa: 'washington', wv: 'west virginia', wi: 'wisconsin', wy: 'wyoming'
  };
  var STATE_OF_NAME = {};
  Object.keys(STATES).forEach(function (ab) {
    STATE_OF_NAME[STATES[ab]] = ab.toUpperCase();
  });

  function words(s) {
    var n = FYC.normalize(s);
    return n ? n.split(' ') : [];
  }

  /** Where the token run `kt` starts inside `qt`, or -1. Whole words only, so
   *  'la' is found in "los angeles la" and not in "dallas". */
  function runAt(qt, kt) {
    for (var i = 0; i + kt.length <= qt.length; i++) {
      var hit = true;
      for (var j = 0; j < kt.length; j++) {
        if (qt[i + j] !== kt[j]) { hit = false; break; }
      }
      if (hit) return i;
    }
    return -1;
  }

  /** Still typing: same number of words, the last one a prefix of the key's.
   *  "san fran" finds San Francisco, "minneapol" finds Minneapolis. Four
   *  characters minimum, or two letters would pick a city for you. */
  function isPrefixOf(qt, kt) {
    if (qt.length !== kt.length || qt.join('').length < 4) return false;
    for (var i = 0; i < qt.length; i++) {
      var last = i === qt.length - 1;
      if (last ? kt[i].indexOf(qt[i]) !== 0 : kt[i] !== qt[i]) return false;
    }
    return !(qt.length === 1 && qt[0] === kt[0]);
  }

  /**
   * The state the typed location names *outside* the words that matched a city
   * key — the "ME" in "Portland, ME". Null when it names none.
   * @param {string[]} qt the whole query, in words
   * @param {number} from first word the city key matched
   * @param {number} len how many words it matched
   */
  function statedState(qt, from, len) {
    // "Washington State": the key itself was a state's name and the next word
    // says to read it that way. "New York State" lands on New York, correctly.
    var key = qt.slice(from, from + len).join(' ');
    if (qt[from + len] === 'state' && STATE_OF_NAME[key]) return STATE_OF_NAME[key];

    // A state's full name, anywhere in what is left: "Portland, Maine".
    var rest = qt.slice(0, from).concat(qt.slice(from + len));
    for (var i = 0; i < rest.length; i++) {
      for (var n = 2; n >= 1; n--) {
        if (i + n > rest.length) continue;
        var phrase = rest.slice(i, i + n).join(' ');
        if (STATE_OF_NAME[phrase]) return STATE_OF_NAME[phrase];
      }
    }

    // A two-letter abbreviation, but only as the final word, which is the
    // "City, ST" convention. Half of them are ordinary English words, and
    // "Portland in the rain" is not a question about Indiana.
    var last = qt[qt.length - 1];
    if (from + len <= qt.length - 1 && last.length === 2 && STATES[last]) {
      return last.toUpperCase();
    }
    return null;
  }

  /** Find the curated city whose name or alias matches the typed location. */
  FYC.findCity = function (input) {
    var qt = words(input);
    if (!qt.length) return null;
    var best = null;
    FYC.cities.forEach(function (c) {
      var reaches = c.states || [c.region];
      [c.name].concat(c.aliases || []).forEach(function (raw) {
        var kt = words(raw);
        if (!kt.length) return;
        var at = runAt(qt, kt);
        var score = 0, from = 0, len = kt.length;
        if (at === 0 && kt.length === qt.length) score = 3;        // the whole box
        else if (at !== -1) { score = 2; from = at; }              // a run inside it
        else if (isPrefixOf(qt, kt)) { score = 1; len = qt.length; }
        if (!score) return;
        // Named a state this city does not reach? Then it is not this city.
        var st = statedState(qt, from, len);
        if (st && reaches.indexOf(st) === -1) return;
        // Longest key wins a tie, so the answer does not depend on which
        // city file happened to be loaded first.
        if (!best || score > best.score || (score === best.score && kt.length > best.span)) {
          best = { city: c, score: score, span: kt.length };
        }
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
