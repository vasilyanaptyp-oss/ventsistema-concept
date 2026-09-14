/* Ventsistema. Koncepcija. Be JS viskas matoma: schema, visi šeši žingsniai, skaičiuoklės pradinės reikšmės. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = function () { return window.innerWidth >= 900; };
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var $ = function (id) { return document.getElementById(id); };
  var hdrH = function () { var hd = document.querySelector('.hdr'); return hd ? Math.round(hd.getBoundingClientRect().height) + 'px' : '0px'; };
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* ---------- 1. Pirmas ekranas: gyvas 3D rekuperatorius (WebGL2), kitaip lieka SVG schema ---------- */
  var box = $('stage-box');
  var webgl2 = (function () { try { var c = document.createElement('canvas'); return !!(window.WebGL2RenderingContext && c.getContext('webgl2')); } catch (e) { return false; } })();
  var want3d = webgl2 && !reduce && !!box && !(navigator.connection && navigator.connection.saveData);
  window.VSMODE = want3d ? '3d' : 'svg';
  if (want3d) {
    var dynImport = function (u) { return new Function('u', 'return import(u)')(u); };
    var load3d = function () {
      dynImport('./scene3d.js').then(function (m) { return m.init(box, { mobile: !desktop() }); }).then(function (api) {
        window.VS3D = api; box.classList.add('is3d');
      }).catch(function (err) { window.VSMODE = 'svg'; if (window.console) console.warn('3D nepasiekiamas, lieka schema', err && err.message); });
    };
    if (document.readyState === 'complete') setTimeout(load3d, 120); else window.addEventListener('load', function () { setTimeout(load3d, 120); });
  }

  /* ---------- 2. Kelionė: oro paketas keliauja ortakiais pagal slinkimą ---------- */
  var pa = $('p-supply'), pb = $('p-extract'), da = $('dot-a'), db = $('dot-b'), jwrap = $('jwrap');
  if (hasGsap && !reduce && pa && pb && jwrap) {
    root.classList.add('gs');
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    var la = pa.getTotalLength(), lb = pb.getTotalLength();
    pa.style.strokeDasharray = la; pb.style.strokeDasharray = lb;
    var steps = Array.prototype.slice.call(document.querySelectorAll('#jsteps .jstep'));
    var zones = ['z0', 'z1', 'z2', 'z3', 'z4', 'z5'].map($);
    var S = [[0, 0.17], [0.17, 0.33], [0.33, 0.5], [0.5, 0.68], [0.68, 0.85], [0.85, 1.01]];
    var fill = $('jfill');
    var setJ = function (p) {
      /* tiekimo kelias piešiasi per 0–0.66, ištraukimo per 0.6–1 */
      var qa = clamp01(p / 0.66), qb = clamp01((p - 0.6) / 0.4);
      pa.style.strokeDashoffset = la * (1 - qa);
      var A = pa.getPointAtLength(la * qa); da.setAttribute('transform', 'translate(' + A.x.toFixed(1) + ' ' + A.y.toFixed(1) + ')');
      pb.style.strokeDashoffset = lb * (1 - qb);
      var B = pb.getPointAtLength(lb * qb); db.setAttribute('transform', 'translate(' + B.x.toFixed(1) + ' ' + B.y.toFixed(1) + ')');
      db.style.opacity = qb > 0.001 ? 1 : 0;
      var idx = 0; for (var i = 0; i < S.length; i++) { if (p >= S[i][0] && p < S[i][1]) { idx = i; break; } }
      if (p >= 1) idx = 5;
      for (var j = 0; j < steps.length; j++) steps[j].classList.toggle('on', j === idx);
      for (var k = 0; k < zones.length; k++) if (zones[k]) zones[k].classList.toggle('lit', k === idx);
      if (fill) fill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    };
    ScrollTrigger.create({
      trigger: '#jwrap', start: function () { return 'top ' + hdrH(); }, end: function () { return desktop() ? '+=220%' : '+=170%'; }, pin: true, scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: function (st) { setJ(st.progress); }
    });
    setJ(0);
    window.VSJ = { set: setJ };
  }

  /* ---------- 3. Atsiskleidimas slenkant: be IntersectionObserver, su draudimu ---------- */
  var rv = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  var check = function () {
    var vh = window.innerHeight;
    for (var i = 0; i < rv.length; i++) {
      var el = rv[i];
      if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh) el.classList.add('in');
    }
  };
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  window.addEventListener('load', check);
  check();
  setTimeout(check, 1200);

  /* ---------- 4. Skaičiuoklė: oro kiekis pagal tūrį ir žmones, užklausa su skaičiais ---------- */
  var form = $('calc');
  if (form) {
    var area = $('area'), hgt = $('height'), ppl = $('people');
    var fmt = function (n) { return String(n).replace('.', ','); };
    var setFill = function (inp) { var min = +inp.min, max = +inp.max, v = +inp.value; inp.style.setProperty('--p', ((v - min) / (max - min) * 100).toFixed(1) + '%'); };
    var klass = function (f) {
      if (f <= 150) return 'apie 150 m³/h';
      if (f <= 200) return 'apie 200 m³/h';
      if (f <= 250) return 'apie 250 m³/h';
      if (f <= 350) return 'apie 300–350 m³/h';
      if (f <= 500) return 'apie 400–500 m³/h';
      return '500 m³/h ir daugiau';
    };
    var calc = function () {
      var A = +area.value, H = +hgt.value, P = +ppl.value;
      var vol = A * H * 0.5, per = P * 30;
      var flow = Math.ceil(Math.max(vol, per) / 10) * 10;
      $('o-area').value = A; $('o-h').value = fmt(H.toFixed(1)); $('o-ppl').value = P;
      $('r-vol').textContent = Math.round(vol); $('r-ppl').textContent = per; $('r-flow').textContent = flow; $('r-class').textContent = klass(flow);
      [area, hgt, ppl].forEach(setFill);
      var body = 'Laba diena!\nNorėčiau pasiūlymo dėl vėdinimo (rekuperacijos).\nPlotas: ' + A + ' m², lubų aukštis: ' + fmt(H.toFixed(1)) + ' m, gyventojai: ' + P + '.\nOrientacinis oro kiekis: apie ' + flow + ' m³/h (' + klass(flow) + ').\nAdresas / miestas: \n[Vardas ir telefonas]';
      $('mail-link').href = 'mailto:uzelo.viktor@gmail.com?subject=' + encodeURIComponent('Vėdinimo pasiūlymo užklausa: ' + A + ' m²') + '&body=' + encodeURIComponent(body);
      $('sms-link').href = 'sms:+37060600670?&body=' + encodeURIComponent('Laba diena! Norėčiau vėdinimo pasiūlymo. Plotas ' + A + ' m², lubos ' + fmt(H.toFixed(1)) + ' m, gyventojai ' + P + '. Orientacinis oro kiekis apie ' + flow + ' m³/h. [Vardas]');
    };
    form.addEventListener('input', calc);
    form.addEventListener('change', calc);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    calc();
    window.VSCALC = calc;
  }
})();
