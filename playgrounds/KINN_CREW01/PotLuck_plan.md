# KINN Potluck — Slide Deck & Tischplan
**v0.2 · 28.02.2026 · bereit zum Bauen**

*10 Personen · Feierabend-Event · max. 20 Min Präsentation, Rest Gespräch + Essen*

---

## Ton & Prinzip

> Kein Pitch-Deck. Zahlen feiern, nicht präsentieren. Offen lassen was offen ist.
> "Schaut was WIR geschafft haben" — nicht "hier sind unsere KPIs."

**Nicht rein:** Lead-Pool-Details, Retention-Analyse-Tiefen, Monetarisierungspläne, Business-of-Belonging-Theorie, jedes Wort mit "KPI / Conversion / Funnel". Interne Konflikte, Revenue-Splits, Governance-Spannungen.

---

## Dateistruktur

```
KINN_CREW01/
├── kinn-potluck-slidedeck.html     Shell + CSS tokens (~120 Zeilen)
├── kinn15-tischplan.html           Interaktiver Tischplan WIFI Lernbar
├── lernbar.png                     Raum-Skizze (SVG-Placeholder, 1200×750px)
├── PotLuck_plan.md                 Dieser Plan
├── img/
│   ├── team-thomas.jpg             } Platzhalter-PNGs 200×200px
│   ├── team-martin.jpg             } mintgreen bg + weiße Initialen
│   ├── team-desiree.jpg            } bis echte Fotos geliefert werden
│   ├── team-marco.jpg              }
│   ├── team-sherin.jpg             }
│   ├── team-daniel.jpg             }
│   ├── team-matthias.jpg           }
│   ├── team-david.jpg              }
│   ├── team-stephan.jpg            }
│   └── team-steven.jpg             }
└── slides/
    ├── engine.js                   Nav, Transitions, Keyboard, Dots, Speaker Notes
    ├── slide-01-cover.js
    ├── slide-02-warum.js
    ├── slide-03-wachstum.js        SVG-Chart 1:1 aus kinn-community-building.html
    ├── slide-04-kinn15.js
    ├── slide-05-demand.js
    ├── slide-06-kapazitaet.js
    ├── slide-07-chapters.js
    ├── slide-08-chapter-map.js     Leaflet.js + OSM Tiles
    ├── slide-09-testimonials.js
    ├── slide-10-regulars.js
    ├── slide-11-team.js
    ├── slide-12-heatmap.js         Bubble-Chart (SVG, keine Lib)
    ├── slide-13-roadmap.js
    ├── slide-14-fund.js
    ├── slide-15-diskussion.js
    ├── slide-16-manifest.js
    └── slide-17-prost.js
```

---

## Architektur

### Registrierungs-API (alle Slides teilen dieses Interface)
```javascript
// Jede slide-XX.js tut genau das:
window.KINN_SLIDES = window.KINN_SLIDES || [];
window.KINN_SLIDES.push({
  id: 'cover',               // einmalig, kebab-case
  theme: 'dark',             // 'dark' | 'light' | 'mint'
  notes: '...',              // Speaker Notes (Taste N)
  onEnter() {},              // optional: wird bei Slide-Aktivierung aufgerufen (z.B. Map init)
  render() { return `...`; } // gibt HTML-String zurück
});
```
`kinn-potluck-slidedeck.html` lädt `<script src="slides/slide-01-cover.js">` ... `<script src="slides/engine.js">` (engine IMMER als letztes).

### engine.js
| Feature | Detail |
|---------|--------|
| Slides | `<section class="slide" data-theme>` in `#deck`, position:absolute, nur aktive sichtbar |
| Transition | CSS `opacity` + `transform: translateX(±30px)`, 280ms ease |
| Navigation | `←/→` Keys · `Space/Enter` vor · Klick links=zurück / rechts=vor · Touch-Swipe |
| UI | Dots unten-Mitte (klickbar) · Counter "3 / 17" unten-rechts · Prev/Next-Pfeile subtil |
| Speaker Notes | Taste `N` togglet `#notes-overlay` (halbtransparent, unten, liest `slide.notes`) |
| onEnter | engine ruft `slide.onEnter?.()` nach Transition — für Leaflet-Map-Init |

### CSS Design Tokens (Kopie aus kinn-community-building.html)
```css
:root {
  --mintgreen:#5ED9A6; --heavy-metal:#2B3228; --ecru-white:#F5F0E6;
  --teal:#4A9B8C;      --spring-rain:#A8C8B0; --malta:#BDB2A1;
  --kangaroo:#C6C3B5;  --warn:#D4956A;
  --mint-glow:rgba(94,217,166,.15); --mint-subtle:rgba(94,217,166,.08);
}
```
Fonts: Futura (body, @font-face local) · Montserrat 400/600/700/800/900 (Google Fonts CDN)
Leaflet CSS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` (im HTML head, lädt nur wenn online)

### Themes
| `data-theme` | Hintergrund | Textfarbe | Einsatz |
|-------------|------------|----------|---------|
| `dark` | `#2B3228` | `#F5F0E6` | Cover, Manifest, Prost |
| `light` | `#F5F0E6` | `#2B3228` | Daten-Slides |
| `mint` | `linear-gradient(135deg, rgba(94,217,166,.18) 0%, rgba(74,155,140,.12) 100%)` | `#2B3228` | Meilenstein-Slides |

---

## Slide-Plan

### 01 · Cover `[dark]`
**Inhalt:** KINN-Wordmark (Montserrat 900, ~5rem) · "Potluck Party · 28. Feb 2026" · Mintgreen-Pulse-Animation (::before radial-gradient, @keyframes 12s) · Klein unten: *"Mehr als ein Projekt. KINN ist persönlich."*
**Notes:** Kurz danken. Kein Programm-Slide ankündigen. Einfach anfangen.

### 02 · Warum wir hier sind `[light]`
**Inhalt:** 1 Satz in max. Schriftgröße (clamp 4–9vw): *"Feiern. Ausrichten. Weitermachen."*
**Notes:** "Kein Pitch. Wir schauen was wir gebaut haben — und reden dann."

### 03 · Wachstumskurve `[light]`
**Inhalt:** Headline "4 → 110" (mintgreen, Montserrat 900, 8vw) · Sub: "In 4 Monaten. Das 27-fache der Gründung." · **Komplettes SVG** aus `kinn-community-building.html` (viewBox 0 0 600 225, KINN#1–#18 + Q2-Projektion ~150)
**Source:** Direktkopie des SVG-Blocks (~100 Zeilen)
**Notes:** "Der Chart zeigt jeden einzelnen Donnerstag. Das hier ist Rhythmus."

### 04 · KINN#15 Rekord `[mint]`
**Inhalt:** 3 Stats im Split-Screen-Stil:
```
       110          ·       2         ·        0
  Teilnehmer      Städte           freie Plätze
                  gleichzeitig
```
Sub: "Innsbruck 86 · Kufstein 24 · beide ausgebucht · 5. März"
**Notes:** "44 Regs in IBK an Tag 1. Kufstein: Stunden. Das skaliert."

### 05 · Nachfrage > Kapazität `[light]`
**Inhalt:** 3 Velocity-Stats groß: **44** Tag-1 Regs · **63** in 3 Tagen · **7 Tage** bis voll. Dann: "KINN#14: 27 auf Warteliste nach Nachrückern." Headline: *"Die Nachfrage ist da."*
**Notes:** "27 Leute abweisen tut weh. Das motiviert das Chapter-Modell."

### 06 · Das Kapazitäts-Problem `[light]`
**Inhalt:** Großer Stat: **"87%"** · "der Venues fassen max. 40 Personen" · Einfaches horizontales Bar-Chart SVG der Top-Venues nach Kapazität (aus kinn-community-building.html venue-chart) · *"Die Lösung ist nicht ein größerer Raum."*
**Notes:** "Auch WIFI Lernbar ist eine Ausnahme. Das lässt sich nicht wiederholen."

### 07 · Die Lösung: Chapters `[light]`
**Inhalt:** Flow-Diagramm (CSS Flexbox mit Pfeilen): IBK Hub → Kufstein → Kitzbühel → ... · Subtext: *"Nicht ein größerer Raum — parallele Standorte."* · KINN#15 = Proof of Concept · Aus start.html: *"Egal wo du in Tirol bist, du bist nie mehr als 30 Minuten von einem KINN entfernt."*
**Notes:** "Jeder Chapter-Lead hat Autonomie in seiner Domäne. Keine Freigabe-Schleife."

### 08 · Chapter-Map Tirol `[light]`
**Inhalt:** Leaflet.js Map, Tirol-Ausschnitt, light tiles (CartoDB Positron: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`)
Bounds: `[[46.65, 10.10], [47.75, 12.95]]` · Zoom: 8
5 Marker (mintgreen custom icon):
```
IBK:  47.2692, 11.4041  — "Innsbruck · Kern-Hub · 86+ TN/Woche · ✅"
KUF:  47.5791, 12.1650  — "Kufstein · seit KINN#15 · ✅"
KIB:  47.4467, 12.3916  — "Kitzbühel · 12. März · ✅"
REU:  47.4869, 10.7180  — "Reutte · Ende April 🔜"
LIE:  46.8294, 12.7690  — "Lienz/Osttirol · Ende Mai 🔜"
```
`onEnter()` initialisiert Map (verhindert 0×0 Render bei hidden slide)
**Notes:** "Stephan plant Osttirol. Desiree Unterland. Das Netz wächst organisch."

### 09 · Was die Community sagt `[light]`
**Inhalt:** 2×2 Quote-Grid (`.quote-grid` aus kinn-community-building.html):
1. Jurij: *"Echte Ökosysteme entstehen durch Menschen, Rhythmus und Vertrauen."*
2. Fabian: *"5 Uhr auf, 110 km Fahrt — wenn es KINN ist, auf jeden Fall."*
3. Desiree S.: *"Kein Programm. Keine Slides. Keine Pitches."*
4. Nelson: *"Hin und weg. Freu mich schon auf nächsten Donnerstag!"*
Unten: **4.8★** aus 77 Reviews · 45 Testimonials
**Notes:** "Fabian fährt 110 km. Donnerstag um 5. Das ist der Beweis."

### 10 · Ihr seid der harte Kern `[light]`
**Inhalt:** Retention-Liste als .prog Bars (CSS aus kinn-community-building.html): Kathy 6/6 (100%) · Rafael/David/Steven 5/6 (83%) · 5× 4/6 (67%) · Callout (mintgreen note-box): *"Mehrere der Anwesenden heute sind selbst in dieser Liste."*
**Notes:** "Das ist nicht Dankbarkeit pro forma. Ohne Stammcrew läuft kein Event."

### 11 · Wer sitzt hier? `[dark]`
**Inhalt:** 2×5 Grid, jede Karte: Foto (200×200, border-radius 50%) + Name + 3 Rollen-Chips
```
Thomas   → Strategie, Content, Networking
Martin   → TechTalk, Firmen-Kontakte, Sponsoren
Desiree  → Community Mgmt, Chapters, Content
Marco    → Chapter-Aufbau, Location, Community
Sherin   → Social Media, TechTalk, Workshop
Daniel   → Plattform Dev, TechTalk, Formate
Matthias → TechTalk, Workshop, Firmen-Kontakte
David    → Plattform Dev
Stephan  → Location Scouting
Steven   → Podcast, KINN:RAUS
```
Fotos: `img/team-[vorname].jpg` · Platzhalter: SVG-Inline mit Initialen auf mintgreen
**Notes:** "Zeigen wer was macht. Kurz. Dann weiter."

### 12 · Rollen-Heatmap `[light]`
**Inhalt:** SVG Bubble-Chart (~500×300px), Bubbles skaliert nach Count (r = count × 10 + 20):
```
Tisch-Mod: 6 · Format-Ideen: 5 · TechTalk: 5 · Workshop: 5
Plattform Dev: 4 · Check-In: 3 · Event-Aufbau: 3
Chapter: 2 · Community Mgmt: 2 · Sponsoren: 2 · Content: 2
Merch: 1 · Imagefilm: 1
```
Bubbles: mintgreen/teal/spring-rain je nach Kategorie · Hover zeigt Count · Keine Animation (KISS)
**Notes:** "Tisch-Mod ist das stärkste Signal. Gut — das brauchen wir dringend."

### 13 · Was kommt als Nächstes? `[light]`
**Inhalt:** Vertikale Timeline (`.timeline` CSS) ab KINN#15:
```
5.3.   KINN#15 IBK (86) + KUF (24)     [mintgreen · AUSGEBUCHT]
12.3.  KINN#16 Kitzbühel               [spring-rain · AUSGEBUCHT]
19.3.  digital.tirol Impulstag         [kangaroo]
31.3.  TechTalk Summit @ WKO           [teal]
9.4.   KINN#20 @ Bauernhöfe (70 TN)    [teal]
28.4.  Afterwork @ WKO                 [teal]
Apr    + Reutte (~24 TN)               [spring-rain · geplant]
Mai    + Lienz (~18 TN)                [spring-rain · geplant]
```
**Notes:** "Martin übernimmt IBK am 5. März solo. Erster echter Bus-Test."

### 14 · KINN:FUND `[mint]`
**Inhalt:** Headline (aus fund_2.html): *"KINN braucht kein Silicon Valley. KINN braucht das Inntal."* · Status: OpenCollective live · alles öffentlich · 3 Tier-Cards (aus fund_2.html Struktur, statisch):
- **FREUND** 5€/Mo · *"Stammgast-Beitrag"*
- **KINN:PATE** 15€/Mo · *"Aktiver Supporter"*
- **TRÄGER** 50€/Mo · *"Chapter-Enabler"*
Prinzip (aus start.html): *"100% fließen direkt in die Community."*
Offene Frage als Note-Box: *"Wie kommunizieren wir das zur breiteren Community?"*
**Notes:** "Das Modell steht. Heute: wer glaubt daran? Das ist die Frage."

### 15 · Offene Fragen `[light]`
**Inhalt:** 5 große Diskussionskarten (2×3 Grid, letzte zentriert):
1. **KINN:FUND** — Kommunikation nach außen?
2. **Kanal** — Was nach WhatsApp? (Monday.com für Tasks — aber Community-Kanal?)
3. **Rollen-Ownership** — Wer übernimmt was verbindlich?
4. **Onboarding** — Wie kommen neue Crew-Mitglieder rein?
5. **Feedback** — Wie sammeln wir systematisch?
**Notes:** "Keine Antworten heute. Welche Frage hat höchste Priorität — Handzeichen."

### 16 · Das sind wir `[dark]`
**Inhalt:** 4 Werte-Cards (aus Manifest-PDF), 2×2 Grid:
- **AUGENHÖHE** — *"Den Menschen kennenlernst du zuerst, nicht das Unternehmen."*
- **NEUGIER** — *"Wir teilen was wir wissen. Wir fragen was wir nicht wissen."*
- **VERTRAUEN** — *"Tausch ohne Verkauf."*
- **OFFENHEIT** — *"Allein hinzugehen zeigt Größe."*
Bottom: *"KINN ist größer als jeder von uns."* (mintgreen, Montserrat 700)
**Notes:** "Kurz innehalten. Das ist das Fundament."

### 17 · Prost `[dark]`
**Inhalt:** "Prost." — Montserrat 900, ~15vw, mintgreen · Sub (klein): *"KINN · Nov 2025 – Feb 2026 · 110 Personen in Tirol"*
**Notes:** "Danke. Wirklich."

---

## Sondertool: kinn15-tischplan.html

**Standalone** — nicht im Deck, direkt im Browser öffnen. Offline-fähig.

### Spezifikation

**Hintergrund:** `lernbar.png` (placeholder SVG, 1200×750px)
- Horizontales Rechteck mit Wänden, Fensterfront auf einer Seite, Tür vorne links
- Vorderer Bereich: "Präsentation" (mintgreen schraffiert)
- Hinterer Bereich: freie Fläche für 14 Tische
- Label: "WIFI Lernbar · Innsbruck · KINN#15 · 5. März 2026 · 86 TN · 14 Tische"

**14 Tisch-Overlays** (draggable via mousedown/mousemove, touch-fähig):
- Default: 2 Reihen à 7, gleichmäßig verteilt über freie Fläche
- Jede Karte: `position:absolute`, Breite ~110px, Höhe ~70px
- Inhalt: **T01** (groß, mintgreen) · Moderator (editable) · Thema (editable)
- Doppelklick → Inline-Edit mit `contenteditable`
- Speichern: `localStorage.setItem('lernbar-v1', JSON.stringify({positions, data}))`

**Vorbelegte Themen (editierbar):**
```
T01 KI für Einsteiger       T08 Healthcare & KI
T02 Use Cases Mittelstand    T09 KI im Handwerk/Bau
T03 Vibe Coding/Dev Tools    T10 Bildung & Lernen
T04 AI Marketing             T11 Startup + KI
T05 Automatisierung          T12 Voice AI/Agents
T06 Prompt Engineering       T13 Chapter-Aufbau
T07 KI-Ethik & Gesellschaft  T14 Offener Tisch
```

**Toolbar (oben):**
- `Reset` — Positionen zurück auf Default, Inhalte behalten
- `Drucken` — `window.print()`, Print-CSS: A4 landscape, keine Toolbar
- `Speichern` (auto, bei jeder Änderung)

---

## Build-Reihenfolge (für Parallel-Agents)

```
Phase 1 (zuerst): kinn-potluck-slidedeck.html + engine.js
                  → definiert die API, alle anderen hängen davon ab

Phase 2 (parallel nach Phase 1):
  Agent B: slides 03, 04, 05, 06   (Daten-Slides)
  Agent C: slides 07, 08, 13, 14   (Strategie + Map + Roadmap + Fund)
  Agent D: slides 01, 02, 09, 10, 15, 16, 17  (Frame + Human)
  Agent E: slides 11, 12            (Team + Heatmap)
  Agent F: kinn15-tischplan.html + lernbar.png  (unabhängig)
```

---

## Offene To-dos

- [ ] Echte Team-Fotos liefern → `img/team-[vorname].jpg` (quadratisch, mind. 200×200px)
- [ ] Tisch-Moderatoren für KINN#15 befüllen (in tischplan.html)
- [ ] Echten Lernbar-Grundriss liefern → ersetzt lernbar.png Placeholder
- [ ] Leaflet-Karte: Internetverbindung am Abend bestätigen (Tiles brauchen Online)
- [ ] Tier-Links für KINN:FUND Slide (oder als reine Info ohne Klick-Button framen)
