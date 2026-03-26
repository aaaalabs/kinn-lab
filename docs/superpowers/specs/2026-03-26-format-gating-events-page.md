# Format-Gating & Events-Seite — Design Spec

**Datum:** 2026-03-26
**Status:** Approved (nach Plausibilitätstest)

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
User besucht Events-Seite (lab.kinn.at/events)
    |
    ├── Nicht eingeloggt (kein lab_session)
    |   ├── Donnerstag-Events: offen, Luma-Link sichtbar
    |   └── TALK/KURS: Karte sichtbar, leicht gedimmt, CTA = Login-Modal
    |
    └── Eingeloggt (lab_session in localStorage)
        |
        └── Events-Endpoint: GET /api/events/gated?email=xxx
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
Events-Seite (lab.kinn.at)
    |
    ├── GET /api/events/gated?email=xxx (HTTPS, serverseitig)
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

Donnerstag prominent (Hero-Card), TALK/KURS sekundär darunter. Dynamisch: wenn keine TALK/KURS-Events existieren, zeigt die Seite nur den Donnerstag — kein leerer Bereich, kein Placeholder.

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
- **Require Approval** — Backup falls jemand den Direktlink findet
- Prototyp: manuelles Approve/Decline durch Host
- Später (Phase 3): Auto-Approve via Make.com mit Attendance-Check

kinn.at/lab.kinn.at ist der einzige öffentliche Einstiegspunkt für TALK/KURS.

---

## 4. Verified-DB

### Primär: Attendance-Daten

Bestehende Luma-Attendance-Daten (bereits in Redis via `/api/luma/attendance`). Check: `visitCount >= 1` = verifiziert. Cross-Chapter: Kufstein-Teilnahme gilt auch für Innsbruck-TALK.

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

### GET /api/events/gated

Liefert alle upcoming Events mit Gating-Status. Auf lab.kinn.at (LAB-Repo).

**Query-Parameter:**
| Param | Optional | Beschreibung |
|-------|----------|-------------|
| `email` | ja | Klartext-Email des Users (nur über HTTPS). Wenn gesetzt: Verify-Check inkl. |

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
- Ohne `email`: alle Events mit `locked: true` für TALK/KURS
- `lumaUrl` nur included wenn `locked: false`
- **`Cache-Control: private`** wenn `email` Parameter gesetzt (keine CDN-Caches für personalisierte Responses)
- Ohne `email`: `Cache-Control: s-maxage=60, stale-while-revalidate=300`

---

## 6. Auth-Integration

### Cross-Domain: lab.kinn.at ↔ kinn.at

Die Events-Seite läuft auf lab.kinn.at (Prototyp). Auth (Magic Link) läuft auf kinn.at. Unterschiedliche Origins → localStorage nicht geteilt.

**Lösung: Redirect-basierter Auth**

1. User klickt gelockte Karte auf lab.kinn.at → Login-Modal
2. Modal sendet Email an kinn.at: `POST https://kinn.at/api/signup` mit `{ email, redirect: "https://lab.kinn.at/events" }`
3. kinn.at sendet Magic Link per Email
4. User klickt Magic Link → `/api/auth/login?token=xxx&redirect=https://lab.kinn.at/events`
5. kinn.at verifiziert Token, redirected zu: `https://lab.kinn.at/events#token=xxx&email=user@example.com`
6. lab.kinn.at extrahiert Token + Email aus Hash, speichert in localStorage als `lab_session` + `lab_email`
7. Events-Seite lädt neu mit Gating-Check

**kinn.at unterstützt redirect bereits:** `POST /api/signup` akzeptiert `{ redirect }`, `/api/auth/login` redirected korrekt (inkl. Safe-Redirect-Validation: muss mit `/` oder `https://` starten, kein `//`).

**Beim Umzug nach kinn.at:** Redirect entfällt, `kinn_session` wird direkt verwendet.

### Events-Seite Integration

```js
// Token aus Hash extrahieren (nach Magic-Link-Return)
function extractAuthFromHash() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token = params.get('token');
  const email = params.get('email');
  if (token && email) {
    localStorage.setItem('lab_session', token);
    localStorage.setItem('lab_email', email);
    window.history.replaceState(null, '', window.location.pathname);
  }
}

// Beim Laden der Events-Seite
extractAuthFromHash();
const email = localStorage.getItem('lab_email');
const token = localStorage.getItem('lab_session');

if (email && token) {
  const res = await fetch('/api/events/gated?email=' + encodeURIComponent(email));
  // → Events mit locked: true/false
} else {
  const res = await fetch('/api/events/gated');
  // → Alle TALK/KURS locked: true
}
```

### Login-Modal

Nicht-eingeloggt + Klick auf gelockte TALK/KURS-Karte → Login-Modal:
- Email-Eingabe
- Submit → `POST https://kinn.at/api/signup` mit `{ email, redirect: "https://lab.kinn.at/events" }`
- Bestätigung: "Link kommt ins Postfach"

**Wichtig:** Nicht-eingeloggt + Klick auf gelockte Karte öffnet den Login-Modal. Wenn der User sich einloggt aber nicht verifiziert ist, sieht er danach den Lock-Hinweis mit Donnerstag-Einladung. Das ist gewollt — der Login-Flow ist der universelle Einstieg, egal ob verifiziert oder nicht.

### Status-Persistenz

localStorage (unbegrenzt): `lab_session` + `lab_email`. Kein Re-Check, kein TTL. "Einmal freigeschaltet = freigeschaltet."

Anderes Gerät/Browser: User muss sich erneut einloggen (Magic Link, 3 Sekunden). Bekannte Limitation von localStorage-basierter Auth.

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

## 9. Bekannte Limitierungen

| Thema | Details | Akzeptiert weil |
|-------|---------|-----------------|
| Per-Device Auth | Neues Gerät = erneuter Magic Link | 3 Sekunden, kein Blocker |
| In-App Browser | Magic Link in Gmail/Outlook öffnet In-App-Webview, localStorage transferiert nicht zum System-Browser | Allgemeines Magic-Link-Problem, nicht lösbar ohne App |
| Attendance-Cache | 1h Redis TTL + CDN Cache. Check-in um 09:00, Verify evtl. erst ab 10:00 möglich | Donnerstag-TALK-Anmeldungen passieren nicht in Echtzeit nach Check-in |
| Luma-Direktlink | Wer den unlisted Link hat, kann sich direkt auf Luma anmelden | Require Approval fängt das ab |
| Andere Email | User muss manuell kontaktieren | 2-3 Fälle/Monat, kein Aufwand |

---

## 10. Sicherheit

- **Klartext-Email** an API (kein Hash): HTTPS verschlüsselt den Transport. Serverseitig nötig für Attendance-Lookup. Email wird nicht geloggt, nicht gecacht, nicht in Response inkludiert.
- **`Cache-Control: private`** für personalisierte Responses (mit `email`-Parameter). Verhindert CDN-Cache-Poisoning.
- **`lumaUrl` in Response**: Nicht die Security-Boundary. Luma Require Approval ist das eigentliche Gate. URL-Secrecy ist Defense-in-Depth.
- **Cross-Origin Auth**: Token + Email kommen im URL-Fragment (Hash), nicht in Query-Params. Hash wird nicht an Server gesendet, nicht in Server-Logs.

---

## 11. Rollout

### Phase 0 — Sofort
- TALK/KURS in Luma auf Unlisted + Require Approval
- Pre-2026-Whitelist als Redis-Set anlegen (`kinn:verified:whitelist`)

### Phase 1 — Events-Seite mit Gating (lab.kinn.at)
- `/api/events/gated` Endpoint bauen (Events + Verify-Check)
- Events-Seite: Layout mit Hero + sekundäre Karten
- Lock/Unlock-States implementieren
- Login-Modal: Cross-Domain Auth via kinn.at Redirect
- Token-Extraktion aus Hash nach Magic-Link-Return

### Phase 2 — Voting-Widget
- Top-3 Teaser auf Events-Seite
- Voting-Modal einbetten

### Phase 3 — Automation & Migration
- Make.com: Auto-Approve bei Luma mit Attendance-Check (nicht blind)
- Unlock-Benachrichtigung nach erstem Check-in
- Migration der Events-Seite von lab.kinn.at nach kinn.at
