# KINN Lab

Sandbox-Umgebung fuer neue KINN-Unterseiten. Gleicher Tech Stack und Design wie [kinn.at](https://kinn.at), aber isoliert.

## Setup

```bash
npm install
git config core.hooksPath .githooks
```

## Entwicklung

```bash
vercel dev
```

- Lab-Startseite: `http://localhost:3000`
- Template: `http://localhost:3000/pages/_template/`
- Health Check: `http://localhost:3000/api/health`

## Neue Seite erstellen

1. `pages/_template/` nach `pages/dein-name/` kopieren
2. HTML anpassen (Kommentare im Template erklaeren wo)
3. In `index.html` verlinken
4. Optional: Rewrite in `vercel.json`

## Redis

Gleiche Upstash-DB wie KINN. Alle Keys automatisch mit `lab:` prefixed (`lib/redis-typed.js`).

## Deployment

Eigenes Vercel-Projekt unter `lab.kinn.at`. Deploy via `npm run deploy` oder Git Push.
