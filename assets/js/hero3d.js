/* ════════════════════════════════════════════════════════════════
   КОМАНДА DJS · variant C — hero3d.js
   Funktion-One-style sound-system stack (процедурный, без внешних моделей):
   · тёмно-синие кабинеты с фасками и угловыми болтами
   · грили-перфорация (InstancedMesh) по фронту
   · вложенные прямоугольные рупора Evo X (ступенчатый раструб, светло-серые)
   · бас-бины: складчатый W-рупор + боковые порты с красным rim
   · конусы-драйверы с концентрическими кольцами и пыльником
   · fake-bloom: аддитивные радиальные спрайты на красных портах/контуре
   Тёмный свет (кабинеты остаются ТЁМНЫМИ, красный только по краю).
   Композиция сдвинута вправо, чтобы текст «КОМАНДА DJS» дышал.
   Диагностика в window.__h3 (убрать после доводки).
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.THREE) return;
  var cv = document.getElementById('totem');
  var hero = document.getElementById('hero');
  if (!cv || !hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var THREE = window.THREE;
  var renderer, scene, camera, stack, horns = [], glows = [], rims = [], cones = [];
  var raf = null, visible = true;
  var keyL, redL, rimL, mouse = { x: 0, y: 0 }, clock = new THREE.Clock();
  var scroll = { rot: 0, y: 0, intensity: 0 };
  var tgt = { sway: 1, emis: 1, punch: 1 }, cur = { sway: 1, emis: 1, punch: 1 };

  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x000000, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x01030a, 0.058);
  camera = new THREE.PerspectiveCamera(48, 1.6, 0.1, 120);
  camera.position.set(0, 0.6, 14);

  /* ── материалы ─────────────────────────────────────────────── */
  // тёмно-синие кабинеты: низкий metalness, высокий roughness → не бликует в серый
  var matCab    = new THREE.MeshStandardMaterial({ color: 0x0b1230, roughness: 0.9, metalness: 0.08, emissive: 0x01020a });
  var matCabTop = new THREE.MeshStandardMaterial({ color: 0x070b22, roughness: 0.95, metalness: 0.06 });
  var matFrame  = new THREE.MeshStandardMaterial({ color: 0x2b366e, roughness: 0.4, metalness: 0.72 }); // металлическая фаска-рамка
  var matBolt   = new THREE.MeshStandardMaterial({ color: 0x6a7196, roughness: 0.32, metalness: 0.9 });
  var matGrille = new THREE.MeshStandardMaterial({ color: 0x05070e, roughness: 0.95, metalness: 0.1 });
  var matHorn   = new THREE.MeshStandardMaterial({ color: 0xbfc4d4, roughness: 0.46, metalness: 0.28, emissive: 0x0b0e16, side: THREE.DoubleSide });
  var matHornIn = new THREE.MeshStandardMaterial({ color: 0x8b91a6, roughness: 0.55, metalness: 0.25, side: THREE.DoubleSide });
  var matThroat = new THREE.MeshStandardMaterial({ color: 0x02030a, roughness: 1.0, metalness: 0.0 });
  var matCone   = new THREE.MeshStandardMaterial({ color: 0x0a0c16, roughness: 0.7, metalness: 0.3, side: THREE.DoubleSide });
  var matSurr   = new THREE.MeshStandardMaterial({ color: 0x14182a, roughness: 0.85, metalness: 0.2 });
  var matCap    = new THREE.MeshStandardMaterial({ color: 0xa9afc4, roughness: 0.4, metalness: 0.5 });
  var matRed    = new THREE.MeshStandardMaterial({ color: 0xff2a1a, roughness: 0.35, metalness: 0.4, emissive: 0xe00000, emissiveIntensity: 1.4 });

  stack = new THREE.Group();

  function box(w, h, d, mat, x, y, z, parent) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0); (parent || stack).add(m); return m;
  }

  /* ── фаска-рамка по фронту (металлический кант) ──────────────── */
  function frontFrame(g, w, h, d, t) {
    var z = d / 2 + 0.015;
    box(w, t, 0.06, matFrame, 0, h / 2 - t / 2, z, g);   // верх
    box(w, t, 0.06, matFrame, 0, -h / 2 + t / 2, z, g);  // низ
    box(t, h, 0.06, matFrame, -w / 2 + t / 2, 0, z, g);  // лево
    box(t, h, 0.06, matFrame, w / 2 - t / 2, 0, z, g);   // право
  }

  /* ── угловые болты (InstancedMesh, 4 шт) ─────────────────────── */
  function bolts(g, w, h, d) {
    var geo = new THREE.CylinderGeometry(0.085, 0.085, 0.07, 6);
    var im = new THREE.InstancedMesh(geo, matBolt, 4);
    var dum = new THREE.Object3D(); var i = 0;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      dum.position.set(s[0] * (w / 2 - 0.22), s[1] * (h / 2 - 0.22), d / 2 + 0.04);
      dum.rotation.set(Math.PI / 2, 0, Math.PI / 6); dum.updateMatrix();
      im.setMatrixAt(i++, dum.matrix);
    });
    g.add(im);
  }

  /* ── грили-перфорация (InstancedMesh точек) ──────────────────── */
  function grille(g, w, h, z, cols, rows) {
    var geo = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 6);
    var im = new THREE.InstancedMesh(geo, matGrille, cols * rows);
    var dum = new THREE.Object3D(); var i = 0;
    var x0 = -w / 2, y0 = -h / 2, dx = w / (cols - 1), dy = h / (rows - 1);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        dum.position.set(x0 + c * dx, y0 + r * dy, z);
        dum.rotation.set(Math.PI / 2, 0, 0); dum.updateMatrix();
        im.setMatrixAt(i++, dum.matrix);
      }
    }
    g.add(im);
  }

  /* ── вложенный прямоугольный рупор Evo X (ступени) ───────────── */
  function rectFrame(ow, oh, iw, ih, depth, mat) {
    var s = new THREE.Shape();
    s.moveTo(-ow / 2, -oh / 2); s.lineTo(ow / 2, -oh / 2); s.lineTo(ow / 2, oh / 2); s.lineTo(-ow / 2, oh / 2); s.lineTo(-ow / 2, -oh / 2);
    var hole = new THREE.Path();
    hole.moveTo(-iw / 2, -ih / 2); hole.lineTo(iw / 2, -ih / 2); hole.lineTo(iw / 2, ih / 2); hole.lineTo(-iw / 2, ih / 2); hole.lineTo(-iw / 2, -ih / 2);
    s.holes.push(hole);
    var geo = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false });
    geo.translate(0, 0, -depth);
    return new THREE.Mesh(geo, mat);
  }
  function rectHorn(g, x, y, z, w, h, depth) {
    var grp = new THREE.Group();
    var steps = 4;
    for (var i = 0; i < steps; i++) {
      var t = i / steps;
      var ow = w * (1 - t * 0.58), oh = h * (1 - t * 0.58);
      var iw = ow * 0.72, ih = oh * 0.72;
      var m = rectFrame(ow, oh, iw, ih, 0.12, i === 0 ? matHorn : matHornIn);
      m.position.z = -depth * t;
      grp.add(m);
    }
    // тёмный зев + фазовый плаг (пуля)
    var throat = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.28, h * 0.28), matThroat);
    throat.position.z = -depth - 0.01; grp.add(throat);
    var plug = new THREE.Mesh(new THREE.SphereGeometry(Math.min(w, h) * 0.11, 14, 12), matCap);
    plug.scale.z = 1.6; plug.position.z = -depth + 0.12; grp.add(plug);
    grp.position.set(x, y, z);
    g.add(grp); horns.push(grp); return grp;
  }

  /* ── драйвер: утопленный конус + кольца + пыльник ────────────── */
  function driver(g, x, y, z, R) {
    var grp = new THREE.Group();
    var surr = new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.16, 14, 36), matSurr);
    grp.add(surr);
    var cone = new THREE.Mesh(new THREE.ConeGeometry(R * 0.9, R * 0.7, 40, 1, true), matCone);
    cone.rotation.x = Math.PI / 2; cone.position.z = -R * 0.34; grp.add(cone); // утоплен внутрь
    for (var i = 1; i <= 3; i++) {
      var rr = R * (0.32 + i * 0.17);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(rr, R * 0.018, 8, 36), matSurr);
      ring.position.z = -R * 0.34 + (R * 0.7) * (1 - (0.32 + i * 0.17) / 0.9) * 0.5; grp.add(ring);
    }
    var cap = new THREE.Mesh(new THREE.SphereGeometry(R * 0.3, 18, 16), matCap);
    cap.position.z = -R * 0.04; grp.add(cap);
    grp.position.set(x, y, z);
    g.add(grp); cones.push(grp); return grp;
  }

  /* ── красный порт с rim + fake-bloom спрайтом ────────────────── */
  function glowTex() {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var ctx = c.getContext('2d');
    var gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,90,60,1)');
    gr.addColorStop(0.25, 'rgba(224,0,0,0.65)');
    gr.addColorStop(0.6, 'rgba(150,0,0,0.18)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  var GLOW = glowTex();
  function redPort(g, x, y, z, R) {
    var tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.18, 30), matThroat);
    tube.rotation.x = Math.PI / 2; tube.position.set(x, y, z); g.add(tube);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.14, 14, 36), matRed);
    rim.position.set(x, y, z + 0.05); g.add(rim); rims.push(rim);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xff1a0a, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.9 }));
    sp.scale.set(R * 5.2, R * 5.2, 1); sp.position.set(x, y, z + 0.3); g.add(sp); glows.push(sp);
  }

  /* ── HI-кабинет Evo X: рупора + грили по бокам ───────────────── */
  function hiCab(w, h, d, y, tilt) {
    var g = new THREE.Group();
    box(w, h, d, matCab, 0, 0, 0, g);
    box(w * 1.01, 0.14, d * 1.01, matCabTop, 0, h / 2 + 0.04, 0, g);    // верхняя крышка
    box(w * 1.01, 0.14, d * 1.01, matCabTop, 0, -h / 2 - 0.04, 0, g);   // нижняя
    frontFrame(g, w, h, d, 0.12);
    bolts(g, w, h, d);
    // боковые грили-полосы
    grille(g, w * 0.18, h * 0.74, d / 2 + 0.02, 4, 18);
    var gl = g.children[g.children.length - 1]; gl.position.x = -w * 0.36;
    grille(g, w * 0.18, h * 0.74, d / 2 + 0.02, 4, 18);
    var gr2 = g.children[g.children.length - 1]; gr2.position.x = w * 0.36;
    // 3 вложенных рупора по центру, столбиком
    var hz = d / 2 + 0.02;
    rectHorn(g, 0, h * 0.28, hz, w * 0.5, h * 0.24, 0.55);
    rectHorn(g, 0, 0.0,      hz, w * 0.5, h * 0.30, 0.62);
    rectHorn(g, 0, -h * 0.30, hz, w * 0.5, h * 0.24, 0.55);
    // боковые ручки-вырезы
    box(0.5, 0.16, 0.2, matThroat, -w / 2 - 0.005, 0, 0, g);
    box(0.5, 0.16, 0.2, matThroat, w / 2 + 0.005, 0, 0, g);
    g.position.set(0, y, 0);
    if (tilt) g.rotation.x = tilt;
    stack.add(g); return g;
  }

  /* ── BASS-бин: складчатый W-рупор + порты + драйвер ──────────── */
  function bassBin(w, h, d, y) {
    var g = new THREE.Group();
    box(w, h, d, matCab, 0, 0, 0, g);
    box(w * 1.01, 0.16, d * 1.01, matCabTop, 0, h / 2 + 0.05, 0, g);
    box(w * 1.01, 0.16, d * 1.01, matCabTop, 0, -h / 2 - 0.05, 0, g);
    frontFrame(g, w, h, d, 0.14);
    bolts(g, w, h, d);
    var z = d / 2 + 0.02;
    // центральный складчатый W-рот: тёмный зев + светло-серые наклонные стенки-рупора
    box(w * 0.42, h * 0.62, 0.12, matThroat, 0, 0, z, g);
    var wallL = box(w * 0.2, h * 0.6, 0.08, matHornIn, -w * 0.13, 0, z + 0.03, g); wallL.rotation.z = 0.42;
    var wallR = box(w * 0.2, h * 0.6, 0.08, matHornIn, w * 0.13, 0, z + 0.03, g); wallR.rotation.z = -0.42;
    var divider = box(0.1, h * 0.6, 0.16, matFrame, 0, 0, z + 0.05, g);
    // видимый драйвер в центральном слоте
    driver(g, 0, 0, z + 0.04, h * 0.16);
    // боковые красные порты
    redPort(g, -w * 0.37, h * 0.02, z, h * 0.13);
    redPort(g, w * 0.37, h * 0.02, z, h * 0.13);
    // боковые ручки-вырезы
    box(0.55, 0.18, 0.22, matThroat, -w / 2 - 0.005, 0, 0, g);
    box(0.55, 0.18, 0.22, matThroat, w / 2 + 0.005, 0, 0, g);
    g.position.set(0, y, 0);
    stack.add(g); return g;
  }

  /* ── сборка стека снизу вверх (line-array taper) ─────────────── */
  bassBin(4.6, 2.7, 2.7, -3.55);
  bassBin(4.2, 2.3, 2.6, -1.05);
  hiCab(3.5, 2.1, 2.2, 1.15, 0.0);
  hiCab(3.1, 1.9, 2.1, 3.05, -0.06);   // верхний кабинет с лёгким наклоном (line array)

  // общий ambient red-glow за стеком (атмосфера)
  var amb = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x8a0000, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.5 }));
  amb.scale.set(11, 13, 1); amb.position.set(0.6, 0, -2.4); stack.add(amb); glows.push(amb);

  stack.position.set(3.0, 0.2, 0);   // сдвиг вправо: текст слева дышит
  stack.rotation.y = -0.32;
  scene.add(stack);

  /* ── свет: ТЁМНЫЙ, красный только по краю ────────────────────── */
  keyL = new THREE.PointLight(0x8fa0e0, 9, 60); keyL.position.set(-4, 6, 12); scene.add(keyL);
  redL = new THREE.PointLight(0xff1a14, 18, 50); redL.position.set(7.5, 0.5, 5.5); scene.add(redL);
  rimL = new THREE.DirectionalLight(0x5566ff, 0.55); rimL.position.set(10, 3, -3); scene.add(rimL);
  scene.add(new THREE.AmbientLight(0x05081a, 0.32));

  function fit() {
    var w = hero.clientWidth || Math.round(hero.getBoundingClientRect().width) || window.innerWidth || 1280;
    var h = hero.clientHeight || Math.round(hero.getBoundingClientRect().height) || window.innerHeight || 800;
    w = Math.max(w, 320); h = Math.max(h, 320);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  if ('ResizeObserver' in window) { try { new ResizeObserver(fit).observe(hero); } catch (e) {} }
  [120, 400, 900, 1800].forEach(function (ms) { setTimeout(fit, ms); });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX / window.innerWidth - 0.5; mouse.y = e.clientY / window.innerHeight - 0.5; });
  }

  if (window.ScrollTrigger && window.gsap) {
    window.ScrollTrigger.create({
      trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1,
      onUpdate: function (st) { var p = st.progress; scroll.rot = p * Math.PI * 1.3; scroll.y = p * 3.4; scroll.intensity = p; }
    });
    var states = {
      hero: { sway: 1.0, emis: 1.0, punch: 1.0 }, about: { sway: 0.5, emis: 0.8, punch: 0.6 },
      structure: { sway: 1.4, emis: 1.2, punch: 1.3 }, curators: { sway: 0.7, emis: 1.7, punch: 1.0 },
      join: { sway: 1.7, emis: 1.35, punch: 1.7 }, 'apply-cta': { sway: 2.2, emis: 2.3, punch: 2.3 }
    };
    Object.keys(states).forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      window.ScrollTrigger.create({
        trigger: el, start: 'top 60%', end: 'bottom 40%',
        onToggle: function (self) { if (self.isActive) { tgt.sway = states[id].sway; tgt.emis = states[id].emis; tgt.punch = states[id].punch; } }
      });
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(hero);
  }

  function render() {
   try {
    var t = clock.getElapsedTime() || 0;
    cur.sway += (tgt.sway - cur.sway) * 0.04; cur.emis += (tgt.emis - cur.emis) * 0.04; cur.punch += (tgt.punch - cur.punch) * 0.04;
    var beat = Math.pow(1 - ((t * 2.0) % 1), 3);
    stack.rotation.y = -0.32 + Math.sin(t * 0.26) * 0.22 * cur.sway + scroll.rot;
    stack.rotation.x = Math.sin(t * 0.19) * 0.025;
    stack.position.y = 0.2 + scroll.y;
    var k = 1 + beat * 0.05 * cur.punch;
    for (var i = 0; i < horns.length; i++) horns[i].scale.set(k, k, 1);
    for (var c = 0; c < cones.length; c++) cones[c].scale.setScalar(1 + beat * 0.04 * cur.punch);
    var glowO = (0.55 + beat * 0.45) * Math.min(cur.emis, 2);
    for (var gi = 0; gi < glows.length; gi++) glows[gi].material.opacity = glows[gi].scale.x > 9 ? glowO * 0.55 : glowO;
    for (var ri = 0; ri < rims.length; ri++) rims[ri].material.emissiveIntensity = 1.1 + beat * 1.4 * cur.emis;
    camera.position.x += (mouse.x * 1.8 - camera.position.x) * 0.05;
    camera.position.y += (0.6 - mouse.y * 1.1 - camera.position.y) * 0.05;
    camera.lookAt(1.4, 0.1, 0);
    redL.intensity = (16 + scroll.intensity * 18) * cur.emis * (1 + beat * 0.5);
    keyL.intensity = 9 * (0.85 + cur.emis * 0.1);
    renderer.render(scene, camera);
   } catch (e) { return; }
    raf = visible ? requestAnimationFrame(render) : null;
  }
  function start() { if (!raf) raf = requestAnimationFrame(render); }
  start();
})();
