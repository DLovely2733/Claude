// Low-poly asset kit. Everything is built from primitives and canvas-drawn
// textures generated at runtime, so there are no third-party models or
// images to license. All of it is an illustrative reconstruction, not a
// historical record.

export function kit(THREE) {
  const matCache = new Map();
  const mat = (color, opts = {}) => {
    const key = `${color}|${JSON.stringify(opts)}`;
    if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0.02, ...opts }));
    return matCache.get(key);
  };

  const mesh = (geo, color, [x = 0, y = 0, z = 0] = [], opts) => {
    const m = new THREE.Mesh(geo, typeof color === 'string' ? mat(color, opts) : color);
    m.position.set(x, y, z);
    return m;
  };
  const box = (w, h, d, color, pos = [0, 0, 0], opts) => mesh(new THREE.BoxGeometry(w, h, d), color, [pos[0], pos[1] + h / 2, pos[2]], opts);
  const cyl = (rt, rb, h, color, pos = [0, 0, 0], seg = 8) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), color, [pos[0], pos[1] + h / 2, pos[2]]);
  const cone = (r, h, color, pos = [0, 0, 0], seg = 6) => mesh(new THREE.ConeGeometry(r, h, seg), color, [pos[0], pos[1] + h / 2, pos[2]]);
  const group = (...children) => {
    const g = new THREE.Group();
    children.flat(Infinity).filter(Boolean).forEach((c) => g.add(c));
    return g;
  };
  const at = (obj, x, y, z, ry = 0) => {
    obj.position.set(x, y, z);
    obj.rotation.y = ry;
    return obj;
  };

  /** Canvas texture with text and/or an emoji symbol. */
  function textTexture(lines, { w = 512, h = 128, bg = '#1d2a22', fg = '#ffffff', symbol = '', font = 'Lexend, Atkinson Hyperlegible, sans-serif', border = null } = {}) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    if (border) {
      g.strokeStyle = border;
      g.lineWidth = Math.max(4, h * 0.05);
      g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth);
    }
    const arr = Array.isArray(lines) ? lines : [lines];
    let x = w / 2;
    if (symbol) {
      g.font = `${Math.floor(h * 0.62)}px sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const sx = arr[0] ? h * 0.55 : w / 2;
      g.fillText(symbol, sx, h / 2 + h * 0.04);
      x = arr[0] ? (w + h * 0.95) / 2 : x;
    }
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const size = Math.floor((h * 0.5) / Math.max(1, arr.length * 0.8));
    g.font = `700 ${size}px ${font}`;
    arr.forEach((line, i) => g.fillText(line, x, h / 2 + (i - (arr.length - 1) / 2) * size * 1.15, w - (symbol ? h * 1.1 : 24)));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  function sign(text, { width = 4, height = 1, symbol = '', bg, fg, border } = {}) {
    const tex = textTexture(text, { w: 512, h: Math.round((512 * height) / width), symbol, bg, fg, border });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    m.userData.noShadow = true;
    return m;
  }

  function flag(kind = 'canada', { height = 5 } = {}) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const g = c.getContext('2d');
    if (kind === 'canada') {
      g.fillStyle = '#d52b1e';
      g.fillRect(0, 0, 256, 128);
      g.fillStyle = '#ffffff';
      g.fillRect(64, 0, 128, 128);
      g.font = '84px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('🍁', 128, 70);
    } else {
      g.fillStyle = '#1f4fa3';
      g.fillRect(0, 0, 256, 128);
      g.fillStyle = '#ffffff';
      g.font = '700 30px sans-serif';
      g.textAlign = 'center';
      g.fillText('ALBERTA', 128, 76);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    cloth.position.set(1.05, height - 0.6, 0);
    cloth.userData.noShadow = true;
    return group(cyl(0.06, 0.08, height, '#d9d9d9'), cloth);
  }

  function tree(scale = 1, color = '#3f7d4e') {
    return group(cyl(0.15 * scale, 0.22 * scale, 1.2 * scale, '#6b4a2c'), cone(1.1 * scale, 2.6 * scale, color, [0, 1 * scale, 0]), cone(0.8 * scale, 1.8 * scale, color, [0, 2.2 * scale, 0]));
  }

  function lamp() {
    return group(cyl(0.06, 0.09, 3.2, '#2c3a33'), mesh(new THREE.SphereGeometry(0.22, 8, 6), mat('#fff2c4', { emissive: '#ffe08a', emissiveIntensity: 0.6 }), [0, 3.3, 0]));
  }

  function person(color = '#2f5d8a', skin = '#c99a76') {
    return group(cyl(0.22, 0.26, 1.0, color, [0, 0.5, 0]), cyl(0.08, 0.08, 0.5, '#2b2b2b', [-0.1, 0, 0]), cyl(0.08, 0.08, 0.5, '#2b2b2b', [0.1, 0, 0]), mesh(new THREE.SphereGeometry(0.2, 10, 8), skin, [0, 1.75, 0]));
  }

  function building({ w = 6, d = 5, h = 4, color = '#d9cbb2', roof = '#7a3b2e', gable = true, windows = true, door = '#5b3a24' } = {}) {
    const parts = [box(w, h, d, color)];
    if (gable) {
      const shape = new THREE.Shape([new THREE.Vector2(-w / 2 - 0.3, 0), new THREE.Vector2(w / 2 + 0.3, 0), new THREE.Vector2(0, Math.min(w, 5) * 0.45)]);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: d + 0.6, bevelEnabled: false });
      const r = mesh(geo, roof, [0, h, -d / 2 - 0.3]);
      parts.push(r);
    } else parts.push(box(w + 0.3, 0.3, d + 0.3, roof, [0, h, 0]));
    parts.push(box(1.1, 2, 0.12, door, [0, 0, d / 2 + 0.02]));
    if (windows) {
      const rows = Math.max(1, Math.floor((h - 1) / 2));
      for (let r = 0; r < rows; r++) for (const x of [-w / 3, w / 3]) parts.push(box(0.9, 0.9, 0.1, '#bfe0f2', [x, 1.4 + r * 2, d / 2 + 0.03], { emissive: '#2a4a5a', emissiveIntensity: 0.2 }));
    }
    return group(parts);
  }

  /** Stylized Centre Block with the Peace Tower (illustrative, not to scale). */
  function parliament() {
    const stone = '#d8c9a3';
    const copper = '#5f9e86';
    const parts = [
      box(34, 7, 9, stone, [0, 0, 0]),
      box(10, 9, 10, stone, [0, 0, 0]),
      box(4.4, 20, 4.4, stone, [0, 0, 5.2]),
      cone(3.4, 6, copper, [0, 20, 5.2], 4),
      box(1.6, 1.6, 0.2, '#f6f1df', [0, 15.5, 7.42]),
      box(2.4, 3.2, 0.3, '#5b3a24', [0, 0, 7.35]),
    ];
    for (const x of [-15, -9, 9, 15]) parts.push(cone(1.6, 4, copper, [x, 7, 0], 4));
    for (const x of [-12, -6, 6, 12]) for (const y of [1.6, 4.4]) parts.push(box(1, 1.6, 0.15, '#7fa7bf', [x, y, 4.55]));
    const roofShape = new THREE.Shape([new THREE.Vector2(-17.2, 0), new THREE.Vector2(17.2, 0), new THREE.Vector2(15, 2.6), new THREE.Vector2(-15, 2.6)]);
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 9.4, bevelEnabled: false });
    parts.push(mesh(roofGeo, copper, [0, 7, -4.7]));
    return group(parts);
  }

  function bench(color, len = 4) {
    return group(box(len, 0.5, 0.9, color), box(len, 0.9, 0.2, color, [0, 0.5, -0.4]));
  }

  /** Open-sided chamber: benches face each other across a central aisle. */
  function chamber({ color, floor, title, symbol, width = 12, depth = 14 }) {
    const parts = [box(width, 0.2, depth, floor), box(width, 2.5, 0.4, '#6b4a2c', [0, 0.2, -depth / 2])];
    for (let r = 0; r < 3; r++) {
      const left = bench(color, depth - 5);
      left.rotation.y = Math.PI / 2;
      left.position.set(-2.2 - r * 1.3, 0.2 + r * 0.25, 1);
      const right = bench(color, depth - 5);
      right.rotation.y = -Math.PI / 2;
      right.position.set(2.2 + r * 1.3, 0.2 + r * 0.25, 1);
      parts.push(left, right);
    }
    const s = sign(title, { width: 6, height: 1.2, symbol, bg: '#1d2a22', border: '#c9a227' });
    s.position.set(0, 3.4, -depth / 2 + 0.25);
    parts.push(s);
    return group(parts);
  }

  function throne(color = '#a12639') {
    return group(box(3, 0.4, 3, '#c9a227'), box(1.4, 0.8, 1.2, color, [0, 0.4, 0]), box(1.4, 2.4, 0.3, color, [0, 0.4, -0.5]), cone(0.4, 0.5, '#e8c547', [0, 2.8, -0.5], 5));
  }

  function pedestal(symbol, label, color = '#2a3a33') {
    const card = sign(label, { width: 2.2, height: 1.1, symbol, bg: '#fff8e6', fg: '#1a1410', border: '#c9a227' });
    card.position.set(0, 2.1, 0);
    card.rotation.x = -0.2;
    return group(cyl(0.6, 0.7, 1.4, color), card);
  }

  /** Pulsing floor ring used to highlight an interactive object. */
  function ring(radius = 2, color = '#f2c94c') {
    const r = new THREE.Mesh(new THREE.RingGeometry(radius * 0.86, radius, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    r.rotation.x = -Math.PI / 2;
    r.position.y = 0.06;
    r.userData.noShadow = true;
    return r;
  }

  /** Invisible, generous hit volume so objects are easy to tap. */
  function hitBox(w, h, d) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.y = h / 2;
    return m;
  }

  function interactive(obj, { ringRadius = 2, hit = [3, 3, 3] } = {}) {
    const g = group(obj, hitBox(...hit));
    const r = ring(ringRadius);
    r.visible = false;
    g.add(r);
    g.userData.ring = r;
    return g;
  }

  function ground(size, color) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(color));
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  function mountains(radius = 110, count = 18, color = '#8fa3b0') {
    const out = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const h = 14 + ((i * 37) % 13);
      const m = cone(10 + ((i * 13) % 7), h, color, [Math.cos(a) * radius, -1, Math.sin(a) * radius], 5);
      m.userData.noShadow = true;
      out.push(m, cone(4, h * 0.3, '#f4f6f8', [Math.cos(a) * radius, h * 0.72 - 1, Math.sin(a) * radius], 5));
    }
    return group(out);
  }

  return { mat, mesh, box, cyl, cone, group, at, textTexture, sign, flag, tree, lamp, person, building, parliament, bench, chamber, throne, pedestal, ring, hitBox, interactive, ground, mountains };
}
