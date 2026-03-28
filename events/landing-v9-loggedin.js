// ====== CONFIG ======
const AUTH_DOMAIN = 'https://kinn.at';
const REDIRECT_URL = window.location.origin + '/events/landing-v9-loggedin.html';

// ====== AUTH (always logged-in preview with mock data) ======
function extractAuthFromHash() {}
function getEmail() { return ['verena', 'kinn.at'].join('@'); }
function isLoggedIn() { return true; }

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
    loadRadarEvents();
    // Preview mode: unlock all formats, force verified
    d.events.forEach(e => e.locked = false);
    d.verified = true;
    renderFormats(d.events.filter(e => e.type === 'talk' || e.type === 'kurs'), d.hero);

    const loginEl = document.getElementById('hero-login');
    if (isLoggedIn()) {
      loginEl.style.display = 'none';
      renderUserBar(d.verified);
      loadProfile();
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

  if (voting.status === 'fulfilled') {
    renderVoting(voting.value.topics || []);
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

  // TODO: replace mock topics with ev.topics from gated API
  const mockTopics = {
    'Innsbruck': { 'Vibe Coding': 12, 'RAG': 8, 'KI im Business': 6 },
    'Kufstein': { 'KI im Business': 9, 'Content AI': 5 },
  };

  const rows = all.map(ev => {
    const city = ev.locationCity || chapterFromName(ev.name, null) || 'Innsbruck';
    const lumaId = ev.lumaId;
    const href = ev.lumaUrl ? escUrl(ev.lumaUrl) : '#';

    const when = fmtRelative(ev.date);
    const topics = ev.topics || mockTopics[city] || {};
    const topicPills = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => `<span class="termin-topic">${esc(t)}</span>`)
      .join('');
    const topicsHtml = topicPills
      ? `<div class="termin-topics">${topicPills}</div>`
      : '';

    return `<a class="termin-row" href="${href}" target="_blank" rel="noopener">
      <span class="termin-city">${esc(city)}</span>
      <span class="termin-when">${esc(when)}</span>
      <span class="termin-arrow">\u2192</span>
    </a>${topicsHtml}`;
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
      { title: 'Daten und KI — Ansätze zur Verbesserung der Datenbasis', date: '2026-04-14', city: 'Innsbruck', detailUrl: 'https://dih-west.at/events/daten-und-ki-ansaetze-zur-verbesserung-der-datenbasis/' },
      { title: 'AI Business Circle', date: '2026-04-21', city: 'Innsbruck', detailUrl: 'https://dih-west.at/events/ai-business-circle-april/' },
    ];
    if (!events.length) return;

    const el = document.getElementById('radar-section');
    if (!el) return;

    const rows = events.map(ev => {
      const city = ev.city ? ' — ' + esc(ev.city) : '';
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

async function loadProfile() {
  const el = document.getElementById('profile-hint');
  if (!el) return;

  try {
    const token = localStorage.getItem('lab_session');
    if (!token) return;

    const res = await fetch(`https://kinn.at/api/profile/extended?token=${encodeURIComponent(token)}`);
    if (!res.ok) return;
    const data = await res.json();
    const p = data.profile || {};

    // Calculate profile completeness
    let filled = 0;
    let total = 5;
    if (p.identity?.name) filled++;
    if (p.identity?.linkedIn) filled++;
    if (p.supply?.skills?.length) filled++;
    if (p.supply?.experience) filled++;
    if (p.demand?.seeking?.length) filled++;

    if (filled >= total) return; // Profile complete, no hint needed

    const pct = Math.round(filled / total * 100);
    el.innerHTML = `<div class="profile-hint">
      <div class="profile-hint-text">
        Dein Profil ist zu ${pct}% ausgef\u00fcllt. <a href="https://kinn.at/profil#profil">Vervollst\u00e4ndigen</a> \u2014 so finden dich andere in der Community.
      </div>
      <div class="profile-hint-bar"><div class="profile-hint-fill" style="width:${pct}%"></div></div>
    </div>`;
  } catch { /* silent */ }
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

// ====== VOTING ======
function renderVoting(topics) {
  const el = document.getElementById('voting-section');
  if (!topics.length) return;
  const maxLen = 20;
  const items = topics.map(t => {
    const title = t.title.length > maxLen ? t.title.substring(0, maxLen) + '...' : t.title;
    return `<span class="voting-topic"><span class="voting-topic-n">${t.votes}</span>${esc(title)}</span>`;
  }).join('');
  el.innerHTML = `<div class="section reveal">
    <div class="section-label">Themen-Voting</div>
    <div class="voting">
      <div class="voting-topics">${items}</div>
      <button class="voting-cta" onclick="alert('Voting-Details kommen bald!')">Abstimmen \u2192</button>
    </div>
  </div>`;
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

// ====== PROFILE PANEL ======
// ====== PROFILE PANEL ======
const panelState = {
  view: 'profile', // 'profile' | 'settings'
  identity: { name: 'Verena Muster', linkedIn: 'linkedin.com/in/verena-muster', website: '' },
  supply: {
    skills: ['Product Management', 'AI Strategy', 'Design Thinking'],
    experience: 'senior',
    availability: 'employed',
    canOffer: ['mentoring', 'projects'],
  },
  demand: {
    seeking: ['collaboration', 'learning'],
    activeSearch: 'networking-only',
    interests: '',
  },
  preferences: { showInDirectory: true, allowMatching: true },
  badge: { active: true, linkType: 'linkedin' },
  subscribedAt: '2025-03-12',
  events: 5,
};

// ====== CURATED SKILLS (from KINN main, flat list with domain colors) ======
const SKILL_CATALOG = [
  // Kreativ
  ...['Midjourney','DALL-E','Stable Diffusion','ComfyUI','Adobe Firefly','Imagen','ControlNet','LoRA Training','Inpainting/Outpainting','Runway','Pika Labs','Sora','Google Veo','Stable Video','Luma AI','HeyGen','Synthesia','Lip Sync','Suno AI','Udio','ElevenLabs','Voice Cloning','Text-to-Speech','Speech-to-Text','Audio Enhancement','Stem Separation','Meshy AI','Luma AI Genie','NeRF','3D Asset Generation','ChatGPT','Claude','Gemini','Notion AI','Grammarly AI','Content Summarization'].map(s => ({ name: s, color: '#9B87F5' })),
  // Sprache
  ...['GPT','Llama','Mistral','LLM Fine-Tuning','Few-Shot Learning','Zero-Shot Learning','In-Context Learning','Token Optimization','Model Selection','Prompt Design','Context Window Management','Few-Shot Prompting','Zero-Shot Prompting','Chain-of-Thought','ReAct Prompting','Tree of Thoughts','Prompt Chaining','Role Prompting','Prompt Templates','System Prompts','RAG Architecture','Vector Databases','Embeddings','Semantic Search','Document Chunking','Hybrid Search','Knowledge Graphs','GraphRAG','Corrective RAG','Adaptive RAG','Multi-Vector Retrieval','Document Processing','Query Optimization','Transformers','BERT','Text Classification','Named Entity Recognition','Sentiment Analysis','Text Summarization','Question Answering','Machine Translation','Topic Modeling','Text Generation','Intent Classification','Speech Recognition'].map(s => ({ name: s, color: '#5ED9A6' })),
  // Vision
  ...['OpenCV','YOLO','Object Detection','Image Segmentation','Semantic Segmentation','Pose Estimation','Facial Recognition','OCR','Image Classification','Action Recognition','Depth Estimation','Image Captioning','Vision-Language Models','Text-to-Image Understanding','Visual Question Answering','Audio-Visual Learning','Document Understanding','Video Understanding','Cross-Modal Retrieval'].map(s => ({ name: s, color: '#4A90E2' })),
  // Engineering
  ...['GitHub Copilot','Cursor','Claude Code','v0','Windsurf','Devin','Bolt.new','Replit AI','Code Review','Bug Detection','Code Refactoring','Test Generation','Documentation Generation','Supervised Learning','Unsupervised Learning','Reinforcement Learning','Deep Learning','Neural Networks','Model Training','Feature Engineering','Model Evaluation','Transfer Learning','Hyperparameter Tuning','Ensemble Methods','Gradient Descent','CI/CD for ML','Model Versioning','MLflow','Kubeflow','Docker','Kubernetes','Model Monitoring','A/B Testing','Feature Stores','Model Registry','Experiment Tracking','Model Serving','Model Drift Detection','SQL','Data Warehousing','ETL/ELT Pipelines','Data Cleaning','Data Augmentation','Synthetic Data Generation','Data Labeling','Apache Spark','Apache Kafka','Data Lake Architecture','BigQuery/Snowflake','pandas/polars','AWS SageMaker','Google Cloud Vertex AI','Azure ML','Hugging Face','CUDA','GPU Optimization','Distributed Training','Model Quantization','Python','PyTorch','TensorFlow','JAX','scikit-learn','Hugging Face Transformers','Keras','NumPy'].map(s => ({ name: s, color: '#6B7280' })),
  // Anwendung
  ...['Campaign Optimization','Personalization Engines','Customer Segmentation','Predictive Analytics','Chatbots','Conversational AI','Virtual Assistants','Voice Assistants','LangChain','LangGraph','CrewAI','AutoGPT','AutoGen','BabyAGI','Agentic RAG','Tool Use/Function Calling','Agent Orchestration','Workflow Automation','Task Decomposition','Human-in-the-Loop'].map(s => ({ name: s, color: '#FF6B6B' })),
  // Forschung
  ...['AI Ethics','Bias Detection','Fairness Metrics','Explainable AI','AI Alignment','Red Teaming','AI Auditing','Adversarial Robustness','Privacy-Preserving ML','Model Governance'].map(s => ({ name: s, color: '#FBBF24' })),
];
// Deduplicate (Claude, Gemini etc. appear in multiple categories — keep first)
const SKILL_CATALOG_UNIQUE = [];
const _seen = new Set();
for (const s of SKILL_CATALOG) {
  const key = s.name.toLowerCase();
  if (!_seen.has(key)) { _seen.add(key); SKILL_CATALOG_UNIQUE.push(s); }
}

const EXPERIENCE_LABELS = { junior: 'Junior', mid: 'Mid-Level', senior: 'Senior', lead: 'Lead' };
const AVAILABILITY_LABELS = { employed: 'Angestellt', freelancer: 'Freelancer', student: 'Student', 'between-jobs': 'Suchend', 'side-projects': 'Nebenprojekte' };
const SEARCH_LABELS = { active: 'Aktiv suchend', passive: 'Passiv', 'networking-only': 'Nur Networking' };
const CAN_OFFER_LABELS = { mentoring: 'Mentoring', 'code-review': 'Code Review', workshop: 'Workshop', projects: 'Projekte' };
const SEEKING_LABELS = { job: 'Job', freelance: 'Freelance', cofounder: 'Co-Founder', collaboration: 'Zusammenarbeit', learning: 'Lernen', inspiration: 'Inspiration' };

function openProfile() {
  panelState.view = 'profile';
  document.getElementById('panel-overlay').classList.add('active');
  document.getElementById('profile-panel').classList.add('active');
  document.body.style.overflow = 'hidden';
  renderPanel();
}
function closeProfile() {
  document.getElementById('panel-overlay').classList.remove('active');
  document.getElementById('profile-panel').classList.remove('active');
  document.body.style.overflow = '';
}

function renderPanel() {
  const header = document.getElementById('panel-header');
  const body = document.getElementById('panel-body');

  if (panelState.view === 'settings') {
    header.innerHTML = `<button class="panel-header-btn panel-back" onclick="panelState.view='profile';renderPanel()">\u2190</button>
      <span class="panel-title">Einstellungen</span>
      <button class="panel-header-btn" onclick="closeProfile()">\u00d7</button>`;
    renderSettingsView(body);
  } else {
    header.innerHTML = `<span class="panel-title">Mein Profil</span>
      <button class="panel-header-btn" onclick="panelState.view='settings';renderPanel()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      </button>
      <button class="panel-header-btn" onclick="closeProfile()">\u00d7</button>`;
    renderProfileView(body);
  }
}

function renderProfileView(el) {
  const s = panelState;
  const section = (label, content) => `<div class="panel-section"><div class="panel-label">${label}</div>${content}</div>`;

  const textField = (key, path, placeholder) => {
    const val = getNestedVal(s, path);
    return val
      ? `<div class="panel-value" onclick="startEdit(this,'${path}','text')">${esc(val)}</div>`
      : `<div class="panel-value empty" onclick="startEdit(this,'${path}','text')">${placeholder}</div>`;
  };

  const selectField = (path, labels) => {
    const val = getNestedVal(s, path);
    const labelsId = '_sel_' + path.replace(/\./g, '_');
    window[labelsId] = labels;
    return `<div class="panel-value" onclick="startSelectEdit(this,'${path}',window['${labelsId}'])">${labels[val] || '<span class="empty">Ausw\u00e4hlen</span>'}</div>`;
  };

  const tagsField = (path) => {
    const arr = getNestedVal(s, path) || [];
    const items = arr.map(t => `<span class="panel-tag">${esc(t)}<span class="panel-tag-x" onclick="removeTag('${path}','${esc(t)}')">\u00d7</span></span>`).join('');
    return `<div class="panel-tags">${items}<span class="panel-tag-add" onclick="startTagAdd(this,'${path}')">+</span></div>`;
  };

  const checksField = (path, labels) => {
    const selected = getNestedVal(s, path) || [];
    const items = Object.entries(labels).map(([k, v]) => {
      const checked = selected.includes(k);
      return `<label class="panel-check${checked ? ' checked' : ''}">
        <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleCheck('${path}','${k}')"> ${v}
      </label>`;
    }).join('');
    return `<div class="panel-checks">${items}</div>`;
  };

  // Profile completeness
  let filled = 0;
  const total = 7;
  if (s.identity.name) filled++;
  if (s.identity.linkedIn) filled++;
  if (s.supply.skills.length) filled++;
  if (s.supply.experience) filled++;
  if (s.supply.canOffer.length) filled++;
  if (s.demand.seeking.length) filled++;
  if (s.demand.interests) filled++;
  const pct = Math.round(filled / total * 100);

  el.innerHTML = [
    // Event counter — prominent
    `<div class="panel-section" style="text-align:center;padding:8px 0 16px;border-bottom:1px solid var(--border);margin-bottom:24px">
      <div class="panel-event-count">${s.events}</div>
      <div class="panel-event-label">Events besucht</div>
    </div>`,
    section('Name', textField('name', 'identity.name', 'Name eingeben')),
    section('LinkedIn', textField('linkedIn', 'identity.linkedIn', 'LinkedIn-URL')),
    section('Website', textField('website', 'identity.website', 'Website-URL')),
    section('Skills', renderSkillAutocomplete()),
    section('Erfahrung', selectField('supply.experience', EXPERIENCE_LABELS)),
    section('Verf\u00fcgbarkeit', selectField('supply.availability', AVAILABILITY_LABELS)),
    section('Kann anbieten', checksField('supply.canOffer', CAN_OFFER_LABELS)),
    section('Suche', checksField('demand.seeking', SEEKING_LABELS)),
    section('Suchstatus', selectField('demand.activeSearch', SEARCH_LABELS)),
    section('Interessen', textField('interests', 'demand.interests', 'Was interessiert dich?')),
    `<div class="panel-section panel-progress">
      <div class="panel-label">Profil</div>
      <div class="panel-progress-bar"><div class="panel-progress-fill" style="width:${pct}%"></div></div>
      <div class="panel-progress-text">${pct}% vollst\u00e4ndig</div>
    </div>`,
  ].join('');
}

// ====== SKILL AUTOCOMPLETE ======
const MAX_SKILLS = 20;
let _acIndex = -1; // active dropdown index

function renderSkillAutocomplete() {
  const skills = panelState.supply.skills;
  const count = skills.length;
  const warnCls = count >= 18 ? ' warn' : '';

  const tags = skills.map(s => {
    const cat = SKILL_CATALOG_UNIQUE.find(c => c.name.toLowerCase() === s.toLowerCase());
    const dot = cat ? `<span class="skill-ac-dot" style="background:${cat.color}"></span>` : '';
    return `<span class="panel-tag">${dot}${esc(s)}<span class="panel-tag-x" onclick="removeSkill('${esc(s)}')">\u00d7</span></span>`;
  }).join('');

  return `<div class="skill-autocomplete">
    <input class="skill-ac-input" placeholder="Skill eingeben..." oninput="handleSkillInput(this)" onkeydown="handleSkillKeydown(event,this)" onfocus="handleSkillInput(this)" onblur="setTimeout(()=>{const d=document.getElementById('skill-dropdown');if(d)d.style.display='none'},150)" autocomplete="off"${count >= MAX_SKILLS ? ' disabled placeholder="Maximum erreicht"' : ''}>
    <span class="skill-ac-counter${warnCls}">${count}/${MAX_SKILLS}</span>
    <div class="skill-ac-dropdown" id="skill-dropdown" style="display:none"></div>
  </div>
  <div class="skill-selected-tags">${tags}</div>`;
}

function handleSkillInput(input) {
  const query = input.value.trim().toLowerCase();
  const dd = document.getElementById('skill-dropdown');
  if (!dd) return;
  _acIndex = -1;

  if (!query) { dd.style.display = 'none'; return; }

  const selected = new Set(panelState.supply.skills.map(s => s.toLowerCase()));
  const matches = SKILL_CATALOG_UNIQUE
    .filter(s => !selected.has(s.name.toLowerCase()) && s.name.toLowerCase().includes(query))
    .slice(0, 6);

  const exactExists = SKILL_CATALOG_UNIQUE.some(s => s.name.toLowerCase() === query) || selected.has(query);
  const showCustom = query.length >= 2 && !exactExists && !matches.some(m => m.name.toLowerCase() === query);

  if (!matches.length && !showCustom) { dd.style.display = 'none'; return; }

  let html = matches.map((m, i) =>
    `<div class="skill-ac-option" data-idx="${i}" data-value="${esc(m.name)}" onmousedown="selectSkill('${esc(m.name)}')">
      <span class="skill-ac-dot" style="background:${m.color}"></span>${esc(m.name)}
    </div>`
  ).join('');

  if (showCustom) {
    html += `<div class="skill-ac-option" data-idx="${matches.length}" data-value="${esc(input.value.trim())}" onmousedown="selectSkill('${esc(input.value.trim())}')">
      <span class="skill-ac-dot" style="background:var(--border-s)"></span>&laquo;${esc(input.value.trim())}&raquo; hinzuf\u00fcgen
    </div>`;
  }

  dd.innerHTML = html;
  dd.style.display = 'block';
}

function handleSkillKeydown(e, input) {
  const dd = document.getElementById('skill-dropdown');
  if (!dd || dd.style.display === 'none') {
    if (e.key === 'Escape') input.blur();
    return;
  }

  const options = dd.querySelectorAll('.skill-ac-option');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _acIndex = Math.min(_acIndex + 1, options.length - 1);
    updateAcHighlight(options);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _acIndex = Math.max(_acIndex - 1, -1);
    updateAcHighlight(options);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (_acIndex >= 0 && options[_acIndex]) {
      selectSkill(options[_acIndex].dataset.value);
    } else if (input.value.trim()) {
      selectSkill(input.value.trim());
    }
  } else if (e.key === 'Escape') {
    dd.style.display = 'none';
    _acIndex = -1;
  }
}

function updateAcHighlight(options) {
  options.forEach((o, i) => o.classList.toggle('active', i === _acIndex));
  if (_acIndex >= 0 && options[_acIndex]) {
    options[_acIndex].scrollIntoView({ block: 'nearest' });
  }
}

function selectSkill(name) {
  const skills = panelState.supply.skills;
  if (skills.length >= MAX_SKILLS) return;
  if (!skills.some(s => s.toLowerCase() === name.toLowerCase())) {
    skills.push(name);
  }
  renderPanel();
}

function removeSkill(name) {
  panelState.supply.skills = panelState.supply.skills.filter(s => s !== name);
  renderPanel();
}

function renderSettingsView(el) {
  const s = panelState;
  const toggle = (label, sub, key, val) => {
    const on = val ? 'on' : '';
    return `<div class="panel-toggle-row">
      <div><div class="panel-toggle-label">${label}</div>${sub ? `<div class="panel-toggle-sub">${sub}</div>` : ''}</div>
      <div class="panel-toggle ${on}" onclick="toggleSetting('${key}')"><div class="panel-toggle-dot"></div></div>
    </div>`;
  };

  const badgeStatus = s.badge.active ? 'Aktiv' : 'Nicht erstellt';
  const since = new Date(s.subscribedAt + 'T12:00:00');
  const sinceStr = `${['J\u00e4n','Feb','M\u00e4r','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][since.getMonth()]} ${since.getFullYear()}`;

  el.innerHTML = `
    <div class="panel-section">
      <div class="panel-label">Sichtbarkeit</div>
      ${toggle('Im Verzeichnis sichtbar', 'Andere Community-Mitglieder k\u00f6nnen dich finden', 'preferences.showInDirectory', s.preferences.showInDirectory)}
      ${toggle('Matching erlauben', 'Bei Events mit passenden Profilen verbunden werden', 'preferences.allowMatching', s.preferences.allowMatching)}
    </div>
    <div class="panel-section">
      <div class="panel-label">KINN Badge</div>
      <div class="panel-meta">${badgeStatus} \u00b7 Verkn\u00fcpft mit ${s.badge.linkType === 'linkedin' ? 'LinkedIn' : 'Website'}</div>
    </div>
    <div class="panel-section">
      <div class="panel-label">Mitglied seit</div>
      <div class="panel-meta">${sinceStr}</div>
    </div>
    <button class="panel-danger" onclick="alert('Mock: Abmelden-Flow')">Komplett abmelden</button>`;
}

// ====== INLINE EDIT HELPERS ======
function getNestedVal(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}
function setNestedVal(obj, path, val) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = val;
}

function startEdit(el, path, type) {
  const val = getNestedVal(panelState, path) || '';
  if (type === 'text') {
    el.outerHTML = `<input class="panel-input" value="${esc(val)}" onblur="finishEdit(this,'${path}')" onkeydown="if(event.key==='Enter')this.blur()" autofocus>`;
    el.parentElement?.querySelector('.panel-input')?.focus();
  }
}

function finishEdit(input, path) {
  setNestedVal(panelState, path, input.value.trim());
  renderPanel();
}

function startSelectEdit(el, path, labelsJson) {
  const labels = typeof labelsJson === 'string' ? JSON.parse(labelsJson) : labelsJson;
  const current = getNestedVal(panelState, path);
  const options = Object.entries(labels).map(([k, v]) =>
    `<option value="${k}" ${k === current ? 'selected' : ''}>${v}</option>`
  ).join('');
  el.outerHTML = `<select class="panel-select" onchange="finishSelect(this,'${path}')" onblur="finishSelect(this,'${path}')" autofocus>${options}</select>`;
}

function finishSelect(select, path) {
  setNestedVal(panelState, path, select.value);
  renderPanel();
}

function removeTag(path, tag) {
  const arr = getNestedVal(panelState, path) || [];
  setNestedVal(panelState, path, arr.filter(t => t !== tag));
  renderPanel();
}

function startTagAdd(el, path) {
  el.outerHTML = `<input class="panel-tag-input" placeholder="Eingeben..." onblur="finishTagAdd(this,'${path}')" onkeydown="if(event.key==='Enter')this.blur();if(event.key==='Escape'){this.value='';this.blur()}" autofocus>`;
  el.parentElement?.querySelector('.panel-tag-input')?.focus();
}

function finishTagAdd(input, path) {
  const val = input.value.trim();
  if (val) {
    const arr = getNestedVal(panelState, path) || [];
    if (!arr.includes(val)) arr.push(val);
    setNestedVal(panelState, path, arr);
  }
  renderPanel();
}

function toggleCheck(path, key) {
  const arr = getNestedVal(panelState, path) || [];
  if (arr.includes(key)) {
    setNestedVal(panelState, path, arr.filter(k => k !== key));
  } else {
    arr.push(key);
    setNestedVal(panelState, path, arr);
  }
  renderPanel();
}

function toggleSetting(path) {
  const current = getNestedVal(panelState, path);
  setNestedVal(panelState, path, !current);
  renderPanel();
}

// ESC closes panel
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeProfile();
});

// ====== INIT ======
extractAuthFromHash();
loadAll();
if (!isLoggedIn()) loadTestimonial(); // Only show testimonial for visitors
renderFooter();
