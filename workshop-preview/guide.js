// Workshop course shell: sidebar, progress, checkpoints. No dependencies.
(function () {
  'use strict';

  var COURSE = [
    { href: 'index.html', title: 'Course home', mins: 0, checks: 0, node: '⌂' },
    { href: '0-the-idea.html', title: 'Agents, and why Hermes', mins: 6, checks: 1, node: 'i' },
    { href: '1-stand-it-up.html', title: 'Stand it up', mins: 30, checks: 5, node: '1' },
    { href: '2-personalize-it.html', title: 'Personalize it', mins: 20, checks: 5, node: '2' },
    { href: '3-relationship-agent.html', title: 'The personal EA + CRM', mins: 75, checks: 3, node: '3' },
  ];

  var dir = location.pathname.replace(/[^/]*$/, '');
  var file = location.pathname.slice(dir.length) || 'index.html';

  function store(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
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
    var next = null;
    for (var i = 1; i < COURSE.length; i++) {
      if (checkedCount(COURSE[i]) < COURSE[i].checks) { next = COURSE[i]; break; }
    }
    var p = progress();
    if (next) {
      var box = document.createElement('div');
      box.className = 'continue';
      box.innerHTML =
        '<div><strong>' + (p.done ? 'Pick up where you left off' : 'Ready when you are') + '</strong>' +
        '<div class="sub">' + (p.done ? p.done + ' of ' + p.total + ' checkpoints done.' : 'Work through it at your own pace.') + '</div></div>' +
        '<a class="cta" href="' + next.href + '">' + (p.done ? 'Continue' : 'Start') + ': ' + next.title + ' →</a>';
      var header = wrap.querySelector('header');
      header.insertAdjacentElement('afterend', box);
    }
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
    });
  });

  paint();
})();
