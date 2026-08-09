// Workshop gate: records who opened the guide and how far they got,
// and serves Mari a private stats page. One Worker, one KV namespace.
//
// Routes:
//   POST /register        {name, email, emailOk}
//   POST /view            {email, path, t:'view'} or {email, path, t:'check', done, total}
//   GET  /stats-<slug>    private stats page; slug comes from the STATS_SLUG secret
//
// POST bodies arrive as text/plain JSON so browsers skip the CORS preflight
// (navigator.sendBeacon with a JSON content type would be blocked otherwise).

const COURSE = [
  { path: 'index.html', title: 'Course home', order: 0 },
  { path: '0-the-idea.html', title: 'Agents, and why Hermes', order: 1 },
  { path: '1-stand-it-up.html', title: 'Stand it up', order: 2 },
  { path: '2-personalize-it.html', title: 'Personalize it', order: 3 },
  { path: '3-relationship-agent.html', title: 'The personal EA + CRM', order: 4 },
];

function pageOf(path) {
  const file = (path || '').split('/').pop() || 'index.html';
  return COURSE.find((c) => c.path === file) || null;
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim());
  const h = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(data, status, extra) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...(extra || {}) },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(s, max) {
  return String(s || '').trim().slice(0, max || 200);
}

async function readBody(request) {
  try {
    return JSON.parse(await request.text());
  } catch (e) {
    return null;
  }
}

async function handleRegister(request, env) {
  const cors = corsHeaders(request, env);
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'bad body' }, 400, cors);
  const email = clean(body.email, 120).toLowerCase();
  const name = clean(body.name, 120);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'bad email' }, 400, cors);

  const key = 'person:' + email;
  const now = Date.now();
  let person = null;
  try {
    person = await env.LOG.get(key, 'json');
  } catch (e) {}
  const record = {
    name: name || (person && person.name) || '',
    email,
    emailOk: !!body.emailOk,
    firstSeen: (person && person.firstSeen) || now,
    lastSeen: now,
    registrations: ((person && person.registrations) || 0) + 1,
  };
  await env.LOG.put(key, JSON.stringify(record));
  await logEvent(env, { t: 'register', email, name, ts: now });
  return json({ ok: true }, 200, cors);
}

async function handleView(request, env) {
  const cors = corsHeaders(request, env);
  const body = await readBody(request);
  if (!body) return json({ ok: false }, 400, cors);
  const email = clean(body.email, 120).toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ ok: false }, 400, cors);
  const ev = {
    t: body.t === 'check' ? 'check' : 'view',
    email,
    path: clean(body.path, 200),
    ts: Date.now(),
  };
  if (ev.t === 'check') {
    ev.done = Math.max(0, Math.min(99, parseInt(body.done, 10) || 0));
    ev.total = Math.max(0, Math.min(99, parseInt(body.total, 10) || 0));
  }
  await logEvent(env, ev);
  return json({ ok: true }, 200, cors);
}

async function logEvent(env, ev) {
  // Timestamp-ordered key; the whole event rides in KV metadata so the stats
  // page can aggregate from a single list() without per-key reads.
  const key = 'ev:' + String(ev.ts).padStart(14, '0') + ':' + Math.random().toString(36).slice(2, 8);
  await env.LOG.put(key, '1', { metadata: ev });
}

async function loadAll(env) {
  const people = [];
  const events = [];
  let cursor;
  do {
    const page = await env.LOG.list({ cursor, limit: 1000 });
    for (const k of page.keys) {
      if (k.name.startsWith('ev:') && k.metadata) events.push(k.metadata);
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  cursor = undefined;
  do {
    const page = await env.LOG.list({ prefix: 'person:', cursor, limit: 1000 });
    for (const k of page.keys) {
      const p = await env.LOG.get(k.name, 'json');
      if (p) people.push(p);
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return { people, events };
}

function aggregate(people, events) {
  const byEmail = new Map();
  for (const p of people) byEmail.set(p.email, { ...p, visits: 0, lastSeen: p.lastSeen, furthest: null, checks: new Map() });
  for (const ev of events) {
    let row = byEmail.get(ev.email);
    if (!row) {
      row = { name: '', email: ev.email, emailOk: false, firstSeen: ev.ts, lastSeen: ev.ts, visits: 0, furthest: null, checks: new Map() };
      byEmail.set(ev.email, row);
    }
    row.lastSeen = Math.max(row.lastSeen || 0, ev.ts);
    const page = pageOf(ev.path);
    if (ev.t === 'view') {
      row.visits++;
      if (page && (!row.furthest || page.order > row.furthest.order)) row.furthest = page;
    }
    if (ev.t === 'check' && page) {
      const prev = row.checks.get(page.path) || 0;
      row.checks.set(page.path, Math.max(prev, ev.done));
      if (!row.furthest || page.order > row.furthest.order) row.furthest = page;
    }
  }
  const rows = [...byEmail.values()].map((r) => ({
    ...r,
    checkpoints: [...r.checks.values()].reduce((a, b) => a + b, 0),
  }));
  rows.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  return rows;
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function statsPage(rows, events) {
  const totalPeople = rows.length;
  const week = Date.now() - 7 * 864e5;
  const activeWeek = rows.filter((r) => (r.lastSeen || 0) > week).length;
  const recent = events.slice(-30).reverse();
  const tr = rows
    .map(
      (r) => `<tr>
<td><strong>${esc(r.name) || '<span class="dim">no name</span>'}</strong><br><span class="dim">${esc(r.email)}</span></td>
<td data-ts="${r.firstSeen || ''}"></td>
<td data-ts="${r.lastSeen || ''}"></td>
<td class="num">${r.visits}</td>
<td>${r.furthest ? esc(r.furthest.title) : '<span class="dim">—</span>'}</td>
<td class="num">${r.checkpoints || 0}</td>
<td>${r.emailOk ? 'yes' : 'no'}</td>
</tr>`
    )
    .join('');
  const feed = recent
    .map((ev) => {
      const page = pageOf(ev.path);
      const what =
        ev.t === 'register' ? 'signed in at the gate' : ev.t === 'check' ? `checked ${ev.done}/${ev.total} on ${page ? esc(page.title) : esc(ev.path)}` : `opened ${page ? esc(page.title) : esc(ev.path)}`;
      return `<li><span data-ts="${ev.ts}"></span> · <strong>${esc(ev.email)}</strong> ${what}</li>`;
    })
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Workshop guide — who's reading</title>
<style>
:root{--ground:#f4f3ee;--ink:#1a222e;--accent:#d94717;--line:rgba(26,34,46,.14)}
body{margin:0;background:var(--ground);color:var(--ink);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:32px 20px}
.wrap{max-width:980px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px}
.sub{color:rgba(26,34,46,.65);margin:0 0 24px}
.tiles{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}
.tile{background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px 18px;min-width:140px}
.tile .n{font-size:26px;font-weight:700}
.tile .l{font-size:12px;color:rgba(26,34,46,.6)}
.tablewrap{overflow-x:auto;background:#fff;border:1px solid var(--line);border-radius:10px}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:rgba(26,34,46,.55)}
tr:last-child td{border-bottom:none}
.num{text-align:right;font-variant-numeric:tabular-nums}
.dim{color:rgba(26,34,46,.45)}
h2{font-size:16px;margin:28px 0 10px}
ul.feed{list-style:none;padding:0;margin:0;font-size:14px}
ul.feed li{padding:6px 0;border-bottom:1px solid var(--line)}
</style></head><body><div class="wrap">
<h1>Who's reading the workshop guide</h1>
<p class="sub">Each row is a person who signed in at the gate. "Furthest page" is the deepest module they opened; checkpoints are the boxes they ticked. Times are shown in your local time zone.</p>
<div class="tiles">
<div class="tile"><div class="n">${totalPeople}</div><div class="l">people total</div></div>
<div class="tile"><div class="n">${activeWeek}</div><div class="l">active this week</div></div>
<div class="tile"><div class="n">${events.filter((e) => e.t === 'view').length}</div><div class="l">page views</div></div>
</div>
<div class="tablewrap"><table>
<thead><tr><th>Person</th><th>First seen</th><th>Last seen</th><th class="num">Views</th><th>Furthest page</th><th class="num">Checkpoints</th><th>Email ok</th></tr></thead>
<tbody>${tr || '<tr><td colspan="7" class="dim">Nobody yet. Share the link and this fills in.</td></tr>'}</tbody>
</table></div>
<h2>Recent activity</h2>
<ul class="feed">${feed || '<li class="dim">Nothing yet.</li>'}</ul>
<script>
document.querySelectorAll('[data-ts]').forEach(function(el){
  var t=parseInt(el.getAttribute('data-ts'),10);
  if(t) el.textContent=new Date(t).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
});
</script>
</div></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (request.method === 'POST' && url.pathname === '/register') return handleRegister(request, env);
    if (request.method === 'POST' && url.pathname === '/view') return handleView(request, env);

    if (request.method === 'GET' && env.STATS_SLUG && url.pathname === '/stats-' + env.STATS_SLUG) {
      const { people, events } = await loadAll(env);
      const rows = aggregate(people, events);
      return new Response(statsPage(rows, events), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
