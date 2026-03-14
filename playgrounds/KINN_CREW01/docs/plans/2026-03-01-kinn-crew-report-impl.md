# KINN:CREW Report Feb 2026 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `kinn-crew-report-feb2026.html` — ein scrollbarer, self-contained Report im KINN-Brand-Design-System.

**Architecture:** Single HTML file mit inline CSS + vanilla JS. Dark Hero Cover → sticky Sidebar TOC + scrollbare Sections (10 Stück) → Dark Fazit Footer. Kein Build-System, kein Framework.

**Tech Stack:** HTML5, CSS custom properties (KINN design tokens), vanilla JS (IntersectionObserver für TOC-Highlighting)

---

### Task 1: HTML Shell + Design System

**Files:**
- Create: `kinn-crew-report-feb2026.html`

**Step 1: Erstelle die Grundstruktur**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KINN:CREW · Strategischer Report · Feb 2026</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    /* === KINN Design Tokens (identisch mit Potluck-Deck) === */
    :root {
      --mintgreen: #5ED9A6;
      --heavy-metal: #2B3228;
      --ecru-white: #F5F0E6;
      --spring-rain: #A8C8B0;
      --teal: #4A9B8C;
      --dark-teal: #2D6B60;
      --malta: #BDB2A1;
      --kangaroo: #C6C3B5;
    }
    @font-face { font-family: 'Futura'; src: local('Futura'), local('Futura-Medium'), local('FuturaPT-Book'); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Futura', 'Work Sans', system-ui, sans-serif; background: var(--ecru-white); color: var(--heavy-metal); -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body>
  <!-- hero, sidebar, sections go here -->
  <script>/* TOC JS goes here */</script>
</body>
</html>
```

**Step 2: Verify im Browser öffnen**
- Datei öffnen: `open kinn-crew-report-feb2026.html`
- Erwartung: leere Seite mit ecru-white Hintergrund, kein JS-Error

**Step 3: Commit**
```bash
git add kinn-crew-report-feb2026.html
git commit -m "feat: add KINN report HTML shell + design tokens"
```

---

### Task 2: Dark Hero Cover

**Files:**
- Modify: `kinn-crew-report-feb2026.html` — Hero-Section hinzufügen

**Step 1: Hero HTML + CSS**

```html
<!-- Hero -->
<section id="hero" style="min-height:100vh;background:var(--heavy-metal);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 2rem;position:relative;overflow:hidden;text-align:center;">
  <!-- mintgreen glow -->
  <div style="position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(94,217,166,0.15) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;animation:glow 8s ease-in-out infinite;"></div>

  <!-- KINN logo SVG (same as slide-01-cover.js) -->
  <div style="width:min(280px,55vw);margin:0 auto 2rem;position:relative;">
    <svg viewBox="0 0 931.35 308.55" xmlns="http://www.w3.org/2000/svg" style="width:100%;fill:var(--ecru-white);filter:drop-shadow(0 0 30px rgba(94,217,166,0.25));">
      <polygon points="495.04 20.27 569.04 153.27 569.04 20.27 654.04 20.27 654.04 288.27 572.54 288.27 498.04 159.27 498.04 288.27 416.04 288.27 416.04 20.27 495.04 20.27"/>
      <path d="M682.04,20.27l78.89.11,73.11,133.89V20.27h81v268h-80l-72-130v130h-78.5c-.61,0-1.53-.8-2.5,0V20.27Z"/>
      <polygon points="100.04 20.27 100.04 136.27 160.54 20.27 256.04 20.27 182.26 145.61 262.04 288.27 166.54 288.27 100.04 159.27 100.04 288.27 21.04 288.27 21.04 20.27 100.04 20.27"/>
      <path d="M359.04,20.27v265.5c0,.31,1.37,1.42,1,2.5h-82V20.27h81Z"/>
    </svg>
  </div>

  <!-- eyebrow -->
  <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.65rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--mintgreen);margin-bottom:0.75rem;">KINN:CREW · Strategisches Team Meeting</div>

  <!-- title -->
  <h1 style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(2rem,5vw,4rem);color:var(--ecru-white);line-height:1.05;margin-bottom:0.5rem;">Strategischer Report</h1>
  <div style="font-family:'Futura',sans-serif;font-size:clamp(1rem,2vw,1.35rem);color:var(--spring-rain);margin-bottom:2rem;letter-spacing:0.04em;">28. Februar 2026 · Innsbruck</div>

  <!-- meta chips -->
  <div style="display:flex;flex-wrap:wrap;gap:0.6rem;justify-content:center;margin-bottom:2.5rem;">
    <span style="background:rgba(94,217,166,0.12);border:1px solid rgba(94,217,166,0.25);border-radius:100px;padding:0.35rem 1rem;font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.72rem;color:var(--mintgreen);letter-spacing:0.06em;">ca. 3 Stunden</span>
    <span style="background:rgba(94,217,166,0.12);border:1px solid rgba(94,217,166,0.25);border-radius:100px;padding:0.35rem 1rem;font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.72rem;color:var(--mintgreen);letter-spacing:0.06em;">8 Teilnehmer</span>
    <span style="background:rgba(94,217,166,0.12);border:1px solid rgba(94,217,166,0.25);border-radius:100px;padding:0.35rem 1rem;font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.72rem;color:var(--mintgreen);letter-spacing:0.06em;">Thomas · Martin · Steven · David · Marco · Daniel · Sherin · Matthias</span>
  </div>

  <!-- confidential badge -->
  <div style="display:inline-flex;align-items:center;gap:0.5rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:0.6rem 1.25rem;font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.68rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--kangaroo);">
    <span style="width:6px;height:6px;border-radius:50%;background:var(--kangaroo);display:inline-block;"></span>
    Vertraulich — Nur für KINN:CREW
  </div>

  <!-- scroll hint -->
  <div style="position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);font-family:'Futura',sans-serif;font-size:0.7rem;color:rgba(255,255,255,0.2);letter-spacing:0.1em;text-transform:uppercase;">Scroll ↓</div>
</section>

<style>
@keyframes glow { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:1} 50%{transform:translate(-50%,-50%) scale(1.1);opacity:0.6} }
</style>
```

**Step 2: Verify**
- Im Browser: Hero erscheint dunkel, Logo sichtbar, Glow-Animation läuft

---

### Task 3: Layout-Wrapper + Sidebar TOC

**Files:**
- Modify: `kinn-crew-report-feb2026.html` — Layout-Rahmen nach Hero

**Step 1: Layout-CSS + TOC-Sidebar HTML**

```html
<style>
.report-layout { display: grid; grid-template-columns: 220px 1fr; gap: 0; max-width: 1200px; margin: 0 auto; }
.toc { position: sticky; top: 0; height: 100vh; overflow-y: auto; padding: 2.5rem 1.5rem; border-right: 1px solid rgba(43,50,40,0.08); background: var(--ecru-white); }
.toc-title { font-family:'Montserrat',sans-serif; font-weight:900; font-size:0.6rem; letter-spacing:0.18em; text-transform:uppercase; color:var(--malta); margin-bottom:1.5rem; }
.toc-link { display:block; padding:0.4rem 0.5rem; margin-bottom:0.15rem; font-family:'Montserrat',sans-serif; font-weight:700; font-size:0.72rem; color:var(--malta); text-decoration:none; border-radius:6px; transition:all 0.2s; border-left:2px solid transparent; }
.toc-link:hover { color:var(--teal); background:rgba(74,155,140,0.06); }
.toc-link.active { color:var(--mintgreen); border-left-color:var(--mintgreen); background:rgba(94,217,166,0.08); }
.sections { min-width:0; }
@media (max-width: 768px) {
  .report-layout { grid-template-columns: 1fr; }
  .toc { display:none; }
}
</style>

<div class="report-layout">
  <nav class="toc">
    <div class="toc-title">Inhalt</div>
    <a class="toc-link" href="#summary">Executive Summary</a>
    <a class="toc-link" href="#s01">01 · Identität & Werte</a>
    <a class="toc-link" href="#s02">02 · Moderation</a>
    <a class="toc-link" href="#s03">03 · Format-Erweiterungen</a>
    <a class="toc-link" href="#s04">04 · Matchmaking</a>
    <a class="toc-link" href="#s05">05 · Kommerzialisierung</a>
    <a class="toc-link" href="#s06">06 · Skalierung</a>
    <a class="toc-link" href="#s07">07 · Governance</a>
    <a class="toc-link" href="#s08">08 · Was funktioniert</a>
    <a class="toc-link" href="#s09">09 · Follow-Ups</a>
    <a class="toc-link" href="#fazit">Fazit</a>
  </nav>
  <div class="sections">
    <!-- all sections go here -->
  </div>
</div>
```

**Step 2: TOC Intersection Observer JS**

```js
<script>
const tocLinks = document.querySelectorAll('.toc-link');
const sections = document.querySelectorAll('[data-section]');
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      tocLinks.forEach(l => l.classList.remove('active'));
      const link = document.querySelector(`.toc-link[href="#${e.target.id}"]`);
      if (link) link.classList.add('active');
    }
  });
}, { threshold: 0.2 });
sections.forEach(s => obs.observe(s));
</script>
```

**Step 3: Verify**
- Sidebar links erscheinen links, Seite scrollt normal rechts

---

### Task 4: Reusable Section CSS

**Files:**
- Modify: `kinn-crew-report-feb2026.html` — gemeinsame Section-Styles

```html
<style>
/* Section base */
.section { padding: clamp(3rem, 6vw, 5rem) clamp(2rem, 5vw, 4rem); }
.section:nth-child(odd) { background: var(--ecru-white); }
.section:nth-child(even) { background: #fff; }

/* Section header */
.sec-num { font-family:'Montserrat',sans-serif; font-weight:800; font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; color:var(--teal); margin-bottom:0.35rem; }
.sec-title { font-family:'Montserrat',sans-serif; font-weight:900; font-size:clamp(1.6rem,3vw,2.5rem); color:var(--heavy-metal); margin-bottom:0.4rem; line-height:1.15; }
.sec-div { width:48px; height:3px; background:var(--mintgreen); border-radius:2px; margin-bottom:1.75rem; }

/* Body text */
.body-text { font-family:'Futura',sans-serif; font-size:1rem; color:#4A4F47; line-height:1.75; max-width:720px; margin-bottom:1.25rem; }

/* Quote */
.quote { border-left:3px solid var(--mintgreen); padding:0.75rem 1.25rem; margin:1.5rem 0; background:rgba(94,217,166,0.05); border-radius:0 8px 8px 0; }
.quote p { font-family:'Futura',sans-serif; font-size:0.95rem; color:var(--heavy-metal); line-height:1.7; font-style:italic; margin-bottom:0.35rem; }
.quote cite { font-family:'Montserrat',sans-serif; font-weight:700; font-size:0.68rem; letter-spacing:0.08em; text-transform:uppercase; color:var(--teal); }

/* Note box */
.note { background:rgba(94,217,166,0.1); border-left:3px solid var(--mintgreen); border-radius:0 8px 8px 0; padding:0.9rem 1.25rem; margin:1.25rem 0; font-family:'Futura',sans-serif; font-size:0.9rem; color:var(--heavy-metal); line-height:1.65; }
.note strong { font-family:'Montserrat',sans-serif; font-weight:800; }

/* Cards grid */
.cards { display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:1.25rem; margin:1.75rem 0; }
.card { background:#fff; border:1px solid rgba(43,50,40,0.08); border-radius:14px; padding:1.5rem; }
.section:nth-child(even) .card { background:var(--ecru-white); }

/* Metric big */
.metric-val { font-family:'Montserrat',sans-serif; font-weight:900; font-size:2.5rem; color:var(--teal); line-height:1; }
.metric-label { font-family:'Futura',sans-serif; font-size:0.8rem; color:var(--malta); margin:0.2rem 0; text-transform:uppercase; letter-spacing:0.06em; }
.metric-desc { font-family:'Futura',sans-serif; font-size:0.88rem; color:#6B7068; line-height:1.55; margin-top:0.5rem; }

/* Priority badge */
.badge { display:inline-block; padding:0.2rem 0.6rem; border-radius:100px; font-family:'Montserrat',sans-serif; font-weight:800; font-size:0.58rem; letter-spacing:0.1em; text-transform:uppercase; }
.badge-dringend { background:rgba(220,80,60,0.1); color:#C04030; }
.badge-hoch { background:rgba(74,155,140,0.12); color:var(--dark-teal); }
.badge-mittel { background:rgba(189,178,161,0.2); color:var(--malta); }

/* Firewall 2-col */
.firewall { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1px solid rgba(43,50,40,0.1); border-radius:14px; overflow:hidden; margin:1.75rem 0; }
.fw-col { padding:1.75rem; }
.fw-col:first-child { background:rgba(94,217,166,0.06); border-right:1px solid rgba(43,50,40,0.08); }
.fw-col:last-child { background:rgba(189,178,161,0.08); }
.fw-name { font-family:'Montserrat',sans-serif; font-weight:900; font-size:0.9rem; color:var(--heavy-metal); margin-bottom:0.25rem; }
.fw-role { font-family:'Futura',sans-serif; font-size:0.72rem; color:var(--malta); margin-bottom:1rem; text-transform:uppercase; letter-spacing:0.06em; }
.fw-point { font-family:'Futura',sans-serif; font-size:0.9rem; color:#4A4F47; line-height:1.6; padding:0.4rem 0; border-bottom:1px solid rgba(43,50,40,0.06); }
.fw-point:last-child { border-bottom:none; }
@media (max-width:600px) { .firewall { grid-template-columns:1fr; } }

/* Follow-up table */
.fu-table { width:100%; border-collapse:collapse; margin:1.5rem 0; font-family:'Futura',sans-serif; font-size:0.88rem; }
.fu-table th { font-family:'Montserrat',sans-serif; font-weight:800; font-size:0.65rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--malta); padding:0.6rem 0.8rem; border-bottom:2px solid rgba(43,50,40,0.1); text-align:left; }
.fu-table td { padding:0.75rem 0.8rem; border-bottom:1px solid rgba(43,50,40,0.06); vertical-align:top; color:#4A4F47; line-height:1.5; }
.fu-table tr:nth-child(even) td { background:rgba(43,50,40,0.02); }
.fu-table td:first-child { font-family:'Montserrat',sans-serif; font-weight:800; font-size:0.75rem; color:var(--teal); white-space:nowrap; }
</style>
```

---

### Task 5: Executive Summary Section

**Content aus Report:** 5 Schlüssel-Erkenntnisse, intro-Text

```html
<section id="summary" class="section" data-section>
  <div class="sec-num">Executive Summary</div>
  <h2 class="sec-title">Ein Wendepunkt für KINN</h2>
  <div class="sec-div"></div>
  <p class="body-text">Das erste erweiterte KINN:CREW Meeting am 28. Februar 2026 markiert einen Wendepunkt für die Initiative. Erstmals wurde über den bisherigen 4er-Kernkreis hinaus diskutiert — mit David, Marco, Daniel, Sherin und Matthias als aktive Mitgestalter.</p>
  <p class="body-text">Die zentrale Erkenntnis: KINN wird von außen bereits als Institution wahrgenommen — intern fehlen jedoch noch die Strukturen, die dieser Wahrnehmung gerecht werden.</p>

  <div class="cards">
    <!-- 5 status cards: Identität, Werte, Kommerzialisierung, Skalierung, Governance -->
    <!-- each card: emoji icon + label + description + color accent -->
  </div>

  <div class="quote">
    <p>„Wir sind nach außen professionell. Selbst du hast es erwartet... aber so weit sind wir gar nicht gewesen an dem Punkt."</p>
    <cite>Martin</cite>
  </div>
</section>
```

---

### Task 6: Sections 1–4 (Identität, Moderation, Format, Matchmaking)

Jede Section folgt dem Pattern aus Task 4. Inhalt aus DOCX:
- **S01 Identität:** Konsens-Werte als Note-Box (6 Punkte) + Quote Sherin + Quote Thomas
- **S02 Moderation:** Erkenntnisse-Text + Lösungsansätze als gestylte Liste + Quotes David + Daniel
- **S03 Format:** 3 Cards (Tech Talks, Workshops, Weitere Ideen) + Note über Delegation
- **S04 Matchmaking:** Text + Quote Daniel + Spannungsfeld-Note + Quote Marco + Vision-Box (David)

---

### Task 7: Section 5 — Kommerzialisierung (Firewall)

```html
<section id="s05" class="section" data-section>
  <div class="sec-num">05 · Der Kernkonflikt</div>
  <h2 class="sec-title">Kommerzialisierung</h2>
  <div class="sec-div"></div>
  <p class="body-text">Das emotionalste und strategisch wichtigste Thema des Abends. Hier trafen zwei berechtigte Perspektiven aufeinander:</p>

  <div class="firewall">
    <div class="fw-col">
      <div class="fw-name">Thomas</div>
      <div class="fw-role">Hybridlösung</div>
      <div class="fw-point">Gemeinnützig für Community, kommerzielle Projekte möglich</div>
      <div class="fw-point">KINN Donnerstag bleibt kostenlos</div>
      <div class="fw-point">Firmen-Partnerschaften okay wenn Geld zurück in Community fließt</div>
      <div class="fw-point">"Gemeinnützig kommerziell" als eigene Kategorie</div>
    </div>
    <div class="fw-col">
      <div class="fw-name">Martin</div>
      <div class="fw-role">Klare Trennung</div>
      <div class="fw-point">"KINN Commercial" als separate Entität</div>
      <div class="fw-point">Sorge: KINN-Name für kommerzielle Projekte = Ungleichheit</div>
      <div class="fw-point">Worst Case: Markenrecht-Problematik Libra Lab</div>
      <div class="fw-point">Fordert lupenreine Kommunizierbarkeit</div>
    </div>
  </div>

  <!-- Martin quote + diskutierte Lösungsansätze -->
</section>
```

---

### Task 8: Sections 6–8 (Skalierung, Governance, Stärken)

- **S06 Skalierung:** 4 Bottleneck-Cards (Locations, Moderatoren, Zeitaufwand, Entscheidungsfindung) + Quotes Steven + Thomas
- **S07 Governance:** Text über Erweiterung + Quotes Marco + Thomas (zwei)
- **S08 Stärken:** 6 Achievement-Metric-Cards (15 Events, Starke Community-Bindung, Reputation, Tech Talks, Erweiterter Kreis, Kooperationen) + Quotes Marco + Thomas

---

### Task 9: Section 9 — Follow-Ups Tabelle

```html
<section id="s09" class="section" data-section>
  <div class="sec-num">09 · Nächste Schritte</div>
  <h2 class="sec-title">Follow-Ups & Maßnahmen</h2>
  <div class="sec-div"></div>

  <table class="fu-table">
    <thead>
      <tr>
        <th>#</th><th>Maßnahme</th><th>Details</th><th>Priorität</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Werte-Manifest erstellen</td><td>Grundwerte verschriftlichen, Teilnahmebedingungen, AGB/rechtlicher Rahmen</td><td><span class="badge badge-dringend">Dringend</span></td></tr>
      <tr><td>2</td><td>Grundsatzentscheidung Kommerzialisierung</td><td>KINN Commercial ja/nein, Struktur, Kommunikationsstrategie</td><td><span class="badge badge-dringend">Dringend</span></td></tr>
      <tr><td>3</td><td>Moderations-System aufbauen</td><td>Video-Briefing, Mentoring, Guidelines, Impulsfragen-Kit</td><td><span class="badge badge-hoch">Hoch</span></td></tr>
      <tr><td>4</td><td>Feedback-System implementieren</td><td>Post-Event Befragung, Matchmaking-Daten, Testimonials</td><td><span class="badge badge-hoch">Hoch</span></td></tr>
      <tr><td>5</td><td>Plattform-Entwicklung starten</td><td>Location-Management, Teilnehmer-Verwaltung, Automatisierung</td><td><span class="badge badge-mittel">Mittel</span></td></tr>
      <tr><td>6</td><td>Delegations-Struktur</td><td>Task-Board, Rollen definieren, Verantwortlichkeiten verteilen</td><td><span class="badge badge-mittel">Mittel</span></td></tr>
      <tr><td>7</td><td>Rechtliche Klärung</td><td>Verein vs. Projekt final, Markenrechte, Haftung, Steuer</td><td><span class="badge badge-mittel">Mittel</span></td></tr>
    </tbody>
  </table>

  <!-- Experiments + Team-Entwicklung als two-column list -->
</section>
```

---

### Task 10: Fazit + Footer

```html
<!-- Dark Fazit Section -->
<section id="fazit" class="section" data-section style="background:var(--heavy-metal);color:var(--ecru-white);">
  <div class="sec-num" style="color:var(--mintgreen);">Fazit</div>
  <h2 class="sec-title" style="color:var(--ecru-white);">Die Entscheidungen sind gefallen.</h2>
  <div class="sec-div"></div>
  <!-- 2 Absätze + 2 mintgreen Quotes -->
</section>

<!-- Footer -->
<footer style="background:var(--heavy-metal);border-top:1px solid rgba(255,255,255,0.05);padding:2rem;text-align:center;...">
  <div style="font-family:'Montserrat',...;color:var(--kangaroo);...">VERTRAULICH · NUR FÜR KINN:CREW</div>
  <div style="...color:rgba(255,255,255,0.2);...">Erstellt auf Basis der Meetingaufnahme vom 28. Februar 2026</div>
</footer>
```

---

### Task 11: TOC IntersectionObserver + Final Polish

- JS für aktives TOC-Highlighting fertigstellen
- Mobile Check: Sidebar ausgeblendet, Sections 100% Breite
- Print-Media-Query: `@media print { .toc { display:none; } }`
- Final verify: alle Sections scrollen korrekt, TOC-Links navigieren

**Commit:**
```bash
git add kinn-crew-report-feb2026.html docs/plans/
git commit -m "feat: complete KINN:CREW strategic report HTML"
```

---

## Execution Options

**Plan complete and saved to `docs/plans/2026-03-01-kinn-crew-report-impl.md`.**

**Empfehlung: Subagent-Driven (diese Session)** — da die Tasks eng zusammenhängen (alles eine Datei) und schnelle Iteration besser ist als parallele Sessions.
