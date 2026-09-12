/* AgriMesh Corporation site — hero mesh animation + contact form. Dependency-free. */
(function () {
  'use strict';

  /* ---------- Hero mesh canvas ---------- */
  var canvas = document.getElementById('mesh');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (canvas && !reduced) {
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
      var n = Math.min(90, Math.floor(W * H / 16000));
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
          r: 1.4 + Math.random() * 1.8,
          gold: Math.random() < 0.28
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
            var alpha = (1 - d / LINK) * 0.22;
            ctx.strokeStyle = 'rgba(201,162,74,' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < nodes.length; k++) {
        var p = nodes[k];
        ctx.fillStyle = p.gold ? 'rgba(227,200,120,0.85)' : 'rgba(143,195,154,0.6)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    frame();
  } else if (canvas && reduced) {
    // Static, dignified fallback: draw one frame of nodes without motion.
    var c2 = canvas.getContext('2d');
    var r2 = canvas.parentElement.getBoundingClientRect();
    canvas.width = r2.width; canvas.height = r2.height;
    c2.fillStyle = 'rgba(201,162,74,0.5)';
    for (var s = 0; s < 40; s++) {
      c2.beginPath();
      c2.arc(Math.random() * r2.width, Math.random() * r2.height, 2, 0, Math.PI * 2);
      c2.fill();
    }
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
