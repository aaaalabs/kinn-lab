# Plan: Tirol Map Playground

## Context
Tirol-Karte als Playground-Seite in KINN Lab. Map-Assets werden aus dem buergerstrom-Repo migriert (GeoJSON-Daten). Buergerstrom nutzt React+Leaflet — KINN Lab ist Vanilla HTML/CSS/JS, daher wird eine standalone Leaflet-Seite gebaut.

## Approach

### 1. GeoJSON-Daten kopieren (aus buergerstrom)
- `tyrol_state.json` (42KB) → `playgrounds/tirol_map/data/tyrol_state.json` — Tirol-Grenze
- `tyrol_municipal.json` (226KB) → `playgrounds/tirol_map/data/tyrol_municipal.json` — 209 Gemeindegrenzen

### 2. `playgrounds/tirol_map/index.html` erstellen
- Vanilla HTML mit Leaflet via CDN (v1.9.4, gleiche Version wie buergerstrom)
- Map-Config aus buergerstrom: center [47.2692124, 11.4041024], zoom 9, minZoom 7, maxZoom 18
- OpenStreetMap Tiles (kein Stadia API Key nötig)
- Layers:
  - Tirol-Grenze (KINN mint: `#5ED9A6`)
  - Gemeindegrenzen (dezentes Grau)
  - 6 Stadt-Marker mit Popups
- KINN-Design (dunkler Hintergrund, Work Sans, Mint-Akzente)
- Kein auth-guard (nur index.html ist geschützt)

### 3. `index.html` — Menü-Eintrag
- "Tirol Map" in Playgrounds-Liste ergänzen

### 4. `vercel.json` CSP anpassen
- Leaflet CDN + OSM Tile-Domains in Content-Security-Policy

## Marker-Koordinaten
| Stadt | Lat | Lng |
|-------|-----|-----|
| Innsbruck | 47.2692 | 11.4041 |
| Kufstein | 47.5833 | 12.1667 |
| Kitzbühel | 47.4464 | 12.3922 |
| Kramsach | 47.4439 | 11.8769 |
| Reutte | 47.4833 | 10.7167 |
| Landeck | 47.1397 | 10.5628 |

## Dateien
| Aktion | Pfad |
|--------|------|
| Erstellen | `playgrounds/tirol_map/index.html` |
| Kopieren | `playgrounds/tirol_map/data/tyrol_state.json` |
| Kopieren | `playgrounds/tirol_map/data/tyrol_municipal.json` |
| Ändern | `index.html` (Menü-Eintrag) |
| Ändern | `vercel.json` (CSP für Leaflet CDN + Tile Server) |

## Verifikation
1. `curl` check: Leaflet wird geladen
2. Visuell: Karte mit Tirol-Grenze, Gemeindegrenzen, 6 Marker
3. Alle Playground-Links aus index.html funktionieren
