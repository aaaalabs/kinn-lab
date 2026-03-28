# Migration: Landing V10 → KINN Main Repo

## Übersicht

Die `landing-v10.html` (LAB) soll als `events-beta.html` ins KINN-Hauptrepo übertragen werden. Nach erfolgreichem Test wird sie die aktuelle `index.html` (Landing Page) ersetzen.

## Kritische Unterschiede LAB → KINN

### 1. Auth — localStorage Keys

| | LAB (v10) | KINN (Produktion) |
|---|---|---|
| Token-Key | `lab_session` | `kinn_session` |
| Email-Key | — (aus JWT dekodiert) | `kinn_email` |
| Auth-Modul | Inline in `landing-v10.js` | `/public/js/auth.js` (shared) |

**Migration:** `localStorage.getItem('lab_session')` → `localStorage.getItem('kinn_session')` in `landing-v10.js` und `landing-v10-profile.js`. Alternativ: KINN's `auth.js` importieren statt eigene Auth-Funktionen.

**Empfehlung:** `auth.js` aus KINN importieren — nutzt `isSessionValid()` mit JWT-Expiry-Check (fehlt in v10).

```javascript
import { isSessionValid, redirectToDashboard, trackVisit } from '/public/js/auth.js';
```

### 2. API-Pfade

| Endpoint | LAB | KINN |
|---|---|---|
| Events (gated) | `/api/events/gated` | Existiert nicht — muss migriert werden |
| Events (feedback) | `/api/events/feedback` | Existiert nicht — muss migriert werden |
| Radar Events | `https://kinn.at/api/events/widget` | `/api/events/widget` (relativ, kein CORS) |
| Testimonials | `https://kinn.at/api/testimonials` | `/api/testimonials` (relativ) |
| Profile | `https://kinn.at/api/profile/extended` | `/api/profile/extended` (relativ) |
| Signup | `https://kinn.at/api/signup` | `/api/signup` (relativ) |
| Sync Topics | `/api/events/sync-topics` | Muss migriert werden |

**Migration:**
- Alle `https://kinn.at/api/...` Aufrufe → relative Pfade `/api/...`
- `api/events/gated.js`, `api/events/feedback.js`, `api/events/sync-topics.js` ins KINN-Repo kopieren
- `lib/redis-typed.js` → KINN nutzt `api/utils/redis.js` (anderes Pattern). API-Files müssen auf KINN's Redis-Client umgestellt werden.

### 3. Redis-Client

| | LAB | KINN |
|---|---|---|
| Import | `import kv from '../../lib/redis-typed.js'` | `import { Redis } from '@upstash/redis'` |
| Prefix | `lab:` (auto) + `raw()` für `kinn:*` | Kein Prefix |
| Zugriff auf `kinn:event:*` | `kv.raw().hgetall(key)` | `redis.hgetall(key)` |

**Migration:** API-Files (`gated.js`, `feedback.js`, `sync-topics.js`) auf KINN's `api/utils/redis.js` umschreiben. Der `raw()`-Wrapper fällt weg — KINN greift direkt auf `kinn:*` Keys zu.

### 4. CSP (Content Security Policy)

LAB's CSP erlaubt `connect-src https://kinn.at`. In KINN ist das nicht nötig (relative Pfade). Aber KINN's CSP muss `connect-src` für Upstash/Vercel beibehalten.

Keine Anpassung nötig — KINN's bestehende CSP deckt alles ab.

### 5. Luma Checkout

LAB nutzt `openLumaCheckout()` aus `events/landing.js` — in v10 wird direkt auf `lumaUrl` verlinkt (kein Checkout-Modal). Wenn das Checkout-Modal gewünscht ist, muss die Funktion aus dem KINN-Repo übernommen werden.

### 6. Footer-Komponente

KINN nutzt eine shared Footer-Komponente:
```javascript
import { mountFooter } from '/js/components/kinn-footer.js';
```

V10 hat den Footer inline in `renderFooter()`. Bei Migration sollte die shared Komponente verwendet werden.

---

## Migrations-Schritte

### Phase 1: Beta-Deployment

1. **Dateien kopieren:**
   - `events/landing-v10.html` → KINN: `pages/events-beta.html`
   - `events/landing-v10.js` → KINN: `public/js/events-beta.js`
   - `events/landing-v10-profile.js` → KINN: `public/js/events-beta-profile.js`

2. **Auth anpassen:**
   - `lab_session` → `kinn_session`
   - `auth.js` Import evaluieren (oder eigene Auth mit `kinn_session` Key)

3. **API-Pfade auf relativ umstellen:**
   - `https://kinn.at/api/testimonials` → `/api/testimonials`
   - `https://kinn.at/api/profile/extended` → `/api/profile/extended`
   - `https://kinn.at/api/signup` → `/api/signup`
   - Radar: `https://kinn.at/api/events/widget` → `/api/events/widget`

4. **API-Endpoints migrieren:**
   - `api/events/gated.js` → KINN-Repo kopieren, Redis-Client umschreiben
   - `api/events/feedback.js` → KINN-Repo kopieren, Redis-Client umschreiben
   - `api/events/sync-topics.js` → KINN-Repo kopieren (Cron in vercel.json)

5. **Script-Pfade im HTML anpassen:**
   - `<script type="module" src="/public/js/events-beta.js"></script>`
   - Import-Pfad im JS: `import('./events-beta-profile.js')`

6. **Vercel Rewrite hinzufügen:**
   ```json
   { "source": "/events-beta", "destination": "/pages/events-beta.html" }
   ```

7. **Testen auf `kinn.at/events-beta`**

### Phase 2: Live-Schaltung

1. **Beta-Testing abgeschlossen, alle Bugs gefixt**
2. **Backup:** Aktuelle `index.html` umbenennen zu `index-v9.html`
3. **Events-Beta → Index:**
   - Entweder `pages/events-beta.html` als neue `index.html` kopieren
   - Oder Vercel Rewrite: `{ "source": "/", "destination": "/pages/events-beta.html" }`
4. **Redirect-URLs in Auth-Flow aktualisieren** (REDIRECT_URL zeigt auf `/`)
5. **Old files aufräumen:** v9-loggedin, v9-loggedout entfernen

---

## Checkliste Beta-Test

- [ ] Logged-out: Testimonial-Rotation funktioniert
- [ ] Logged-out: Einloggen-Link öffnet Modal
- [ ] Logged-out: Magic-Link Login funktioniert (Email kommt an)
- [ ] Logged-in: Token wird aus Hash extrahiert und gespeichert
- [ ] Logged-in: "Hallo, [Name]" wird angezeigt
- [ ] Logged-in: Profil-Panel öffnet und schließt
- [ ] Logged-in: Settings (Matching-Toggle, Badge, Fund) funktionieren
- [ ] Logged-in: Abmelden löscht Token und zeigt Logged-out-Version
- [ ] Termine: Alle Chapters werden angezeigt mit korrekten Daten
- [ ] Termine: Klick öffnet Luma-Seite
- [ ] Formate: Nur Talk + Kurs (kein Crew)
- [ ] Radar: "Was sonst passiert" zeigt externe Events
- [ ] Rückblick: Fotos + Quotes laden
- [ ] Stats: Events/Städte/Stimmen korrekt, Stimmen-Link funktioniert
- [ ] Mobile: Hero füllt Viewport, Chevron sichtbar und tappbar
- [ ] Mobile: Profil-Panel fullscreen
- [ ] Performance: Profile-Modul wird nur bei Login geladen (Network-Tab prüfen)
- [ ] JWT-Expiry: Abgelaufener Token → graceful Fallback auf Logged-out
