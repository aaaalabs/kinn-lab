/**
 * KINN Event Feedback Migration
 *
 * Reads Luma CSV exports from data/events/csv/
 * Enriches with event metadata from Luma API
 * Stores everything in Redis under lab:events:*
 *
 * Run via: node --experimental-modules scripts/migrate-event-feedback.js
 * Requires: KINNST_KV_REST_API_URL, KINNST_KV_REST_API_TOKEN, LUMA_API_KEY in .env
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_DIR = join(__dirname, '..', 'data', 'events', 'csv');

// Load .env manually for local script execution
const envPath = join(__dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
} catch {}

// Also load from .env.local (Vercel pulls env vars here)
try {
  const envLocal = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
  envLocal.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length && !key.startsWith('#')) process.env[key.trim()] = vals.join('=').trim();
  });
} catch {}

const LUMA_API_KEY = process.env.LUMA_API_KEY;
const REDIS_URL = (process.env.KINNST_KV_REST_API_URL || '').replace(/"/g, '');
const REDIS_TOKEN = (process.env.KINNST_KV_REST_API_TOKEN || '').replace(/"/g, '');

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error('Missing KINNST_KV_REST_API_URL or KINNST_KV_REST_API_TOKEN');
  process.exit(1);
}

// ====== CSV PARSING ======

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(filepath) {
  const text = readFileSync(filepath, 'utf-8').replace(/^\ufeff/, '');
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
    rows.push(obj);
  }
  return { headers, rows };
}

// ====== LUMA API ======

async function fetchLumaEvents() {
  if (!LUMA_API_KEY) {
    console.warn('No LUMA_API_KEY — skipping API enrichment');
    return [];
  }
  const all = [];
  let cursor = null;
  let hasMore = true;
  while (hasMore) {
    const params = new URLSearchParams({ sort_column: 'start_at', sort_direction: 'asc', pagination_limit: '50' });
    if (cursor) params.set('pagination_cursor', cursor);
    const res = await fetch(`https://public-api.luma.com/v1/calendar/list-events?${params}`, {
      headers: { 'x-luma-api-key': LUMA_API_KEY },
    });
    if (!res.ok) { console.error('Luma API error:', res.status); break; }
    const data = await res.json();
    all.push(...(data.entries || []));
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }
  return all;
}

// ====== EVENT MATCHING ======

// Map CSV filename patterns to Luma event names
const CSV_TO_EVENT = {
  'kinn-7': 'KINN#7',
  'kinn-8': 'KINN#8',
  'kinn-9': 'KINN#9',
  'kinn-10': 'KINN#10',
  'kinn-11': 'KINN#11',
  'kinn-12': 'KINN#12',
  'kinn-13': 'KINN#13',
  'kinn-14': 'KINN#14',
  'kinn-15 -': 'KINN#15',
  'kinn-15 kufstein': 'KINN#15 Kufstein',
  'kinn-16': 'KINN#16',
  'kinn-17 -': 'KINN#17',
  'kinn-17 kufstein': 'KINN#17 Kufstein',
  'techtalk #1': 'KINN TechTalk #1 - VoiceAI',
  'techtalk - vibe': 'KINN TechTalk - Vibe Coding',
  'techtalk - ki im business': 'KINN TechTalk - KI im Business',
  'techtalk - ki im marketing': 'KINN TechTalk - KI im Marketing',
  'techtalk - voice ai': 'KINN TechTalk - VOICE AI',
  'techtalk - lokale': 'KINN TechTalk - Lokale KI',
  'techtalk - plattform': 'KINN TechTalk - Plattform',
  '565e2458': 'KINN:CREW - Die Potluck Party',
};

function matchCSVToEvent(filename) {
  const lower = filename.toLowerCase();

  // Direct match from map
  for (const [pattern, eventName] of Object.entries(CSV_TO_EVENT)) {
    if (lower.includes(pattern)) return eventName;
  }

  // Pattern: "KINN#15 Kufstein - Guests" or "KINN#10 - Guests"
  const kinnMatch = filename.match(/KINN#(\d+)\s*(Kufstein|Kitzbühel|Innsbruck)?\s*-/i);
  if (kinnMatch) {
    const nr = kinnMatch[1];
    const chapter = kinnMatch[2] || '';
    return chapter ? `KINN#${nr} ${chapter}` : `KINN#${nr}`;
  }

  return null;
}

function findLumaEvent(lumaEvents, eventName) {
  // Exact match first
  const exact = lumaEvents.find(e => e.event.name === eventName);
  if (exact) return exact;

  // For bare names like "KINN#15" (no chapter suffix), match only Luma events
  // that also have no chapter suffix — avoid matching "KINN#15 Kufstein"
  const hasChapter = /KINN#\d+\s+\w/.test(eventName);
  if (!hasChapter) {
    return lumaEvents.find(e => {
      const name = e.event.name;
      // Match "KINN#15" to Luma "KINN#15" but NOT to "KINN#15 Kufstein"
      return name === eventName || (name.startsWith(eventName) && name[eventName.length] === undefined);
    });
  }

  // Fuzzy fallback for named events (TechTalks etc.)
  return lumaEvents.find(e => {
    const name = e.event.name;
    return name.startsWith(eventName) || eventName.startsWith(name);
  });
}

// ====== REDIS ======

async function redisCmd(cmd, args) {
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([cmd, ...args]),
  });
  if (!res.ok) throw new Error(`Redis error: ${res.status}`);
  return res.json();
}

async function redisSet(key, value) {
  return redisCmd('SET', [`lab:${key}`, JSON.stringify(value)]);
}

// ====== VENUE NORMALIZATION ======
const VENUE_MAP = {
  'egger-lienz-straße 116': 'InnCubator',
  'egger-lienz-strasse 116': 'InnCubator',
  'casablanca hotelsoftware gmbh': 'Campus Casablanca',
  'casablanca hotelsoftware': 'Campus Casablanca',
  'tschamlerstraße 3': 'Weekender',
  'tschamlerstrasse 3': 'Weekender',
  'coworking space innovationsraum kufstein': 'Innovationsraum Kufstein',
  'raum13 coworking': 'raum13',
  'soho 2.0 innsbruck': 'SOHO 2',
  'soho 2.0': 'SOHO 2',
  'mission solar - photovoltaik & wärmepumpe': 'Mission Solar',
  'mission solar - photovoltaik & wrmepumpe': 'Mission Solar',
  'start.n kitzbühel': 'START.N Kitzbühel',
  'libralab - ai coliving & innovation hub tirol': 'LIBRAlab Axams',
  'libralab - ai coliving & innovation hub': 'LIBRAlab Axams',
};

function normalizeVenue(lumaName) {
  if (!lumaName) return '';
  const lower = lumaName.toLowerCase().trim();
  return VENUE_MAP[lower] || lumaName;
}

// ====== PRE-LUMA EVENTS (KINN#1-6 from Radar) ======
const PRE_LUMA_EVENTS = [
  { id: 'kinn-1', name: 'KINN#1', date: '2025-11-06T07:00:00.000Z', location: { name: 'InnCubator', city: 'Innsbruck', fullAddress: 'InnCubator, Egger-Lienz-Straße 116, 6020 Innsbruck' }, coverUrl: 'https://kinn.at/events/kinn-1.jpg', url: null, tags: ['Vernetzung'], stats: { registered: 4, checkedIn: 4, attendeesVerified: true, avgRating: null, totalRatings: 0, totalFeedback: 0 }, feedback: [] },
  { id: 'kinn-2', name: 'KINN#2', date: '2025-11-13T07:00:00.000Z', location: { name: 'Das Wundervoll', city: 'Innsbruck', fullAddress: 'Das Wundervoll, Pembaurstraße 14, 6020 Innsbruck' }, coverUrl: 'https://kinn.at/events/kinn-2.jpg', url: null, tags: ['Vernetzung'], stats: { registered: 11, checkedIn: 11, attendeesVerified: true, avgRating: null, totalRatings: 0, totalFeedback: 0 }, feedback: [] },
  { id: 'kinn-3', name: 'KINN#3', date: '2025-11-20T07:00:00.000Z', location: { name: 'Impact Hub Tirol', city: 'Innsbruck', fullAddress: 'Impact Hub Tirol, Innsbruck' }, coverUrl: 'https://kinn.at/events/kinn-3.jpg', url: null, tags: ['Vernetzung'], stats: { registered: 11, checkedIn: 11, attendeesVerified: true, avgRating: null, totalRatings: 0, totalFeedback: 0 }, feedback: [] },
  { id: 'kinn-4', name: 'KINN#4', date: '2025-11-27T07:00:00.000Z', location: { name: 'Das Wundervoll', city: 'Innsbruck', fullAddress: 'Das Wundervoll, Pembaurstraße 14, 6020 Innsbruck' }, coverUrl: 'https://kinn.at/events/kinn-4.jpg', url: null, tags: ['Vernetzung'], stats: { registered: 14, checkedIn: 14, attendeesVerified: true, avgRating: null, totalRatings: 0, totalFeedback: 0 }, feedback: [] },
  { id: 'kinn-5', name: 'KINN#5', date: '2025-12-04T07:00:00.000Z', location: { name: 'raum13', city: 'Innsbruck', fullAddress: 'raum13, Innsbruck' }, coverUrl: 'https://kinn.at/events/kinn-5.jpg', url: null, tags: ['Vernetzung'], stats: { registered: 25, checkedIn: 25, attendeesVerified: true, avgRating: null, totalRatings: 0, totalFeedback: 0 }, feedback: [] },
  { id: 'kinn-6', name: 'KINN#6', date: '2025-12-11T07:00:00.000Z', location: { name: 'SOHO 2', city: 'Innsbruck', fullAddress: 'SOHO 2, Innsbruck' }, coverUrl: 'https://kinn.at/events/kinn-6.jpg', url: null, tags: ['Vernetzung'], stats: { registered: 35, checkedIn: 35, attendeesVerified: true, avgRating: null, totalRatings: 0, totalFeedback: 0 }, feedback: [] },
];

// ====== ATTENDEE OVERRIDES (from Radar — curated, real numbers) ======
const ATTENDEE_OVERRIDES = {
  'KINN#7':  { checkedIn: 52, attendeesVerified: true },  // Radar missing, use CSV
  'KINN#8':  { checkedIn: 22, attendeesVerified: true },
  'KINN#9':  { checkedIn: 32, attendeesVerified: true },
  'KINN#10': { checkedIn: 30, attendeesVerified: true },  // CSV matches
  'KINN#11': { checkedIn: 69, attendeesVerified: true },  // CSV matches
  'KINN#12': { checkedIn: 31, attendeesVerified: true },  // CSV matches
  'KINN#13': { checkedIn: 22, attendeesVerified: true },
  'KINN#14': { checkedIn: 24, attendeesVerified: true },
  'KINN#15': { checkedIn: 60, attendeesVerified: true },
  'KINN#15 Kufstein': { checkedIn: 24, attendeesVerified: true },
  'KINN#16': { checkedIn: 30, attendeesVerified: true },
  'KINN#17': { checkedIn: 27, attendeesVerified: true },
  'KINN#17 Kufstein': { checkedIn: 17, attendeesVerified: true },
  'KINN TechTalk #1 - VoiceAI': { checkedIn: 8, attendeesVerified: true },
  'KINN TechTalk - Vibe Coding': { checkedIn: 8, attendeesVerified: true },
  'KINN TechTalk - KI im Business': { checkedIn: 6, attendeesVerified: true },
};

// ====== MIGRATION ======

async function migrate() {
  console.log('=== KINN Event Feedback Migration ===\n');

  // 1. Load Luma events for metadata
  console.log('Fetching Luma events...');
  const lumaEvents = await fetchLumaEvents();
  console.log(`  ${lumaEvents.length} events from Luma API\n`);

  // 2. Read all CSVs
  const csvFiles = readdirSync(CSV_DIR).filter(f => f.endsWith('.csv') && !f.startsWith('.'));
  console.log(`Found ${csvFiles.length} CSV files\n`);

  const allEventData = [];
  let totalRatings = 0;
  let totalFeedback = 0;
  let totalGuests = 0;

  for (const file of csvFiles) {
    const eventName = matchCSVToEvent(file);
    if (!eventName) {
      console.log(`  SKIP: ${file} (no event match)`);
      continue;
    }

    const { rows } = parseCSV(join(CSV_DIR, file));
    const lumaEntry = findLumaEvent(lumaEvents, eventName);
    const lumaEvent = lumaEntry?.event;
    const geo = lumaEvent?.geo_address_json || {};

    // Extract guest data
    const guests = rows.filter(r => r.approval_status === 'approved');
    const checkedIn = guests.filter(r => r.checked_in_at);

    // Extract feedback
    const feedback = rows
      .filter(r => r.survey_response_rating)
      .map(r => ({
        firstName: r.first_name || r.name?.split(' ')[0] || '',
        lastName: (r.last_name || '').substring(0, 1),
        email: (r.email || '').toLowerCase().trim(),
        rating: parseInt(r.survey_response_rating) || 0,
        text: r.survey_response_feedback || '',
        approved: true,
      }))
      .filter(f => f.rating > 0);

    const avgRating = feedback.length
      ? Math.round(feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length * 10) / 10
      : null;

    const feedbackWithText = feedback.filter(f => f.text);

    // Build event ID
    const eventId = (lumaEvent?.api_id || file.replace('.csv', ''))
      .replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

    // Normalize venue name
    const venueName = normalizeVenue(geo.address || '');

    // Apply attendee overrides
    const override = ATTENDEE_OVERRIDES[eventName] || {};
    const finalCheckedIn = override.checkedIn ?? checkedIn.length;
    const finalRegistered = override.registered ?? guests.length;
    const finalVerified = override.attendeesVerified ?? false;

    const eventData = {
      id: eventId,
      lumaId: lumaEvent?.api_id || null,
      name: eventName,
      date: lumaEvent?.start_at || null,
      location: {
        name: venueName,
        city: geo.city || '',
        fullAddress: geo.full_address || '',
      },
      url: lumaEvent?.url || null,
      coverUrl: lumaEvent?.cover_url || null,
      tags: (lumaEntry?.tags || []).map(t => t.name),
      stats: {
        registered: finalRegistered,
        checkedIn: finalCheckedIn,
        attendeesVerified: finalVerified,
        avgRating,
        totalRatings: feedback.length,
        totalFeedback: feedbackWithText.length,
      },
      feedback: feedback.map(f => ({
        firstName: f.firstName,
        lastInitial: f.lastName,
        email: f.email,
        rating: f.rating,
        text: f.text,
        approved: f.approved,
      })),
    };

    allEventData.push(eventData);
    totalRatings += feedback.length;
    totalFeedback += feedbackWithText.length;
    totalGuests += guests.length;

    console.log(`  ${eventName}: ${guests.length} guests, ${checkedIn.length} check-ins, ${feedback.length} ratings, ${feedbackWithText.length} texts, avg ${avgRating || '-'}`);
  }

  // 3. Add pre-Luma events (KINN#1-6)
  console.log(`\nAdding ${PRE_LUMA_EVENTS.length} pre-Luma events (KINN#1-6)...`);
  for (const ev of PRE_LUMA_EVENTS) {
    allEventData.push(ev);
    totalGuests += ev.stats.registered;
    console.log(`  ${ev.name}: ${ev.stats.checkedIn} attendees (from Radar)`);
  }

  // Sort all events by date
  allEventData.sort((a, b) => new Date(a.date) - new Date(b.date));

  console.log(`\n=== TOTALS ===`);
  console.log(`Events: ${allEventData.length}`);
  console.log(`Registrations: ${totalGuests}`);
  console.log(`Ratings: ${totalRatings}`);
  console.log(`Feedback texts: ${totalFeedback}`);

  // 4. Write to Redis
  console.log(`\nWriting to Redis...`);

  for (const event of allEventData) {
    const key = `events:${event.id}`;
    await redisSet(key, event);
    console.log(`  SET lab:${key}`);
  }

  // Write index
  const index = allEventData.map(e => ({
    id: e.id,
    name: e.name,
    date: e.date,
    avgRating: e.stats.avgRating,
    totalRatings: e.stats.totalRatings,
    registered: e.stats.registered,
  }));
  await redisSet('events:index', index);
  console.log(`  SET lab:events:index (${index.length} events)`);

  console.log(`\nMigration complete.`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
