'use strict';
/** Resolution-independent actors. Coordinates share the film's foot/head anchors. */
((scope) => {
  const TAU = Math.PI * 2;
  const line = (c, x, y, X, Y, color, width = 1) => {
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(X, Y); c.stroke();
  };
  const ellipse = (c, x, y, rx, ry, color) => {
    c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
  };
  const shape = (c, color, draw) => { c.fillStyle = color; c.beginPath(); draw(c); c.closePath(); c.fill(); };
  const box = (c, x, y, w, h, color, r = 0) => {
    c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  };
  const lit = () => scope.AppleVisualSettings?.enabled('lighting') !== false;
  /** Keep color calculations deterministic and outside canvas pixel readback. */
  function tint(color, amount) {
    const hex = /^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : '687985';
    return '#' + [0, 2, 4].map(i => Math.max(0, Math.min(255,
      parseInt(hex.slice(i, i + 2), 16) + amount)).toString(16).padStart(2, '0')).join('');
  }
  function cloth(c, color, x = -35, X = 35) {
    if (!lit()) return color;
    const g = c.createLinearGradient(x, 0, X, 12);
    g.addColorStop(0, tint(color, -24)); g.addColorStop(.35, tint(color, 13));
    g.addColorStop(.7, color); g.addColorStop(1, tint(color, -30)); return g;
  }
  function hairline(c, hair, female, variant, look) {
    const light = tint(hair, 15);
    if (look === 'cap') {
      box(c, -30, -42, 60, 15, cloth(c, '#644e48'), 5);
      ellipse(c, 0, -27, 35, 5, '#423c3d'); return;
    }
    if (look === 'einstein' || look === 'curls' || variant === 2 && !female) {
      const pale = look === 'einstein' || look === 'curls';
      for (let i = 0; i < 13; i++) {
        const a = Math.PI + i * Math.PI / 12;
        ellipse(c, Math.cos(a) * 28, -10 + Math.sin(a) * 29,
          pale ? 9 : 6, pale ? 11 : 7, i % 3 ? hair : light);
      }
      return;
    }
    shape(c, cloth(c, hair), p => {
      p.moveTo(-27, 0); p.lineTo(-28, -19);
      p.bezierCurveTo(-30, -39, -8, -46, 11, -39);
      p.bezierCurveTo(31, -35, 32, -15, 27, 2);
      p.lineTo(23, -17); p.quadraticCurveTo(8, -15, variant === 1 ? -9 : -16, -29);
      p.quadraticCurveTo(-18, -13, -23, -13); p.lineTo(-23, 2);
    });
    for (let i = 0; i < 6; i++) {
      c.strokeStyle = light; c.lineWidth = .65; c.beginPath();
      c.moveTo(-20 + i * 5, -30 - Math.sin(i) * 3);
      c.quadraticCurveTo(-2 + i * 3, -37, 23 + i * .4, -20 + i * 2); c.stroke();
    }
  }
  /** Draw a face without a lower-face dark overlay: smiles cannot resemble a beard. */
  function face(c, time, options = {}) {
    const { skin = '#d2ac90', hair = '#40322b', headY = -203, mood = 'neutral',
      kind = 'hero', variant = 0, seed = 0, reduced = false, look = '', yaw = 0 } = options;
    const female = kind === 'partner', kid = kind === 'kid', sleeping = mood === 'sleep';
    const sad = mood === 'sad', shock = mood === 'shock', laugh = mood === 'laugh';
    const t = Number.isFinite(time) ? time : 0, width = kid ? 25 : female ? 24 : kind === 'hero' ? 24 : variant === 1 ? 25 : 26;
    c.save(); c.translate(0, headY); c.rotate(sad ? -.045 : sleeping ? .025 : 0);
    if (female || look === 'bun') {
      shape(c, cloth(c, hair), p => {
        p.moveTo(-27, -25); p.bezierCurveTo(-42, -8, -34, 37, -38, 48);
        p.quadraticCurveTo(-23, 58, -19, 45); p.lineTo(22, 43);
        p.quadraticCurveTo(34, 51, 37, 43); p.bezierCurveTo(31, 17, 41, -27, 18, -36);
      });
      for (const side of [-1, 1]) line(c, side * 31, -12, side * 29, 43, tint(hair, 20), .8);
    }
    for (const side of [-1, 1]) {
      ellipse(c, side * (width - 1), 0, 4.1, 7.1, tint(skin, -7));
      c.strokeStyle = tint(skin, -32); c.lineWidth = .8; c.beginPath();
      c.arc(side * (width + .5), .5, 2.7, -.8, 1.6); c.stroke();
    }
    let complexion = skin;
    if (lit()) {
      complexion = c.createLinearGradient(-width, -5, width, 10);
      complexion.addColorStop(0, tint(skin, -12)); complexion.addColorStop(.36, tint(skin, 6));
      complexion.addColorStop(1, tint(skin, -9));
    }
    shape(c, complexion, p => {
      p.moveTo(0, -34); p.bezierCurveTo(width - 2, -35, width + 1, -16, width - 1, 2);
      p.bezierCurveTo(width - 2, 14, 17, 22, 10, 26);
      p.quadraticCurveTo(0, 31, -10, 26);
      p.bezierCurveTo(-18, 21, -width + 2, 13, -width + 1, 2);
      p.bezierCurveTo(-width - 1, -17, -width + 2, -35, 0, -34);
    });
    // Local blush and temple modelling never span the mouth or jaw.
    if (lit()) {
      line(c, -19, -12, -20, -2, '#ffdfb929', .9);
    }
    hairline(c, hair, female, variant, look);
    if (look === 'bun') ellipse(c, 10, -42, 16, 12, cloth(c, hair));
    const closed = sleeping || !reduced && ((t + seed) % 5.2 + 5.2) % 5.2 < .13;
    const glance = reduced ? 0 : Math.sin(t * .29 + seed) * .65;
    for (const side of [-1, 1]) {
      const x = side * 10 + yaw * 2, eyeY = sad ? 1.5 : 0;
      c.strokeStyle = tint(hair, 9); c.lineWidth = 1.45; c.beginPath();
      c.moveTo(x - 5, -10 + (sad ? -side * 1.5 : 0));
      c.quadraticCurveTo(x, shock ? -16 : -12, x + 5, -10 + (sad ? side * 1.5 : 0)); c.stroke();
      if (closed || laugh) {
        c.strokeStyle = '#72564a'; c.lineWidth = 1.1; c.beginPath();
        c.moveTo(x - 4.5, eyeY); c.quadraticCurveTo(x, laugh ? -3 : 3, x + 4.5, eyeY); c.stroke();
      } else {
        shape(c, '#f5e9d9', p => {
          p.moveTo(x - 5, eyeY); p.quadraticCurveTo(x, shock ? -8 : -4.4, x + 5, eyeY);
          p.quadraticCurveTo(x, shock ? 7 : 3.4, x - 5, eyeY);
        });
        ellipse(c, x + glance + yaw, eyeY, 2.5, shock ? 4.4 : 2.9, kind === 'hero' ? '#726b4f' : '#776857');
        ellipse(c, x + glance + yaw, eyeY, 1.25, 2.1, '#242c2e');
        ellipse(c, x - .6 + glance + yaw, eyeY - 1, .7, .7, '#fff6df');
        c.strokeStyle = '#665047'; c.lineWidth = .85; c.beginPath();
        c.moveTo(x - 5, eyeY); c.quadraticCurveTo(x, shock ? -8 : -4.4, x + 5, eyeY); c.stroke();
      }
    }
    c.strokeStyle = '#8f6c5652'; c.lineWidth = .65; c.beginPath();
    c.moveTo(.8 + yaw, 3); c.quadraticCurveTo(-.8 + yaw, 7, 1 + yaw, 8); c.stroke();
    line(c, 1 + yaw, 8.4, 3 + yaw, 8, '#8f6c563b', .6);
    if (laugh) {
      shape(c, '#995f53', p => { p.moveTo(-7, 16); p.quadraticCurveTo(0, 19, 7, 16); p.quadraticCurveTo(0, 27, -7, 16); });
      shape(c, '#f7e9d4', p => { p.moveTo(-5.5, 17); p.quadraticCurveTo(0, 19, 5.5, 17); p.lineTo(3.5, 20); p.lineTo(-3.5, 20); });
    } else if (shock) {
      ellipse(c, 0, 18, 3.3, 4.3, '#8b5a50'); ellipse(c, 0, 20, 1.5, .8, '#d49a86');
    } else {
      c.strokeStyle = '#986d5c'; c.lineWidth = 1.15; c.beginPath();
      c.moveTo(-5.5, 18); c.quadraticCurveTo(0, sad ? 14 : mood === 'smile' ? 22 : 19, 5.5, 18); c.stroke();
      if (mood === 'smile') line(c, -3, 22.5, 3, 22.5, '#f0c5a943', .65);
    }
    if (options.glasses) {
      for (const x of [-10, 10]) { c.strokeStyle = '#796e59'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, 0, 7, 6, 0, 0, TAU); c.stroke(); }
      line(c, -3, -1, 3, -1, '#796e59', .9);
    }
    if (look === 'einstein' || look === 'tesla') {
      for (const side of [-1, 1]) {
        c.strokeStyle = look === 'einstein' ? '#b7b2a4' : '#4e4239'; c.lineWidth = look === 'einstein' ? 2.8 : 1.5; c.beginPath();
        c.moveTo(side, 13); c.quadraticCurveTo(side * 5, 12, side * 9, 14); c.stroke();
      }
    }
    if (['beard', 'robe', 'cap'].includes(look)) {
      shape(c, cloth(c, hair), p => { p.moveTo(-23, 13); p.quadraticCurveTo(-18, 38, 0, 49); p.quadraticCurveTo(18, 38, 23, 13); p.quadraticCurveTo(0, 36, -23, 13); });
      for (let i = 0; i < 7; i++) line(c, -15 + i * 5, 26, (-15 + i * 5) * .5, 42 - Math.abs(i - 3) * 3, '#eee6ce3b', .65);
    }
    if (sad && !reduced) for (const side of [-1, 1]) {
      const drop = (t * 8 + side * 2) % 12;
      line(c, side * 12, 5, side * 13, 9 + drop, '#b1d5d36b', 1);
      ellipse(c, side * 13, 10 + drop, .9, 1.9, '#d6f1e182');
    }
    c.restore();
  }
  function hand(c, x, y, skin, side) {
    c.save(); c.translate(x, y); c.rotate(side * -.12);
    ellipse(c, 0, 0, 5.7, 8, cloth(c, skin, -6, 6));
    for (let i = 0; i < 3; i++) line(c, -3 + i * 2, 3, -3 + i * 2, 6.5, '#8d655342', .5);
    ellipse(c, -side * 4.5, -1, 2.1, 4.1, skin); c.restore();
  }
  function limb(c, a, b, d, color, widths, skin, side) {
    line(c, a.x, a.y, b.x, b.y, cloth(c, color), widths[0]);
    line(c, b.x, b.y, d.x, d.y - (skin ? 5 : 0), cloth(c, color), widths[1]);
    line(c, a.x - 3, a.y + 6, b.x - 3, b.y - 3, '#fff1d417', .8);
    if (skin) {
      line(c, d.x - 5, d.y - 8, d.x + 5, d.y - 8, '#e8ddc169', 2);
      hand(c, d.x, d.y, skin, side);
    } else {
      line(c, b.x - 2, b.y + 6, d.x - 2, d.y - 6, '#c6c9c521', .8);
      line(c, b.x - 4, b.y + 1, b.x + 3, b.y - 1, '#0b172122', .8);
    }
  }
  /** Paint one articulated actor; pose data is supplied by the shared gait solver. */
  function character(c, x, y, time, options, gait) {
    const o = options || {}, kind = o.kind || 'hero', female = kind === 'partner', hero = kind === 'hero';
    const variant = Number.isInteger(o.variant) ? Math.abs(o.variant) % 3 : 0;
    const mood = o.mood || 'smile', skin = o.skin || (hero ? '#d2ac90' : female ? '#dfb69c' : '#c5a68c');
    const hair = o.hair || (hero ? '#40322b' : female ? '#51382f' : ['#3b3732', '#745745', '#383b3b'][variant]);
    const shirt = o.shirt || (o.wedding && female ? '#f1e4cc' : o.suit ? '#354658' : hero ? '#9b8157' : female ? '#66877b' : ['#657c85', '#897265', '#6e788d'][variant]);
    const pants = o.pants || '#354351', hy = mood === 'sad' ? -197 : -203;
    const pose = gait(time, { ...o, sad: mood === 'sad' && o.handToFace !== false,
      cheer: o.cheer || mood === 'shock' });
    if (mood === 'laugh' && !o.cheer) pose.arms.forEach((arm, i) => {
      const side = i ? 1 : -1;
      arm.elbow = { x: side * 42, y: -117 }; arm.hand = { x: side * 30, y: -125 + (o.reduced ? 0 : Math.sin(time * 4 + i) * 2) };
    });
    c.save(); c.translate(x, y); c.scale(o.scale || 1, o.scale || 1);
    c.globalAlpha *= o.fade ?? 1;
    if (scope.AppleVisualSettings?.enabled('shadows') !== false) {
      ellipse(c, 1, 4, 37, 6, '#101b2524'); ellipse(c, 1, 4, 25, 3, '#101b251b');
    }
    const facing = o.facing === -1 ? -1 : 1;
    c.scale(facing * (o.walk ? .88 : 1), 1);
    for (const { hip, knee, foot, lift } of pose.legs) {
      limb(c, hip, knee, foot, pants, [20, 15]);
      c.save(); c.translate(foot.x, foot.y + 4); c.rotate(-lift * .12);
      shape(c, cloth(c, '#30383c', -10, 17), p => { p.moveTo(-9, -7); p.lineTo(7, -7); p.quadraticCurveTo(12, -5, 17, 1); p.quadraticCurveTo(18, 5, 12, 5); p.lineTo(-10, 5); });
      line(c, -8, 5, 15, 5, '#141f2a', 2.2); line(c, 2, -5, 9, -1, '#a8a89b6b', .8);
      for (let i = 0; i < 3; i++) line(c, -2 + i * 3, -4 + i, 3 + i * 3, -5 + i, '#aaad9b70', .65);
      c.restore();
    }
    c.translate(0, pose.bob);
    shape(c, cloth(c, shirt), p => {
      p.moveTo(-12, -159); p.quadraticCurveTo(-27, -159, -34, -145);
      p.lineTo(-29, -107); p.lineTo(-28, -65); p.quadraticCurveTo(0, -60, 28, -65);
      p.lineTo(29, -106); p.lineTo(34, -145); p.quadraticCurveTo(26, -158, 12, -159);
    });
    if (female) {
      const hem = o.wedding ? -10 : -62, wide = o.wedding ? 57 : 43;
      shape(c, cloth(c, shirt, -wide, wide), p => { p.moveTo(-27, -114); p.lineTo(27, -114); p.lineTo(wide, hem); p.quadraticCurveTo(0, hem + 5, -wide, hem); });
      for (const dx of [-22, -8, 8, 22]) line(c, dx, -107, dx * (o.wedding ? 2.3 : 1.6), hem, '#fff4d624', .8);
    }
    // Fabric folds follow the torso, rather than crossing the face or other props.
    for (const side of [-1, 1]) {
      line(c, side * 24, -138, side * 21, -117, '#171d2529', 1);
      line(c, side * 24, -86, side * 16, -82, '#fff2ce20', .9);
    }
    line(c, -23, -67, 23, -67, '#19232b42', 1.2);
    box(c, -8, -174, 16, 24, cloth(c, skin, -8, 8), 5);
    if (o.suit) {
      shape(c, '#e3dfd2', p => { p.moveTo(-12, -156); p.lineTo(12, -156); p.lineTo(0, -116); });
      shape(c, '#9f795d', p => { p.moveTo(0, -148); p.lineTo(4, -142); p.lineTo(3, -118); p.lineTo(0, -112); p.lineTo(-3, -118); p.lineTo(-4, -142); });
      for (const side of [-1, 1]) {
        shape(c, tint(shirt, 11), p => { p.moveTo(side * 14, -157); p.lineTo(side * 25, -142); p.lineTo(side * 14, -135); p.lineTo(side * 20, -130); p.lineTo(0, -107); });
        line(c, side * 14, -154, side * 22, -142, '#c9d0c34b', .7);
      }
      box(c, 14, -123, 12, 2, '#c0c6ba', .4);
      for (const Y of [-103, -84]) ellipse(c, 2, Y, 1.2, 1.2, '#c1bca178');
    } else {
      c.strokeStyle = tint(shirt, -28); c.lineWidth = 3; c.beginPath();
      c.moveTo(-12, -155); c.quadraticCurveTo(0, -144, 12, -155); c.stroke();
      line(c, 0, -148, 0, -135, '#e8d9b52b', .7);
      box(c, 12, -130, 13, 15, '#ede0c00c', 2); line(c, 12, -129, 25, -129, '#e3d2b947', .9);
    }
    pose.arms.forEach(({ shoulder, elbow, hand: h }, i) => limb(c, shoulder, elbow, h, shirt, [15, 12], skin, i ? 1 : -1));
    face(c, time, { ...o, skin, hair, headY: hy, mood, kind, variant,
      yaw: o.walk ? .65 : 0, seed: o.seed ?? x * .001 });
    if (o.wedding && female) {
      shape(c, '#fff3d82d', p => { p.moveTo(-27, hy - 30); p.lineTo(25, hy - 30); p.lineTo(39, hy + 61); p.lineTo(-37, hy + 54); });
      for (let i = 0; i < 5; i++) ellipse(c, -21 + i * 10, hy - 31, 3.5, 2.5, i % 2 ? '#dbbd93' : '#fff0d0');
    }
    if (o.phone) {
      const h = pose.arms[1].hand;
      box(c, h.x - 4, h.y - 13, 11, 26, '#1a2632', 2.4);
      box(c, h.x - 2.5, h.y - 10, 8, 19, '#647e8e', 1);
      line(c, h.x - 1, h.y - 8, h.x + 4, h.y - 8, '#b1c4c6', .8);
    }
    c.restore(); return pose;
  }
  const api = Object.freeze({ face, character, tint, cloth });
  scope.AppleCharacterModel = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
