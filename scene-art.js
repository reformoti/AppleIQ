'use strict';
/** Film sets use a 1600×900 stage. Furniture and actors keep separate depth layers. */
((scope) => {
  const TAU = Math.PI * 2;
  const box = (c, x, y, w, h, color, r = 0) => {
    c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  };
  const line = (c, x, y, X, Y, color, width = 1) => {
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(X, Y); c.stroke();
  };
  const oval = (c, x, y, rx, ry, color) => {
    c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
  };
  const poly = (c, points, color) => {
    c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
  };
  const text = (c, value, x, y, size, color, align = 'left') => {
    c.font = size + 'px Arial'; c.fillStyle = color; c.textAlign = align; c.fillText(value, x, y);
  };
  const lighting = () => scope.AppleVisualSettings?.enabled('lighting') !== false;
  const shadows = () => scope.AppleVisualSettings?.enabled('shadows') !== false;
  function surface(c, x, y, w, h, top, bottom, radius = 0) {
    if (!lighting()) return box(c, x, y, w, h, top, radius);
    const g = c.createLinearGradient(x, y, x + w * .2, y + h);
    g.addColorStop(0, top); g.addColorStop(1, bottom); box(c, x, y, w, h, g, radius);
  }
  function glow(c, x, y, radius, color) {
    if (!lighting()) return;
    const g = c.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color); g.addColorStop(1, '#00000000');
    box(c, x - radius, y - radius, radius * 2, radius * 2, g);
  }
  /** Grain is confined to the physical object, never painted over actors. */
  function wood(c, x, y, w, h, dark = false) {
    surface(c, x, y, w, h, dark ? '#766451' : '#ae8d67', dark ? '#403b37' : '#755842', 3);
    c.save(); c.beginPath(); c.rect(x + 1, y + 1, w - 2, h - 2); c.clip();
    for (let i = 0; i < 7; i++) {
      c.strokeStyle = i % 2 ? '#ffe0aa16' : '#33282020'; c.lineWidth = .7; c.beginPath();
      c.moveTo(x, y + h * (i + 1) / 8); c.bezierCurveTo(x + w * .23, y + h * (i + 1) / 8 - 2,
        x + w * .73, y + h * (i + 1) / 8 + 3, x + w, y + h * (i + 1) / 8); c.stroke();
    }
    c.restore(); line(c, x + 3, y + 1, x + w - 3, y + 1, '#edcca251', .9);
  }
  function portrait(c, x, y, w, h) {
    box(c, x + 3, y + 5, w, h, '#030a1435', 2);
    wood(c, x, y, w, h, true); box(c, x + 7, y + 7, w - 14, h - 14, '#c2b190');
    surface(c, x + 12, y + 12, w - 24, h - 24, '#788b8d', '#c8b495');
    poly(c, [[x + 12, y + h - 20], [x + w * .37, y + h * .48], [x + w * .63, y + h * .74], [x + w - 12, y + h * .35], [x + w - 12, y + h - 12], [x + 12, y + h - 12]], '#657d75');
    oval(c, x + w * .68, y + h * .3, w * .07, w * .07, '#dfc8a0');
    line(c, x + 15, y + 14, x + w * .7, y + 14, '#f4e4bf50', 1);
  }
  function door(c, open = false) {
    box(c, 23, 242, 169, 444, '#151c23', 3); wood(c, 29, 248, 157, 433, true);
    surface(c, 43, 261, 129, 411, open ? '#192631' : '#655b54', '#302f34', 2);
    for (const y of [283, 472]) {
      box(c, 55, y, 102, y === 283 ? 162 : 175, '#24282e22', 2);
      line(c, 59, y + 2, 154, y + 2, '#c7b58c32', 1); line(c, 57, y + 4, 57, y + 153, '#111b2666', 1);
    }
    box(c, 146, 450, 7, 29, '#252c30', 2); line(c, 149, 458, 133, 458, '#b7a07a', 3);
    line(c, 35, 252, 35, 674, '#e3c4992b', 1);
  }
  function roomFloor(c, bedroom, light) {
    surface(c, 0, 680, 1600, 220, bedroom ? '#625d57' : '#6c7373', bedroom ? '#383e45' : '#454e56');
    const vanish = { x: 800, y: 370 };
    for (let row = 0; row < 5; row++) {
      const y = 680 + row * row * 13.75;
      line(c, 0, y, 1600, y, '#17212b43', 1.1);
      line(c, 0, y + 1, 1600, y + 1, '#e4ccb31b', .6);
      const next = Math.min(900, 680 + (row + 1) ** 2 * 13.75);
      for (let i = -4; i < 7; i++) {
        const bx = i * 220 + row % 2 * 110, x = vanish.x + (bx - vanish.x) * ((y - vanish.y) / (900 - vanish.y));
        const X = vanish.x + (bx - vanish.x) * ((next - vanish.y) / (900 - vanish.y));
        line(c, x, y, X, next, '#14202b28', .7);
      }
    }
    if (bedroom) {
      oval(c, 1210, 798, 350, 55, '#21293228');
      oval(c, 1200, 794, 340, 49, '#817362');
      c.save(); c.beginPath(); c.ellipse(1200, 794, 332, 44, 0, 0, TAU); c.clip();
      for (let i = 0; i < 11; i++) line(c, 860, 750 + i * 8, 1550, 750 + i * 8, i % 2 ? '#c6b38c22' : '#302c2e17', 1);
      c.restore();
    }
    if (lighting() && light.sun > .02) {
      poly(c, bedroom ? [[1020, 680], [1320, 680], [1530, 880], [675, 880]] : [[0, 680], [140, 680], [540, 900], [0, 900]], '#f4d3a112');
      if (bedroom) for (let i = 0; i < 3; i++) line(c, 900 + i * 150, 755, 1150 + i * 110, 870, '#fae0b60d', 20);
    }
  }
  function desk(c, bedroom, happy) {
    const x = bedroom ? 220 : happy ? 600 : 590, y = bedroom ? 545 : happy ? 480 : 515;
    const w = bedroom ? 525 : happy ? 470 : 520, end = bedroom ? 723 : 712;
    if (shadows()) scope.AppleCinema?.floorShadow(c, x + w / 2, end, w * .6, 25, .35);
    for (const X of [x + 24, x + w - 47]) {
      surface(c, X, y + 25, 18, end - y - 25, '#625649', '#302f34');
      line(c, X + 2, y + 30, X + 2, end - 3, '#d3c0a026', 1);
    }
    box(c, x, y + 17, w, 12, '#352e2c', 3); wood(c, x, y, w, 23);
    if (bedroom) {
      surface(c, 593, 573, 85, 117, '#6e5845', '#36353a', 3);
      for (let i = 0; i < 3; i++) {
        wood(c, 598, 579 + i * 34, 74, 28, true);
        line(c, 625, 591 + i * 34, 645, 591 + i * 34, '#bdac86', 2);
      }
      surface(c, 459, 570, 103, 130, '#61717c', '#313d4c', 12);
      box(c, 470, 580, 81, 83, '#78838a22', 9); line(c, 475, 666, 547, 666, '#b7bca828', 1);
      box(c, 442, 691, 137, 17, '#394350', 5);
      for (const X of [485, 545]) line(c, X, 705, X, 751, '#202b37', 8);
    } else {
      surface(c, 767, 564, 107, 121, '#637480', '#3b4a59', 13);
      box(c, 778, 575, 85, 85, '#9da89f16', 9); line(c, 781, 669, 859, 669, '#c2c9bd25', 1);
      box(c, 755, 676, 134, 18, '#394751', 5);
      line(c, 784, 691, 778, 742, '#26323e', 8); line(c, 862, 691, 868, 742, '#26323e', 8);
    }
  }
  function bed(c) {
    wood(c, 1486, 524, 22, 228, true);
    surface(c, 1060, 655, 440, 96, '#655c59', '#37393f', 7);
    surface(c, 1050, 592, 455, 67, '#b1a89e', '#777781', 13);
    line(c, 1061, 653, 1492, 653, '#e8d9bf32', 1.2);
    surface(c, 1176, 606, 316, 77, '#7a8b95', '#4a5b6d', 8);
    c.save(); c.beginPath(); c.roundRect(1176, 606, 316, 77, 8); c.clip();
    for (let i = 0; i < 5; i++) {
      c.strokeStyle = i % 2 ? '#dbe2db24' : '#23334438'; c.lineWidth = i % 2 ? .8 : 3; c.beginPath();
      c.moveTo(1190 + i * 66, 610); c.bezierCurveTo(1182 + i * 66, 629, 1201 + i * 66, 650, 1199 + i * 66, 683); c.stroke();
    }
    c.restore();
    surface(c, 1070, 600, 100, 44, '#d0c3ac', '#a09a98', 12);
    for (const x of [1077, 1161]) {
      c.strokeStyle = '#746e682d'; c.lineWidth = .7; c.beginPath();
      c.moveTo(x, 609); c.quadraticCurveTo(x + (x < 1100 ? -4 : 4), 623, x, 637); c.stroke();
    }
    for (const x of [1076, 1460]) { wood(c, x, 750, 16, 26, true); line(c, x + 2, 752, x + 2, 773, '#dfc79c22', 1); }
  }
  function curtains(c, t, reduced) {
    line(c, 971, 145, 1365, 145, '#b9a78a', 4);
    for (const [x, w] of [[971, 43], [1323, 43]]) {
      surface(c, x, 150, w, 300, '#77777c', '#4b535e', 3);
      for (let i = 0; i < 5; i++) {
        const dx = reduced ? 0 : Math.sin(t * .55 + i * .4) * 1.1;
        c.strokeStyle = i % 2 ? '#c3b5a738' : '#25304155'; c.lineWidth = i % 2 ? 1 : 2; c.beginPath();
        c.moveTo(x + 4 + i * 8, 155); c.bezierCurveTo(x + 4 + i * 8, 255, x + 5 + i * 8 + dx, 354, x + 3 + i * 8 + dx, 445); c.stroke();
      }
    }
  }
  /** Distant scenery is clipped to the glass; no landscape crosses the window frame. */
  function windowView(c, x, y, w, h, hour, t = 0, reduced = false) {
    const light = scope.AppleCinema.lightAt(hour);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    surface(c, x, y, w, h, light.skyTop, light.skyBottom);
    const daylight = hour > 6 && hour < 19, arc = Math.max(0, Math.min(1, (hour - 6) / 13));
    const sunX = x + w * (daylight ? .13 + .74 * arc : .76), sunY = y + h * (daylight ? .86 - .62 * Math.sin(arc * Math.PI) : .24);
    glow(c, sunX, sunY, w * .43, daylight ? '#ffe8ad26' : '#b8d5dc0d');
    oval(c, sunX, sunY, w * (daylight ? .065 : .051), w * (daylight ? .065 : .051), daylight ? '#ffe3b2' : '#d6ddcd');
    if (light.night) for (let i = 0; i < 19; i++) oval(c, x + (i * 37 % 97) / 100 * w,
      y + (.07 + (i * 13 % 50) / 100) * h, .55 + i % 2 * .2, .55 + i % 2 * .2, '#c6dbe4a1');
    if (!light.night) for (let i = 0; i < 5; i++) {
      const drift = reduced ? 0 : Math.sin(t * .04 + i) * w * .014;
      oval(c, x + w * (.07 + i * .24) + drift, y + h * (.19 + i % 3 * .1), w * .14, h * .012, '#f4ede65c');
      oval(c, x + w * (.11 + i * .24) + drift, y + h * (.18 + i % 3 * .1), w * .07, h * .015, '#f4ede644');
    }
    poly(c, [[x, y + h * .81], [x + w * .2, y + h * .67], [x + w * .45, y + h * .79],
      [x + w * .72, y + h * .65], [x + w, y + h * .78], [x + w, y + h], [x, y + h]], light.night ? '#1c3146' : '#7f9c9d');
    for (let i = 0; i < 9; i++) {
      const X = x + i * w / 8 - w * .05, H = h * (.13 + (i * 17 % 15) / 100), W = w / 9;
      surface(c, X, y + h - H, W, H, light.night ? '#182c42' : '#768d95', light.night ? '#122335' : '#5c7882');
      line(c, X, y + h - H, X + W, y + h - H, light.night ? '#5a657344' : '#d5d1bd55', .7);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
        box(c, X + W * (.12 + col * .28), y + h - H + h * (.025 + row * .04), W * .12, h * .018,
          light.night ? (i + col + row) % 3 === 0 ? '#d4ae745e' : '#344a5a66' : '#c2d4d15e');
      }
      if (i % 3 === 0) line(c, X + W * .7, y + h - H, X + W * .7, y + h - H - h * .025, '#5b717b', .7);
    }
    // Near branches create a third depth plane outside, below the distant skyline.
    for (let i = 0; i < 4; i++) {
      const X = x + w * (.07 + i * .29), Y = y + h;
      line(c, X, Y, X - w * .018, Y - h * .21, light.night ? '#152d38' : '#526c65', Math.max(.8, w * .007));
      for (let j = 0; j < 7; j++) {
        const a = j * 2.4, r = Math.sqrt((j + 1) / 7);
        oval(c, X - w * .018 + Math.cos(a) * w * .037 * r, Y - h * .2 + Math.sin(a) * h * .065 * r,
          w * .023, h * .035, light.night ? '#1a3540' : ['#5c7b71', '#6b8976', '#78947d'][j % 3]);
      }
    }
    line(c, x, y + h * .96, x + w, y + h * .96, light.night ? '#274351' : '#92a398', Math.max(1, h * .026));
    c.restore();
    const frame = light.night ? '#697b87' : '#bdc3b3';
    line(c, x + w * .5, y, x + w * .5, y + h, frame, Math.max(2, w * .013));
    line(c, x, y + h * .51, x + w, y + h * .51, frame, Math.max(2, w * .013));
    line(c, x + w * .5 - 2, y + 2, x + w * .5 - 2, y + h - 1, '#ffffff30', .6);
    return light;
  }
  /** Build the complete set, then paint decor. Callers paint actors afterwards. */
  function room(c, { bedroom = false, t = 0, hour = bedroom ? 21 : 11, reduced = false, variant = 'story', happy = false } = {}) {
    const C = scope.AppleCinema, light = C.lightAt(hour);
    c.save(); surface(c, 0, 0, 1600, 680, light.wall, light.wall);
    surface(c, 0, 0, 1600, 120, '#1b273b38', '#1b273b08');
    poly(c, [[0, 90], [197, 130], [197, 680], [0, 680]], '#121f3026');
    poly(c, [[1450, 126], [1600, 87], [1600, 680], [1450, 680]], '#17233418');
    line(c, 196, 129, 196, 676, '#d1c8ad12', 1);
    line(c, 0, 91, 196, 130, '#e8d3af28', 2); line(c, 196, 130, 1451, 130, '#eee0c222', 2);
    roomFloor(c, bedroom, light); C.roomBackdrop(c, bedroom, t);
    if (bedroom) {
      door(c); wood(c, 993, 159, 345, 274, true);
      C.windowLight(c, 1007, 172, 316, 246, hour, t, reduced);
      wood(c, 987, 426, 359, 12); line(c, 1006, 419, 1325, 419, '#eee0c36b', 2);
      C.lightSpill(c, light, 1007, 172, 316, 246);
      bed(c);
    } else {
      box(c, 1405, 244, 146, 437, '#202830', 3); wood(c, 1417, 255, 122, 418, true);
      box(c, 1430, 272, 96, 177, '#35434b', 2); box(c, 1437, 281, 82, 157, '#647b853e', 2);
      line(c, 1508, 475, 1522, 475, '#c2ad82', 3);
      wood(c, 190, 170, 220, 180, true); surface(c, 203, 182, 194, 154, '#314944', '#273e3d');
      text(c, 'IQ', 300, 272, 44, '#99b3a6', 'center');
      line(c, 210, 323, 390, 323, '#c6c4a92b', 1);
      wood(c, 12, 162, 141, 226, true); C.windowLight(c, 20, 170, 125, 210, hour, t, reduced);
      C.lightSpill(c, light, 20, 170, 125, 210);
    }
    desk(c, bedroom, happy); C.room(c, bedroom ? 'bedroom' : happy ? 'happy-school' : 'school', t, reduced, variant);
    // Finish furniture inside its footprint; retain all established live props.
    if (bedroom) {
      bed(c); curtains(c, t, reduced); portrait(c, 340, 165, 147, 112);
      box(c, 245, 498, 39, 47, '#333e49', 4); oval(c, 264, 499, 15, 4, '#1f2b35');
      line(c, 277, 509, 284, 509, '#c3bca333', 1.2);
      wood(c, 1415, 495, 112, 18, true);
      glow(c, 1460, 432, 210, '#eac38817');
      // Calendar and keepsakes occupy the wall, outside walking lanes.
      box(c, 232, 185, 78, 105, '#d0c1a1', 2); box(c, 232, 185, 78, 21, '#84685b', 2);
      text(c, 'ЛИСТОПАД', 271, 199, 8, '#ece0c2', 'center');
      for (let i = 0; i < 28; i++) text(c, String(i + 1), 241 + i % 7 * 9, 222 + Math.floor(i / 7) * 15, 6, '#686d68', 'center');
      box(c, 687, 722, 73, 52, '#374752', 7); line(c, 704, 723, 706, 702, '#6c7779', 3);
      line(c, 742, 723, 740, 702, '#6c7779', 3); box(c, 701, 737, 43, 24, '#6680802d', 4);
    } else {
      portrait(c, 1050, 244, 242, 130);
      box(c, 1060, 253, 222, 110, '#c9c5ad');
      text(c, 'РОЗКЛАД ЗАНЯТЬ', 1171, 275, 12, '#4f6464', 'center');
      for (let i = 0; i < 5; i++) { line(c, 1071, 290 + i * 13, 1266, 290 + i * 13, '#75898436', .6); text(c, ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'][i], 1076, 287 + i * 13, 7, '#65736d'); }
      surface(c, 307, 554, 79, 141, '#526569', '#354750', 4);
      for (let i = 0; i < 4; i++) line(c, 318, 568 + i * 31, 375, 568 + i * 31, '#abb7a832', 1);
      box(c, 321, 567, 51, 22, '#d2c6aa', 1); text(c, 'ЗОШИТИ', 346, 582, 7, '#5b6b68', 'center');
      // Wall clock and teacher board remain legible at wide shots.
      line(c, 52, 658, 292, 658, '#c8c6ae24', 1);
    }
    if (lighting()) {
      glow(c, bedroom ? 1160 : 90, 310, bedroom ? 490 : 400, light.night ? '#96b9dd0a' : '#ffe8b712');
      surface(c, 700, 81, 200, 10, '#e5ddc1', '#8a918e', 3);
      glow(c, 800, 106, 260, light.night ? '#dbd3ad0a' : '#dbd3ad05');
    }
    c.restore();
  }
  /** Additional outdoor layers use the existing stage without obscuring actors. */
  function landscape(c, id, t, reduced = false) {
    c.save();
    if (['university', 'love', 'home', 'wedding'].includes(id)) {
      for (let i = 0; i < 46; i++) {
        const x = (i * 173 + 53) % 1600, y = 640 + (i * 41) % 238;
        if (x > 330 && x < 1260) continue;
        const wind = reduced ? 0 : Math.sin(t * .9 + i) * 2;
        line(c, x, y, x + wind + 2, y - 7 - i % 5, '#82926880', .8);
        if (i % 5 === 0) oval(c, x + wind + 2, y - 12, 2.5, 1.8, '#d8b29c');
      }
      if (!reduced) for (let i = 0; i < 4; i++) {
        const x = (t * (10 + i * 2) + i * 430) % 1800 - 100, y = 90 + i * 33 + Math.sin(t * .5 + i) * 8;
        const wing = Math.sin(t * 4 + i) * 3;
        line(c, x - 5, y - wing, x, y, '#46586299', 1); line(c, x, y, x + 5, y - wing, '#46586299', 1);
      }
    }
    if (id === 'university') {
      for (let y = 285; y < 615; y += 31) line(c, 285, y, 1312, y, '#6f62532a', .7);
      for (let row = 0; row < 8; row++) for (let i = 0; i < 12; i++) {
        const x = 290 + i * 86 + row % 2 * 43; if (x < 1310) line(c, x, 285 + row * 31, x, 313 + row * 31, '#6f62531b', .6);
      }
      for (let i = 0; i < 8; i++) { const x = 325 + i * 130; line(c, x + 2, 301, x + 67, 301, '#ead7ae6b', 1); line(c, x + 4, 303, x + 4, 466, '#e5d9be29', 2); }
      wood(c, 1112, 531, 111, 9, true); text(c, 'БІБЛІОТЕКА →', 1166, 523, 11, '#e1d2b4', 'center');
    }
    if (id === 'love') {
      for (let i = 0; i < 3; i++) { line(c, 557, 605 + i * 24, 1062, 605 + i * 24, '#d8b38543', .8); }
      for (let i = 0; i < 17; i++) {
        const x = 34 + i * 96, y = 805 + i * 13 % 70;
        oval(c, x, y, 3.5, 1.6, ['#ab7d56', '#cfad73', '#8d9a64'][i % 3]);
      }
    }
    if (id === 'work') {
      surface(c, 343, 555, 715, 26, '#b69d78', '#766452', 4);
      line(c, 349, 557, 1050, 557, '#f6dfb981', .8);
      box(c, 435, 528, 96, 20, '#32464b', 2); text(c, 'ДЖО · ДИЗАЙН', 483, 542, 9, '#c2c9b7', 'center');
      for (let i = 0; i < 4; i++) { box(c, 90, 322 + i * 24, 142, 3, '#c4c0aa21', 1); }
    }
    if (id === 'home') {
      for (let i = 0; i < 9; i++) line(c, 420, 430 + i * 35, 680, 430 + i * 35, '#69554835', .8);
      for (let i = 0; i < 5; i++) line(c, 1081, 418 + i * 30, 1192, 418 + i * 30, '#69554830', .8);
      box(c, 657, 547, 21, 16, '#cdbb99', 2); text(c, '17', 668, 559, 10, '#48555b', 'center');
      glow(c, 577, 525, 100, '#ebc68b13');
    }
    if (id === 'family') {
      for (let i = 0; i < 4; i++) line(c, 271 + i * 184, 580, 271 + i * 184, 686, '#273b3d19', 1);
      for (let i = 0; i < 5; i++) { box(c, 1104 + i * 27, 816 - i % 2 * 23, 23, 23, ['#a68a62', '#7e9686', '#ba8272'][i % 3], 2); }
      wood(c, 391, 767, 90, 8, true); for (const x of [402, 460]) line(c, x, 775, x, 817, '#5f5a50', 3);
    }
    c.restore();
  }
  /** Medical set. Its live monitor and sleeping head remain independent layers. */
  function hospital(c, t, reduced, sleeper) {
    const C = scope.AppleCinema;
    c.save(); surface(c, 0, 0, 1600, 660, '#849895', '#526a72');
    surface(c, 0, 660, 1600, 240, '#738886', '#3e515d');
    surface(c, 0, 435, 1600, 225, '#678381', '#526f71');
    line(c, 0, 435, 1600, 435, '#c4d1bf63', 3); line(c, 0, 659, 1600, 659, '#c8d1b530', 1);
    for (let i = 0; i < 6; i++) line(c, i * 320 - 60, 900, 800 + (i - 2.5) * 156, 660, '#1535421e', .8);
    for (let row = 0; row < 4; row++) line(c, 0, 678 + row * row * 21, 1600, 678 + row * row * 21, '#c3cbb31c', .8);
    box(c, 1136, 121, 328, 333, '#c6ccba', 3);
    C.windowLight(c, 1155, 140, 290, 295, 8 + Math.sin(t * .12) * 2, t, reduced);
    line(c, 1147, 448, 1456, 448, '#dfdcc2', 7);
    C.lightSpill(c, C.lightAt(9), 1155, 140, 290, 295);
    for (const x of [1123, 1455]) {
      surface(c, x, 111, 27, 410, '#91a9a3', '#5f8584', 2);
      for (let i = 0; i < 4; i++) line(c, x + 3 + i * 6, 120, x + 3 + i * 6, 515, i % 2 ? '#c6d1b932' : '#3b68653c', 1);
    }
    C.floorShadow(c, 584, 781, 295, 24, .28);
    surface(c, 360, 610, 480, 100, '#b9c2b7', '#778e90', 12);
    surface(c, 330, 590, 510, 55, '#eee4cb', '#bac2b5', 13);
    for (const x of [342, 818]) {
      surface(c, x, 640, 18, 135, '#c2ccc4', '#627e85', 4);
      line(c, x + 3, 647, x + 3, 763, '#f3e6c76b', 1);
    }
    surface(c, 430, 597, 382, 47, '#a5bdbe', '#6c929e', 10);
    c.save(); c.beginPath(); c.roundRect(430, 597, 382, 47, 10); c.clip();
    for (let i = 0; i < 6; i++) line(c, 453 + i * 63, 604, 466 + i * 63, 638, '#294f6926', 1);
    c.restore(); surface(c, 360, 590, 130, 43, '#e9dfc6', '#c3c6b5', 12);
    surface(c, 825, 575, 16, 150, '#d2d7c6', '#7d9a9c', 5);
    surface(c, 120, 380, 180, 140, '#405660', '#263f4c', 7);
    box(c, 130, 390, 160, 120, '#132e3c', 3);
    line(c, 210, 520, 210, 730, '#8aa6aa', 7); line(c, 160, 730, 260, 730, '#8aa6aa', 5);
    for (const x of [171, 250]) oval(c, x, 740, 7, 9, '#334956');
    surface(c, 1464, 505, 106, 208, '#a2bab0', '#5b8184', 4);
    for (let i = 0; i < 3; i++) { box(c, 1472, 519 + i * 51, 90, 42, '#94b0a534', 2); line(c, 1500, 536 + i * 51, 1532, 536 + i * 51, '#d8d8bd', 2); }
    box(c, 1473, 480, 18, 25, '#d9dec7', 2); box(c, 1477, 473, 10, 9, '#637e82', 1);
    box(c, 1524, 486, 24, 19, '#d6cfb5', 3); line(c, 1546, 490, 1552, 490, '#d6cfb5', 2);
    surface(c, 810, 160, 160, 150, '#e2d9be', '#abbcab', 4);
    box(c, 810, 160, 160, 30, '#637f7b', 3); text(c, 'ЛИСТОПАД', 890, 180, 11, '#e3dcc0', 'center');
    text(c, String(1 + Math.floor(t / 2)), 890, 262, 44, '#5e7c7c', 'center');
    C.clock(c, 688, 190, reduced ? 0 : t, .72);
    box(c, 125, 178, 104, 78, '#c3d0bc', 3); box(c, 164, 191, 26, 51, '#6a9189', 2); box(c, 151, 204, 52, 25, '#6a9189', 2);
    line(c, 117, 329, 1058, 329, '#bfccba60', 4);
    for (const x of [440, 620, 780]) { box(c, x, 322, 15, 17, '#d6d4bc', 2); oval(c, x + 7, 330, 2, 2, '#6b827c'); }
    C.ward(c, t, reduced);
    // Paint this last: no rail, blanket texture or medical equipment can cross his face.
    sleeper(c, 388, 609);
    glow(c, 1302, 270, 440, '#e7e1bc18'); c.restore();
  }
  const WARM_LAYOUT=Object.freeze({table:Object.freeze({x:470,y:725,w:145,h:82}),chair:Object.freeze({x:1160,y:475,w:360,h:282}),actor:Object.freeze({x:660,y:175,w:370,h:650})});
  /** One complete set avoids the conflicting old and new furniture layers. */
  function warmRoom(c,t,reduced=false){
    const C=scope.AppleCinema;c.save();surface(c,0,0,1600,650,'#60503f','#4c4037');
    surface(c,0,650,1600,250,'#44372e','#2a2523');line(c,0,650,1600,650,'#96744e',3);
    for(let i=0;i<6;i++)line(c,0,690+i*37,1600,690+i*37,'#b68b5730',1);
    for(const x of [15,76,137,480,541,602,663,724,785,846,907,968,1478,1539]){
      box(c,x,495,43,149,'#c7995c08',2);line(c,x,495,x,640,'#e2b97b18',.8);
    }
    line(c,0,487,1600,487,'#d0a06b35',3);
    wood(c,160,150,320,320,true);box(c,176,166,288,288,'#333846');oval(c,380,250,37,37,'#ccb07c');
    line(c,320,166,320,454,'#b48a60',7);line(c,176,310,464,310,'#b48a60',7);
    for(const x of [150,460]){surface(c,x,130,25,365,'#98764e','#6e573f',5);for(let i=0;i<3;i++)line(c,x+5+i*6,138,x+5+i*6,484,'#d6b47a20',1)}
    C.floorShadow(c,260,698,230,20,.3);wood(c,40,558,400,113,true);wood(c,34,548,412,14);
    for(let i=0;i<3;i++){wood(c,53+i*125,573,111,81,true);oval(c,108+i*125,611,3,3,'#c4a071')}
    C.books(c,70,487,166,60);box(c,264,534,107,14,'#cab998',2);
    C.plant(c,98,790,t,.8,reduced);C.clock(c,1420,103,t,.68);portrait(c,1370,140,140,195);portrait(c,550,164,95,75);
    oval(c,825,790,430,70,'#917656');
    for(let i=0;i<3;i++){c.strokeStyle='#c9a77923';c.lineWidth=1;c.beginPath();c.ellipse(825,790,410-i*19,60-i*4,0,0,TAU);c.stroke()}
    // A separate backrest, seat cushion, armrests and feet read as an armchair.
    C.floorShadow(c,1338,757,195,20,.32);
    for(const x of [1190,1460])wood(c,x,709,17,43,true);
    surface(c,1176,475,324,190,'#a6835e','#74573e',28);
    surface(c,1190,490,296,151,'#b18c65','#876647',20);
    for(const x of [1265,1400]){oval(c,x,555,2.3,2.3,'#705139');line(c,x-6,548,x+6,562,'#d6b47e24',.7)}
    surface(c,1190,638,296,66,'#bd986c','#876548',15);line(c,1203,650,1473,650,'#edc99155',1);
    surface(c,1158,582,44,132,'#ae8861','#76563e',17);surface(c,1477,582,44,132,'#ae8861','#76563e',17);
    line(c,1170,598,1170,694,'#dfb88135',1);line(c,1488,598,1488,694,'#dfb88135',1);
    line(c,1050,710,1050,325,'#a18760',6);oval(c,1050,710,66,10,'#584733');
    surface(c,992,285,116,95,'#dfbd82','#b08a55',13);glow(c,1050,375,430,'#edb75c2a');
    // The table is to the left of the actor's visible silhouette, with a real cup.
    const table=WARM_LAYOUT.table;C.floorShadow(c,table.x+table.w/2,810,100,12,.25);
    wood(c,table.x,table.y,table.w,17);for(const x of [482,587])wood(c,x,table.y+17,14,table.h-17,true);
    oval(c,537,724,34,5,'#d5bf97');surface(c,514,686,47,36,'#d8c09a','#b49a70',5);
    c.strokeStyle='#c6aa80';c.lineWidth=4;c.beginPath();c.arc(564,701,9,-Math.PI/2,Math.PI/2);c.stroke();oval(c,537.5,688,20,3,'#76533d');
    if(!reduced)for(let i=0;i<3;i++){const drift=Math.sin(t*.7+i)*2;c.strokeStyle='#ebc9a132';c.lineWidth=1;c.beginPath();c.moveTo(525+i*9,678);c.bezierCurveTo(518+i*9+drift,667,536+i*9+drift,663,528+i*9,650);c.stroke()}
    c.restore();
  }

  function ambulanceDetails(c, wheelAngle, reduced = false) {
    c.save();
    surface(c, -173, -198, 365, 118, '#e7e5d6', '#bfcac4', 8);
    line(c, -58, -191, -58, -81, '#748f963d', 1);
    line(c, 186, -188, 186, -9, '#5a7b872e', 1);
    box(c, -157, -184, 80, 45, '#465f71', 4); box(c, 88, -185, 81, 45, '#465f71', 4);
    line(c, -150, -180, -125, -180, '#b8cecc65', 2); line(c, 95, -181, 123, -181, '#b8cecc65', 2);
    // Reapply the medical emblem after the body panels.
    box(c, -15, -155, 28, 85, '#a75f58', 3); box(c, -43, -127, 85, 28, '#a75f58', 3);
    text(c, 'ШВИДКА ДОПОМОГА', -163, -93, 9, '#657d85');
    line(c, -145, -51, -128, -51, '#d1d6cb', 2); line(c, 148, -52, 165, -52, '#d1d6cb', 2);
    line(c, 225, -129, 244, -132, '#d2dfd442', 2); line(c, 225, -72, 245, -75, '#a1b8b9', 1.5);
    box(c, 319, -102, 9, 20, '#344d5f', 2); line(c, 322, -89, 333, -81, '#6f8791', 2);
    box(c, 313, -58, 20, 16, '#e9d6a5', 3); glow(c, 331, -50, 55, '#f4d9a312');
    for (let i = 0; i < 4; i++) line(c, 321, -25 + i * 5, 341, -25 + i * 5, '#5c7682', 1);
    line(c, -175, -6, 200, -6, '#7e96985c', 3);
    for (const x of [-90, 250]) {
      oval(c, x, 0, 33, 33, '#263843'); oval(c, x, 0, 22, 22, '#8fa1a0'); oval(c, x, 0, 7, 7, '#516c79');
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + (reduced ? 0 : wheelAngle); line(c, x + Math.cos(a) * 9, Math.sin(a) * 9, x + Math.cos(a) * 18, Math.sin(a) * 18, '#d1d3bc', 2); }
    }
    c.restore();
  }
  /** Organic branch silhouettes replace the former stack of round canopy blobs. */
  function tree(c, x, y, scale = 1, t = 0) {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    if (shadows()) scope.AppleCinema?.floorShadow(c, 5, 6, 105, 11, .23);
    const bend = Math.sin(t * .52) * 1.1;
    poly(c, [[-14, 0], [-6, -94], [-19, -151], [-10, -155], [5, -109], [14, -172], [21, -172], [11, -94], [13, 0]], '#596153');
    for (let i = 0; i < 9; i++) {
      const side = i % 2 ? 1 : -1, bx = side * (28 + i % 3 * 20), by = -135 - i * 10;
      c.strokeStyle = i % 3 ? '#515d50' : '#6e705a'; c.lineWidth = 5 - i % 3; c.beginPath();
      c.moveTo(2, -85 - i * 8); c.quadraticCurveTo(bx * .55, by + 12, bx, by); c.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const a = i * 2.399963, radius = Math.sqrt((i + 1) / 12), X = Math.cos(a) * 77 * radius + bend, Y = -192 + Math.sin(a) * 57 * radius;
      c.save(); c.translate(X, Y); c.scale(1.1, .95);
      shapeCrown(c, ['#405d50', '#506d54', '#68825e', '#7e9168'][i % 4]); c.restore();
    }
    for (let i = 0; i < 145; i++) {
      const a = i * 2.399963, radius = Math.sqrt((i + .5) / 145), X = Math.cos(a) * 108 * radius,
        Y = -195 + Math.sin(a) * 80 * radius, wind = Math.sin(t * .65 + X * .02) * (1 + radius);
      c.save(); c.translate(X + wind, Y); c.rotate(a);
      poly(c, [[-3, 0], [0, -2.2], [4.5, 0], [0, 2.3]], ['#a2ad7860', '#233f465b', '#c1be8b40', '#62865b80'][i % 4]); c.restore();
    }
    for (let i = 0; i < 5; i++) line(c, -5 + i * 3, -81 + i * 5, -6 + i * 3, -6, '#d1bd7e23', .8);
    c.restore();
  }
  function shapeCrown(c, color) {
    c.fillStyle = color; c.beginPath(); c.moveTo(-39, 4);
    c.bezierCurveTo(-43, -8, -32, -11, -34, -23); c.quadraticCurveTo(-21, -25, -19, -34);
    c.quadraticCurveTo(-6, -30, -2, -41); c.quadraticCurveTo(10, -33, 20, -32);
    c.quadraticCurveTo(25, -22, 35, -18); c.quadraticCurveTo(33, -5, 43, 2);
    c.quadraticCurveTo(35, 14, 34, 23); c.quadraticCurveTo(20, 22, 16, 34);
    c.quadraticCurveTo(3, 30, -5, 36); c.quadraticCurveTo(-17, 29, -27, 27);
    c.quadraticCurveTo(-28, 15, -39, 4); c.fill();
  }
  /** Arena atmosphere has bounded detail and never covers active projectiles. */
  function arena(c, t, round, index, reduced = false) {
    c.save(); surface(c, 0, 0, 1000, 600, '#111d2d', '#080e18');
    glow(c, round === 1 ? 800 : 500, 180, 340, '#526b8b17');
    for (let i = 0; i < 7; i++) {
      const x = i * 180 - 40;
      box(c, x, 0, 28, 468, '#53657b0b'); line(c, x + 28, 0, x + 28, 468, '#9ea68a0a', 1);
    }
    line(c, 0, 468, 1000, 468, '#93a79c16', 1);
    for (let i = 0; i < 7; i++) line(c, 500 + (i - 3) * 200, 600, 500 + (i - 3) * 83, 468, '#78949c0c', 1);
    for (const y of [488, 520, 566]) line(c, 0, y, 1000, y, '#78949c0c', 1);
    text(c, String(index + 1).padStart(2, '0'), 58, 98, 58, '#adc5c409');
    if (!reduced && lighting()) for (let i = 0; i < 14; i++) oval(c, (i * 83 + Math.sin(t * .1 + i) * 7) % 1000,
      (i * 47 - t * (2 + i % 3) + 1200) % 600, .7, .7, '#bfc7c12b');
    c.restore();
  }
  scope.AppleSceneArt = Object.freeze({ room, windowView, landscape, hospital, warmRoom, WARM_LAYOUT, ambulanceDetails, tree, arena, wood, surface, glow, portrait });
  if (typeof module !== 'undefined') module.exports = scope.AppleSceneArt;
})(typeof window === 'undefined' ? globalThis : window);
