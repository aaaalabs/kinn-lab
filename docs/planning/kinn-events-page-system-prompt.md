# lab.kinn.at/events - System Prompt

**Kontext:** Steuert die Event-Übersichtsseite auf lab.kinn.at. Ersetzt die bisherige Luma-Rating-Darstellung durch ein Stimmen-basiertes System. Kein Stern, keine Skala, keine Konsumentenlogik.

**Referenz:** KINN Seekarte (Stefan Seiger, März 2026), After-Event Feedback System Prompt, KINN:DNA Prinzip 1 ("KINN behandelt alle Community-Mitglieder gleich"), Prinzip 8 ("Vertrauen, das man nicht kaufen kann").

---

## Was die Seite ist

Die /events-Seite ist das öffentliche Logbuch der KINN-Community. Sie zeigt wann, wo und wie oft sich Menschen in Tirol treffen um über KI zu reden. Keine Eventplattform, kein Ticketshop, kein Review-Portal. Ein lebendiger Beweis dass KINN passiert - jede Woche, überall.

## Was die Seite NICHT ist

- Kein Bewertungsportal. Keine Sterne, keine Skalen, kein "4.8 von 5".
- Kein Luma-Mirror. Die Seite zeigt Luma-Daten (Events, Termine, Anmeldungen) aber NICHT Luma-Ratings.
- Kein Sales-Funnel. Die Seite verkauft nichts. Sie zeigt was passiert und lädt ein.

---

## Header-Stats (ersetzen aktuelle Zeile)

### AKTUELL (raus damit)
```
Events | Standorte | Kommende | Rating
```

### NEU
```
Events | Standorte | Kommende | Stimmen
```

**"Stimmen"** = Gesamtzahl der eingegangenen After-Event-Antworten (Frage 1 aus dem Feedback-System). Nicht Bewertungen. Stimmen. Menschen die nach dem KINN gesagt haben was sie mitnehmen.

**Anzeige:** Einfache Zahl. Keine Durchschnittswerte, keine Sterne. Nur: "87 Stimmen" - das wächst mit jedem Event und zeigt Lebendigkeit.

---

## Kommende Events

Datenquelle: Luma API. Darstellung:

```
[Datum] [Wochentag]
KINN [Chapter] #{Nummer}
[Location]
[Uhrzeit]
[Angemeldet / Kapazität]
→ Anmelden (Link zu Luma)
```

**Regeln:**
- Donnerstag 8 Uhr ist fix. Keine Erklärung nötig warum.
- Chapter-Name prominent. Nicht "Innsbruck Event" sondern "KINN Innsbruck #18".
- Keine Thementische anzeigen - die kommen im Luma-Blast, nicht auf der Webseite. Der Donnerstag ist offen. Was am Tisch passiert entscheidet die Community, nicht die Vorschau.
- Waitlist anzeigen falls aktiv - zeigt Nachfrage.

---

## Vergangene Events

Hier passiert der eigentliche Umbau. Statt Sterne pro Event: Stimmen.

### Darstellung pro vergangenem Event

```
KINN [Chapter] #{Nummer}
[Datum] | [Location] | [Anzahl Teilnehmer]

"Was nimmst du mit?"
━━━━━━━━━━━━━━━━━━━

"[Stimme 1 - Original-Wortlaut]"
— [Vorname], [Kontext wenn vorhanden]

"[Stimme 2]"
— [Vorname], [Kontext]

"[Stimme 3]"
— [Vorname], [Kontext]

[+X weitere Stimmen] (aufklappbar oder Detailseite)
```

### Woher kommen die Stimmen?

Antworten auf Frage 1 ("Was nimmst du mit?") aus der After-Event-Mail. Kuratiert vom Team - nicht automatisch publiziert. Jede Stimme die hier steht wurde gesichtet und freigegeben.

### Kurations-Regeln

- **Vielfalt vor Enthusiasmus.** Nicht nur die begeistertsten Stimmen zeigen. Auch nachdenkliche, überraschte, konkrete. "Ich hab mitgenommen dass ich eigentlich gar kein LLM brauche" ist stärker als "War mega!"
- **Originalton beibehalten.** Keine Korrektur von Tippfehlern oder Grammatik. Kein Aufhübschen. Authentizität schlägt Perfektion.
- **Maximal 3 pro Event auf der Übersichtsseite.** Mehr auf der Detailseite. Die drei sollen unterschiedliche Perspektiven zeigen - nicht drei Mal "war super".
- **Erstbesucher-Stimmen bevorzugen.** "Mein erstes KINN und ich hab direkt..." ist für Neue auf der Seite relevanter als Feedback von Regulars.
- **Keine Attribution ohne Einverständnis.** Vorname + Kontext nur wenn die Person dem zugestimmt hat. Im Zweifel anonym: "— Erstbesucherin, KINN#17"

### Was NICHT angezeigt wird

- Keine Sterne. Nirgendwo. Nicht als Durchschnitt, nicht pro Event, nicht aggregiert.
- Keine Luma-Ratings. Auch nicht als "Ø 4.8" oder ähnlich. Die Zahl existiert auf dieser Seite nicht.
- Keine Ranking-Logik zwischen Events. KINN#12 war nicht "besser" als KINN#10. Jedes Event steht für sich.
- Keine Response-Rate oder andere interne Metriken. Die bleiben im Team.

---

## Event-Detailseite (pro Event)

Wenn jemand auf ein vergangenes Event klickt:

```
KINN [Chapter] #{Nummer}
[Datum] | [Location]

[Gruppenfoto]

[Teilnehmer-Anzahl] Menschen waren da.
[Thementische, falls dokumentiert]

━━━ Stimmen ━━━

[Alle freigegebenen Stimmen zu diesem Event]

━━━ Themen am Tisch ━━━

[Liste der Thementische, falls dokumentiert]

→ Nächster KINN [Chapter]: [Datum] (Anmelden)
```

**Kein Recap, kein Blogpost, kein Summary.** Die Stimmen SIND der Rückblick. Wer wissen will was passiert ist, liest was die Menschen sagen die da waren. Das ist glaubwürdiger als jeder redaktionelle Text.

---

## Stimmen-Sammlung auf der Seite selbst

### kinn.at/gfragt (Feedback-QR-Code)

Der QR-Code auf dem physischen Aufsteller bei Events linkt zu einer Minimalseite:

```
Was nimmst du mit?

[Textfeld - 1 Satz]

Vorname (optional): [___]

[Absenden]
```

**Kein Login, keine Email, keine Registrierung.** Niedrigste Hürde. Wer seinen Namen dazuschreibt, wird ggf. auf der Event-Seite zitiert. Wer anonym bleibt, fließt in die interne Auswertung.

**Timing:** Kann direkt beim Event ausgefüllt werden (Wrap-up um 8:50 - "Was nehmt ihr mit?" am Tisch → QR-Code scannen → 10 Sekunden) ODER als Antwort auf die After-Event-Mail am Freitag.

**Zwei Kanäle, ein Pool:** Antworten via kinn.at/gfragt und via Luma Post-Event-Message landen im selben Stimmen-Pool. Kein Unterschied in der Darstellung.

---

## Technische Hinweise

### Luma-API Integration

- Events (kommend + vergangen) weiterhin via Luma API ziehen
- Teilnehmerzahlen aus Luma (checked-in count)
- **Luma-Ratings NICHT abfragen / anzeigen / speichern**
- Luma Post-Event-Message als Kanal für Feedback-Fragen nutzen (kein Rating-Request)

### Stimmen-Storage

- Eigene Datenbank / Collection für Stimmen (nicht Luma-abhängig)
- Felder: event_id, text, vorname (optional), kontext (optional), approved (boolean), created_at
- Approved-Flag steuert Sichtbarkeit auf der Seite
- Admin-Interface für Kuratierung (Team sichtet + gibt frei)

### kinn.at/gfragt Endpoint

- Einfaches Formular, kein Auth
- Rate-Limiting gegen Spam (max 3 Submissions pro IP pro Stunde)
- Honeypot-Feld gegen Bots
- Submissions landen im Stimmen-Pool mit approved=false

---

## Datenfluss (Gesamtbild)

```
DONNERSTAG 8-9 UHR
        │
        ├── Wrap-up 8:50: "Was nehmt ihr mit?"
        │   └── QR-Code → kinn.at/gfragt → Stimmen-Pool (approved=false)
        │
        └── Event-Notiz vom Host → interne Doku

FREITAG ~8:00
        │
        └── Luma Post-Event-Message (3 Fragen)
            │
            ├── Frage 1 "Was nimmst du mit?" → Stimmen-Pool
            ├── Frage 2 "Welches Thema?" → Thementisch-Input nächste Woche
            └── Frage 3 "Wen mitbringen?" → Retention-KPI + warme Leads

FREITAG/SAMSTAG
        │
        └── Team kuratiert Stimmen → approved=true
            │
            ├── lab.kinn.at/events (3 beste pro Event)
            ├── Weekly Digest (LinkedIn / Newsletter)
            └── WhatsApp Community (Highlight der Woche)
```

---

## Seekarte-Referenz

| Projekt | Was /events dafür tut |
|---------|----------------------|
| D1 Voice & Feedback | Zeigt öffentlich dass KINN Stimmen sammelt und ernst nimmt |
| B1 Selbstlernendes Profil | Stimmen-Inhalte verraten Interessen + Level (für späteres Matching) |
| Schleife 1 Netzwerkeffekt | Seite zeigt Lebendigkeit → zieht Neue an |
| Schleife 3 Chapter | Jedes Chapter hat eigene Stimmen → lokale Identität |
| Schleife 5 Relevanz | Kuratierte Stimmen = belastbare Community-Aussagen |

---

## Tonalität der Seite

Die Seite spricht wie KINN spricht. Nicht wie eine Event-Plattform.

- "87 Stimmen" statt "87 Reviews"
- "32 Menschen waren da" statt "32 Teilnehmer"
- "Jeden Donnerstag um 8" statt "Wöchentliche Veranstaltung"
- "Was nimmst du mit?" statt "Feedback geben"
- "Gleiche Zeit, gleicher Ort" statt "Nächster Termin"

Kein Emoji auf der Seite. Kein "🚀". Kein "🎉". Die Stimmen der Menschen sind emotionaler als jedes Emoji.

---

## Migration: Von Rating zu Stimmen

### Phase 1 (sofort)
- "Rating" aus den Header-Stats entfernen
- Luma-Sterne nirgendwo mehr anzeigen
- Bestehende Testimonials von kinn.at als initiale Stimmen übernehmen (45 Testimonials laut Community-Building-Daten)

### Phase 2 (nach nächstem Event)
- kinn.at/gfragt live schalten
- After-Event-Mail mit 3 Fragen statt Luma-Rating verschicken
- Erste Stimmen kuratieren und auf /events anzeigen

### Phase 3 (laufend)
- Stimmen-Pool wächst mit jedem Event
- Wöchentliche Kuratierung wird Routine
- Detailseiten pro Event befüllen sich organisch

---

*Leitgedanke: Die beste Metrik für ein KINN-Event ist nicht eine Zahl zwischen 1 und 5. Es ist ein Satz von jemandem der da war.*
