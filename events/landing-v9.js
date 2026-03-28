// ====== CONFIG ======
const AUTH_DOMAIN = 'https://kinn.at';
const REDIRECT_URL = window.location.origin + '/events/landing-v9.html';

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
    const chapters = d.events.filter(e => e.type === 'chapter');
    renderTermine(d.hero, chapters);
    renderFormats(d.events.filter(e => e.type !== 'chapter'), d.hero);

    const loginEl = document.getElementById('hero-login');
    loginEl.innerHTML = isLoggedIn()
      ? `Eingeloggt als ${esc(getEmail())}`
      : `<a href="#" onclick="openModal();return false">Einloggen</a>`;
    loginEl.style.display = '';
  }

  if (feedback.status === 'fulfilled') {
    const all = feedback.value.events || [];
    renderStats(all);
    renderHeroBg(all);
    const past = all.filter(e => e.groupPhoto || e.feedback?.length).reverse().slice(0, 10);
    renderPast(past);
  }

  if (voting.status === 'fulfilled') {
    renderVoting(voting.value.topics || []);
  }

  // Init Luma checkout buttons after all rendering
  initLumaButtons();

  // Scroll reveal
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ====== TERMINE (all Donnerstage in one compact list) ======
function renderTermine(hero, chapters) {
  const el = document.getElementById('termine-section');
  const all = hero ? [hero, ...chapters] : chapters;
  if (!all.length) {
    el.innerHTML = '<div style="color:var(--text-m);font-size:13px">Keine kommenden Termine</div>';
    return;
  }

  const rows = all.map(ev => {
    const city = ev.locationCity || chapterFromName(ev.name, null) || 'Innsbruck';
    const date = fmtDateNoDay(ev.date);
    const lumaId = ev.lumaId;
    const href = ev.lumaUrl ? escUrl(ev.lumaUrl) : '#';
    const onclick = lumaId
      ? `openLumaCheckout('${esc(lumaId)}');return false`
      : '';

    const when = fmtRelative(ev.date);
    return `<a class="termin-row" href="${href}" ${onclick ? `onclick="${onclick}"` : `target="_blank" rel="noopener"`}>
      <span class="termin-city">${esc(city)}</span>
      <span class="termin-when">${esc(when)}</span>
      <span class="termin-arrow">\u2192</span>
    </a>`;
  }).join('');

  el.innerHTML = `<div class="termine">
    <div class="termine-label">Wo bist du dabei?</div>
    ${rows}
  </div>`;
}

// ====== TESTIMONIAL (in hero) ======
async function loadTestimonial() {
  const el = document.getElementById('hero-testimonial');
  if (!el) return;
  try {
    const res = await fetch('https://kinn.at/api/testimonials');
    if (!res.ok) return;
    const data = await res.json();
    const pool = (data.testimonials || []).filter(t => t.quote && t.name && t.image && t.quote.length < 160);
    if (!pool.length) return;
    const t = pool[Math.floor(Math.random() * pool.length)];
    el.innerHTML = `<div class="hero-testimonial">
      <img class="hero-testimonial-avatar" src="https://kinn.at/testimonials/images/${esc(t.image)}" alt="${esc(t.name)}" loading="lazy">
      <div>
        <div class="hero-testimonial-text">\u201E${esc(t.quote)}\u201C</div>
        <div class="hero-testimonial-author">${esc(t.name)}${t.role ? ', ' + esc(t.role) : ''}</div>
      </div>
    </div>`;
  } catch { /* silent */ }
}

// ====== STATS (single line) ======
function renderStats(allEvents) {
  const el = document.getElementById('stats');
  const cities = [...new Set(allEvents.map(e => e.location?.city).filter(Boolean))];
  const totalFb = allEvents.reduce((s, e) => s + (e.stats?.totalFeedback || 0), 0);
  el.innerHTML = `<strong>${allEvents.length}</strong> Events in <strong>${cities.length}</strong> St\u00e4dten \u00b7 <strong>${totalFb}</strong> Stimmen`;
}

// ====== HERO BACKGROUND PHOTO ======
function renderHeroBg(allEvents) {
  const withPhoto = allEvents.filter(e => e.groupPhoto);
  if (!withPhoto.length) return;
  const photo = withPhoto[Math.floor(Math.random() * withPhoto.length)];
  const el = document.getElementById('hero-bg');
  if (el) el.style.backgroundImage = `url(${photo.groupPhoto})`;
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
        ${lumaButton(ev, 'format-card-cta')}
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
function fmtRelative(s) {
  if (!s) return '';
  const d = new Date(s + 'T12:00:00');
  const now = new Date();
  const days = Math.ceil((d - now) / 86400000);
  if (days <= 0) return 'Heute';
  if (days === 1) return 'Morgen';
  if (days <= 7) return `in ${days} Tagen`;
  return fmtDateNoDay(s);
}
function fmtDateNoDay(s) {
  if (!s) return '';
  const d = new Date(s + 'T12:00:00');
  if (isNaN(d)) return s;
  const months = ['J\u00e4n', 'Feb', 'M\u00e4r', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${d.getDate()}. ${months[d.getMonth()]}`;
}
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
function lumaButton(ev, cls) {
  if (!ev.lumaUrl) return '';
  if (ev.lumaId) {
    return `<a href="${escUrl(ev.lumaUrl)}" class="${cls}" onclick="openLumaCheckout('${esc(ev.lumaId)}');return false">Dabei sein</a>`;
  }
  return `<a href="${escUrl(ev.lumaUrl)}" target="_blank" rel="noopener" class="${cls}">Dabei sein</a>`;
}

function openLumaCheckout(eventId) {
  const overlay = document.createElement('div');
  overlay.className = 'luma-modal';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `<div class="luma-modal-inner">
    <div class="luma-modal-header">
      <button class="luma-modal-close" onclick="this.closest('.luma-modal').remove()">&times;</button>
    </div>
    <iframe class="luma-modal-iframe" src="https://lu.ma/embed/event/${eventId}/simple" allow="fullscreen; payment" style="width:100%;height:100%;border:none"></iframe>
  </div>`;
  document.body.appendChild(overlay);
}

function initLumaButtons() { /* no-op, buttons use onclick directly */ }
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function escUrl(u) { if (!u) return ''; try { return new URL(u).href; } catch { return esc(u); } }

// ====== PARTNER LOGOS + FOOTER ======
function renderFooter() {
  const logos = [
    { src: 'https://kinn.at/public/logos/inncubator.svg', alt: 'Inncubator', url: 'https://inncubator.at' },
    { src: 'https://kinn.at/public/logos/impacthub.svg', alt: 'Impact Hub Tirol', url: 'https://tirol.impacthub.net' },
    { src: 'https://kinn.at/public/logos/wundervoll.svg', alt: 'Das Wundervoll', url: 'https://daswundervoll.at' },
    { src: 'https://kinn.at/public/logos/raum_13.svg', alt: 'Raum13', url: 'https://www.raum13.at' },
    { src: 'https://kinn.at/public/logos/filmbase.svg', alt: 'Filmbase', url: 'https://filmbase.at' },
    { src: 'https://kinn.at/public/logos/werkstaette-wattens.svg', alt: 'Werkst\u00e4tte Wattens', url: 'https://www.werkstaette-wattens.at' },
    { src: 'https://kinn.at/public/logos/innovationsraum-kufstein.svg', alt: 'Innovationsraum Kufstein', url: 'https://www.coworkingspace.tirol/de/innovationsraum-kufstein.html' },
    { src: 'https://kinn.at/public/logos/land-tirol.svg', alt: 'Land Tirol', url: 'https://www.tirol.gv.at' },
  ];

  const el = document.getElementById('partners');
  el.innerHTML = `<div class="partner-label">Unterst\u00fctzt von</div>
    <div class="partner-row">${logos.map(l => `<a href="${l.url}" target="_blank" rel="noopener"><img src="${l.src}" alt="${esc(l.alt)}" loading="lazy"></a>`).join('')}</div>`;

  const links = document.getElementById('footer-links');
  if (links) {
    links.innerHTML = [
      '<a href="https://kinn.at/start">Starten</a>',
      '<a href="https://kinn.at/lade">Nachlesen</a>',
      '<a href="https://kinn.at/fund">Unterst\u00fctzen</a>',
      '<a href="https://kinn.at/dabei">Mitmachen</a>',
      '<a href="https://kinn.at/pages/privacy.html">Datenschutz</a>',
      '<a href="https://kinn.at/pages/agb.html">AGB</a>',
    ].join('');
  }
}

// ====== INIT ======
extractAuthFromHash();
loadAll();
loadTestimonial();
renderFooter();
