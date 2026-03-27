# KINN Feedback System — API-Referenz für Toolkit

> **Quelle:** `kinn.at` (KINN Hauptrepo)
> **Stand:** 2026-03-26

## Feedback-Daten abrufen

### Alle Events mit Feedback-Status

```
GET /api/feedback/event?key={slug}
```

Kein Auth nötig. Gibt Basis-Status zurück.

| Param | Beispiel | Beschreibung |
|-------|---------|-------------|
| `key` | `18`, `18-kufstein` | Event-Slug |

**Response:**
```json
{
  "name": "KINN#18",
  "type": "chapter",
  "date": "2026-03-26",
  "feedbackOpen": true,
  "totalFeedback": 8,
  "avgRating": "4.4"
}
```

### Event-Details mit Teilnehmer-Status

```
GET /api/feedback/details?key={slug}
Authorization: Bearer {ADMIN_PASSWORD}
```

Gibt vollständige Feedback-Daten inkl. Versand-Status pro Teilnehmer.

**Response:**
```json
{
  "event": {
    "name": "KINN#17",
    "date": "2026-03-19",
    "type": "chapter",
    "location": "SOHO 2",
    "feedbackOpen": false,
    "avgRating": "4.4",
    "lumaId": "evt-tdtFHoJZULq2Wrn"
  },
  "attendees": [
    {
      "firstName": "Anna",
      "lastInitial": "M.",
      "emailHash": "a1b2c3d4e5f6g7h8",
      "status": "answered",
      "feedback": {
        "valueRating": 5,
        "contactMade": true,
        "missingText": "Mehr Zeit für Networking",
        "valueText": "",
        "comment": ""
      }
    },
    {
      "firstName": "Max",
      "lastInitial": "K.",
      "emailHash": "h8g7f6e5d4c3b2a1",
      "status": "sent",
      "feedback": null
    }
  ],
  "stats": {
    "totalSent": 12,
    "totalAnswered": 8,
    "responseRate": 67,
    "avgRating": "4.4",
    "contactRate": 75
  }
}
```

### Teilnehmer-Status (3 Stufen)

| Status | Bedeutung | Abgeleitet aus |
|--------|-----------|---------------|
| `pending` | Email noch nicht gesendet | Hash NICHT in `{eventKey}:sent` |
| `sent` | Email gesendet, kein Feedback | Hash in `:sent`, kein Match in `:feedback` |
| `answered` | Feedback eingegangen | Entry in `{eventKey}:feedback` |

### Luma-Gäste mit Versand-Status (Preview)

```
GET /api/feedback/preview?key={slug}
Authorization: Bearer {ADMIN_PASSWORD}
```

Holt eingecheckte Gäste von Luma und merged mit bestehendem Versand-/Feedback-Status.

**Response:**
```json
{
  "guests": [
    { "firstName": "Anna", "lastInitial": "M.", "emailHash": "...", "status": "answered", "feedback": {...} },
    { "firstName": "Max", "lastInitial": "K.", "emailHash": "...", "status": "pending", "feedback": null }
  ],
  "event": { "name": "KINN#18", "date": "2026-03-26", "feedbackOpen": true }
}
```

## Redis-Schema

```
kinn:event:{slug}              → Hash (name, date, type, lumaId, feedbackOpen, avgRating, ...)
kinn:event:{slug}:feedback     → JSON Array mit Feedback-Entries
kinn:event:{slug}:sent         → Set<emailHash> (wer eine Email bekommen hat)
feedback:token:{hash}          → { firstName, lastInitial, email, eventKey } (TTL 14d)
feedback:guests:{eventKey}     → JSON Array (Luma-Gäste Cache, TTL 10min)
```

## Versand

### Automatisch (Cron)

Jeden **Donnerstag 09:00 UTC (10:00 CET)** — direkt nach KINN Ende (08:00–10:00).

```
GET /api/feedback/cron
Authorization: Bearer {CRON_SECRET}
```

- Findet heutige Chapter-Events
- Holt Gäste von Luma, sendet Feedback-Emails
- 1s Pause zwischen Emails (Resend Limit: 5 req/s)
- Überspringt bereits gesendete (`:sent` Set)

### Manuell (einzeln)

```
POST /api/feedback/send-one
Authorization: Bearer {ADMIN_PASSWORD}
Content-Type: application/json

{ "key": "18", "emailHash": "a1b2c3d4e5f6g7h8" }
```

**Response:**
```json
{ "sent": true, "firstName": "Anna", "lastInitial": "M." }
// oder
{ "skipped": true, "reason": "already sent" }
```

Cached Luma-Gäste für 10min in Redis — erster Call pro Event fetcht, Rest nutzt Cache.

## Luma API — Wichtig

```
GET https://public-api.luma.com/v1/event/get-guests
  ?event_id={lumaId}
  &pagination_limit=100
  &pagination_cursor={cursor}

Header: x-luma-api-key: {LUMA_API_KEY}
```

**ACHTUNG:** `event_api_id` ist DEPRECATED und hängt auf Vercel. Immer `event_id` verwenden.

Referenz: `_LAB/api/luma/guests.js` (bewährt, Vercel-getestet)
