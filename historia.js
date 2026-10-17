(function () {
  'use strict';
  var sec = document.querySelector('.historia'), cv = document.getElementById('lienzo');
  if (!sec || !cv) return;
  var ctx = cv.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var textos = [].slice.call(sec.querySelectorAll('.h-t')), barra = sec.querySelector('.h-progreso span'), desliza = sec.querySelector('.desliza');
  var D, base = new Image(), fin = new Image(), notas = [], listo = 0, off = document.createElement('canvas'), octx = off.getContext('2d');
  var cw, ch, dpr;
  function cargar(im, src) { im.onload = function () { listo++; pedir(); }; im.src = src; }
  fetch('img/seq/escena.json').then(function (r) { return r.json(); }).then(function (j) {
    D = j; cargar(base, 'img/seq/base.webp'); cargar(fin, 'img/seq/fin.webp');
    notas = j.s.map(function (s, i) { var im = new Image(); cargar(im, 'img/' + s.f); return { s: s, im: im, i: i, rot: ((i * 37) % 11 - 5) * 0.9 }; });
  });
  function tam() { dpr = Math.min(devicePixelRatio || 1, 2); cw = cv.clientWidth; ch = cv.clientHeight; cv.width = cw * dpr; cv.height = ch * dpr; off.width = cv.width; off.height = cv.height; }
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function tramo(p, a, b) { return cl((p - a) / (b - a)); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function progreso() { var r = sec.getBoundingClientRect(); return reduce ? 0 : cl(-r.top / (sec.offsetHeight - innerHeight)); }
  var pend = false;
  function pedir() { if (!pend) { pend = true; requestAnimationFrame(dibujar); } }
  function dibujar() {
    pend = false;
    var p = progreso();
    // textos por fases
    textos.forEach(function (t) {
      var a = +t.dataset.a, b = +t.dataset.b, ent = a === 0 ? 1 : tramo(p, a, a + .05), sal = 1 - tramo(p, b - .05, b);
      var o = Math.min(ent, sal); t.style.opacity = o.toFixed(3);
      t.style.transform = 'translate3d(0,' + ((1 - ent) * 30 - (1 - sal) * 30).toFixed(1) + 'px,0)';
    });
    if (barra) barra.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (desliza) desliza.style.opacity = (1 - tramo(p, .02, .08)).toFixed(3);
    if (!D || listo < 2 + notas.length) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    var movil = cw < 700, s = Math.min(cw / D.W * (movil ? 1.25 : 0.92), ch * (movil ? .58 : .6) / D.H);
    var w = D.W * s, h = D.H * s, x0 = (cw - w) / 2, y0 = ch - h - ch * (movil ? .1 : .05);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // escena 1: la cabeza llena
    var fb = 1 - tramo(p, .5, .64), zb = 1 + tramo(p, .46, .66) * .04;
    if (fb > 0) {
      ctx.save(); ctx.globalAlpha = fb;
      ctx.translate(cw / 2, y0 + h); ctx.scale(zb, zb); ctx.translate(-cw / 2, -(y0 + h));
      ctx.drawImage(base, x0, y0, w, h);
      // notas: se ordenan, se apilan y desaparecen
      var tx = 690, ty = 210, mv = ease(tramo(p, .1, .4)), pl = ease(tramo(p, .4, .52));
      notas.forEach(function (n) {
        var S = n.s, o;
        if (!S.big) { o = 1 - tramo(p, .08, .18); if (o <= 0) return; ctx.globalAlpha = fb * o; ctx.drawImage(n.im, x0 + S.x * s, y0 + S.y * s, S.w * s, S.h * s); return; }
        var cx = S.x + S.w / 2, cy = S.y + S.h / 2, k = n.i * 2.2;
        var nx = cx + (tx - cx) * mv, ny = cy + (ty - k - cy) * mv - Math.sin(mv * Math.PI) * 40;
        var sc = (1 - mv * .3) * (1 - pl * .7), rot = n.rot * mv * Math.PI / 180 * (1 - pl);
        o = 1 - tramo(p, .47, .54); if (o <= 0) return;
        ctx.save(); ctx.globalAlpha = fb * o;
        ctx.translate(x0 + nx * s, y0 + ny * s); ctx.rotate(rot); ctx.scale(sc, sc * (1 - pl * .5));
        ctx.drawImage(n.im, -S.w * s / 2, -S.h * s / 2, S.w * s, S.h * s); ctx.restore();
      });
      ctx.restore();
    }
    // escena 2: el camino, que se dibuja de izquierda a derecha
    var r = tramo(p, .6, .86);
    if (r > 0) {
      octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, off.width, off.height); octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var z = 1.05 - ease(r) * .05;
      octx.save(); octx.translate(cw / 2, y0 + h); octx.scale(z, z); octx.translate(-cw / 2, -(y0 + h));
      octx.globalAlpha = 1; octx.drawImage(fin, x0, y0, w, h); octx.restore();
      var L = Math.max(x0, 0), Rr = Math.min(x0 + w, cw), bx = L - 40 + (Rr - L + 260) * ease(r), g = octx.createLinearGradient(bx - 220, 0, bx, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      octx.globalCompositeOperation = 'destination-in'; octx.fillStyle = g; octx.fillRect(0, 0, cw, ch); octx.globalCompositeOperation = 'source-over';
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(off, 0, 0);
    }
  }
  tam(); addEventListener('resize', function () { tam(); pedir(); }); addEventListener('scroll', pedir, { passive: true }); pedir();
})();
