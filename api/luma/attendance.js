import { kv } from '../../lib/redis-typed.js';

const LUMA_API_KEY = process.env.LUMA_API_KEY;
const LUMA_BASE = 'https://public-api.luma.com/v1';
const CACHE_KEY = 'attendance:counts';
const CACHE_TTL = 3600; // 1 hour

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!LUMA_API_KEY) return res.status(500).json({ error: 'LUMA_API_KEY not configured' });

  try {
    // Check cache first
    const cached = await kv.get(CACHE_KEY);
    if (cached) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json(cached);
    }

    // Load all events
    const events = await fetchAllEvents();
    const now = new Date();
    const pastKinnEvents = events.filter(e =>
      new Date(e.start_at) < now && /KINN#\d+/i.test(e.name)
    );

    // Load guests for each past event (parallel, batched)
    const counts = {};
    const batchSize = 5;
    for (let i = 0; i < pastKinnEvents.length; i += batchSize) {
      const batch = pastKinnEvents.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(e => fetchEventGuests(e.api_id)));
      results.forEach(guests => {
        guests.forEach(g => {
          const email = (g.user_email || '').toLowerCase().trim();
          if (!email) return;
          // Only count checked-in guests as "attended"
          if (g.checked_in_at) {
            counts[email] = (counts[email] || 0) + 1;
          }
        });
      });
    }

    const result = { counts, totalEvents: pastKinnEvents.length, cachedAt: new Date().toISOString() };
    await kv.set(CACHE_KEY, result);
    await kv.expire(CACHE_KEY, CACHE_TTL);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function fetchAllEvents() {
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

async function fetchEventGuests(eventId) {
  const all = [];
  let cursor = null;
  let hasMore = true;
  while (hasMore) {
    const params = new URLSearchParams({ event_id: eventId, pagination_limit: '100' });
    if (cursor) params.set('pagination_cursor', cursor);
    const resp = await fetch(`${LUMA_BASE}/event/get-guests?${params}`, {
      headers: { 'x-luma-api-key': LUMA_API_KEY },
    });
    if (!resp.ok) break;
    const data = await resp.json();
    all.push(...(data.entries || []).map(e => e.guest || e));
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }
  return all;
}
