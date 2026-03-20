// ====== STATE ======
let guests = [];
let kinnEvents = [];

// KINN SVG logo path data (inline, no external load)
const SVG_LOGO_PATHS = `<polygon points="495 20 569 153 569 20 654 20 654 288 572 288 498 159 498 288 416 288 416 20 495 20"/>
<path d="M682,20l79,.11,73,134V20h81v268h-80l-72-130v130h-78.5c-.61,0-1.53-.8-2.5,0V20Z"/>
<polygon points="100 20 100 136 160 20 256 20 182 146 262 288 166 288 100 159 100 288 21 288 21 20 100 20"/>
<path d="M359,20v266c0,.31,1.37,1.42,1,2.5h-82V20h81Z"/>`;

function svgLogo(cssClass) {
  return `<svg class="${cssClass}" viewBox="0 0 931 309" xmlns="http://www.w3.org/2000/svg">${SVG_LOGO_PATHS}</svg>`;
}

// ====== NAVIGATION ======
const PANEL_ALIASES = { tische: 'aufsteller', voting: 'abreiss', regeln: 'playbook' };

function showPanel(id, el) {
  id = PANEL_ALIASES[id] || id;
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  if (!panel) return;
  panel.classList.add('active');
  if (el) el.classList.add('active');
  else {
    document.querySelectorAll('.nav-links a').forEach(a => {
      if (a.getAttribute('onclick') && a.getAttribute('onclick').includes("'" + id + "'")) a.classList.add('active');
    });
  }
  history.replaceState(null, '', '#' + id);
}

function handleHashNav() {
  const hash = location.hash.replace('#', '');
  if (hash) showPanel(hash);
}

// ====== VOTING API ======
async function fetchTopTopics(limit = 4) {
  const res = await fetch('/api/voting/top-topics?limit=' + limit);
  if (!res.ok) throw new Error('API Fehler: ' + res.status);
  const data = await res.json();
  return data.topics || [];
}

function showVoteStatus(elementId, type, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '<span class="vote-status ' + type + '">' + message + '</span>';
  if (type === 'success') {
    setTimeout(() => { el.innerHTML = ''; }, 3000);
  }
}

// ====== CHAPTER HELPER ======
function parseChapter(eventName) {
  // KINN#18 Kufstein → "Kufstein", KINN#17 (no suffix) → "Innsbruck"
  const m = eventName.match(/KINN#\d+\s+(.*)/i);
  return m ? m[1].trim() : 'Innsbruck';
}

// ====== EVENTS API (Luma) ======
async function loadEvents() {
  try {
    const res = await fetch('/api/luma/events');
    if (!res.ok) return;
    const data = await res.json();
    kinnEvents = (data.events || []).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    populateChapters();
  } catch (e) {
    console.warn('[Toolkit] Luma Events API nicht erreichbar:', e.message);
  }
}

function populateChapters() {
  const now = new Date();
  const upcoming = kinnEvents.filter(ev =>
    new Date(ev.startAt) > now && /KINN#\d+/i.test(ev.name)
  );

  // Render pills
  const container = document.getElementById('event-pills');
  container.innerHTML = '';
  if (!upcoming.length) {
    container.textContent = 'Keine kommenden Events';
    populatePastEventSelect();
    return;
  }

  upcoming.forEach(ev => {
    const nrMatch = ev.name.match(/(KINN#?\d+)/i);
    const nr = nrMatch ? nrMatch[1].replace('KINN', '') : '';
    const chapter = parseChapter(ev.name);
    const pill = document.createElement('button');
    pill.className = 'event-pill';
    pill.dataset.eventId = ev.id;
    pill.innerHTML = `<span class="pill-nr">${escapeHtml(nr)}</span><span class="pill-chapter">${escapeHtml(chapter)}</span>`;
    pill.onclick = () => selectEvent(ev.id);
    container.appendChild(pill);
  });

  // Auto-select first
  selectEvent(upcoming[0].id);
  populatePastEventSelect();
}

function selectEvent(eventId) {
  const ev = kinnEvents.find(e => e.id === eventId);
  if (!ev) return;

  const nrMatch = ev.name.match(/(KINN#\d+)/i);
  const nr = nrMatch ? nrMatch[1] : ev.name;
  const chapter = parseChapter(ev.name);
  const shortLocation = ev.location?.name || '';

  document.getElementById('event-nr').value = nr;
  document.getElementById('event-select').value = ev.id;
  document.getElementById('chapter-select').value = chapter;
  document.getElementById('event-date').textContent = formatDate(ev.startAt);
  document.getElementById('event-location').textContent = shortLocation;

  // Update active pill
  document.querySelectorAll('.event-pill').forEach(p => p.classList.remove('active'));
  const activePill = document.querySelector(`.event-pill[data-event-id="${eventId}"]`);
  if (activePill) activePill.classList.add('active');

  updateLabels();
  loadGuests(ev.id);
}

function handleEventSelect() {}
function handleChapterChange() {
  const chapter = document.getElementById('chapter-select').value;
  const now = new Date();
  const ev = kinnEvents.find(e =>
    parseChapter(e.name) === chapter && new Date(e.startAt) > now
  );
  if (ev) selectEvent(ev.id);
}

// ====== GUESTS API (Luma) ======
async function loadGuests(eventId) {
  const tbody = document.getElementById('guest-tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-meta);padding:32px">Lade Gästeliste...</td></tr>';

  try {
    const res = await fetch('/api/luma/guests?event_id=' + encodeURIComponent(eventId));
    if (!res.ok) throw new Error('API Fehler: ' + res.status);
    const data = await res.json();
    guests = data.guests || [];
    updateDashboard();
  } catch (e) {
    console.warn('[Toolkit] Gästeliste konnte nicht geladen werden:', e.message);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-meta);padding:32px">Gästeliste konnte nicht geladen werden</td></tr>';
  }
}

function updateLabels() {
  const chapter = document.getElementById('chapter-select').value;
  const nr = document.getElementById('event-nr').value || '';
  const label = nr ? nr + ' ' + chapter : 'KINN ' + chapter;
  document.getElementById('fu-event').textContent = 'KINN ' + chapter;
  document.getElementById('fu-next').textContent = 'KINN ' + chapter;
  document.getElementById('notiz-event').value = label;
  document.getElementById('bew-event-title').textContent = label;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function updateDashboard() {
  const approved = guests.filter(g => g.status === 'approved');
  const declined = guests.filter(g => g.status === 'declined');
  const checkedIn = guests.filter(g => g.checkedIn);
  const going = approved.length;

  document.getElementById('stat-going').textContent = going;
  document.getElementById('stat-checkin').textContent = checkedIn.length;
  document.getElementById('stat-showup').textContent = going > 0 ? Math.round(checkedIn.length / going * 100) + '%' : '-';
  document.getElementById('stat-waitlist').textContent = '0';

  // Motiv distribution
  const motivs = {};
  approved.forEach(g => {
    if (g.motiv) {
      motivs[g.motiv] = (motivs[g.motiv] || 0) + 1;
    }
  });

  if (Object.keys(motivs).length > 0) {
    const motivCard = document.getElementById('motiv-card');
    motivCard.style.display = 'block';
    const bars = document.getElementById('motiv-bars');
    bars.innerHTML = '';
    const max = Math.max(...Object.values(motivs));
    for (const [k, v] of Object.entries(motivs)) {
      bars.innerHTML += `
        <div style="display:flex;align-items:center;gap:12px;margin:8px 0">
          <div style="width:200px;font-size:12px;font-weight:600;text-align:right">${escapeHtml(k)}</div>
          <div style="flex:1;background:var(--bg-subtle);border-radius:4px;height:24px;overflow:hidden">
            <div style="width:${v/max*100}%;height:100%;background:var(--mint);border-radius:4px;display:flex;align-items:center;padding-left:8px;font-size:11px;font-weight:700;color:var(--text-heading)">${v}</div>
          </div>
        </div>`;
    }
  }

  // Guest table
  const tbody = document.getElementById('guest-tbody');
  tbody.innerHTML = '';
  approved.forEach(g => {
    const ci = g.checkedIn ? '<span class="checkin-dot yes"></span>' : '<span class="checkin-dot no"></span>';
    const tag = g.checkedIn ? '<span class="tag tag-mint">da</span>' : '<span class="tag tag-orange">offen</span>';
    tbody.innerHTML += `
      <tr>
        <td>${ci}</td>
        <td><strong>${escapeHtml(g.firstName || g.name)}</strong> ${escapeHtml(g.lastName || '')}</td>
        <td style="font-size:11px;color:var(--text-meta)">${escapeHtml(g.email)}</td>
        <td>${g.motiv ? '<span class="tag tag-blue">' + escapeHtml(String(g.motiv).replace(/🤝\s?/,'').substring(0,20)) + '</span>' : '-'}</td>
        <td>${tag}</td>
        <td style="font-size:11px">${g.isFirstTimer ? '<span class="tag tag-mint">Erst</span>' : ''}</td>
      </tr>`;
  });

  if (declined.length > 0) {
    tbody.innerHTML += `<tr><td colspan="6" style="font-size:11px;color:var(--text-meta);padding-top:12px">${declined.length} abgesagt: ${escapeHtml(declined.map(g => g.firstName || g.name).join(', '))}</td></tr>`;
  }

  // Auto-fill event notiz
  document.getElementById('notiz-going').value = going;
  document.getElementById('notiz-checkin').value = checkedIn.length;
}

// ====== BADGES ======
function parseNames(raw) {
  return raw.split(/[,\n]+/).map(n => n.trim()).filter(Boolean);
}

function getBadgeData() {
  const guestNames = parseNames(document.getElementById('badge-guests-input').value);
  const teamNames = parseNames(document.getElementById('badge-team-input').value);
  const firstTimerNames = new Set(parseNames(document.getElementById('badge-firsttimer-input').value).map(n => n.toLowerCase()));

  const all = [];

  teamNames.sort((a, b) => a.localeCompare(b, 'de')).forEach(name => {
    all.push({ name, isTeam: true, isFirstTimer: firstTimerNames.has(name.toLowerCase()) });
  });
  guestNames.sort((a, b) => a.localeCompare(b, 'de')).forEach(name => {
    all.push({ name, isTeam: false, isFirstTimer: firstTimerNames.has(name.toLowerCase()) });
  });

  // Erstbesucher als eigene Badges (immer, auch bei gleichem Namen)
  parseNames(document.getElementById('badge-firsttimer-input').value)
    .sort((a, b) => a.localeCompare(b, 'de'))
    .forEach(name => {
      all.push({ name, isTeam: false, isFirstTimer: true });
    });

  return all;
}

function handleGenerateBadges() {
  const data = getBadgeData();
  const grid = document.getElementById('badge-grid');
  const eventLabel = document.getElementById('event-nr').value || '';
  grid.innerHTML = '';

  data.forEach(b => {
    const badge = document.createElement('div');
    badge.className = 'badge-preview';
    if (b.isTeam) badge.classList.add('team');
    if (b.isFirstTimer) badge.classList.add('first-timer');
    badge.innerHTML = `
      <div class="badge-header">
        <div class="badge-accent"></div>
        <span class="badge-brand">KINN</span>
      </div>
      <div class="badge-name-display">${escapeHtml(b.name)}</div>
      <div class="badge-footer">
        <span class="badge-event-label">${escapeHtml(eventLabel)}</span>
      </div>`;
    grid.appendChild(badge);
  });

  const info = document.getElementById('badge-info');
  const pages = Math.ceil(data.length / 10);
  const team = data.filter(b => b.isTeam).length;
  const guest = data.filter(b => !b.isTeam).length;
  const ft = data.filter(b => b.isFirstTimer).length;
  let text = '';
  if (team) text += team + ' Team';
  if (guest) text += (text ? ' + ' : '') + guest + ' Gäste';
  if (ft) text += (text ? ' + ' : '') + ft + ' Erstbesucher';
  if (data.length) text += ' · ' + pages + ' Seite' + (pages > 1 ? 'n' : '') + ' · 2x5 (80x50mm)';
  info.textContent = text;
}

function handlePrintBadges() {
  handleGenerateBadges();
  const data = getBadgeData();
  if (data.length === 0) return;

  const eventLabel = document.getElementById('event-nr').value || '';
  const printArea = document.getElementById('print-badges');
  const labelsPerPage = 10;
  let html = '';

  for (let p = 0; p < Math.ceil(data.length / labelsPerPage); p++) {
    html += '<div class="page"><div class="labels-grid">';
    const start = p * labelsPerPage;
    const end = Math.min(start + labelsPerPage, data.length);

    for (let i = start; i < end; i++) {
      const b = data[i];
      const cls = (b.isTeam ? ' team-badge' : '') + (b.isFirstTimer ? ' first-timer' : '');
      html += `
        <div class="label${cls}" style="position:relative">
          <div class="lbl-header">
            <div class="lbl-accent"></div>
            <span class="lbl-brand">KINN</span>
          </div>
          <div class="lbl-name">${escapeHtml(b.name)}</div>
          <div class="lbl-footer">
            <span class="lbl-event">${escapeHtml(eventLabel)}</span>
          </div>
        </div>`;
    }
    html += '</div></div>';
  }

  printArea.innerHTML = html;
  activatePrintArea('print-badges', 'size: A4 portrait; margin: 13.5mm 17.5mm 0 17.5mm;');
}

// ====== AUFSTELLER ======
function addTopicRow() {
  const container = document.getElementById('topic-inputs');
  const count = container.querySelectorAll('.topic-input').length + 1;
  const row = document.createElement('div');
  row.className = 'form-row';
  row.innerHTML = `
    <div class="form-group"><label>Tisch ${count}</label><input type="text" class="topic-input" placeholder="Thema..."></div>
    <div class="form-group"><label>Untertitel (optional)</label><input type="text" class="topic-emoji" placeholder="z.B. Austausch, Fragen"></div>`;
  container.appendChild(row);
}

async function handleLoadTopicsAufsteller() {
  showVoteStatus('aufsteller-vote-status', 'loading', 'Lade...');
  try {
    const topics = await fetchTopTopics(4);
    if (topics.length === 0) {
      showVoteStatus('aufsteller-vote-status', 'error', 'Keine Themen gefunden');
      return;
    }

    const inputs = document.querySelectorAll('.topic-input');

    // Fill existing inputs, add rows if needed
    topics.forEach((topic, i) => {
      if (i >= inputs.length) addTopicRow();
    });

    // Re-query after potential new rows
    const updatedInputs = document.querySelectorAll('.topic-input');
    topics.forEach((topic, i) => {
      if (updatedInputs[i]) {
        updatedInputs[i].value = topic.title;
      }
    });

    showVoteStatus('aufsteller-vote-status', 'success', topics.length + ' Themen geladen (' + topics.map(t => t.votes + ' Votes').join(', ') + ')');
  } catch (err) {
    showVoteStatus('aufsteller-vote-status', 'error', 'Fehler: ' + err.message);
  }
}

function getTopicData() {
  const topics = document.querySelectorAll('.topic-input');
  const subtitles = document.querySelectorAll('.topic-emoji');
  const result = [];
  topics.forEach((t, i) => {
    if (t.value.trim()) {
      result.push({ nr: result.length + 1, title: t.value.trim(), subtitle: subtitles[i]?.value.trim() || '' });
    }
  });
  return result;
}

function renderTentHalf(t, cssClass) {
  const sub = t.subtitle ? '<div class="tent-subtitle">' + escapeHtml(t.subtitle) + '</div>' : '';
  return `<div class="tent-half${cssClass ? ' ' + cssClass : ''}">
    ${svgLogo('tent-logo')}
    <div class="tent-nr">${t.nr}</div>
    <div class="tent-title">${escapeHtml(t.title)}</div>
    ${sub}
    <div class="tent-url">kinn.at</div>
  </div>`;
}

function handleGenerateAufsteller() {
  const data = getTopicData();
  const grid = document.getElementById('aufsteller-grid');
  grid.innerHTML = '';
  grid.className = 'aufsteller-grid';

  data.forEach(t => {
    grid.innerHTML += `
      <div class="tent-card-preview">
        ${renderTentHalf(t, 'top')}
        ${renderTentHalf(t, '')}
      </div>`;
  });
}

function handlePrintAufsteller() {
  const data = getTopicData();
  if (data.length === 0) return;
  const printArea = document.getElementById('print-aufsteller');
  let html = '';

  for (let i = 0; i < data.length; i += 4) {
    html += '<div class="auf-page">';
    for (let j = 0; j < 4; j++) {
      const t = data[i + j];
      if (t) {
        const sub = t.subtitle ? '<div class="auf-subtitle">' + escapeHtml(t.subtitle) + '</div>' : '';
        html += `<div class="auf-card">
          <div class="auf-half top">
            ${svgLogo('')}
            <div class="auf-nr">${t.nr}</div>
            <div class="auf-title">${escapeHtml(t.title)}</div>
            ${sub}
            <div class="auf-url">kinn.at</div>
          </div>
          <div class="auf-half">
            ${svgLogo('')}
            <div class="auf-nr">${t.nr}</div>
            <div class="auf-title">${escapeHtml(t.title)}</div>
            ${sub}
            <div class="auf-url">kinn.at</div>
          </div>
        </div>`;
      } else {
        html += '<div class="auf-card empty"></div>';
      }
    }
    html += '</div>';
  }

  printArea.innerHTML = html;
  handleGenerateAufsteller();
  activatePrintArea('print-aufsteller', 'size: A4 landscape; margin: 0;');
}

// ====== ABREISSZETTEL ======
async function handleLoadTopicsAbreiss() {
  showVoteStatus('abreiss-vote-status', 'loading', 'Lade...');
  try {
    const topics = await fetchTopTopics(4);
    if (topics.length === 0) {
      showVoteStatus('abreiss-vote-status', 'error', 'Keine Themen gefunden');
      return;
    }

    const textarea = document.getElementById('abreiss-topics');
    textarea.value = topics.map(t => t.title).join('\n');

    showVoteStatus('abreiss-vote-status', 'success', topics.length + ' Themen geladen');
    handleGenerateAbreiss();
  } catch (err) {
    showVoteStatus('abreiss-vote-status', 'error', 'Fehler: ' + err.message);
  }
}

function getAbreissData() {
  const text = document.getElementById('abreiss-topics').value;
  return text.split('\n').filter(t => t.trim()).map((t, i) => ({
    nr: i + 1, title: t.trim(), tab: t.trim().substring(0, 24)
  }));
}

function handleGenerateAbreiss() {
  const data = getAbreissData();
  const preview = document.getElementById('abreiss-preview');
  let html = '';

  data.forEach(t => {
    let tabs = '';
    for (let i = 0; i < 6; i++) {
      tabs += `<div class="tear-tab">
        ${svgLogo('tab-mini-logo')}
        <span class="tab-mini-nr">${t.nr}</span>
        <span class="tab-mini-title">${escapeHtml(t.tab)}</span>
        <span class="tab-mini-url">kinn.at</span>
      </div>`;
    }
    html += `
      <div class="tear-sheet-preview">
        <div class="tear-header">
          ${svgLogo('tear-logo')}
          <div class="tear-nr">${t.nr}</div>
          <div class="tear-title">${escapeHtml(t.title)}</div>
        </div>
        <div class="tear-cut"></div>
        <div class="tear-tabs">${tabs}</div>
      </div>`;
  });

  preview.innerHTML = html;
}

function handlePrintAbreiss() {
  const data = getAbreissData();
  if (data.length === 0) return;
  const printArea = document.getElementById('print-abreiss');
  let html = '';

  for (let i = 0; i < data.length; i += 2) {
    html += '<div class="abreiss-page">';
    for (let j = 0; j < 2; j++) {
      const t = data[i + j];
      if (!t) break;
      let tabs = '';
      for (let k = 0; k < 6; k++) {
        tabs += `<div class="p-tab">
          ${svgLogo('')}
          <span class="pt-nr">${t.nr}</span>
          <span class="pt-title">${escapeHtml(t.tab)}</span>
          <span class="pt-url">kinn.at</span>
        </div>`;
      }
      html += `<div class="p-tear-sheet">
        <div class="p-tear-header">
          ${svgLogo('')}
          <div class="p-nr">${t.nr}</div>
          <div class="p-title">${escapeHtml(t.title)}</div>
        </div>
        <div class="p-cut-line"></div>
        <div class="p-tabs">${tabs}</div>
      </div>`;
    }
    html += '</div>';
  }

  printArea.innerHTML = html;
  handleGenerateAbreiss();
  activatePrintArea('print-abreiss', 'size: A4; margin: 0;');
}

// ====== EVENT-NOTIZ ======
function handleSaveNotiz() {
  const data = {
    event: document.getElementById('notiz-event').value,
    date: document.getElementById('notiz-date').value,
    location: document.getElementById('notiz-location').value,
    host: document.getElementById('notiz-host').value,
    zahlen: {
      going: document.getElementById('notiz-going').value,
      checkin: document.getElementById('notiz-checkin').value,
      waitlist: document.getElementById('notiz-waitlist').value,
      firsttimer: document.getElementById('notiz-firsttimer').value,
      tables: document.getElementById('notiz-tables').value,
      donation: document.getElementById('notiz-donation').value
    },
    team: {
      host: document.getElementById('notiz-t-host').value,
      empfang: document.getElementById('notiz-t-empfang').value,
      mod1: document.getElementById('notiz-t-mod1').value,
      mod2: document.getElementById('notiz-t-mod2').value
    },
    motiv: {
      netzwerk: document.getElementById('notiz-m-netzwerk').value,
      business: document.getElementById('notiz-m-business').value,
      lernen: document.getElementById('notiz-m-lernen').value,
      orientierung: document.getElementById('notiz-m-orient').value
    },
    beobachtungen: {
      stimmung: document.getElementById('notiz-stimmung').value,
      good: document.getElementById('notiz-good').value,
      bad: document.getElementById('notiz-bad').value,
      firsttimer: document.getElementById('notiz-firsttimer-obs').value,
      abmoderation: document.getElementById('notiz-abmod').value
    },
    learnings: [
      document.getElementById('notiz-l1').value,
      document.getElementById('notiz-l2').value,
      document.getElementById('notiz-l3').value
    ].filter(l => l),
    savedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-notiz-${data.event || 'kinn'}-${data.date || 'undatiert'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handlePrintNotiz() {
  const printArea = document.getElementById('print-notiz');
  const event = document.getElementById('notiz-event').value || '';
  const date = document.getElementById('notiz-date').value || '';
  const location = document.getElementById('notiz-location').value || '';

  printArea.innerHTML = `
    <div style="font-family:'Work Sans',sans-serif;max-width:700px;padding:20px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <span style="font-family:'Work Sans',sans-serif;font-weight:700;font-size:18px;letter-spacing:3px;color:#5ED9A6">KINN</span>
        <span style="font-size:16px;font-weight:700;color:#2C3E50">Event-Notiz</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Event</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0;min-height:24px">${escapeHtml(event)}</div></div>
        <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Datum</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0;min-height:24px">${escapeHtml(date)}</div></div>
        <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Location</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0;min-height:24px">${escapeHtml(location)}</div></div>
        <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Host</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0;min-height:24px">${escapeHtml(document.getElementById('notiz-host').value)}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
        <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Registriert</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0">${document.getElementById('notiz-going').value || '-'}</div></div>
        <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Checked-in</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0">${document.getElementById('notiz-checkin').value || '-'}</div></div>
        <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Erstbesucher</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0">${document.getElementById('notiz-firsttimer').value || '-'}</div></div>
      </div>
      <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Stimmung</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0;min-height:24px">${escapeHtml(document.getElementById('notiz-stimmung').value)}</div></div>
      <div style="margin-top:12px"><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Was hat gut funktioniert?</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0;min-height:40px">${escapeHtml(document.getElementById('notiz-good').value)}</div></div>
      <div style="margin-top:12px"><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Was hat NICHT funktioniert?</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0;min-height:40px">${escapeHtml(document.getElementById('notiz-bad').value)}</div></div>
      <div style="margin-top:12px"><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#8a8578">Learnings</span><div style="border-bottom:1.5px solid #e8e2d5;padding:6px 0;min-height:40px">${escapeHtml([document.getElementById('notiz-l1').value, document.getElementById('notiz-l2').value, document.getElementById('notiz-l3').value].filter(Boolean).join(' / '))}</div></div>
    </div>`;
  activatePrintArea('print-notiz');
}

// ====== BEWERTUNGSBOGEN ======
function handleGenerateBewertung() {
  const event = document.getElementById('event-nr').value;
  const title = event + ' ' + document.getElementById('chapter-select').value;
  document.getElementById('bew-event-title').textContent = title;
  document.getElementById('bewertung-preview').style.display = '';
}

function handlePrintBewertung() {
  handleGenerateBewertung();
  const title = document.getElementById('bew-event-title').textContent;
  const printArea = document.getElementById('print-bewertung');

  const cardHtml = `
    <div class="bew-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-family:'Work Sans',sans-serif;font-weight:700;font-size:14px;letter-spacing:2px;color:#5ED9A6">KINN</span>
        <span style="font-size:12px;font-weight:700;color:#2C3E50">${escapeHtml(title)}</span>
      </div>
      <div style="margin-bottom:10px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#8a8578">War der Donnerstag heute für dich wertvoll?</div>
        <div style="display:flex;gap:6px;margin-top:4px">
          ${[1,2,3,4,5].map(n => '<div style="width:24px;height:24px;border:1.5px solid #e8e2d5;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#8a8578">' + n + '</div>').join('')}
          <span style="font-size:9px;color:#8a8578;margin-left:4px;align-self:center">1=gar nicht · 5=sehr</span>
        </div>
      </div>
      <div style="margin-bottom:10px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#8a8578">Mindestens 1 relevanten Kontakt gemacht?</div>
        <div style="display:flex;gap:8px;margin-top:4px">
          <div style="border:1.5px solid #e8e2d5;border-radius:4px;padding:4px 16px;font-size:11px;font-weight:600">Ja</div>
          <div style="border:1.5px solid #e8e2d5;border-radius:4px;padding:4px 16px;font-size:11px;font-weight:600">Nein</div>
        </div>
      </div>
      <div style="margin-bottom:10px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#8a8578">Was nimmst du heute mit?</div>
        <div style="border-bottom:1.5px solid #e8e2d5;min-height:30px;margin-top:4px"></div>
      </div>
      <div>
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#8a8578">Kommst du nächste Woche wieder?</div>
        <div style="display:flex;gap:6px;margin-top:4px">
          <div style="border:1.5px solid #e8e2d5;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:600">Ja, fix!</div>
          <div style="border:1.5px solid #e8e2d5;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:600">Vielleicht</div>
          <div style="border:1.5px solid #e8e2d5;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:600">Eher nicht</div>
        </div>
      </div>
      <div style="margin-top:10px;text-align:center">
        <span style="font-family:'Work Sans',sans-serif;font-size:8px;font-weight:700;color:#BDB2A1;letter-spacing:1.5px">KINN · kinn.at · Tirols KI-Community</span>
      </div>
    </div>`;

  printArea.innerHTML = '<div class="bew-grid">' + cardHtml + cardHtml + cardHtml + cardHtml + '</div>';
  activatePrintArea('print-bewertung');
}

// ====== FOLLOW-UP ======
function handleCopyFollowup(btn) {
  const chapter = document.getElementById('chapter-select').value;
  const text = `Hey!

Danke fürs Dabeisein gestern beim KINN ${chapter}.

Zwei kurze Fragen - dauert 10 Sekunden:

1. War der Donnerstag für dich wertvoll? (Ja / Geht so / Nein)
2. Hast du mindestens 1 relevanten Kontakt gemacht? (Ja / Nein)

Nächster KINN ${chapter}: [Datum]. Gleiche Zeit, gleicher Ort.

Bis bald!
Thomas`;

  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = 'Kopiert!';
    setTimeout(() => btn.textContent = prev, 2000);
  });
}

function handleChapterChange() {
  const chapter = document.getElementById('chapter-select').value;
  selectEventForChapter(chapter);
}

// ====== TEXTE / AUSSENDUNGEN ======
function getTexteVars() {
  const chapter = document.getElementById('chapter-select').value;
  const nr = document.getElementById('event-nr').value || '';
  const date = document.getElementById('event-date').value || '[Datum]';
  const location = document.getElementById('event-location').value || '[Location]';
  const note = document.getElementById('texte-location-note')?.value || '';
  const topics = (document.getElementById('texte-topics')?.value || '')
    .split('\n').map(t => t.trim()).filter(Boolean);
  return { chapter, nr, date, location, note, topics, label: nr ? nr + ' ' + chapter : 'KINN ' + chapter };
}

function generateTexte() {
  const v = getTexteVars();
  const topicList = v.topics.length
    ? v.topics.map((t, i) => `• Tisch ${i + 1}: ${t}`).join('\n')
    : '• Thementische werden noch bekannt gegeben';

  // 1. Event-Beschreibung
  document.getElementById('texte-event-desc').textContent =
`KINN goes ${v.chapter}!${v.note ? ' ' + v.note : ''}

${v.date} · ${v.location}
8:00 – 9:00 Uhr

Welcome! To join this event, please register below.

Warum ${v.chapter}?

Weil es auch hier Neugierige auf KI gibt. Wir bringen den KINN-Spirit in die Region.

Was euch erwartet:

• Thementische – wählt! Die Crowd entscheidet. 🙌
• Kaffee und Frühstück, ein offener Raum für echten Austausch
• Echte Gespräche – keine Vorträge, kein Programm, nur Kaffee und Klartext
• Neue Gesichter aus ${v.chapter} treffen auf KINN-Stammcrew

Limitierte Plätze

Wir haben begrenzte Plätze. Reservierung für Neueinsteiger mit höherer Priorität.

Tipp: Für die ersten Events rechtzeitig anmelden.

Wann: ${v.date}, 08:00 bis 09:00
Wo: ${v.location}

Fragen? kontakt@kinn.at
Mehr über KINN: kinn.at`;

  // 2. Voting Blast
  document.getElementById('texte-voting').textContent =
`Donnerstag ${v.chapter} – welches Thema ist deins?

Servus zusammen,

übermorgen Donnerstag – ${v.label} bei ${v.location}.${v.note ? ' ' + v.note + '.' : ''}

Damit wir die Thementische gut aufteilen können, stimmt bitte vorher ab:

👉 kinn.at

Von Agentic Workflows über Tourismus & Gastgewerbe bis Vibe Coding – aktuell 20+ Themen zur Auswahl. Eure Stimmen entscheiden, welche Themen einen Tisch bekommen.

Tischwahl dann vor Ort. First come, first serve.

Bis Donnerstag,
Thomas`;

  // 3. Themen & Ablauf Blast
  document.getElementById('texte-ablauf').textContent =
`${v.label}: Eure Themen für Donnerstag

Stimmen sind eingegangen – eure Tische stehen:

${topicList}

SO FUNKTIONIERT'S:

Check-in ab 7:45 – dann setzt du dich zu deinem Tisch.
First come, first serve.

WICHTIG BEI DER TISCHWAHL:

Der Tisch-Moderator leitet die Runde. Frag nicht nur "Was kann ich von euch lernen?" sondern auch "Was kann ich beitragen?"

Ablauf am Tisch:
• Kurze Vorstellungsrunde (Vorname, was machst du, was interessiert dich)
• Offener Austausch zum Tischthema
• Um 8:40 Wrap-up
• 8:50 gemeinsames Blitzfeedback + Gruppenfoto

Den Tisch wählen – und eure Erfahrungen teilen – ist für andere Gold wert.

Überleg dir auf dem Weg zum KINN:
• Ein Thema wo du neugierig bist
• Ein Thema wo du beitragen kannst

Bis Donnerstag!
Thomas`;

  // 4. Post-Event Blast
  document.getElementById('texte-postevent').textContent =
`Servus zusammen,

danke fürs Dabeisein gestern beim ${v.label}!

Danke für euer Feedback. Mehrere von euch haben geschrieben dass sie genau so einen Austausch gebraucht haben. Das freut uns.

Wer gestern dabei war und will, dass das weitergeht – zwei Sachen:

• Drüberposten: gerne reden, taggen, posten. Das hilft mehr als jede Werbung.

• Auf kinn.at/fund könnt ihr KINN direkt unterstützen – jeder Euro geht in Frühstück, Räume und Infrastruktur – transparent und ohne Kleingedrucktes.

Nächster KINN ${v.chapter}: [Datum]. Gleiche Zeit, gleicher Ort.

Bis bald,
Thomas`;
}

function copyTexte(elementId, btn) {
  const text = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = 'Kopiert!';
    setTimeout(() => btn.textContent = prev, 2000);
  });
}

// ====== PRINT HELPER ======
let _pageStyle = null;
function activatePrintArea(id, pageCSS) {
  document.querySelectorAll('.print-area').forEach(a => a.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (pageCSS) {
    _pageStyle = document.createElement('style');
    _pageStyle.textContent = '@page { ' + pageCSS + ' }';
    document.head.appendChild(_pageStyle);
  }
  window.print();
  document.getElementById(id).classList.remove('active');
  if (_pageStyle) { _pageStyle.remove(); _pageStyle = null; }
}

// ====== UTILS ======
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ====== BADGE INPUT WATCHER ======
function updateBadgeButtons() {
  const hasNames = document.getElementById('badge-guests-input').value.trim() ||
                   document.getElementById('badge-team-input').value.trim();
  document.getElementById('btn-badge-preview').disabled = !hasNames;
  document.getElementById('btn-badge-print').disabled = !hasNames;
}

// ====== NACHBEREITUNG / CRM ======
let pastLeads = [];
let pastFilter = 'alle';

function populatePastEventSelect() {
  const container = document.getElementById('past-event-pills');
  if (!container) return;
  const now = new Date();
  const past = kinnEvents
    .filter(ev => new Date(ev.startAt) < now && /KINN#\d+/i.test(ev.name))
    .reverse()
    .slice(0, 3);

  container.innerHTML = '';
  if (!past.length) {
    container.textContent = 'Keine vergangenen Events';
    return;
  }

  past.forEach(ev => {
    const nrMatch = ev.name.match(/(KINN#?\d+)/i);
    const nr = nrMatch ? nrMatch[1].replace('KINN', '') : '';
    const chapter = parseChapter(ev.name);
    const pill = document.createElement('button');
    pill.className = 'event-pill';
    pill.dataset.eventId = ev.id;
    pill.innerHTML = `<span class="pill-nr">${escapeHtml(nr)}</span><span class="pill-chapter">${escapeHtml(chapter)}</span>`;
    pill.onclick = () => selectPastEvent(ev.id);
    container.appendChild(pill);
  });

  selectPastEvent(past[0].id);
}

async function selectPastEvent(eventId) {
  document.getElementById('past-event-select').value = eventId;
  document.querySelectorAll('#past-event-pills .event-pill').forEach(p => p.classList.remove('active'));
  const pill = document.querySelector(`#past-event-pills .event-pill[data-event-id="${eventId}"]`);
  if (pill) pill.classList.add('active');

  const list = document.getElementById('past-lead-list');
  list.innerHTML = '<div class="crm-empty">Lade...</div>';

  try {
    const res = await fetch('/api/crm/leads?event_id=' + encodeURIComponent(eventId));
    if (!res.ok) throw new Error('API Fehler: ' + res.status);
    const data = await res.json();
    pastLeads = data.leads || [];
    pastFilter = 'alle';
    renderCrm();
  } catch (e) {
    console.warn('[Toolkit] CRM laden fehlgeschlagen:', e.message);
    list.innerHTML = '<div class="crm-empty">Konnte nicht geladen werden</div>';
  }
}

function handlePastEventSelect() {
  const val = document.getElementById('past-event-select').value;
  if (val) selectPastEvent(val);
}

function handlePastFilter(filter, btn) {
  pastFilter = filter;
  document.querySelectorAll('.crm-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCrm();
}

function renderCrm() {
  const approved = pastLeads.filter(g => g.status === 'approved');
  const checkedIn = approved.filter(g => g.checkedIn);
  const going = approved.length;

  // Stats
  document.getElementById('past-stat-going').textContent = going;
  document.getElementById('past-stat-checkin').textContent = checkedIn.length;
  document.getElementById('past-stat-showup').textContent = going > 0 ? Math.round(checkedIn.length / going * 100) + '%' : '-';

  // CRM counts
  const counts = { offen: 0, kontaktiert: 0, erledigt: 0 };
  approved.forEach(g => {
    const st = g.followUp?.status || 'offen';
    if (counts[st] !== undefined) counts[st]++;
  });
  document.getElementById('past-cnt-alle').textContent = going;
  document.getElementById('past-cnt-offen').textContent = counts.offen;
  document.getElementById('past-cnt-kontaktiert').textContent = counts.kontaktiert;
  document.getElementById('past-cnt-erledigt').textContent = counts.erledigt;

  // Progress bar
  const prog = document.getElementById('past-progress');
  if (going > 0) {
    const pctE = (counts.erledigt / going * 100).toFixed(1);
    const pctK = (counts.kontaktiert / going * 100).toFixed(1);
    prog.innerHTML = `<div class="crm-seg-erledigt" style="width:${pctE}%"></div><div class="crm-seg-kontaktiert" style="width:${pctK}%"></div>`;
  } else {
    prog.innerHTML = '';
  }

  // Filter
  const filtered = pastFilter === 'alle'
    ? approved
    : approved.filter(g => (g.followUp?.status || 'offen') === pastFilter);

  // Lead cards
  const list = document.getElementById('past-lead-list');
  list.innerHTML = '';
  if (!filtered.length) {
    list.innerHTML = '<div class="crm-empty">Keine Leads</div>';
    return;
  }

  filtered.forEach(g => {
    const st = g.followUp?.status || 'offen';
    const notizen = g.followUp?.notizen || '';
    const ci = g.checkedIn ? '<span class="checkin-dot yes"></span>' : '<span class="checkin-dot no"></span>';
    const motiv = g.motiv ? escapeHtml(String(g.motiv)) : '';
    const doneCls = st === 'erledigt' ? ' crm-done' : '';
    const noteCls = notizen ? ' crm-has-note' : '';

    const card = document.createElement('div');
    card.className = 'crm-card' + doneCls + noteCls;
    card.dataset.guestId = g.id;
    card.innerHTML = `
      <div class="crm-card-header" onclick="toggleCrmCard(this.parentElement)">
        ${ci}
        <span class="crm-card-name"><strong>${escapeHtml(g.firstName || g.name)}</strong> ${escapeHtml(g.lastName || '')}</span>
        <span class="crm-card-motiv">${motiv || '—'}</span>
        <span class="crm-status-chip crm-st-${st}">${st}</span>
        <span class="crm-card-chevron">▼</span>
      </div>
      <div class="crm-card-panel">
        ${g.mitbringsel ? '<div style="font-size:12px;color:var(--text-meta);margin-bottom:10px">Mitbringsel: <strong style="color:var(--text-heading)">' + escapeHtml(String(g.mitbringsel)) + '</strong></div>' : ''}
        <div class="crm-status-btns">
          <button class="crm-status-btn${st === 'offen' ? ' active-st' : ''}" onclick="updateCrmStatus('${g.id}','offen')">Offen</button>
          <button class="crm-status-btn${st === 'kontaktiert' ? ' active-st' : ''}" onclick="updateCrmStatus('${g.id}','kontaktiert')">Kontaktiert</button>
          <button class="crm-status-btn${st === 'erledigt' ? ' active-st' : ''}" onclick="updateCrmStatus('${g.id}','erledigt')">Erledigt</button>
        </div>
        <label class="crm-notes-label">Notizen</label>
        <textarea class="crm-notes" data-guest-id="${g.id}" onblur="saveCrmNotes(this)" placeholder="Notizen...">${escapeHtml(notizen)}</textarea>
      </div>`;
    list.appendChild(card);
  });
}

function toggleCrmCard(card) {
  card.classList.toggle('expanded');
}

async function updateCrmStatus(guestId, status) {
  const eventId = document.getElementById('past-event-select').value;
  try {
    const res = await fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, guest_id: guestId, status }),
    });
    if (!res.ok) throw new Error('Update fehlgeschlagen');
    const lead = pastLeads.find(g => g.id === guestId);
    if (lead) lead.followUp = { ...lead.followUp, status };
    renderCrm();
  } catch (e) {
    console.warn('[Toolkit] CRM Status-Update fehlgeschlagen:', e.message);
  }
}

async function saveCrmNotes(textarea) {
  const guestId = textarea.dataset.guestId;
  const notizen = textarea.value;
  const eventId = document.getElementById('past-event-select').value;
  try {
    await fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, guest_id: guestId, notizen }),
    });
    const lead = pastLeads.find(g => g.id === guestId);
    if (lead) lead.followUp = { ...lead.followUp, notizen };
  } catch (e) {
    console.warn('[Toolkit] Notizen speichern fehlgeschlagen:', e.message);
  }
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
  handleHashNav();
  ['badge-guests-input', 'badge-team-input'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateBadgeButtons);
  });
});
window.addEventListener('hashchange', handleHashNav);
