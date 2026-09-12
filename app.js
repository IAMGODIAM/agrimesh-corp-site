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

  /* ---------- Contact form: cinematic reference (v2) ----------
     Choreography: idle -> sending (honest progress while the real request is in
     flight) -> success. Attachments are deferred until after a successful
     submit and upload one file per request to the /upload contract:
       POST https://agrimesh-intake.e5enclave.com/upload
       multipart/form-data: submission_id (the `id` from /submit) + file
       -> {ok:true, attachmentId} | {ok:false, error}
     Errors always surface through the single polite live region (#form-status).
     No auto-upload before submit. */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  var btn = document.getElementById('submit-btn');
  var successBox = document.getElementById('form-success');
  var attachStep = document.getElementById('attach-step');
  var fileInput = document.getElementById('file-input');
  var attachList = document.getElementById('attach-list');
  var ENDPOINT = 'https://agrimesh-intake.e5enclave.com/submit';
  var UPLOAD_ENDPOINT = 'https://agrimesh-intake.e5enclave.com/upload';
  var MAX_FILES = 3;
  var MAX_BYTES = 10 * 1024 * 1024;
  var submissionId = '';
  var attachedCount = 0;

  function setStatus(msg, cls) {
    status.textContent = msg;
    status.className = 'form-status' + (cls ? ' ' + cls : '');
  }

  if (!form) return;

  /* Kind inline messages on blur; live-cleared as the user types. */
  function blurValidator(inputId, errId, test, msg) {
    var input = document.getElementById(inputId);
    var err = document.getElementById(errId);
    function run() {
      var bad = !test(input.value.trim());
      err.textContent = bad ? msg : '';
      if (bad) { input.setAttribute('aria-invalid', 'true'); }
      else { input.removeAttribute('aria-invalid'); }
      return !bad;
    }
    input.addEventListener('blur', run);
    input.addEventListener('input', function () { if (err.textContent) run(); });
    return run;
  }
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var checkName = blurValidator('f-name', 'err-name',
    function (v) { return v.length > 0; }, 'Please tell us your name.');
  var checkEmail = blurValidator('f-email', 'err-email',
    function (v) { return emailRe.test(v); }, 'Please enter a valid email address.');
  var checkMsg = blurValidator('f-msg', 'err-msg',
    function (v) { return v.length > 0; }, 'Please include a message.');

  function showSent(id) {
    form.classList.add('is-sent');
    successBox.hidden = false;
    if (id) {
      submissionId = id;
      attachStep.hidden = false;
    }
    /* If the backend did not return an id, the message still went through;
       the attachment step simply stays out of the way. */
    setStatus('Thank you — your message is on its way. We read everything.', 'ok');
    form.reset();
    try { if (window.turnstile) window.turnstile.reset(); } catch (e) {}
  }

  function sendFailed() {
    setStatus('Something didn\u2019t go through — please try again in a moment.', 'err');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    setStatus('', '');

    var valid = [checkName(), checkEmail(), checkMsg()].every(function (v) { return v; });
    if (!valid) { setStatus('Please fix the highlighted fields, then try again.', 'err'); return; }

    var name = document.getElementById('f-name').value.trim();
    var email = document.getElementById('f-email').value.trim();
    var org = document.getElementById('f-org').value.trim();
    var message = document.getElementById('f-msg').value.trim();
    var hp = document.getElementById('f-website').value;

    var token = '';
    try {
      if (window.turnstile) token = window.turnstile.getResponse() || '';
    } catch (e) { /* widget not ready yet */ }
    if (!token) { setStatus('Verification is still loading — please wait a moment and try again.', 'err'); return; }

    btn.disabled = true;
    form.classList.add('is-sending');
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
          showSent(data.id || data.submission_id || '');
        } else {
          sendFailed();
        }
      })
      .catch(sendFailed)
      .then(function () {
        btn.disabled = false;
        form.classList.remove('is-sending');
      });
  });

  /* ---------- Deferred attachments (post-submit only) ---------- */
  function inFlightCount() {
    return attachList.querySelectorAll('.attach-row[data-state="uploading"]').length;
  }

  function attachFailed(li, file, pct) {
    li.setAttribute('data-state', 'err');
    pct.textContent = 'Failed';
    setStatus('\u201c' + file.name + '\u201d couldn\u2019t be attached — please try again.', 'err');
  }

  function uploadFile(file) {
    var li = document.createElement('li');
    li.className = 'attach-row';
    li.setAttribute('data-state', 'uploading');
    var nameEl = document.createElement('span');
    nameEl.className = 'attach-name';
    nameEl.textContent = file.name + ' (' + Math.max(1, Math.round(file.size / 1024)) + ' KB)';
    var pctEl = document.createElement('span');
    pctEl.className = 'attach-pct';
    pctEl.textContent = '0%';
    var bar = document.createElement('span');
    bar.className = 'attach-bar';
    var barFill = document.createElement('span');
    bar.appendChild(barFill);
    li.appendChild(nameEl);
    li.appendChild(pctEl);
    li.appendChild(bar);
    attachList.appendChild(li);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_ENDPOINT);
    xhr.upload.addEventListener('progress', function (e) {
      if (e.lengthComputable) {
        var p = Math.min(100, Math.round(e.loaded / e.total * 100));
        barFill.style.width = p + '%';
        pctEl.textContent = p + '%';
      }
    });
    xhr.addEventListener('load', function () {
      var ok = false;
      try { ok = !!(JSON.parse(xhr.responseText) || {}).ok; } catch (e) {}
      if (xhr.status >= 200 && xhr.status < 300 && ok) {
        li.setAttribute('data-state', 'done');
        pctEl.textContent = 'Attached';
        attachedCount++;
        setStatus('\u201c' + file.name + '\u201d attached.', 'ok');
      } else {
        attachFailed(li, file, pctEl);
      }
    });
    xhr.addEventListener('error', function () { attachFailed(li, file, pctEl); });
    xhr.addEventListener('abort', function () { attachFailed(li, file, pctEl); });

    var fd = new FormData();
    fd.append('submission_id', submissionId);
    fd.append('file', file);
    xhr.send(fd);
  }

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (!submissionId) {
        setStatus('Your message went through, but attachments aren\u2019t available for it right now.', 'err');
        fileInput.value = '';
        return;
      }
      var files = Array.prototype.slice.call(fileInput.files || []);
      fileInput.value = '';
      if (!files.length) return;
      var allowed = MAX_FILES - attachedCount - inFlightCount();
      if (files.length > allowed) {
        setStatus('Up to 3 files can be attached — keeping the first ' +
          (allowed > 0 ? allowed : 'none') + ' of your selection.', 'err');
        files = files.slice(0, Math.max(0, allowed));
      }
      files.forEach(function (file) {
        if (file.size > MAX_BYTES) {
          setStatus('\u201c' + file.name + '\u201d is over 10 MB — please choose a smaller file.', 'err');
          return;
        }
        uploadFile(file);
      });
    });
  }
})();
