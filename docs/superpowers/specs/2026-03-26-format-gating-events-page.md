# Format-Gating & Events-Seite — Design Spec

**Datum:** 2026-03-26
**Status:** Approved

---

## Problem

TALK/KURS-Anmeldungen ohne vorherige KINN-Donnerstag-Teilnahme. Manuelle Absagen durch Hosts nötig. Die Events-Seite zeigt aktuell nur Donnerstage.

## Grundsätze

- Einladung statt Ablehnung — niemand wird rejected
- Sichtbar, nicht versteckt — alle Formate für alle sichtbar
- Gleiche Regel für alle — keine Ausnahmen
- Donnerstag ist der Handschlag — einmal da, alles offen

---

## 1. Architektur

### Auth = Unlock

Kein separater Freischalt-Flow. Der bestehende Magic-Link-Flow auf kinn.at IST der Unlock-Mechanismus.

```
User besucht Events-Seite
    |
    ├── Nicht eingeloggt
    |   ├── Donnerstag-Events: offen, Luma-Link sichtbar
    |   └── TALK/KURS: Karte sichtbar, leicht gedimmt, CTA = Login-Modal
    |
    └── Eingeloggt (kinn_session in localStorage)
        |
        └── Events-Endpoint: GET /api/events?email_hash=xxx
            |
            ├── Verifiziert (Attendance >= 1 ODER Whitelist)
            |   └── TALK/KURS: Karte voll aktiv, Luma-Link sichtbar
            |
            └── Nicht verifiziert
                └── TALK/KURS: Karte sichtbar, leicht gedimmt
                    CTA = "Format freigeschaltet nach deinem ersten KINN Donnerstag"
                    + Link zum nächsten Donnerstag
```

### Datenfluss

```
Events-Seite (kinn.at)
    |
    ├── GET /api/events?email_hash=xxx
    |   ├── Redis: kinn:event:* (alle Events mit Typ, Datum, Location, lumaUrl)
    |   ├── Redis: Attendance-Daten (email -> visitCount)
    |   ├── Redis: kinn:verified:whitelist (Pre-2026 Set)
    |   └── Response: Events[] mit { locked: true/false } pro Event
    |
    ├── Donnerstag-Events → Luma-Link direkt
    └── TALK/KURS-Events → Luma-Link (unlisted) erst nach Verify
```

---

## 2. Events-Seite Layout

### Hierarchie

Donnerstag prominent (Hero-Card), TALK/KURS sekundär darunter. Dynamisch: wenn keine TALK/KURS-Events existieren, zeigt die Seite nur den Donnerstag — kein leerer Bereich.

```
┌─────────────────────────────────────────────┐
│  [Hero] Nächster KINN Donnerstag            │
│  KINN#19 · Do 2. April · SOHO 2            │
│  [Anmelden]                                 │
│                                             │
│  Top-3 Themen: AI Agents · RAG · Vibe Coding│
│  [Stimm ab]                                 │
├─────────────────────────────────────────────┤
│  KINN:TALK                    KINN:KURS     │
│  ┌──────────────┐            ┌──────────────┐│
│  │ Content AI   │            │ Prompt Eng.  ││
│  │ Di 1.4 18:00 │            │ Mi 9.4 18:00 ││
│  │ [Anmelden]   │            │ [Anmelden]   ││
│  │  oder Lock   │            │  oder Lock   ││
│  └──────────────┘            └──────────────┘│
└─────────────────────────────────────────────┘
```

### Lock-State (TALK/KURS)

Volle Karte sichtbar (Titel, Datum, Beschreibung), visuell leicht gedimmt (reduced opacity). Anmelde-Button ersetzt durch Lock-Hinweis:

- Text: "Format freigeschaltet nach deinem ersten KINN Donnerstag"
- Button: "Zum nächsten Donnerstag" (verlinkt auf Hero-Card / Luma)
- Kein "gesperrt", "nicht berechtigt" — immer einladend

### Unlock-State (TALK/KURS)

Karte voll aktiv, normaler Style. CTA-Button verlinkt auf den Luma-Event-Link (unlisted).

---

## 3. Luma-Konfiguration

TALK/KURS-Events in Luma:
- **Unlisted** — nicht öffentlich auffindbar
- **Require Approval** — Backup falls jemand den Direktlink kennt
- Auto-Approve via Make.com oder manuell durch Host

kinn.at ist der einzige öffentliche Einstiegspunkt für TALK/KURS.

---

## 4. Verified-DB

### Primär: Attendance-Daten

Bestehende Luma-Attendance-Daten (bereits in Redis via `/api/luma/attendance`). Check: `visitCount >= 1` = verifiziert.

### Sekundär: Whitelist

Redis-Set `kinn:verified:whitelist` für:
- Pre-2026-Teilnehmer (ca. 20-30 Personen, einmalig anlegen)
- Sonderfälle (andere Email verwendet, manuell bestätigt)

### Verify-Logik (serverseitig)

```
verified = attendanceCounts[email] >= 1 || SISMEMBER('kinn:verified:whitelist', email)
```

### Edge Case: Andere Email

User meldet sich mit anderer Email an als beim Donnerstag. Lösung: Kontakt-Link ("Andere Email verwendet? Schreib uns kurz an kontakt@kinn.at"). Manueller Whitelist-Eintrag durch Team. Realistisch: 2-3 Fälle/Monat.

---

## 5. API-Endpoint

### GET /api/events

Liefert alle upcoming Events mit Gating-Status.

**Query-Parameter:**
| Param | Optional | Beschreibung |
|-------|----------|-------------|
| `email_hash` | ja | SHA-256 Hash der User-Email. Wenn gesetzt: Verify-Check inkl. |

**Response:**
```json
{
  "hero": {
    "key": "19",
    "name": "KINN#19",
    "type": "chapter",
    "date": "2026-04-02",
    "time": "08:00",
    "location": "SOHO 2",
    "locationCity": "Innsbruck",
    "lumaUrl": "https://lu.ma/kinn19",
    "voting": {
      "topTopics": [
        { "title": "AI Agents", "votes": 12 },
        { "title": "RAG", "votes": 9 },
        { "title": "Vibe Coding", "votes": 7 }
      ]
    }
  },
  "events": [
    {
      "key": "talk:content-ai",
      "name": "KINN:TALK - Content AI",
      "type": "talk",
      "date": "2026-04-01",
      "time": "18:00",
      "location": "SOHO 2",
      "lumaUrl": "https://lu.ma/kinn-talk-content-ai",
      "locked": false
    }
  ],
  "verified": true
}
```

- `hero`: nächster Donnerstag (immer offen, kein Gating)
- `events`: TALK/KURS-Events, `locked` basierend auf Verify-Check
- `verified`: globaler Status des Users
- Ohne `email_hash`: alle Events mit `locked: true` für TALK/KURS
- `lumaUrl` nur included wenn `locked: false`

---

## 6. Auth-Integration

### Bestehender Magic-Link-Flow (kinn.at)

Bereits implementiert:
- `POST /api/signup` — sendet Magic Link per Email
- `/api/auth/login?token=xxx` — verifiziert, redirected
- `localStorage: kinn_session` (JWT, 30 Tage) + `kinn_email`
- `auth.js: getSession(), getUserEmail(), isSessionValid()`

### Events-Seite Integration

```js
// Beim Laden der Events-Seite
const session = getSession();
if (session && isSessionValid()) {
  const emailHash = await sha256(getUserEmail());
  const res = await fetch('/api/events?email_hash=' + emailHash);
  // → Events mit locked: true/false
} else {
  const res = await fetch('/api/events');
  // → Alle TALK/KURS locked: true
}
```

### Login-Trigger

Nicht-eingeloggt + Klick auf gelockte TALK/KURS-Karte → bestehender Login-Modal öffnet sich. Nach Magic-Link-Return: Events-Seite lädt neu, Gating-Check läuft automatisch.

### Status-Persistenz

localStorage (unbegrenzt). `kinn_session` ist bereits persistent. Kein zusätzlicher Unlock-State nötig — Session-Existenz + Verify-Check = Unlock-Status.

---

## 7. Voting-Widget

### Platzierung

Unter der Donnerstag-Hero-Card. Nur sichtbar wenn Voting aktiv ist (Themen vorhanden).

### Darstellung

Top-3 Themen als kompakte Liste (Titel + Vote-Count). CTA-Button "Stimm ab".

### Interaktion

Klick auf "Stimm ab" öffnet Voting-Modal mit dem vollen Voting-Interface. Gleiche Modal-Mechanik wie Login-Modal.

### Modal-System

Ein Modal-Container, zwei Zwecke:
- Login-Modal (Magic Link) — bei Klick auf gelockte Karte
- Voting-Modal (Themen) — bei Klick auf "Stimm ab"

---

## 8. Datenquelle

Alle Event-Daten aus Redis `kinn:event:*` Hashes (unified schema). Felder:

| Feld | Verwendung |
|------|-----------|
| `name` | Event-Titel |
| `type` | chapter / talk / kurs — bestimmt Gating |
| `date`, `time` | Anzeige |
| `location`, `locationCity` | Anzeige |
| `lumaUrl` | Anmelde-Link (nur bei unlock) |
| `status` | upcoming / past |

Kein zusätzlicher Luma-API-Call im Frontend. Redis ist die einzige Datenquelle für die Events-Seite.

---

## 9. Rollout

### Phase 0 — Sofort
- TALK/KURS in Luma auf Unlisted + Require Approval
- Pre-2026-Whitelist als Redis-Set anlegen

### Phase 1 — Events-Seite mit Gating
- Events-Endpoint bauen (`/api/events` mit Verify-Check)
- Events-Seite: Layout mit Hero + Sekundär-Karten
- Lock/Unlock-States implementieren
- Magic-Link-Modal Integration

### Phase 2 — Voting-Widget
- Top-3 Teaser auf Events-Seite
- Voting-Modal einbetten

### Phase 3 — Automation
- Make.com: Auto-Approve bei Luma Require Approval (Backup)
- Unlock-Benachrichtigung nach erstem Check-in
