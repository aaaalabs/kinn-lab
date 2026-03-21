import kv from '../../lib/redis-typed.js';

const LUMA_API_KEY = process.env.LUMA_API_KEY;
const LUMA_BASE = 'https://public-api.luma.com/v1';
const OVERBOOK_RATIO = 0.20;

async function fetchGuests(eventId) {
  const guests = [];
  let cursor = null;
  let hasMore = true;
  while (hasMore) {
    const params = new URLSearchParams({ event_api_id: eventId, pagination_limit: '100' });
    if (cursor) params.set('pagination_cursor', cursor);
    const resp = await fetch(`${LUMA_BASE}/event/get-guests?${params}`, {
      headers: { 'x-luma-api-key': LUMA_API_KEY },
    });
    if (!resp.ok) break;
    const data = await resp.json();
    guests.push(...(data.entries || []));
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }
  return guests;
}

function computeAvailability(guests, capacityConfig) {
  if (!capacityConfig) return null;

  const { earlyBird, restplaetze, maxCapacity, absolutMax } = capacityConfig;
  const approved = guests.filter(g => g.guest?.approval_status === 'approved').length;
  const waitlist = guests.filter(g => g.guest?.approval_status === 'waitlist').length;
  const pending = guests.filter(g => g.guest?.approval_status === 'pending_approval').length;

  let stage, spotsLeft;
  if (approved >= absolutMax || (approved >= maxCapacity && waitlist === 0 && approved >= maxCapacity)) {
    stage = 'sold_out';
    spotsLeft = 0;
  } else if (approved >= earlyBird || waitlist > 0) {
    stage = 'waitlist';
    spotsLeft = Math.max(0, absolutMax - approved);
  } else {
    stage = 'open';
    spotsLeft = earlyBird - approved;
  }

  return {
    stage,
    spotsLeft,
    approved,
    waitlist,
    pending,
    earlyBird,
    maxCapacity,
    absolutMax,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!LUMA_API_KEY) return res.status(500).json({ error: 'LUMA_API_KEY not configured' });

  try {
    const allEvents = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        sort_column: 'start_at',
        sort_direction: 'desc',
        pagination_limit: '50',
      });
      if (cursor) params.set('pagination_cursor', cursor);

      const resp = await fetch(`${LUMA_BASE}/calendar/list-events?${params}`, {
        headers: { 'x-luma-api-key': LUMA_API_KEY },
      });

      if (!resp.ok) {
        const body = await resp.text();
        return res.status(resp.status).json({ error: 'Luma API error', status: resp.status, body });
      }

      const data = await resp.json();
      allEvents.push(...(data.entries || []));
      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    const now = new Date();

    // Fetch guest counts + capacity configs for upcoming events (parallel)
    const upcomingEntries = allEvents.filter(entry => new Date(entry.event.start_at) > now);
    const [guestResults, capacityResults] = await Promise.all([
      Promise.all(upcomingEntries.map(entry => fetchGuests(entry.event.api_id))),
      Promise.all(upcomingEntries.map(entry => kv.get(`capacity:${entry.event.api_id}`))),
    ]);
    const guestsByEvent = {};
    const capacityByEvent = {};
    upcomingEntries.forEach((entry, i) => {
      guestsByEvent[entry.event.api_id] = guestResults[i];
      capacityByEvent[entry.event.api_id] = capacityResults[i];
    });

    const events = allEvents.map(entry => {
      const e = entry.event;
      const geo = e.geo_address_json || {};
      const isUpcoming = new Date(e.start_at) > now;
      const guests = guestsByEvent[e.api_id];

      const event = {
        id: e.api_id,
        name: e.name,
        description: e.description,
        descriptionMd: e.description_md,
        startAt: e.start_at,
        endAt: e.end_at,
        timezone: e.timezone,
        url: e.url,
        coverUrl: e.cover_url,
        visibility: e.visibility,
        location: {
          name: geo.address || '',
          city: geo.city || '',
          region: geo.region || '',
          fullAddress: geo.full_address || '',
        },
        lat: e.geo_latitude ? parseFloat(e.geo_latitude) : null,
        lng: e.geo_longitude ? parseFloat(e.geo_longitude) : null,
        tags: (entry.tags || []).map(t => t.name),
        registrationQuestions: e.registration_questions || [],
      };

      if (isUpcoming && guests) {
        const capConfig = capacityByEvent[e.api_id];
        event.availability = computeAvailability(guests, capConfig);
      }

      return event;
    });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ events, total: events.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
