/* community_finder — the drawn half of the interface.
 *
 * Everything here is inline SVG built at runtime: no sprite sheet, no icon
 * font, no build step, nothing fetched. Four kinds of drawing live here.
 *
 *   avatar()     a face for a person or a circle, seeded from their id so the
 *                same person is always the same face
 *   pictogram()  one line drawing per interest, replacing the emoji that the
 *                taxonomy carries but the interface barely showed
 *   scene()      a spot illustration for the places the app was empty text
 *   guide()      the figure who introduces the intake and turns up wherever
 *                there is nothing yet
 *
 * Colour. Pictograms and the guide are stroked in currentColor, so they take
 * the colour of whatever text they sit beside and need no dark-mode handling
 * at all. Avatars are the exception: a face has to stay the same face in both
 * themes, so its hue is fixed and its features are drawn in a cream that sits
 * on every hue in the set. Depth comes from black at low alpha rather than a
 * second palette, which keeps six hues to six values.
 *
 * All of it is decorative. Every drawing is aria-hidden and unfocusable; the
 * name, label or heading beside it is what a screen reader reads.
 */
(function (g) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /** Namespaced builder. Mirrors the el() in app.js, for the other namespace. */
  function s(tag, props, kids) {
    var n = document.createElementNS(NS, tag);
    Object.keys(props || {}).forEach(function (k) {
      if (props[k] == null || props[k] === false) return;
      n.setAttribute(k, props[k] === true ? '' : props[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  /** The outer <svg> every drawing here shares: square-ish, inert, decorative. */
  function frame(viewBox, cls, size) {
    var a = { viewBox: viewBox, class: cls, 'aria-hidden': 'true', focusable: 'false' };
    if (size) { a.width = size; a.height = size; }
    return s('svg', a);
  }

  /** FNV-1a. Small, stable across reloads, and good enough to spread 72 faces. */
  function hash(str) {
    var h = 2166136261;
    str = String(str == null ? '' : str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  // ------------------------------------------------------------------ avatars

  /* Six mid-tone hues. Mid-tone is the constraint that makes one set work in
   * both themes: light enough that cream features read on them, dark enough
   * that they hold their own against a cream page. */
  var HUES = ['#c2663f', '#3f7f66', '#b07a46', '#8a5a73', '#5a7183', '#9c6b4a'];
  var FACE = '#fdf6ee';          // the features, on every hue
  /* Two depths, not one. At a shared .20 the hair vanished into the cream
     head and every face came out the same smiley in a different colour; the
     shoulders, sitting on the hue itself, needed the opposite. */
  var HAIR_SHADE = 'rgba(0,0,0,.34)';
  var BODY_SHADE = 'rgba(0,0,0,.18)';

  /* Four hair shapes and three mouths. Drawn inside a 40×40 box with the head
   * at (20,17) r9, so every variant lines up without per-variant nudging. */
  var HAIR = [
    'M11 15a9 9 0 0118 0c0-6-3.5-8-9-8s-9 2-9 8z',              // a low fringe
    'M11 16c0-7 3-10 9-10s9 3 9 10c0-3-2-4.5-9-4.5S11 13 11 16z', // a centre part
    'M11.5 17a8.5 8.5 0 0117 0c1.5 0 1.5-11-8.5-11s-10 11-8.5 11z', // fuller, longer
    'M12 13c2-4 14-4 16 0 .6 1.2.4 3-.6 3.4C26 12 14 12 12.6 16.4 11.6 16 11.4 14.2 12 13z' // a wrap
  ];
  var MOUTH = [
    'M16.5 21.5c1.2 1.6 5.8 1.6 7 0',  // an open smile
    'M17 21.6c1.1 1 4.9 1 6 0',        // a smaller one
    'M17.2 21.4h5.6'                   // level, for the ones who are thinking
  ];

  /**
   * One face. `seed` is anything stable and per-person — a member id, a circle
   * id, an email. The same seed is always the same face, which is the whole
   * point: a person should be recognisable down a member list.
   */
  function avatar(seed, size) {
    var h = hash(seed);
    var hue = HUES[h % HUES.length];
    var hair = HAIR[(h >> 3) % HAIR.length];
    var mouth = MOUTH[(h >> 7) % MOUTH.length];
    var tilt = ((h >> 11) % 5) - 2;   // a couple of degrees, so a row is not a grid

    var svg = frame('0 0 40 40', 'av', size || null);
    svg.appendChild(s('circle', { cx: 20, cy: 20, r: 20, fill: hue }));
    // Shoulders, clipped by the roundel rather than drawn to fit it.
    svg.appendChild(s('path', { d: 'M4 40c0-8.5 7.2-13 16-13s16 4.5 16 13z', fill: BODY_SHADE }));
    var head = s('g', { transform: 'rotate(' + tilt + ' 20 17)' });
    head.appendChild(s('circle', { cx: 20, cy: 17, r: 9, fill: FACE }));
    head.appendChild(s('path', { d: hair, fill: HAIR_SHADE }));
    head.appendChild(s('circle', { cx: 16.8, cy: 17.4, r: 1.25, fill: hue }));
    head.appendChild(s('circle', { cx: 23.2, cy: 17.4, r: 1.25, fill: hue }));
    head.appendChild(s('path', {
      d: mouth, fill: 'none', stroke: hue, 'stroke-width': 1.5, 'stroke-linecap': 'round'
    }));
    svg.appendChild(head);
    return svg;
  }

  /**
   * A circle's identity: up to four of its members' faces, overlapped. A group
   * of people is drawn as a group of people rather than a monogram, which is
   * the one thing a circle card never had.
   */
  function avatarStack(seeds, size) {
    var wrap = document.createElement('span');
    wrap.className = 'av-stack';
    (seeds || []).slice(0, 4).forEach(function (seed) {
      var a = avatar(seed, size || 26);
      wrap.appendChild(a);
    });
    var extra = (seeds || []).length - 4;
    if (extra > 0) {
      var more = document.createElement('span');
      more.className = 'av-more';
      more.textContent = '+' + extra;
      wrap.appendChild(more);
    }
    return wrap;
  }

  // --------------------------------------------------------------- pictograms

  /* One per interest id, at 24×24, stroked not filled, so they inherit the
   * weight and colour of the text beside them. Drawn to the same rules as the
   * tab icons already in index.html: 1.6 stroke, round caps, no detail that
   * disappears under 20px. */
  var PICTO = {
    outdoors:    ['M3 19l5.5-8 3.5 4.5L15.5 10 21 19z', 'M17 6.5h.01'],
    running:     ['M13.5 4.8h.01', 'M15 8l-3.5 2 1 3.5 2.5 2 1 3.5', 'M11.5 10L8 11.5 7 15', 'M12.5 13.5L9 16l-2 3.5'],
    cycling:     ['M6 17.5h.01', 'M18 17.5h.01', 'M6 17.5a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0', 'M13 17.5a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0', 'M8.5 17.5l4-7h4', 'M10.5 10.5h4l1.5 7'],
    fitness:     ['M4 12h2.5M17.5 12H20', 'M6.5 9.5v5M17.5 9.5v5', 'M9.5 8v8M14.5 8v8', 'M9.5 12h5'],
    sports:      ['M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 100-15', 'M12 8.3l2.9 2.1-1.1 3.4h-3.6L9.1 10.4z', 'M12 4.5v3.8M18.4 10.1l-3.5 2.3M16 17.9l-2.2-3.1M8 17.9l2.2-3.1M5.6 10.1l3.5 2.3'],
    dance:       ['M13.5 4.8h.01', 'M12.5 8l1.5 4 4-3', 'M12.5 8L10 11l1 3.5', 'M11 14.5L8.5 19', 'M11 14.5l3 4.5'],
    stillness:   ['M12 5.3h.01', 'M12 8.5v4', 'M8 19c0-2.5 1.8-4 4-4s4 1.5 4 4z', 'M6 14.5c1.5 1 3 1.5 3 1.5M18 14.5c-1.5 1-3 1.5-3 1.5'],
    art:         ['M12 4.5c-4.4 0-7.5 3.2-7.5 7.5 0 4 3 6.5 6 6.5 1.6 0 2-1 1.5-1.8-.6-1 .1-2.2 1.4-2.2h2.3c2.3 0 3.8-1.7 3.8-4 0-3.4-3.1-6-7.5-6', 'M8.5 11h.01M11.5 8.5h.01M15 10h.01'],
    crafts:      ['M11 5a6 6 0 100 12 6 6 0 100-12', 'M7 8.5c3 1 6 3.5 7.5 6.5M15.5 7.5c-2.5 1.5-5 5-5.5 8.5', 'M16.5 13.5l3.5 5.5'],
    music:       ['M9 17.5a2 2 0 104 0 2 2 0 10-4 0', 'M13 17.5V6l6-1.5V15', 'M15 15a2 2 0 104 0 2 2 0 10-4 0'],
    theater:     ['M5 6.5h7v6a3.5 3.5 0 01-7 0z', 'M7 9.5h.01M10 9.5h.01', 'M12 6.5h7v4.5a3.5 3.5 0 01-7 0', 'M14.5 9h.01M17 9h.01', 'M6.5 15.5c1.5 1.5 3.5 1.5 5 0'],
    filmphoto:   ['M4 9a1.5 1.5 0 011.5-1.5h2L9 5.5h6L16.5 7.5h2A1.5 1.5 0 0120 9v8a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17z', 'M12 9.5a3.5 3.5 0 100 7 3.5 3.5 0 100-7'],
    writing:     ['M5 19l1-3.5L16.5 5a1.8 1.8 0 012.5 2.5L8.5 18z', 'M14.5 7L17 9.5', 'M5 19h5'],
    making:      ['M16.5 4.5a4.5 4.5 0 00-4 6.5L5 18.5 6.5 20l7.5-7.5a4.5 4.5 0 006.5-4l-3 3-2.5-2.5z'],
    books:       ['M4 6c2.5-1 5.5-1 8 .5v12c-2.5-1.5-5.5-1.5-8-.5z', 'M20 6c-2.5-1-5.5-1-8 .5v12c2.5-1.5 5.5-1.5 8-.5z'],
    tech:        ['M9 9l-3.5 3L9 15', 'M15 9l3.5 3-3.5 3', 'M13.5 7l-3 10'],
    games:       ['M5.5 6.5a1.5 1.5 0 011.5-1.5h10a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5H7a1.5 1.5 0 01-1.5-1.5z', 'M9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01'],
    language:    ['M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 100-15', 'M4.5 12h15', 'M12 4.5c2 2.2 3 4.8 3 7.5s-1 5.3-3 7.5c-2-2.2-3-4.8-3-7.5s1-5.3 3-7.5'],
    food:        ['M4.5 11.5h13v2.5a5 5 0 01-5 5h-3a5 5 0 01-5-5z', 'M17.5 12.5h1.5a1.75 1.75 0 010 3.5h-1.5', 'M8 8c0-1 1-1.5 1-2.5M11.5 8c0-1 1-1.5 1-2.5'],
    gardening:   ['M12 19v-6.5', 'M12 12.5C12 9 9.5 7 6.5 7c0 3.5 2.5 5.5 5.5 5.5', 'M12 12.5c0-3.5 2.5-5.5 5.5-5.5 0 3.5-2.5 5.5-5.5 5.5', 'M8.5 19h7'],
    animals:     ['M7 13.5a1.8 1.8 0 103.6 0 1.8 1.8 0 10-3.6 0', 'M13.4 13.5a1.8 1.8 0 103.6 0 1.8 1.8 0 10-3.6 0', 'M5.2 9a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0', 'M15.8 9a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0', 'M9 17.5c0-1.7 1.3-2.5 3-2.5s3 .8 3 2.5-1.3 2-3 2-3-.3-3-2'],
    nature:      ['M5.5 10a2.75 2.75 0 015.5 0v5.5a2.75 2.75 0 01-5.5 0z', 'M13 10a2.75 2.75 0 015.5 0v5.5a2.75 2.75 0 01-5.5 0z', 'M11 11.5h2', 'M6.5 7.2h3M14.5 7.2h3'],
    environment: ['M19 4.8c0 8.2-5 11.4-9.6 11.4-1.6 0-2.9-.4-3.9-1.2-1.4-1.3-1.8-3.4-.2-5.5C7.9 6.1 13 4.8 19 4.8z', 'M5.4 19.2c1.6-4.2 4.6-7.8 8.2-9.9'],
    volunteering:['M12 18.5l-5-4.6a3 3 0 014.2-4.3l.8.8.8-.8a3 3 0 014.2 4.3z', 'M5 9.5L7.5 7M19 9.5L16.5 7'],
    civic:       ['M4.5 10L12 5l7.5 5', 'M6.5 10v7M10 10v7M14 10v7M17.5 10v7', 'M4.5 19.5h15'],
    mentoring:   ['M3.5 9.5L12 5.5l8.5 4L12 13.5z', 'M7 11.5v4.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5', 'M20.5 9.5v5'],
    lgbtq:       ['M4 18a8 8 0 0116 0', 'M7 18a5 5 0 0110 0', 'M10 18a2 2 0 014 0'],
    newcomer:    ['M4.5 9.5a1.5 1.5 0 011.5-1.5h12a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5z', 'M9 8V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5V8', 'M4.5 13h15'],
    parents:     ['M9 6.3h.01', 'M9 9.5c-2 0-3.3 1.3-3.3 3.3V15h1.3l.5 4.5h3L11 15h1.3v-2.2c0-2-1.3-3.3-3.3-3.3', 'M16.5 11.2h.01', 'M16.5 13.5c-1.4 0-2.3.9-2.3 2.3v1.4h.9l.4 2.8h2l.4-2.8h.9v-1.4c0-1.4-.9-2.3-2.3-2.3'],
    faith:       ['M12 4.2c3.6 4.1 5.6 6.4 5.6 9.4a5.6 5.6 0 01-11.2 0c0-1.7.7-3 1.9-4.3.4 1.3 1.2 2 2.2 2 .5-3 .9-5.1 1.5-7.1z'],
    support:     ['M4.5 8a2 2 0 012-2h11a2 2 0 012 2v6a2 2 0 01-2 2H9.5L5.5 19v-3h-1z', 'M12 13l-2.2-2a1.5 1.5 0 012.2-2 1.5 1.5 0 012.2 2z'],
    social:      ['M5 8h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4z', 'M16 9.5h1.5a2.25 2.25 0 010 4.5H16', 'M8.5 5.5c0 .8-.7 1-.7 1.8M12 5c0 .8-.7 1-.7 1.8']
  };

  function hasPictogram(id) { return Object.prototype.hasOwnProperty.call(PICTO, id); }

  /** One interest, drawn. Falls back to null so callers can keep the emoji. */
  function pictogram(id, cls) {
    var paths = PICTO[id];
    if (!paths) return null;
    var svg = frame('0 0 24 24', 'pic' + (cls ? ' ' + cls : ''));
    paths.forEach(function (d) { svg.appendChild(s('path', { d: d })); });
    return svg;
  }

  // -------------------------------------------------------------------- guide

  /* The figure who turns up where the app would otherwise be a sentence on its
   * own. Three poses, stroked in currentColor like the pictograms, so it is
   * the same drawing whatever it is standing on. The jumper is the one filled
   * shape, and it takes the accent through CSS. */
  /* Limbs only. The head and the jumper are drawn by guide() itself, because
     they are the two shapes that are filled rather than stroked, and a pose
     only ever changes where the arms are. */
  var POSES = {
    wave:  ['M9 21.5v-5', 'M15 21.5v-5', 'M17.4 14.2L20.3 10.6', 'M19.2 9.2l2.2 1.6'],
    look:  ['M9 21.5v-5', 'M15 21.5v-5', 'M17.4 15l3.3 1.5', 'M6.6 15l-3.3 1.5'],
    cheer: ['M9 21.5v-5', 'M15 21.5v-5', 'M17 13.2l2.8-3.4', 'M7 13.2L4.2 9.8']
  };

  /** The guide, at whatever size the slot wants. Decorative throughout. */
  function guide(pose, size) {
    var paths = POSES[pose] || POSES.wave;
    var svg = frame('0 0 24 24', 'guide', size || null);
    // Arms and legs first, so the jumper covers where they meet the body.
    paths.forEach(function (d) { svg.appendChild(s('path', { d: d })); });
    svg.appendChild(s('path', { d: 'M6 17.2c0-4.3 2.6-6.5 6-6.5s6 2.2 6 6.5z', class: 'g-body' }));
    svg.appendChild(s('circle', { cx: 12, cy: 6.9, r: 3, class: 'g-head' }));
    return svg;
  }

  // ------------------------------------------------------------------- scenes

  /* Spot illustrations, 160×110, for the five places the app had nothing to
   * show. Each is a small story rather than a symbol: the empty inbox is a
   * bench nobody has sat on yet, not a crossed-out envelope. They are built
   * from the same vocabulary as the guide so the set reads as one hand. */
  function sceneFrame() {
    var svg = s('svg', {
      viewBox: '0 0 160 110', class: 'scene', 'aria-hidden': 'true', focusable: 'false'
    });
    return svg;
  }
  function ground(svg, y) {
    svg.appendChild(s('path', { d: 'M18 ' + y + 'h124', class: 'sc-ground' }));
  }
  function person(svg, x, y, scale, hue) {
    var gEl = s('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + scale + ')' });
    gEl.appendChild(s('circle', { cx: 0, cy: -22, r: 6.5, class: 'sc-fill', style: 'color:' + hue }));
    gEl.appendChild(s('path', {
      d: 'M-11 0c0-9 5-13.5 11-13.5S11 -9 11 0z', class: 'sc-fill', style: 'color:' + hue
    }));
    svg.appendChild(gEl);
  }

  var SCENES = {
    /* The front door: three people already here, one arriving. */
    welcome: function () {
      var svg = sceneFrame();
      ground(svg, 92);
      svg.appendChild(s('path', { d: 'M44 92V62a10 10 0 0110-10h52a10 10 0 0110 10v30', class: 'sc-line' }));
      svg.appendChild(s('path', { d: 'M38 62h84', class: 'sc-line' }));
      person(svg, 62, 92, 1, '#c2663f');
      person(svg, 80, 92, 1.05, '#3f7f66');
      person(svg, 98, 92, 1, '#8a5a73');
      person(svg, 130, 92, .8, '#5a7183');
      svg.appendChild(s('path', { d: 'M118 80h6', class: 'sc-ground' }));
      return svg;
    },
    /* Saved: a shelf with one thing put aside on it. */
    saved: function () {
      var svg = sceneFrame();
      svg.appendChild(s('path', { d: 'M34 78h92', class: 'sc-line' }));
      svg.appendChild(s('path', { d: 'M46 78V52h12v26M62 78V46h11v32M77 78V56h10v22', class: 'sc-line' }));
      svg.appendChild(s('path', {
        d: 'M100 38h16v26l-8-5.5-8 5.5z', class: 'sc-fill', style: 'color:#c2663f'
      }));
      ground(svg, 92);
      return svg;
    },
    /* Inbox: a bench, waiting. */
    inbox: function () {
      var svg = sceneFrame();
      ground(svg, 92);
      svg.appendChild(s('path', { d: 'M40 70h80M40 78h80', class: 'sc-line' }));
      svg.appendChild(s('path', { d: 'M48 70v22M112 70v22M48 62h64v8', class: 'sc-line' }));
      person(svg, 96, 70, .85, '#3f7f66');
      return svg;
    },
    /* Circles: a ring with a gap in it, which is the invitation. */
    circles: function () {
      var svg = sceneFrame();
      var cx = 80, cy = 56, r = 30, hues = ['#c2663f', '#3f7f66', '#b07a46', '#8a5a73', '#5a7183'];
      for (var i = 0; i < 5; i++) {
        var a = (-Math.PI / 2) + (i * 2 * Math.PI / 6);
        svg.appendChild(s('circle', {
          cx: cx + Math.cos(a) * r, cy: cy + Math.sin(a) * r, r: 8.5,
          class: 'sc-fill', style: 'color:' + hues[i]
        }));
      }
      var la = (-Math.PI / 2) + (5 * 2 * Math.PI / 6);
      svg.appendChild(s('circle', {
        cx: cx + Math.cos(la) * r, cy: cy + Math.sin(la) * r, r: 8.5,
        class: 'sc-dash'
      }));
      return svg;
    },
    /* No results yet: a map with a glass over it. */
    search: function () {
      var svg = sceneFrame();
      svg.appendChild(s('path', {
        d: 'M34 32l30-8 32 8 30-8v54l-30 8-32-8-30 8z', class: 'sc-line'
      }));
      svg.appendChild(s('path', { d: 'M64 24v54M96 32v54', class: 'sc-ground' }));
      svg.appendChild(s('circle', { cx: 92, cy: 58, r: 17, class: 'sc-glass' }));
      svg.appendChild(s('path', { d: 'M104 70l12 12', class: 'sc-line' }));
      return svg;
    }
  };

  function scene(name) {
    var fn = SCENES[name];
    return fn ? fn() : null;
  }

  g.FYC_ART = {
    avatar: avatar,
    avatarStack: avatarStack,
    pictogram: pictogram,
    hasPictogram: hasPictogram,
    guide: guide,
    scene: scene,
    hash: hash
  };
}(typeof window !== 'undefined' ? window : globalThis));
