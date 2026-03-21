/**
 * KINN Event Unified Migration
 *
 * Reads from 3 fragmented sources:
 *   - lab:events:{luma-id}     (LAB: feedback, photos, stats)
 *   - lab:capacity:{luma-id}   (LAB: capacity config)
 *   - radar:event:kinn-*       (KINN: metadata, shortlinks)
 *   - kinn:event-links         (KINN: shortlink URLs)
 *   - kinn:tech-links          (KINN: tech shortlink URLs)
 *   - kinn:talk-links          (KINN: talk shortlink URLs)
 *
 * Writes unified kinn:event:* hashes + kinn:events sorted set.
 *
 * Run: node --experimental-modules scripts/migrate-to-unified.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
for (const f of ['.env', '.env.local']) {
  try {
    readFileSync(join(__dirname, '..', f), 'utf-8').split('\n').forEach(l => {
      const [k, ...v] = l.split('=');
      if (k && v.length && !k.startsWith('#')) {
        process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
      }
    });
  } catch {}
}

const { default: kv } = await import('../lib/redis-typed.js');
const raw = kv.raw();

// ====== EVENT NAME → KEY MAPPING ======

function eventNameToKey(name) {
  // KINN#17 Kufstein → kinn:event:kufstein:17
  const chapterMatch = name.match(/^KINN#(\d+)\s+(\w+)/i);
  if (chapterMatch) {
    return `kinn:event:${chapterMatch[2].toLowerCase()}:${chapterMatch[1]}`;
  }
  // KINN#17 (no chapter = Innsbruck default) → kinn:event:17
  const defaultMatch = name.match(/^KINN#(\d+)$/i);
  if (defaultMatch) {
    return `kinn:event:${defaultMatch[1]}`;
  }
  // KINN TechTalk - all assigned sequentially (including #1)
  const ttMatch = name.match(/^KINN\s+TechTalk/i);
  if (ttMatch) return null; // handled below with sequential numbering
  // KINN:TALK - X → kinn:event:talk:N
  const talkMatch = name.match(/^KINN:TALK/i);
  if (talkMatch) return null; // handled below
  // KINN:CREW etc. — skip
  return null;
}

function parseEventType(name) {
  if (/^KINN#/i.test(name)) return 'chapter';
  if (/TechTalk/i.test(name)) return 'tech';
  if (/^KINN:TALK/i.test(name)) return 'talk';
  if (/^KINN:KURS/i.test(name)) return 'kurs';
  return null;
}

function parseChapter(name) {
  const m = name.match(/^KINN#\d+\s+(\w+)/i);
  if (m) return m[1];
  if (/^KINN#\d+$/i.test(name)) return 'Innsbruck';
  return '';
}

function parseNumber(name) {
  const m = name.match(/^KINN#(\d+)/i) || name.match(/TechTalk\s*#(\d+)/i);
  return m ? m[1] : null;
}

// ====== MIGRATION ======

async function migrate() {
  console.log('=== KINN Event Unified Migration ===\n');

  // 1. Load old LAB events
  const labIndex = await raw.get('lab:events:index');
  const labEntries = typeof labIndex === 'string' ? JSON.parse(labIndex) : (labIndex || []);
  console.log(`LAB events index: ${labEntries.length} entries`);

  // Load all LAB event data
  const labEvents = {};
  for (const entry of labEntries) {
    const data = await raw.get(`lab:events:${entry.id}`);
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsed) labEvents[parsed.name] = { ...parsed, _labId: entry.id };
  }
  console.log(`LAB events loaded: ${Object.keys(labEvents).length}`);

  // 2. Load capacity configs
  const capKeys = await raw.keys('lab:capacity:*');
  const capacityByLumaId = {};
  for (const key of capKeys) {
    const lumaId = key.replace('lab:capacity:', '');
    const data = await raw.get(key);
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsed) capacityByLumaId[lumaId] = parsed;
  }
  console.log(`Capacity configs: ${Object.keys(capacityByLumaId).length}`);

  // 3. Load shortlink mappings
  let eventLinks = {};
  let techLinks = {};
  let talkLinks = {};
  try {
    const el = await raw.get('kinn:event-links');
    eventLinks = typeof el === 'string' ? JSON.parse(el) : (el || {});
  } catch {}
  try {
    const tl = await raw.get('kinn:tech-links');
    techLinks = typeof tl === 'string' ? JSON.parse(tl) : (tl || {});
  } catch {}
  try {
    const tl = await raw.get('kinn:talk-links');
    talkLinks = typeof tl === 'string' ? JSON.parse(tl) : (tl || {});
  } catch {}
  console.log(`Shortlinks: events=${Object.keys(eventLinks).length} tech=${Object.keys(techLinks).length} talk=${Object.keys(talkLinks).length}\n`);

  // 4. Build unified events
  const unified = [];
  let techCounter = 1;
  let talkCounter = 1;

  // Sort by date for sequential numbering
  const sortedEvents = Object.values(labEvents).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  for (const ev of sortedEvents) {
    const type = parseEventType(ev.name);
    if (!type) {
      console.log(`  SKIP: ${ev.name} (unknown type)`);
      continue;
    }

    // Determine key
    let key = eventNameToKey(ev.name);
    if (!key && type === 'tech') {
      key = `kinn:event:tech:${techCounter++}`;
    }
    if (!key && type === 'talk') {
      key = `kinn:event:talk:${talkCounter++}`;
    }
    if (!key) {
      console.log(`  SKIP: ${ev.name} (no key mapping)`);
      continue;
    }

    const chapter = parseChapter(ev.name);
    const number = parseNumber(ev.name) || (type === 'tech' ? String(techCounter - 1) : String(talkCounter - 1));

    // Extract date parts
    const dateObj = ev.date ? new Date(ev.date) : null;
    const dateStr = dateObj ? dateObj.toISOString().split('T')[0] : '';
    const timeStr = dateObj ? `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}` : '08:00';

    // Find capacity
    const cap = ev.lumaId ? capacityByLumaId[ev.lumaId] : null;

    // Build hash
    const hash = {
      name: ev.name,
      type,
      number,
      status: 'approved',
      date: dateStr,
      time: timeStr,
      endTime: '',
      timezone: 'Europe/Vienna',
      location: ev.location?.name || '',
      locationCity: ev.location?.city || '',
      locationAddress: ev.location?.fullAddress || '',
      lumaId: ev.lumaId || '',
      lumaUrl: ev.url || '',
      coverUrl: ev.coverUrl || '',
      groupPhoto: ev.groupPhoto || '',
      // Capacity
      earlyBird: cap?.earlyBird ? String(cap.earlyBird) : '',
      restplaetze: cap?.restplaetze ? String(cap.restplaetze) : '',
      maxCapacity: cap?.maxCapacity ? String(cap.maxCapacity) : '',
      absolutMax: cap?.absolutMax ? String(cap.absolutMax) : '',
      // Stats
      registered: ev.stats?.registered ? String(ev.stats.registered) : '',
      checkedIn: ev.stats?.checkedIn ? String(ev.stats.checkedIn) : '',
      attendeesVerified: ev.stats?.attendeesVerified ? 'true' : 'false',
      // Feedback aggregates
      avgRating: ev.stats?.avgRating ? String(ev.stats.avgRating) : '',
      totalRatings: ev.stats?.totalRatings ? String(ev.stats.totalRatings) : '0',
      totalFeedback: ev.stats?.totalFeedback ? String(ev.stats.totalFeedback) : '0',
      contactRate: '',
      recommendRate: '',
      // Feedback control
      feedbackUrl: '',
      feedbackOpen: 'false',
      // Live data (empty, filled by Luma refresh)
      liveApproved: '',
      liveWaitlist: '',
      livePending: '',
      liveRefreshedAt: '',
      // Meta
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (chapter) hash.chapter = chapter;
    if (ev.description) hash.description = ev.description;

    // Map feedback entries (old field names → new)
    const feedback = (ev.feedback || []).map(f => ({
      firstName: f.firstName || '',
      lastInitial: f.lastInitial || f.lastName?.substring(0, 1) || '',
      valueRating: f.rating || f.valueRating || 0,
      valueText: f.text || f.valueText || '',
      missingText: '',
      contactMade: null,
      approved: f.approved !== false,
      submittedAt: f.submittedAt || f.createdAt || '',
    }));

    // Score for sorted set: Unix timestamp
    const score = dateObj ? Math.floor(dateObj.getTime() / 1000) : 0;

    unified.push({ key, hash, feedback, score });
    const capInfo = cap ? ` [eb:${cap.earlyBird}]` : '';
    console.log(`  ${ev.name} → ${key}${capInfo} (${feedback.length} feedback)`);
  }

  console.log(`\n=== Writing ${unified.length} events ===\n`);

  // 5. Write to Redis
  for (const { key, hash, feedback, score } of unified) {
    // Write hash
    await raw.hset(key, hash);
    console.log(`  HSET ${key}`);

    // Write feedback list
    if (feedback.length > 0) {
      await raw.set(`${key}:feedback`, JSON.stringify(feedback));
      console.log(`  SET  ${key}:feedback (${feedback.length} entries)`);
    }

    // Add to sorted set
    await raw.zadd('kinn:events', { score, member: key });
  }

  console.log(`  ZADD kinn:events (${unified.length} members)`);

  // 6. Validation
  console.log('\n=== Validation ===');
  const newCount = await raw.zcard('kinn:events');
  const oldCount = labEntries.length;
  console.log(`Old lab:events:index: ${oldCount}`);
  console.log(`New kinn:events: ${newCount}`);

  // Spot checks
  const checks = ['kinn:event:17', 'kinn:event:kufstein:17', 'kinn:event:7'];
  for (const check of checks) {
    const data = await raw.hgetall(check);
    if (data) {
      console.log(`  ${check}: ${data.name} | ${data.location} | checkedIn=${data.checkedIn} | photo=${data.groupPhoto ? 'yes' : 'no'}`);
    } else {
      console.log(`  ${check}: NOT FOUND`);
    }
  }

  console.log('\nMigration complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
