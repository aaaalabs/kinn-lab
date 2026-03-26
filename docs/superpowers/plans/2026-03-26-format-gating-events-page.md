# Format-Gating & Events-Seite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a gated events page on lab.kinn.at with Hero-Donnerstag, secondary TALK/KURS cards (locked/unlocked), cross-domain auth via kinn.at magic link, and a voting teaser widget.

**Architecture:** Events-Seite at `/events/index.html` (redesign of existing page). Single API endpoint `/api/events/gated` reads from Redis (kinn:event:* + attendance cache + whitelist set). Auth via cross-domain redirect to kinn.at magic-link flow, token extracted from URL hash on return. Voting teaser reads existing `/api/voting/top-topics`.

**Tech Stack:** Vanilla HTML/CSS/JS, Vercel Serverless Functions (Node.js), Upstash Redis, Luma API (via cached attendance data)

**Spec:** `docs/superpowers/specs/2026-03-26-format-gating-events-page.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/redis-typed.js` | Modify | Add `sismember` to `raw()` accessor |
| `api/events/gated.js` | Create | Events + verify endpoint |
| `events/index.html` | Rewrite | Events page with gating UI |
| `events/events.js` | Create | Page logic (auth, fetch, render, modals) |

**Out of scope (separate task):**
- Phase 0: Luma unlisted + require approval (manual Luma config)
- Phase 0: Pre-2026 Whitelist befüllen (manuell, `SADD kinn:verified:whitelist email1 email2 ...`)
- Phase 2: Voting modal (full voting UI — only teaser in this plan)
- Phase 3: Make.com automation

**Prerequisites:**
1. **Verify `type` field exists on event data.** Run: `curl /api/events/feedback | jq '.events[].type'`. All events must have `type` set (chapter/talk/kurs). If not, update Redis hashes before proceeding.
2. **TALK/KURS events must exist in Redis** with `type: "talk"` or `type: "kurs"` to test gating. If none exist, create test entries.

**Task order:** 1 (Redis) → 2 (API) → 3 (HTML/CSS) → 4 (JS) → 5 (kinn.at redirect) + 6 (CSP) → 7 (Integration test). Tasks 5+6 must be deployed before auth flow works end-to-end, but Tasks 1-4 can be built and committed independently.

---

## Task 1: Add `sismember` to raw() Redis accessor

**Files:**
- Modify: `lib/redis-typed.js:224-241` (raw() method)

- [ ] **Step 1: Add sismember to raw() return object**

In `lib/redis-typed.js`, add `sismember` to the `raw()` method's return object:

```js
// Inside raw() method, add after the zcard line:
sismember: (key, member) => r.sismember(key, member).then(v => v === 1 || v === true),
scard: (key) => r.scard(key),
```

- [ ] **Step 2: Verify no syntax errors**

Run: `node -c lib/redis-typed.js`
Expected: No output (clean parse)

- [ ] **Step 3: Commit**

```bash
git add lib/redis-typed.js
git commit -m "feat: add sismember + scard to raw() Redis accessor"
```

---

## Task 2: Build `/api/events/gated` endpoint

**Files:**
- Create: `api/events/gated.js`

**Docs to check:**
- `docs/superpowers/specs/2026-03-26-format-gating-events-page.md` (Section 5: API-Endpoint)
- `docs/superpowers/specs/2026-03-21-kinn-event-unified-data-model.md` (Redis schema)

**Dependencies:**
- `lib/redis-typed.js` (with `sismember` from Task 1)
- `api/luma/attendance.js` (attendance cache pattern — reuse `kv.get('attendance:counts')`)

- [ ] **Step 1: Create the endpoint**

Create `api/events/gated.js`:

```js
import kv from '../../lib/redis-typed.js';

const raw = kv.raw();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const email = (req.query.email || '').toLowerCase().trim();

    // Verify user if email provided
    let verified = false;
    if (email) {
      // Check attendance cache (built by /api/luma/attendance)
      const cached = await kv.get('attendance:counts');
      const counts = cached?.counts || {};
      const attended = (counts[email] || 0) >= 1;

      // Check whitelist
      const whitelisted = await raw.sismember('kinn:verified:whitelist', email);

      verified = attended || whitelisted;
    }

    // Load all events from sorted set
    const eventKeys = await raw.zrange('kinn:events', 0, '+inf', { byScore: true });
    if (!eventKeys?.length) {
      return res.status(200).json({ hero: null, events: [], verified });
    }

    // Compare dates as strings (YYYY-MM-DD) to avoid timezone issues
    const today = new Date().toISOString().split('T')[0];
    let hero = null;
    const events = [];

    for (const fullKey of eventKeys) {
      const ev = await raw.hgetall(fullKey);
      if (!ev || !ev.date) continue;

      if (ev.date < today) continue; // skip past events

      const key = fullKey.replace('kinn:event:', '');
      const type = ev.type || 'chapter';
      const isGated = type === 'talk' || type === 'kurs';
      const locked = isGated && !verified;

      const item = {
        key,
        name: ev.name,
        type,
        date: ev.date,
        time: ev.time || null,
        endTime: ev.endTime || null,
        location: ev.location || '',
        locationCity: ev.locationCity || '',
        lumaUrl: locked ? null : (ev.lumaUrl || null),
        coverUrl: ev.coverUrl || null,
        locked,
      };

      // First upcoming chapter = hero, rest are additional Donnerstage (unlocked)
      if (type === 'chapter' && !hero) {
        hero = item;
      } else if (type === 'chapter') {
        events.push({ ...item, locked: false }); // additional Donnerstage always unlocked
      } else if (isGated) {
        events.push(item);
      }
    }

    // Set cache headers
    if (email) {
      res.setHeader('Cache-Control', 'private, no-store');
    } else {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    }

    return res.status(200).json({ hero, events, verified });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
```

- [ ] **Step 2: Test — unauthenticated request**

Run: `curl -s 'http://localhost:3000/api/events/gated' | jq .`

Expected: JSON with `hero` (next chapter event or null), `events` (TALK/KURS with `locked: true`), `verified: false`.

- [ ] **Step 3: Test — authenticated with verified email**

Run: `curl -s 'http://localhost:3000/api/events/gated?email=KNOWN_ATTENDEE_EMAIL' | jq .`

Expected: `verified: true`, TALK/KURS events with `locked: false` and `lumaUrl` populated.

- [ ] **Step 4: Test — authenticated with unknown email**

Run: `curl -s 'http://localhost:3000/api/events/gated?email=nobody@example.com' | jq .`

Expected: `verified: false`, TALK/KURS events with `locked: true` and `lumaUrl: null`.

- [ ] **Step 5: Commit**

```bash
git add api/events/gated.js
git commit -m "feat: add gated events endpoint with attendance verification"
```

---

## Task 3: Build events page HTML/CSS

**Files:**
- Rewrite: `events/index.html`

**Design reference:** Spec Section 2 (Layout). Existing patterns: `events/index.html` (current page CSS variables, nav style), `toolkit/index.html` (card patterns, stat styles).

**Key CSS variables (reuse from existing):** `--mint`, `--text-heading`, `--text-body`, `--text-sub`, `--text-meta`, `--bg`, `--card-bg`, `--border`.

- [ ] **Step 1: Write the page shell**

Rewrite `events/index.html` with:
- Same `<head>` setup (Work Sans font, CSS variables from current page)
- Nav bar matching current events page style
- Empty containers for: hero card, voting teaser, secondary event cards, login modal
- `<script src="/events/events.js"></script>` at bottom

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KINN Events — Tirols KI-Community</title>
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
<style>
  :root {
    --mint: #5ED9A6;
    --mint-hover: #4EC995;
    --mint-bg: rgba(94,217,166,0.08);
    --text-heading: #2C3E50;
    --text-body: #3A3A3A;
    --text-sub: #6B6B6B;
    --text-meta: #999;
    --bg: #fafcfb;
    --card-bg: rgba(255,255,255,0.85);
    --border: rgba(0,0,0,0.06);
    --border-solid: #e8e8e8;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.06);
    --radius: 0.75rem;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Work Sans', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text-body);
    line-height: 1.618;
    -webkit-font-smoothing: antialiased;
  }

  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background:
      radial-gradient(circle at 20% 30%, rgba(94,217,166,0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(94,217,166,0.04) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }

  /* NAV */
  .nav {
    position: sticky; top: 0; z-index: 50;
    background: rgba(250,252,251,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 12px 20px;
    display: flex; align-items: center; gap: 8px;
  }
  .nav-brand {
    font-weight: 700; font-size: 11px; letter-spacing: 3px;
    color: var(--mint); text-transform: uppercase; text-decoration: none;
  }
  .nav-sep { color: var(--border); font-size: 12px; }
  .nav-title {
    font-size: 12px; font-weight: 500; color: var(--text-meta);
    letter-spacing: 0.04em; text-transform: uppercase;
  }

  /* LAYOUT */
  .container { max-width: 720px; margin: 0 auto; padding: 32px 20px 80px; }

  /* HERO CARD */
  .hero {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 32px;
    margin-bottom: 24px;
    box-shadow: var(--shadow-md);
  }
  .hero-type {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--mint); margin-bottom: 8px;
  }
  .hero-title {
    font-size: 24px; font-weight: 700; color: var(--text-heading);
    margin-bottom: 4px;
  }
  .hero-meta {
    font-size: 14px; color: var(--text-sub); margin-bottom: 20px;
  }
  .hero-cta {
    display: inline-block; padding: 10px 24px;
    background: var(--mint); color: #fff;
    border: none; border-radius: 8px;
    font-family: inherit; font-size: 14px; font-weight: 600;
    text-decoration: none; cursor: pointer;
    transition: background 0.15s;
  }
  .hero-cta:hover { background: var(--mint-hover); }

  /* VOTING TEASER */
  .voting-teaser {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 32px;
    margin-top: -8px; margin-bottom: 32px;
    box-shadow: var(--shadow-sm);
  }
  .voting-teaser-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text-meta); margin-bottom: 8px;
  }
  .voting-topics {
    display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
  }
  .voting-topic {
    font-size: 13px; font-weight: 500; color: var(--text-heading);
    background: var(--mint-bg); padding: 4px 10px; border-radius: 6px;
  }
  .voting-topic-votes {
    font-size: 11px; font-weight: 700; color: var(--mint); margin-left: 4px;
  }
  .voting-cta {
    font-size: 12px; font-weight: 600; color: var(--mint);
    background: none; border: 1px solid var(--mint);
    border-radius: 6px; padding: 4px 12px;
    cursor: pointer; font-family: inherit;
    transition: background 0.15s, color 0.15s;
  }
  .voting-cta:hover { background: var(--mint); color: #fff; }

  /* SECONDARY EVENTS */
  .secondary-section {
    margin-top: 8px;
  }
  .secondary-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text-meta); margin-bottom: 12px;
  }
  .secondary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  /* EVENT CARD (TALK/KURS) */
  .event-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    box-shadow: var(--shadow-sm);
    transition: opacity 0.2s;
  }
  .event-card.locked {
    opacity: 0.55;
  }
  .event-card-type {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; margin-bottom: 6px;
  }
  .event-card-type.talk { color: #3B82F6; }
  .event-card-type.kurs { color: #8B5CF6; }
  .event-card-title {
    font-size: 16px; font-weight: 600; color: var(--text-heading);
    margin-bottom: 4px;
  }
  .event-card-meta {
    font-size: 13px; color: var(--text-sub); margin-bottom: 16px;
  }
  .event-card-cta {
    display: inline-block; padding: 8px 18px;
    background: var(--mint); color: #fff;
    border: none; border-radius: 6px;
    font-family: inherit; font-size: 13px; font-weight: 600;
    text-decoration: none; cursor: pointer;
    transition: background 0.15s;
  }
  .event-card-cta:hover { background: var(--mint-hover); }

  /* LOCK HINT */
  .lock-hint {
    font-size: 12px; color: var(--text-sub); line-height: 1.5;
  }
  .lock-hint a {
    color: var(--mint); font-weight: 600; text-decoration: none;
  }
  .lock-hint a:hover { text-decoration: underline; }

  /* MODAL */
  .modal-overlay {
    display: none;
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.4);
    z-index: 100;
    align-items: center; justify-content: center;
  }
  .modal-overlay.active { display: flex; }
  .modal {
    background: #fff;
    border-radius: 12px;
    padding: 32px;
    max-width: 400px; width: 90%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  .modal h3 {
    font-size: 18px; font-weight: 700; color: var(--text-heading);
    margin-bottom: 8px;
  }
  .modal p {
    font-size: 14px; color: var(--text-sub); margin-bottom: 20px;
    line-height: 1.5;
  }
  .modal-input {
    width: 100%; padding: 10px 14px;
    border: 1px solid var(--border-solid); border-radius: 8px;
    font-family: inherit; font-size: 14px; color: var(--text-heading);
    margin-bottom: 12px;
  }
  .modal-input:focus { outline: none; border-color: var(--mint); }
  .modal-submit {
    width: 100%; padding: 10px;
    background: var(--mint); color: #fff;
    border: none; border-radius: 8px;
    font-family: inherit; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
  }
  .modal-submit:hover { background: var(--mint-hover); }
  .modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .modal-status {
    font-size: 13px; color: var(--text-sub); margin-top: 12px;
    text-align: center;
  }
  .modal-close {
    position: absolute; top: 12px; right: 16px;
    background: none; border: none; font-size: 20px;
    color: var(--text-meta); cursor: pointer;
  }

  /* EMPTY STATE */
  .empty { text-align: center; color: var(--text-meta); padding: 40px 0; font-size: 14px; }

  /* RESPONSIVE */
  @media (max-width: 640px) {
    .container { padding: 20px 16px 60px; }
    .hero { padding: 24px; }
    .hero-title { font-size: 20px; }
    .secondary-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<nav class="nav">
  <a href="https://kinn.at" class="nav-brand">KINN</a>
  <span class="nav-sep">/</span>
  <span class="nav-title">Events</span>
</nav>

<div class="container">
  <!-- Hero: next Donnerstag -->
  <div id="hero-container"></div>

  <!-- Voting teaser (hidden if no topics) -->
  <div id="voting-container"></div>

  <!-- Secondary: TALK/KURS events -->
  <div id="events-container"></div>
</div>

<!-- Login Modal -->
<div class="modal-overlay" id="login-modal" onclick="if(event.target===this)closeModal()">
  <div class="modal" style="position:relative">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3>Einloggen</h3>
    <p>Gib deine Email ein — wir schicken dir einen Login-Link.</p>
    <form id="login-form" onsubmit="handleLogin(event)">
      <input type="email" class="modal-input" id="login-email" placeholder="deine@email.at" required>
      <button type="submit" class="modal-submit" id="login-submit">Link senden</button>
    </form>
    <div class="modal-status" id="login-status"></div>
  </div>
</div>

<script src="/events/events.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify page renders**

Open `http://localhost:3000/events/` in browser. Should show nav bar, empty containers, no errors in console.

- [ ] **Step 3: Commit**

```bash
git add events/index.html
git commit -m "feat: redesign events page HTML/CSS with gating layout"
```

---

## Task 4: Build events page JavaScript

**Depends on:** Tasks 2, 3. Auth flow requires Tasks 5+6 to be deployed first, but page renders correctly without auth.

**Files:**
- Create: `events/events.js`

**Dependencies:**
- `api/events/gated.js` (Task 2)
- `api/voting/top-topics.js` (existing)
- kinn.at magic-link redirect must accept lab.kinn.at (prerequisite)

- [ ] **Step 1: Create auth + fetch + render logic**

Create `events/events.js`:

```js
// ====== CONFIG ======
const AUTH_DOMAIN = 'https://kinn.at';
const REDIRECT_URL = window.location.origin + '/events/';

// ====== AUTH ======
function extractAuthFromHash() {
  const hash = window.location.hash.substring(1);
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const token = params.get('token');
  const email = params.get('email');
  if (token && email) {
    localStorage.setItem('lab_session', token);
    localStorage.setItem('lab_email', email.toLowerCase().trim());
    window.history.replaceState(null, '', window.location.pathname);
  }
}

function getEmail() {
  return localStorage.getItem('lab_email');
}

function isLoggedIn() {
  return !!localStorage.getItem('lab_session') && !!localStorage.getItem('lab_email');
}

// ====== DATA ======
let eventsData = null;

async function loadEvents() {
  const email = getEmail();
  const url = email
    ? '/api/events/gated?email=' + encodeURIComponent(email)
    : '/api/events/gated';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API ' + res.status);
    eventsData = await res.json();
    render();
  } catch (e) {
    console.warn('[Events] Laden fehlgeschlagen:', e.message);
    document.getElementById('hero-container').innerHTML =
      '<div class="empty">Events konnten nicht geladen werden.</div>';
  }
}

async function loadVoting() {
  try {
    const res = await fetch('/api/voting/top-topics?limit=3');
    if (!res.ok) return;
    const data = await res.json();
    renderVoting(data.topics || []);
  } catch (e) {
    console.warn('[Events] Voting laden fehlgeschlagen:', e.message);
  }
}

// ====== RENDER ======
function render() {
  if (!eventsData) return;
  renderHero(eventsData.hero);
  renderEvents(eventsData.events, eventsData.hero);
}

function renderHero(hero) {
  const el = document.getElementById('hero-container');
  if (!hero) {
    el.innerHTML = '<div class="empty">Kein kommendes Event</div>';
    return;
  }

  const meta = [fmtDate(hero.date), hero.time, hero.location, hero.locationCity]
    .filter(Boolean).join(' · ');

  el.innerHTML = `
    <div class="hero">
      <div class="hero-type">KINN Donnerstag</div>
      <div class="hero-title">${esc(hero.name)}</div>
      <div class="hero-meta">${esc(meta)}</div>
      ${hero.lumaUrl
        ? `<a href="${escUrl(hero.lumaUrl)}" target="_blank" rel="noopener" class="hero-cta">Anmelden</a>`
        : ''}
    </div>`;
}

function renderVoting(topics) {
  const el = document.getElementById('voting-container');
  if (!topics.length) { el.innerHTML = ''; return; }

  const pills = topics.map(t =>
    `<span class="voting-topic">${esc(t.title)}<span class="voting-topic-votes">${t.votes}</span></span>`
  ).join('');

  el.innerHTML = `
    <div class="voting-teaser">
      <div class="voting-teaser-label">Themen-Voting</div>
      <div class="voting-topics">
        ${pills}
        <button class="voting-cta" onclick="handleVoteClick()">Stimm ab</button>
      </div>
    </div>`;
}

function renderEvents(events, hero) {
  const el = document.getElementById('events-container');
  if (!events || !events.length) { el.innerHTML = ''; return; }

  const heroLumaUrl = hero?.lumaUrl || '#';
  const cards = events.map(ev => renderEventCard(ev, heroLumaUrl)).join('');

  el.innerHTML = `
    <div class="secondary-section">
      <div class="secondary-label">Weitere Formate</div>
      <div class="secondary-grid">${cards}</div>
    </div>`;
}

function renderEventCard(ev, heroLumaUrl) {
  const typeLabel = ev.type === 'talk' ? 'KINN:TALK' : ev.type === 'kurs' ? 'KINN:KURS' : 'KINN';
  const typeCls = ev.type || 'chapter';
  const meta = [fmtDate(ev.date), ev.time, ev.location].filter(Boolean).join(' · ');

  // Extract display name from full name (e.g. "KINN:TALK - Content AI" → "Content AI")
  const displayName = ev.name.replace(/^KINN:\w+\s*[-–—]\s*/i, '').trim() || ev.name;

  let cta;
  if (ev.locked && !isLoggedIn()) {
    // Not logged in → login CTA
    cta = `<div class="lock-hint">
      Format freigeschaltet nach deinem ersten KINN Donnerstag.
      <br><a href="#" onclick="openModal();return false">Einloggen</a> oder
      <a href="${escUrl(heroLumaUrl)}" target="_blank" rel="noopener">zum nächsten Donnerstag</a>
    </div>`;
  } else if (ev.locked) {
    // Logged in but not verified → Donnerstag CTA + contact fallback
    cta = `<div class="lock-hint">
      Format freigeschaltet nach deinem ersten KINN Donnerstag.
      <br><a href="${escUrl(heroLumaUrl)}" target="_blank" rel="noopener">Zum nächsten Donnerstag</a>
      <br><span style="font-size:11px;color:var(--text-meta)">Schon mal da gewesen? <a href="mailto:kontakt@kinn.at">Schreib uns</a></span>
    </div>`;
  } else {
    // Unlocked
    cta = `<a href="${escUrl(ev.lumaUrl)}" target="_blank" rel="noopener" class="event-card-cta">Anmelden</a>`;
  }

  return `
    <div class="event-card${ev.locked ? ' locked' : ''}">
      <div class="event-card-type ${typeCls}">${esc(typeLabel)}</div>
      <div class="event-card-title">${esc(displayName)}</div>
      <div class="event-card-meta">${esc(meta)}</div>
      ${cta}
    </div>`;
}

// ====== MODAL ======
function openModal() {
  document.getElementById('login-modal').classList.add('active');
  document.getElementById('login-email').focus();
}

function closeModal() {
  document.getElementById('login-modal').classList.remove('active');
  document.getElementById('login-status').textContent = '';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  if (!email) return;

  const btn = document.getElementById('login-submit');
  const status = document.getElementById('login-status');
  btn.disabled = true;
  status.textContent = 'Wird gesendet...';

  try {
    const res = await fetch(AUTH_DOMAIN + '/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirect: REDIRECT_URL }),
    });

    if (!res.ok) throw new Error('Fehler: ' + res.status);

    status.textContent = 'Link kommt ins Postfach — schau in deine Emails.';
    btn.textContent = 'Gesendet';
  } catch (err) {
    status.textContent = 'Fehler beim Senden. Versuch es nochmal.';
    btn.disabled = false;
  }
}

// ====== VOTING ======
function handleVoteClick() {
  // TODO: Phase 2 — open voting modal with full voting interface
  alert('Voting-Details kommen bald. Bleib dran!');
}

// ====== UTILS ======
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const months = ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]}`;
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escUrl(url) {
  if (!url) return '';
  try { return new URL(url).href; } catch { return esc(url); }
}

// ====== INIT ======
extractAuthFromHash();
loadEvents();
loadVoting();
```

- [ ] **Step 2: Verify page loads and renders**

Open `http://localhost:3000/events/` in browser.

Expected:
- Hero card shows next Donnerstag (if one exists in Redis)
- TALK/KURS cards show with lock state
- Voting teaser shows if topics exist
- No console errors

- [ ] **Step 3: Test login modal**

Click "Einloggen" link on a locked card. Modal should open. Enter email, submit.

Expected: Cross-origin POST to kinn.at/api/signup. If kinn.at redirect whitelist is not yet updated, this will fail with CORS error — that's expected for now.

- [ ] **Step 4: Commit**

```bash
git add events/events.js
git commit -m "feat: add events page JS with auth, gating, and voting teaser"
```

---

## Task 5: Update kinn.at redirect validation (KINN main repo)

**Files:**
- Modify: `/Users/livingmydesign/GitHub/_quicks/_KINN/KINN/api/signup.js` (line ~324)
- Modify: `/Users/livingmydesign/GitHub/_quicks/_KINN/KINN/api/auth/login.js` (line ~231)

**This task is in the KINN main repo, not LAB.**

- [ ] **Step 1: Add redirect whitelist to signup.js**

In `api/signup.js`, find the redirect validation line:

```js
const redirect = (typeof req.body.redirect === 'string' && req.body.redirect.startsWith('/') && !req.body.redirect.startsWith('//'))
  ? req.body.redirect : null;
```

Replace with:

```js
const ALLOWED_REDIRECT_ORIGINS = ['https://lab.kinn.at'];

function isValidRedirect(url) {
  if (typeof url !== 'string') return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  return ALLOWED_REDIRECT_ORIGINS.some(origin => url.startsWith(origin + '/'));
}

const redirect = isValidRedirect(req.body.redirect) ? req.body.redirect : null;
```

- [ ] **Step 2: Same change in login.js**

In `api/auth/login.js`, find the same redirect validation pattern and apply the same `isValidRedirect` function.

**Note:** Consider extracting `isValidRedirect` into `api/utils/redirect.js` to keep it DRY if both files use the same logic.

- [ ] **Step 3: Add CORS for lab.kinn.at to signup.js**

The signup endpoint needs to accept cross-origin POST from lab.kinn.at. Add CORS headers:

```js
// At the top of the handler
const ALLOWED_ORIGINS = ['https://kinn.at', 'https://lab.kinn.at'];
const origin = req.headers.origin;
if (ALLOWED_ORIGINS.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
if (req.method === 'OPTIONS') return res.status(200).end();
```

- [ ] **Step 4: Test cross-domain auth flow end-to-end**

1. Open lab.kinn.at/events in browser
2. Click "Einloggen" on locked card
3. Enter email in modal, submit
4. Check email for magic link
5. Click magic link
6. Verify redirect back to lab.kinn.at/events with token in hash
7. Verify TALK/KURS cards unlock (if email has attendance)

- [ ] **Step 5: Commit (in KINN repo)**

```bash
cd /Users/livingmydesign/GitHub/_quicks/_KINN/KINN
git add api/signup.js api/auth/login.js
git commit -m "feat: allow lab.kinn.at as redirect target for magic links"
```

---

## Task 6: CSP update for cross-origin auth

**Files:**
- Modify: `vercel.json` (CSP header)

The events page makes a cross-origin POST to `https://kinn.at/api/signup`. The current CSP `connect-src` only allows `'self'` and a few specific domains.

- [ ] **Step 1: Add kinn.at to CSP connect-src**

In `vercel.json`, find the Content-Security-Policy header value and add `https://kinn.at` to the `connect-src` directive:

```
connect-src 'self' https://kinn.at https://*.vercel.app https://*.upstash.io https://*.basemaps.cartocdn.com https://unpkg.com;
```

- [ ] **Step 2: Verify CSP allows the request**

Open events page, open DevTools Network tab, trigger login modal submit. Should not show CSP violation error.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: add kinn.at to CSP connect-src for cross-domain auth"
```

---

## Task 7: Integration test — full flow

No new files. End-to-end verification.

- [ ] **Step 1: Test unauthenticated flow**

Open `lab.kinn.at/events` (or localhost) in incognito.

Verify:
- Hero Donnerstag card renders with Luma link
- TALK/KURS cards render dimmed (opacity ~0.55)
- Lock hint text visible: "Format freigeschaltet nach deinem ersten KINN Donnerstag"
- "Einloggen" link visible on locked cards
- Voting teaser shows if topics exist

- [ ] **Step 2: Test login modal**

Click "Einloggen". Verify modal opens with email input. Click overlay to close. Click X to close.

- [ ] **Step 3: Test authenticated + verified flow**

Set localStorage manually for testing:
```js
localStorage.setItem('lab_session', 'test');
localStorage.setItem('lab_email', 'KNOWN_ATTENDEE_EMAIL');
```
Reload page.

Verify:
- TALK/KURS cards render at full opacity
- "Anmelden" button visible with Luma link
- No lock hint text

- [ ] **Step 4: Test authenticated + not verified flow**

```js
localStorage.setItem('lab_session', 'test');
localStorage.setItem('lab_email', 'nobody@example.com');
```
Reload page.

Verify:
- TALK/KURS cards still dimmed
- Lock hint shows "Zum nächsten Donnerstag" (no "Einloggen" link — already logged in)

- [ ] **Step 5: Test empty state**

If no TALK/KURS events in Redis: verify page shows only Hero Donnerstag, no "Weitere Formate" section.

- [ ] **Step 6: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: integration test fixes for events gating"
```
