// ====== CONFIG ======
const AUTH_DOMAIN = 'https://kinn.at';
const REDIRECT_URL = window.location.origin + '/events/gated.html';

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
function getEmail() { return localStorage.getItem('lab_email'); }
function isLoggedIn() { return !!localStorage.getItem('lab_session') && !!getEmail(); }

// ====== DATA ======
let gatedData = null;
let pastEvents = [];

async function loadAll() {
  const [gated, feedback, voting] = await Promise.allSettled([
    fetch('/api/events/gated' + (getEmail() ? '?email=' + encodeURIComponent(getEmail()) : '')).then(r => r.json()),
    fetch('/api/events/feedback').then(r => r.json()),
    fetch('/api/voting/top-topics?limit=3').then(r => r.json()),
  ]);

  if (gated.status === 'fulfilled') {
    gatedData = gated.value;
    renderHero(gatedData.hero);
    renderChapters(gatedData.events.filter(e => e.type === 'chapter'), gatedData.hero);
    renderFormats(gatedData.events.filter(e => e.type !== 'chapter'), gatedData.hero);
  }

  if (voting.status === 'fulfilled') renderVoting(voting.value.topics || []);

  if (feedback.status === 'fulfilled') {
    const all = feedback.value.events || [];
    pastEvents = all
      .filter(e => e.type === 'chapter' && (e.groupPhoto || e.feedback?.length))
      .reverse()
      .slice(0, 8);
    renderPast(pastEvents, all.length);
  }
}

// ====== RENDER: HERO ======
function renderHero(hero) {
  const el = document.getElementById('hero-section');
  if (!hero) { el.innerHTML = '<div style="text-align:center;color:var(--text-meta);padding:48px 0">Kein kommendes Event</div>'; return; }

  const meta = [fmtDate(hero.date), hero.time, hero.location, hero.locationCity].filter(Boolean).join(' · ');
  const hasCover = !!hero.coverUrl;

  el.innerHTML = `
    <div class="hero ${hasCover ? '' : 'hero--plain'}">
      ${hasCover ? `<div class="hero-bg" style="background-image:url(${escUrl(hero.coverUrl)})"></div>` : ''}
      <div class="hero-content">
        <div class="hero-type">KINN Donnerstag</div>
        <div class="hero-title">${esc(hero.name)}</div>
        <div class="hero-meta">${esc(meta)}</div>
        ${hero.lumaUrl ? `<a href="${escUrl(hero.lumaUrl)}" target="_blank" rel="noopener" class="hero-cta">Anmelden</a>` : ''}
      </div>
    </div>`;
}

// ====== RENDER: VOTING ======
function renderVoting(topics) {
  const el = document.getElementById('voting-section');
  if (!topics.length) { el.innerHTML = ''; return; }
  const pills = topics.map(t => `<span class="voting-pill">${esc(t.title)}<span class="voting-pill-n">${t.votes}</span></span>`).join('');
  el.innerHTML = `<div class="voting" style="margin-top:12px">
    <span class="voting-label">Themen</span>
    <div class="voting-topics">${pills}</div>
    <button class="voting-cta" onclick="handleVoteClick()">Stimm ab</button>
  </div>`;
}

// ====== RENDER: ADDITIONAL CHAPTERS ======
function renderChapters(chapters, hero) {
  const el = document.getElementById('chapters-section');
  if (!chapters.length) { el.innerHTML = ''; return; }
  const pills = chapters.map((ch, i) => {
    const meta = [fmtDate(ch.date), ch.time, ch.location].filter(Boolean).join(' · ');
    return `<div class="chapter-pill" style="animation-delay:${0.15 + i * 0.05}s">
      <div class="chapter-pill-info">
        <div class="chapter-pill-name">${esc(ch.name)}</div>
        <div class="chapter-pill-meta">${esc(meta)}</div>
      </div>
      ${ch.lumaUrl ? `<a href="${escUrl(ch.lumaUrl)}" target="_blank" rel="noopener" class="chapter-pill-cta">Anmelden</a>` : ''}
    </div>`;
  }).join('');
  el.innerHTML = `<div class="chapter-pills" style="margin-top:12px">${pills}</div>`;
}

// ====== RENDER: TALK/KURS FORMATS ======
function renderFormats(events, hero) {
  const el = document.getElementById('formats-section');
  if (!events.length) { el.innerHTML = ''; return; }

  const heroUrl = hero?.lumaUrl || '#';
  const cards = events.map((ev, i) => {
    const typeLabel = ev.type === 'talk' ? 'TALK' : ev.type === 'kurs' ? 'KURS' : 'KINN';
    const typeCls = ev.type || 'chapter';
    const displayName = ev.name.replace(/^KINN[:\s]+\w+\s*[-\u2013\u2014]\s*/i, '').trim() || ev.name;
    const meta = [fmtDate(ev.date), ev.time, ev.location].filter(Boolean).join(' \u00b7 ');

    let ctaHtml;
    if (!ev.locked) {
      ctaHtml = `<a href="${escUrl(ev.lumaUrl)}" target="_blank" rel="noopener" class="format-card-cta">Anmelden</a>`;
    } else {
      const loginLink = !isLoggedIn()
        ? `<a href="#" onclick="openModal();return false">Einloggen</a> oder `
        : '';
      ctaHtml = `<div class="lock-bar">
        Freigeschaltet nach deinem ersten KINN Donnerstag.
        <br>${loginLink}<a href="${escUrl(heroUrl)}" target="_blank" rel="noopener">Zum n\u00e4chsten Donnerstag</a>
        ${isLoggedIn() ? '<div class="lock-bar-alt">Schon mal da gewesen? <a href="mailto:kontakt@kinn.at">Schreib uns</a></div>' : ''}
      </div>`;
    }

    return `<div class="format-card ${ev.locked ? 'locked' : ''}" style="animation-delay:${0.1 + i * 0.06}s">
      ${ev.coverUrl ? `<img class="format-card-cover" src="${escUrl(ev.coverUrl)}" alt="" loading="lazy">` : ''}
      <div class="format-card-body">
        <span class="format-card-type ${typeCls}">${esc(typeLabel)}</span>
        <div class="format-card-title">${esc(displayName)}</div>
        <div class="format-card-meta">${esc(meta)}</div>
        ${!ev.locked ? ctaHtml : ''}
      </div>
      ${ev.locked ? ctaHtml : ''}
    </div>`;
  }).join('');

  el.innerHTML = `<div class="section">
    <div class="section-label">Weitere Formate</div>
    <div class="format-grid">${cards}</div>
  </div>`;
}

// ====== RENDER: PAST EVENTS ======
function renderPast(events, totalCount) {
  const el = document.getElementById('past-section');
  if (!events.length) { el.innerHTML = ''; return; }

  const withPhotos = events.filter(e => e.groupPhoto);
  const totalFeedback = events.reduce((s, e) => s + (e.stats?.totalFeedback || 0), 0);

  let statsHtml = '';
  if (totalCount > 0) {
    statsHtml = `<div class="stats-bar">
      <div><span class="stats-bar-val">${totalCount}</span><span class="stats-bar-label">Events</span></div>
      <div><span class="stats-bar-val">${withPhotos.length}</span><span class="stats-bar-label">Gruppenfotos</span></div>
      <div><span class="stats-bar-val">${totalFeedback}</span><span class="stats-bar-label">Stimmen</span></div>
    </div>`;
  }

  const cards = events.map((ev, i) => {
    const chapter = chapterFromName(ev.name, ev.chapter);
    const chapterCls = chapter === 'Kufstein' ? 'kuf' : chapter === 'Innsbruck' ? 'ibk' : 'other';
    const stats = ev.stats || {};
    const quotes = (ev.feedback || []).slice(0, 2);

    const metaParts = [ev.date ? fmtDateLong(ev.date) : ''];
    if (ev.location?.name) metaParts.push(ev.location.name);
    const meta = metaParts.filter(Boolean).join(' \u00b7 ');

    const statsRow = [];
    if (stats.checkedIn) statsRow.push(`<span><span class="past-card-stat-val">${stats.checkedIn}</span> Teilnehmer</span>`);
    if (stats.avgRating) statsRow.push(`<span><span class="past-card-stat-val">${Number(stats.avgRating).toFixed(1)}</span>/5 Rating</span>`);
    if (stats.totalFeedback) statsRow.push(`<span><span class="past-card-stat-val">${stats.totalFeedback}</span> Stimmen</span>`);

    const quotesHtml = quotes.map(q =>
      `<div class="past-card-quote">${esc(q.text?.substring(0, 120))}${q.text?.length > 120 ? '...' : ''} <span class="past-card-quote-author">\u2014 ${esc(q.firstName)} ${esc(q.lastInitial)}</span></div>`
    ).join('');

    if (ev.groupPhoto) {
      return `<div class="past-card" style="animation-delay:${0.1 + i * 0.05}s">
        <img class="past-card-photo" src="${escUrl(ev.groupPhoto)}" alt="${esc(ev.name)}" loading="lazy">
        <div class="past-card-content">
          <div class="past-card-header">
            <span class="past-card-name">${esc(ev.name)}</span>
            <span class="past-card-chapter ${chapterCls}">${esc(chapter)}</span>
          </div>
          <div class="past-card-meta">${esc(meta)}</div>
          ${statsRow.length ? `<div class="past-card-stats">${statsRow.join('')}</div>` : ''}
          <div class="past-card-quotes">${quotesHtml}</div>
        </div>
      </div>`;
    }

    if (quotes.length) {
      return `<div class="past-card no-photo" style="animation-delay:${0.1 + i * 0.05}s">
        <div class="past-card-content">
          <div class="past-card-header">
            <span class="past-card-name">${esc(ev.name)}</span>
            <span class="past-card-chapter ${chapterCls}">${esc(chapter)}</span>
          </div>
          <div class="past-card-meta">${esc(meta)}</div>
          ${statsRow.length ? `<div class="past-card-stats">${statsRow.join('')}</div>` : ''}
          <div class="past-card-quotes">${quotesHtml}</div>
        </div>
      </div>`;
    }
    return '';
  }).filter(Boolean).join('');

  el.innerHTML = `<div class="section">
    <div class="section-label">R\u00fcckblick</div>
    ${statsHtml}
    <div class="past-grid">${cards}</div>
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
    if (!res.ok) throw new Error(res.status);
    status.textContent = 'Link kommt ins Postfach \u2014 schau in deine Emails.';
    btn.textContent = 'Gesendet';
  } catch {
    status.textContent = 'Fehler beim Senden. Versuch es nochmal.';
    btn.disabled = false;
  }
}

function handleVoteClick() {
  // TODO: Phase 2 — voting modal
  alert('Voting-Details kommen bald. Bleib dran!');
}

// ====== UTILS ======
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d)) return dateStr;
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const months = ['J\u00e4n', 'Feb', 'M\u00e4r', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]}`;
}

function fmtDateLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d)) return dateStr;
  const months = ['J\u00e4nner', 'Februar', 'M\u00e4rz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function chapterFromName(name, chapter) {
  if (chapter) return chapter;
  const m = name.match(/KINN#\d+\s+(.*)/i);
  return m ? m[1].trim() : 'Innsbruck';
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function escUrl(url) {
  if (!url) return '';
  try { return new URL(url).href; } catch { return esc(url); }
}

// ====== INIT ======
extractAuthFromHash();
loadAll();
