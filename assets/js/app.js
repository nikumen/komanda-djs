/* ════════════════════════════════════════════════════════════════
   КОМАНДЫ DJS · variant C — app.js
   Прелоадер (canvas-набрызг + gooey-потёки) · GSAP-оркестрация ·
   тикер · модалка · lazy three.js
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── REG-номер диспетчерской ── */
  function reg() { return 'DJS-' + String(1000 + Math.floor(Math.random() * 8999)); }
  var REG = reg();

  /* ════════ ПРЕЛОАДЕР — canvas-набрызг «КОМАНДЫ DJS» ════════ */
  function preloader(done) {
    var pre = $('#preloader'), cv = $('#sprayCanvas'), numEl = $('#plNum'), barEl = $('#plBar'), regEl = $('#plReg');
    if (regEl) regEl.textContent = 'REG ' + REG;
    if (!pre || !cv) { done(); return; }

    if (RM) { // reduced-motion: статичный логотип, быстрый уход
      var ctxR = cv.getContext('2d'); cv.width = 760; cv.height = 280;
      ctxR.fillStyle = '#f3f1ec'; ctxR.font = '700 120px Oswald, sans-serif'; ctxR.textAlign = 'center'; ctxR.textBaseline = 'middle';
      ctxR.fillText('КОМАНДЫ', 380, 96); ctxR.fillStyle = '#e00000'; ctxR.fillText('DJS', 380, 210);
      if (numEl) numEl.textContent = '100'; if (barEl) barEl.style.width = '100%';
      setTimeout(function () { finish(pre, done); }, 500); return;
    }

    var ctx = cv.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = 760 * DPR; cv.height = 280 * DPR; ctx.scale(DPR, DPR);
    var W = 760, H = 280, pts = [];

    function buildPoints() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 116px Oswald, "Fira Sans Condensed", sans-serif';
      ctx.fillText('КОМАНДЫ', W / 2, 92);
      ctx.fillText('DJS', W / 2, 206);
      var d = ctx.getImageData(0, 0, W * DPR, H * DPR).data, w = W * DPR;
      pts = [];
      for (var y = 0; y < H * DPR; y += 2 * DPR) {
        for (var x = 0; x < w; x += 2 * DPR) {
          if (d[(y * w + x) * 4 + 3] > 120) pts.push([x / DPR, y / DPR]);
        }
      }
      ctx.clearRect(0, 0, W, H);
    }

    function sprayPass(amount) {
      var n = Math.floor(pts.length * 0.05 * amount);
      for (var i = 0; i < n; i++) {
        var p = pts[(Math.random() * pts.length) | 0];
        var ang = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 2.6;
        var x = p[0] + Math.cos(ang) * r, y = p[1] + Math.sin(ang) * r;
        ctx.fillStyle = (p[1] > 130) ? '#e00000' : '#f3f1ec';
        ctx.globalAlpha = Math.random() * 0.32 + 0.06;
        ctx.fillRect(x, y, 1.6, 1.6);
      }
      // overspray-гало
      for (var k = 0; k < n * 0.25; k++) {
        var q = pts[(Math.random() * pts.length) | 0];
        ctx.fillStyle = (q[1] > 130) ? 'rgba(224,0,0,0.5)' : 'rgba(243,241,236,0.5)';
        ctx.globalAlpha = Math.random() * 0.06 + 0.01;
        ctx.fillRect(q[0] + (Math.random() - 0.5) * 14, q[1] + (Math.random() - 0.5) * 14, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
    }

    var drips = [];
    function gooeyDrips() { // P3 — потёки с массой
      var seeds = [[235, 120], [330, 120], [430, 120], [300, 232], [400, 232], [500, 232]];
      seeds.forEach(function (s) {
        drips.push({ x: s[0] + (Math.random() - 0.5) * 30, y: s[1], len: 30 + Math.random() * 80, t: 0, w: 2 + Math.random() * 2.4, red: s[1] > 180, sp: 1.6 + Math.random() * 1.8 });
      });
    }
    function drawDrips() {
      drips.forEach(function (d) {
        if (d.t < d.len) {
          d.t += d.sp;
          ctx.fillStyle = d.red ? '#e00000' : '#f3f1ec';
          ctx.globalAlpha = 0.55;
          ctx.fillRect(d.x, d.y + d.t, d.w, d.sp + 2);
          ctx.beginPath(); ctx.arc(d.x + d.w / 2, d.y + d.t, d.w * 0.9, 0, 6.283); ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    }

    buildPoints();
    var ready = false; window.addEventListener('load', function () { ready = true; });
    var start = performance.now(), cur = 0, finishing = false, MAX = 7000, MIN_MS = 2600;

    function frame(now) {
      var elapsed = now - start;
      var target = ready ? 100 : 88;
      if (elapsed > MAX) target = 100;
      cur += (target - cur) * 0.05;
      var cap = elapsed / MIN_MS * 100;          // min-display: набрызг не «проскакивает» при мгновенном load
      if (cur > cap) cur = cap;
      var canFinish = (ready && elapsed >= MIN_MS) || elapsed > MAX;
      if (canFinish) { if (cur > 99) cur = 100; }   // снап в финал когда реально готов
      else if (cur > 99.4) cur = 99.4;              // иначе держим на пороге, ждём load + min-display

      sprayPass(0.4 + cur / 100);
      drawDrips();
      var shown = Math.round(cur);
      if (numEl) numEl.textContent = shown < 10 ? '0' + shown : '' + shown;
      if (barEl) barEl.style.width = cur + '%';

      if (cur >= 100 && !finishing) {
        finishing = true; gooeyDrips();
        var extra = 0;
        (function settle() { drawDrips(); if (++extra < 46) requestAnimationFrame(settle); else finish(pre, done); })();
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    // страховка: прелоадер уйдёт, даже если requestAnimationFrame заморожен (фоновая вкладка)
    function hardStop() { if (!finishing) { finishing = true; finish(pre, done); } }
    if (document.readyState === 'complete') setTimeout(hardStop, Math.max(MIN_MS, 2800) + 700);
    else window.addEventListener('load', function () { setTimeout(hardStop, 1400); });
  }

  function finish(pre, done) {
    pre.classList.add('is-done');
    document.body.removeAttribute('data-loading');
    setTimeout(function () { if (pre && pre.parentNode) pre.parentNode.removeChild(pre); }, 720);
    done();
  }

  /* ════════ ТИКЕР / часы ════════ */
  function ticker() {
    var clk = $('#tkClock'), rg = $('#tkReg'), gig = $('#tkGig'), cta = $('#ctaReg'), yr = $('#year');
    if (rg) rg.textContent = REG;
    if (cta) cta.textContent = REG;
    if (yr) yr.textContent = new Date().getFullYear();
    var gigs = ['ПТ 23:00', 'СБ 22:30', 'СБ 00:00', 'ВС 21:00'];
    if (gig) gig.textContent = gigs[Math.floor(Math.random() * gigs.length)];
    function tick() {
      if (!clk) return;
      var d = new Date(); function p(x) { return (x < 10 ? '0' : '') + x; }
      clk.textContent = p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds());
    }
    tick(); setInterval(tick, 1000);
  }

  /* ════════ SCRAMBLE / DECODE ════════ */
  function scramble(el, finalText, dur) {
    if (RM) { el.textContent = finalText; return; }
    var chars = '@#$&%*!?/\\АБВГДЕЖЗ0123456789';
    var start = performance.now();
    (function step(now) {
      var prog = Math.min((now - start) / dur, 1);
      var reveal = Math.floor(prog * finalText.length);
      var out = '';
      for (var i = 0; i < finalText.length; i++) {
        if (i < reveal || finalText[i] === ' ') out += finalText[i];
        else out += chars[(Math.random() * chars.length) | 0];
      }
      el.textContent = out;
      if (prog < 1) requestAnimationFrame(step); else el.textContent = finalText;
    })(performance.now());
  }

  /* ════════ GSAP-оркестрация ════════ */
  function initGSAP() {
    var g = window.gsap;
    if (!g) { $$('[data-reveal]').forEach(function (e) { e.style.opacity = 1; }); return; }
    if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);

    // reveal секций (clip + transform, не только opacity)
    if (!RM && window.ScrollTrigger) {
      $$('[data-reveal]').forEach(function (el) {
        g.set(el, { opacity: 0, y: 34, clipPath: 'inset(0 0 6% 0)' });
        window.ScrollTrigger.create({
          trigger: el, start: 'top 86%',
          onEnter: function () { g.to(el, { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.out' }); }
        });
      });
    } else { $$('[data-reveal]').forEach(function (e) { e.style.opacity = 1; }); }

    // count-up чисел
    $$('.about__stat-num').forEach(function (el) {
      var to = parseInt(el.getAttribute('data-count'), 10) || 0; if (RM) { el.textContent = to; return; }
      var o = { v: 0 };
      window.ScrollTrigger && window.ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () { g.to(o, { v: to, duration: 1.2, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); } }); }
      });
    });

    // nav stuck
    var nav = $('#nav');
    if (nav && window.ScrollTrigger) {
      window.ScrollTrigger.create({ start: 'top -40', onUpdate: function (s) { nav.classList.toggle('is-stuck', s.scroll() > 40); } });
    }

    // FAB появляется после hero
    var fab = $('.fab'), hero = $('#hero');
    if (fab && hero && window.ScrollTrigger) {
      window.ScrollTrigger.create({ trigger: hero, start: 'bottom 80%', onEnter: function () { fab.classList.add('is-in'); }, onLeaveBack: function () { fab.classList.remove('is-in'); } });
    } else if (fab) { fab.classList.add('is-in'); }

    // магнитные кнопки
    if (FINE && !RM) {
      $$('[data-magnet]').forEach(function (btn) {
        var xT = g.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
        var yT = g.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
        btn.addEventListener('mousemove', function (e) { var r = btn.getBoundingClientRect(); xT((e.clientX - r.left - r.width / 2) * 0.35); yT((e.clientY - r.top - r.height / 2) * 0.35); });
        btn.addEventListener('mouseleave', function () { xT(0); yT(0); });
      });
    }
  }

  /* ════════ КАСТОМНЫЙ КУРСОР ════════ */
  function initCursor() {
    if (!FINE || RM) return;
    var c = $('#cursor'), g = window.gsap; if (!c) return;
    document.body.classList.add('cursor-ready');
    if (g) {
      var xT = g.quickTo(c, 'x', { duration: 0.25, ease: 'power3' }), yT = g.quickTo(c, 'y', { duration: 0.25, ease: 'power3' });
      window.addEventListener('mousemove', function (e) { xT(e.clientX); yT(e.clientY); });
    } else {
      window.addEventListener('mousemove', function (e) { c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-50%)'; });
    }
    $$('a, button, summary, [data-magnet]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { c.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { c.classList.remove('is-hover'); });
    });
  }

  /* ════════ МОДАЛКА ЗАЯВКИ ════════ */
  function initModal() {
    var dlg = $('#applyModal'), form = $('#applyForm'), closeBtn = $('#modalClose'), toast = $('#toast');
    if (!dlg) return;
    function open() { if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }
    function close() { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
    $$('[data-apply]').forEach(function (b) { b.addEventListener('click', open); });
    if (closeBtn) closeBtn.addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });

    function showToast(msg) { if (!toast) return; toast.textContent = msg; toast.classList.add('is-show'); setTimeout(function () { toast.classList.remove('is-show'); }, 3200); }

    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault(); var ok = true;
      ['name', 'phone', 'telegram'].forEach(function (n) {
        var inp = form.elements[n], err = inp.parentNode.querySelector('[data-err]');
        if (!inp.value.trim()) { ok = false; if (err) err.textContent = '// обязательно'; inp.style.borderColor = '#e00000'; }
        else { if (err) err.textContent = ''; inp.style.borderColor = ''; }
      });
      if (!ok) return;
      var f = form.elements;
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Отправляю…'; }
      var body = new URLSearchParams({
        name: f.name.value, phone: f.phone.value, telegram: f.telegram.value,
        instagram: f.instagram.value || '', mixes: f.mixes.value || '',
        reg: REG, website: f.website ? f.website.value : ''
      }).toString();
      fetch('https://allmusicbot.ru/djs-apply', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res && res.ok) { close(); showToast('✓ Заявка отправлена. Скоро напишем в Telegram'); form.reset(); }
        else { showToast('Не отправилось. Попробуй ещё раз или напиши @nickmenshov'); }
      }).catch(function () {
        showToast('Сеть недоступна. Попробуй ещё раз или напиши @nickmenshov');
      }).then(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Отправить заявку →'; }
      });
    });
  }

  /* ════════ MARQUEE дубль (бесшовность) ════════ */
  function initMarquee() {
    // CSS уже крутит; на узких экранах притормозим
  }

  /* ════════ LAZY three.js (после прелоадера) ════════ */
  function load3D() {
    if (RM) return; // тяжёлый WebGL не грузим при reduced-motion
    if (window.matchMedia('(max-width: 540px)').matches && (navigator.deviceMemory || 4) < 4) return; // слабый телефон — без 3D
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; s.defer = true;
    s.onload = function () {
      var h = document.createElement('script'); h.src = 'assets/js/hero3d.js?v=3'; h.defer = true; document.body.appendChild(h);
      var a = document.createElement('script'); a.src = 'assets/js/accent3d.js?v=7'; a.defer = true; document.body.appendChild(a);
    };
    document.body.appendChild(s);
  }

  /* ════════ BOOT ════════ */
  function boot() {
    ticker(); initModal(); initCursor();
    // hero scramble
    $$('.hero__line[data-scramble]').forEach(function (el, i) { var t = el.textContent.trim(); setTimeout(function () { scramble(el, t, 700 + i * 250); }, 120 + i * 180); });
    // RGB-split: проставить data-text заголовкам секций (CSS ::before/::after на hover)
    $$('.sec-head__title').forEach(function (el) { el.setAttribute('data-text', el.textContent.replace(/\s+/g, ' ').trim()); });
    // datamosh-всплеск на hero — периодически
    if (!RM) { var hl = $$('.hero__line'); setInterval(function () { var el = hl[(Math.random() * hl.length) | 0]; if (el) { el.classList.add('is-glitch'); setTimeout(function () { el.classList.remove('is-glitch'); }, 460); } }, 4200); }
    initGSAP();
    load3D();
  }

  // прелоадер стартует сразу, boot — после
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { preloader(boot); });
  else preloader(boot);
})();
