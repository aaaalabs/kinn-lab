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

  // Extract display name from full name (e.g. "KINN:TALK - Content AI" -> "Content AI")
  const displayName = ev.name.replace(/^KINN:\w+\s*[-\u2013\u2014]\s*/i, '').trim() || ev.name;

  let cta;
  if (ev.locked && !isLoggedIn()) {
    cta = `<div class="lock-hint">
      Format freigeschaltet nach deinem ersten KINN Donnerstag.
      <br><a href="#" onclick="openModal();return false">Einloggen</a> oder
      <a href="${escUrl(heroLumaUrl)}" target="_blank" rel="noopener">zum nächsten Donnerstag</a>
    </div>`;
  } else if (ev.locked) {
    cta = `<div class="lock-hint">
      Format freigeschaltet nach deinem ersten KINN Donnerstag.
      <br><a href="${escUrl(heroLumaUrl)}" target="_blank" rel="noopener">Zum nächsten Donnerstag</a>
      <br><span style="font-size:11px;color:var(--text-meta)">Schon mal da gewesen? <a href="mailto:kontakt@kinn.at">Schreib uns</a></span>
    </div>`;
  } else {
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
  // TODO: Phase 2 - open voting modal with full voting interface
  alert('Voting-Details kommen bald. Bleib dran!');
}

// ====== UTILS ======
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
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
