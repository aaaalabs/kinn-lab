# CLAUDE.md — KINN Lab

Sandbox-Umgebung fuer KINN-Unterseiten-Prototypen. Source-of-Truth fuer Design und Brand: das Haupt-KINN-Repo (`../KINN/`).

## Stack

Gleich wie KINN: Vanilla HTML/CSS/JS, Vercel Serverless Functions, Upstash Redis, ES Modules.

## Redis Prefix-Regel

**Alle Redis-Keys MUESSEN mit `lab:` prefixed werden.** Das passiert automatisch ueber `lib/redis-typed.js`. Gleiche Upstash-DB wie KINN, aber isolierter Namespace.

## Umlaute im Frontend

Im gesamten Frontend (HTML, UI-Texte) IMMER echte Umlaute: `ue`, `oe`, `ae` sind FALSCH. Ausnahme: Dateinamen, URLs, Variablennamen.

## Coding Rules

| ID | Rule |
|----|------|
| CP01 | KISS — simplest possible solution |
| CP02 | Lines of Code = Debt — minimal, focused code |
| CP03 | Early returns over nested conditions |
| DM01 | Simplicity over cleverness |
| DM02 | Readability — humans first, computers second |
| CS01 | Structure by feature/domain |
| CS03 | Components ~100 lines max |
| CS05 | Files under 300-400 lines |
| NS01 | Descriptive variable/function names |
| NS02 | Prefix handlers with "handle" |
| EH03 | TODO: comments for bugs/suboptimal code |
| PS02 | Minimal implementation — fewest changes needed |

## Neue Seite erstellen

1. Kopiere `pages/_template/` nach `pages/dein-name/`
2. Passe Titel, Inhalte und Styles an
3. Verlinke die Seite in `index.html`
4. Optional: Rewrite in `vercel.json` fuer schoene URL

## PII-Schutz

Pre-commit Hook aktiv. Setup: `git config core.hooksPath .githooks`

## Don'ts

- Kein `npm run dev` — User startet Dev-Server selbst
- Keine Emojis im UI
- Keine Cross-Repo-Imports aus KINN
