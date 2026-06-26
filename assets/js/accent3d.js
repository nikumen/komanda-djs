/* ════════════════════════════════════════════════════════════════
   КОМАНДЫ DJS · variant C — accent3d.js
   Мелкие 3D-акценты по секциям (единство стиля с hero-колонкой):
   · about      → Pioneer DJM-A9 (микшер: каналы, фейдеры, ручки, ROLL)
   · structure  → пэд-контроллер (RGB-перформанс-пэды, glow, цветовая волна)
   · curators   → наушники AIAIAI (накладные) + JH IEM, витой кабель
   · apply-cta  → винил (белый, борозды) + лейбл Locked Club
   Каждый: свой мини-renderer (alpha), lazy, ПАУЗА вне экрана (IO),
   реакция на курсор + скролл + клик, пыль/частицы. Desktop-only.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.THREE) return;
  var THREE = window.THREE;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (navigator.deviceMemory && navigator.deviceMemory < 3) return; // очень слабые устройства — без доп-3D (перф)
  var ACC_NARROW = window.matchMedia('(max-width: 1100px)').matches; // мобайл: ниже DPR

  /* ── общая мини-сцена на canvas ──────────────────────────────── */
  function initAccent(cv, type) {
    var renderer, scene, camera, group, raf = null, visible = false;
    var mouse = { x: 0, y: 0 }, mt = { x: 0, y: 0 }, kick = 0, clock = new THREE.Clock();
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, ACC_NARROW ? 1.0 : 1.3));
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.4, 7.4);

    scene.add(new THREE.AmbientLight(0x2a3042, 0.5));
    var key = new THREE.DirectionalLight(0xd2dcff, 1.5); key.position.set(-2, 6, 7); scene.add(key);
    var fill = new THREE.PointLight(0x4a5cff, 5, 28); fill.position.set(5, -1, 4); scene.add(fill);
    var warm = new THREE.PointLight(0xff5a3a, 3, 22); warm.position.set(-4, -2, 5); scene.add(warm);

    group = new THREE.Group(); scene.add(group);
    var api = (BUILD[type] || BUILD.vinyl)(group) || {};
    var dust = makeDust(); scene.add(dust);

    function fit() {
      var w = cv.clientWidth || 300, h = cv.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
    fit();
    window.addEventListener('resize', fit);
    if ('ResizeObserver' in window) { try { new ResizeObserver(fit).observe(cv); } catch (e) {} }
    [120, 600, 1500].forEach(function (ms) { setTimeout(fit, ms); });

    // курсор только когда над канвасом
    cv.addEventListener('mousemove', function (e) {
      var r = cv.getBoundingClientRect();
      mt.x = (e.clientX - r.left) / r.width - 0.5;
      mt.y = (e.clientY - r.top) / r.height - 0.5;
    });
    cv.addEventListener('mouseleave', function () { mt.x = 0; mt.y = 0; });
    cv.addEventListener('click', function () { kick = 1; });
    cv.style.cursor = 'pointer';

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.01 }).observe(cv);
    } else { visible = true; start(); }

    function render() {
      var t = clock.getElapsedTime();
      mouse.x += (mt.x - mouse.x) * 0.06; mouse.y += (mt.y - mouse.y) * 0.06;
      kick *= 0.94; if (kick < 0.001) kick = 0;
      var r = cv.getBoundingClientRect();
      var sp = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight; // скролл-параллакс
      group.rotation.y = mouse.x * 0.7 + sp * 0.8 + (api.spin ? api.spin(t, kick) : 0);
      group.rotation.x = (api.tilt || 0) - mouse.y * 0.35 + sp * 0.12;
      if (api.update) api.update(t, kick);
      dust.rotation.y = t * 0.02; dust.rotation.x = Math.sin(t * 0.1) * 0.05;
      warm.intensity = 7 * (1 + kick * 1.4);
      renderer.render(scene, camera);
      raf = visible ? requestAnimationFrame(render) : null;
    }
    function start() { if (!raf) raf = requestAnimationFrame(render); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
  }

  /* ── пыль/частицы ────────────────────────────────────────────── */
  function makeDust() {
    var n = 70, pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      pos[i * 3] = (Math.sin(i * 12.9) * 43758.5 % 1) * 9 - 4.5;
      pos[i * 3 + 1] = (Math.sin(i * 7.3) * 12543.1 % 1) * 7 - 3.5;
      pos[i * 3 + 2] = (Math.sin(i * 3.7) * 9277.4 % 1) * 5 - 3.5;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var m = new THREE.PointsMaterial({ color: 0x9fb0ee, size: 0.045, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
    return new THREE.Points(g, m);
  }

  /* ── общие материалы ─────────────────────────────────────────── */
  function matMetal(c, r, m) { return new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? 0.5 : r, metalness: m == null ? 0.6 : m }); }
  function emis(c, e, i) { return new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: i == null ? 0.8 : i, roughness: 0.4, metalness: 0.3 }); }
  function cyl(rt, rb, h, seg, mat, x, y, z, parent) { var me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); me.position.set(x || 0, y || 0, z || 0); parent.add(me); return me; }
  function box(w, h, d, mat, x, y, z, parent) {
    var me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    me.position.set(x || 0, y || 0, z || 0); parent.add(me); return me;
  }

  /* ════════ builders ════════ */
  var BUILD = {};

  /* ── DJM-A9 микшер ──────────────────────────────────────────── */
  BUILD.mixer = function (group) {
    var black = matMetal(0x0c0d11, 0.62, 0.42), edge = matMetal(0x050609, 0.82, 0.3), panel = matMetal(0x101218, 0.66, 0.35);
    var knobB = matMetal(0x1c2029, 0.5, 0.55), knobTop = matMetal(0x06070a, 0.55, 0.4), ind = matMetal(0xc8ccd6, 0.5, 0.3);
    var light = matMetal(0xc2c7d3, 0.45, 0.4), metal = matMetal(0x2a2e38, 0.45, 0.75), dark = matMetal(0x07080c, 0.8, 0.3);
    var orange = emis(0xff7a14, 0xc24400, 0.9), blue = emis(0x2a7cff, 0x0a3a99, 0.7);
    var screen = emis(0x0a1626, 0x13427d, 0.95);
    var H = 0.48, W = 3.9, D = 3.9, T = H / 2 + 0.035;
    box(W, H, D, black, 0, 0, 0, group);
    box(W * 0.985, 0.05, D * 0.985, panel, 0, H / 2 + 0.005, 0, group);          // утопленная панель
    box(W, 0.1, 0.18, dark, 0, 0.05, D / 2 - 0.04, group);                       // фронт-планка
    // антенна (back-right)
    cyl(0.02, 0.028, 1.5, 8, metal, 1.55, H / 2 + 0.78, -1.62, group);
    box(0.13, 0.1, 0.16, knobB, 1.55, H / 2 + 0.05, -1.62, group);
    function knob(x, z, r) {                                                      // ручка с индикатором
      cyl(r, r * 1.18, 0.13, 16, knobB, x, T + 0.04, z, group);
      cyl(r * 0.92, r * 0.92, 0.02, 16, knobTop, x, T + 0.11, z, group);
      box(0.02, 0.13, r * 0.5, ind, x, T + 0.07, z + r * 0.55, group);
    }
    // мастер-секция: задний ряд из 4 ручек
    for (var bm = 0; bm < 4; bm++) knob(-1.45 + bm * 0.5, -1.62, 0.08);
    // 4 канала: колонка из 5 ручек (COLOR/TRIM/HI/MID/LOW) + cue + фейдер
    var faders = [], chx = [-1.45, -0.9, -0.35, 0.2];
    for (var c = 0; c < 4; c++) {
      var x = chx[c];
      for (var k = 0; k < 5; k++) knob(x, -1.28 + k * 0.32, k === 0 ? 0.11 : 0.09);  // верхняя COLOR крупнее
      box(0.16, 0.04, 0.1, c % 2 ? blue : metal, x, T + 0.02, 0.42, group);       // канальная кнопка
      box(0.22, 0.06, 0.14, orange, x, T + 0.02, 0.66, group);                    // оранжевая CUE
      box(0.09, 0.02, 0.95, dark, x, T, 1.28, group);                             // слот фейдера
      var fc = box(0.24, 0.13, 0.2, light, x, T + 0.08, 1.12, group); faders.push(fc);
    }
    // правая зона: дисплей + BEAT FX + мастер-метр
    box(0.82, 0.02, 0.56, screen, 1.36, T, -1.1, group);                          // дисплей
    for (var fk = 0; fk < 2; fk++) knob(1.16 + fk * 0.46, -0.45, 0.1);            // FX-ручки
    box(0.3, 0.02, 0.16, blue, 1.43, T + 0.01, -0.05, group);                     // FX-слайдер слот
    for (var b = 0; b < 3; b++) box(0.15, 0.05, 0.13, blue, 1.05 + b * 0.3, T + 0.02, 0.55, group); // синие FX-кнопки
    for (var m = 0; m < 12; m++) {                                                // мастер-метр (вертикальный)
      var col = m < 8 ? 0x1aff66 : (m < 10 ? 0xffd11a : 0xff2a1a), em = m < 8 ? 0x0a6628 : (m < 10 ? 0x664400 : 0x660000);
      box(0.16, 0.02, 0.05, emis(col, em, 0.85), 1.62, T + 0.01, 0.38 - m * 0.07, group);
    }
    // фронт: большой синий мастер-кноб + наушники-ручка + кроссфейдер + бренд
    cyl(0.2, 0.23, 0.16, 24, blue, 1.35, T + 0.05, 1.3, group);
    cyl(0.12, 0.14, 0.13, 16, knobB, 0.8, T + 0.04, 1.45, group);
    box(1.0, 0.02, 0.14, dark, -0.5, T, 1.62, group);                            // кроссфейдер слот
    var xf = box(0.2, 0.12, 0.26, light, -0.7, T + 0.06, 1.62, group);
    box(0.6, 0.014, 0.09, ind, -1.45, 0.05, D / 2 - 0.04, group);                // «Pioneer DJ» на фронт-планке
    group.scale.setScalar(0.86);
    return {
      tilt: 0.62,
      spin: function (t) { return -0.4 + Math.sin(t * 0.2) * 0.1; },
      update: function (t, kick) {
        for (var i = 0; i < faders.length; i++) faders[i].position.z = 1.12 + Math.sin(t * 2.4 + i * 1.3) * (0.15 + kick * 0.5);
        xf.position.x = -0.7 + Math.sin(t * 1.6) * (0.45 + kick * 0.6);
      }
    };
  };

  /* ── пэд-контроллер (RGB-пэды) ──────────────────────────────── */
  BUILD.pads = function (group) {
    var black = matMetal(0x0d0e12, 0.6, 0.45), edge = matMetal(0x050609, 0.82, 0.3), metal = matMetal(0x2a2e38, 0.45, 0.75);
    var red = emis(0xff2a1a, 0xaa0000, 0.85), knobB = matMetal(0x202430, 0.5, 0.6);
    var T = 0.42 / 2 + 0.03;
    var W = 4.6, H = 0.42, D = 2.4;
    box(W, H, D, black, 0, 0, 0, group);
    box(W * 0.99, 0.05, D * 0.99, edge, 0, H / 2 + 0.005, 0, group);
    var pads = [], pw = 0.4, gap = 0.08;
    function bank(cx) {                                   // 2x4 банк пэдов
      var cols = 4, rows = 2, x0 = cx - ((cols - 1) * (pw + gap)) / 2, z0 = 0.18;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var mat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.35, metalness: 0.2, emissive: 0x0a2a88, emissiveIntensity: 1.0 });
        var p = box(pw, 0.1, pw, mat, x0 + c * (pw + gap), T + 0.04, z0 + r * (pw + gap), group);
        p.userData.idx = pads.length; pads.push(p);
      }
      // мелкие кнопки над банком
      for (var b = 0; b < 4; b++) box(0.16, 0.04, 0.1, edge, x0 + b * (pw + gap), T, -0.55, group);
    }
    bank(-1.2); bank(1.2);
    // центр: 2 ручки + кнопки
    cyl(0.14, 0.16, 0.16, 18, knobB, 0, T + 0.05, -0.35, group);
    cyl(0.1, 0.12, 0.12, 16, metal, 0, T + 0.04, 0.25, group);
    box(0.14, 0.04, 0.12, red, 0, T, 0.7, group);
    // красные FX-кнопки верхний ряд (по краям + центр)
    [-1.95, -0.55, 0.55, 1.95].forEach(function (bx) { box(0.2, 0.05, 0.13, red, bx, T + 0.01, -0.95, group); });
    // угловые ручки
    [-1, 1].forEach(function (s) { cyl(0.14, 0.16, 0.16, 16, knobB, s * 2.05, T + 0.05, -0.4, group); });
    group.scale.setScalar(0.9);
    return {
      tilt: 0.66,
      spin: function (t) { return -0.3 + Math.sin(t * 0.22) * 0.13; },
      update: function (t, kick) {
        for (var i = 0; i < pads.length; i++) {
          var hue = ((t * 0.09) + i * 0.07) % 1;
          var wave = 0.5 + 0.5 * Math.sin(t * 2.2 - i * 0.5);
          var hot = kick > 0.02 ? Math.max(0, 1 - Math.abs(((t * 8) % pads.length) - i) * 0.7) * kick : 0;
          pads[i].material.emissive.setHSL(hue, 0.85, 0.5);
          pads[i].material.emissiveIntensity = 0.4 + wave * 0.5 + hot * 1.8;
        }
      }
    };
  };

  /* ── наушники AIAIAI (накладные) + JH IEM, витой кабель ─────── */
  BUILD.phones = function (group) {
    var shell = matMetal(0x141417, 0.86, 0.22), cushion = matMetal(0x08080a, 0.95, 0.06);
    var plate = matMetal(0x1b1b20, 0.55, 0.45), joint = matMetal(0x2a2c32, 0.5, 0.7), bud = matMetal(0x101013, 0.55, 0.3);
    var rig = new THREE.Group(); group.add(rig);
    // плоская дужка AIAIAI (полу-тор, сплющенный спереди-назад)
    var band = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.085, 12, 50, Math.PI), shell);
    band.position.y = 0.12; band.scale.z = 0.42; rig.add(band);
    var strap = new THREE.Mesh(new THREE.TorusGeometry(1.27, 0.05, 10, 50, Math.PI), shell);
    strap.position.y = 0.12; strap.scale.z = 0.3; rig.add(strap);
    // чашки + внешний диск-драйвер
    [-1, 1].forEach(function (s) {
      var yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 10), joint);
      yoke.position.set(s * 1.2, -0.2, 0); rig.add(yoke);
      var cup = cyl(0.58, 0.6, 0.4, 32, shell, s * 1.3, -0.55, 0, rig); cup.rotation.z = Math.PI / 2;
      var pad = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.17, 14, 30), cushion);
      pad.position.set(s * 1.55, -0.55, 0); pad.rotation.y = Math.PI / 2; rig.add(pad);
      var disc = cyl(0.4, 0.4, 0.06, 28, plate, s * 1.13, -0.55, 0, rig); disc.rotation.z = Math.PI / 2; // внешний диск
      var nub = cyl(0.08, 0.08, 0.1, 12, joint, s * 1.06, -0.55, 0.0, rig); nub.rotation.z = Math.PI / 2;
    });
    // витой кабель (спираль вниз) + JH IEM
    var pts = [], turns = 7, hN = 64;
    for (var i = 0; i <= hN; i++) {
      var u = i / hN, ang = u * Math.PI * 2 * turns, rad = 0.15 * (1 - u * 0.3);
      pts.push(new THREE.Vector3(-1.3 + Math.cos(ang) * rad, -0.95 - u * 1.7, Math.sin(ang) * rad));
    }
    rig.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.045, 8, false), cushion));
    [-1, 1].forEach(function (s) {
      var lead = [];
      for (var j = 0; j <= 12; j++) { var u = j / 12; lead.push(new THREE.Vector3(-1.3 + s * u * 0.7, -2.65 - u * 0.5, u * 0.3)); }
      rig.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lead), 16, 0.032, 6, false), cushion));
      var iem = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 14), bud);
      iem.scale.set(1, 0.82, 1.25); iem.position.set(-1.3 + s * 0.7, -3.15, 0.3); rig.add(iem);
      var noz = cyl(0.05, 0.07, 0.18, 10, joint, -1.3 + s * 0.7, -3.27, 0.42, rig); noz.rotation.x = 0.5;
    });
    rig.position.y = 0.95; group.scale.setScalar(0.84);
    return {
      tilt: 0.05,
      spin: function (t) { return Math.sin(t * 0.3) * 0.18; },
      update: function (t, kick) { rig.rotation.z = Math.sin(t * 0.8) * (0.05 + kick * 0.18); }
    };
  };

  /* ── винил (белый, борозды) + Locked Club ───────────────────── */
  BUILD.vinyl = function (group) {
    var R = 2.3;
    var side = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.5, metalness: 0.12 }); // тёмный рант
    var face = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.03 });
    new THREE.TextureLoader().load('assets/img/locked-club.jpg', function (tex) {           // точная копия рефа
      if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 8; tex.center.set(0.5, 0.5);
      face.map = tex; face.needsUpdate = true;
    });
    var spinner = new THREE.Group(); group.add(spinner);
    var disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.1, 96, 1, false), [side, face, side]);
    spinner.add(disc);
    group.scale.setScalar(0.92);
    return {
      tilt: 1.18,
      spin: function () { return 0; },
      update: function (t, kick) { spinner.rotation.y += 0.01 + kick * 0.07; }
    };
  };

  function vinylTex() {
    var s = 1024, c = document.createElement('canvas'); c.width = c.height = s;
    var x = c.getContext('2d'), C = s / 2;
    x.fillStyle = '#f3f1ec'; x.fillRect(0, 0, s, s);          // белый лейбл
    // лёгкие борозды по всей площади
    for (var r = s * 0.16; r < s * 0.49; r += 3) {
      x.beginPath(); x.arc(C, C, r, 0, Math.PI * 2);
      x.strokeStyle = 'rgba(120,122,128,' + (0.025 + Math.random() * 0.03) + ')'; x.lineWidth = 1; x.stroke();
    }
    // чёткие концентрические кольца у центра (как на белом лейбле)
    [0.09, 0.115, 0.14].forEach(function (rr) {
      x.beginPath(); x.arc(C, C, s * rr, 0, Math.PI * 2);
      x.strokeStyle = 'rgba(150,150,156,0.45)'; x.lineWidth = 1.5; x.stroke();
    });
    // арт Locked Club: чёрная балаклава + анархия, справа от центра
    drawMask(x, C + s * 0.205, C, s * 0.155);
    // микро-бренд снизу
    x.fillStyle = 'rgba(20,21,26,0.55)'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 ' + (s * 0.017) + 'px JetBrains Mono, monospace';
    x.fillText('LOCKED CLUB ✕ КОМАНДЫ DJS', C, C + s * 0.31);
    // центральная дырка
    x.beginPath(); x.arc(C, C, s * 0.02, 0, Math.PI * 2); x.fillStyle = '#0a0a0c'; x.fill();
    var tex = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }
  function drawMask(x, cx, cy, R) {
    x.save();
    // силуэт балаклавы (вытянут вверх — компенсация фореукорачивания наклонённого диска)
    x.fillStyle = '#08080b';
    x.beginPath(); x.ellipse(cx, cy, R * 0.92, R * 1.85, 0, 0, Math.PI * 2); x.fill();
    // вязка (тонкие линии)
    x.strokeStyle = 'rgba(255,255,255,0.05)'; x.lineWidth = R * 0.03;
    for (var v = -3; v <= 3; v++) { x.beginPath(); x.moveTo(cx + v * R * 0.26, cy - R * 1.7); x.lineTo(cx + v * R * 0.26, cy + R * 1.7); x.stroke(); }
    // глаза (злые миндалины)
    x.fillStyle = '#f3f1ec';
    drawEye(x, cx - R * 0.36, cy + R * 0.05, R * 0.32, R * 0.14, -0.3);
    drawEye(x, cx + R * 0.36, cy + R * 0.05, R * 0.32, R * 0.14, 0.3);
    // рот (щель)
    x.beginPath(); x.ellipse(cx, cy + R * 0.8, R * 0.3, R * 0.12, 0, 0, Math.PI * 2); x.fill();
    // анархия на лбу: круг + A
    var ay = cy - R * 0.92, ar = R * 0.34;
    x.strokeStyle = '#f3f1ec'; x.lineWidth = R * 0.08;
    x.beginPath(); x.arc(cx, ay, ar, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#f3f1ec'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 ' + (R * 0.72) + 'px Oswald, Arial, sans-serif';
    x.fillText('A', cx, ay + R * 0.04);
    x.restore();
  }
  function drawEye(x, ex, ey, w, h, rot) {
    x.save(); x.translate(ex, ey); x.rotate(rot);
    x.beginPath(); x.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); x.fill(); x.restore();
  }

  /* ── запуск (после того как BUILD определён) ─────────────────── */
  var list = document.querySelectorAll('canvas.accent3d');
  for (var i = 0; i < list.length; i++) initAccent(list[i], list[i].getAttribute('data-accent'));
})();
