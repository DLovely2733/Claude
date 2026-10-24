// Canada Quest 3D engine (plain three.js, no build step).
//
// Responsibilities: renderer + quality settings, render-on-demand loop,
// guided camera moves between named locations, optional free walking
// (keyboard, drag, on-screen buttons), picking, and accessible HTML labels
// that track 3D objects. Scenes and missions are data; this file knows
// nothing about the curriculum.

const EYE = 1.7;

export class World {
  /**
   * @param {object} THREE three.js module
   * @param {HTMLElement} host element that receives the canvas and label layer
   * @param {object} opts { quality: 'low'|'high', reducedMotion, sensitivity, onSelect(id), onFrame() }
   */
  constructor(THREE, host, opts = {}) {
    this.THREE = THREE;
    this.host = host;
    this.opts = { quality: 'low', reducedMotion: false, sensitivity: 1, ...opts };
    const high = this.opts.quality === 'high';
    this.renderer = new THREE.WebGLRenderer({ antialias: high, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(high ? Math.min(window.devicePixelRatio || 1, 1.75) : 1);
    this.renderer.shadowMap.enabled = high;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'q-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'q-labels';
    host.append(this.canvas, this.labelLayer);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
    this.target = new THREE.Vector3();
    this.scene = null;
    this.interactives = new Map();
    this.highlighted = new Set();
    this.animations = [];
    this.tween = null;
    this.walk = { on: false, yaw: 0, pitch: -0.08, keys: new Set(), held: new Set() };
    this.bounds = null;
    this.dirty = true;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this._resize = () => this.resize();
    window.addEventListener('resize', this._resize);
    if ('ResizeObserver' in window) {
      this._ro = new ResizeObserver(this._resize);
      this._ro.observe(host);
    }
    this._bindPointer();
    this._bindKeys();
    this.resize();
    this._loop = this._loop.bind(this);
    this.running = true;
    requestAnimationFrame(this._loop);
  }

  // ---- scene ---------------------------------------------------------------

  /** Build a scene definition: def.build(ctx) registers objects and returns { locations, bounds }. */
  load(def, ctx) {
    const { THREE } = this;
    this.clearScene();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(def.sky || '#bcd9ee');
    scene.fog = new THREE.Fog(def.sky || '#bcd9ee', 60, 160);
    const hemi = new THREE.HemisphereLight('#ffffff', '#6b7f5a', 1.25);
    const sun = new THREE.DirectionalLight('#fff4e0', 2.0);
    sun.position.set(30, 50, 20);
    if (this.opts.quality === 'high') {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 140 });
    }
    scene.add(hemi, sun);
    this.scene = scene;
    const built = def.build({ ...ctx, THREE, world: this, add: (o) => (scene.add(o), o), register: (id, obj, meta) => this.register(id, obj, meta) });
    this.locations = built.locations || {};
    this.bounds = built.bounds || null;
    if (this.opts.quality === 'high') scene.traverse((o) => { if (o.isMesh) { o.castShadow = !o.userData.noShadow; o.receiveShadow = true; } });
    this.dirty = true;
    return built;
  }

  clearScene() {
    this.labelLayer.replaceChildren();
    this.interactives.clear();
    this.highlighted.clear();
    this.animations = [];
    if (this.scene) {
      this.scene.traverse((o) => {
        o.geometry?.dispose?.();
        const m = o.material;
        (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.map?.dispose?.(); x.dispose?.(); });
      });
    }
    this.scene = null;
  }

  /** Make an object interactive with a large accessible label button. */
  register(id, obj, { label, icon = '', height = 3, onSelect } = {}) {
    obj.traverse((o) => (o.userData.qid = id));
    const btn = document.createElement('button');
    btn.className = 'q-label';
    btn.type = 'button';
    btn.innerHTML = `<span class="q-label-icon" aria-hidden="true">${icon}</span><span class="q-label-text"></span>`;
    btn.querySelector('.q-label-text').textContent = label || id;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.select(id);
    });
    this.labelLayer.append(btn);
    const anchor = new this.THREE.Vector3();
    this.interactives.set(id, { id, obj, btn, height, onSelect, anchor, label });
    return obj;
  }

  setLabel(id, text, icon) {
    const it = this.interactives.get(id);
    if (!it) return;
    it.label = text;
    it.btn.querySelector('.q-label-text').textContent = text;
    if (icon != null) it.btn.querySelector('.q-label-icon').textContent = icon;
  }

  /** Show labels only for these ids (null = all). */
  showLabels(ids) {
    this.visibleLabels = ids ? new Set(ids) : null;
    this.dirty = true;
  }

  highlight(ids = []) {
    this.highlighted = new Set(ids);
    for (const it of this.interactives.values()) {
      const on = this.highlighted.has(it.id);
      it.btn.classList.toggle('hl', on);
      if (it.obj.userData.ring) it.obj.userData.ring.visible = on;
    }
    this.dirty = true;
  }

  select(id) {
    const it = this.interactives.get(id);
    if (!it) return;
    it.onSelect?.(id);
    this.opts.onSelect?.(id);
  }

  animate(fn) {
    this.animations.push(fn);
    this.dirty = true;
  }

  // ---- camera --------------------------------------------------------------

  goTo(name, { instant = false } = {}) {
    const loc = typeof name === 'string' ? this.locations[name] : name;
    if (!loc) return;
    const { THREE } = this;
    const toPos = new THREE.Vector3(...loc.position);
    const toTarget = new THREE.Vector3(...loc.target);
    if (instant || this.opts.reducedMotion) {
      this.camera.position.copy(toPos);
      this.target.copy(toTarget);
      this.camera.lookAt(this.target);
      this.tween = null;
    } else {
      this.tween = { fromPos: this.camera.position.clone(), fromTarget: this.target.clone(), toPos, toTarget, t: 0, dur: 1.6 };
    }
    this._syncWalkFromCamera(toPos, toTarget);
    this.dirty = true;
  }

  _syncWalkFromCamera(pos, target) {
    const d = target.clone().sub(pos);
    this.walk.yaw = Math.atan2(d.x, d.z);
    this.walk.pitch = Math.max(-0.6, Math.min(0.4, Math.atan2(d.y, Math.hypot(d.x, d.z))));
  }

  setWalking(on) {
    this.walk.on = on;
    if (on) {
      this.tween = null;
      this.camera.position.y = EYE;
      this._syncWalkFromCamera(this.camera.position, this.target);
    }
    this.dirty = true;
  }

  /** Hold-to-move from on-screen buttons: 'forward' | 'back' | 'left' | 'right'. */
  hold(dir, on) {
    on ? this.walk.held.add(dir) : this.walk.held.delete(dir);
    this.dirty = true;
  }

  _stepWalk(dt) {
    const w = this.walk;
    const k = w.keys;
    const s = this.opts.sensitivity;
    let moved = false;
    const turn = (k.has('left') || w.held.has('left') ? 1 : 0) - (k.has('right') || w.held.has('right') ? 1 : 0);
    const fwd = (k.has('forward') || w.held.has('forward') ? 1 : 0) - (k.has('back') || w.held.has('back') ? 1 : 0);
    if (turn) (w.yaw += turn * 1.4 * s * dt), (moved = true);
    if (fwd) {
      const sp = 5 * s * dt * fwd;
      const p = this.camera.position;
      p.x += Math.sin(w.yaw) * sp;
      p.z += Math.cos(w.yaw) * sp;
      if (this.bounds) {
        p.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, p.x));
        p.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, p.z));
      }
      moved = true;
    }
    if (moved || w.lookDirty) {
      w.lookDirty = false;
      const p = this.camera.position;
      this.target.set(p.x + Math.sin(w.yaw) * Math.cos(w.pitch), p.y + Math.sin(w.pitch), p.z + Math.cos(w.yaw) * Math.cos(w.pitch));
      this.camera.lookAt(this.target);
    }
    return moved;
  }

  // ---- input ---------------------------------------------------------------

  _bindPointer() {
    let down = null;
    this.canvas.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, moved: false };
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!down) {
        this._hover(e);
        return;
      }
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (Math.hypot(dx, dy) > 6) down.moved = true;
      if (down.moved && this.walk.on) {
        const s = this.opts.sensitivity * 0.005;
        this.walk.yaw -= (e.movementX || 0) * s;
        this.walk.pitch = Math.max(-0.6, Math.min(0.4, this.walk.pitch - (e.movementY || 0) * s));
        this.walk.lookDirty = true;
        this.dirty = true;
      }
    });
    this.canvas.addEventListener('pointerup', (e) => {
      if (down && !down.moved) this._pick(e);
      down = null;
    });
  }

  _ndc(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  _hit(e) {
    if (!this.scene) return null;
    this._ndc(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objs = [...this.interactives.values()].filter((it) => !this.visibleLabels || this.visibleLabels.has(it.id)).map((it) => it.obj);
    const hit = this.raycaster.intersectObjects(objs, true)[0];
    return hit?.object.userData.qid || null;
  }

  _hover(e) {
    const id = this._hit(e);
    this.canvas.style.cursor = id ? 'pointer' : this.walk.on ? 'grab' : 'default';
    for (const it of this.interactives.values()) it.btn.classList.toggle('hover', it.id === id);
  }

  _pick(e) {
    const id = this._hit(e);
    if (id) this.select(id);
  }

  _bindKeys() {
    const map = { ArrowUp: 'forward', KeyW: 'forward', ArrowDown: 'back', KeyS: 'back', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
    this._keydown = (e) => {
      if (!this.walk.on || !map[e.code] || e.target.closest?.('input, textarea, select')) return;
      if (!this.host.contains(document.activeElement) && document.activeElement !== document.body) return;
      e.preventDefault();
      this.walk.keys.add(map[e.code]);
      this.dirty = true;
    };
    this._keyup = (e) => map[e.code] && this.walk.keys.delete(map[e.code]);
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);
  }

  // ---- loop ----------------------------------------------------------------

  resize() {
    const w = this.host.clientWidth || 800;
    const h = this.host.clientHeight || 450;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep roughly the same horizontal view on portrait screens (phones).
    this.camera.fov = Math.max(55, (2 * Math.atan(Math.tan((35 * Math.PI) / 180) / this.camera.aspect) * 180) / Math.PI);
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  _loop() {
    if (!this.running) return;
    requestAnimationFrame(this._loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    let active = false;
    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = tw.t < 0.5 ? 4 * tw.t ** 3 : 1 - (-2 * tw.t + 2) ** 3 / 2;
      this.camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
      this.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
      this.camera.lookAt(this.target);
      if (tw.t >= 1) this.tween = null;
      active = true;
    }
    if (this.walk.on && this._stepWalk(dt)) active = true;
    if (this.animations.length) {
      this.animations = this.animations.filter((fn) => fn(dt) !== false);
      active = true;
    }
    if (this.highlighted.size && !this.opts.reducedMotion) {
      const t = this.clock.elapsedTime;
      for (const id of this.highlighted) {
        const ring = this.interactives.get(id)?.obj.userData.ring;
        if (ring) (ring.scale.setScalar(1 + 0.08 * Math.sin(t * 3)), (active = true));
      }
    }
    if (!this.scene || !(active || this.dirty)) return;
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
    this._placeLabels();
    this.opts.onFrame?.();
  }

  _placeLabels() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    for (const it of this.interactives.values()) {
      const show = !this.visibleLabels || this.visibleLabels.has(it.id);
      it.obj.getWorldPosition(it.anchor);
      it.anchor.y += it.height;
      const dist = it.anchor.distanceTo(this.camera.position);
      it.anchor.project(this.camera);
      const visible = show && it.anchor.z < 1 && Math.abs(it.anchor.x) < 1.05 && Math.abs(it.anchor.y) < 1.05 && dist < (this.walk.on ? 30 : 70);
      it.btn.hidden = !visible;
      if (visible) {
        it.btn.style.transform = `translate(${((it.anchor.x + 1) / 2) * w}px, ${((1 - it.anchor.y) / 2) * h}px) translate(-50%, -100%)`;
        it.btn.style.zIndex = String(1000 - Math.round(dist));
      }
    }
  }

  dispose() {
    this.running = false;
    window.removeEventListener('resize', this._resize);
    this._ro?.disconnect();
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    this.clearScene();
    this.renderer.dispose();
    this.canvas.remove();
    this.labelLayer.remove();
  }
}
