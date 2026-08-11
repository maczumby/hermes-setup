// Workshop course shell: sidebar, progress, checkpoints. No dependencies.
(function () {
  'use strict';

  // Pages can override the course map (the invite-only Part 2 page does this
  // to include its own unlisted URL in the rail).
  var COURSE = window.GUIDE_COURSE || [
    { href: 'index.html', title: 'Course home', mins: 0, checks: 0, node: '⌂' },
    { href: '0-the-idea.html', title: 'Agents, and why Hermes', mins: 6, checks: 1, node: 'i' },
    { href: '1-stand-it-up.html', title: 'Stand it up', mins: 30, checks: 5, node: '1' },
    { href: '2-personalize-it.html', title: 'Personalize it', mins: 20, checks: 5, node: '2' },
  ];

  var dir = location.pathname.replace(/[^/]*$/, '');
  var file = location.pathname.slice(dir.length) || 'index.html';

  function store(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  // ── Gate: name/email before the guide opens, plus view logging ───
  // Fails open on purpose: if the Worker is unreachable, the guide
  // still loads and the visit just isn't recorded.
  var GATE = {
    enabled: false, // flip to true to turn the gate on for everyone
    endpoint: 'https://workshop-gate.mari-network-observatory.workers.dev',
    days: 7
  };

  function gateActive() {
    try {
      var q = location.search;
      if (/[?&]gate=1\b/.test(q)) sessionStorage.setItem('gate:test', '1');
      if (/[?&]gate=0\b/.test(q)) sessionStorage.removeItem('gate:test');
      if (sessionStorage.getItem('gate:test') === '1') return true;
    } catch (e) {}
    return GATE.enabled;
  }

  function identity() {
    try {
      var id = JSON.parse(localStorage.getItem('gate:id') || 'null');
      if (!id || !id.email) return null;
      if (Date.now() - (id.ts || 0) > GATE.days * 864e5) return null;
      return id;
    } catch (e) { return null; }
  }

  function send(path, data) {
    try {
      var body = JSON.stringify(data);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(GATE.endpoint + path, new Blob([body], { type: 'text/plain' }));
      } else if (window.fetch) {
        fetch(GATE.endpoint + path, { method: 'POST', body: body, keepalive: true }).catch(function () {});
      }
    } catch (e) {}
  }

  function showGate() {
    var overlay = document.createElement('div');
    overlay.className = 'gate';
    overlay.innerHTML =
      '<div class="gate-card">' +
      '<div class="gate-brand"><span class="co">Filament workshop</span>Build your agent</div>' +
      '<h2>Before you open the guide</h2>' +
      '<p>This guide is free. I just like to know who’s using it. Your name and email and you’re in.</p>' +
      '<form novalidate>' +
      '<label>Name<input type="text" name="name" autocomplete="name" maxlength="120"></label>' +
      '<label>Email<input type="email" name="email" autocomplete="email" maxlength="120" required></label>' +
      '<p class="gate-err" hidden>That email doesn’t look right.</p>' +
      '<label class="gate-check"><input type="checkbox" name="emailOk"> Okay to email me about future workshops</label>' +
      '<button type="submit">Open the guide</button>' +
      '</form>' +
      '<p class="gate-fine">I use this to see who’s working through the guide and to occasionally share workshop updates. No spam, and your info never gets shared.</p>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.classList.add('gated');
    var form = overlay.querySelector('form');
    var err = overlay.querySelector('.gate-err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        err.hidden = false;
        form.email.focus();
        return;
      }
      try { localStorage.setItem('gate:id', JSON.stringify({ name: name, email: email, ts: Date.now() })); } catch (e2) {}
      send('/register', { name: name, email: email, emailOk: form.emailOk.checked });
      send('/view', { email: email, path: location.pathname, t: 'view' });
      document.body.classList.remove('gated');
      overlay.remove();
    });
    overlay.querySelector('input[name="name"]').focus();
  }

  if (gateActive()) {
    var visitor = identity();
    if (visitor) send('/view', { email: visitor.email, path: location.pathname, t: 'view' });
    else showGate();
  }
  function checkedCount(mod) {
    var page = dir + mod.href;
    var n = 0;
    for (var i = 0; i < mod.checks; i++) {
      if (store('guide:' + page + ':' + i) === '1') n++;
    }
    return n;
  }
  function progress() {
    var done = 0, total = 0;
    COURSE.forEach(function (m) { total += m.checks; done += checkedCount(m); });
    return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
  }

  // ── Build the shell ──────────────────────────────────────────────
  var wrap = document.querySelector('.wrap');
  if (!wrap) return;

  var shell = document.createElement('div');
  shell.className = 'shell';

  var rail = document.createElement('aside');
  rail.className = 'rail';
  rail.setAttribute('aria-label', 'Course navigation');
  rail.innerHTML =
    '<div class="rail-brand"><span class="co">Filament workshop</span>Build your agent</div>' +
    '<div class="rail-progress"><div class="bar" role="progressbar" aria-label="Course progress"><i></i></div>' +
    '<div class="bar-label"></div></div>' +
    '<ol class="rail-nav"></ol>' +
    '<div class="rail-foot">Stuck? Raise your hand.<br>Or send us a message in Filament.</div>';

  var nav = rail.querySelector('.rail-nav');
  COURSE.forEach(function (mod, idx) {
    var li = document.createElement('li');
    li.className = 'rail-item';
    var got = checkedCount(mod);
    if (mod.checks && got === mod.checks) li.classList.add('done');
    else if (got > 0) li.classList.add('lit');
    if (mod.href === file) li.classList.add('here');
    var label = mod.node || String(idx);
    var meta = mod.checks
      ? (got + '/' + mod.checks)
      : 'start here';
    li.innerHTML =
      '<a href="' + mod.href + '"><span class="node">' + label + '</span>' +
      '<span><span class="t">' + mod.title + '</span><span class="m">' + meta + '</span></span></a>';
    nav.appendChild(li);
  });

  var topbar = document.createElement('div');
  topbar.className = 'topbar';
  var current = COURSE.filter(function (m) { return m.href === file; })[0];
  topbar.innerHTML =
    '<button class="burger" aria-label="Open course menu" aria-expanded="false">☰</button>' +
    '<span class="where">' + (current ? current.title : 'Build your agent') + '</span>' +
    '<div class="bar"><i></i></div>';

  var scrim = document.createElement('div');
  scrim.className = 'scrim';

  var main = document.createElement('div');
  main.className = 'content';
  wrap.parentNode.insertBefore(shell, wrap);
  main.appendChild(topbar);
  main.appendChild(wrap);
  shell.appendChild(rail);
  shell.appendChild(main);
  document.body.appendChild(scrim);

  function paint() {
    var p = progress();
    document.querySelectorAll('.bar i').forEach(function (i) { i.style.width = p.pct + '%'; });
    var label = rail.querySelector('.bar-label');
    label.textContent = p.done + ' of ' + p.total + ' checkpoints · ' + p.pct + '%';
    COURSE.forEach(function (mod, idx) {
      var li = nav.children[idx];
      var got = checkedCount(mod);
      li.classList.toggle('done', mod.checks > 0 && got === mod.checks);
      li.classList.toggle('lit', got > 0 && got < mod.checks);
      if (mod.checks) li.querySelector('.m').textContent = got + '/' + mod.checks;
    });
  }

  // Drawer
  var burger = topbar.querySelector('.burger');
  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }
  burger.addEventListener('click', function () { setNav(!document.body.classList.contains('nav-open')); });
  scrim.addEventListener('click', function () { setNav(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });

  // Module meta under the kicker on lesson pages
  if (current && current.checks) {
    var kicker = wrap.querySelector('header .kicker');
    if (kicker) {
      var numberedTotal = COURSE.filter(function (m) { return /^\d+$/.test(m.node || ''); }).length;
      var meta = document.createElement('p');
      meta.className = 'module-meta';
      meta.textContent = /^\d+$/.test(current.node || '')
        ? 'Module ' + current.node + ' of ' + numberedTotal
        : 'Read this first';
      kicker.insertAdjacentElement('afterend', meta);
    }
  }

  // Pager: style the forward link
  document.querySelectorAll('.pager a').forEach(function (a) {
    var d = a.querySelector('.dir');
    if (d && /next|done/i.test(d.textContent)) a.classList.add('next');
  });

  // Course home: continue card + node decoration on the module list
  if (file === 'index.html' || file === '') {
    var paths = document.querySelectorAll('.paths .path');
    paths.forEach(function (card, i) {
      var mod = COURSE[i + 1];
      if (!mod) return;
      var node = document.createElement('span');
      node.className = 'node';
      node.textContent = mod.node || String(i + 1);
      card.insertBefore(node, card.firstChild);
      if (checkedCount(mod) === mod.checks) card.classList.add('done');
    });
  }

  // Copy buttons
  document.querySelectorAll('.code').forEach(function (block) {
    var btn = block.querySelector('.copy');
    var code = block.querySelector('code');
    if (!btn || !code) return;
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(code.innerText).then(function () {
        btn.textContent = 'Copied';
        btn.classList.add('done');
        setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1600);
      });
    });
  });

  // Screenshot placeholders. The error event can fire before this script
  // runs, so also check the already-settled state.
  document.querySelectorAll('figure.shot img').forEach(function (img) {
    function missing() { img.closest('figure').classList.add('missing'); }
    img.addEventListener('error', missing);
    if (img.complete && img.naturalWidth === 0) missing();
  });

  // Checkpoints (existing key scheme kept)
  document.querySelectorAll('.checkpoint input[type="checkbox"]').forEach(function (box, i) {
    var key = 'guide:' + location.pathname + ':' + i;
    if (store(key) === '1') box.checked = true;
    box.addEventListener('change', function () {
      try { localStorage.setItem(key, box.checked ? '1' : '0'); } catch (e) {}
      paint();
      if (gateActive() && current) {
        var who = identity();
        if (who) send('/view', { email: who.email, path: location.pathname, t: 'check', done: checkedCount(current), total: current.checks });
      }
    });
  });

  paint();
})();
