# KINN:CREW Report Feb 2026 — Design Document

**Datum:** 2026-03-01
**Datei:** `kinn-crew-report-feb2026.html` (single file, self-contained)

## Ziel

Strategischen Meeting-Report vom 28. Feb 2026 als scrollbares, druckbares HTML-Dokument im KINN-Brand-Design-System aufbereiten.

## Format

- **Scrollbarer Report** (kein Slide-Deck)
- Single HTML file, kein Server nötig
- Responsive: Desktop mit Sidebar, Mobile ohne

## Layout

```
┌────────────────────────────────────────┐
│  Dark Hero Cover (100vh)               │
│  KINN Logo + Titel + Datum + Chips     │
└────────────────────────────────────────┘
┌────────┐ ┌──────────────────────────────┐
│ TOC    │ │ Section 01 (ecru-white bg)   │
│ sticky │ │ Section 02 (white bg)        │
│ left   │ │ Section 03 (ecru-white bg)   │
│ 200px  │ │ ...                          │
└────────┘ └──────────────────────────────┘
```

## Sections (10)

1. Executive Summary → 5 Status-Cards
2. Identität & Werte → Text + Quote + Note-Box (Konsens-Werte)
3. Moderation & Qualitätssicherung → Text + Lösungsansätze-Liste
4. Format-Erweiterungen → 3 Format-Cards (Tech Talks, Workshops, Weitere)
5. Matchmaking & Daten-Intelligence → Text + Quote + Vision-Box
6. Kommerzialisierung → Two-Column Firewall (Thomas vs Martin)
7. Skalierung & Ressourcen → 4 Bottleneck-Cards + Quote
8. Governance & Entscheidungsfindung → Text + Quotes
9. Was funktioniert — die Stärken → 6 Metric/Achievement-Cards
10. Follow-Ups & Nächste Schritte → Styled Table + Experiments-Liste
+ Fazit → Dark outro section

## Design System

Identisch mit `kinn-potluck-slidedeck.html`:
- CSS Vars: `--mintgreen` `--heavy-metal` `--ecru-white` `--spring-rain` `--teal` `--dark-teal` `--malta` `--kangaroo`
- Fonts: Futura (body) + Montserrat 700/800/900 (headings)
- Komponenten: quote-box, note-box, firewall-2col, metric-card, priority-badge, styled table

## Spezial-Komponenten

- **Status-Cards** (Executive Summary): Icon + Label + Kurzbeschreibung + Farb-Coding
- **Firewall** (Kommerzialisierung): 2-Spalten, Trennlinie, Thomas links / Martin rechts
- **Priority Table** (Follow-Ups): Zebra-stripes, DRINGEND=red-tinted, HOCH=teal, MITTEL=kangaroo
- **TOC Sidebar**: sticky, active section highlighted in mintgreen

## Dateipfad

`/Users/livingmydesign/GitHub/_quicks/_KINN/_PATE/KINN_CREW01/kinn-crew-report-feb2026.html`
