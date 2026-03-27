// ====== CONFIG ======
const AUTH_DOMAIN = 'https://kinn.at';
const REDIRECT_URL = window.location.origin + '/events/landing.html';

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

// ====== LOAD ALL ======
async function loadAll() {
  const [gated, feedback, voting] = await Promise.allSettled([
    fetch('/api/events/gated' + (getEmail() ? '?email=' + encodeURIComponent(getEmail()) : '')).then(r => r.json()),
    fetch('/api/events/feedback').then(r => r.json()),
    fetch('/api/voting/top-topics?limit=3').then(r => r.json()),
  ]);

  if (gated.status === 'fulfilled') {
    const d = gated.value;
    renderHeroEvent(d.hero);
    renderChapters(d.events.filter(e => e.type === 'chapter'));
    renderFormats(d.events.filter(e => e.type !== 'chapter'), d.hero);

    // Login hint
    const loginEl = document.getElementById('hero-login');
    if (isLoggedIn()) {
      loginEl.innerHTML = `Eingeloggt als ${esc(getEmail())}`;
    } else {
      loginEl.innerHTML = `<a href="#" onclick="openModal();return false">Einloggen</a>`;
    }
  }

  if (feedback.status === 'fulfilled') {
    const all = feedback.value.events || [];
    renderStats(all);
    renderHeroQuote(all);
    const past = all.filter(e => e.groupPhoto || e.feedback?.length).reverse().slice(0, 10);
    renderPast(past);
  }

  if (voting.status === 'fulfilled') {
    renderVoting(voting.value.topics || []);
  }

  // Scroll hint
  const hint = document.getElementById('scroll-hint');
  if (document.getElementById('formats-section').innerHTML || document.getElementById('past-section').innerHTML) {
    hint.textContent = '\u2193';
    hint.style.fontSize = '18px';
  }

  // Scroll reveal
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ====== HERO EVENT ======
function renderHeroEvent(hero) {
  const el = document.getElementById('hero-event');
  if (!hero) {
    el.innerHTML = '<div style="color:var(--text-m)">Kein kommendes Event</div>';
    return;
  }
  const meta = [fmtDate(hero.date), hero.time, hero.location, hero.locationCity].filter(Boolean).join(' \u00b7 ');
  el.innerHTML = `
    <div class="hero-event-label">N\u00e4chster Termin</div>
    <div class="hero-event-name">${esc(hero.name)}</div>
    <div class="hero-event-meta">${esc(meta)}</div>
    ${hero.lumaUrl ? `<a href="${escUrl(hero.lumaUrl)}" target="_blank" rel="noopener" class="hero-cta">Dabei sein</a>` : ''}
  `;
}

// ====== HERO QUOTE ======
function renderHeroQuote(allEvents) {
  const el = document.getElementById('hero-quote');
  const allQuotes = allEvents.flatMap(e => (e.feedback || []).map(q => ({ ...q, event: e.name })));
  if (!allQuotes.length) return;

  // Filter for positive, newcomer-friendly quotes (not process criticism)
  const positive = ['format', 'austausch', 'toll', 'super', 'cool', 'erste', 'unglaublich', 'spannend', 'wirkung', 'wieder', 'energie', 'vernetz'];
  const negative = ['nicht', 'fehlt', 'leider', 'laut', 'kurz', 'problem', 'funktioniert nicht'];

  const good = allQuotes.filter(q => {
    const t = (q.text || '').toLowerCase();
    if (t.length < 40) return false;
    const hasPositive = positive.some(kw => t.includes(kw));
    const hasNegative = negative.some(kw => t.includes(kw));
    return hasPositive && !hasNegative;
  });

  const pool = good.length ? good : allQuotes.filter(q => (q.text || '').length > 40);
  if (!pool.length) return;
  const q = pool[Math.floor(Math.random() * pool.length)];

  el.innerHTML = `<div class="hero-quote">
    <div class="hero-quote-text">\u201E${esc(q.text?.substring(0, 130))}${q.text?.length > 130 ? '...' : ''}\u201C</div>
    <div class="hero-quote-author">${esc(q.firstName)} ${esc(q.lastInitial)} \u00b7 ${esc(q.event)}</div>
  </div>`;
}

// ====== STATS ======
function renderStats(allEvents) {
  const el = document.getElementById('stats');
  const chapters = allEvents.filter(e => e.type === 'chapter');
  const withFb = allEvents.reduce((s, e) => s + (e.stats?.totalFeedback || 0), 0);
  const cities = [...new Set(chapters.map(e => e.location?.city).filter(Boolean))];

  el.innerHTML = `
    <div class="stat"><span class="stat-val">${allEvents.length}</span><span class="stat-label">Events</span></div>
    <div class="stat"><span class="stat-val">${cities.length}</span><span class="stat-label">Standorte</span></div>
    <div class="stat"><span class="stat-val">${chapters.length}</span><span class="stat-label">Donnerstage</span></div>
    <div class="stat"><span class="stat-val">${withFb}</span><span class="stat-label">Stimmen</span></div>
  `;
}

// ====== VOTING ======
function renderVoting(topics) {
  const el = document.getElementById('voting-section');
  if (!topics.length) return;
  const pills = topics.map(t => `<span class="voting-pill">${esc(t.title)}<span class="voting-pill-n">${t.votes}</span></span>`).join('');
  el.innerHTML = `<div class="section reveal">
    <div class="section-label">Themen-Voting</div>
    <div class="voting">
      <span class="voting-label">Top 3</span>
      <div class="voting-topics">${pills}</div>
      <button class="voting-cta" onclick="alert('Voting-Details kommen bald!')">Stimm ab</button>
    </div>
  </div>`;
}

// ====== CHAPTERS ======
function renderChapters(chapters) {
  const el = document.getElementById('chapters-section');
  if (!chapters.length) { el.innerHTML = ''; return; }

  const cards = chapters.map(ch => {
    const meta = [fmtDate(ch.date), ch.time].filter(Boolean).join(' \u00b7 ');
    const loc = ch.locationCity || (ch.location || '').split(',')[0];
    return `<div class="chapter-card">
      <div class="chapter-card-info">
        <div class="chapter-card-name">${esc(ch.name)}</div>
        <div class="chapter-card-meta">${esc(meta)}${loc ? ' \u00b7 ' + esc(loc) : ''}</div>
      </div>
      ${ch.lumaUrl ? `<a href="${escUrl(ch.lumaUrl)}" target="_blank" rel="noopener" class="chapter-card-cta">Dabei sein</a>` : ''}
    </div>`;
  }).join('');

  el.innerHTML = `<div class="section reveal" style="padding-top:24px;padding-bottom:0">
    <div class="section-label">Weitere Standorte</div>
    <div class="chapters">${cards}</div>
  </div>`;
}

// ====== FORMAT CARDS ======
function renderFormats(events, hero) {
  const el = document.getElementById('formats-section');
  if (!events.length) return;

  const heroUrl = hero?.lumaUrl || '#';
  const unlocked = events.filter(e => !e.locked);
  const locked = events.filter(e => e.locked);

  let html = '';

  // Unlocked: full cards with covers
  unlocked.forEach(ev => {
    const typeLabel = ev.type === 'talk' ? 'TALK' : ev.type === 'kurs' ? 'KURS' : 'KINN';
    const typeCls = ev.type || 'chapter';
    const displayName = ev.name.replace(/^KINN[:\s]+\w+\s*[-\u2013\u2014]\s*/i, '').trim() || ev.name;
    const meta = [fmtDate(ev.date), ev.time, ev.location].filter(Boolean).join(' \u00b7 ');
    html += `<div class="format-card-unlocked">
      ${ev.coverUrl ? `<img class="format-card-cover" src="${escUrl(ev.coverUrl)}" alt="" loading="lazy">` : ''}
      <div class="format-card-body">
        <span class="format-card-type ${typeCls}">${esc(typeLabel)}</span>
        <div class="format-card-title">${esc(displayName)}</div>
        <div class="format-card-meta">${esc(meta)}</div>
        <a href="${escUrl(ev.lumaUrl)}" target="_blank" rel="noopener" class="format-card-cta">Anmelden</a>
      </div>
    </div>`;
  });

  // Locked: compact list in one card
  if (locked.length) {
    const rows = locked.map(ev => {
      const typeLabel = ev.type === 'talk' ? 'TALK' : ev.type === 'kurs' ? 'KURS' : 'KINN';
      const typeCls = ev.type || 'chapter';
      const displayName = ev.name.replace(/^KINN[:\s]+\w+\s*[-\u2013\u2014]\s*/i, '').trim() || ev.name;
      const meta = [fmtDate(ev.date), ev.time].filter(Boolean).join(' \u00b7 ');
      return `<div class="format-locked-row">
        <span class="format-locked-badge ${typeCls}">${esc(typeLabel)}</span>
        <span class="format-locked-title">${esc(displayName)}</span>
        <span class="format-locked-meta">${esc(meta)}</span>
      </div>`;
    }).join('');

    const login = !isLoggedIn() ? `<a href="#" onclick="openModal();return false">Einloggen</a> oder ` : '';
    const contact = isLoggedIn() ? ' \u00b7 <a href="mailto:kontakt@kinn.at">Schon da gewesen? Schreib uns</a>' : '';

    html += `<div class="format-locked-list">
      ${rows}
      <div class="format-lock-hint">
        Freigeschaltet nach deinem ersten KINN Donnerstag.
        ${login}<a href="${escUrl(heroUrl)}" target="_blank" rel="noopener">Zum n\u00e4chsten Donnerstag</a>${contact}
      </div>
    </div>`;
  }

  el.innerHTML = `<div class="section reveal">
    <div class="section-label">Weitere Formate</div>
    ${html}
  </div>`;
}

// ====== PAST EVENTS ======
function renderPast(events) {
  const el = document.getElementById('past-section');
  const withPhotos = events.filter(e => e.groupPhoto);
  const allQuotes = events.flatMap(e => (e.feedback || []).map(q => ({ ...q, event: e.name })));
  if (!withPhotos.length && !allQuotes.length) return;

  // Photo strip
  let photosHtml = '';
  if (withPhotos.length) {
    const cards = withPhotos.slice(0, 8).map(ev => {
      const chapter = chapterFromName(ev.name, ev.chapter);
      const stats = ev.stats || {};
      const statParts = [];
      if (stats.checkedIn) statParts.push(`<strong>${stats.checkedIn}</strong> da`);
      if (stats.avgRating) statParts.push(`<strong>${Number(stats.avgRating).toFixed(1)}</strong>/5`);
      return `<div class="photo-card">
        <img src="${escUrl(ev.groupPhoto)}" alt="${esc(ev.name)}" loading="lazy">
        <div class="photo-card-overlay">
          <div class="photo-card-name">${esc(ev.name)}</div>
          <div class="photo-card-meta">${esc(chapter)} \u00b7 ${esc(fmtDateShort(ev.date))}</div>
          ${statParts.length ? `<div class="photo-card-stats">${statParts.join(' \u00b7 ')}</div>` : ''}
        </div>
      </div>`;
    }).join('');
    photosHtml = `<div class="photos-scroll">${cards}</div>`;
  }

  // Quotes
  let quotesHtml = '';
  if (allQuotes.length) {
    const top = allQuotes.slice(0, 6);
    const cards = top.map(q => `<div class="quote-card">
      <div class="quote-text">\u201E${esc(q.text?.substring(0, 100))}${q.text?.length > 100 ? '...' : ''}\u201C</div>
      <div class="quote-author">${esc(q.firstName)} ${esc(q.lastInitial)} \u00b7 ${esc(q.event)}</div>
    </div>`).join('');
    quotesHtml = `<div class="quotes-grid">${cards}</div>`;
  }

  el.innerHTML = `<div class="section reveal">
    <div class="section-label">R\u00fcckblick</div>
    ${photosHtml}
    ${quotesHtml}
  </div>`;
}

// ====== MODAL ======
function openModal() { document.getElementById('login-modal').classList.add('active'); document.getElementById('login-email').focus(); }
function closeModal() { document.getElementById('login-modal').classList.remove('active'); document.getElementById('login-status').textContent = ''; }

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  if (!email) return;
  const btn = document.getElementById('login-btn');
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

// ====== UTILS ======
function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s + 'T12:00:00');
  if (isNaN(d)) return s;
  return `${['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()]} ${d.getDate()}. ${['J\u00e4n','Feb','M\u00e4r','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][d.getMonth()]}`;
}
function fmtDateShort(s) {
  if (!s) return '';
  const d = new Date(s + 'T12:00:00');
  if (isNaN(d)) return s;
  return `${['J\u00e4n','Feb','M\u00e4r','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][d.getMonth()]} ${d.getFullYear()}`;
}
function chapterFromName(name, chapter) {
  if (chapter) return chapter;
  const m = name.match(/KINN#\d+\s+(.*)/i);
  return m ? m[1].trim() : 'Innsbruck';
}
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function escUrl(u) { if (!u) return ''; try { return new URL(u).href; } catch { return esc(u); } }

// ====== PARTNER LOGOS ======
function renderPartners() {
  const logos = [
    { src: 'https://kinn.at/public/logos/land-tirol.svg', alt: 'Land Tirol' },
    { src: 'https://kinn.at/public/logos/inncubator.svg', alt: 'Inncubator' },
    { src: 'https://kinn.at/public/logos/impacthub.svg', alt: 'Impact Hub Tirol' },
    { src: 'https://kinn.at/public/logos/werkstaette-wattens.svg', alt: 'Werkst\u00e4tte Wattens' },
    { src: 'https://kinn.at/public/logos/innovationsraum-kufstein.svg', alt: 'Innovationsraum Kufstein' },
  ];
  const el = document.getElementById('partners');
  el.innerHTML = logos.map(l => `<img src="${l.src}" alt="${esc(l.alt)}" loading="lazy">`).join('');
}

// ====== INIT ======
extractAuthFromHash();
loadAll();
renderPartners();
