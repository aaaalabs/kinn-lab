/**
 * Sync Luma event IDs (evt-*) into kinn:event:* Redis hashes.
 * Run once, or after adding new events to Redis.
 *
 * Usage: node scripts/sync-luma-ids.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KINNST_KV_REST_API_URL,
  token: process.env.KINNST_KV_REST_API_TOKEN,
});

const LUMA_API_KEY = process.env.LUMA_API_KEY;
const LUMA_BASE = 'https://public-api.luma.com/v1';

async function fetchAllLumaEvents() {
  const all = [];
  let cursor = null;
  let hasMore = true;
  while (hasMore) {
    const params = new URLSearchParams({ pagination_limit: '50' });
    if (cursor) params.set('pagination_cursor', cursor);
    const resp = await fetch(`${LUMA_BASE}/calendar/list-events?${params}`, {
      headers: { 'x-luma-api-key': LUMA_API_KEY },
    });
    if (!resp.ok) break;
    const data = await resp.json();
    all.push(...(data.entries || []).map(e => e.event));
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }
  return all;
}

async function main() {
  console.log('Fetching Luma events...');
  const lumaEvents = await fetchAllLumaEvents();
  console.log(`Found ${lumaEvents.length} Luma events`);

  // Build name → api_id map
  const lumaMap = {};
  for (const ev of lumaEvents) {
    if (ev.name && ev.api_id) lumaMap[ev.name] = ev.api_id;
  }

  // Load all Redis event keys
  const eventKeys = await redis.zrange('kinn:events', 0, '+inf', { byScore: true });
  console.log(`Found ${eventKeys.length} Redis events`);

  let updated = 0;
  let skipped = 0;

  for (const key of eventKeys) {
    const ev = await redis.hgetall(key);
    if (!ev?.name) continue;

    // Already has lumaId?
    if (ev.lumaId) { skipped++; continue; }

    const lumaId = lumaMap[ev.name];
    if (lumaId) {
      await redis.hset(key, { lumaId });
      console.log(`  ${ev.name} → ${lumaId}`);
      updated++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} already had lumaId`);
}

main().catch(console.error);
