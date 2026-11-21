/* Beweging voor het voorbeeld van Wildlife Images.
   Eigen script, niets van buiten. Werkt alleen als de kop .beweeg heeft gezet;
   anders blijft de pagina stil en volledig zichtbaar. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  if (!root.classList.contains('beweeg')) return;

  function opslaan(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function wissen(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  /* 1. Paginawissel */
  var paneel = d.querySelector('.overgang');
  if (!paneel) { paneel = d.createElement('div'); paneel.className = 'overgang'; paneel.setAttribute('aria-hidden', 'true'); d.body.appendChild(paneel); }
  if (root.classList.contains('binnenkomst')) {
    wissen('wi-overgang');
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      paneel.classList.add('open'); root.classList.remove('binnenkomst');
    }); });
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return; /* anker op dezelfde pagina */
    if (!/(\.html|\/)$/.test(url.pathname)) return;
    e.preventDefault();
    opslaan('wi-overgang', '1');
    paneel.className = 'overgang'; void paneel.offsetHeight; paneel.classList.add('sluit');
    setTimeout(function () { location.href = url.href; }, 720);
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { paneel.className = 'overgang'; root.classList.remove('binnenkomst'); }
  });

  /* 2. Kop weg bij naar beneden, terug bij omhoog */
  var kop = d.querySelector('header.top'), vorige = window.scrollY;

  /* 3. Binnenvallen: elementen krijgen automatisch .op en vallen kort na elkaar in */
  var kies = 'section h2, section .lead, .drie>div, .kaarten>.kaart, .twee>img, .citaten>blockquote, .prak>div, .media a, .lijst li, .galerij img, figure.ai, .video, .strook img, .index li, .hero .wrap>*, .reis-tekst, [data-op]';
  var lijst = [].slice.call(d.querySelectorAll(kies)).filter(function (el) {
    return !el.closest('.opening') && !el.closest('[data-woorden]');
  });
  lijst.forEach(function (el) { el.classList.add('op'); });
  var io = new IntersectionObserver(function (items) {
    var nieuw = items.filter(function (it) { return it.isIntersecting; });
    nieuw.forEach(function (it, i) {
      it.target.style.transitionDelay = Math.min(i * 80, 480) + 'ms';
      it.target.classList.add('in');
      io.unobserve(it.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  lijst.forEach(function (el) { io.observe(el); });

  /* 4. Woorden van een citaat een voor een */
  [].forEach.call(d.querySelectorAll('[data-woorden]'), function (bq) {
    var n = 0;
    [].slice.call(bq.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var frag = d.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (stuk) {
        if (!stuk) return;
        if (/^\s+$/.test(stuk)) { frag.appendChild(d.createTextNode(stuk)); return; }
        var s = d.createElement('span'); s.className = 'w'; s.style.setProperty('--i', n++); s.textContent = stuk; frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    var cite = bq.querySelector('cite');
    if (cite) { cite.classList.add('op'); }
    var o = new IntersectionObserver(function (it) {
      if (!it[0].isIntersecting) return;
      bq.classList.add('in');
      if (cite) { cite.style.transitionDelay = (n * 45 + 200) + 'ms'; cite.classList.add('in'); }
      o.disconnect();
    }, { threshold: 0.3 });
    o.observe(bq);
  });

  /* 5. Scroll-gekoppeld: veeg-onthulling en parallax */
  var veeg = [].slice.call(d.querySelectorAll('.veeg'));
  var para = [].slice.call(d.querySelectorAll('.parallax .pl'));
  var wacht = false;
  function rek() {
    wacht = false;
    var h = window.innerHeight, y = window.scrollY;
    if (kop) {
      if (y > vorige + 6 && y > 240) kop.classList.add('weg');
      else if (y < vorige - 6 || y < 240) kop.classList.remove('weg');
    }
    vorige = y;
    veeg.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = (h - r.top) / (Math.min(r.height, h) * 0.9 + h * 0.1);
      p = Math.max(0, Math.min(1, p));
      el.style.setProperty('--p', p.toFixed(4));
    });
    para.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h) return;
      var t = (h - r.top) / (h + r.height);
      img.style.transform = 'translate3d(0,' + ((t - 0.5) * -20).toFixed(2) + '%,0)';
    });
  }
  function plan() { if (!wacht) { wacht = true; requestAnimationFrame(rek); } }
  window.addEventListener('scroll', plan, { passive: true });
  window.addEventListener('resize', plan);
  rek();

  /* 6. Opening: gordijn en wisselende foto's */
  var opening = d.querySelector('.opening');
  if (opening) {
    var dias = [].slice.call(opening.querySelectorAll('.dia'));
    var tekst = opening.querySelector('.bijschrift .tekst');
    var nr = opening.querySelector('.bijschrift .nr');
    var delen = [].slice.call(opening.querySelectorAll('.wrap>*'));
    var nu = 0, z = 1, inBeeld = true;
    delen.forEach(function (el) { el.classList.add('op'); });

    function toon(k) {
      var dia = dias[k];
      dia.style.zIndex = ++z;
      dia.classList.remove('actief'); void dia.offsetWidth; dia.classList.add('actief');
      setTimeout(function () { dias.forEach(function (o, j) { if (j !== k) o.classList.remove('actief'); }); }, 1500);
      if (tekst) {
        tekst.classList.add('wissel');
        setTimeout(function () { tekst.textContent = dia.getAttribute('data-bijschrift') || ''; tekst.classList.remove('wissel'); }, 500);
      }
      if (nr) nr.textContent = ('0' + (k + 1)).slice(-2) + ' / ' + ('0' + dias.length).slice(-2);
      nu = k;
    }
    function start() {
      toon(0);
      delen.forEach(function (el, i) { el.style.transitionDelay = (300 + i * 120) + 'ms'; el.classList.add('in'); });
      setInterval(function () {
        if (d.hidden || !inBeeld || dias.length < 2) return;
        toon((nu + 1) % dias.length);
      }, 5500);
    }
    new IntersectionObserver(function (it) { inBeeld = it[0].isIntersecting; }).observe(opening);

    var gordijn = d.querySelector('.gordijn');
    if (gordijn && root.classList.contains('intro')) {
      opslaan('wi-gezien', '1');
      setTimeout(function () {
        gordijn.classList.add('open');
        start();
        setTimeout(function () { gordijn.classList.add('klaar'); root.classList.remove('intro'); }, 1400);
      }, 650);
    } else {
      start();
    }
  }

  /* 7. Voorbeeldfoto die met de muis meebeweegt bij de lijst */
  var index = d.querySelector('.index');
  if (index && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    var zweef = d.createElement('div'); zweef.className = 'zweef'; zweef.setAttribute('aria-hidden', 'true');
    var zImg = d.createElement('img'); zImg.alt = ''; zweef.appendChild(zImg); d.body.appendChild(zweef);
    var mx = 0, my = 0, zx = 0, zy = 0, loopt = false;
    function volg() {
      zx += (mx - zx) * 0.14; zy += (my - zy) * 0.14;
      zweef.style.transform = 'translate3d(' + (zx + 28).toFixed(1) + 'px,' + (zy - 110).toFixed(1) + 'px,0)';
      if (Math.abs(mx - zx) > 0.3 || Math.abs(my - zy) > 0.3 || zweef.classList.contains('zichtbaar')) requestAnimationFrame(volg);
      else loopt = false;
    }
    index.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!loopt) { loopt = true; requestAnimationFrame(volg); }
    });
    [].forEach.call(index.querySelectorAll('a'), function (a) {
      a.addEventListener('mouseenter', function (e) {
        var duim = a.querySelector('.i-duim');
        if (duim) zImg.src = duim.currentSrc || duim.src;
        if (!zweef.classList.contains('zichtbaar')) { mx = zx = e.clientX; my = zy = e.clientY; }
        zweef.classList.add('zichtbaar');
        if (!loopt) { loopt = true; requestAnimationFrame(volg); }
      });
    });
    index.addEventListener('mouseleave', function () { zweef.classList.remove('zichtbaar'); });
  }
})();
