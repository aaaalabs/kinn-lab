// ====== PROFILE PANEL MODULE ======
// Lazy-loaded only when user is logged in
// esc() and escUrl() are on window (set by landing-v10.js)

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
  preferences: { allowMatching: false },
  badge: { active: true, linkType: 'linkedin', shortlink: 'kinn.at/b/42' },
  fund: { donated: true, amount: '2.50', visibility: 'public' },
  subscribedAt: '2025-03-12',
  events: 5,
};

// ====== SKILL CATALOG ======
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

// ====== LABEL CONSTANTS ======
const EXPERIENCE_LABELS = { junior: 'Junior', mid: 'Mid-Level', senior: 'Senior', lead: 'Lead' };
const AVAILABILITY_LABELS = { employed: 'Angestellt', freelancer: 'Freelancer', student: 'Student', 'between-jobs': 'Suchend', 'side-projects': 'Nebenprojekte' };
const SEARCH_LABELS = { active: 'Aktiv suchend', passive: 'Passiv', 'networking-only': 'Nur Networking' };
const CAN_OFFER_LABELS = { mentoring: 'Mentoring', 'code-review': 'Code Review', workshop: 'Workshop', projects: 'Projekte' };
const SEEKING_LABELS = { job: 'Job', freelance: 'Freelance', cofounder: 'Co-Founder', collaboration: 'Zusammenarbeit', learning: 'Lernen', inspiration: 'Inspiration' };

// ====== PANEL OPEN / CLOSE ======
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

// ====== PANEL RENDER ======
function renderPanel() {
  const header = document.getElementById('panel-header');
  const body = document.getElementById('panel-body');

  if (panelState.view === 'settings') {
    header.innerHTML = `<button class="panel-header-btn panel-back" onclick="panelState.view='profile';renderPanel()" style="font-size:20px;padding:4px 8px">\u2190</button>
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
    return `<div class="panel-value" onclick="startSelectEdit(this,'${path}',window['${labelsId}'])">${labels[val] || '<span class="empty">Auswählen</span>'}</div>`;
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
    section('Verfügbarkeit', selectField('supply.availability', AVAILABILITY_LABELS)),
    section('Kann anbieten', checksField('supply.canOffer', CAN_OFFER_LABELS)),
    section('Suche', checksField('demand.seeking', SEEKING_LABELS)),
    section('Suchstatus', selectField('demand.activeSearch', SEARCH_LABELS)),
    section('Interessen', textField('interests', 'demand.interests', 'Was interessiert dich?')),
    `<div class="panel-section panel-progress">
      <div class="panel-label">Profil</div>
      <div class="panel-progress-bar"><div class="panel-progress-fill" style="width:${pct}%"></div></div>
      <div class="panel-progress-text">${pct}% vollständig</div>
    </div>`,
  ].join('');
}

// ====== SKILL AUTOCOMPLETE ======
const MAX_SKILLS = 20;
let _acIndex = -1;

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
      <span class="skill-ac-dot" style="background:var(--border-s)"></span>&laquo;${esc(input.value.trim())}&raquo; hinzufügen
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

// ====== SETTINGS VIEW ======
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
  const sinceStr = `${['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][since.getMonth()]} ${since.getFullYear()}`;

  const hasLinkedIn = !!s.identity.linkedIn;
  const hasWebsite = !!s.identity.website;
  const hasBothLinks = hasLinkedIn && hasWebsite;
  let badgeLinkHtml = '';
  if (s.badge.active) {
    if (hasBothLinks) {
      const badgeLinkOptions = ['linkedin', 'website'].map(k => {
        const label = k === 'linkedin' ? 'LinkedIn' : 'Website';
        return `<span class="panel-fund-opt${k === s.badge.linkType ? ' active' : ''}" onclick="panelState.badge.linkType='${k}';renderPanel()">${label}</span>`;
      }).join('');
      badgeLinkHtml = `<div class="panel-meta" style="color:var(--dark);font-weight:500">Badge verlinkt auf</div>
        <div class="panel-fund-options" style="max-width:200px">${badgeLinkOptions}</div>`;
    } else {
      const target = hasLinkedIn ? 'LinkedIn' : hasWebsite ? 'Website' : '\u2014';
      badgeLinkHtml = `<div class="panel-meta">Verlinkt auf ${target}</div>`;
    }
  }
  const badgeHtml = s.badge.active
    ? `${badgeLinkHtml}
       <div class="panel-meta" style="margin-top:8px"><a href="https://${esc(s.badge.shortlink)}" target="_blank" style="color:var(--mint);font-weight:600;text-decoration:none">${esc(s.badge.shortlink)}</a></div>`
    : `<div class="panel-meta">${badgeStatus}</div>`;

  let fundHtml = '';
  if (s.fund.donated) {
    const visLabels = { anonym: 'Anonym', standard: 'Vorname + Initiale', public: 'Voller Name' };
    const visOptions = Object.entries(visLabels).map(([k, v]) =>
      `<span class="panel-fund-opt${k === s.fund.visibility ? ' active' : ''}" onclick="panelState.fund.visibility='${k}';renderPanel()">${v}</span>`
    ).join('');
    fundHtml = `<div class="panel-section">
      <div class="panel-label">Unterstützung</div>
      <div class="panel-meta">${esc(s.fund.amount)} EUR gespendet \u00b7 angezeigt als:</div>
      <div class="panel-fund-options">${visOptions}</div>
      <a href="https://kinn.at/fund" target="_blank" class="panel-fund-link">Unterstützer-Liste \u2192</a>
    </div>`;
  } else {
    fundHtml = `<div class="panel-section">
      <div class="panel-label">Unterstützung</div>
      <div class="panel-meta">Unabhängigkeit ist kein Feature. Ist eine Entscheidung.</div>
      <a href="https://kinn.at/fund" target="_blank" class="panel-fund-link">KINN unterstützen \u2192</a>
    </div>`;
  }

  el.innerHTML = `
    <div class="panel-section">
      <div class="panel-label">Matching</div>
      ${toggle('Matching erlauben', 'Passende Profile bei Events vorschlagen', 'preferences.allowMatching', s.preferences.allowMatching)}
    </div>
    <div class="panel-section panel-badge-section">
      <div>
        <div class="panel-label">KINN Badge</div>
        ${badgeHtml}
      </div>
      <svg class="panel-badge-icon" viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="1" width="62" height="42" rx="6"/>
        <circle cx="20" cy="18" r="6"/>
        <line x1="14" y1="32" x2="26" y2="32"/>
        <line x1="36" y1="14" x2="52" y2="14"/>
        <line x1="36" y1="22" x2="48" y2="22"/>
        <line x1="36" y1="30" x2="44" y2="30"/>
      </svg>
    </div>
    ${fundHtml}
    <div class="panel-section">
      <div class="panel-label">Mitglied seit</div>
      <div class="panel-meta">${sinceStr}</div>
    </div>
    <button class="panel-danger" onclick="alert('Mock: Abmelden-Flow')">Abmelden</button>`;
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
  const entries = Object.entries(labels);
  const items = entries.map(([k, v]) =>
    `<div class="panel-select-option${k === current ? ' active' : ''}" onmousedown="finishSelectPick('${path}','${k}')">${v}</div>`
  ).join('');
  el.outerHTML = `<div class="panel-select-list" tabindex="-1" onblur="renderPanel()">${items}</div>`;
  el.parentElement?.querySelector('.panel-select-list')?.focus();
}

function finishSelect(select, path) {
  setNestedVal(panelState, path, select.value);
  renderPanel();
}

function finishSelectPick(path, key) {
  setNestedVal(panelState, path, key);
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

// ====== LOAD PROFILE FROM API ======
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
    const total = 5;
    if (p.identity?.name) filled++;
    if (p.identity?.linkedIn) filled++;
    if (p.supply?.skills?.length) filled++;
    if (p.supply?.experience) filled++;
    if (p.demand?.seeking?.length) filled++;

    if (filled >= total) return; // Profile complete, no hint needed

    const pct = Math.round(filled / total * 100);
    el.innerHTML = `<div class="profile-hint">
      <div class="profile-hint-text">
        Dein Profil ist zu ${pct}% ausgefüllt. <a href="https://kinn.at/profil#profil">Vervollständigen</a> — so finden dich andere in der Community.
      </div>
      <div class="profile-hint-bar"><div class="profile-hint-fill" style="width:${pct}%"></div></div>
    </div>`;
  } catch { /* silent */ }
}

// ====== MODULE INIT ======
export function init() {
  // Attach all functions referenced by onclick handlers to window
  window.openProfile = openProfile;
  window.closeProfile = closeProfile;
  window.renderPanel = renderPanel;
  window.startEdit = startEdit;
  window.finishEdit = finishEdit;
  window.startSelectEdit = startSelectEdit;
  window.finishSelect = finishSelect;
  window.finishSelectPick = finishSelectPick;
  window.removeTag = removeTag;
  window.removeSkill = removeSkill;
  window.startTagAdd = startTagAdd;
  window.finishTagAdd = finishTagAdd;
  window.toggleCheck = toggleCheck;
  window.toggleSetting = toggleSetting;
  window.handleSkillInput = handleSkillInput;
  window.handleSkillKeydown = handleSkillKeydown;
  window.selectSkill = selectSkill;
  window.panelState = panelState;

  // Load profile data
  loadProfile();

  // ESC closes panel
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeProfile();
  });
}
