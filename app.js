(function () {
  'use strict';

  /* ---------- memoria local (solo en este dispositivo) ---------- */
  var KEY = 'vsf-campos';
  var MEM = {};
  try { MEM = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(MEM)); } catch (e) {} }

  /* Corchetes que son instrucciones para la IA, no huecos para el lector */
  var NO_HUECO = ['comprobar', 'año-mes tipo entidad', 'conservador / equilibrado / dinámico',
    'responder hoy / esta semana / solo leer / archivar', 'comprar ya / esperar / no comprar', 'x'];

  function norm(x) { return x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }

  /* Convierte el texto del prompt en piezas: texto fijo y huecos */
  function analizar(texto) {
    var piezas = [], huecos = [], re = /\[([^\[\]]+)\]/g, m, ult = 0;
    while ((m = re.exec(texto))) {
      var etq = m[1].trim();
      if (NO_HUECO.indexOf(etq) > -1) continue;
      piezas.push({ t: texto.slice(ult, m.index) });
      // contexto: lo escrito justo antes en la misma línea, para reconocer el mismo dato en otros prompts
      var antes = texto.slice(0, m.index).split('\n').pop().replace(/[·\-:\d.)]+\s*$/, '').trim();
      var ctx = norm(antes.split(/\s+/).slice(-4).join(' '));
      var opciones = etq.indexOf(' / ') > -1 ? etq.split(' / ').map(function (o) { return o.trim(); }) : null;
      var largo = /pega|pegar|lista|texto|notas|transcripci/i.test(etq) && !opciones;
      var h = { i: huecos.length, etq: etq, ops: opciones, largo: largo, clave: ctx + '|' + norm(etq), ctx: antes.replace(/^[·\-•\d.)\s]+/, '').replace(/[:·\-—]\s*$/, '').trim() };
      huecos.push(h);
      piezas.push({ h: h });
      ult = m.index + m[0].length;
    }
    piezas.push({ t: texto.slice(ult) });
    return { piezas: piezas, huecos: huecos };
  }

  function valor(h) { var v = MEM[h.clave]; return (v == null ? '' : String(v)); }

  function textoFinal(a) {
    return a.piezas.map(function (p) {
      if (p.t != null) return p.t;
      var v = valor(p.h); return v ? v : '[' + p.h.etq + ']';
    }).join('');
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function pintar(pre, a) {
    pre.innerHTML = a.piezas.map(function (p) {
      if (p.t != null) return esc(p.t);
      var v = valor(p.h);
      return v ? '<mark class="lleno" data-h="' + p.h.i + '">' + esc(v) + '</mark>'
               : '<span class="hueco" data-h="' + p.h.i + '">[' + esc(p.h.etq) + ']</span>';
    }).join('');
  }

  function titulo(h) {
    if (h.ops) return h.ctx ? h.ctx : 'Elige una opción';
    var e = h.etq.charAt(0).toUpperCase() + h.etq.slice(1);
    return h.ctx && h.ctx.length < 60 ? h.ctx + ' · ' + h.etq : e;
  }

  function construirPanel(card, a, pre) {
    var panel = card.querySelector('.panel');
    if (!a.huecos.length) {
      panel.innerHTML = '<p class="panel-nota">Este prompt no tiene huecos: cópialo tal cual.</p>';
      return;
    }
    // un campo por hueco distinto (mismo dato = mismo campo)
    var vistos = {}, html = '<p class="panel-nota">Rellena lo que quieras. Lo que dejes vacío se queda entre corchetes.</p><div class="campos-p">';
    a.huecos.forEach(function (h) {
      if (vistos[h.clave]) return; vistos[h.clave] = 1;
      var id = card.id + '-h' + h.i;
      html += '<div class="campo" data-clave="' + esc(h.clave) + '">';
      if (h.ops) {
        var v = valor(h), elegidas = v ? v.split(', ') : [];
        html += '<span class="campo-t">' + esc(titulo(h)) + '</span><div class="chips" role="group" aria-label="' + esc(titulo(h)) + '">';
        h.ops.forEach(function (o) {
          var limpio = o.replace(/[:…\s]+$/, '');
          var on = elegidas.indexOf(limpio) > -1;
          html += '<button type="button" class="chip" aria-pressed="' + on + '" data-op="' + esc(limpio) + '">' + esc(limpio) + '</button>';
        });
        var otra = elegidas.filter(function (x) { return h.ops.map(function (o) { return o.replace(/[:…\s]+$/, ''); }).indexOf(x) < 0; }).join(', ');
        html += '</div><input class="otra" type="text" placeholder="u otra respuesta…" value="' + esc(otra) + '" aria-label="Otra respuesta">';
      } else {
        html += '<label class="campo-t" for="' + id + '">' + esc(titulo(h)) + '</label>';
        html += h.largo
          ? '<textarea id="' + id + '" rows="3" placeholder="' + esc(h.etq) + '">' + esc(valor(h)) + '</textarea>'
          : '<input id="' + id + '" type="text" placeholder="' + esc(h.etq) + '" value="' + esc(valor(h)) + '">';
      }
      html += '</div>';
    });
    html += '</div><div class="panel-pie"><button type="button" class="enlace limpiar">Borrar mis datos de este prompt</button></div>';
    panel.innerHTML = html;

    function refrescar() { pintar(pre, a); }

    panel.addEventListener('input', function (e) {
      var campo = e.target.closest('.campo'); if (!campo) return;
      var clave = campo.dataset.clave;
      if (e.target.classList.contains('otra')) {
        var chips = [].slice.call(campo.querySelectorAll('.chip[aria-pressed="true"]')).map(function (c) { return c.dataset.op; });
        if (e.target.value.trim()) chips.push(e.target.value.trim());
        MEM[clave] = chips.join(', ');
      } else MEM[clave] = e.target.value;
      if (!MEM[clave]) delete MEM[clave];
      guardar(); refrescar();
    });
    panel.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip) {
        chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') !== 'true');
        var campo = chip.closest('.campo'), otra = campo.querySelector('.otra');
        var sel = [].slice.call(campo.querySelectorAll('.chip[aria-pressed="true"]')).map(function (c) { return c.dataset.op; });
        if (otra.value.trim()) sel.push(otra.value.trim());
        if (sel.length) MEM[campo.dataset.clave] = sel.join(', '); else delete MEM[campo.dataset.clave];
        guardar(); refrescar(); return;
      }
      if (e.target.closest('.limpiar')) {
        a.huecos.forEach(function (h) { delete MEM[h.clave]; });
        guardar(); construirPanel(card, a, pre); refrescar();
      }
    });
  }

  /* ---------- tarjetas de prompt ---------- */
  document.querySelectorAll('.prompt').forEach(function (card) {
    var pre = card.querySelector('pre.texto'); if (!pre) return;
    var a = analizar(pre.textContent);
    var btnP = card.querySelector('.personalizar'), panel = card.querySelector('.panel'), estado = card.querySelector('.estado');
    pintar(pre, a);
    if (!a.huecos.length && btnP) btnP.hidden = true;
    var hecho = false;
    btnP && btnP.addEventListener('click', function () {
      if (!hecho) { construirPanel(card, a, pre); hecho = true; }
      var abrir = panel.hidden;
      panel.hidden = !abrir; btnP.setAttribute('aria-expanded', abrir);
      btnP.textContent = abrir ? 'Cerrar' : 'Personalizar';
      card.classList.toggle('abierto', abrir);
      if (abrir) { var f = panel.querySelector('input,textarea,.chip'); f && f.focus({ preventScroll: true }); }
    });
    pre.addEventListener('click', function (e) {
      var s = e.target.closest('[data-h]'); if (!s) return;
      if (panel.hidden) btnP.click();
      var h = a.huecos[+s.dataset.h], c = panel.querySelector('.campo[data-clave="' + CSS.escape(h.clave) + '"]');
      if (c) { c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); var f = c.querySelector('input,textarea'); f && !h.ops && f.focus(); }
    });
    card.querySelector('.copiar').addEventListener('click', function () {
      var t = textoFinal(a), b = this;
      var faltan = a.huecos.filter(function (h) { return !valor(h); }).length;
      function ok() {
        b.textContent = 'Copiado'; b.classList.add('ok');
        estado.textContent = faltan && faltan < a.huecos.length ? 'Te quedan ' + faltan + ' hueco' + (faltan > 1 ? 's' : '') + ' por rellenar en el chat.' : '';
        setTimeout(function () { b.textContent = 'Copiar'; b.classList.remove('ok'); }, 1800);
      }
      function fb() { var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); ok(); }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, fb); else fb();
    });
  });

  /* ---------- buscador de la portada ---------- */
  var q = document.getElementById('q'), r = document.getElementById('res');
  if (q && window.PROMPTS) {
    var D = PROMPTS.map(function (p) { p.n = norm(p.q); return p; });
    q.addEventListener('input', function () {
      var v = norm(q.value); r.innerHTML = '';
      if (!v) { r.hidden = true; return; }
      var w = v.split(' '), hits = D.filter(function (p) { return w.every(function (x) { return p.n.indexOf(x) > -1; }); }).slice(0, 10);
      r.hidden = false;
      if (!hits.length) { r.innerHTML = '<li class="vacio">Nada por aquí. Prueba con otra palabra.</li>'; return; }
      hits.forEach(function (p) {
        var li = document.createElement('li'), a = document.createElement('a'); a.href = p.url;
        a.innerHTML = '<span class="c"></span><span><b></b><small></small></span>';
        a.querySelector('.c').textContent = p.code; a.querySelector('b').textContent = p.name; a.querySelector('small').textContent = p.cap;
        li.appendChild(a); r.appendChild(li);
      });
    });
  }
})();

/* ---------- Escenas con scroll: zoom, parallax y revelado ---------- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement; root.classList.add('js');
  var top = document.querySelector('.top');
  var vh = innerHeight;
  function clamp(x) { return Math.max(0, Math.min(1, x)); }

  // Frase del manifiesto, palabra a palabra
  var frase = document.querySelector('[data-palabras]'), palabras = [];
  if (frase) {
    frase.innerHTML = frase.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    palabras = [].slice.call(frase.querySelectorAll('.w'));
  }
  // Elementos que aparecen al entrar
  var aparecen = document.querySelectorAll('.prompt, .guia, .pl, .zona-buscar, .leyenda, .paso h2, .paso-p, .paso-a, .paso-n, .indice-pl');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px', threshold: .05 });
    aparecen.forEach(function (el) { if (location.hash && el.matches(location.hash)) return; el.setAttribute('data-aparece', ''); io.observe(el); });
  }
  // Capítulo activo en el recorrido (escritorio)
  var figs = document.querySelectorAll('.recorrido-media figure');
  if (figs.length && 'IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var k = e.target.dataset.k;
        figs.forEach(function (f) { f.classList.toggle('on', f.dataset.k === k || (k === 'pl' && f.dataset.k === '7')); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    document.querySelectorAll('.paso').forEach(function (p) { io2.observe(p); });
  }

  var escenas = [].slice.call(document.querySelectorAll('[data-escena]'));
  var pasoImgs = [].slice.call(document.querySelectorAll('.paso-img img, .recorrido-media img'));
  var pend = false;
  function frame() {
    pend = false;
    var y = scrollY;
    if (top) top.classList.toggle('solida', y > vh * 0.6 || !document.querySelector('.escena, .cab-px'));
    if (reduce) return;
    escenas.forEach(function (sc) {
      var r = sc.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var recorrido = sc.offsetHeight - (sc.classList.contains('escena') ? vh : 0);
      var p = clamp(-r.top / Math.max(1, recorrido));
      var img = sc.querySelector('[data-zoom]'), txt = sc.querySelectorAll('[data-fade]');
      if (sc.classList.contains('escena')) {
        if (img) { img.style.transform = 'scale(' + (1.35 - .35 * p).toFixed(4) + ') translate3d(0,' + (-4 * p).toFixed(2) + '%,0)'; img.style.opacity = (1 - Math.max(0, p - .75) * 2.2).toFixed(3); }
        txt.forEach(function (t, i) { t.style.opacity = clamp(1 - p * (i ? 4 : 1.9)).toFixed(3); t.style.transform = (i ? 'translateX(-50%) ' : '') + 'translate3d(0,' + (-90 * p).toFixed(1) + 'px,0)'; });
      } else if (sc.classList.contains('cab-px')) {
        var q = clamp(-r.top / r.height);
        if (img) img.style.transform = 'translate3d(0,' + (q * 32).toFixed(1) + '%,0) scale(' + (1.08 + q * .12).toFixed(4) + ')';
        txt.forEach(function (t) { t.style.opacity = clamp(1 - q * 1.8).toFixed(3); t.style.transform = 'translate3d(0,' + (q * -60).toFixed(1) + 'px,0)'; });
      } else if (sc.classList.contains('manifiesto') && palabras.length) {
        var m = clamp((vh * .85 - r.top) / (r.height * .75));
        var n = Math.round(m * palabras.length);
        palabras.forEach(function (w, i) { w.classList.toggle('on', i < n); });
      }
    });
    pasoImgs.forEach(function (im) {
      var box = im.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) return;
      var c = (box.top + box.height / 2 - vh / 2) / vh;
      im.style.transform = 'translate3d(0,' + (c * -9 - 8).toFixed(2) + '%,0) scale(1.04)';
    });
  }
  function pedir() { if (!pend) { pend = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', function () { vh = innerHeight; pedir(); });
  if (reduce) palabras.forEach(function (w) { w.classList.add('on'); });
  frame();
})();
