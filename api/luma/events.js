const LUMA_API_KEY = process.env.LUMA_API_KEY;
const LUMA_BASE = 'https://public-api.luma.com/v1';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!LUMA_API_KEY) return res.status(500).json({ error: 'LUMA_API_KEY not configured' });

  try {
    const allEvents = [];
    let cursor = null;
    let hasMore = true;

    // Paginate through all events
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

    // Transform to clean format
    const events = allEvents.map(entry => {
      const e = entry.event;
      const geo = e.geo_address_json || {};
      return {
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
    });

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ events, total: events.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
