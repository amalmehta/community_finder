/* community_finder — adaptive intake.
 *
 * Twenty questions, chosen one at a time. Every answer scores interests and
 * the matching dimensions, and what you have already said decides what gets
 * asked next: pick "Give" and you are asked what kind of useful; say you find
 * this daunting and you are asked what would make it easier; say you are new
 * in town and you are asked how new.
 *
 * Pure functions — no DOM — so the whole thing is testable in Node.
 */
(function (g) {
  'use strict';
  var FYC = g.FYC || require('./data/core.js');

  var TOTAL = 20;

  // --- helpers for writing questions compactly -------------------------------
  function i(map) { return { interests: map }; }
  function pick(id, label, effects, hint) {
    return { id: id, label: label, effects: effects || {}, hint: hint || null };
  }

  /**
   * Each question declares:
   *   kind      'text' | 'one' | 'many'
   *   base      how much it is worth asking at all
   *   when(s)   false to skip it entirely given the answers so far
   *   boost(s)  extra priority given the answers so far
   */
  var QUESTIONS = [
    {
      id: 'city', kind: 'text', base: 100,
      prompt: 'Where are you?',
      hint: 'A city or neighbourhood. Anywhere works.',
      placeholder: 'e.g. Oakland, or Brooklyn, or Boise'
    },

    {
      id: 'pull', kind: 'many', max: 3, base: 95,
      prompt: 'Which of these pulls hardest right now?',
      hint: 'Up to three. Everything after this adapts to what you choose.',
      // Each group also seeds its two most representative interests, lightly.
      // Without this, answering only this question and pressing "enough" gives
      // the matcher nothing to work with.
      options: (function () {
        var SEED = {
          move: ['outdoors', 'fitness'], make: ['art', 'crafts'],
          think: ['books', 'games'], grow: ['gardening', 'nature'],
          give: ['volunteering', 'civic'], belong: ['social', 'newcomer']
        };
        return FYC.GROUPS.map(function (grp) {
          var eff = { group: {}, interests: {} };
          eff.group[grp.id] = 3;
          (SEED[grp.id] || []).forEach(function (id) { eff.interests[id] = 1; });
          return pick(grp.id, grp.label, eff,
            grp.interests.slice(0, 4).map(function (x) { return x.label; }).join(' · '));
        });
      })()
    },

    {
      id: 'comfort', kind: 'one', base: 90,
      prompt: 'You walk into a room where you know nobody. How is that?',
      options: [
        pick('low', 'Genuinely hard', { comfort: 1 }),
        pick('mid', 'Fine with a reason to be there', { comfort: 2 }),
        pick('high', 'No trouble at all', { comfort: 3 })
      ]
    },

    {
      id: 'easier', kind: 'one', base: 70,
      when: function (s) { return s.dims.comfort === 1; },
      prompt: 'What would make that easier?',
      hint: 'You said a room of strangers is hard — this decides what gets ranked first.',
      options: [
        pick('task', 'Having a job to do', { prefer: { structure: 'shift' }, goals: ['impact'] }),
        pick('dropin', 'Being able to leave whenever', { prefer: { commitment: 'one-off' } }),
        pick('small', 'A small group rather than a crowd', { prefer: { size: 'small' } }),
        pick('known', 'Knowing exactly what will happen', { prefer: { gentle: true } })
      ]
    },

    {
      id: 'commitment', kind: 'one', base: 80,
      prompt: 'How much are you actually prepared to commit?',
      options: [
        pick('one', 'One thing, once', { commitment: 'one-off' }),
        pick('weekly', 'Something weekly', { commitment: 'weekly' }),
        pick('season', 'A whole season or course', { commitment: 'seasonal' })
      ]
    },

    {
      id: 'budget', kind: 'one', base: 75,
      prompt: 'Money?',
      options: [
        pick('free', 'Free only', { budget: 0 }),
        pick('cheap', 'Cheap is fine', { budget: 1 }),
        pick('any', 'Not a constraint', { budget: 2 })
      ]
    },

    {
      id: 'when', kind: 'many', max: 4, base: 70,
      prompt: 'When are you actually free?',
      options: [
        pick('weekday-day', 'Weekday daytimes', { when: ['weekday-day'] }),
        pick('weekday-eve', 'Weekday evenings', { when: ['weekday-eve'] }),
        pick('weekend', 'Weekends', { when: ['weekend'] }),
        pick('flexible', 'Flexible', { when: ['flexible'] })
      ]
    },

    {
      id: 'goal', kind: 'many', max: 2, base: 72,
      prompt: 'What are you actually after?',
      options: [
        pick('friends', 'People I would call friends', { goals: ['friends'] }),
        pick('impact', 'To be useful', { goals: ['impact'] }),
        pick('skill', 'To get good at something', { goals: ['skill'] }),
        pick('routine', 'A fixed thing in the week', { goals: ['routine'] })
      ]
    },

    // ---------------- Move ----------------
    {
      id: 'move-where', kind: 'one', base: 60, group: 'move',
      prompt: 'Moving about: outdoors or indoors?',
      options: [
        pick('out', 'Outdoors, weather and all', i({ outdoors: 3, nature: 1 })),
        pick('in', 'Indoors, thanks', i({ fitness: 2, dance: 1 })),
        pick('both', 'Either', i({ outdoors: 1, fitness: 1 }))
      ]
    },
    {
      id: 'move-how', kind: 'one', base: 58, group: 'move',
      prompt: 'Do you want a score at the end?',
      options: [
        pick('yes', 'Yes — put me on a team', i({ sports: 3 })),
        pick('no', 'No — just moving', i({ running: 2, fitness: 2, outdoors: 1 })),
        pick('wheels', 'On two wheels', i({ cycling: 3 }))
      ]
    },
    {
      id: 'move-slow', kind: 'one', base: 50, group: 'move',
      prompt: 'Anything slow and quiet?',
      options: [
        pick('still', 'Sitting still on purpose', i({ stillness: 3 })),
        pick('dance', 'Dancing, if nobody minds that I cannot', i({ dance: 3 })),
        pick('neither', 'Neither', {})
      ]
    },

    // ---------------- Make ----------------
    {
      id: 'make-what', kind: 'one', base: 60, group: 'make',
      prompt: 'Making things: hands, voice or lens?',
      options: [
        pick('hands', 'Hands — materials and tools', i({ crafts: 3, making: 2, art: 1 })),
        pick('voice', 'Voice — music or performing', i({ music: 3, theater: 2 })),
        pick('lens', 'Lens — film and photographs', i({ filmphoto: 3 }))
      ]
    },
    {
      id: 'make-audience', kind: 'one', base: 52, group: 'make',
      prompt: 'In front of people, or on your own?',
      options: [
        pick('stage', 'On a stage, eventually', i({ theater: 3, music: 1 })),
        pick('page', 'On a page', i({ writing: 3, books: 1 })),
        pick('bench', 'At a bench, alone', i({ making: 2, crafts: 2, art: 1 }))
      ]
    },
    {
      id: 'make-machines', kind: 'one', base: 46, group: 'make',
      when: function (s) { return (s.interests.making || 0) > 0 || (s.group.make || 0) > 0; },
      prompt: 'Do machines appeal, or put you off?',
      options: [
        pick('yes', 'Lasers, welders, 3D printers — yes', i({ making: 3, tech: 1 })),
        pick('soft', 'Softer materials, please', i({ crafts: 3 })),
        pick('fix', 'I mostly want to fix my own stuff', i({ making: 2, environment: 1 }))
      ]
    },

    // ---------------- Think & play ----------------
    {
      id: 'think-what', kind: 'one', base: 60, group: 'think',
      prompt: 'An evening that uses your head looks like:',
      options: [
        pick('book', 'A book and an argument about it', i({ books: 3, writing: 1 })),
        pick('board', 'A board game with rules to learn', i({ games: 3 })),
        pick('code', 'Something technical', i({ tech: 3, making: 1 }))
      ]
    },
    {
      id: 'think-lang', kind: 'one', base: 44, group: 'think',
      prompt: 'Learning or practising a language?',
      options: [
        pick('yes', 'Yes', i({ language: 3, newcomer: 1 })),
        pick('no', 'No', {})
      ]
    },

    // ---------------- Grow ----------------
    {
      id: 'grow-what', kind: 'one', base: 60, group: 'grow',
      prompt: 'Outside, which of these would you actually enjoy?',
      options: [
        pick('soil', 'Hands in soil', i({ gardening: 3, food: 1 })),
        pick('animals', 'Animals', i({ animals: 3 })),
        pick('watch', 'Walking slowly and looking at things', i({ nature: 3, outdoors: 1 }))
      ]
    },
    {
      id: 'grow-food', kind: 'one', base: 46, group: 'grow',
      prompt: 'Food: cooking it, growing it, or neither?',
      options: [
        pick('cook', 'Cooking', i({ food: 3 })),
        pick('grow', 'Growing', i({ gardening: 3, food: 1 })),
        pick('neither', 'Neither', {})
      ]
    },
    {
      id: 'grow-climate', kind: 'one', base: 44, group: 'grow',
      prompt: 'Is climate something you want to spend time on?',
      options: [
        pick('yes', 'Yes, practically', i({ environment: 3, volunteering: 1 })),
        pick('no', 'Not right now', {})
      ]
    },

    // ---------------- Give ----------------
    {
      id: 'give-how', kind: 'one', base: 62, group: 'give',
      prompt: 'Being useful: which shape?',
      options: [
        pick('shift', 'Turn up, do a shift, go home', i({ volunteering: 3 })),
        pick('local', 'Change something where I live', i({ civic: 3, environment: 1 })),
        pick('person', 'Spend time with one person', i({ mentoring: 3 }))
      ]
    },
    {
      id: 'give-who', kind: 'one', base: 44, group: 'give',
      when: function (s) { return (s.interests.mentoring || 0) > 0; },
      prompt: 'Mentoring usually means a background check and a term-long commitment. Still interested?',
      options: [
        pick('yes', 'Yes', i({ mentoring: 2 })),
        pick('no', 'Too much — something lighter', i({ volunteering: 3, mentoring: -3 }))
      ]
    },

    // ---------------- Belong ----------------
    {
      id: 'belong-new', kind: 'one', base: 62, group: 'belong',
      prompt: 'How new are you here?',
      options: [
        pick('very', 'Just arrived', i({ newcomer: 3, social: 2 })),
        pick('year', 'A year or so', i({ newcomer: 2, social: 1 })),
        pick('always', 'Been here forever', {})
      ]
    },
    {
      id: 'belong-who', kind: 'many', max: 3, base: 58, group: 'belong',
      prompt: 'Any of these about who you are looking for?',
      hint: 'Optional, and you can hide any of it from other people later.',
      options: [
        pick('lgbtq', 'Queer community', i({ lgbtq: 3 })),
        pick('parents', 'Other parents', i({ parents: 3 })),
        pick('faith', 'A faith community', i({ faith: 3 })),
        pick('support', 'People going through what I am', i({ support: 3 })),
        pick('none', 'None of these', {})
      ]
    },
    {
      id: 'belong-lowkey', kind: 'one', base: 40, group: 'belong',
      prompt: 'Would you go to something with no purpose beyond meeting people?',
      options: [
        pick('yes', 'Yes', i({ social: 3 })),
        pick('activity', 'Only with an activity attached', i({ games: 1, crafts: 1, outdoors: 1 }))
      ]
    },

    // ---------------- adaptive follow-ups ----------------
    {
      id: 'solo', kind: 'one', base: 48,
      when: function (s) { return s.dims.comfort !== 3; },
      prompt: 'Would you go on your own?',
      options: [
        pick('yes', 'Yes', { prefer: { solo: true } }),
        pick('rather-not', 'I would rather it were structured enough not to matter', { prefer: { structure: 'register', gentle: true } })
      ]
    },
    {
      id: 'repeat', kind: 'one', base: 46,
      when: function (s) { return (s.dims.goals || []).indexOf('friends') !== -1; },
      prompt: 'Same faces every week, or new ones each time?',
      hint: 'You said you want friends — this is the single biggest predictor.',
      options: [
        pick('same', 'Same faces', { commitment: 'weekly', goals: ['routine'] }),
        pick('new', 'New ones', { commitment: 'one-off' })
      ]
    },
    {
      id: 'morning', kind: 'one', base: 36,
      when: function (s) { return (s.dims.when || []).length > 0; },
      prompt: 'Early mornings: possible, or absolutely not?',
      options: [
        pick('yes', 'Possible', { when: ['weekday-day'] }),
        pick('no', 'Absolutely not', { when: ['weekday-eve'] })
      ]
    },
    {
      id: 'outdoorsy-check', kind: 'one', base: 34,
      when: function (s) { return (s.interests.outdoors || 0) >= 3; },
      prompt: 'Outdoors in bad weather?',
      options: [
        pick('yes', 'Still yes', i({ outdoors: 2, nature: 1 })),
        pick('no', 'Then indoors', i({ outdoors: -2, fitness: 1, games: 1 }))
      ]
    },
    {
      id: 'tech-check', kind: 'one', base: 34,
      when: function (s) { return (s.interests.tech || 0) >= 3; },
      prompt: 'Do you want that to be useful to someone, or just interesting?',
      options: [
        pick('civic', 'Useful', i({ civic: 2, volunteering: 2 })),
        pick('fun', 'Interesting is enough', i({ games: 1, making: 1 }))
      ]
    }
  ];

  // ---------------- probes ----------------
  // Once the chosen areas are drilled out, widen into the ones that were not
  // picked. Low priority, so they only come up with questions left to spend —
  // and they are where the surprises come from.
  function notPulled(group) {
    return function (s) { return !(s.group[group] > 0); };
  }

  var PROBES = [
    {
      id: 'probe-move', kind: 'one', base: 30, when: notPulled('move'),
      prompt: 'You did not pick movement. Would any of this tempt you?',
      options: [
        pick('walk', 'Walking somewhere good with other people', i({ outdoors: 2, nature: 1 })),
        pick('free', 'A free weekly thing where nobody is fast', i({ running: 2, fitness: 1 })),
        pick('no', 'No', {})
      ]
    },
    {
      id: 'probe-make', kind: 'one', base: 30, when: notPulled('make'),
      prompt: 'And making things?',
      options: [
        pick('class', 'A one-night class, maybe', i({ crafts: 2, art: 1, making: 1 })),
        pick('music', 'Singing with other people', i({ music: 2 })),
        pick('no', 'No', {})
      ]
    },
    {
      id: 'probe-think', kind: 'one', base: 30, when: notPulled('think'),
      prompt: 'Anything that is just sitting around being interested in something?',
      options: [
        pick('talk', 'A talk in a bar about something obscure', i({ books: 2, social: 2 })),
        pick('game', 'A board game with strangers', i({ games: 2, social: 1 })),
        pick('no', 'No', {})
      ]
    },
    {
      id: 'probe-grow', kind: 'one', base: 30, when: notPulled('grow'),
      prompt: 'Outdoors and hands-on?',
      options: [
        pick('garden', 'A morning in a community garden', i({ gardening: 2, environment: 1 })),
        pick('animals', 'An afternoon with shelter animals', i({ animals: 2 })),
        pick('no', 'No', {})
      ]
    },
    {
      id: 'probe-give', kind: 'one', base: 32, when: notPulled('give'),
      prompt: 'A single volunteer shift, no strings?',
      hint: 'It is the most reliable way to be in a room with people and not have to perform.',
      options: [
        pick('yes', 'Go on then', i({ volunteering: 2 })),
        pick('no', 'No', {})
      ]
    },
    {
      id: 'probe-belong', kind: 'one', base: 30, when: notPulled('belong'),
      prompt: 'Is any of this about finding people like you specifically?',
      options: [
        pick('yes', 'Yes', i({ social: 2, newcomer: 1 })),
        pick('no', 'Not especially', {})
      ]
    },
    {
      id: 'avoid', kind: 'many', max: 3, base: 38,
      prompt: 'Anything here you would actively avoid?',
      hint: 'Worth saying — it pushes these down rather than just not boosting them.',
      options: [
        pick('loud', 'Loud, high-energy things', i({ fitness: -3, dance: -2, sports: -2 })),
        pick('perform', 'Anything performed in front of people', i({ theater: -3, music: -2 })),
        pick('kids', 'Anything involving children', i({ mentoring: -3, parents: -2 })),
        pick('religion', 'Anything religious', i({ faith: -3 })),
        pick('none', 'Nothing in particular', {})
      ]
    },
    {
      id: 'taster', kind: 'one', base: 35,
      when: function (s) { return s.dims.commitment === 'seasonal' || s.dims.commitment === 'weekly'; },
      prompt: 'Before committing to that, would you want a one-off taster first?',
      options: [
        pick('yes', 'Yes', { prefer: { taster: true }, goals: ['skill'] }),
        pick('no', 'No, just start', {})
      ]
    },
    {
      id: 'newest', kind: 'one', base: 33,
      prompt: 'Being the newest person in the room: fine, or grim?',
      options: [
        pick('fine', 'Fine', { prefer: { gentle: false } }),
        pick('grim', 'Grim — I would rather everyone were new', { prefer: { gentle: true, cohort: true } })
      ]
    }
  ];

  PROBES.forEach(function (q) { if (q.weight == null && q.id.indexOf('probe-') === 0) q.weight = 0.5; });
  QUESTIONS = QUESTIONS.concat(PROBES);

  // --- the session -----------------------------------------------------------

  function blankState() {
    return {
      asked: [],
      answers: {},
      interests: {},
      group: {},
      prefer: {},
      dims: { comfort: null, commitment: null, budget: null, when: [], goals: [] },
      city: ''
    };
  }

  function applyEffects(state, eff, weight) {
    if (!eff) return;
    var w = weight == null ? 1 : weight;
    if (eff.interests) {
      Object.keys(eff.interests).forEach(function (id) {
        state.interests[id] = (state.interests[id] || 0) + eff.interests[id] * w;
      });
    }
    if (eff.group) {
      Object.keys(eff.group).forEach(function (id) {
        state.group[id] = (state.group[id] || 0) + eff.group[id];
      });
    }
    if (eff.comfort != null) state.dims.comfort = eff.comfort;
    if (eff.commitment) state.dims.commitment = eff.commitment;
    if (eff.budget != null) state.dims.budget = eff.budget;
    if (eff.when) eff.when.forEach(function (w) {
      if (state.dims.when.indexOf(w) === -1) state.dims.when.push(w);
    });
    if (eff.goals) eff.goals.forEach(function (gl) {
      if (state.dims.goals.indexOf(gl) === -1) state.dims.goals.push(gl);
    });
    if (eff.prefer) Object.keys(eff.prefer).forEach(function (k) { state.prefer[k] = eff.prefer[k]; });
  }

  /** Priority of a question given what has been answered so far. */
  function priority(q, state) {
    if (state.asked.indexOf(q.id) !== -1) return -1;
    if (q.when && !q.when(state)) return -1;
    // A group's questions only matter once that group has been chosen.
    if (q.group) {
      var pulled = state.group[q.group] || 0;
      if (!pulled) return -1;
      return q.base + pulled * 4;
    }
    var p = q.base;
    if (q.boost) p += q.boost(state);
    return p;
  }

  function nextQuestion(state) {
    if (state.asked.length >= TOTAL) return null;
    var best = null, bestP = 0;
    QUESTIONS.forEach(function (q) {
      var p = priority(q, state);
      if (p > bestP) { bestP = p; best = q; }
    });
    return best;
  }

  /**
   * Turn the accumulated state into the profile the matcher consumes.
   * Interests are ordered by score, because the matcher weights the first pick
   * most heavily.
   */
  function toProfile(state) {
    var ranked = Object.keys(state.interests)
      .filter(function (id) { return FYC.INTERESTS[id] && state.interests[id] > 0; })
      .sort(function (a, b) { return state.interests[b] - state.interests[a]; })
      .slice(0, 6);

    return {
      location: state.city,
      interests: ranked,
      comfort: state.dims.comfort || 2,
      commitment: state.dims.commitment,
      budget: state.dims.budget,
      when: state.dims.when.slice(),
      goals: state.dims.goals.slice(),
      name: '',
      viaIntake: true
    };
  }

  var intake = {
    TOTAL: TOTAL,
    QUESTIONS: QUESTIONS,
    blankState: blankState,
    nextQuestion: nextQuestion,
    toProfile: toProfile,

    /** Record an answer and return the updated state (mutated in place). */
    answer: function (state, question, value) {
      state.asked.push(question.id);
      state.answers[question.id] = value;

      if (question.kind === 'text') {
        if (question.id === 'city') state.city = String(value || '').trim();
        return state;
      }
      var chosen = Array.isArray(value) ? value : [value];
      chosen.forEach(function (optId) {
        var opt = question.options.filter(function (o) { return o.id === optId; })[0];
        // A deliberate choice outranks an incidental one: probing an area you
        // did not pick should nudge the ranking, not dominate it.
        if (opt) applyEffects(state, opt.effects, question.weight == null ? 1 : question.weight);
      });
      return state;
    },

    /** How far through, for the progress bar. */
    progress: function (state) {
      return { asked: state.asked.length, total: TOTAL };
    },

    /** True when there is nothing useful left to ask. */
    done: function (state) {
      return state.asked.length >= TOTAL || nextQuestion(state) === null;
    }
  };

  FYC.intake = intake;
  if (typeof module !== 'undefined' && module.exports) module.exports = intake;
})(typeof globalThis !== 'undefined' ? globalThis : this);
