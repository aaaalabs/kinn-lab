# KINN Event Feedback System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Branch:** `feat/event-feedback-system`
> **Repo:** KINN (main repo at `_quicks/_KINN/KINN/`)

**Goal:** Automatischer Feedback-Versand nach jedem KINN-Event mit typ-spezifischen Fragen. Ergebnisse landen in `kinn:event:{key}:feedback` (Redis Hash + JSON List).

**Architecture:** Vercel Cron triggert jeden Donnerstag um 10:00 einen Serverless Function der heutige Events aus `kinn:events` liest, die Gästeliste von Luma holt, und per Resend eine Feedback-Email an alle Checked-in Teilnehmer sendet. Das Feedback-Formular lebt unter `kinn.at/feedback/{slug}` als statische Seite mit API-Backend.

**Tech Stack:** Vercel Serverless Functions, Upstash Redis (`kinn:event:*`), Resend (Email), Luma API (Gästeliste), Vanilla HTML/CSS/JS (Formular)

**Spec-Referenz:** `_LAB/docs/superpowers/specs/2026-03-21-kinn-event-unified-data-model.md` (Feedback-Schema, Hash-Felder, Aggregat-Formeln)

---

## Kontext

### Redis-Schema (bereits implementiert)

Event-Hash `kinn:event:{key}`:
```
feedbackOpen      "true"       # Manueller Toggle, Cron setzt auf "true"
feedbackUrl       ""           # Wird beim Versand gesetzt
```

Feedback-Liste `kinn:event:{key}:feedback` (JSON):
```json
[
  {
    "attendeeId": "gst-...",
    "firstName": "Thomas",
    "lastInitial": "S",
    "contactMade": true,
    "valueRating": 5,
    "valueText": "...",
    "missingText": "",
    "approved": true,
    "submittedAt": "2026-03-27T10:30:00Z"
  }
]
```

Aggregat-Felder im Hash (bei jedem Submit aktualisiert):
```
avgRating, totalRatings, totalFeedback, contactRate, recommendRate
```

### Typ-spezifische Fragen

**chapter** (KINN Donnerstag):
1. "Hast du heute mindestens einen relevanten Kontakt geknüpft?" — Ja/Nein
2. "War der Donnerstag für dich wertvoll?" — 1-5 Sterne + Pflichttext ab 3 Sternen
3. "Was hat dir gefehlt?" — Freitext, optional

**talk** (KINN:TALK):
1. "Habe ich etwas Neues gelernt oder eine neue Perspektive gewonnen?" — 1-5 Sterne
2. "Würde ich dieses Thema weiterempfehlen?" — Ja/Nein
3. Freitext, optional

**kurs** (KINN:KURS):
1. "Konnte ich das Gelernte selbst anwenden/nachbauen?" — 1-5 Sterne
2. "War die Dauer angemessen?" — Zu kurz / Genau richtig / Zu lang
3. Freitext, optional

### Luma API

Gästeliste: `GET /v1/event/get-guests?event_api_id={id}`
- Guest-Objekt hat: `user_email`, `user_name`, `user_first_name`, `approval_status`, `checked_in_at`
- Nur `approved` Gäste mit Check-in erhalten die Email

### Resend

- API Key in `RESEND_API_KEY` env var
- Absender: `kontakt@kinn.at` (Domain muss in Resend verifiziert sein)
- Einfache Text-Email mit Link, kein HTML-Template nötig

---

## Voraussetzungen

- [ ] `kinn:event:*` Schema ist live (Unified Data Model Migration abgeschlossen)
- [ ] Resend Account mit verifizierter Domain `kinn.at`
- [ ] `RESEND_API_KEY` in Vercel env vars
- [ ] `LUMA_API_KEY` in Vercel env vars (bereits vorhanden)

---

## Task 1: Feedback API — Submit Endpoint

**Files:**
- Create: `api/feedback/submit.js`

Nimmt Feedback-Submissions entgegen und speichert sie in Redis.

- [ ] **Step 1:** Erstelle den Endpoint

```javascript
// POST /api/feedback/submit
// Body: { key: "18", token: "gst-xxx", ...answers }
//
// 1. Validiert token gegen Luma Gästeliste (optional, V1: skip)
// 2. Liest Event-Typ aus kinn:event:{key} hash
// 3. Validiert Antworten gegen typ-spezifisches Schema
// 4. Appendet an kinn:event:{key}:feedback JSON List
// 5. Aktualisiert Aggregat-Felder im Hash
// 6. Returns 200
```

Validierung:
- `key` muss existieren (`kinn:event:{key}`)
- `feedbackOpen` muss `"true"` sein
- Rating muss 1-5 sein
- Deduplizierung: Kein doppeltes Feedback pro `attendeeId`

Aggregat-Update nach jedem Submit:
```javascript
// Für chapter:
avgRating = avg(all valueRatings)
totalRatings = count(valueRatings)
totalFeedback = count(feedbacks with valueText)
contactRate = count(contactMade=true) / total

// Für talk:
avgRating = avg(all learnedRatings)
recommendRate = count(wouldRecommend=true) / total
```

- [ ] **Step 2:** Teste lokal

```bash
curl -X POST http://localhost:3000/api/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{"key":"17","attendeeId":"test","firstName":"Test","lastInitial":"T","contactMade":true,"valueRating":5,"valueText":"Test feedback"}'
```

- [ ] **Step 3:** Commit

```bash
git add api/feedback/submit.js
git commit -m "feat: add feedback submit API endpoint"
```

---

## Task 2: Feedback-Formular

**Files:**
- Create: `pages/feedback/index.html`

Statische Seite die per URL-Parameter den Event-Key bekommt: `kinn.at/feedback/17` oder `kinn.at/feedback/kufstein:18`

- [ ] **Step 1:** Erstelle das Formular

Design-Anforderungen:
- KINN Branding (Work Sans, Mint-Farben, clean)
- Responsive, mobile-first (Leute füllen das am Handy aus)
- Typ-spezifische Fragen (liest `type` vom Event)
- Sterne als klickbare Elemente
- Submit → POST `/api/feedback/submit`
- Erfolgsmeldung: "Danke für deine Stimme."
- Fehler: "Feedback ist geschlossen." wenn `feedbackOpen !== "true"`

Flow:
1. Seite lädt → GET `/api/feedback/event?key={slug}` (liefert Event-Name, Typ, feedbackOpen)
2. Zeigt typ-spezifisches Formular
3. Submit → POST `/api/feedback/submit`
4. Danke-Screen

- [ ] **Step 2:** Erstelle Helper-Endpoint

```javascript
// GET /api/feedback/event?key=17
// Returns: { name, type, date, feedbackOpen }
```

**Files:**
- Create: `api/feedback/event.js`

- [ ] **Step 3:** Vercel Rewrite in `vercel.json`

```json
{ "source": "/feedback/:slug*", "destination": "/pages/feedback/index.html" }
```

- [ ] **Step 4:** Teste lokal

Öffne `http://localhost:3000/feedback/17` im Browser.

- [ ] **Step 5:** Commit

```bash
git add pages/feedback/ api/feedback/event.js vercel.json
git commit -m "feat: add feedback form page with type-specific questions"
```

---

## Task 3: Email-Versand

**Files:**
- Create: `api/feedback/send.js`

Serverless Function die für ein Event die Feedback-Emails verschickt.

- [ ] **Step 1:** Erstelle den Versand-Endpoint

```javascript
// POST /api/feedback/send
// Body: { key: "18" } (oder von Cron aufgerufen)
// Auth: Interner Aufruf (API Key oder Cron Secret)
//
// 1. Liest kinn:event:{key} Hash
// 2. Setzt feedbackOpen = "true", feedbackUrl = "kinn.at/feedback/{slug}"
// 3. Holt Gästeliste von Luma (lumaId → get-guests)
// 4. Filtert: nur approved + checked_in
// 5. Sendet Email an jeden Gast via Resend
// 6. Returns: { sent: N, skipped: M }
```

Email-Inhalt:
```
Betreff: Wie war dein KINN Donnerstag?

Hey {firstName},

danke fürs Dabeisein beim {eventName}.

Deine Meinung in 30 Sekunden:
{feedbackUrl}

Bis nächsten Donnerstag!
```

Für TALK/KURS entsprechend angepasst:
```
Betreff: Wie war der KINN:TALK {thema}?
```

- [ ] **Step 2:** Teste mit einem Event

```bash
curl -X POST http://localhost:3000/api/feedback/send \
  -H "Content-Type: application/json" \
  -d '{"key":"17"}'
```

- [ ] **Step 3:** Commit

```bash
git add api/feedback/send.js
git commit -m "feat: add feedback email sender via Resend"
```

---

## Task 4: Cron — Automatischer Versand

**Files:**
- Create: `api/feedback/cron.js`
- Modify: `vercel.json` (Cron Schedule)

- [ ] **Step 1:** Erstelle den Cron-Handler

```javascript
// GET /api/feedback/cron (triggered by Vercel Cron)
//
// 1. Liest alle Events von heute aus kinn:events (by score = today 00:00 bis 23:59)
// 2. Für jedes Event: prüft ob feedbackOpen noch nicht gesetzt
// 3. Ruft intern /api/feedback/send auf
// 4. Loggt Ergebnis
```

- [ ] **Step 2:** Cron in `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/feedback/cron",
      "schedule": "0 9 * * 4"
    }
  ]
}
```

`0 9 * * 4` = jeden Donnerstag um 9:00 UTC = 10:00 CET.

Wichtig: Nur Events die HEUTE stattfinden. Nicht vergangene, nicht zukünftige.

- [ ] **Step 3:** Cron Secret für Auth

```javascript
// Vercel Cron sendet automatisch den CRON_SECRET Header
// Validierung: if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return 401
```

- [ ] **Step 4:** Commit

```bash
git add api/feedback/cron.js vercel.json
git commit -m "feat: add Thursday 10:00 cron for automatic feedback emails"
```

---

## Task 5: Toolkit — Feedback-Steuerung

**Files:**
- Modify: `toolkit/toolkit.js` (oder Admin-Panel im KINN-Repo)

- [ ] **Step 1:** Toggle im Dashboard

Neben der Kapazitäts-Konfiguration ein Toggle:
- "Feedback aktiv" (feedbackOpen = true/false)
- "Feedback manuell senden" Button (ruft `/api/feedback/send` auf)
- Zeigt Feedback-Stats: X Antworten, Ø Rating, Kontaktrate

Damit kann der Host:
- Feedback manuell auslösen (wenn der Cron verpasst wurde)
- Feedback schließen nach 48h

- [ ] **Step 2:** Commit

```bash
git add toolkit/toolkit.js
git commit -m "feat: add feedback controls to toolkit dashboard"
```

---

## Task 6: Deploy & Test

- [ ] **Step 1:** Deploy auf Preview

```bash
vercel
```

- [ ] **Step 2:** End-to-End Test

1. Öffne `kinn.at/feedback/17` → Formular mit chapter-Fragen
2. Fülle aus, submit → "Danke"
3. Prüfe Redis: `kinn:event:17:feedback` hat neuen Eintrag
4. Prüfe Aggregat: `avgRating`, `totalFeedback` aktualisiert
5. Teste Email-Versand manuell: POST `/api/feedback/send` mit `key=17`
6. Prüfe Posteingang

- [ ] **Step 3:** Deploy Production

```bash
vercel --prod
```

---

## Dateien-Übersicht

| Datei | Typ | Beschreibung |
|-------|-----|-------------|
| `api/feedback/submit.js` | API | Feedback-Submit, Validierung, Redis-Write |
| `api/feedback/event.js` | API | Event-Info für Formular (Name, Typ, Status) |
| `api/feedback/send.js` | API | Email-Versand via Resend |
| `api/feedback/cron.js` | Cron | Donnerstag 10:00 Trigger |
| `pages/feedback/index.html` | Frontend | Feedback-Formular (responsive, typ-spezifisch) |
| `vercel.json` | Config | Cron-Schedule + Rewrite `/feedback/:slug` |

## Redis-Keys die geschrieben werden

| Key | Operation | Wer |
|-----|-----------|-----|
| `kinn:event:{key}` | HSET feedbackOpen, feedbackUrl | send.js |
| `kinn:event:{key}:feedback` | GET + SET (append) | submit.js |
| `kinn:event:{key}` | HSET avgRating, totalFeedback, contactRate, etc. | submit.js |

## Abhängigkeiten

- `kinn:event:*` Schema muss live sein (Unified Data Model)
- Resend API Key + verifizierte Domain `kinn.at`
- Luma API Key (für Gästeliste)
- `@upstash/redis` (bereits installiert)
- `resend` npm Package (neu zu installieren)
