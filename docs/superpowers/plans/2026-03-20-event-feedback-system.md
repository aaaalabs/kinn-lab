# KINN Event Feedback System — Migration & Eigenständigkeit

**Datum:** 20. März 2026
**Status:** Plan
**Kontext:** Luma API liefert keine Feedback-Daten (Ratings, Texte). Teilnehmer-Check-ins sind ungenau. Wir übernehmen den gesamten Feedback-Prozess selbst.

---

## Ausgangslage

### Was Luma liefert (via API)
- Event-Metadaten (Name, Datum, Location, Cover, URL)
- Gästeliste mit Registrierungsstatus
- Check-in Timestamps (unvollständig — nicht alle werden eingecheckt)

### Was Luma NICHT liefert
- Feedback-Ratings (Sterne)
- Feedback-Texte (Freitextantworten)
- Aggregierte Bewertungen pro Event
- Kontrolle über den Feedback-Prozess (Timing, Fragen, Darstellung)

### Aktuelle Probleme
- Feedback-Daten sind in Luma eingeschlossen — kein Export via API
- Check-in-Zahlen sind ungenau (nicht alle Teilnehmer werden eingecheckt)
- Teilnehmerzahlen müssen manuell nachgebessert/freigegeben werden
- Kein Zugriff auf Feedback-Texte für die öffentliche Event-Seite

---

## Der Plan in 3 Phasen

### Phase 1: Historische Daten migrieren

**Ziel:** Alle Feedback-Daten ab KINN#7 in Redis speichern.

**Schritte:**
1. Luma CSVs exportieren (ab KINN#7, manuell aus Luma Dashboard)
2. CSVs in Ordner ablegen: `data/events/csv/`
3. Migrations-Script schreiben das CSVs parsed und in Redis speichert
4. Redis-Schema definieren (siehe unten)
5. Migration ausführen
6. Daten verifizieren

**CSV-Felder die relevant sind:**
- `name`, `first_name`, `last_name`, `email`
- `approval_status`, `checked_in_at`
- `survey_response_rating` (1-5 Sterne)
- `survey_response_feedback` (Freitext)
- `created_at` (Registrierungszeitpunkt)

**Redis-Schema:**

```
lab:events:{event-id}:meta
  → { name, date, location, locationCity, attendees, checkedIn, attendeesVerified: false }

lab:events:{event-id}:feedback
  → [ { name, firstName, rating, text, createdAt, approved: true/false } ]

lab:events:{event-id}:stats
  → { avgRating, totalRatings, totalFeedback, attendees, checkedIn }
```

**Event-ID Konvention:** `kinn-7`, `kinn-8`, ..., `kinn-17`, `kinn-17-kufstein`, etc.

**Prefix-Regel:** Alle Keys mit `lab:` prefixed (gemäß CLAUDE.md Redis-Regel).

### Phase 2: Eigener Feedback-Prozess

**Ziel:** Luma Feedback-Emails ersetzen durch eigenen Prozess. Feedback-Daten direkt in Redis speichern.

**Ablauf:**
1. Nach dem Event: Host markiert Event als "abgeschlossen" im Toolkit
2. System verschickt Feedback-Email an alle eingecheckten Teilnehmer (eigener Versand, kein Luma)
3. Email enthält Link zu Feedback-Formular auf `lab.kinn.at/feedback/{event-id}`
4. Formular: Rating (1-5) + Freitext + "Kommst du nächste Woche wieder?" (Ja/Vielleicht/Nein)
5. Submission geht direkt in Redis
6. Feedback wird moderiert (approved/rejected) bevor es öffentlich sichtbar ist

**Feedback-Formular Felder:**
- Rating: 1-5 Sterne (Pflicht)
- "War der Donnerstag für dich wertvoll?" (Ja/Geht so/Nein)
- "Hast du mindestens 1 relevanten Kontakt gemacht?" (Ja/Nein)
- Freitext: "Was nimmst du mit?" (Optional)
- "Kommst du nächste Woche wieder?" (Ja, fix / Vielleicht / Eher nicht)

**Moderation:**
- Feedback wird automatisch approved wenn:
  - Kein Freitext enthalten (nur Rating) → sofort sichtbar
  - Freitext vorhanden → Pending bis manuell reviewed
- Review-Kriterien: Entspricht den KINN Community-Richtlinien, verletzt keine Gesetze
- Kommunikation an Teilnehmer: "Dein Feedback wird direkt unter dem Event veröffentlicht, solange es den Community-Richtlinien entspricht"

**Email-Versand:**
- Timing: 1 Stunde nach Event-Ende (automatisch) oder manuell via Toolkit
- Absender: kontakt@kinn.at
- Betreff: "Wie war dein KINN Donnerstag?"
- Technologie: Vercel Serverless + Resend/Postmark/SES (TBD)

### Phase 3: Öffentliche Darstellung

**Ziel:** Feedback auf `lab.kinn.at/events` (und später `kinn.at/events`) öffentlich anzeigen.

**Was angezeigt wird:**
- Durchschnittliches Rating pro Event (Sterne)
- Anzahl Bewertungen
- Approved Feedback-Texte mit Vorname + Rating
- Verifizierte Teilnehmerzahl (nach manueller Freigabe)

**Was NICHT angezeigt wird:**
- Email-Adressen
- Nicht-approved Feedback
- Nachnamen (nur Vorname + Initial)

**API-Route:** `GET /api/events/{event-id}/feedback`
- Returns: stats (avgRating, count) + approved feedback entries

---

## Teilnehmerzahlen-Freigabe

Check-in-Zahlen aus Luma sind ungenau. Deshalb:

1. **Import:** Luma Check-in-Daten werden als Ausgangswert importiert
2. **Review:** Host korrigiert die Zahl im Toolkit nach dem Event (Event-Notiz hat bereits die Felder dafür)
3. **Freigabe:** `attendeesVerified: true` wird gesetzt wenn die Zahl manuell bestätigt wurde
4. **Anzeige:** Auf der Event-Seite wird die verifizierte Zahl angezeigt. Nicht-verifizierte Zahlen werden mit "~" Prefix angezeigt

---

## Datenfluss-Übersicht

```
PHASE 1 (Migration):
  Luma CSV Export → Parse-Script → Redis (lab:events:*)

PHASE 2 (Laufend):
  Event vorbei
    → Host klickt "Event abschließen" im Toolkit
    → Toolkit sendet an API: POST /api/events/{id}/close
    → API triggert Feedback-Email an alle Check-ins
    → Teilnehmer klickt Link → lab.kinn.at/feedback/{id}
    → Formular-Submit → POST /api/events/{id}/feedback
    → Redis speichert (pending)
    → Admin reviewed im Toolkit → approved/rejected

PHASE 3 (Anzeige):
  lab.kinn.at/events
    → GET /api/events/{id}/feedback
    → Zeigt approved Feedback + Stats
```

---

## Offene Entscheidungen

| Frage | Optionen | Empfehlung |
|-------|----------|------------|
| Email-Provider | Resend, Postmark, SES | Resend (einfach, Vercel-kompatibel) |
| Feedback-URL | lab.kinn.at oder kinn.at | lab.kinn.at zuerst, kinn.at wenn stabil |
| Anonymes Feedback? | Ja / Nein | Nein — Name wird angezeigt (Vorname + Initial), das erhöht Qualität |
| Feedback-Frist | 48h / 1 Woche / unbegrenzt | 48h — danach wird der Link deaktiviert |
| Luma Feedback-Email deaktivieren | Sofort / Nach Migration | Nach erfolgreicher Phase 2 |

---

## Nächster Schritt

CSV-Export aus Luma für alle Events ab KINN#7 in `data/events/csv/` ablegen. Dann Migration starten.
