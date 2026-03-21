# KINN Event Unified Data Model — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate fragmented KINN event data (3 sources) into a unified `kinn:event:*` Redis Hash schema across LAB and KINN repos.

**Architecture:** New `kinn:event:{type}:{nr}` Hash keys replace `lab:events:*`, `lab:capacity:*`, and `radar:event:kinn-*`. Sorted Set index `kinn:events` for efficient queries. `lib/redis-typed.js` gets a `raw()` accessor for unprefixed keys. Migration script merges all sources with field mapping and validation.

**Tech Stack:** Upstash Redis (shared DB), Vercel Serverless Functions, ES Modules, Node.js

**Spec:** `docs/superpowers/specs/2026-03-21-kinn-event-unified-data-model.md`

**Repos:**
- LAB (`_LAB/`): Phase 0-2 on `main`
- KINN (`KINN/`): Phase 3 on branch `feat/kinn-event-unified`

---

## Phase 0: Preparation

### Task 1: Extend `lib/redis-typed.js` with `raw()` accessor and sorted set methods

**Files:**
- Modify: `lib/redis-typed.js`

- [ ] **Step 1:** Add `raw()` method that returns an object with the same API but without `lab:` prefix

```javascript
// Add to TypedRedis class:
raw() {
  const r = this.redis;
  return {
    get: (key) => r.get(key),
    set: (key, value, options) => r.set(key, value, options),
    hset: (key, data) => r.hset(key, data),
    hgetall: (key) => r.hgetall(key).then(h => h ? convertRedisObject(h) : null),
    hget: (key, field) => r.hget(key, field).then(v => convertRedisValue(v)),
    hdel: (key, ...fields) => r.hdel(key, ...fields),
    del: (...keys) => r.del(...keys),
    zadd: (key, ...args) => r.zadd(key, ...args),
    zrangebyscore: (key, min, max) => r.zrangebyscore(key, min, max),
    zrem: (key, ...members) => r.zrem(key, ...members),
    zscore: (key, member) => r.zscore(key, member),
    zcard: (key) => r.zcard(key),
    scan: (cursor, opts) => r.scan(cursor, opts),
    keys: (pattern) => r.keys(pattern),
    exists: (key) => r.exists(key),
    mget: (...keys) => r.mget(...keys),
  };
}
```

- [ ] **Step 2:** Verify it works by reading an existing key

```bash
node --input-type=module -e "
import kv from './lib/redis-typed.js';
const raw = kv.raw();
const result = await raw.get('lab:events:index');
console.log('raw() works:', !!result);
"
```

- [ ] **Step 3:** Commit

```bash
git add lib/redis-typed.js
git commit -m "Add raw() accessor to redis-typed.js for unprefixed key access"
```

---

### Task 2: Write migration script

**Files:**
- Create: `scripts/migrate-to-unified.js`

The script must:
1. Read from all 3 old sources (lab:events:*, lab:capacity:*, radar:event:kinn-*)
2. Map event names to new key format
3. Map old field names to new field names
4. Write `kinn:event:*` hashes + `kinn:event:*:feedback` lists
5. Write `kinn:events` sorted set
6. Validate by comparing counts

- [ ] **Step 1:** Create the migration script with event name → key mapping

The script needs a mapping table for all known events. Build it from:
- `lab:events:index` (has all LAB events)
- Luma API (has all Luma events with names + IDs)
- KINN repo `kinn:event-links` + `kinn:tech-links` (has shortlink numbers)

Key mapping logic:
```
"KINN#17"              → kinn:event:17
"KINN#17 Kufstein"     → kinn:event:kufstein:17
"KINN#15 Kufstein"     → kinn:event:kufstein:15
"KINN TechTalk #1..."  → kinn:event:tech:1
"KINN TechTalk - ..."  → kinn:event:tech:{sequential}
"KINN:TALK - RAG"      → kinn:event:talk:1
"KINN:CREW - ..."      → skip (not a recurring format)
```

Field mapping (old → new):
```
lab:events:* fields:
  id              → (derive from key)
  lumaId          → lumaId
  name            → name
  date            → date (extract YYYY-MM-DD from ISO)
  location.name   → location
  location.city   → locationCity
  location.fullAddress → locationAddress
  url             → lumaUrl
  coverUrl        → coverUrl
  groupPhoto      → groupPhoto
  stats.registered    → registered
  stats.checkedIn     → checkedIn
  stats.attendeesVerified → attendeesVerified
  stats.avgRating     → avgRating
  stats.totalRatings  → totalRatings
  stats.totalFeedback → totalFeedback

  feedback[].firstName    → (stays)
  feedback[].lastInitial  → (stays, was "lastName" substring in old migration)
  feedback[].rating       → valueRating (for chapter type)
  feedback[].text         → valueText (for chapter type)
  feedback[].approved     → approved

lab:capacity:* fields:
  earlyBird      → earlyBird
  restplaetze    → restplaetze
  maxCapacity    → maxCapacity
  absolutMax     → absolutMax
  (overbook is dropped — absolutMax is the stored value)
```

- [ ] **Step 2:** Implement the script

```javascript
// scripts/migrate-to-unified.js
// Full implementation — reads all sources, merges, writes new schema
// See spec for complete hash field list
```

The script should:
- Load .env/.env.local for credentials
- Fetch Luma events for enrichment (dates, URLs, covers)
- Read `lab:events:index` → iterate all `lab:events:{id}`
- Read `lab:capacity:{id}` for each event with capacity
- Read `kinn:event-links` + `kinn:tech-links` from KINN repo (same Redis DB)
- Map each event to its new key
- Write HSET for each event
- Write feedback as SET (JSON string) to `kinn:event:{key}:feedback`
- ZADD to `kinn:events` with Unix timestamp score
- Print validation summary

- [ ] **Step 3:** Run the migration script

```bash
node --experimental-modules scripts/migrate-to-unified.js
```

Expected output: List of all migrated events with old key → new key mapping.

- [ ] **Step 4:** Validate — compare event counts and spot-check

```bash
node --input-type=module -e "
import kv from './lib/redis-typed.js';
const raw = kv.raw();
// Count new events
const newKeys = await raw.zcard('kinn:events');
// Count old events
const oldIndex = await raw.get('lab:events:index');
const oldCount = JSON.parse(oldIndex).length;
console.log('Old:', oldCount, 'New:', newKeys);
// Spot check
const ev = await raw.hgetall('kinn:event:17');
console.log('kinn:event:17:', ev?.name, ev?.location, ev?.checkedIn);
"
```

- [ ] **Step 5:** Commit

```bash
git add scripts/migrate-to-unified.js
git commit -m "Add unified migration script for kinn:event:* schema"
```

---

## Phase 2: LAB Repo — Switch to new schema

### Task 3: Update `api/events/feedback.js`

**Files:**
- Modify: `api/events/feedback.js`

- [ ] **Step 1:** Rewrite to read from `kinn:events` sorted set + `kinn:event:*` hashes

The endpoint currently:
1. Reads `lab:events:index` for event list
2. Uses `kv.mget()` to load all events
3. Filters feedback, redacts PII

New approach:
1. Read all members from `kinn:events` sorted set
2. Pipeline HGETALL for each key
3. For single event: read hash + feedback list separately
4. Filter + redact as before

Key changes:
- Use `kv.raw()` for all reads (no `lab:` prefix)
- `groupPhoto` is now a hash field, not nested
- Feedback texts come from `kinn:event:{key}:feedback` (JSON list)
- Stats come from hash fields directly

- [ ] **Step 2:** Test locally by hitting the endpoint

```bash
curl -s "http://localhost:3000/api/events/feedback" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.total,'events',j.events?.filter(e=>e.groupPhoto).length,'with photos')})"
```

- [ ] **Step 3:** Commit

```bash
git add api/events/feedback.js
git commit -m "Switch feedback API to kinn:event:* schema"
```

---

### Task 4: Update `api/events/capacity.js`

**Files:**
- Modify: `api/events/capacity.js`

- [ ] **Step 1:** Rewrite to read/write capacity fields directly in the event hash

Currently: Reads/writes to separate `lab:capacity:{event_id}` key.
New: Uses `HSET/HGET` on the event hash `kinn:event:{key}`.

The endpoint receives `event_id` which is a Luma ID (e.g., `evt-sGUfSbpTcWxuDG5`). We need to map this to the `kinn:event:*` key. Two approaches:
- A) Scan `kinn:events` members and HGET `lumaId` to find the match
- B) Accept the new key format directly from the toolkit

Go with B — update the toolkit to send the kinn:event key instead of Luma ID. Simpler, no scanning.

But for backward compat during migration, support both: if `event_id` starts with `kinn:event:`, use directly. Otherwise, scan for lumaId match.

- [ ] **Step 2:** Test

```bash
curl -s -X POST "http://localhost:3000/api/events/capacity?event_id=kinn:event:18" \
  -H "Content-Type: application/json" -d '{"earlyBird":25,"restplaetze":5}'
```

- [ ] **Step 3:** Commit

```bash
git add api/events/capacity.js
git commit -m "Switch capacity API to kinn:event:* hash fields"
```

---

### Task 5: Update `api/luma/events.js`

**Files:**
- Modify: `api/luma/events.js`

- [ ] **Step 1:** Rewrite capacity reading to use `kinn:event:*` hashes

Currently: Reads `lab:capacity:{event_id}` per event.
New: For each upcoming Luma event, find its `kinn:event:*` key by lumaId and read capacity fields from the hash.

Approach: Load all `kinn:events` members, batch HGETALL, build a lumaId→capacity lookup. Then enrich Luma events with availability data.

Remove the hardcoded `LOCATION_CAPACITY` map and `getCapacity()` function (already removed from the file but still referenced indirectly).

- [ ] **Step 2:** Verify availability data still works

```bash
curl -s "https://lab.kinn.at/api/luma/events" | node --input-type=module -e "
let d='';for await(const c of process.stdin) d+=c;
const {events}=JSON.parse(d);
events.filter(e=>e.availability).forEach(e=>console.log(e.name,e.availability.stage,e.availability.spotsLeft));
"
```

- [ ] **Step 3:** Commit

```bash
git add api/luma/events.js
git commit -m "Switch luma events API to read capacity from kinn:event:* hashes"
```

---

### Task 6: Update `api/crm/leads.js`

**Files:**
- Modify: `api/crm/leads.js`

- [ ] **Step 1:** Find where it reads `lab:events:*` and switch to `kinn:event:*`

The CRM leads endpoint reads event feedback for enrichment badges. Change it to:
1. Find the `kinn:event:*` key for the event (by Luma ID or event name)
2. Read feedback from `kinn:event:{key}:feedback`

- [ ] **Step 2:** Commit

```bash
git add api/crm/leads.js
git commit -m "Switch CRM leads to read feedback from kinn:event:* schema"
```

---

### Task 7: Update `scripts/upload-event-photos.js`

**Files:**
- Modify: `scripts/upload-event-photos.js`

- [ ] **Step 1:** Change to write `groupPhoto` as HSET field on `kinn:event:*` keys

Currently: Reads `lab:events:index`, finds event by name, updates JSON blob.
New: Maps photo filename → `kinn:event:*` key, uses `HSET kinn:event:{key} groupPhoto {url}`.

- [ ] **Step 2:** Test by running the script

```bash
node --experimental-modules scripts/upload-event-photos.js
```

- [ ] **Step 3:** Commit

```bash
git add scripts/upload-event-photos.js
git commit -m "Switch photo upload to write groupPhoto into kinn:event:* hashes"
```

---

### Task 8: Update toolkit to use new key format

**Files:**
- Modify: `toolkit/toolkit.js`

- [ ] **Step 1:** Update `loadCapacity` and `handleSaveCapacity` to use `kinn:event:*` keys

The toolkit needs to know the `kinn:event:*` key for the selected event. Add a mapping function that derives the key from the event name (same logic as migration script).

Then pass this key to `/api/events/capacity?event_id=kinn:event:18` instead of the Luma ID.

- [ ] **Step 2:** Commit

```bash
git add toolkit/toolkit.js
git commit -m "Toolkit uses kinn:event:* keys for capacity API"
```

---

### Task 9: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1:** Update Redis prefix rule

Change from:
> Alle Redis-Keys MUESSEN mit `lab:` prefixed werden.

To:
> Redis-Keys: KINN-Events verwenden `kinn:event:*` (ohne Prefix). Alles andere MUSS mit `lab:` prefixed werden. Gleiche Upstash-DB wie KINN.

- [ ] **Step 2:** Commit

```bash
git add CLAUDE.md
git commit -m "Update Redis prefix rule for kinn:event:* namespace"
```

---

### Task 10: Deploy LAB + verify

- [ ] **Step 1:** Deploy

```bash
vercel --prod
```

- [ ] **Step 2:** Verify events page shows photos + feedback

```bash
curl -s "https://lab.kinn.at/api/events/feedback" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.total,'events',j.events.filter(e=>e.groupPhoto).length,'photos')})"
```

- [ ] **Step 3:** Verify availability still works

```bash
curl -s "https://lab.kinn.at/api/luma/events?_=$(date +%s)" | node --input-type=module -e "
let d='';for await(const c of process.stdin) d+=c;
const {events}=JSON.parse(d);
events.filter(e=>e.availability).forEach(e=>console.log(e.name,e.availability));
"
```

---

## Phase 3: KINN Repo (separate branch)

> This phase is implemented in the KINN repo on branch `feat/kinn-event-unified`.
> Listed here for completeness — executed separately.

### Task 11: KINN repo changes (branch `feat/kinn-event-unified`)

**Files in KINN repo:**
- Modify: `api/events.js` — read from `kinn:events` sorted set
- Modify: `api/events/widget.js` — merge kinn:event:* + radar:event:*
- Modify: `api/event/[id].js` — read lumaUrl from `kinn:event:{nr}`
- Modify: `api/event/chapter.js` — read lumaUrl from `kinn:event:{chapter}:{nr}`
- Modify: `api/talk/[id].js` — read lumaUrl from `kinn:event:talk:{nr}`
- Modify: `api/tech/[id].js` — read lumaUrl from `kinn:event:tech:{nr}`
- Modify: `api/admin/add-from-luma.js` — write to `kinn:event:*` hashes
- Modify: `api/admin/radar-events.js` — stop creating KINN events in radar
- Modify: `api/admin/event-links.js` — no-op stub
- Modify: `api/admin/tech-links.js` — no-op stub
- Modify: `api/radar/calendar.js` — merge both sources
- Modify: `admin/js/kinn-events.js` — read from new API

---

## Phase 4: Cleanup (after stability confirmed)

### Task 12: Delete old Redis keys

- [ ] **Step 1:** Run cleanup script

```bash
node --input-type=module -e "
import kv from './lib/redis-typed.js';
const raw = kv.raw();
// Delete old lab:events:* keys
const index = await raw.get('lab:events:index');
const entries = JSON.parse(index);
for (const e of entries) {
  await raw.del('lab:events:' + e.id);
  console.log('DEL lab:events:' + e.id);
}
await raw.del('lab:events:index');
// Delete lab:capacity:* keys
const capKeys = await raw.keys('lab:capacity:*');
for (const k of capKeys) { await raw.del(k); console.log('DEL', k); }
// Delete old link keys
for (const k of ['kinn:event-links','kinn:tech-links','kinn:talk-links']) {
  await raw.del(k);
  console.log('DEL', k);
}
console.log('Cleanup complete');
"
```

- [ ] **Step 2:** Verify site still works

```bash
curl -s "https://lab.kinn.at/api/events/feedback" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).total,'events'))"
```
