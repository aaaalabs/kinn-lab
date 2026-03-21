# KINN Event Unified Data Model

**Datum:** 21. März 2026
**Status:** Approved
**Scope:** Cross-Repo (KINN + LAB), Redis Datenmodell, Migration

---

## Problem

KINN-Event-Daten sind über 3 fragmentierte Systeme verteilt:

- `radar:event:kinn-*` (KINN-Repo) — Metadaten, Status, Shortlinks
- `lab:events:{luma-id}` (LAB-Repo) — Feedback, Fotos, Teilnehmerzahlen
- `lab:capacity:{luma-id}` (LAB-Repo) — Kapazitätskonfiguration

Dazu kommen separate Keys für Shortlinks (`kinn:event-links`, `kinn:tech-links`) und ein Index (`lab:events:index`). Das Ergebnis: kein einheitliches Bild eines Events, Daten müssen aus mehreren Quellen gemerged werden, Inkonsistenzen zwischen den Systemen.

## Lösung

Ein einheitliches `kinn:event:*` Schema als Redis Hash pro Event. Alle Properties in einem Record. Radar-Events (externe KI-Events Tirol) bleiben unter `radar:event:*` — zwei getrennte Systeme, kein Merge.

---

## Key-Schema

```
kinn:event:17                    → KINN#17 (Innsbruck, Default)
kinn:event:kufstein:17           → KINN#17 Kufstein
kinn:event:kitzbuehel:3          → KINN#3 Kitzbühel
kinn:event:tech:1                → KINN:TECH VoiceAI
kinn:event:talk:1                → KINN:TALK RAG
kinn:event:kurs:1                → KINN:KURS (zukünftig)

kinn:event:17:feedback           → Feedback-Einträge (JSON List)
kinn:events                      → Sorted Set (Score = Unix Timestamp)
```

**Regeln:**
- Innsbruck = Default, kein Chapter-Prefix
- Andere Chapters: `kinn:event:{chapter}:{nummer}`
- Sonderformate: `kinn:event:{format}:{nummer}`
- Nummerierung pro Typ unabhängig
- Kein `lab:` Prefix — eigener Namespace, kollidiert nicht mit `radar:*`

---

## Hash-Felder

```
HSET kinn:event:18
  # Identität
  name              "KINN#18"
  type              "chapter"           # chapter | tech | talk | kurs
  chapter           "Innsbruck"         # nur bei chapter-Events
  number            "18"
  status            "approved"          # approved | draft | cancelled
  description       ""                  # Kurzbeschreibung (optional)

  # Zeit & Ort
  date              "2026-03-26"
  time              "08:00"
  endTime           "09:00"
  timezone          "Europe/Vienna"
  location          "Das Wundervoll"
  locationCity      "Innsbruck"
  locationAddress   "Pembaurstraße 14, 6020 Innsbruck"

  # Luma-Verknüpfung
  lumaId            "evt-sGUfSbpTcWxuDG5"
  lumaUrl           "https://luma.com/..."
  coverUrl          "https://images.lumacdn.com/..."

  # Medien
  groupPhoto        "https://phlewfdax614hmqo.public.blob..."

  # Kapazität (manuell via Toolkit)
  earlyBird         "25"
  restplaetze       "5"
  maxCapacity       "30"              # earlyBird + restplaetze
  absolutMax        "36"              # maxCapacity + ceil(maxCapacity * 0.20)

  # Teilnehmerzahlen (verifiziert, manuell)
  registered        "33"
  checkedIn         "27"
  attendeesVerified "true"

  # Feedback-Aggregat (berechnet bei Submit)
  avgRating         "4.6"             # Durchschnitt: valueRating (chapter) | learnedRating (talk) | applyRating (kurs)
  totalRatings      "7"
  totalFeedback     "5"
  contactRate       "0.75"            # nur chapter: count(contactMade=true) / totalFeedback
  recommendRate     "0.90"            # nur talk: count(wouldRecommend=true) / totalFeedback

  # Feedback-Steuerung
  feedbackUrl       ""                # Custom URL zum Feedback-Formular (lab.kinn.at/feedback/{key})
  feedbackOpen      "true"            # Manueller Toggle

  # Live-Daten (periodisch von Luma API)
  liveApproved      "21"
  liveWaitlist      "0"
  livePending       "2"
  liveRefreshedAt   "2026-03-21T12:00:00Z"

  # Meta
  createdAt         "2026-03-21T12:00:00Z"
  updatedAt         "2026-03-21T12:00:00Z"
```

Alle Werte sind Strings (Redis Hash). Konvertierung auf Read-Seite.

**Felder die bewusst weggelassen wurden:**
- `category` — immer "AI", kein Mehrwert
- `tags` — werden aus Luma live gelesen, nicht gespeichert
- `overbook` — abgeleiteter Wert, nur `absolutMax` wird gespeichert

**Aggregat-Formeln:**
- `contactRate` = `count(contactMade=true) / totalFeedback` (nur type=chapter)
- `recommendRate` = `count(wouldRecommend=true) / totalFeedback` (nur type=talk)
- `avgRating` = Durchschnitt des jeweiligen Rating-Felds pro Typ
- Felder die für einen Typ nicht gelten bleiben leer

---

## Feedback-Schema

Gespeichert als JSON List in `kinn:event:{id}:feedback`.

### chapter (KINN Donnerstag)

3 Fragen: Kontakt (binär), Wert (1-5 Sterne + Pflichttext ab 3), Was fehlte (optional Freitext).

```json
{
  "attendeeId": "gst-...",
  "firstName": "Thomas",
  "lastInitial": "S",
  "contactMade": true,
  "valueRating": 5,
  "valueText": "Super Gespräch über RAG...",
  "missingText": "",
  "approved": true,
  "submittedAt": "2026-03-27T10:30:00Z"
}
```

### talk (KINN:TALK)

3 Fragen: Gelernt (1-5 Sterne), Weiterempfehlen (Ja/Nein), Freitext (optional).

```json
{
  "attendeeId": "gst-...",
  "firstName": "Anna",
  "lastInitial": "M",
  "learnedRating": 4,
  "wouldRecommend": true,
  "freeText": "",
  "approved": true,
  "submittedAt": "..."
}
```

### kurs (KINN:KURS)

3 Fragen: Anwenden (1-5 Sterne), Dauer (zu kurz/genau richtig/zu lang), Freitext (optional).

```json
{
  "attendeeId": "gst-...",
  "firstName": "Max",
  "lastInitial": "K",
  "applyRating": 3,
  "durationFit": "genau_richtig",
  "freeText": "Mehr Praxiszeit wäre gut",
  "approved": true,
  "submittedAt": "..."
}
```

### V1 Vereinfachung

- Alles auto-approved, manuell entfernen wenn nötig
- `feedbackOpen` als manueller Toggle, kein Auto-Close

---

## Index

`kinn:events` als Sorted Set. Score = Unix Timestamp aus `date` + `time` (volle Datetime, nicht nur Datum — damit Events am gleichen Tag deterministisch geordnet sind).

```
ZADD kinn:events 1774508400 "kinn:event:18"          # 2026-03-26 08:00 CET
ZADD kinn:events 1774508400 "kinn:event:kufstein:18" # 2026-03-26 08:00 CET
ZADD kinn:events 1774544400 "kinn:event:talk:1"      # 2026-03-26 18:00 CET
```

Abfrage aller zukünftigen Events:
```
ZRANGEBYSCORE kinn:events {now} +inf
```

Member-Werte sind die vollständigen Redis-Keys — können direkt für `HGETALL` verwendet werden.

---

## Shortlinks

Bisher: Separate Keys `kinn:event-links`, `kinn:tech-links`.
Neu: `lumaUrl` lebt im Event-Hash. Shortlink-Resolver (`/api/event/[id].js`) liest direkt aus dem Hash.

`kinn.at/18` → `HGET kinn:event:18 lumaUrl` → Redirect
`kinn.at/15-kufstein` → `HGET kinn:event:kufstein:15 lumaUrl` → Redirect
`kinn.at/talk/1` → `HGET kinn:event:talk:1 lumaUrl` → Redirect
`kinn.at/tech/1` → `HGET kinn:event:tech:1 lumaUrl` → Redirect

URL-zu-Key Mapping: Die URL-Segmente entsprechen dem Key nach `kinn:event:`. Nummer im URL wird 1:1 als Nummer im Key verwendet.

---

## Betroffene Dateien

### LAB-Repo (8 Dateien)

| Datei | Änderung |
|-------|----------|
| `lib/redis-typed.js` | `raw()`-Accessor ohne `lab:` Prefix + Sorted Set Methoden (`zadd`, `zrangebyscore`) |
| `api/events/feedback.js` | Liest von `kinn:event:*` |
| `api/events/capacity.js` | Schreibt in `kinn:event:*` Hash direkt |
| `api/luma/events.js` | Liest Kapazität von `kinn:event:*` |
| `api/crm/leads.js` | Liest Feedback von `kinn:event:{id}:feedback` statt `lab:events:*` |
| `scripts/migrate-event-feedback.js` | Neues Migration-Script |
| `scripts/upload-event-photos.js` | Schreibt `groupPhoto` in `kinn:event:*` |
| `CLAUDE.md` | Prefix-Regel updaten |

### KINN-Repo (13 Dateien)

| Datei | Änderung |
|-------|----------|
| `api/events.js` | Liest von `kinn:event:*` |
| `api/events/widget.js` | Merged `kinn:event:*` + `radar:event:*` (wie calendar.js) |
| `api/event/[id].js` | Liest `lumaUrl` von `kinn:event:*` |
| `api/event/chapter.js` | Liest `lumaUrl` von `kinn:event:{chapter}:*` |
| `api/talk/[id].js` | Liest `lumaUrl` von `kinn:event:talk:*` statt `kinn:talk-links` |
| `api/tech/[id].js` | Liest `lumaUrl` von `kinn:event:tech:*` statt `kinn:tech-links` |
| `api/admin/add-from-luma.js` | Schreibt nach `kinn:event:*` |
| `api/admin/radar-events.js` | KINN-Events raus |
| `api/admin/event-links.js` | Phase 3: No-Op Stub. Phase 4: löschen |
| `api/admin/tech-links.js` | Phase 3: No-Op Stub. Phase 4: löschen |
| `api/radar/calendar.js` | Merged `kinn:event:*` + `radar:event:*` |
| `admin/js/kinn-events.js` | Liest von neuer API |
| `js/widgets/events.js` | Keine Änderung (API-Antwort bleibt gleich) |

---

## Migrations-Strategie

### Phase 0: Vorbereitung
- Backup aller betroffenen Redis Keys
- Migration-Script schreiben, lokal testen

### Phase 1: Neues Schema schreiben (parallel)
- Script liest aus `radar:event:kinn-*`, `lab:events:*`, `lab:capacity:*`
- Merged alles in `kinn:event:*` Hashes
- Feld-Mapping: `rating` → `valueRating`, `lastName` → `lastInitial`, `overbook` → berechnet `absolutMax`
- Schreibt `kinn:events` Sorted Set (Score = Unix Timestamp aus date+time)
- Alte Keys bleiben bestehen
- **Validierung:** Script vergleicht Event-Counts und Stichproben zwischen alt und neu

### Phase 2: LAB-Repo umstellen (niedrigerer Traffic, sicherer Start)
- `lib/redis-typed.js`: `raw()`-Accessor der den `lab:` Prefix umgeht und den Redis-Client direkt exponiert
- Alle Endpoints auf `kinn:event:*` umstellen
- Deploy, testen, Feedback-API + Events-Seite verifizieren

### Phase 3: KINN-Repo umstellen (öffentlich, höherer Traffic)
- Public API, Shortlinks, Kalender umstellen
- `event-links.js` / `tech-links.js` als No-Op Stubs behalten
- Admin-Panel liest von neuer API
- Deploy, testen

### Phase 4: Aufräumen
- Alte Keys löschen: `lab:events:*`, `lab:capacity:*`, `radar:event:kinn-*`
- `kinn:event-links`, `kinn:tech-links`, `kinn:talk-links`, `lab:events:index` löschen
- CLAUDE.md updaten

### Rollback
- Phase 1-3: Alte Keys bleiben bestehen. Code-Revert stellt alten Zustand sofort wieder her.
- Phase 4 erst nach bestätigter Stabilität.

---

## Entscheidungen

| Frage | Entscheidung |
|-------|-------------|
| Radar-Events | Bleiben unter `radar:event:*`, werden nicht migriert |
| KINN in Radar | Werden aus Radar entfernt, leben nur noch in `kinn:event:*` |
| Kalender | Merged beide Quellen (`kinn:event:*` + `radar:event:*`) |
| Index | Sorted Set `kinn:events` mit Datum als Score |
| Shortlinks | Im Event-Hash als `lumaUrl`, keine separaten Keys |
| `lab:` Prefix | Nicht für `kinn:event:*` — eigener Namespace |
| Feedback V1 | Auto-approved, manueller `feedbackOpen` Toggle |
| Feedback-Fragen | Typ-spezifisch: chapter (3), talk (3), kurs (3) |
| Event-Status | `status` Feld: approved/draft/cancelled (alle migrierten = approved) |
| Description | Optional, lebt im Hash. Nicht aus Luma gespiegelt. |
| Category/Tags | Weggelassen — immer AI, Tags aus Luma live |
| `feedbackUrl` | Konstruiert als `lab.kinn.at/feedback/{slug}` — slug = Key-Suffix nach `kinn:event:` (z.B. `18`, `kufstein:18`, `talk:1`) |
| Phasen-Reihenfolge | LAB zuerst (weniger Traffic), KINN danach |
| Deprecated Endpoints | No-Op Stubs in Phase 3, löschen in Phase 4 |
