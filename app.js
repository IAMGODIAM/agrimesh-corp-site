/* AgriMesh Corporation site — hero mesh animation + contact form. Dependency-free. */
(function () {
  'use strict';

  /* ---------- Cinematic hero: film loop + mesh overlay + parallax ---------- */
  var hero = document.querySelector('.hero');
  var heroMedia = document.querySelector('.hero-media');
  var vA = document.getElementById('heroVideoA');
  var vB = document.getElementById('heroVideoB');
  var canvas = document.getElementById('mesh');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* Gold mesh overlay drifting over the film. */
  if (canvas && canvas.parentElement) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, nodes = [];
    var DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed();
    }

    function seed() {
      nodes = [];
      var n = Math.min(80, Math.floor(W * H / 18000));
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.24, vy: (Math.random() - 0.5) * 0.24,
          r: 1.2 + Math.random() * 1.6,
          gold: Math.random() < 0.5
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      var LINK = 150;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = W + 20; if (a.x > W + 20) a.x = -20;
        if (a.y < -20) a.y = H + 20; if (a.y > H + 20) a.y = -20;
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            var alpha = (1 - d / LINK) * 0.3;
            ctx.strokeStyle = 'rgba(227,200,120,' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < nodes.length; k++) {
        var p = nodes[k];
        ctx.fillStyle = p.gold ? 'rgba(227,200,120,0.9)' : 'rgba(143,195,154,0.55)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    if (reduced) {
      // Static, dignified frame.
      ctx.fillStyle = 'rgba(227,200,120,0.55)';
      for (var s = 0; s < 46; s++) {
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      frame();
    }
  }

  /* Seamless crossfading loop between two identical video elements. */
  var FADE = 1.6;
  if (!reduced && vA && vB) {
    var front = vA, back = vB, fading = false;

    function playFront() {
      if (document.hidden) return;
      front.classList.add('is-front');
      var p = front.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
    }

    function arm(video) {
      video.addEventListener('timeupdate', function () {
        if (!fading && video === front && video.duration &&
            video.duration - video.currentTime <= FADE) {
          fading = true;
          try { back.currentTime = 0; } catch (e) {}
          back.classList.add('is-front');
          var p = back.play();
          if (p && p.catch) p.catch(function () {});
        }
      });
      video.addEventListener('ended', function () {
        if (video === front) {
          video.classList.remove('is-front');
          try { video.pause(); } catch (e) {}
          var t = front; front = back; back = t;
          fading = false;
        }
      });
    }
    arm(vA); arm(vB);

    if ('IntersectionObserver' in window && hero) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { playFront(); }
        else { try { front.pause(); } catch (e) {} }
      }, { threshold: 0.05 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { try { front.pause(); } catch (e) {} }
      else { playFront(); }
    });

    playFront();
  }

  /* Slow parallax drift on the film (desktop pointers only). */
  if (hero && heroMedia && finePointer && !reduced) {
    var tX = 0, tY = 0, cX = 0, cY = 0;
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      tX = ((e.clientX - r.left) / r.width - 0.5) * 26;
      tY = ((e.clientY - r.top) / r.height - 0.5) * 18;
    });
    hero.addEventListener('mouseleave', function () { tX = 0; tY = 0; });
    (function drift() {
      cX += (tX - cX) * 0.055;
      cY += (tY - cY) * 0.055;
      heroMedia.style.transform = 'translate3d(' + cX.toFixed(2) + 'px,' + cY.toFixed(2) +
        'px,0) scale(1.06)';
      requestAnimationFrame(drift);
    })();
  }

  /* ---------- Cinematic glass header ---------- */
  var header = document.getElementById('siteHeader');
  var navToggle = header ? header.querySelector('.nav-toggle') : null;
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle('scrolled', window.scrollY > 48);
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();
  }
  if (header && navToggle) {
    var setNavOpen = function (open) {
      header.classList.toggle('nav-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    navToggle.addEventListener('click', function () {
      setNavOpen(!header.classList.contains('nav-open'));
    });
    var navLinks = header.querySelectorAll('.site-nav a');
    for (var ni = 0; ni < navLinks.length; ni++) {
      navLinks[ni].addEventListener('click', function () { setNavOpen(false); });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNavOpen(false);
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  var btn = document.getElementById('submit-btn');
  var ENDPOINT = 'https://agrimesh-intake.e5enclave.com/submit';

  function setStatus(msg, cls) {
    status.textContent = msg;
    status.className = 'form-status' + (cls ? ' ' + cls : '');
  }

  if (!form) return;

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    setStatus('', '');

    var name = document.getElementById('f-name').value.trim();
    var email = document.getElementById('f-email').value.trim();
    var org = document.getElementById('f-org').value.trim();
    var message = document.getElementById('f-msg').value.trim();
    var hp = document.getElementById('f-website').value;

    if (!name) { setStatus('Please tell us your name.', 'err'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setStatus('Please enter a valid email address.', 'err'); return; }
    if (!message) { setStatus('Please include a message.', 'err'); return; }

    var token = '';
    try {
      if (window.turnstile) token = window.turnstile.getResponse() || '';
    } catch (e) { /* widget not ready yet */ }
    if (!token) { setStatus('Verification is still loading — please wait a moment and try again.', 'err'); return; }

    btn.disabled = true;
    setStatus('Sending…', '');

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: name, email: email, organization: org, message: message,
        website: hp, turnstileToken: token, source: 'agrimesh.org'
      })
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (data) {
        if (data && data.ok) {
          setStatus('Thank you — your message is on its way. We read everything.', 'ok');
          form.reset();
          try { if (window.turnstile) window.turnstile.reset(); } catch (e) {}
        } else {
          setStatus('Something didn\u2019t go through — please try again in a moment.', 'err');
        }
      })
      .catch(function () {
        setStatus('Something didn\u2019t go through — please try again in a moment.', 'err');
      })
      .then(function () { btn.disabled = false; });
  });
})();
