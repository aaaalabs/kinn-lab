# Ops Toolkit Redesign — Manual-Style + Cross-Links

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Ops Toolkit (`kinn-ops-toolkit.html`) to visually match the Manual (`/manual/index.html`) and add bidirectional cross-links between Manual (theory) and Toolkit (practice).

**Architecture:** Replace the dark topbar/tabs with the Manual's light glassmorphism nav. Keep all JS functionality intact. Tab navigation becomes the Manual-style clickable top-nav (horizontal scroll of section links). Cross-links from Manual sections to corresponding Toolkit panels.

**Tech Stack:** Vanilla HTML/CSS/JS, same as current. No dependencies added.

---

## Context

### Current state
- **Manual** (`/manual/index.html`): 13 sections, light glassmorphism nav, white/subtle bg, Work Sans, `--text-heading: #2C3E50`, container 820px
- **Toolkit** (`/playgrounds/Playbook/kinn-ops-toolkit.html`): 8 tab panels, dark topbar (ecru bg, Montserrat headings, `--heavy-metal: #2B3228`), 1904 lines, interactive JS (CSV import, badge generator, print layouts, voting API)

### Target state
- Toolkit in new location: `/toolkit/index.html` (outside `/playgrounds` auth wall, like `/manual`)
- Visual: Same nav, colors, typography as Manual
- Navigation: Top-nav with horizontal scrollable panel links (replaces dark tabs)
- All JS functionality preserved: CSV import, badge printing, tent card generation, event-notiz forms, voting API, follow-up copy
- Print layouts: Preserved as-is (they use absolute colors, not CSS vars)
- Cross-links: Manual links to Toolkit panels where relevant; Toolkit links back to Manual sections

### Design system alignment

| Property | Manual (target) | Toolkit (current) | Action |
|----------|----------------|-------------------|--------|
| Font | Work Sans 300-900 | Work Sans + Montserrat | Remove Montserrat, use Work Sans throughout |
| Heading color | `#2C3E50` | `#2B3228` | Change to `#2C3E50` |
| Body color | `#3A3A3A` | `#3A3A3A` (via `#555` in places) | Unify |
| Mint | `#5ED9A6` | `#5ED9A6` | Keep |
| Background | `#fff` / `#fafcfb` | `#F5F0E6` (ecru) | Change to white/subtle |
| Nav | Light glassmorphism, sticky | Dark topbar | Replace |
| Cards | White, 1px border, 0.75rem radius | White, shadow | Match Manual card style |

### Panel → Nav mapping

The 8 toolkit tabs become nav links:

| Current tab | Nav label | Hash |
|------------|-----------|------|
| Dashboard | Dashboard | `#dashboard` |
| Badges | Badges | `#badges` |
| Thementische | Tische | `#tische` |
| Abreisszettel | Voting | `#voting` |
| Event-Notiz | Notiz | `#notiz` |
| Bewertung | Bewertung | `#bewertung` |
| 24h Follow-up | Follow-up | `#followup` |
| Playbook | Regeln | `#regeln` |

### Cross-links (Manual → Toolkit)

| Manual section | Links to Toolkit panel | Link text |
|---------------|----------------------|-----------|
| 02 Rollen beim Event | — | (no toolkit equivalent) |
| 03 Badges & Sichtbarkeit | `#badges` | "Badges drucken im Toolkit" |
| 04 Materialien | — | (no toolkit equivalent) |
| 05 Ablauf | `#dashboard` | "Event vorbereiten im Toolkit" |
| 06 Thementische | `#tische` | "Aufsteller generieren im Toolkit" |
| 07 Event-Notiz & Follow-up | `#notiz` + `#followup` | "Event-Notiz ausfüllen" / "Follow-up versenden" |
| 10 KPIs & Datenfluss | `#dashboard` | "Dashboard und Daten im Toolkit" |
| 11 Eskalation | `#regeln` | "Quick Reference im Toolkit" |

### Cross-links (Toolkit → Manual)

Each toolkit panel gets a small "Mehr dazu im Manual" link to the corresponding Manual section.

---

## Chunk 1: File setup + CSS reskin

### Task 1: Create toolkit directory and copy file

**Files:**
- Create: `toolkit/index.html` (copy from `playgrounds/Playbook/kinn-ops-toolkit.html`)

- [ ] **Step 1: Create directory and copy**

```bash
mkdir -p /Users/livingmydesign/GitHub/_quicks/_KINN/_LAB/toolkit
cp /Users/livingmydesign/GitHub/_quicks/_KINN/_LAB/playgrounds/Playbook/kinn-ops-toolkit.html /Users/livingmydesign/GitHub/_quicks/_KINN/_LAB/toolkit/index.html
```

- [ ] **Step 2: Verify file exists and is readable**

```bash
wc -l /Users/livingmydesign/GitHub/_quicks/_KINN/_LAB/toolkit/index.html
```

Expected: ~1904 lines

### Task 2: Replace CSS variables

**Files:**
- Modify: `toolkit/index.html` (`:root` block, lines ~9-28)

- [ ] **Step 1: Replace `:root` variables**

Replace the entire `:root` block with Manual-aligned variables:

```css
:root {
  --mint: #5ED9A6;
  --mint-hover: #4EC995;
  --mint-active: #3EB885;
  --mint-bg: rgba(94,217,166,0.08);
  --mint-border: rgba(94,217,166,0.25);
  --text-heading: #2C3E50;
  --text-primary: #3A3A3A;
  --text-subtitle: #6B6B6B;
  --text-meta: #999;
  --bg-white: #ffffff;
  --bg-subtle: #fafcfb;
  --border: rgba(0,0,0,0.08);
  --border-strong: rgba(0,0,0,0.12);
  --border-solid: #e8e8e8;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.06);
  --radius: 0.75rem;
  --red-soft: #E74C3C;
  --amber-soft: #F39C12;
  --green-soft: #27AE60;
}
```

- [ ] **Step 2: Update body styles**

```css
body {
  font-family: 'Work Sans', system-ui, -apple-system, sans-serif;
  background: var(--bg-white);
  color: var(--text-primary);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 3: Remove Montserrat from Google Fonts link**

Change the font link to only load Work Sans (matching Manual):

```html
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
```

- [ ] **Step 4: Search-replace old variable names in CSS**

All CSS references need updating. Key mappings:
- `var(--mintgreen)` → `var(--mint)`
- `var(--mint-light)` → `var(--mint-bg)` (for backgrounds) or keep specific hex
- `var(--mint-dark)` → `var(--mint-active)`
- `var(--heavy-metal)` → `var(--text-heading)`
- `var(--dark-deep)` → `var(--text-heading)` (dark variants collapse)
- `var(--ecru-white)` → `var(--bg-subtle)`
- `var(--cream-dark)` → `var(--border-solid)`
- `var(--warm-gray)` → `var(--text-meta)`
- `var(--teal)` → `var(--mint)` (collapse teal into mint)
- `var(--dark-teal)` → `var(--mint-active)`

Also in JS-generated HTML: search for raw hex values like `#2B3228` → `#2C3E50`, `#5ED9A6` stays.

**IMPORTANT:** Print layout CSS (inside `@media print`) uses hardcoded hex values (`#5ED9A6`, `#2B3228`). Update `#2B3228` → `#2C3E50` in print blocks too.

- [ ] **Step 5: Replace all Montserrat references**

Search for `'Montserrat'` throughout the file (CSS and inline HTML styles). Replace with `'Work Sans'`. Adjust weights: Montserrat 800/900 → Work Sans 700 (Montserrat runs heavier).

- [ ] **Step 6: Verify — no reference to old variables remains**

```bash
grep -c "mintgreen\|heavy-metal\|dark-deep\|ecru-white\|cream-dark\|warm-gray\|Montserrat" toolkit/index.html
```

Expected: 0

### Task 3: Replace topbar + tabs with Manual nav

**Files:**
- Modify: `toolkit/index.html` (lines ~39-77 CSS, lines ~678-702 HTML)

- [ ] **Step 1: Replace topbar + tabs CSS with Manual nav CSS**

Remove the `.topbar` and `.tabs` CSS blocks. Add the Manual nav CSS:

```css
/* NAV */
.nav {
  position:sticky;
  top:0;
  z-index:50;
  background:rgba(250,252,251,0.92);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  border-bottom:1px solid var(--border);
  padding:0 20px;
  display:flex;
  align-items:center;
  overflow-x:auto;
  scrollbar-width:none;
}
.nav::-webkit-scrollbar { display:none; }
.nav-back {
  font-size:12px;
  font-weight:600;
  color:var(--mint);
  text-decoration:none;
  letter-spacing:0.06em;
  text-transform:uppercase;
  white-space:nowrap;
  padding:14px 0;
  flex-shrink:0;
}
.nav-sep {
  color:var(--border);
  margin:0 10px;
  flex-shrink:0;
}
.nav-links {
  display:flex;
  gap:2px;
  flex:1;
}
.nav-links a {
  font-size:11px;
  font-weight:500;
  color:var(--text-meta);
  text-decoration:none;
  padding:14px 10px;
  white-space:nowrap;
  letter-spacing:0.04em;
  text-transform:uppercase;
  transition:color 0.15s;
  cursor:pointer;
}
.nav-links a:hover { color:var(--text-heading); }
.nav-links a.active { color:var(--mint); font-weight:600; }
.nav-tag {
  font-size:10px;
  font-weight:700;
  color:var(--mint);
  letter-spacing:0.1em;
  text-transform:uppercase;
  background:var(--mint-bg);
  padding:3px 8px;
  border-radius:4px;
  margin-left:12px;
  flex-shrink:0;
}
@media (max-width:640px) {
  .nav-links { gap:0; }
  .nav-links a { padding:14px 6px; font-size:10px; }
}
```

- [ ] **Step 2: Replace topbar + tabs HTML**

Replace the `<div class="topbar">...</div>` and `<div class="tabs">...</div>` with:

```html
<nav class="nav">
  <a href="/manual" class="nav-back">Manual</a>
  <span class="nav-sep">/</span>
  <div class="nav-links">
    <a class="active" onclick="showPanel('dashboard',this)">Dashboard</a>
    <a onclick="showPanel('badges',this)">Badges</a>
    <a onclick="showPanel('aufsteller',this)">Tische</a>
    <a onclick="showPanel('abreiss',this)">Voting</a>
    <a onclick="showPanel('notiz',this)">Notiz</a>
    <a onclick="showPanel('bewertung',this)">Bewertung</a>
    <a onclick="showPanel('followup',this)">Follow-up</a>
    <a onclick="showPanel('playbook',this)">Regeln</a>
  </div>
  <span class="nav-tag">Toolkit</span>
</nav>
```

- [ ] **Step 3: Update `showPanel()` JS to use nav-links instead of tabs**

```javascript
function showPanel(id, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  if (el) el.classList.add('active');
}
```

- [ ] **Step 4: Update card styles to match Manual**

```css
.card {
  background: var(--bg-white);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 16px;
}
.card:hover { box-shadow: none; }
.card h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-heading);
}
.card h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 16px 0 8px;
  color: var(--text-heading);
}
```

- [ ] **Step 5: Update panel container**

```css
.panel { display: none; max-width: 820px; margin: 0 auto; padding: 2rem 1.5rem; }
.panel.active { display: block; }
```

- [ ] **Step 6: Update form element styles to match Manual palette**

```css
input[type="text"], input[type="number"], select, textarea {
  font-family: 'Work Sans', system-ui, sans-serif;
  font-size: 13px;
  padding: 8px 12px;
  border: 1.5px solid var(--border-solid);
  border-radius: 6px;
  background: var(--bg-subtle);
  color: var(--text-primary);
  width: 100%;
  transition: border-color 0.15s;
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--mint);
}
```

- [ ] **Step 7: Update button styles**

```css
.btn-mint { background: var(--mint); color: var(--text-heading); }
.btn-mint:hover { background: var(--mint-hover); }
.btn-dark { background: var(--text-heading); color: white; }
.btn-dark:hover { background: #1a252f; }
.btn-teal { background: var(--mint); color: var(--text-heading); }
.btn-teal:hover { background: var(--mint-active); }
```

- [ ] **Step 8: Update tag colors**

```css
.tag-mint { background: var(--mint-bg); color: var(--mint-active); }
```

- [ ] **Step 9: Update stat cards**

```css
.stat-card {
  background: var(--bg-subtle);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius);
  padding: 16px;
  text-align: center;
}
.stat-val { font-size: 28px; font-weight: 700; color: var(--text-heading); }
.stat-label { font-size: 11px; color: var(--text-meta); margin-top: 2px; }
```

- [ ] **Step 10: Update guest table**

```css
.guest-table th {
  background: var(--text-heading);
  /* rest stays */
}
```

- [ ] **Step 11: Hide nav in print**

Add to `@media print`:
```css
.nav { display: none !important; }
```

- [ ] **Step 12: Commit**

```bash
git add toolkit/index.html
git commit -m "feat: create toolkit with Manual-style design system"
```

---

## Chunk 2: Cross-links

### Task 4: Add cross-links from Manual to Toolkit

**Files:**
- Modify: `manual/index.html`

For each relevant section in the Manual, add a small link after the section content. Use a consistent style:

```html
<a href="/toolkit#badges" class="toolkit-link">Badges drucken im Toolkit →</a>
```

CSS for the link (add to Manual's stylesheet):

```css
.toolkit-link {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--mint-active);
  text-decoration: none;
  padding: 0.4rem 0;
  letter-spacing: 0.02em;
  transition: color 0.15s;
}
.toolkit-link:hover { color: var(--text-heading); }
```

Sections to add links:

- [ ] **Step 1: Section 03 (Badges) — after the callout about green dots**

```html
<a href="/toolkit#badges" class="toolkit-link">Badges drucken im Toolkit →</a>
```

- [ ] **Step 2: Section 05 (Ablauf) — after Phase 1 table**

```html
<a href="/toolkit#dashboard" class="toolkit-link">Event vorbereiten im Toolkit →</a>
```

- [ ] **Step 3: Section 06 (Thementische) — after the topic selection explanation**

```html
<a href="/toolkit#tische" class="toolkit-link">Aufsteller generieren im Toolkit →</a>
```

- [ ] **Step 4: Section 07 (Event-Notiz) — after the event note template**

```html
<a href="/toolkit#notiz" class="toolkit-link">Event-Notiz ausfüllen im Toolkit →</a>
<a href="/toolkit#followup" class="toolkit-link">Follow-up versenden im Toolkit →</a>
```

- [ ] **Step 5: Section 10 (KPIs) — at section start**

```html
<a href="/toolkit#dashboard" class="toolkit-link">Dashboard und Daten im Toolkit →</a>
```

- [ ] **Step 6: Commit**

```bash
git add manual/index.html
git commit -m "feat: add cross-links from Manual to Toolkit"
```

### Task 5: Add cross-links from Toolkit to Manual

**Files:**
- Modify: `toolkit/index.html`

In each Toolkit panel, add a small "back-reference" to the Manual. Place it at the top of each panel as a subtle link:

```html
<div style="font-size:12px;margin-bottom:16px">
  <a href="/manual#rollen" style="color:var(--text-meta);text-decoration:none">← Rollen im Manual</a>
</div>
```

- [ ] **Step 1: Dashboard panel → Manual Ablauf**

```html
<div style="font-size:12px;margin-bottom:16px">
  <a href="/manual#ablauf" style="color:var(--text-meta);text-decoration:none">← Ablauf im Manual</a>
</div>
```

- [ ] **Step 2: Badges panel → Manual Badges section**

```html
<a href="/manual#rollen" style="...">← Badges & Rollen im Manual</a>
```

(Use section ID from Manual: the badges section is section 03, check its ID)

- [ ] **Step 3: Aufsteller → Manual Thementische**

```html
<a href="/manual#thementische" style="...">← Thementische im Manual</a>
```

- [ ] **Step 4: Event-Notiz → Manual Nachbereitung**

```html
<a href="/manual#nachbereitung" style="...">← Nachbereitung im Manual</a>
```

- [ ] **Step 5: Follow-up → Manual Nachbereitung**

```html
<a href="/manual#nachbereitung" style="...">← Nachbereitung im Manual</a>
```

- [ ] **Step 6: Playbook/Regeln → Manual (root)**

```html
<a href="/manual" style="...">← Vollständiges Manual</a>
```

- [ ] **Step 7: Commit**

```bash
git add toolkit/index.html
git commit -m "feat: add cross-links from Toolkit to Manual"
```

---

## Chunk 3: Update Manual nav + Deploy

### Task 6: Add Toolkit link to Manual nav

**Files:**
- Modify: `manual/index.html`

- [ ] **Step 1: Add Toolkit nav link**

In the Manual's `<nav>`, add a link to the Toolkit after the existing links, visually distinct:

```html
<a href="/toolkit" style="color:var(--mint);">Toolkit</a>
```

- [ ] **Step 2: Commit**

```bash
git add manual/index.html
git commit -m "feat: add Toolkit link in Manual nav"
```

### Task 7: Deploy and verify

- [ ] **Step 1: Deploy to Vercel prod**

```bash
npx vercel --prod
```

- [ ] **Step 2: Verify toolkit loads**

```bash
curl -s -o /dev/null -w "%{http_code}" https://lab.kinn.at/toolkit
```

Expected: 200

- [ ] **Step 3: Verify cross-links work**

Check that `/manual#badges` scrolls correctly and `/toolkit#badges` shows the badges panel.

- [ ] **Step 4: Verify all toolkit panels still work**

Click through all 8 panels — Dashboard, Badges, Tische, Voting, Notiz, Bewertung, Follow-up, Regeln. Verify forms, buttons, and print functions work.

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "feat: deploy toolkit redesign with cross-links"
```
