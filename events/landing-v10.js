// ====== CONFIG ======
const AUTH_DOMAIN = 'https://kinn.at';
const REDIRECT_URL = window.location.origin + '/events/landing-v10.html';

// ====== AUTH ======
function extractAuthFromHash() {
  const hash = window.location.hash;
  if (!hash) return;
  const params = new URLSearchParams(hash.substring(1));
  const token = params.get('token');
  if (token) {
    localStorage.setItem('lab_session', token);
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function isLoggedIn() { return !!localStorage.getItem('lab_session'); }

function getEmail() {
  const token = localStorage.getItem('lab_session');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || null;
  } catch { return null; }
}

// ====== LOAD ALL ======
async function loadAll() {
  const [gated, feedback] = await Promise.allSettled([
    fetch('/api/events/gated' + (getEmail() ? '?email=' + encodeURIComponent(getEmail()) : '')).then(r => r.json()),
    fetch('/api/events/feedback').then(r => r.json()),
  ]);

  if (gated.status === 'fulfilled') {
    const d = gated.value;
    const chapters = d.events.filter(e => e.type === 'chapter');
    renderTermine(d.hero, chapters);
    loadRadarEvents();
    renderFormats(d.events.filter(e => e.type === 'talk' || e.type === 'kurs'), d.hero);

    const loginEl = document.getElementById('hero-login');
    if (isLoggedIn()) {
      loginEl.style.display = 'none';
      renderUserBar(d.verified);
      import('./landing-v10-profile.js').then(m => m.init());
    } else {
      loginEl.innerHTML = `<a href="#" onclick="openModal();return false">Einloggen</a>`;
      loginEl.style.display = '';
    }
  }

  if (feedback.status === 'fulfilled') {
    const all = feedback.value.events || [];
    renderStats(all);
    renderHeroBg(all);
    const past = all.filter(e => e.groupPhoto || e.feedback?.length).reverse().slice(0, 10);
    renderPast(past);
  }

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
    const href = ev.lumaUrl ? escUrl(ev.lumaUrl) : '#';
    const when = fmtRelative(ev.date);

    return `<a class="termin-row" href="${href}" target="_blank" rel="noopener">
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

// ====== RADAR (external KI events, quiet rows) ======
async function loadRadarEvents() {
  try {
    // TODO: replace mock with fetch('https://kinn.at/api/events/widget?page=1') once CORS is configured
    const events = [
      { title: 'KI in der Freiwilligenarbeit', date: '2026-04-09', city: 'St. Johann', detailUrl: 'https://erwachsenenschulen.at/veranstaltungs-details/?eid=441906&vid=3250' },
      { title: 'Daten und KI \u2014 Ans\u00e4tze zur Verbesserung der Datenbasis', date: '2026-04-14', city: 'Innsbruck', detailUrl: 'https://dih-west.at/events/daten-und-ki-ansaetze-zur-verbesserung-der-datenbasis/' },
      { title: 'AI Business Circle', date: '2026-04-21', city: 'Innsbruck', detailUrl: 'https://dih-west.at/events/ai-business-circle-april/' },
    ];
    if (!events.length) return;

    const el = document.getElementById('radar-section');
    if (!el) return;

    const rows = events.map(ev => {
      const city = ev.city ? ' \u2014 ' + esc(ev.city) : '';
      const label = esc(ev.title || '') + `<span class="radar-city">${city}</span>`;
      const when = fmtDate(ev.date);
      const href = ev.detailUrl ? escUrl(ev.detailUrl) : ev.registrationUrl ? escUrl(ev.registrationUrl) : '#';
      const target = href !== '#' ? ' target="_blank" rel="noopener"' : '';
      return `<a class="radar-row" href="${href}"${target}>
        <span class="radar-title">${label}</span>
        <span class="radar-when">${esc(when)}</span>
      </a>`;
    }).join('');

    el.innerHTML = `<div class="section reveal">
      <div class="section-label">Was sonst passiert</div>
      <div class="radar-list">${rows}</div>
      <a class="radar-subscribe" href="https://kinn.at/api/radar/calendar.ics">KI Events abonnieren</a>
    </div>`;
  } catch { /* silent */ }
}

// ====== LOGGED-IN STATE ======
function renderUserBar(verified) {
  const el = document.getElementById('user-bar');
  if (!el) return;
  const email = getEmail() || '';
  const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  el.innerHTML = `<div class="user-bar">
    <span class="user-greeting">Hallo, <strong>${esc(name)}</strong></span>
    ${verified ? '<svg class="verified-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' : ''}
    <a href="#" onclick="openProfile();return false" class="user-profile-link">Mein Profil</a>
  </div>`;
}

// ====== TESTIMONIAL (crossfade rotation, logged-out only) ======
async function loadTestimonial() {
  const el = document.getElementById('hero-testimonial');
  if (!el) return;
  try {
    const res = await fetch('https://kinn.at/api/testimonials');
    if (!res.ok) return;
    const data = await res.json();
    const pool = (data.testimonials || []).filter(t => t.quote && t.name && t.image && t.quote.length < 160);
    if (!pool.length) return;

    let idx = Math.floor(Math.random() * pool.length);
    const render = (t) => `<div class="hero-testimonial">
      <img class="hero-testimonial-avatar" src="https://kinn.at/testimonials/images/${esc(t.image)}" alt="${esc(t.name)}" loading="lazy">
      <div>
        <div class="hero-testimonial-text">\u201E${esc(t.quote)}\u201C</div>
        <div class="hero-testimonial-author">${esc(t.name)}${t.role ? ', ' + esc(t.role) : ''}</div>
      </div>
    </div>`;

    el.innerHTML = render(pool[idx]);
    if (pool.length < 2) return;

    setInterval(() => {
      idx = (idx + 1) % pool.length;
      el.style.opacity = '0';
      setTimeout(() => {
        el.innerHTML = render(pool[idx]);
        el.style.opacity = '1';
      }, 400);
    }, 8000);
  } catch { /* silent */ }
}

// ====== STATS (single line) ======
function renderStats(allEvents) {
  const el = document.getElementById('stats');
  const cities = [...new Set(allEvents.map(e => e.location?.city).filter(Boolean))];
  const totalFb = allEvents.reduce((s, e) => s + (e.stats?.totalFeedback || 0), 0);
  el.innerHTML = `<strong>${allEvents.length}</strong> Events in <strong>${cities.length}</strong> St\u00e4dten \u00b7 <a href="https://kinn.at/stimmen" style="color:inherit;text-decoration:none"><strong>${totalFb}</strong> Stimmen</a>`;
}

// ====== HERO BACKGROUND PHOTO ======
function renderHeroBg(allEvents) {
  const withPhoto = allEvents.filter(e => e.groupPhoto);
  if (!withPhoto.length) return;
  const photo = withPhoto[Math.floor(Math.random() * withPhoto.length)];
  const el = document.getElementById('hero-bg');
  if (el) el.style.backgroundImage = `url(${photo.groupPhoto})`;
}

// ====== FORMAT LIST (typography-only) ======
function renderFormats(events, hero) {
  const el = document.getElementById('formats-section');
  if (!events.length) return;

  const heroUrl = hero?.lumaUrl || '#';
  const unlocked = events.filter(e => !e.locked);
  const locked = events.filter(e => e.locked);

  const formatRow = (ev, isLocked) => {
    const typeLabel = ev.type === 'talk' ? 'Talk' : ev.type === 'kurs' ? 'Kurs' : 'KINN';
    const displayName = ev.name.replace(/^KINN[:\s]+\w+\s*[-\u2013\u2014]\s*/i, '').trim() || ev.name;
    const meta = [fmtDate(ev.date), ev.location].filter(Boolean).join(' \u00b7 ');
    const inner = `<span class="format-row-type">${esc(typeLabel)}</span>
      <span class="format-row-title">${esc(displayName)}</span>
      <span class="format-row-meta">${esc(meta)}</span>`;

    if (isLocked) {
      return `<div class="format-row locked">${inner}</div>`;
    }
    const href = ev.lumaUrl ? escUrl(ev.lumaUrl) : '#';
    const target = ev.lumaUrl ? ' target="_blank" rel="noopener"' : '';
    return `<a class="format-row" href="${href}"${target}>
      ${inner}
      <span class="format-row-arrow">\u2192</span>
    </a>`;
  };

  let rows = unlocked.map(ev => formatRow(ev, false)).join('');
  rows += locked.map(ev => formatRow(ev, true)).join('');

  let hintHtml = '';
  if (locked.length) {
    const login = !isLoggedIn() ? `<a href="#" onclick="openModal();return false">Einloggen</a> oder ` : '';
    hintHtml = `<div class="format-lock-hint">
      Freigeschaltet nach deinem ersten KINN Donnerstag.
      ${login}<a href="${escUrl(heroUrl)}" target="_blank" rel="noopener">Zum n\u00e4chsten Donnerstag</a>
    </div>`;
  }

  el.innerHTML = `<div class="section reveal">
    <div class="section-label">Weitere Formate</div>
    <div class="format-list">
      ${rows}
    </div>
    ${hintHtml}
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

  // Quotes — clean typographic list
  let quotesHtml = '';
  if (allQuotes.length) {
    const top = allQuotes.filter(q => q.text && q.text.length > 15).slice(0, 6);
    const items = top.map(q => `<div class="quote-item">
      <div class="quote-item-text">\u201E${esc(q.text?.substring(0, 100))}${q.text?.length > 100 ? '...' : ''}\u201C</div>
      <div class="quote-item-author">${esc(q.firstName)} ${esc(q.lastInitial)} \u00b7 ${esc(q.event)}</div>
    </div>`).join('');
    quotesHtml = `<div class="quotes-list">${items}</div>`;
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
  return `<a href="${escUrl(ev.lumaUrl)}" target="_blank" rel="noopener" class="${cls}">Dabei sein</a>`;
}
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

  const nav = document.getElementById('footer-links');
  if (nav) {
    nav.innerHTML = [
      '<a href="https://kinn.at/start">Starten</a>',
      '<a href="https://kinn.at/lade">Nachlesen</a>',
      '<a href="https://kinn.at/fund">Unterst\u00fctzen</a>',
      '<a href="https://kinn.at/crew">Mitmachen</a>',
    ].join('');
  }
  const legal = document.getElementById('footer-legal');
  if (legal) {
    legal.innerHTML = '<a href="https://kinn.at/pages/privacy.html">Datenschutz</a><a href="https://kinn.at/pages/agb.html">AGB</a>';
  }
}

// ====== Expose for profile module and onclick handlers ======
window.esc = esc;
window.escUrl = escUrl;
window.openModal = openModal;
window.closeModal = closeModal;
window.handleLogin = handleLogin;

// ====== INIT ======
extractAuthFromHash();
loadAll();
if (!isLoggedIn()) loadTestimonial();
renderFooter();

// Scroll chevron: tap to scroll, hide at bottom
const chevron = document.querySelector('.scroll-chevron');
if (chevron) {
  chevron.addEventListener('click', () => {
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
  });
  window.addEventListener('scroll', () => {
    const atBottom = (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 50;
    chevron.style.opacity = atBottom ? '0' : '';
  }, { passive: true });
}
